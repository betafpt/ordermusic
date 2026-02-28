'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function LiveUpdateListener() {
    useEffect(() => {
        const channel = supabase.channel('public:app:settings');

        channel.on(
            'broadcast',
            { event: 'force-reload' },
            () => {
                console.log('🔄 Đã nhận lệnh bắt buộc Tải lại trang từ Máy Chủ!');

                // Thay vì giật sập ngay lập tức, cho delay ngẫu nhiên từ 100ms -> 2000ms
                // Để phòng ngừa 100 người F5 cùng lúc đánh sập nghẽn cổ chai Server Next.js / Supabase
                const randomDelay = Math.floor(Math.random() * 2000) + 100;

                setTimeout(() => {
                    window.location.reload();
                }, randomDelay);
            }
        ).subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('📡 Đã kết nối kênh Live Update thành công');
            }
        });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Component chạy ngầm, không render cái gì ra HTML cả
    return null;
}
