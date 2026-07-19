"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { logout } from "@/actions/auth/actions";
import { Button } from "@/components/ui/button";

// "Agenda" é o módulo guarda-chuva: turmas, fila de espera, financeiro,
// relatórios e importação de CSV são sub-áreas dela (sub-navegação dentro da
// própria página), não itens soltos no menu principal — a rotina do dia a
// dia inteira fica visualmente junta, mesmo com URLs continuando separadas.
const AGENDA_FAMILY_PREFIXES = [
  "/agenda",
  "/turmas",
  "/fila-espera",
  "/financeiro",
  "/relatorios",
  "/csv-import",
  "/escalas",
];

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/pacientes", label: "Pacientes" },
  { href: "/agenda", label: "Agenda" },
];

export function MainNav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="font-semibold">
          Star
        </Link>
        <nav className="flex gap-4 text-sm">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : item.href === "/agenda"
                  ? AGENDA_FAMILY_PREFIXES.some((p) => pathname.startsWith(p))
                  : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-muted-foreground transition-colors hover:text-foreground",
                  active && "font-medium text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <form action={logout} className="ml-auto">
          <Button variant="ghost" size="sm" type="submit">
            Sair
          </Button>
        </form>
      </div>
    </header>
  );
}
