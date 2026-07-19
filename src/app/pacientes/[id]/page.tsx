import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deactivatePatient, reactivatePatient } from "@/actions/pacientes/actions";
import { DIA_SEMANA_LABEL } from "@/lib/constants";

export default async function PacienteDetailPage(
  props: PageProps<"/pacientes/[id]">
) {
  const { id } = await props.params;

  const [patient, links] = await Promise.all([
    prisma.patient.findUnique({ where: { id } }),
    prisma.patientTurmaLink.findMany({
      where: { patientId: id },
      include: { turmaSlot: { include: { professional: true } } },
      orderBy: { dataEntrada: "desc" },
    }),
  ]);
  if (!patient) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{patient.nomeCompleto}</h1>
          <p className="text-sm text-muted-foreground">
            Matrícula SIGOP: {patient.matriculaSigop}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={patient.status === "ATIVO" ? "default" : "secondary"}>
            {patient.status === "ATIVO" ? "Ativo" : "Inativo"}
          </Badge>
          <Button variant="outline" nativeButton={false} render={<Link href={`/pacientes/${id}/editar`} />}>
            Editar
          </Button>
          {patient.status === "ATIVO" ? (
            <form action={deactivatePatient.bind(null, id)}>
              <Button variant="outline" type="submit">
                Inativar
              </Button>
            </form>
          ) : (
            <form action={reactivatePatient.bind(null, id)}>
              <Button variant="outline" type="submit">
                Reativar
              </Button>
            </form>
          )}
        </div>
      </div>

      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados gerais</TabsTrigger>
          <TabsTrigger value="vinculos">Vínculos ({links.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Observações:</span>{" "}
            {patient.observacoes || "—"}
          </p>
          <p className="text-muted-foreground">
            Cadastrado em {patient.createdAt.toLocaleString("pt-BR")}
          </p>
        </TabsContent>

        <TabsContent value="vinculos" className="space-y-3">
          {links.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum vínculo com turma registrado.
            </p>
          )}
          {links.map((link) => (
            <div key={link.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {link.turmaSlot.professional.nome} —{" "}
                  {DIA_SEMANA_LABEL[link.turmaSlot.diaSemana]}{" "}
                  {link.turmaSlot.horario}
                </span>
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
      </Tabs>
    </div>
  );
}
