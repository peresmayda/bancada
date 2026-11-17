# Bancada

Sistema de gestão para marcenaria. Abra `index.html` no navegador para usar a versão local desta pasta.

A versão com login fica em [bancada-theta-azure.vercel.app](https://bancada-theta-azure.vercel.app/).
Ela usa o projeto Bancada na organização Studio Noar do Supabase, com banco na região de São Paulo.

## Como funciona

- Qualquer pessoa cria a própria conta na tela de entrada, com e-mail e senha.
- Cada conta tem uma oficina só dela. A primeira entrada cria uma base vazia, com o catálogo de materiais e os ajustes padrão.
- As regras de segurança do Supabase só deixam cada conta ler e gravar a própria base.
- A conta fica conectada no aparelho até a pessoa clicar em **Sair**.
- Se a mesma conta gravar em duas abas ou aparelhos ao mesmo tempo, a segunda gravação mostra um conflito. Exporte as alterações antes de carregar a versão salva.

## Supabase

1. No **SQL Editor**, rode o arquivo `supabase/bancada.sql` inteiro. Ele apaga a estrutura anterior (oficina compartilhada com convites) e cria a tabela `bancada_estado`, com uma linha por conta.
2. Em **Authentication → Sign In / Providers → Email**, mantenha o cadastro ligado e desligue **Confirm email** enquanto o sistema estiver em teste. Assim a conta funciona na hora, sem depender de envio de e-mail.
3. Para voltar a pedir confirmação, ligue **Confirm email** e configure um SMTP próprio em **Authentication → Emails → SMTP Settings**. O envio padrão do Supabase só entrega para quem faz parte da equipe do projeto.
4. No plano gratuito, um projeto sem uso por 7 dias é pausado. Os dados ficam guardados e o projeto volta ao reativar no painel.

## Vercel

A publicação na Vercel executa `npm run build` e usa a pasta `dist`.
Configure `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` nas variáveis do projeto.
A chave aceita tem prefixo `sb_publishable_`. A compilação interrompe a publicação quando a configuração está incompleta.

Publique o código novo e rode o SQL no mesmo momento: a versão anterior do código procura a estrutura antiga do banco.

## Versões novas

- Os dados de cada conta ficam no Supabase e não mudam quando uma versão nova é publicada.
- Se uma versão mudar o formato dos dados, a função `migrate` do `index.html` converte os dados antigos quando a pessoa abre o sistema.
- Com o código num repositório do GitHub ligado à Vercel, cada ramo de teste ganha um endereço de prévia antes de ir para o endereço principal.

## Backup

O plano gratuito do Supabase não oferece backup para baixar. Cada pessoa pode exportar o próprio backup em **Ajustes** e restaurá-lo pelo mesmo lugar. O arquivo de backup contém dados da operação e deve ficar fora do repositório.
