"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isUniqueConstraintError } from "@/lib/errors";
import { toDateOnly } from "@/lib/dates";
import { findSuggestionsForEntry } from "@/lib/waitlist-suggest";
import { waitlistEntrySchema } from "@/lib/validation/turma";

export type ActionState = { error?: string } | undefined;

export async function createWaitlistEntry(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = waitlistEntrySchema.safeParse({
    patientId: formData.get("patientId"),
    especialidade: formData.get("especialidade"),
    dataAvaliacao: formData.get("dataAvaliacao"),
    prioridade: formData.get("prioridade"),
    preferenciaDiaSemana: formData.get("preferenciaDiaSemana") || "",
    preferenciaHorario: formData.get("preferenciaHorario") || "",
    profissionalResponsavelId: formData.get("profissionalResponsavelId") || "",
    tratamentoIndicado: formData.get("tratamentoIndicado"),
    dentesEnvolvidos: formData.get("dentesEnvolvidos") || "",
    rx: formData.get("rx") || undefined,
    retratamento: formData.get("retratamento") || undefined,
    observacoes: formData.get("observacoes") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const data = parsed.data;

  const created = await prisma.waitlistEntry.create({
    data: {
      patientId: data.patientId,
      especialidade: data.especialidade,
      dataAvaliacao: toDateOnly(data.dataAvaliacao),
      prioridade: Number(data.prioridade),
      disponibilidade: {
        diaSemana: data.preferenciaDiaSemana || undefined,
        horario: data.preferenciaHorario || undefined,
      },
      profissionalResponsavelId: data.profissionalResponsavelId || null,
      tratamentoIndicado: data.tratamentoIndicado,
      dentesEnvolvidos: data.dentesEnvolvidos || null,
      rx: data.especialidade === "ODONTOLOGIA" ? data.rx === "on" : null,
      retratamento:
        data.especialidade === "ODONTOLOGIA" ? data.retratamento === "on" : null,
      observacoes: data.observacoes || null,
    },
  });

  revalidatePath("/fila-espera");
  redirect(`/fila-espera/${created.id}`);
}

export async function updateWaitlistStatus(
  id: string,
  status: "CONTATADO" | "DESISTIU" | "AGUARDANDO"
): Promise<void> {
  await prisma.waitlistEntry.update({ where: { id }, data: { status } });
  revalidatePath("/fila-espera");
  revalidatePath(`/fila-espera/${id}`);
}

export async function runSuggestion(waitlistEntryId: string): Promise<void> {
  const candidates = await findSuggestionsForEntry(waitlistEntryId);

  await prisma.$transaction(async (tx) => {
    for (const candidate of candidates) {
      const existing = await tx.waitlistSuggestion.findFirst({
        where: {
          waitlistEntryId,
          turmaSlotId: candidate.turmaSlotId,
          aceito: null,
        },
      });
      if (existing) continue;
      await tx.waitlistSuggestion.create({
        data: {
          waitlistEntryId,
          turmaSlotId: candidate.turmaSlotId,
          tipo: candidate.tipo,
        },
      });
    }
  });

  revalidatePath(`/fila-espera/${waitlistEntryId}`);
}

export async function acceptSuggestion(
  suggestionId: string,
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const suggestion = await prisma.waitlistSuggestion.findUnique({
    where: { id: suggestionId },
    include: { waitlistEntry: true },
  });
  if (!suggestion) return { error: "Sugestão não encontrada." };

  const existingActive = await prisma.patientTurmaLink.findFirst({
    where: {
      patientId: suggestion.waitlistEntry.patientId,
      turmaSlotId: suggestion.turmaSlotId,
      status: "ATIVO",
    },
  });
  if (existingActive) {
    return { error: "Paciente já possui vínculo ativo com essa turma." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.patientTurmaLink.create({
        data: {
          patientId: suggestion.waitlistEntry.patientId,
          turmaSlotId: suggestion.turmaSlotId,
          dataEntrada: new Date(),
        },
      });
      await tx.waitlistSuggestion.update({
        where: { id: suggestionId },
        data: { aceito: true },
      });
      await tx.waitlistEntry.update({
        where: { id: suggestion.waitlistEntry.id },
        data: { status: "AGENDADO" },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "Paciente já possui vínculo ativo com essa turma." };
    }
    throw error;
  }

  revalidatePath(`/fila-espera/${suggestion.waitlistEntryId}`);
  revalidatePath("/fila-espera");
  redirect(`/fila-espera/${suggestion.waitlistEntryId}`);
}

export async function rejectSuggestion(suggestionId: string): Promise<void> {
  const suggestion = await prisma.waitlistSuggestion.update({
    where: { id: suggestionId },
    data: { aceito: false },
  });
  revalidatePath(`/fila-espera/${suggestion.waitlistEntryId}`);
}
