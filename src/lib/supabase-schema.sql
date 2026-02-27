-- Tạo bảng queue lưu danh sách các bài hát
create table public.queue (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  url text not null,
  title text not null,
  thumbnail_url text,
  added_by text default 'Anonymous' not null,
  is_played boolean default false not null,
  order_index bigint generated always as identity
);

-- Bật Row Level Security (RLS) để có thể truy cập từ Frontend trực tiếp
alter table public.queue enable row level security;

-- Cho phép mọi người (anon) xem danh sách (SELECT)
create policy "Cho phép mọi người xem danh sách playlist" on public.queue
  for select using (true);

-- Cho phép mọi người (anon) THÊM nhạc vào hàng đợi (INSERT)
create policy "Cho phép mọi người thêm nhạc vào hàng đợi" on public.queue
  for insert with check (true);

-- Cho phép mọi người (hoặc host) ĐÁNH DẤU đã phát (UPDATE is_played)
create policy "Cho phép cập nhật trạng thái bài hát" on public.queue
  for update using (true);

-- (Quan trọng) Bật tính năng Realtime cho bảng queue
-- Chạy lệnh này để supabase gửi sự kiện khi có bài mới chèn vào
alter publication supabase_realtime add table public.queue;
