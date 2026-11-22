import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from './support/app.mjs';

function approved() {
  const context = app(), { api } = context, state = api.getState();
  const client = api.saveClientRecord({ nome: 'Cliente de teste', endereco: 'Rua de teste, 12' }).client;
  const quote = api.newDraft(client.id);
  Object.assign(quote, { titulo: 'Armário de teste', horasOficina: 16, horasInstalacao: 4, descricao: 'Armários', prazoDias: 45 });
  state.orcamentos.push(quote);
  const proposal = api.proposalData(quote, api.mesAtual() + '-01');
  assert.equal(proposal.error, undefined);
  const project = api.aprovar(quote, { formaId: proposal.condicoes[0].forma.id, data: api.mesAtual() + '-01', entrega: api.mesAtual() + '-28', primeira: api.mesAtual() + '-20' });
  assert.ok(project);
  state.receber = [
    { id: 'paid', obraId: project.id, clienteId: client.id, desc: 'Sinal', bruto: 300, liquido: 290, status: 'recebido', venc: api.mesAtual() + '-01', recebidoEm: api.mesAtual() + '-01', cxSeparacao: [100, 0, 0, 0, 100, 90] },
    { id: 'pending', obraId: project.id, clienteId: client.id, desc: 'Saldo', bruto: 700, liquido: 680, status: 'pendente', venc: api.mesAtual() + '-20' },
    { id: 'other', obraId: 'other', bruto: 50, liquido: 50, status: 'pendente', venc: api.mesAtual() + '-20' },
  ];
  state.pagar.push({ id: 'supplier', obraId: project.id, desc: 'Fornecedor', categoria: 'Material', valor: 150, status: 'pendente', venc: api.mesAtual() + '-20' });
  return { ...context, state, client, quote, project };
}

test('cancelamento preserva contrato, recebimentos, separações, gastos e demais projetos', () => {
  const { api, window, state, quote, project } = approved();
  const proposal = JSON.stringify(quote.proposta), paid = JSON.stringify(state.receber[0]), bills = JSON.stringify(state.pagar);
  assert.ok(api.cancelApprovedQuote(quote.id, ' ', true).error);
  assert.equal(quote.status, 'aprovado');
  assert.ok(api.cancelApprovedQuote(quote.id, 'Cliente desistiu', true).project);
  assert.equal(quote.status, 'cancelado');
  assert.equal(JSON.stringify(quote.proposta), proposal);
  assert.equal(JSON.stringify(state.receber[0]), paid);
  assert.equal(JSON.stringify(state.pagar), bills);
  assert.equal(state.receber.map(r => r.id).join(','), 'paid,other');
  assert.equal(project.cancelamento.parcelas[0].id, 'pending');
  assert.ok(api.cancelApprovedQuote(quote.id, 'De novo', true).error);
  assert.ok(api.quoteDeleteReason(quote));
  assert.equal(api.aprovar(quote, {}), null);
  assert.match(api.vOrcamentos(), /Cancelados/);
  assert.match(api.vObras(), /Projetos cancelados/);
  assert.doesNotMatch(api.dGeral(), /Armário de teste/);
  api.viewQuote(quote.id);
  assert.match(window.modal.body, /Contrato original/);
  assert.ok(window.modal.body.includes(Math.round(project.valor).toLocaleString('pt-BR')));
  const backup = JSON.stringify({ format: 'bancada-backup', version: 1, state });
  assert.equal(api.readBackup(backup).obras[0].cancelamento.parcelas[0].id, 'pending');
});

test('restaurar aprovação devolve as parcelas originais uma única vez e mantém auditoria', () => {
  const { api, state, quote, project } = approved();
  const pending = JSON.stringify(state.receber[1]), stage = project.etapa;
  api.cancelApprovedQuote(quote.id, 'Engano', true);
  assert.ok(api.restoreApprovedQuote(quote.id).project);
  assert.equal(quote.status, 'aprovado');
  assert.equal(project.etapa, stage);
  assert.equal(JSON.stringify(state.receber.find(r => r.id === 'pending')), pending);
  assert.equal(project.historicoCancelamentos[0].motivo, 'Engano');
  assert.equal(project.cancelamento, undefined);
  assert.ok(api.restoreApprovedQuote(quote.id).error);
  assert.equal(state.receber.filter(r => r.id === 'pending').length, 1);
});

test('cancelamento pode manter as cobranças quando houver saldo ainda devido', () => {
  const { api, state, quote, project } = approved();
  const records = JSON.stringify(state.receber);
  api.cancelApprovedQuote(quote.id, 'Acerto pendente', false);
  assert.equal(JSON.stringify(state.receber), records);
  assert.equal(project.cancelamento.parcelas.length, 0);
});

test('exclusão de cliente é recuperável, preserva vínculos e edição permanece disponível', () => {
  const { api, window, state, client, quote, project } = approved();
  const projects = JSON.stringify(state.obras), receipts = JSON.stringify(state.receber);
  assert.ok(api.clientArchiveRecord(client.id, false).client);
  assert.equal(state.orcamentos[0].clienteId, client.id);
  assert.equal(state.obras[0].clienteId, client.id);
  assert.equal(JSON.stringify(state.obras), projects);
  assert.equal(JSON.stringify(state.receber), receipts);
  assert.doesNotMatch(api.vClientes(), new RegExp('data-act="openCliente" data-id="' + client.id));
  assert.match(api.vClientes(), /Clientes excluídos/);
  api.ui.draft = api.newDraft(); api.ui.step = 0;
  assert.doesNotMatch(api.vEditor(), new RegExp('<option value="' + client.id));
  api.clientArchiveRecord(client.id, true);
  assert.match(api.vClientes(), new RegExp('data-act="openCliente" data-id="' + client.id));
  api.openCliente(client.id);
  assert.match(window.modal.foot, /Salvar alterações/);
  assert.match(window.modal.foot, /Excluir cliente/);
  api.saveClientRecord({ nome: 'Cliente corrigido', telefone: '11999999999', email: 'teste@example.com', endereco: 'Rua corrigida' }, client.id);
  assert.equal(client.nome, 'Cliente corrigido');
  assert.equal(project.clienteId, client.id);
  assert.equal(quote.proposta.cliente, 'Cliente de teste');
});
