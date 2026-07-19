import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TurmaSlotForm } from "@/components/shared/turma-slot-form";
import { updateTurmaSlot } from "@/actions/turmas/actions";

export const dynamic = "force-dynamic";

export default async function EditarTurmaPage(
  props: PageProps<"/turmas/[id]/editar">
) {
  const { id } = await props.params;

  const [turmaSlot, professionals] = await Promise.all([
    prisma.turmaSlot.findUnique({ where: { id } }),
    prisma.professional.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);
  if (!turmaSlot) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar turma</h1>
      <TurmaSlotForm
        action={updateTurmaSlot.bind(null, id)}
        professionals={professionals}
        submitLabel="Salvar alterações"
        initial={{
          diaSemana: turmaSlot.diaSemana,
          horario: turmaSlot.horario,
          professionalId: turmaSlot.professionalId,
          tipoAtendimento: turmaSlot.tipoAtendimento,
          modalidade: turmaSlot.modalidade,
          capacidade: turmaSlot.capacidade,
          duracaoMinutos: turmaSlot.duracaoMinutos,
        }}
      />
    </div>
  );
}
