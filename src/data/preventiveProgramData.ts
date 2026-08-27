import { PreventiveWorkSheet } from '../types';

export const OFFICIAL_PREVENTIVE_SHEETS: PreventiveWorkSheet[] = [
  // ==========================================
  // MANUTENÇÃO PRÉ-CELEBRAÇÃO (FEVEREIRO A MARÇO)
  // ==========================================
  {
    id: 'prev-pre-ac',
    title: 'Ficha de Trabalho: Ar-condicionado',
    eventPeriod: 'PRE_CELEBRACAO',
    periodLabel: 'Fevereiro a Março',
    category: 'Ar-Condicionado',
    frequency: '3x ao ano',
    description: 'Limpeza, higienização dos filtros, verificação de drenos, aletas e testes de refrigeração de todos os aparelhos para a Celebração.',
    guidelines: [
      'Lavar e desinfetar os filtros de ar das unidades evaporadoras.',
      'Verificar e desobstruir as mangueiras e bandejas de dreno de água.',
      'Checar o estado das serpentinas e das unidades condensadoras externas.',
      'Testar o controle remoto e as pilhas em todas as salas e auditório.',
      'Medir o fluxo de ar e checar se há ruídos anormais no compressor.'
    ],
    safetyInstructions: [
      'Desligar os disjuntores do quadro elétrico antes de abrir as unidades condensadoras ou partes elétricas.',
      'Utilizar escada apropriada com sapatas de borracha e apoio estável.'
    ]
  },
  {
    id: 'prev-pre-loucas',
    title: 'Ficha de Trabalho: Louças e Metais Sanitários',
    eventPeriod: 'PRE_CELEBRACAO',
    periodLabel: 'Fevereiro a Março',
    category: 'Louças / Metais',
    frequency: '2x ao ano',
    description: 'Revisão geral dos banheiros feminino, masculino e acessibilidade (PCD).',
    guidelines: [
      'Inspecionar todas as torneiras quanto a gotejamentos, folgas e arejadores entupidos.',
      'Testar as válvulas de descarga e caixas acopladas quanto a vazamentos contínuos.',
      'Checar a vedação dos sifões, engates flexíveis e registros gerais dos banheiros.',
      'Verificar a fixação das barras de apoio de acessibilidade nos sanitários PCD.',
      'Inspecionar dispensers de sabonete líquido, toalheiros e suportes de papel higiênico.'
    ],
    safetyInstructions: [
      'Usar luvas de proteção adequadas para produtos de limpeza e higienização.'
    ]
  },
  {
    id: 'prev-pre-equip',
    title: 'Ficha de Trabalho: Equipamentos Gerais',
    eventPeriod: 'PRE_CELEBRACAO',
    periodLabel: 'Fevereiro a Março',
    category: 'Eletrodomésticos',
    frequency: '2x ao ano',
    description: 'Inspeção funcional de eletrodomésticos, bombas d’água e equipamentos auxiliares.',
    guidelines: [
      'Testar o funcionamento da bomba d’água automática e boias de nível.',
      'Inspecionar geladeira/frigobar da copa (borrachas de vedação e limpeza da grade traseira).',
      'Testar micro-ondas e cafeteira da sala de apoio / copa.',
      'Verificar o aspirador de pó e enceradeiras/politrizes do Salão.'
    ]
  },
  {
    id: 'prev-pre-bebedouro',
    title: 'Ficha de Trabalho: Bebedouro',
    eventPeriod: 'PRE_CELEBRACAO',
    periodLabel: 'Fevereiro a Março',
    category: 'Eletrodomésticos',
    frequency: '2x ao ano',
    description: 'Higienização profunda dos reservatórios, torneiras e troca dos elementos filtrantes.',
    guidelines: [
      'Realizar a sanitização do reservatório interno com solução clorada apropriada.',
      'Substituir o refil / elemento filtrante de carvão ativado e polipropileno.',
      'Limpar a bandeja de gotejamento e desobstruir o dreno de escoamento.',
      'Testar a temperatura de saída da água gelada e natural.'
    ],
    safetyInstructions: [
      'Desconectar o cabo de energia da tomada antes de abrir o painel de filtragem.'
    ]
  },
  {
    id: 'prev-pre-av',
    title: 'Ficha de Trabalho: Sistema de Áudio, Vídeo e Internet',
    eventPeriod: 'PRE_CELEBRACAO',
    periodLabel: 'Fevereiro a Março',
    category: 'Áudio / Vídeo',
    frequency: '2x ao ano',
    description: 'Revisão técnica de microfones, mesa de som, projetor/telas, cabeamento e conexão de rede.',
    guidelines: [
      'Testar todos os microfones com e sem fio (volantes, púlpito e leitor) e trocar pilhas/baterias.',
      'Verificar o alinhamento, foco e brilho do projetor ou painéis de TV/LED.',
      'Checar conexões de cabos HDMI, XLR e cabos de rede na mesa de som e púlpito.',
      'Reiniciar e testar a estabilidade do roteador Wi-Fi e modem de internet.',
      'Limpar os filtros de ventilação dos amplificadores e computadores de transmissão.'
    ]
  },
  {
    id: 'prev-pre-seg',
    title: 'Ficha de Trabalho: Sistema de Monitoramento e Alarmes',
    eventPeriod: 'PRE_CELEBRACAO',
    periodLabel: 'Fevereiro a Março',
    category: 'Alarme / CFTV',
    frequency: '2x ao ano',
    description: 'Inspeção das câmeras de CFTV, sensores infravermelhos e bateria da central de alarme.',
    guidelines: [
      'Limpar as lentes das câmeras de segurança internas e externas.',
      'Testar o disparo dos sensores de presença, quebra de vidro e magnéticos de portas.',
      'Medir a carga da bateria selada de 12V da central de alarme e da cerca elétrica (se houver).',
      'Verificar o tempo de gravação do DVR/NVR e o funcionamento do disco rígido.'
    ]
  },
  {
    id: 'prev-pre-insp-interna',
    title: 'Ficha de Trabalho: Inspeção Interna (com Avaliação de Pintura)',
    eventPeriod: 'PRE_CELEBRACAO',
    periodLabel: 'Fevereiro a Março',
    category: 'Pintura',
    frequency: 'Anual',
    description: 'Inspeção detalhada de paredes, forros, pisos e avaliação da necessidade de pintura pré-Celebração.',
    guidelines: [
      'Inspecionar paredes internas e teto quanto a manchas de umidade ou fissuras.',
      '*IMPORTANTE: Avaliar a necessidade de retoques de pintura nas áreas com maior desgaste para a Celebração.',
      'Nota da instrução: A pintura dura em média de 3 a 5 anos; não é preciso pintar o prédio inteiro se apenas retoques forem suficientes.',
      'Verificar o estado das cortinas, persianas, rodapés e espelhos de tomadas.',
      'Inspecionar piso do auditório e salas quanto a pisos soltos ou trincados.'
    ]
  },
  {
    id: 'prev-pre-insp-externa',
    title: 'Ficha de Trabalho: Inspeção Externa',
    eventPeriod: 'PRE_CELEBRACAO',
    periodLabel: 'Fevereiro a Março',
    category: 'Estrutura / Telhado',
    frequency: 'Anual',
    description: 'Inspeção visual da fachada, calçadas, calhas térreas e áreas de acesso.',
    guidelines: [
      'Verificar a limpeza e drenagem da calçada frontal e rampas de acesso.',
      'Inspecionar a placa de identificação do Salão do Reino (limpeza e fixação).',
      'Avaliar pintura da fachada e marquises externas.',
      'Checar se há rachaduras aparentes ou infiltrações na base dos muros externos.'
    ]
  },
  {
    id: 'prev-pre-portas',
    title: 'Ficha de Trabalho: Portas e Janelas',
    eventPeriod: 'PRE_CELEBRACAO',
    periodLabel: 'Fevereiro a Março',
    category: 'Esquadrias / Portas',
    frequency: 'Anual',
    description: 'Ajuste de fechaduras, dobradiças, molas aéreas, trincos e vidros.',
    guidelines: [
      'Lubrificar todas as dobradiças, fechaduras e maçanetas com spray desengripante/grafite.',
      'Regular a velocidade de fechamento das molas hidráulicas aéreas das portas de entrada.',
      'Verificar o travamento suave e a chave de todas as salas e portas de emergência com barra antipânico.',
      'Checar borrachas de vedação acústica e alinhamento dos vidros nas janelas.'
    ]
  },
  {
    id: 'prev-pre-muros',
    title: 'Ficha de Trabalho: Muros, Grades e Portões',
    eventPeriod: 'PRE_CELEBRACAO',
    periodLabel: 'Fevereiro a Março',
    category: 'Muros / Cercas / Calçadas',
    frequency: 'Anual',
    description: 'Manutenção dos portões de pedestres e veículos, grades e muros de divisa.',
    guidelines: [
      'Lubrificar as roldanas, trilhos e motor do portão eletrônico (se aplicável).',
      'Inspecionar pontos de ferrugem nas grades e portões e aplicar primer/tinta antioxidante.',
      'Verificar a estabilidade e alinhamento do portão de pedestres e fechadura magnética/elétrica.',
      'Inspecionar os muros perimetrais quanto a vegetação invasora ou trincas.'
    ]
  },
  {
    id: 'prev-pre-cadeiras',
    title: 'Ficha de Trabalho: Cadeiras da Assistência',
    eventPeriod: 'PRE_CELEBRACAO',
    periodLabel: 'Fevereiro a Março',
    category: 'Cadeiras / Móveis',
    frequency: 'Anual',
    description: 'Revisão, reaperto de parafusos e higienização dos assentos do auditório.',
    guidelines: [
      'Inspecionar o alinhamento das fileiras e fixações ao piso ou engates de união.',
      'Reapertar parafusos e porcas de sustentação em todas as poltronas e cadeiras.',
      'Higienizar o tecido/estofamento das cadeiras e remover eventuais manchas.',
      'Checar as sapatas de borracha protetoras dos pés das cadeiras avulsas.'
    ]
  },
  {
    id: 'prev-pre-extintores',
    title: 'Ficha de Trabalho: Extintores de Incêndio',
    eventPeriod: 'PRE_CELEBRACAO',
    periodLabel: 'Fevereiro a Março',
    category: 'Segurança / Incêndio',
    frequency: 'Anual',
    description: 'Inspeção de carga, validade dos selos do INMETRO, manômetros e desobstrução.',
    guidelines: [
      'Verificar se o ponteiro do manômetro de pressão está na faixa verde (operacional).',
      'Checar a data de validade da carga e do teste hidrostático estampado no selo do INMETRO.',
      'Garantir que todos os extintores estejam 100% desobstruídos e com sinalização fotoluminescente visível.',
      'Inspecionar os lacres plásticos, pinos de segurança e bicos de mangueira.'
    ]
  },

  // ==========================================
  // ATIVIDADES DO MÊS DE JUNHO
  // ==========================================
  {
    id: 'prev-jun-orcamento',
    title: 'Atividade: Revisão da Previsão de Gastos (S-27b e S-42b)',
    eventPeriod: 'JUNHO',
    periodLabel: 'Junho',
    category: 'Orçamento',
    frequency: 'Anual',
    description: 'Revisão da previsão anual de gastos com a congregação e definição de saldo reserva operacional pelo Corpo de Anciãos / Comissão de Funcionamento.',
    guidelines: [
      'Reunir os registros de despesas dos últimos 12 meses do Salão do Reino.',
      'Consultar as instruções dos documentos oficiais S-27b e S-42b.',
      'O Corpo de Anciãos ou a Comissão de Funcionamento define um valor de saldo reserva com base nas despesas operacionais.',
      'Ajustar os tetos orçamentários das categorias no sistema de manutenção.'
    ]
  },
  {
    id: 'prev-jun-ac',
    title: 'Ficha de Trabalho: Ar-condicionado (3ª Etapa Anual)',
    eventPeriod: 'JUNHO',
    periodLabel: 'Junho',
    category: 'Ar-Condicionado',
    frequency: '3x ao ano',
    description: 'Limpeza periódica de inverno/meio de ano dos filtros e verificação do sistema de climatização.',
    guidelines: [
      'Lavar e higienizar os filtros de todas as evaporadoras.',
      'Checar drenos de condensação e bandejas coletoras.',
      'Testar a resposta térmica dos aparelhos em modo ventilação/refrigeração.'
    ],
    safetyInstructions: [
      'Desligar o disjuntor correspondente antes de manusear partes internas.'
    ]
  },

  // ==========================================
  // MANUTENÇÃO PÓS-CONGRESSO (SETEMBRO A OUTUBRO)
  // ==========================================
  {
    id: 'prev-pos-ac',
    title: 'Ficha de Trabalho: Ar-condicionado',
    eventPeriod: 'POS_CONGRESSO',
    periodLabel: 'Setembro a Outubro',
    category: 'Ar-Condicionado',
    frequency: '3x ao ano',
    description: 'Revisão completa pós-congresso e preparação para o período mais quente do ano.',
    guidelines: [
      'Limpeza geral de filtros, painéis frontais e aletas direcionadoras.',
      'Higienização antibacteriana nas serpentinas dos evaporadores.',
      'Desobstrução e lavagem dos drenos com jato d’água.',
      'Inspecionar os suportes das condensadoras externas contra corrosão.'
    ]
  },
  {
    id: 'prev-pos-loucas',
    title: 'Ficha de Trabalho: Louças e Metais Sanitários',
    eventPeriod: 'POS_CONGRESSO',
    periodLabel: 'Setembro a Outubro',
    category: 'Louças / Metais',
    frequency: '2x ao ano',
    description: 'Inspeção preventiva semestral de todas as instalações hidrossanitárias.',
    guidelines: [
      'Checar válvulas de descarga, caixas acopladas e registros gaveta/pressão.',
      'Substituir vedantes de torneiras com folga ou vazamento.',
      'Verificar escoamento de pias, lavatórios e mictórios.'
    ]
  },
  {
    id: 'prev-pos-equip',
    title: 'Ficha de Trabalho: Equipamentos Gerais',
    eventPeriod: 'POS_CONGRESSO',
    periodLabel: 'Setembro a Outubro',
    category: 'Eletrodomésticos',
    frequency: '2x ao ano',
    description: 'Revisão funcional dos equipamentos de suporte, ferramentas e copa.',
    guidelines: [
      'Inspecionar bomba d’água e automático de nível de reservatório.',
      'Verificar o estado das escadas de alumínio, ferramentas e armários do depósito.',
      'Testar aparelhos da copa e verificar cabos elétricos.'
    ]
  },
  {
    id: 'prev-pos-bebedouro',
    title: 'Ficha de Trabalho: Bebedouro',
    eventPeriod: 'POS_CONGRESSO',
    periodLabel: 'Setembro a Outubro',
    category: 'Eletrodomésticos',
    frequency: '2x ao ano',
    description: 'Higienização semestral e substituição de filtros do bebedouro.',
    guidelines: [
      'Sanitização completa do reservatório de água com solução recomendada.',
      'Substituição do elemento filtrante.',
      'Limpeza externa em aço inox e desentupimento do dreno.'
    ]
  },
  {
    id: 'prev-pos-av',
    title: 'Ficha de Trabalho: Sistema de Áudio, Vídeo e Internet',
    eventPeriod: 'POS_CONGRESSO',
    periodLabel: 'Setembro a Outubro',
    category: 'Áudio / Vídeo',
    frequency: '2x ao ano',
    description: 'Manutenção semestral dos sistemas de transmissão, áudio, câmeras e rede de dados.',
    guidelines: [
      'Aspirar a poeira das entradas de ar da mesa de som e amplificadores.',
      'Conferir cabos de áudio e conexões dos microfones do púlpito e assistência.',
      'Testar câmeras de transmissão das reuniões via videoconferência.',
      'Revisar tomadas e filtros de linha do balcão de som e vídeo.'
    ]
  },
  {
    id: 'prev-pos-seg',
    title: 'Ficha de Trabalho: Sistema de Monitoramento e Alarmes',
    eventPeriod: 'POS_CONGRESSO',
    periodLabel: 'Setembro a Outubro',
    category: 'Alarme / CFTV',
    frequency: '2x ao ano',
    description: 'Teste funcional de câmeras, gravação e sensores perimétricos.',
    guidelines: [
      'Testar gravação noturna e diurna de todas as câmeras de CFTV.',
      'Verificar conexões e fontes de alimentação dos sensores.',
      'Testar sirene e comunicação de arme/desarme do sistema.'
    ]
  },
  {
    id: 'prev-pos-quadro-digital',
    title: 'Ficha de Trabalho: Quadro de Sistemas Digitais',
    eventPeriod: 'POS_CONGRESSO',
    periodLabel: 'Setembro a Outubro',
    category: 'Elétrica',
    frequency: 'Anual',
    description: 'Organização do rack de telecomunicações, nobreak, switches e roteadores.',
    guidelines: [
      'Limpar e organizar os cabos de rede (patch cords) dentro do rack de telecom.',
      'Testar a autonomia e o estado da bateria do No-Break (UPS).',
      'Inspecionar ventoinhas de exaustão do gabinete de rede.',
      'Identificar e etiquetar pontos de rede principais.'
    ]
  },
  {
    id: 'prev-pos-eletrica',
    title: 'Ficha de Trabalho: Instalações Elétricas',
    eventPeriod: 'POS_CONGRESSO',
    periodLabel: 'Setembro a Outubro',
    category: 'Elétrica',
    frequency: 'Anual',
    description: 'Inspeção do Quadro Geral de Distribuição (QGD), reaperto de bornes e termografia visual.',
    guidelines: [
      'Reapertar parafusos e conexões dos disjuntores no Quadro Geral de Distribuição.',
      'Checar aquecimento anormal em barramentos e cabos principais.',
      'Testar o dispositivo residual (DR) pelo botão de teste "T".',
      'Verificar o estado das lâmpadas e luminárias de emergência em todas as saídas.'
    ],
    safetyInstructions: [
      'ATENÇÃO: Serviços no quadro elétrico devem ser realizados EXCLUSIVAMENTE por irmãos devidamente capacitados e qualificados.',
      'Utilizar ferramentas com isolamento 1.000V e EPIs adequados (luvas isolantes, calçado sem partes metálicas expostas).'
    ]
  },
  {
    id: 'prev-pos-pragas',
    title: 'Ficha de Trabalho: Controle de Pragas',
    eventPeriod: 'POS_CONGRESSO',
    periodLabel: 'Setembro a Outubro',
    category: 'Limpeza / Higiene',
    frequency: 'Anual',
    description: 'Dedetização, desratização e vistoria contra cupins e insetos rasteiros.',
    guidelines: [
      'Contratar ou agendar a dedetização e desratização anual do Salão.',
      'Inspecionar armários, púlpito e estruturas de madeira quanto a vestígios de cupim.',
      'Verificar telas de proteção contra mosquitos e fechar frestas de rodapés.'
    ]
  },
  {
    id: 'prev-pos-fossas',
    title: 'Ficha de Trabalho: Fossas Sépticas e Sumidouros',
    eventPeriod: 'POS_CONGRESSO',
    periodLabel: 'Setembro a Outubro',
    category: 'Hidráulica / Esgoto',
    frequency: 'Anual',
    description: 'Inspeção do nível de lodo da fossa séptica, caixas de gordura e sumidouros.',
    guidelines: [
      'Inspecionar o nível de retenção de sólidos na fossa séptica.',
      'Limpar e retirar resíduos acumulados na caixa de gordura da copa.',
      'Verificar o fluxo de escoamento até a rede pública ou sumidouro.',
      'Programar caminhão limpa-fossa caso o volume atinja o limite operacional.'
    ],
    safetyInstructions: [
      'CUIDADO: Nunca acender fósforos ou chamas próximo a tampas de fossa devido ao risco de gases inflamáveis (metano).',
      'Manter a área ventilada ao abrir tampas de inspeção.'
    ]
  },
  {
    id: 'prev-pos-caixas-passagem',
    title: 'Ficha de Trabalho: Caixas de Passagem',
    eventPeriod: 'POS_CONGRESSO',
    periodLabel: 'Setembro a Outubro',
    category: 'Hidráulica / Esgoto',
    frequency: 'Anual',
    description: 'Limpeza e desobstrução de caixas de inspeção pluviais, esgoto e passagem elétrica externa.',
    guidelines: [
      'Abrir e retirar areia, folhas e detritos das caixas de águas pluviais do pátio.',
      'Checar caixas de passagem elétrica subterrâneas contra acúmulo de umidade ou formigueiros.',
      'Verificar o bom assentamento das tampas para evitar acidentes com tropeços.'
    ]
  },

  // ==========================================
  // FICHAS BIENAIS SOB ORIENTAÇÃO DO TM (1 A 2 ANOS)
  // ==========================================
  {
    id: 'prev-tm-caixa-dagua',
    title: 'Ficha Específica TM: Caixa d’Água',
    eventPeriod: 'BIENAL_TM',
    periodLabel: 'A cada 1 ou 2 anos (sob orientação do TM)',
    category: 'Hidráulica / Esgoto',
    frequency: 'A cada 1 ou 2 anos (TM)',
    requiresTM: true,
    isHighRisk: true,
    requiresDC85: true,
    description: 'Esvaziamento, lavagem, desinfecção e vedação dos reservatórios superiores de água potável.',
    guidelines: [
      'Executar sob orientação direta do Treinador de Manutenção (TM).',
      'Preencher e enviar o formulário DC-85 ao TM com no mínimo 15 dias de antecedência.',
      'Esvaziar o reservatório deixando um palmo de água para a esfregação das paredes e fundo.',
      'Utilizar escovas de cerdas plásticas (nunca escovas de aço ou produtos químicos tóxicos).',
      'Desinfetar com solução de hipoclorito de sódio na proporção correta e enxaguar.',
      'Verificar a vedação da tampa de inspeção e tela da tubulação de respiro (ladrão).'
    ],
    safetyInstructions: [
      'TRABALHO EM ALTURA E ESPAÇO CONFINADO (Alto Risco - Documentos S-283 e DC-82).',
      'Exige uso obrigatório de cinto de segurança tipo paraquedista, linha de vida e acompanhamento de vigia externo.'
    ]
  },
  {
    id: 'prev-tm-telhado',
    title: 'Ficha Específica TM: Calhas, Beirais, Estrutura do Telhado, Telhas e Forro',
    eventPeriod: 'BIENAL_TM',
    periodLabel: 'A cada 1 ou 2 anos (sob orientação do TM)',
    category: 'Estrutura / Telhado',
    frequency: 'A cada 1 ou 2 anos (TM)',
    requiresTM: true,
    isHighRisk: true,
    requiresDC85: true,
    description: 'Inspeção estrutural do telhado, limpeza das calhas e condutores, alinhamento de telhas e forro.',
    guidelines: [
      'Executar a cada 1 ou 2 anos sob a orientação do Treinador de Manutenção (TM).',
      'Preencher formulário DC-85 e enviar ao TM com antecedência mínima de 15 dias.',
      'Limpar completamente as calhas de folhas e detritos acumulados.',
      'Inspecionar calhas e rufos quanto a pontos de oxidação, trincas ou descolamentos de vedação.',
      'Inspecionar telhas quebradas ou deslocadas que possam causar infiltrações.',
      'Verificar a estrutura do madeiramento/metalica interna do forro.'
    ],
    safetyInstructions: [
      'TRABALHO EM ALTURA (Alto Risco). Proibido subir no telhado sem linha de vida e ancoragem segura.',
      'Nunca pisar diretamente sobre as telhas sem pranchas de distribuição de peso.'
    ]
  }
];

export const PROGRAM_GENERAL_INSTRUCTIONS = {
  title: 'Instruções do Programa de Manutenção para Salões do Reino (06/26)',
  eventConcept: 'São ocasiões programadas com antecedência para realizar as duas manutenções anuais no Salão do Reino: a Manutenção pré-Celebração e a Manutenção pós-Congresso. Nesses dias, serão realizadas as Fichas de Trabalho.',
  schedulingRules: [
    'Cada evento precisa ter dia e hora marcados, e acontecer em um único dia ou em um fim de semana, dependendo da necessidade.',
    'Os eventos devem ser anunciados com antecedência para que um grande número de publicadores se organize. Todos os anciãos são incentivados a estar presentes.',
    'Manutenção pré-Celebração: Realizada entre fevereiro e março. Não deve interferir no discurso especial nem na distribuição de convites.',
    'Manutenção pós-congresso: Programada para as semanas após o congresso (não pode ultrapassar o mês de outubro).'
  ],
  paintingRules: 'A pintura dos Salões do Reino dura, em média, de 3 a 5 anos, e deve ser renovada nesse período. No entanto, a pintura pode ser feita apenas nas áreas com maior desgaste. Não é preciso pintar o prédio inteiro se não houver necessidade.',
  safetyRules: 'Para trabalhar com segurança, é essencial planejar com antecedência. No caso de trabalhos de alto risco, é preciso preencher o formulário DC-85 e enviar ao TM com, no mínimo, 15 dias de antecedência (docs S-283 e DC-82). Para elétrica, verificar com antecedência irmãos capacitados.',
  foodRules: 'Durante os eventos de manutenção, os publicadores devem cuidar de sua própria alimentação, assim como acontece nas assembleias e congressos. Os recursos da congregação não devem ser usados para esse fim.',
  unexpectedRepairs: 'Problemas inesperados (lâmpadas queimadas, consertos e vazamentos) devem ser resolvidos assim que identificados, sem esperar pelos eventos anuais.',
  juneBudgetReview: 'Uma vez por ano, no mês de junho, deve-se revisar a previsão de gastos da congregação. O corpo de anciãos ou a Comissão de Funcionamento define um valor de saldo reserva com base nas despesas operacionais (docs S-27b e S-42b). As atividades de junho não são consideradas um evento.',
  hubRegistration: 'Após a conclusão das atividades, o contato da manutenção deve registrar o andamento e a finalização das tarefas no JW Hub.'
};
