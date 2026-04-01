-- Run this inside the tattoo_salon database
create table if not exists users (
  id bigserial primary key,
  email text not null unique,
  password_hash text not null,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

-- in case table already existed before role was added
alter table users
  add column if not exists role text not null default 'user';

-- seed default accounts (password_hash is placeholder for now)
insert into users (email, password_hash, role)
values
  ('user@example.com', 'user123', 'user'),
  ('master@example.com', 'master123', 'master'),
  ('admin@example.com', 'admin123', 'admin')
on conflict (email) do update
set password_hash = excluded.password_hash,
    role = excluded.role;

-- remove old placeholder accounts if they exist
delete from users
where email in ('admin@tattoo.local', 'manager@tattoo.local', 'user@tattoo.local');
