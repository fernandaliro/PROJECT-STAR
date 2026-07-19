"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { removerVinculo, type ActionState } from "@/actions/turmas/actions";

export function RemoverVinculoButton({ linkId }: { linkId: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    removerVinculo.bind(null, linkId),
    undefined
  );

  return (
    <div className="flex flex-col items-end gap-1">
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!confirm("Remover este vínculo? Só funciona se ainda não houver nenhum atendimento registrado.")) {
            e.preventDefault();
          }
        }}
      >
        <Button variant="destructive" size="sm" type="submit">
          Remover vínculo
        </Button>
      </form>
      {state?.error && (
        <span className="max-w-xs text-right text-xs text-destructive">{state.error}</span>
      )}
    </div>
  );
}
