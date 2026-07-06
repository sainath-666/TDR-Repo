-- Audit log ids are assigned in application code (restricted DB roles may lack sequence USAGE).
ALTER TABLE audit_log ALTER COLUMN id DROP DEFAULT;
