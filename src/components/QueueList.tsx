'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Song } from '@/lib/types';
import { FiChevronUp, FiX, FiMonitor } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function QueueList() {
    const [queue, setQueue] = useState<Song[]>([]);

    useEffect(() => {
        const fetchQueue = async () => {
            const { data, error } = await supabase
                .from('queue')
                .select('*')
                .eq('is_played', false)
                .order('order_index', { ascending: true })
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
                <h3 className="text-2xl font-oswald font-bold italic tracking-wider">UP NEXT</h3>
                <span className="text-sm font-oswald tracking-widest text-gray-400 font-bold uppercase">{queue.length} TRACKS REMAINING</span>
            </div>

            <div className="flex flex-col gap-4">
                {queue.length === 0 ? (
                    <div className="brutal-panel p-6 text-center text-gray-500">
                        <FiMonitor className="text-4xl mx-auto mb-2 opacity-50" />
                        <p className="font-oswald tracking-wider">NO MORE TRACKS IN QUEUE</p>
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
                                            HOME • {song.added_by}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 shrink-0 ml-2">
                                    <button className="text-gray-500 hover:text-white transition-colors">
                                        <FiChevronUp size={20} />
                                    </button>
                                    <button className="text-gray-500 hover:text-brand-pink transition-colors">
                                        <FiX size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
