import { PatientForm } from "@/components/shared/patient-form";
import { createPatient } from "@/actions/pacientes/actions";

export default function NovoPacientePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Novo paciente</h1>
      <PatientForm action={createPatient} />
    </div>
  );
}
