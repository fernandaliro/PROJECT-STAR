import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PatientForm } from "@/components/shared/patient-form";
import { updatePatient } from "@/actions/pacientes/actions";

export default async function EditarPacientePage(
  props: PageProps<"/pacientes/[id]/editar">
) {
  const { id } = await props.params;
  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Editar paciente</h1>
      <PatientForm action={updatePatient.bind(null, id)} defaultValues={patient} />
    </div>
  );
}
