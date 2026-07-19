import { prisma } from "@/lib/prisma";
import { TurmaSlotForm } from "@/components/shared/turma-slot-form";
import { createTurmaSlot } from "@/actions/turmas/actions";

export default async function NovaTurmaPage() {
  const professionals = await prisma.professional.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nova turma</h1>
      <TurmaSlotForm action={createTurmaSlot} professionals={professionals} />
    </div>
  );
}
