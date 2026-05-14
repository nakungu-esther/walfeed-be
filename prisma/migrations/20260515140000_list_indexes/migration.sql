-- Speed up scoped list queries (forms by owner, submissions by form / sort by date)
CREATE INDEX IF NOT EXISTS "Form_userId_idx" ON "Form"("userId");
CREATE INDEX IF NOT EXISTS "Submission_formId_idx" ON "Submission"("formId");
CREATE INDEX IF NOT EXISTS "Submission_createdAt_idx" ON "Submission"("createdAt");
