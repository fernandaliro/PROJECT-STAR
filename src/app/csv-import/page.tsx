import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CsvUploadForm } from "@/components/shared/csv-upload-form";
import { AgendaSubNav } from "@/components/shared/agenda-sub-nav";

export default async function CsvImportPage() {
  const [imports, professionals] = await Promise.all([
    prisma.csvImport.findMany({
      orderBy: { importadoEm: "desc" },
      take: 30,
      include: { professional: true },
    }),
    prisma.professional.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <AgendaSubNav />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Importar CSV do SIGOP</h1>
        <CsvUploadForm professionals={professionals} />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Importações anteriores</h2>
        {imports.map((imp) => (
          <Link
            key={imp.id}
            href={`/csv-import/${imp.id}`}
            className="block rounded-md border p-3 text-sm hover:bg-accent"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {imp.arquivoNome} — {imp.professional.nome}
              </span>
              <span className="text-muted-foreground">
                {imp.importadoEm.toLocaleString("pt-BR")}
              </span>
            </div>
            <p className="mt-1 text-muted-foreground">
              {imp.linhasValidas} linhas válidas, {imp.linhasDescartadas} descartadas ·{" "}
              {imp.countPacienteNovo} novo(s) · {imp.countDesmarcacaoFalta} desmarcação/falta ·{" "}
              {imp.countAltaPendente} possível alta pendente · {imp.countMudancaEstrutural}{" "}
              mudança estrutural
            </p>
          </Link>
        ))}
        {imports.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma importação ainda.</p>
        )}
      </div>
    </div>
  );
}
