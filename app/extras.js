/* Conteúdo escrito para o Planner CheckLove: listas iniciais, modelos de mensagem e biblioteca */
(function () {
  var D = window.PL_DADOS;

  D.papelaria = {
    pre: ['Identidade visual (cores, fontes e monograma)', 'Save the date', 'Convite digital', 'Convite impresso para quem precisa', 'Site ou lista de presentes', 'Convite dos padrinhos', 'Manual dos padrinhos'],
    cer: ['Placa de boas-vindas', 'Folheto da cerimônia', 'Plaquinha "lá vem a noiva"', 'Cartão dos votos', 'Placa de lugares reservados'],
    festa: ['Mapa de mesas na entrada', 'Números ou nomes das mesas', 'Cardápio', 'Cardápio do bar', 'Tags das lembrancinhas', 'Plaquinhas da mesa de doces', 'Placa do QR Code do álbum de fotos', 'Cartão de agradecimento']
  };

  D.civilItens = ['Vestido ou roupa do civil', 'Fotógrafo para o civil', 'Alianças', 'Buquê', 'Almoço ou brinde depois', 'Avisar as testemunhas do horário'];

  D.momentos = ['Entrada dos padrinhos', 'Entrada do noivo', 'Entrada da noiva', 'Entrada das alianças', 'Assinaturas', 'Saída dos noivos', 'Primeira dança', 'Corte do bolo', 'Festa', 'Outro'];

  D.funcoesCortejo = ['Celebrante', 'Pais da noiva', 'Pais do noivo', 'Padrinhos', 'Madrinhas', 'Pajem', 'Daminha', 'Florista', 'Alianças', 'Família', 'Outro'];

  D.gruposConvidados = ['Família da noiva', 'Família do noivo', 'Amigos da noiva', 'Amigos do noivo', 'Amigos do casal', 'Trabalho', 'Outros'];

  D.mensagens = [
    { id: 'std', titulo: 'Save the date', texto: 'Oi, {convidado}! Temos uma novidade: vamos casar! 💍 Reserve a data: {data}, em {cidade}. O convite oficial chega em breve. Com carinho, {casal}.' },
    { id: 'convite', titulo: 'Envio do convite', texto: 'Oi, {convidado}! Chegou o convite do nosso casamento: {link}\n\nA cerimônia será no dia {data}, às {hora}. Confirme sua presença pelo convite até {prazo}. Esperamos você! {casal}' },
    { id: 'cobranca', titulo: 'Lembrete de confirmação', texto: 'Oi, {convidado}! Tudo bem? Estamos fechando a lista do casamento e ainda não recebemos sua confirmação. Você consegue confirmar até {prazo}? Aqui está o convite: {link}. Obrigado! {casal}' },
    { id: 'agradece', titulo: 'Agradecimento', texto: 'Oi, {convidado}! Obrigado por fazer parte do nosso dia. Foi muito especial ter você com a gente. Com carinho, {casal}.' }
  ];

  D.biblioteca = [
    { id: 'buffet', titulo: 'Roteiro para visitar o buffet', sub: 'Perguntas antes de fechar', itens: ['O que está incluso no valor por pessoa?', 'Quantos salgados, pratos e doces por convidado vocês calculam?', 'Crianças pagam? A partir de que idade?', 'Bebidas estão incluídas? Quais?', 'Tem taxa de serviço? Está no valor?', 'Quantos garçons e cozinheiros vão trabalhar?', 'A degustação é cobrada? Quantas pessoas podem ir?', 'Podemos levar bolo, doces ou bebidas de fora? Há taxa?', 'Quanto tempo de serviço está incluso? Quanto custa a hora extra?', 'O que acontece com a comida que sobra?', 'Como funcionam o sinal, as parcelas e o cancelamento?'] },
    { id: 'espaco', titulo: 'Roteiro para visitar o espaço', sub: 'O que observar e perguntar', itens: ['Capacidade para o número de convidados sentados', 'O que está incluso: mesas, cadeiras, toalhas, louça', 'Horário de início e de término, e o valor da hora extra', 'Plano para chuva em área aberta', 'Gerador, ar-condicionado e iluminação', 'Estacionamento e acesso para idosos', 'Banheiros suficientes e em bom estado', 'Espaço para a noiva se arrumar', 'Fornecedores obrigatórios ou livres', 'Visitem no mesmo dia da semana e horário da festa'] },
    { id: 'foto', titulo: 'Perguntas para o fotógrafo', sub: 'Antes de assinar', itens: ['Quantas horas de cobertura estão no pacote?', 'Cobre a preparação, a cerimônia e a festa?', 'Quantas fotos editadas vamos receber?', 'Em quanto tempo as fotos são entregues?', 'Vem com segundo fotógrafo ou assistente?', 'O álbum impresso está incluso?', 'Há taxa de deslocamento ou alimentação da equipe?', 'O que acontece se o fotógrafo ficar doente no dia?', 'Podemos ver um casamento completo, não só as melhores fotos?'] },
    { id: 'musica', titulo: 'Perguntas para o DJ ou a banda', sub: 'Para a música da cerimônia e da festa', itens: ['Quantas horas de música estão no pacote?', 'O som e a iluminação estão inclusos?', 'Fazem a música da cerimônia também?', 'Aceitam uma lista de músicas e uma lista do que não tocar?', 'Quanto tempo de montagem precisam antes da festa?', 'Têm equipamento reserva?', 'Qual o valor da hora extra?', 'Precisam de alimentação e de um lugar para descanso?'] },
    { id: 'contrato', titulo: 'O que conferir no contrato', sub: 'Antes de assinar com qualquer fornecedor', itens: D.contrato },
    { id: 'taxas', titulo: 'Taxas que aparecem no fim', sub: 'Perguntem por cada uma antes de assinar', itens: D.taxas.map(function (t) { return t[0] + ': ' + t[1]; }) },
    { id: 'dia', titulo: 'Checklist do dia do casamento', sub: 'Cerimônia e festa', itens: D.cerimonia.concat(D.festa) },
    { id: 'orcamento', titulo: 'Mensagem para pedir orçamento', sub: 'Copie e ajuste', texto: 'Olá, tudo bem? Somos [nomes] e vamos casar em [data ou mês], em [cidade], com cerca de [número] convidados. Gostaríamos de um orçamento para [serviço]. Vocês podem nos enviar o que está incluso, o valor, as formas de pagamento e se há alguma taxa extra? Estamos comparando algumas opções e queremos fechar até [data]. Obrigado!' },
    { id: 'negociar', titulo: 'Mensagem para negociar o valor', sub: 'Copie e ajuste', texto: 'Gostamos muito do trabalho de vocês e queremos fechar. O nosso orçamento para [serviço] é de R$ [valor]. Existe alguma forma de chegarmos nesse valor, ajustando o pacote ou com pagamento à vista?' }
  ];

  D.temas = [
    { id: 'roxo', nome: 'Lavanda', cor: '#7a45d8' },
    { id: 'rose', nome: 'Rosé', cor: '#b85a76' },
    { id: 'salvia', nome: 'Sálvia', cor: '#4f7d62' },
    { id: 'serenity', nome: 'Serenity', cor: '#3f6fb6' },
    { id: 'terracota', nome: 'Terracota', cor: '#b0603f' },
    { id: 'grafite', nome: 'Grafite', cor: '#3d3d4a' }
  ];
})();
