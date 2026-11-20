import { test } from 'node:test';
import assert from 'node:assert/strict';
import { app } from './support/app.mjs';

test('soma área por material sem transformar nomes de peças em compras', () => {
  const { api } = app();
  const pieces = api.pieceTable('Nome;Qtd;Comprimento (mm);Largura (mm);Material\nLateral;2;1000;500;MDF Branco 18 mm\nFundo;1;1000;1000;MDF Branco 18 mm\nPorta;2;1000;500;MDF Carvalho 18 mm');
  const report = api.projectMaterials({ name: 'projeto.csv', format: 'CSV', pieces });
  assert.equal(report.chapas.length, 2);
  assert.equal(report.chapas[0].name, 'MDF Branco 18 mm');
  assert.equal(report.chapas[0].area, 2);
  assert.equal(report.chapas[1].area, 1);
  assert.equal(report.chapas[0].qty, 1);
  assert.equal(report.chapas[0].estimated, true);
});

test('não soma quantidade de peças como quantidade de chapas', () => {
  const { api } = app();
  const pieces = api.pieceTable('Nome;Qtd;Comprimento (cm);Largura (cm);Material\nLateral;20;100;50;MDF Branco');
  const report = api.projectMaterials({ name: 'corte.csv', format: 'CSV', pieces });
  assert.equal(report.chapas[0].area, 10);
  assert.equal(report.chapas[0].qty, 3);
  api.estimateMaterialSheets(report, 2000, 1000, 100);
  assert.equal(report.chapas[0].qty, 5);
});

test('lista de materiais mantém quantidades explícitas e soma repetições', () => {
  const { api } = app();
  const materials = api.materialTable('Material;Quantidade;Unidade\nMDF Branco;2;chapas\nMDF Branco;3;chapas\nFita branca;12,5;m\nParafuso;40;un.');
  const report = api.projectMaterials({ name: 'materiais.csv', format: 'CSV', materials });
  assert.equal(report.chapas[0].qty, 5);
  assert.equal(report.chapas[0].estimated, undefined);
  assert.equal(report.fitas[0].qty, 12.5);
  assert.equal(report.itens[0].qty, 40);
  api.estimateMaterialSheets(report, 1000, 1000, 50);
  assert.equal(report.chapas[0].qty, 5);
});

test('não inventa materiais quando o arquivo contém só nomes de peças', () => {
  const { api } = app();
  const pieces = api.pieceTable('Nome;Qtd;Comprimento (mm);Largura (mm)\nLateral;2;1000;500');
  assert.throws(() => api.projectMaterials({ name: 'corte.csv', format: 'CSV', pieces }), /materiais identificados/);
  assert.equal(api.materialTable('Nome;Qtd;Comprimento (mm);Largura (mm);Material\nLateral;2;1000;500;MDF'), null);
});

test('conferência de peças começa pelos totais de materiais', () => {
  const { api, window } = app();
  const pieces = api.pieceTable('Nome;Qtd;Comprimento (mm);Largura (mm);Material\nLateral;2;1000;500;MDF Branco');
  api.reviewProjectImport([{ name: 'corte.csv', format: 'CSV', pieces }]);
  assert.equal(window.modal.title, 'Conferir consumo por material');
  assert.match(window.modal.body, /Consumo agrupado por material/);
  assert.match(window.modal.body, /<details><summary>Conferir peças/);
  assert.match(window.modal.foot, /Confirmar e conferir materiais/);
});

test('hora é por pessoa: folha maior pode diluir os custos fixos', () => {
  const { api } = app();
  const state = api.getState();
  state.config.custosFixos = [{ valor: 6000 }];
  state.config.horasDono = 160;
  state.config.produtividade = 75;
  state.config.encargos = 40;
  state.equipe = [];
  const before = api.oficina();
  state.equipe.push({ status: 'Ativo', vinculo: 'CLT', valor: 2000, horasSemana: 160 / 4.33 });
  const after = api.oficina();
  assert.equal(before.horas, 120);
  assert.equal(before.custoHora, 50);
  assert.equal(after.total, 8800);
  assert.equal(after.horas, 240);
  assert.ok(Math.abs(after.custoHora - 36.6666666667) < 0.0001);
  assert.ok(after.custoHora * 2 > before.custoHora);
});
