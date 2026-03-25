-- 1. styles 테이블 (정적 데이터, 한 번 seed)
create table styles (
  id text primary key,
  collection text not null,
  fabric_no text default '',
  contents text not null,
  construction text not null,
  weight text not null,
  finishing text default '',
  designed_by text not null,
  image_url text not null,
  images text[] default '{}',
  fabric_suggestion jsonb
);

-- 2. selections 테이블
create table selections (
  id uuid primary key default gen_random_uuid(),
  style_id text not null references styles(id),
  collection text not null,
  user_id text not null,
  user_name text not null,
  status text not null check (status in ('shortlist', 'maybe', 'pass')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(style_id, user_id)
);

-- 3. memos 테이블 (append-only)
create table memos (
  id uuid primary key default gen_random_uuid(),
  style_id text not null references styles(id),
  collection text not null,
  user_id text not null,
  user_name text not null,
  content text not null,
  created_at timestamptz default now()
);

-- 4. RLS 활성화
alter table styles enable row level security;
alter table selections enable row level security;
alter table memos enable row level security;

-- 5. RLS 정책
create policy "styles_read" on styles for select using (true);

create policy "selections_read" on selections for select using (true);
create policy "selections_insert" on selections for insert with check (true);
create policy "selections_update" on selections for update using (user_id = user_id);

create policy "memos_read" on memos for select using (true);
create policy "memos_insert" on memos for insert with check (true);

-- 6. Seed 스타일 데이터
-- NOTE: Replace <PROJECT_REF> with your actual Supabase project reference
-- Images should be uploaded to the 'style-images' bucket in Supabase Storage
insert into styles (id, collection, fabric_no, contents, construction, weight, finishing, designed_by, image_url, images, fabric_suggestion) values
('HDW127182', 'SP27-TALBOTS-OUTLET', 'FL25112486', '100% Cotton', 'Pointelle', '300 G/M2', '', 'Hansoll', 'https://<PROJECT_REF>.supabase.co/storage/v1/object/public/style-images/HDW127182.jpg', array['https://<PROJECT_REF>.supabase.co/storage/v1/object/public/style-images/HDW127182.jpg'], '{"fabric_no":"FL25082331 Thermal","contents":"65/32/3 Cotton/Polyester/Spandex","weight":"240 G/M2"}'::jsonb),
('HDW127079', 'SP27-TALBOTS-OUTLET', 'HS-1027-H', '100% Cotton', 'Single Jersey', '265 G/M2', '', 'Hansoll', 'https://<PROJECT_REF>.supabase.co/storage/v1/object/public/style-images/HDW127079.jpg', array['https://<PROJECT_REF>.supabase.co/storage/v1/object/public/style-images/HDW127079.jpg'], '{"fabric_no":"FL25062903 Single Jersey","contents":"100% Cotton","weight":"230 G/M2"}'::jsonb),
('HDW126208', 'SP27-TALBOTS-OUTLET', 'FL24022159', '71/15/14 Cotton/Modal/Polyester', 'French Terry', '250 G/M2', '', 'Hansoll', 'https://<PROJECT_REF>.supabase.co/storage/v1/object/public/style-images/HDW126208.jpg', array['https://<PROJECT_REF>.supabase.co/storage/v1/object/public/style-images/HDW126208.jpg'], '{"fabric_no":"FL22110006 French Terry","contents":"58/39/3 Cotton/Modal/Span","weight":"195 G/M2"}'::jsonb),
('HMW320041', 'SP27-TALBOTS-OUTLET', '', '63/34/3 Cotton/Polyester/Spandex', 'Single Jacquard', '224 G/M2', '', 'Bershka', 'https://<PROJECT_REF>.supabase.co/storage/v1/object/public/style-images/HMW320041.jpg', array['https://<PROJECT_REF>.supabase.co/storage/v1/object/public/style-images/HMW320041.jpg'], '{"fabric_no":"FL25082416 Quilt Jacquard","contents":"83/15/2 Polyester/Rayon/Spandex","weight":"300 G/M2"}'::jsonb),
('HMW326235', 'SP27-TALBOTS-OUTLET', '', '100% Rayon', 'Quilt Jacquard', '280 G/M2', '', 'Lou&Grey', 'https://<PROJECT_REF>.supabase.co/storage/v1/object/public/style-images/HMW326235.jpg', array['https://<PROJECT_REF>.supabase.co/storage/v1/object/public/style-images/HMW326235.jpg'], '{"fabric_no":"FL25082416 Quilt Jacquard","contents":"83/15/2 Polyester/Rayon/Spandex","weight":"300 G/M2"}'::jsonb);

-- 7. Migration query for existing data (run once after uploading images to Storage)
-- UPDATE styles SET
--   image_url = 'https://<PROJECT_REF>.supabase.co/storage/v1/object/public/style-images/' || id || '.jpg',
--   images = ARRAY['https://<PROJECT_REF>.supabase.co/storage/v1/object/public/style-images/' || id || '.jpg']
-- WHERE collection = 'SP27-TALBOTS-OUTLET';
