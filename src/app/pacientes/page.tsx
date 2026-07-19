import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { searchableName } from "@/lib/names";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

export default async function PacientesPage(props: PageProps<"/pacientes">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";

  const patients = await prisma.patient.findMany({
    where: q
      ? { nomeNormalizado: { contains: searchableName(q) } }
      : undefined,
    orderBy: { nomeCompleto: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pacientes</h1>
        <Button nativeButton={false} render={<Link href="/pacientes/novo" />}>Novo paciente</Button>
      </div>

      <form className="max-w-sm">
        <Input
          type="search"
          name="q"
          placeholder="Buscar por nome..."
          defaultValue={q}
        />
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Matrícula SIGOP</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell>
                <Link
                  href={`/pacientes/${patient.id}`}
                  className="font-medium hover:underline"
                >
                  {patient.nomeCompleto}
                </Link>
              </TableCell>
              <TableCell>{patient.matriculaSigop}</TableCell>
              <TableCell>
                <Badge
                  variant={patient.status === "ATIVO" ? "default" : "secondary"}
                >
                  {patient.status === "ATIVO" ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {patients.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Nenhum paciente encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
