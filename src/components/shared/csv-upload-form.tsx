"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";
import { importCsv, type ActionState } from "@/actions/csv-import/actions";

type Professional = { id: string; nome: string };

export function CsvUploadForm({ professionals }: { professionals: Professional[] }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    importCsv,
    undefined
  );

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="professionalId">Profissional desta agenda</Label>
        <Select
          name="professionalId"
          items={Object.fromEntries(professionals.map((p) => [p.id, p.nome]))}
        >
          <SelectTrigger id="professionalId" className="w-full">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {professionals.map((professional) => (
              <SelectItem key={professional.id} value={professional.id}>
                {professional.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Cada arquivo do SIGOP é a agenda de UM profissional só.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">Arquivo CSV do SIGOP</Label>
        <Input id="file" name="file" type="file" accept=".csv,text/csv" required />
        <p className="text-xs text-muted-foreground">
          Exportação padrão do SIGOP (separado por ;, colunas em português:
          Data do agendamento, Hora do agendamento, Nome, Matrícula SIGOP,
          Status do Agendamento, Nome do Grupo, Tipo de Consulta).
        </p>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <SubmitButton>Importar</SubmitButton>
    </form>
  );
}
