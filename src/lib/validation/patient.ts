import { z } from "zod";

export const patientSchema = z.object({
  matriculaSigop: z.string().trim().min(1, "Matrícula é obrigatória"),
  nomeCompleto: z.string().trim().min(3, "Nome completo é obrigatório"),
  status: z.enum(["ATIVO", "INATIVO"]).default("ATIVO"),
  observacoes: z.string().trim().optional().or(z.literal("")),
});

export type PatientInput = z.infer<typeof patientSchema>;
