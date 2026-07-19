import { prisma } from "@/lib/prisma";
import { toDateOnly, formatDateOnly, diaSemanaFromDate, addDays } from "@/lib/dates";

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

// Quantos atendimentos (vínculos ativos menos quem desmarcou/faltou naquele
// dia específico) cada dia do intervalo [gridStart, gridEndExclusive) tem —
// usado na visão Mensal. Duas consultas só (nunca uma por dia/turma):
// contagem de vínculos ativos por turma + eventos não-confirmados no
// intervalo, o resto é aritmética em memória.
export async function getMonthAttendanceCounts(
  turmaSlots: { id: string; diaSemana: string }[],
  gridStart: Date,
  gridEndExclusive: Date
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (turmaSlots.length === 0) return result;
  const turmaSlotIds = turmaSlots.map((s) => s.id);

  const [linkCounts, nonConfirmedCounts] = await Promise.all([
    prisma.patientTurmaLink.groupBy({
      by: ["turmaSlotId"],
      where: { turmaSlotId: { in: turmaSlotIds }, status: "ATIVO" },
      _count: true,
    }),
    prisma.turmaOccurrenceEvent.groupBy({
      by: ["turmaSlotId", "data"],
      where: {
        turmaSlotId: { in: turmaSlotIds },
        status: { not: "CONFIRMADO" },
        data: { gte: gridStart, lt: gridEndExclusive },
      },
      _count: true,
    }),
  ]);

  const baseCountByTurma = new Map(linkCounts.map((row) => [row.turmaSlotId, row._count]));
  const nonConfirmedByTurmaDate = new Map(
    nonConfirmedCounts.map((row) => [`${row.turmaSlotId}|${formatDateOnly(row.data)}`, row._count])
  );

  const byDia = new Map<string, string[]>();
  for (const slot of turmaSlots) {
    const list = byDia.get(slot.diaSemana) ?? [];
    list.push(slot.id);
    byDia.set(slot.diaSemana, list);
  }

  for (let cursor = gridStart; cursor < gridEndExclusive; cursor = addDays(cursor, 1)) {
    const dateStr = formatDateOnly(cursor);
    const dia = diaSemanaFromDate(cursor);
    const idsForDia = byDia.get(dia) ?? [];
    let total = 0;
    for (const id of idsForDia) {
      const base = baseCountByTurma.get(id) ?? 0;
      const naoConfirmados = nonConfirmedByTurmaDate.get(`${id}|${dateStr}`) ?? 0;
      total += Math.max(0, base - naoConfirmados);
    }
    result.set(dateStr, total);
  }
  return result;
}
