"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { scheduleSchema } from "@/lib/validation/turma";

export type ActionState = { error?: string } | undefined;

export async function createSchedule(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = scheduleSchema.safeParse({
    professionalId: formData.get("professionalId"),
    diaSemana: formData.get("diaSemana") || "",
    horaInicio: formData.get("horaInicio") || "",
    horaFim: formData.get("horaFim") || "",
    sobDemanda: formData.get("sobDemanda") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const data = parsed.data;
  const sobDemanda = data.sobDemanda === "on";
  if (!sobDemanda && !data.diaSemana) {
    return { error: "Selecione um dia da semana ou marque \"sob demanda\"." };
  }

  await prisma.professionalSchedule.create({
    data: {
      professionalId: data.professionalId,
      diaSemana: sobDemanda ? null : data.diaSemana || null,
      horaInicio: sobDemanda ? null : data.horaInicio || null,
      horaFim: sobDemanda ? null : data.horaFim || null,
      sobDemanda,
    },
  });

  revalidatePath("/escalas");
}

export async function deactivateSchedule(id: string): Promise<void> {
  await prisma.professionalSchedule.update({ where: { id }, data: { ativo: false } });
  revalidatePath("/escalas");
}
