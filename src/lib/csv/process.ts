import type { Prisma } from "@/generated/prisma/client";
import { normalizeName, searchableName } from "@/lib/names";
import { ABSENCE_STREAK_THRESHOLD } from "@/lib/constants";
import { diaSemanaFromDate } from "@/lib/dates";
import { parseCsv, type ParsedCsvRow } from "@/lib/csv/parse";

// Vocabulário real do SIGOP (protótipo validado). "Pré-Agendado Negado" é uma
// tentativa negada, não um agendamento real — nunca vira ocorrência.
// "Faltou" só diz QUE faltou, não se foi justificada — isso é decisão humana,
// nunca automática (por isso fica pendente de classificação, sem aplicar
// direto e sem gerar multa na hora da importação).
const STATUS_ACAO: Record<string, "CONFIRMADO" | "DESMARCADO" | "FALTOU_PENDENTE" | "IGNORAR"> = {
  Agendado: "CONFIRMADO",
  "Em Atendimento": "CONFIRMADO",
  Atendido: "CONFIRMADO",
  Desmarcou: "DESMARCADO",
  Faltou: "FALTOU_PENDENTE",
  "Pré-Agendado Negado": "IGNORAR",
};

type ValidRow = ParsedCsvRow & {
  status: "VALIDA";
  matriculaSigop: string;
  data: Date;
  horario: string;
  tipoAtendimento: "INDIVIDUAL" | "GRUPO";
  statusAgendamento: string;
};

function turmaKey(row: { diaSemana: string; horario: string; tipoAtendimento: string }) {
  return `${row.diaSemana}|${row.horario}|${row.tipoAtendimento}`;
}

export async function processCsvImport(
  tx: Prisma.TransactionClient,
  opts: { arquivoNome: string; actor: string; rawText: string; professionalId: string }
): Promise<string> {
  const professional = await tx.professional.findUniqueOrThrow({
    where: { id: opts.professionalId },
  });
  const parsedRows = parseCsv(opts.rawText);

  const csvImport = await tx.csvImport.create({
    data: {
      arquivoNome: opts.arquivoNome,
      professionalId: opts.professionalId,
      importadoPor: opts.actor,
      totalLinhas: parsedRows.length,
      linhasValidas: 0,
      linhasDescartadas: 0,
      rawFileSnapshot: opts.rawText,
    },
  });

  type ActiveRow = ValidRow & { diaSemana: string; acao: (typeof STATUS_ACAO)[string] };
  const activeRows: ActiveRow[] = [];
  let linhasDescartadas = 0;

  for (const row of parsedRows) {
    if (row.status === "DESCARTADA_MALFORMADA") {
      linhasDescartadas += 1;
      await tx.csvImportRow.create({
        data: {
          csvImportId: csvImport.id,
          numeroLinha: row.numeroLinha,
          conteudoBruto: row.conteudoBruto,
          status: "DESCARTADA_MALFORMADA",
          motivoDescarte: row.motivoDescarte,
        },
      });
      continue;
    }

    const validRow = row as ValidRow;
    const acao = STATUS_ACAO[validRow.statusAgendamento];
    const diaSemana = diaSemanaFromDate(validRow.data);

    if (!acao) {
      linhasDescartadas += 1;
      await tx.csvImportRow.create({
        data: {
          csvImportId: csvImport.id,
          numeroLinha: row.numeroLinha,
          conteudoBruto: row.conteudoBruto,
          status: "DESCARTADA_MALFORMADA",
          motivoDescarte: `Status do agendamento não reconhecido: "${validRow.statusAgendamento}"`,
          matriculaSigop: validRow.matriculaSigop,
          diaSemana,
          horario: validRow.horario,
          professionalNomeCru: professional.nome,
          statusAtendimento: validRow.statusAgendamento,
        },
      });
      continue;
    }

    await tx.csvImportRow.create({
      data: {
        csvImportId: csvImport.id,
        numeroLinha: row.numeroLinha,
        conteudoBruto: row.conteudoBruto,
        status: "VALIDA",
        matriculaSigop: validRow.matriculaSigop,
        diaSemana,
        horario: validRow.horario,
        professionalNomeCru: professional.nome,
        statusAtendimento: validRow.statusAgendamento,
      },
    });

    if (acao === "IGNORAR") continue;
    activeRows.push({ ...validRow, diaSemana, acao });
  }

  const groups = new Map<string, ActiveRow[]>();
  for (const row of activeRows) {
    const key = turmaKey(row);
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  const existingActiveSlots = await tx.turmaSlot.findMany({
    where: { ativo: true, professionalId: opts.professionalId },
  });
  const matchedSlotIds = new Set<string>();

  let countPacienteNovo = 0;
  let countDesmarcacaoFalta = 0;
  let countAltaPendente = 0;
  let countMudancaEstrutural = 0;

  for (const [key, rows] of groups) {
    const first = rows[0];
    let turmaSlot = existingActiveSlots.find((slot) => turmaKey(slot) === key);

    if (!turmaSlot) {
      turmaSlot = await tx.turmaSlot.create({
        data: {
          diaSemana: first.diaSemana as never,
          horario: first.horario,
          professionalId: opts.professionalId,
          tipoAtendimento: first.tipoAtendimento,
          especialidade: professional.especialidade,
        },
      });
    }
    matchedSlotIds.add(turmaSlot.id);

    const activeLinks = await tx.patientTurmaLink.findMany({
      where: { turmaSlotId: turmaSlot.id, status: "ATIVO" },
      include: { patient: true },
    });
    const activeByMatricula = new Map(activeLinks.map((l) => [l.patient.matriculaSigop, l]));
    const csvMatriculas = new Set<string>();
    const flaggedNovoOuAlta = new Set<string>();

    for (const row of rows) {
      csvMatriculas.add(row.matriculaSigop);

      let patient = await tx.patient.findUnique({ where: { matriculaSigop: row.matriculaSigop } });
      if (!patient) {
        patient = await tx.patient.create({
          data: {
            matriculaSigop: row.matriculaSigop,
            nomeCompleto: normalizeName(row.nomePaciente || row.matriculaSigop),
            nomeNormalizado: searchableName(row.nomePaciente || row.matriculaSigop),
            observacoes: "Criado automaticamente a partir de importação de CSV.",
          },
        });
      }

      const activeLink = activeByMatricula.get(row.matriculaSigop);

      if (activeLink) {
        await tx.turmaAbsenceStreak.upsert({
          where: {
            patientId_turmaSlotId: { patientId: patient.id, turmaSlotId: turmaSlot.id },
          },
          update: { missedCount: 0, lastSeenImportId: csvImport.id },
          create: {
            patientId: patient.id,
            turmaSlotId: turmaSlot.id,
            linkId: activeLink.id,
            missedCount: 0,
            lastSeenImportId: csvImport.id,
          },
        });

        if (row.acao === "DESMARCADO") {
          const existingEvent = await tx.turmaOccurrenceEvent.findUnique({
            where: { linkId_data: { linkId: activeLink.id, data: row.data } },
          });
          if (!existingEvent) {
            await tx.turmaOccurrenceEvent.create({
              data: {
                linkId: activeLink.id,
                turmaSlotId: turmaSlot.id,
                data: row.data,
                status: "DESMARCADO",
                registradoPor: opts.actor,
                origemImportId: csvImport.id,
              },
            });
            await tx.csvDiffResult.create({
              data: {
                csvImportId: csvImport.id,
                turmaSlotId: turmaSlot.id,
                patientId: patient.id,
                classification: "DESMARCACAO_FALTA_DIA",
                detalhe: { data: row.data.toISOString().slice(0, 10), status: "DESMARCADO" },
              },
            });
            countDesmarcacaoFalta += 1;
          }
        } else if (row.acao === "FALTOU_PENDENTE") {
          const existingEvent = await tx.turmaOccurrenceEvent.findUnique({
            where: { linkId_data: { linkId: activeLink.id, data: row.data } },
          });
          if (!existingEvent) {
            // Falta exige classificação humana (justificada/injustificada) —
            // não aplicamos nada ainda, só sinalizamos pra revisão (ver
            // classifyFaltaFromImport em actions/csv-import/actions.ts).
            await tx.csvDiffResult.create({
              data: {
                csvImportId: csvImport.id,
                turmaSlotId: turmaSlot.id,
                patientId: patient.id,
                classification: "DESMARCACAO_FALTA_DIA",
                detalhe: {
                  data: row.data.toISOString().slice(0, 10),
                  status: "FALTA_PENDENTE_CLASSIFICACAO",
                  linkId: activeLink.id,
                },
              },
            });
            countDesmarcacaoFalta += 1;
          }
        }
        // CONFIRMADO batendo com o esperado: nenhuma ação necessária.
        continue;
      }

      if (flaggedNovoOuAlta.has(row.matriculaSigop)) continue;
      flaggedNovoOuAlta.add(row.matriculaSigop);

      const alta = await tx.alta.findFirst({
        where: { patientId: patient.id, turmaSlotId: turmaSlot.id },
      });
      if (alta) {
        await tx.csvDiffResult.create({
          data: {
            csvImportId: csvImport.id,
            turmaSlotId: turmaSlot.id,
            patientId: patient.id,
            classification: "ALTA_APLICADA",
            detalhe: { dataAlta: alta.dataAlta.toISOString().slice(0, 10) },
          },
        });
      } else {
        await tx.csvDiffResult.create({
          data: {
            csvImportId: csvImport.id,
            turmaSlotId: turmaSlot.id,
            patientId: patient.id,
            classification: "PACIENTE_NOVO",
            detalhe: { matricula: row.matriculaSigop },
          },
        });
        countPacienteNovo += 1;
      }
    }

    for (const link of activeLinks) {
      if (csvMatriculas.has(link.patient.matriculaSigop)) continue;

      const streak = await tx.turmaAbsenceStreak.upsert({
        where: {
          patientId_turmaSlotId: { patientId: link.patientId, turmaSlotId: turmaSlot.id },
        },
        update: { missedCount: { increment: 1 } },
        create: { patientId: link.patientId, turmaSlotId: turmaSlot.id, linkId: link.id, missedCount: 1 },
      });

      if (streak.missedCount >= ABSENCE_STREAK_THRESHOLD) {
        const alreadyFlagged = await tx.csvDiffResult.findFirst({
          where: {
            turmaSlotId: turmaSlot.id,
            patientId: link.patientId,
            classification: "POSSIVEL_ALTA_PENDENTE",
            resolvido: false,
          },
        });
        if (!alreadyFlagged) {
          await tx.csvDiffResult.create({
            data: {
              csvImportId: csvImport.id,
              turmaSlotId: turmaSlot.id,
              patientId: link.patientId,
              classification: "POSSIVEL_ALTA_PENDENTE",
              detalhe: { missedCount: streak.missedCount },
            },
          });
          countAltaPendente += 1;
        }
      }
    }
  }

  for (const slot of existingActiveSlots) {
    if (matchedSlotIds.has(slot.id)) continue;
    await tx.csvDiffResult.create({
      data: {
        csvImportId: csvImport.id,
        turmaSlotId: slot.id,
        classification: "MUDANCA_ESTRUTURAL",
        detalhe: { tipo: "sumiu_do_csv" },
      },
    });
    countMudancaEstrutural += 1;
  }

  const linhasValidas = parsedRows.length - linhasDescartadas;

  await tx.csvImport.update({
    where: { id: csvImport.id },
    data: {
      linhasValidas,
      linhasDescartadas,
      countPacienteNovo,
      countDesmarcacaoFalta,
      countAltaPendente,
      countMudancaEstrutural,
    },
  });

  return csvImport.id;
}
