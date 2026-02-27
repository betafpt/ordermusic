'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Song } from '@/lib/types';
import { FiClock } from 'react-icons/fi';

export default function HistoryList() {
    const [history, setHistory] = useState<Song[]>([]);

    useEffect(() => {
        const fetchHistory = async () => {
            const { data, error } = await supabase
                .from('queue')
                .select('*')
                .eq('is_played', true)
                .order('created_at', { ascending: false })
                .limit(10); // Giới hạn 10 bài lịch sử gần nhất

            if (!error && data) setHistory(data);
        };

        fetchHistory();

        const channel = supabase
            .channel('public:queue:history')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'queue' }, () => {
                fetchHistory();
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
                    <span className="bg-brand-blue dark:bg-emerald-400 text-black px-3 py-1 inline-block transform -skew-x-6">LỊCH SỬ</span>
                </h3>
                <span className="text-sm font-oswald tracking-widest text-gray-400 font-bold uppercase">10 BÀI GẦN NHẤT</span>
            </div>

            <div className="flex flex-col gap-4">
                {history.length === 0 ? (
                    <div className="brutal-panel p-6 text-center text-gray-600 bg-gray-900 border-gray-700">
                        <FiClock className="text-4xl mx-auto mb-2 opacity-50" />
                        <p className="font-oswald tracking-wider">CHƯA CÓ LỊCH SỬ</p>
                    </div>
                ) : (
                    history.map((song) => (
                        <div
                            key={song.id}
                            className="flex items-center justify-between p-3 border-2 border-gray-700 bg-black opacity-80"
                        >
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="w-10 h-10 grayscale shrink-0 flex items-center justify-center overflow-hidden border border-gray-700">
                                    {song.thumbnail_url ? (
                                        <img src={song.thumbnail_url} alt={song.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-600" />
                                    )}
                                </div>

                                <div className="flex flex-col overflow-hidden text-gray-400">
                                    <p className="font-oswald text-md font-bold tracking-wide truncate uppercase line-through decoration-brand-blue">{song.title}</p>
                                    <p className="text-[10px] font-oswald tracking-widest uppercase truncate">
                                        BỞI {song.added_by}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
