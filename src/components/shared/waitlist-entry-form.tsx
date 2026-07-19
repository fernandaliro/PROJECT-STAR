"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";
import { DIA_SEMANA_LABEL, DIA_SEMANA_ORDER } from "@/lib/constants";
import { ESPECIALIDADE_FILA_VALUES } from "@/lib/validation/turma";
import type { ActionState } from "@/actions/fila-espera/actions";

type Patient = { id: string; nomeCompleto: string; matriculaSigop: string };
type Professional = { id: string; nome: string };

const ESPECIALIDADE_LABEL: Record<string, string> = {
  FISIOTERAPIA: "Fisioterapia",
  ODONTOLOGIA: "Odontologia",
  PSICOLOGIA: "Psicologia",
};

export function WaitlistEntryForm({
  action,
  patients,
  professionals,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  patients: Patient[];
  professionals: Professional[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    action,
    undefined
  );
  const [especialidade, setEspecialidade] = useState<string>("FISIOTERAPIA");

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="patientId">Paciente</Label>
        <Select
          name="patientId"
          items={Object.fromEntries(
            patients.map((p) => [p.id, `${p.nomeCompleto} (${p.matriculaSigop})`])
          )}
        >
          <SelectTrigger id="patientId" className="w-full">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {patients.map((patient) => (
              <SelectItem key={patient.id} value={patient.id}>
                {patient.nomeCompleto} ({patient.matriculaSigop})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="especialidade">Especialidade</Label>
        <Select
          name="especialidade"
          items={ESPECIALIDADE_LABEL}
          value={especialidade}
          onValueChange={(v) => setEspecialidade(v as string)}
        >
          <SelectTrigger id="especialidade" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ESPECIALIDADE_FILA_VALUES.map((esp) => (
              <SelectItem key={esp} value={esp}>
                {ESPECIALIDADE_LABEL[esp]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dataAvaliacao">Data da avaliação</Label>
        <Input
          id="dataAvaliacao"
          name="dataAvaliacao"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prioridade">Prioridade (1 = mais urgente)</Label>
        <Input id="prioridade" name="prioridade" type="number" min="1" defaultValue="3" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="preferenciaDiaSemana">Dia preferido</Label>
          <Select name="preferenciaDiaSemana" items={DIA_SEMANA_LABEL}>
            <SelectTrigger id="preferenciaDiaSemana" className="w-full">
              <SelectValue placeholder="Qualquer" />
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
        <div className="space-y-2">
          <Label htmlFor="preferenciaHorario">Horário preferido</Label>
          <Input id="preferenciaHorario" name="preferenciaHorario" type="time" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="profissionalResponsavelId">Profissional responsável (opcional)</Label>
        <Select
          name="profissionalResponsavelId"
          items={Object.fromEntries(professionals.map((p) => [p.id, p.nome]))}
        >
          <SelectTrigger id="profissionalResponsavelId" className="w-full">
            <SelectValue placeholder="Qualquer" />
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
        <Label htmlFor="tratamentoIndicado">Tratamento indicado</Label>
        <Input id="tratamentoIndicado" name="tratamentoIndicado" required />
      </div>

      {especialidade === "ODONTOLOGIA" && (
        <div className="space-y-4 rounded-md border p-3">
          <p className="text-sm font-medium">Endodontia</p>
          <div className="space-y-2">
            <Label htmlFor="dentesEnvolvidos">Dentes envolvidos</Label>
            <Input id="dentesEnvolvidos" name="dentesEnvolvidos" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="rx" /> RX disponível
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="retratamento" /> Retratamento
          </label>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" name="observacoes" />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton>Adicionar à fila</SubmitButton>
    </form>
  );
}
