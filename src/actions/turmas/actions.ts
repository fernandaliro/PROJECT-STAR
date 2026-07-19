"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { isUniqueConstraintError } from "@/lib/errors";
import { toDateOnly } from "@/lib/dates";
import { DIA_SEMANA_LABEL, MODALIDADES_EM_GRUPO, VALOR_MULTA_PADRAO } from "@/lib/constants";
import {
  altaSchema,
  linkSchema,
  ocorrenciaSchema,
  turmaSlotSchema,
  turmaSlotCreateSchema,
} from "@/lib/validation/turma";

export type ActionState = { error?: string } | undefined;

// Cria uma turma por dia da semana marcado (mesmo horário/profissional/tipo),
// e já matricula os pacientes selecionados em todas elas — resolve de uma vez
// o que antes exigia criar dia por dia e matricular paciente por paciente.
export async function createTurmaSlot(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = turmaSlotCreateSchema.safeParse({
    diasSemana: formData.getAll("diaSemana"),
    horario: formData.get("horario"),
    professionalId: formData.get("professionalId"),
    tipoAtendimento: formData.get("tipoAtendimento"),
    modalidade: formData.get("modalidade") || "",
    capacidade: formData.get("capacidade") || "",
    duracaoMinutos: formData.get("duracaoMinutos") || "",
    patientIds: formData.getAll("patientIds"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const data = parsed.data;

  const professional = await prisma.professional.findUnique({
    where: { id: data.professionalId },
  });
  if (!professional) return { error: "Profissional não encontrado." };

  const grupoError = validarGrupoPermitido(professional.especialidade, data.tipoAtendimento, data.modalidade);
  if (grupoError) return { error: grupoError };

  const capacidade = data.capacidade
    ? Number(data.capacidade)
    : data.tipoAtendimento === "INDIVIDUAL"
      ? 1
      : null;
  const duracaoMinutos = data.duracaoMinutos ? Number(data.duracaoMinutos) : null;

  const conflitos = await prisma.turmaSlot.findMany({
    where: {
      professionalId: data.professionalId,
      horario: data.horario,
      tipoAtendimento: data.tipoAtendimento,
      diaSemana: { in: data.diasSemana },
    },
  });
  if (conflitos.length > 0) {
    const dias = conflitos.map((c) => DIA_SEMANA_LABEL[c.diaSemana]).join(", ");
    return {
      error: `Já existe uma turma com esse profissional, horário e tipo em: ${dias}.`,
    };
  }

  let firstId: string;
  try {
    firstId = await prisma.$transaction(async (tx) => {
      const slotIds: string[] = [];
      for (const dia of data.diasSemana) {
        const slot = await tx.turmaSlot.create({
          data: {
            diaSemana: dia,
            horario: data.horario,
            professionalId: data.professionalId,
            tipoAtendimento: data.tipoAtendimento,
            modalidade: data.modalidade || undefined,
            especialidade: professional.especialidade,
            capacidade,
            duracaoMinutos,
          },
        });
        slotIds.push(slot.id);
      }
      if (data.patientIds && data.patientIds.length > 0) {
        const dataEntrada = toDateOnly(new Date());
        for (const turmaSlotId of slotIds) {
          for (const patientId of data.patientIds) {
            await tx.patientTurmaLink.create({
              data: { patientId, turmaSlotId, dataEntrada },
            });
          }
        }
      }
      return slotIds[0];
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "Já existe uma turma com esse dia, horário, profissional e tipo de atendimento." };
    }
    throw error;
  }

  revalidatePath("/turmas");
  redirect(`/turmas/${firstId}`);
}

function validarGrupoPermitido(
  especialidade: string,
  tipoAtendimento: string,
  modalidade: string | undefined
): string | null {
  if (tipoAtendimento !== "GRUPO") return null;
  const grupoPermitido =
    especialidade === "FISIOTERAPIA" &&
    !!modalidade &&
    MODALIDADES_EM_GRUPO.includes(modalidade as never);
  if (!grupoPermitido) {
    return "Atendimento em grupo só é permitido em Fisioterapia, nas modalidades Pilates, Fisioterapia ou Acupuntura.";
  }
  return null;
}

export async function updateTurmaSlot(
  id: string,
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
    duracaoMinutos: formData.get("duracaoMinutos") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const data = parsed.data;

  const professional = await prisma.professional.findUnique({
    where: { id: data.professionalId },
  });
  if (!professional) return { error: "Profissional não encontrado." };

  const grupoError = validarGrupoPermitido(professional.especialidade, data.tipoAtendimento, data.modalidade);
  if (grupoError) return { error: grupoError };

  const capacidade = data.capacidade
    ? Number(data.capacidade)
    : data.tipoAtendimento === "INDIVIDUAL"
      ? 1
      : null;
  const duracaoMinutos = data.duracaoMinutos ? Number(data.duracaoMinutos) : null;

  try {
    await prisma.turmaSlot.update({
      where: { id },
      data: {
        diaSemana: data.diaSemana,
        horario: data.horario,
        professionalId: data.professionalId,
        tipoAtendimento: data.tipoAtendimento,
        modalidade: data.modalidade || null,
        especialidade: professional.especialidade,
        capacidade,
        duracaoMinutos,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: "Já existe uma turma com esse dia, horário, profissional e tipo de atendimento." };
    }
    throw error;
  }

  revalidatePath("/turmas");
  revalidatePath(`/turmas/${id}`);
  redirect(`/turmas/${id}`);
}

export async function deactivateTurmaSlot(id: string): Promise<void> {
  await prisma.turmaSlot.update({ where: { id }, data: { ativo: false } });
  revalidatePath("/turmas");
  revalidatePath(`/turmas/${id}`);
}

export async function deleteTurmaSlot(
  id: string,
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const [links, altas, occurrenceEvents, csvDiffResults, absenceStreaks, waitlistSuggestions] =
    await Promise.all([
      prisma.patientTurmaLink.count({ where: { turmaSlotId: id } }),
      prisma.alta.count({ where: { turmaSlotId: id } }),
      prisma.turmaOccurrenceEvent.count({ where: { turmaSlotId: id } }),
      prisma.csvDiffResult.count({ where: { turmaSlotId: id } }),
      prisma.turmaAbsenceStreak.count({ where: { turmaSlotId: id } }),
      prisma.waitlistSuggestion.count({ where: { turmaSlotId: id } }),
    ]);

  const temHistorico =
    links > 0 ||
    altas > 0 ||
    occurrenceEvents > 0 ||
    csvDiffResults > 0 ||
    absenceStreaks > 0 ||
    waitlistSuggestions > 0;
  if (temHistorico) {
    return {
      error:
        "Esta turma tem pacientes vinculados, altas, ocorrências ou outro histórico registrado — não pode ser excluída. Use \"Desativar turma\" para removê-la das listas ativas mantendo o histórico.",
    };
  }

  await prisma.turmaSlot.delete({ where: { id } });
  revalidatePath("/turmas");
  redirect("/turmas");
}

export async function createLink(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = linkSchema.safeParse({
    patientId: formData.get("patientId"),
    turmaSlotId: formData.get("turmaSlotId"),
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
        dataEntrada: toDateOnly(new Date()),
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

// Matriculou o paciente errado por engano: remove o vínculo de verdade, mas só
// se ele ainda não tiver nenhuma ocorrência/falta registrada nem alta — nesses
// casos já é histórico de verdade, e o caminho correto é "Registrar alta".
export async function removerVinculo(
  linkId: string,
  _prevState: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const link = await prisma.patientTurmaLink.findUnique({ where: { id: linkId } });
  if (!link) return { error: "Vínculo não encontrado." };

  const [occurrenceEvents, absenceStreak] = await Promise.all([
    prisma.turmaOccurrenceEvent.count({ where: { linkId } }),
    prisma.turmaAbsenceStreak.findUnique({ where: { linkId } }),
  ]);

  if (link.status === "ALTA" || occurrenceEvents > 0 || absenceStreak) {
    return {
      error:
        "Este vínculo já tem histórico (ocorrência registrada ou alta) — não pode ser removido. Se foi um erro de matrícula sem nenhum atendimento ainda, use \"Registrar alta\" para encerrar.",
    };
  }

  await prisma.patientTurmaLink.delete({ where: { id: linkId } });
  revalidatePath(`/turmas/${link.turmaSlotId}`);
  redirect(`/turmas/${link.turmaSlotId}`);
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

// Checkbox manual "já bati esse paciente/dia com o SIGOP" — independente do
// status de presença. Cria o evento do dia como CONFIRMADO se ainda não
// existir (mesma regra implícita usada na leitura: sem evento = confirmado).
export async function toggleConferidoSigop(
  linkId: string,
  data: string
): Promise<void> {
  const actor = getCurrentUser();
  const link = await prisma.patientTurmaLink.findUnique({ where: { id: linkId } });
  if (!link) return;

  const dataOnly = toDateOnly(data);
  const existing = await prisma.turmaOccurrenceEvent.findUnique({
    where: { linkId_data: { linkId, data: dataOnly } },
  });

  if (existing) {
    await prisma.turmaOccurrenceEvent.update({
      where: { id: existing.id },
      data: { conferidoSigop: !existing.conferidoSigop },
    });
  } else {
    await prisma.turmaOccurrenceEvent.create({
      data: {
        linkId,
        turmaSlotId: link.turmaSlotId,
        data: dataOnly,
        status: "CONFIRMADO",
        conferidoSigop: true,
        registradoPor: actor,
      },
    });
  }

  revalidatePath("/agenda");
  revalidatePath(`/turmas/${link.turmaSlotId}`);
}

type OcorrenciaStatus = "CONFIRMADO" | "DESMARCADO" | "FALTA_JUSTIFICADA" | "FALTA_INJUSTIFICADA";

async function upsertOcorrencia(
  linkId: string,
  dataOnly: Date,
  status: OcorrenciaStatus,
  motivo: string | null,
  actor: string
): Promise<{ turmaSlotId: string }> {
  const link = await prisma.patientTurmaLink.findUnique({ where: { id: linkId } });
  if (!link) throw new Error("Vínculo não encontrado.");

  await prisma.$transaction(async (tx) => {
    const existing = await tx.turmaOccurrenceEvent.findUnique({
      where: { linkId_data: { linkId: link.id, data: dataOnly } },
    });

    const event = existing
      ? await tx.turmaOccurrenceEvent.update({
          where: { id: existing.id },
          data: { status, motivo: motivo || null, registradoPor: actor },
        })
      : await tx.turmaOccurrenceEvent.create({
          data: {
            linkId: link.id,
            turmaSlotId: link.turmaSlotId,
            data: dataOnly,
            status,
            motivo: motivo || null,
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

    if (status === "FALTA_INJUSTIFICADA" && !existingPendency) {
      await tx.financialPendency.create({
        data: {
          patientId: link.patientId,
          origem: "FALTA_INJUSTIFICADA",
          occurrenceEventId: event.id,
          valor: VALOR_MULTA_PADRAO,
        },
      });
    } else if (
      status !== "FALTA_INJUSTIFICADA" &&
      existingPendency &&
      existingPendency.status === "ABERTA"
    ) {
      await tx.financialPendency.update({
        where: { id: existingPendency.id },
        data: { status: "CANCELADA" },
      });
    }
  });

  return { turmaSlotId: link.turmaSlotId };
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

  if (input.status === "DESMARCADO" && !input.motivo) {
    return { error: "Desmarcação exige um motivo." };
  }

  const actor = getCurrentUser();
  let turmaSlotId: string;
  try {
    ({ turmaSlotId } = await upsertOcorrencia(
      input.linkId,
      toDateOnly(input.data),
      input.status,
      input.motivo || null,
      actor
    ));
  } catch {
    return { error: "Vínculo não encontrado." };
  }

  revalidatePath(`/turmas/${turmaSlotId}`);
  revalidatePath("/agenda");
  redirect(`/turmas/${turmaSlotId}`);
}

// Variante sem redirect, usada no dropdown inline da visão "Dia" da agenda —
// o usuário permanece na mesma tela ao trocar o status de um paciente.
export async function setOcorrenciaStatusInline(
  linkId: string,
  data: string,
  status: OcorrenciaStatus
): Promise<void> {
  const actor = getCurrentUser();
  const { turmaSlotId } = await upsertOcorrencia(linkId, toDateOnly(data), status, null, actor);
  revalidatePath("/agenda");
  revalidatePath(`/turmas/${turmaSlotId}`);
}
