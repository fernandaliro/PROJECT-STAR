import { toDateOnly } from "@/lib/dates";

// Formato real de exportação do SIGOP (validado em protótipo anterior):
// arquivo por profissional, separado por ";", datas DD/MM/AAAA, cabeçalhos em
// português. "Nome do Grupo" é capturado mas nunca usado pra decidir
// composição de turma (campo digitado manualmente no SIGOP, fica
// desatualizado — project.md §11).
export type ParsedCsvRow = {
  numeroLinha: number;
  conteudoBruto: Record<string, string>;
  status: "VALIDA" | "DESCARTADA_MALFORMADA";
  motivoDescarte?: string;
  matriculaSigop?: string;
  nomePaciente?: string;
  data?: Date;
  horario?: string;
  nomeGrupo?: string;
  statusAgendamento?: string;
  tipoAtendimento?: "INDIVIDUAL" | "GRUPO";
};

// SIGOP usa ; como separador e não usa ; dentro de campo — sem necessidade de
// tratamento de aspas/escape.
function splitLine(line: string): string[] {
  return line.split(";");
}

function parseDataBR(raw: string): Date | null {
  const m = raw.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  return toDateOnly(`${m[3]}-${m[2]}-${m[1]}`);
}

// Arredonda pra slot de 30min (turmas são sempre em horário cheio ou e30) —
// absorve pequenas variações do horário real batido no SIGOP.
function normalizeHora(raw: string): string | null {
  const str = raw.trim();
  if (!str) return null;
  let h: number, m: number;
  const comDoisPontos = str.match(/^(\d{1,2}):(\d{1,2})/);
  const soDigitos = str.match(/^(\d{1,2})(\d{2})?$/);
  if (comDoisPontos) {
    h = parseInt(comDoisPontos[1], 10);
    m = parseInt(comDoisPontos[2], 10);
  } else if (soDigitos) {
    h = parseInt(soDigitos[1], 10);
    m = soDigitos[2] ? parseInt(soDigitos[2], 10) : 0;
  } else {
    return null;
  }
  if (Number.isNaN(h)) return null;
  h = Math.max(0, Math.min(23, h));
  m = m >= 30 ? 30 : 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function dedupRows(rows: ParsedCsvRow[]): ParsedCsvRow[] {
  // Reagendamento/correção às vezes vira linha nova no export do SIGOP pro
  // mesmo slot — fica só a ÚLTIMA linha do arquivo pra cada
  // data+hora+matrícula+grupo (é a versão que prevaleceu).
  const groups = new Map<string, ParsedCsvRow>();
  const order: string[] = [];
  for (const row of rows) {
    const key =
      row.status === "VALIDA"
        ? [
            row.data?.toISOString(),
            row.horario,
            row.matriculaSigop || row.nomePaciente,
            row.nomeGrupo,
          ].join("|")
        : `malformada|${row.numeroLinha}`;
    if (!groups.has(key)) order.push(key);
    groups.set(key, row);
  }
  return order.map((k) => groups.get(k)!);
}

export function parseCsv(rawText: string): ParsedCsvRow[] {
  let text = rawText;
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const linhas = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (linhas.length < 2) return [];

  const header = splitLine(linhas[0]).map((h) => h.trim());
  const idx: Record<string, number> = {};
  header.forEach((h, i) => {
    idx[h] = i;
  });
  const col = (parts: string[], nome: string) =>
    idx[nome] !== undefined ? (parts[idx[nome]] ?? "").trim() : "";

  const rows: ParsedCsvRow[] = linhas.slice(1).map((linha, index) => {
    const numeroLinha = index + 2;
    const parts = splitLine(linha);
    const conteudoBruto: Record<string, string> = {};
    header.forEach((h, i) => {
      conteudoBruto[h] = (parts[i] ?? "").trim();
    });

    const dataRaw = col(parts, "Data do agendamento");
    const horaRaw = col(parts, "Hora do agendamento");
    const nome = col(parts, "Nome");
    const matricula = col(parts, "Matrícula SIGOP");
    const statusAgendamento = col(parts, "Status do Agendamento");
    const nomeGrupo = col(parts, "Nome do Grupo");
    const tipoConsultaRaw = col(parts, "Tipo de Consulta");

    const missing: string[] = [];
    if (!matricula) missing.push("Matrícula SIGOP");
    if (!nome) missing.push("Nome");

    const data = dataRaw ? parseDataBR(dataRaw) : null;
    if (!dataRaw) missing.push("Data do agendamento");
    else if (!data) missing.push("Data do agendamento (formato não reconhecido)");

    const horario = horaRaw ? normalizeHora(horaRaw) : null;
    if (!horaRaw) missing.push("Hora do agendamento");
    else if (!horario) missing.push("Hora do agendamento (formato não reconhecido)");

    if (!statusAgendamento) missing.push("Status do Agendamento");

    if (missing.length > 0) {
      return {
        numeroLinha,
        conteudoBruto,
        status: "DESCARTADA_MALFORMADA",
        motivoDescarte: `Campos ausentes ou inválidos: ${missing.join(", ")}`,
      };
    }

    return {
      numeroLinha,
      conteudoBruto,
      status: "VALIDA",
      matriculaSigop: matricula,
      nomePaciente: nome,
      data: data as Date,
      horario: horario as string,
      nomeGrupo: nomeGrupo || undefined,
      statusAgendamento,
      tipoAtendimento: tipoConsultaRaw.toLowerCase().includes("individual")
        ? "INDIVIDUAL"
        : "GRUPO",
    };
  });

  return dedupRows(rows);
}
