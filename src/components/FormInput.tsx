'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { FiMusic, FiPlus, FiUser } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function FormInput() {
    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return toast.error('Vui lòng nhập link bài hát!');

        if (
            !url.includes('youtube.com') &&
            !url.includes('youtu.be') &&
            !url.includes('soundcloud.com')
        ) {
            return toast.error('Chỉ hỗ trợ link YouTube hoặc SoundCloud!');
        }

        setLoading(true);
        const toastId = toast.loading('Đang lấy thông tin bài hát...');

        try {
            // 1. Fetch metadata từ API Next.js mình vừa tạo
            const res = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
            if (!res.ok) throw new Error('Không thể lấy thông tin bài hát');
            const data = await res.json();

            // 2. Thêm vào Supabase
            const { error } = await supabase.from('queue').insert([
                {
                    url: url.trim(),
                    title: data.title,
                    thumbnail_url: data.thumbnailUrl,
                    added_by: name.trim() || 'Một người ẩn danh',
                },
            ]);

            if (error) throw error;

            toast.success('Đã thêm bài hát vào hàng đợi!', { id: toastId });
            setUrl('');
            // Không xoá tên để họ có thể order thêm bài khác
        } catch (error: any) {
            toast.error(error.message || 'Có lỗi xảy ra', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl shadow-2xl flex flex-col gap-4"
            onSubmit={handleSubmit}
        >
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-400 ml-1">Đường dẫn bài hát (YouTube / SoundCloud)</label>
                <div className="relative">
                    <FiMusic className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full bg-zinc-950/50 border border-zinc-800 outline-none text-zinc-100 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all placeholder:text-zinc-600"
                        required
                    />
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-400 ml-1">Tên của bạn (Tuỳ chọn)</label>
                <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ví dụ: Hoàng Tử Mưa"
                        className="w-full bg-zinc-950/50 border border-zinc-800 outline-none text-zinc-100 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all placeholder:text-zinc-600"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-medium py-3.5 px-6 rounded-xl shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <FiPlus className="text-lg" />
                        <span>Thêm vào Hàng Đợi</span>
                    </>
                )}
            </button>
        </motion.form>
    );
}
