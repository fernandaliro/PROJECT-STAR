"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { deleteTurmaSlot, type ActionState } from "@/actions/turmas/actions";

export function DeleteTurmaButton({ id }: { id: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    deleteTurmaSlot.bind(null, id),
    undefined
  );

  return (
    <div className="flex flex-col items-end gap-1">
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!confirm("Excluir esta turma permanentemente? Essa ação não pode ser desfeita.")) {
            e.preventDefault();
          }
        }}
      >
        <Button variant="destructive" type="submit">
          Excluir turma
        </Button>
      </form>
      {state?.error && (
        <span className="max-w-xs text-right text-xs text-destructive">{state.error}</span>
      )}
    </div>
  );
}
