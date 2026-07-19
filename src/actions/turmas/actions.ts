"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { isUniqueConstraintError } from "@/lib/errors";
import { toDateOnly } from "@/lib/dates";
import { MODALIDADES_EM_GRUPO, VALOR_MULTA_PADRAO } from "@/lib/constants";
import {
  altaSchema,
  linkSchema,
  ocorrenciaSchema,
  turmaSlotSchema,
} from "@/lib/validation/turma";

export type ActionState = { error?: string } | undefined;

export async function createTurmaSlot(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = turmaSlotSchema.safeParse({
    diaSemana: formData.get("diaSemana"),
    horario: formData.get("horario"),
    professionalId: formData.get("professionalId"),
    tipoAtendimento: formData.get("tipoAtendimento"),
    modalidade: formData.get("modalidade") || "",
    capacidade: formData.get("capacidade") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const data = parsed.data;

  const professional = await prisma.professional.findUnique({
    where: { id: data.professionalId },
  });
  if (!professional) return { error: "Profissional não encontrado." };

  // Atendimento em grupo só existe em Fisioterapia, e só nas modalidades
  // Pilates/Fisioterapia/Acupuntura — reforça no servidor o que o formulário
  // já restringe no cliente.
  if (data.tipoAtendimento === "GRUPO") {
    const grupoPermitido =
      professional.especialidade === "FISIOTERAPIA" &&
      !!data.modalidade &&
      MODALIDADES_EM_GRUPO.includes(data.modalidade as never);
    if (!grupoPermitido) {
      return {
        error:
          "Atendimento em grupo só é permitido em Fisioterapia, nas modalidades Pilates, Fisioterapia ou Acupuntura.",
      };
    }
  }

  const capacidade = data.capacidade
    ? Number(data.capacidade)
    : data.tipoAtendimento === "INDIVIDUAL"
      ? 1
      : null;

  let created;
  try {
    created = await prisma.turmaSlot.create({
      data: {
        diaSemana: data.diaSemana,
        horario: data.horario,
        professionalId: data.professionalId,
        tipoAtendimento: data.tipoAtendimento,
        modalidade: data.modalidade || undefined,
        especialidade: professional.especialidade,
        capacidade,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "Já existe uma turma com esse dia, horário, profissional e tipo de atendimento." };
    }
    throw error;
  }

  revalidatePath("/turmas");
  redirect(`/turmas/${created.id}`);
}

export async function deactivateTurmaSlot(id: string): Promise<void> {
  await prisma.turmaSlot.update({ where: { id }, data: { ativo: false } });
  revalidatePath("/turmas");
  revalidatePath(`/turmas/${id}`);
}

export async function createLink(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = linkSchema.safeParse({
    patientId: formData.get("patientId"),
    turmaSlotId: formData.get("turmaSlotId"),
    dataEntrada: formData.get("dataEntrada"),
    observacoes: formData.get("observacoes") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const data = parsed.data;

  const existingActive = await prisma.patientTurmaLink.findFirst({
    where: {
      patientId: data.patientId,
      turmaSlotId: data.turmaSlotId,
      status: "ATIVO",
    },
  });
  if (existingActive) {
    return { error: "Este paciente já possui um vínculo ativo com essa turma." };
  }

  try {
    await prisma.patientTurmaLink.create({
      data: {
        patientId: data.patientId,
        turmaSlotId: data.turmaSlotId,
        dataEntrada: toDateOnly(data.dataEntrada),
        observacoes: data.observacoes || null,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "Este paciente já possui um vínculo ativo com essa turma." };
    }
    throw error;
  }

  revalidatePath(`/turmas/${data.turmaSlotId}`);
  redirect(`/turmas/${data.turmaSlotId}`);
}

export async function registrarAlta(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = altaSchema.safeParse({
    linkId: formData.get("linkId"),
    dataAlta: formData.get("dataAlta"),
    motivo: formData.get("motivo") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const data = parsed.data;
  const actor = getCurrentUser();

  const link = await prisma.patientTurmaLink.findUnique({
    where: { id: data.linkId },
  });
  if (!link) return { error: "Vínculo não encontrado." };
  if (link.status !== "ATIVO") {
    return { error: "Este vínculo já não está ativo (alta já registrada)." };
  }

  const turmaSlotId = await prisma.$transaction(async (tx) => {
    const alta = await tx.alta.create({
      data: {
        patientId: link.patientId,
        turmaSlotId: link.turmaSlotId,
        dataAlta: toDateOnly(data.dataAlta),
        motivo: data.motivo || null,
        registradoPor: actor,
      },
    });
    const after = await tx.patientTurmaLink.update({
      where: { id: link.id },
      data: {
        status: "ALTA",
        dataSaida: toDateOnly(data.dataAlta),
        altaId: alta.id,
      },
    });
    return after.turmaSlotId;
  });

  revalidatePath(`/turmas/${turmaSlotId}`);
  redirect(`/turmas/${turmaSlotId}`);
}

export async function registrarOcorrencia(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = ocorrenciaSchema.safeParse({
    linkId: formData.get("linkId"),
    data: formData.get("data"),
    status: formData.get("status"),
    motivo: formData.get("motivo") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const input = parsed.data;
  const actor = getCurrentUser();

  const link = await prisma.patientTurmaLink.findUnique({
    where: { id: input.linkId },
    include: { turmaSlot: true },
  });
  if (!link) return { error: "Vínculo não encontrado." };

  if (input.status === "DESMARCADO" && !input.motivo) {
    return { error: "Desmarcação exige um motivo." };
  }

  const dataOnly = toDateOnly(input.data);
  const turmaSlotId = link.turmaSlotId;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.turmaOccurrenceEvent.findUnique({
      where: { linkId_data: { linkId: link.id, data: dataOnly } },
    });

    const event = existing
      ? await tx.turmaOccurrenceEvent.update({
          where: { id: existing.id },
          data: { status: input.status, motivo: input.motivo || null, registradoPor: actor },
        })
      : await tx.turmaOccurrenceEvent.create({
          data: {
            linkId: link.id,
            turmaSlotId: link.turmaSlotId,
            data: dataOnly,
            status: input.status,
            motivo: input.motivo || null,
            registradoPor: actor,
          },
        });

    // Regra financeira (project.md §5.5, conforme protótipo validado): não é
    // cálculo automático de antecedência — só FALTA_INJUSTIFICADA gera multa.
    // Se o status for corrigido para outra coisa depois, a multa (se ainda
    // aberta) é marcada como cancelada — nunca apagada, só deixa de valer.
    const existingPendency = existing
      ? await tx.financialPendency.findUnique({ where: { occurrenceEventId: existing.id } })
      : null;

    if (input.status === "FALTA_INJUSTIFICADA" && !existingPendency) {
      await tx.financialPendency.create({
        data: {
          patientId: link.patientId,
          origem: "FALTA_INJUSTIFICADA",
          occurrenceEventId: event.id,
          valor: VALOR_MULTA_PADRAO,
        },
      });
    } else if (
      input.status !== "FALTA_INJUSTIFICADA" &&
      existingPendency &&
      existingPendency.status === "ABERTA"
    ) {
      await tx.financialPendency.update({
        where: { id: existingPendency.id },
        data: { status: "CANCELADA" },
      });
    }
  });

  revalidatePath(`/turmas/${turmaSlotId}`);
  revalidatePath("/agenda");
  redirect(`/turmas/${turmaSlotId}`);
}
