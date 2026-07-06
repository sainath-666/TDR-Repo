-- Private bucket for minted TDR certificate PDFs (server uploads via service role).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tdr-certificates',
  'tdr-certificates',
  false,
  10485760,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;
