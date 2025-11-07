-- Migrate signedIntent from metadata to nep413_signed_data field
UPDATE intents 
SET nep413_signed_data = metadata->'signedIntent'
WHERE metadata->'signedIntent' IS NOT NULL
  AND nep413_signed_data IS NULL;
