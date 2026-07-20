const JS_DAY_TO_ENUM = [
  "DOMINGO",
  "SEGUNDA",
  "TERCA",
  "QUARTA",
  "QUINTA",
  "SEXTA",
  "SABADO",
] as const;

// Datas de ocorrência/vigência são tratadas como "date-only" (sem componente
// de hora) para evitar bugs de fuso horário — sempre normalizadas para
// meia-noite UTC do dia informado.
export function toDateOnly(input: string | Date): Date {
  if (typeof input === "string") {
    const [y, m, d] = input.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }
  return new Date(
    Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate())
  );
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function diaSemanaFromDate(date: Date): (typeof JS_DAY_TO_ENUM)[number] {
  return JS_DAY_TO_ENUM[date.getUTCDay()];
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function startOfWeek(date: Date): Date {
  const dow = date.getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  return addDays(date, diff);
}

// Lista de horários de meia em meia hora entre start e end (inclusive),
// formato "HH:MM" — usada pra popular o select de horário de início a partir
// do expediente cadastrado do profissional.
export function generateTimeSlots(start: string, end: string): string[] {
  const slots: string[] = [];
  let [h, m] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let guard = 0;
  while ((h < eh || (h === eh && m <= em)) && guard < 100) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += 30;
    if (m >= 60) {
      m = 0;
      h += 1;
    }
    guard += 1;
  }
  return slots;
}
