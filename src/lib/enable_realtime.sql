-- Đảm bảo bảng `queue` được bật Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue;

-- Đảm bảo bảng `votes` được bật Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
