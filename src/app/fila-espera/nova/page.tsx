import { prisma } from "@/lib/prisma";
import { WaitlistEntryForm } from "@/components/shared/waitlist-entry-form";
import { AgendaSubNav } from "@/components/shared/agenda-sub-nav";
import { BackLink } from "@/components/shared/back-link";
import { createWaitlistEntry } from "@/actions/fila-espera/actions";

export const dynamic = "force-dynamic";

export default async function NovaFilaEsperaPage() {
  const [patients, professionals] = await Promise.all([
    prisma.patient.findMany({ where: { status: "ATIVO" }, orderBy: { nomeCompleto: "asc" } }),
    prisma.professional.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <AgendaSubNav />
      <BackLink href="/fila-espera" label="Voltar para Fila de espera" />
      <h1 className="text-2xl font-semibold">Adicionar à fila de espera</h1>
      <WaitlistEntryForm
        action={createWaitlistEntry}
        patients={patients}
        professionals={professionals}
      />
    </div>
  );
}
