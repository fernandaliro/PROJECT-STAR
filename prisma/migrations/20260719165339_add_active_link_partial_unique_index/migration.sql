-- Manual migration (Prisma's declarative schema can't express a partial
-- unique index with a WHERE clause). This guarantees only one ACTIVE
-- PatientTurmaLink per patient+turma at a time. If this migration is ever
-- reset/replayed via `prisma migrate reset`, this file is preserved and
-- reapplied automatically like any other migration — no extra manual step
-- needed beyond the one already taken here.
CREATE UNIQUE INDEX "PatientTurmaLink_active_patient_turma_unique"
  ON "PatientTurmaLink" ("patientId", "turmaSlotId")
  WHERE "status" = 'ATIVO';
