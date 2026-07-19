import { prisma } from "@/lib/prisma";
import { toDateOnly } from "@/lib/dates";

// Nome da turma nunca é persistido — sempre computado a partir dos vínculos
// ativos, ordenados por data de entrada (project.md §7, §11). Versão em lote
// (uma consulta só, não uma por turma) para telas que listam várias turmas.
export async function computeTurmaNamesForSlots(
  turmaSlotIds: string[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (turmaSlotIds.length === 0) return result;

  const links = await prisma.patientTurmaLink.findMany({
    where: { turmaSlotId: { in: turmaSlotIds }, status: "ATIVO" },
    include: { patient: true },
    orderBy: { dataEntrada: "asc" },
  });

  const byTurma = new Map<string, string[]>();
  for (const link of links) {
    const list = byTurma.get(link.turmaSlotId) ?? [];
    list.push(link.patient.nomeCompleto);
    byTurma.set(link.turmaSlotId, list);
  }

  for (const turmaSlotId of turmaSlotIds) {
    const nomes = byTurma.get(turmaSlotId);
    result.set(
      turmaSlotId,
      nomes && nomes.length > 0
        ? `Trat. Grupo - ${nomes.join(" | ")}`
        : "Trat. Grupo - (sem pacientes)"
    );
  }
  return result;
}

export async function computeTurmaName(turmaSlotId: string): Promise<string> {
  const result = await computeTurmaNamesForSlots([turmaSlotId]);
  return result.get(turmaSlotId) ?? "Trat. Grupo - (sem pacientes)";
}

// Lista de atendimento do dia: vínculos ativos, excluindo quem desmarcou ou
// faltou especificamente nessa data (sem alterar o vínculo permanente).
// Versão em lote para telas que mostram várias turmas do mesmo dia.
export async function getAttendanceListsForDate(
  turmaSlotIds: string[],
  date: Date | string
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>(turmaSlotIds.map((id) => [id, []]));
  if (turmaSlotIds.length === 0) return result;

  const dateOnly = toDateOnly(date);
  const links = await prisma.patientTurmaLink.findMany({
    where: { turmaSlotId: { in: turmaSlotIds }, status: "ATIVO" },
    include: {
      patient: true,
      occurrenceEvents: { where: { data: dateOnly } },
    },
    orderBy: { dataEntrada: "asc" },
  });

  for (const link of links) {
    if (link.occurrenceEvents.some((event) => event.status !== "CONFIRMADO")) continue;
    result.get(link.turmaSlotId)?.push(link.patient.nomeCompleto);
  }
  return result;
}

export async function getAttendanceListForDate(
  turmaSlotId: string,
  date: Date | string
): Promise<string[]> {
  const result = await getAttendanceListsForDate([turmaSlotId], date);
  return result.get(turmaSlotId) ?? [];
}

export type DayRosterEntry = {
  linkId: string;
  patientId: string;
  patientName: string;
  matriculaSigop: string;
  status: "CONFIRMADO" | "DESMARCADO" | "FALTA_JUSTIFICADA" | "FALTA_INJUSTIFICADA";
  motivo: string | null;
  conferidoSigop: boolean;
};

// Lista de vínculos ativos de uma turma numa data, já com o status do dia
// (padrão CONFIRMADO quando não há evento registrado) e a marcação de
// conferência com o SIGOP — usada na visão "Dia" da agenda.
export async function getDayRosterForSlots(
  turmaSlotIds: string[],
  date: Date | string
): Promise<Map<string, DayRosterEntry[]>> {
  const result = new Map<string, DayRosterEntry[]>(turmaSlotIds.map((id) => [id, []]));
  if (turmaSlotIds.length === 0) return result;

  const dateOnly = toDateOnly(date);
  const links = await prisma.patientTurmaLink.findMany({
    where: { turmaSlotId: { in: turmaSlotIds }, status: "ATIVO" },
    include: {
      patient: true,
      occurrenceEvents: { where: { data: dateOnly } },
    },
    orderBy: { dataEntrada: "asc" },
  });

  for (const link of links) {
    const event = link.occurrenceEvents[0];
    result.get(link.turmaSlotId)?.push({
      linkId: link.id,
      patientId: link.patientId,
      patientName: link.patient.nomeCompleto,
      matriculaSigop: link.patient.matriculaSigop,
      status: event?.status ?? "CONFIRMADO",
      motivo: event?.motivo ?? null,
      conferidoSigop: event?.conferidoSigop ?? false,
    });
  }
  return result;
}
