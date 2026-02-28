'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Song } from '@/lib/types';
import { FiChevronUp, FiX, FiMonitor, FiTrash2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';

export default function QueueList() {
    const [queue, setQueue] = useState<Song[]>([]);
    const { isAdmin } = useAdmin();

    // Hiện thông báo toast 1 lần khi kích hoạt Admin Mode
    useEffect(() => {
        if (isAdmin) {
            toast.success('👑 KÍCH HOẠT QUYỀN LỰC CHỦ XỊ!', {
                className: 'font-oswald text-2xl uppercase tracking-widest text-[#ff0055] bg-black border-4 border-[#ff0055]'
            });
        }
    }, [isAdmin]);

    const handleDeleteSong = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            // Cập nhật giao diện ẩn đi ngay lập tức cho mượt
            setQueue(prev => prev.filter(song => song.id !== id));

            // Thay vì dùng lệnh DELETE dễ bị vướng quyền bảo mật của Supabase,
            // ta dùng lệnh UPDATE đánh dấu nó đã phát để đẩy nó văng ra khỏi Hàng Chờ.
            const { error } = await supabase.from('queue').update({ is_played: true }).eq('id', id);

            if (error) throw error;
            toast.success('Đã xóa bài hát khỏi hàng chờ', { className: 'font-oswald uppercase' });
        } catch (error) {
            toast.error('Lỗi khi xóa bài hát');
            console.error("Lỗi xóa bài:", error);
        }
    };

    useEffect(() => {
        const fetchQueue = async () => {
            const { data, error } = await supabase
                .from('queue')
                .select('*')
                .eq('is_played', false)
                .order('created_at', { ascending: true })
                // Bỏ qua bài đầu tiên vì bài đầu đang hát ở Player
                .range(1, 100);

            if (!error && data) setQueue(data);
        };

        fetchQueue();

        const channel = supabase
            .channel('public:queue:list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'queue' }, () => {
                fetchQueue();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="flex flex-col gap-4 mt-4">
            <div className="flex items-end justify-between border-b-4 border-black pb-2">
                <h3 className="text-2xl font-jaro font-bold italic tracking-wider uppercase">
                    <span className="bg-brand-blue dark:bg-emerald-400 text-black px-3 py-1 inline-block transform -skew-x-6">TIẾP THEO</span>
                </h3>
                <span className="text-sm font-oswald tracking-widest text-gray-400 font-bold uppercase">{queue.length} BÀI HÁT CHỜ</span>
            </div>

            <div className="flex flex-col gap-4 max-h-[460px] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar pb-2">
                {queue.length === 0 ? (
                    <div className="brutal-panel p-6 text-center text-gray-500">
                        <FiMonitor className="text-4xl mx-auto mb-2 opacity-50" />
                        <p className="font-oswald tracking-wider">HÀNG CHỜ ĐANG TRỐNG</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {queue.map((song, index) => (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                key={song.id}
                                className="brutal-panel bg-brand-bg flex items-center justify-between p-3 brutal-shadow-hover cursor-pointer"
                            >
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="w-12 h-12 bg-gray-800 brutal-border shrink-0 flex items-center justify-center overflow-hidden">
                                        {song.thumbnail_url ? (
                                            <img src={song.thumbnail_url} alt={song.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-brand-blue" />
                                        )}
                                    </div>

                                    <div className="flex flex-col overflow-hidden">
                                        <p className="font-oswald text-lg font-bold tracking-wide truncate uppercase">{song.title}</p>
                                        <p className="text-xs font-oswald tracking-widest text-gray-400 uppercase truncate">
                                            ĐĂNG TỪ • {song.added_by}
                                        </p>
                                    </div>
                                </div>

                                {/* Nút Xóa (Chỉ admin thấy) */}
                                {isAdmin && (
                                    <button
                                        onClick={(e) => handleDeleteSong(song.id, e)}
                                        className="w-10 h-10 bg-red-600 text-white flex items-center justify-center brutal-border hover:bg-black transition-colors"
                                        title="Xóa bài hát"
                                    >
                                        <FiTrash2 size={18} />
                                    </button>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
