-- CreateEnum
CREATE TYPE "PatientStatus" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('ATIVO', 'ALTA');

-- CreateEnum
CREATE TYPE "Especialidade" AS ENUM ('FISIOTERAPIA', 'ODONTOLOGIA', 'NUTRICAO', 'PSICOLOGIA');

-- CreateEnum
CREATE TYPE "TipoAtendimento" AS ENUM ('INDIVIDUAL', 'GRUPO');

-- CreateEnum
CREATE TYPE "ModalidadeFisio" AS ENUM ('FISIOTERAPIA', 'PILATES', 'ACUPUNTURA', 'VENTOSA', 'URGENCIA', 'ENCAIXE', 'AVALIACAO');

-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO');

-- CreateEnum
CREATE TYPE "OccurrenceStatus" AS ENUM ('REALIZADO', 'DESMARCOU', 'FALTOU');

-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('AGUARDANDO', 'CONTATADO', 'AGENDADO', 'DESISTIU');

-- CreateEnum
CREATE TYPE "PendencyStatus" AS ENUM ('ABERTA', 'JUSTIFICADA', 'PAGA', 'ABONADA');

-- CreateEnum
CREATE TYPE "PendencyOrigin" AS ENUM ('FALTA_INJUSTIFICADA', 'DESMARCACAO_FORA_PRAZO');

-- CreateEnum
CREATE TYPE "CollectionChannel" AS ENUM ('TEAMS', 'EMAIL', 'PRESENCIAL', 'OUTRO');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'STATUS_CHANGE');

-- CreateEnum
CREATE TYPE "CsvRowStatus" AS ENUM ('VALIDA', 'DESCARTADA_MALFORMADA');

-- CreateEnum
CREATE TYPE "DiffClassification" AS ENUM ('PACIENTE_NOVO', 'DESMARCACAO_FALTA_DIA', 'ALTA_APLICADA', 'POSSIVEL_ALTA_PENDENTE', 'MUDANCA_ESTRUTURAL');

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "matriculaSigop" TEXT NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "nomeNormalizado" TEXT NOT NULL,
    "status" "PatientStatus" NOT NULL DEFAULT 'ATIVO',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Professional" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "especialidade" "Especialidade" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalSchedule" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "diaSemana" "DiaSemana",
    "horaInicio" TEXT,
    "horaFim" TEXT,
    "sobDemanda" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalAlias" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "aliasNomeCru" TEXT NOT NULL,

    CONSTRAINT "ProfessionalAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurmaSlot" (
    "id" TEXT NOT NULL,
    "diaSemana" "DiaSemana" NOT NULL,
    "horario" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "tipoAtendimento" "TipoAtendimento" NOT NULL,
    "modalidade" "ModalidadeFisio",
    "especialidade" "Especialidade" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TurmaSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientTurmaLink" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "turmaSlotId" TEXT NOT NULL,
    "status" "LinkStatus" NOT NULL DEFAULT 'ATIVO',
    "dataEntrada" TIMESTAMP(3) NOT NULL,
    "dataSaida" TIMESTAMP(3),
    "altaId" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientTurmaLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alta" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "turmaSlotId" TEXT NOT NULL,
    "dataAlta" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT,
    "registradoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurmaOccurrenceEvent" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "turmaSlotId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "status" "OccurrenceStatus" NOT NULL,
    "motivo" TEXT,
    "registradoPor" TEXT,
    "origemImportId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TurmaOccurrenceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "especialidade" "Especialidade" NOT NULL,
    "dataAvaliacao" TIMESTAMP(3) NOT NULL,
    "prioridade" INTEGER NOT NULL,
    "disponibilidade" JSONB NOT NULL,
    "profissionalResponsavelId" TEXT,
    "tratamentoIndicado" TEXT NOT NULL,
    "dentesEnvolvidos" TEXT,
    "rx" BOOLEAN,
    "retratamento" BOOLEAN,
    "observacoes" TEXT,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'AGUARDANDO',
    "dataEntradaFila" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistSuggestion" (
    "id" TEXT NOT NULL,
    "waitlistEntryId" TEXT NOT NULL,
    "turmaSlotId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "sugeridoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aceito" BOOLEAN,
    "observacoes" TEXT,

    CONSTRAINT "WaitlistSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialPendency" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "origem" "PendencyOrigin" NOT NULL,
    "occurrenceEventId" TEXT,
    "valor" DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    "status" "PendencyStatus" NOT NULL DEFAULT 'ABERTA',
    "justificativaRecebida" BOOLEAN NOT NULL DEFAULT false,
    "justificativaDescricao" TEXT,
    "abonoAprovadoPor" TEXT,
    "abonoAprovadoEm" TIMESTAMP(3),
    "dataQuitacao" TIMESTAMP(3),
    "canalCobranca" "CollectionChannel",
    "statusCobranca" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialPendency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "changedFields" TEXT[],
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "sourceImportId" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CsvImport" (
    "id" TEXT NOT NULL,
    "arquivoNome" TEXT NOT NULL,
    "importadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importadoPor" TEXT NOT NULL,
    "totalLinhas" INTEGER NOT NULL,
    "linhasValidas" INTEGER NOT NULL,
    "linhasDescartadas" INTEGER NOT NULL,
    "countPacienteNovo" INTEGER NOT NULL DEFAULT 0,
    "countDesmarcacaoFalta" INTEGER NOT NULL DEFAULT 0,
    "countAltaPendente" INTEGER NOT NULL DEFAULT 0,
    "countMudancaEstrutural" INTEGER NOT NULL DEFAULT 0,
    "rawFileSnapshot" TEXT NOT NULL,
    "observacoes" TEXT,

    CONSTRAINT "CsvImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CsvImportRow" (
    "id" TEXT NOT NULL,
    "csvImportId" TEXT NOT NULL,
    "numeroLinha" INTEGER NOT NULL,
    "conteudoBruto" JSONB NOT NULL,
    "status" "CsvRowStatus" NOT NULL,
    "motivoDescarte" TEXT,
    "matriculaSigop" TEXT,
    "diaSemana" "DiaSemana",
    "horario" TEXT,
    "professionalNomeCru" TEXT,
    "statusAtendimento" TEXT,

    CONSTRAINT "CsvImportRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CsvDiffResult" (
    "id" TEXT NOT NULL,
    "csvImportId" TEXT NOT NULL,
    "turmaSlotId" TEXT,
    "patientId" TEXT,
    "classification" "DiffClassification" NOT NULL,
    "detalhe" JSONB,
    "resolvido" BOOLEAN NOT NULL DEFAULT false,
    "resolvidoEm" TIMESTAMP(3),
    "resolvidoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CsvDiffResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurmaAbsenceStreak" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "turmaSlotId" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "missedCount" INTEGER NOT NULL DEFAULT 0,
    "lastSeenImportId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TurmaAbsenceStreak_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_matriculaSigop_key" ON "Patient"("matriculaSigop");

-- CreateIndex
CREATE INDEX "Patient_nomeNormalizado_idx" ON "Patient"("nomeNormalizado");

-- CreateIndex
CREATE UNIQUE INDEX "Professional_nome_especialidade_key" ON "Professional"("nome", "especialidade");

-- CreateIndex
CREATE INDEX "ProfessionalSchedule_professionalId_idx" ON "ProfessionalSchedule"("professionalId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalAlias_aliasNomeCru_key" ON "ProfessionalAlias"("aliasNomeCru");

-- CreateIndex
CREATE UNIQUE INDEX "TurmaSlot_diaSemana_horario_professionalId_tipoAtendimento_key" ON "TurmaSlot"("diaSemana", "horario", "professionalId", "tipoAtendimento");

-- CreateIndex
CREATE UNIQUE INDEX "PatientTurmaLink_altaId_key" ON "PatientTurmaLink"("altaId");

-- CreateIndex
CREATE INDEX "PatientTurmaLink_patientId_idx" ON "PatientTurmaLink"("patientId");

-- CreateIndex
CREATE INDEX "PatientTurmaLink_turmaSlotId_idx" ON "PatientTurmaLink"("turmaSlotId");

-- CreateIndex
CREATE INDEX "TurmaOccurrenceEvent_turmaSlotId_data_idx" ON "TurmaOccurrenceEvent"("turmaSlotId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "TurmaOccurrenceEvent_linkId_data_key" ON "TurmaOccurrenceEvent"("linkId", "data");

-- CreateIndex
CREATE INDEX "WaitlistEntry_especialidade_status_idx" ON "WaitlistEntry"("especialidade", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialPendency_occurrenceEventId_key" ON "FinancialPendency"("occurrenceEventId");

-- CreateIndex
CREATE INDEX "FinancialPendency_patientId_status_idx" ON "FinancialPendency"("patientId", "status");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_changedAt_idx" ON "AuditLog"("entityType", "entityId", "changedAt");

-- CreateIndex
CREATE INDEX "AuditLog_changedAt_idx" ON "AuditLog"("changedAt");

-- CreateIndex
CREATE INDEX "CsvImportRow_csvImportId_idx" ON "CsvImportRow"("csvImportId");

-- CreateIndex
CREATE INDEX "CsvDiffResult_csvImportId_classification_idx" ON "CsvDiffResult"("csvImportId", "classification");

-- CreateIndex
CREATE UNIQUE INDEX "TurmaAbsenceStreak_linkId_key" ON "TurmaAbsenceStreak"("linkId");

-- CreateIndex
CREATE UNIQUE INDEX "TurmaAbsenceStreak_patientId_turmaSlotId_key" ON "TurmaAbsenceStreak"("patientId", "turmaSlotId");

-- AddForeignKey
ALTER TABLE "ProfessionalSchedule" ADD CONSTRAINT "ProfessionalSchedule_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalAlias" ADD CONSTRAINT "ProfessionalAlias_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaSlot" ADD CONSTRAINT "TurmaSlot_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientTurmaLink" ADD CONSTRAINT "PatientTurmaLink_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientTurmaLink" ADD CONSTRAINT "PatientTurmaLink_turmaSlotId_fkey" FOREIGN KEY ("turmaSlotId") REFERENCES "TurmaSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientTurmaLink" ADD CONSTRAINT "PatientTurmaLink_altaId_fkey" FOREIGN KEY ("altaId") REFERENCES "Alta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alta" ADD CONSTRAINT "Alta_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alta" ADD CONSTRAINT "Alta_turmaSlotId_fkey" FOREIGN KEY ("turmaSlotId") REFERENCES "TurmaSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaOccurrenceEvent" ADD CONSTRAINT "TurmaOccurrenceEvent_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "PatientTurmaLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaOccurrenceEvent" ADD CONSTRAINT "TurmaOccurrenceEvent_turmaSlotId_fkey" FOREIGN KEY ("turmaSlotId") REFERENCES "TurmaSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaOccurrenceEvent" ADD CONSTRAINT "TurmaOccurrenceEvent_origemImportId_fkey" FOREIGN KEY ("origemImportId") REFERENCES "CsvImport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_profissionalResponsavelId_fkey" FOREIGN KEY ("profissionalResponsavelId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistSuggestion" ADD CONSTRAINT "WaitlistSuggestion_waitlistEntryId_fkey" FOREIGN KEY ("waitlistEntryId") REFERENCES "WaitlistEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistSuggestion" ADD CONSTRAINT "WaitlistSuggestion_turmaSlotId_fkey" FOREIGN KEY ("turmaSlotId") REFERENCES "TurmaSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialPendency" ADD CONSTRAINT "FinancialPendency_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialPendency" ADD CONSTRAINT "FinancialPendency_occurrenceEventId_fkey" FOREIGN KEY ("occurrenceEventId") REFERENCES "TurmaOccurrenceEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CsvImportRow" ADD CONSTRAINT "CsvImportRow_csvImportId_fkey" FOREIGN KEY ("csvImportId") REFERENCES "CsvImport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CsvDiffResult" ADD CONSTRAINT "CsvDiffResult_csvImportId_fkey" FOREIGN KEY ("csvImportId") REFERENCES "CsvImport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CsvDiffResult" ADD CONSTRAINT "CsvDiffResult_turmaSlotId_fkey" FOREIGN KEY ("turmaSlotId") REFERENCES "TurmaSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CsvDiffResult" ADD CONSTRAINT "CsvDiffResult_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaAbsenceStreak" ADD CONSTRAINT "TurmaAbsenceStreak_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaAbsenceStreak" ADD CONSTRAINT "TurmaAbsenceStreak_turmaSlotId_fkey" FOREIGN KEY ("turmaSlotId") REFERENCES "TurmaSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaAbsenceStreak" ADD CONSTRAINT "TurmaAbsenceStreak_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "PatientTurmaLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaAbsenceStreak" ADD CONSTRAINT "TurmaAbsenceStreak_lastSeenImportId_fkey" FOREIGN KEY ("lastSeenImportId") REFERENCES "CsvImport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
