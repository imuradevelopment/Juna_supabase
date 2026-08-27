# juna-deploy.ps1 — Juna バックエンド/フロント完全再デプロイ・ツール（再利用可能）
# 正本の手順書: deploy/runbook.md
# 使い方:
#   deploy/juna-deploy.ps1 -Phase all -AdminEmail "you@example.com"
#   deploy/juna-deploy.ps1 -Phase verify
# 前提: .zcode/tmp/sb_token.txt（backend用）、netlify_token.txt または $env:NETLIFY_AUTH_TOKEN（frontend用）
param(
  [ValidateSet('backend','frontend','verify','all')][string]$Phase = 'all',
  [string]$ProjectName = 'juna',
  [string]$Region      = 'ap-northeast-1',
  [string]$NetlifySite = 'juna-supabase',
  [string]$AdminEmail  = 'admin@juna.local',
  [string]$Ws    = 'C:\Users\imura\.zcode\workspace\default',
  [string]$RepoDir = ''
)
$ErrorActionPreference = 'Stop'
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}
if (-not $RepoDir) { $RepoDir = Join-Path $Ws 'juna-supabase' }
$ProjDir    = Join-Path $RepoDir 'project'
$EnvFile    = Join-Path $ProjDir '.env'
$PkgPath    = Join-Path $ProjDir 'package.json'
$Keepalive  = Join-Path $RepoDir '.github\workflows\keepalive.yml'
$SbToken    = Join-Path $Ws '.zcode\tmp\sb_token.txt'
$NlToken    = Join-Path $Ws '.zcode\tmp\netlify_token.txt'

function Write-Utf8NoBom([string]$Path, [string]$Value) {
  [IO.File]::WriteAllText($Path, $Value, (New-Object System.Text.UTF8Encoding $false))
}
function Read-TokenFile([string]$Path, [string]$What) {
  if (-not (Test-Path $Path)) { throw "$What が見つかりません: $Path（runbook.md の認証の地図を参照）" }
  $v = (Get-Content $Path -Raw).Trim()
  if (-not $v) { throw "$What が空です: $Path" }
  return $v
}
function New-Pw([int]$Len) {
  $c = ((48..57) + (65..90) + (97..122))
  -join ($c | Get-Random -Count $Len)
}
function Read-DotEnv([string]$Path) {
  $h = @{}
  if (Test-Path $Path) {
    foreach ($line in (Get-Content $Path)) {
      if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$' -and $line -notmatch '^\s*#') {
        $h[$matches[1]] = $matches[2].Trim()
      }
    }
  }
  return $h
}
function Get-EnvValue([string]$Key) {
  $h = Read-DotEnv $EnvFile
  if (-not $h[$Key]) { throw ".env に $Key がありません。backend フェーズを先に実行してください" }
  return $h[$Key]
}

# ============ Phase: backend ============
if ($Phase -in @('backend','all')) {
  $token = Read-TokenFile $SbToken 'Supabaseアクセストークン'
  $env:SUPABASE_ACCESS_TOKEN = $token
  supabase login --token $token | Out-Null
  Write-Host '[BE-1] supabase CLI login: OK'

  $H = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }
  try   { $orgs = Invoke-RestMethod -Method Get -Uri 'https://api.supabase.com/v1/organizations' -Headers $H }
  catch { $orgs = Invoke-RestMethod -Method Get -Uri 'https://api.supabase.com/v1/orgs' -Headers $H }
  if (-not $orgs -or @($orgs).Count -eq 0) {
    $orgName = '{0}-org' -f $ProjectName
    $orgs = Invoke-RestMethod -Method Post -Uri 'https://api.supabase.com/v1/organizations' -Headers $H -Body (@{ name = $orgName } | ConvertTo-Json)
    $orgs = @($orgs)
    Write-Host ("[BE-2] 組織が無いため作成: {0} ({1})" -f $orgs[0].name, $orgs[0].id)
  }
  $org = @($orgs)[0]
  Write-Host ("[BE-2] org: {0} ({1})" -f $org.name, $org.id)

  $projects = Invoke-RestMethod -Method Get -Uri 'https://api.supabase.com/v1/projects' -Headers $H
  $dupe = @($projects | Where-Object { $_.name -eq $ProjectName })
  $adminPw = New-Pw 20
  if ($dupe.Count -gt 0) {
    $ref  = $dupe[0].id
    $dbPw = 'SEE_SUPABASE_DASHBOARD'
    Write-Host ("[BE-3] 既存プロジェクトを採用: {0} ref={1} status={2}" -f $dupe[0].name, $ref, $dupe[0].status)
  } else {
    $dbPw = New-Pw 32
    $body = @{ name = $ProjectName; organization_id = $org.id; db_pass = $dbPw
               region = $Region; plan = 'free' } | ConvertTo-Json
    $proj = Invoke-RestMethod -Method Post -Uri 'https://api.supabase.com/v1/projects' -Headers $H -Body $body
    $ref  = $proj.id
    Write-Host ("[BE-3] project created: {0} ref={1} region={2}" -f $proj.name, $ref, $proj.region)
  }

  $deadline = (Get-Date).AddMinutes(4)
  do {
    Start-Sleep -Seconds 15
    $p = Invoke-RestMethod -Method Get -Uri "https://api.supabase.com/v1/projects/$ref" -Headers $H
    Write-Host ("      status: {0}" -f $p.status)
  } while ($p.status -notmatch '^ACTIVE' -and (Get-Date) -lt $deadline)
  if ($p.status -notmatch '^ACTIVE') { throw ("プロビジョニング時間切れ (status=" + $p.status + ")") }
  Write-Host '[BE-4] project ACTIVE'

  $keys = $null
  try   { $keys = Invoke-RestMethod -Method Get -Uri "https://api.supabase.com/v1/projects/$ref/api-keys?reveal=true" -Headers $H }
  catch { $keys = Invoke-RestMethod -Method Get -Uri "https://api.supabase.com/v1/projects/$ref/api-keys/legacy?reveal=true" -Headers $H }
  $anon    = @($keys | Where-Object { $_.name -eq 'anon' })[0].api_key
  $service = @($keys | Where-Object { $_.name -eq 'service_role' })[0].api_key
  if (-not $anon)    { $anon    = $keys.anon }
  if (-not $service) { $service = $keys.service_role }
  if (-not $anon -or -not $service) { throw 'APIキー取得失敗（endpoint応答形状を確認）' }

  $url = "https://$ref.supabase.co"
  $envContent = @"
# Juna Supabase（juna-deploy.ps1 生成・コミット禁止）
VITE_SUPABASE_URL=$url
VITE_SUPABASE_ANON_KEY=$anon
SUPABASE_URL=$url
SUPABASE_ANON_KEY=$anon
SUPABASE_SERVICE_ROLE_KEY=$service
SUPABASE_PROJECT_ID=$ref
SUPABASE_DB_PASSWORD=$dbPw
ADMIN_EMAIL=$AdminEmail
ADMIN_PASSWORD=$adminPw
ADMIN_NICKNAME=管理者
ADMIN_ACCOUNT_ID=admin
ALLOWED_ORIGINS=https://$NetlifySite.netlify.app
"@
  Write-Utf8NoBom $EnvFile $envContent
  Write-Host "[BE-5] .env written: $EnvFile"

  $pkg = Get-Content $PkgPath -Raw
  $pkg = $pkg -replace 'supabase link --project-ref [a-z0-9]+', "supabase link --project-ref $ref"
  Write-Utf8NoBom $PkgPath $pkg
  Write-Host "[BE-6] package.json supabase:link -> $ref"

  Push-Location $ProjDir
  try {
    supabase link --project-ref $ref | Out-Null
    Write-Host '[BE-7] supabase link: OK'
    supabase db push --linked --include-all | Write-Host
    Write-Host '[BE-8] db push: 実行'
    npm run functions:env | Write-Host
    npm run functions:deploy | Write-Host
    Write-Host '[BE-9] edge functions deploy: 実行'
    npm run admin:create | Write-Host
    Write-Host '[BE-10] admin create: 実行'
  } finally { Pop-Location }

  if (Test-Path $Keepalive) {
    $ka = [IO.File]::ReadAllText($Keepalive, [Text.Encoding]::UTF8)
    $ka = $ka -replace '__SUPABASE_REF__', $ref -replace '__ANON_KEY__', $anon
    Write-Utf8NoBom $Keepalive $ka
    Write-Host '[BE-11] keepalive.yml パラメータ埋め込み済み（コミットして有効化）'
  }

  $code = (Invoke-WebRequest -Uri "$url/rest/v1/" -Headers @{ apikey = $anon } -UseBasicParsing).StatusCode
  if ($code -ne 200) { throw "REST検証が200でない: $code" }
  Write-Host '[BE-12] REST verify: 200 OK'
}

# ============ Phase: frontend ============
if ($Phase -in @('frontend','all')) {
  $nt = $env:NETLIFY_AUTH_TOKEN
  if (-not $nt) { $nt = Read-TokenFile $NlToken 'Netlifyトークン' }
  $NH = @{ Authorization = "Bearer $nt"; 'Content-Type' = 'application/json' }
  $sbUrl  = Get-EnvValue 'VITE_SUPABASE_URL'
  $sbAnon = Get-EnvValue 'VITE_SUPABASE_ANON_KEY'

  $sites = Invoke-RestMethod -Method Get -Uri 'https://api.netlify.com/api/v1/sites' -Headers $NH
  $site = @($sites | Where-Object { $_.name -eq $NetlifySite })[0]
  if (-not $site) { throw "Netlifyサイト '$NetlifySite' が見つからない（トークンのスコープ確認）" }
  Write-Host ("[FE-1] site: {0} (id={1})" -f $site.name, $site.id)

  foreach ($kv in @(@{k='VITE_SUPABASE_URL';v=$sbUrl}, @{k='VITE_SUPABASE_ANON_KEY';v=$sbAnon})) {
    $b = @{ values = @{ production = $kv.v; deploy_preview = $kv.v; branch_deploy = $kv.v } } | ConvertTo-Json -Depth 5
    try {
      Invoke-RestMethod -Method Patch -Uri ("https://api.netlify.com/api/v1/sites/{0}/env/{1}" -f $site.id, $kv.k) -Headers $NH -Body $b | Out-Null
    } catch {
      $legacy = @{ build_settings = @{ env = @{ $kv.k = $kv.v } } } | ConvertTo-Json -Depth 5
      Invoke-RestMethod -Method Put -Uri ("https://api.netlify.com/api/v1/sites/{0}" -f $site.id) -Headers $NH -Body $legacy | Out-Null
    }
    Write-Host ("[FE-2] env updated: {0}" -f $kv.k)
  }

  $build = Invoke-RestMethod -Method Post -Uri ("https://api.netlify.com/api/v1/sites/{0}/builds" -f $site.id) -Headers $NH -Body '{}'
  Write-Host ("[FE-3] build triggered: {0}" -f $build.id)
  $deadline = (Get-Date).AddMinutes(8)
  do {
    Start-Sleep -Seconds 20
    $b = Invoke-RestMethod -Method Get -Uri ("https://api.netlify.com/api/v1/builds/{0}" -f $build.id) -Headers $NH
    Write-Host ("      build: {0}" -f $b.state)
  } while ($b.state -eq 'processing' -and (Get-Date) -lt $deadline)
  if ($b.state -ne 'ready') { throw ("ビルドが完了しない: {0}（repo連携・ビルド設定を確認。UI手動デプロイもrunbook参照）" -f $b.state) }
  Write-Host '[FE-4] build ready'
}

# ============ Phase: verify ============
if ($Phase -in @('verify','all')) {
  $fail = 0
  $sbUrl  = Get-EnvValue 'VITE_SUPABASE_URL'
  $sbAnon = Get-EnvValue 'VITE_SUPABASE_ANON_KEY'
  $ref    = Get-EnvValue 'SUPABASE_PROJECT_ID'

  try {
    $c = (Invoke-WebRequest -Uri "$sbUrl/rest/v1/" -Headers @{ apikey = $sbAnon } -UseBasicParsing).StatusCode
    if ($c -eq 200) { Write-Host '[OK] Supabase REST 200' } else { Write-Host "[FAIL] Supabase REST $c"; $fail = 1 }
  } catch { Write-Host ("[FAIL] Supabase REST 例外: {0}" -f $_.Exception.Message); $fail = 1 }

  try {
    $idx = (Invoke-WebRequest -Uri "https://$NetlifySite.netlify.app/" -UseBasicParsing).Content
    if ($idx -match 'assets/(index-[A-Za-z0-9_-]+\.js)') {
      $js = (Invoke-WebRequest -Uri ("https://$NetlifySite.netlify.app/assets/" + $matches[1]) -UseBasicParsing).Content
      if ($js -match [regex]::Escape($ref)) { Write-Host '[OK] Netlifyバンドルに新ref反映' }
      else { Write-Host '[FAIL] バンドルに新refなし（再デプロイ未完了の可能性）'; $fail = 1 }
    } else { Write-Host '[FAIL] バンドル特定不可'; $fail = 1 }
  } catch { Write-Host ("[FAIL] Netlify 例外: {0}" -f $_.Exception.Message); $fail = 1 }

  if ($fail -eq 1) { throw 'verify FAIL — runbook「既知の障害」を参照' }
  Write-Host '=== ALL VERIFY PASS ==='
}
