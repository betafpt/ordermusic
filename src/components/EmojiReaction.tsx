'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

// Danh sách các Icon xịn xò
const EMOJIS = ['🔥', '😂', '💩', '🤘', '❤️', '😱'];

interface FlyingEmoji {
    id: number;
    emoji: string;
    x: number;
}

export default function EmojiReaction() {
    const [flyingEmojis, setFlyingEmojis] = useState<FlyingEmoji[]>([]);

    // Gửi tín hiệu báo "Tôi thả icon này" cho mọi người trong Room
    const handleSendReaction = async (emoji: string) => {
        await supabase.channel('public:emoji_channel').send({
            type: 'broadcast',
            event: 'reaction',
            payload: { emoji },
        });

        // Bản thân mình cũng thấy
        triggerEmoji(emoji);
    };

    // Khi nhận được tín hiệu bay Icon
    const triggerEmoji = useCallback((emoji: string) => {
        const id = Date.now() + Math.random();
        // Căn vị trí mọc lên ngẫu nhiên trên bề ngang (20% - 80%)
        const randomX = Math.floor(Math.random() * 60) + 20;

        setFlyingEmojis(prev => [...prev, { id, emoji, x: randomX }]);

        // Tự động dọn dẹp biến rác sau 2 giây (khi icon rớt khỏi màn hình)
        setTimeout(() => {
            setFlyingEmojis(prev => prev.filter(e => e.id !== id));
        }, 2000);
    }, []);

    useEffect(() => {
        const channel = supabase.channel('public:emoji_channel')
            .on('broadcast', { event: 'reaction' }, (payload) => {
                triggerEmoji(payload.payload.emoji);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [triggerEmoji]);

    return (
        <>
            {/* Lớp Overlay để thả rông Icon chìm nổi tự do quanh khu vực Player */}
            <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
                <AnimatePresence>
                    {flyingEmojis.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ y: '100%', opacity: 1, scale: 0.5 }}
                            animate={{ y: '-50%', opacity: 0, scale: 2 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="absolute bottom-0 text-4xl drop-shadow-lg"
                            style={{ left: `${item.x}%` }}
                        >
                            {item.emoji}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Thanh chứa các nút Thả Thính */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between gap-2 z-40 bg-black/50 p-2 brutal-border backdrop-blur-sm pointer-events-auto">
                <div className="flex gap-2 mx-auto">
                    {EMOJIS.map((emoji) => (
                        <button
                            key={emoji}
                            onClick={() => handleSendReaction(emoji)}
                            className="w-10 h-10 md:w-12 md:h-12 bg-white brutal-border hover:bg-yellow-400 hover:-translate-y-1 transition-transform flex items-center justify-center text-xl md:text-2xl shadow-[4px_4px_0_#000]"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
