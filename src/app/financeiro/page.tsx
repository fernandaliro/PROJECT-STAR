import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AbonoForm,
  CobrancaForm,
  JustificativaForm,
} from "@/components/shared/pendency-actions";
import { markPaga } from "@/actions/financeiro/actions";
import { AgendaSubNav } from "@/components/shared/agenda-sub-nav";

export const dynamic = "force-dynamic";

const ORIGEM_LABEL: Record<string, string> = {
  FALTA_INJUSTIFICADA: "Falta injustificada",
};

export default async function FinanceiroPage() {
  const [abertas, resolvidas] = await Promise.all([
    prisma.financialPendency.findMany({
      where: { status: "ABERTA" },
      include: { patient: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.financialPendency.findMany({
      where: { status: { not: "ABERTA" } },
      include: { patient: true },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
  ]);

  const patientIdsComPendencia = abertas.map((p) => p.patientId);
  const comAgendamentoAtivo = patientIdsComPendencia.length
    ? await prisma.patient.findMany({
        where: {
          id: { in: patientIdsComPendencia },
          links: { some: { status: "ATIVO" } },
        },
      })
    : [];
  const alertaIds = new Set(comAgendamentoAtivo.map((p) => p.id));

  return (
    <div className="space-y-8">
      <AgendaSubNav />
      <h1 className="text-2xl font-semibold">Financeiro</h1>

      {alertaIds.size > 0 && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4">
          <p className="mb-2 text-sm font-medium text-destructive">
            Atenção: pacientes com multa em aberto e agendamento ativo
          </p>
          <ul className="space-y-1 text-sm">
            {abertas
              .filter((p) => alertaIds.has(p.patientId))
              .map((p) => (
                <li key={p.id}>
                  <Link href={`/pacientes/${p.patientId}`} className="hover:underline">
                    {p.patient.nomeCompleto}
                  </Link>{" "}
                  — {ORIGEM_LABEL[p.origem]} · R$ {p.valor.toString()}
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Pendências abertas ({abertas.length})</h2>
        {abertas.map((pendency) => (
          <div key={pendency.id} className="space-y-2 rounded-md border p-3 text-sm">
            <div className="flex items-center justify-between">
              <Link href={`/pacientes/${pendency.patientId}`} className="font-medium hover:underline">
                {pendency.patient.nomeCompleto}
              </Link>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{ORIGEM_LABEL[pendency.origem]}</Badge>
                <Badge variant="destructive">R$ {pendency.valor.toString()}</Badge>
              </div>
            </div>
            <p className="text-muted-foreground">
              Aberta em {pendency.createdAt.toLocaleDateString("pt-BR")}
            </p>
            <div className="flex flex-wrap items-center gap-3 border-t pt-2">
              <form action={markPaga.bind(null, pendency.id)}>
                <Button type="submit" size="xs">
                  Marcar como paga
                </Button>
              </form>
              <JustificativaForm pendencyId={pendency.id} />
              <AbonoForm pendencyId={pendency.id} />
              <CobrancaForm
                pendencyId={pendency.id}
                defaultCanal={pendency.canalCobranca}
                defaultStatus={pendency.statusCobranca}
              />
            </div>
          </div>
        ))}
        {abertas.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma pendência em aberto.</p>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Resolvidas recentemente</h2>
        {resolvidas.map((pendency) => (
          <div key={pendency.id} className="rounded-md border p-3 text-sm text-muted-foreground">
            {pendency.patient.nomeCompleto} — {ORIGEM_LABEL[pendency.origem]} ·{" "}
            <Badge variant="secondary">{pendency.status}</Badge>
          </div>
        ))}
        {resolvidas.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma pendência resolvida ainda.</p>
        )}
      </div>
    </div>
  );
}
