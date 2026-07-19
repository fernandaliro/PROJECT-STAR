import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalizeName, searchableName } from "../../src/lib/names";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Lista original do protótipo anterior (SEED_PACIENTES). Pacientes sem
// matrícula (null) são pulados aqui — matriculaSigop é obrigatória e única
// no schema atual; ficam para cadastro manual quando a matrícula real for
// localizada, em vez de inventar um valor.
const PACIENTES: { nome: string; matricula: number | null }[] = [
  { nome: "Alencastro Pena De Matos", matricula: 4579738 },
  { nome: "Alessandra Dourado Alves De Souza", matricula: 4327833 },
  { nome: "Alexandre Gomes De Barros", matricula: 4388543 },
  { nome: "Aline Reis Roriz Nascimento", matricula: 2362542 },
  { nome: "Aline Viana Soares", matricula: 4116281 },
  { nome: "Amanda Galvao Ferreira Tabosa", matricula: 2021591 },
  { nome: "Amanda Herculano De Moraes Souza", matricula: 6265534 },
  { nome: "Ana Beatriz Andrade Melo Fernandez", matricula: 368179 },
  { nome: "Ana Carolina Godinho De Lacerda", matricula: 2648721 },
  { nome: "Ana Karoline Versiane Soares Araujo", matricula: 4323031 },
  { nome: "Ana Paula Alves Da Penha", matricula: 6399734 },
  { nome: "Ana Paula Ribeiro Da Silva", matricula: 901586 },
  { nome: "Ana Valeria Alves De Sousa", matricula: 2758415 },
  { nome: "Andre Antonio Lacerda De Souza", matricula: 924082 },
  { nome: "Andre Frazao Pereira", matricula: 3925364 },
  { nome: "Andrea Cavalcanti Batista", matricula: 3383488 },
  { nome: "Andrey De Carvalho Tomimatsu", matricula: 6654476 },
  { nome: "Angel Holanda Barbosa", matricula: 4382235 },
  { nome: "Angelita Dos Santos Pereira Da Costa", matricula: 144680 },
  { nome: "Anitra Pirene De Oliveira", matricula: 144683 },
  { nome: "Anna Raissa Guedes Vieira", matricula: 3369814 },
  { nome: "Antemio Portela Vale", matricula: 5437185 },
  { nome: "Ariana Da Costa Carvalho", matricula: 2472955 },
  { nome: "Ariana Paula Alves Da Silva", matricula: 4243098 },
  { nome: "Arthur Braga De Lima", matricula: 6008031 },
  { nome: "Bruna Martins De Sousa Casemiro", matricula: 6442272 },
  { nome: "Bruna Muniz Oliveira", matricula: 4324373 },
  { nome: "Cacio Antonio Ramos", matricula: 4745503 },
  { nome: "Camila Antunes Martins", matricula: 5861507 },
  { nome: "Camilla De Oliveira Souza", matricula: 3280352 },
  { nome: "Carlos Antonio Nunes Claro", matricula: 1438015 },
  { nome: "Carlos Augusto Martins Mesquita", matricula: 4146856 },
  { nome: "Carolina Guimaraes De Andrade", matricula: 1426260 },
  { nome: "Caroline Pacheco Fontenele", matricula: 2456501 },
  { nome: "Caroline Wollenhaupt Simoes Pires", matricula: 2770599 },
  { nome: "Charliane Ferreira De Mesquita", matricula: 4496771 },
  { nome: "Christiane Cecilia Klauck", matricula: 452537 },
  { nome: "Cintia Fernandes Da Silva", matricula: 184414 },
  { nome: "Claudeci Especamilha", matricula: 4631345 },
  { nome: "Claudio Da Cruz Araujo", matricula: 226685 },
  { nome: "Claudio De Sousa Santos Junior", matricula: 4155765 },
  { nome: "Cleber Archanjo De Souza", matricula: 3108794 },
  { nome: "Daniel Goncalves De Oliveira", matricula: 5640660 },
  { nome: "Daniel Torres Deolindo", matricula: 317779 },
  { nome: "Daniela De Jesus Fernandes", matricula: 4916088 },
  { nome: "Daniele Martos Mangualde", matricula: 154656 },
  { nome: "Daniele Santos De Oliveira Archanjo De Souza", matricula: 1618520 },
  { nome: "Danielle Moraes De Sousa", matricula: 197636 },
  { nome: "Danila Alves Dos Reis", matricula: 2994646 },
  { nome: "Darlene Ferreira De Melo Costa", matricula: 2463457 },
  { nome: "Denise Dalescio Sa Teles", matricula: 1865222 },
  { nome: "Dim Michelle Ferreira Rodrigues", matricula: 2218325 },
  { nome: "Edmara Claudino Dos Santos", matricula: 664759 },
  { nome: "Elaine Padilha De Souza", matricula: 3145369 },
  { nome: "Erineide Carvalho Frazao", matricula: 3272845 },
  { nome: "Ester Balbina Da Silva", matricula: 4876760 },
  { nome: "Esther Mendes Cavalcante", matricula: 3318442 },
  { nome: "Fabiano Augusto Queiroz De Freitas", matricula: 1491322 },
  { nome: "Fabio Mascarenhas Soares", matricula: 4678272 },
  { nome: "Fabiola Thereza Peralta Boueri", matricula: 335991 },
  { nome: "Fernanda Guedes Dos Santos", matricula: 6605365 },
  { nome: "Fernanda Schwantes", matricula: 4940684 },
  { nome: "Filipe Da Silva Linhares", matricula: 138894 },
  { nome: "Franciele Pereira Costa", matricula: 380790 },
  { nome: "Francisco De Assis Cardoso", matricula: 831236 },
  { nome: "Francisco Florencio Caninde Filho", matricula: 5437179 },
  { nome: "Gabriel Pinto Ferreira Blonski", matricula: 6555190 },
  { nome: "Gabriela Costa De Oliveira", matricula: 1916969 },
  { nome: "Gabriela Torres Vieira Rizza", matricula: 157599 },
  { nome: "Gabriella Urbieta Bermudez", matricula: 2891473 },
  { nome: "Giselly Poliane Pereira Alves De Jesus", matricula: 5794533 },
  { nome: "Giulia Milena Garcia Da Silveira", matricula: 6376096 },
  { nome: "Guilherme Da Silva Santana", matricula: 3515485 },
  { nome: "Guilherme Luciney Correa De Souza", matricula: 6503675 },
  { nome: "Haryson Kesley De Oliveira Fernandes", matricula: 380164 },
  { nome: "Helen Cristina Alves Da Silva Oliveira", matricula: 2288672 },
  { nome: "Hellen De Almeida Torres", matricula: 197328 },
  { nome: "Herola Cristini Maia De Almeida", matricula: 935049 },
  { nome: "Homero Jose Augusto De Oliveira", matricula: 4201458 },
  { nome: "Inaiara Silva Torres", matricula: 6008049 },
  { nome: "Jacinta Alves De Sa", matricula: 600959 },
  { nome: "Jade Louanne Ribeiro De Araujo Silva", matricula: 5450421 },
  { nome: "Janaina Gomes Barbosa", matricula: 6729454 },
  { nome: "Jean Michel Correia Brault", matricula: 351133 },
  { nome: "Jennifer Rodrigues De Aguiar Meira", matricula: 174117 },
  { nome: "Jessica Lee Alves Vasques", matricula: 1771342 },
  { nome: "Joao Frederico Chagas Maranhao", matricula: 3984285 },
  { nome: "Joao Guilherme Vogado Abrahao", matricula: 3388636 },
  { nome: "Joao Paulo Cesar Rechden", matricula: 6447099 },
  { nome: "Joao Paulo Rodrigues Barros", matricula: 6478644 },
  { nome: "Joao Victor Mendes De Gomes E Mendonca", matricula: 321233 },
  { nome: "Joaquim Volpato Brito", matricula: 2416419 },
  { nome: "Jorge Luiz Maciel Da Silva", matricula: 1250780 },
  { nome: "Juliana Aparecida Da Silva Rodrigues", matricula: 3426449 },
  { nome: "Kassianne Marinho De Sousa", matricula: 5820862 },
  { nome: "Kattia Pereira Silva", matricula: 380188 },
  { nome: "Katya Volpato Brito", matricula: 2186870 },
  { nome: "Kelly Cristina Dos Santos Drumond", matricula: 6297220 },
  { nome: "Kelly Gleiciane Fereira Rocha", matricula: 117644 },
  { nome: "Kelly Pontes De Souza", matricula: 153324 },
  { nome: "Lais Maia Da Silva", matricula: 701713 },
  { nome: "Larissa Celina Dan Ramos Montijo", matricula: 6855222 },
  { nome: "Layane Simiao Cavalcante E Silva", matricula: 138374 },
  { nome: "Lays Dandi De Freitas Morais", matricula: 698658 },
  { nome: "Leidiane Costa Silva Musialowski", matricula: 1021106 },
  { nome: "Leila Patricia De Carvalho Lima", matricula: 5775754 },
  { nome: "Leonardo De Sa Barcellos", matricula: 1427555 },
  { nome: "Leonardo Ferreira Santos", matricula: 154944 },
  { nome: "Lindinalva Arruda", matricula: 161561 },
  { nome: "Lisiane Nunes Esteves De Peixoto", matricula: 173547 },
  { nome: "Livia Cerezoli De Castro", matricula: 159708 },
  { nome: "Luana Torres Rizza Evangelista", matricula: 157621 },
  { nome: "Luciana Ferreira Mendonca Figueiredo", matricula: 456635 },
  { nome: "Luciana Freitas Araujo", matricula: 1165080 },
  { nome: "Luciana Malamin Correia", matricula: 185197 },
  { nome: "Luiz Ernesto Gerhardt Ramos", matricula: 4745443 },
  { nome: "Mablo Mendes Batista", matricula: 162087 },
  { nome: "Manuela Batista Cavalcante", matricula: 2407627 },
  { nome: "Marcela Lamounier Da Mata Santos", matricula: 3099929 },
  { nome: "Marcelo Quartieri Barroso Pinheiro", matricula: 1948853 },
  { nome: "Marcia Cristina Da Cunha Mantovani", matricula: 5540274 },
  { nome: "Marcia Goncalves De Almeida", matricula: 5461891 },
  { nome: "Marcia Kamada", matricula: 5399422 },
  { nome: "Marcia Oliveira Silva Henriques", matricula: 2118013 },
  { nome: "Marcos Leandro De Oliveira E Guimaraes", matricula: 6472179 },
  { nome: "Maria Aparecida Ferreira", matricula: 1767846 },
  { nome: "Maria Carolina Piloto De Noronha", matricula: 4576241 },
  { nome: "Maria Da Conceicao Da Costa Crisostomo", matricula: 199083 },
  { nome: "Maria Eduarda Klauck Perez", matricula: 955231 },
  { nome: "Maria Raimunda Campos Lima Conceicao", matricula: 131468 },
  { nome: "Maria Rosalia Tomaz Soares", matricula: 5636450 },
  { nome: "Maria Veronica Muniz Carneiro Claro", matricula: 922530 },
  { nome: "Maria Vitoria Rizza Mesquita", matricula: 7435012 },
  { nome: "Mauricio Musialowiski", matricula: 2172155 },
  { nome: "Maxwell Borges Bezerra", matricula: 2414586 },
  { nome: "Maycon Santos", matricula: 6205634 },
  { nome: "Michele Gois Santana", matricula: 6352546 },
  { nome: "Michelle Fragoso Serafim", matricula: 504099 },
  { nome: "Milla Kristien Alves Dourado Maciel", matricula: 4373803 },
  { nome: "Mirian Sousa Bezerra", matricula: 1423011 },
  { nome: "Monica Landim Chaikosky", matricula: 151536 },
  { nome: "Natasha Haynna De Souza Poeck", matricula: 4974193 },
  { nome: "Nathalia Da Cruz Luciano", matricula: 6193265 },
  { nome: "Nayane Dos Santos Pimenta", matricula: 22334 },
  { nome: "Nicolas Perricault Fortuna", matricula: 5551997 },
  { nome: "Ozzyara Dos Santos Lima", matricula: 4305179 },
  { nome: "Patricia Paulina Nunes Tavares", matricula: 1211726 },
  { nome: "Paula Holanda De Carvalho", matricula: 159810 },
  { nome: "Paulo Guilherme Toledo Da Costa", matricula: 3183847 },
  { nome: "Paulo Ricardo Vieira Magalhaes Soares", matricula: 159768 },
  { nome: "Pedro Israel Vieira Do Patrocinio", matricula: 5819301 },
  { nome: "Plicye Silva Farias", matricula: 173185 },
  { nome: "Pollyana De Fatima Pascoa Gadelha", matricula: 5553954 },
  { nome: "Rachel Da Silva Araujo", matricula: 2854373 },
  { nome: "Rafaelle Nakaiama Araujo Silveira", matricula: 2182460 },
  { nome: "Rebeca Galvao De Placido Ferreira Guimaraes", matricula: 151628 },
  { nome: "Reinaldo", matricula: null },
  { nome: "Renan Ferreira Oliveira", matricula: 4985519 },
  { nome: "Rosa Andrea De Oliveira Daniel", matricula: 174146 },
  { nome: "Rosana Borges Do Nascimento Rosa", matricula: 156857 },
  { nome: "Sabrina Correa Da Silva Gerhardt", matricula: 4080752 },
  { nome: "Sabrina Machado Rodrigues", matricula: 3517138 },
  { nome: "Samille Cristine Dos Reis De Souza", matricula: 1621087 },
  { nome: "Savio Marques De Oliveira", matricula: 1193065 },
  { nome: "Shirley De Oliveira Caetano", matricula: 1936798 },
  { nome: "Silvana Ferreira Gomes Maciel", matricula: null },
  { nome: "Tammy Mayara Daltoe Inglez", matricula: 1563420 },
  { nome: "Tatiana Bento Da Silva", matricula: 173915 },
  { nome: "Tayna Kamilla De Lelis Feitosa", matricula: 1380933 },
  { nome: "Teila De Oliveira Carvalho", matricula: 150348 },
  { nome: "Thaiane Pinheiro Da Rocha", matricula: 650490 },
  { nome: "Thais De Abreu Guimaraes", matricula: 4388315 },
  { nome: "Thais De Castro Brasil", matricula: 2879538 },
  { nome: "Thiago Cesar Cardoso Silva", matricula: 5994170 },
  { nome: "Thiago Rodrigo Dos Santos", matricula: 6598284 },
  { nome: "Tiago Fernandes Tavora Veras", matricula: 5157909 },
  { nome: "Valeria", matricula: null },
  { nome: "Valeria Do Nascimento Damasceno", matricula: 5966905 },
  { nome: "Valtair Barbosa Da Silva", matricula: 3245264 },
  { nome: "Valter Junio Da Silva Caixeta", matricula: 861843 },
  { nome: "Valter Luis De Souza", matricula: 5482764 },
  { nome: "Vander Francisco Costa", matricula: 1847237 },
  { nome: "Vanderson De Lacerda Santos Moreira", matricula: 5205984 },
  { nome: "Victoria Barbosa Tomaz", matricula: null },
  { nome: "Victoria Barbosa Tomaz Franca", matricula: 4918806 },
  { nome: "Vinicius Amaral Almeida", matricula: 3611045 },
  { nome: "Vinicius Ladeira Marques De Sousa", matricula: 387482 },
  { nome: "Walmir De Souza Torres", matricula: 1387086 },
  { nome: "Weudes De Sousa Evangelista", matricula: 157612 },
  { nome: "Wilton Dos Santos Cardoso", matricula: 3368227 },
];

async function main() {
  let created = 0;
  let skipped = 0;
  let semMatricula = 0;
  const semMatriculaNomes: string[] = [];

  for (const p of PACIENTES) {
    if (p.matricula === null) {
      semMatricula += 1;
      semMatriculaNomes.push(p.nome);
      continue;
    }
    const matriculaSigop = String(p.matricula);
    const nomeCompleto = normalizeName(p.nome);
    const existing = await prisma.patient.findUnique({ where: { matriculaSigop } });
    if (existing) {
      skipped += 1;
      continue;
    }
    await prisma.patient.create({
      data: {
        matriculaSigop,
        nomeCompleto,
        nomeNormalizado: searchableName(nomeCompleto),
        status: "ATIVO",
      },
    });
    created += 1;
  }

  console.log(`Criados: ${created}`);
  console.log(`Já existiam (matrícula duplicada, pulados): ${skipped}`);
  console.log(`Sem matrícula (não importados): ${semMatricula}`);
  if (semMatriculaNomes.length) {
    console.log("Nomes sem matrícula:", semMatriculaNomes.join(", "));
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
