# Bancada

Gestão de marcenaria: orçamentos, propostas, projetos, clientes e financeiro.

- **Aplicativo:** [bancada-theta-azure.vercel.app](https://bancada-theta-azure.vercel.app/)
- **Código:** [peresmayda/bancada](https://github.com/peresmayda/bancada)

## Começar no computador

Use Node.js 22.16 ou mais recente. O projeto não exige instalação de dependências.

1. Copie `.env.example` para `.env.local` e preencha a URL e a chave **publicável** do Supabase.
2. Execute `npm run dev`.
3. Abra [127.0.0.1:8765](http://127.0.0.1:8765).

O ambiente local acessa o banco configurado. Use uma conta de teste para experimentar sem alterar a oficina real.

## Estrutura

| Pasta ou arquivo | Conteúdo |
| --- | --- |
| `src/index.html` | Estrutura da página, sem dados de clientes |
| `src/app.js` | Regras de negócio, telas, importação e propostas |
| `src/cloud.js` | Cadastro, login, sessão e sincronização |
| `src/styles/` | Estilos do aplicativo e da entrada |
| `src/vendor/` | PDF.js incorporado e sua licença |
| `scripts/` | Montagem e servidor local |
| `supabase/` | Estrutura do banco e regras de acesso |
| `docs/` | Operação, regras do produto e pesquisa de materiais |
| `dist/` | Publicação gerada; não editar nem enviar ao GitHub |
| `arquivo/` | Recuperação histórica local; não enviar ao GitHub |

## Validar e publicar

`npm run check` verifica a sintaxe. `npm run build` valida a configuração e gera os três arquivos de publicação em `dist/`.

A Vercel publica automaticamente o ramo `main`, usando `vercel.json`. Configure `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` nos ambientes de publicação. Faça alterações em um ramo, confira a prévia da Vercel e só então integre ao `main`.

Os scripts e estilos continuam incorporados no HTML gerado para preservar a exportação de propostas. Edite os arquivos de `src/`, não o resultado da montagem. Versões anteriores do código ficam no histórico do Git.

## Dados e documentação

Cada conta tem sua própria oficina no Supabase. Publicar código não substitui os dados. Backups da operação são exportados em **Ajustes** e devem ficar fora do repositório.

- [Contas, banco, publicação e backups](docs/operacao.md)
- [Regras de negócio e decisões de interface](docs/regras-do-produto.md)
- [Fontes e método dos preços de MDF](docs/pesquisa-mdf.md)

A confirmação de e-mail está desligada durante os testes; o envio de recuperação depende de SMTP configurado. Consulte o guia de operação antes de mudar essa configuração.
