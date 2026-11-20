import { test } from 'node:test';
import assert from 'node:assert/strict';
import { app } from './support/app.mjs';

function setup() {
  const { api } = app();
  const state = api.getState();
  state.config.custosFixos = [{ id: 'aluguel', valor: 2200 }];
  state.config.diasFuncionamento = 22;
  state.config.horasDono = 0;
  state.config.produtividade = 100;
  state.config.encargos = 0;
  state.config.imposto = 0;
  state.equipe = [{ id: 'pessoa', nome: 'Montador', status: 'Ativo', vinculo: 'CLT', valor: 3200, horasSemana: 160 / 4.33 }];
  const q = api.newDraft();
  Object.assign(q, { chapas: [], fitas: [], itens: [], outros: 1000, reservaPct: 0,
    maoLancamentos: [{ etapa: 'Montagem', pessoa: 'pessoa', horas: 40 }],
    diasOficina: 5, ocupacaoPct: 100, lucros: { material: 100, maoObra: 50, empresa: 20 } });
  return { api, state, q };
}

test('separa salários das despesas diárias sem contar a folha duas vezes', () => {
  const { api, q } = setup();
  const c = api.calcQuote(q);
  assert.equal(c.valido, true);
  assert.equal(c.custosAreas.material, 1000);
  assert.equal(c.custosAreas.maoObra, 800);
  assert.equal(c.labor.empresaDia, 100);
  assert.equal(c.custosAreas.empresa, 500);
  assert.equal(c.custo, 2300);
  assert.equal(c.lucroAreas.material, 1000);
  assert.equal(c.lucroAreas.maoObra, 400);
  assert.equal(c.lucroAreas.empresa, 100);
  assert.equal(c.preco, 3800);
  assert.equal(c.sobra, 1500);
});

test('permite 0 e 100 por área e rejeita campos ausentes ou fora do intervalo', () => {
  const { api, q } = setup();
  q.lucros = { material: 100, maoObra: 100, empresa: 100 };
  assert.equal(api.calcQuote(q).preco, 4600);
  q.lucros = { material: 0, maoObra: 0, empresa: 0 };
  assert.equal(api.calcQuote(q).preco, 2300);
  for (const value of ['', -1, 101, 'inválido']) {
    q.lucros.material = value;
    assert.equal(api.calcQuote(q).valido, false);
  }
});

test('taxas preservam o lucro em reais e descontos reduzem a sobra explicitamente', () => {
  const { api, state, q } = setup();
  state.config.imposto = 10;
  q.rtPct = 5;
  const c = api.calcQuote(q);
  assert.ok(Math.abs(c.preco - 3800 / 0.85) < 0.00001);
  const f = { id: 'cartao', taxa: 5, desconto: 0 };
  const paid = api.calcCond(c, f);
  assert.equal(paid.preco, 4750);
  assert.ok(Math.abs(paid.sobra - 1500) < 0.00001);
  q.descontos = { cartao: 10 };
  const discounted = api.calcCond(api.calcQuote(q), f);
  assert.equal(discounted.preco, 4275);
  assert.ok(Math.abs(discounted.sobra - 1120) < 0.00001);
});

test('projetos paralelos podem compartilhar a diária da empresa', () => {
  const { api, q } = setup();
  q.ocupacaoPct = 50;
  assert.equal(api.calcQuote(q).custosAreas.empresa, 250);
  q.ocupacaoPct = 101;
  assert.equal(api.calcQuote(q).valido, false);
  q.ocupacaoPct = 100;
  q.diasOficina = 0;
  assert.equal(api.calcQuote(q).valido, false);
});

test('salários administrativos ficam na diária e pró-labore vinculado fica na mão de obra', () => {
  const { api, state, q } = setup();
  state.equipe.push({ id: 'admin', status: 'Ativo', vinculo: 'CLT', valor: 1100, horasSemana: 0 });
  assert.equal(api.calcQuote(q).labor.empresaDia, 150);
  state.config.custosFixos.push({ id: 'dono', valor: 2400 });
  state.config.proLaboreId = 'dono';
  state.config.horasDono = 120;
  q.maoLancamentos.push({ etapa: 'Montagem', pessoa: 'dono', horas: 10 });
  const c = api.calcQuote(q);
  assert.equal(c.labor.empresaDia, 150);
  assert.equal(c.custosAreas.maoObra, 1000);
});

test('orçamento anterior mantém o cálculo por margem global', () => {
  const { api, q } = setup();
  delete q.precoModo;
  q.maoModo = 'rapido';
  q.horasOficina = 40;
  q.horasInstalacao = 0;
  q.margemManual = 25;
  const c = api.calcQuote(q);
  assert.equal(c.porAreas, false);
  const cost = 1000 + 40 * (2200 + 3200) / 160;
  assert.equal(c.custo, cost);
  assert.equal(c.preco, cost / 0.75);
});

test('atualização ao editar os percentuais funciona mesmo fora da tabela de lucro', () => {
  const { api, q } = setup();
  api.ui.draft = q;
  assert.doesNotThrow(() => api.live());
  q.lucros.empresa = 100;
  assert.doesNotThrow(() => api.live());
});
