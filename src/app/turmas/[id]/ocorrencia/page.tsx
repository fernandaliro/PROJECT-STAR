import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OcorrenciaForm } from "@/components/shared/ocorrencia-form";
import { registrarOcorrencia } from "@/actions/turmas/actions";

export default async function OcorrenciaPage(
  props: PageProps<"/turmas/[id]/ocorrencia">
) {
  const { id } = await props.params;

  const turmaSlot = await prisma.turmaSlot.findUnique({ where: { id } });
  if (!turmaSlot) notFound();

  const links = await prisma.patientTurmaLink.findMany({
    where: { turmaSlotId: id, status: "ATIVO" },
    include: { patient: true },
    orderBy: { dataEntrada: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Registrar desmarcação/falta</h1>
      <OcorrenciaForm
        action={registrarOcorrencia}
        links={links.map((link) => ({
          id: link.id,
          nomeCompleto: link.patient.nomeCompleto,
        }))}
      />
    </div>
  );
}
