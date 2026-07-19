import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DIA_SEMANA_LABEL } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  classifyFaltaFromImport,
  includePacienteNovo,
  resolveDiffResult,
} from "@/actions/csv-import/actions";

export default async function CsvImportDetailPage(
  props: PageProps<"/csv-import/[importId]">
) {
  const { importId } = await props.params;

  const [csvImport, diffResults, discardedRows] = await Promise.all([
    prisma.csvImport.findUnique({ where: { id: importId } }),
    prisma.csvDiffResult.findMany({
      where: { csvImportId: importId },
      include: {
        turmaSlot: { include: { professional: true } },
        patient: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.csvImportRow.findMany({
      where: { csvImportId: importId, status: "DESCARTADA_MALFORMADA" },
      orderBy: { numeroLinha: "asc" },
    }),
  ]);
  if (!csvImport) notFound();

  const byClass = (classification: string) =>
    diffResults.filter((d) => d.classification === classification);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{csvImport.arquivoNome}</h1>
        <p className="text-sm text-muted-foreground">
          Importado em {csvImport.importadoEm.toLocaleString("pt-BR")} por{" "}
          {csvImport.importadoPor} · {csvImport.linhasValidas} linhas válidas,{" "}
          {csvImport.linhasDescartadas} descartadas
        </p>
      </div>

      <Tabs defaultValue="PACIENTE_NOVO">
        <TabsList>
          <TabsTrigger value="PACIENTE_NOVO">
            Paciente novo ({byClass("PACIENTE_NOVO").length})
          </TabsTrigger>
          <TabsTrigger value="DESMARCACAO_FALTA_DIA">
            Desmarcação/falta ({byClass("DESMARCACAO_FALTA_DIA").length})
          </TabsTrigger>
          <TabsTrigger value="ALTA_APLICADA">
            Alta aplicada ({byClass("ALTA_APLICADA").length})
          </TabsTrigger>
          <TabsTrigger value="POSSIVEL_ALTA_PENDENTE">
            Possível alta pendente ({byClass("POSSIVEL_ALTA_PENDENTE").length})
          </TabsTrigger>
          <TabsTrigger value="MUDANCA_ESTRUTURAL">
            Mudança estrutural ({byClass("MUDANCA_ESTRUTURAL").length})
          </TabsTrigger>
          <TabsTrigger value="descartadas">
            Linhas descartadas ({discardedRows.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="PACIENTE_NOVO" className="space-y-2">
          {byClass("PACIENTE_NOVO").map((diff) => (
            <div
              key={diff.id}
              className="flex items-center justify-between rounded-md border p-3 text-sm"
            >
              <div>
                <p className="font-medium">{diff.patient?.nomeCompleto}</p>
                <p className="text-muted-foreground">
                  {diff.turmaSlot &&
                    `${DIA_SEMANA_LABEL[diff.turmaSlot.diaSemana]} ${diff.turmaSlot.horario} — ${diff.turmaSlot.professional.nome}`}
                </p>
              </div>
              {diff.resolvido ? (
                <Badge variant="secondary">Resolvido</Badge>
              ) : (
                <form action={includePacienteNovo.bind(null, diff.id)}>
                  <Button size="sm" type="submit">
                    Incluir na turma
                  </Button>
                </form>
              )}
            </div>
          ))}
          {byClass("PACIENTE_NOVO").length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum paciente novo nesta importação.</p>
          )}
        </TabsContent>

        <TabsContent value="DESMARCACAO_FALTA_DIA" className="space-y-2">
          {byClass("DESMARCACAO_FALTA_DIA").map((diff) => {
            const detalhe = (diff.detalhe ?? {}) as { data?: string; status?: string };
            const pendenteClassificacao = detalhe.status === "FALTA_PENDENTE_CLASSIFICACAO";
            return (
              <div key={diff.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{diff.patient?.nomeCompleto}</p>
                    <p className="text-muted-foreground">
                      {diff.turmaSlot &&
                        `${DIA_SEMANA_LABEL[diff.turmaSlot.diaSemana]} ${diff.turmaSlot.horario} — ${diff.turmaSlot.professional.nome}`}{" "}
                      · {pendenteClassificacao ? "Faltou" : detalhe.status} em {detalhe.data}
                    </p>
                  </div>
                  {pendenteClassificacao && !diff.resolvido && (
                    <div className="flex gap-2">
                      <form action={classifyFaltaFromImport.bind(null, diff.id, "FALTA_INJUSTIFICADA")}>
                        <Button size="sm" type="submit">
                          Injustificada
                        </Button>
                      </form>
                      <form action={classifyFaltaFromImport.bind(null, diff.id, "FALTA_JUSTIFICADA")}>
                        <Button size="sm" variant="outline" type="submit">
                          Justificada
                        </Button>
                      </form>
                    </div>
                  )}
                  {diff.resolvido && <Badge variant="secondary">Classificada</Badge>}
                </div>
              </div>
            );
          })}
          {byClass("DESMARCACAO_FALTA_DIA").length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma desmarcação/falta nesta importação.</p>
          )}
        </TabsContent>

        <TabsContent value="ALTA_APLICADA" className="space-y-2">
          {byClass("ALTA_APLICADA").map((diff) => (
            <div key={diff.id} className="rounded-md border p-3 text-sm text-muted-foreground">
              {diff.patient?.nomeCompleto} —{" "}
              {diff.turmaSlot &&
                `${DIA_SEMANA_LABEL[diff.turmaSlot.diaSemana]} ${diff.turmaSlot.horario} — ${diff.turmaSlot.professional.nome}`}{" "}
              · ainda aparece no CSV apesar da alta (possível atraso do SIGOP)
            </div>
          ))}
          {byClass("ALTA_APLICADA").length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma alta aplicada sinalizada.</p>
          )}
        </TabsContent>

        <TabsContent value="POSSIVEL_ALTA_PENDENTE" className="space-y-2">
          {byClass("POSSIVEL_ALTA_PENDENTE").map((diff) => {
            const detalhe = (diff.detalhe ?? {}) as { missedCount?: number };
            return (
              <div
                key={diff.id}
                className="flex items-center justify-between rounded-md border border-amber-500/50 p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{diff.patient?.nomeCompleto}</p>
                  <p className="text-muted-foreground">
                    {diff.turmaSlot &&
                      `${DIA_SEMANA_LABEL[diff.turmaSlot.diaSemana]} ${diff.turmaSlot.horario} — ${diff.turmaSlot.professional.nome}`}{" "}
                    · ausente em {detalhe.missedCount} importações seguidas — verificar se houve alta
                  </p>
                </div>
                {diff.resolvido ? (
                  <Badge variant="secondary">Resolvido</Badge>
                ) : (
                  <form action={resolveDiffResult.bind(null, diff.id)}>
                    <Button size="sm" variant="outline" type="submit">
                      Marcar como verificado
                    </Button>
                  </form>
                )}
              </div>
            );
          })}
          {byClass("POSSIVEL_ALTA_PENDENTE").length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum alerta de possível alta pendente.</p>
          )}
        </TabsContent>

        <TabsContent value="MUDANCA_ESTRUTURAL" className="space-y-2">
          {byClass("MUDANCA_ESTRUTURAL").map((diff) => (
            <div
              key={diff.id}
              className="rounded-md border border-destructive/50 p-3 text-sm"
            >
              <p className="font-medium">
                {diff.turmaSlot &&
                  `${DIA_SEMANA_LABEL[diff.turmaSlot.diaSemana]} ${diff.turmaSlot.horario} — ${diff.turmaSlot.professional.nome}`}
              </p>
              <p className="text-muted-foreground">
                Esta turma não apareceu nesta importação — pode ter mudado de dia/horário/profissional ou saído do SIGOP. Verifique manualmente.
              </p>
            </div>
          ))}
          {byClass("MUDANCA_ESTRUTURAL").length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma mudança estrutural detectada.</p>
          )}
        </TabsContent>

        <TabsContent value="descartadas" className="space-y-2">
          {discardedRows.map((row) => (
            <div key={row.id} className="rounded-md border p-3 text-sm">
              <p className="font-medium">Linha {row.numeroLinha}</p>
              <p className="text-muted-foreground">{row.motivoDescarte}</p>
            </div>
          ))}
          {discardedRows.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma linha descartada.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
