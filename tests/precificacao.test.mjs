import { test } from 'node:test';
import assert from 'node:assert/strict';
import { app } from './support/app.mjs';

function setup() {
  const { api } = app(), state = api.getState();
  state.config.custosFixos = [{ id: 'aluguel', valor: 2200 }];
  Object.assign(state.config, { horasDono: 0, produtividade: 100, encargos: 0, imposto: 0 });
  state.equipe = [{ id: 'pessoa', nome: 'Montador', status: 'Ativo', vinculo: 'CLT', valor: 3200, horasSemana: 160 / 4.33 }];
  const q = api.newDraft();
  Object.assign(q, { chapas: [], fitas: [], itens: [], outros: 1000, reservaPct: 0,
    horasOficina: 40, horasInstalacao: 0, precoModo: 'areas', lucros: { material: 100, maoObra: 50, empresa: 20 } });
  return { api, state, q };
}

test('mantém o custo por hora anterior e aplica lucros diferentes somente no ajuste final', () => {
  const { api, q } = setup(), c = api.calcQuote(q);
  assert.equal(c.valido, true);
  assert.equal(c.custosAreas.material, 1000);
  assert.equal(c.custosAreas.maoObra, 800);
  assert.equal(c.custosAreas.empresa, 550);
  assert.equal(c.custo, 2350);
  assert.equal(c.lucroAlvo, 1510);
  assert.equal(c.preco, 3860);
});

test('permite zero e cem e rejeita percentuais ausentes ou fora do intervalo', () => {
  const { api, q } = setup();
  q.lucros = { material: 100, maoObra: 100, empresa: 100 };
  assert.equal(api.calcQuote(q).preco, 4700);
  q.lucros = { material: 0, maoObra: 0, empresa: 0 };
  assert.equal(api.calcQuote(q).preco, 2350);
  for (const value of ['', -1, 101, 'inválido']) { q.lucros.material = value; assert.equal(api.calcQuote(q).valido, false); }
});

test('taxas preservam lucro em reais e descontos reduzem a sobra', () => {
  const { api, state, q } = setup();
  state.config.imposto = 10; q.rtPct = 5;
  const c = api.calcQuote(q), f = { id: 'cartao', taxa: 5, desconto: 0 };
  assert.ok(Math.abs(c.preco - 3860 / 0.85) < 0.00001);
  const paid = api.calcCond(c, f);
  assert.equal(paid.preco, 4825);
  assert.ok(Math.abs(paid.sobra - 1510) < 0.00001);
  q.descontos = { cartao: 10 };
  const discounted = api.calcCond(api.calcQuote(q), f);
  assert.equal(discounted.preco, 4342.5);
  assert.ok(Math.abs(discounted.sobra - 1124) < 0.00001);
});

test('novos orçamentos e telas anteriores permanecem no fluxo original', () => {
  const { api, q } = setup(), fresh = api.newDraft();
  assert.equal(fresh.maoModo, undefined);
  assert.equal(fresh.precoModo, undefined);
  delete q.precoModo; q.margemManual = 25;
  assert.equal(api.calcQuote(q).preco, 2350 / 0.75);
  api.ui.draft = q; api.ui.step = 2;
  const labor = api.vEditor();
  assert.match(labor, /Estimativa rápida/);
  assert.doesNotMatch(labor, /Mão de obra \+ empresa por dia/);
  api.ui.step = 3;
  assert.match(api.vEditor(), /Margem sugerida/);
  assert.doesNotMatch(api.vEditor(), /Lucro sobre cada custo/);
  assert.match(api.reviewHTML(q), /Ajustar lucro por categoria/);
});

test('rascunhos do modo removido voltam às horas rápidas sem alterar propostas enviadas', () => {
  const { api, q } = setup();
  Object.assign(q, { maoModo: 'separado', maoLancamentos: [{ etapa: 'Corte', horas: 24 }, { etapa: 'Instalação', horas: 8 }] });
  api.restoreDraftLabor(q);
  assert.equal(q.maoModo, 'rapido');
  assert.equal(q.horasOficina, 24);
  assert.equal(q.horasInstalacao, 8);
  const sent = { status: 'enviado', maoModo: 'separado', proposta: { calc: { preco: 9999 } } };
  api.restoreDraftLabor(sent);
  assert.equal(sent.maoModo, 'separado');
  assert.equal(sent.proposta.calc.preco, 9999);
});

test('atualizar os percentuais não interrompe o editor', () => {
  const { api, q } = setup(); api.ui.draft = q;
  assert.doesNotThrow(() => api.live());
  q.lucros.empresa = 100;
  assert.doesNotThrow(() => api.live());
});
