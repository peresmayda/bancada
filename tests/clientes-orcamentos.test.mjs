import { test } from 'node:test';
import assert from 'node:assert/strict';
import { app } from './support/app.mjs';

test('cadastra cliente com endereço sem exigir orçamento nem projeto e evita duplicar o cadastro', () => {
  const { api } = app(), state = api.getState();
  const result = api.saveClientRecord({ nome: 'Ana Silva', telefone: '11999999999', endereco: 'Rua Azul, 12', email: 'ana@example.com' });
  assert.equal(result.client.endereco, 'Rua Azul, 12');
  assert.equal(state.clientes.length, 1);
  assert.equal(state.orcamentos.length, 0);
  assert.equal(state.obras.length, 0);
  assert.ok(api.saveClientRecord({ nome: ' ana silva ', endereco: 'Outro endereço' }).error);
  assert.equal(state.clientes[0].endereco, 'Rua Azul, 12');
  assert.match(api.vClientes(), /Sem projetos/);
  assert.ok(api.saveClientRecord({ nome: ' ' }).error);
});

test('endereço acompanha o novo orçamento e a proposta com escape de HTML', () => {
  const { api } = app();
  const c = api.saveClientRecord({ nome: 'Ana', endereco: 'Rua <Azul>, 12', email: 'ana@example.com' }).client;
  const q = api.newDraft(c.id);
  Object.assign(q, { titulo: 'Cozinha', descricao: 'Armários planejados', prazoDias: 30, prazoUnidade: 'corridos', horasOficina: 10 });
  assert.equal(q.contato.email, c.email);
  assert.equal(q.contato.endereco, c.endereco);
  const proposal = api.proposalData(q, api.mesAtual() + '-01');
  assert.equal(proposal.error, undefined);
  assert.equal(proposal.endereco, c.endereco);
  assert.match(api.proposalHTML(q), /Rua &lt;Azul&gt;, 12/);
  api.ui.draft = q; api.ui.step = 0;
  const form = api.vEditor();
  assert.match(form, /Endereço de instalação/);
  assert.match(form, /Importar materiais do projeto/);
});

test('editar cliente atualiza rascunhos sem reescrever propostas enviadas nem endereço específico do projeto', () => {
  const { api } = app(), state = api.getState();
  const c = api.saveClientRecord({ nome: 'Ana', endereco: 'Endereço antigo' }).client;
  const draft = api.newDraft(c.id), custom = api.newDraft(c.id), sent = api.newDraft(c.id);
  custom.contato.endereco = 'Endereço da instalação';
  sent.status = 'enviado'; sent.proposta = { endereco: 'Endereço antigo' };
  state.orcamentos.push(draft, custom, sent);
  api.saveClientRecord({ nome: 'Ana atualizada', endereco: 'Endereço novo' }, c.id);
  assert.equal(draft.contato.endereco, 'Endereço novo');
  assert.equal(custom.contato.endereco, 'Endereço da instalação');
  assert.equal(sent.contato.nome, 'Ana');
  assert.equal(sent.proposta.endereco, 'Endereço antigo');
});

test('importar para um orçamento conserva identidade, cliente, endereço e condições', () => {
  const { api } = app();
  const c = api.saveClientRecord({ nome: 'Ana', endereco: 'Rua Azul' }).client;
  const draft = api.newDraft(c.id);
  draft.titulo = 'Cozinha da Ana'; draft.entradaPct = 45;
  api.ui.importDraft = draft;
  const imported = api.importedDraftBase();
  assert.equal(imported.id, draft.id);
  assert.equal(imported.clienteId, c.id);
  assert.equal(imported.contato.endereco, 'Rua Azul');
  assert.equal(imported.entradaPct, 45);
  imported.contato.nome = 'Alteração isolada';
  assert.equal(draft.contato.nome, 'Ana');
  api.ui.importDraft = null;
  assert.notEqual(api.importedDraftBase().id, draft.id);
});

test('excluir orçamento errado é recuperável e não remove cliente nem dados financeiros', () => {
  const { api } = app(), state = api.getState();
  const c = api.saveClientRecord({ nome: 'Ana', endereco: 'Rua Azul' }).client;
  const q = api.newDraft(c.id); state.orcamentos.push(q);
  assert.equal(api.deleteQuoteRecord(q.id).deleted.id, q.id);
  assert.equal(state.orcamentos.length, 0);
  assert.equal(state.clientes.length, 1);
  const restoredBackup = api.readBackup(JSON.stringify({ format: 'bancada-backup', version: 1, state }));
  assert.equal(restoredBackup.orcamentosExcluidos[0].contato.endereco, 'Rua Azul');
  assert.equal(api.restoreQuoteRecord(q.id).restored.id, q.id);
  assert.equal(state.orcamentos.length, 1);
  assert.equal(state.orcamentosExcluidos.length, 0);
  assert.equal(state.receber.length, 0);
});

test('exclusão não apaga contratos aprovados nem quebra cadeias de revisão', () => {
  const { api } = app(), state = api.getState();
  const approved = api.newDraft(); approved.status = 'aprovado'; state.orcamentos.push(approved);
  assert.ok(api.deleteQuoteRecord(approved.id).error);
  const linked = api.newDraft(); state.orcamentos.push(linked); state.obras.push({ id: 'projeto', quoteId: linked.id });
  assert.ok(api.deleteQuoteRecord(linked.id).error);
  const base = api.newDraft(), revision = api.newDraft(); revision.revisaoDe = base.id; revision.revisaoRaiz = base.id;
  state.orcamentos.push(base, revision);
  assert.ok(api.deleteQuoteRecord(base.id).error);
  api.deleteQuoteRecord(revision.id); api.deleteQuoteRecord(base.id);
  assert.ok(api.restoreQuoteRecord(revision.id).error);
  assert.ok(api.restoreQuoteRecord(base.id).restored);
  assert.ok(api.restoreQuoteRecord(revision.id).restored);
});

test('custo de manter a oficina soma fixos, variáveis e equipe sem incluir projetos', () => {
  const { api } = app(), state = api.getState();
  state.config.custosFixos = [{ id: 'aluguel', valor: 1000 }, { id: 'energia', tipo: 'variavel', valor: 200 }, { id: 'prolabore', valor: 500 }];
  state.config.diasFuncionamento = 22; state.config.encargos = 40;
  state.equipe = [{ id: 'pessoa', status: 'Ativo', vinculo: 'CLT', valor: 2000, horasSemana: 44 }];
  state.obras = [{ id: 'obra', custo: 100000 }];
  const costs = api.companySurvival();
  assert.equal(costs.fixed, 1500);
  assert.equal(costs.variable, 200);
  assert.equal(costs.payroll, 2800);
  assert.equal(costs.monthly, 4500);
  assert.equal(costs.daily, 4500 / 22);
  assert.equal(costs.monthly, api.oficina().total);
  state.config.diasFuncionamento = 0;
  assert.equal(api.companySurvival().daily, null);
});
