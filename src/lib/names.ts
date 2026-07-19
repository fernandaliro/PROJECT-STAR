const PREPOSICOES = new Set(["de", "da", "do", "das", "dos", "e"]);

// Padroniza a capitalização do nome (project.md §5.1: "padronização
// automática de nomes, incluindo correção de formatação em maiúsculas/minúsculas").
export function normalizeName(rawName: string): string {
  return rawName
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .map((word, index) => {
      if (index > 0 && PREPOSICOES.has(word)) return word;
      return word.charAt(0).toLocaleUpperCase("pt-BR") + word.slice(1);
    })
    .join(" ");
}

// Versão sem acentos/case para busca e indexação (não é exibida ao usuário).
export function searchableName(rawName: string): string {
  return rawName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}
