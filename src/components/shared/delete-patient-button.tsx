"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { deletePatient, type ActionState } from "@/actions/pacientes/actions";

export function DeletePatientButton({ id }: { id: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    deletePatient.bind(null, id),
    undefined
  );

  return (
    <div className="flex flex-col items-end gap-1">
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!confirm("Excluir este cadastro permanentemente? Essa ação não pode ser desfeita.")) {
            e.preventDefault();
          }
        }}
      >
        <Button variant="destructive" type="submit">
          Excluir
        </Button>
      </form>
      {state?.error && (
        <span className="max-w-xs text-right text-xs text-destructive">{state.error}</span>
      )}
    </div>
  );
}
