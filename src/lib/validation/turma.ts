import { z } from "zod";

export const DIA_SEMANA_VALUES = [
  "SEGUNDA",
  "TERCA",
  "QUARTA",
  "QUINTA",
  "SEXTA",
  "SABADO",
  "DOMINGO",
] as const;

export const MODALIDADE_VALUES = [
  "FISIOTERAPIA",
  "PILATES",
  "ACUPUNTURA",
  "VENTOSA",
  "URGENCIA",
  "ENCAIXE",
  "AVALIACAO",
] as const;

export const turmaSlotSchema = z.object({
  diaSemana: z.enum(DIA_SEMANA_VALUES),
  horario: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido (HH:MM)"),
  professionalId: z.string().min(1, "Selecione um profissional"),
  tipoAtendimento: z.enum(["INDIVIDUAL", "GRUPO"]),
  modalidade: z.enum(MODALIDADE_VALUES).optional().or(z.literal("")),
  capacidade: z.string().optional().or(z.literal("")),
  duracaoMinutos: z.string().optional().or(z.literal("")),
});

// Criação permite marcar vários dias de uma vez (uma turma por dia é criada)
// e já matricular pacientes junto, em vez de um dia + uma matrícula por vez.
export const turmaSlotCreateSchema = turmaSlotSchema.omit({ diaSemana: true }).extend({
  diasSemana: z.array(z.enum(DIA_SEMANA_VALUES)).min(1, "Selecione ao menos um dia"),
  patientIds: z.array(z.string()).optional(),
});

export const linkSchema = z.object({
  patientId: z.string().min(1, "Selecione um paciente"),
  turmaSlotId: z.string().min(1),
  observacoes: z.string().optional().or(z.literal("")),
});

export const altaSchema = z.object({
  linkId: z.string().min(1, "Selecione um vínculo"),
  dataAlta: z.string().min(1, "Data da alta é obrigatória"),
  motivo: z.string().optional().or(z.literal("")),
});

export const ocorrenciaSchema = z.object({
  linkId: z.string().min(1, "Selecione um paciente"),
  data: z.string().min(1, "Data é obrigatória"),
  status: z.enum(["CONFIRMADO", "DESMARCADO", "FALTA_JUSTIFICADA", "FALTA_INJUSTIFICADA"]),
  motivo: z.string().optional().or(z.literal("")),
});

export const scheduleSchema = z.object({
  professionalId: z.string().min(1),
  diaSemana: z.enum(DIA_SEMANA_VALUES).optional().or(z.literal("")),
  horaInicio: z.string().optional().or(z.literal("")),
  horaFim: z.string().optional().or(z.literal("")),
  sobDemanda: z.enum(["on"]).optional(),
});

export const ESPECIALIDADE_FILA_VALUES = [
  "FISIOTERAPIA",
  "ODONTOLOGIA",
  "PSICOLOGIA",
] as const;

export const waitlistEntrySchema = z.object({
  patientId: z.string().min(1, "Selecione um paciente"),
  especialidade: z.enum(ESPECIALIDADE_FILA_VALUES),
  dataAvaliacao: z.string().min(1, "Data da avaliação é obrigatória"),
  prioridade: z.string().min(1, "Prioridade é obrigatória"),
  preferenciaDiaSemana: z.enum(DIA_SEMANA_VALUES).optional().or(z.literal("")),
  preferenciaHorario: z.string().optional().or(z.literal("")),
  profissionalResponsavelId: z.string().optional().or(z.literal("")),
  tratamentoIndicado: z.string().min(1, "Tratamento indicado é obrigatório"),
  dentesEnvolvidos: z.string().optional().or(z.literal("")),
  rx: z.enum(["on"]).optional(),
  retratamento: z.enum(["on"]).optional(),
  observacoes: z.string().optional().or(z.literal("")),
});
