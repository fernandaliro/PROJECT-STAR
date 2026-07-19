import { prisma } from "@/lib/prisma";
import { TurmaSlotForm } from "@/components/shared/turma-slot-form";
import { AgendaSubNav } from "@/components/shared/agenda-sub-nav";
import { BackLink } from "@/components/shared/back-link";
import { createTurmaSlot } from "@/actions/turmas/actions";

export const dynamic = "force-dynamic";

export default async function NovaTurmaPage() {
  const [professionals, patients] = await Promise.all([
    prisma.professional.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.patient.findMany({ where: { status: "ATIVO" }, orderBy: { nomeCompleto: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <AgendaSubNav />
      <BackLink href="/turmas" label="Voltar para Turmas" />
      <h1 className="text-2xl font-semibold">Nova turma</h1>
      <TurmaSlotForm
        action={createTurmaSlot}
        professionals={professionals}
        patients={patients}
        diaSemanaMode="multi"
      />
    </div>
  );
}
