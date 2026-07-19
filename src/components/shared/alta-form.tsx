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

type LinkOption = { id: string; nomeCompleto: string };

export function AltaForm({
  action,
  links,
  defaultLinkId,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  links: LinkOption[];
  defaultLinkId?: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    action,
    undefined
  );

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="linkId">Paciente</Label>
        <Select
          name="linkId"
          items={Object.fromEntries(links.map((link) => [link.id, link.nomeCompleto]))}
          defaultValue={defaultLinkId}
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
        <Label htmlFor="dataAlta">Data da alta</Label>
        <Input
          id="dataAlta"
          name="dataAlta"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="motivo">Motivo</Label>
        <Textarea id="motivo" name="motivo" />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton>Registrar alta</SubmitButton>
    </form>
  );
}
