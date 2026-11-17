begin;

-- Uma base da oficina. O cadastro de acesso é feito pelo administrador do projeto.
create table public.bancada_acessos (
  usuario uuid primary key references auth.users(id) on delete cascade,
  perfil text not null default 'operacao' check (perfil in ('master', 'operacao'))
);

create table public.bancada_convites (
  email text primary key check (email = lower(trim(email))),
  perfil text not null check (perfil in ('master', 'operacao'))
);
alter table public.bancada_convites enable row level security;
revoke all on public.bancada_convites from public, anon, authenticated;

create table public.bancada_estado (
  id smallint primary key check (id = 1),
  revisao bigint not null default 0 check (revisao >= 0),
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

insert into public.bancada_estado (id) values (1);

alter table public.bancada_acessos enable row level security;
alter table public.bancada_estado enable row level security;

revoke all on public.bancada_acessos, public.bancada_estado from public, anon, authenticated;
grant select on public.bancada_acessos, public.bancada_estado to authenticated;
grant update (dados) on public.bancada_estado to authenticated;

create policy bancada_proprio_acesso on public.bancada_acessos
  for select to authenticated
  using (usuario = (select auth.uid()));

create policy bancada_ler_estado on public.bancada_estado
  for select to authenticated
  using (exists (
    select 1 from public.bancada_acessos where usuario = (select auth.uid())
  ));

create policy bancada_gravar_estado on public.bancada_estado
  for update to authenticated
  using (exists (
    select 1 from public.bancada_acessos where usuario = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.bancada_acessos where usuario = (select auth.uid())
  ));

create function public.bancada_incrementar_revisao()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.revisao := old.revisao + 1;
  return new;
end;
$$;

revoke execute on function public.bancada_incrementar_revisao() from public, anon, authenticated;

create trigger bancada_revisao before update on public.bancada_estado
for each row execute function public.bancada_incrementar_revisao();

-- Autoriza somente a identidade autenticada e com e-mail confirmado.
-- A lista de e-mails autorizados é cadastrada pelo administrador no Supabase.
create function public.bancada_entrar()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  identidade uuid := auth.uid();
  nivel text;
begin
  if identidade is null then
    raise exception 'Entre no Bancada para continuar.' using errcode = '42501';
  end if;

  select convite.perfil into nivel
  from auth.users as pessoa
  join public.bancada_convites as convite on convite.email = lower(pessoa.email)
  where pessoa.id = identidade and pessoa.email_confirmed_at is not null;

  if nivel is null then
    raise exception 'Esta conta ainda não tem acesso à oficina.' using errcode = '42501';
  end if;

  insert into public.bancada_acessos (usuario, perfil) values (identidade, nivel)
  on conflict (usuario) do update set perfil = excluded.perfil;
  return nivel;
end;
$$;
revoke all on function public.bancada_entrar() from public, anon, authenticated;
grant execute on function public.bancada_entrar() to authenticated;

commit;
