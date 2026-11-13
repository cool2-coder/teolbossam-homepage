create extension if not exists pgcrypto;

create table if not exists kids (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  guardian_label text not null default '어머님',
  phone text not null default '',
  code text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists weeks (
  id uuid primary key default gen_random_uuid(),
  season text not null,
  number int not null,
  class_date date not null,
  place text not null default '',
  topic text not null,
  mission text not null default '',
  published_at timestamptz,
  reminded_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists entries (
  week_id uuid not null references weeks(id) on delete cascade,
  kid_id uuid not null references kids(id) on delete cascade,
  attended boolean not null default true,
  note text not null default '',
  powers text[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (week_id, kid_id)
);

create table if not exists replies (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references weeks(id) on delete cascade,
  kid_id uuid not null references kids(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  unique (week_id, kid_id)
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  week_id uuid references weeks(id) on delete cascade,
  reply_id uuid references replies(id) on delete cascade,
  mime text not null,
  data bytea not null,
  created_at timestamptz not null default now()
);

create table if not exists photo_tags (
  photo_id uuid not null references photos(id) on delete cascade,
  kid_id uuid not null references kids(id) on delete cascade,
  primary key (photo_id, kid_id)
);

create table if not exists messages (
  id bigserial primary key,
  kid_id uuid references kids(id) on delete set null,
  week_id uuid references weeks(id) on delete set null,
  kind text not null,
  to_phone text not null,
  body text not null,
  status text not null,
  error text,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value text not null
);

insert into settings (key, value) values
  ('season', '시즌2'),
  ('season_weeks', '10'),
  ('remind_enabled', 'true'),
  ('remind_weekday', '4')
on conflict (key) do nothing;

create index if not exists photos_week_idx on photos(week_id);
create index if not exists photos_reply_idx on photos(reply_id);
create index if not exists messages_created_idx on messages(created_at desc);

-- 수업 전 안내 (모이는 시간, 준비물) 와 참석 응답
alter table weeks add column if not exists meet_time text not null default '';
alter table weeks add column if not exists prep text not null default '';
alter table entries add column if not exists rsvp text;

-- 털보쌤이 쓴 안내문을 그대로 붙여 넣는 칸
alter table weeks add column if not exists body text not null default '';

-- 수업 후 공통 기록 (모든 아이 일지에 함께 보여요)
alter table weeks add column if not exists recap text not null default '';

-- 수업 종류: morning(아침숲) / indoor(실내숲)
alter table weeks add column if not exists kind text not null default 'morning';

-- 아이가 듣는 수업 (morning / indoor)
alter table kids add column if not exists classes text[] not null default '{morning,indoor}';

-- 아이 정보: 출생연도, 성별, 부르는 이름(비우면 성을 뺀 이름)
alter table kids add column if not exists birth_year int;
alter table kids add column if not exists gender text;
alter table kids add column if not exists call_name text not null default '';

-- 아이 대표 프로필 사진
alter table kids add column if not exists photo_id uuid references photos(id) on delete set null;

-- 모집 기수 (예: 11·12월 숲) 와 기수별 등록·입금
create table if not exists terms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists enrollments (
  term_id uuid not null references terms(id) on delete cascade,
  kid_id uuid not null references kids(id) on delete cascade,
  kind text not null,
  paid boolean not null default false,
  fee int,
  created_at timestamptz not null default now(),
  primary key (term_id, kid_id, kind)
);

-- 아이 주의사항 (알레르기 등). 수업 화면에 ⚠ 로 보여요.
alter table kids add column if not exists caution text not null default '';

-- 수업 종료 (관리 화면 목록에서 정리)
alter table weeks add column if not exists closed_at timestamptz;

-- 재등록 연락: 기수별 안내 문구와 가족별 연락 상태
alter table terms add column if not exists recontact_text text not null default '';
create table if not exists recontacts (
  term_id uuid not null references terms(id) on delete cascade,
  kid_id uuid not null references kids(id) on delete cascade,
  status text not null,
  updated_at timestamptz not null default now(),
  primary key (term_id, kid_id)
);
