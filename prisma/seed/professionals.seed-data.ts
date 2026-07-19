// Dados transcritos de project.md §8 (Escalas de profissionais).
// sobDemanda=true → diaSemana/horaInicio/horaFim ficam null (sem horário fixo).
// folga (Amanda sex, Luciana seg) não vira uma linha de escala.

export type ScheduleSeed = {
  diaSemana?:
    | "SEGUNDA"
    | "TERCA"
    | "QUARTA"
    | "QUINTA"
    | "SEXTA"
    | "SABADO"
    | "DOMINGO";
  horaInicio?: string;
  horaFim?: string;
  sobDemanda?: boolean;
};

export type ProfessionalSeed = {
  nome: string;
  especialidade: "FISIOTERAPIA" | "ODONTOLOGIA" | "NUTRICAO" | "PSICOLOGIA" | "OUTRA";
  observacoes?: string;
  schedules: ScheduleSeed[];
};

const DIAS_UTEIS_SEG_SEX = [
  "SEGUNDA",
  "TERCA",
  "QUARTA",
  "QUINTA",
  "SEXTA",
] as const;

export const PROFESSIONALS_SEED: ProfessionalSeed[] = [
  // --- Fisioterapia ---
  {
    nome: "Alana Evani dos Santos da Costa",
    especialidade: "FISIOTERAPIA",
    observacoes: "Atende ventosa (project.md §10).",
    schedules: DIAS_UTEIS_SEG_SEX.map((diaSemana) => ({
      diaSemana,
      horaInicio: "07:00",
      horaFim: "13:00",
    })),
  },
  {
    nome: "Andréa Rosselyne Deodato Viana",
    especialidade: "FISIOTERAPIA",
    observacoes: "Atende acupuntura (project.md §10).",
    schedules: DIAS_UTEIS_SEG_SEX.map((diaSemana) => ({
      diaSemana,
      horaInicio: "13:00",
      horaFim: "19:00",
    })),
  },

  // --- Nutrição ---
  {
    nome: "Matheus de Moraes de Oliveira",
    especialidade: "NUTRICAO",
    schedules: [
      { diaSemana: "SEGUNDA", horaInicio: "08:00", horaFim: "12:00" },
      { diaSemana: "QUARTA", horaInicio: "08:00", horaFim: "12:00" },
      { diaSemana: "TERCA", horaInicio: "16:00", horaFim: "20:00" },
      { diaSemana: "QUINTA", horaInicio: "16:00", horaFim: "20:00" },
      { diaSemana: "SEXTA", horaInicio: "08:00", horaFim: "12:00" },
    ],
  },

  // --- Psicologia ---
  {
    nome: "Maria Beatriz da Silva Moreira",
    especialidade: "PSICOLOGIA",
    schedules: [
      { diaSemana: "SEGUNDA", horaInicio: "16:00", horaFim: "20:00" },
      { diaSemana: "QUARTA", horaInicio: "16:00", horaFim: "20:00" },
      { diaSemana: "TERCA", horaInicio: "08:00", horaFim: "12:00" },
      { diaSemana: "QUINTA", horaInicio: "08:00", horaFim: "12:00" },
      { diaSemana: "SEXTA", horaInicio: "16:00", horaFim: "20:00" },
    ],
  },

  // --- Outros profissionais (formação/especialidade não definida em project.md §10) ---
  {
    nome: "Amanda Herculano de Moraes Souza",
    especialidade: "OUTRA",
    schedules: [
      { diaSemana: "SEGUNDA", horaInicio: "08:00", horaFim: "12:00" },
      { diaSemana: "TERCA", horaInicio: "08:00", horaFim: "12:00" },
      { diaSemana: "QUARTA", horaInicio: "08:00", horaFim: "12:00" },
      { diaSemana: "QUINTA", horaInicio: "08:00", horaFim: "12:00" },
      { diaSemana: "SEGUNDA", horaInicio: "14:00", horaFim: "18:00" },
      { diaSemana: "TERCA", horaInicio: "14:00", horaFim: "18:00" },
      { diaSemana: "QUINTA", horaInicio: "14:00", horaFim: "18:00" },
      { diaSemana: "QUARTA", horaInicio: "16:00", horaFim: "20:00" },
      // sexta: folga
    ],
  },
  {
    nome: "Luciana Freitas Araujo",
    especialidade: "OUTRA",
    schedules: [
      { diaSemana: "TERCA", horaInicio: "08:00", horaFim: "12:00" },
      { diaSemana: "QUARTA", horaInicio: "08:00", horaFim: "12:00" },
      { diaSemana: "QUINTA", horaInicio: "08:00", horaFim: "12:00" },
      { diaSemana: "SEXTA", horaInicio: "08:00", horaFim: "12:00" },
      { diaSemana: "TERCA", horaInicio: "16:00", horaFim: "20:00" },
      { diaSemana: "QUARTA", horaInicio: "16:00", horaFim: "20:00" },
      { diaSemana: "QUINTA", horaInicio: "16:00", horaFim: "20:00" },
      { diaSemana: "SEXTA", horaInicio: "16:00", horaFim: "20:00" },
      // segunda: folga
    ],
  },
  {
    nome: "Larissa Celina Dan Ramos Montijo",
    especialidade: "OUTRA",
    schedules: [
      { diaSemana: "SEGUNDA", horaInicio: "08:00", horaFim: "12:00" },
      { diaSemana: "QUARTA", horaInicio: "08:00", horaFim: "12:00" },
      { diaSemana: "QUINTA", horaInicio: "08:00", horaFim: "12:00" },
      { diaSemana: "SEXTA", horaInicio: "08:00", horaFim: "12:00" },
      // terça: folga
    ],
  },
  {
    nome: "Pedro Henrique de Souza Honório Justino",
    especialidade: "OUTRA",
    observacoes: "Sob demanda, sem dia fixo.",
    schedules: [{ sobDemanda: true }],
  },
  {
    nome: "Rosângela Ferreira de Oliveira",
    especialidade: "OUTRA",
    schedules: [{ diaSemana: "SEXTA", horaInicio: "14:00", horaFim: "18:00" }],
  },
  {
    nome: "Juliana Baldani",
    especialidade: "ODONTOLOGIA",
    observacoes: "Atende endodontia (project.md §10).",
    schedules: [
      { diaSemana: "QUARTA", horaInicio: "13:30", horaFim: "15:30" },
    ],
  },
];
