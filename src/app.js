
(function(){
'use strict';
var HEAD='<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Bancada</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">';
var ETAPAS=['Projeto final','Compra de material','Produção','Instalação','Entregue'];
var STATUS={rascunho:'Rascunho',enviado:'Enviado',aprovado:'Aprovado',perdido:'Perdido'};
var MOTIVOS=['Preço','Prazo','Fechou com outro','Desistiu','Sem resposta'];
var VINCULOS=['CLT','Diarista','Mensalista / MEI','Empreitada'];
var SITUACOES=['Ativo','Férias','Afastado','Desligado'];
var Q=[
  {id:'complex',t:'Complexidade técnica',o:['Padrão','Exige atenção','Peça difícil (curvas, ripado, encaixes)']},
  {id:'prazo',t:'Prazo',o:['Folgado','Apertado','Urgente']},
  {id:'exclus',t:'Exclusividade',o:['Móvel de linha','Adaptado','Desenho autoral']},
  {id:'risco',t:'Risco da instalação',o:['Tranquila','Acesso difícil ou parede irregular','Cliente indeciso, muitas mudanças']},
  {id:'acab',t:'Acabamento',o:['Padrão','Superior','Premium (laca, lâmina, metais)']},
  {id:'estrat',t:'Valor estratégico',o:['Nenhum','Cliente recorrente','Vitrine (portfólio, indicação)']}
];
var NAV=[
  ['inicio','Início','<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/>'],
  ['orcamentos','Orçamentos','<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>'],
  ['clientes','Clientes','<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>'],
  ['obras','Projetos','<rect x="3.5" y="4.5" width="5" height="15" rx="1.2"/><rect x="9.5" y="4.5" width="5" height="10" rx="1.2"/><rect x="15.5" y="4.5" width="5" height="12.5" rx="1.2"/>'],
  ['dinheiro','Financeiro','<rect x="3" y="6" width="18" height="12.5" rx="2"/><circle cx="12" cy="12.2" r="2.6"/><path d="M6.5 9.5v.01M17.5 15v.01"/>'],
  ['ajustes','Ajustes','<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>']
];

/* ---------- utilidades ---------- */
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function n(v){var x=parseFloat(String(v==null?'':v).replace(',','.'));return isFinite(x)?x:0}
function brl(v){return (+v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function brl0(v){return (+v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0,minimumFractionDigits:0})}
function pct(v){return (+v||0).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%'}
function dec(v,d){return (+v||0).toLocaleString('pt-BR',{maximumFractionDigits:d==null?1:d,minimumFractionDigits:d==null?0:d})}
function uid(){return Math.random().toString(36).slice(2,10)}
function pad(x){return String(x).padStart(2,'0')}
function isoOf(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function today(){return isoOf(new Date())}
function pISO(s){var a=String(s).split('-').map(Number);return new Date(a[0],a[1]-1,a[2])}
function addDays(s,k){var d=pISO(s);d.setDate(d.getDate()+k);return isoOf(d)}
function addMonths(s,k){
  var d=pISO(s),day=d.getDate();
  d.setDate(1);d.setMonth(d.getMonth()+k);
  var last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
  d.setDate(Math.min(day,last));
  return isoOf(d);
}
function daysBetween(a,b){return Math.round((pISO(b)-pISO(a))/86400000)}
function fd(s){if(!s)return '—';var a=s.split('-');return a[2]+'/'+a[1]+'/'+a[0]}
function fds(s){if(!s)return '—';var a=s.split('-');return a[2]+'/'+a[1]}
function clone(o){return JSON.parse(JSON.stringify(o))}
function getPath(o,p){return p.split('.').reduce(function(a,k){return a==null?a:a[k]},o)}
function setPath(o,p,v){var ks=p.split('.');var last=ks.pop();var t=ks.reduce(function(a,k){return a[k]},o);t[last]=v}

/* ---------- estado ---------- */
var S=null, cap=null, capTried=false, readOnly=false, pubTimer=null, publishing=false;
var cloudEnabled=window.bancadaCloudRequired===true,cloud=null,cloudProfile='';
var ui={sideC:(function(){try{return localStorage.getItem('bancada-side')==='1'}catch(e){return false}})(),view:'inicio',quoteId:null,draft:null,qFilter:'todos',qSearch:'',cSearch:'',dTab:'geral',dPer:'mes',dRef:today().slice(0,7),aTab:'oficina',step:0,cfg:null,recFilter:'pendentes'};

/* ---------- catálogo padrão de materiais ---------- */
var MAT_CATS=['Dobradiças','Corrediças','Puxadores e fechos','Pistões e articuladores','Porta de correr','Pés, suportes e cabideiros','Parafusos e fixação','Colas e acabamento','Embalagem e transporte','Iluminação','Acessórios'];
function defMateriais(){
  var L=[
   ['Dobradiças',[
    ['dob-r-a','Dobradiça 35 mm reta com amortecedor','un.',9.5],['dob-c-a','Dobradiça 35 mm curva com amortecedor','un.',9.5],['dob-s-a','Dobradiça 35 mm supercurva com amortecedor','un.',9.5],
    ['dob-r','Dobradiça 35 mm reta sem amortecedor','un.',3.5],['dob-c','Dobradiça 35 mm curva sem amortecedor','un.',3.5],['dob-s','Dobradiça 35 mm supercurva sem amortecedor','un.',3.5],
    ['dob-vid','Dobradiça para porta de vidro','un.',14],['dob-alu','Dobradiça para porta com perfil de alumínio','un.',16],['dob-165','Dobradiça de canto 165°','un.',22],['dob-mini','Dobradiça mini 26 mm','un.',4.5],['dob-piano','Dobradiça piano (contínua)','metro',18]]],
   ['Corrediças',[
    ['cor-t30','Corrediça telescópica 30 cm','par',22],['cor-t35','Corrediça telescópica 35 cm','par',25],['cor-t40','Corrediça telescópica 40 cm','par',28],['cor-t45','Corrediça telescópica 45 cm','par',32],['cor-t50','Corrediça telescópica 50 cm','par',36],['cor-t55','Corrediça telescópica 55 cm','par',40],
    ['cor-ta45','Corrediça telescópica com amortecedor 45 cm','par',75],['cor-o40','Corrediça oculta com amortecedor 40 cm','par',120],['cor-o45','Corrediça oculta com amortecedor 45 cm','par',130],['cor-o50','Corrediça oculta com amortecedor 50 cm','par',140],
    ['cor-push','Corrediça oculta com abertura por toque 45 cm','par',155],['cor-rol','Corrediça de rolete 45 cm','par',12]]],
   ['Puxadores e fechos',[
    ['pux-perfil','Puxador perfil de alumínio','metro',45],['pux-cava','Puxador perfil cava','metro',38],['pux-128','Puxador alça 128 mm','un.',12],['pux-160','Puxador alça 160 mm','un.',15],['pux-256','Puxador alça 256 mm','un.',22],
    ['pux-bot','Puxador botão','un.',6],['pux-concha','Puxador concha de embutir','un.',9],['fecho-toque','Fecho toque (push)','un.',8],['fecho-ima','Fecho magnético','un.',2.5],['fech-gav','Fechadura para gaveta ou porta','un.',18]]],
   ['Pistões e articuladores',[
    ['pis-80','Pistão a gás 80 N','un.',14],['pis-100','Pistão a gás 100 N','un.',16],['pis-120','Pistão a gás 120 N','un.',18],['art-basc','Articulador para porta basculante com amortecedor','par',180],['compasso','Compasso para tampa','un.',18],['amort','Amortecedor para porta (avulso)','un.',6]]],
   ['Porta de correr',[
    ['pc-rold','Jogo de roldanas para porta de correr','jogo',60],['pc-trilho','Trilho superior de alumínio','metro',30],['pc-guia','Guia inferior','metro',15],['pc-perfil','Perfil de alumínio para porta','metro',42]]],
   ['Pés, suportes e cabideiros',[
    ['pe-reg','Pé regulável plástico 100 mm','un.',3.5],['pe-alu','Pé de alumínio 15 cm','un.',22],['sapata','Sapata niveladora','un.',1.5],['rodizio','Rodízio com freio 50 mm','un.',10],
    ['sup-pino','Suporte de prateleira (pino)','un.',0.15],['sup-trava','Suporte de prateleira com trava','un.',0.6],['sup-invis','Suporte invisível para prateleira','un.',18],['mao-fr','Mão-francesa 25 cm','un.',12],
    ['cant','Cantoneira metálica 30 mm','un.',0.8],['susp','Suspensor para armário aéreo','par',25],['barra-aereo','Trilho de fixação para aéreo','metro',18],['cab-tubo','Tubo cabideiro oval','metro',22],['cab-sup','Suporte para tubo cabideiro','par',6]]],
   ['Parafusos e fixação',[
    ['par-3512','Parafuso chipboard 3,5 × 12','un.',0.05],['par-3514','Parafuso chipboard 3,5 × 14 (dobradiça)','un.',0.05],['par-3516','Parafuso chipboard 3,5 × 16','un.',0.06],['par-3525','Parafuso chipboard 3,5 × 25','un.',0.07],
    ['par-4025','Parafuso chipboard 4,0 × 25','un.',0.09],['par-4040','Parafuso chipboard 4,0 × 40','un.',0.12],['par-4050','Parafuso chipboard 4,0 × 50','un.',0.14],['par-4560','Parafuso chipboard 4,5 × 60','un.',0.2],
    ['minifix','Minifix (tambor + pino)','un.',0.9],['cav-6','Cavilha 6 × 30 mm','un.',0.05],['cav-8','Cavilha 8 × 30 mm','un.',0.06],['bucha-6','Bucha S6 com parafuso','un.',0.25],['bucha-8','Bucha S8 com parafuso','un.',0.35],
    ['prego','Prego sem cabeça 15 × 15','caixa',12],['grampo','Grampo para grampeador','caixa',18],['tapa-furo','Tapa-furo adesivo','cartela',4]]],
   ['Colas e acabamento',[
    ['cola-pva','Cola PVA 1 kg','un.',28],['cola-cont','Cola de contato 750 g','un.',45],['cola-inst','Cola instantânea 100 g','un.',18],['silicone','Silicone transparente 280 g','un.',22],
    ['dupla-face','Fita dupla face 19 mm × 20 m','rolo',25],['lixa','Lixa grão 120','folha',2.5],['massa','Massa para madeira 400 g','un.',18],['estopa','Estopa','kg',15],
    ['cola-coladeira','Cola da coladeira de borda','dia',10],['thinner','Thinner 1 L','un.',14],['lamina','Lâmina de estilete','un.',1],['broca','Broca (reposição)','un.',12]]],
   ['Embalagem e transporte',[
    ['bolha','Papel bolha','rolo',56],['papelao','Papelão','fardo',40],['stretch','Filme stretch','rolo',45],['fita-adesiva','Fita adesiva larga','rolo',8],['cant-papelao','Cantoneira de papelão','un.',1.5]]],
   ['Iluminação',[
    ['led-fita','Fita de LED 12 V','metro',18],['led-perfil','Perfil de LED com difusor','metro',25],['led-fonte','Fonte 12 V 60 W','un.',55],['led-sensor','Sensor de abertura para LED','un.',35],['passa-fio','Passa-fio 60 mm','un.',4]]],
   ['Acessórios',[
    ['porta-tal','Porta-talheres para gaveta','un.',45],['cesto','Cesto aramado deslizante','un.',180],['lixeira','Lixeira embutida deslizante','un.',220],['sapateira','Sapateira deslizante','un.',160],['cabide-gir','Cabideiro giratório para closet','un.',140]]]
  ];
  var out=[];L.forEach(function(g){g[1].forEach(function(x){out.push({id:x[0],cat:g[0],nome:x[1],un:x[2],preco:x[3]})})});return out;
}
function defKits(){
  function k(id,nome,itens){return {id:id,nome:nome,itens:itens.map(function(x){return {id:x[0],qtd:x[1]}})}}
  return [
    k('k1','Gaveta com corrediça telescópica',[['cor-t45',1],['par-3516',12],['pux-128',1]]),
    k('k2','Gaveta com corrediça oculta e amortecedor',[['cor-o45',1],['par-3516',12],['pux-128',1]]),
    k('k3','Porta de giro com 2 dobradiças amortecidas',[['dob-r-a',2],['par-3514',8],['pux-128',1]]),
    k('k4','Porta de correr',[['pc-rold',1],['pc-trilho',2],['pc-guia',2]]),
    k('k5','Basculante com pistão',[['pis-80',2],['dob-r',2],['par-3514',8]]),
    k('k6','Puxador perfil (metro)',[['pux-perfil',1]]),
    k('k7','Iluminação LED (metro)',[['led-fita',1],['led-perfil',1]]),
    k('k8','Prateleira regulável',[['sup-pino',4]]),
    k('k9','Cabideiro (metro)',[['cab-tubo',1],['cab-sup',1]]),
    k('k10','Módulo com pés reguláveis',[['pe-reg',4],['par-3516',16]])
  ];
}
function defFitas(){return [
  {id:'f1',nome:'Fita branca 22 mm',metros:50,preco:45},{id:'f4',nome:'Fita branca 22 mm',metros:20,preco:22},
  {id:'f2',nome:'Fita madeirada 22 mm',metros:50,preco:85},{id:'f3',nome:'Fita madeirada 35 mm',metros:50,preco:130},{id:'f5',nome:'Fita preta 22 mm',metros:50,preco:55},{id:'f6',nome:'Fita branca 64 mm',metros:50,preco:95},{id:'f7',nome:'Fita madeirada 64 mm',metros:50,preco:170}]}
function chapasComFita(q){var C=S.config,k=0;(q.chapas||[]).forEach(function(r){var m=C.chapas.find(function(x){return x.id===r.id});if(m&&!m.semFita)k+=n(r.qtd)});return k}
/* converte orçamentos antigos (kits fechados e fita por metro) para itens soltos e rolos */
function normQ(q){
  restoreDraftLabor(q);
  if(!q||(q.itens&&q.fitas))return q;var C=S.config;
  if(!q.itens){var it=[];(q.kits||[]).forEach(function(r){var k=(C.kits||[]).find(function(x){return x.id===r.id});if(!k||!k.itens)return;k.itens.forEach(function(i){var t=n(i.qtd)*n(r.qtd);if(!t)return;var ex=it.find(function(x){return x.id===i.id});if(ex)ex.qtd+=t;else it.push({id:i.id,qtd:t})})});q.itens=it}
  if(!q.fitas){var m=isAuto(q.fitaMetros)?chapasComFita(q)*n(C.fitaPorChapa):n(q.fitaMetros);var f=C.fitas.find(function(x){return x.id===q.fitaId})||C.fitas[0];q.fitas=f&&m>0?[{id:f.id,qtd:Math.max(1,Math.ceil(m/(n(f.metros)||50)))}]:[]}
  delete q.kits;delete q.fitaId;delete q.fitaMetros;return q;
}
function addItens(d,kit,mult){mult=mult||1;(kit.itens||[]).forEach(function(i){var t=n(i.qtd)*mult;if(!t||!i.id)return;var ex=d.itens.find(function(x){return x.id===i.id});if(ex)ex.qtd=n(ex.qtd)+t;else d.itens.push({id:i.id,qtd:t})})}
function matOpts(sel){var C=S.config,cats=[];C.materiais.forEach(function(m){var c=m.cat||'Outros';if(cats.indexOf(c)<0)cats.push(c)});
  return cats.map(function(c){return '<optgroup label="'+esc(c)+'">'+C.materiais.filter(function(m){return (m.cat||'Outros')===c}).map(function(m){return '<option value="'+m.id+'"'+(m.id===sel?' selected':'')+'>'+esc(m.nome)+' — '+brl(m.preco)+'/'+esc(m.un||'un.')+'</option>'}).join('')+'</optgroup>'}).join('')}

function defMdf(){
  // Preços públicos por chapa inteira, sem frete. Veja pesquisa-mdf.md.
  var factors={6:0.64,9:0.86,12:0.94,15:1,18:1.20,25:1.75};
  function avg(prices){return prices.reduce(function(a,b){return a+b},0)/prices.length}
  return [
    ['Duratex',[
      ['Branco Ártico Trama',[6,9,15,18,25],{15:[274.44,279],18:[410]}],
      ['Gianduia Trama',[6,15,18],{6:[222.76],15:[430.56,407.78],18:[418.77]}],
      ['Gianduia Natural',[6,15,18,25],{15:[578.37]}],
      ['Freijó Puro',[6,15,18,25],{15:[498.72,581.79]}],
      ['Freijó Imperial Thera',[6,15,18,25],{15:[585.33,479.90,558.03]},null,3],
      ['Cinza Sagrado Essencial',[6,15,18,25],{15:[537.22]},null,3],
      ['Cinza Sagrado Cristallo',[15,18],{},null,3],
      ['Carvalho Hanover',[15,18,25],{15:[551.9],18:[702.56],25:[1055.22]}]
    ]],
    ['Guararapes',[
      ['Branco TX',[6,9,12,15,18,25],{6:[174.32],9:[276.78],18:[305.96,363.9],25:[712.43]},285],
      ['Preto TX',[6,9,12,15,18,25],{},325],
      ['Cinza Perfeito',[6,15,18,25],{6:[265],15:[453,510.61],18:[430]}],
      ['Areia',[6,15,18,25],{6:[326],15:[453],18:[529]}],
      ['Freijó',[6,15,18,25],{15:[328.81,419.43,569.93],18:[646.67]}],
      ['Carvalho Natural',[6,15,18,25],{6:[289,360.53],15:[434],18:[577.8]}],
      ['Savana',[6,15,18,25],{6:[328.17],15:[436.98,554.56,522.09,453.82],18:[646.67],25:[913.88]}],
      ['Savana RUC',[15,18,25],{15:[587.92,611.27,655.09],18:[712.91,765.4]}]
    ]],
    ['Arauco',[
      ['Branco Supremo Chess',[6,15,18,25],{15:[398,414.5,486.05,543.22],18:[600.75]}],
      ['Ébano TX',[6,15,18,25],{},398.32],
      ['Cinza Cristal TX',[6,15,18,25],{15:[398.32]}],
      ['Cinza Puro Matt',[6,15,18,25],{15:[430.32]}],
      ['Carvalho Poro',[6,15,18,25],{15:[439.92,520.11],18:[592.6],25:[874.72]}],
      ['Louro Freijó Poro',[6,15,18,25],{15:[520.11],18:[624.11],25:[901.16,921.22]}],
      ['Nogueira Persa Trend',[6,15,18,25],{15:[453.04,552.22]}]
    ]],
    ['Berneck',[
      ['Branco TX',[6,9,15,18,25],{15:[291.15,289.9],18:[310.68,365.38],25:[712.43]}],
      ['Preto TX',[6,9,15,18,25],{6:[241.9],15:[327.9],25:[602.9]}],
      ['Louro Freijó Grann',[6,15,18,25],{15:[385.52,513.33]}],
      ['Carvalho Treviso Design',[6,15,18,25],{6:[344.55,365.18],15:[382.32,490.11],18:[570.9],25:[800.9]}],
      ['Amantea Tatto',[6,15,18,25],{15:[430.25,359.98],18:[489.15]}]
    ]]
  ].flatMap(function(g){var marca=g[0];return g[1].flatMap(function(p){
    var padrao=p[0],priceList=p[2],base=priceList[15]?avg(priceList[15]):p[3];
    return p[1].map(function(mm){
      var id='mdf-'+mobcloudKey(marca+' '+padrao).replace(/\s+/g,'-')+'-'+mm;
      var samples=priceList[mm],preco=Math.round((samples?avg(samples):base*factors[mm])/5)*5;
      var m={id:id,marca:marca,padrao:padrao,espessura:mm,nome:'MDF '+padrao+' '+marca+' '+mm+' mm',preco:preco,
        precoRef:samples?(samples.length>1?'media':'anuncio'):'estimativa'};
      if(!Number.isFinite(preco)||preco<=0){m.preco=null;delete m.precoRef}
      if(p[4])m.catalogAdded=p[4];
      if(id==='mdf-duratex-gianduia-trama-15')m.mobcloud='MDF 15 mm Gianduia Trama 2F Duratex';
      return m;
    });
  })});
}
function migrateMdf(C){
  if(C.mdfCatalogV>=3)return;
  var version=C.mdfCatalogV||0;
  defMdf().forEach(function(m){
    var current=C.chapas.find(function(x){return x.id===m.id});
    if(current){if(version===1&&current.preco==null){current.preco=m.preco;current.precoRef=m.precoRef}return}
    if(version>=1&&m.catalogAdded!==3)return;
    var identity=materialIdentity(m.nome);
    if(!C.chapas.some(function(x){return materialIdentity(x.nome).key===identity.key}))C.chapas.push(m);
  });
  C.mdfCatalogV=3;
}
function chapaGroup(m){return m.marca||'Cadastro da oficina'}
function chapaGroups(list){return Array.from(new Set(list.map(chapaGroup)))}
function chapaUnpriced(m){return !!m.marca&&n(m.preco)<0.01}
function chapaPrice(m){return chapaUnpriced(m)?'Preço a cadastrar':brl(m.preco)+(m.precoRef?' ('+(m.precoRef==='estimativa'?'est.':'ref.')+')':'')}
function chapaRefLabel(m){return {media:'Média de lojas',anuncio:'Preço anunciado',estimativa:'Estimativa por comparação'}[m.precoRef]||''}
function chapaOpts(list,selected){
  return chapaGroups(list).map(function(group){
    return '<optgroup label="'+esc(group)+'">'+list.filter(function(m){return chapaGroup(m)===group}).map(function(m){
      return '<option value="'+esc(m.id)+'"'+(m.id===selected?' selected':'')+'>'+esc(m.nome+' — '+chapaPrice(m))+'</option>';
    }).join('')+'</optgroup>';
  }).join('');
}

function seed(){
  var ch=[
    {id:'c1',nome:'MDF Branco TX 15 mm',preco:265},
    {id:'c2',nome:'MDF Branco TX 18 mm',preco:295},
    {id:'c3',nome:'MDF Louro Freijó 15 mm',preco:420},
    {id:'c4',nome:'MDF Carvalho 18 mm',preco:455},
    {id:'c5',nome:'MDF Cru 15 mm',preco:185},
    {id:'c6',nome:'MDF Branco 6 mm',preco:140,semFita:true},
    {id:'c7',nome:'Fundo HDF 3 mm',preco:95,semFita:true}
  ];
  var cfg={
    nomeOficina:'Marcenaria',telefone:'',
    custosFixos:[
      {id:uid(),nome:'Aluguel do galpão',valor:0},{id:uid(),nome:'Energia elétrica',valor:0},
      {id:uid(),nome:'Internet e telefone',valor:0},{id:uid(),nome:'Contador',valor:0},
      {id:uid(),nome:'Manutenção de máquinas',valor:0},{id:uid(),nome:'Veículo e combustível',valor:0},
      {id:uid(),nome:'Pró-labore do dono',valor:0}
    ],
    horasDono:160,produtividade:75,encargos:40,
    imposto:6,margemBase:25,margemMinima:15,multN:3,reserva:5,fitaPorChapa:18,validade:15,horasPorChapa:2,instalacaoPct:25,horasDia:8,pessoasProjeto:2,
    pesos:{complex:[0,3,7],prazo:[0,4,8],exclus:[0,2,5],risco:[0,3,5],acab:[0,2,4],estrat:[0,-2,-3]},
    chapas:ch,
    fitas:defFitas(),materiais:defMateriais(),kits:defKits(),catV:2,
    formas:[
      {id:'pix',nome:'Pix à vista',taxa:0,desconto:5,parcelas:1},
      {id:'dinheiro',nome:'Dinheiro',taxa:0,desconto:5,parcelas:1},
      {id:'entrada',nome:'Entrada + parcelas',taxa:0,desconto:0,parcelas:0,tipo:'entrada'},
      {id:'sinal',nome:'50% de sinal + 50% na entrega',taxa:0,desconto:0,parcelas:2},
      {id:'boleto',nome:'Boleto',taxa:1,desconto:0,parcelas:1},
      {id:'debito',nome:'Cartão de débito',taxa:1.5,desconto:0,parcelas:1},
      {id:'cred1',nome:'Crédito à vista',taxa:3.2,desconto:0,parcelas:1},
      {id:'cred6',nome:'Crédito em até 6x',taxa:8.5,desconto:0,parcelas:6},
      {id:'cred10',nome:'Crédito em até 10x',taxa:12,desconto:0,parcelas:10},
      {id:'direto',nome:'Parcelado direto (promissória)',taxa:3,desconto:0,parcelas:4},
      {id:'cheque',nome:'Cheque',taxa:1,desconto:0,parcelas:1}
    ]
  };
  return {v:3,updatedAt:0,seq:0,config:cfg,operacao:true,
    clientes:[],orcamentos:[],obras:[],receber:[],pagar:[],equipe:[]};
}

function loadState(){
  var emb=null,loc=null;
  try{emb=JSON.parse(document.getElementById('app-state').textContent)}catch(e){}
  try{loc=JSON.parse(localStorage.getItem('bancada-state'))}catch(e){}
  if(emb&&loc){S=(loc.updatedAt>emb.updatedAt)?loc:emb}
  else S=emb||loc||seed();
  migrate();mergeDupes();cxMigrate();
}
function mergeDupes(){var seen={},rm={};S.clientes.forEach(function(c){var k=String(c.nome||'').trim().toLowerCase();if(!k)return;if(seen[k]){rm[c.id]=seen[k];var f=S.clientes.find(function(x){return x.id===seen[k]});if(f&&!f.telefone)f.telefone=c.telefone;if(f&&!f.endereco)f.endereco=c.endereco}else seen[k]=c.id});
  if(!Object.keys(rm).length)return;function fix(o){if(o.clienteId&&rm[o.clienteId])o.clienteId=rm[o.clienteId]}
  S.orcamentos.forEach(fix);S.obras.forEach(fix);S.receber.forEach(fix);S.clientes=S.clientes.filter(function(c){return !rm[c.id]})}
function cxMigrate(){var lim=addDays(today(),-7);S.obras.forEach(function(o){if(!o.cxOk)o.cxOk=S.receber.filter(function(r){return r.obraId===o.id&&r.status==='recebido'&&(r.recebidoEm||'')<lim}).map(function(r){return r.id})})}
function migrate(){
  if(S.config&&S.v>=3&&S.config.horasDia==null)S.config.horasDia=8;
  if(S.config&&S.v>=3&&S.config.pessoasProjeto==null)S.config.pessoasProjeto=2;
  if(S.config&&S.v>=3&&(S.config.catV||1)<2){var Cc=S.config;defMateriais().forEach(function(m){if(!Cc.materiais.some(function(x){return x.id===m.id})){var i=-1;Cc.materiais.forEach(function(x,j){if(x.cat===m.cat)i=j});if(i>=0)Cc.materiais.splice(i+1,0,m);else Cc.materiais.push(m)}});defFitas().forEach(function(f){if(!Cc.fitas.some(function(x){return x.id===f.id}))Cc.fitas.push(f)});Cc.catV=2}
  if((S.v||1)<2){
    if(!S.updatedAt){S=seed();migrateMdf(S.config);return}
    var C0=S.config;if(C0.horasPorChapa==null){C0.horasPorChapa=2;C0.instalacaoPct=25}
    if(!C0.formas.some(function(f){return f.tipo==='entrada'}))C0.formas.splice(1,0,{id:'entrada',nome:'Entrada + parcelas',taxa:0,desconto:0,parcelas:0,tipo:'entrada'});
    S.v=2;
  }
  if(S.v<3){
    var C=S.config;
    if(!C.materiais)C.materiais=defMateriais();
    if(!(C.kits||[]).some(function(k){return k.itens}))C.kits=defKits();
    if((C.fitas||[]).some(function(f){return f.metros==null})){var df=defFitas();C.fitas=C.fitas.map(function(f){if(f.metros!=null)return f;var d=df.find(function(x){return x.id===f.id&&x.nome===f.nome});return d||{id:f.id,nome:f.nome,metros:50,preco:Math.round(n(f.preco)*50)}});df.forEach(function(d){if(!C.fitas.some(function(f){return f.id===d.id}))C.fitas.push(d)})}
    delete C.horasPorKit;
    if(C.horasDia==null)C.horasDia=8;
    if(C.pessoasProjeto==null)C.pessoasProjeto=2;
    S.orcamentos.forEach(function(q){normQ(q);if(q.status!=='aprovado')q.precoSalvo=calcQuote(q).preco});
    S.v=3;
  }
  migrateMdf(S.config);
}
function buildDoc(){
  var css=document.getElementById('app-css').textContent;
  var js=document.getElementById('app-js').textContent;
  var json=JSON.stringify(S).replace(/</g,'\\u003c');
  var pdf=document.getElementById('mobcloud-pdf-bundle');
  var extra=pdf?'<script type="application/json" id="mobcloud-pdf-bundle">'+pdf.textContent+'<\/script>':'';
  return '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>'+HEAD+'<style id="app-css">'+css+'</style></head>\n<body><div id="app"></div><div id="modal-root"></div><div id="toast-root" aria-live="polite"></div><script type="application/json" id="app-state">'+json+'<\/script>'+extra+'<script id="app-js">'+js+'<\/script></body>\n</html>';
}
function rememberUI(){try{sessionStorage.setItem('bancada-ui',JSON.stringify({pView:ui.pView,step:ui.step,quoteId:ui.quoteId,draft:ui.draft,dTab:ui.dTab,aTab:ui.aTab,qFilter:ui.qFilter}))}catch(e){}}
function restoreUI(){try{var u=JSON.parse(sessionStorage.getItem('bancada-ui'));sessionStorage.removeItem('bancada-ui');if(u){ui.pView=u.pView||ui.pView;ui.dTab=u.dTab||ui.dTab;ui.aTab=u.aTab||ui.aTab;ui.qFilter=u.qFilter||ui.qFilter;if(u.quoteId&&u.draft){ui.quoteId=u.quoteId;ui.draft=u.draft;ui.step=u.step||0}}}catch(e){}}
function persistState(){
  if(readOnly)return false;
  S.updatedAt=Math.max(Date.now(),n(S.updatedAt)+1);
  if(cloudEnabled)return !!cloud&&cloud.enqueue(S);
  var local=true;
  try{localStorage.setItem('bancada-state',JSON.stringify(S))}catch(e){local=false}
  if(cap){clearTimeout(pubTimer);pubTimer=setTimeout(publishNow,1100);syncState('saving')}
  return local||!!cap;
}
function save(msg){
  var saved=persistState();
  render();
  if(!saved)toast(readOnly?'Você tem acesso só de leitura.':'Não foi possível gravar. Exporte um backup em Ajustes.');
  else if(msg)toast(cloudEnabled?'Aguardando sincronização.':msg);
}
function publishNow(){
  if(!cap||readOnly)return;
  if(publishing){clearTimeout(pubTimer);pubTimer=setTimeout(publishNow,1100);return}
  publishing=true;rememberUI();
  var doc=buildDoc(),version=S.updatedAt;
  Promise.resolve().then(function(){return cap.publish(doc)}).then(function(){publishing=false;syncState(S.updatedAt===version?'ok':'saving')}).catch(function(err){
    publishing=false;var c=String((err&&(err.code||err.name||err.message))||err||'');
    if(/conflict/i.test(c)){toast('Outra pessoa salvou ao mesmo tempo. A página vai mostrar a versão mais recente.')}
    else if(/not_granted|not_writer/i.test(c)){readOnly=true;syncState('ro');toast('Você tem acesso só de leitura a esta página.')}
    else{syncState('err');toast('Não foi possível salvar na nuvem agora. Os dados ficaram guardados neste navegador.')}
  });
}
var syncMode='local';
function syncState(m){syncMode=m;var el=$('#sync');if(el)el.innerHTML=syncHTML()}
function syncHTML(){
  var map={local:['warn','Salvo só neste navegador'],ok:['ok','Salvo na nuvem'],saving:['warn','Salvando…'],err:['warn','Falha ao salvar na nuvem'],conflict:['warn','Versão mais nova na nuvem'],ro:['','Somente leitura']};
  var m=map[syncMode]||map.local;return '<span class="dot '+m[0]+'"></span><span>'+m[1]+'</span>';
}
function cloudCanReload(){
  return !!S&&!ui.draft&&!$('#modal-root').innerHTML&&(!ui.cfg||JSON.stringify(ui.cfg)===JSON.stringify(S.config));
}
function cloudStatus(mode){
  readOnly=mode==='conflict';
  syncState(mode);
  var acct=$('#cloud-acct');
  if(acct){acct.hidden=!cloudProfile;acct.innerHTML='<span title="'+esc(cloudProfile)+'">'+esc(cloudProfile)+'</span><button class="linkbtn" data-act="cloudSignOut">Sair</button>'}
  var acctM=$('#cloud-acct-m');
  if(acctM)acctM.innerHTML='<span class="muted small">Conectado como</span><b>'+esc(cloudProfile)+'</b><button class="btn btn-sm" data-act="cloudSignOut">Sair</button>';
  var panel=$('#cloud-panel');
  if(!panel)return;
  var message={ok:'Dados sincronizados',saving:'Salvando na nuvem…',err:'Falha na sincronização.',conflict:'Esta conta salvou uma versão mais recente em outra aba ou aparelho.'}[mode];
  var draftStatus=$('#draft-status');
  if(draftStatus)draftStatus.textContent=mode==='ok'?'Rascunho salvo':message;
  panel.innerHTML=mode==='err'?'<div class="alert warn cloud-alert" role="alert"><span>Sem conexão com a nuvem. As alterações ficam guardadas neste aparelho e são enviadas sozinhas quando a conexão voltar.</span><button class="btn btn-sm" data-act="cloudRefresh">Tentar agora</button></div>':
    mode==='conflict'?'<div class="alert warn cloud-alert" role="alert"><span>Esta conta salvou uma versão mais recente em outra aba ou aparelho.</span><span class="actions"><button class="btn btn-sm" data-act="exportBackup">Exportar alterações</button><button class="btn btn-sm" data-act="cloudDiscard">Carregar versão da nuvem</button></span></div>':'';
}
function loadCloudState(state,profile){
  if(profile)cloudProfile=profile;
  var next=state===null?seed():readBackup(JSON.stringify({format:'bancada-backup',version:1,state:state}));
  var previous=S;S=next;
  try{migrate();mergeDupes();cxMigrate()}catch(e){S=previous;throw e}
  ui.cfg=null;ui.draft=null;ui.quoteId=null;ui.backup=null;ui.cxOpen={};
  readOnly=false;
  closeModal();
  render();cfgLive();
}
function bootCloud(){
  if(typeof window.createBancadaCloud!=='function'){
    $('#app').innerHTML='<p class="empty" role="alert">Não foi possível carregar a conexão do Bancada. Recarregue a página.</p>';
    return;
  }
  cloud=window.createBancadaCloud({
    root:function(){return $('#app')},
    lock:function(){
      S=null;cloudProfile='';readOnly=true;ui.importDraft=null;ui.cfg=null;ui.draft=null;ui.quoteId=null;ui.backup=null;ui.mobcloud=null;ui.apProposal=null;
      closeModal();
      $('#toast-root').innerHTML='';
    },
    load:loadCloudState,
    status:cloudStatus,
    canReload:cloudCanReload,
    notify:toast
  });
  cloud.start();
}
function initCap(){
  try{
    if(window.claude&&typeof window.claude.use==='function'){
      window.claude.use('artifact').then(function(a){cap=a||null;capTried=true;syncState(cap?'ok':'local')}).catch(function(){capTried=true;syncState('local')});
    }
  }catch(e){}
}

/* ---------- cálculos ---------- */
function oficina(C){
  C=C||S.config;
  var fixos=C.custosFixos.reduce(function(a,b){return a+n(b.valor)},0);
  var folha=0,horas=n(C.horasDono);
  S.equipe.forEach(function(e){
    if(e.status==='Desligado'||e.vinculo==='Empreitada')return;
    var v=n(e.valor);
    folha+= e.vinculo==='CLT'? v*(1+n(C.encargos)/100) : e.vinculo==='Diarista'? v*n(e.diasMes) : v;
    if(e.status==='Ativo')horas+=n(e.horasSemana)*4.33;
  });
  var prod=horas*n(C.produtividade)/100;
  return {fixos:fixos,folha:folha,total:fixos+folha,horasBrutas:horas,horas:prod,custoHora:prod>0?(fixos+folha)/prod:0};
}
function custoMensalPessoa(e,C){C=C||S.config;var v=n(e.valor);if(e.vinculo==='CLT')return v*(1+n(C.encargos)/100);if(e.vinculo==='Diarista')return v*n(e.diasMes);if(e.vinculo==='Empreitada')return 0;return v}
var LABOR_STAGES=['Projeto 3D','Orçamento','Compra de material','Corte','Montagem','Acabamento','Instalação'];
function laborResources(C,of){
  var ownerHours=n(C.horasDono)*n(C.produtividade)/100;
  var ownerPay=C.custosFixos.find(function(f){return f.id===C.proLaboreId});
  var directPay=ownerHours>0&&ownerPay?Math.max(0,n(ownerPay.valor)):0;
  var people=[{id:'dono',nome:C.apelido||'Responsável pela oficina',hour:ownerHours>0?directPay/ownerHours:null,inOverhead:!directPay}];
  S.equipe.forEach(function(e){
    if(e.status!=='Ativo'||e.vinculo==='Empreitada')return;
    var monthly=custoMensalPessoa(e,C),hours=n(e.horasSemana)*4.33*n(C.produtividade)/100;
    if(hours>0&&monthly>0)directPay+=monthly;
    people.push({id:e.id,nome:e.nome+(e.funcao?' · '+e.funcao:''),hour:hours>0&&monthly>0?monthly/hours:null});
  });
  var indirect=Math.max(0,of.total-directPay),days=isAuto(C.diasFuncionamento)?22:n(C.diasFuncionamento);
  return {people:people,hour:of.horas>0?indirect/of.horas:null,day:days>0?indirect/days:null};
}
function quoteLabor(q,C,of){
  if(q.maoModo!=='etapas'){
    var workshop=n(q.horasOficina),install=n(q.horasInstalacao);
    return {oficina:workshop,instalacao:install,horas:workshop+install,total:(workshop+install)*of.custoHora,hora:of.custoHora};
  }
  var resources=laborResources(C,of),rows=[],workshop=0,install=0,direct=0,error='';
  (q.maoLancamentos||[]).forEach(function(row,index){
    var p=resources.people.find(function(person){return person.id===row.pessoa});
    var hours=n(row.horas),manual=row.pessoa==='manual';
    var rate=manual?(isAuto(row.valorHora)?null:n(row.valorHora)):p&&p.hour;
    if(!LABOR_STAGES.includes(row.etapa)||hours<=0||rate==null||rate<0){
      error='Em Mão de obra, confira a etapa, as horas e o custo do profissional em cada linha.';
      return;
    }
    var amount=hours*rate;
    if(row.etapa==='Instalação')install+=hours;else workshop+=hours;
    direct+=amount;rows.push({index:index,etapa:row.etapa,nome:manual?'Valor manual':p.nome,horas:hours,valor:amount});
  });
  var hours=workshop+install,byDay=q.rateioModo==='dias',days=n(q.diasOficina);
  var fee=byDay?resources.day:resources.hour;
  if(!error&&!hours)error='Em Mão de obra, lance ao menos uma etapa com horas produtivas.';
  if(!error&&(fee==null||byDay&&days<=0)){
    error=byDay?'Em Mão de obra, informe os dias de ocupação e confira os dias de funcionamento em Ajustes.':'Em Ajustes, informe a capacidade de horas produtivas da oficina.';
  }
  var overhead=fee==null?0:(byDay?days:hours)*fee,total=direct+overhead;
  return {oficina:workshop,instalacao:install,horas:hours,total:total,hora:hours?total/hours:0,
    detalhe:rows,direta:direct,rateio:overhead,rateioModo:byDay?'dias':'horas',erro:error};
}
function quoteCostAreas(material,labor,of){
  var direct=labor.direta,company=labor.rateio;
  if(direct==null){direct=of.total>0?labor.total*of.folha/of.total:0;company=labor.total-direct}
  return {material:material,maoObra:direct,empresa:company};
}
function profitDefaults(c){
  var rate=c.custo>0?Math.max(0,Math.min(100,c.sobra/c.custo*100)):0;
  rate=Math.round(rate*100)/100;
  return {material:rate,maoObra:rate,empresa:rate};
}
function restoreDraftLabor(q){
  if(!q||q.status!=='rascunho'||q.maoModo!=='separado')return;
  var rows=q.maoLancamentos||[];
  if(rows.length){q.horasOficina=0;q.horasInstalacao=0;rows.forEach(function(r){q[r.etapa==='Instalação'?'horasInstalacao':'horasOficina']+=n(r.horas)})}
  q.maoModo='rapido';
}
function sugHoras(d){var C=S.config;var ch=(d.chapas||[]).reduce(function(a,r){return a+n(r.qtd)},0);var of=Math.round(ch*n(C.horasPorChapa));return {ch:ch,of:of,inst:Math.round(of*n(C.instalacaoPct)/100)}}
function mediaReal(){var h=0,ch=0;S.obras.forEach(function(o){var r=o.realizado||{};if(!r.fechado||!n(r.horas))return;var q=quote(o.quoteId);if(!q)return;var c=(q.chapas||[]).reduce(function(a,x){return a+n(x.qtd)},0);if(!c)return;h+=n(r.horas)/(1+n(S.config.instalacaoPct)/100);ch+=c});return ch?{hpc:h/ch,obras:ch}:null}
function isAuto(v){return v===''||v===null||v===undefined}
function calcQuote(q){
  var C=S.config;normQ(q);
  var chapasCusto=0,chapasQtd=0,chapasFita=0,semPreco=new Set(),referenciasMdf=new Set(),chapaRemovida=false;
  (q.chapas||[]).forEach(function(r){
    var m=C.chapas.find(function(x){return x.id===r.id}),k=n(r.qtd);
    chapasQtd+=k;
    if(m){
      chapasCusto+=k*n(m.preco);if(!m.semFita)chapasFita+=k;
      if(k>0&&chapaUnpriced(m))semPreco.add(m.nome);
      else if(k>0&&m.precoRef)referenciasMdf.add(m.nome);
    }
    else if(k>0&&/^mdf-/.test(r.id))chapaRemovida=true;
  });
  var fitaEst=chapasFita*n(C.fitaPorChapa);
  var fitaCusto=0,fitaRolos=0,fitaMetros=0;(q.fitas||[]).forEach(function(r){var f=C.fitas.find(function(x){return x.id===r.id});var k=n(r.qtd);fitaRolos+=k;if(f){fitaCusto+=k*n(f.preco);fitaMetros+=k*n(f.metros)}});
  var itensCusto=0;(q.itens||[]).forEach(function(r){var m=C.materiais.find(function(x){return x.id===r.id});if(m)itensCusto+=n(r.qtd)*n(m.preco)});
  var outros=n(q.outros);
  var materialBase=chapasCusto+fitaCusto+itensCusto+outros;
  var reserva=materialBase*n(q.reservaPct)/100;
  var material=materialBase+reserva;
  var labor=quoteLabor(q,C,oficina());
  var horas=labor.horas,maoObra=labor.total;
  var terceiros=n(q.terceiros),frete=n(q.frete);
  var custo=material+maoObra+terceiros+frete;
  var ajustes=Q.map(function(qq){var i=(q.respostas||{})[qq.id]||0;var w=((C.pesos[qq.id]||[])[i])||0;return {q:qq,i:i,w:w}});
  var margemSug=n(C.margemBase)+ajustes.reduce(function(a,b){return a+b.w},0);
  var manual=!isAuto(q.margemManual);
  var margem=manual?n(q.margemManual):margemSug;
  var imp=n(C.imposto)/100,rt=n(q.rtPct)/100,m=margem/100;
  var erro=chapaRemovida?'Em Materiais, substitua a chapa que saiu do catálogo.':
    semPreco.size?'Em Ajustes → Materiais e kits, cadastre o preço por chapa: '+Array.from(semPreco).join(', ')+'.':labor.erro;
  var porAreas=q.precoModo==='areas',costAreas=quoteCostAreas(material,labor,oficina()),profitAreas={},lucroAlvo=0;
  if(porAreas){
    ['material','maoObra','empresa'].forEach(function(key){
      var raw=q.lucros&&q.lucros[key],value=n(raw);
      if(isAuto(raw)||!Number.isFinite(Number(String(raw).replace(',','.')))||value<0||value>100)erro=erro||'Defina o lucro sobre material, mão de obra e empresa, de 0% a 100%.';
      profitAreas[key]=costAreas[key]*value/100;
      lucroAlvo+=profitAreas[key];
    });
  }
  var den=porAreas?1-imp-rt:1-imp-rt-m;var valido=den>0.05&&custo>0&&!erro;
  var preco=valido?(custo+(porAreas?lucroAlvo:0))/den:0;
  var sobra=porAreas?lucroAlvo:preco*m;
  if(porAreas){m=preco?sobra/preco:0;margem=m*100}
  return {q:q,erro:erro,porAreas:porAreas,custosAreas:costAreas,lucroAreas:profitAreas,lucroAlvo:lucroAlvo,referenciasMdf:Array.from(referenciasMdf),chapasCusto:chapasCusto,chapasQtd:chapasQtd,chapasFita:chapasFita,fitaEst:fitaEst,fitaRolos:fitaRolos,fitaMetros:fitaMetros,fitaCusto:fitaCusto,itensCusto:itensCusto,outros:outros,materialBase:materialBase,reserva:reserva,material:material,
    custoHora:labor.hora,horas:horas,maoObra:maoObra,labor:labor,terceiros:terceiros,frete:frete,custo:custo,ajustes:ajustes,margemSug:margemSug,manual:manual,margem:margem,
    imp:imp,rt:rt,m:m,den:den,valido:valido,preco:preco,sobra:sobra,impostoV:preco*imp,rtV:preco*rt,
    nEq:material>0?preco/material:0,N:isAuto(q.multN)?n(C.multN):n(q.multN),refN:material*(isAuto(q.multN)?n(C.multN):n(q.multN))};
}
function calcCond(c,f){
  var liquid=1-c.imp-c.rt-n(f.taxa)/100,d=descOf(c.q,f)/100,den=liquid-c.m;
  var floor=liquid-n(S.config.margemMinima)/100;
  var minimo=c.custo>0&&floor>0?Math.ceil(c.custo/floor*100-1e-8)/100:null;
  var bruto=c.valido&&(c.porAreas?liquid:den)>0.05?(c.porAreas?(c.custo+c.lucroAlvo)/liquid:c.custo/den):0,preco=Math.round(bruto*(1-d)*100)/100;
  var sobra=preco*liquid-c.custo,me=preco?sobra/preco*100:0;
  var o={forma:f,preco:preco,sobra:sobra,margemEf:me,minimo:minimo,abaixo:preco>0&&(minimo==null||preco<minimo)};
  if(f.tipo==='entrada'){var q=c.q||{};var ep=isAuto(q.entradaPct)?30:n(q.entradaPct);var np=Math.max(1,Math.round(n(q.entradaParcelas))||1);o.entrada=preco*ep/100;o.nParc=np;o.parcela=(preco-o.entrada)/np}
  return o;
}
function condLabel(x){
  if(x.terms){
    var plan=paymentPlan(x.preco,x.terms);
    if(plan.error||plan.rows.length===1)return '';
    var groups=[];
    plan.rows.forEach(function(row){
      var last=groups[groups.length-1];
      if(row.label==='Sinal')groups.push({amount:row.amount,sinal:true});
      else if(last&&!last.sinal&&last.amount===row.amount)last.count++;
      else groups.push({amount:row.amount,count:1});
    });
    return groups.map(function(g){return (g.sinal?'Entrada de ':g.count+'× de ')+brl(g.amount/100)}).join(' + ');
  }
  if(x.forma.tipo==='entrada')return 'Entrada de '+brl(x.entrada)+' + '+x.nParc+'x de '+brl(x.parcela);
  if(n(x.forma.parcelas)>1&&/crédito|parcel/i.test(x.forma.nome))return x.forma.parcelas+'x de '+brl(x.preco/x.forma.parcelas);
  return '';
}
function forma(id){return S.config.formas.find(function(f){return f.id===id})}
function cliente(id){return S.clientes.find(function(c){return c.id===id})}
function quote(id){return S.orcamentos.find(function(q){return q.id===id})}
function clientContact(c){return {nome:c&&c.nome||'',telefone:c&&c.telefone||'',email:c&&c.email||'',endereco:c&&c.endereco||''}}
function saveClientRecord(values,id){
  var name=String(values.nome||'').trim();
  if(!name)return {error:'Informe o nome do cliente.'};
  var duplicate=S.clientes.find(function(c){return c.id!==id&&mobcloudKey(c.nome||'')===mobcloudKey(name)});
  if(duplicate)return {error:'Já existe um cliente com esse nome. Abra o cadastro existente para editar.'};
  var c=id&&cliente(id);
  if(id&&!c)return {error:'Cliente não encontrado.'};
  var previous=c&&c.endereco||'';
  if(!c){c={id:uid(),criadoEm:today()};S.clientes.push(c)}
  Object.assign(c,{nome:name,telefone:String(values.telefone||'').trim(),email:String(values.email||'').trim(),endereco:String(values.endereco||'').trim(),obs:String(values.obs||'').trim()});
  S.orcamentos.forEach(function(q){
    if(q.clienteId!==c.id||q.status!=='rascunho')return;
    var address=q.contato&&q.contato.endereco;
    q.contato=Object.assign({},q.contato,{nome:c.nome,telefone:c.telefone,email:c.email});
    if(!address||address===previous)q.contato.endereco=c.endereco;
  });
  return {client:c};
}
function quoteDeleteReason(q){
  if(!q)return 'Orçamento não encontrado.';
  if(q.status==='aprovado'||q.obraId||S.obras.some(function(o){return o.quoteId===q.id})||approvedRevision(q))return 'Este orçamento tem um projeto aprovado. Preserve o contrato e os lançamentos financeiros; ele não pode ser excluído por aqui.';
  if(S.orcamentos.some(function(x){return x.revisaoDe===q.id}))return 'Existem revisões vinculadas. Exclua as revisões antes desta versão.';
  return '';
}
function deleteQuoteRecord(id){
  var q=quote(id),error=quoteDeleteReason(q);
  if(error)return {error:error};
  var trash=S.orcamentosExcluidos||(S.orcamentosExcluidos=[]);
  trash.push(Object.assign(clone(q),{excluidoEm:today()}));
  S.orcamentos=S.orcamentos.filter(function(x){return x.id!==id});
  return {deleted:q};
}
function restoreQuoteRecord(id){
  var trash=S.orcamentosExcluidos||[],q=trash.find(function(q){return q.id===id});
  if(!q||quote(id))return {error:'O orçamento não está na lixeira ou já foi restaurado.'};
  if(q.revisaoDe&&!quote(q.revisaoDe))return {error:'Restaure primeiro a versão anterior deste orçamento.'};
  var restored=clone(q);delete restored.excluidoEm;
  S.orcamentos.push(restored);S.orcamentosExcluidos=trash.filter(function(x){return x.id!==id});
  return {restored:restored};
}
function showQuoteTrash(){
  var rows=S.orcamentosExcluidos||[];
  openModal({title:'Orçamentos excluídos',body:'<p class="muted small">Os orçamentos excluídos ficam aqui para recuperação. Restaurar mantém os dados e a versão da proposta.</p>'+rows.map(function(q){return '<div class="row"><div><b>'+esc(q.titulo||'Sem título')+'</b><p class="muted small">'+esc(nomeQ(q))+' · excluído em '+fd(q.excluidoEm)+'</p></div><button class="btn btn-sm" data-act="restoreQuote" data-id="'+q.id+'">Restaurar</button></div>'}).join('')+(!rows.length?'<p>Nenhum orçamento excluído.</p>':'')});
}
function obra(id){return S.obras.find(function(o){return o.id===id})}
function nomeQ(q){var c=q.clienteId&&cliente(q.clienteId);return c?c.nome:(q.contato&&q.contato.nome)||'Sem nome'}
function validaAte(q){return addDays(q.enviadoEm||q.criadoEm,n(q.validade)||15)}
function precoMudou(q){if(q.proposta||q.status==='aprovado'||q.status==='perdido'||!q.precoSalvo)return false;var p=calcQuote(q).preco;return Math.abs(p-q.precoSalvo)/q.precoSalvo>0.01}
function quotePrice(q){
  var project=q.obraId&&obra(q.obraId);
  return project?project.valor:q.proposta?q.proposta.calc.preco:calcQuote(q).preco;
}
function quoteActions(q){
  var id=q.id;
  return '<button class="btn" data-act="duplicateQuote" data-id="'+id+'">Duplicar</button>'+
    (!approvedRevision(q)&&q.status==='enviado'?'<button class="btn" data-act="reviseQuote" data-id="'+id+'">Criar revisão</button>':'');
}
function materialResults(search){
  function key(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
  var words=key(search).trim().split(/\s+/).filter(Boolean);
  var results=S.config.materiais.filter(function(m){
    var label=key(m.nome+' '+(m.cat||''));
    return words.every(function(word){return label.includes(word)});
  });
  if(!results.length)return '<p class="empty muted">Nenhum material encontrado.</p>';
  return results.slice(0,20).map(function(m){
    return itemRow(m.nome,esc(m.cat||'Outros')+' · '+brl(m.preco)+'/'+esc(m.un||'un.'),'',
      '<button class="btn btn-sm" data-act="pickMaterial" data-id="'+m.id+'" aria-label="Adicionar '+esc(m.nome)+'">Adicionar</button>');
  }).join('')+(results.length>20?'<p class="empty muted">Mostrando 20 de '+results.length+' itens. Refine a busca para ver os demais.</p>':'');
}
function approvedRevision(q){
  var root=q.revisaoRaiz||q.id;
  return S.orcamentos.some(function(x){return x.status==='aprovado'&&(x.revisaoRaiz||x.id)===root});
}
function awaitingQuotes(){
  var latest=new Map();
  S.orcamentos.forEach(function(q){
    if(q.status!=='enviado'||approvedRevision(q))return;
    var root=q.revisaoRaiz||q.id,prev=latest.get(root);
    if(!prev||q.enviadoEm>prev.enviadoEm||q.enviadoEm===prev.enviadoEm&&q.numero>prev.numero)latest.set(root,q);
  });
  return Array.from(latest.values()).sort(function(a,b){return String(a.enviadoEm).localeCompare(String(b.enviadoEm))});
}

function paymentTerms(q,f){
  if(f.tipo==='entrada')return {s:isAuto(q.entradaPct)?30:n(q.entradaPct),p:isAuto(q.entradaParcelas)?1:n(q.entradaParcelas)};
  if(f.id==='sinal')return {s:50,p:1};
  if(n(f.parcelas)>1)return {s:0,p:n(f.parcelas)};
  return {s:100,p:1};
}
function paymentPlan(price,terms,date,first){
  var total=Math.round(price*100),pctStart=terms.s,count=terms.p;
  if(!Number.isSafeInteger(total)||total<=0)return {error:'Escolha uma condição com preço válido.'};
  if(!Number.isFinite(pctStart)||pctStart<0||pctStart>100)return {error:'A entrada deve estar entre 0% e 100%.'};
  if(!Number.isInteger(count)||count<1||count>120)return {error:'Informe de 1 a 120 parcelas inteiras.'};
  var initial=Math.round(total*pctStart/100),rest=total-initial;
  if(rest&&rest<count)return {error:'O saldo é menor do que um centavo por parcela.'};
  var rows=[];
  if(initial)rows.push({label:'Sinal',amount:initial,date:date});
  var base=Math.floor(rest/count),extra=rest%count;
  if(rest)for(var i=0;i<count;i++){
    rows.push({label:count===1?'Saldo':'Parcela '+(i+1)+'/'+count,amount:base+(i<extra?1:0),date:first?addMonths(first,i):null});
  }
  return {rows:rows,total:total};
}
function netPayment(cents,taxa){
  return Math.round(cents*(1-n(taxa)/100));
}
function aprovar(q,o){
  if(approvedRevision(q))return null;
  var proposal=q.proposta||proposalData(q,q.enviadoEm||o.data);
  if(proposal.error)return null;
  var c=proposal.calc,cd=proposal.condicoes.find(function(x){return x.forma.id===o.formaId});
  if(!cd)return null;
  var f=cd.forma,plan=paymentPlan(cd.preco,cd.terms,o.data,o.primeira);
  if(plan.error)return null;
  var paid=Math.round(cd.preco*100)/100;
  var cli=q.clienteId&&cliente(q.clienteId);
  if(!cli){var nm=String((q.contato&&q.contato.nome)||'').trim().toLowerCase();cli=nm?S.clientes.find(function(c){return String(c.nome||'').trim().toLowerCase()===nm}):null;if(cli)q.clienteId=cli.id}
  if(!cli){cli={id:uid(),nome:q.contato.nome||'Cliente sem nome',telefone:q.contato.telefone||'',email:q.contato.email||'',endereco:q.contato.endereco||'',obs:'',criadoEm:o.data};S.clientes.push(cli);q.clienteId=cli.id}
  var ob={id:uid(),quoteId:q.id,clienteId:cli.id,titulo:proposal.titulo,endereco:proposal.endereco||q.contato.endereco||'',etapa:0,valor:paid,custo:c.custo,sobra:cd.sobra,
    imp:c.imp,rt:c.rt,taxa:n(f.taxa)/100,terceirosFrete:c.terceiros+c.frete,materialPrev:c.material,horasPrev:c.horas,custoHora:c.custoHora,maoObraPrev:c.maoObra,
    formaNome:f.nome,entrega:o.entrega,criadoEm:o.data,entregueEm:null,posVenda:null,posVendaFeito:false,realizado:{material:'',horas:'',extras:'',fechado:false}};
  if(c.labor&&c.labor.rateioModo==='dias'){ob.rateioDiaPrev=c.labor.rateio;ob.horaDireta=c.horas?c.labor.direta/c.horas:0}
  S.obras.push(ob);
  plan.rows.forEach(function(row){
    var bruto=row.amount/100,liquido=netPayment(row.amount,f.taxa)/100;
    S.receber.push({id:uid(),obraId:ob.id,clienteId:cli.id,desc:row.label+' — '+ob.titulo,venc:row.date,bruto:bruto,liquido:liquido,forma:f.nome,status:'pendente',recebidoEm:null});
  });
  if(c.rt>0)S.pagar.push({id:uid(),desc:'Comissão (RT) '+proposal.rtNome+' — '+ob.titulo,categoria:'Comissão',venc:o.entrega,valor:Math.round(plan.total*c.rt)/100,status:'pendente',obraId:ob.id});
  q.proposta=proposal;q.status='aprovado';q.aprovadoEm=o.data;q.obraId=ob.id;q.precoSalvo=c.preco;
  return ob;
}
function horasDia(C){C=C||S.config;return n(C.horasDia)||8}
function pessoasDe(q,C){C=C||S.config;return Math.max(1,(q&&n(q.pessoas))||n(C.pessoasProjeto)||1)}
function diasTxt(h,p){var hd=horasDia();var pd=n(h)/hd;var ag=pd/p;return {pd:pd,ag:ag}}
/* quanto o contrato rende por dia de trabalho: o que sobra depois de material, terceiros, impostos, comissão e taxas, dividido pelos dias */
function rendeDia(ob){
  var hd=n(S.config.horasDia)||8;var liq=n(ob.valor)*(1-n(ob.imp)-n(ob.rt)-n(ob.taxa))-n(ob.terceirosFrete);
  var dp=n(ob.horasPrev)/hd;var o={custoDia:n(ob.custoHora)*hd,prev:dp>0?(liq-n(ob.materialPrev))/dp:null,real:null,diasPrev:dp,diasReal:null};
  var r=ob.realizado||{};if(r.fechado&&n(r.horas)>0){o.diasReal=n(r.horas)/hd;o.real=(liq-n(r.material)-n(r.extras))/o.diasReal}
  o.pessoas=pessoasDe(quote(ob.quoteId));
  return o;
}
/* a entrada cobre o que precisa ser comprado antes de produzir? */
function entradaCx(c,plan,taxa){
  var need=Math.round((n(c.material)+n(c.terceiros)+n(c.frete))*100);
  if(!plan||plan.error||need<=0)return '';
  var rows=plan.rows,sinal=rows[0]&&rows[0].label==='Sinal';
  var upfront=sinal?netPayment(rows[0].amount,taxa):0;
  var context='A entrada líquida de '+brl(upfront/100);
  var costs='material, terceiros e frete ('+brl(need/100)+')';
  if(upfront>=need)return '<div class="alert ok">'+context+' cobre '+costs+'.</div>';
  var rest=sinal?rows.slice(1):rows;
  var cumulative=upfront;
  var coveredAt=rest.findIndex(function(row){
    cumulative+=netPayment(row.amount,taxa);return cumulative>=need;
  });
  var timing=coveredAt>=0?(rest.length===1?' até receber o saldo':' até a '+(coveredAt+1)+'ª parcela'):'';
  var advice;
  if(netPayment(plan.total,taxa)<need){
    advice=' A entrada de 100% renderia '+brl(netPayment(plan.total,taxa)/100)+' líquidos.';
  }else{
    var low=0,high=10000;
    while(low<high){
      var mid=Math.floor((low+high)/2);
      if(netPayment(Math.round(plan.total*mid/10000),taxa)>=need)high=mid;
      else low=mid+1;
    }
    var minGross=Math.round(plan.total*low/10000);
    advice=' A entrada mínima é de '+dec(low/100,2)+'% ('+brl(minGross/100)+' antes da taxa).';
  }
  return '<div class="alert warn">'+context+' deixa '+brl((need-upfront)/100)+' a descoberto para '+costs+'. A oficina precisa cobrir a diferença'+timing+'.'+advice+'</div>';
}
function approvalPlan(proposal){
  var cd=proposal.condicoes.find(function(x){return x.forma.id===val('ap-forma')});
  if(!cd)return {error:'Escolha a condição de pagamento aceita pelo cliente.'};
  var t=today(),first=val('ap-prim'),delivery=val('ap-ent');
  var plan=paymentPlan(cd.preco,cd.terms,t,first);
  if(plan.error)return plan;
  if(plan.rows.some(function(row){return !row.date||row.date<t}))return {error:'Informe a primeira data de cobrança a partir de hoje.'};
  if(!delivery||delivery<t)return {error:'Informe uma data de entrega a partir de hoje.'};
  plan.condition=cd;
  return plan;
}
function apCx(){
  var el=$('#ap-cx'),proposal=ui.apProposal;
  if(!el||!proposal)return;
  var plan=approvalPlan(proposal),button=$('[data-act="confirmApprove"]');
  if(button)button.disabled=!!plan.error;
  if(plan.error){el.innerHTML='<p class="alert warn">'+esc(plan.error)+'</p>';return}
  var fee=n(plan.condition.forma.taxa);
  var net=plan.rows.reduce(function(sum,row){return sum+netPayment(row.amount,fee)},0);
  el.innerHTML=entradaCx(proposal.calc,plan,fee)+
    '<div class="scroll"><table class="tbl"><thead><tr><th>Cobrança</th><th>Vencimento</th><th class="r">Valor</th>'+(fee?'<th class="r">Líquido</th>':'')+'</tr></thead><tbody>'+
    plan.rows.map(function(row){return '<tr><td>'+esc(row.label)+'</td><td>'+fd(row.date)+'</td><td class="r">'+brl(row.amount/100)+'</td>'+
      (fee?'<td class="r">'+brl(netPayment(row.amount,fee)/100)+'</td>':'')+'</tr>'}).join('')+
    '</tbody><tfoot><tr><th scope="row" colspan="2">Total do contrato</th><td class="r"><b>'+brl(plan.total/100)+'</b></td>'+
    (fee?'<td class="r"><b>'+brl(net/100)+'</b></td>':'')+'</tr></tfoot></table></div>';
}
function lucroReal(ob){
  var r=ob.realizado||{};if(!r.fechado)return null;
  var trabalho=ob.rateioDiaPrev==null?n(r.horas)*n(ob.custoHora):n(r.horas)*n(ob.horaDireta)+n(ob.rateioDiaPrev);
  var custo=n(r.material)+trabalho+n(ob.terceirosFrete)+n(r.extras);
  return ob.valor*(1-ob.imp-ob.rt-ob.taxa)-custo;
}
function recStatus(r){if(r.status==='recebido')return 'recebido';return r.venc<today()?'atrasado':'pendente'}
function pagStatus(p){if(p.status==='pago')return 'pago';return p.venc<today()?'atrasado':'pendente'}

/* ---------- UI base ---------- */
function icon(path){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>'}
function toast(msg){var r=$('#toast-root');r.innerHTML='<div class="toast">'+esc(msg)+'</div>';clearTimeout(toast.t);toast.t=setTimeout(function(){r.innerHTML=''},3200)}
function openModal(o){
  $('#modal-root').innerHTML='<div class="overlay" data-act="bgClose"><div class="modal'+(o.wide?' wide':'')+'" role="dialog" aria-modal="true" aria-labelledby="m-title"><header><h2 id="m-title">'+esc(o.title)+'</h2><button class="icon-btn" data-act="closeModal" aria-label="Fechar">×</button></header><div class="m-body">'+o.body+'</div>'+(o.foot?'<footer>'+o.foot+'</footer>':'')+'</div></div>';
  var f=$('#modal-root .m-body input, #modal-root .m-body select, #modal-root .m-body textarea');if(f)f.focus();
}
function closeModal(){$('#modal-root').innerHTML=''}
function pill(st,label){return '<span class="pill p-'+st+'">'+esc(label||STATUS[st]||st)+'</span>'}
function field(label,id,val,opt){opt=opt||{};var t=opt.type||'text';
  return '<div class="field"><label for="'+id+'">'+esc(label)+'</label>'+(t==='textarea'?'<textarea class="in" id="'+id+'">'+esc(val)+'</textarea>':'<input class="in'+(t==='number'?' r':'')+'" id="'+id+'" type="'+t+'" value="'+esc(val)+'"'+(opt.step?' step="'+opt.step+'"':'')+(opt.ph?' placeholder="'+esc(opt.ph)+'"':'')+'>')+'</div>'}
function selectF(label,id,val,opts){return '<div class="field"><label for="'+id+'">'+esc(label)+'</label><select class="in" id="'+id+'">'+opts.map(function(o){var v=Array.isArray(o)?o[0]:o,l=Array.isArray(o)?o[1]:o;return '<option value="'+esc(v)+'"'+(String(v)===String(val)?' selected':'')+'>'+esc(l)+'</option>'}).join('')+'</select></div>'}
function val(id){var e=document.getElementById(id);return e?e.value:''}

function render(){
  if(cloudEnabled&&!S)return;
  if(ensureFixedBills([ui.cxMonth,ui.dRef].filter(Boolean).sort().pop()))persistState();
  var app=$('#app');
  var h=location.hash.replace('#','');
  var views=NAV.map(function(x){return x[0]});
  ui.view=views.indexOf(h)>=0?h:'inicio';
  if(!$('.shell',app)){
    app.innerHTML='<div class="shell"><aside class="side"><div class="brand"><svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><rect x="1" y="1" width="28" height="28" rx="8" fill="var(--ink)"/><path d="M7 11.5h16M7 16h16M7 20.5h10" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="21" cy="20.5" r="1.6" fill="var(--brown-soft)"/></svg><div><b>Bancada</b><small>gestão de marcenaria</small></div><button class="side-tg" data-act="toggleSide" aria-label="Recolher ou abrir o menu" title="Recolher ou abrir o menu"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M9.5 4.5v15"/></svg></button></div><nav class="nav" aria-label="Menu principal"></nav><div class="sync" id="sync"></div><div class="cloud-acct" id="cloud-acct" hidden></div></aside><main class="main" id="main"></main></div>';
  }
  $('.nav',app).innerHTML=NAV.map(function(x){return '<a href="#'+x[0]+'" title="'+x[1]+'" class="'+(ui.view===x[0]?'on':'')+'"'+(ui.view===x[0]?' aria-current="page"':'')+'>'+icon(x[2])+'<span>'+x[1]+'</span></a>'}).join('');
  $('#sync').innerHTML=syncHTML();
  $('.shell',app).classList.toggle('collapsed',!!ui.sideC);
  var nm=String(S.config.apelido||'').trim();var ini=(nm||S.config.nomeOficina||'B').trim().charAt(0).toUpperCase();
  if($('#tn-left'))$('#tn-left').innerHTML='<span class="av">'+esc(ini)+'</span><div style="min-width:0"><b>Olá'+(nm?', '+esc(nm):'')+'</b><small>'+esc(S.config.nomeOficina||'Bancada')+'</small></div>';
  var main=$('#main');
  var fn={inicio:vInicio,orcamentos:vOrcamentos,clientes:vClientes,obras:vObras,dinheiro:vDinheiro,ajustes:vAjustes}[ui.view];
  main.innerHTML=fn();
  if(cloudEnabled){
    main.insertAdjacentHTML('afterbegin','<div id="cloud-panel"></div>');
    cloudStatus(syncMode);
  }
}

/* ---------- Início ---------- */
function parcInfo(r){var d=String(r.desc||'').split(' — ')[0];var m=d.match(/Parcela (\d+)\/(\d+)/);if(m)return {i:+m[1],k:+m[2],label:m[1]+' de '+m[2]};return {i:0,k:0,label:d==='Sinal'?'Entrada':d}}
function parcHTML(r){var p=parcInfo(r);if(!p.k)return '<span class="cpar">'+esc(p.label)+'</span>';var seg='';if(p.k<=12){for(var j=1;j<=p.k;j++)seg+='<i class="'+(j<p.i?'pd':j===p.i?'pc':'')+'"></i>'}return '<span class="cpar">'+(seg?'<span class="segs">'+seg+'</span>':'')+p.label+'</span>'}
function cobrarRow(r,t){var c=cliente(r.clienteId);var o=obra(r.obraId);var late=r.venc<t;var dd=pISO(r.venc);
  return '<div class="row crow'+(late?' late':'')+'"><div class="cdate"><b>'+dd.getDate()+'</b><span>'+MESES[dd.getMonth()]+'</span></div><div class="cmain"><div class="t">'+(c?'<span class="lk ul" data-act="openCliente" data-id="'+c.id+'" role="button" tabindex="0">'+esc(c.nome)+'</span>':'—')+'</div><div class="d">'+esc(o?o.titulo:'')+(late?' · <span class="lt">venceu há '+daysBetween(r.venc,t)+' dias</span>':'')+'</div></div><div class="cval"><b class="num">'+brl(r.bruto)+'</b>'+parcHTML(r)+'</div><button class="btn btn-sm" data-act="receber" data-id="'+r.id+'">Recebi</button></div>'}
function itemRow(title,sub,right,btn,tone,av){var a='';if(av){var parts=String(title).trim().split(/\s+/);var ini=(parts[0]||'').charAt(0)+(parts.length>1?parts[parts.length-1].charAt(0):'');var h=0;for(var k=0;k<title.length;k++)h=(h+title.charCodeAt(k))%3;var bg=['#E9EFF6','#F5ECE1','#ECEDEA'][h],fg=['#17304B','#7A4E25','#3A3B3F'][h];a='<span class="av-sm" style="background:'+bg+';color:'+fg+'">'+esc(ini.toUpperCase())+'</span>'}return '<div class="row"><div class="rowp">'+a+'<div style="min-width:0"><div class="t">'+esc(title)+'</div><div class="d">'+sub+'</div></div></div><div class="pills" style="align-items:center">'+(right||'')+(btn||'')+'</div></div>'}
function vInicio(){
  var t=today(),h=new Date().getHours();
  var saud=h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
  var sum=function(a,k){return a.reduce(function(x,y){return x+n(y[k])},0)};
  var semana=S.receber.filter(function(r){return r.status!=='recebido'&&r.venc>=t&&r.venc<=addDays(t,7)});
  var atr=S.receber.filter(function(r){return recStatus(r)==='atrasado'});
  var aguardando=awaitingQuotes();
  var andamento=S.obras.filter(function(o){return o.etapa<4});
  /* Cobrar */
  var cobrar=atr.concat(semana).sort(function(a,b){return a.venc.localeCompare(b.venc)});
  var cobrarHTML=cobrar.map(function(r){return cobrarRow(r,t)}).join('');
  /* Dar retorno */
  var ret=[];
  aguardando.forEach(function(q){
    var d=daysBetween(q.enviadoEm,t);
    ret.push(itemRow(nomeQ(q),esc(q.titulo)+' · '+(d<=0?'enviado hoje':'enviado há '+d+(d===1?' dia':' dias')),d>=7?pill('warn','Sem resposta'):'','<button class="btn btn-sm" data-act="viewQuote" data-id="'+q.id+'">Ver</button>','warn'));
  });
  S.orcamentos.forEach(function(q){if(q.status==='perdido'&&q.retomarEm&&q.retomarEm<=addDays(t,3))ret.push(itemRow(nomeQ(q),esc(q.titulo)+' · combinou retomar contato em '+fds(q.retomarEm),'','<button class="btn btn-sm" data-act="viewQuote" data-id="'+q.id+'">Ver</button>','blue'))});
  /* Obras */
  var obrasHTML=andamento.slice().sort(function(a,b){return Number(b.etapa===3)-Number(a.etapa===3)||(a.entrega||'9').localeCompare(b.entrega||'9')}).map(function(o){var c=cliente(o.clienteId);var late=o.entrega&&o.entrega<t;
    return itemRow(o.titulo,esc(c?c.nome:'')+' · '+ETAPAS[o.etapa],pill(late?'bad':'brown',late?'Atrasada':'Entrega '+fds(o.entrega)),'<button class="btn btn-sm" data-act="openObra" data-id="'+o.id+'">Abrir</button>',late?'bad':'')}).join('');
  var BIC={Cobrar:'<rect x="3" y="6" width="18" height="12.5" rx="2"/><circle cx="12" cy="12.2" r="2.6"/>','Dar retorno':'<path d="M4 5h16v10H8l-4 4z"/>',Projetos:'<rect x="3.5" y="4.5" width="5" height="15" rx="1.2"/><rect x="9.5" y="4.5" width="5" height="10" rx="1.2"/><rect x="15.5" y="4.5" width="5" height="12.5" rx="1.2"/>'};
  function block(title,hint,html,empty,link){return '<div class="card"><div class="card-head"><div class="ttl"><span class="chip-ic">'+icon(BIC[title]||'')+'</span><h2>'+title+'</h2>'+(hint?'<span class="cnt">'+hint+'</span>':'')+'</div>'+(link||'')+'</div><div class="list">'+(html||'<div class="empty">'+empty+'</div>')+'</div></div>'}
  var nome=String(S.config.apelido||'').trim();
  var aRec=sum(semana,'bruto'),aAtr=sum(atr,'bruto');
  var instalacoes=andamento.filter(function(o){return o.etapa===3}).length;
  var hojePendencias=[];
  if(atr.length)hojePendencias.push(atr.length+(atr.length===1?' cobrança atrasada':' cobranças atrasadas'));
  if(instalacoes)hojePendencias.push(instalacoes+(instalacoes===1?' projeto em instalação':' projetos em instalação'));
  if(aguardando.length)hojePendencias.push(aguardando.length+(aguardando.length===1?' orçamento aguardando resposta':' orçamentos aguardando resposta'));
  var frase=hojePendencias.length?hojePendencias.join(' · ')+'.':cobrar.length?'Confira os recebimentos desta semana.':'Tudo em dia por aqui.';
  var dLong=new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'long'}).replace('.','');dLong=dLong.charAt(0).toUpperCase()+dLong.slice(1);
  function gt(href,act,tab,k,v,sub,extra,cls){return '<a class="gtile'+(cls?' '+cls:'')+'" href="'+href+'"'+(act?' data-act="'+act+'"':'')+(tab?' '+tab:'')+'><span class="gk">'+k+'<span class="ga"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg></span></span><span class="gv"'+(extra||'')+'>'+v+'</span><span class="gs">'+sub+'</span></a>'}
  return '<section class="heroband"><div class="hb-blob b1"></div><div class="hb-blob b2"></div><div class="hb-blob b3"></div>'+
   '<div class="hb-left"><div class="hb-date">'+dLong+'</div><h1 class="headline">'+saud+', '+esc(nome||S.config.nomeOficina||'')+'. <span class="g">'+frase+'</span></h1></div></section>'+
  '<div class="home-bar"><div class="home-tiles">'+
    gt('#dinheiro','goTab','data-tab="receber"','A receber esta semana',brl0(aRec),semana.length+' parcela'+(semana.length===1?'':'s'),'','hl')+
    gt('#dinheiro','goTab','data-tab="receber"',(atr.length?'<span style="display:inline-flex;align-items:center;gap:6px"><i style="width:8px;height:8px;border-radius:50%;background:var(--bad);display:inline-block"></i>Em atraso</span>':'Em atraso'),brl0(aAtr),(atr.length?atr.length+' parcela'+(atr.length===1?'':'s')+' vencida'+(atr.length===1?'':'s'):'Ninguém devendo'))+
    gt('#orcamentos','qFilterGo','data-f="enviado"','Orçamentos aguardando',String(aguardando.length),brl0(aguardando.reduce(function(a,q){return a+quotePrice(q)},0))+' em negociação')+
    gt('#obras','','','Projetos em andamento',String(andamento.length),brl0(sum(andamento,'valor'))+' em contratos')+
  '</div><div class="home-act"><button class="btn btn-primary btn-lg" data-act="newQuote"><span class="plus">+</span>Novo orçamento</button><button class="btn btn-lg" data-act="newConta">Conta a pagar</button></div></div>'+
  '<div class="grid3">'+
   block('Cobrar',(cobrar.length?String(cobrar.length):''),cobrarHTML,'Nada para cobrar agora.')+
   block('Dar retorno',(ret.length?String(ret.length):''),ret.join(''),'Ninguém esperando retorno.')+
   block('Projetos',(andamento.length?String(andamento.length):''),obrasHTML,'Nenhum projeto em andamento.','<a class="btn btn-sm btn-ghost" href="#obras">Quadro</a>')+
  '</div>';
}

/* ---------- Orçamentos ---------- */
var ORD={enviado:0,rascunho:1,aprovado:2,perdido:3};
function vOrcamentos(){
  if(ui.quoteId&&ui.draft)return vEditor();
  var t=today();
  var by=function(s){return S.orcamentos.filter(function(q){return q.status===s})};
  var ras=by('rascunho'),env=awaitingQuotes(),apr=by('aprovado'),per=by('perdido');
  var tot=function(a){return a.reduce(function(x,q){return x+quotePrice(q)},0)};
  var decididos=apr.length+per.length;
  var motivos={};per.forEach(function(q){var m=q.motivoPerda||'Sem motivo';motivos[m]=(motivos[m]||0)+1});
  var topM=Object.keys(motivos).sort(function(a,b){return motivos[b]-motivos[a]})[0];
  function ft(f,k,v,s,tone){return '<button class="tile ftile '+tone+(ui.qFilter===f?' on':'')+'" data-act="qFilter" data-f="'+f+'" aria-pressed="'+(ui.qFilter===f)+'"><span class="k">'+k+'</span><span class="v">'+v+'</span><span class="s">'+s+'</span></button>'}
  var list=S.orcamentos.slice().filter(function(q){return ui.qFilter==='enviado'?env.includes(q):ui.qFilter==='todos'||q.status===ui.qFilter})
    .filter(function(q){var s=ui.qSearch.trim().toLowerCase();return !s||(q.titulo+' '+nomeQ(q)).toLowerCase().indexOf(s)>=0})
    .sort(function(a,b){return (b.criadoEm||'').localeCompare(a.criadoEm||'')||(b.numero-a.numero)});
  var rows=list.map(function(q){
    var quando;
    if(q.status==='enviado'){var d=daysBetween(q.enviadoEm,t);quando='Enviado há '+d+' dia'+(d===1?'':'s')+(d>7?' · <span style="color:var(--warn);font-weight:600">sem resposta</span>':'')}
    else if(q.status==='rascunho')quando='Criado em '+fds(q.criadoEm)+' · ainda não enviado';
    else if(q.status==='aprovado')quando='Aprovado em '+fds(q.aprovadoEm);
    else quando='Perdido · '+esc((q.motivoPerda||'sem motivo').toLowerCase())+(q.retomarEm?' · retomar '+fds(q.retomarEm):'');
    if(precoMudou(q))quando+=' · <span style="color:var(--warn);font-weight:600">preço mudou</span>';
    var valor=quotePrice(q);
    var aberto=(q.status==='rascunho'||q.status==='enviado')&&!approvedRevision(q);
    return '<div class="qrow" data-act="viewQuote" data-id="'+q.id+'" tabindex="0" role="button"><div><div class="t">'+esc(q.titulo||'Sem título')+'</div><div class="muted small">'+esc(nomeQ(q))+' · '+quando+'</div></div><span class="r">'+brl0(valor)+'</span><span>'+pill(q.status)+'</span><div class="qact"><button class="btn btn-sm" data-act="viewQuote" data-id="'+q.id+'">Ver</button>'+(q.status!=='aprovado'&&!approvedRevision(q)?'<button class="btn btn-sm" data-act="editQuote" data-id="'+q.id+'">Editar</button>':'')+(aberto?'<button class="btn btn-sm btn-primary" data-act="approveQuote" data-id="'+q.id+'">Aprovar</button>':'')+'</div></div>'}).join('');
  var label={todos:'Todos os orçamentos',rascunho:'Rascunhos',enviado:'Enviados, aguardando resposta',aprovado:'Aprovados',perdido:'Perdidos'}[ui.qFilter];
  return '<div class="page-head"><div><h1>Orçamentos</h1><p>Crie, edite e acompanhe as propostas dos seus clientes.</p></div><div class="actions">'+((S.orcamentosExcluidos||[]).length?'<button class="btn" data-act="quoteTrash">Lixeira ('+S.orcamentosExcluidos.length+')</button>':'')+'<button class="btn" data-act="mobcloudImport">Importar projeto</button><button class="btn btn-primary" data-act="newQuote"><span class="plus">+</span>Novo orçamento</button></div></div>'+
  '<div class="tiles">'+
   ft('rascunho','Rascunhos',ras.length,'ainda não enviados','')+
   ft('enviado','Enviados',env.length,brl0(tot(env))+' aguardando resposta','blue')+
   ft('aprovado','Aprovados',apr.length,(decididos?'fecha '+pct(apr.length/decididos*100)+' dos decididos':'nenhum ainda'),'brown')+
   ft('perdido','Perdidos',per.length,topM?'motivo mais comum: '+esc(topM.toLowerCase()):'nenhum','')+
  '</div>'+
  '<div class="card"><div class="card-head"><div class="actions"><h2>'+label+'</h2><span class="pill">'+list.length+'</span>'+(ui.qFilter!=='todos'?'<button class="btn btn-sm btn-ghost" data-act="qFilter" data-f="todos">Ver todos</button>':'')+'</div><input class="in search" id="q-search" type="search" placeholder="Buscar cliente ou móvel" value="'+esc(ui.qSearch)+'" aria-label="Buscar orçamentos"></div>'+
  (rows||'<div class="list"><div class="empty">Nenhum orçamento aqui.</div></div>')+'</div>';
}
/* ---------- Importação de planos de corte do Mobcloud ---------- */
var mobcloudReader;
function loadMobcloudReader(){
  if(mobcloudReader)return mobcloudReader;
  mobcloudReader=(async function(){
    var data=JSON.parse(document.getElementById('mobcloud-pdf-bundle').textContent);
    async function moduleURL(encoded){
      var bytes=Uint8Array.from(atob(encoded),function(c){return c.charCodeAt(0)});
      var stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      var source=await new Response(stream).arrayBuffer();
      return URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
    }
    var urls=await Promise.all([moduleURL(data.core),moduleURL(data.worker)]);
    try{
      var pdf=await import(urls[0]);
      pdf.GlobalWorkerOptions.workerSrc=urls[1];
      return pdf;
    }catch(e){
      URL.revokeObjectURL(urls[1]);throw e;
    }finally{URL.revokeObjectURL(urls[0])}
  })().catch(function(e){mobcloudReader=null;throw e});
  return mobcloudReader;
}
function mobcloudKey(text){
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[®™]/g,'').replace(/\s+/g,' ').trim();
}
function parseMobcloud(pages){
  var report={id:'',tipo:'corte',layouts:0,pecas:0,cortes:0,chapas:[],fitas:[],itens:[]},seen=new Set();
  var totalChapas=0;
  function add(list,key,name,qty){
    var match=list.find(function(row){return row.key===key});
    if(match)match.qty+=qty;else list.push({key:key,name:name,qty:qty});
  }
  pages.forEach(function(page){
    var items=page.filter(function(item){return item.str.trim()});
    var text=items.map(function(item){return item.str.trim()}).join(' ');
    var p=text.match(/\bProjeto:\s*(\d+)/i);
    if(p){
      if(report.id&&report.id!==p[1])throw new Error('Envie um plano de corte de um projeto por vez.');
      report.id=p[1];
    }
    var declared=text.match(/Qtd\. de chapas:\s*(\d+)/i);
    if(declared)totalChapas+=+declared[1];
    var starts=[];
    items.forEach(function(item,i){if(/^LAYOUT\s+\d+$/i.test(item.str.trim()))starts.push(i)});
    starts.forEach(function(start,i){
      var block=items.slice(start,starts[i+1]);
      var layout=+block[0].str.match(/\d+/)[0];
      if(seen.has(layout))throw new Error('O plano contém layouts repetidos. Confira o arquivo exportado.');
      seen.add(layout);
      var materialAt=block.findIndex(function(item){return mobcloudKey(item.str)==='material da chapa:'});
      var tapeAt=block.findIndex(function(item){return mobcloudKey(item.str)==='fita(s) aplicada(s):'});
      var head=block.slice(0,materialAt).map(function(item){return item.str.trim()}).join(' ');
      var times=head.match(/Produzir:\s*(\d+)\s*ve(?:z|zes)\s+(\d+)\s*chapas?/i);
      var pieces=head.match(/Qtd\. peças layout:\s*(\d+)/i);
      var cuts=head.match(/Qtd\. de cortes:\s*(\d+)/i);
      if(materialAt<0||tapeAt<=materialAt||!times||!pieces||!cuts)throw new Error('Não consegui ler os materiais de um dos layouts do plano.');
      var qty=+times[2],repetitions=+times[1];
      var material=block.slice(materialAt+1,tapeAt).map(function(item){return item.str.trim()}).join(' ').replace(/\s+(\d+[.,]?\d*)\s*[x×]\s*(\d+[.,]?\d*)$/i,'').trim();
      var sku=material.match(/\bCH\d+\b/i);
      if(!qty||!repetitions||!material)throw new Error('Um dos layouts está com quantidade ou material incompleto.');
      add(report.chapas,'chapa:'+mobcloudKey(sku?sku[0]:material),material,qty);
      report.pecas+=+pieces[1]*repetitions;report.cortes+=+cuts[1]*repetitions;
      var tapeHead=block[tapeAt].transform,tapeText=[];
      for(var t=tapeAt+1;t<block.length;t++){
        var item=block[t],pos=item.transform;
        if(pos[4]<tapeHead[4]-1||tapeHead[5]-pos[5]>125)break;
        tapeText.push(item.str.trim());
      }
      if(tapeText.length){
        var values=Array.from(tapeText.join(' ').matchAll(/\(\s*(\d+(?:[.,]\d+)?)\s*m\s*\)\s*(.+?)(?=\s*\(\s*\d+(?:[.,]\d+)?\s*m\s*\)|$)/gi));
        if(!values.length)throw new Error('Não consegui ler a metragem de fita de um dos layouts.');
        values.forEach(function(x){add(report.fitas,'fita:'+mobcloudKey(x[2]),x[2].trim(),n(x[1])*repetitions)});
      }
    });
  });
  report.layouts=seen.size;
  report.totalChapas=report.chapas.reduce(function(sum,row){return sum+row.qty},0);
  if(!report.id||!report.layouts)throw new Error('Escolha o PDF do plano de corte do Mobcloud, com os layouts das chapas.');
  if(totalChapas&&report.totalChapas!==totalChapas)throw new Error('A soma dos layouts difere do total de chapas do relatório. Confira se o PDF está completo.');
  return report;
}
function mobcloudMaterialName(name){
  return mobcloudKey(name).replace(/^(?:\d+\s*-\s*|fita\s+)/,'').replace(/\bch\d+\b\s*-?\s*/g,'')
    .replace(/\s*\(rolo[^)]*\)/g,'').replace(/(\d+)\.0(?=\s*mm)/g,'$1')
    .replace(/(?:\s*mm)?\s*[x×]\s*(?=\d)/g,'x').replace(/(\d)\s*mm\b/g,'$1mm')
    .replace(/(\d[.,]?\d*x\d+(?:[.,]\d+)?)mm\b/g,'$1').replace(/\s+/g,' ').trim();
}
function parseMobcloudBudget(pages){
  var report={id:'',tipo:'orcamento',chapas:[],fitas:[],itens:[]},section;
  var sections={'Chapas':'chapas','Fitas':'fitas','Componente':'itens','Componentes':'itens','Lista de peças':'end'};
  for(var page of pages){
    var items=page.filter(function(x){return x.str.trim()});
    var title=items.find(function(x){return /Orçamento do projeto\s*#\s*\d+/i.test(x.str)});
    if(title)report.id=title.str.match(/#\s*(\d+)/)[1];
    if(!report.id)continue;
    ['Total a ser pago à produção','Seu preço de venda'].forEach(function(label,i){
      var anchor=items.find(function(x){return x.str.trim()===label});
      if(!anchor)return;
      var amount=items.find(function(x){return /^R\$/.test(x.str)&&Math.abs(x.transform[5]-anchor.transform[5])<3});
      if(amount)report[i?'venda':'producao']=amount.str.trim();
    });
    var markers=items.filter(function(x){
      return Object.hasOwn(sections,x.str.trim())&&x.transform[4]<65;
    }).sort(function(a,b){return b.transform[5]-a.transform[5]});
    var qtyHeaders=items.filter(function(x){return /^Qtde\.?$/i.test(x.str.trim())&&x.transform[4]<70});
    var anchors=items.filter(function(x){
      return /^\d+(?:[.,]\d+)?$/.test(x.str.trim())&&qtyHeaders.some(function(h){
        return Math.abs(x.transform[4]-h.transform[4])<=15&&x.transform[5]<h.transform[5]-8;
      })&&x.transform[5]>30;
    }).sort(function(a,b){return b.transform[5]-a.transform[5]});
    var quantityRows=anchors.concat(markers).sort(function(a,b){return b.transform[5]-a.transform[5]});
    for(var i=0;i<quantityRows.length;i++){
      var row=quantityRows[i],label=row.str.trim();
      if(Object.hasOwn(sections,label)){section=sections[label];if(section==='end')return finish();continue}
      if(!section)continue;
      var y=row.transform[5],end=quantityRows[i+1]?quantityRows[i+1].transform[5]:30;
      var description=items.filter(function(x){
        return x.transform[4]>row.transform[4]+16&&x.transform[5]<=y+5&&x.transform[5]>Math.max(end+5,y-22);
      }).sort(function(a,b){return b.transform[5]-a.transform[5]||a.transform[4]-b.transform[4]});
      var extra=description.some(function(x){return mobcloudKey(x.str)==='nao incluso'});
      var name=description.filter(function(x){return mobcloudKey(x.str)!=='nao incluso'}).map(function(x){return x.str.trim()}).join(' ');
      if(!name)throw new Error('Não consegui ler a descrição de um item no orçamento do Mobcloud.');
      var qty=n(label),product={key:section+':'+mobcloudMaterialName(name),name:name,qty:qty};
      if(section==='fitas'){
        var roll=name.match(/\(rolo\s+(\d+(?:[.,]\d+)?)\s*metros?\)/i);
        if(roll)product.metros=qty*n(roll[1]);else product.ambiguous=true;
      }
      if(section==='itens'){product.extra=extra;product.ambiguous=/\b(perfil|barra|fita)\b/i.test(name)}
      report[section].push(product);
    }
  }
  return finish();
  function finish(){
    report.totalChapas=report.chapas.reduce(function(sum,row){return sum+row.qty},0);
    if(!report.id||!report.totalChapas)throw new Error('Escolha o PDF de orçamento ou do plano de corte do Mobcloud.');
    return report;
  }
}
function mobcloudReport(pages){
  var budget=pages.some(function(page){return page.some(function(x){return /Orçamento do projeto\s*#\s*\d+/i.test(x.str)})});
  return budget?parseMobcloudBudget(pages):parseMobcloud(pages);
}
function joinMobcloud(reports){
  if(reports.length===1)return reports[0];
  var cut=reports.find(function(r){return r.tipo==='corte'});
  var budget=reports.find(function(r){return r.tipo==='orcamento'});
  if(!cut||!budget)throw new Error('Escolha um orçamento e um plano de corte para combinar.');
  if(cut.id!==budget.id)throw new Error('Os PDFs são de projetos diferentes. Escolha documentos do mesmo projeto.');
  function counts(rows){
    var grouped=new Map();
    rows.forEach(function(row){
      var key=mobcloudMaterialName(row.name);
      grouped.set(key,(grouped.get(key)||0)+row.qty);
    });
    return JSON.stringify(Array.from(grouped).sort());
  }
  if(counts(cut.chapas)!==counts(budget.chapas))throw new Error('As listas de chapas divergem. Confira se os dois PDFs são da mesma versão do projeto.');
  var tapeKeys=new Set(cut.fitas.map(function(row){return mobcloudMaterialName(row.name)}));
  return Object.assign({},cut,{tipo:'combinado',itens:budget.itens,producao:budget.producao,venda:budget.venda,
    fitas:cut.fitas.concat(budget.fitas.filter(function(row){return !tapeKeys.has(mobcloudMaterialName(row.name))}))});
}
/* ---------- Leitura de listas de peças ---------- */
var PIECE_KEYS={
  nome:['nome','peca','piece','part','name','descricao','description','funcao','funcao da peca','funcao / cliente / descricao'],
  qtd:['qtd','qtde','quantidade','quantity','qty','count'],
  c:['comprimento','comp','length','dimensao c','c'],
  l:['largura','larg','width','dimensao l','l'],
  material:['material','chapa','board','substrate'],
  unidade:['unidade','unit','units','unidade medida','unidade de medida']
};
var PIECE_UNITS={mm:1,cm:10,m:1000,pol:25.4,in:25.4,ft:304.8};
function pieceUnit(text){
  var key=mobcloudKey(String(text||'')).replace(/[.]/g,'').trim();
  return Object.hasOwn(PIECE_UNITS,key)?key:'';
}
function pieceKey(text){
  var key=mobcloudKey(text).replace(/[_-]/g,' ').replace(/\([^)]*\)/g,'').replace(/\s+(?:mm|cm|m|pol|in|ft)$/,'').replace(/[.:]$/,'').trim();
  return Object.keys(PIECE_KEYS).find(function(k){return PIECE_KEYS[k].includes(key)})||'';
}
function pieceNumber(value){
  var s=String(value==null?'':value).trim();
  return /^\d+(?:[.,]\d+)?$/.test(s)?Number(s.replace(',','.')):NaN;
}
function pieceDimension(value,unit,grade){
  var match=String(value==null?'':value).trim().match(/^(\d+(?:[.,]\d+)?)\s*(mm|cm|m|pol|in|ft)?$/i);
  if(!match||!(pieceNumber(match[1])>0))return {value:'',unit:'',grade:'baixa'};
  var actual=pieceUnit(match[2])||pieceUnit(unit);
  return {value:match[1].replace(',','.'),unit:actual,grade:actual?grade:'baixa'};
}
function pieceRecord(row,grade,origin){
  function field(value,fallback){
    var s=String(value==null?'':value).trim();
    return {value:s||fallback||'',grade:s?grade:'baixa'};
  }
  var qty=pieceNumber(row.qtd);
  return {nome:field(row.nome,'Peça'),qtd:Number.isSafeInteger(qty)&&qty>0?field(qty):field('','1'),
    c:pieceDimension(row.c,row.unitC||row.unidade,grade),l:pieceDimension(row.l,row.unitL||row.unidade,grade),
    material:field(row.material),origin:origin};
}
function decodeProjectText(bytes){
  if(bytes[0]===255&&bytes[1]===254)return new TextDecoder('utf-16le').decode(bytes);
  if(bytes[0]===254&&bytes[1]===255)return new TextDecoder('utf-16be').decode(bytes);
  try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes)}catch(e){return new TextDecoder('windows-1252').decode(bytes)}
}
function pieceDelimited(text,separator){
  var rows=[],row=[],cell='',quoted=false;
  for(var i=0;i<text.length;i++){
    var ch=text[i];
    if(ch==='"'){
      if(quoted&&text[i+1]==='"'){cell+='"';i++}
      else if(quoted||!cell.trim())quoted=!quoted;
      else cell+=ch;
    }else if(!quoted&&(ch===separator||ch==='\n'||ch==='\r')){
      row.push(cell.trim());cell='';
      if(ch!==separator){if(row.some(Boolean))rows.push(row);row=[];if(ch==='\r'&&text[i+1]==='\n')i++}
    }else cell+=ch;
  }
  if(quoted)return [];
  row.push(cell.trim());if(row.some(Boolean))rows.push(row);
  return rows;
}
function pieceTable(text){
  for(var separator of [';','\t',',','|']){
    var rows=pieceDelimited(text,separator),head=rows.findIndex(function(row){
      var keys=row.map(pieceKey);return keys.includes('c')&&keys.includes('l');
    });
    if(head<0)continue;
    var keys=rows[head].map(pieceKey);
    var units=rows[head].map(function(h){var u=mobcloudKey(h).replace(/[_-]/g,' ').match(/(?:\s|\()\s*(mm|cm|m|pol|in|ft)\s*\)?$/);return u?u[1]:''});
    return rows.slice(head+1).filter(function(row){return row.length>Math.min(keys.indexOf('c'),keys.indexOf('l'))}).map(function(row,i){
      var rec={};
      keys.forEach(function(k,j){
        if(!k)return;
        rec[k]=row[j];
        if(k==='c')rec.unitC=units[j];
        if(k==='l')rec.unitL=units[j];
      });
      return pieceRecord(rec,'alta','Linha '+(head+i+2)+' · tabela');
    });
  }
  return null;
}
function pieceTextRows(text,origin){
  return text.split(/\r?\n/).flatMap(function(line,i){
    var hit=line.match(/(\d+(?:[.,]\d+)?)\s*(mm|cm|m|pol|in|ft)?\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(mm|cm|m|pol|in|ft)?(?=\s|$|[;,:-])/i);
    if(!hit)return [];
    var prefix=line.slice(0,hit.index).trim(),tail=line.slice(hit.index+hit[0].length);
    var qty=prefix.match(/^(\d+)\s*(?:un(?:\.?|idades?)\s+|[x×]\s*|[-;:]\s*)/i)||tail.match(/\b(?:qtd\.?|qtde\.?|quantidade)\s*[:=]?\s*(\d+)/i);
    return [pieceRecord({nome:prefix.replace(/^(\d+)\s*(?:un(?:\.?|idades?)\s+|[x×]\s*|[-;:]\s*)/i,'').replace(/[-;:]\s*$/,'').trim(),
      qtd:qty&&qty[1],c:hit[1],l:hit[3],unitC:hit[2]||hit[4],unitL:hit[4]||hit[2]},'media',origin+' · linha '+(i+1))];
  });
}
function pieceXML(text){
  var doc=new DOMParser().parseFromString(text,'application/xml');
  if(doc.querySelector('parsererror'))throw new Error('O XML está inválido. Confira o arquivo exportado.');
  var rows=[];
  for(var el of doc.querySelectorAll('*')){
    var row={};
    function read(name,value){var key=pieceKey(name);if(key)row[key]=value}
    Array.from(el.attributes).forEach(function(a){read(a.localName,a.value)});
    function readChild(c){
      var key=pieceKey(c.localName);
      if(!c.children.length){
        read(c.localName,c.textContent);
        if(key==='c'||key==='l')row[key==='c'?'unitC':'unitL']=c.getAttribute('unidade')||c.getAttribute('unit');
      }else if(/^(dimensoes|dimensions|medidas)$/.test(mobcloudKey(c.localName))){
        Array.from(c.children).forEach(readChild);
        row.unidade=row.unidade||c.getAttribute('unidade')||c.getAttribute('unit');
      }
    }
    if(/^(dimensoes|dimensions|medidas)$/.test(mobcloudKey(el.localName))&&el.parentElement)continue;
    Array.from(el.children).forEach(readChild);
    var isPiece=/^(peca|piece|part)$/.test(mobcloudKey(el.localName));
    if(!isPiece&&(row.c==null||row.l==null))continue;
    if(!row.nome&&!row.c&&!row.l)continue;
    if(!row.unidade)row.unidade=el.parentElement&&(
      el.parentElement.getAttribute('unidade')||el.parentElement.getAttribute('unit')||el.parentElement.getAttribute('units'));
    rows.push(pieceRecord(row,'alta','XML · '+el.localName));
  }
  return rows;
}
function pieceDXF(text){
  if(/^AutoCAD Binary DXF/i.test(text))throw new Error('Exporte o desenho como DXF ASCII para ler os contornos.');
  var lines=text.split(/\r?\n/).map(function(s){return s.trim()}),pairs=[],entities=[],current=null,inEntities=false,unit='';
  for(var i=0;i+1<lines.length;i+=2)pairs.push([Number(lines[i]),lines[i+1]]);
  var drawingUnits={1:'pol',2:'ft',4:'mm',5:'cm',6:'m'};
  pairs.forEach(function(p,i){
    if(p[0]===9&&p[1].toUpperCase()==='$INSUNITS'&&pairs[i+1]&&pairs[i+1][0]===70)unit=drawingUnits[pairs[i+1][1]]||'';
    if(p[0]===2&&p[1].toUpperCase()==='ENTITIES'&&pairs[i-1]&&pairs[i-1][1].toUpperCase()==='SECTION')inEntities=true;
    if(p[0]===0){
      if(p[1].toUpperCase()==='ENDSEC')inEntities=false;
      current=inEntities?{type:p[1].toUpperCase(),groups:[]}:null;
      if(current)entities.push(current);
    }else if(current)current.groups.push(p);
  });
  function value(entity,code){var found=entity.groups.find(function(p){return p[0]===code});return found?found[1]:''}
  function planar(entity){
    return entity.groups.every(function(p){
      return ([38,39,42,210,220].includes(p[0])?Number(p[1])===0:p[0]===230?Number(p[1])===1:true);
    });
  }
  function vertices(entity){
    var points=[];
    entity.groups.forEach(function(p){
      if(p[0]===10)points.push([Number(p[1]),NaN]);
      if(p[0]===20&&points.length)points[points.length-1][1]=Number(p[1]);
    });
    return points;
  }
  var rows=[];
  entities.forEach(function(entity,i){
    var flags=Number(value(entity,70));
    if(!['LWPOLYLINE','POLYLINE'].includes(entity.type)||!(flags&1)||(flags&126)||!planar(entity))return;
    var points=vertices(entity);
    if(entity.type==='POLYLINE'){
      points=[];
      for(var j=i+1;entities[j]&&entities[j].type==='VERTEX';j++){
        if(!planar(entities[j])||Number(value(entities[j],30))!==0){points=[];break}
        points.push([Number(value(entities[j],10)),Number(value(entities[j],20))]);
      }
    }
    if(points.length===5&&points[0][0]===points[4][0]&&points[0][1]===points[4][1])points.pop();
    if(points.length!==4||!points.every(function(p){return p.every(Number.isFinite)}))return;
    var edges=points.map(function(p,i){var next=points[(i+1)%4];return [next[0]-p[0],next[1]-p[1]]});
    var lengths=edges.map(function(v){return Math.hypot(v[0],v[1])});
    var valid=lengths.every(function(v,i){
      var first=edges[i],next=edges[(i+1)%4],dot=first[0]*next[0]+first[1]*next[1];
      return v>0&&Math.abs(dot)<=v*lengths[(i+1)%4]*1e-6&&Math.abs(v-lengths[(i+2)%4])<=v*1e-6;
    });
    if(!valid)return;
    var layer=value(entity,8),row=pieceRecord({nome:layer&&layer!=='0'?layer+' · '+(rows.length+1):'Contorno '+(rows.length+1),
      c:+Math.max(lengths[0],lengths[1]).toFixed(6),l:+Math.min(lengths[0],lengths[1]).toFixed(6),unidade:unit,material:layer&&layer!=='0'?layer:''},'media','DXF · contorno fechado');
    row.nome.grade='baixa';rows.push(row);
  });
  return rows;
}
function piecePDF(pages,mobcloud){
  return pages.flatMap(function(page,index){
    var items=page.filter(function(x){return x.str.trim()&&Math.abs(x.transform[1])<0.1});
    var column=items.find(function(x){
      return pieceKey(x.str)==='c'&&items.some(function(y){
        return pieceKey(y.str)==='l'&&y.transform[4]>x.transform[4]&&Math.abs(y.transform[5]-x.transform[5])<3;
      });
    });
    if(column){
      var y=column.transform[5],headers=items.filter(function(x){return Math.abs(x.transform[5]-y)<12&&pieceKey(x.str)});
      var columns={c:column};
      headers.forEach(function(h){var k=pieceKey(h.str);if(!columns[k])columns[k]=h});
      if(columns.l&&(columns.nome||columns.qtd)){
        var end=items.find(function(x){return /^Sobras?$/i.test(x.str.trim())&&x.transform[5]<y&&x.transform[4]<75});
        var floor=end?end.transform[5]:30;
        function inColumn(x,key){
          var head=columns[key],distance=head?Math.abs(x.transform[4]-head.transform[4]):Infinity;
          return distance<=10&&Object.keys(columns).every(function(k){
            return k===key||distance<=Math.abs(x.transform[4]-columns[k].transform[4]);
          });
        }
        var data=items.filter(function(x){return x.transform[5]<y-8&&x.transform[5]>floor});
        var anchors=data.filter(function(x){return inColumn(x,'c')&&pieceNumber(x.str)>0}).sort(function(a,b){return b.transform[5]-a.transform[5]});
        var pieces=anchors.flatMap(function(anchor,i){
          var baseline=anchor.transform[5];
          var low=anchors[i+1]?(baseline+anchors[i+1].transform[5])/2:baseline-20;
          var high=i?(baseline+anchors[i-1].transform[5])/2:Math.min(y-5,baseline+16);
          function direct(key){
            var item=data.find(function(x){return inColumn(x,key)&&Math.abs(x.transform[5]-baseline)<2.5&&pieceNumber(x.str)>0});
            return item?item.str:'';
          }
          function wrapped(key){
            return data.filter(function(x){return inColumn(x,key)&&x.transform[5]>low&&x.transform[5]<high})
              .sort(function(a,b){return b.transform[5]-a.transform[5]||a.transform[4]-b.transform[4]})
              .map(function(x){return x.str.trim()}).join(' ');
          }
          var width=direct('l'),qty=direct('qtd'),name=wrapped('nome');
          if(!width||(!qty&&!name))return [];
          if(mobcloud)name=name.split('/')[0].trim();
          var unitC=headerUnit(columns.c),unitL=headerUnit(columns.l);
          var piece=pieceRecord({nome:name,qtd:qty,c:anchor.str,l:width,material:wrapped('material'),
            unidade:mobcloud?'mm':'',unitC:unitC,unitL:unitL},'alta','PDF · página '+(index+1));
          if(mobcloud&&!unitC)piece.c.grade='media';
          if(mobcloud&&!unitL)piece.l.grade='media';
          return [piece];
        });
        if(pieces.length)return pieces;
      }
    }
    if(mobcloud)return [];
    var lines=[];
    items.sort(function(a,b){return b.transform[5]-a.transform[5]||a.transform[4]-b.transform[4]}).forEach(function(item){
      var line=lines[lines.length-1];
      if(!line||Math.abs(line.y-item.transform[5])>3)lines.push({y:item.transform[5],text:item.str.trim()});
      else line.text+=' '+item.str.trim();
    });
    return pieceTextRows(lines.map(function(l){return l.text}).join('\n'),'PDF · página '+(index+1));
  });
  function headerUnit(item){
    var unit=mobcloudKey(item.str).match(/(?:\s|\()\s*(mm|cm|m|pol|in|ft)\s*\)?$/);
    return unit?unit[1]:'';
  }
}
async function readProjectFile(file){
  var bytes=new Uint8Array(await file.arrayBuffer()),suffix=String(file.name||'').split('.').pop().toLowerCase();
  var raw=new TextDecoder().decode(bytes.subarray(0,1024));
  var result={name:file.name||'Arquivo do projetista',format:'',pieces:[]};
  if(raw.includes('%PDF-')||suffix==='pdf'){
    result.format='PDF';
    var pdf=await loadMobcloudReader();
    var task=pdf.getDocument({data:bytes,disableFontFace:true,useSystemFonts:false,isEvalSupported:false,stopAtErrors:true});
    var pages=[];
    try{
      var doc=await task.promise;
      for(var i=1;i<=doc.numPages;i++)pages.push((await (await doc.getPage(i)).getTextContent()).items);
    }finally{await task.destroy().catch(function(){})}
    var all=pages.flat();
    var isMobcloud=all.some(function(x){return /especificacao\.mobcloud\.com\.br/i.test(x.str)})&&
      all.some(function(x){return /^(LAYOUT\s+\d+|Orçamento do projeto\s*#\s*\d+)/i.test(x.str.trim())});
    if(isMobcloud)result.mobcloud=mobcloudReport(pages);
    if(!isMobcloud){result.materials=materialPDF(pages);if(!result.materials)result.pieces=piecePDF(pages,false);}
    if(!pages.some(function(page){return page.some(function(x){return x.str.trim()})}))throw new Error('O PDF está em imagem. Envie a versão com texto selecionável ou a lista em CSV.');
  }else{
    var source=decodeProjectText(bytes);
    if(/^\s*AutoCAD Binary DXF/i.test(source)||/^\s*0\s*\r?\n\s*SECTION\s*\r?\n/i.test(source)||suffix==='dxf'){
      result.format='DXF';result.pieces=pieceDXF(source);
    }else if(/^\s*</.test(source)||suffix==='xml'){
      result.format='XML';result.materials=materialXML(source);if(!result.materials.length)result.pieces=pieceXML(source);
    }else{
      result.materials=materialTable(source);
      var table=pieceTable(source);
      result.format=table?'CSV':'TXT';result.pieces=table||pieceTextRows(source,'TXT');
    }
  }
  if(!result.pieces.length&&!result.mobcloud&&!(result.materials&&result.materials.length)){
    if(result.format==='DXF')throw new Error('Não encontrei materiais no DXF. Envie a lista de materiais ou um DXF com contornos fechados e materiais identificados nas camadas.');
    throw new Error('Não encontrei uma lista de materiais. Envie um arquivo com material e quantidade ou o orçamento do Mobcloud.');
  }
  return result;
}
function materialPDF(pages){
  var text=pages.map(function(page){
    var lines=[];
    page.forEach(function(item){
      var line=lines.find(function(l){return Math.abs(l.y-item.transform[5])<3});
      if(!line){line={y:item.transform[5],items:[]};lines.push(line)}
      line.items.push(item);
    });
    return lines.sort(function(a,b){return b.y-a.y}).map(function(l){
      return l.items.sort(function(a,b){return a.transform[4]-b.transform[4]}).map(function(i){return i.str}).join(';');
    }).join('\n');
  }).join('\n');
  return materialTable(text);
}
function materialXML(text){
  var doc=new DOMParser().parseFromString(text,'application/xml');
  if(doc.querySelector('parsererror'))throw new Error('O XML está inválido. Confira o arquivo exportado.');
  return Array.from(doc.querySelectorAll('*')).flatMap(function(el){
    if(!/^(material|produto|insumo|chapa|fita)$/.test(mobcloudKey(el.localName)))return [];
    function get(names){
      for(var name of names){
        if(el.hasAttribute(name))return el.getAttribute(name);
        var child=Array.from(el.children).find(function(c){return mobcloudKey(c.localName)===name&&!c.children.length});
        if(child)return child.textContent.trim();
      }
      return '';
    }
    var name=get(['nome','descricao','name']),qty=get(['quantidade','qtd','qty']);
    return name&&qty?[{name:name,qty:pieceNumber(qty),unit:get(['unidade','un','unit'])}]:[];
  });
}
function materialTable(text){
  for(var separator of [';','\t',',','|']){
    var rows=pieceDelimited(text,separator),head=rows.findIndex(function(row){
      var keys=row.map(function(h){return mobcloudKey(h)});
      return keys.some(function(k){return /^(material|descricao|produto|insumo)$/.test(k)})&&keys.some(function(k){return /^(qtd\.?|qtde\.?|quantidade)$/.test(k)});
    });
    if(head<0)continue;
    var keys=rows[head].map(function(h){return mobcloudKey(h)});
    // Tabelas de corte precisam ser agrupadas pelo material; a quantidade é de peças.
    if(rows[head].map(pieceKey).includes('c')&&rows[head].map(pieceKey).includes('l'))return null;
    var name=keys.findIndex(function(k){return /^(material|descricao|produto|insumo)$/.test(k)});
    var qty=keys.findIndex(function(k){return /^(qtd\.?|qtde\.?|quantidade)$/.test(k)});
    var unit=keys.findIndex(function(k){return /^(un\.?|unidade|unit)$/.test(k)});
    return rows.slice(head+1).filter(function(r){return r[name]&&mobcloudKey(r[name])!==keys[name]&&!/^(total|subtotal)$/i.test(r[name])}).map(function(r){return {name:r[name],qty:pieceNumber(r[qty]),unit:unit<0?'':r[unit]}});
  }
  return null;
}
function projectMaterials(source){
  var report={id:'',tipo:'materiais',origem:source.format,arquivo:source.name,chapas:[],fitas:[],itens:[]};
  var groups=new Map(),unidentified=0;
  function add(type,name,qty,unit,area,uncertain){
    if(/^(lateral(?: direita| esquerda)?|fundo|base|topo|tampo|porta|prateleira)(?: \d+)?$/i.test(name.trim())){unidentified++;return}
    var key=type+':'+mobcloudMaterialName(name)+':'+mobcloudKey(unit||'');
    var row=groups.get(key);
    if(!row){row={key:key,name:name,qty:0,unit:unit||'',area:0,ambiguous:!!uncertain,grade:'alta'};groups.set(key,row);report[type].push(row)}
    if(Number.isFinite(qty)&&qty>0)row.qty+=qty;else row.ambiguous=true;
    row.area+=area||0;
    if(uncertain)row.ambiguous=true;
  }
  (source.materials||[]).forEach(function(row){
    var unit=mobcloudKey(row.unit||'');
    var type=/^(chapas?|boards?|sheets?)$/.test(unit)||/\b(mdf|mdp|compensado)\b/i.test(row.name)?'chapas':/fita/i.test(row.name)&&/^(m|metro|metros)$/.test(unit)?'fitas':'itens';
    var areaUnit=/^(m2|m²)$/.test(unit);
    add(type,row.name,type==='chapas'&&areaUnit?null:row.qty,unit,areaUnit?row.qty:0,!unit||type==='chapas'&&!/^(chapas?|boards?|sheets?|un\.?|unidades?)$/.test(unit));
  });
  (source.materials&&source.materials.length?[]:source.pieces||[]).forEach(function(row){
    var name=String(row.material.value||'').trim();
    if(!name){unidentified++;return}
    var c=pieceNumber(row.c.value),l=pieceNumber(row.l.value),qty=pieceNumber(row.qtd.value);
    var area=c*l*PIECE_UNITS[row.c.unit]*PIECE_UNITS[row.l.unit]*qty/1000000;
    add('chapas',name,null,'chapa',Number.isFinite(area)&&area>0?area:0,true);
  });
  report.semMaterial=unidentified;
  estimateMaterialSheets(report,2750,1850,85);
  if(!report.chapas.length&&!report.fitas.length&&!report.itens.length)throw new Error('Não encontrei materiais identificados. Envie a lista de materiais ou um arquivo com a coluna Material; nomes como lateral e fundo são ignorados.');
  return report;
}
function estimateMaterialSheets(report,c,l,use){
  report.chapas.forEach(function(row){
    if(!row.area||!row.ambiguous&&!row.estimated)return;
    row.estimated=true;
    row.qty=c>0&&l>0&&use>0&&use<=100?Math.ceil(row.area/(c*l/1000000*use/100)-1e-9):0;
  });
}
function pieceMaterialSummary(source){
  var report;
  try{report=projectMaterials(source)}catch(e){return '<p class="alert warn">Preencha o material de cada peça na conferência para calcular os totais.</p>'}
  return '<div class="sec"><h2>Consumo agrupado por material</h2>'+report.chapas.map(function(r){return '<p><b>'+esc(r.name)+'</b> · '+dec(r.area,3)+' m²'+(r.qty?' · cerca de '+r.qty+' chapa(s)':'')+'</p>'}).join('')+
    '<p class="muted small">Soma de comprimento × largura × quantidade. A estimativa considera chapa de 2.750 × 1.850 mm e 85% de aproveitamento; confira esses valores na próxima tela. Medidas sem unidade precisam ser conferidas.</p></div>';
}
function reviewProjectImport(results){
  var reports=results.map(function(x){return x.mobcloud});
  if(results.length===2&&reports.some(function(x){return !x}))throw new Error('Escolha um arquivo por vez ou os dois PDFs Mobcloud do mesmo projeto.');
  if(reports[0]){ui.projectImport=null;mobcloudPreview(joinMobcloud(reports));return}
  var source=results[0];
  if(source.materials&&source.materials.length){ui.projectImport=null;mobcloudPreview(projectMaterials(source));return}
  ui.projectImport={source:source,report:null};
  showPieceReview(source,null);
}
function showPieceReview(source,report){
  var rows=source.pieces;
  var observed=rows.reduce(function(total,row){return total+n(row.qtd.value)},0);
  var discrepancy=report&&report.pecas&&observed!==report.pecas;
  function units(value,id){
    return '<select class="in" id="'+id+'" aria-label="Unidade da dimensão"><option value="">Unidade</option>'+
      ['mm','cm','m','pol','ft'].map(function(key){return '<option value="'+key+'"'+(key===value||key==='pol'&&value==='in'?' selected':'')+'>'+key+'</option>'}).join('')+'</select>';
  }
  function input(row,key,label,index){
    var f=row[key],id='import-piece-'+index+'-'+key,dimensions=key==='c'||key==='l';
    var grade={alta:'Alta',media:'Média',baixa:'Baixa'}[f.grade];
    var numeric=dimensions||key==='qtd';
    return '<div class="field"><label for="'+id+'">'+label+' <span class="piece-grade '+f.grade+'" title="Confiança da extração">'+grade+'</span></label>'+
      '<div class="'+(dimensions?'piece-dimension':'')+'"><input class="in" id="'+id+'"'+(numeric?' inputmode="'+(dimensions?'decimal':'numeric')+'"':'')+' value="'+esc(f.value)+'">'+
      (dimensions?units(f.unit,id+'-unit'):'')+'</div></div>';
  }
  openModal({title:'Conferir consumo por material',wide:true,
    body:pieceMaterialSummary(source)+'<p><b>'+esc(source.format)+'</b> · '+esc(source.name)+' · '+rows.length+' linhas de peças</p>'+
      '<p class="muted small">Alta: lido de uma coluna ou campo. Média: estimado pelo texto ou desenho. Baixa: valor inferido ou incompleto. Confira as medidas e ajuste o que precisar.</p>'+
      (discrepancy?'<p class="alert warn">Foram lidas '+observed+' peças de '+report.pecas+' indicadas no plano. Confira a lista antes de seguir.</p>':'')+
      (rows.some(function(row){return !row.c.unit||!row.l.unit})?'<div class="actions piece-import-bulk">'+
        '<label for="piece-default-unit">Preencher unidades em branco</label><select class="in" id="piece-default-unit"><option value="mm">mm</option><option value="cm">cm</option><option value="m">m</option><option value="pol">pol</option><option value="ft">ft</option></select>'+
        '<button class="btn btn-sm" data-act="pieceFillUnits">Aplicar</button></div>':'')+
      '<details><summary>Conferir peças e medidas de origem</summary>'+rows.map(function(row,i){
        return '<fieldset class="field scope-item piece-review-row"><legend>Peça '+(i+1)+'</legend><div class="piece-review-fields">'+
          input(row,'nome','Nome',i)+input(row,'qtd','Quantidade',i)+input(row,'c','Comprimento',i)+input(row,'l','Largura',i)+input(row,'material','Material',i)+
          '</div><div class="actions"><span class="muted small">'+esc(row.origin)+'</span><label class="chk"><input type="checkbox" id="import-piece-'+i+'-include" checked> Incluir peça</label></div></fieldset>';
      }).join('')+'</details><p id="piece-review-error" class="small" role="status"></p>',
    foot:'<button class="btn btn-primary" data-act="pieceConfirm">'+'Confirmar e conferir materiais'+'</button>'});
}
function confirmProjectPieces(){
  var current=ui.projectImport;if(!current||readOnly)return;
  var rows=[];
  for(var i=0;i<current.source.pieces.length;i++){
    var id='import-piece-'+i+'-',include=$('#'+id+'include');
    if(!include||!include.checked)continue;
    var nome=val(id+'nome').trim(),qty=pieceNumber(val(id+'qtd')),c=pieceNumber(val(id+'c')),l=pieceNumber(val(id+'l'));
    var uc=pieceUnit(val(id+'c-unit')),ul=pieceUnit(val(id+'l-unit'));
    if(!val(id+'material').trim()){$('#piece-review-error').textContent='Informe o material da peça '+(i+1)+' para somar o consumo corretamente.';return}
    if(!nome||!Number.isSafeInteger(qty)||qty<=0||!Number.isFinite(c)||!Number.isFinite(l)||c<=0||l<=0||!uc||!ul){
      $('#piece-review-error').textContent='Confira o nome, a quantidade, as dimensões e as unidades da peça '+(i+1)+'.';return;
    }
    var cm=+(c*PIECE_UNITS[uc]).toFixed(4),lm=+(l*PIECE_UNITS[ul]).toFixed(4);
    if(!(cm>0&&lm>0&&Number.isFinite(cm)&&Number.isFinite(lm))){
      $('#piece-review-error').textContent='As dimensões da peça '+(i+1)+' precisam ser válidas em milímetros.';return;
    }
    rows.push({nome:nome,qtd:qty,c:cm,l:lm,material:val(id+'material').trim()});
  }
  if(!rows.length){$('#piece-review-error').textContent='Inclua pelo menos uma peça.';return}
  ui.projectImport=null;
  if(current.report){mobcloudPreview(current.report);return}
  var source={name:current.source.name,format:current.source.format,pieces:rows.map(function(r){return pieceRecord({nome:r.nome,qtd:r.qtd,c:r.c,l:r.l,material:r.material,unidade:'mm'},'alta','Conferido')})};
  mobcloudPreview(projectMaterials(source));
}
function importedDraftBase(){return ui.importDraft?clone(ui.importDraft):newDraft()}
function startProjectImport(d){
  if(readOnly)return;
  ui.importDraft=d?clone(d):null;ui.mobcloud=null;ui.projectImport=null;
  openModal({title:'Importar projeto',body:'<div class="field"><label for="mobcloud-file">Arquivo do projetista</label><input class="in" id="mobcloud-file" type="file" accept=".pdf,.dxf,.csv,.txt,.xml" multiple></div>'+
    (d?'<p class="muted small">Os materiais serão importados para este orçamento. Cliente, endereço e condições de pagamento serão mantidos. Confira antes de substituir os materiais atuais.</p>':'')+
    '<p class="muted small" id="mobcloud-status" role="status">PDF, DXF, CSV, TXT ou XML. Para combinar orçamento e plano de corte Mobcloud, selecione os dois PDFs juntos.</p>'});
}
function openImportedDraft(d){
  ui.importDraft=null;location.hash='#orcamentos';
  ui.step=1;ui.draft=d;ui.quoteId=d.id;ui.qFilter='todos';
  closeModal();autoSaveDraft();render();live();window.scrollTo(0,0);
}
function mobcloudCountUnit(product){
  return product&&/^(un\.?|unidades?|pe[cç]as?)$/i.test(String(product.un||'un.').trim());
}
function mobcloudComponentChanged(input,index){
  var report=ui.mobcloud,row=report&&report.itens[index],qty=$('#'+input.id+'-qty');
  if(!row||!qty)return;
  if(report.origem){var selected=S.config.materiais.find(function(m){return m.id===input.value});qty.value=selected&&!row.ambiguous&&mobcloudKey(selected.un||'un.')===mobcloudKey(row.unit)?row.qty:'';return}
  if(row.ambiguous)return;
  var product=S.config.materiais.find(function(m){return m.id===input.value});
  if(mobcloudCountUnit(product)){if(!qty.value)qty.value=row.qty}
  else if(n(qty.value)===row.qty)qty.value='';
}
// Compare material specifications, never piece labels. Missing specifications need review.
function materialIdentity(name){
  var text=mobcloudKey(String(name||'')).replace(/\b(?:frejo|freijo)\b/g,'freijo').replace(/\bhannover\b/g,'hanover')
    .replace(/\bdrtx\b/g,'duratex').replace(/\bvelluto\b/g,'natural').replace(/\bsense\b/g,'puro')
    .replace(/alto\s+brilho/g,'cristallo').replace(/essencial\s+wood/g,' ');
  var mm=text.match(/\b(\d+(?:[.,]\d+)?)\s*mm\b/),dims=text.match(/\b\d{3,4}\s*[x×]\s*\d{3,4}\s*[x×]\s*(\d+(?:[.,]\d+)?)/);
  var thickness=mm?Number(mm[1].replace(',','.')):dims?Number(dims[1].replace(',','.')):0;
  var brand=(text.match(/\b(duratex|guararapes|arauco|berneck|greenplac|eucatex)\b/)||[])[1]||'';
  var substrate=(text.match(/\b(mdf|mdp)\b/)||[])[1]||'';
  var tokens=text.replace(/\d+(?:[.,]\d+)?\s*[x×]\s*\d+(?:[.,]\d+)?(?:\s*[x×]\s*\d+(?:[.,]\d+)?)?/g,' ')
    .replace(/\b\d+(?:[.,]\d+)?\s*mm\b/g,' ').replace(/\b(?:mdf|mdp|bp|chapa|chapas|duratex|guararapes|arauco|berneck|greenplac|eucatex|mm|2f|1f|faces|face|duas|wood|design|linha)\b/g,' ')
    .replace(/[^a-z]+/g,' ').trim().split(/\s+/).filter(Boolean);
  tokens=Array.from(new Set(tokens)).sort();
  return {brand:brand,thickness:thickness,substrate:substrate,tokens:tokens,key:[substrate,brand,thickness,tokens.join(' ')].join(':')};
}
function importMaterialMatches(type,item,items,saved){
  var source=materialIdentity(item.name),normalized=mobcloudMaterialName(item.name);
  var stored=(saved||{})[item.key]||(saved||{})[type+':'+normalized]||(type==='chapas'?(saved||{})[type+':identity:'+source.key]:'');
  var ranked=items.map(function(m){
    var target=materialIdentity(m.nome),conflict=type==='chapas'&&(
      source.brand&&target.brand&&source.brand!==target.brand||source.thickness&&target.thickness&&source.thickness!==target.thickness||
      source.substrate&&target.substrate&&source.substrate!==target.substrate);
    var common=source.tokens.filter(function(t){return target.tokens.includes(t)}).length;
    var same=source.tokens.length>0&&source.tokens.join(' ')===target.tokens.join(' ');
    var exact=mobcloudMaterialName(m.nome)===normalized||m.mobcloud&&mobcloudMaterialName(m.mobcloud)===normalized;
    var compatible=!conflict&&same;
    return {product:m,score:conflict?0:exact?100:compatible?90:common?60*common/Math.max(source.tokens.length,target.tokens.length):0,
      auto:!conflict&&(exact||type==='chapas'&&compatible&&source.thickness>0&&!!target.thickness),remembered:!conflict&&m.id===stored};
  }).filter(function(r){return r.score>0}).sort(function(a,b){return b.score-a.score||a.product.nome.localeCompare(b.product.nome)});
  var learned=ranked.find(function(r){return r.remembered}),automatic=ranked.filter(function(r){return r.auto});
  return {ranked:ranked,mapped:learned?learned.product.id:automatic.length===1?automatic[0].product.id:'',remembered:!!learned};
}
function createImportedMaterial(type,values){
  if(!['chapas','fitas','itens'].includes(type))throw Error('Tipo de material inválido.');
  var name=String(values.nome||'').trim(),price=Number(String(values.preco).replace(',','.'));
  if(!name||name.length>200||String(values.preco).trim()===''||!Number.isFinite(price)||price<=0)throw Error('Informe o nome e um preço maior que zero.');
  var identity=materialIdentity(name),mm=Number(values.espessura)||identity.thickness;
  if(type==='chapas'){
    if(identity.thickness&&mm!==identity.thickness)throw Error('A espessura deve coincidir com a informada no nome.');
    if(!(mm>0&&mm<=100))throw Error('Confirme a espessura em mm no nome ou no campo de espessura.');
    if(!identity.thickness){name+=' '+mm+' mm';identity=materialIdentity(name)}
  }
  var list=S.config[type==='itens'?'materiais':type];
  var existing=list.find(function(m){return type==='chapas'?materialIdentity(m.nome).key===identity.key:mobcloudMaterialName(m.nome)===mobcloudMaterialName(name)});
  if(existing){if(!(n(existing.preco)>0))existing.preco=price;return existing;}
  var m={id:uid(),nome:name,preco:price};
  if(type==='chapas'){m.espessura=mm;m.marca=identity.brand?identity.brand[0].toUpperCase()+identity.brand.slice(1):'Cadastro da oficina';}
  if(type==='fitas'){m.metros=Number(values.metros);if(!(m.metros>0))throw Error('Informe os metros por rolo.');}
  if(type==='itens'){m.un=String(values.un||'').trim();if(!m.un)throw Error('Informe a unidade de compra.');}
  list.push(m);return m;
}
function importQuickCreate(button){
  if(readOnly)return;
  var type=button.dataset.type,index=Number(button.dataset.index),id='mob-'+type+'-'+index;
  try{
    var product=createImportedMaterial(type,{nome:val(id+'-new-name'),preco:val(id+'-new-price'),espessura:val(id+'-new-mm'),metros:val(id+'-new-metres'),un:val(id+'-new-unit')});
    if(!persistState()){toast('Não foi possível gravar o catálogo. Exporte um backup antes de sair.');return}
    var select=$('#'+id),option=Array.from(select.options).find(function(o){return o.value===product.id});
    if(!option){option=document.createElement('option');option.value=product.id;option.textContent=product.nome;select.appendChild(option)}
    option.hidden=false;select.value=product.id;
    if(type==='itens')mobcloudComponentChanged(select,index);
    button.closest('details').open=false;toast('Material disponível no catálogo e selecionado.');
  }catch(e){toast(e.message)}
}
function mobcloudPreview(report){
  ui.mobcloud=report;
  var saved=S.config.mobcloudMap||{};
  function options(type,item,index){
    var items=S.config[type==='itens'?'materiais':type],id='mob-'+type+'-'+index;
    var match=importMaterialMatches(type,item,items,saved),mapped=match.mapped;
    var suggestions=match.ranked.slice(0,6).map(function(r){return r.product});
    var choices=type==='chapas'?null:items.map(function(m){return [m.id,m.nome+(type==='fitas'?' · rolo '+dec(m.metros,0)+' m':' · '+(m.un||'un.'))+' · '+brl(m.preco)]});
    if(type==='itens')choices.push(['__skip__','Não lançar neste rascunho']);
    var qty=type==='fitas'?(item.ambiguous?dec(item.qty,2)+' no PDF, unidade a conferir':dec(item.metros==null?item.qty:item.metros,2)+' m de fita'):
      type==='chapas'?(item.estimated?'Quantidade estimada por área; confira abaixo':item.ambiguous?'Quantidade de chapas a confirmar':item.qty+(item.qty===1?' chapa':' chapas')):'Quantidade no arquivo: '+dec(item.qty,2)+(item.unit?' '+item.unit:'');
    var label={chapas:'Chapa do catálogo',fitas:'Fita do catálogo',itens:'Componente do catálogo'}[type];
    var product=items.find(function(m){return m.id===mapped});
    var confirmation=type==='chapas'?field('Chapas para orçar',id+'-qty',item.estimated||!item.ambiguous?item.qty:'',{type:'number',step:'1'}):type==='fitas'&&item.ambiguous?field('Metros para orçar',id+'-qty','',{type:'number',step:'0.01'}):
      type==='itens'?field('Quantidade na unidade do catálogo',id+'-qty',!item.ambiguous&&(report.origem?product&&mobcloudKey(product.un||'un.')===mobcloudKey(item.unit):mobcloudCountUnit(product))?item.qty:'',{type:'number',step:'any'}):'';
    var picker=type==='chapas'?'<div class="field"><label for="'+id+'">'+label+'</label><select class="in" id="'+id+'"><option value="">Selecione o equivalente</option>'+(suggestions.length?'<optgroup label="Sugestões para este material">'+suggestions.map(function(m){return '<option value="'+esc(m.id)+'"'+(m.id===mapped?' selected':'')+'>'+esc(m.nome+' — '+chapaPrice(m))+'</option>'}).join('')+'</optgroup>':'')+chapaOpts(items.filter(function(m){return !suggestions.some(function(s){return s.id===m.id})}),mapped)+'</select></div>':
      selectF(label,id,mapped,[['','Selecione o equivalente']].concat(choices));
    return '<div class="sec"><p><b>'+esc(item.name)+'</b></p><p class="muted small">'+esc(qty)+'</p>'+
      '<p class="muted small">Material: confiança '+(item.grade||'alta')+'. Quantidade: '+(item.estimated?'estimada, confira':item.ambiguous?'a confirmar':'lida do arquivo')+'.</p>'+
      (item.area?'<p class="muted small">Área identificada: '+dec(item.area,3)+' m². Quantidade estimada por área, sem otimizar o corte. Confira o plano de corte e as perdas.</p>':'')+
      (item.extra?pill('warn','Não incluso na produção'):'')+
      '<p class="muted small">'+(mapped?(match.remembered?'Associação já confirmada em uma importação anterior.':'Equivalente identificado; confira padrão, acabamento e espessura.'):'Confira as sugestões. Marca, acabamento ou espessura ausentes podem exigir escolha manual.')+'</p>'+
      '<div class="field"><label for="'+id+'-search">Buscar no catálogo</label><input class="in" type="search" id="'+id+'-search" data-import-search="'+id+'" placeholder="Nome, marca ou espessura"></div>'+
      '<div class="fgrid">'+picker+confirmation+'</div>'+
      '<details><summary>Não encontrou? Cadastrar este material</summary><p class="muted small">Confira o nome e o custo de compra. O cadastro fica disponível nas próximas importações.</p><div class="fgrid">'+
      field('Nome do material',id+'-new-name',item.name)+field(type==='fitas'?'Preço por rolo (R$)':type==='chapas'?'Preço por chapa (R$)':'Preço por unidade de compra (R$)',id+'-new-price','',{type:'number',step:'0.01'})+
      (type==='chapas'?field('Espessura (mm)',id+'-new-mm',materialIdentity(item.name).thickness||'',{type:'number',step:'any'}):type==='fitas'?field('Metros por rolo',id+'-new-metres','',{type:'number',step:'any'}):field('Unidade de compra',id+'-new-unit',item.unit||'un.'))+
      '</div><button class="btn btn-sm" data-act="importQuickCreate" data-type="'+type+'" data-index="'+index+'">Cadastrar e selecionar</button></details></div>';
  }
  var source={corte:'Plano de corte',orcamento:'Orçamento',combinado:'Orçamento e plano de corte'}[report.tipo];
  openModal({title:'Conferir materiais importados',wide:true,
    body:'<p><b>'+esc(report.arquivo||'Projeto Mobcloud '+report.id)+'</b> · '+esc(source||report.origem)+'</p>'+
      '<p class="muted small">As peças são somadas pelo material usado. Lateral, fundo e outros nomes não viram itens de compra.</p>'+
      (report.chapas.some(function(r){return r.estimated})?'<div class="sec"><h2>Estimativa de chapas</h2><div class="fgrid">'+field('Comprimento da chapa (mm)','material-sheet-c',2750,{type:'number',step:'any'})+field('Largura da chapa (mm)','material-sheet-l',1850,{type:'number',step:'any'})+field('Aproveitamento estimado (%)','material-sheet-use',85,{type:'number',step:'any'})+'</div><button class="btn btn-sm" data-act="materialRecalc">Recalcular quantidades estimadas</button><p class="muted small">A estimativa por área não garante que as peças caibam no corte. Para materiais de tamanhos diferentes, ajuste cada quantidade abaixo conforme o plano.</p></div>':'')+
      (report.semMaterial?'<p class="alert warn">Há linhas sem material identificado. Elas não entram nesta lista; confira os materiais ausentes com o projetista.</p>':'')+
      (report.producao||report.venda?'<p class="muted small">Referência do PDF: produção '+esc(report.producao||'—')+' · venda '+esc(report.venda||'—')+'. O preço do rascunho usa o catálogo do Bancada.</p>':'')+
      '<p class="muted small">Associe cada material ao catálogo do Bancada. Busque por nome, marca ou espessura. Se faltar um equivalente, cadastre aqui mesmo.</p>'+
      report.chapas.map(function(row,i){return options('chapas',row,i)}).join('')+report.fitas.map(function(row,i){return options('fitas',row,i)}).join('')+
      report.itens.map(function(row,i){return options('itens',row,i)}).join('')+
      '<label class="chk"><input type="checkbox" id="mob-estimate"'+(ui.importDraft&&(n(ui.importDraft.horasOficina)||n(ui.importDraft.horasInstalacao))?'':' checked')+'> Sugerir horas de oficina e instalação pelas chapas</label>'+
      '<p class="muted small">Confira ferragens, insumos e eventuais serviços terceirizados no rascunho.</p>',
    foot:'<button class="btn" data-act="mobcloudCatalog">Abrir catálogo</button><button class="btn btn-primary" data-act="mobcloudApply">'+(ui.importDraft?'Importar para este orçamento':'Criar rascunho')+'</button>'});
}
async function openMobcloudFile(input){
  var files=Array.from(input.files),status=$('#mobcloud-status');
  if(!files.length||!status||readOnly)return;
  if(files.length>2){status.textContent='Escolha um arquivo ou dois PDFs Mobcloud do mesmo projeto.';input.value='';return}
  input.disabled=true;status.textContent=files.length===2?'Lendo os arquivos…':'Detectando o formato e lendo os materiais…';
  try{
    var results=[];
    for(var file of files)results.push(await readProjectFile(file));
    if($('#mobcloud-file')===input)reviewProjectImport(results);
  }catch(e){
    if($('#mobcloud-file')===input){
      var message=String(e.message||'');
      status.textContent=/^(Não consegui ler|Não encontrei|Escolha|Envie|Exporte|O plano|O XML|O PDF|Um dos|A soma|Os PDFs|As listas)/.test(message)?
        message:'Não consegui abrir o arquivo. Confira a exportação do projetista.';
      input.value='';input.disabled=false;
    }
  }
}
function applyMobcloud(){
  var data=ui.mobcloud;if(!data||readOnly)return;
  var d=importedDraftBase(),mapped={},skipped=0;
  for(var type of ['chapas','fitas','itens']){
    var catalog=S.config[type==='itens'?'materiais':type],matches=new Map();
    for(var i=0;i<data[type].length;i++){
      var source=data[type][i],fieldId='mob-'+type+'-'+i,id=val(fieldId);
      if(type==='itens'&&id==='__skip__'){skipped++;continue}
      var product=catalog.find(function(m){return m.id===id});
      if(!product||type==='fitas'&&n(product.metros)<=0){toast('Associe os materiais e componentes aos itens do catálogo.');return}
      var qty=type==='chapas'?n(val(fieldId+'-qty')):type==='fitas'&&!source.ambiguous?(source.metros==null?source.qty:source.metros):n(val(fieldId+'-qty'));
      if(!Number.isFinite(qty)||qty<=0||type==='chapas'&&!Number.isSafeInteger(qty)){toast('Confira a quantidade de '+source.name+'.');return}
      mapped[source.key]=mapped[type+':'+mobcloudMaterialName(source.name)]=id;
      if(type==='chapas')mapped[type+':identity:'+materialIdentity(source.name).key]=id;
      matches.set(id,(matches.get(id)||0)+qty);
    }
    d[type]=Array.from(matches,function(pair){
      var length=type==='fitas'?n(S.config.fitas.find(function(f){return f.id===pair[0]}).metros):1;
      return {id:pair[0],qtd:type==='fitas'?Math.ceil(pair[1]/length-1e-9):pair[1]};
    });
  }
  S.config.mobcloudMap=Object.assign({},S.config.mobcloudMap,mapped);
  var estimate=$('#mob-estimate').checked;
  if(!String(d.titulo||'').trim())d.titulo=data.arquivo?data.arquivo.replace(/\.[^.]+$/,''):'Projeto Mobcloud '+data.id;
  delete d.mobcloud;delete d.importacaoMateriais;delete d.pecasImportadas;delete d.origemPecas;
  if(!data.origem)d.mobcloud={id:data.id,tipo:data.tipo,estimarHoras:estimate,componentes:data.itens.length,omitidos:skipped};
  else d.importacaoMateriais={arquivo:data.arquivo,formato:data.origem};
  if(estimate){var hours=sugHoras(d);d.horasOficina=hours.of;d.horasInstalacao=hours.inst}
  ui.mobcloud=null;openImportedDraft(d);
}
function viewQuote(id){
  var q=quote(id);if(!q)return;var c=q.proposta?q.proposta.calc:calcQuote(q);var C=S.config;
  var aprovado=q.status==='aprovado'&&q.obraId&&obra(q.obraId);
  var conds=q.proposta?q.proposta.condicoes:q.condicoes.map(forma).filter(Boolean).map(function(f){return calcCond(c,f)});
  var nChapas=(q.chapas||[]).reduce(function(a,r){return a+n(r.qtd)},0);
  normQ(q);var nItens=(q.itens||[]).filter(function(r){return n(r.qtd)>0}).length;
  var info=q.status==='enviado'?'Enviado em '+fd(q.enviadoEm)+' · válido até '+fd(validaAte(q)):q.status==='rascunho'?'Rascunho criado em '+fd(q.criadoEm):q.status==='aprovado'?'Aprovado em '+fd(q.aprovadoEm):'Perdido por '+esc((q.motivoPerda||'—').toLowerCase());
  var foot=[quoteActions(q)];
  if(q.status!=='aprovado'&&!approvedRevision(q))foot.push('<button class="btn" data-act="editQuote" data-id="'+id+'">Editar</button>');
  if(!quoteDeleteReason(q))foot.push('<button class="btn btn-ghost" data-act="deleteQuote" data-id="'+id+'">Excluir orçamento</button>');
  if((q.status==='rascunho'||q.status==='enviado')&&!approvedRevision(q)){
    foot.push('<button class="btn btn-ghost" data-act="loseQuote" data-id="'+id+'" style="margin-right:auto">Perdido</button>');

    foot.push('<button class="btn" data-act="showProposal" data-id="'+id+'">Proposta</button>');
    if(q.status==='rascunho')foot.push('<button class="btn btn-brown" data-act="sendQuote" data-id="'+id+'">Marcar como enviado</button>');
    foot.push('<button class="btn btn-primary" data-act="approveQuote" data-id="'+id+'">Aprovar</button>');
  }else if(q.status==='perdido'&&!approvedRevision(q)){
    foot.push('<button class="btn btn-primary" data-act="reviseQuote" data-id="'+id+'">Reabrir como revisão</button>');
  }else if(aprovado){
    if(q.proposta)foot.push('<button class="btn" data-act="showProposal" data-id="'+id+'">Proposta</button>');
    foot.push('<button class="btn" data-act="openQuote" data-id="'+id+'">Ver detalhes</button><button class="btn btn-primary" data-act="openObra" data-id="'+q.obraId+'">Ver projeto</button>');
  }
  openModal({title:(q.titulo||'Sem título'),wide:true,body:
    '<div class="actions" style="justify-content:space-between"><div><b>'+esc(nomeQ(q))+'</b> <span class="muted">'+esc((q.contato&&q.contato.telefone)||'')+'</span><div class="muted small">'+info+'</div></div>'+pill(q.status)+'</div>'+
    (q.status==='enviado'?(q.proposta?'<div class="alert info">Condições arquivadas no envio. Para alterar, crie uma revisão.</div>':'<div class="alert warn">Enviado antes do arquivamento. Compare a prévia com a proposta original.</div>'):'')+
    (!aprovado&&approvedRevision(q)?'<div class="alert info">Outra versão deste orçamento já foi aprovada.</div>':'')+
    (c.valido?'<div class="kv"><div><span>Custo</span><b>'+brl0(c.custo)+'</b></div><div><span>'+(aprovado?'Fechado por':'Preço')+'</span><b>'+brl0(aprovado?aprovado.valor:c.preco)+'</b></div><div><span>Lucro da empresa</span><b style="color:var(--ok)">'+brl0(aprovado?aprovado.sobra:c.sobra)+'</b></div><div><span>Margem</span><b>'+pct(c.margem)+'</b></div></div>':'<div class="alert warn">Este orçamento ainda não tem preço. Abra para editar.</div>')+
    (precoMudou(q)?'<div class="alert warn">Algum custo mudou depois que este orçamento foi salvo. Salvo por '+brl0(q.precoSalvo)+', hoje sai por '+brl0(c.preco)+'.</div>':'')+
    (c.margem<n(C.margemMinima)&&c.valido?'<div class="alert bad">Margem abaixo da mínima de '+pct(C.margemMinima)+'.</div>':'')+
    '<div class="grid2"><div><h3 style="margin-bottom:6px">O que entra</h3><p class="small">'+dec(nChapas,0)+' chapa'+(nChapas===1?'':'s')+' · '+dec(c.fitaRolos,0)+' rolo'+(c.fitaRolos===1?'':'s')+' de fita · '+dec(nItens,0)+' ite'+(nItens===1?'m':'ns')+' de ferragem e insumos · '+dec(c.horas,0)+' h de mão de obra ('+dec(c.horas/horasDia(),1)+' dias de uma pessoa)'+(c.terceiros?' · terceiros '+brl0(c.terceiros):'')+(c.rt?' · RT '+pct(c.rt*100):'')+'</p>'+
    '<p class="small" style="margin-top:10px;color:var(--brown)"><b>Material × N:</b> o preço equivale a material × '+dec(c.nEq,1)+'. A referência é × '+dec(c.N)+'.</p></div>'+
    '<div><h3 style="margin-bottom:6px">Condições na proposta</h3>'+(conds.length?'<table class="conds">'+conds.map(function(x){var l=condLabel(x);return '<tr><td>'+esc(x.forma.nome)+(l?'<br><span class="muted small">'+l+'</span>':'')+'</td><td class="r"><b>'+brl0(x.preco)+'</b></td></tr>'}).join('')+'</table>':'<p class="muted small">Nenhuma forma marcada.</p>')+'</div></div>'+
    (q.obs?'<div><h3 style="margin-bottom:6px">Observações</h3><p class="small">'+esc(q.obs)+'</p></div>':''),
    foot:foot.join('')});
}

function newDraft(clienteId){
  var C=S.config;var cl=clienteId&&cliente(clienteId);
  return {id:uid(),numero:null,clienteId:cl?cl.id:null,contato:clientContact(cl),titulo:'',status:'rascunho',criadoEm:today(),enviadoEm:null,
    chapas:[{id:C.chapas[0]?C.chapas[0].id:'',qtd:1}],fitas:C.fitas[0]?[{id:C.fitas[0].id,qtd:1}]:[],itens:[],outros:0,horasOficina:0,horasInstalacao:0,pessoas:C.pessoasProjeto||2,terceiros:0,frete:0,
    reservaPct:C.reserva,rtNome:'',rtPct:0,respostas:{},margemManual:'',entradaPct:30,entradaParcelas:5,condicoes:(function(){var w=['pix','entrada','cred10'].filter(function(id){return forma(id)});return w.length?w:C.formas.slice(0,3).map(function(f){return f.id})})(),validade:C.validade,obs:'',motivoPerda:'',retomarEm:'',precoSalvo:0};
}
function proposalItemsForm(d){
  var rows=(d.entregas||[]).map(function(item,i){
    var name='entrega-'+i;
    return '<fieldset class="field scope-item"><legend>Item '+(i+1)+'</legend><div class="fgrid">'+
      '<div class="field"><label for="'+name+'">O que será entregue</label><input class="in" id="'+name+'" data-delivery="'+i+'" data-key="nome" value="'+esc(item.nome)+'" placeholder="Ex.: Armário superior"></div>'+
      (d.valorarEntregas?'<div class="field"><label for="'+name+'-valor">Valor total do item (R$)</label><input class="in r" type="number" min="0" step="0.01" id="'+name+'-valor" data-delivery="'+i+'" data-key="valor" value="'+esc(item.valor)+'"></div>':'')+
      '</div><div class="field"><label for="'+name+'-descricao">Medidas, materiais ou acabamento</label><textarea class="in" id="'+name+'-descricao" data-delivery="'+i+'" data-key="descricao">'+esc(item.descricao)+'</textarea></div>'+
      '<button class="btn btn-sm btn-ghost" data-act="removeDelivery" data-i="'+i+'" aria-label="Remover item '+(i+1)+'">Remover item</button></fieldset>';
  }).join('');
  return '<div class="sec"><div class="sec-h"><h2>Entregas por item</h2><span class="muted">Opcional</span></div>'+
    (rows?'<label class="chk"><input type="checkbox" id="ed-valorarItens" data-f="valorarEntregas"'+(d.valorarEntregas?' checked':'')+'> Mostrar valor por item na proposta</label>'+
      (d.valorarEntregas?'<div class="field"><label for="ed-valorEntregasForma">Condição de referência para os valores por item</label><select class="in" id="ed-valorEntregasForma" data-f="valorEntregasForma"><option value="">Selecione uma condição</option>'+d.condicoes.map(forma).filter(Boolean).map(function(f){return '<option value="'+f.id+'"'+(f.id===d.valorEntregasForma?' selected':'')+'>'+esc(f.nome)+'</option>'}).join('')+'</select><p class="muted small" id="delivery-total"></p></div>':'')+rows:'')+
    '<button class="btn btn-sm" data-act="addDelivery">+ Adicionar entrega</button></div>';
}
function laborForm(d){
  var C=S.config,resources=laborResources(C,oficina());
  var rows=(d.maoLancamentos||[]).map(function(row,i){
    var path='maoLancamentos.'+i+'.',id='mao-'+i;
    var people=resources.people.map(function(p){
      var rate=p.hour==null?'custo a configurar':p.inOverhead?'pró-labore no rateio':brl(p.hour)+'/h';
      return [p.id,p.nome+' · '+rate];
    });
    if(row.pessoa&&row.pessoa!=='manual'&&!people.some(function(p){return p[0]===row.pessoa}))people.push([row.pessoa,'Profissional indisponível']);
    people.push(['manual','Valor por hora manual']);
    function select(label,key,value,options){
      return '<div class="field"><label for="'+id+'-'+key+'">'+label+'</label><select class="in" id="'+id+'-'+key+'" data-f="'+path+key+'">'+
        options.map(function(o){return '<option value="'+esc(o[0])+'"'+(o[0]===value?' selected':'')+'>'+esc(o[1])+'</option>'}).join('')+'</select></div>';
    }
    return '<fieldset class="field scope-item"><legend>Lançamento '+(i+1)+'</legend><div class="fgrid">'+
      select('Etapa','etapa',row.etapa,LABOR_STAGES.map(function(stage){return [stage,stage]}))+
      select('Profissional','pessoa',row.pessoa,people)+
      '<div class="field"><label for="'+id+'-horas">Horas de uma pessoa</label><input id="'+id+'-horas" class="in r" type="number" min="0" step="any" data-f="'+path+'horas" value="'+esc(row.horas)+'"></div>'+
      (row.pessoa==='manual'?'<div class="field"><label for="'+id+'-valor">Custo direto por hora (R$)</label><input id="'+id+'-valor" class="in r" type="number" min="0" step="0.01" data-f="'+path+'valorHora" value="'+esc(row.valorHora)+'"></div>':'')+
      '</div><div class="actions"><button class="btn btn-sm btn-ghost" data-act="laborDel" data-i="'+i+'" aria-label="Remover lançamento '+(i+1)+'">Remover</button><span class="muted small" data-labor-total="'+i+'"></span></div></fieldset>';
  }).join('');
  return '<p class="muted small">Registre uma linha por etapa e profissional. Duas pessoas por 4 horas representam 8 horas de trabalho.</p>'+rows+
    '<button class="btn btn-sm" data-act="laborAdd">+ Adicionar etapa</button>'+
    '<div class="field" style="margin-top:14px"><label for="ed-rateioModo">Rateio dos custos da oficina</label><select class="in" id="ed-rateioModo" data-f="rateioModo"><option value="horas">Por hora produtiva</option><option value="dias"'+(d.rateioModo==='dias'?' selected':'')+'>Por dia de ocupação exclusiva</option></select></div>'+
    (d.rateioModo==='dias'?'<div class="field"><label for="ed-diasOficina">Dias que o projeto ocupa a oficina</label>'+numIn('diasOficina',d.diasOficina,' min="0"')+'</div><p class="muted small">Use quando o projeto bloquear a capacidade da oficina nesses dias.</p>':'')+
    '<div id="labor-info"></div>';
}
function areaProfitForm(d){
  var c=calcQuote(d),labels={material:'Material',maoObra:'Mão de obra',empresa:'Empresa'};
  return '<div class="sec"><h2>Lucro sobre cada custo</h2><p class="muted small">De 0% a 100% sobre o custo de cada área. Um acréscimo de 100% dobra aquele custo; não é uma margem de 100% sobre o preço de venda. Terceiros e frete entram pelo custo, sem acréscimo.</p><div class="scroll"><table class="tbl"><thead><tr><th>Área</th><th class="r">Custo</th><th>Lucro sobre o custo (%)</th><th class="r">Lucro em reais</th></tr></thead><tbody>'+
    ['material','maoObra','empresa'].map(function(key){return '<tr><td>'+labels[key]+'</td><td class="r" data-area-cost="'+key+'">'+brl(c.custosAreas[key])+'</td><td><input class="in r" type="number" min="0" max="100" step="0.5" data-f="lucros.'+key+'" id="ed-lucro-'+key+'" aria-label="Lucro sobre '+labels[key].toLowerCase()+' (%)" value="'+esc((d.lucros||{})[key])+'"></td><td class="r" data-area-profit="'+key+'">'+brl(c.lucroAreas[key])+'</td></tr>'}).join('')+'</tbody></table></div><p class="muted small">Impostos e comissão são calculados por fora desses custos e lucros. Na etapa Pagamento, taxas e descontos mostram o lucro que efetivamente sobra.</p></div>';
}
function diasRound(h){var v=n(h)/horasDia();return h===''||h==null?'':String(Math.round(v*100)/100)}
function diasIn(f,h){return '<input class="in r" type="number" step="any" min="0" inputmode="decimal" data-dias="'+f+'" id="ed-dias-'+f+'" value="'+esc(diasRound(h))+'">'}
function numIn(f,v,extra){return '<input class="in r" type="number" step="any" inputmode="decimal" data-f="'+f+'" id="ed-'+f.replace('.','-')+'" value="'+esc(v)+'"'+(extra||'')+'>'}
var STEPS=['Cliente','Materiais','Mão de obra','Valor','Pagamento','Revisar'];
function vEditor(){
  var d=ui.draft,C=S.config;normQ(d);d.descontos=d.descontos||{};var isNew=!quote(d.id);var locked=d.status==='aprovado';
  var st=locked?5:Math.min(Math.max(ui.step||0,0),5);ui.step=st;
  var cOpts=[['','— Cliente novo —']].concat(S.clientes.map(function(c){return [c.id,c.nome]}));
  var sec='';
  if(st===0){
    sec='<div class="sec"><div class="sec-h"><h2>Para quem é e o que vai ser feito</h2></div>'+
    '<div class="field"><label for="ed-clienteId">Já é cliente?</label><select class="in" id="ed-clienteId" data-f="clienteId">'+cOpts.map(function(o){return '<option value="'+o[0]+'"'+(String(d.clienteId||'')===o[0]?' selected':'')+'>'+esc(o[1])+'</option>'}).join('')+'</select></div>'+
    '<div class="fgrid"><div class="field"><label for="ed-contato-nome">Nome</label><input class="in" id="ed-contato-nome" data-f="contato.nome" value="'+esc(d.contato.nome)+'"'+(d.clienteId?' readonly':'')+'></div>'+
    '<div class="field"><label for="ed-contato-telefone">WhatsApp</label><input class="in" id="ed-contato-telefone" data-f="contato.telefone" value="'+esc(d.contato.telefone)+'"'+(d.clienteId?' readonly':'')+'></div></div>'+
    '<div class="fgrid"><div class="field"><label for="ed-contato-email">E-mail</label><input class="in" type="email" id="ed-contato-email" data-f="contato.email" value="'+esc(d.contato.email||'')+'"></div><div class="field"><label for="ed-contato-endereco">Endereço de instalação</label><input class="in" id="ed-contato-endereco" data-f="contato.endereco" value="'+esc(d.contato.endereco||'')+'" placeholder="Rua, número, bairro, cidade e CEP"></div></div>'+
    '<div id="dup-hint"></div><div class="field"><label for="ed-titulo">Nome do projeto</label><input class="in" id="ed-titulo" data-f="titulo" placeholder="Ex.: Cozinha planejada com ilha" value="'+esc(d.titulo)+'"></div><div class="actions"><button class="btn" data-act="importIntoDraft">Importar materiais do projeto</button></div><p class="muted small">Preencha o cliente e importe o arquivo neste mesmo orçamento.</p></div>';
  }else if(st===1){
    var chRows=(d.chapas||[]).map(function(r,i){
      var missing=r.id&&!C.chapas.some(function(m){return m.id===r.id})?'<option selected disabled>Selecione uma chapa do catálogo</option>':'';
      return '<div class="rowform"><select class="in" data-row="chapas" data-i="'+i+'" data-k="id" aria-label="Chapa">'+missing+chapaOpts(C.chapas,r.id)+'</select><input class="in r" type="number" step="any" min="0" data-row="chapas" data-i="'+i+'" data-k="qtd" value="'+esc(r.qtd)+'" aria-label="Quantidade de chapas"><span class="sub" data-sub="chapas" data-i="'+i+'"></span><button class="icon-btn" data-act="delRow" data-row="chapas" data-i="'+i+'" aria-label="Remover chapa">×</button></div>';
    }).join('');
    var fRows=(d.fitas||[]).map(function(r,i){return '<div class="rowform"><select class="in" data-row="fitas" data-i="'+i+'" data-k="id" aria-label="Fita de borda">'+C.fitas.map(function(f){return '<option value="'+f.id+'"'+(f.id===r.id?' selected':'')+'>'+esc(f.nome)+' · rolo de '+dec(f.metros,0)+' m — '+brl(f.preco)+'</option>'}).join('')+'</select><input class="in r" type="number" step="1" min="0" data-row="fitas" data-i="'+i+'" data-k="qtd" value="'+esc(r.qtd)+'" aria-label="Quantidade de rolos"><span class="sub" data-sub="fitas" data-i="'+i+'"></span><button class="icon-btn" data-act="delRow" data-row="fitas" data-i="'+i+'" aria-label="Remover fita">×</button></div>'}).join('');
    var iRows=(d.itens||[]).map(function(r,i){return '<div class="rowform"><select class="in" data-row="itens" data-i="'+i+'" data-k="id" aria-label="Material">'+matOpts(r.id)+'</select><input class="in r" type="number" step="any" min="0" data-row="itens" data-i="'+i+'" data-k="qtd" value="'+esc(r.qtd)+'" aria-label="Quantidade"><span class="sub" data-sub="itens" data-i="'+i+'"></span><button class="icon-btn" data-act="delRow" data-row="itens" data-i="'+i+'" aria-label="Remover item">×</button></div>'}).join('');
    var head='<div class="rowform head"><span>Material</span><span style="text-align:right">Qtd.</span><span style="text-align:right">Subtotal</span><span></span></div>';
    sec='<div class="sec"><button class="btn" data-act="importIntoDraft">Importar materiais do projeto</button></div>'+(d.mobcloud?'<div class="sec"><p class="muted small">Projeto Mobcloud '+esc(d.mobcloud.id)+(d.mobcloud.pecas==null?'':' · '+esc(d.mobcloud.pecas)+' peças')+'. Confira ferragens e insumos antes de calcular.'+
      (d.mobcloud.omitidos?' '+esc(d.mobcloud.omitidos)+' componentes do PDF ficaram fora do rascunho.':'')+'</p></div>':'')+
    '<div class="sec"><div class="sec-h"><h2>Chapas</h2><span class="muted">Quantas chapas inteiras vão ser compradas</span></div><div class="rows">'+head+chRows+'</div><button class="btn btn-sm add" data-act="addRow" data-row="chapas">+ Adicionar chapa</button></div>'+
    '<div class="sec"><div class="sec-h"><h2>Fita de borda</h2><span class="muted">Cobrada pelo rolo inteiro</span></div><div class="rows">'+(fRows?head.replace('Material','Fita').replace('Qtd.','Rolos')+fRows:'<span class="muted small">Nenhuma fita adicionada.</span>')+'</div><p class="muted small" id="fita-hint" style="margin:8px 0 0"></p><button class="btn btn-sm add" data-act="addRow" data-row="fitas">+ Adicionar fita</button></div>'+
    '<div class="sec"><div class="sec-h"><h2>Ferragens e insumos</h2><span class="muted">Item por item, na quantidade de cada um</span></div><div class="rows">'+(iRows?head+iRows:'<span class="muted small">Nenhum item adicionado.</span>')+'</div>'+
    '<div class="actions" style="margin-top:10px;flex-wrap:wrap"><button class="btn btn-sm add" style="margin-top:0" data-act="findMaterial">+ Buscar e adicionar item</button>'+((C.kits||[]).length?'<span class="kit-pick"><select class="in" id="kit-pick" aria-label="Atalho de kit"><option value="">Atalho: incluir um kit…</option>'+C.kits.map(function(k){return '<option value="'+k.id+'">'+esc(k.nome)+'</option>'}).join('')+'</select><button class="btn btn-sm" data-act="addKit">Incluir</button></span>':'')+'</div>'+
    '<div class="sum-line" id="itens-total"></div></div>'+
    '<div class="sec"><div class="fgrid"><div class="field"><label for="ed-outros">Outros materiais (R$)</label>'+numIn('outros',d.outros)+'</div><div class="field"><label for="ed-reservaPct">Reserva para perdas (%)</label>'+numIn('reservaPct',d.reservaPct)+'</div></div></div>';
  }else if(st===2){
    var detailed=d.maoModo==='etapas';
    var quick='<div class="sugg" id="sugg"></div><div class="fgrid">'+
    '<div class="field"><label for="ed-horasOficina">Horas na oficina</label>'+numIn('horasOficina',d.horasOficina)+'</div>'+
    '<div class="field"><label for="ed-dias-horasOficina">ou dias na oficina</label>'+diasIn('horasOficina',d.horasOficina)+'</div>'+
    '<div class="field"><label for="ed-horasInstalacao">Horas de instalação</label>'+numIn('horasInstalacao',d.horasInstalacao)+'</div>'+
    '<div class="field"><label for="ed-dias-horasInstalacao">ou dias de instalação</label>'+diasIn('horasInstalacao',d.horasInstalacao)+'</div></div>'+
    '<p class="small muted">Horas e dias se convertem sozinhos. Um dia equivale a '+dec(horasDia(),0)+' h de uma pessoa.</p>';
    sec='<div class="sec"><div class="sec-h"><h2>Horas de trabalho</h2><span class="muted" id="ch-hint"></span></div>'+
    '<div class="seg" style="margin-bottom:12px"><button class="'+(!detailed?'on':'')+'" data-act="laborMode" data-mode="rapido" aria-pressed="'+!detailed+'">Estimativa rápida</button><button class="'+(detailed?'on':'')+'" data-act="laborMode" data-mode="etapas" aria-pressed="'+detailed+'">Por etapa e profissional</button></div>'+
    (detailed?laborForm(d):quick)+
    '<div class="fgrid"><div class="field"><label for="ed-pessoas">Pessoas trabalhando no projeto</label>'+numIn('pessoas',isAuto(d.pessoas)?pessoasDe(d):d.pessoas,' min="1" step="1"')+'</div></div>'+
    '<p class="small muted" id="dias-info"></p></div>'+
    '<div class="sec"><h2>Terceiros e frete</h2><div class="fgrid">'+
    '<div class="field"><label for="ed-terceiros">Terceiros: vidro, pintura, pedra (R$)</label>'+numIn('terceiros',d.terceiros)+'</div>'+
    '<div class="field"><label for="ed-frete">Frete e deslocamento (R$)</label>'+numIn('frete',d.frete)+'</div></div></div>'+
    '<div class="sec"><div class="sec-h"><h2>Comissão de arquiteto</h2><span class="muted">Deixe zerado se não houver</span></div><div class="fgrid"><div class="field"><label for="ed-rtNome">Nome</label><input class="in" id="ed-rtNome" data-f="rtNome" value="'+esc(d.rtNome)+'"></div><div class="field"><label for="ed-rtPct">RT (%)</label>'+numIn('rtPct',d.rtPct)+'</div></div></div>';
  }else if(st===3){
    var qs=Q.map(function(qq){var cur=(d.respostas||{})[qq.id]||0;return '<div class="q"><span class="qt">'+esc(qq.t)+'</span><div class="qopts" role="radiogroup" aria-label="'+esc(qq.t)+'">'+qq.o.map(function(o,i){var w=(C.pesos[qq.id]||[])[i]||0;return '<label class="qopt"><input type="radio" name="q-'+qq.id+'" data-q="'+qq.id+'" value="'+i+'"'+(cur===i?' checked':'')+'><span>'+esc(o)+(w?' <em>'+(w>0?'+':'−')+Math.abs(w)+'%</em>':'')+'</span></label>'}).join('')+'</div></div>'}).join('');
    sec='<div class="sec"><div class="sec-h"><h2>Quanto vale este projeto</h2><span class="muted">Ajusta a margem pelo que não está na lista de material</span></div>'+qs+
    '<div class="marg"><div><span class="lbl">Margem sugerida</span><div class="big" id="marg-sug"></div><span class="muted small" id="marg-base"></span></div><div class="field" style="width:170px"><label for="ed-margemManual">Usar outra margem (%)</label>'+numIn('margemManual',d.margemManual,' placeholder="automática"')+'</div></div></div>';
  }else if(st===4){
    var conds=C.formas.map(function(f){var on=d.condicoes.indexOf(f.id)>=0;return '<label class="chk"><input type="checkbox" data-cond="'+f.id+'"'+(on?' checked':'')+'> '+esc(f.nome)+(n(f.taxa)?' <span class="muted small">taxa '+pct(f.taxa)+'</span>':'')+(hasDesc(f)||descOf(d,f)?' <span class="muted small" data-dl="'+f.id+'">'+(descOf(d,f)?'desconto '+pct(descOf(d,f)):'')+'</span>':'')+'</label>'+(hasDesc(f)&&on?'<div class="entrada-box"><div class="field"><label for="ed-descontos-'+f.id+'">Desconto (%)</label>'+numIn('descontos.'+f.id,descOf(d,f))+'</div><p data-descp="'+f.id+'"></p></div>':'')+(f.tipo==='entrada'&&on?'<div class="entrada-box"><div class="field"><label for="ed-entradaPct">Entrada (%)</label>'+numIn('entradaPct',isAuto(d.entradaPct)?30:d.entradaPct)+'</div><div class="field"><label for="ed-entradaParcelas">Restante em</label>'+numIn('entradaParcelas',isAuto(d.entradaParcelas)?5:d.entradaParcelas)+'</div><p id="entrada-desc"></p></div>':'')}).join('');
    sec='<div class="sec"><div class="sec-h"><h2>Formas de pagamento oferecidas</h2></div><div class="conds-pick">'+conds+'</div><div id="entrada-cx"></div><div id="ed-price-comparison"></div></div>'+
    '<div class="sec"><div class="sec-h"><h2>Prazo e validade</h2></div><div class="fgrid"><div class="field"><label for="ed-prazoDias">Prazo de execução</label><input class="in r" id="ed-prazoDias" type="number" inputmode="numeric" min="30" step="1" list="prazo-opcoes" data-f="prazoDias" value="'+esc(d.prazoDias)+'" placeholder="Ex.: 30 ou 45" required><datalist id="prazo-opcoes"><option value="30"><option value="45"></datalist></div>'+
    '<div class="field"><label for="ed-prazoUnidade">Contagem do prazo</label><select class="in" id="ed-prazoUnidade" data-f="prazoUnidade"><option value="uteis">Dias úteis</option><option value="corridos"'+(d.prazoUnidade==='corridos'?' selected':'')+'>Dias corridos</option></select></div>'+
    '<div class="field"><label for="ed-validade">Validade da proposta (dias)</label>'+numIn('validade',d.validade)+'</div></div><p class="muted small">Mínimo de 30 dias. Informe o prazo prometido ao cliente a partir da aprovação do projeto final.</p>'+
    '<div class="field"><label for="ed-obs">Observações para o cliente</label><textarea class="in" id="ed-obs" data-f="obs" placeholder="Prazo de produção, o que está incluso, o que não está">'+esc(d.obs)+'</textarea></div></div>';
  }
  var stepper='<ol class="stepper" aria-label="Etapas do orçamento">'+STEPS.map(function(s,i){return '<li><button data-act="step" data-s="'+i+'" class="'+(i===st?'on':i<st?'done':'')+'"'+(i===st?' aria-current="step"':'')+'><span class="sn">'+(i+1)+'</span>'+s+'</button></li>'}).join('')+'</ol>';
  var nav='<div class="step-nav">'+(st>0?'<button class="btn" data-act="step" data-s="'+(st-1)+'">← '+STEPS[st-1]+'</button>':'<span></span>')+(st<5?'<button class="btn btn-primary" data-act="step" data-s="'+(st+1)+'">Próximo: '+STEPS[st+1]+' →</button>':'')+'</div>';
  var head='<div class="page-head"><div><button class="btn btn-sm btn-ghost" data-act="backQuotes" style="margin:0 0 6px -10px">← Orçamentos</button><h1>'+esc(d.titulo||'Novo orçamento')+'</h1><p><span id="draft-status">'+(isNew?'Salvo automaticamente ao editar':'Criado em '+fd(d.criadoEm))+'</span> · '+pill(d.status)+'</p></div><div class="actions">'+(!locked?'<button class="btn" data-act="saveQuote">Salvar</button>'+(!quoteDeleteReason(d)?'<button class="btn btn-ghost" data-act="deleteQuote" data-id="'+d.id+'">Excluir orçamento</button>':''):'')+'</div></div>';
  if(st===5)return head+stepper+'<div id="review">'+reviewHTML(d)+'</div>'+nav;
  return head+stepper+'<div class="editor"><div class="card" id="ed-form">'+sec+nav.replace('step-nav','step-nav sec')+'</div><aside class="summary" id="summary"></aside></div>';
}
function sideHTML(d){
  var c=calcQuote(d),C=S.config;
  if(c.erro)return '<div class="card"><div class="brk"><p class="alert warn">'+esc(c.erro)+'</p></div></div>';
  if(!c.valido)return '<div class="card"><div class="bigs"><div><span class="k">Custo</span><span class="big">'+brl0(c.custo)+'</span></div></div><div class="brk"><div class="alert warn">'+(c.custo>0?'Imposto, comissão e margem passaram do limite. Reduza a margem.':'Preencha materiais e horas para ver o preço.')+'</div></div></div>';
  return '<div class="card"><div class="bigs"><div><span class="k">Custo</span><span class="big">'+brl0(c.custo)+'</span></div><div class="hl"><span class="k">Preço</span><span class="big">'+brl0(c.preco)+'</span></div><div><span class="k">Lucro da empresa</span><span class="big" style="color:var(--ok)">'+brl0(c.sobra)+'</span></div></div>'+
  '<div class="brk"><div><span>Material</span><span>'+brl0(c.material)+'</span></div><div><span>Mão de obra</span><span>'+brl0(c.maoObra)+'</span></div><div><span>Terceiros e frete</span><span>'+brl0(c.terceiros+c.frete)+'</span></div><div><span>Margem</span><span>'+pct(c.margem)+'</span></div>'+
  '<div style="color:var(--brown)"><span>Material × N</span><span>× '+dec(c.nEq,1)+' <span class="muted">(ref. × '+dec(c.N)+')</span></span></div>'+
  (c.margem<n(C.margemMinima)?'<div class="alert bad">Margem abaixo da mínima de '+pct(C.margemMinima)+'.</div>':'')+'</div></div>';
}
function reviewHTML(d){
  var c=d.proposta?d.proposta.calc:calcQuote(d),C=S.config;var locked=d.status==='aprovado';
  if(!c.valido&&c.custo<=0)return '<div class="alert warn">'+esc(c.erro||(c.labor||{}).erro||'Ainda falta informação para calcular o preço. Volte e preencha materiais e horas.')+'</div>';
  var acts=[];
  if(!locked){
    acts.push('<button class="btn" data-act="saveQuote">Salvar</button>');
    acts.push('<button class="btn" data-act="showProposal">Ver proposta</button>');
    if(d.status==='rascunho')acts.push('<button class="btn btn-brown" data-act="sendQuote">Marcar como enviado</button>');
    if(d.status==='rascunho'||d.status==='enviado'){acts.push('<button class="btn btn-ghost" data-act="loseQuote">Perdido</button>');acts.push('<button class="btn btn-primary" data-act="approveQuote">Aprovar</button>')}
  }else{
    if(d.proposta)acts.push('<button class="btn" data-act="showProposal">Ver proposta</button>');
    acts.push('<button class="btn btn-primary" data-act="openObra" data-id="'+d.obraId+'">Ver projeto</button>');
  }
  var ctrl=locked?'<div class="alert ok" style="margin-bottom:18px">Aprovado. Os valores ficaram travados no contrato.</div>':
   '<div class="card ctrl"><div class="ctrl-h"><div><h3>Margem de lucro</h3><span class="muted small">Sugerida pelo questionário: '+pct(c.margemSug)+' · <button class="linkbtn" data-act="margSug">voltar para a sugerida</button></span></div>'+
   '<div class="rng-val"><input class="in r" type="number" step="0.5" id="rv-margem-n" data-rv="margem" value="'+Math.round(c.margem*10)/10+'" aria-label="Margem de lucro em porcentagem"><span>%</span></div></div>'+
   '<input type="range" min="0" max="60" step="0.5" id="rv-margem" data-rv="margem" value="'+c.margem+'" aria-label="Margem de lucro" class="range"><div class="range-scale"><span>0%</span><span>15%</span><span>30%</span><span>45%</span><span>60%</span></div></div>';
  if(!locked)ctrl='<div class="card">'+(d.precoModo==='areas'?areaProfitForm(d)+'<div class="sec"><button class="btn btn-sm" data-act="profitGlobal">Voltar à margem da etapa Valor</button></div>':'<div class="sec"><h2>Ajuste final de lucro</h2><p class="muted small">O preço mantém a margem definida na etapa Valor. Aqui você pode trocar por lucros independentes sobre material, mão de obra e empresa, de 0% a 100% sobre cada custo.</p><button class="btn btn-primary" data-act="profitAreas">Ajustar lucro por categoria</button></div>')+'</div>';
  var cmpHead='<div class="cmp-h"><h3>Comparação com material ×</h3>'+(locked?'<b>'+dec(c.N)+'</b>':'<input class="in r" type="number" step="0.1" min="0" id="rv-mult" data-rv="multN" value="'+c.N+'" aria-label="Multiplicador do material">')+'</div><p class="small" style="margin:-2px 0 6px">Padrão da oficina: × '+dec(C.multN)+'</p>';
  var form=locked?'':'<div class="card proposal-edit" id="proposal-fields"><div class="sec"><h2>Proposta para o cliente</h2>'+
    '<div class="field"><label for="ed-descricao">Descrição do serviço</label><textarea class="in" id="ed-descricao" data-f="descricao" required placeholder="Descreva o que será entregue, os ambientes, materiais e acabamentos.">'+esc(d.descricao||'')+'</textarea></div></div>'+
    proposalItemsForm(d)+'<div id="proposal-issue"></div></div>';
  return ctrl+'<div id="rv-top"></div>'+
   '<div class="grid2"><div class="card" id="rv-brk"></div><div class="stack"><div class="cmp">'+cmpHead+'<div id="rv-cmp"></div></div><div class="card" id="rv-conds"></div></div></div>'+
   form+'<div class="actions review-acts">'+acts.join('')+'</div>';
}
function refreshReview(){
  var d=ui.draft;if(!d||!$('#rv-top'))return;var c=d.proposta?d.proposta.calc:calcQuote(d),C=S.config;var locked=d.status==='aprovado';
  var editor=$('#proposal-fields');
  if(editor)editor.hidden=!c.valido;
  if(!c.valido){$('#rv-top').innerHTML='<div class="alert bad" style="margin-bottom:18px">'+esc(c.erro||(c.labor||{}).erro||'Com essa margem, imposto e comissão, o preço não fecha. Diminua a margem.')+'</div>';['#rv-brk','#rv-cmp','#rv-conds'].forEach(function(s){$(s).innerHTML=''});return}
  var P=c.preco;
  var parts=[['Material',c.material,'#B87A3D'],['Mão de obra',c.maoObra,'#2F6FDE'],['Terceiros e frete',c.terceiros+c.frete,'#8E8E93'],['Imposto'+(c.rt?' e RT':''),c.impostoV+c.rtV,'#C7C7CC'],['Lucro da empresa',c.sobra,'#248A3D']];
  var bar='<div class="stackbar" role="img" aria-label="Composição do preço">'+parts.filter(function(p){return p[1]>0}).map(function(p){return '<span style="width:'+(p[1]/P*100)+'%;background:'+p[2]+'" title="'+p[0]+': '+brl0(p[1])+'"></span>'}).join('')+'</div>';
  var rows=parts.map(function(p){return '<div class="comp-row"><span class="sw" style="background:'+p[2]+'"></span><span>'+p[0]+'</span><b>'+brl0(p[1])+'</b><span class="muted">'+pct(p[1]/P*100)+'</span></div>'}).join('');
  var issue=$('#proposal-issue');
  if(issue){
    var message=proposalData(d,today()).error;
    issue.innerHTML=message?'<div class="sec"><p class="alert warn">'+esc(message)+'</p></div>':'';
  }
  var deliveryTotal=$('#delivery-total');
  if(deliveryTotal){
    var reference=forma(d.valorEntregasForma);
    var subtotal=(d.entregas||[]).reduce(function(sum,item){return sum+Math.round(n(item.valor)*100)},0)/100;
    deliveryTotal.textContent='Soma dos itens: '+brl(subtotal)+(reference?' · Total em '+reference.nome+': '+brl(calcCond(c,reference).preco):'');
  }
  $('#rv-top').innerHTML=(!d.proposta&&c.referenciasMdf&&c.referenciasMdf.length?'<div class="alert warn" style="margin-bottom:18px">Este orçamento usa preços de referência para '+esc(c.referenciasMdf.join(', '))+'. Confira o preço e o frete com seu fornecedor antes de enviar.</div>':'')+
    (c.margem<n(C.margemMinima)?'<div class="alert bad" style="margin-bottom:18px">A margem está abaixo da mínima de '+pct(C.margemMinima)+'.</div>':'')+
   '<div class="tiles"><div class="tile"><span class="k">Custo total</span><span class="v">'+brl0(c.custo)+'</span></div><div class="tile blue"><span class="k">Preço</span><span class="v">'+brl0(P)+'</span><span class="s">sem taxas de pagamento</span></div><div class="tile"><span class="k">Lucro da empresa</span><span class="v" style="color:var(--ok)">'+brl0(c.sobra)+'</span><span class="s">margem de '+pct(c.margem)+'</span></div></div>';
  function grp(t,v,items){return '<div class="grp"><div class="grp-h"><span>'+t+'</span><span>'+brl(v)+'</span></div>'+items.filter(Boolean).map(function(i){return '<div class="grp-i"><span>'+i[0]+'</span><span>'+brl(i[1])+'</span></div>'}).join('')+'</div>'}
  var labor=c.labor,detail=labor&&labor.detalhe;
  var laborRows=detail?detail.map(function(row){return [esc(row.etapa+' · '+row.nome+' · '+dec(row.horas,1)+' h'),row.valor]}).concat([['Rateio dos custos fixos',labor.rateio]]):
    [['Oficina ('+dec(n(d.horasOficina),1)+' h)',n(d.horasOficina)*c.custoHora],['Instalação ('+dec(n(d.horasInstalacao),1)+' h)',n(d.horasInstalacao)*c.custoHora],['Custo da hora',c.custoHora]];
  $('#rv-brk').innerHTML='<div class="card-head"><h3>Custo detalhado</h3></div><div class="brk2">'+
   grp('Material',c.material,[['Chapas ('+dec(c.chapasQtd,0)+')',c.chapasCusto],['Fita de borda ('+dec(c.fitaRolos,0)+' rolo'+(c.fitaRolos===1?'':'s')+')',c.fitaCusto],['Ferragens e insumos',c.itensCusto],c.outros?['Outros materiais',c.outros]:null,['Reserva para perdas ('+pct(d.reservaPct)+')',c.reserva]])+
   grp('Mão de obra e oficina',c.maoObra,laborRows)+
   grp('Terceiros e frete',c.terceiros+c.frete,[['Terceiros',c.terceiros],['Frete e deslocamento',c.frete]])+
   '<div class="grp-t"><span>Custo total</span><span>'+brl(c.custo)+'</span></div>'+
   '<div class="grp-i"><span>Imposto ('+pct(c.imp*100)+')</span><span>'+brl(c.impostoV)+'</span></div>'+(c.rt?'<div class="grp-i"><span>RT '+esc(d.rtNome||'')+' ('+pct(c.rt*100)+')</span><span>'+brl(c.rtV)+'</span></div>':'')+
   '<div class="grp-i"><span>Lucro da empresa ('+pct(c.margem)+')</span><span>'+brl(c.sobra)+'</span></div>'+
   '<div class="grp-t big"><span>Preço</span><span>'+brl(P)+'</span></div></div>';
  var diffN=c.refN-P;var nMsg;
  if(Math.abs(diffN)/P<0.03)nMsg='Chega praticamente no preço calculado.';
  else if(diffN<0)nMsg=brl0(-diffN)+' abaixo do preço calculado. '+(lucroCom(c,c.refN)<0?'Nesse valor a empresa teria prejuízo.':'A margem cairia para '+pct(margemCom(c,c.refN))+'.');
  else nMsg=brl0(diffN)+' acima do preço calculado. A margem subiria para '+pct(margemCom(c,c.refN))+'.';
  var useBtn=!locked&&!c.porAreas&&c.refN>0&&margemCom(c,c.refN)>0&&Math.abs(diffN)/P>=0.01?'<button class="btn btn-sm" style="background:#fff" data-act="useRefN">Usar '+brl0(c.refN)+' como preço</button>':'';
  $('#rv-cmp').innerHTML='<div class="line"><span>Material total</span><span>'+brl0(c.material)+'</span></div><div class="line"><span>Material × '+dec(c.N)+'</span><span>'+brl0(c.refN)+'</span></div><div class="line"><span>Preço calculado equivale a</span><span>material × '+dec(c.nEq,1)+'</span></div><p>'+esc(nMsg)+'</p>'+(useBtn?'<div style="margin-top:4px">'+useBtn+'</div>':'');
  var conds=d.proposta?d.proposta.condicoes:d.condicoes.map(forma).filter(Boolean).map(function(f){return calcCond(c,f)});
  $('#rv-conds').innerHTML='<div class="card-head"><h3>Condições para o cliente</h3></div><div style="padding:6px 20px 12px">'+paymentComparison(conds)+'</div>';
}
function paymentComparison(conditions){
  if(!conditions.length)return '<p class="muted small">Nenhuma forma de pagamento marcada.</p>';
  return '<div class="scroll" role="region" aria-label="Comparação por forma de pagamento" tabindex="0"><table class="tbl price-comparison"><thead><tr><th>Forma</th><th class="r">Preço</th><th class="r">Mínimo</th><th class="r">Margem efetiva</th></tr></thead><tbody>'+
    conditions.map(function(x){
      var label=condLabel(x);
      return '<tr><td>'+esc(x.forma.nome)+(label?'<br><span class="muted small">'+label+'</span>':'')+'</td>'+
        '<td class="r"><b>'+(!x.preco?'—':brl(x.preco))+'</b></td><td class="r">'+(x.minimo==null?'—':brl(x.minimo))+'</td>'+
        '<td class="r">'+(x.margemEf==null||!x.preco?'—':pct(x.margemEf))+(x.preco?'<br><span class="muted small">Lucro '+brl(x.sobra)+'</span>':'')+(x.abaixo?'<br><span class="small" style="color:var(--bad)">Abaixo da mínima</span>':'')+'</td></tr>';
    }).join('')+'</tbody></table></div>';
}
function lucroCom(c,preco){return preco*(1-c.imp-c.rt)-c.custo}
function margemCom(c,preco){return preco>0?lucroCom(c,preco)/preco*100:0}
function hasDesc(f){return f.id==='pix'||f.id==='dinheiro'||n(f.desconto)>0}
function descOf(q,f){var o=q&&q.descontos&&q.descontos[f.id];return isAuto(o)?n(f.desconto):n(o)}

function live(){
  var d=ui.draft;if(!d)return;refreshReview();var C=S.config;var c=calcQuote(d);
  var laborInfo=$('#labor-info'),labor=c.labor;
  if(laborInfo){
    laborInfo.innerHTML='<div class="sum-line"><span>Mão de obra usada '+brl(labor.direta)+' · Empresa '+brl(labor.rateio)+'</span><b>'+brl(labor.total)+'</b></div>'+
      (labor.erro?'<p class="small muted">'+esc(labor.erro)+'</p>':'');
    $$('[data-labor-total]').forEach(function(el){
      var row=labor.detalhe.find(function(r){return r.index===+el.dataset.laborTotal});
      el.textContent=row?'Custo direto: '+brl(row.valor):'';
    });
  }
  $$('[data-area-cost]').forEach(function(el){el.textContent=brl(c.custosAreas[el.dataset.areaCost])});
  $$('[data-area-profit]').forEach(function(el){el.textContent=brl(c.lucroAreas[el.dataset.areaProfit])});
  var payment=$('#ed-price-comparison');
  if(payment)payment.innerHTML=c.valido?paymentComparison(d.condicoes.map(forma).filter(Boolean).map(function(f){return calcCond(c,f)})):'';
  var s=$('#summary');if(s)s.innerHTML=sideHTML(d);
  $$('[data-sub="chapas"]').forEach(function(el){var r=d.chapas[+el.dataset.i];var m=r&&C.chapas.find(function(x){return x.id===r.id});el.textContent=m?(chapaUnpriced(m)?chapaPrice(m):brl(n(r.qtd)*m.preco)):''});
  $$('[data-sub="itens"]').forEach(function(el){var r=d.itens[+el.dataset.i];var m=r&&C.materiais.find(function(x){return x.id===r.id});el.textContent=m?brl(n(r.qtd)*m.preco):''});
  $$('[data-sub="fitas"]').forEach(function(el){var r=d.fitas[+el.dataset.i];var m=r&&C.fitas.find(function(x){return x.id===r.id});el.textContent=m?brl(n(r.qtd)*m.preco):''});
  var it=$('#itens-total');if(it)it.innerHTML=(d.itens||[]).length?'<span>Total de ferragens e insumos</span><b>'+brl(c.itensCusto)+'</b>':'';
  var fh=$('#fita-hint');if(fh){if(!c.chapasFita)fh.textContent='';else{var f0=C.fitas.find(function(x){return x.id===((d.fitas||[])[0]||{}).id})||C.fitas[0];var rm=f0?n(f0.metros)||50:50;var sug=Math.ceil(c.fitaEst/rm);fh.textContent='Estimativa: '+dec(c.fitaEst,0)+' m para '+dec(c.chapasFita,0)+' chapa'+(c.chapasFita===1?'':'s')+' ('+dec(C.fitaPorChapa,0)+' m por chapa). Dá '+sug+' rolo'+(sug===1?'':'s')+' de '+dec(rm,0)+' m.'+(c.fitaRolos&&c.fitaMetros<c.fitaEst?' Os rolos marcados somam '+dec(c.fitaMetros,0)+' m.':'')}}
  var ch=$('#ch-hint');if(ch)ch.textContent=d.maoModo==='etapas'?'':'Custo da hora: '+brl(c.custoHora);
  var ms=$('#marg-sug');if(ms)ms.textContent=pct(c.margemSug);
  var mb=$('#marg-base');if(mb){var aj=c.ajustes.filter(function(a){return a.w}).map(function(a){return (a.w>0?'+':'−')+Math.abs(a.w)}).join(' ');mb.textContent='Base '+pct(C.margemBase)+(aj?' '+aj:'')+(c.manual?' · usando '+pct(c.margem):'')}
  $$('.conds-pick .chk').forEach(function(el){var inp=el.querySelector('input');var f=forma(inp.dataset.cond);var sp=el.querySelector('.cp');if(!sp){sp=document.createElement('b');sp.className='cp num';el.appendChild(sp)}sp.textContent=c.valido?brl0(calcCond(c,f).preco):''});
  var dh=$('#dup-hint');if(dh){var nm=String(d.contato.nome||'').trim().toLowerCase();var ex=!d.clienteId&&nm?S.clientes.find(function(x){return String(x.nome||'').trim().toLowerCase()===nm}):null;dh.innerHTML=ex?'<div class="alert info" style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span>'+esc(ex.nome)+' já é cliente. Use a ficha para não duplicar.</span><button class="btn btn-sm btn-primary" data-act="linkCliente" data-id="'+ex.id+'">Usar ficha</button></div>':''}
  $$('[data-descp]').forEach(function(el){var f=forma(el.dataset.descp);if(!f||!c.valido)return;var x=calcCond(c,f);var cheio=x.preco/(1-descOf(d,f)/100||1);el.textContent='Cliente paga '+brl(x.preco)+(descOf(d,f)?' e economiza '+brl(cheio-x.preco):'')+'. Lucro: '+brl0(x.sobra)+' ('+pct(x.margemEf)+').'});
  $$('[data-dl]').forEach(function(el){var f=forma(el.dataset.dl);var v=f?descOf(d,f):0;el.textContent=v?'desconto '+pct(v):''});
  var ecx=$('#entrada-cx');if(ecx){var fe2=S.config.formas.find(function(f){return f.tipo==='entrada'});ecx.innerHTML=fe2&&c.valido&&d.condicoes.indexOf(fe2.id)>=0?entradaCx(c,paymentPlan(calcCond(c,fe2).preco,paymentTerms(d,fe2)),fe2.taxa):''}
  var ed=$('#entrada-desc');var fe=S.config.formas.find(function(f){return f.tipo==='entrada'});if(ed&&fe&&c.valido)ed.textContent=condLabel(calcCond(c,fe));
  $$('[data-dias]').forEach(function(el){if(el!==document.activeElement)el.value=diasRound(d[el.dataset.dias])});
  var di=$('#dias-info');if(di){var p=pessoasDe(d),th=c.horas;var x=diasTxt(th,p);di.innerHTML=th?'<b>Total: '+dec(th,1)+' h = '+dec(x.pd,1)+' dia'+(x.pd===1?'':'s')+' de uma pessoa.</b> Com '+p+' pessoa'+(p===1?'':'s')+', ocupa cerca de '+dec(x.ag,1)+' dia'+(x.ag===1?'':'s')+' da agenda ('+dec(labor.oficina/horasDia()/p,1)+' na oficina e '+dec(labor.instalacao/horasDia()/p,1)+' de instalação).':''}
  var sg=$('#sugg');if(sg){var h=sugHoras(d);sg.innerHTML='<p><b>Sugestão: '+dec(h.of,0)+' h na oficina + '+dec(h.inst,0)+' h de instalação</b><br>'+dec(h.ch,0)+(h.ch===1?' chapa × ':' chapas × ')+dec(C.horasPorChapa,1)+' h, já contando a montagem. Instalação: '+pct(C.instalacaoPct)+' do tempo de oficina.'+(ui.autoHoras?' Preenchido automaticamente.':'')+'</p>'+((n(d.horasOficina)!==h.of||n(d.horasInstalacao)!==h.inst)?'<button class="btn btn-sm btn-primary" data-act="useSug">Usar sugestão</button>':'')}
}

function onEditorInput(e){
  var t=e.target,d=ui.draft;if(!d)return;
  if(t.dataset.dias){var hf=t.dataset.dias;var hv=t.value===''?'':Math.round(n(t.value)*horasDia()*10)/10;d[hf]=hv;var hi=$('#ed-'+hf);if(hi)hi.value=hv;ui.autoHoras=false;live();return}
  if(t.dataset.delivery!=null){
    d.entregas[+t.dataset.delivery][t.dataset.key]=t.value;
  }else if(t.dataset.f){
    var f=t.dataset.f;
    if(f==='clienteId'){d.clienteId=t.value||null;var cl=cliente(t.value);d.contato=clientContact(cl);rerenderEditor();return}
    var v=t.type==='checkbox'?t.checked:t.type==='number'?(t.value===''?'':n(t.value)):t.value;
    setPath(d,f,v);
    if(f==='rateioModo'||/^maoLancamentos\.\d+\.pessoa$/.test(f)){rerenderEditor();var control=document.getElementById(t.id);if(control)control.focus();return}
    if(f==='valorarEntregas'){rerenderEditor();$('#ed-valorarItens').focus();return}
    if(f==='titulo'){var h=$('.page-head h1');if(h)h.textContent=t.value||'Sem título'}
  }else if(t.dataset.row){var r=d[t.dataset.row][+t.dataset.i];r[t.dataset.k]=t.dataset.k==='qtd'?n(t.value):t.value}
  else if(t.dataset.q){d.respostas[t.dataset.q]=+t.value;rerenderQ();}
  else if(t.dataset.cond){var id=t.dataset.cond;var i=d.condicoes.indexOf(id);if(t.checked&&i<0)d.condicoes.push(id);if(!t.checked&&i>=0)d.condicoes.splice(i,1);var fx=forma(id);if(fx&&(fx.tipo==='entrada'||hasDesc(fx))){rerenderEditor();return}}
  live();
}
function rerenderQ(){}
function rerenderEditor(){var y=window.scrollY;$('#main').innerHTML=vEditor();live();window.scrollTo(0,y)}
function openQuote(id){
  var q=quote(id);if(!q)return;
  if(q.status==='enviado'||q.status==='perdido'){viewQuote(id);return}
  ui.quoteId=id;ui.step=0;ui.draft=clone(q);location.hash='#orcamentos';render();live();window.scrollTo(0,0)
}
function commitDraft(){
  var d=ui.draft;var ex=quote(d.id);
  if(!d.numero){S.seq=(S.seq||0)+1;d.numero=S.seq}
  d.precoSalvo=calcQuote(d).preco;
  if(ex){var i=S.orcamentos.indexOf(ex);S.orcamentos[i]=clone(d)}else S.orcamentos.push(clone(d));
}
function autoSaveDraft(){
  if(readOnly||!ui.draft||ui.draft.status!=='rascunho')return;
  commitDraft();ui.quoteId=ui.draft.id;
  var ok=persistState(),status=$('#draft-status');
  if(status)status.textContent=ok?(cloudEnabled?'Salvando na nuvem…':'Rascunho salvo'):'Falha ao gravar rascunho';
}
function copyQuote(id,revision){
  var source=quote(id);
  if(!source||readOnly||revision&&approvedRevision(source))return;
  var d=clone(source);
  ['proposta','obraId','aprovadoEm','perdidoEm','motivoPerda','retomarEm','revisaoRaiz','revisaoDe'].forEach(function(k){delete d[k]});
  Object.assign(d,{id:uid(),numero:null,status:'rascunho',criadoEm:today(),enviadoEm:null});
  if(revision){d.revisaoRaiz=source.revisaoRaiz||source.id;d.revisaoDe=source.id}
  else{d.clienteId=null;d.contato=clientContact(null);d.titulo=(source.titulo||'Orçamento')+' (cópia)'}
  closeModal();ui.step=0;ui.draft=d;ui.quoteId=d.id;ui.qFilter='todos';autoSaveDraft();
  location.hash='#orcamentos';render();live();window.scrollTo(0,0);
}
function tq(b){var id=b.dataset.id||(ui.draft&&ui.draft.id);if(ui.draft&&ui.draft.id===id)commitDraft();return quote(id)}
function syncDraft(q){if(ui.draft&&ui.draft.id===q.id)ui.draft=clone(q)}
function sendQuote(b){
  if(readOnly)return;
  var d=b.dataset.id?quote(b.dataset.id):ui.draft;
  if(!d||d.status!=='rascunho'||approvedRevision(d))return;
  if(!String(d.titulo||'').trim()||!String(d.contato.nome||'').trim()&&!d.clienteId){
    toast('Preencha o título e o nome do cliente antes de marcar como enviado.');return;
  }
  var p=proposalData(d,today());
  if(p.error){toast(p.error);return}
  var q=tq(b);
  q.status='enviado';q.enviadoEm=p.emissao;q.proposta=p;
  if(ui.draft&&ui.draft.id===q.id){ui.draft=null;ui.quoteId=null}
  ui.qFilter='todos';closeModal();save('Proposta arquivada. Válida até '+fd(p.valida)+'.');viewQuote(q.id);
}
function proposalData(q,emissao){
  var C=S.config,c=calcQuote(q);
  if(!c.valido)return {error:c.erro||'O orçamento ainda não tem preço válido.'};
  var descricao=String(q.descricao||'').trim(),prazo=n(q.prazoDias),unit=q.prazoUnidade==='corridos'?'corridos':'úteis';
  if(q.status==='rascunho'){
    if(!descricao)return {error:'Descreva o serviço e o que será entregue.'};
    if(!Number.isSafeInteger(prazo)||prazo<30)return {error:'Em Pagamento, informe o prazo de execução de pelo menos 30 dias.'};
  }
  var forms=(q.condicoes||[]).map(forma).filter(Boolean);
  if(!forms.length)return {error:'Escolha pelo menos uma forma de pagamento.'};
  var conds=[];
  for(var f of forms){
    var x=calcCond(c,f),terms=paymentTerms(q,f),plan=paymentPlan(x.preco,terms);
    if(plan.error)return {error:f.nome+' · '+plan.error};
    conds.push({forma:clone(f),preco:plan.total/100,terms:terms,sobra:x.sobra,minimo:x.minimo,margemEf:x.margemEf,abaixo:x.abaixo});
  }
  var source=q.entregas||[],priced=!!q.valorarEntregas&&source.length>0;
  var reference=priced&&conds.find(function(x){return x.forma.id===q.valorEntregasForma});
  if(priced&&!reference)return {error:'Escolha a condição de referência para os valores por item.'};
  var items=[],sum=0;
  for(var item of source){
    var name=String(item.nome||'').trim(),value=Number(item.valor),cents=Math.round(value*100);
    if(!name)return {error:'Informe o nome de cada item da proposta.'};
    if(priced&&(item.valor===''||item.valor==null||cents<0||!Number.isSafeInteger(cents)||Math.abs(value*100-cents)>0.00001)){
      return {error:'Informe um valor válido, com até duas casas decimais, para cada item.'};
    }
    if(priced)sum+=cents;
    items.push({nome:name,descricao:String(item.descricao||'').trim(),valor:priced?cents/100:null});
  }
  if(priced&&sum!==Math.round(reference.preco*100))return {error:'A soma dos itens ('+brl(sum/100)+') deve bater com o total em '+reference.forma.nome+' ('+brl(reference.preco)+').'};
  var calc=Object.assign({},c);delete calc.q;delete calc.ajustes;
  return {emissao:emissao,valida:validaAte(Object.assign({},q,{enviadoEm:emissao})),validade:n(q.validade)||15,
    titulo:q.titulo||'Móveis sob medida',cliente:nomeQ(q),telefoneCliente:q.contato&&q.contato.telefone||'',endereco:q.contato&&q.contato.endereco||'',
    oficina:C.nomeOficina||'Marcenaria',telefoneOficina:C.telefone||'',descricao:descricao,obs:q.obs||'',
    rtNome:q.rtNome||'',instalacao:c.labor.instalacao>0,
    prazo:prazo||null,prazoUnidade:unit,pessoas:pessoasDe(q),calc:calc,condicoes:conds,
    itens:items,referencia:reference?reference.forma.nome:null};
}
function proposalHTML(q){
  var p=q.proposta||proposalData(q,q.enviadoEm||today());
  if(p.error)return '';
  var c=p.calc;
  var inc=['Material, ferragens e fita de borda','Produção na oficina'];if(c.frete>0)inc.push('Frete e entrega');if(p.instalacao)inc.push('Instalação no local');
  var ofi=esc(p.oficina);
  return '<article class="prop-sheet">'+
   '<header class="prop-top"><div><b class="prop-of">'+ofi+'</b>'+(p.telefoneOficina?'<span>'+esc(p.telefoneOficina)+'</span>':'')+'</div><div class="prop-meta"><span class="prop-kind">Proposta</span><span>'+fd(p.emissao)+'</span></div></header>'+
   '<section class="prop-hero"><p class="prop-cli">Para '+esc(p.cliente)+(p.telefoneCliente?' · '+esc(p.telefoneCliente):'')+'</p>'+(p.endereco?'<p class="prop-cli">Endereço: '+esc(p.endereco)+'</p>':'')+'<h1>'+esc(p.titulo)+'</h1>'+(p.descricao?'<p class="prop-desc">'+esc(p.descricao)+'</p>':'')+'</section>'+
   '<section class="prop-facts"><div><span>Prazo de execução</span><b>'+(p.prazo?esc(p.prazo+' dias '+(p.prazoUnidade||'úteis')):'A confirmar')+'</b><small>a partir da aprovação do projeto final</small></div><div><span>Proposta válida até</span><b>'+fd(p.valida)+'</b><small>'+p.validade+' dias a partir da emissão</small></div></section>'+
   ((p.itens||[]).length?'<section><h2>Entregas por item</h2>'+(p.referencia?'<p class="small muted">Valores em '+esc(p.referencia)+'.</p>':'')+
     '<table class="prop-tbl">'+p.itens.map(function(item){return '<tr><td>'+esc(item.nome)+(item.descricao?'<small>'+esc(item.descricao)+'</small>':'')+'</td>'+
       (p.referencia?'<td>'+brl(item.valor)+'</td>':'')+'</tr>'}).join('')+'</table></section>':'')+
   '<section><h2>Investimento</h2><table class="prop-tbl">'+p.condicoes.map(function(x){var l=condLabel(x);return '<tr><td>'+esc(x.forma.nome)+(l?'<small>'+l+'</small>':'')+'</td><td>'+brl(x.preco)+'</td></tr>'}).join('')+'</table></section>'+
   '<section><h2>Está incluso</h2><ul class="prop-list">'+inc.map(function(i){return '<li>'+i+'</li>'}).join('')+'</ul></section>'+
   (p.obs?'<section><h2>Observações</h2><p class="prop-desc">'+esc(p.obs)+'</p></section>':'')+
   '<footer class="prop-foot">'+ofi+(p.telefoneOficina?' · '+esc(p.telefoneOficina):'')+'</footer></article>';
}
function showProposal(q){
  if(!q)return;
  var preview=proposalHTML(q);
  if(!preview){toast(proposalData(q,q.enviadoEm||today()).error);return}
  $('#modal-root').innerHTML='<div class="overlay prop-wrap" data-act="bgClose"><div class="prop-box" role="dialog" aria-modal="true" aria-label="Proposta"><div class="prop-bar"><span class="muted small">'+(q.enviadoEm&&!q.proposta?'Prévia recalculada. A versão enviada não foi arquivada.':'Para salvar em PDF, escolha "Salvar como PDF" na janela de impressão.')+'</span><div class="actions"><button class="btn" data-act="closeModal">Fechar</button><button class="btn btn-primary" data-act="printProposal">Imprimir ou salvar PDF</button></div></div>'+preview+'</div></div>';
}
function proposalText(d){
  var c=calcQuote(d),C=S.config;var conds=d.condicoes.map(forma).filter(Boolean).map(function(f){return calcCond(c,f)});
  var lines=['*'+(C.nomeOficina||'Proposta')+'*','Proposta: '+(d.titulo||'Móveis sob medida'),'Cliente: '+nomeQ(d),''];
  lines.push('*Condições de pagamento*');
  conds.forEach(function(x){var p=condLabel(x)?' ('+condLabel(x)+')':'';lines.push('• '+x.forma.nome+': '+brl(x.preco)+p)});
  if(d.obs){lines.push('','*Observações*',d.obs)}
  lines.push('','Proposta válida até '+fd(validaAte(d.enviadoEm?d:Object.assign({},d,{enviadoEm:today()})))+'.');
  if(C.telefone)lines.push(C.nomeOficina+' · '+C.telefone);
  return lines.join('\n');
}

/* ---------- Clientes ---------- */
function newClientModal(){
  openModal({title:'Cadastrar cliente',body:'<div class="fgrid">'+field('Nome','cl-nome','')+field('WhatsApp','cl-tel','')+field('E-mail','cl-email','')+'</div>'+field('Endereço completo','cl-end','',{ph:'Rua, número, bairro, cidade e CEP'})+field('Observações','cl-obs','',{type:'textarea'}),foot:'<button class="btn" data-act="closeModal">Cancelar</button><button class="btn btn-primary" data-act="saveCliente">Cadastrar cliente</button>'});
}
function vClientes(){
  var s=ui.cSearch.trim().toLowerCase();var t=today();
  var list=S.clientes.filter(function(c){return !s||(c.nome+' '+c.telefone+' '+(c.email||'')+' '+(c.endereco||'')).toLowerCase().indexOf(s)>=0}).sort(function(a,b){return a.nome.localeCompare(b.nome)});
  var head='<div class="page-head"><div><h1>Clientes</h1><p>Cadastre seus clientes e acompanhe os históricos, mesmo antes de um orçamento.</p></div><div class="actions"><button class="btn btn-primary" data-act="newCliente">Cadastrar cliente</button><input class="in search" id="c-search" type="search" placeholder="Buscar cliente" value="'+esc(ui.cSearch)+'" aria-label="Buscar clientes"></div></div>';
  function card(c){
    var obs=S.obras.filter(function(o){return o.clienteId===c.id});
    var total=obs.reduce(function(a,o){return a+o.valor},0);
    var aberto=S.receber.filter(function(r){return r.clienteId===c.id&&r.status!=='recebido'}).reduce(function(a,r){return a+r.bruto},0);
    var atr=S.receber.some(function(r){return r.clienteId===c.id&&recStatus(r)==='atrasado'});
    var emAnd=obs.filter(function(o){return o.etapa<4});
    var st=!obs.length?pill('rascunho','Sem projetos'):emAnd.length?pill('brown',ETAPAS[emAnd[0].etapa]+(emAnd.length>1?' +'+(emAnd.length-1):'')):aberto>0.5?pill('enviado','Pagando'):pill('ok','Finalizado');
    return '<button class="ccard" data-act="openCliente" data-id="'+c.id+'"><span class="t">'+esc(c.nome)+'</span><span class="muted small">'+esc(c.telefone||'Sem telefone')+'</span><span class="m"><span>'+obs.length+' projeto'+(obs.length===1?'':'s')+'</span><b>'+brl0(total)+'</b></span><span class="m"><span>Em aberto</span><b>'+brl0(aberto)+'</b></span><span class="pills" style="justify-content:flex-start">'+st+(atr?pill('bad','Parcela atrasada'):'')+'</span></button>'}
  function ativo(c){return S.obras.some(function(o){return o.clienteId===c.id&&o.etapa<4})||S.receber.some(function(r){return r.clienteId===c.id&&r.status!=='recebido'})}
  var at=list.filter(ativo),pending=list.filter(function(c){return !S.obras.some(function(o){return o.clienteId===c.id})&&!ativo(c)}),fin=list.filter(function(c){return !ativo(c)&&S.obras.some(function(o){return o.clienteId===c.id})});
  function sec(t,sub,arr,empty){return '<div class="csec"><div class="csec-h"><h2>'+t+'</h2><span class="cnt">'+arr.length+'</span><span class="muted small">'+sub+'</span></div>'+(arr.length?'<div class="cards">'+arr.map(card).join('')+'</div>':'<p class="muted small">'+empty+'</p>')+'</div>'}
  return head+(list.length?sec('Ativos','projeto em andamento ou parcelas a receber',at,'Nenhum cliente ativo agora.')+sec('Sem projetos','cadastros disponíveis para novos orçamentos',pending,'Nenhum cadastro sem projeto.')+sec('Finalizados','tudo entregue e pago',fin,'Ninguém finalizado ainda.'):'<div class="card"><div class="list"><div class="empty">Nenhum cliente cadastrado. Use Cadastrar cliente para começar, mesmo sem orçamento.</div></div></div>');
}
function openCliente(id){
  var c=cliente(id);if(!c)return;
  var obs=S.obras.filter(function(o){return o.clienteId===id});
  var qs=S.orcamentos.filter(function(q){return q.clienteId===id&&q.status!=='aprovado'});
  var total=obs.reduce(function(a,o){return a+o.valor},0);
  var recebido=S.receber.filter(function(r){return r.clienteId===id&&r.status==='recebido'}).reduce(function(a,r){return a+r.bruto},0);
  var aberto=S.receber.filter(function(r){return r.clienteId===id&&r.status!=='recebido'}).reduce(function(a,r){return a+r.bruto},0);
  openModal({title:c.nome,wide:true,body:
    '<div class="kv"><div><span>Total comprado</span><b>'+brl0(total)+'</b></div><div><span>Já recebido</span><b>'+brl0(recebido)+'</b></div><div><span>Em aberto</span><b>'+brl0(aberto)+'</b></div><div><span>Cliente desde</span><b>'+fd(c.criadoEm)+'</b></div></div>'+
    '<div class="fgrid">'+field('Nome','cl-nome',c.nome)+field('WhatsApp','cl-tel',c.telefone)+field('E-mail','cl-email',c.email)+'</div>'+field('Endereço de instalação','cl-end',c.endereco)+field('Observações úteis','cl-obs',c.obs,{type:'textarea'})+
    '<div class="hr"></div><h3>Projetos</h3><div class="list">'+(obs.length?obs.map(function(o){return '<div class="row" style="padding-left:0;padding-right:0"><div><div class="t">'+esc(o.titulo)+'</div><div class="d">'+ETAPAS[o.etapa]+' · '+brl(o.valor)+'</div></div><button class="btn btn-sm" data-act="openObra" data-id="'+o.id+'">Abrir</button></div>'}).join(''):'<div class="empty" style="padding-left:0">Sem projetos.</div>')+'</div>'+
    (function(){var ab=S.receber.filter(function(r){return r.clienteId===id&&r.status!=='recebido'}).sort(function(a,b){return a.venc.localeCompare(b.venc)});if(!ab.length)return '';var t=today();return '<h3>Parcelas em aberto</h3><div class="scroll"><table class="tbl"><thead><tr><th>Vencimento</th><th>Projeto</th><th>Parcela</th><th class="r">Valor</th><th></th></tr></thead><tbody>'+ab.map(function(r){var late=r.venc<t;return '<tr><td class="num"'+(late?' style="color:var(--bad);font-weight:600"':'')+'>'+fd(r.venc)+(late?' · atrasada':'')+'</td><td>'+esc((obra(r.obraId)||{}).titulo||'')+'</td><td>'+parcHTML(r)+'</td><td class="r"><b>'+brl(r.bruto)+'</b></td><td class="r"><button class="btn btn-sm" data-act="receber" data-id="'+r.id+'">Recebi</button></td></tr>'}).join('')+'</tbody></table></div>'})()+
    (qs.length?'<h3>Outros orçamentos</h3><div class="list">'+qs.map(function(q){return '<div class="row" style="padding-left:0;padding-right:0"><div><div class="t">'+esc(q.titulo)+'</div><div class="d">'+STATUS[q.status]+'</div></div><button class="btn btn-sm" data-act="openQuote" data-id="'+q.id+'">Abrir</button></div>'}).join('')+'</div>':''),
    foot:'<button class="btn" data-act="newQuoteFor" data-id="'+id+'">Novo orçamento para este cliente</button><button class="btn btn-primary" data-act="saveCliente" data-id="'+id+'">Salvar</button>'});
}

/* ---------- Obras ---------- */
function vObras(){
  var t=today();var v=ui.pView||'quadro';
  var views=[['quadro','Quadro'],['lista','Lista'],['tempo','Linha do tempo']];
  var head='<div class="page-head"><div><h1>Projetos</h1><p>Da aprovação à entrega. Ao entregar, você confere o que foi gasto de verdade.</p></div><div class="seg">'+views.map(function(x){return '<button data-act="pView" data-v="'+x[0]+'" class="'+(v===x[0]?'on':'')+'">'+x[1]+'</button>'}).join('')+'</div></div>';
  var body=v==='lista'?pLista(t):v==='tempo'?pTempo(t):pQuadro(t);
  return head+body;
}
function pQuadro(t){
  return '<div class="kanban">'+ETAPAS.map(function(e,i){
    var all=S.obras.filter(function(o){return o.etapa===i});
    var obs=all.slice().sort(function(a,b){return (a.entrega||'').localeCompare(b.entrega||'')});
    if(i===4)obs=all.slice().sort(function(a,b){return (b.entregueEm||'').localeCompare(a.entregueEm||'')}).slice(0,6);
    return '<section class="col" aria-label="'+e+'"><div class="col-h"><span>'+e+'</span><span class="cnt">'+all.length+'</span></div>'+
    (obs.map(function(o){var c=cliente(o.clienteId);var late=i<4&&o.entrega&&o.entrega<t;
      return '<div class="kcard"><span class="t" data-act="openObra" data-id="'+o.id+'" role="button" tabindex="0">'+esc(o.titulo)+'</span><span class="d">'+esc(c?c.nome:'')+'</span><div class="f"><span class="num small" style="font-weight:600">'+brl0(o.valor)+'</span>'+(i<4?pill(late?'bad':'brown',(late?'Atrasada ':'')+fds(o.entrega)):pill('ok',fds(o.entregueEm)))+'</div>'+(i<4?'<div class="f">'+(i>0?'<button class="btn btn-sm btn-ghost" data-act="moveObra" data-id="'+o.id+'" data-dir="-1" aria-label="Voltar etapa">←</button>':'<span></span>')+'<button class="btn btn-sm" data-act="moveObra" data-id="'+o.id+'" data-dir="1">'+(i===3?'Entregar':'Avançar')+' →</button></div>':'')+'</div>'}).join('')||'<span class="muted small" style="padding:4px 6px">Vazio</span>')+'</section>'}).join('')+'</div>';
}
function stageDots(i){return '<span class="stg">'+ETAPAS.map(function(e,k){return '<i class="'+(k<i||i===4?'done':k===i?'cur':'')+'" title="'+e+'"></i>'}).join('')+'</span>'}
function pLista(t){
  var ativos=S.obras.filter(function(o){return o.etapa<4}).sort(function(a,b){return (a.entrega||'9').localeCompare(b.entrega||'9')});
  var entregues=S.obras.filter(function(o){return o.etapa===4}).sort(function(a,b){return (b.entregueEm||'').localeCompare(a.entregueEm||'')}).slice(0,6);
  function row(o){var c=cliente(o.clienteId);var late=o.etapa<4&&o.entrega&&o.entrega<t;
    var recs=S.receber.filter(function(r){return r.obraId===o.id});var tot=recs.reduce(function(a,r){return a+r.bruto},0)||o.valor;var got=recs.filter(function(r){return r.status==='recebido'}).reduce(function(a,r){return a+r.bruto},0);var pr=tot?got/tot*100:0;
    return '<tr><td><b class="lk" data-act="openObra" data-id="'+o.id+'" role="button" tabindex="0">'+esc(o.titulo)+'</b><br><span class="muted small">'+esc(c?c.nome:'')+'</span></td><td>'+stageDots(o.etapa)+'<br><span class="small">'+ETAPAS[o.etapa]+'</span></td><td class="num">'+(o.etapa<4?'<span style="'+(late?'color:var(--bad);font-weight:600':'')+'">'+fd(o.entrega)+'</span>'+(late?'<br><span class="small" style="color:var(--bad)">atrasada</span>':'<br><span class="muted small">em '+daysBetween(t,o.entrega)+' dias</span>'):'<span class="muted">entregue '+fds(o.entregueEm)+'</span>')+'</td><td class="r">'+brl0(o.valor)+'</td><td style="min-width:130px"><div class="prog" style="margin:0;width:100%"><span style="width:'+Math.min(100,pr)+'%"></span></div><span class="muted small">'+pct(pr)+' recebido</span></td><td class="r">'+(o.etapa<4?'<button class="btn btn-sm" data-act="moveObra" data-id="'+o.id+'" data-dir="1">'+(o.etapa===3?'Entregar':'Avançar')+' →</button>':'<button class="btn btn-sm" data-act="openObra" data-id="'+o.id+'">Abrir</button>')+'</td></tr>'}
  var head='<thead><tr><th>Projeto</th><th>Etapa</th><th>Entrega</th><th class="r">Valor</th><th>Recebido</th><th></th></tr></thead>';
  return '<div class="card" style="margin-bottom:var(--gap)"><div class="card-head"><div class="ttl"><h2>Em andamento</h2><span class="cnt">'+ativos.length+'</span></div></div><div class="scroll">'+(ativos.length?'<table class="tbl">'+head+'<tbody>'+ativos.map(row).join('')+'</tbody></table>':'<div class="list"><div class="empty">Nenhum projeto em andamento.</div></div>')+'</div></div>'+
    '<div class="card"><div class="card-head"><div class="ttl"><h2>Entregues recentemente</h2><span class="cnt">'+entregues.length+'</span></div></div><div class="scroll">'+(entregues.length?'<table class="tbl">'+head+'<tbody>'+entregues.map(row).join('')+'</tbody></table>':'<div class="list"><div class="empty">Nada entregue ainda.</div></div>')+'</div></div>';
}
function pTempo(t){
  var lista=S.obras.filter(function(o){return o.etapa<4||(o.entregueEm&&daysBetween(o.entregueEm,t)<=30)}).sort(function(a,b){return (a.entrega||'9').localeCompare(b.entrega||'9')});
  if(!lista.length)return '<div class="card"><div class="list"><div class="empty">Nenhum projeto para mostrar.</div></div></div>';
  var ini=lista.reduce(function(m,o){return o.criadoEm<m?o.criadoEm:m},t);var fim=lista.reduce(function(m,o){var e=o.entregueEm||o.entrega||t;return e>m?e:m},t);
  ini=addDays(ini,-5);fim=addDays(fim,7);var span=Math.max(1,daysBetween(ini,fim));
  function x(d){return Math.max(0,Math.min(100,daysBetween(ini,d)/span*100))}
  var marks=[];var m=pISO(ini);m=new Date(m.getFullYear(),m.getMonth()+1,1);while(isoOf(m)<fim){marks.push(isoOf(m));m=new Date(m.getFullYear(),m.getMonth()+1,1)}
  var grid=marks.map(function(d){return '<span class="tl-m" style="left:'+x(d)+'%"><em>'+MESES[+d.slice(5,7)-1]+'</em></span>'}).join('');
  var rows=lista.map(function(o){var c=cliente(o.clienteId);var end=o.entregueEm||o.entrega||t;var a=x(o.criadoEm),b=x(end);var late=o.etapa<4&&o.entrega&&o.entrega<t;var prog=o.etapa/4*100;
    return '<div class="tl-row"><div class="tl-lab"><b class="lk" data-act="openObra" data-id="'+o.id+'" role="button" tabindex="0">'+esc(o.titulo)+'</b><span class="muted small">'+esc(c?c.nome:'')+' · '+ETAPAS[o.etapa]+'</span></div><div class="tl-track">'+grid.replace(/<em>.*?<\/em>/g,'')+'<span class="tl-tline" style="left:'+x(t)+'%"></span><div class="tl-bar'+(late?' late':'')+(o.etapa===4?' done':'')+'" style="left:'+a+'%;width:'+Math.max(2,b-a)+'%" title="'+fd(o.criadoEm)+' → '+fd(end)+'"><span style="width:'+prog+'%"></span><em>'+fds(end)+'</em></div></div></div>'}).join('');
  return '<div class="card tl"><div class="tl-head"><div class="tl-lab"></div><div class="tl-track">'+grid+'<span class="tl-today" style="left:'+x(t)+'%"><em>hoje</em></span></div></div>'+rows.replace(/<\/div><\/div><\/div>$/,'</div></div></div>')+
    '<div class="tl-legend"><span><i style="background:var(--blue-deep)"></i>Etapas concluídas</span><span><i style="background:#C9D6E6"></i>Até a entrega</span><span><i style="background:var(--bad)"></i>Atrasado</span></div></div>';
}

function openObra(id){
  var o=obra(id);if(!o)return;var c=cliente(o.clienteId);var r=o.realizado||{};
  var recs=S.receber.filter(function(x){return x.obraId===id});
  var lr=lucroReal(o);var rd=rendeDia(o);
  openModal({title:o.titulo,wide:true,body:
    '<p class="muted">'+esc(c?c.nome:'')+' · '+esc(o.formaNome||'')+'</p>'+
    '<div class="kv"><div><span>Valor do contrato</span><b>'+brl(o.valor)+'</b></div><div><span>Custo previsto</span><b>'+brl(o.custo)+'</b></div><div><span>Lucro previsto</span><b>'+brl(o.sobra)+'</b></div><div><span>Lucro real</span><b style="color:var(--'+(lr==null?'muted':lr>=o.sobra?'ok':'bad')+')">'+(lr==null?'Na entrega':brl(lr))+'</b></div></div>'+
    (rd.prev!=null?'<div class="kv"><div><span>Rende por dia (previsto)</span><b>'+brl0(rd.prev)+'</b></div><div><span>Rende por dia (real)</span><b style="color:var(--'+(rd.real==null?'muted':rd.real>=rd.prev?'ok':'bad')+')">'+(rd.real==null?'Na entrega':brl0(rd.real))+'</b></div><div><span>Dias de trabalho de uma pessoa</span><b>'+(rd.diasReal!=null?dec(rd.diasReal,1)+' <span class="muted small">de '+dec(rd.diasPrev,1)+' previstos</span>':dec(rd.diasPrev,1))+'</b><span class="muted small">'+rd.pessoas+' pessoa'+(rd.pessoas===1?'':'s')+' · '+dec((rd.diasReal!=null?rd.diasReal:rd.diasPrev)/rd.pessoas,1)+' dias na agenda</span></div><div><span>Custo de um dia</span><b>'+brl0(rd.custoDia)+'</b></div></div>':'')+
    '<div class="fgrid">'+selectF('Etapa','ob-etapa',o.etapa,ETAPAS.map(function(e,i){return [i,e]}))+field('Entrega prevista','ob-entrega',o.entrega||'',{type:'date'})+'</div>'+

    '<div class="hr"></div><h3>Gasto de verdade</h3><p class="muted small">Pedido na hora de entregar. Com isso o sistema calcula o lucro real e quanto o projeto rendeu por dia de trabalho.</p>'+
    '<div class="fgrid">'+field('Material gasto (R$) · previsto '+brl0(o.materialPrev),'ob-mat',r.material,{type:'number',step:'any'})+field('Horas reais · previsto '+dec(o.horasPrev,0)+' h','ob-hor',r.horas,{type:'number',step:'any'})+field('Gastos extras (R$)','ob-ext',r.extras,{type:'number',step:'any'})+'</div>'+
    '<div class="hr"></div><div class="cx-project-head"><h3>Caixinhas do projeto</h3><button class="btn btn-sm" data-act="cxGo" data-id="'+o.id+'">Abrir em Caixinhas</button></div>'+cxTable(cxProject(o))+
    '<div class="hr"></div><h3>Recebimentos</h3><div class="scroll"><table class="tbl"><thead><tr><th>Parcela</th><th>Vencimento</th><th class="r">Valor</th><th>Situação</th></tr></thead><tbody>'+recs.map(function(x){var st=recStatus(x);return '<tr><td>'+esc(String(x.desc||'Recebimento').split(' — ')[0])+'</td><td>'+fd(x.venc)+'</td><td class="r">'+brl(x.bruto)+'</td><td>'+pill(st==='recebido'?'ok':st==='atrasado'?'bad':'enviado',st==='recebido'?'Recebido':st==='atrasado'?'Atrasado':'Pendente')+'</td></tr>'}).join('')+'</tbody></table></div>',
    foot:'<button class="btn btn-primary" data-act="saveObra" data-id="'+id+'">Salvar</button>'});
}

function openEntrega(id){var o=obra(id);if(!o)return;var r=o.realizado||{};
  openModal({title:(o.etapa===4?'Gastos de ':'Entregar ')+o.titulo,body:'<p class="muted" style="margin-top:0">Confira o que foi gasto de verdade. Já vem com o previsto; mude só o que foi diferente.</p>'+
    '<div class="fgrid">'+field('Material gasto (R$)','en-mat',r.material!==''&&r.material!=null?r.material:Math.round(n(o.materialPrev)),{type:'number',step:'any'})+field('Horas reais','en-hor',r.horas!==''&&r.horas!=null?r.horas:Math.round(n(o.horasPrev)),{type:'number',step:'any'})+field('Gastos extras (R$)','en-ext',r.extras!==''&&r.extras!=null?r.extras:0,{type:'number',step:'any'})+'</div>'+
    '<p class="small muted">Previsto: material '+brl0(o.materialPrev)+' · '+dec(o.horasPrev,0)+' h de trabalho.</p>',
    foot:'<button class="btn btn-ghost" data-act="closeModal">Cancelar</button><button class="btn btn-primary" data-act="confirmEntrega" data-id="'+id+'">'+(o.etapa===4?'Salvar':'Entregar projeto')+'</button>'});
}
/* ---------- Dinheiro ---------- */
function contaModal(p){
  p=p||{};
  openModal({title:p.id?'Editar conta a pagar':'Nova conta a pagar',body:'<input type="hidden" id="nc-id" value="'+esc(p.id||'')+'">'+field('Descrição','nc-desc',p.desc||'',{ph:'Ex.: Energia elétrica'})+'<div class="fgrid">'+selectF('Categoria','nc-cat',p.categoria||'Material',['Material','Custo fixo','Equipe','Terceiros','Comissão','Impostos','Outros'])+field('Valor (R$)','nc-val',p.valor==null?'':p.valor,{type:'number',step:'any'})+field('Vencimento','nc-venc',p.venc||today(),{type:'date'})+'</div>'+(p.key&&p.key.startsWith('fixo-')?'<p class="muted small">Altera somente esta conta. Os próximos meses usam o valor e o vencimento da programação.</p>':''),foot:'<button class="btn btn-primary" data-act="saveConta">Salvar</button>'});
}
function fixedBillDate(month,day){
  var last=new Date(+month.slice(0,4),+month.slice(5,7),0).getDate();
  return month+'-'+pad(Math.min(day,last));
}
function ensureFixedBills(month){
  if(!S||readOnly)return false;
  var now=mesAtual(),target=/^\d{4}-(0[1-9]|1[0-2])$/.test(month||'')&&month>now?month:now,changed=false;
  var ignored=S.config.contasFixasIgnoradas||[];
  (S.config.custosFixos||[]).forEach(function(f){
    var start=f.mensalDesde,day=Number(f.diaMensal);
    if(!f.lancarMensal||!f.id||!String(f.nome||'').trim()||n(f.valor)<=0||!/^\d{4}-(0[1-9]|1[0-2])$/.test(start||'')||!Number.isInteger(day)||day<1||day>31)return;
    var month=start,count=0;
    while(month<=target&&count++<240){
      var key='fixo-'+f.id+'-'+month;
      if(!ignored.includes(key)&&!S.pagar.some(function(p){return p.key===key})){
        var matches=S.pagar.filter(function(p){return !p.key&&p.categoria==='Custo fixo'&&String(p.venc||'').slice(0,7)===month&&mobcloudKey(p.desc||'')===mobcloudKey(f.nome)});
        if(matches.length===1){matches[0].key=key;changed=true}
        else if(!matches.length){S.pagar.push({id:uid(),key:key,fixoId:f.id,competencia:month,desc:f.nome,categoria:'Custo fixo',venc:fixedBillDate(month,day),valor:n(f.valor),status:'pendente'});changed=true}
      }
      month=addMonths(month+'-01',1).slice(0,7);
    }
  });
  return changed;
}
function configureFixedBills(){
  var costs=S.config.custosFixos.filter(function(f){return String(f.nome||'').trim()&&n(f.valor)>0});
  if(!costs.length){openModal({title:'Contas fixas mensais',body:'<p>Cadastre primeiro os valores em Ajustes → Custos fixos e variáveis.</p>',foot:'<button class="btn btn-primary" data-act="openFixedCosts">Cadastrar custos fixos</button>'});return}
  openModal({title:'Programar contas fixas mensais',body:
    '<p>Escolha quais despesas devem entrar no A pagar todos os meses e informe o vencimento. Os valores vêm das despesas mensais salvas em Ajustes.</p>'+
    '<div class="field"><label for="fixed-start">Primeiro mês dos novos agendamentos</label><input class="in" type="month" id="fixed-start" value="'+mesAtual()+'"></div>'+
    costs.map(function(f,i){return '<div class="sec"><label class="chk"><input type="checkbox" id="fixed-on-'+i+'" data-fixed="'+esc(f.id)+'"'+(f.lancarMensal?' checked':'')+'> '+esc(f.nome)+' · '+brl(f.valor)+'/mês</label><div class="field"><label for="fixed-day-'+i+'">Dia do vencimento de '+esc(f.nome)+'</label><input class="in" type="number" min="1" max="31" step="1" id="fixed-day-'+i+'" value="'+esc(f.diaMensal||5)+'"></div></div>'}).join('')+
    '<p class="muted small">Dias 29 a 31 são ajustados ao último dia dos meses menores. Contas já lançadas são mantidas, inclusive as pagas. Desmarcar uma despesa interrompe novos lançamentos. Contas manuais com mesmo nome e mês são aproveitadas, preservando o valor já registrado, quando há uma única correspondência.</p><p id="fixed-error" role="status"></p>',
    foot:'<button class="btn" data-act="closeModal">Cancelar</button><button class="btn btn-primary" data-act="saveFixedBills">Salvar programação</button>'});
}
function saveFixedBills(){
  if(readOnly)return;
  var start=val('fixed-start'),checks=$$('[data-fixed]');
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(start)){$('#fixed-error').textContent='Informe o primeiro mês.';return}
  for(var i=0;i<checks.length;i++){
    var day=Number(val('fixed-day-'+i));
    if(checks[i].checked&&(!Number.isInteger(day)||day<1||day>31)){$('#fixed-error').textContent='Informe um dia de vencimento entre 1 e 31.';return}
  }
  checks.forEach(function(input,i){var f=S.config.custosFixos.find(function(f){return f.id===input.dataset.fixed});if(!f)return;if(input.checked&&!f.lancarMensal)f.mensalDesde=start;f.lancarMensal=input.checked;f.diaMensal=Number(val('fixed-day-'+i))});
  ensureFixedBills(ui.cxMonth);closeModal();ui.dTab='pagar';ui.cfg=null;location.hash='#dinheiro';save('Programação salva. As contas mensais serão lançadas ao abrir o sistema.');
}
function fixedBillsHint(){
  var missing=S.config.custosFixos.filter(function(f){return String(f.nome||'').trim()&&n(f.valor)>0&&!f.lancarMensal});
  return missing.length?'<p class="muted small">'+missing.length+' custo(s) fixo(s) ainda sem programação mensal. Configure para que a meta inclua todas as despesas da oficina.</p>':'';
}
function vDinheiro(){
  if(['geral','caixinhas','receber','pagar','lucro'].indexOf(ui.dTab)<0)ui.dTab='geral';
  var tabs=[['geral','Visão geral'],['receber','A receber'],['pagar','A pagar'],['lucro','Lucro por projeto'],['caixinhas','Caixinhas']];
  var body={geral:dGeral,caixinhas:dCaixinhas,receber:dReceber,pagar:dPagar,lucro:dLucro}[ui.dTab]();
  return '<div class="page-head"><div><h1>Financeiro</h1><p>Panorama da empresa e a gestão do dia a dia.</p></div></div><div class="seg" style="margin-bottom:16px">'+tabs.map(function(t){return '<button data-act="dTab" data-tab="'+t[0]+'" class="'+(ui.dTab===t[0]?'on':'')+'">'+t[1]+'</button>'}).join('')+'</div>'+body;
}
function mesAtual(){return today().slice(0,7)}
function moneyTiles(items,key,doneKey,doneLabel){
  var t=today(),m=mesAtual(),fim=isoOf(new Date(pISO(t).getFullYear(),pISO(t).getMonth()+1,0));
  var open=items.filter(function(x){return x.status!==doneKey});
  var s=function(a){return a.reduce(function(x,y){return x+n(y[key])},0)};
  var atr=open.filter(function(x){return x.venc<t}),sem=open.filter(function(x){return x.venc>=t&&x.venc<=addDays(t,7)}),mes=open.filter(function(x){return x.venc>addDays(t,7)&&x.venc<=fim});
  var feito=items.filter(function(x){return x.status===doneKey&&String(x.recebidoEm||x.pagoEm||'').slice(0,7)===m});
  return '<div class="tiles"><div class="tile '+(atr.length?'bad':'')+'"><span class="k">Atrasado</span><span class="v">'+brl0(s(atr))+'</span><span class="s">'+atr.length+' lançamento'+(atr.length===1?'':'s')+'</span></div><div class="tile blue"><span class="k">Próximos 7 dias</span><span class="v">'+brl0(s(sem))+'</span><span class="s">'+sem.length+' lançamento'+(sem.length===1?'':'s')+'</span></div><div class="tile"><span class="k">Resto do mês</span><span class="v">'+brl0(s(mes))+'</span><span class="s">até '+fds(fim)+'</span></div><div class="tile brown"><span class="k">'+doneLabel+'</span><span class="v">'+brl0(s(feito))+'</span><span class="s">'+new Date().toLocaleDateString('pt-BR',{month:'long'})+'</span></div></div>';
}
function recRows(list){return list.map(function(r){var c=cliente(r.clienteId);var st=recStatus(r);
  return '<tr><td class="num">'+fd(r.venc)+(st==='atrasado'?'<br><span class="small" style="color:var(--bad);font-weight:600">há '+daysBetween(r.venc,today())+' dias</span>':'')+'</td><td>'+(c?'<b class="lk ul" data-act="openCliente" data-id="'+c.id+'" role="button" tabindex="0">'+esc(c.nome)+'</b>':'<b>—</b>')+'<br><span class="muted small lk" data-act="openObra" data-id="'+r.obraId+'" role="button" tabindex="0">'+esc((obra(r.obraId)||{}).titulo||'')+'</span><br>'+parcHTML(r)+'</td><td class="muted small">'+esc(r.forma)+'</td><td class="r"><b>'+brl(r.bruto)+'</b>'+(Math.abs(r.bruto-r.liquido)>0.005?'<br><span class="muted small">entra '+brl(r.liquido)+'</span>':'')+'</td><td class="r">'+(r.status==='recebido'?'<span class="muted small">Recebido '+fds(r.recebidoEm)+'</span> <button class="btn btn-sm btn-ghost" data-act="undoRec" data-id="'+r.id+'">Desfazer</button>':'<button class="btn btn-sm btn-primary" data-act="receber" data-id="'+r.id+'">Recebi</button>')+'</td></tr>'}).join('')}
function tblCard(title,count,rows,head,empty,tone){return '<div class="card" style="margin-bottom:16px'+(tone?';box-shadow:inset 3px 0 0 var(--'+tone+')':'')+'"><div class="card-head"><div class="actions"><h2>'+title+'</h2><span class="pill">'+count+'</span></div></div><div class="scroll">'+(rows?'<table class="tbl"><thead><tr>'+head+'</tr></thead><tbody>'+rows+'</tbody></table>':'<div class="list"><div class="empty">'+empty+'</div></div>')+'</div></div>'}
function dReceber(){
  var t=today();
  var atr=S.receber.filter(function(r){return recStatus(r)==='atrasado'}).sort(function(a,b){return a.venc.localeCompare(b.venc)});
  var prox=S.receber.filter(function(r){return recStatus(r)==='pendente'}).sort(function(a,b){return a.venc.localeCompare(b.venc)});
  var rec=S.receber.filter(function(r){return r.status==='recebido'}).sort(function(a,b){return (b.recebidoEm||'').localeCompare(a.recebidoEm||'')}).slice(0,10);
  var head='<th>Vencimento</th><th>Cliente</th><th>Forma</th><th class="r">Valor</th><th></th>';
  return moneyTiles(S.receber,'bruto','recebido','Recebido no mês')+
    (atr.length?tblCard('Atrasadas',atr.length,recRows(atr),head,'','bad'):'')+
    tblCard('Próximas parcelas',prox.length,recRows(prox),head,'Nenhuma parcela pendente.')+
    tblCard('Recebidas recentemente',rec.length,recRows(rec),head,'Nada recebido ainda.');
}
function pagRows(list){return list.map(function(p){var st=pagStatus(p);
  return '<tr><td class="num">'+fd(p.venc)+(st==='atrasado'?'<br><span class="small" style="color:var(--bad);font-weight:600">atrasada</span>':'')+'</td><td><b>'+esc(p.desc)+'</b></td><td class="muted small">'+esc(p.categoria)+'</td><td class="r"><b>'+brl(p.valor)+'</b></td><td class="r">'+(p.status==='pago'?'<span class="muted small">Pago '+fds(p.pagoEm)+'</span> <button class="btn btn-sm btn-ghost" data-act="undoPag" data-id="'+p.id+'">Desfazer</button>':'<button class="btn btn-sm btn-primary" data-act="pagar" data-id="'+p.id+'">Paguei</button> <button class="btn btn-sm btn-ghost" data-act="editConta" data-id="'+p.id+'">Editar</button> <button class="icon-btn" data-act="delConta" data-id="'+p.id+'" aria-label="Excluir conta">×</button>')+'</td></tr>'}).join('')}
function dPagar(){
  var abertas=S.pagar.filter(function(p){return p.status!=='pago'}).sort(function(a,b){return a.venc.localeCompare(b.venc)});
  var pagas=S.pagar.filter(function(p){return p.status==='pago'}).sort(function(a,b){return (b.pagoEm||'').localeCompare(a.pagoEm||'')}).slice(0,10);
  var head='<th>Vencimento</th><th>Descrição</th><th>Categoria</th><th class="r">Valor</th><th></th>';
  return '<div class="actions" style="margin-bottom:14px"><button class="btn btn-primary" data-act="newConta"><span class="plus">+</span>Nova conta</button><button class="btn" data-act="lancarFolha">Lançar pagamentos da equipe do mês</button></div>'+
    '<div class="actions" style="margin-bottom:14px"><button class="btn" data-act="configureFixedBills">Programar contas fixas mensais</button></div>'+fixedBillsHint()+
    moneyTiles(S.pagar,'valor','pago','Pago no mês')+
    tblCard('Contas a pagar',abertas.length,pagRows(abertas),head,'Nenhuma conta em aberto.')+
    tblCard('Pagas recentemente',pagas.length,pagRows(pagas),head,'Nada pago ainda.');
}

function dLucro(){
  var list=S.obras.slice().sort(function(a,b){return (b.criadoEm||'').localeCompare(a.criadoEm||'')});
  var fech=list.filter(function(o){return lucroReal(o)!=null});var acima=fech.filter(function(o){return lucroReal(o)>=o.sobra}).length;
  var intro='<div class="alert info" style="margin-bottom:16px"><b>Previsto</b> é o lucro que o orçamento calculou. <b>Real</b> é o que sobrou de fato, com o material, as horas e os extras informados na entrega. A última coluna mostra se o orçamento acertou: verde, sobrou mais do que o previsto; vermelho, sobrou menos.'+(fech.length?' Até agora, '+acima+' de '+fech.length+' projetos entregues ficaram no previsto ou acima.':'')+' <b>Por dia</b> é o que o projeto deixou para pagar equipe, oficina e lucro, dividido pelos dias de trabalho ('+dec(n(S.config.horasDia)||8,0)+' h cada). Terminar mais rápido, pelo mesmo preço, faz esse número subir.</div>';
  return intro+'<div class="card scroll"><table class="tbl"><thead><tr><th>Projeto</th><th class="r">Contrato</th><th class="r">Lucro previsto</th><th class="r">Lucro real</th><th class="r">Real vs previsto</th><th class="r">Por dia</th><th></th></tr></thead><tbody>'+
  (list.length?list.map(function(o){var c=cliente(o.clienteId);var lr=lucroReal(o);var df=lr==null?null:lr-o.sobra;return '<tr><td><b>'+esc(o.titulo)+'</b><br><span class="muted small">'+esc(c?c.nome:'')+'</span></td><td class="r">'+brl0(o.valor)+'</td><td class="r">'+brl0(o.sobra)+'</td><td class="r">'+(lr==null?'<span class="muted">'+(o.etapa<4?'em andamento':'<button class="btn btn-sm" data-act="informarGastos" data-id="'+o.id+'">Informar gastos</button>')+'</span>':'<b>'+brl0(lr)+'</b>')+'</td><td class="r">'+(df==null?'<span class="muted">—</span>':Math.abs(df)<1?'<span class="muted">igual</span>':'<span style="color:var(--'+(df>=0?'ok':'bad')+');font-weight:600">'+brl0(Math.abs(df))+(df>=0?' a mais':' a menos')+'</span>')+'</td><td class="r">'+(function(){var rd=rendeDia(o);if(rd.real!=null)return '<b style="color:var(--'+(rd.real>=rd.prev?'ok':'bad')+')">'+brl0(rd.real)+'</b><br><span class="muted small">previsto '+brl0(rd.prev)+'</span>';return rd.prev!=null?'<span class="muted">'+brl0(rd.prev)+' previsto</span>':'<span class="muted">—</span>'})()+'</td><td class="r"><button class="btn btn-sm" data-act="openObra" data-id="'+o.id+'">Abrir</button></td></tr>'}).join(''):'<tr><td colspan="7" class="muted">Nenhum projeto ainda.</td></tr>')+'</tbody></table></div>';
}

var MESES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
function kfmt(v){var a=Math.abs(v);if(a>=1000)return 'R$ '+dec(v/1000,a>=10000?0:1)+' mil';return 'R$ '+dec(v,0)}
function niceMax(v){if(v<=0)return 1000;var st=v/4;var p=Math.pow(10,Math.floor(Math.log10(st)));var m=st/p;var o=[1,1.5,2,2.5,3,4,5,6,8,10].find(function(x){return m<=x});return o*p*4}
function barPath(x,y,w,h,r){if(h<=0)return '';r=Math.min(r,w/2,h);return 'M'+x+','+(y+h)+'V'+(y+r)+'Q'+x+','+y+' '+(x+r)+','+y+'H'+(x+w-r)+'Q'+(x+w)+','+y+' '+(x+w)+','+(y+r)+'V'+(y+h)+'Z'}
function inPer(d){if(!d)return false;return ui.dPer==='mes'?d.slice(0,7)===ui.dRef:d.slice(0,4)===ui.dRef.slice(0,4)}
function dGeral(){
  var C=S.config,t=today();
  var ano=ui.dRef.slice(0,4);
  var perLabel=ui.dPer==='mes'?MESES_LONG[+ui.dRef.slice(5,7)-1]+' de '+ano:ano;var perTitle=perLabel.charAt(0).toUpperCase()+perLabel.slice(1);
  var vendidas=S.obras.filter(function(o){return inPer(o.criadoEm)});
  var rdL=0,rdD=0,rdN=0,rdC=0;S.obras.forEach(function(o){if(!o.entregueEm||!inPer(o.entregueEm))return;var rd=rendeDia(o);if(rd.real==null)return;rdL+=rd.real*rd.diasReal;rdD+=rd.diasReal;rdC+=rd.custoDia*rd.diasReal;rdN++});var rdM=rdD?rdL/rdD:null;
  var vendido=vendidas.reduce(function(a,o){return a+o.valor},0);
  var lucroPrev=vendidas.reduce(function(a,o){return a+o.sobra},0);
  var custoPrev=vendidas.reduce(function(a,o){return a+n(o.custo)},0);
  var recebido=S.receber.filter(function(r){return r.status==='recebido'&&inPer(r.recebidoEm)}).reduce(function(a,r){return a+r.liquido},0);
  var pagos=S.pagar.filter(function(p){return p.status==='pago'&&inPer(p.pagoEm)});
  var pago=pagos.reduce(function(a,p){return a+n(p.valor)},0);
  var resultado=recebido-pago;
  var aprov=S.orcamentos.filter(function(q){return q.status==='aprovado'&&inPer(q.aprovadoEm)}).length;
  var perd=S.orcamentos.filter(function(q){return q.status==='perdido'&&inPer(q.perdidoEm||q.enviadoEm)}).length;
  var enviados=S.orcamentos.filter(function(q){return inPer(q.enviadoEm)}).length;
  var emAberto=S.receber.filter(function(r){return r.status!=='recebido'}).reduce(function(a,r){return a+r.liquido},0);
  var aPagar=S.pagar.filter(function(p){return p.status!=='pago'}).reduce(function(a,p){return a+n(p.valor)},0);
  /* gráfico anual */
  var ent=[],sai=[];for(var i=0;i<12;i++){ent.push(0);sai.push(0)}
  S.receber.forEach(function(r){if(r.status==='recebido'&&r.recebidoEm&&r.recebidoEm.slice(0,4)===ano)ent[+r.recebidoEm.slice(5,7)-1]+=r.liquido});
  S.pagar.forEach(function(p){if(p.status==='pago'&&p.pagoEm&&p.pagoEm.slice(0,4)===ano)sai[+p.pagoEm.slice(5,7)-1]+=n(p.valor)});
  var W=720,H=250,pl=58,pr=8,pt=12,pb=28,ch=H-pt-pb,cw=W-pl-pr;
  var mx=niceMax(Math.max.apply(null,ent.concat(sai)));
  var gw=cw/12,bw=Math.min(16,gw*0.3);
  var sel=ui.dPer==='mes'&&ui.dRef.slice(0,4)===ano?+ui.dRef.slice(5,7)-1:-1;
  var svg='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Entradas e saídas por mês em '+ano+'">';
  for(var g=0;g<=4;g++){var y=pt+ch-ch*g/4;svg+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y+'" y2="'+y+'" stroke="rgba(0,0,0,'+(g?0.06:0.14)+')" stroke-width="1"/><text x="'+(pl-8)+'" y="'+(y+4)+'" text-anchor="end" font-size="11" fill="#6E6E73">'+kfmt(mx*g/4)+'</text>'}
  for(var m=0;m<12;m++){
    var cx=pl+gw*m+gw/2;var he=ch*ent[m]/mx,hs=ch*sai[m]/mx;
    var op=sel<0||sel===m?1:0.35;
    svg+='<g data-m="'+m+'" style="cursor:default">'+'<rect x="'+(pl+gw*m)+'" y="'+pt+'" width="'+gw+'" height="'+ch+'" fill="transparent"/>'+
      '<path d="'+barPath(cx-bw-1,pt+ch-he,bw,he,4)+'" fill="#2A5E9A" opacity="'+op+'"/>'+
      '<path d="'+barPath(cx+1,pt+ch-hs,bw,hs,4)+'" fill="#C08442" opacity="'+op+'"/>'+
      '<text x="'+cx+'" y="'+(H-8)+'" text-anchor="middle" font-size="11.5" fill="'+(sel===m?'#1D1D1F':'#6E6E73')+'" font-weight="'+(sel===m?'600':'400')+'">'+MESES[m]+'</text></g>';
  }
  svg+='</svg>';
  ui.chartData={ano:ano,ent:ent,sai:sai};
  /* categorias */
  var cats={};pagos.forEach(function(p){cats[p.categoria||'Outros']=(cats[p.categoria||'Outros']||0)+n(p.valor)});
  var ck=Object.keys(cats).sort(function(a,b){return cats[b]-cats[a]});var cmax=ck.length?cats[ck[0]]:1;
  var catHTML=ck.length?ck.map(function(k){return '<div class="hbar"><span>'+esc(k)+'</span><span class="track"><span class="fill" style="display:block;width:'+Math.max(2,cats[k]/cmax*100)+'%"></span></span><span class="r">'+brl0(cats[k])+'</span></div>'}).join(''):'<p class="muted small">Nenhuma despesa paga neste período.</p>';
  var obrasRows=vendidas.sort(function(a,b){return b.criadoEm.localeCompare(a.criadoEm)}).map(function(o){var c=cliente(o.clienteId);var lr=lucroReal(o);return '<tr><td><b>'+esc(o.titulo)+'</b><br><span class="muted small">'+esc(c?c.nome:'')+' · '+fds(o.criadoEm)+'</span></td><td class="r">'+brl0(o.valor)+'</td><td class="r">'+brl0(o.sobra)+'</td><td class="r">'+(lr==null?'<span class="muted">em aberto</span>':'<span style="color:var(--'+(lr>=o.sobra?'ok':'bad')+');font-weight:600">'+brl0(lr)+'</span>')+'</td></tr>'}).join('');
  function tile(k,v,s,tone,color){return '<div class="tile '+(tone||'')+'"><span class="k">'+k+'</span><span class="v"'+(color?' style="color:var(--'+color+')"':'')+'>'+v+'</span><span class="s">'+s+'</span></div>'}
  return '<div class="dash-bar"><div class="seg">'+[['mes','Mês'],['ano','Ano']].map(function(x){return '<button data-act="dPer" data-p="'+x[0]+'" class="'+(ui.dPer===x[0]?'on':'')+'">'+x[1]+'</button>'}).join('')+'</div><div class="period"><button class="icon-btn" data-act="dShift" data-d="-1" aria-label="Período anterior">‹</button><b>'+perTitle+'</b><button class="icon-btn" data-act="dShift" data-d="1" aria-label="Próximo período">›</button></div></div>'+
  '<div class="tiles">'+
   tile('Vendido',brl0(vendido),vendidas.length+' contrato'+(vendidas.length===1?'':'s')+' fechado'+(vendidas.length===1?'':'s'),'hero')+
   tile('Recebido',brl0(recebido),'líquido de taxas','')+
   tile('Despesas pagas',brl0(pago),pagos.length+' pagamento'+(pagos.length===1?'':'s'),'brown')+
   tile('Resultado de caixa',(resultado<0?'−':'')+brl0(Math.abs(resultado)),'recebido menos pago','',resultado>=0?'ok':'bad')+
  '</div><div class="tiles">'+
   tile('Custo previsto das vendas',brl0(custoPrev),'custos dos contratos do período','')+
   tile('Lucro previsto nas vendas',brl0(lucroPrev),vendido?'margem média de '+pct(lucroPrev/vendido*100):'sem vendas no período','')+
   tile('Ticket médio',vendidas.length?brl0(vendido/vendidas.length):'—','por contrato','')+
   tile('Taxa de fechamento',(aprov+perd)?pct(aprov/(aprov+perd)*100):'—',enviados+' enviado'+(enviados===1?'':'s')+' · '+aprov+' aprovado'+(aprov===1?'':'s')+' · '+perd+' perdido'+(perd===1?'':'s'),'')+
   tile('Saldo a vencer',brl0(emAberto-aPagar),'a receber '+brl0(emAberto)+' · a pagar '+brl0(aPagar),'')+
   tile('Rende por dia de trabalho',rdM==null?'—':brl0(rdM),rdM==null?'nenhum projeto entregue no período':rdN+' entregue'+(rdN===1?'':'s')+' · um dia custa '+brl0(rdC/rdD),'',rdM==null?'':rdM>=rdC/rdD?'ok':'bad')+
  '</div>'+
  '<div class="dash-grid"><div class="card chart-card"><div class="chart-head"><h3>Entradas e saídas em '+ano+'</h3><div class="legend"><span><i style="background:#2A5E9A"></i>Entradas</span><span><i style="background:#C08442"></i>Saídas</span></div></div><div class="chart" id="chart">'+svg+'<div class="tip" id="chart-tip"></div></div></div>'+
  '<div class="card chart-card"><div class="chart-head"><h3>Para onde foi o dinheiro</h3><span class="muted small">'+esc(perLabel)+'</span></div>'+catHTML+'</div></div>'+
  '<div class="card"><div class="card-head"><h3>Projetos vendidos em '+esc(perLabel)+'</h3><span class="pill">'+vendidas.length+'</span></div><div class="scroll">'+(obrasRows?'<table class="tbl"><thead><tr><th>Projeto</th><th class="r">Contrato</th><th class="r">Lucro previsto</th><th class="r">Lucro real</th></tr></thead><tbody>'+obrasRows+'</tbody></table>':'<div class="list"><div class="empty">Nenhum projeto vendido neste período.</div></div>')+'</div></div>';
}
var MESES_LONG=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
function chartHover(e){
  var tip=$('#chart-tip');if(!tip||!ui.chartData)return;
  var g=e.target.closest&&e.target.closest('#chart [data-m]');
  if(!g){tip.style.display='none';return}
  var m=+g.dataset.m,d=ui.chartData;var box=$('#chart').getBoundingClientRect();
  tip.innerHTML='<b>'+MESES_LONG[m].charAt(0).toUpperCase()+MESES_LONG[m].slice(1)+' de '+d.ano+'</b><div><span>Entradas</span><span>'+brl0(d.ent[m])+'</span></div><div><span>Saídas</span><span>'+brl0(d.sai[m])+'</span></div><div style="border-top:1px solid rgba(0,0,0,.08);margin-top:4px;padding-top:4px;font-weight:600"><span>Saldo</span><span>'+brl0(d.ent[m]-d.sai[m])+'</span></div>';
  tip.style.display='block';
  var x=e.clientX-box.left+14;if(x+170>box.width)x=e.clientX-box.left-184;
  tip.style.left=x+'px';tip.style.top=Math.max(0,e.clientY-box.top-40)+'px';
}
var CX=[
  ['Material','#B87A3D'],['Terceiros e frete','#8E8E93'],['Comissão (RT)','#7E5BC2'],
  ['Impostos','#747983'],['Equipe e oficina','#2F6FDE'],['Lucro da empresa','#248A3D']
];
function cxCents(value){return Math.max(0,Math.round(n(value)*100))}
function cxRate(value){return dec(value/100,2)+'%'}
function cxProrate(total,weights){
  var sum=weights.reduce(function(a,b){return a+b},0);
  var parts=weights.map(function(weight,i){
    var exact=sum?total*(weight/sum):0;
    return {i:i,value:Math.floor(exact),remainder:exact%1};
  });
  var left=sum?total-parts.reduce(function(a,p){return a+p.value},0):0;
  parts.slice().sort(function(a,b){return b.remainder-a.remainder||a.i-b.i}).slice(0,left).forEach(function(p){p.value++});
  return parts.map(function(p){return p.value});
}
function cxProject(o){
  var recs=S.receber.filter(function(r){return r.obraId===o.id}).sort(function(a,b){return a.venc.localeCompare(b.venc)});
  var net=recs.length?recs.reduce(function(a,r){return a+cxCents(r.liquido)},0):cxCents(o.valor*(1-n(o.taxa)));
  var labor=o.maoObraPrev==null?n(o.horasPrev)*n(o.custoHora):o.maoObraPrev;
  var costs=[o.materialPrev,o.terceirosFrete,o.valor*n(o.rt),o.valor*n(o.imp),labor].map(cxCents);
  var cost=costs.reduce(function(a,b){return a+b},0);
  var needs=costs.concat(Math.max(0,net-cost));
  var weights=o.cxPct||needs,rates=o.cxPct||cxProrate(10000,needs);
  var planned=cxProrate(net,weights),done=CX.map(function(){return 0}),pending=done.slice(),rows=[],upcoming=[];
  var received=0,before=0;
  recs.forEach(function(r){
    var amount=cxCents(r.liquido);
    var start=0;
    // As separações anteriores à divisão percentual usavam a ordem das caixinhas.
    var previous=needs.map(function(limit){
      var value=Math.max(0,Math.min(limit,before+amount-start))-Math.max(0,Math.min(limit,before-start));
      start+=limit;
      return value;
    });
    before+=amount;
    if(r.status!=='recebido'){
      upcoming.push({rec:r,values:cxProrate(amount,weights)});
      return;
    }
    received+=amount;
    var separated=(o.cxOk||[]).includes(r.id);
    var values=separated?(r.cxSeparacao||previous):cxProrate(amount,weights);
    values.forEach(function(v,i){(separated?done:pending)[i]+=v});
    rows.push({rec:r,values:values,separated:separated});
  });
  rows.sort(function(a,b){return Number(a.separated)-Number(b.separated)||String(b.rec.recebidoEm).localeCompare(String(a.rec.recebidoEm))});
  return {net:net,received:received,rate:rates,planned:planned,done:done,pending:pending,rows:rows,upcoming:upcoming,
    next:upcoming.length?upcoming[0].rec:null,shortfall:Math.max(0,cost-net),custom:!!o.cxPct};
}
function cxInMonth(date,month){return String(date||'').slice(0,7)===month}
function cxMonthly(projects,month){
  var totals=CX.map(function(){return {receive:0,pending:0,done:0}});
  function add(values,key){values.forEach(function(v,i){totals[i][key]+=v})}
  projects.forEach(function(x){
    x.upcoming.forEach(function(r){if(cxInMonth(r.rec.venc,month))add(r.values,'receive')});
    x.rows.forEach(function(r){if(cxInMonth(r.rec.recebidoEm,month))add(r.values,r.separated?'done':'pending')});
  });
  return totals;
}
function cxReserve(month,totals){
  var categories=new Map([['Material',0],['Terceiros',1],['Terceiros e frete',1],['Frete',1],['Comissão',2],['Impostos',3],['Imposto',3],
    ['Equipe',4],['Equipe e oficina',4],['Custo fixo',4],['Pró-labore',4]]);
  var rows=totals.map(function(x){return {open:0,paid:0,separated:x.done}}).concat({open:0,paid:0,separated:0});
  S.pagar.forEach(function(p){
    var index=categories.has(p.categoria)?categories.get(p.categoria):CX.length;
    var paid=p.status==='pago';
    if(cxInMonth(paid?(p.pagoEm||p.venc):p.venc,month))rows[index][paid?'paid':'open']+=cxCents(p.valor);
  });
  var summary={open:0,covered:0,gap:0,total:0,paid:0,rows:rows};
  S.pagar.forEach(function(p){if(cxInMonth(p.venc,month)){summary.total+=cxCents(p.valor);if(p.status==='pago')summary.paid+=cxCents(p.valor)}});
  rows.forEach(function(row){
    var available=Math.max(0,row.separated-row.paid);
    row.covered=Math.min(row.open,available);
    row.gap=row.open-row.covered;
    summary.open+=row.open;summary.covered+=row.covered;summary.gap+=row.gap;
  });
  return summary;
}
function cxMonthCard(projects){
  var month=ui.cxMonth||mesAtual(),totals=cxMonthly(projects,month);
  var reserve=cxReserve(month,totals);
  function amount(label,value,cls){
    return '<div'+(cls?' class="'+cls+'"':'')+'><dt>'+label+'</dt><dd>'+brl(value/100)+'</dd></div>';
  }
  function reserveCells(row){
    return '<td class="r">'+brl(row.open/100)+'</td><td class="r'+(row.gap?' received-to-split':'')+'"><b>'+brl(row.gap/100)+'</b></td>';
  }
  return '<section class="card cx-month" aria-labelledby="cx-month-title"><div class="card-head"><div><h2 id="cx-month-title">Caixinhas do mês</h2><p class="muted small">Previstos pelo vencimento. Valores que entraram pela data do recebimento.</p></div>'+
    '<div class="actions"><button class="btn btn-sm" data-act="cxMonthShift" data-d="-1" aria-label="Mês anterior">‹</button>'+
    '<input class="in" id="cx-month" type="month" value="'+esc(month)+'" aria-label="Mês das Caixinhas">'+
    '<button class="btn btn-sm" data-act="cxMonthShift" data-d="1" aria-label="Próximo mês">›</button></div></div>'+
    '<div class="cx-reserve"><div class="cx-project-head"><h3>Para completar as contas do mês</h3><a class="btn btn-sm" href="#dinheiro" data-act="goTab" data-tab="pagar">Ver contas a pagar</a></div><p class="cx-month-goal"><span>Falta juntar neste mês</span><b>'+brl(reserve.gap/100)+'</b></p><p class="muted small">Total do mês: '+brl(reserve.total/100)+' · Já pago: '+brl(reserve.paid/100)+' · Reserva disponível para o restante: '+brl(reserve.covered/100)+'. A meta considera as contas lançadas no A pagar e os valores já separados.</p>'+fixedBillsHint()+'</div>'+
    '<div class="scroll" role="region" aria-label="Resumo mensal por categoria" tabindex="0"><table class="tbl cx-month-table"><thead><tr><th>Categoria</th><th class="r">A receber</th><th class="r">A separar</th><th class="r">Separado</th><th class="r">Contas em aberto</th><th class="r">Falta acumular</th></tr></thead><tbody>'+
    CX.map(function(c,i){
      var x=totals[i];
      return '<tr><th scope="row"><span class="cx-name"><i class="sw" style="background:'+c[1]+'"></i>'+c[0]+'</span></th>'+
        '<td class="r">'+brl(x.receive/100)+'</td><td class="r'+(x.pending?' received-to-split':'')+'">'+brl(x.pending/100)+'</td>'+
        '<td class="r'+(x.done?' received-split':'')+'">'+brl(x.done/100)+'</td>'+reserveCells(reserve.rows[i])+'</tr>';
    }).join('')+(reserve.rows[CX.length].open?'<tr><th scope="row">Outras contas</th><td></td><td></td><td></td>'+reserveCells(reserve.rows[CX.length])+'</tr>':'')+'</tbody></table></div></section>';
}
function cxTable(x){
  return '<div class="scroll" role="region" aria-label="Valores por caixinha" tabindex="0"><table class="tbl cx-project-tbl"><thead><tr><th>Destino</th><th class="r">%</th><th class="r">Previsto</th><th class="r">A separar</th><th class="r">Separado</th></tr></thead><tbody>'+
    CX.map(function(c,i){return '<tr><th scope="row"><span class="cx-name"><i class="sw" style="background:'+c[1]+'"></i>'+c[0]+'</span></th>'+
      '<td class="r">'+cxRate(x.rate[i])+'</td><td class="r">'+brl(x.planned[i]/100)+'</td><td class="r"><b>'+brl(x.pending[i]/100)+'</b></td><td class="r">'+brl(x.done[i]/100)+'</td></tr>'}).join('')+
    '</tbody></table></div>'+
    (x.shortfall?'<p class="alert warn">O contrato líquido fica '+brl(x.shortfall/100)+' abaixo dos custos previstos neste projeto.</p>':'');
}
function cxPayments(o,x){
  if(!x.rows.length)return '<p class="muted small">Nenhum recebimento registrado neste projeto.</p>';
  return x.rows.map(function(row){
    var r=row.rec;
    var chips=CX.map(function(c,i){return row.values[i]?'<span class="cx-chip"><i class="sw" style="background:'+c[1]+'"></i>'+c[0]+' <b>'+brl(row.values[i]/100)+'</b></span>':''}).join('');
    return '<details class="cx-payment"><summary><span>'+esc(String(r.desc||'Recebimento').split(' — ')[0])+' · '+fd(r.recebidoEm)+' · <b>'+brl(cxCents(r.liquido)/100)+'</b></span>'+
      (row.separated?pill('ok','Separado'):pill('warn','A separar'))+'</summary><div class="cx-chips">'+chips+'</div>'+
      (row.separated?'':'<button class="btn btn-sm btn-primary" data-act="cxSep" data-o="'+o.id+'" data-id="'+r.id+'">Separei</button>')+'</details>';
  }).join('');
}
function dCaixinhas(){
  var ids=ui.cxOpen||(ui.cxOpen={});
  if(!S.obras.length)return cxMonthCard([])+'<div class="card"><div class="sec"><p class="muted">As caixinhas aparecem quando um orçamento vira projeto.</p></div></div>';
  var groups=[
    {id:'receber',title:'A receber',hint:'Com parcelas em aberto',items:[]},
    {id:'separar',title:'A separar',hint:'Recebidos por inteiro',items:[]},
    {id:'sem-parcelas',title:'Sem parcelas',hint:'Sem recebimentos previstos',items:[]},
    {id:'separados',title:'Separados',hint:'Recebidos por inteiro e separados',items:[]}
  ];
  S.obras.forEach(function(o){
    var x=cxProject(o),pending=x.rows.filter(function(row){return !row.separated}).length;
    var index=x.next?0:pending?1:x.rows.length?3:2;
    groups[index].items.push({o:o,x:x,pending:pending});
  });
  groups[0].items.sort(function(a,b){return a.x.next.venc.localeCompare(b.x.next.venc)});
  [groups[1],groups[3]].forEach(function(group){
    group.items.sort(function(a,b){return String(b.x.rows[0].rec.recebidoEm||'').localeCompare(String(a.x.rows[0].rec.recebidoEm||''))});
  });
  if(!Object.keys(ids).length)ids[groups.find(function(g){return g.items.length}).items[0].o.id]=true;
  function projectRow(item,group){
    var o=item.o,x=item.x,c=cliente(o.clienteId),open=!!ids[o.id],next=x.next;
    var late=next&&recStatus(next)==='atrasado';
    var nextLine=next?'<span class="small cx-next-date'+(late?' bad':'')+'">'+(late?'Parcela vencida':'Próxima parcela')+' · '+fd(next.venc)+' · '+brl(cxCents(next.liquido)/100)+'</span>':'';
    var status=(item.pending?pill('warn',item.pending+(item.pending===1?' recebimento a separar':' recebimentos a separar')):'')+
      (group==='separados'?pill('ok','Separado'):'')+(x.shortfall?pill('bad','Contrato abaixo do custo'):'');
    var button='<button class="cx-row'+(open?' open':'')+'" data-act="cxToggle" data-id="'+o.id+'" aria-expanded="'+open+'" aria-controls="cx-'+o.id+'"><span class="cx-ch" aria-hidden="true">›</span>'+
      '<span class="cx-tt"><b class="cx-project-title">'+esc(o.titulo)+'</b><span class="muted small">'+esc(c?c.nome+' · ':'')+'Recebido '+brl(x.received/100)+' de '+brl(x.net/100)+' líquidos</span>'+nextLine+'</span>'+
      (status?'<span class="cx-st">'+status+'</span>':'')+'</button>';
    return '<div class="cx-item">'+button+'<div class="cx-body" id="cx-'+o.id+'"'+(open?'':' hidden')+'>'+
      (open?'<div class="cx-project-head"><p class="muted small">'+(x.custom?'Percentuais ajustados para este projeto.':'Percentuais sugeridos a partir do orçamento.')+'</p><button class="btn btn-sm" data-act="cxEdit" data-id="'+o.id+'">Ajustar percentuais</button></div>'+
        cxTable(x)+'<div class="cx-receipts"><h3>Recebimentos deste projeto</h3>'+cxPayments(o,x)+'</div>':'')+'</div></div>';
  }
  var summary=groups.filter(function(g){return g.id!=='sem-parcelas'||g.items.length}).map(function(g){
    var count=g.items.length;
    return '<button class="tile cx-over-'+g.id+'" data-act="cxJump" data-group="'+g.id+'"'+(count?' aria-controls="cx-group-'+g.id+'"':' disabled')+'><span class="k">'+g.title+'</span><span class="v">'+count+'</span><span class="s">'+g.hint+'</span></button>';
  }).join('');
  var sections=groups.filter(function(g){return g.items.length}).map(function(g){
    return '<section class="card cx-list cx-group" id="cx-group-'+g.id+'" tabindex="-1" aria-labelledby="cx-label-'+g.id+'"><div class="card-head"><h2 id="cx-label-'+g.id+'">'+g.title+'</h2><span class="cnt">'+g.items.length+'</span></div>'+
      g.items.map(function(item){return projectRow(item,g.id)}).join('')+'</section>';
  }).join('');
  var monthCard=cxMonthCard(groups.flatMap(function(g){return g.items.map(function(item){return item.x})}));
  return monthCard+'<p class="muted cx-help">Cada projeto tem sua divisão sobre o valor líquido, após as taxas de pagamento. Ao receber, abra a parcela, confira os valores e marque <b>Separei</b>.</p>'+
    '<div class="cx-overview" role="group" aria-label="Visão geral dos projetos">'+summary+'</div>'+sections;
}
function editCx(id){
  var o=obra(id);if(!o||readOnly)return;
  var x=cxProject(o);
  var fields=CX.map(function(c,i){return field(c[0]+' (%)','cx-rate-'+i,x.rate[i]/100,{type:'number',step:'0.01'})}).join('');
  openModal({title:'Caixinhas · '+o.titulo,body:'<p class="muted small">Os percentuais devem somar 100%. A divisão vale para os recebimentos ainda a separar.</p><div class="fgrid">'+fields+'</div><p id="cx-rate-total" class="muted small"></p>',
    foot:(x.custom?'<button class="btn btn-ghost" data-act="cxReset" data-id="'+id+'">Usar sugestão do orçamento</button>':'')+
    '<button class="btn btn-primary" data-act="cxSave" data-id="'+id+'">Salvar percentuais</button>'});
  readCxRates();
}
function readCxRates(){
  var values=CX.map(function(_,i){return val('cx-rate-'+i)});
  var rates=values.map(function(v){return Math.round(Number(v)*100)});
  var sum=rates.reduce(function(a,b){return a+b},0),total=$('#cx-rate-total');
  if(total)total.textContent='Total: '+cxRate(sum);
  var valid=values.every(function(v,i){return v!==''&&rates[i]>=0&&rates[i]<=10000&&Math.abs(Number(v)*100-rates[i])<0.00001})&&sum===10000;
  var button=$('[data-act="cxSave"]');
  if(button)button.disabled=!valid;
  return valid?rates:null;
}

/* ---------- Ajustes ---------- */
function vAjustes(){
  if(!ui.cfg)ui.cfg=clone(S.config);
  var tabs=[['oficina','Custos fixos e variáveis'],['horadia','Hora e dia'],['equipe','Equipe'],['materiais','Materiais e kits'],['pagamentos','Formas de pagamento'],['margens','Margens e impostos'],['dados','Dados e backup']];
  var body={oficina:aOficina,horadia:aHoraDia,equipe:aEquipe,materiais:aMateriais,pagamentos:aPagamentos,margens:aMargens,dados:aDados}[ui.aTab]();
  var dirty=JSON.stringify(ui.cfg)!==JSON.stringify(S.config);
  return '<div class="page-head"><div><h1>Ajustes</h1><p>Valores que alimentam todos os cálculos. Mude quando os preços ou a equipe mudarem.</p></div><div class="actions" id="cfg-actions">'+(ui.aTab==='dados'?'':ui.aTab==='equipe'?'<button class="btn btn-primary" data-act="newPessoa">Adicionar pessoa</button>':'<button class="btn btn-ghost" data-act="cfgReset"'+(dirty?'':' disabled')+'>Descartar</button><button class="btn btn-primary" data-act="cfgSave">Salvar alterações</button>')+'</div></div>'+
  (cloudEnabled?'<div class="cloud-acct-m" id="cloud-acct-m"></div>':'')+
  '<div class="seg" style="margin-bottom:16px">'+tabs.map(function(t){return '<button data-act="aTab" data-tab="'+t[0]+'" class="'+(ui.aTab===t[0]?'on':'')+'">'+t[1]+'</button>'}).join('')+'</div>'+body;
}
function aDados(){
  return '<div class="card"><div class="sec"><h2>Backup da oficina</h2><p class="muted small">O arquivo inclui os registros e os ajustes salvos, com dados de clientes e valores.</p><div class="actions" style="margin-top:12px"><button class="btn btn-primary" data-act="exportBackup">Exportar backup</button><button class="btn" data-act="pickBackup"'+(readOnly?' disabled':'')+'>Restaurar backup</button><input id="backup-file" type="file" accept=".json,application/json" hidden></div></div>'+
    (!S.operacao?'<div class="sec"><h2>Começar a usar com dados reais</h2><p class="muted small">Comece com clientes, orçamentos, projetos, financeiro e equipe vazios. O catálogo e os ajustes salvos são mantidos. Revise os custos e os preços antes do primeiro orçamento.</p><div class="actions" style="margin-top:12px"><button class="btn" data-act="prepareOperation"'+(readOnly?' disabled':'')+'>Começar operação</button></div></div>':'')+'</div>';
}
function exportBackup(){
  var json=JSON.stringify({format:'bancada-backup',version:1,state:S},null,2);
  var url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
  var link=document.createElement('a');
  link.href=url;link.download='bancada-backup-'+today()+'.json';
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(function(){URL.revokeObjectURL(url)},1000);
}
function readBackup(text){
  var data=JSON.parse(text),s=data&&data.state;
  function object(x){return !!x&&typeof x==='object'&&!Array.isArray(x)}
  function id(x){return typeof x==='string'&&/^[a-z0-9_-]+$/i.test(x)}
  function records(xs){return Array.isArray(xs)&&xs.every(function(x){return object(x)&&id(x.id)})}
  if(!data||data.format!=='bancada-backup'||data.version!==1||!object(s)||s.v!==3||!object(s.config))throw new Error('Formato de backup inválido.');
  var required=['clientes','orcamentos','obras','receber','pagar','equipe'];
  var setup=['custosFixos','chapas','fitas','materiais','kits','formas'];
  if(!required.every(function(k){return records(s[k])})||!setup.every(function(k){return records(s.config[k])})||!object(s.config.pesos))throw new Error('O backup está incompleto.');
  if(s.orcamentosExcluidos&&!records(s.orcamentosExcluidos))throw new Error('Há registros inválidos na lixeira de orçamentos.');
  if(!s.orcamentos.concat(s.orcamentosExcluidos||[]).every(function(q){
    return object(q.contato)&&Array.isArray(q.condicoes)&&q.condicoes.every(id)&&Array.isArray(q.chapas)&&
      (!q.entregas||Array.isArray(q.entregas)&&q.entregas.every(object))&&
      (!q.proposta||object(q.proposta.calc)&&Array.isArray(q.proposta.condicoes)&&q.proposta.condicoes.length>0&&
        (!q.proposta.itens||Array.isArray(q.proposta.itens)&&q.proposta.itens.every(object))&&
        q.proposta.condicoes.every(function(x){return object(x)&&object(x.forma)&&id(x.forma.id)&&object(x.terms)&&!paymentPlan(x.preco,x.terms).error}));
  }))throw new Error('Há orçamentos inválidos no backup.');
  if(!s.receber.concat(s.pagar).every(function(r){return typeof r.venc==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(r.venc)}))throw new Error('Há vencimentos inválidos no backup.');
  return s;
}
function emptyOperation(){
  return {v:S.v,seq:0,config:clone(S.config),clientes:[],orcamentos:[],obras:[],receber:[],pagar:[],equipe:[],operacao:true};
}
function replaceState(next,msg){
  if(readOnly)return;
  var previous=S;S=next;
  try{migrate();mergeDupes();cxMigrate()}catch(e){S=previous;toast('Os dados deste backup não puderam ser carregados.');return}
  S=previous;
  exportBackup();
  S=next;ui.cfg=null;ui.draft=null;ui.quoteId=null;ui.backup=null;ui.cxOpen={};
  closeModal();save(msg);
}
async function prepareRestore(file){
  if(readOnly||!file)return;
  ui.backup=null;
  try{ui.backup=readBackup(await file.text())}catch(e){toast('Não foi possível abrir este backup do Bancada.');return}
  openModal({title:'Restaurar backup?',body:'<p>O backup contém '+ui.backup.clientes.length+' clientes, '+ui.backup.orcamentos.length+' orçamentos e '+ui.backup.obras.length+' projetos. Os dados atuais serão exportados antes da substituição.</p>',
    foot:'<button class="btn btn-ghost" data-act="closeModal">Cancelar</button><button class="btn btn-primary" data-act="confirmRestore">Restaurar</button>'});
}
function cIn(path,v,opt){opt=opt||{};return '<input class="in'+(opt.num?' r':'')+'" '+(opt.num?'type="number" step="any" inputmode="decimal"':'type="text"')+' data-c="'+path+'" value="'+esc(v)+'" aria-label="'+esc(opt.label||path)+'"'+(opt.id?' id="'+opt.id+'"':'')+'>'}
function cField(label,path,v,num){var id='cf-'+path.replace(/\./g,'-');return '<div class="field"><label for="'+id+'">'+esc(label)+'</label>'+cIn(path,v,{num:num,id:id,label:label})+'</div>'}
function companySurvival(C){
  C=C||S.config;
  var fixed=0,variable=0;
  (C.custosFixos||[]).forEach(function(f){if(f.tipo==='variavel')variable+=n(f.valor);else fixed+=n(f.valor)});
  var payroll=oficina(C).folha,days=isAuto(C.diasFuncionamento)?22:n(C.diasFuncionamento),monthly=fixed+variable+payroll;
  return {fixed:fixed,variable:variable,payroll:payroll,monthly:monthly,days:days,daily:days>0?monthly/days:null};
}
function survivalHTML(C){
  var x=companySurvival(C);
  return '<div class="card"><div class="sec"><h2>Quanto a oficina precisa para funcionar</h2><div class="tiles"><div class="tile blue"><span class="k">Custo por mês</span><span class="v">'+brl(x.monthly)+'</span></div><div class="tile"><span class="k">Custo por dia de funcionamento</span><span class="v">'+(x.daily==null?'Configure os dias':brl(x.daily))+'</span><span class="s">'+dec(x.days,0)+' dias por mês</span></div></div><p class="muted small">Despesas fixas '+brl(x.fixed)+' + média das variáveis da oficina '+brl(x.variable)+' + equipe com encargos '+brl(x.payroll)+'.</p><p class="muted small">É o custo para manter a oficina, sem materiais, terceiros e fretes dos projetos. Os salários cadastrados em Equipe já entram nesta conta; não os repita nas despesas abaixo. Para as variáveis, use uma média mensal e revise quando necessário.</p></div></div>';
}
function aOficina(){
  var C=ui.cfg;
  return '<div id="company-survival">'+survivalHTML(C)+'</div><div class="editor"><div class="card"><div class="sec"><h2>Dados da oficina</h2><div class="fgrid">'+cField('Como você quer ser chamado','apelido',C.apelido||'')+cField('Nome que aparece na proposta','nomeOficina',C.nomeOficina)+cField('WhatsApp da oficina','telefone',C.telefone)+'</div></div>'+
  '<div class="sec"><div class="sec-h"><h2>Custos fixos e variáveis da oficina</h2><span class="muted">Valores mensais para manter a oficina</span></div><div class="rows">'+C.custosFixos.map(function(f,i){return '<div class="rowform company-cost-row">'+cIn('custosFixos.'+i+'.nome',f.nome,{label:'Nome do custo'})+'<select class="in" data-c="custosFixos.'+i+'.tipo" aria-label="Tipo de custo"><option value="fixo"'+(f.tipo!=='variavel'?' selected':'')+'>Fixo</option><option value="variavel"'+(f.tipo==='variavel'?' selected':'')+'>Variável</option></select>'+cIn('custosFixos.'+i+'.valor',f.valor,{num:1,label:'Valor mensal'})+'<button class="icon-btn" data-act="cfgDel" data-list="custosFixos" data-i="'+i+'" aria-label="Remover custo">×</button></div>'}).join('')+'</div><button class="btn btn-sm add" data-act="cfgAdd" data-list="custosFixos">+ Adicionar custo</button></div>'+
  '<div class="sec"><div class="sec-h"><h2>Tempo padrão</h2><span class="muted">Usado para sugerir as horas de cada orçamento</span></div><div class="fgrid">'+cField('Horas de oficina por chapa (com montagem)','horasPorChapa',C.horasPorChapa,1)+cField('Instalação (% do tempo de oficina)','instalacaoPct',C.instalacaoPct,1)+'</div>'+
  '<p class="muted small">O tempo padrão fica fixo. Se a oficina passar a fazer o mesmo móvel mais rápido, o preço não cai: a diferença aparece como lucro a mais e como rendimento por dia maior, em Financeiro.</p>'+
  (function(){var m=mediaReal();return m?'<div class="sugg"><p>Nos projetos entregues, a oficina gastou em média <b>'+dec(m.hpc,1)+' h por chapa</b>, contra '+dec(n(C.horasPorChapa),1)+' h do padrão. '+(m.hpc<n(C.horasPorChapa)?'Ela está mais rápida que o padrão: esse ganho fica com você.':m.hpc>n(C.horasPorChapa)*1.05?'Ela está mais lenta que o padrão: vale rever o processo ou subir o padrão.':'Está dentro do padrão.')+'</p></div>':''})()+'</div>'+
  '<div class="sec"><h2>Horas e encargos</h2><div class="fgrid">'+cField('Horas do dono na bancada por mês','horasDono',C.horasDono,1)+cField('Aproveitamento das horas (%)','produtividade',C.produtividade,1)+cField('Encargos sobre salário CLT (%)','encargos',C.encargos,1)+cField('Dias de funcionamento por mês','diasFuncionamento',isAuto(C.diasFuncionamento)?22:C.diasFuncionamento,1)+
  '<div class="field"><label for="cf-proLaboreId">Pró-labore no orçamento detalhado</label><select class="in" id="cf-proLaboreId" data-c="proLaboreId"><option value="">Manter no rateio geral</option>'+C.custosFixos.filter(function(f){return String(f.nome||'').trim()}).map(function(f){return '<option value="'+esc(f.id)+'"'+(C.proLaboreId===f.id?' selected':'')+'>'+esc(f.nome)+'</option>'}).join('')+'</select></div></div>'+
  '<p class="muted small">Aproveitamento indica a parte das horas que pode ser lançada nos projetos. Selecione a despesa de pró-labore para atribuí-la às horas do dono no orçamento detalhado.</p></div></div>'+
  '<aside class="summary" id="cfg-live"></aside></div>';
}
function cfgLive(){
  var company=$('#company-survival');if(company&&ui.cfg)company.innerHTML=survivalHTML(ui.cfg);
  var hl=$('#hd-live');if(hl&&ui.cfg){hl.innerHTML=hdTiles(ui.cfg);var hc=$('#hd-cap');if(hc)hc.innerHTML=hdCap(ui.cfg)}
  var el=$('#cfg-live');if(!el)return;var of=oficina(ui.cfg);
  el.innerHTML='<div class="card"><div class="bigs"><div class="hl"><span class="k">Custo da hora por pessoa</span><span class="big">'+brl(of.custoHora)+'</span></div><div><span class="k">Despesas da oficina</span><span class="big" style="font-size:18px">'+brl0(of.fixos)+'</span></div><div><span class="k">Equipe (com encargos)</span><span class="big" style="font-size:18px">'+brl0(of.folha)+'</span></div><div><span class="k">Horas produtivas</span><span class="big" style="font-size:18px">'+dec(of.horas,0)+' h</span></div></div><div class="brk"><p class="muted small">Hora produtiva é o tempo disponível para trabalhar nos projetos, após descontar pausas e outras atividades pelo percentual de aproveitamento. O cálculo soma as horas do dono e da equipe ativa. Custo por pessoa-hora = (despesas fixas e variáveis + folha com encargos) ÷ horas produtivas totais.</p><p class="muted small">Ao cadastrar alguém, o custo mensal e a capacidade aumentam. O valor por hora pode cair porque os custos fixos são divididos entre mais horas. Duas pessoas trabalhando por 8 horas representam 16 horas no orçamento. Essa conta depende de ocupar a capacidade estimada; reduza o aproveitamento se houver ociosidade.</p></div></div>';
  var ab=$('#cfg-actions [data-act="cfgReset"]');if(ab)ab.disabled=JSON.stringify(ui.cfg)===JSON.stringify(S.config);
}
function aEquipe(){
  var ativos=S.equipe.filter(function(e){return e.status!=='Desligado'});
  var total=ativos.reduce(function(a,e){return a+custoMensalPessoa(e)},0);
  return '<div class="tiles"><div class="tile"><span class="k">Pessoas na equipe</span><span class="v">'+ativos.length+'</span></div><div class="tile brown"><span class="k">Custo mensal da equipe</span><span class="v">'+brl0(total)+'</span><span class="s">com encargos; empreitada fica fora</span></div><div class="tile blue"><span class="k">Custo da hora por pessoa</span><span class="v">'+brl(oficina().custoHora)+'</span><span class="s">custos e horas disponíveis da equipe</span></div></div>'+
  '<div class="card scroll"><table class="tbl"><thead><tr><th>Nome</th><th>Função</th><th>Vínculo</th><th class="r">Recebe</th><th class="r">Horas nos projetos</th><th class="r">Custo/mês</th><th>Situação</th><th></th></tr></thead><tbody>'+
  S.equipe.map(function(e){var un=e.vinculo==='Diarista'?'/dia':e.vinculo==='Empreitada'?'por projeto':'/mês';return '<tr><td><b>'+esc(e.nome)+'</b></td><td>'+esc(e.funcao)+'</td><td>'+esc(e.vinculo)+'</td><td class="r">'+(e.vinculo==='Empreitada'?'por projeto':brl(e.valor)+' '+un)+'</td><td class="r">'+(e.horasSemana?dec(e.horasSemana,0)+' h/sem':'—')+'</td><td class="r">'+(e.vinculo==='Empreitada'?'—':brl0(custoMensalPessoa(e)))+'</td><td>'+pill(e.status==='Ativo'?'ok':e.status==='Desligado'?'rascunho':'warn',e.status)+'</td><td class="r"><button class="btn btn-sm" data-act="editPessoa" data-id="'+e.id+'">Editar</button></td></tr>'}).join('')+'</tbody></table></div><p class="muted small" style="margin-top:10px">Os valores de salário ficam visíveis só para quem tem acesso a esta página.</p>';
}
function pessoaModal(e){
  var isNew=!e;e=e||{id:uid(),nome:'',funcao:'',vinculo:'CLT',valor:'',diasMes:22,horasSemana:44,status:'Ativo',telefone:'',inicio:today()};
  openModal({title:isNew?'Adicionar pessoa':e.nome,body:
    '<div class="fgrid">'+field('Nome','pe-nome',e.nome)+field('Função','pe-funcao',e.funcao,{ph:'Montador, ajudante, pintor'})+'</div>'+
    '<div class="fgrid">'+selectF('Vínculo','pe-vinculo',e.vinculo,VINCULOS)+field('Valor (mês, dia ou projeto)','pe-valor',e.valor,{type:'number',step:'any'})+field('Dias por mês (diarista)','pe-dias',e.diasMes,{type:'number',step:'any'})+'</div>'+
    '<div class="fgrid">'+field('Horas por semana nos projetos','pe-horas',e.horasSemana,{type:'number',step:'any'})+selectF('Situação','pe-status',e.status,SITUACOES)+field('Início','pe-inicio',e.inicio,{type:'date'})+'</div><p class="muted small">Informe as horas semanais disponíveis para projetos. Quem trabalha só no administrativo deve ter zero aqui: seu custo continua na folha, mas não aumenta a capacidade produtiva. O aproveitamento configurado em Ajustes é aplicado sobre essas horas.</p>'+field('Telefone','pe-tel',e.telefone),
    foot:(isNew?'':'<button class="btn btn-danger" data-act="delPessoa" data-id="'+e.id+'" style="margin-right:auto">Excluir</button>')+'<button class="btn btn-primary" data-act="savePessoa" data-id="'+e.id+'">Salvar</button>'});
}
function aMateriais(){
  var C=ui.cfg;C.materiais=C.materiais||[];C.kits=C.kits||[];
  function tbl(list,cols,title,hint){
    var sheet=list==='chapas',groups=sheet?chapaGroups(C.chapas):[],filter=groups.includes(ui.chapaMarca)?ui.chapaMarca:'';
    var filters=sheet?'<div style="padding:10px 14px;max-width:280px">'+selectF('Filtrar chapas por marca','chapa-marca',filter,[['','Todas as marcas']].concat(groups))+'</div>':'';
    return '<div class="card"><div class="card-head"><h2>'+title+'</h2><span class="muted small">'+hint+'</span></div>'+filters+
    '<div class="scroll"'+(sheet?' style="max-height:420px"':'')+'><table class="tbl"><thead><tr>'+cols.map(function(c){return '<th'+(c[2]?' class="r"':'')+'>'+c[1]+'</th>'}).join('')+'<th></th></tr></thead><tbody>'+
    C[list].map(function(it,i){
      var group=sheet?chapaGroup(it):'';
      return '<tr'+(sheet?' data-chapa-marca="'+esc(group)+'"'+(filter&&group!==filter?' hidden':''):'')+'>'+cols.map(function(c){
        if(c[0]==='semFita')return '<td><label class="chk" style="padding:0"><input type="checkbox" data-c="'+list+'.'+i+'.semFita"'+(it.semFita?' checked':'')+'> sem fita</label></td>';
        var price=sheet&&c[0]==='preco'&&it.marca, value=price&&chapaUnpriced(it)?'':it[c[0]];
        var input=cIn(list+'.'+i+'.'+c[0],value,{num:c[2],label:price?c[1]+' — '+it.nome:c[1]});
        if(price)input=input.replace('>',' min="0.01" placeholder="A cadastrar" data-catalog-price>')+
          '<span class="muted small" style="display:block;white-space:normal" data-price-source>'+esc(chapaRefLabel(it))+'</span>';
        return '<td'+(c[2]?' class="r" style="width:150px"':'')+'>'+input+'</td>';
      }).join('')+'<td class="r" style="width:40px"><button class="icon-btn" data-act="cfgDel" data-list="'+list+'" data-i="'+i+'" aria-label="Remover">×</button></td></tr>';
    }).join('')+'</tbody></table></div><div style="padding:10px 14px"><button class="btn btn-sm" data-act="cfgAdd" data-list="'+list+'">+ Adicionar</button></div></div>';
  }
  var cats=MAT_CATS.slice();C.materiais.forEach(function(m){if(m.cat&&cats.indexOf(m.cat)<0)cats.push(m.cat)});
  var mat='<div class="card"><div class="card-head"><h2>Ferragens e insumos</h2><input class="in" id="mat-q" type="search" placeholder="Buscar item" aria-label="Buscar item" style="max-width:240px" value="'+esc(ui.matQ||'')+'"></div>'+
   '<datalist id="mat-cats">'+cats.map(function(c){return '<option value="'+esc(c)+'">'}).join('')+'</datalist><datalist id="mat-uns"><option value="un."><option value="par"><option value="metro"><option value="jogo"><option value="caixa"><option value="rolo"><option value="kg"><option value="folha"><option value="cartela"></datalist>'+
   '<div class="scroll"><table class="tbl"><thead><tr><th>Categoria</th><th>Item</th><th>Unidade</th><th class="r">Preço (R$)</th><th></th></tr></thead><tbody>'+
   C.materiais.map(function(m,i){var p='materiais.'+i+'.';var txt=((m.cat||'')+' '+(m.nome||'')).toLowerCase();return '<tr data-mat="'+esc(txt)+'"'+(ui.matQ&&txt.indexOf(ui.matQ.toLowerCase())<0?' hidden':'')+'><td style="width:200px">'+cIn(p+'cat',m.cat||'',{label:'Categoria'}).replace('>',' list="mat-cats">')+'</td><td>'+cIn(p+'nome',m.nome,{label:'Item'})+'</td><td style="width:110px">'+cIn(p+'un',m.un||'un.',{label:'Unidade'}).replace('>',' list="mat-uns">')+'</td><td class="r" style="width:130px">'+cIn(p+'preco',m.preco,{num:1,label:'Preço'})+'</td><td class="r" style="width:40px"><button class="icon-btn" data-act="cfgDel" data-list="materiais" data-i="'+i+'" aria-label="Remover">×</button></td></tr>'}).join('')+
   '</tbody></table></div><div style="padding:10px 14px"><button class="btn btn-sm" data-act="cfgAdd" data-list="materiais">+ Adicionar item</button></div></div>';
  var kits='<div class="card"><div class="card-head"><h2>Kits (atalhos)</h2><span class="muted small">No orçamento, um kit preenche vários itens de uma vez. Depois dá para ajustar cada um.</span></div><div class="kit-list">'+
   C.kits.map(function(k,i){var tot=(k.itens||[]).reduce(function(a,r){var m=C.materiais.find(function(x){return x.id===r.id});return a+(m?n(m.preco)*n(r.qtd):0)},0);
    return '<div class="kit-box"><div class="kit-top">'+cIn('kits.'+i+'.nome',k.nome,{label:'Nome do kit'})+'<b class="num">'+brl(tot)+'</b><button class="icon-btn" data-act="cfgDel" data-list="kits" data-i="'+i+'" aria-label="Remover kit">×</button></div><div class="rows">'+
     (k.itens||[]).map(function(r,j){var p='kits.'+i+'.itens.'+j+'.';return '<div class="rowform" style="grid-template-columns:minmax(0,1fr) 84px 30px"><select class="in" data-c="'+p+'id" aria-label="Item do kit">'+C.materiais.map(function(m){return '<option value="'+m.id+'"'+(m.id===r.id?' selected':'')+'>'+esc(m.nome)+'</option>'}).join('')+'</select>'+cIn(p+'qtd',r.qtd,{num:1,label:'Quantidade'})+'<button class="icon-btn" data-act="cfgKitItemDel" data-i="'+i+'" data-j="'+j+'" aria-label="Remover item do kit">×</button></div>'}).join('')+
     '</div><button class="btn btn-sm add" data-act="cfgKitItemAdd" data-i="'+i+'">+ Item</button></div>'}).join('')+
   '</div><div style="padding:10px 14px"><button class="btn btn-sm" data-act="cfgAdd" data-list="kits">+ Novo kit</button></div></div>';
  return '<div class="stack">'+tbl('chapas',[['nome','Chapa'],['preco','Preço da chapa (R$)',1],['semFita','Fita']],'Chapas','Referências de lojas: nov. de 2026, sem frete. Atualize com o preço do seu fornecedor.')+
   tbl('fitas',[['nome','Fita'],['metros','Metros do rolo',1],['preco','Preço do rolo (R$)',1]],'Fitas de borda','Cada orçamento cobra o rolo inteiro. A estimativa usa '+dec(C.fitaPorChapa,0)+' m por chapa')+mat+kits+'</div>';
}
function aHoraDia(){
  var C=ui.cfg;
  return '<div class="stack"><div id="hd-live">'+hdTiles(C)+'</div>'+
  '<div class="card"><div class="sec"><h2>Dia de trabalho</h2><div class="fgrid">'+cField('Horas num dia de trabalho','horasDia',C.horasDia==null?8:C.horasDia,1)+cField('Pessoas por projeto (padrão)','pessoasProjeto',C.pessoasProjeto==null?2:C.pessoasProjeto,1)+'</div>'+
  '<p class="muted small">O dia é o de uma pessoa. As pessoas por projeto servem para calcular quantos dias de agenda cada projeto ocupa. No orçamento dá para mudar caso a caso.</p></div>'+
  '<div class="sec" id="hd-cap">'+hdCap(C)+'</div></div></div>';
}
function hdNums(C){
  var of=oficina(C),hd=n(C.horasDia)||8,imp=n(C.imposto)/100;
  var dB=1-imp-n(C.margemBase)/100,dM=1-imp-n(C.margemMinima)/100;
  return {of:of,hd:hd,ch:of.custoHora,cd:of.custoHora*hd,vh:dB>0.05?of.custoHora/dB:0,vhMin:dM>0.05?of.custoHora/dM:0};
}
function hdTiles(C){
  var x=hdNums(C);
  function t(k,v,s,tone){return '<div class="tile '+(tone||'')+'"><span class="k">'+k+'</span><span class="v">'+v+'</span><span class="s">'+s+'</span></div>'}
  return '<div class="tiles" style="margin-bottom:0">'+
   t('Custo da hora',brl(x.ch),'custo por hora produtiva de uma pessoa')+
   t('Custo do dia',brl0(x.cd),'um dia de '+dec(x.hd,0)+' h de uma pessoa')+
   t('Hora vendida',brl(x.vh),'com imposto de '+pct(n(C.imposto))+' e margem base de '+pct(n(C.margemBase)),'blue')+
   t('Dia vendido',brl0(x.vh*x.hd),'no mínimo '+brl0(x.vhMin*x.hd)+', com a margem mínima de '+pct(n(C.margemMinima)),'blue')+'</div>';
}
function hdCap(C){
  var x=hdNums(C);var pdMes=x.of.horas/x.hd;var p=Math.max(1,n(C.pessoasProjeto)||1);
  var L=0,D=0;S.obras.forEach(function(o){var rd=rendeDia(o);if(rd.real==null)return;L+=rd.real*rd.diasReal;D+=rd.diasReal});var med=D?L/D:null;
  return '<h2>Capacidade e resultado</h2><div class="brk" style="padding:0">'+
   '<div><span>Dias de trabalho por mês (toda a equipe)</span><b>'+dec(pdMes,0)+' dias</b></div>'+
   '<div><span>Horas produtivas por mês (soma das pessoas)</span><span>'+dec(x.of.horas,0)+' h</span></div>'+
   '<div><span>Projetos ao mesmo tempo, com '+p+' pessoa'+(p===1?'':'s')+' em cada</span><span>'+dec(Math.max(1,Math.floor(pdMes/p/21.7*10)/10),1)+'</span></div>'+
   '<div class="tot"><span>Rende por dia, média dos projetos entregues</span><b style="color:var(--'+(med==null?'muted':med>=x.cd?'ok':'bad')+')">'+(med==null?'sem projetos entregues':brl0(med))+'</b></div></div>'+
   '<p class="muted small">Hora e dia vendidos são o custo com imposto e margem, sem comissão de arquiteto nem taxa de cartão. Rende por dia é o que cada dia de trabalho deixou de fato, depois de material, terceiros, impostos e taxas. Acima do custo do dia, sobrou lucro.</p>';
}
function aPagamentos(){
  var C=ui.cfg;
  return '<div class="card scroll"><table class="tbl"><thead><tr><th>Forma de pagamento</th><th class="r">Taxa ou risco (%)</th><th class="r">Desconto padrão (%)</th><th class="r">Parcelas</th><th></th></tr></thead><tbody>'+C.formas.map(function(f,i){return '<tr><td>'+cIn('formas.'+i+'.nome',f.nome,{label:'Nome'})+'</td><td class="r" style="width:150px">'+cIn('formas.'+i+'.taxa',f.taxa,{num:1,label:'Taxa'})+'</td><td class="r" style="width:150px">'+cIn('formas.'+i+'.desconto',f.desconto,{num:1,label:'Desconto'})+'</td><td class="r" style="width:110px">'+cIn('formas.'+i+'.parcelas',f.parcelas,{num:1,label:'Parcelas'})+'</td><td class="r" style="width:40px"><button class="icon-btn" data-act="cfgDel" data-list="formas" data-i="'+i+'" aria-label="Remover">×</button></td></tr>'}).join('')+'</tbody></table><div style="padding:10px 14px"><button class="btn btn-sm" data-act="cfgAdd" data-list="formas">+ Adicionar forma</button></div></div>'+
  '<p class="muted small" style="margin-top:10px">Taxa: o que a maquininha ou o banco cobra. No parcelado direto, use a taxa como reserva para atrasos. Desconto: abatimento oferecido no Pix ou no dinheiro, que sai da sua margem.</p>';
}
function aMargens(){
  var C=ui.cfg;
  return '<div class="stack"><div class="card"><div class="sec"><h2>Preço</h2><div class="fgrid">'+cField('Imposto sobre a venda (%)','imposto',C.imposto,1)+cField('Margem base (%)','margemBase',C.margemBase,1)+cField('Margem mínima (%)','margemMinima',C.margemMinima,1)+cField('Reserva para perdas (%)','reserva',C.reserva,1)+'</div></div>'+
  '<div class="sec"><h2>Referências</h2><div class="fgrid">'+cField('N da comparação material × N','multN',C.multN,1)+cField('Metros de fita por chapa','fitaPorChapa',C.fitaPorChapa,1)+cField('Validade padrão da proposta (dias)','validade',C.validade,1)+'</div></div></div>'+
  '<div class="card"><div class="card-head"><h2>Questionário de valor</h2><span class="muted small">Quanto cada resposta soma ou tira da margem base, em pontos percentuais</span></div><div class="scroll"><table class="tbl"><thead><tr><th>Pergunta</th><th colspan="3">Respostas e pesos</th></tr></thead><tbody>'+Q.map(function(qq){return '<tr><td><b>'+esc(qq.t)+'</b></td>'+qq.o.map(function(o,i){return '<td><span class="small muted">'+esc(o)+'</span>'+cIn('pesos.'+qq.id+'.'+i,C.pesos[qq.id][i],{num:1,label:qq.t+': '+o})+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div></div></div>';
}

/* ---------- ações ---------- */
var A={
  cloudRefresh:async function(){
    if(!cloudCanReload()){toast('Feche o orçamento ou salve os ajustes antes de atualizar.');return}
    await cloud.flush();
    if(!cloud.hasPending())await cloud.refresh();
  },
  cloudSignOut:function(){cloud.signOut()},
  cloudDiscard:function(){
    openModal({title:'Carregar a versão da nuvem?',body:'<p>As alterações feitas neste aparelho serão trocadas pela versão salva na nuvem. Antes da troca, um backup com elas será baixado, para nada se perder.</p>',
      foot:'<button class="btn" data-act="closeModal">Voltar</button><button class="btn btn-primary" data-act="cloudConfirmDiscard">Baixar backup e carregar</button>'});
  },
  cloudConfirmDiscard:function(){exportBackup();closeModal();cloud.refresh({discard:true})},
  bgClose:function(b,e){if(e.target===b)closeModal()},
  closeModal:closeModal,
  mobcloudImport:function(){startProjectImport(null)},
  importIntoDraft:function(){var d=ui.draft;if(!d||readOnly||d.status!=='rascunho')return;if(!String(d.contato&&d.contato.nome||'').trim()){toast('Preencha ou selecione o cliente antes de importar.');return}autoSaveDraft();startProjectImport(d)},
  mobcloudResume:function(){if(ui.mobcloud)mobcloudPreview(ui.mobcloud)},
  pieceConfirm:confirmProjectPieces,
  pieceFillUnits:function(){
    var unit=val('piece-default-unit');
    $$('select[id^="import-piece-"][id$="-unit"]').forEach(function(select){if(!select.value)select.value=unit});
  },
  materialRecalc:function(){
    var report=ui.mobcloud,c=pieceNumber(val('material-sheet-c')),l=pieceNumber(val('material-sheet-l')),use=pieceNumber(val('material-sheet-use'));
    if(!report)return;
    if(!(c>0&&l>0&&use>0&&use<=100)){toast('Informe as medidas da chapa e um aproveitamento maior que zero e até 100%.');return}
    estimateMaterialSheets(report,c,l,use);
    report.chapas.forEach(function(row,i){var input=$('#mob-chapas-'+i+'-qty');if(input&&row.estimated)input.value=row.qty});
    toast('Quantidades estimadas recalculadas. Confira o plano de corte.');
  },
  mobcloudCatalog:function(){
    closeModal();ui.aTab='materiais';location.hash='#ajustes';render();cfgLive();
  },
  importQuickCreate:importQuickCreate,
  mobcloudApply:applyMobcloud,
  newQuote:function(){ui.importDraft=null;ui.step=0;ui.quoteId='new';ui.draft=newDraft();location.hash='#orcamentos';render();live();window.scrollTo(0,0)},
  newQuoteFor:function(b){ui.importDraft=null;closeModal();ui.step=0;ui.quoteId='new';ui.draft=newDraft(b.dataset.id);location.hash='#orcamentos';render();live();window.scrollTo(0,0)},
  openQuote:function(b){closeModal();openQuote(b.dataset.id)},
  editQuote:function(b){
    var q=quote(b.dataset.id);if(!q||readOnly)return;
    if(q.status==='rascunho'){closeModal();openQuote(q.id);return}
    if(q.status==='aprovado'||approvedRevision(q)){toast('O orçamento aprovado mantém o contrato e o financeiro. Duplique para preparar um novo orçamento.');return}
    openModal({title:'Editar por revisão',body:'<p>A proposta original será preservada. Vamos abrir uma revisão em rascunho para você corrigir os dados e enviar novamente.</p>',foot:'<button class="btn" data-act="closeModal">Cancelar</button><button class="btn btn-primary" data-act="reviseQuote" data-id="'+q.id+'">Criar revisão e editar</button>'});
  },
  deleteQuote:function(b){
    var q=quote(b.dataset.id)||ui.draft,error=quoteDeleteReason(q);if(readOnly)return;
    if(error){toast(error);return}
    openModal({title:'Excluir orçamento?',body:'<p>'+esc(q.titulo||'Sem título')+' será retirado da lista. Você poderá restaurá-lo pela lixeira. O cadastro do cliente será mantido.</p>',foot:'<button class="btn" data-act="closeModal">Cancelar</button><button class="btn btn-danger" data-act="confirmDeleteQuote" data-id="'+q.id+'">Excluir orçamento</button>'});
  },
  confirmDeleteQuote:function(b){
    if(readOnly)return;if(!quote(b.dataset.id)&&ui.draft&&ui.draft.id===b.dataset.id)S.orcamentos.push(clone(ui.draft));var result=deleteQuoteRecord(b.dataset.id);
    if(result.error){toast(result.error);return}
    if(ui.quoteId===b.dataset.id||ui.draft&&ui.draft.id===b.dataset.id){ui.quoteId=null;ui.draft=null}
    closeModal();save('Orçamento movido para a lixeira.');
  },
  quoteTrash:showQuoteTrash,
  restoreQuote:function(b){if(readOnly)return;var result=restoreQuoteRecord(b.dataset.id);if(result.error){toast(result.error);return}closeModal();save('Orçamento restaurado.')},
  duplicateQuote:function(b){copyQuote(b.dataset.id,false)},
  reviseQuote:function(b){copyQuote(b.dataset.id,true)},
  backQuotes:function(){ui.quoteId=null;ui.draft=null;render()},
  qFilter:function(b){ui.qFilter=b.dataset.f;render()},
  addDelivery:function(){
    if(!ui.draft||readOnly)return;
    var items=ui.draft.entregas||(ui.draft.entregas=[]);
    items.push({nome:'',descricao:'',valor:''});
    rerenderEditor();autoSaveDraft();
    var name=$('#entrega-'+(items.length-1));if(name)name.focus();
  },
  removeDelivery:function(b){
    if(!ui.draft||readOnly)return;
    ui.draft.entregas.splice(+b.dataset.i,1);
    rerenderEditor();autoSaveDraft();
    var add=$('[data-act="addDelivery"]');if(add)add.focus();
  },
  addRow:function(b){var C=S.config;var r=b.dataset.row;var first=({chapas:C.chapas,fitas:C.fitas}[r]||[])[0];if(!first){toast('Cadastre itens em Ajustes primeiro.');return}ui.draft[r]=ui.draft[r]||[];ui.draft[r].push({id:first.id,qtd:1});rerenderEditor();autoSaveDraft()},
  findMaterial:function(){
    openModal({title:'Buscar material',body:field('Nome ou categoria','material-search','',{type:'search',ph:'Ex.: dobradiça amortecedor'})+
      '<div class="list" id="material-results">'+materialResults('')+'</div>'});
  },
  pickMaterial:function(b){
    if(!ui.draft||readOnly)return;
    var id=b.dataset.id;
    addItens(ui.draft,{itens:[{id:id,qtd:1}]});
    closeModal();rerenderEditor();autoSaveDraft();
    var row=ui.draft.itens.findIndex(function(r){return r.id===id});
    var amount=$('input[data-row="itens"][data-i="'+row+'"]');if(amount)amount.focus();
  },
  addKit:function(){var sel=$('#kit-pick');var k=sel&&S.config.kits.find(function(x){return x.id===sel.value});if(!k){toast('Escolha um kit na lista.');return}addItens(ui.draft,k,1);rerenderEditor();autoSaveDraft();toast(k.nome+' incluído. Ajuste as quantidades se precisar.')},
  delRow:function(b){ui.draft[b.dataset.row].splice(+b.dataset.i,1);rerenderEditor();autoSaveDraft()},
  saveQuote:function(){commitDraft();ui.quoteId=ui.draft.id;save('Orçamento salvo.');live()},
  viewQuote:function(b){viewQuote(b.dataset.id)},
  linkCliente:function(b){var c=cliente(b.dataset.id);ui.draft.clienteId=c.id;ui.draft.contato=clientContact(c);rerenderEditor();autoSaveDraft()},
  profitAreas:function(){var d=ui.draft;if(!d||readOnly||d.status!=='rascunho')return;var c=calcQuote(d);d.lucros=profitDefaults(c);d.precoModo='areas';rerenderEditor();autoSaveDraft()},
  profitGlobal:function(){var d=ui.draft;if(!d||readOnly||d.status!=='rascunho')return;delete d.precoModo;rerenderEditor();autoSaveDraft()},
  margSug:function(){ui.draft.margemManual='';rerenderEditor();autoSaveDraft()},
  useRefN:function(){var c=calcQuote(ui.draft);var m=(1-c.imp-c.rt-c.custo/c.refN)*100;if(m<=0){toast('Nesse valor a empresa teria prejuízo.');return}ui.draft.margemManual=Math.round(m*10)/10;rerenderEditor();autoSaveDraft();toast('Preço ajustado para material × '+dec(c.N)+'. Margem de '+pct(ui.draft.margemManual)+'.')},
  useSug:function(){var h=sugHoras(ui.draft);ui.draft.horasOficina=h.of;ui.draft.horasInstalacao=h.inst;ui.autoHoras=false;rerenderEditor();autoSaveDraft()},
  laborMode:function(b){
    var d=ui.draft,mode=b.dataset.mode;
    if(readOnly||!d||d.status!=='rascunho')return;
    d.maoModo=mode;
    if(mode==='rapido'&&(!d.mobcloud||d.mobcloud.estimarHoras)&&!n(d.horasOficina)&&!n(d.horasInstalacao)){
      var estimate=sugHoras(d);d.horasOficina=estimate.of;d.horasInstalacao=estimate.inst;
    }
    rerenderEditor();autoSaveDraft();
    var button=$('[data-act="laborMode"][data-mode="'+mode+'"]');if(button)button.focus();
  },
  laborAdd:function(){
    var d=ui.draft;if(readOnly||!d||d.status!=='rascunho')return;
    var rows=d.maoLancamentos||(d.maoLancamentos=[]);
    rows.push({etapa:'Corte',pessoa:'dono',horas:'',valorHora:''});
    rerenderEditor();autoSaveDraft();
    var first=$('#mao-'+(rows.length-1)+'-etapa');if(first)first.focus();
  },
  laborDel:function(b){
    var d=ui.draft;if(readOnly||!d||d.status!=='rascunho'||!d.maoLancamentos)return;
    d.maoLancamentos.splice(+b.dataset.i,1);rerenderEditor();autoSaveDraft();
    var button=$('[data-act="laborAdd"]');if(button)button.focus();
  },
  dPer:function(b){ui.dPer=b.dataset.p;render()},
  dShift:function(b){var k=+b.dataset.d;ui.dRef=(ui.dPer==='mes'?addMonths(ui.dRef+'-01',k):addMonths(ui.dRef+'-01',12*k)).slice(0,7);render()},
  qFilterGo:function(b){ui.qFilter=b.dataset.f;ui.quoteId=null;ui.draft=null},
  step:function(b){var d=ui.draft;ui.step=+b.dataset.s;ui.autoHoras=false;if(ui.step===2&&d.status==='rascunho'&&d.maoModo!=='etapas'&&(!d.mobcloud||d.mobcloud.estimarHoras)&&!n(d.horasOficina)&&!n(d.horasInstalacao)){var h=sugHoras(d);if(h.of){d.horasOficina=h.of;d.horasInstalacao=h.inst;ui.autoHoras=true}}$('#main').innerHTML=vEditor();live();if(ui.autoHoras)autoSaveDraft();var st=$('.stepper');if(st)window.scrollTo(0,Math.max(0,st.getBoundingClientRect().top+window.scrollY-20))},
  sendQuote:sendQuote,
  showProposal:function(b){var q=b.dataset.id?quote(b.dataset.id):ui.draft;closeModal();showProposal(q)},
  printProposal:function(){try{window.print()}catch(e){toast('A impressão não abriu aqui. Abra o sistema direto no navegador para imprimir.')}},
  copyProposal:function(b){var q=b.dataset.id?quote(b.dataset.id):ui.draft;var txt=proposalText(q);
    var done=function(){toast('Proposta copiada. Cole no WhatsApp do cliente.')};
    try{navigator.clipboard.writeText(txt).then(done,function(){showText(txt)})}catch(e){showText(txt)}},
  loseQuote:function(b){var id=b.dataset.id||ui.draft.id;openModal({title:'Marcar como perdido',body:selectF('Motivo','lo-mot','Preço',MOTIVOS)+field('Retomar contato em (opcional)','lo-ret','',{type:'date'})+'<p class="muted small">O orçamento continua guardado. Quem desistiu por prazo ou dinheiro muitas vezes volta.</p>',foot:'<button class="btn btn-primary" data-act="confirmLose" data-id="'+id+'">Confirmar</button>'})},
  confirmLose:function(b){var mot=val('lo-mot'),ret=val('lo-ret');var q=tq(b);q.status='perdido';q.perdidoEm=today();q.motivoPerda=mot;q.retomarEm=ret;syncDraft(q);closeModal();save('Orçamento marcado como perdido.');live()},
  approveQuote:function(b){
    var id=b.dataset.id||(ui.draft&&ui.draft.id);var d=(ui.draft&&ui.draft.id===id)?ui.draft:quote(id);if(!d)return;
    if(readOnly||approvedRevision(d)||d.status==='perdido')return;
    if(!d.titulo){toast('Dê um nome ao orçamento antes de aprovar.');return}
    if(!d.clienteId&&!d.contato.nome){toast('Informe o nome do cliente antes de aprovar.');return}
    var p=d.proposta||proposalData(d,d.enviadoEm||today());
    if(p.error){toast(p.error);return}
    ui.apProposal=p;
    var t=today();
    openModal({title:'Aprovar: '+p.titulo,wide:true,body:'<p>'+esc(p.cliente)+' terá o projeto no quadro e as parcelas no Financeiro.</p>'+
      (d.enviadoEm&&!d.proposta?'<p class="alert warn">Esta proposta foi enviada antes do arquivamento. Confira os valores e as condições com o cliente antes de aprovar.</p>':'')+
      (p.valida<t?'<p class="alert warn">A validade terminou em '+fd(p.valida)+'. Confirme a condição com o cliente.</p>':'')+
      selectF('Forma de pagamento aceita','ap-forma',p.condicoes[0].forma.id,p.condicoes.map(function(x){return [x.forma.id,x.forma.nome+' — '+brl(x.preco)]}))+
      (p.prazo?'<p class="small muted">Prazo na proposta: '+esc(p.prazo+' dias '+(p.prazoUnidade||'úteis'))+' após a aprovação do projeto final.</p>':'')+
      '<div class="fgrid">'+field('Primeira parcela do saldo','ap-prim',addDays(t,30),{type:'date'})+field('Entrega prevista na agenda','ap-ent','',{type:'date'})+'</div>'+
      '<div id="ap-cx"></div>',
      foot:'<button class="btn btn-primary" data-act="confirmApprove" data-id="'+id+'">Aprovar e criar projeto</button>'});
    apCx();
  },
  confirmApprove:function(b){
    if(readOnly||!ui.apProposal)return;
    var plan=approvalPlan(ui.apProposal);
    if(plan.error){toast(plan.error);return}
    var q=tq(b);
    if(!q||approvedRevision(q)){toast('Uma versão deste orçamento já foi aprovada.');return}
    q.proposta=ui.apProposal;
    var o={formaId:plan.condition.forma.id,primeira:val('ap-prim'),entrega:val('ap-ent'),data:today()};
    if(!aprovar(q,o))return;
    syncDraft(q);closeModal();save('Aprovado. '+nomeQ(q)+' agora é cliente e o projeto está no quadro.');live();
  },
  posVendaFeito:function(b){var o=obra(b.dataset.id);o.posVendaFeito=true;save('Pós-venda registrado.')},
  openCliente:function(b){openCliente(b.dataset.id)},
  newCliente:newClientModal,
  saveCliente:function(b){
    if(readOnly)return;
    var id=b.dataset.id,result=saveClientRecord({nome:val('cl-nome'),telefone:val('cl-tel'),email:val('cl-email'),endereco:val('cl-end'),obs:val('cl-obs')},id);
    if(result.error){toast(result.error);return}
    if(!id)ui.cSearch='';closeModal();save('Cliente salvo.');
  },
  openObra:function(b){openObra(b.dataset.id)},
  moveObra:function(b){var o=obra(b.dataset.id);var k=o.etapa+(+b.dataset.dir);if(k<0||k>4)return;if(k===4){openEntrega(o.id);return}o.etapa=k;
    if(k===4){openEntrega(o.id);return}
    else{if(k<4){o.entregueEm=null}save()}},
  saveObra:function(b){var o=obra(b.dataset.id);var et=+val('ob-etapa');
    if(et===4&&o.etapa!==4){o.entregueEm=today()}
    if(et<4)o.entregueEm=null;
    o.etapa=et;o.entrega=val('ob-entrega');
    o.realizado={material:val('ob-mat'),horas:val('ob-hor'),extras:val('ob-ext'),fechado:et===4&&val('ob-mat')!==''&&val('ob-hor')!==''};
    closeModal();save('Projeto salvo.')},
  confirmEntrega:function(b){var o=obra(b.dataset.id);if(o.etapa!==4||!o.entregueEm)o.entregueEm=today();o.etapa=4;o.realizado={material:val('en-mat'),horas:val('en-hor'),extras:val('en-ext')||0,fechado:true};
    var lr=lucroReal(o);var df=lr-o.sobra;var rd=rendeDia(o);closeModal();save('Projeto entregue. Lucro real '+brl0(lr)+(Math.abs(df)<1?', igual ao previsto.':df>0?', '+brl0(df)+' acima do previsto.':', '+brl0(-df)+' abaixo do previsto.')+(rd.real!=null?' Rendeu '+brl0(rd.real)+' por dia.':''))},
  informarGastos:function(b){openEntrega(b.dataset.id)},
  cxSep:function(b){
    var o=obra(b.dataset.o);if(readOnly||!o)return;
    var row=cxProject(o).rows.find(function(x){return x.rec.id===b.dataset.id&&!x.separated});
    if(!row)return;
    row.rec.cxSeparacao=row.values;
    o.cxOk=o.cxOk||[];o.cxOk.push(row.rec.id);save('Separação registrada no projeto.');
  },
  cxToggle:function(b){
    var id=b.dataset.id;ui.cxOpen=ui.cxOpen||{};ui.cxOpen[id]=!ui.cxOpen[id];render();
    var button=$('[data-act="cxToggle"][data-id="'+id+'"]');if(button)button.focus({preventScroll:true});
  },
  cxJump:function(b){
    var group=document.getElementById('cx-group-'+b.dataset.group);
    if(group){group.focus({preventScroll:true});group.scrollIntoView({block:'start'})}
  },
  cxMonthShift:function(b){
    var step=b.dataset.d;
    ui.cxMonth=addMonths((ui.cxMonth||mesAtual())+'-01',+step).slice(0,7);
    render();
    var control=$('[data-act="cxMonthShift"][data-d="'+step+'"]');if(control)control.focus({preventScroll:true});
  },
  cxGo:function(b){
    ui.dTab='caixinhas';ui.cxOpen={};ui.cxOpen[b.dataset.id]=true;
    closeModal();location.hash='#dinheiro';render();
  },
  cxEdit:function(b){editCx(b.dataset.id)},
  cxSave:function(b){
    var o=obra(b.dataset.id);if(readOnly||!o)return;
    var rates=readCxRates();
    if(!rates){toast('Os percentuais devem somar 100%.');return}
    o.cxPct=rates;closeModal();save('Percentuais atualizados neste projeto.');
  },
  cxReset:function(b){
    var o=obra(b.dataset.id);if(readOnly||!o)return;
    delete o.cxPct;closeModal();save('Percentuais do orçamento restaurados.');
  },
  toggleSide:function(){ui.sideC=!ui.sideC;try{localStorage.setItem('bancada-side',ui.sideC?'1':'0')}catch(e){}render()},
  pView:function(b){ui.pView=b.dataset.v;render()},
  overviewCaixinhas:function(b){ui.cxMonth=b.dataset.month;ui.dTab='caixinhas';render()},
  dTab:function(b){ui.dTab=b.dataset.tab;render()},
  goTab:function(b){ui.dTab=b.dataset.tab;if(location.hash==='#dinheiro')render()},
  recFilter:function(b){ui.recFilter=b.dataset.f;render()},
  receber:function(b){var r=S.receber.find(function(x){return x.id===b.dataset.id});if(b.closest('.modal'))closeModal();r.status='recebido';r.recebidoEm=today();save('Recebimento registrado. Veja em Caixinhas quanto separar.')},
  undoRec:function(b){
    var r=S.receber.find(function(x){return x.id===b.dataset.id});if(!r||readOnly)return;
    var o=obra(r.obraId);
    if(o&&o.cxOk)o.cxOk=o.cxOk.filter(function(id){return id!==r.id});
    delete r.cxSeparacao;r.status='pendente';r.recebidoEm=null;save();
  },
  pagar:function(b){var p=S.pagar.find(function(x){return x.id===b.dataset.id});p.status='pago';p.pagoEm=today();save('Pagamento registrado.')},
  undoPag:function(b){var p=S.pagar.find(function(x){return x.id===b.dataset.id});p.status='pendente';p.pagoEm=null;save()},
  delConta:function(b){openModal({title:'Excluir conta?',body:'<p>Esta conta a pagar será removida.</p>',foot:'<button class="btn btn-danger" data-act="confirmDelConta" data-id="'+b.dataset.id+'">Excluir</button>'})},
  confirmDelConta:function(b){var p=S.pagar.find(function(p){return p.id===b.dataset.id});if(p&&p.key&&p.key.startsWith('fixo-')){var ignored=S.config.contasFixasIgnoradas||(S.config.contasFixasIgnoradas=[]);if(!ignored.includes(p.key))ignored.push(p.key)}S.pagar=S.pagar.filter(function(p){return p.id!==b.dataset.id});closeModal();save('Conta excluída.')},
  configureFixedBills:configureFixedBills,
  saveFixedBills:saveFixedBills,
  openFixedCosts:function(){closeModal();ui.cfg=null;ui.aTab='oficina';location.hash='#ajustes';render();cfgLive()},
  newConta:function(){contaModal()},
  editConta:function(b){var p=S.pagar.find(function(p){return p.id===b.dataset.id});if(p&&p.status!=='pago')contaModal(p)},
  saveConta:function(){
    if(readOnly)return;
    var desc=val('nc-desc').trim(),value=Number(val('nc-val').replace(',','.')),date=val('nc-venc'),id=val('nc-id');
    if(!desc||!Number.isFinite(value)||value<=0||!/^\d{4}-\d{2}-\d{2}$/.test(date)||isoOf(pISO(date))!==date){toast('Preencha descrição, valor maior que zero e vencimento válido.');return}
    var p=id&&S.pagar.find(function(p){return p.id===id});
    if(id&&!p){toast('Esta conta não está mais disponível.');return}
    if(p)Object.assign(p,{desc:desc,categoria:val('nc-cat'),venc:date,valor:value});
    else S.pagar.push({id:uid(),desc:desc,categoria:val('nc-cat'),venc:date,valor:value,status:'pendente'});
    closeModal();ui.dTab='pagar';save('Conta salva.');
  },
  lancarFolha:function(){var m=mesAtual();var venc=addMonths(m+'-05',1);var k=0;
    S.equipe.forEach(function(e){if(e.status==='Desligado'||e.vinculo==='Empreitada')return;var key='folha-'+m+'-'+e.id;if(S.pagar.some(function(p){return p.key===key}))return;
      var v=e.vinculo==='Diarista'?n(e.valor)*n(e.diasMes):n(e.valor);S.pagar.push({id:uid(),key:key,desc:(e.vinculo==='Diarista'?'Diárias':'Salário')+' — '+e.nome,categoria:'Equipe',venc:venc,valor:v,status:'pendente'});k++});
    save(k?k+' pagamento'+(k===1?'':'s')+' da equipe lançado'+(k===1?'':'s')+' para '+fd(venc)+'.':'Os pagamentos deste mês já estavam lançados.')},
  aTab:function(b){ui.aTab=b.dataset.tab;render();cfgLive()},
  exportBackup:exportBackup,
  pickBackup:function(){if(!readOnly)$('#backup-file').click()},
  confirmRestore:function(){if(ui.backup)replaceState(ui.backup,'Backup restaurado.')},
  prepareOperation:function(){
    if(readOnly||S.operacao)return;
    openModal({title:'Começar operação?',body:'<p>Os registros atuais serão substituídos por uma base vazia. O catálogo e os ajustes salvos serão mantidos. Um backup dos dados atuais será baixado antes da troca.</p>',
      foot:'<button class="btn btn-ghost" data-act="closeModal">Cancelar</button><button class="btn btn-primary" data-act="confirmOperation">Exportar backup e começar</button>'});
  },
  confirmOperation:function(){if(!S.operacao)replaceState(emptyOperation(),'Operação iniciada. Revise os custos em Ajustes.')},
  cfgAdd:function(b){var l=b.dataset.list;var it=l==='custosFixos'?{id:uid(),nome:'',valor:0}:l==='formas'?{id:uid(),nome:'',taxa:0,desconto:0,parcelas:1}:l==='fitas'?{id:uid(),nome:'',metros:50,preco:0}:l==='materiais'?{id:uid(),cat:'',nome:'',un:'un.',preco:0}:l==='kits'?{id:uid(),nome:'',itens:[]}:{id:uid(),nome:'',preco:0};ui.cfg[l].push(it);if(l==='materiais')ui.matQ='';if(l==='chapas')ui.chapaMarca='Cadastro da oficina';render();cfgLive();if(l==='materiais'||l==='chapas'){var rs=$$(l==='chapas'?'[data-chapa-marca]':'[data-mat]');var last=rs[rs.length-1];if(last){var inp=last.querySelectorAll('input')[l==='chapas'?0:1];if(inp)inp.focus()}}},
  cfgKitItemAdd:function(b){var k=ui.cfg.kits[+b.dataset.i];var m=ui.cfg.materiais[0];if(!k||!m)return;k.itens=k.itens||[];k.itens.push({id:m.id,qtd:1});render();cfgLive()},
  cfgKitItemDel:function(b){var k=ui.cfg.kits[+b.dataset.i];if(k)k.itens.splice(+b.dataset.j,1);render();cfgLive()},
  cfgDel:function(b){ui.cfg[b.dataset.list].splice(+b.dataset.i,1);render();cfgLive()},
  cfgReset:function(){ui.cfg=clone(S.config);render();cfgLive()},
  cfgSave:function(){
    var C=ui.cfg;['chapas','fitas','kits','formas','custosFixos','materiais'].forEach(function(l){C[l]=(C[l]||[]).filter(function(x){return String(x.nome||'').trim()})});C.kits.forEach(function(k){k.itens=(k.itens||[]).filter(function(r){return r.id&&n(r.qtd)>0&&C.materiais.some(function(m){return m.id===r.id})})});
    S.config=clone(C);save('Ajustes salvos. Orçamentos em aberto com preço alterado aparecem no Início.');cfgLive()},
  newPessoa:function(){pessoaModal(null)},
  editPessoa:function(b){pessoaModal(S.equipe.find(function(e){return e.id===b.dataset.id}))},
  savePessoa:function(b){var id=b.dataset.id;var e=S.equipe.find(function(x){return x.id===id});var isNew=!e;e=e||{id:id};
    var nome=val('pe-nome');if(!nome){toast('Informe o nome.');return}
    Object.assign(e,{nome:nome,funcao:val('pe-funcao'),vinculo:val('pe-vinculo'),valor:n(val('pe-valor')),diasMes:n(val('pe-dias')),horasSemana:n(val('pe-horas')),status:val('pe-status'),inicio:val('pe-inicio'),telefone:val('pe-tel')});
    if(isNew)S.equipe.push(e);closeModal();save('Equipe atualizada. Custo da hora: '+brl(oficina().custoHora)+'.')},
  delPessoa:function(b){S.equipe=S.equipe.filter(function(e){return e.id!==b.dataset.id});closeModal();save('Pessoa removida.')}
};
function showText(txt){openModal({title:'Proposta para copiar',body:'<p class="muted small">Selecione o texto e copie.</p><textarea class="in" style="min-height:260px" readonly>'+esc(txt)+'</textarea>'})}

document.addEventListener('click',function(e){
  var b=e.target.closest('[data-act]');if(!b)return;
  if(cloudEnabled&&!S)return;
  if(cloudEnabled&&readOnly&&!['exportBackup','cloudDiscard','cloudConfirmDiscard','closeModal','bgClose','toggleSide'].includes(b.dataset.act)){
    toast('Exporte as alterações pendentes e carregue a versão mais recente da nuvem.');return;
  }
  var a=A[b.dataset.act];if(!a)return;
  if(b.tagName==='BUTTON'||b.getAttribute('role')==='button')e.preventDefault();
  a(b,e);
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&$('#modal-root').innerHTML)closeModal();
  if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role="button"][data-act]')){e.preventDefault();e.target.click()}
});
document.addEventListener('input',function(e){
  if(cloudEnabled&&(!S||readOnly))return;
  var t=e.target;
  if(t.id&&t.id.startsWith('cx-rate-')){readCxRates();return}
  if(t.dataset&&t.dataset.importSearch){var select=$('#'+t.dataset.importSearch),terms=mobcloudKey(t.value).replace(/hannover/g,'hanover').replace(/frejo/g,'freijo').split(/\s+/).filter(Boolean);Array.from(select.options).forEach(function(o){o.hidden=!!o.value&&o.value!==select.value&&!terms.every(function(term){return mobcloudKey(o.textContent).includes(term)})});return}
  if(t.id==='material-search'){$('#material-results').innerHTML=materialResults(t.value);return}
  if(t.id==='ap-forma'||t.id==='ap-prim'||t.id==='ap-ent'){apCx();return}
  if(t.id==='q-search'){ui.qSearch=t.value;var p=t.selectionStart;render();var s=$('#q-search');s.focus();try{s.setSelectionRange(p,p)}catch(x){}return}
  if(t.id==='c-search'){ui.cSearch=t.value;var p2=t.selectionStart;render();var s2=$('#c-search');s2.focus();try{s2.setSelectionRange(p2,p2)}catch(x){}return}
  if(t.id==='mat-q'){ui.matQ=t.value;var qq=t.value.trim().toLowerCase();$$('[data-mat]').forEach(function(r){r.hidden=!!qq&&r.dataset.mat.indexOf(qq)<0});return}
  if(t.closest&&t.closest('#ed-form,#proposal-fields')){onEditorInput(e);if(t.matches('[data-f],[data-row],[data-q],[data-cond],[data-dias],[data-delivery]'))autoSaveDraft();return}
  if(t.dataset&&t.dataset.rv&&ui.draft){var v=t.value===''?'':n(t.value);if(t.dataset.rv==='margem'){ui.draft.margemManual=v;$$('[data-rv="margem"]').forEach(function(x){if(x!==t)x.value=v})}else ui.draft.multN=v;refreshReview();autoSaveDraft();return}
  if(t.dataset&&t.dataset.c){
    var catalogPrice=t.hasAttribute('data-catalog-price');
    var v=t.type==='checkbox'?t.checked:(t.type==='number'?(t.value===''?(catalogPrice?null:0):n(t.value)):t.value);
    if(catalogPrice){
      var sheet=ui.cfg.chapas[+t.dataset.c.split('.')[1]];
      if(sheet.precoRef&&sheet.preco!==v){
        delete sheet.precoRef;
        var source=t.parentElement.querySelector('[data-price-source]');if(source)source.textContent='';
      }
    }
    setPath(ui.cfg,t.dataset.c,v);cfgLive();var ab=$('#cfg-actions [data-act="cfgReset"]');if(ab)ab.disabled=false;
  }
});
document.addEventListener('change',function(e){
  if(cloudEnabled&&(!S||readOnly))return;
  var t=e.target;
  if(t.id==='mobcloud-file'){openMobcloudFile(t);return}
  var mobItem=(t.id||'').match(/^mob-itens-(\d+)$/);
  if(mobItem){mobcloudComponentChanged(t,+mobItem[1]);return}
  if(t.id==='cx-month'){
    if(/^\d{4}-(0[1-9]|1[0-2])$/.test(t.value))ui.cxMonth=t.value;
    render();
    var month=$('#cx-month');if(month)month.focus({preventScroll:true});return;
  }
  if(t.id==='backup-file'){var file=t.files[0];t.value='';prepareRestore(file);return}
  if(t.id==='chapa-marca'){ui.chapaMarca=t.value;$$('[data-chapa-marca]').forEach(function(r){r.hidden=!!t.value&&r.dataset.chapaMarca!==t.value});return}
  if(t.id==='ap-forma'||t.id==='ap-prim'||t.id==='ap-ent'){apCx();return}
  if(t.dataset&&t.dataset.c&&t.type==='checkbox'){setPath(ui.cfg,t.dataset.c,t.checked);cfgLive()}
  if(t.dataset&&t.dataset.c&&/^kits\./.test(t.dataset.c)&&ui.aTab==='materiais'){var y=window.scrollY;render();cfgLive();window.scrollTo(0,y)}
});
document.addEventListener('mousemove',chartHover);
window.addEventListener('hashchange',function(){if(location.hash!=='#orcamentos'){ui.quoteId=null;ui.draft=null}if(location.hash!=='#ajustes')ui.cfg=null;closeModal();render();cfgLive();window.scrollTo(0,0)});

if(cloudEnabled)bootCloud();
else{loadState();restoreUI();render();if(ui.quoteId&&ui.draft)live();cfgLive();initCap()}
window.__bancada={calcQuote:calcQuote,calcCond:calcCond,oficina:oficina,getS:function(){return S}};
})();
