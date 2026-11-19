import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { Script } from 'node:vm';

const root = new URL('../', import.meta.url);
const localEnv = new URL('.env.local', root);
if (existsSync(localEnv)) process.loadEnvFile(localEnv);

const url = process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
if (!url || !key) throw new Error('Configure SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY na Vercel ou em .env.local.');

// Somente a chave publicável pode ser incluída no navegador.
const endpoint = new URL(url);
if (endpoint.protocol !== 'https:' || endpoint.origin !== url.replace(/\/$/, '') ||
    !endpoint.hostname.endsWith('.supabase.co') || !/^sb_publishable_[\w-]+$/.test(key)) {
  throw new Error('Use a URL HTTPS do projeto e uma chave sb_publishable_ do Supabase.');
}

const read = path => readFile(new URL(path, root), 'utf8');
const [template, app, css, pdf, cloud, loginCss] = await Promise.all([
  read('src/index.html'), read('src/app.js'), read('src/styles/app.css'),
  read('src/vendor/pdfjs.bundle.json'), read('src/cloud.js'), read('src/styles/login.css'),
]);
new Script(app, { filename: 'src/app.js' });
new Script(cloud, { filename: 'src/cloud.js' });
const bundle = JSON.parse(pdf);
if (!bundle.version || !bundle.core || !bundle.worker || !bundle.license) throw new Error('Pacote PDF.js incompleto.');
if (!template.includes('id="app-state">null</script>') || !app.includes('cloud.start()')) {
  throw new Error('A publicação deve começar sem dados de demonstração e com login.');
}

let html = template;
for (const [marker, content] of [
  ['<!-- BANCADA_STYLES -->', '<style id="app-css">' + css + '</style>'],
  ['<!-- BANCADA_PDF -->', '<script type="application/json" id="mobcloud-pdf-bundle">' + pdf + '</script>'],
  ['<!-- BANCADA_SCRIPT -->', '<script id="app-js">' + app + '</script>'],
]) {
  if (html.split(marker).length !== 2) throw new Error('Marcador ausente ou duplicado: ' + marker);
  html = html.replace(marker, () => content);
}

// O aplicativo exporta propostas usando estes blocos incorporados no documento.
const label = '<script id="app-js">';
html = html.replace('</head>', '<link rel="stylesheet" href="./login.css"></head>').replace(label,
  '<script>window.bancadaCloudRequired=true;</script><script src="./bancada-cloud.js"></script>\n' + label);
await mkdir(new URL('dist/', root), { recursive: true });
await Promise.all([
  writeFile(new URL('dist/index.html', root), html),
  writeFile(new URL('dist/login.css', root), loginCss),
  writeFile(new URL('dist/bancada-cloud.js', root),
    'window.BancadaCloudConfig = ' + JSON.stringify({ url: endpoint.origin, key }) + ';\n' + cloud),
]);
console.log('Bancada pronto em dist/.');
