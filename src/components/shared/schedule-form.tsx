"use client";

import { useActionState, useState } from "react";
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
import { DIA_SEMANA_LABEL, DIA_SEMANA_ORDER } from "@/lib/constants";
import type { ActionState } from "@/actions/escalas/actions";

type Professional = { id: string; nome: string };

export function ScheduleForm({
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
  const [sobDemanda, setSobDemanda] = useState(false);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="professionalId">Profissional</Label>
        <Select
          name="professionalId"
          items={Object.fromEntries(
            professionals.map((professional) => [professional.id, professional.nome])
          )}
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

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="sobDemanda"
          checked={sobDemanda}
          onChange={(e) => setSobDemanda(e.target.checked)}
        />
        Sob demanda (sem dia/horário fixo)
      </label>

      {!sobDemanda && (
        <>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="horaInicio">Início</Label>
              <Input id="horaInicio" name="horaInicio" type="time" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horaFim">Fim</Label>
              <Input id="horaFim" name="horaFim" type="time" />
            </div>
          </div>
        </>
      )}

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton>Adicionar horário</SubmitButton>
    </form>
  );
}
