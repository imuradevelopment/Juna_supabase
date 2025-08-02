-- 既存のテーマカラーに不足しているカラーを追加
UPDATE site_settings 
SET value = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          value,
          '{colors,primaryLight}',
          '"#5cd4c2"'
        ),
        '{colors,secondaryLight}',
        '"#95b8d6"'
      ),
      '{colors,textWhite}',
      '"#ffffff"'
    ),
    '{colors,primaryLight}',
    COALESCE(value->'colors'->'primaryLight', '"#5cd4c2"')
  ),
  '{colors,secondaryLight}',
  COALESCE(value->'colors'->'secondaryLight', '"#95b8d6"')
),
updated_at = now()
WHERE key = 'theme'
AND (
  NOT (value->'colors' ? 'primaryLight') OR
  NOT (value->'colors' ? 'secondaryLight') OR
  NOT (value->'colors' ? 'textWhite')
);