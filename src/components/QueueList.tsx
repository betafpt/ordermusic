'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Song } from '@/lib/types';
import { FiPlayCircle, FiHeadphones, FiClock } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function QueueList() {
    const [queue, setQueue] = useState<Song[]>([]);

    useEffect(() => {
        // Lấy bài hát ngay lúc đầu
        const fetchQueue = async () => {
            const { data, error } = await supabase
                .from('queue')
                .select('*')
                .eq('is_played', false)
                .order('id', { ascending: true }); // ID là uuid, hoặc created_at, có order_index
            if (!error && data) setQueue(data);
        };

        fetchQueue();

        // Lắng nghe thay đổi real-time
        const channel = supabase
            .channel('public:queue')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'queue' }, (payload) => {
                // Có thể tối ưu bằng cách handle tưng event INSERT, UPDATE, DELETE
                // Nhưng gọi lại fetchQueue cho chắc chắn đồng bộ
                fetchQueue();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (queue.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-zinc-500 bg-zinc-900/30 rounded-2xl border border-zinc-800 border-dashed">
                <FiHeadphones className="text-4xl mb-3 opacity-50" />
                <p>Hàng đợi đang trống</p>
                <p className="text-sm">Hãy gửi link bài hát đầu tiên nhé!</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-zinc-200">
                <FiClock className="text-rose-500" />
                Danh sách chờ phát ({queue.length})
            </h3>

            <div className="flex flex-col gap-3">
                <AnimatePresence>
                    {queue.map((song, index) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, height: 0 }}
                            key={song.id}
                            className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${index === 0
                                    ? 'bg-rose-500/10 border-rose-500/30 shadow-lg shadow-rose-500/5'
                                    : 'bg-zinc-900/50 border-zinc-800'
                                }`}
                        >
                            <div className="relative w-16 h-12 bg-zinc-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                                {song.thumbnail_url ? (
                                    <img src={song.thumbnail_url} alt={song.title} className="w-full h-full object-cover" />
                                ) : (
                                    <FiMusic className="text-zinc-500" />
                                )}
                                {index === 0 && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <FiPlayCircle className="text-rose-400 text-xl animate-pulse" />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col overflow-hidden">
                                <p className={`font-medium line-clamp-1 ${index === 0 ? 'text-rose-100' : 'text-zinc-200'}`}>
                                    {song.title}
                                </p>
                                <p className="text-sm text-zinc-500 truncate">
                                    Từ: <span className="text-zinc-400">{song.added_by}</span>
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Inline Icon to avoid import issue in the middle of code
function FiMusic(props: any) {
    return <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>;
}
