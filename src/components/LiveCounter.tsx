'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LiveCounter() {
    const [onlineUsers, setOnlineUsers] = useState(1);

    useEffect(() => {
        // Tạo một ID ngẫu nhiên đại diện cho 1 người truy cập ẩn danh
        const userId = 'user_' + Math.random().toString(36).substring(7);

        const channel = supabase.channel('online-users', {
            config: {
                presence: {
                    key: userId,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                let count = 0;
                // Đếm tổng số thiết bị đang Subscribe vào Channel này
                for (const key in newState) {
                    count += newState[key].length;
                }
                setOnlineUsers(Math.max(1, count));
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            channel.untrack();
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="flex items-center gap-3 brutal-border bg-black text-white px-4 h-10 min-w-[140px] justify-center hover:bg-gray-900 transition-colors shadow-[4px_4px_0px_rgba(255,0,85,1)]">
            {/* Chấm Đỏ Nhấp nháy chuẩn LiveStream */}
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)] border border-red-300"></span>
            <span className="font-oswald font-bold tracking-widest text-sm uppercase">
                ĐANG XEM: {onlineUsers}
            </span>
        </div>
    );
}
