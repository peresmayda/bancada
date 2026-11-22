import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('../../src/app.js', import.meta.url), 'utf8');
export function app() {
  const context = {
    window: { addEventListener() {} },
    document: { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; } },
    localStorage: { getItem() { return null; } },
  };
  const end = source.indexOf('\nif(cloudEnabled)bootCloud();');
  assert.ok(end > 0);
  runInNewContext(source.slice(0, end) + `
    S=seed();
    openModal=function(spec){window.modal=spec};
    window.api={materialIdentity,importMaterialMatches,createImportedMaterial,migrateMdf,defMdf,mobcloudPreview,pieceTable,materialTable,projectMaterials,estimateMaterialSheets,reviewProjectImport,
      oficina,calcQuote,calcCond,quoteLabor,laborResources,newDraft,reviewHTML,sideHTML,vEditor,live,ui,restoreDraftLabor,profitDefaults,ensureFixedBills,fixedBillDate,cxReserve,cxMonthly,cxMonthCard,dGeral,dPagar,CX,mesAtual,cxPayments,saveClientRecord,clientContact,quoteDeleteReason,deleteQuoteRecord,restoreQuoteRecord,importedDraftBase,proposalData,proposalHTML,companySurvival,vClientes,readBackup,
      getState:function(){return S},setState:function(state){S=state}};
  })();`, context);
  return { api: context.window.api, window: context.window };
}
