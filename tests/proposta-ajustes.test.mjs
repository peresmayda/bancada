import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from './support/app.mjs';

function draft() {
  const context = app(), { api } = context, q = api.newDraft();
  Object.assign(q, { titulo: 'Armários', contato: { nome: 'Cliente teste' }, horasOficina: 16, prazoDias: 45, descricao: '' });
  return { ...context, q };
}

test('gera proposta sem descrição e mantém a validação do prazo de execução', () => {
  const { api, q } = draft();
  const proposal = api.proposalData(q, '2026-11-21');
  assert.equal(proposal.error, undefined);
  assert.equal(proposal.descricao, '');
  assert.match(api.proposalHTML(q), /Armários/);
  assert.doesNotMatch(api.reviewHTML(q), /data-f="descricao" required/);
  q.prazoDias = 15;
  assert.match(api.proposalData(q, '2026-11-21').error, /pelo menos 30 dias/);
});

test('quantidade acompanha os itens e o valor informado continua sendo o total da linha', () => {
  const { api, q } = draft();
  const original = api.proposalData(q, '2026-11-21');
  q.valorarEntregas = true;
  q.valorEntregasForma = original.condicoes[0].forma.id;
  const price = original.condicoes[0].preco;
  q.entregas = [{ nome: 'Armário superior', qtd: 3, valor: price, descricao: '' }];
  const proposal = api.proposalData(q, '2026-11-21');
  assert.equal(proposal.error, undefined);
  assert.equal(proposal.itens[0].qtd, 3);
  assert.equal(proposal.itens[0].valor, price);
  assert.match(api.proposalHTML(q), /Quantidade/);
  assert.match(api.proposalHTML(q), /<td class="c">3<\/td>/);
  for (const quantity of [0, -1, '', 'abc', Infinity]) {
    q.entregas[0].qtd = quantity;
    assert.match(api.proposalData(q, '2026-11-21').error, /quantidade/);
  }
});

test('itens antigos assumem quantidade um e propostas enviadas permanecem com o retrato original', () => {
  const { api, q } = draft();
  q.entregas = [{ nome: 'Armário', valor: '' }];
  assert.equal(api.proposalData(q, '2026-11-21').itens[0].qtd, 1);
  q.proposta = api.proposalData(q, '2026-11-21');
  const snapshot = JSON.stringify(q.proposta);
  q.entregas[0].qtd = 8; q.descricao = 'Descrição nova';
  assert.doesNotMatch(api.proposalHTML(q), /Descrição nova/);
  assert.match(api.proposalHTML(q), /<td class="c">1<\/td>/);
  assert.equal(JSON.stringify(q.proposta), snapshot);
});

test('ajuste final oferece sliders globais e por categoria, com limites independentes', () => {
  const { api, q } = draft();
  assert.match(api.reviewHTML(q), /id="rv-margem"/);
  q.precoModo = 'areas'; q.lucros = { material: 20, maoObra: 30, empresa: 40 };
  const html = api.reviewHTML(q);
  for (const area of ['material', 'maoObra', 'empresa']) {
    assert.match(html, new RegExp('type="range" min="0" max="100" step="0.5" data-profit="' + area));
  }
  const before = api.calcQuote(q).preco;
  q.lucros.material = 100;
  assert.ok(api.calcQuote(q).preco > before);
  assert.equal(q.lucros.maoObra, 30);
  assert.equal(q.lucros.empresa, 40);
});

test('resumo do orçamento mostra só materiais e depois acrescenta custo e preço', () => {
  const { api, q } = draft();
  api.ui.draft = q;
  api.ui.step = 1;
  const materiais = api.sideHTML(q);
  assert.match(materiais, /Material/);
  assert.doesNotMatch(materiais, /class="k">Preço|Lucro da empresa|<span>Mão de obra<\/span>|Custo até aqui/);
  api.ui.step = 2;
  const mao = api.sideHTML(q);
  assert.match(mao, /Custo até aqui/);
  assert.match(mao, /Mão de obra/);
  assert.doesNotMatch(mao, /class="k">Preço|Lucro da empresa/);
  api.ui.step = 3;
  assert.match(api.sideHTML(q), /class="k">Preço/);
});

test('proposta usa o modelo de Ajustes e aceita ajuste só nesta proposta', () => {
  const { api, q } = draft();
  const C = api.getState().config;
  C.nomeOficina = 'Marcenaria WDM';
  C.proposta = { cnpj: '12.345.678/0001-90', instagram: 'marcenariawdm', cor: '#2E7D5B' };
  let html = api.proposalHTML(q);
  assert.match(html, /Marcenaria WDM/);
  assert.match(html, /CNPJ 12\.345\.678\/0001-90/);
  assert.match(html, /@marcenariawdm/);
  assert.match(html, /--pc:#2E7D5B/);
  q.propCor = '#8C3B3B';
  q.propDados = { nome: 'WDM Móveis', cnpj: '' };
  html = api.proposalHTML(q);
  assert.match(html, /WDM Móveis/);
  assert.match(html, /CNPJ 12\.345\.678\/0001-90/);
  assert.match(html, /--pc:#8C3B3B/);
  q.propCor = 'red;background:url(x)';
  assert.match(api.proposalHTML(q), /--pc:#2E7D5B/);
});

test('proposta enviada guarda os dados da oficina do momento do envio', () => {
  const { api, q } = draft();
  const C = api.getState().config;
  C.proposta = { cnpj: '11.111.111/0001-11', cor: '#2B2F33' };
  q.proposta = api.proposalData(q, '2026-11-21');
  C.proposta = { cnpj: '22.222.222/0001-22', cor: '#2A5E9A' };
  const html = api.proposalHTML(q);
  assert.match(html, /11\.111\.111\/0001-11/);
  assert.match(html, /--pc:#2B2F33/);
});
