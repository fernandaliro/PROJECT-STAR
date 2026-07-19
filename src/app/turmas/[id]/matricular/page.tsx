import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LinkForm } from "@/components/shared/link-form";
import { createLink } from "@/actions/turmas/actions";

export default async function MatricularPage(
  props: PageProps<"/turmas/[id]/matricular">
) {
  const { id } = await props.params;

  const turmaSlot = await prisma.turmaSlot.findUnique({ where: { id } });
  if (!turmaSlot) notFound();

  const patients = await prisma.patient.findMany({
    where: { status: "ATIVO" },
    orderBy: { nomeCompleto: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Matricular paciente na turma</h1>
      <LinkForm action={createLink} turmaSlotId={id} patients={patients} />
    </div>
  );
}
