import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AgendaSubNav } from "@/components/shared/agenda-sub-nav";

const ESPECIALIDADE_LABEL: Record<string, string> = {
  FISIOTERAPIA: "Fisioterapia",
  ODONTOLOGIA: "Odontologia",
  PSICOLOGIA: "Psicologia",
};

const STATUS_LABEL: Record<string, string> = {
  AGUARDANDO: "Aguardando",
  CONTATADO: "Contatado",
  AGENDADO: "Agendado",
  DESISTIU: "Desistiu",
};

export default async function FilaEsperaPage(props: PageProps<"/fila-espera">) {
  const searchParams = await props.searchParams;
  const especialidade =
    typeof searchParams.especialidade === "string" ? searchParams.especialidade : undefined;

  const entries = await prisma.waitlistEntry.findMany({
    where: {
      status: { in: ["AGUARDANDO", "CONTATADO"] },
      ...(especialidade ? { especialidade: especialidade as never } : {}),
    },
    include: { patient: true },
    orderBy: [{ prioridade: "asc" }, { dataEntradaFila: "asc" }],
  });

  return (
    <div className="space-y-6">
      <AgendaSubNav />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Fila de espera</h1>
        <Button nativeButton={false} render={<Link href="/fila-espera/nova" />}>
          Adicionar à fila
        </Button>
      </div>

      <div className="flex gap-2">
        {["FISIOTERAPIA", "ODONTOLOGIA", "PSICOLOGIA"].map((esp) => (
          <Button
            key={esp}
            size="sm"
            variant={especialidade === esp ? "default" : "outline"}
            nativeButton={false}
            render={<Link href={`/fila-espera?especialidade=${esp}`} />}
          >
            {ESPECIALIDADE_LABEL[esp]}
          </Button>
        ))}
        <Button
          size="sm"
          variant={!especialidade ? "default" : "outline"}
          nativeButton={false}
          render={<Link href="/fila-espera" />}
        >
          Todas
        </Button>
      </div>

      <div className="space-y-2">
        {entries.map((entry) => (
          <Link
            key={entry.id}
            href={`/fila-espera/${entry.id}`}
            className="block rounded-md border p-3 text-sm hover:bg-accent"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {entry.patient.nomeCompleto} — {ESPECIALIDADE_LABEL[entry.especialidade]}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Prioridade {entry.prioridade}</Badge>
                <Badge variant={entry.status === "AGUARDANDO" ? "default" : "secondary"}>
                  {STATUS_LABEL[entry.status]}
                </Badge>
              </div>
            </div>
            <p className="mt-1 text-muted-foreground">
              {entry.tratamentoIndicado} · na fila desde{" "}
              {entry.dataEntradaFila.toLocaleDateString("pt-BR")}
            </p>
          </Link>
        ))}
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">Fila vazia.</p>
        )}
      </div>
    </div>
  );
}
