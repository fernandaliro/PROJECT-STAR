import { z } from "zod";

export const justificativaSchema = z.object({
  pendencyId: z.string().min(1),
  justificativaDescricao: z.string().trim().min(1, "Descreva a justificativa"),
});

export const abonoSchema = z.object({
  pendencyId: z.string().min(1),
  abonoAprovadoPor: z.string().trim().min(1, "Informe quem aprovou o abono"),
});

export const cobrancaSchema = z.object({
  pendencyId: z.string().min(1),
  canalCobranca: z.enum(["TEAMS", "EMAIL", "PRESENCIAL", "OUTRO"]),
  statusCobranca: z.string().optional().or(z.literal("")),
});
