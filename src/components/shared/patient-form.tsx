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
import type { ActionState } from "@/actions/pacientes/actions";

type PatientFormProps = {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: {
    matriculaSigop?: string;
    nomeCompleto?: string;
    status?: string;
    observacoes?: string | null;
  };
};

export function PatientForm({ action, defaultValues }: PatientFormProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    action,
    undefined
  );

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="matriculaSigop">Matrícula SIGOP</Label>
        <Input
          id="matriculaSigop"
          name="matriculaSigop"
          defaultValue={defaultValues?.matriculaSigop}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nomeCompleto">Nome completo</Label>
        <Input
          id="nomeCompleto"
          name="nomeCompleto"
          defaultValue={defaultValues?.nomeCompleto}
          required
        />
        <p className="text-xs text-muted-foreground">
          A capitalização é padronizada automaticamente ao salvar.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          name="status"
          items={{ ATIVO: "Ativo", INATIVO: "Inativo" }}
          defaultValue={defaultValues?.status ?? "ATIVO"}
        >
          <SelectTrigger id="status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ATIVO">Ativo</SelectItem>
            <SelectItem value="INATIVO">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          name="observacoes"
          defaultValue={defaultValues?.observacoes ?? ""}
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <SubmitButton>Salvar</SubmitButton>
    </form>
  );
}
