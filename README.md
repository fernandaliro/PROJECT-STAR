# Star — Sistema de Gestão de Agenda Clínica

Sistema de agenda, turmas, fila de espera e financeiro para a clínica, construído para
rodar de dois computadores diferentes (casa e trabalho, este sem permissão de admin)
contra o mesmo banco de dados na nuvem. Este documento descreve o sistema **como ele
está hoje** — não é um plano ou proposta.

Regra central do projeto (ver `project.md`): **nunca perder dado histórico**. Nada é
sobrescrito silenciosamente — desmarcação e falta não alteram o vínculo do paciente com
a turma, pendência cancelada continua existindo com status `CANCELADA`, e exclusão
definitiva só é permitida quando não há histórico nenhum associado.

## Stack

- **Next.js 16 (App Router, Turbopack)** — Server Components para leitura, Server
  Actions para toda escrita (sem rotas `/api`).
- **Prisma 7** com driver adapter (`@prisma/adapter-pg`) sobre **PostgreSQL (Neon,
  plano gratuito)** — sem Rust query engine, cliente TS gerado em `src/generated/prisma`
  (gitignorado; recriado via `postinstall`/`prisma generate`).
- **shadcn/ui** (estilo "base-nova", sobre Base UI, não Radix) + Tailwind v4.
- **zod + react-hook-form** para validação de formulário, `useActionState` para ligar
  formulário a Server Action.
- Deploy em **Vercel** (`https://project-star-nine.vercel.app`), repositório em
  `github.com/fernandaliro/PROJECT-STAR`.

## Autenticação

Não é um sistema multiusuário — é uma senha única (`APP_PASSWORD` no ambiente) que
libera um cookie de sessão (`src/lib/auth.ts`, `src/proxy.ts`). O nome exibido como
autor de cada ação vem de `CURRENT_USER_NAME`, não de login individual.

## Navegação

```
Dashboard          → "/"                     KPIs gerais + últimos 7 dias + alertas
Pacientes          → "/pacientes"            cadastro único, atravessa especialidades
Agenda (com sub-nav própria, mesmas URLs de sempre):
  Visão geral       → "/agenda"               dia / semana / mês
  Turmas            → "/turmas"               CRUD de turma + vínculos + ocorrências
  Fila de espera    → "/fila-espera"          espera + sugestão automática de horário
  Financeiro        → "/financeiro"           pendências por falta injustificada
  Relatórios        → "/relatorios"           filtro pronto pra copiar e mandar pro analista
  Importar CSV      → "/csv-import"           upload do export do SIGOP + diff
  Escalas           → "/escalas"              expediente por profissional
```

A sub-navegação da Agenda (`src/components/shared/agenda-sub-nav.tsx`) é só uma barra
de atalhos — cada item continua sendo uma página própria, na mesma URL de sempre.

## Modelo de dados

Schema completo em `prisma/schema.prisma`. Pontos que não são óbvios só de ler os nomes
dos campos:

- **`TurmaSlot`** é a identidade da turma: `diaSemana + horario + professionalId +
  tipoAtendimento` (`@@unique`). **A turma não tem nome guardado** — o nome
  ("Trat. Grupo - Fulano | Ciclano") é sempre computado em tempo de leitura a partir dos
  vínculos ativos, em `src/lib/turma-name.ts`. Tem `capacidade` (vagas, usada pela fila
  de espera) e `duracaoMinutos`, ambos opcionais.
- **`PatientTurmaLink`** é o vínculo paciente↔turma, uma entidade própria — não é
  recalculado, é editado só quando há alta formal (`dataSaida` preenchida). Um índice
  único parcial (`WHERE status = 'ATIVO'`, aplicado manualmente na migration, Prisma não
  expressa `WHERE` em `@@unique`) garante só um vínculo ativo por paciente+turma.
- **`TurmaOccurrenceEvent`** é o evento do dia (por `linkId + data`) — desmarcação ou
  falta **não tocam o vínculo**, só criam/atualizam esse evento. Sem evento nessa data =
  presença confirmada por padrão. Tem `conferidoSigop`, uma marcação manual e
  independente do status (ver seção Regras de negócio).
- **`Alta`** fecha um vínculo; **nunca edita** o vínculo anterior.
- **`FinancialPendency`** nasce só de `FALTA_INJUSTIFICADA`; se a classificação for
  corrigida depois, a pendência não é apagada — vira `CANCELADA`.
- **`WaitlistEntry` / `WaitlistSuggestion`** — fila de espera e o resultado do motor de
  sugestão (ver seção própria abaixo).
- **`CsvImport` / `CsvImportRow` / `CsvDiffResult`** — cada import é a agenda de UM
  profissional (escolhido na tela, não lido do arquivo). Guarda o arquivo bruto
  (`rawFileSnapshot`) e o resultado do diff linha a linha.
- **`TurmaAbsenceStreak`** — contador de faltas consecutivas em CSVs sucessivos, usado
  só para sinalizar "possível alta pendente" (nunca dá alta sozinho).
- Não existe um `AuditLog` genérico — foi removido de propósito (ver "Decisões
  tomadas" abaixo). Rastreabilidade acontece via `/relatorios`, que existe justamente
  pra virar um texto pronto de copiar e colar pros analistas.

## Regras de negócio centrais

- **Atendimento em grupo só existe em Fisioterapia**, e só nas modalidades Pilates,
  Fisioterapia ou Acupuntura (`MODALIDADES_EM_GRUPO` em `src/lib/constants.ts`). Todo
  outro profissional/modalidade é sempre individual. Validado no cliente (guia a UI) e
  de novo no servidor (`validarGrupoPermitido` em `src/actions/turmas/actions.ts`) —
  nunca só um dos dois.
- **Status de presença é sempre classificação humana**, nunca cálculo automático de
  antecedência: `CONFIRMADO`, `DESMARCADO` (exige motivo de uma lista fixa —
  `MOTIVOS_DESMARQUE`), `FALTA_JUSTIFICADA`, `FALTA_INJUSTIFICADA`. Só a última gera
  pendência financeira (`R$ 50` padrão, `VALOR_MULTA_PADRAO`).
- **"Conferido no SIGOP"** é um checkbox manual e independente do status de presença —
  "já bati esse paciente/dia com o SIGOP" — não afeta falta/pendência, existe só pra
  controle administrativo. Editável direto na Agenda → Dia, junto com o status.
- **Matrícula em turma não pede data de entrada** — é preenchida automaticamente com a
  data do dia no servidor; o campo foi tirado do formulário porque, na prática, ninguém
  preenche isso retroativo.
- **Exclusão definitiva é condicional**: paciente e turma têm botão de excluir de
  verdade (não só "inativar"), mas só funciona se não houver nenhum histórico associado
  (vínculo, alta, ocorrência, pendência, fila de espera, resultado de diff de CSV). Com
  histórico, a exclusão é bloqueada com uma mensagem explicando por quê e sugerindo
  "Inativar"/"Desativar" no lugar. Ver `deletePatient` e `deleteTurmaSlot` em
  `src/actions/`.

## Importação de CSV do SIGOP

Formato real (não um modelo genérico): `;`-delimitado, cabeçalhos em português (`Data do
agendamento`, `Hora do agendamento`, `Nome`, `Matrícula SIGOP`, `Status do Agendamento`,
`Nome do Grupo`, `Profissional`, `Tipo de Consulta`), datas `DD/MM/AAAA`. Um arquivo =
a agenda completa de um profissional só; o profissional é escolhido na tela de upload,
não inferido do conteúdo.

Vocabulário de status do SIGOP e o que cada um vira no sistema
(`src/lib/csv/process.ts`):

| Status no SIGOP | Vira |
|---|---|
| Agendado / Em Atendimento / Atendido | `CONFIRMADO` |
| Desmarcou | `DESMARCADO` (motivo em branco — o SIGOP não diz o motivo) |
| Faltou | fica pendente de classificação humana (não cria ocorrência sozinho) |
| Pré-Agendado Negado | ignorado — nem vira linha de diff |

Depois do parse, o motor de diff (`src/lib/csv/process.ts` + `CsvDiffResult`) compara
com o estado atual e classifica cada mudança: paciente novo, desmarcação/falta do dia,
alta já aplicada, possível alta pendente (baseado em `TurmaAbsenceStreak`), ou mudança
estrutural. A tela de import (`/csv-import/[importId]`) deixa revisar e aplicar cada
grupo de mudança.

## Fila de espera e sugestão de horário

`src/lib/waitlist-suggest.ts` — dado um paciente esperando vaga (com preferência
opcional de dia/horário/profissional), sugere turmas com vaga livre nesta ordem:

1. Encaixe exato (mesmo dia + horário da preferência).
2. Mesmo dia, horário mais próximo do preferido.
3. Outro dia, mesmo horário preferido.

Não cria turma nova automaticamente e não tenta espalhar a sugestão pelos dias da
semana — só lista o que já existe com vaga. Aceitar uma sugestão (`acceptSuggestion`)
cria o vínculo e marca a entrada da fila como atendida.

## Deploy e ambiente

- **Banco**: Neon Postgres, connection string *pooled* (`-pooler` no host) — funciona
  tanto local quanto nas funções serverless da Vercel. Plano gratuito é suficiente pro
  volume atual (centenas de registros); a única particularidade real do free tier é
  "cold start" depois de um período ocioso, não limite de quantidade.
- **Variáveis de ambiente** (`.env.example`): `DATABASE_URL`, `CURRENT_USER_NAME`,
  `APP_PASSWORD`. Em produção, configuradas direto no projeto Vercel (`vercel env add`),
  nunca commitadas.
- **`postinstall: prisma generate`** no `package.json` é obrigatório — o cliente Prisma
  gerado é gitignorado, então sem esse script o build da Vercel quebra procurando
  `@/generated/prisma/client`.
- Páginas que leem dados ao vivo via Prisma mas não usam `searchParams`/`cookies`
  precisam de `export const dynamic = "force-dynamic";` explícito — sem isso o Next
  pré-renderiza a página como estática no build e os números ficam congelados no
  momento do deploy. Checar isso é rotina antes de todo deploy: rodar `npm run build` e
  conferir que a página não aparece marcada `○` (estática) na tabela de rotas.
- Deploy: `git push` + `npx vercel --prod` (projeto já linkado via `.vercel/`).

## Decisões tomadas (pra não reabrir a discussão sem motivo novo)

- **Sem log de auditoria genérico.** Existiu no plano original, foi removido a pedido —
  rastreabilidade é resolvida por relatórios específicos (`/relatorios`), pensados pra
  virar texto de copiar e colar pros analistas, não por um histórico de "quem mudou o
  quê".
- **Sem módulo de Tarefas.** Avaliado e descartado.
- **Sem "reposição" como conceito.** O equivalente do dia a dia é "encaixe", que é
  outra coisa e não tem tela própria hoje.
- Um documento de referência mais antigo (protótipo em HTML/localStorage, "Estação
  Saúde") é usado como **inspiração de regras de negócio já validadas na prática**, não
  como especificação a seguir à risca — funcionalidades de lá só entram aqui quando
  fazem sentido pro Star e são combinadas antes.
