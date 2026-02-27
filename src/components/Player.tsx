'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false }) as any;
import { supabase } from '@/lib/supabase';
import { Song } from '@/lib/types';
import { FiMonitor, FiPlay, FiPause, FiSkipForward, FiMaximize } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function Player() {
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [playing, setPlaying] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const playerRef = useRef<any>(null);

    useEffect(() => {
        // Chủ phòng (host) mới có quyền phát nhạc thật, người khác chỉ để xem
        // Hoặc nếu ứng dụng này mở trên public screen thì ai mở trang sẽ tự play
        // Mặc định cho phép tự play nếu người dùng bấm "Mở giao diện Host"

        const fetchCurrentSong = async () => {
            const { data, error } = await supabase
                .from('queue')
                .select('*')
                .eq('is_played', false)
                .order('id', { ascending: true }) // Dùng created_at hoặc order_index nếu đã thêm
                .limit(1)
                .single();

            if (!error && data) {
                // Kiểm tra xem bài có bị thay đổi không (bài mới)
                setCurrentSong(prev => {
                    if (prev?.id !== data.id) {
                        setPlaying(true); // Tự động phát khi có bài mới chuyển tới
                        return data;
                    }
                    return prev;
                });
            } else {
                setCurrentSong(null);
            }
        };

        fetchCurrentSong();

        // Lắng nghe queue database để biết khi nào phải chuyển bài
        const channel = supabase
            .channel('public:queue:player')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'queue' }, () => {
                fetchCurrentSong();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleEnded = async () => {
        if (!currentSong || !isHost) return;

        // Đánh dấu bài này đã phát
        await supabase
            .from('queue')
            .update({ is_played: true })
            .eq('id', currentSong.id);

        // DB sẽ trigger realtime event, fetchCurrentSong sẽ chạy lại và lấy bài kế tiếp
    };

    const skipSong = async () => {
        if (!currentSong || !isHost) return;
        await supabase
            .from('queue')
            .update({ is_played: true })
            .eq('id', currentSong.id);
    };

    if (!isHost) {
        return (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
                <FiMonitor className="text-4xl text-zinc-500 mx-auto mb-3" />
                <h3 className="text-zinc-300 font-medium mb-2">Trình Phát Nhạc</h3>
                <p className="text-sm text-zinc-500 mb-4">
                    Thiết bị này đang ở chế độ khán giả.
                </p>
                <button
                    onClick={() => setIsHost(true)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                    Trở thành Host (Phát nhạc ở đây)
                </button>
            </div>
        );
    }

    return (
        <div className="bg-black border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-800 text-xs font-medium text-emerald-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Host Mode
            </div>

            <div className="aspect-video bg-zinc-950 relative flex items-center justify-center group">
                <AnimatePresence mode="wait">
                    {currentSong ? (
                        <motion.div
                            key={currentSong.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full"
                        >
                            <div className="w-full h-full pointer-events-none mb-[-5px]">
                                {/* Ẩn các control của Youtube/Soundcloud */}
                                <ReactPlayer
                                    url={currentSong.url}
                                    playing={playing}
                                    onEnded={handleEnded}
                                    width="100%"
                                    height="100%"
                                    controls={false}
                                    config={({
                                        youtube: { playerVars: { showinfo: 0, autoplay: 1, rel: 0, modestbranding: 1 } },
                                        soundcloud: { options: { auto_play: true, show_comments: false } }
                                    }) as any}
                                    onError={(e: any) => {
                                        console.error("Lỗi phát nhạc", e);
                                        // Nếu lỗi thì skip luôn
                                        setTimeout(skipSong, 3000);
                                    }}
                                />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center text-zinc-600 gap-2"
                        >
                            <FiMonitor className="text-5xl opacity-40" />
                            <p>Đang chờ bài hát...</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {currentSong && (
                <div className="p-4 bg-zinc-900 flex items-center gap-4">
                    <button
                        onClick={() => setPlaying(!playing)}
                        className="w-12 h-12 shrink-0 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                    >
                        {playing ? <FiPause className="text-xl" /> : <FiPlay className="text-xl ml-1" />}
                    </button>

                    <div className="flex-1 overflow-hidden">
                        <h3 className="text-zinc-100 font-medium truncate">{currentSong.title}</h3>
                        <p className="text-sm text-zinc-500 truncate">Gửi bởi: {currentSong.added_by}</p>
                    </div>

                    <button
                        onClick={skipSong}
                        className="w-10 h-10 shrink-0 bg-zinc-800 text-zinc-300 hover:text-white rounded-full flex items-center justify-center hover:bg-zinc-700 active:scale-95 transition-all"
                        title="Bỏ qua bài này"
                    >
                        <FiSkipForward />
                    </button>
                </div>
            )}
        </div>
    );
}
