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
import { MOTIVOS_DESMARQUE, STATUS_OCORRENCIA_LABEL } from "@/lib/constants";
import type { ActionState } from "@/actions/turmas/actions";

type LinkOption = { id: string; nomeCompleto: string };

export function OcorrenciaForm({
  action,
  links,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  links: LinkOption[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    action,
    undefined
  );
  const [status, setStatus] = useState("FALTA_INJUSTIFICADA");

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="linkId">Paciente</Label>
        <Select
          name="linkId"
          items={Object.fromEntries(links.map((link) => [link.id, link.nomeCompleto]))}
        >
          <SelectTrigger id="linkId" className="w-full">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {links.map((link) => (
              <SelectItem key={link.id} value={link.id}>
                {link.nomeCompleto}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="data">Data</Label>
        <Input
          id="data"
          name="data"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          name="status"
          items={STATUS_OCORRENCIA_LABEL}
          value={status}
          onValueChange={(v) => setStatus(v as string)}
        >
          <SelectTrigger id="status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DESMARCADO">Desmarcado</SelectItem>
            <SelectItem value="FALTA_INJUSTIFICADA">Falta injustificada</SelectItem>
            <SelectItem value="FALTA_JUSTIFICADA">Falta justificada</SelectItem>
            <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
          </SelectContent>
        </Select>
        {status === "FALTA_INJUSTIFICADA" && (
          <p className="text-xs text-muted-foreground">
            Gera multa de R$ 50,00 automaticamente.
          </p>
        )}
      </div>

      {status === "DESMARCADO" ? (
        <div className="space-y-2">
          <Label htmlFor="motivo">Motivo da desmarcação</Label>
          <Select name="motivo" items={Object.fromEntries(MOTIVOS_DESMARQUE.map((m) => [m, m]))}>
            <SelectTrigger id="motivo" className="w-full">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {MOTIVOS_DESMARQUE.map((motivo) => (
                <SelectItem key={motivo} value={motivo}>
                  {motivo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Qualquer motivo fora dessa lista deve ser registrado como falta, não desmarcação.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="motivo">Observação (opcional)</Label>
          <Textarea id="motivo" name="motivo" />
        </div>
      )}

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton>Registrar</SubmitButton>
    </form>
  );
}
