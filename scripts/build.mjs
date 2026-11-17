import { mkdir, readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const label = '<script id="app-js">';
const url = process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();

if (!url || !key) {
  throw new Error('Configure SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY na Vercel.');
}

// Somente a chave publicável pode ser incluída no navegador.
const endpoint = new URL(url);
if (endpoint.protocol !== 'https:' || endpoint.origin !== url.replace(/\/$/, '') ||
    !endpoint.hostname.endsWith('.supabase.co') || !/^sb_publishable_[\w-]+$/.test(key)) {
  throw new Error('Use a URL HTTPS do projeto e uma chave sb_publishable_ do Supabase.');
}

const html = await readFile(new URL('index.html', root), 'utf8');
const cloud = await readFile(new URL('bancada-cloud.js', root), 'utf8');
const loginCss = await readFile(new URL('login.css', root), 'utf8');
if (!html.includes(label) || !html.includes('cloud.start()')) {
  throw new Error('O index.html não contém a inicialização do Bancada na nuvem.');
}

await mkdir(new URL('dist/', root), { recursive: true });
await writeFile(new URL('dist/login.css', root), loginCss);
await writeFile(new URL('dist/bancada-cloud.js', root),
  'window.BancadaCloudConfig = ' + JSON.stringify({ url: endpoint.origin, key }) + ';\n' + cloud);
await writeFile(new URL('dist/index.html', root), html.replace('</head>', '<link rel="stylesheet" href="./login.css"></head>').replace(label,
  '<script>window.bancadaCloudRequired=true;</script><script src="./bancada-cloud.js"></script>\n' + label));
