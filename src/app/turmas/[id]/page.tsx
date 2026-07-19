import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { computeTurmaName } from "@/lib/turma-name";
import { DIA_SEMANA_LABEL, STATUS_OCORRENCIA_LABEL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/components/shared/copy-button";
import { DeleteTurmaButton } from "@/components/shared/delete-turma-button";
import { RemoverVinculoButton } from "@/components/shared/remover-vinculo-button";
import { AgendaSubNav } from "@/components/shared/agenda-sub-nav";
import { BackLink } from "@/components/shared/back-link";
import { deactivateTurmaSlot } from "@/actions/turmas/actions";

export default async function TurmaDetailPage(
  props: PageProps<"/turmas/[id]">
) {
  const { id } = await props.params;

  const [turmaSlot, nome, links, ocorrencias] = await Promise.all([
    prisma.turmaSlot.findUnique({
      where: { id },
      include: { professional: true },
    }),
    computeTurmaName(id),
    prisma.patientTurmaLink.findMany({
      where: { turmaSlotId: id },
      include: { patient: true },
      orderBy: { dataEntrada: "desc" },
    }),
    prisma.turmaOccurrenceEvent.findMany({
      where: { turmaSlotId: id, status: { not: "CONFIRMADO" } },
      include: { link: { include: { patient: true } } },
      orderBy: { data: "desc" },
      take: 30,
    }),
  ]);
  if (!turmaSlot) notFound();

  const activeLinks = links.filter((link) => link.status === "ATIVO");

  return (
    <div className="space-y-6">
      <AgendaSubNav />
      <BackLink href="/turmas" label="Voltar para Turmas" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{nome}</h1>
          <p className="text-sm text-muted-foreground">
            {DIA_SEMANA_LABEL[turmaSlot.diaSemana]} {turmaSlot.horario} —{" "}
            {turmaSlot.professional.nome} ·{" "}
            {turmaSlot.tipoAtendimento === "GRUPO" ? "Grupo" : "Individual"}
            {turmaSlot.modalidade ? ` · ${turmaSlot.modalidade}` : ""}
            {turmaSlot.duracaoMinutos ? ` · ${turmaSlot.duracaoMinutos}min` : ""}
            {turmaSlot.capacidade ? ` · ${activeLinks.length}/${turmaSlot.capacidade} ocupados` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton text={nome} label="Copiar nome" />
          <Button variant="outline" nativeButton={false} render={<Link href={`/turmas/${id}/editar`} />}>
            Editar turma
          </Button>
          {turmaSlot.ativo ? (
            <form action={deactivateTurmaSlot.bind(null, id)}>
              <Button variant="outline" type="submit">
                Desativar turma
              </Button>
            </form>
          ) : (
            <Badge variant="secondary">Inativa</Badge>
          )}
          <DeleteTurmaButton id={id} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" nativeButton={false} render={<Link href={`/turmas/${id}/matricular`} />}>
          Matricular paciente
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href={`/turmas/${id}/ocorrencia`} />}>
          Registrar desmarcação/falta
        </Button>
      </div>

      <Tabs defaultValue="ativos">
        <TabsList>
          <TabsTrigger value="ativos">Vínculos ativos ({activeLinks.length})</TabsTrigger>
          <TabsTrigger value="todos">Todos os vínculos ({links.length})</TabsTrigger>
          <TabsTrigger value="ocorrencias">
            Desmarcações/faltas ({ocorrencias.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ativos" className="space-y-2">
          {activeLinks.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum vínculo ativo nesta turma.
            </p>
          )}
          {activeLinks.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between rounded-md border p-3 text-sm"
            >
              <div>
                <Link
                  href={`/pacientes/${link.patientId}`}
                  className="font-medium hover:underline"
                >
                  {link.patient.nomeCompleto}
                </Link>
                <p className="text-muted-foreground">
                  Entrada: {link.dataEntrada.toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false} render={<Link href={`/turmas/${id}/alta?linkId=${link.id}`} />}
                >
                  Registrar alta
                </Button>
                <RemoverVinculoButton linkId={link.id} />
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="todos" className="space-y-2">
          {links.map((link) => (
            <div key={link.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between">
                <Link
                  href={`/pacientes/${link.patientId}`}
                  className="font-medium hover:underline"
                >
                  {link.patient.nomeCompleto}
                </Link>
                <Badge variant={link.status === "ATIVO" ? "default" : "secondary"}>
                  {link.status === "ATIVO" ? "Ativo" : "Alta"}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground">
                Entrada: {link.dataEntrada.toLocaleDateString("pt-BR")}
                {link.dataSaida &&
                  ` · Saída: ${link.dataSaida.toLocaleDateString("pt-BR")}`}
              </p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="ocorrencias" className="space-y-2">
          {ocorrencias.map((ocorrencia) => (
            <div key={ocorrencia.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{ocorrencia.link.patient.nomeCompleto}</span>
                <Badge
                  variant={
                    ocorrencia.status === "FALTA_INJUSTIFICADA" ? "destructive" : "outline"
                  }
                >
                  {STATUS_OCORRENCIA_LABEL[ocorrencia.status]}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground">
                {ocorrencia.data.toLocaleDateString("pt-BR")}
                {ocorrencia.motivo ? ` · ${ocorrencia.motivo}` : ""}
              </p>
            </div>
          ))}
          {ocorrencias.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma desmarcação ou falta registrada nesta turma.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
