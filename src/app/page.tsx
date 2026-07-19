import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { addDays } from "@/lib/dates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Página lê dados ao vivo do banco a cada visita — sem isso o Next.js tenta
// pré-renderizar como estática no build, congelando os números.
export const dynamic = "force-dynamic";

const ESPECIALIDADE_LABEL: Record<string, string> = {
  FISIOTERAPIA: "Fisioterapia",
  ODONTOLOGIA: "Odontologia",
  PSICOLOGIA: "Psicologia",
};

export default async function DashboardPage() {
  const seteDiasAtras = addDays(new Date(), -7);

  const [
    pacientesAtivos,
    turmasAtivas,
    filaEsperaPorEspecialidade,
    pendenciasAbertas,
    desmarcacoesRecentes,
    faltasInjustificadasRecentes,
    ultimoImport,
    pendenciasAlerta,
  ] = await Promise.all([
    prisma.patient.count({ where: { status: "ATIVO" } }),
    prisma.turmaSlot.count({ where: { ativo: true } }),
    prisma.waitlistEntry.groupBy({
      by: ["especialidade"],
      where: { status: { in: ["AGUARDANDO", "CONTATADO"] } },
      _count: true,
    }),
    prisma.financialPendency.aggregate({
      where: { status: "ABERTA" },
      _count: true,
      _sum: { valor: true },
    }),
    prisma.turmaOccurrenceEvent.count({
      where: { status: "DESMARCADO", data: { gte: seteDiasAtras } },
    }),
    prisma.turmaOccurrenceEvent.count({
      where: { status: "FALTA_INJUSTIFICADA", data: { gte: seteDiasAtras } },
    }),
    prisma.csvImport.findFirst({
      orderBy: { importadoEm: "desc" },
      include: { professional: true },
    }),
    prisma.financialPendency.findMany({
      where: { status: "ABERTA", patient: { links: { some: { status: "ATIVO" } } } },
      include: { patient: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const filaTotal = filaEsperaPorEspecialidade.reduce((sum, g) => sum + g._count, 0);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/pacientes">
          <Card className="transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle className="text-3xl">{pacientesAtivos}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Pacientes ativos</CardContent>
          </Card>
        </Link>
        <Link href="/turmas">
          <Card className="transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle className="text-3xl">{turmasAtivas}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Turmas ativas</CardContent>
          </Card>
        </Link>
        <Link href="/fila-espera">
          <Card className="transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle className="text-3xl">{filaTotal}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Na fila de espera</CardContent>
          </Card>
        </Link>
        <Link href="/financeiro">
          <Card className="transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle className="text-3xl">{pendenciasAbertas._count}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Pendências abertas · R$ {(pendenciasAbertas._sum.valor ?? 0).toString()}
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimos 7 dias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">{desmarcacoesRecentes}</span> desmarcação(ões)
            </p>
            <p>
              <span className="font-medium">{faltasInjustificadasRecentes}</span> falta(s) injustificada(s)
            </p>
            <Link href="/relatorios" className="text-primary hover:underline">
              Ver relatório completo →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fila de espera por especialidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {filaEsperaPorEspecialidade.map((g) => (
              <p key={g.especialidade}>
                {ESPECIALIDADE_LABEL[g.especialidade]}:{" "}
                <span className="font-medium">{g._count}</span>
              </p>
            ))}
            {filaEsperaPorEspecialidade.length === 0 && (
              <p className="text-muted-foreground">Fila vazia.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {pendenciasAlerta.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Multa em aberto + agendamento ativo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {pendenciasAlerta.map((p) => (
              <Link
                key={p.id}
                href={`/pacientes/${p.patientId}`}
                className="block hover:underline"
              >
                {p.patient.nomeCompleto} — R$ {p.valor.toString()}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {ultimoImport && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Última importação de CSV</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <Link href={`/csv-import/${ultimoImport.id}`} className="hover:underline">
              {ultimoImport.arquivoNome} — {ultimoImport.professional.nome} em{" "}
              {ultimoImport.importadoEm.toLocaleDateString("pt-BR")}
            </Link>
            <span> · {ultimoImport.countPacienteNovo} novo(s), {ultimoImport.countDesmarcacaoFalta} desmarcação/falta</span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/agenda">
          <Card className="transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle>Agenda</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Visualização diária, semanal e mensal — turmas e importação de CSV
            </CardContent>
          </Card>
        </Link>
        <Link href="/escalas">
          <Card className="transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle>Escalas</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Disponibilidade dos profissionais
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
