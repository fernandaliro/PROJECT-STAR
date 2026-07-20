"use client";

import { useActionState, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";
import { DIA_SEMANA_LABEL, DIA_SEMANA_ORDER, MODALIDADES_EM_GRUPO } from "@/lib/constants";
import { generateTimeSlots } from "@/lib/dates";
import { MODALIDADE_VALUES } from "@/lib/validation/turma";
import type { ActionState } from "@/actions/turmas/actions";

const MODALIDADE_LABEL: Record<string, string> = {
  FISIOTERAPIA: "Fisioterapia",
  PILATES: "Pilates",
  ACUPUNTURA: "Acupuntura",
  VENTOSA: "Ventosa",
  URGENCIA: "Urgência",
  ENCAIXE: "Encaixe",
  AVALIACAO: "Avaliação",
};

type Schedule = { diaSemana: string | null; horaInicio: string | null; horaFim: string | null };
type Professional = {
  id: string;
  nome: string;
  especialidade: string;
  schedules?: Schedule[];
};
type Patient = { id: string; nomeCompleto: string; matriculaSigop: string };

type InitialValues = {
  diaSemana: string;
  horario: string;
  professionalId: string;
  tipoAtendimento: string;
  modalidade: string | null;
  capacidade: number | null;
  duracaoMinutos: number | null;
};

// Grupo de botões estilo "segmented control" — mesma pílula visual em todo
// lugar que a turma pede uma escolha única (tipo, modalidade, dia).
function PillGroup({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const checked = value === opt.value;
        return (
          <label
            key={opt.value}
            className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              checked
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background hover:bg-muted"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={checked}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}

export function TurmaSlotForm({
  action,
  professionals,
  initial,
  submitLabel = "Criar turma",
  diaSemanaMode = "single",
  patients,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  professionals: Professional[];
  initial?: InitialValues;
  submitLabel?: string;
  diaSemanaMode?: "single" | "multi";
  patients?: Patient[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    action,
    undefined
  );
  const [professionalId, setProfessionalId] = useState<string>(
    initial?.professionalId ?? ""
  );
  const [modalidade, setModalidade] = useState<string>(initial?.modalidade ?? "");
  const [tipoAtendimento, setTipoAtendimento] = useState<string>(
    initial?.tipoAtendimento ?? "INDIVIDUAL"
  );
  const [diaSemanaUnico, setDiaSemanaUnico] = useState<string>(initial?.diaSemana ?? "");
  const [diasSelecionados, setDiasSelecionados] = useState<Set<string>>(
    new Set(initial?.diaSemana ? [initial.diaSemana] : [])
  );
  const [horario, setHorario] = useState<string>(initial?.horario ?? "");
  const [patientSearch, setPatientSearch] = useState("");
  const [patientIds, setPatientIds] = useState<Set<string>>(new Set());

  const professional = professionals.find((p) => p.id === professionalId);
  const isFisioterapia = professional?.especialidade === "FISIOTERAPIA";
  // Grupo é uma opção sempre visível para Fisioterapia (a validação de qual
  // modalidade permite grupo acontece no servidor e com um aviso aqui) — só
  // fica de fato indisponível para outras especialidades.
  const modalidadeCombinaComGrupo = MODALIDADES_EM_GRUPO.includes(modalidade as never);

  const tipoAtendimentoOptions = useMemo(
    () =>
      isFisioterapia
        ? [
            { value: "GRUPO", label: "Grupo" },
            { value: "INDIVIDUAL", label: "Individual" },
          ]
        : [{ value: "INDIVIDUAL", label: "Individual" }],
    [isFisioterapia]
  );

  const horarioOptions = useMemo(() => {
    const schedules = (professional?.schedules ?? []).filter((s) => s.horaInicio && s.horaFim);
    if (schedules.length === 0) return generateTimeSlots("06:00", "20:00");
    const inicio = schedules.reduce(
      (min, s) => (s.horaInicio! < min ? s.horaInicio! : min),
      schedules[0].horaInicio!
    );
    const fim = schedules.reduce(
      (max, s) => (s.horaFim! > max ? s.horaFim! : max),
      schedules[0].horaFim!
    );
    return generateTimeSlots(inicio, fim);
  }, [professional]);

  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    const q = patientSearch.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => p.nomeCompleto.toLowerCase().includes(q));
  }, [patients, patientSearch]);

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      <div className="space-y-2">
        <Label htmlFor="professionalId">Profissional</Label>
        <Select
          name="professionalId"
          items={Object.fromEntries(
            professionals.map((professional) => [professional.id, professional.nome])
          )}
          value={professionalId}
          onValueChange={(v) => {
            setProfessionalId(v as string);
            setModalidade("");
            setTipoAtendimento("INDIVIDUAL");
            setHorario("");
          }}
        >
          <SelectTrigger id="professionalId" className="w-full">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {professionals.map((professional) => (
              <SelectItem key={professional.id} value={professional.id}>
                {professional.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Tipo de atendimento</Label>
        <PillGroup
          name="tipoAtendimento"
          value={tipoAtendimento}
          onChange={setTipoAtendimento}
          options={tipoAtendimentoOptions}
        />
        {!isFisioterapia && (
          <p className="text-xs text-muted-foreground">
            Atendimento em grupo só existe em Fisioterapia (Pilates, Fisioterapia ou Acupuntura).
          </p>
        )}
        {isFisioterapia && tipoAtendimento === "GRUPO" && !modalidadeCombinaComGrupo && (
          <p className="text-xs text-destructive">
            Para salvar como Grupo, a modalidade precisa ser Pilates, Fisioterapia ou Acupuntura.
          </p>
        )}
      </div>

      {isFisioterapia && (
        <div className="space-y-2">
          <Label>Modalidade</Label>
          <PillGroup
            name="modalidade"
            value={modalidade}
            onChange={setModalidade}
            options={MODALIDADE_VALUES.map((m) => ({ value: m, label: MODALIDADE_LABEL[m] }))}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duracaoMinutos">Duração (min, opcional)</Label>
          <Input
            id="duracaoMinutos"
            name="duracaoMinutos"
            type="number"
            min="5"
            step="5"
            placeholder="Ex: 30 ou 60"
            defaultValue={initial?.duracaoMinutos ?? undefined}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacidade">Capacidade (opcional)</Label>
          <Input
            id="capacidade"
            name="capacidade"
            type="number"
            min="1"
            placeholder="Sem limite"
            defaultValue={initial?.capacidade ?? undefined}
          />
        </div>
      </div>

      {diaSemanaMode === "multi" ? (
        <div className="space-y-2">
          <Label>Dias da semana</Label>
          <div className="flex flex-wrap gap-2">
            {DIA_SEMANA_ORDER.map((dia) => {
              const checked = diasSelecionados.has(dia);
              return (
                <label
                  key={dia}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:bg-muted"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="diaSemana"
                    value={dia}
                    checked={checked}
                    onChange={(e) => {
                      setDiasSelecionados((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(dia);
                        else next.delete(dia);
                        return next;
                      });
                    }}
                    className="sr-only"
                  />
                  {DIA_SEMANA_LABEL[dia].slice(0, 3)}
                </label>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Marque todos os dias em que essa turma se repete — uma turma é criada pra cada
            dia, todas com o mesmo horário/profissional/tipo.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Dia da semana</Label>
          <PillGroup
            name="diaSemana"
            value={diaSemanaUnico}
            onChange={setDiaSemanaUnico}
            options={DIA_SEMANA_ORDER.map((dia) => ({ value: dia, label: DIA_SEMANA_LABEL[dia].slice(0, 3) }))}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="horario">Horário de início</Label>
        <Select
          name="horario"
          items={Object.fromEntries(horarioOptions.map((h) => [h, h]))}
          value={horario}
          onValueChange={(v) => setHorario(v as string)}
        >
          <SelectTrigger id="horario" className="w-full">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {horarioOptions.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!professional?.schedules?.length && (
          <p className="text-xs text-muted-foreground">
            Sem escala cadastrada pra esse profissional — mostrando horário padrão (06:00–20:00).
          </p>
        )}
      </div>

      {patients && (
        <div className="space-y-2">
          <Label>Pacientes (opcional, já matricula na criação)</Label>
          {patientIds.size > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {[...patientIds].map((id) => {
                const p = patients.find((pt) => pt.id === id);
                if (!p) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs text-accent-foreground"
                  >
                    {p.nomeCompleto}
                    <button
                      type="button"
                      onClick={() =>
                        setPatientIds((prev) => {
                          const next = new Set(prev);
                          next.delete(id);
                          return next;
                        })
                      }
                      className="text-accent-foreground/70 hover:text-accent-foreground"
                      aria-label={`Remover ${p.nomeCompleto}`}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <Input
            type="search"
            placeholder="Buscar paciente ativo..."
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
          />
          <div className="max-h-40 overflow-y-auto rounded-md border">
            {filteredPatients.slice(0, 60).map((p) => {
              const checked = patientIds.has(p.id);
              return (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-center gap-2 border-b px-3 py-1.5 text-sm last:border-b-0 hover:bg-muted ${
                    checked ? "bg-accent/60" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    name="patientIds"
                    value={p.id}
                    checked={checked}
                    onChange={(e) => {
                      setPatientIds((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(p.id);
                        else next.delete(p.id);
                        return next;
                      });
                    }}
                  />
                  {p.nomeCompleto}
                </label>
              );
            })}
            {filteredPatients.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">Nenhum paciente encontrado.</p>
            )}
          </div>
        </div>
      )}

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
