export const DIA_SEMANA_LABEL: Record<string, string> = {
  SEGUNDA: "Segunda",
  TERCA: "Terça",
  QUARTA: "Quarta",
  QUINTA: "Quinta",
  SEXTA: "Sexta",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

export const DIA_SEMANA_ORDER = [
  "SEGUNDA",
  "TERCA",
  "QUARTA",
  "QUINTA",
  "SEXTA",
  "SABADO",
  "DOMINGO",
] as const;

// Valor padrão da multa por falta injustificada (project.md §5.5).
export const VALOR_MULTA_PADRAO = 50.0;

// Motivos válidos para registrar uma desmarcação (não é cálculo automático de
// antecedência — é uma classificação humana; qualquer ausência que não se
// encaixe aqui deve ser registrada como falta, não desmarcação).
export const MOTIVOS_DESMARQUE = [
  "Cliente cancelou com 24h+ de antecedência",
  "Erro da clínica",
  "Cancelado via portal pelo cliente",
] as const;

export const STATUS_OCORRENCIA_LABEL: Record<string, string> = {
  CONFIRMADO: "Confirmado",
  DESMARCADO: "Desmarcado",
  FALTA_JUSTIFICADA: "Falta justificada",
  FALTA_INJUSTIFICADA: "Falta injustificada",
};

// Quantas importações de CSV consecutivas sem o paciente aparecer na turma
// até sinalizar "possível alta pendente" (project.md §11) — o sistema nunca
// remove sozinho, apenas passa a sinalizar a partir desse número.
export const ABSENCE_STREAK_THRESHOLD = 2;

// Atendimento em GRUPO só existe em Fisioterapia, e só nessas modalidades —
// as demais (ventosa, urgência, encaixe, avaliação) e as outras
// especialidades são sempre individuais.
export const MODALIDADES_EM_GRUPO = ["FISIOTERAPIA", "PILATES", "ACUPUNTURA"] as const;
