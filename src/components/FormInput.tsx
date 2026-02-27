'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function FormInput() {
    const [url, setUrl] = useState('');
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
        const toastId = toast.loading('Đang xử lý băng đĩa...', { className: 'font-oswald uppercase tracking-widest' });

        try {
            const res = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
            if (!res.ok) throw new Error('Không thể đọc thông tin track');
            const data = await res.json();

            const { error } = await supabase.from('queue').insert([
                {
                    url: url.trim(),
                    title: data.title,
                    thumbnail_url: data.thumbnailUrl,
                    added_by: '@RetroFan_88', // Cứng theo design, hoặc input nếu cần thiết
                },
            ]);

            if (error) throw error;

            toast.success('TRACK ADDED TO QUEUE', { id: toastId, className: 'font-oswald uppercase text-brand-blue tracking-widest' });
            setUrl('');
        } catch (error: any) {
            toast.error('LỖI ĐỌC BĂNG ĐĨA', { id: toastId, className: 'font-oswald text-brand-pink uppercase tracking-widest' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="brutal-panel p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                <h2 className="font-oswald text-2xl font-bold tracking-wider uppercase">Add To Queue</h2>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="relative">
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste YouTube or SoundCloud link..."
                        className="w-full h-14 bg-brand-panel brutal-border text-white px-4 focus:outline-none focus:ring-0 placeholder-gray-500 font-medium font-sans"
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="brutal-btn-blue w-full h-14 flex items-center justify-center text-xl font-oswald disabled:opacity-75 disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-brutal"
                >
                    {loading ? 'PROCESSING...' : 'SUBMIT TRACK'}
                </button>
            </form>
        </div>
    );
}
