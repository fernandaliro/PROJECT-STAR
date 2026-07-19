import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PROFESSIONALS_SEED } from "./professionals.seed-data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const professionalSeed of PROFESSIONALS_SEED) {
    const professional = await prisma.professional.upsert({
      where: {
        nome_especialidade: {
          nome: professionalSeed.nome,
          especialidade: professionalSeed.especialidade,
        },
      },
      update: { observacoes: professionalSeed.observacoes },
      create: {
        nome: professionalSeed.nome,
        especialidade: professionalSeed.especialidade,
        observacoes: professionalSeed.observacoes,
      },
    });

    for (const schedule of professionalSeed.schedules) {
      const existing = await prisma.professionalSchedule.findFirst({
        where: {
          professionalId: professional.id,
          diaSemana: schedule.diaSemana ?? null,
          horaInicio: schedule.horaInicio ?? null,
          horaFim: schedule.horaFim ?? null,
          sobDemanda: schedule.sobDemanda ?? false,
        },
      });
      if (!existing) {
        await prisma.professionalSchedule.create({
          data: {
            professionalId: professional.id,
            diaSemana: schedule.diaSemana,
            horaInicio: schedule.horaInicio,
            horaFim: schedule.horaFim,
            sobDemanda: schedule.sobDemanda ?? false,
          },
        });
      }
    }

    console.log(`Seed ok: ${professional.nome} (${professional.especialidade})`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
