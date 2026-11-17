-- Bancada: uma oficina por conta.
-- Cada pessoa cria a própria conta e só lê e grava a própria base.
-- Rodar inteiro no SQL Editor do Supabase. Apaga a estrutura anterior
-- (oficina compartilhada com convites) e os dados salvos nela.

begin;

drop function if exists public.bancada_entrar();
drop table if exists public.bancada_estado cascade;
drop table if exists public.bancada_convites cascade;
drop table if exists public.bancada_acessos cascade;
drop function if exists public.bancada_incrementar_revisao();

create table public.bancada_estado (
  usuario uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  revisao bigint not null default 0 check (revisao >= 0),
  atualizado_em timestamptz not null default now(),
  dados jsonb check (
    dados is null or (
      jsonb_typeof(dados) = 'object'
      and dados ?& array['v','config','clientes','orcamentos','obras','receber','pagar','equipe']
      and dados->'v' = '3'::jsonb
      and jsonb_typeof(dados->'config') = 'object'
      and jsonb_typeof(dados->'clientes') = 'array'
      and jsonb_typeof(dados->'orcamentos') = 'array'
      and jsonb_typeof(dados->'obras') = 'array'
      and jsonb_typeof(dados->'receber') = 'array'
      and jsonb_typeof(dados->'pagar') = 'array'
      and jsonb_typeof(dados->'equipe') = 'array'
    )
  )
);

alter table public.bancada_estado enable row level security;

revoke all on public.bancada_estado from public, anon, authenticated;
grant select on public.bancada_estado to authenticated;
grant insert (usuario) on public.bancada_estado to authenticated;
grant update (dados) on public.bancada_estado to authenticated;

create policy bancada_ler_propria on public.bancada_estado
  for select to authenticated
  using (usuario = (select auth.uid()));

create policy bancada_criar_propria on public.bancada_estado
  for insert to authenticated
  with check (usuario = (select auth.uid()));

create policy bancada_gravar_propria on public.bancada_estado
  for update to authenticated
  using (usuario = (select auth.uid()))
  with check (usuario = (select auth.uid()));

-- Cada gravação aumenta a revisão. O aplicativo grava só se a revisão
-- ainda for a que ele leu; assim, duas abas da mesma conta não se sobrescrevem.
create function public.bancada_incrementar_revisao()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.revisao := old.revisao + 1;
  new.atualizado_em := now();
  return new;
end;
$$;

revoke execute on function public.bancada_incrementar_revisao() from public, anon, authenticated;

create trigger bancada_revisao before update on public.bancada_estado
for each row execute function public.bancada_incrementar_revisao();

commit;
