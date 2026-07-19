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

export function TurmaSlotForm({
  action,
  professionals,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  professionals: Professional[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    action,
    undefined
  );
  const [professionalId, setProfessionalId] = useState<string>("");
  const [modalidade, setModalidade] = useState<string>("");
  const [tipoAtendimento, setTipoAtendimento] = useState<string>("INDIVIDUAL");

  const professional = professionals.find((p) => p.id === professionalId);
  const isFisioterapia = professional?.especialidade === "FISIOTERAPIA";
  const grupoPermitido =
    isFisioterapia && MODALIDADES_EM_GRUPO.includes(modalidade as never);

  const tipoAtendimentoItems = useMemo(
    () =>
      grupoPermitido
        ? { GRUPO: "Grupo", INDIVIDUAL: "Individual" }
        : { INDIVIDUAL: "Individual" },
    [grupoPermitido]
  );

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

      <div className="space-y-2">
        <Label htmlFor="diaSemana">Dia da semana</Label>
        <Select name="diaSemana" items={DIA_SEMANA_LABEL}>
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

      <div className="space-y-2">
        <Label htmlFor="horario">Horário</Label>
        <Input id="horario" name="horario" type="time" required />
      </div>

      {isFisioterapia && (
        <div className="space-y-2">
          <Label htmlFor="modalidade">Modalidade</Label>
          <Select
            name="modalidade"
            items={MODALIDADE_LABEL}
            value={modalidade}
            onValueChange={(v) => {
              const next = v as string;
              setModalidade(next);
              if (!MODALIDADES_EM_GRUPO.includes(next as never)) {
                setTipoAtendimento("INDIVIDUAL");
              }
            }}
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
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="tipoAtendimento">Tipo de atendimento</Label>
        <Select
          key={grupoPermitido ? "com-grupo" : "so-individual"}
          name="tipoAtendimento"
          items={tipoAtendimentoItems}
          value={tipoAtendimento}
          onValueChange={(v) => setTipoAtendimento(v as string)}
        >
          <SelectTrigger id="tipoAtendimento" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {grupoPermitido && <SelectItem value="GRUPO">Grupo</SelectItem>}
            <SelectItem value="INDIVIDUAL">Individual</SelectItem>
          </SelectContent>
        </Select>
        {!grupoPermitido && (
          <p className="text-xs text-muted-foreground">
            Atendimento em grupo só existe em Fisioterapia (Pilates, Fisioterapia ou Acupuntura).
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="capacidade">Capacidade (vagas, opcional)</Label>
        <Input id="capacidade" name="capacidade" type="number" min="1" placeholder="Sem limite" />
        <p className="text-xs text-muted-foreground">
          Individual assume 1 vaga automaticamente se deixado em branco.
        </p>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton>Criar turma</SubmitButton>
    </form>
  );
}
