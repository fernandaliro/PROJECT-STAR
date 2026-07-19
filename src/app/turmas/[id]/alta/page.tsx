import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AltaForm } from "@/components/shared/alta-form";
import { registrarAlta } from "@/actions/turmas/actions";

export default async function AltaPage(
  props: PageProps<"/turmas/[id]/alta">
) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const defaultLinkId =
    typeof searchParams.linkId === "string" ? searchParams.linkId : undefined;

  const turmaSlot = await prisma.turmaSlot.findUnique({ where: { id } });
  if (!turmaSlot) notFound();

  const links = await prisma.patientTurmaLink.findMany({
    where: { turmaSlotId: id, status: "ATIVO" },
    include: { patient: true },
    orderBy: { dataEntrada: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Registrar alta</h1>
      <AltaForm
        action={registrarAlta}
        links={links.map((link) => ({
          id: link.id,
          nomeCompleto: link.patient.nomeCompleto,
        }))}
        defaultLinkId={defaultLinkId}
      />
    </div>
  );
}
