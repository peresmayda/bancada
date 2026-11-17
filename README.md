# Bancada

Sistema de gestão para marcenaria. Abra `index.html` no navegador para usar a versão local desta pasta.

A versão com login fica em [bancada-theta-azure.vercel.app](https://bancada-theta-azure.vercel.app/).
Ela usa o projeto Bancada na organização Studio Noar do Supabase, com banco na região de São Paulo.

## Vercel e Supabase

A publicação na Vercel executa `npm run build` e usa a pasta `dist`.
Configure `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` nas variáveis do projeto.
A chave aceita tem prefixo `sb_publishable_`. A compilação interrompe a publicação quando a configuração está incompleta.

O arquivo `supabase/bancada.sql` prepara uma base compartilhada da oficina e as permissões de leitura e gravação.
Um administrador deve criar os usuários no Supabase Auth e aprovar os e-mails em `bancada_convites`, com perfil `master` ou `operacao`.
O primeiro login de uma conta com e-mail confirmado registra o acesso automaticamente.
O aplicativo publicado pede e-mail e senha antes de carregar a base.
Os dois perfis têm acesso de leitura e edição à mesma oficina. A conta do Studio administra os usuários e a lista de acesso pelo painel do Supabase.

Se houver alterações simultâneas, a segunda gravação apresenta um conflito. Exporte as alterações pendentes antes de carregar a versão salva por outra pessoa.
O painel superior mostra a situação da sincronização e permite atualizar os dados ou sair da conta.

## Publicar no GitHub Pages

1. Crie um repositório chamado `bancada` na sua conta do GitHub. No plano gratuito, o GitHub Pages exige um repositório público.
2. Envie os arquivos desta pasta para a raiz da branch `main`.
3. Abra **Settings → Pages**. Em **Build and deployment**, selecione **Deploy from a branch**, escolha **main** e **/ (root)**, e salve.
4. Abra o endereço exibido na tela de Pages. Para um repositório `bancada` na conta `peresmayda`, o endereço padrão é `https://peresmayda.github.io/bancada/`.

[Configuração do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Começar a usar

- Para trazer os lançamentos e ajustes da versão local, exporte um backup em **Ajustes** na versão local. Abra o endereço novo e use **Restaurar backup** em **Ajustes**. O arquivo de backup contém dados da operação e deve ficar fora do repositório.
- Para começar do zero, preencha os dados da marcenaria, os custos da oficina e a equipe em **Ajustes**. Os preços de referência do catálogo MDF vêm junto com o aplicativo.
- Cada navegador guarda sua própria base. Para transferir os dados entre dispositivos ou endereços, use o backup do Bancada.