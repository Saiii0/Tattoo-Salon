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

insert into users (name, email, password_hash, role, avatar, rating, services_count)
values
  ('Пользователь', 'user@example.com', 'user123', 'user', 'https://i.pravatar.cc/150?img=12', 0, 0),
  ('Тату мастер', 'master@example.com', 'master123', 'master', 'https://i.pravatar.cc/150?img=5', 4.8, 24),
  ('Администратор', 'admin@example.com', 'admin123', 'admin', 'https://i.pravatar.cc/150?img=8', 0, 0),
  ('Анна Смирнова', 'anna@example.com', 'user123', 'user', 'https://i.pravatar.cc/150?img=9', 0, 0),
  ('Дмитрий Мастеров', 'dmitry@example.com', 'master123', 'master', 'https://i.pravatar.cc/150?img=11', 4.9, 35),
  ('Дмитрий Козлов', 'dkozlov@example.com', 'user123', 'user', 'https://i.pravatar.cc/150?img=8', 0, 0),
  ('Елена Волкова', 'elena@example.com', 'user123', 'user', 'https://i.pravatar.cc/150?img=9', 0, 0),
  ('Александр Новиков', 'alex@example.com', 'user123', 'user', 'https://i.pravatar.cc/150?img=11', 0, 0),
  ('Ольга Морозова', 'olga@example.com', 'user123', 'user', 'https://i.pravatar.cc/150?img=16', 0, 0),
  ('Сергей Иванов', 'sergey@example.com', 'user123', 'user', 'https://i.pravatar.cc/150?img=13', 0, 0),
  ('Мария Петрова', 'maria@example.com', 'user123', 'user', 'https://i.pravatar.cc/150?img=20', 0, 0),
  ('Николай Сидоров', 'nikolay@example.com', 'user123', 'user', 'https://i.pravatar.cc/150?img=15', 0, 0),
  ('Татьяна Белова', 'tatiana@example.com', 'user123', 'user', 'https://i.pravatar.cc/150?img=23', 0, 0),
  ('Виктор Кузнецов', 'victor@example.com', 'user123', 'user', 'https://i.pravatar.cc/150?img=17', 0, 0),
  ('Екатерина Соколова', 'ekaterina@example.com', 'user123', 'user', 'https://i.pravatar.cc/150?img=26', 0, 0)
on conflict (email) do update
set password_hash = excluded.password_hash,
    role = excluded.role,
    name = excluded.name,
    avatar = excluded.avatar,
    rating = excluded.rating,
    services_count = excluded.services_count;

insert into services (name, description, price, duration, image_url, rating, reviews_count)
select * from (values
  ('Чёрно-белая тату', 'Классическая чёрно-белая татуировка в различных стилях. Идеально подходит для первой татуировки или для тех, кто предпочитает монохромный стиль.', 5000, 120, 'https://images.unsplash.com/photo-1561377455-190afb395ed7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YXR0b28lMjBhcnQlMjBibGFja3xlbnwxfHx8fDE3NzIxOTg1NTN8MA&ixlib=rb-4.1.0&q=80&w=1080', 4.7, 45),
  ('Тату-рукав', 'Полноценный тату-рукав с яркими цветами и детализированным дизайном. Работа выполняется в несколько сеансов для достижения наилучшего результата.', 35000, 480, 'https://images.unsplash.com/photo-1620045284735-21555f138704?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YXR0b28lMjBzbGVldmUlMjBjb2xvcmZ1bHxlbnwxfHx8fDE3NzIxOTg1NTR8MA&ixlib=rb-4.1.0&q=80&w=1080', 4.9, 28),
  ('Минималистичная тату', 'Небольшая минималистичная татуировка с простыми линиями и формами. Отлично подходит для тех, кто хочет что-то сдержанное и элегантное.', 3000, 60, 'https://images.unsplash.com/photo-1566878823675-bcfccb9c5dbd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFsbCUyMG1pbmltYWxpc3QlMjB0YXR0b298ZW58MXx8fHwxNzcyMTk4NTU0fDA&ixlib=rb-4.1.0&q=80&w=1080', 4.6, 67),
  ('Реалистичный портрет', 'Реалистичная портретная татуировка с высокой детализацией. Требует опытного мастера и нескольких сеансов для создания фотореалистичного эффекта.', 25000, 360, 'https://images.unsplash.com/photo-1585745422697-1b42b98aac14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHRhdHRvbyUyMHJlYWxpc3RpY3xlbnwxfHx8fDE3NzIxOTg1NTR8MA&ixlib=rb-4.1.0&q=80&w=1080', 5.0, 12),
  ('Геометрия', 'Геометрическая татуировка с точными линиями и симметричными формами. Современный стиль, требующий высокой точности исполнения.', 7000, 150, 'https://images.unsplash.com/photo-1653845508077-3a15db13f807?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxnZW9tZXRyaWMlMjB0YXR0b28lMjBkZXNpZ258ZW58MXx8fHwxNzcyMTA5NTk4fDA&ixlib=rb-4.1.0&q=80&w=1080', 4.8, 34),
  ('Traditional стиль', 'Традиционная американская татуировка с яркими цветами и чёткими контурами. Классический олд-скул стиль, который никогда не выходит из моды.', 8000, 180, 'https://images.unsplash.com/photo-1770224097206-c1e39d61b4a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHx0cmFkaXRpb25hbCUyMHRhdHRvb3xlbnwxfHx8fDE3NzIxOTg1NTV8MA&ixlib=rb-4.1.0&q=80&w=1080', 4.7, 52),
  ('Коррекция тату', 'Коррекция и улучшение существующей татуировки. Восстановление цвета, исправление линий, или полное переосмысление старой работы.', 4000, 90, 'https://images.unsplash.com/photo-1561377455-190afb395ed7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHx0YXR0b28lMjBhcnQlMjBibGFja3xlbnwxfHx8fDE3NzIxOTg1NTN8MA&ixlib=rb-4.1.0&q=80&w=1080', 4.5, 23),
  ('Акварель', 'Татуировка в стиле акварельной живописи с плавными переходами цветов и эффектом разбрызганной краски.', 12000, 240, 'https://images.unsplash.com/photo-1620045284735-21555f138704?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHx0YXR0b28lMjBzbGVldmUlMjBjb2xvcmZ1bHxlbnwxfHx8fDE3NzIxOTg1NTR8MA&ixlib=rb-4.1.0&q=80&w=1080', 4.9, 18)
) as v(name, description, price, duration, image_url, rating, reviews_count)
where not exists (select 1 from services);

insert into reviews (service_id, user_id, rating, comment, likes, dislikes, created_at)
select * from (values
  ((select id from services where name = 'Чёрно-белая тату'), (select id from users where email = 'anna@example.com'), 5, 'Отличная работа! Мастер очень профессиональный, всё сделал быстро и качественно. Результатом очень довольна!', 12, 0, DATE '2026-02-20'),
  ((select id from services where name = 'Чёрно-белая тату'), (select id from users where email = 'dkozlov@example.com'), 4, 'Хорошо, но пришлось немного подождать. В целом доволен.', 5, 1, DATE '2026-02-15'),
  ((select id from services where name = 'Тату-рукав'), (select id from users where email = 'elena@example.com'), 5, 'Невероятно! Рукав получился лучше, чем я могла представить. Мастер - настоящий профессионал своего дела!', 28, 0, DATE '2026-02-10'),
  ((select id from services where name = 'Минималистичная тату'), (select id from users where email = 'alex@example.com'), 5, 'Первая татуировка, было немного страшно, но всё прошло отлично! Рекомендую!', 15, 0, DATE '2026-02-25'),
  ((select id from services where name = 'Реалистичный портрет'), (select id from users where email = 'olga@example.com'), 5, 'Портрет моей бабушки получился невероятно реалистичным. Я в восторге!', 42, 1, DATE '2026-01-28')
) as v(service_id, user_id, rating, comment, likes, dislikes, created_at)
where not exists (select 1 from reviews);

insert into orders (service_id, user_id, status, date, time_slot, price, master_id)
select * from (values
  ((select id from services where name = 'Чёрно-белая тату'), (select id from users where email = 'sergey@example.com'), 'pending', DATE '2026-02-28', '10:00', 5000, null),
  ((select id from services where name = 'Тату-рукав'), (select id from users where email = 'maria@example.com'), 'pending', DATE '2026-03-01', '14:00', 35000, null),
  ((select id from services where name = 'Минималистичная тату'), (select id from users where email = 'nikolay@example.com'), 'approved', DATE '2026-02-28', '12:00', 3000, (select id from users where email = 'master@example.com')),
  ((select id from services where name = 'Геометрия'), (select id from users where email = 'tatiana@example.com'), 'completed', DATE '2026-02-20', '11:00', 7000, (select id from users where email = 'master@example.com')),
  ((select id from services where name = 'Реалистичный портрет'), (select id from users where email = 'victor@example.com'), 'completed', DATE '2026-02-15', '09:00', 25000, (select id from users where email = 'master@example.com')),
  ((select id from services where name = 'Traditional стиль'), (select id from users where email = 'ekaterina@example.com'), 'completed', DATE '2026-02-10', '15:00', 8000, (select id from users where email = 'dmitry@example.com'))
) as v(service_id, user_id, status, date, time_slot, price, master_id)
where not exists (select 1 from orders);

insert into client_history (user_id, service_id, date, rating)
select * from (values
  ((select id from users where email = 'nikolay@example.com'), (select id from services where name = 'Чёрно-белая тату'), DATE '2026-01-15', 5),
  ((select id from users where email = 'tatiana@example.com'), (select id from services where name = 'Чёрно-белая тату'), DATE '2026-01-20', 4),
  ((select id from users where email = 'victor@example.com'), (select id from services where name = 'Тату-рукав'), DATE '2026-01-10', 5),
  ((select id from users where email = 'ekaterina@example.com'), (select id from services where name = 'Минималистичная тату'), DATE '2026-02-05', 5)
) as v(user_id, service_id, date, rating)
where not exists (select 1 from client_history);
