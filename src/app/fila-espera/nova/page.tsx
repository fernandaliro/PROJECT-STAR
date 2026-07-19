import { prisma } from "@/lib/prisma";
import { WaitlistEntryForm } from "@/components/shared/waitlist-entry-form";
import { createWaitlistEntry } from "@/actions/fila-espera/actions";

export const dynamic = "force-dynamic";

export default async function NovaFilaEsperaPage() {
  const [patients, professionals] = await Promise.all([
    prisma.patient.findMany({ where: { status: "ATIVO" }, orderBy: { nomeCompleto: "asc" } }),
    prisma.professional.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Adicionar à fila de espera</h1>
      <WaitlistEntryForm
        action={createWaitlistEntry}
        patients={patients}
        professionals={professionals}
      />
    </div>
  );
}
