import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeTurmaNamesForSlots, getDayRosterForSlots } from "@/lib/turma-name";
import {
  addDays,
  diaSemanaFromDate,
  formatDateOnly,
  startOfWeek,
  toDateOnly,
} from "@/lib/dates";
import { DIA_SEMANA_LABEL, DIA_SEMANA_ORDER } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/shared/copy-button";
import { AgendaSubNav } from "@/components/shared/agenda-sub-nav";
import { DayRosterRow } from "@/components/shared/day-roster-row";

type View = "dia" | "semana" | "mes";

function buildHref(view: View, date: string) {
  return `/agenda?view=${view}&date=${date}`;
}

export default async function AgendaPage(props: PageProps<"/agenda">) {
  const searchParams = await props.searchParams;
  const view: View =
    searchParams.view === "dia" || searchParams.view === "mes"
      ? searchParams.view
      : "semana";
  const dateParam =
    typeof searchParams.date === "string"
      ? searchParams.date
      : formatDateOnly(new Date());
  const date = toDateOnly(dateParam);

  const turmaSlots = await prisma.turmaSlot.findMany({
    where: { ativo: true },
    include: { professional: true },
  });

  const byDia = new Map<string, typeof turmaSlots>();
  for (const slot of turmaSlots) {
    const list = byDia.get(slot.diaSemana) ?? [];
    list.push(slot);
    byDia.set(slot.diaSemana, list);
  }
  for (const list of byDia.values()) {
    list.sort((a, b) => a.horario.localeCompare(b.horario));
  }

  return (
    <div className="space-y-6">
      <AgendaSubNav />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Agenda</h1>
        </div>
        <div className="flex gap-1">
          {(["dia", "semana", "mes"] as View[]).map((v) => (
            <Button
              key={v}
              size="sm"
              variant={v === view ? "default" : "outline"}
              nativeButton={false} render={<Link href={buildHref(v, dateParam)} />}
            >
              {v === "dia" ? "Dia" : v === "semana" ? "Semana" : "Mês"}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={
            <Link
              href={buildHref(
                view,
                formatDateOnly(
                  addDays(date, view === "mes" ? -30 : view === "semana" ? -7 : -1)
                )
              )}
            />
          }
        >
          ← Anterior
        </Button>
        <span className="text-sm font-medium">
          {date.toLocaleDateString("pt-BR", { timeZone: "UTC" })}
        </span>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={
            <Link
              href={buildHref(
                view,
                formatDateOnly(
                  addDays(date, view === "mes" ? 30 : view === "semana" ? 7 : 1)
                )
              )}
            />
          }
        >
          Próxima →
        </Button>
      </div>

      {view === "dia" && (
        <DayView date={date} slots={byDia.get(diaSemanaFromDate(date)) ?? []} />
      )}
      {view === "semana" && (
        <WeekView date={date} byDia={byDia} dateParam={dateParam} />
      )}
      {view === "mes" && (
        <MonthView
          date={date}
          countsByDia={Object.fromEntries(
            DIA_SEMANA_ORDER.map((dia) => [dia, (byDia.get(dia) ?? []).length])
          )}
        />
      )}
    </div>
  );
}

async function DayView({
  date,
  slots,
}: {
  date: Date;
  slots: {
    id: string;
    horario: string;
    professional: { nome: string };
    tipoAtendimento: string;
    modalidade: string | null;
    capacidade: number | null;
  }[];
}) {
  const slotIds = slots.map((slot) => slot.id);
  const dateParam = formatDateOnly(date);
  const [namesMap, rosterMap] = await Promise.all([
    computeTurmaNamesForSlots(slotIds),
    getDayRosterForSlots(slotIds, date),
  ]);
  const items = slots.map((slot) => ({
    slot,
    nome: namesMap.get(slot.id)!,
    roster: rosterMap.get(slot.id) ?? [],
  }));

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhuma turma neste dia.
        </p>
      )}
      {items.map(({ slot, nome, roster }) => {
        const ocupados = roster.filter((entry) => entry.status === "CONFIRMADO").length;
        return (
          <div key={slot.id} className="rounded-md border text-sm">
            <div className="flex items-center justify-between gap-2 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-medium">{slot.horario}</span>
                <Link href={`/turmas/${slot.id}`} className="font-medium hover:underline">
                  {slot.professional.nome}
                </Link>
                <Badge variant="outline">
                  {slot.tipoAtendimento === "GRUPO" ? "Grupo" : "Individual"}
                </Badge>
                {slot.modalidade && <Badge variant="outline">{slot.modalidade}</Badge>}
              </div>
              <div className="flex items-center gap-2">
                {slot.capacidade && (
                  <span className="text-xs text-muted-foreground">
                    {ocupados}/{slot.capacidade} ocupados
                  </span>
                )}
                <CopyButton
                  text={roster
                    .filter((entry) => entry.status === "CONFIRMADO")
                    .map((entry) => entry.patientName)
                    .join(", ")}
                  label="Copiar nomes pro SIGOP"
                />
              </div>
            </div>
            <p className="px-3 pb-2 text-xs text-muted-foreground">{nome}</p>
            {roster.length === 0 ? (
              <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                Nenhum paciente com vínculo ativo nesta turma.
              </p>
            ) : (
              <div className="px-3">
                {roster.map((entry) => (
                  <DayRosterRow key={entry.linkId} entry={entry} date={dateParam} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function WeekView({
  date,
  byDia,
  dateParam,
}: {
  date: Date;
  byDia: Map<
    string,
    { id: string; horario: string; professional: { nome: string } }[]
  >;
  dateParam: string;
}) {
  const monday = startOfWeek(date);
  const days = DIA_SEMANA_ORDER.map((_, i) => addDays(monday, i));

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
      {days.map((day, index) => {
        const dia = DIA_SEMANA_ORDER[index];
        const slots = byDia.get(dia) ?? [];
        const isSelected = formatDateOnly(day) === dateParam;
        return (
          <div
            key={dia}
            className={`rounded-md border p-2 text-sm ${isSelected ? "border-primary" : ""}`}
          >
            <Link
              href={buildHref("dia", formatDateOnly(day))}
              className="font-medium hover:underline"
            >
              {DIA_SEMANA_LABEL[dia]} {day.getUTCDate()}
            </Link>
            <ul className="mt-2 space-y-1">
              {slots.map((slot) => (
                <li key={slot.id}>
                  <Link href={`/turmas/${slot.id}`} className="text-muted-foreground hover:underline">
                    {slot.horario} {slot.professional.nome}
                  </Link>
                </li>
              ))}
              {slots.length === 0 && (
                <li className="text-muted-foreground">—</li>
              )}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function MonthView({
  date,
  countsByDia,
}: {
  date: Date;
  countsByDia: Record<string, number>;
}) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const gridStart = startOfWeek(firstOfMonth);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <div className="grid grid-cols-7 gap-1 text-xs">
      {DIA_SEMANA_ORDER.map((dia) => (
        <div key={dia} className="text-center font-medium text-muted-foreground">
          {DIA_SEMANA_LABEL[dia].slice(0, 3)}
        </div>
      ))}
      {cells.map((cell) => {
        const dia = diaSemanaFromDate(cell);
        const count = countsByDia[dia] ?? 0;
        const inMonth = cell.getUTCMonth() === month;
        return (
          <Link
            key={formatDateOnly(cell)}
            href={buildHref("dia", formatDateOnly(cell))}
            className={`rounded-md border p-2 hover:bg-accent ${inMonth ? "" : "opacity-40"}`}
          >
            <div>{cell.getUTCDate()}</div>
            {count > 0 && (
              <Badge variant="outline" className="mt-1">
                {count} turma{count > 1 ? "s" : ""}
              </Badge>
            )}
          </Link>
        );
      })}
    </div>
  );
}
