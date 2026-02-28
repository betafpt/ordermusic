-- BẢNG LƯU TRỮ VOTE CỤ THỂ CỦA TỪNG NGƯỜI DÙNG
create table public.votes (
  id uuid default gen_random_uuid() primary key,
  song_id uuid references public.queue(id) on delete cascade not null,
  voter_name text not null,
  vote_type text check (vote_type in ('up', 'down')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Đảm bảo 1 người chỉ được vote 1 kiểu cho 1 bài hát (Up hoặc Down thôi, không thể vừa up vừa down)
  unique(song_id, voter_name)
);

-- Bật RLS
alter table public.votes enable row level security;

-- Cho phép mọi người xem ai đã vote
create policy "Cho phép mọi người xem danh sách vote" on public.votes
  for select using (true);

-- Cho phép thêm hoặc sửa vote (nếu họ đổi từ up sang down)
create policy "Cho phép mọi người vote" on public.votes
  for insert with check (true);
  
create policy "Cho phép mọi người đổi vote" on public.votes
  for update using (true);

create policy "Cho phép xoá vote (bỏ vote)" on public.votes
  for delete using (true);

-- Cho realtime bảng votes để FE tự động render danh sách người vote mà không cần f5
alter publication supabase_realtime add table public.votes;

-- Cập nhật lại 2 hàm RPC cũ để đổi logic: Thay vì chỉ +1 số ảo, giờ ta đếm thực tế từ bảng votes.
-- Khi người dùng ấn Upvote (Trên FE sẽ truyền thêm voter_name)
CREATE OR REPLACE FUNCTION increment_upvote(row_id uuid, v_name text)
RETURNS void AS $$
BEGIN
  -- Cố gắng chèn 1 vote 'up'. Nếu người này đã vote bài này rối (trùng song_id + voter_name), thì UPDATE nó thành 'up'
  INSERT INTO public.votes (song_id, voter_name, vote_type)
  VALUES (row_id, v_name, 'up')
  ON CONFLICT (song_id, voter_name) 
  DO UPDATE SET vote_type = 'up', created_at = now();

  -- Cập nhật lại số đếm tổng trên bảng queue cho nhanh khi load danh sách
  UPDATE public.queue
  SET upvotes = (SELECT count(*) FROM public.votes WHERE song_id = row_id AND vote_type = 'up'),
      downvotes = (SELECT count(*) FROM public.votes WHERE song_id = row_id AND vote_type = 'down')
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

-- Khi người dùng ấn Downvote
CREATE OR REPLACE FUNCTION increment_downvote(row_id uuid, v_name text)
RETURNS void AS $$
BEGIN
  -- Tưowng tự: Upsert vote 'down'
  INSERT INTO public.votes (song_id, voter_name, vote_type)
  VALUES (row_id, v_name, 'down')
  ON CONFLICT (song_id, voter_name) 
  DO UPDATE SET vote_type = 'down', created_at = now();

  -- Cập nhật lại số đếm tổng
  UPDATE public.queue
  SET upvotes = (SELECT count(*) FROM public.votes WHERE song_id = row_id AND vote_type = 'up'),
      downvotes = (SELECT count(*) FROM public.votes WHERE song_id = row_id AND vote_type = 'down')
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;
