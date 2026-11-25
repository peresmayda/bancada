# Regras do produto e decisões de interface

## Como o código está organizado

- Rotas por hash: `#inicio`, `#orcamentos`, `#clientes`, `#obras` (tela "Projetos"), `#dinheiro` (tela "Financeiro"), `#ajustes`.
- Cliques tratados por delegação: atributos `data-act="nomeDaAcao"` chamam funções no objeto `A`. Campos usam `data-f`, `data-row`, `data-q`, `data-cond`.
- Estado em `S`, sincronizado por `src/cloud.js` com a base da conta. A publicação inicia com `app-state` vazio. O menu recolhido usa `bancada-side` no armazenamento local.
- `S` contém: `config` (custos fixos, chapas, fitas, materiais, kits, formas de pagamento, pesos do questionário, apelido, nomeOficina), `clientes`, `orcamentos`, `obras` (projetos), `receber`, `pagar`, `equipe`.
- Versão do estado: `S.v = 3`. A função `normQ` converte orçamentos antigos (`kits`, `fitaId`, `fitaMetros`) para o formato atual (`itens`, `fitas`).
- O CSS foi crescendo em camadas: blocos de tema anexados no fim do `<style>`. As regras mais novas (responsivo, sem sombra, gradiente nos destaques) estão no final e prevalecem. Ao mexer no visual, edite o bloco certo ou consolide antes.

## Regras de negócio

- O fluxo do orçamento permanece como antes: estimativa rápida de mão de obra, questionário e margem na etapa Valor. Somente na revisão final, o botão Ajustar lucro por categoria permite substituir a margem global por acréscimos independentes de 0% a 100% sobre material, mão de obra e empresa. Antes de ativar esse ajuste, o preço é o anterior. O preço por área é (custos + lucros em reais) ÷ (1 − imposto − comissão RT); terceiros e frete ficam a custo. Taxas de pagamento preservam o lucro em reais e descontos reduzem a sobra. Propostas enviadas e aprovadas preservam seus valores.
- **Preço por forma de pagamento**: Pagamento e Revisar mostram o preço calculado, o mínimo que preserva a margem mínima configurada e a margem efetiva após taxas e descontos. O mínimo é arredondado para cima ao centavo.
- Custo por pessoa-hora = (custos fixos + folha com encargos) ÷ soma das horas produtivas das pessoas. A equipe ativa soma horas semanais × 4,33, mais as horas mensais do dono; aplica-se o aproveitamento configurado. Duas pessoas por 8 horas são 16 pessoa-horas. Ao contratar, o custo mensal pode subir e o custo por pessoa-hora cair pela diluição dos fixos. Essa capacidade precisa ser ocupada; horas administrativas não devem aumentar a capacidade dos projetos.
- **Mão de obra por etapa e profissional**: no orçamento, pode-se usar a estimativa rápida da oficina ou lançar as horas individuais de projeto 3D, orçamento, compra, corte, montagem, acabamento e instalação. O modo por etapas calcula os custos diretos de cada profissional e distribui os custos indiretos por hora produtiva ou dia de ocupação exclusiva. Em Ajustes, a despesa de pró-labore pode ser atribuída às horas do dono, saindo do rateio nessa modalidade. As Caixinhas usam o custo de mão de obra e oficina arquivado na aprovação.
- Horas sugeridas automaticamente só a partir das chapas (`horasPorChapa`, já contando a montagem, e `instalacaoPct` em Ajustes). Ferragem não soma tempo.
- **Tempo padrão fixo**: `horasPorChapa` é uma referência e não acompanha a média real. A média real aparece em Ajustes só como informação (o botão "Usar média real" foi retirado de propósito). Assim, a eficiência vira lucro e não desconto para o cliente.
- **Rende por dia** (`rendeDia`): contrato líquido de impostos, RT e taxas, menos terceiros, frete, material e extras, dividido pelos dias de trabalho (horas ÷ `horasDia`, padrão 8). Aparece na janela do projeto, na coluna "Por dia" de Lucro por projeto e no card "Rende por dia de trabalho" da Visão geral, comparado com o custo de um dia (custo da hora × `horasDia`).
- **Hora e dia** (aba em Ajustes): custo da hora, custo do dia, hora e dia vendidos (custo ÷ (1 − imposto − margem base), e o mínimo com a margem mínima), capacidade do mês e média real do rendimento por dia. Campos: `horasDia` (padrão 8) e `pessoasProjeto` (padrão 2).
- **Dias no orçamento**: na etapa Mão de obra dá para digitar em horas ou em dias (um dia = uma pessoa × `horasDia`); um converte o outro. `q.pessoas` diz quantas pessoas trabalham no projeto e calcula os dias de agenda (pessoa-dias ÷ pessoas). A janela do projeto mostra os dois.
- Precificação por tabela de produto (metro linear, m², unidade) ficou para depois, calibrada com projetos reais. Antes, perguntar ao Dário como ele precifica hoje.
- **Ferragens e insumos** entram item por item (`config.materiais`: categoria, nome, unidade, preço), com quantidade no orçamento (`q.itens`). Inclui parafusos, colas e lixas. O catálogo padrão tem 90 itens com preços estimados, que o Dário precisa conferir.
- **Kits** são só atalhos: no orçamento, "Incluir" um kit soma os itens dele em `q.itens`, e cada quantidade pode ser ajustada depois.
- **Fita de borda** é cobrada pelo rolo inteiro (`config.fitas`: metros do rolo e preço do rolo). O orçamento aceita várias fitas (`q.fitas`, em rolos). A estimativa usa `fitaPorChapa` só como sugestão.
- **Proposta para o cliente** (`proposalHTML`): imprime ou salva em PDF a descrição opcional do serviço e o prazo comercial informado pelo usuário, de pelo menos 30 dias corridos ou úteis após a aprovação do projeto final. A descrição e as entregas são preenchidas na etapa Revisar, depois da precificação. Os valores por item são opcionais e, quando apresentados, somam o total da forma de pagamento escolhida como referência. A proposta também apresenta validade, condições de pagamento, itens inclusos e observações.
- **Modelo da proposta** (Ajustes → Proposta): logo (reduzido a no máximo 480 × 200 px antes de salvar), nome, WhatsApp, CNPJ, e-mail, Instagram, site, endereço da oficina e cor de destaque (`config.proposta`). Na etapa Revisar, "Personalizar esta proposta" troca a cor (`q.propCor`) e qualquer dado da oficina (`q.propDados`) só naquele orçamento; campos vazios usam o modelo. No envio, os dados e a cor ficam arquivados em `q.proposta.cabecalho`; o logo não é copiado para cada proposta e sempre vem do modelo atual. Propostas arquivadas antes do modelo usam o nome e o telefone que tinham e a cor atual.
- **Proposta impressa**: cabeçalho com logo, dados da oficina, data e validade; cliente e título; prazo e validade; itens com quantidade centralizada e valor à direita só quando houver valor por item; formas de pagamento com o valor na cor de destaque; lista do que está incluso; observações e rodapé com contatos. Impressão em A4.
- **Resumo lateral do orçamento**: em Cliente e Materiais mostra só os materiais (chapas, fita, ferragens, outros e reserva); em Mão de obra mostra o custo até aqui (material, mão de obra, terceiros e frete); a partir de Valor mostra custo, preço, lucro, margem e material × N.
- **Envio e aprovação**: marcar como enviado arquiva os valores, o prazo, o escopo e as condições em `q.proposta`. Alterações comerciais pedem uma revisão. A aprovação usa essa versão e prevê o calendário de cobranças em centavos, com ajuste para meses mais curtos. Propostas enviadas antes da v28 exibem uma indicação de que a versão enviada não foi arquivada.
- **Rascunhos**: são salvos ao editar. Em Orçamentos é possível duplicar um orçamento ou criar uma revisão de uma proposta enviada. Na etapa Materiais, a busca adiciona ferragens e insumos por nome ou categoria.
- **Importar projeto**: lê PDF com texto, DXF ASCII, CSV, TXT e XML. Quando a origem for uma lista de peças, abre a conferência com a soma da área por material; as peças e medidas ficam nos detalhes para corrigir e confirmar. Depois, associa os materiais ao catálogo. Nomes de peças não viram itens de compra. Quantidades de chapas do Mobcloud são preservadas; para listas de peças, a sugestão é a área total dividida pela área útil da chapa, arredondada para cima. O padrão explícito é 2.750 × 1.850 mm e 85% de aproveitamento, editável na conferência. Essa estimativa não substitui um plano de corte. Materiais ou unidades ausentes exigem revisão. Listas explícitas de materiais mantêm suas quantidades e unidades.
- **PDFs Mobcloud**: Importar projeto aceita o plano de corte, o orçamento ou os dois PDFs do mesmo projeto. Na junção, confere as chapas, usa a metragem do plano de corte para as fitas correspondentes e traz os componentes do orçamento, incluindo a marcação de não incluso. A conferência de materiais permite associá-los ao catálogo e confirmar quantidades ambíguas. Os preços comerciais do PDF aparecem como referência.
- **Catálogo MDF**: seleção de Duratex, Guararapes, Arauco e Berneck, com uma entrada por padrão e espessura. A atualização preserva os preços existentes e acrescenta referências públicas ou estimativas para os novos materiais. O catálogo pode ser filtrado por marca em Ajustes → Materiais e kits. Consulte [a pesquisa de MDF](pesquisa-mdf.md) para as fontes e o método. A descrição Gianduia Trama 2F Duratex de 15 mm do Mobcloud é pré-associada para conferência.
- **Dados e backup**: em Ajustes, é possível exportar e restaurar um backup JSON. A opção Começar operação exporta a base atual e inicia uma vazia com catálogo e ajustes salvos.
- **Entrada contra material** (`entradaCx`): na aprovação e na etapa Pagamento, compara o que cai no caixa, líquido da taxa e arredondado por cobrança em centavos, com material, terceiros e frete. Mostra quanto falta, em qual parcela a diferença é coberta e qual entrada mínima evita o adiantamento. A prévia da aprovação também exibe os valores líquidos quando há taxa.
- Margem ajustada por um questionário de valor (complexidade, prazo, exclusividade, risco, acabamento, estratégico).
- Comparação de material × N (multiplicador configurável) separada do controle de margem.
- Formas de pagamento: Pix, dinheiro, entrada + X parcelas (o usuário escolhe quantas), 50/50, boleto, débito, crédito, cheque.
- **Clientes** podem ser cadastrados diretamente, com nome, telefone, e-mail, endereço e observações, sem orçamento. Cadastros sem projeto aprovado aparecem em Sem projetos. A aprovação também pode criar o cliente quando necessário. Alterações do cadastro atualizam os rascunhos; propostas já enviadas mantêm o histórico e endereços específicos da instalação são preservados.
- Etapas do projeto: Projeto final → Compra de material → Produção → Instalação → Entregue.
- Ao **entregar** um projeto, abre uma janela pedindo material gasto, horas reais e gastos extras (vem preenchida com o previsto). Isso calcula o lucro real.
- **Lucro por projeto**: previsto (o que o orçamento calculou) contra real (o que sobrou de fato).
- **Caixinhas**: cada projeto tem percentuais de material, terceiros e frete, comissão, impostos, equipe e oficina, e lucro, calculados sobre o total líquido. A sugestão vem dos custos previstos. O usuário pode ajustar uma divisão que soma 100%. Cada recebimento pendente é dividido proporcionalmente e, ao marcar "Separei", os valores da parcela ficam registrados. Separações anteriores à v29 preservam os valores calculados pela ordem antiga. A visão geral conta os projetos por situação. Os que têm parcelas em aberto aparecem primeiro por vencimento, os recebidos com separação pendente vêm em seguida e os totalmente separados ficam no fim.
- **Caixinhas do mês**: reúne as categorias de todos os projetos num mês selecionado. Usa o vencimento para parcelas em aberto e a data de recebimento para valores recebidos, com a separação atual de cada parcela.
- **Reserva do mês**: Caixinhas mantém a tabela e os grupos anteriores abertos. Uma linha destaca quanto falta juntar para as contas do mês, considerando contas lançadas, pagamentos e reserva já separada. Recebimentos futuros não cobrem a meta. A programação mensal das despesas continua no A pagar.
- **Contas fixas mensais**: valores de Ajustes só entram no A pagar após programar os custos escolhidos e o dia de vencimento. O primeiro mês é informado na programação. Ao abrir o sistema, ele gera as competências faltantes até o mês atual e até meses futuros consultados, sem duplicar a chave custo/mês. Vencimentos 29–31 são limitados ao fim do mês. Uma conta manual com o mesmo nome e mês é vinculada, preservando o valor já registrado, quando há correspondência única. Pagamentos e lançamentos já gerados não são reescritos ao mudar a configuração. Excluir uma conta recorrente registra uma exceção para que não reapareça. Editar altera apenas aquela ocorrência.
- **Visão geral financeira**: restaura os indicadores e gráficos anteriores, incluindo vendas, recebido, despesas pagas, resultado de caixa, custo previsto das vendas, lucro previsto, ticket, fechamento e rendimento diário. Custos e lucros previstos dos contratos são distintos de pagamentos e resultado de caixa.
- **Clientes na lista**: Ativos (projeto ou parcela em aberto), Sem projetos e Finalizados (projetos entregues e pagos).

## Decisões de design (o que a Mayda aprovou)

- Só modo claro. Fonte Inter. Cores: azul (#2A5E9A) e marrom-madeira (#C08442).
- Fundo neutro (#ECEAE6). Painéis em vidro fosco branco, sem sombras.
- Gradiente só nos destaques: a faixa de saudação do Início, o card "A receber esta semana", o card de destaque de cada tela ("Vendido" e "Para separar agora") e a comparação de material.
- Início: a faixa com gradiente traz só a data e a frase grande ("Bom dia, [nome]. ..."). Os cards de resumo e os botões ficam abaixo dela.
- Menu lateral à esquerda, que recolhe e abre pelo botão ao lado do logo. No celular vira barra inferior; no tablet, só ícones.
- Botões sólidos: o principal preto, o secundário cinza claro.
- Linhas de cobrança: quadradinho com a data (vermelho se atrasada), nome do cliente, projeto embaixo e barrinhas da parcela ("6 de 10").

## O que a Mayda vetou (não voltar a fazer)

- Estilo da Central dela (ela só queria a ideia da frase grande).
- Barra de ícones no lugar do menu lateral.
- Gradiente no fundo da tela inteira.
- Bolinha com a inicial do cliente.
- Bloco "composição do preço" na revisão do orçamento.
- Número na frente dos orçamentos.
- A palavra "Obras" (é "Projetos").
- Pós-venda.
- Texto pronto de WhatsApp.
- Sombras (drop shadow).
- Saudação que soa robótica.

## Pendências e ideias

- Decidir se o repositório `peresmayda/bancada` fica privado (a Vercel funciona igual).
- Ligar a confirmação de e-mail com um SMTP próprio quando o Bancada sair da fase de teste.
- Proposta por link (hoje é impressa ou salva em PDF pela janela de impressão).
- Modelo de contrato da planilha de orçamento. Ouvir o Dário antes.

## Preferências da Mayda

- Textos diretos e secos, sem clichês.
- Sem viúvas (uma palavra sozinha na última linha) em nenhum formato.
- Ela prefere conversar antes: perguntar quando algo não estiver claro.

## Cadastros e manutenção

- **Excluir orçamento**: move rascunhos e propostas sem vínculo financeiro para a lixeira recuperável, incluída nos backups. Não apaga o cliente. Orçamentos aprovados ou com projeto e famílias com revisão aprovada não são excluídos. Uma versão com revisões pendentes exige remover as revisões primeiro; a recuperação respeita a ordem da cadeia.
- **Editar orçamento**: rascunhos abrem diretamente para edição. Enviados e perdidos abrem uma revisão em rascunho, mantendo a proposta original. Contratos aprovados preservam o financeiro; duplicação continua disponível.
- **Endereço**: acompanha cliente e orçamento, é copiado para a versão da proposta no envio e para o projeto na aprovação. Pode ser específico de cada instalação.
- **Importar no orçamento**: botões nas etapas Cliente e Materiais. Preserva o orçamento, cliente, endereço e condições; substitui somente chapas, fitas e itens após conferência. Um tempo já informado não é reestimado por padrão.
- **Custos fixos e variáveis**: cada despesa mensal da oficina pode ser marcada como fixa ou variável (média mensal). A visão de manutenção soma ambas e a equipe com encargos, dividida pelos dias de funcionamento para o custo diário. Materiais, terceiros e fretes dos projetos ficam fora. Os salários da equipe não devem ser repetidos nas despesas. A classificação não muda o cálculo do orçamento: ambas já fazem parte dos custos mensais da oficina.

## Catálogo e associação de importações

A conferência sugere equivalentes por padrão, marca, espessura e acabamento; reconhece Frejó/Freijó, Hannover/Hanover, Velluto/Natural e a ordem dos termos. Apenas equivalentes únicos com especificação suficiente são selecionados automaticamente. Marca, MDF/MDP e espessura incompatíveis impedem a seleção automática. As associações confirmadas ao concluir a importação ficam guardadas para as próximas listas, inclusive quando os termos mudam de ordem.

Cada material tem busca no catálogo e cadastro de chapa, fita ou componente sem abandonar a conferência. Nome e especificações vêm do arquivo; custo positivo e unidade/metros por rolo devem ser confirmados. O cadastro passa a fazer parte da oficina. Não se criam compras a partir de nomes de peças nem preços inventados. A atualização do catálogo preserva preços e IDs existentes.

## Cancelamento de aprovados e exclusão de clientes

- Orçamento aprovado pode ser cancelado na ficha do orçamento ou do projeto, informando motivo. O projeto sai do andamento e dos indicadores de venda e lucro previsto. O contrato original e os gastos permanecem preservados.
- Na confirmação, é possível retirar as parcelas ainda não recebidas da cobrança. Elas ficam guardadas no cancelamento para consulta e recuperação. Recebimentos, separações e todas as contas a pagar são mantidos. Devoluções, saldos devidos e acertos com fornecedores são decisões explícitas no financeiro.
- Desfazer o cancelamento restaura a etapa e as parcelas com IDs, valores e vencimentos originais, uma única vez. Guarda motivo, data do cancelamento e data da restauração. Versões anteriores da mesma proposta não podem ser aprovadas enquanto houver contrato aprovado ou cancelado vinculado.
- Excluir cliente é recuperável: remove o cadastro da lista e da seleção de novos orçamentos. Nome e vínculos de projetos, propostas e cobranças continuam acessíveis pelo histórico. Clientes excluídos podem ser restaurados. A ficha permite editar nome, telefone, e-mail, endereço e observações e salvar alterações, preservando propostas já enviadas.

## Ajuste de lucro e itens da proposta

- O ajuste final mantém a margem global com slider e oferece três sliders independentes de 0% a 100% sobre o custo: material, mão de obra e empresa. Slider e campo numérico ficam sincronizados; preço, lucro, composição e condições atualizam durante a edição sem recriar o controle em uso.
- Descrição geral e descrição dos itens são opcionais. Nome de item, quantidade positiva, condições válidas e prazo de execução mínimo de 30 dias continuam sendo conferidos.
- Cada entrega pode ter quantidade. Itens antigos sem esse campo assumem uma unidade. Quando os itens são valorados, o valor digitado continua sendo o total daquela linha para a quantidade informada; não é multiplicado novamente pela quantidade. A soma precisa coincidir com a condição de referência. A quantidade é arquivada na proposta e aparece na impressão; propostas já enviadas mantêm o retrato original.
