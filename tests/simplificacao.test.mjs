import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from './support/app.mjs';

function base() {
  const context = app(), { api } = context, q = api.newDraft();
  Object.assign(q, { titulo: 'Banheiro', contato: { nome: 'Cliente teste' }, horasOficina: 16, prazoDias: 45, margemManual: 25 });
  return { ...context, q };
}
const close = (a, b) => assert.ok(Math.abs(a - b) < 0.01, `${a} ≠ ${b}`);

test('terceiros com margem própria: o móvel usa a margem do orçamento e os terceiros a sua', () => {
  const { api, q } = base();
  const semTerceiros = api.calcQuote(q);
  q.terceirosItens = [{ nome: 'Vidro 4 mm incolor', cat: 'Vidros e espelhos', qtd: 2, un: 'm²', preco: 500 }];
  q.tercModo = 'proprio'; q.tercMargem = 10;
  const c = api.calcQuote(q), L = 1 - c.imp - c.rt;
  assert.equal(c.terceiros, 1000);
  close(c.custo, semTerceiros.custo + 1000);
  close(c.preco, semTerceiros.preco + 1100 / L);
  close(c.sobra, semTerceiros.sobra + 100);
  const sinal = api.calcCond(c, api.forma('sinal'));
  close(sinal.preco, Math.round(c.preco * 100) / 100);
});

test('orçamentos antigos com valor único de terceiros mantêm o preço', () => {
  const { api, q } = base();
  delete q.terceirosItens; delete q.tercModo;
  q.terceiros = 1000;
  const c = api.calcQuote(q);
  close(c.preco, c.custo / (1 - c.imp - c.rt - 0.25));
  assert.equal(c.tercProprio, 0);
});

test('terceiros entram em "Está incluso" da proposta', () => {
  const { api, q } = base();
  q.terceirosItens = [{ nome: 'Tampo de granito', cat: 'Pedras e tampos', qtd: 1, un: 'm²', preco: 650 }, { nome: 'Instalação de gás', qtd: 1, preco: 200 }];
  assert.match(api.proposalHTML(q), /Pedras e tampos/);
  assert.match(api.proposalHTML(q), /Instalação de gás/);
});

test('avisos mostram o que falta em cada etapa', () => {
  const { api } = base();
  const d = api.newDraft();
  const issues = api.draftIssues(d);
  assert.ok(issues[0].nome && issues[0].titulo);
  assert.equal(issues[4].prazo, undefined, 'prazo de 30 dias já vem pronto');
  d.contato.nome = 'Ana'; d.titulo = 'Cozinha'; d.prazoDias = 10;
  const next = api.draftIssues(d);
  assert.equal(next[0].nome, undefined);
  assert.match(next[4].prazo, /30 dias/);
});

test('comissão de arquiteto fica recolhida quando não existe', () => {
  const { api, q } = base();
  api.ui.draft = q; api.ui.step = 2;
  assert.match(api.vEditor(), /<details class="sec opt-sec">/);
  q.rtPct = 10;
  assert.match(api.vEditor(), /<details class="sec opt-sec" open>/);
});

test('primeiro uso lista o que falta e some quando tudo está feito', () => {
  const { api } = base();
  assert.match(api.setupHTML(), /Para começar/);
  const C = api.getState().config;
  C.setup = { oficina: true, custos: true, equipe: true, chapas: true };
  assert.equal(api.setupHTML(), '');
});

test('Ajustes aparecem em três grupos e a busca de material filtra por categoria', () => {
  const { api } = base();
  api.ui.aTab = 'terceiros';
  const html = api.vAjustes();
  assert.match(html, /Minha oficina/);
  assert.match(html, /Proposta e backup/);
  assert.match(html, /Serviços e materiais de terceiros/);
  api.ui.findCat = 'Dobradiças';
  assert.doesNotMatch(api.materialResults(''), /Corrediça/);
  assert.match(api.materialResults(''), /Dobradiça/);
});
