create table if not exists review_reactions (
  user_id bigint not null references users(id) on delete cascade,
  review_id bigint not null references reviews(id) on delete cascade,
  reaction text not null check (reaction in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  primary key (user_id, review_id)
);
