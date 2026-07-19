"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { VALOR_MULTA_PADRAO } from "@/lib/constants";
import { processCsvImport } from "@/lib/csv/process";

export type ActionState = { error?: string } | undefined;

export async function importCsv(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const file = formData.get("file");
  const professionalId = String(formData.get("professionalId") ?? "");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo CSV." };
  }
  if (!professionalId) {
    return { error: "Selecione o profissional dono desta agenda." };
  }

  const rawText = await file.text();
  const actor = getCurrentUser();

  const csvImportId = await prisma.$transaction(
    (tx) => processCsvImport(tx, { arquivoNome: file.name, actor, rawText, professionalId }),
    { timeout: 60000, maxWait: 15000 }
  );

  revalidatePath("/csv-import");
  redirect(`/csv-import/${csvImportId}`);
}

// Falta importada do CSV fica pendente de classificação humana (o SIGOP só
// diz QUE faltou, não se foi justificada) — só aqui a ocorrência é de fato
// criada, e só INJUSTIFICADA gera multa.
export async function classifyFaltaFromImport(
  diffResultId: string,
  classification: "FALTA_JUSTIFICADA" | "FALTA_INJUSTIFICADA"
): Promise<void> {
  const actor = getCurrentUser();
  await prisma.$transaction(async (tx) => {
    const diff = await tx.csvDiffResult.findUniqueOrThrow({ where: { id: diffResultId } });
    const detalhe = (diff.detalhe ?? {}) as { data?: string; linkId?: string };
    if (!detalhe.linkId || !detalhe.data || !diff.patientId) return;

    const event = await tx.turmaOccurrenceEvent.create({
      data: {
        linkId: detalhe.linkId,
        turmaSlotId: diff.turmaSlotId!,
        data: new Date(detalhe.data),
        status: classification,
        registradoPor: actor,
        origemImportId: diff.csvImportId,
      },
    });

    if (classification === "FALTA_INJUSTIFICADA") {
      await tx.financialPendency.create({
        data: {
          patientId: diff.patientId,
          origem: "FALTA_INJUSTIFICADA",
          occurrenceEventId: event.id,
          valor: VALOR_MULTA_PADRAO,
        },
      });
    }

    await tx.csvDiffResult.update({
      where: { id: diffResultId },
      data: { resolvido: true, resolvidoEm: new Date(), resolvidoPor: actor },
    });
  });
  revalidatePath("/csv-import");
}

export async function resolveDiffResult(diffResultId: string): Promise<void> {
  const actor = getCurrentUser();
  await prisma.csvDiffResult.update({
    where: { id: diffResultId },
    data: { resolvido: true, resolvidoEm: new Date(), resolvidoPor: actor },
  });
  revalidatePath("/csv-import");
}

export async function includePacienteNovo(diffResultId: string): Promise<void> {
  const actor = getCurrentUser();
  await prisma.$transaction(async (tx) => {
    const diff = await tx.csvDiffResult.findUniqueOrThrow({ where: { id: diffResultId } });
    if (!diff.turmaSlotId || !diff.patientId) return;

    const existingActive = await tx.patientTurmaLink.findFirst({
      where: { patientId: diff.patientId, turmaSlotId: diff.turmaSlotId, status: "ATIVO" },
    });
    if (!existingActive) {
      await tx.patientTurmaLink.create({
        data: {
          patientId: diff.patientId,
          turmaSlotId: diff.turmaSlotId,
          dataEntrada: new Date(),
        },
      });
    }

    await tx.csvDiffResult.update({
      where: { id: diffResultId },
      data: { resolvido: true, resolvidoEm: new Date(), resolvidoPor: actor },
    });
  });
  revalidatePath("/csv-import");
}
