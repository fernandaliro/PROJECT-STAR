"use client";

import { Button } from "@/components/ui/button";
import { deleteWaitlistEntry } from "@/actions/fila-espera/actions";

export function DeleteWaitlistEntryButton({ id }: { id: string }) {
  return (
    <form
      action={deleteWaitlistEntry.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm("Remover esta entrada da fila de espera?")) {
          e.preventDefault();
        }
      }}
    >
      <Button variant="destructive" type="submit">
        Remover da fila
      </Button>
    </form>
  );
}
