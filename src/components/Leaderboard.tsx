'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Song } from '@/lib/types';
import { FiAward } from 'react-icons/fi';

export default function Leaderboard() {
    const [leaders, setLeaders] = useState<{ name: string, count: number }[]>([]);

    useEffect(() => {
        const fetchLeaders = async () => {
            const { data, error } = await supabase
                .from('queue')
                .select('added_by');

            if (!error && data) {
                // Tính toán số lượng bài hát đóng góp của mỗi người
                const counts: Record<string, number> = {};
                data.forEach(song => {
                    // Nếu trường added_by bị nhầm là tên bài hát (do form input lỗi trước đây), ta chặn bớt các cái tên quá dài 
                    const name = song.added_by || 'KHÁCH ẨN DANH';
                    if (name.length > 50) return; // Bỏ qua nếu tên dài quá 50 ký tự (có vẻ là tiêu đề)
                    counts[name] = (counts[name] || 0) + 1;
                });

                // Chuyển object thành mảng và sắp xếp giảm dần
                const sortedLeaders = Object.keys(counts)
                    .map(name => ({ name, count: counts[name] }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 20); // Hiển thị Top 20

                setLeaders(sortedLeaders);
            }
        };

        fetchLeaders();

        const channel = supabase
            .channel('public:queue:leaderboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'queue' }, () => {
                fetchLeaders();
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
                    <span className="bg-brand-blue dark:bg-emerald-400 text-black px-3 py-1 inline-block transform -skew-x-6">NGƯỜI ĐÓNG GÓP</span>
                </h3>
                <span className="text-sm font-oswald tracking-widest text-brand-pink font-bold uppercase">BẢNG VÀNG</span>
            </div>

            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {leaders.length === 0 ? (
                    <div className="brutal-panel p-6 text-center text-gray-500 bg-gray-900 border-gray-700">
                        <FiAward className="text-4xl mx-auto mb-2 opacity-50" />
                        <p className="font-oswald tracking-wider">CHƯA CÓ ĐÓNG GÓP</p>
                    </div>
                ) : (
                    leaders.map((leader, index) => (
                        <div key={leader.name} className="flex items-center gap-4 bg-brand-panel brutal-border p-3">
                            <div className={`w-10 h-10 border-2 border-black flex items-center justify-center font-oswald font-black text-xl 
                                ${index === 0 ? 'bg-yellow-400 text-black' :
                                    index === 1 ? 'bg-gray-300 text-black' :
                                        index === 2 ? 'bg-orange-400 text-black' : 'bg-gray-800 text-white'}`}
                            >
                                #{index + 1}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="font-oswald font-bold text-lg tracking-wide truncate">{leader.name}</p>
                            </div>
                            <div className="bg-black text-brand-pink font-oswald font-bold px-3 py-1 border-2 border-brand-pink text-lg tracking-widest flex items-center gap-1">
                                {leader.count} <span className="text-[10px] text-gray-400">BÀI</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
