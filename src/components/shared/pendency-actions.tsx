"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  markAbonada,
  markJustificativaRecebida,
  updateCobranca,
  type ActionState,
} from "@/actions/financeiro/actions";

const CANAL_LABEL: Record<string, string> = {
  TEAMS: "Teams",
  EMAIL: "E-mail",
  PRESENCIAL: "Presencial",
  OUTRO: "Outro",
};

export function JustificativaForm({ pendencyId }: { pendencyId: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    markJustificativaRecebida,
    undefined
  );
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="pendencyId" value={pendencyId} />
      <Input
        name="justificativaDescricao"
        placeholder="Descrição do atestado/justificativa"
        className="h-7 text-xs"
      />
      <Button type="submit" size="xs" variant="outline">
        Justificar
      </Button>
      {state?.error && <span className="text-xs text-destructive">{state.error}</span>}
    </form>
  );
}

export function AbonoForm({ pendencyId }: { pendencyId: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    markAbonada,
    undefined
  );
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="pendencyId" value={pendencyId} />
      <Input
        name="abonoAprovadoPor"
        placeholder="Aprovado por (ex: coordenadora)"
        className="h-7 text-xs"
      />
      <Button type="submit" size="xs" variant="outline">
        Abonar
      </Button>
      {state?.error && <span className="text-xs text-destructive">{state.error}</span>}
    </form>
  );
}

export function CobrancaForm({
  pendencyId,
  defaultCanal,
  defaultStatus,
}: {
  pendencyId: string;
  defaultCanal?: string | null;
  defaultStatus?: string | null;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateCobranca,
    undefined
  );
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="pendencyId" value={pendencyId} />
      <Select name="canalCobranca" items={CANAL_LABEL} defaultValue={defaultCanal ?? undefined}>
        <SelectTrigger className="h-7 w-28 text-xs">
          <SelectValue placeholder="Canal" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(CANAL_LABEL).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        name="statusCobranca"
        placeholder="Status (ex: enviado 18/07)"
        defaultValue={defaultStatus ?? ""}
        className="h-7 text-xs"
      />
      <Button type="submit" size="xs" variant="outline">
        Salvar
      </Button>
      {state?.error && <span className="text-xs text-destructive">{state.error}</span>}
    </form>
  );
}
