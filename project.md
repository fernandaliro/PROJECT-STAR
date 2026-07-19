# Star
Escopo do projeto de sistema para gestão de agenda

## 1. Objetivo do sistema
Desenvolver um sistema para organizar a agenda clínica, cadastrar e manter pacientes, controlar filas de espera, acompanhar pendências financeiras e gerenciar a disponibilidade dos profissionais, com foco em rastrear mudanças, preservar histórico e mostrar diferenças entre a programação inicial e o que realmente aconteceu.

## 2. Princípio central do projeto
Este sistema nunca deve apagar informações importantes. Ele deve sempre:
- preservar o histórico de alterações;
- mostrar o que mudou ao longo do tempo;
- comparar o estado atual com a programação inicial;
- permitir identificar diferenças entre o que estava previsto e o que foi efetivamente alterado.

Em outras palavras, o foco principal não é apenas agendar, mas acompanhar mudanças, auditoria e evolução do processo.

## 3. Contexto do problema
Atualmente, a gestão da agenda envolve diferentes complexidades:
- atendimentos individuais e em grupo;
- turmas fixas e variações de disponibilidade;
- cancelamentos e alterações feitas pelo paciente;
- fila de espera para pacientes sem vaga;
- regras financeiras e administrativas vinculadas ao SIGOP;
- necessidade de visibilidade e organização para os profissionais e coordenadores.

## 4. Usuários e papéis
### 4.1 Usuários principais
- somente eu

### 4.2 Papéis esperados
- cadastrar e editar pacientes;
- criar e alterar agendamentos;
- gerenciar fila de espera;
- acompanhar pendências financeiras;
- visualizar agenda por período;
- definir ou consultar disponibilidade dos profissionais;
- consultar histórico de mudanças e comparações entre versões.

## 5. Requisitos de negócio

### 5.1 Cadastro de pacientes
O sistema deve permitir o cadastro de pacientes com:
- matrícula SIGOP;
- nome completo;
- status ativo/inativo;
- padronização automática de nomes, incluindo correção de formatação em maiúsculas/minúsculas.

### 5.2 Gestão da agenda
A agenda deve suportar:
- visualização diária, semanal e mensal;
- agendamentos de diferentes especialidades;
- controle de turmas e grupos;
- identificação de cancelamentos e alterações;
- diferenciação entre atendimentos individuais e coletivos;
- registro claro de cada mudança realizada.

### 5.2.1 Modelo de cadastro em turmas
A base de pacientes deve ser única e central. O paciente não deve ser cadastrado repetidamente para cada turma. O modelo ideal é:
- cadastrar o paciente uma única vez no cadastro geral;
- criar um vínculo específico entre o paciente e a turma, quando ele entrar em uma turma;
- registrar esse vínculo como uma entidade própria, com status, data de entrada, data de saída, observações e histórico;
- incluir também o horário e o período em que esse vínculo vale, pois o horário é parte do contexto da turma e do atendimento;
- manter o cadastro do paciente intacto mesmo quando houver desmarcação, mudança de turma, mudança de horário ou alteração de status;
- a data de saída do vínculo só é preenchida quando há uma alta formal registrada; desmarcação ou falta em um dia específico não encerram o vínculo, apenas geram um registro daquela ocorrência.

Essa abordagem é mais adequada porque preserva o histórico, evita duplicidade e permite acompanhar exatamente o que mudou no relacionamento paciente-turma, incluindo o horário e a vigência desse vínculo ao longo do tempo.

### 5.3 Especialidades e regras específicas
#### Fisioterapia
- atendimentos individuais e em grupo;
- modalidades como fisioterapia, Pilates, acupuntura, ventosa, urgência, encaixe e avaliação;
- turmas fixas;
- necessidade de controle de alterações e desmarcações.

#### Odontologia e Nutrição
- a maioria dos atendimentos não exige controle de agenda;
- endodontia exige controle de agenda e fila de espera.

#### Psicologia
- exige controle de agenda e fila de espera.

### 5.4 Fila de espera
Quando não houver vagas disponíveis, pacientes de odontologia, psicologia e fisioterapia devem poder entrar em uma fila de espera.

Os dados mínimos para o cadastro devem incluir:
- nome;
- matrícula;
- data da avaliação;
- prioridade do caso;
- disponibilidade do paciente;
- profissional responsável;
- tratamento indicado;
- para endodontia: dentes envolvidos, RX, retratamento e outras observações relevantes.

### 5.5 Regras financeiras e administrativas
O sistema deve apoiar o controle das pendências financeiras e das regras operacionais.

Regras esperadas:
- o paciente deve quitar a pendência ou enviar documento justificativo;
- faltas injustificadas geram multa de R$ 50,00;
- atestados podem gerar abono;
- o fluxo de cobrança deve ser acompanhado por Teams ou e-mail;
- o sistema deve registrar se o documento justificativo foi recebido;
- pacientes com multa e agendamento ativo devem ser identificados claramente.

### 5.6 Escalas e disponibilidade
O sistema deve permitir:
- organização das escalas por profissional e por dia da semana;
- cadastro de carga horária e disponibilidade;
- suporte a escalas fixas e horários por demanda.

## 6. Requisito transversal: rastreamento de alterações
Este é um requisito central do projeto.

O sistema deve ser capaz de:
- mostrar quem alterou cada informação;
- registrar quando a alteração ocorreu;
- preservar a versão anterior da informação;
- comparar o que estava previsto inicialmente com o que foi alterado posteriormente;
- evidenciar diferenças em relação ao CSV, programação inicial ou base de entrada.

A ideia é que o sistema funcione como uma ferramenta de acompanhamento e auditoria, e não apenas como uma agenda simples.

## 7. Funcionalidades principais
- visualizar agenda diária, semanal e mensal;
- copiar o nome permanente da turma, calculado a partir do vínculo paciente-turma ativo (muda apenas quando há alta registrada, nunca por desmarcação ou falta pontual);
- copiar a lista de atendimento do dia, que exclui quem desmarcou ou faltou apenas naquela data específica, sem alterar o vínculo permanente;
- gerar o nome dinâmico da turma automaticamente a partir do vínculo ativo, pronto para colar no SIGOP;
- sugerir horários automaticamente para pacientes da fila de espera com base em especialidade, tratamento, preferência e disponibilidade;
- sinalizar pendências financeiras;
- mostrar histórico de mudanças e diferenças entre versões;
- comparar o estado atual com a programação inicial ou com o conteúdo carregado em CSV;
- integrar módulos para reduzir ajustes manuais e automatizar processos.

## 8. Escalas de profissionais
### Fisioterapia
- Alana Evani dos Santos da Costa: seg a sex, das 07h às 13h.
- Andréa Rosselyne Deodato Viana: seg a sex, das 13h às 19h.

### Nutrição
- Matheus de Moraes de Oliveira: seg e qua, das 08h às 12h; ter e qui, das 16h às 20h; sex, das 08h às 12h.

### Psicologia
- Maria Beatriz da Silva Moreira: seg e qua, das 16h às 20h; ter e qui, das 08h às 12h; sex, das 16h às 20h.

### Outros profissionais
- Amanda Herculano de Moraes Souza: seg a qui, das 08h às 12h e das 14h às 18h; qua, das 16h às 20h; sex, folga.
- Luciana Freitas Araujo: ter a sex, das 08h às 12h e das 16h às 20h; seg, folga.
- Larissa Celina Dan Ramos Montijo: seg, qua, qui e sex, das 08h às 12h; ter, folga.
- Pedro Henrique de Souza Honório Justino: sob demanda, sem dia fixo.
- Rosângela Ferreira de Oliveira: sex, das 14h às 18h.
- Juliana Baldani: qua, das 13h30 às 15h30.

## 9. MVP sugerido
Para uma primeira versão, o sistema pode priorizar:
1. cadastro de pacientes;
2. agenda básica com visualização diária, semanal e mensal;
3. cadastro de agendamentos;
4. fila de espera;
5. controle básico de pendências financeiras;
6. rastreamento de alterações e histórico;
7. comparação entre programação inicial e estado atual.

## 10. Pontos que ainda precisam de definição
Para deixar o escopo mais robusto, ainda é importante definir:
- quem aprova abonos: a coordenadora aprova, mas o sistema é de uso próprio e deve registrar esse fluxo;
- quais profissionais podem atender cada tipo de tratamento: Andréa atende acupuntura; Juliana Baldani atende endodontia; Alana atende ventosa; os demais profissionais atendem conforme sua formação e especialidade;
- como será feita a sugestão automática de horários (definido): prioridade por tempo de espera na fila (quem entrou primeiro é sugerido primeiro); o sistema busca primeiro um encaixe exato (mesmo dia e horário da preferência do paciente, com vaga livre) e, se não houver, sugere horários próximos ou semelhantes (mesmo dia com horário próximo, ou outro dia no mesmo horário);
- qual será o fluxo exato de cancelamento e reagendamento: não há cancelamento, apenas desmarcação; a regra é que a desmarcação com antecedência mínima de 24 horas não gera multa; quando ocorre fora desse prazo, é necessário pagar ou justificar, e isso deve ser acompanhado junto às pendências em aberto;
- qual será a integração real com o SIGOP: o sistema não precisa replicar tudo do SIGOP; o fluxo pode ser manual, com exportação ou transferência posterior das informações para o SIGOP;
- qual será a regra exata para comparar alterações com o CSV ou com a programação inicial: definida na seção 11.

## 11. Regra de comparação de alterações via CSV do SIGOP

A identidade de uma turma é definida por **dia da semana + horário + profissional** (+ tipo de atendimento, para separar atendimentos individuais compartilhados no mesmo horário). Essa combinação raramente muda e é a chave usada para comparar o CSV importado com a programação fixa.

A composição da turma (quem está nela) não é lida do campo "Nome do Grupo" do SIGOP — esse campo é digitado manualmente e fica desatualizado com o tempo. A composição real é obtida a partir dos agendamentos individuais do CSV mais recente para aquele dia+horário+profissional.

Regra de saída: um paciente só sai de uma turma quando há uma alta registrada no sistema (paciente, turma, data). Desmarcação ou falta em um dia específico não alteram o vínculo permanente — ficam registradas apenas como eventos daquela ocorrência.

A cada importação de um novo CSV, o sistema classifica cada turma em:
- **paciente novo**: aparece nos agendamentos do CSV mas não está no nome atual da turma — sinalizado para inclusão;
- **desmarcação/falta do dia**: paciente com status "Desmarcou" ou "Faltou" naquela data — marcador visual na agenda do dia, não afeta o vínculo;
- **alta aplicada**: paciente com alta registrada — some da sugestão de nome automaticamente;
- **possível alta pendente**: paciente que deixou de aparecer em várias ocorrências seguidas da turma e não tem alta registrada — o sistema não remove ninguém sozinho, apenas sinaliza para verificação;
- **mudança estrutural**: turma que mudou de dia, horário, profissional ou sumiu inteira do CSV — tratada com mais destaque, por ser mais rara e mais sensível que as trocas de paciente.

O nome da turma (padrão `Trat. Grupo - Nome1 | Nome2 | ...`) é sempre recalculado a partir da composição real menos as altas, nunca digitado à mão, com opção de copiar pronto para colar no SIGOP.

Cada importação gera um registro no log de alterações — data do import, quantas turmas tiveram paciente novo, quantas desmarcações/faltas do dia, quantos alertas de possível alta pendente e quantas mudanças estruturais — para consulta histórica de "o que mudou desde o último CSV".

Antes de processar, o sistema descarta linhas incompletas ou fora do padrão (por exemplo, anotações soltas sem dado estruturado, que já apareceram na exportação real do SIGOP).

Essa abordagem deixa o sistema mais alinhado com o objetivo principal de auditoria, rastreamento e controle das mudanças, sem gerar alerta falso por causa de rotatividade normal de paciente.