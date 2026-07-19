"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  abonoSchema,
  cobrancaSchema,
  justificativaSchema,
} from "@/lib/validation/financeiro";

export type ActionState = { error?: string } | undefined;

export async function markJustificativaRecebida(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = justificativaSchema.safeParse({
    pendencyId: formData.get("pendencyId"),
    justificativaDescricao: formData.get("justificativaDescricao"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const data = parsed.data;

  await prisma.financialPendency.update({
    where: { id: data.pendencyId },
    data: {
      justificativaRecebida: true,
      justificativaDescricao: data.justificativaDescricao,
      status: "JUSTIFICADA",
    },
  });

  revalidatePath("/financeiro");
}

export async function markPaga(pendencyId: string): Promise<void> {
  await prisma.financialPendency.update({
    where: { id: pendencyId },
    data: { status: "PAGA", dataQuitacao: new Date() },
  });
  revalidatePath("/financeiro");
}

export async function markAbonada(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = abonoSchema.safeParse({
    pendencyId: formData.get("pendencyId"),
    abonoAprovadoPor: formData.get("abonoAprovadoPor"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const data = parsed.data;

  await prisma.financialPendency.update({
    where: { id: data.pendencyId },
    data: {
      status: "ABONADA",
      abonoAprovadoPor: data.abonoAprovadoPor,
      abonoAprovadoEm: new Date(),
    },
  });

  revalidatePath("/financeiro");
}

export async function updateCobranca(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = cobrancaSchema.safeParse({
    pendencyId: formData.get("pendencyId"),
    canalCobranca: formData.get("canalCobranca"),
    statusCobranca: formData.get("statusCobranca") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const data = parsed.data;

  await prisma.financialPendency.update({
    where: { id: data.pendencyId },
    data: {
      canalCobranca: data.canalCobranca,
      statusCobranca: data.statusCobranca || null,
    },
  });

  revalidatePath("/financeiro");
}
