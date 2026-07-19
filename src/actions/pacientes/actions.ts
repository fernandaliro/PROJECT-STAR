"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizeName, searchableName } from "@/lib/names";
import { patientSchema } from "@/lib/validation/patient";

export type ActionState = { error?: string } | undefined;

export async function createPatient(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = patientSchema.safeParse({
    matriculaSigop: formData.get("matriculaSigop"),
    nomeCompleto: formData.get("nomeCompleto"),
    status: formData.get("status") || "ATIVO",
    observacoes: formData.get("observacoes") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const data = parsed.data;

  const existing = await prisma.patient.findUnique({
    where: { matriculaSigop: data.matriculaSigop },
  });
  if (existing) {
    return { error: "Já existe um paciente com essa matrícula SIGOP." };
  }

  const nomeCompleto = normalizeName(data.nomeCompleto);
  const created = await prisma.patient.create({
    data: {
      matriculaSigop: data.matriculaSigop,
      nomeCompleto,
      nomeNormalizado: searchableName(nomeCompleto),
      status: data.status,
      observacoes: data.observacoes || null,
    },
  });

  revalidatePath("/pacientes");
  redirect(`/pacientes/${created.id}`);
}

export async function updatePatient(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = patientSchema.safeParse({
    matriculaSigop: formData.get("matriculaSigop"),
    nomeCompleto: formData.get("nomeCompleto"),
    status: formData.get("status") || "ATIVO",
    observacoes: formData.get("observacoes") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const data = parsed.data;

  const duplicate = await prisma.patient.findUnique({
    where: { matriculaSigop: data.matriculaSigop },
  });
  if (duplicate && duplicate.id !== id) {
    return { error: "Já existe outro paciente com essa matrícula SIGOP." };
  }

  const nomeCompleto = normalizeName(data.nomeCompleto);
  await prisma.patient.update({
    where: { id },
    data: {
      matriculaSigop: data.matriculaSigop,
      nomeCompleto,
      nomeNormalizado: searchableName(nomeCompleto),
      status: data.status,
      observacoes: data.observacoes || null,
    },
  });

  revalidatePath("/pacientes");
  revalidatePath(`/pacientes/${id}`);
  redirect(`/pacientes/${id}`);
}

export async function deactivatePatient(id: string): Promise<void> {
  await prisma.patient.update({ where: { id }, data: { status: "INATIVO" } });
  revalidatePath("/pacientes");
  revalidatePath(`/pacientes/${id}`);
}

export async function reactivatePatient(id: string): Promise<void> {
  await prisma.patient.update({ where: { id }, data: { status: "ATIVO" } });
  revalidatePath("/pacientes");
  revalidatePath(`/pacientes/${id}`);
}
