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

type Professional = { id: string; nome: string; especialidade: string };
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
  const [diasSelecionados, setDiasSelecionados] = useState<Set<string>>(
    new Set(initial?.diaSemana ? [initial.diaSemana] : [])
  );
  const [patientSearch, setPatientSearch] = useState("");
  const [patientIds, setPatientIds] = useState<Set<string>>(new Set());

  const professional = professionals.find((p) => p.id === professionalId);
  const isFisioterapia = professional?.especialidade === "FISIOTERAPIA";
  // Grupo é uma opção sempre visível para Fisioterapia (a validação de qual
  // modalidade permite grupo acontece no servidor e com um aviso aqui) — só
  // fica de fato indisponível para outras especialidades.
  const modalidadeCombinaComGrupo = MODALIDADES_EM_GRUPO.includes(modalidade as never);

  const tipoAtendimentoItems = useMemo(
    () =>
      isFisioterapia
        ? { GRUPO: "Grupo", INDIVIDUAL: "Individual" }
        : { INDIVIDUAL: "Individual" },
    [isFisioterapia]
  );

  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    const q = patientSearch.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => p.nomeCompleto.toLowerCase().includes(q));
  }, [patients, patientSearch]);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
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

      {diaSemanaMode === "multi" ? (
        <div className="space-y-2">
          <Label>Dias da semana</Label>
          <div className="flex flex-wrap gap-2">
            {DIA_SEMANA_ORDER.map((dia) => {
              const checked = diasSelecionados.has(dia);
              return (
                <label
                  key={dia}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors ${
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
          <Label htmlFor="diaSemana">Dia da semana</Label>
          <Select name="diaSemana" items={DIA_SEMANA_LABEL} defaultValue={initial?.diaSemana}>
            <SelectTrigger id="diaSemana" className="w-full">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {DIA_SEMANA_ORDER.map((dia) => (
                <SelectItem key={dia} value={dia}>
                  {DIA_SEMANA_LABEL[dia]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="horario">Horário</Label>
        <Input id="horario" name="horario" type="time" defaultValue={initial?.horario} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="duracaoMinutos">Duração (minutos, opcional)</Label>
        <Input
          id="duracaoMinutos"
          name="duracaoMinutos"
          type="number"
          min="5"
          step="5"
          placeholder="Ex: 30 ou 60"
          defaultValue={initial?.duracaoMinutos ?? undefined}
        />
        {isFisioterapia && (
          <p className="text-xs text-muted-foreground">
            Tratamentos de fisioterapia costumam durar entre 30 e 60 minutos.
          </p>
        )}
      </div>

      {isFisioterapia && (
        <div className="space-y-2">
          <Label htmlFor="modalidade">Modalidade</Label>
          <Select
            name="modalidade"
            items={MODALIDADE_LABEL}
            value={modalidade}
            onValueChange={(v) => setModalidade(v as string)}
          >
            <SelectTrigger id="modalidade" className="w-full">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {MODALIDADE_VALUES.map((modalidade) => (
                <SelectItem key={modalidade} value={modalidade}>
                  {MODALIDADE_LABEL[modalidade]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Urgência e Encaixe também são modalidades — usadas para marcar o tipo do
            atendimento individual, não só Pilates/Fisioterapia/Acupuntura.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="tipoAtendimento">Tipo de atendimento</Label>
        <Select
          key={isFisioterapia ? "com-grupo" : "so-individual"}
          name="tipoAtendimento"
          items={tipoAtendimentoItems}
          value={tipoAtendimento}
          onValueChange={(v) => setTipoAtendimento(v as string)}
        >
          <SelectTrigger id="tipoAtendimento" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {isFisioterapia && <SelectItem value="GRUPO">Grupo</SelectItem>}
            <SelectItem value="INDIVIDUAL">Individual</SelectItem>
          </SelectContent>
        </Select>
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

      <div className="space-y-2">
        <Label htmlFor="capacidade">Capacidade (vagas, opcional)</Label>
        <Input
          id="capacidade"
          name="capacidade"
          type="number"
          min="1"
          placeholder="Sem limite"
          defaultValue={initial?.capacidade ?? undefined}
        />
        <p className="text-xs text-muted-foreground">
          Individual assume 1 vaga automaticamente se deixado em branco.
        </p>
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
