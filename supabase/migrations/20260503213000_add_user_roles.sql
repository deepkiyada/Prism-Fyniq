create type app_role as enum ('super_admin', 'user');

create table if not exists app_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_auth_user_upsert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_users (user_id, email)
  values (new.id, coalesce(new.email, 'unknown@example.com'))
  on conflict (user_id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_upsert on auth.users;
create trigger on_auth_user_upsert
after insert or update of email on auth.users
for each row execute procedure public.handle_auth_user_upsert();

insert into public.app_users (user_id, email)
select id, coalesce(email, 'unknown@example.com')
from auth.users
on conflict (user_id) do update
  set email = excluded.email,
      updated_at = now();

with first_user as (
  select id from auth.users order by created_at asc limit 1
)
update public.app_users
set role = 'super_admin'::app_role,
    updated_at = now()
where user_id in (select id from first_user)
  and not exists (
    select 1
    from public.app_users
    where role = 'super_admin'
  );
