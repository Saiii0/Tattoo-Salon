create table if not exists users (
  id bigserial primary key,
  name text not null default '',
  email text not null unique,
  password_hash text not null,
  role text not null default 'user',
  avatar text,
  rating numeric(3,2) default 0,
  services_count integer default 0,
  created_at timestamptz not null default now()
);

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

create table if not exists services (
  id bigserial primary key,
  name text not null,
  description text not null,
  price integer not null,
  duration integer not null,
  image_url text not null,
  rating numeric(3,2) default 0,
  reviews_count integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id bigserial primary key,
  service_id bigint not null references services(id) on delete cascade,
  user_id bigint not null references users(id) on delete cascade,
  master_id bigint references users(id) on delete set null,
  status text not null default 'pending',
  date date not null,
  time_slot text,
  price integer not null,
  has_review boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id bigserial primary key,
  service_id bigint not null references services(id) on delete cascade,
  user_id bigint not null references users(id) on delete cascade,
  rating integer not null,
  comment text not null,
  likes integer not null default 0,
  dislikes integer not null default 0,
  deleted boolean not null default false,
  created_at date not null default current_date
);

create table if not exists favorites (
  user_id bigint not null references users(id) on delete cascade,
  service_id bigint not null references services(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, service_id)
);

create table if not exists client_history (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  service_id bigint not null references services(id) on delete cascade,
  date date not null,
  rating integer not null
);
