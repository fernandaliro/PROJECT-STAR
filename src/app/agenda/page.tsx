import { Fragment } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  computeTurmaNamesForSlots,
  getDayRosterForSlots,
  getMonthAttendanceCounts,
  type DayRosterEntry,
} from "@/lib/turma-name";
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
  const profParam = typeof searchParams.prof === "string" ? searchParams.prof : "";

  function buildHref(v: View, d: string) {
    const params = new URLSearchParams({ view: v, date: d });
    if (profParam) params.set("prof", profParam);
    return `/agenda?${params.toString()}`;
  }

  const [professionals, turmaSlotsAll] = await Promise.all([
    prisma.professional.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.turmaSlot.findMany({
      where: { ativo: true },
      include: { professional: true },
    }),
  ]);
  const turmaSlots = profParam
    ? turmaSlotsAll.filter((slot) => slot.professionalId === profParam)
    : turmaSlotsAll;

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

      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          size="xs"
          variant={!profParam ? "default" : "outline"}
          nativeButton={false}
          render={<Link href={buildHref(view, dateParam)} />}
        >
          Todos
        </Button>
        {professionals.map((prof) => (
          <Button
            key={prof.id}
            size="xs"
            variant={profParam === prof.id ? "default" : "outline"}
            nativeButton={false}
            render={
              <Link
                href={`/agenda?${new URLSearchParams({ view, date: dateParam, prof: prof.id }).toString()}`}
              />
            }
          >
            {prof.nome}
          </Button>
        ))}
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
        <GradeSemanal date={date} byDia={byDia} dateParam={dateParam} buildHref={buildHref} />
      )}
      {view === "mes" && (
        <MonthView date={date} turmaSlots={turmaSlots} buildHref={buildHref} />
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

type GradeSlot = {
  id: string;
  horario: string;
  professional: { nome: string };
  tipoAtendimento: string;
  modalidade: string | null;
  capacidade: number | null;
  duracaoMinutos: number | null;
};

// Grade semanal: linhas = horários distintos que aparecem na semana, colunas =
// dias. Cada célula mostra as turmas daquele dia+horário com ocupação e
// quantos ainda estão "a conferir" no SIGOP — mesma lógica da visão Dia, só
// que cruzada. Uma consulta de roster por dia com turma (não por célula).
async function GradeSemanal({
  date,
  byDia,
  dateParam,
  buildHref,
}: {
  date: Date;
  byDia: Map<string, GradeSlot[]>;
  dateParam: string;
  buildHref: (view: View, date: string) => string;
}) {
  const monday = startOfWeek(date);
  const days = DIA_SEMANA_ORDER.map((_, i) => addDays(monday, i));

  const rosterEntries = await Promise.all(
    DIA_SEMANA_ORDER.map(async (dia, i) => {
      const slots = byDia.get(dia) ?? [];
      if (slots.length === 0) return [] as [string, DayRosterEntry[]][];
      const roster = await getDayRosterForSlots(
        slots.map((s) => s.id),
        days[i]
      );
      return Array.from(roster.entries());
    })
  );
  const rosterMap = new Map(rosterEntries.flat());

  const horarios = Array.from(
    new Set(Array.from(byDia.values()).flatMap((slots) => slots.map((s) => s.horario)))
  ).sort();

  if (horarios.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma turma cadastrada.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-px rounded-md border bg-border text-xs"
        style={{ gridTemplateColumns: `72px repeat(7, minmax(140px, 1fr))` }}
      >
        <div className="bg-muted p-2" />
        {days.map((day, index) => {
          const dia = DIA_SEMANA_ORDER[index];
          const isSelected = formatDateOnly(day) === dateParam;
          return (
            <Link
              key={dia}
              href={buildHref("dia", formatDateOnly(day))}
              className={`bg-muted p-2 text-center font-medium hover:bg-accent ${isSelected ? "text-primary" : ""}`}
            >
              {DIA_SEMANA_LABEL[dia].slice(0, 3)} {day.getUTCDate()}
            </Link>
          );
        })}

        {horarios.map((horario) => (
          <Fragment key={horario}>
            <div className="flex items-center justify-center bg-muted p-2 font-mono font-medium">
              {horario}
            </div>
            {days.map((day, index) => {
              const dia = DIA_SEMANA_ORDER[index];
              const slots = (byDia.get(dia) ?? []).filter((s) => s.horario === horario);
              return (
                <div key={`${horario}-${dia}`} className="space-y-1 bg-background p-1">
                  {slots.map((slot) => {
                    const roster = rosterMap.get(slot.id) ?? [];
                    const ocupados = roster.filter((e) => e.status === "CONFIRMADO").length;
                    const aConferir = roster.filter(
                      (e) => e.status !== "DESMARCADO" && !e.conferidoSigop
                    ).length;
                    return (
                      <Link
                        key={slot.id}
                        href={buildHref("dia", formatDateOnly(day))}
                        className="block rounded-sm border bg-card p-1.5 hover:border-primary"
                      >
                        <div className="font-medium">{slot.professional.nome}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1 text-muted-foreground">
                          <span>{slot.tipoAtendimento === "GRUPO" ? "Grupo" : "Individual"}</span>
                          {slot.modalidade && <span>· {slot.modalidade}</span>}
                          {slot.duracaoMinutos && <span>· {slot.duracaoMinutos}min</span>}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          {slot.capacidade && (
                            <span className="text-muted-foreground">
                              {ocupados}/{slot.capacidade}
                            </span>
                          )}
                          {aConferir > 0 && (
                            <span className="text-destructive">{aConferir} a conferir</span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

async function MonthView({
  date,
  turmaSlots,
  buildHref,
}: {
  date: Date;
  turmaSlots: { id: string; diaSemana: string }[];
  buildHref: (view: View, date: string) => string;
}) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const gridStart = startOfWeek(firstOfMonth);
  const gridEndExclusive = addDays(gridStart, 42);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const counts = await getMonthAttendanceCounts(turmaSlots, gridStart, gridEndExclusive);
  const todayStr = formatDateOnly(new Date());

  return (
    <div className="grid grid-cols-7 gap-1 text-xs">
      {DIA_SEMANA_ORDER.map((dia) => (
        <div key={dia} className="text-center font-medium text-muted-foreground">
          {DIA_SEMANA_LABEL[dia].slice(0, 3)}
        </div>
      ))}
      {cells.map((cell) => {
        const dateStr = formatDateOnly(cell);
        const count = counts.get(dateStr) ?? 0;
        const inMonth = cell.getUTCMonth() === month;
        return (
          <Link
            key={dateStr}
            href={buildHref("dia", dateStr)}
            className={`rounded-md border p-2 hover:bg-accent ${inMonth ? "" : "opacity-40"} ${dateStr === todayStr ? "border-primary" : ""}`}
          >
            <div>{cell.getUTCDate()}</div>
            {count > 0 && (
              <Badge variant="outline" className="mt-1">
                {count} atend.
              </Badge>
            )}
          </Link>
        );
      })}
    </div>
  );
}
