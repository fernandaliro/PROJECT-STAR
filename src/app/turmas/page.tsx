import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeTurmaNamesForSlots } from "@/lib/turma-name";
import { DIA_SEMANA_LABEL, DIA_SEMANA_ORDER } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AgendaSubNav } from "@/components/shared/agenda-sub-nav";

export const dynamic = "force-dynamic";

export default async function TurmasPage() {
  const turmaSlots = await prisma.turmaSlot.findMany({
    where: { ativo: true },
    include: { professional: true },
  });

  const sorted = [...turmaSlots].sort((a, b) => {
    const dayDiff =
      DIA_SEMANA_ORDER.indexOf(a.diaSemana as (typeof DIA_SEMANA_ORDER)[number]) -
      DIA_SEMANA_ORDER.indexOf(b.diaSemana as (typeof DIA_SEMANA_ORDER)[number]);
    if (dayDiff !== 0) return dayDiff;
    return a.horario.localeCompare(b.horario);
  });

  const namesMap = await computeTurmaNamesForSlots(sorted.map((slot) => slot.id));
  const names = sorted.map((slot) => namesMap.get(slot.id)!);

  return (
    <div className="space-y-6">
      <AgendaSubNav />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Turmas</h1>
        <Button nativeButton={false} render={<Link href="/turmas/novo" />}>Nova turma</Button>
      </div>

      <div className="space-y-2">
        {sorted.map((slot, index) => (
          <Link
            key={slot.id}
            href={`/turmas/${slot.id}`}
            className="block rounded-md border p-3 text-sm hover:bg-accent"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {DIA_SEMANA_LABEL[slot.diaSemana]} {slot.horario} —{" "}
                {slot.professional.nome}
              </span>
              <Badge variant="outline">
                {slot.tipoAtendimento === "GRUPO" ? "Grupo" : "Individual"}
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground">{names[index]}</p>
          </Link>
        ))}
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma turma cadastrada ainda.
          </p>
        )}
      </div>
    </div>
  );
}
