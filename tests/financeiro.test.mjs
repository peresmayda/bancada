import { test } from 'node:test';
import assert from 'node:assert/strict';
import { app } from './support/app.mjs';

function setup() {
  const { api } = app(), state = api.getState(), month = api.mesAtual();
  state.config.custosFixos = [{ id: 'aluguel', nome: 'Aluguel', valor: 500, lancarMensal: true, mensalDesde: month, diaMensal: 31 }];
  return { api, state, month };
}
function next(month) { return new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7), 1)).toISOString().slice(0, 7); }

test('contas fixas são geradas uma vez por custo e mês, inclusive meses futuros consultados', () => {
  const { api, state, month } = setup();
  assert.equal(api.ensureFixedBills(month), true);
  assert.equal(state.pagar.length, 1);
  assert.equal(api.ensureFixedBills(month), false);
  assert.equal(state.pagar.length, 1);
  api.ensureFixedBills(next(month));
  assert.equal(state.pagar.length, 2);
  assert.equal(new Set(state.pagar.map(p => p.key)).size, 2);
  assert.equal(api.fixedBillDate('2027-02', 31), '2027-02-28');
  assert.equal(api.fixedBillDate('2028-02', 31), '2028-02-29');
});

test('mudar programação preserva contas pagas e aplica novo valor só a novos lançamentos', () => {
  const { api, state, month } = setup();
  api.ensureFixedBills(month);
  Object.assign(state.pagar[0], { status: 'pago', pagoEm: month + '-10', valor: 480 });
  state.config.custosFixos[0].valor = 700;
  api.ensureFixedBills(next(month));
  assert.equal(state.pagar[0].valor, 480);
  assert.equal(state.pagar[0].status, 'pago');
  assert.equal(state.pagar[1].valor, 700);
});

test('reaproveita correspondência manual única e não recria uma ocorrência excluída', () => {
  const { api, state, month } = setup();
  state.pagar.push({ id: 'manual', desc: 'Aluguel', categoria: 'Custo fixo', valor: 480, venc: month + '-05', status: 'pago' });
  api.ensureFixedBills(month);
  assert.equal(state.pagar.length, 1);
  assert.equal(state.pagar[0].id, 'manual');
  assert.equal(state.pagar[0].valor, 480);
  assert.equal(state.pagar[0].key, 'fixo-aluguel-' + month);
  state.config.contasFixasIgnoradas = [state.pagar[0].key];
  state.pagar = [];
  assert.equal(api.ensureFixedBills(month), false);
  assert.equal(state.pagar.length, 0);
});

test('não ativa custos não programados e desativar mantém as contas já emitidas', () => {
  const { api, state, month } = setup();
  state.config.custosFixos[0].lancarMensal = false;
  assert.equal(api.ensureFixedBills(month), false);
  state.config.custosFixos[0].lancarMensal = true;
  api.ensureFixedBills(month);
  state.config.custosFixos[0].lancarMensal = false;
  api.ensureFixedBills(next(month));
  assert.equal(state.pagar.length, 1);
});

test('meta mantém o total do mês, abate pagamentos e reserva disponível sem contar dinheiro duas vezes', () => {
  const { api, state, month } = setup();
  state.pagar = [
    { categoria: 'Custo fixo', valor: 1000, status: 'pendente', venc: month + '-10' },
    { categoria: 'Custo fixo', valor: 500, status: 'pago', venc: month + '-05', pagoEm: month + '-05' },
  ];
  const totals = api.CX.map(() => ({ receive: 0, pending: 0, done: 0 }));
  totals[4].done = 80000;
  const result = api.cxReserve(month, totals);
  assert.equal(result.total, 150000);
  assert.equal(result.paid, 50000);
  assert.equal(result.open, 100000);
  assert.equal(result.covered, 30000);
  assert.equal(result.gap, 70000);
});

test('recebimentos futuros e reservas de outra categoria não cobrem as contas fixas', () => {
  const { api, state, month } = setup();
  state.pagar = [{ categoria: 'Custo fixo', valor: 1000, status: 'pendente', venc: month + '-10' }];
  const totals = api.CX.map(() => ({ receive: 500000, pending: 500000, done: 0 }));
  totals[0].done = 500000;
  assert.equal(api.cxReserve(month, totals).gap, 100000);
});

test('caixinhas mostram a meta sem projetos e visão geral tem só quatro indicadores', () => {
  const { api, month } = setup();
  api.ensureFixedBills(month);
  const card = api.cxMonthCard([]);
  assert.match(card, /Falta juntar neste mês/);
  assert.match(card, /Total das contas do mês/);
  assert.match(card, /<details class="cx-month-details">/);
  const overview = api.dGeral();
  assert.equal((overview.match(/class="tile /g) || []).length, 4);
  assert.doesNotMatch(overview, /Ticket médio|Taxa de fechamento|Entradas e saídas em/);
});
