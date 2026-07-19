"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_OCORRENCIA_LABEL } from "@/lib/constants";
import {
  setOcorrenciaStatusInline,
  toggleConferidoSigop,
} from "@/actions/turmas/actions";
import type { DayRosterEntry } from "@/lib/turma-name";

export function DayRosterRow({
  entry,
  date,
}: {
  entry: DayRosterEntry;
  date: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between gap-2 border-t py-2 text-sm first:border-t-0">
      <Link href={`/pacientes/${entry.patientId}`} className="hover:underline">
        <span className="font-medium">{entry.patientName}</span>
        <span className="ml-2 text-xs text-muted-foreground">
          Matrícula {entry.matriculaSigop}
        </span>
      </Link>
      <div className="flex items-center gap-1.5">
        <Badge
          variant={entry.conferidoSigop ? "default" : "outline"}
          className="cursor-default"
        >
          {entry.conferidoSigop ? "Conferido" : "A conferir"}
        </Badge>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          disabled={isPending}
          title="Marcar/desmarcar conferência com o SIGOP"
          onClick={() =>
            startTransition(() => {
              toggleConferidoSigop(entry.linkId, date);
            })
          }
        >
          ⚡
        </Button>
        <Select
          items={STATUS_OCORRENCIA_LABEL}
          value={entry.status}
          disabled={isPending}
          onValueChange={(v) =>
            startTransition(() => {
              setOcorrenciaStatusInline(
                entry.linkId,
                date,
                v as DayRosterEntry["status"]
              );
            })
          }
        >
          <SelectTrigger size="sm" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_OCORRENCIA_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
