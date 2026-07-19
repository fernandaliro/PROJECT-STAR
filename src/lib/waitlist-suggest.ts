import { prisma } from "@/lib/prisma";

export type SuggestionTier = "exato" | "dia_proximo" | "horario_proximo";

export type SuggestionCandidate = {
  turmaSlotId: string;
  tipo: SuggestionTier;
};

type Preferencia = { diaSemana?: string; horario?: string };

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// Regra definida em project.md §10: prioridade por tempo de espera (FIFO);
// primeiro tenta encaixe exato (mesmo dia+horário da preferência, com vaga
// livre); se não houver, sugere horários próximos (mesmo dia, horário
// próximo, ou outro dia no mesmo horário).
export async function findSuggestionsForEntry(
  waitlistEntryId: string
): Promise<SuggestionCandidate[]> {
  const entry = await prisma.waitlistEntry.findUniqueOrThrow({
    where: { id: waitlistEntryId },
  });

  const preferencia = (entry.disponibilidade ?? {}) as Preferencia;

  const candidateSlots = await prisma.turmaSlot.findMany({
    where: {
      ativo: true,
      especialidade: entry.especialidade,
      ...(entry.profissionalResponsavelId
        ? { professionalId: entry.profissionalResponsavelId }
        : {}),
    },
    include: { _count: { select: { links: { where: { status: "ATIVO" } } } } },
  });

  const withVaga = candidateSlots.filter(
    (slot) => slot.capacidade === null || slot._count.links < slot.capacidade
  );

  if (!preferencia.diaSemana && !preferencia.horario) {
    return withVaga.map((slot) => ({ turmaSlotId: slot.id, tipo: "horario_proximo" }));
  }

  const exact = withVaga.filter(
    (slot) =>
      slot.diaSemana === preferencia.diaSemana &&
      slot.horario === preferencia.horario
  );
  if (exact.length > 0) {
    return exact.map((slot) => ({ turmaSlotId: slot.id, tipo: "exato" }));
  }

  const sameDay = preferencia.diaSemana
    ? withVaga
        .filter((slot) => slot.diaSemana === preferencia.diaSemana)
        .sort((a, b) => {
          if (!preferencia.horario) return 0;
          return (
            Math.abs(timeToMinutes(a.horario) - timeToMinutes(preferencia.horario)) -
            Math.abs(timeToMinutes(b.horario) - timeToMinutes(preferencia.horario))
          );
        })
    : [];

  const sameHorario = preferencia.horario
    ? withVaga.filter(
        (slot) =>
          slot.horario === preferencia.horario &&
          slot.diaSemana !== preferencia.diaSemana
      )
    : [];

  const seen = new Set<string>();
  const near: SuggestionCandidate[] = [];
  for (const slot of sameDay) {
    if (seen.has(slot.id)) continue;
    seen.add(slot.id);
    near.push({ turmaSlotId: slot.id, tipo: "dia_proximo" });
  }
  for (const slot of sameHorario) {
    if (seen.has(slot.id)) continue;
    seen.add(slot.id);
    near.push({ turmaSlotId: slot.id, tipo: "horario_proximo" });
  }

  return near;
}
