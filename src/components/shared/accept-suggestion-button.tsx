"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { acceptSuggestion, type ActionState } from "@/actions/fila-espera/actions";

export function AcceptSuggestionButton({ suggestionId }: { suggestionId: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    acceptSuggestion.bind(null, suggestionId),
    undefined
  );

  return (
    <form action={formAction}>
      <Button size="sm" type="submit">
        Aceitar
      </Button>
      {state?.error && <p className="mt-1 text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
