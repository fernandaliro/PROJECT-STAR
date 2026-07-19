"use client";

import { useActionState } from "react";
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
import type { ActionState } from "@/actions/turmas/actions";

type Patient = { id: string; nomeCompleto: string; matriculaSigop: string };

export function LinkForm({
  action,
  turmaSlotId,
  patients,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  turmaSlotId: string;
  patients: Patient[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    action,
    undefined
  );

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <input type="hidden" name="turmaSlotId" value={turmaSlotId} />

      <div className="space-y-2">
        <Label htmlFor="patientId">Paciente</Label>
        <Select
          name="patientId"
          items={Object.fromEntries(
            patients.map((patient) => [
              patient.id,
              `${patient.nomeCompleto} (${patient.matriculaSigop})`,
            ])
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
        <Label htmlFor="dataEntrada">Data de entrada</Label>
        <Input
          id="dataEntrada"
          name="dataEntrada"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" name="observacoes" />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton>Matricular</SubmitButton>
    </form>
  );
}
