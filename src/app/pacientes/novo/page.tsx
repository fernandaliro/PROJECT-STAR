import { PatientForm } from "@/components/shared/patient-form";
import { BackLink } from "@/components/shared/back-link";
import { createPatient } from "@/actions/pacientes/actions";

export default function NovoPacientePage() {
  return (
    <div className="space-y-6">
      <BackLink href="/pacientes" label="Voltar para Pacientes" />
      <h1 className="text-2xl font-semibold">Novo paciente</h1>
      <PatientForm action={createPatient} />
    </div>
  );
}
