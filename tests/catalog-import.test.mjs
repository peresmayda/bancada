import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from './support/app.mjs';

test('catálogo acrescenta somente os padrões novos e preserva preços, exclusões e IDs da oficina', () => {
  const { api } = app();
  const original = api.defMdf().find(m => m.padrao === 'Freijó Puro' && m.espessura === 15);
  const config = { mdfCatalogV: 2, chapas: [{ ...original, preco: 777 }] };
  api.migrateMdf(config);
  assert.equal(config.mdfCatalogV, 3);
  assert.equal(config.chapas[0].preco, 777);
  assert.equal(config.chapas.length, 11);
  assert.ok(config.chapas.some(m => m.padrao === 'Cinza Sagrado Cristallo' && m.preco === null));
  api.migrateMdf(config);
  assert.equal(config.chapas.length, 11);
});

test('identifica grafia, ordem, acabamento equivalente e dimensões sem confundir produtos', () => {
  const { api } = app(), catalog = api.defMdf();
  const match = name => api.importMaterialMatches('chapas', { name }, catalog, {});
  assert.match(match('Duratex Frejó Puro Essencial Wood MDF 2750x1850x15').mapped, /freijo-puro-15$/);
  assert.match(match('15mm Carvalho Hannover Duratex MDF').mapped, /carvalho-hanover-15$/);
  assert.match(match('MDF 18 mm Gianduia Velluto Duratex').mapped, /gianduia-natural-18$/);
  assert.match(match('MDF Freijó Imperial Thera 15 mm').mapped, /freijo-imperial-thera-15$/);
  assert.equal(match('MDF Gianduia 15 mm Duratex').mapped, '');
  assert.equal(match('MDF Freijó Puro Duratex').mapped, '');
  assert.equal(match('MDP Freijó Puro Duratex 15 mm').mapped, '');
  assert.equal(match('MDF Freijó Puro Arauco 15 mm').mapped, '');
  assert.equal(match('MDF Cinza Sagrado Duratex 15 mm').mapped, '');
});

test('associação confirmada resiste à ordem dos termos sem reaproveitar outra espessura', () => {
  const { api } = app(), catalog = api.defMdf();
  const name = 'Gianduia MDF 15 mm Duratex', selected = 'mdf-duratex-gianduia-trama-15';
  const saved = { ['chapas:identity:' + api.materialIdentity(name).key]: selected };
  assert.equal(api.importMaterialMatches('chapas', { name: 'Duratex 15 mm MDF Gianduia' }, catalog, saved).mapped, selected);
  assert.equal(api.importMaterialMatches('chapas', { name: 'Duratex 18 mm MDF Gianduia' }, catalog, saved).mapped, '');
});

test('cadastro na importação exige custo e especificação, evita duplicação e não altera preços já ajustados', () => {
  const { api } = app();
  assert.throws(() => api.createImportedMaterial('chapas', { nome: 'MDF Novo', preco: '' }), /preço/);
  assert.throws(() => api.createImportedMaterial('chapas', { nome: 'MDF Novo', preco: 100 }), /espessura/);
  assert.throws(() => api.createImportedMaterial('chapas', { nome: 'MDF Novo 15 mm', espessura: 18, preco: 100 }), /coincidir/);
  const material = api.createImportedMaterial('chapas', { nome: 'MDF Padrão Especial 15 mm', preco: 425 });
  assert.equal(api.createImportedMaterial('chapas', { nome: '15 mm Padrão Especial MDF', preco: 999 }).id, material.id);
  assert.equal(material.preco, 425);
  assert.throws(() => api.createImportedMaterial('fitas', { nome: 'Fita nova', preco: 100 }), /metros/);
  assert.throws(() => api.createImportedMaterial('itens', { nome: 'Dobradiça nova', preco: 5 }), /unidade/);
});

test('conferência oferece sugestões e cadastro sem sair da importação', () => {
  const { api, window } = app();
  api.migrateMdf(api.getState().config);
  api.mobcloudPreview({ origem: 'CSV', arquivo: 'materiais.csv', chapas: [{ name: 'MDF Frejó Puro 15 mm Duratex', qty: 2 }], fitas: [], itens: [] });
  assert.match(window.modal.body, /Sugestões para este material/);
  assert.match(window.modal.body, /Buscar no catálogo/);
  assert.match(window.modal.body, /Cadastrar e selecionar/);
  assert.match(window.modal.body, /freijo-puro-15" selected/);
});
