# component-analyzer.ps1
# Usage: .\component-analyzer.ps1 -componentName "PostCard"

param (
    [Parameter(Mandatory=$true)]
    [string]$componentName,
    
    [Parameter(Mandatory=$false)]
    [switch]$saveToFile
)

# Set proper encoding for output
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Excluded directories
$excludedDirs = @("node_modules", ".temp", ".git", "dist", ".vscode")

# Function to convert path to correct format
function Format-Path {
    param([string]$path)
    return $path.Replace("\", "/")
}

# Initialize StringBuilder for results
$analysisResult = New-Object System.Text.StringBuilder
$analysisResult.AppendLine("# Analysis Report: $componentName`n") | Out-Null

# Project overview section
$analysisResult.AppendLine("## Project Overview`n") | Out-Null

# Progress indicator
Write-Host "Scanning project files..." -ForegroundColor Cyan

$allFiles = Get-ChildItem -Path . -Recurse -File | 
            Where-Object { 
                $path = $_.FullName
                -not ($excludedDirs | Where-Object { $path -like "*\$_\*" -or $path -like "*/$_/*" })
            }
$vueFiles = $allFiles | Where-Object { $_.Extension -eq ".vue" }
$jsFiles = $allFiles | Where-Object { $_.Extension -match "\.(js|ts|jsx|tsx)$" }

$analysisResult.AppendLine("- Total files: $($allFiles.Count)") | Out-Null
$analysisResult.AppendLine("- Vue files: $($vueFiles.Count)") | Out-Null
$analysisResult.AppendLine("- JS/TS files: $($jsFiles.Count)") | Out-Null
$analysisResult.AppendLine("- Excluded directories: $($excludedDirs -join ', ')") | Out-Null
$analysisResult.AppendLine("- Target component: **$componentName**") | Out-Null

# First find all imports and usages before creating the component usage list
Write-Host "Searching for component usage..." -ForegroundColor Cyan

# Find imports
$imports = $allFiles | 
            Where-Object { $_.Extension -match "\.(vue|js|ts|jsx|tsx)$" } |
            Select-String -Pattern "import\s+(?:\{\s*)?$componentName(?:\s*\})?\s+from" -ErrorAction SilentlyContinue

# Find tag usage in templates
$usage = $vueFiles | 
        Select-String -Pattern "<$componentName\s|<$componentName>|<$componentName/>" -ErrorAction SilentlyContinue

# Create component usage list section right after Project Overview
$analysisResult.AppendLine("`n## Component Usage Summary`n") | Out-Null

if ($imports.Count -gt 0 -or $usage.Count -gt 0) {
    $usageFiles = @()
    
    # Add import files
    foreach ($import in $imports) {
        $relativePath = Format-Path -path (Resolve-Path -Relative $import.Path)
        if ($usageFiles -notcontains $relativePath) {
            $usageFiles += $relativePath
        }
    }
    
    # Add usage files
    foreach ($item in $usage) {
        $relativePath = Format-Path -path (Resolve-Path -Relative $item.Path)
        if ($usageFiles -notcontains $relativePath) {
            $usageFiles += $relativePath
        }
    }
    
    # Sort and display the list
    $usageFiles = $usageFiles | Sort-Object
    
    $analysisResult.AppendLine("### Files Using This Component`n") | Out-Null
    
    foreach ($file in $usageFiles) {
        $analysisResult.AppendLine("- $file") | Out-Null
    }
    
    $analysisResult.AppendLine("`nTotal files: **$($usageFiles.Count)**") | Out-Null
} else {
    $analysisResult.AppendLine("This component is not used in any files.") | Out-Null
}

# Now continue with the detailed sections
$analysisResult.AppendLine("`n## Import Locations`n") | Out-Null

if ($imports) {
    foreach ($import in $imports) {
        $relativePath = Format-Path -path (Resolve-Path -Relative $import.Path)
        $analysisResult.AppendLine("### $relativePath") | Out-Null
        $analysisResult.AppendLine('```') | Out-Null
        $analysisResult.AppendLine("Line: $($import.LineNumber)") | Out-Null
        $analysisResult.AppendLine("Content: $($import.Line.Trim())") | Out-Null
        $analysisResult.AppendLine('```') | Out-Null
        $analysisResult.AppendLine("") | Out-Null
    }
} else {
    $analysisResult.AppendLine("No imports found.") | Out-Null
}

# Find usage in templates - with context analysis
Write-Host "Analyzing template usage..." -ForegroundColor Cyan
$analysisResult.AppendLine("## Tag Usage Locations`n") | Out-Null

if ($usage) {
    $usageByFile = $usage | Group-Object -Property Path
    
    foreach ($fileGroup in $usageByFile) {
        $relativePath = Format-Path -path (Resolve-Path -Relative $fileGroup.Name)
        $analysisResult.AppendLine("### $relativePath") | Out-Null
        $analysisResult.AppendLine("Total usages: **$($fileGroup.Count)**") | Out-Null
        
        foreach ($occurrence in $fileGroup.Group) {
            $lineNum = $occurrence.LineNumber
            $file = $occurrence.Path
            $line = $occurrence.Line
            
            # Get complete tag across multiple lines if needed
            $fullTag = $line
            # Use UTF-8 encoding to read file content
            $currentFile = Get-Content -Path $file -Encoding UTF8
            $startLine = $lineNum - 1  # 0-indexed
            
            # Read until the tag is closed
            if (-not $fullTag.Contains("/>") -and -not $fullTag.Contains("</$componentName>")) {
                for ($i = $startLine + 1; $i -lt $currentFile.Length; $i++) {
                    $fullTag += $currentFile[$i]
                    if ($currentFile[$i] -match "/>|</$componentName>") {
                        break
                    }
                }
            }
            
            # Add context - show some lines before and after
            $contextStart = [Math]::Max(0, $startLine - 2)
            $contextEnd = [Math]::Min($currentFile.Length - 1, $startLine + 3)
            
            $analysisResult.AppendLine("") | Out-Null
            $analysisResult.AppendLine("#### Usage #$($occurrence.LineNumber)") | Out-Null
            $analysisResult.AppendLine('```html') | Out-Null
            
            # Show context - using ASCII ">" instead of Unicode arrow
            for ($i = $contextStart; $i -le $contextEnd; $i++) {
                $prefix = if ($i -eq $startLine) { "> " } else { "  " }
                $analysisResult.AppendLine("$prefix$($currentFile[$i])") | Out-Null
            }
            
            $analysisResult.AppendLine('```') | Out-Null
            
            # Extract props
            $analysisResult.AppendLine("##### Properties") | Out-Null
            
            # Find regular attributes: prop="value"
            $props = [regex]::Matches($fullTag, '(\w+)="([^"]*)"')
            
            # Find bound properties: :prop="value"
            $bindProps = [regex]::Matches($fullTag, ':(\w+)="([^"]*)"')
            
            # Find v-bind properties: v-bind:prop="value"
            $vBindProps = [regex]::Matches($fullTag, 'v-bind:(\w+)="([^"]*)"')
            
            # Find event handlers: @event="handler"
            $eventProps = [regex]::Matches($fullTag, '@(\w+)="([^"]*)"')
            
            # Find v-on event handlers: v-on:event="handler"
            $vOnProps = [regex]::Matches($fullTag, 'v-on:(\w+)="([^"]*)"')
            
            # Find directives: v-if, v-for, etc.
            $directives = [regex]::Matches($fullTag, 'v-(if|else-if|else|for|show|model|html|text)(?:=|:)?"([^"]*)"')
            
            if ($props.Count -gt 0 -or $bindProps.Count -gt 0 -or $vBindProps.Count -gt 0 -or 
                $eventProps.Count -gt 0 -or $vOnProps.Count -gt 0 -or $directives.Count -gt 0) {
                
                $analysisResult.AppendLine("| Type | Name | Value |") | Out-Null
                $analysisResult.AppendLine("|-------|------|-----|") | Out-Null
                
                foreach ($match in $props) {
                    $propName = $match.Groups[1].Value
                    $propValue = $match.Groups[2].Value
                    if (-not $propName.StartsWith("v-")) {
                        $analysisResult.AppendLine("| Static | $propName | $propValue |") | Out-Null
                    }
                }
                
                foreach ($match in $bindProps) {
                    $propName = $match.Groups[1].Value
                    $propValue = $match.Groups[2].Value
                    $analysisResult.AppendLine("| Dynamic | $propName | $propValue |") | Out-Null
                }
                
                foreach ($match in $vBindProps) {
                    $propName = $match.Groups[1].Value
                    $propValue = $match.Groups[2].Value
                    $analysisResult.AppendLine("| Dynamic | $propName | $propValue |") | Out-Null
                }
                
                foreach ($match in $eventProps) {
                    $eventName = $match.Groups[1].Value
                    $handlerValue = $match.Groups[2].Value
                    $analysisResult.AppendLine("| Event | $eventName | $handlerValue |") | Out-Null
                }
                
                foreach ($match in $vOnProps) {
                    $eventName = $match.Groups[1].Value
                    $handlerValue = $match.Groups[2].Value
                    $analysisResult.AppendLine("| Event | $eventName | $handlerValue |") | Out-Null
                }
                
                foreach ($match in $directives) {
                    $directiveName = $match.Groups[1].Value
                    $directiveValue = $match.Groups[2].Value
                    $analysisResult.AppendLine("| Directive | $directiveName | $directiveValue |") | Out-Null
                }
            } else {
                $analysisResult.AppendLine("No properties") | Out-Null
            }
        }
    }
} else {
    $analysisResult.AppendLine("No usage found.") | Out-Null
}

# 3. Component definition file - with more detailed analysis
Write-Host "Analyzing component definition..." -ForegroundColor Cyan
$analysisResult.AppendLine("## Component Definition File`n") | Out-Null

$componentFiles = $allFiles | 
                Where-Object { $_.Name -eq "$componentName.vue" }
                
if ($componentFiles.Count -eq 0) {
    $analysisResult.AppendLine("Component file not found.") | Out-Null
} elseif ($componentFiles.Count > 1) {
    $analysisResult.AppendLine("Multiple component files found:") | Out-Null
    foreach ($file in $componentFiles) {
        $relativePath = Format-Path -path (Resolve-Path -Relative $file.FullName)
        $analysisResult.AppendLine("- $relativePath") | Out-Null
    }
    $analysisResult.AppendLine("`nAnalyzing first file...`n") | Out-Null
    $componentFile = $componentFiles[0]
} else {
    $componentFile = $componentFiles[0]
}

if ($componentFile) {
    $relativePath = Format-Path -path (Resolve-Path -Relative $componentFile.FullName)
    $analysisResult.AppendLine("### $relativePath") | Out-Null
    
    # Get file content with UTF-8 encoding
    $content = Get-Content -Path $componentFile.FullName -Raw -Encoding UTF8
    
    # Count template and script lines
    $templateMatch = [regex]::Match($content, "<template[^>]*>(.*?)</template>", [System.Text.RegularExpressions.RegexOptions]::Singleline)
    $scriptMatch = [regex]::Match($content, "<script[^>]*>(.*?)</script>", [System.Text.RegularExpressions.RegexOptions]::Singleline)
    $styleMatch = [regex]::Match($content, "<style[^>]*>(.*?)</style>", [System.Text.RegularExpressions.RegexOptions]::Singleline)
    
    $analysisResult.AppendLine("#### Basic Information") | Out-Null
    $analysisResult.AppendLine("| Section | Lines |") | Out-Null
    $analysisResult.AppendLine("|----------|------|") | Out-Null
    
    if ($templateMatch.Success) {
        $template = $templateMatch.Groups[1].Value
        $templateLines = ($template -split "`n").Length
        $analysisResult.AppendLine("| template | $templateLines |") | Out-Null
    } else {
        $analysisResult.AppendLine("| template | 0 |") | Out-Null
    }
    
    if ($scriptMatch.Success) {
        $script = $scriptMatch.Groups[1].Value
        $scriptLines = ($script -split "`n").Length
        $analysisResult.AppendLine("| script | $scriptLines |") | Out-Null
        
        # Detect setup script
        if ($content -match "<script\s+setup\b") {
            $analysisResult.AppendLine("`n**Setup style Composition API is being used**") | Out-Null
        }
    } else {
        $analysisResult.AppendLine("| script | 0 |") | Out-Null
    }
    
    if ($styleMatch.Success) {
        $style = $styleMatch.Groups[1].Value
        $styleLines = ($style -split "`n").Length
        $styleScoped = if ($content -match "<style\s+scoped\b") { "Yes" } else { "No" }
        $analysisResult.AppendLine("| style | $styleLines |") | Out-Null
        $analysisResult.AppendLine("| scoped style | $styleScoped |") | Out-Null
    } else {
        $analysisResult.AppendLine("| style | 0 |") | Out-Null
    }
    
    # Props analysis
    $analysisResult.AppendLine("`n#### Props Definition") | Out-Null
    
    # Check for defineProps
    $propsMatch = [regex]::Match($content, "defineProps\(\{([^}]+)\}\)", [System.Text.RegularExpressions.RegexOptions]::Singleline)
    $propsArrayMatch = [regex]::Match($content, "defineProps\(\[(.*?)\]\)", [System.Text.RegularExpressions.RegexOptions]::Singleline)
    $propsTypeMatch = [regex]::Match($content, "defineProps<\{([^}]+)\}\>()", [System.Text.RegularExpressions.RegexOptions]::Singleline)
    
    if ($propsMatch.Success) {
        $propsBlock = $propsMatch.Groups[1].Value
        $analysisResult.AppendLine('```js') | Out-Null
        $analysisResult.AppendLine($propsBlock) | Out-Null
        $analysisResult.AppendLine('```') | Out-Null
    } 
    elseif ($propsArrayMatch.Success) {
        $propsBlock = $propsArrayMatch.Groups[1].Value
        $analysisResult.AppendLine('```js') | Out-Null
        $analysisResult.AppendLine("[$propsBlock]") | Out-Null
        $analysisResult.AppendLine('```') | Out-Null
    }
    elseif ($propsTypeMatch.Success) {
        $propsBlock = $propsTypeMatch.Groups[1].Value
        $analysisResult.AppendLine('```ts') | Out-Null
        $analysisResult.AppendLine($propsBlock) | Out-Null
        $analysisResult.AppendLine('```') | Out-Null
    }
    elseif ($content -match "props\s*:\s*\{") {
        $propsPattern = "props\s*:\s*\{([^}]+)\}"
        $propsMatch = [regex]::Match($content, $propsPattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
        if ($propsMatch.Success) {
            $propsBlock = $propsMatch.Groups[1].Value
            $analysisResult.AppendLine('```js') | Out-Null
            $analysisResult.AppendLine($propsBlock) | Out-Null
            $analysisResult.AppendLine('```') | Out-Null
        }
    } 
    else {
        $analysisResult.AppendLine("No props definition found.") | Out-Null
    }
    
    # Emits analysis
    $analysisResult.AppendLine("`n#### Events") | Out-Null
    
    $emitsMatch = [regex]::Match($content, "defineEmits\(\[(.*?)\]\)", [System.Text.RegularExpressions.RegexOptions]::Singleline)
    $emitsObjectMatch = [regex]::Match($content, "defineEmits\(\{([^}]+)\}\)", [System.Text.RegularExpressions.RegexOptions]::Singleline)
    
    if ($emitsMatch.Success) {
        $emitsBlock = $emitsMatch.Groups[1].Value
        $analysisResult.AppendLine('```js') | Out-Null
        $analysisResult.AppendLine("[$emitsBlock]") | Out-Null
        $analysisResult.AppendLine('```') | Out-Null
    } 
    elseif ($emitsObjectMatch.Success) {
        $emitsBlock = $emitsObjectMatch.Groups[1].Value
        $analysisResult.AppendLine('```js') | Out-Null
        $analysisResult.AppendLine($emitsBlock) | Out-Null
        $analysisResult.AppendLine('```') | Out-Null
    }
    elseif ($content -match "emits\s*:\s*\[") {
        $emitsPattern = "emits\s*:\s*\[(.*?)\]"
        $emitsMatch = [regex]::Match($content, $emitsPattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
        if ($emitsMatch.Success) {
            $emitsBlock = $emitsMatch.Groups[1].Value
            $analysisResult.AppendLine('```js') | Out-Null
            $analysisResult.AppendLine("[$emitsBlock]") | Out-Null
            $analysisResult.AppendLine('```') | Out-Null
        }
    } 
    else {
        $analysisResult.AppendLine("No event definitions found.") | Out-Null
    }
    
    # Methods
    $analysisResult.AppendLine("`n#### Methods") | Out-Null
    
    $methodMatches = [regex]::Matches($content, "(?:function|const)\s+(\w+)\s*(?:=\s*(?:async\s*)?(?:\([^)]*\))|(?:\([^)]*\)))")
    
    if ($methodMatches.Count -gt 0) {
        $analysisResult.AppendLine("| Method Name |") | Out-Null
        $analysisResult.AppendLine("|-----------|") | Out-Null
        
        $uniqueMethods = @{}
        foreach ($match in $methodMatches) {
            $methodName = $match.Groups[1].Value
            if (-not $uniqueMethods.ContainsKey($methodName)) {
                $uniqueMethods[$methodName] = $true
                $analysisResult.AppendLine("| $methodName |") | Out-Null
            }
        }
    } else {
        $analysisResult.AppendLine("No methods found.") | Out-Null
    }
    
    # Dependencies (imported components)
    $analysisResult.AppendLine("`n#### Dependencies") | Out-Null
    
    # Fixed regex pattern for imports
    $importPattern = 'import\s+(\w+)\s+from\s+[''"]([^''"]+)[''"]'
    $importMatches = [regex]::Matches($content, $importPattern)
    
    if ($importMatches.Count -gt 0) {
        $analysisResult.AppendLine("| Component | Path |") | Out-Null
        $analysisResult.AppendLine("|--------------|------|") | Out-Null
        
        foreach ($match in $importMatches) {
            $importName = $match.Groups[1].Value
            $importPath = $match.Groups[2].Value
            if ($importPath -match "\.vue$") {
                $analysisResult.AppendLine("| $importName | $importPath |") | Out-Null
            }
        }
    } else {
        $analysisResult.AppendLine("No dependencies found.") | Out-Null
    }
} else {
    $analysisResult.AppendLine("Component file not found.") | Out-Null
}

# 4. Other mentions (in comments, docs, etc.)
Write-Host "Searching for other references..." -ForegroundColor Cyan
$analysisResult.AppendLine("`n## Other References`n") | Out-Null

# Fixed regex pattern for other references
$mentionPattern = "(?<!['\""\/\w-])$componentName(?!['\""\/\w-])"
$otherMentions = $allFiles | 
                Where-Object { $_.Extension -match "\.(vue|js|ts|jsx|tsx|md|txt)$" } |
                Select-String -Pattern $mentionPattern -ErrorAction SilentlyContinue -Encoding UTF8 |
                Where-Object { 
                    # Exclude imports and tag usage
                    $_.Line -notmatch "import.*$componentName" -and 
                    $_.Line -notmatch "<$componentName"
                }

if ($otherMentions) {
    $analysisResult.AppendLine("| File | Line | Content |") | Out-Null
    $analysisResult.AppendLine("|--------|-----|------|") | Out-Null
    
    foreach ($mention in $otherMentions) {
        $relativePath = Format-Path -path (Resolve-Path -Relative $mention.Path)
        $lineNum = $mention.LineNumber
        $line = $mention.Line.Trim()
        $analysisResult.AppendLine("| $relativePath | $lineNum | $line |") | Out-Null
    }
} else {
    $analysisResult.AppendLine("No other references found.") | Out-Null
}

# 5. Add a summary section
$analysisResult.AppendLine("`n## Summary`n") | Out-Null

$analysisResult.AppendLine("| Metric | Count |") | Out-Null
$analysisResult.AppendLine("|-----|-----|") | Out-Null
$analysisResult.AppendLine("| Import locations | $($imports.Count) |") | Out-Null
$analysisResult.AppendLine("| Usage locations | $($usage.Count) |") | Out-Null
$analysisResult.AppendLine("| Other references | $($otherMentions.Count) |") | Out-Null

# Save to file if requested
if ($saveToFile) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $outputDir = "component-analysis"
    $fileName = "${componentName}_analysis_${timestamp}"
    $outputPath = "$outputDir\$fileName.md"
    
    if (-not (Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir | Out-Null
    }
    
    # Save with UTF-8 encoding
    $analysisResult.ToString() | Out-File -FilePath $outputPath -Encoding UTF8
    Write-Host "Results saved to file: $outputPath" -ForegroundColor Cyan
}

# Copy to clipboard with UTF-8 encoding
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.Clipboard]::SetText($analysisResult.ToString())

# Output results
Write-Host "Analysis of $componentName completed successfully" -ForegroundColor Green
Write-Host "Results copied to clipboard" -ForegroundColor Yellow

return $analysisResult.ToString()