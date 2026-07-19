import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DIA_SEMANA_LABEL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  rejectSuggestion,
  runSuggestion,
  updateWaitlistStatus,
} from "@/actions/fila-espera/actions";
import { AcceptSuggestionButton } from "@/components/shared/accept-suggestion-button";

const TIPO_LABEL: Record<string, string> = {
  exato: "Encaixe exato",
  dia_proximo: "Mesmo dia, horário próximo",
  horario_proximo: "Mesmo horário, outro dia",
};

const TIER_ORDER: Record<string, number> = { exato: 0, dia_proximo: 1, horario_proximo: 2 };

export default async function FilaEsperaDetailPage(
  props: PageProps<"/fila-espera/[id]">
) {
  const { id } = await props.params;

  const [entry, suggestions] = await Promise.all([
    prisma.waitlistEntry.findUnique({
      where: { id },
      include: { patient: true, profissionalResponsavel: true },
    }),
    prisma.waitlistSuggestion.findMany({
      where: { waitlistEntryId: id },
      include: { turmaSlot: { include: { professional: true } } },
      orderBy: { sugeridoEm: "desc" },
    }),
  ]);
  if (!entry) notFound();

  const pending = suggestions
    .filter((s) => s.aceito === null)
    .sort((a, b) => TIER_ORDER[a.tipo] - TIER_ORDER[b.tipo]);
  const resolved = suggestions.filter((s) => s.aceito !== null);

  const disponibilidade = (entry.disponibilidade ?? {}) as {
    diaSemana?: string;
    horario?: string;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{entry.patient.nomeCompleto}</h1>
          <p className="text-sm text-muted-foreground">
            {entry.tratamentoIndicado} · Prioridade {entry.prioridade} · na fila desde{" "}
            {entry.dataEntradaFila.toLocaleDateString("pt-BR")}
          </p>
        </div>
        <Badge variant={entry.status === "AGUARDANDO" ? "default" : "secondary"}>
          {entry.status}
        </Badge>
      </div>

      <div className="rounded-md border p-3 text-sm">
        <p>
          <span className="font-medium">Preferência:</span>{" "}
          {disponibilidade.diaSemana
            ? `${DIA_SEMANA_LABEL[disponibilidade.diaSemana]} ${disponibilidade.horario ?? ""}`
            : "Sem preferência específica"}
        </p>
        {entry.profissionalResponsavel && (
          <p>
            <span className="font-medium">Profissional responsável:</span>{" "}
            {entry.profissionalResponsavel.nome}
          </p>
        )}
        {entry.dentesEnvolvidos && (
          <p>
            <span className="font-medium">Dentes envolvidos:</span> {entry.dentesEnvolvidos}
          </p>
        )}
        {entry.observacoes && (
          <p>
            <span className="font-medium">Observações:</span> {entry.observacoes}
          </p>
        )}
      </div>

      {entry.status !== "AGENDADO" && entry.status !== "DESISTIU" && (
        <div className="flex flex-wrap gap-2">
          <form action={runSuggestion.bind(null, id)}>
            <Button type="submit">Sugerir horário</Button>
          </form>
          <form action={updateWaitlistStatus.bind(null, id, "CONTATADO")}>
            <Button variant="outline" type="submit">
              Marcar como contatado
            </Button>
          </form>
          <form action={updateWaitlistStatus.bind(null, id, "DESISTIU")}>
            <Button variant="outline" type="submit">
              Marcar como desistiu
            </Button>
          </form>
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Sugestões pendentes</h2>
          {pending.map((suggestion) => (
            <div
              key={suggestion.id}
              className="flex items-center justify-between rounded-md border p-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {DIA_SEMANA_LABEL[suggestion.turmaSlot.diaSemana]}{" "}
                  {suggestion.turmaSlot.horario} — {suggestion.turmaSlot.professional.nome}
                </p>
                <Badge variant="outline">{TIPO_LABEL[suggestion.tipo] ?? suggestion.tipo}</Badge>
              </div>
              <div className="flex gap-2">
                <AcceptSuggestionButton suggestionId={suggestion.id} />
                <form action={rejectSuggestion.bind(null, suggestion.id)}>
                  <Button size="sm" variant="outline" type="submit">
                    Rejeitar
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Sugestões resolvidas</h2>
          {resolved.map((suggestion) => (
            <div key={suggestion.id} className="rounded-md border p-3 text-sm text-muted-foreground">
              {DIA_SEMANA_LABEL[suggestion.turmaSlot.diaSemana]} {suggestion.turmaSlot.horario} —{" "}
              {suggestion.turmaSlot.professional.nome} ·{" "}
              {suggestion.aceito ? "Aceita" : "Rejeitada"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
