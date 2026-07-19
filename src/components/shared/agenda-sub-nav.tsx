"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Sub-navegação da "família" de Agenda: tudo que gira em torno da rotina
// diária da clínica vive visualmente junto, mesmo com URLs continuando
// separadas (/turmas, /fila-espera, etc — só a apresentação foi agrupada).
const ITEMS = [
  { href: "/agenda", label: "Visão geral" },
  { href: "/turmas", label: "Turmas" },
  { href: "/fila-espera", label: "Fila de espera" },
  { href: "/financeiro", label: "Financeiro" },
  { href: "/relatorios", label: "Relatórios" },
  { href: "/csv-import", label: "Importar CSV" },
  { href: "/escalas", label: "Escalas" },
];

export function AgendaSubNav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-wrap gap-4 border-b pb-3 text-sm">
      {ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-muted-foreground transition-colors hover:text-foreground",
              active && "font-medium text-foreground underline underline-offset-4"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
