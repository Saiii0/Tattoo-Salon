alter table users
  add column if not exists name text not null default '';
alter table users
  add column if not exists role text not null default 'user';
alter table users
  add column if not exists avatar text;
alter table users
  add column if not exists rating numeric(3,2) default 0;
alter table users
  add column if not exists services_count integer default 0;
