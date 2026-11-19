# Orientações do projeto

Leia README.md, docs/operacao.md e docs/regras-do-produto.md antes de alterar o Bancada.

- Esta raiz é o único repositório e src/ é a única fonte do aplicativo. Não recrie cópias de publicação nem versões HTML numeradas.
- Edite src/app.js, src/cloud.js, src/styles/ e o modelo src/index.html. Não edite dist/.
- Preserve a ordem da cascata CSS e os identificadores dos blocos incorporados: a exportação de propostas depende deles.
- Execute npm run check e npm run build antes de publicar. Confira a prévia antes do main.
- Preserve contas, dados, revisões e filas offline. Não altere chaves de armazenamento sem migração.
- supabase/bancada.sql é idempotente. Nunca acrescente drop table; mudanças de estrutura vão em uma migração nova, sem apagar oficinas.
- O estado atual é versão 3. Uma mudança de formato exige compatibilidade com a validação do banco e migração dos dados.
- Não inclua senhas, chaves administrativas, dados de clientes ou backups no Git. Use apenas a chave publicável no navegador.
- arquivo/ contém recuperação histórica local. Não publique nem apague esse arquivo sem necessidade.
- O Supabase de produção pertence à organização Studio Noar. Prévia e produção compartilham o banco se usarem a mesma configuração: use conta de teste.

Decisões atuais: uma oficina por conta, cadastro por e-mail e senha, confirmação de e-mail desligada durante os testes. Não introduza perfis master, compartilhamento de oficina ou mudanças de autenticação como parte de uma limpeza de arquivos.
