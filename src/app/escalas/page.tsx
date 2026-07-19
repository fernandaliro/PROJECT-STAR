import { prisma } from "@/lib/prisma";
import { DIA_SEMANA_LABEL, DIA_SEMANA_ORDER } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ScheduleForm } from "@/components/shared/schedule-form";
import { createSchedule, deactivateSchedule } from "@/actions/escalas/actions";
import { AgendaSubNav } from "@/components/shared/agenda-sub-nav";

export const dynamic = "force-dynamic";

export default async function EscalasPage() {
  const professionals = await prisma.professional.findMany({
    where: { ativo: true },
    include: { schedules: { where: { ativo: true } } },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="space-y-8">
      <AgendaSubNav />
      <h1 className="text-2xl font-semibold">Escalas de profissionais</h1>

      <div className="space-y-4">
        {professionals.map((professional) => {
          const sorted = [...professional.schedules].sort((a, b) => {
            if (a.sobDemanda) return 1;
            if (b.sobDemanda) return -1;
            const dayDiff =
              DIA_SEMANA_ORDER.indexOf(
                (a.diaSemana ?? "SEGUNDA") as (typeof DIA_SEMANA_ORDER)[number]
              ) -
              DIA_SEMANA_ORDER.indexOf(
                (b.diaSemana ?? "SEGUNDA") as (typeof DIA_SEMANA_ORDER)[number]
              );
            if (dayDiff !== 0) return dayDiff;
            return (a.horaInicio ?? "").localeCompare(b.horaInicio ?? "");
          });

          return (
            <div key={professional.id} className="rounded-md border p-3">
              <p className="font-medium">{professional.nome}</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {sorted.map((schedule) => (
                  <li key={schedule.id} className="flex items-center justify-between">
                    <span>
                      {schedule.sobDemanda
                        ? "Sob demanda"
                        : `${DIA_SEMANA_LABEL[schedule.diaSemana ?? ""]} · ${schedule.horaInicio}–${schedule.horaFim}`}
                    </span>
                    <form action={deactivateSchedule.bind(null, schedule.id)}>
                      <Button variant="ghost" size="sm" type="submit">
                        Remover
                      </Button>
                    </form>
                  </li>
                ))}
                {sorted.length === 0 && <li>Nenhum horário cadastrado.</li>}
              </ul>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-medium">Adicionar horário</h2>
        <ScheduleForm action={createSchedule} professionals={professionals} />
      </div>
    </div>
  );
}
