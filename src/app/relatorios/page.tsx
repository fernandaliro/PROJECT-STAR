import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateOnly, toDateOnly, addDays } from "@/lib/dates";
import { DIA_SEMANA_LABEL, STATUS_OCORRENCIA_LABEL } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CopyButton } from "@/components/shared/copy-button";
import { AgendaSubNav } from "@/components/shared/agenda-sub-nav";

const STATUS_FILTRO_LABEL: Record<string, string> = {
  TODOS: "Todos",
  DESMARCADO: "Desmarcado",
  FALTA_INJUSTIFICADA: "Falta injustificada",
  FALTA_JUSTIFICADA: "Falta justificada",
};

export default async function RelatoriosPage(props: PageProps<"/relatorios">) {
  const searchParams = await props.searchParams;

  const hoje = new Date();
  const de =
    typeof searchParams.de === "string" ? searchParams.de : formatDateOnly(addDays(hoje, -30));
  const ate = typeof searchParams.ate === "string" ? searchParams.ate : formatDateOnly(hoje);
  const status: "TODOS" | "DESMARCADO" | "FALTA_INJUSTIFICADA" | "FALTA_JUSTIFICADA" =
    typeof searchParams.status === "string" && searchParams.status in STATUS_FILTRO_LABEL
      ? (searchParams.status as "DESMARCADO" | "FALTA_INJUSTIFICADA" | "FALTA_JUSTIFICADA" | "TODOS")
      : "TODOS";
  const professionalId =
    typeof searchParams.professionalId === "string" ? searchParams.professionalId : "";

  const [professionals, ocorrencias] = await Promise.all([
    prisma.professional.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    }),
    prisma.turmaOccurrenceEvent.findMany({
      where: {
        status: status === "TODOS" ? { not: "CONFIRMADO" } : status,
        data: { gte: toDateOnly(de), lte: toDateOnly(ate) },
        ...(professionalId ? { turmaSlot: { professionalId } } : {}),
      },
      include: {
        link: { include: { patient: true } },
        turmaSlot: { include: { professional: true } },
      },
      orderBy: { data: "desc" },
    }),
  ]);

  const counts = {
    DESMARCADO: ocorrencias.filter((o) => o.status === "DESMARCADO").length,
    FALTA_INJUSTIFICADA: ocorrencias.filter((o) => o.status === "FALTA_INJUSTIFICADA").length,
    FALTA_JUSTIFICADA: ocorrencias.filter((o) => o.status === "FALTA_JUSTIFICADA").length,
  };

  const resumoTexto = [
    `Relatório de desmarcações/faltas — ${de} a ${ate}`,
    professionalId
      ? `Profissional: ${professionals.find((p) => p.id === professionalId)?.nome ?? ""}`
      : "Todos os profissionais",
    `Desmarcações: ${counts.DESMARCADO}`,
    `Faltas injustificadas: ${counts.FALTA_INJUSTIFICADA}`,
    `Faltas justificadas: ${counts.FALTA_JUSTIFICADA}`,
    `Total: ${ocorrencias.length}`,
    "",
    ...ocorrencias.map(
      (o) =>
        `${o.data.toLocaleDateString("pt-BR")} — ${o.link.patient.nomeCompleto} — ${DIA_SEMANA_LABEL[o.turmaSlot.diaSemana]} ${o.turmaSlot.horario} (${o.turmaSlot.professional.nome}) — ${STATUS_OCORRENCIA_LABEL[o.status]}${o.motivo ? ` (${o.motivo})` : ""}`
    ),
  ].join("\n");

  return (
    <div className="space-y-6">
      <AgendaSubNav />
      <h1 className="text-2xl font-semibold">Relatórios</h1>

      <form className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="de">De</Label>
          <Input id="de" name="de" type="date" defaultValue={de} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ate">Até</Label>
          <Input id="ate" name="ate" type="date" defaultValue={ate} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" items={STATUS_FILTRO_LABEL} defaultValue={status}>
            <SelectTrigger id="status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_FILTRO_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="professionalId">Profissional</Label>
          <Select
            name="professionalId"
            items={Object.fromEntries(professionals.map((p) => [p.id, p.nome]))}
            defaultValue={professionalId || undefined}
          >
            <SelectTrigger id="professionalId" className="w-full">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              {professionals.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit">Filtrar</Button>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline">Desmarcações: {counts.DESMARCADO}</Badge>
        <Badge variant="destructive">Faltas injustificadas: {counts.FALTA_INJUSTIFICADA}</Badge>
        <Badge variant="outline">Faltas justificadas: {counts.FALTA_JUSTIFICADA}</Badge>
        <Badge>Total: {ocorrencias.length}</Badge>
        <CopyButton text={resumoTexto} label="Copiar resumo para analistas" />
      </div>

      <div className="space-y-2">
        {ocorrencias.map((o) => (
          <div key={o.id} className="rounded-md border p-3 text-sm">
            <div className="flex items-center justify-between">
              <Link href={`/pacientes/${o.link.patientId}`} className="font-medium hover:underline">
                {o.link.patient.nomeCompleto}
              </Link>
              <Badge variant={o.status === "FALTA_INJUSTIFICADA" ? "destructive" : "outline"}>
                {STATUS_OCORRENCIA_LABEL[o.status]}
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground">
              {o.data.toLocaleDateString("pt-BR")} ·{" "}
              <Link href={`/turmas/${o.turmaSlotId}`} className="hover:underline">
                {DIA_SEMANA_LABEL[o.turmaSlot.diaSemana]} {o.turmaSlot.horario} —{" "}
                {o.turmaSlot.professional.nome}
              </Link>
              {o.motivo ? ` · ${o.motivo}` : ""}
            </p>
          </div>
        ))}
        {ocorrencias.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma desmarcação ou falta no período selecionado.
          </p>
        )}
      </div>
    </div>
  );
}
