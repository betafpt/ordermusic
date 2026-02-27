'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAdmin } from '@/hooks/useAdmin';

export default function FormInput() {
    const [url, setUrl] = useState('');
    const [username, setUsername] = useState('');
    const [savedUsername, setSavedUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [showNonstopError, setShowNonstopError] = useState(false);
    const { isAdmin } = useAdmin();

    useEffect(() => {
        const loadName = () => {
            const storedName = localStorage.getItem('retro_music_username');
            if (storedName) {
                setUsername(storedName);
                setSavedUsername(storedName);
            } else {
                setUsername('');
                setSavedUsername('');
            }
        };

        loadName();
        window.addEventListener('usernameChanged', loadName);
        return () => window.removeEventListener('usernameChanged', loadName);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) return toast.error('Vui lòng nhập Tên của bạn!');
        if (!url.trim()) return toast.error('Vui lòng nhập link bài hát!');

        // CHẶN TÊN ADMIN NẾU KHÔNG PHẢI ADMIN ĐÃ LOGIN
        if (username.trim().toLowerCase() === 'admin' && !isAdmin) {
            return toast.error('Tên "admin" chỉ dành cho Quản Trị Viên! Xin hãy chọn tên khác.', { className: 'font-oswald uppercase tracking-widest' });
        }

        // Validation cơ bản Regex trước khi đẩy đi lên Server
        const ytRegex = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
        const scRegex = /^https?:\/\/(soundcloud\.com|snd\.sc)\/(.*)$/;

        if (!ytRegex.test(url.trim()) && !scRegex.test(url.trim())) {
            return toast.error('Vui lòng cung cấp đúng Cấu trúc Link Youtube / Soundcloud!');
        }

        setLoading(true);
        const toastId = toast.loading('Đang xử lý băng đĩa...', { className: 'font-oswald uppercase tracking-widest' });

        try {
            const res = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
            const data = await res.json();

            if (!res.ok) {
                if (data?.error === 'NONSTOP_BLOCKED') {
                    throw new Error('NONSTOP_BLOCKED');
                }
                throw new Error('Không thể đọc thông tin track');
            }

            // --- KIỂM TRA ANTI-SPAM TỐI ĐA 2 BÀI ---
            const { count, error: countError } = await supabase
                .from('queue')
                .select('*', { count: 'exact', head: true })
                .eq('added_by', username.trim() || '@NOBODY')
                .eq('is_played', false);

            if (countError) throw countError;
            // Chỉ cho phép tối đa 2 bài ĐANG CHỜ
            if (count && count >= 2) {
                throw new Error('SPAM_BLOCKED');
            }
            // ----------------------------------------

            const { error } = await supabase.from('queue').insert([
                {
                    url: data.cleanUrl || url.trim(), // Thay vì dùng url raw, mình dùng link sạch trả về
                    title: data.title,
                    thumbnail_url: data.thumbnailUrl,
                    added_by: username.trim() || '@NOBODY',
                },
            ]);

            if (error) throw error;

            // Nếu chưa có savedUsername hoặc nhập tên mới thì lưu lại
            if (username.trim() !== savedUsername) {
                localStorage.setItem('retro_music_username', username.trim());
                setSavedUsername(username.trim());
            }

            toast.success('TRACK ADDED TO QUEUE', { id: toastId, className: 'font-oswald uppercase text-brand-blue tracking-widest' });
            setUrl('');
        } catch (error: any) {
            // Nếu lỗi là do chặn Nonstop, hiển thị Modal bự chà bá lửa
            if (error.message && error.message.includes('NONSTOP_BLOCKED')) {
                toast.dismiss(toastId); // Tắt thông báo bé xíu
                setShowNonstopError(true); // Bật thông báo chặn to đùng
            }
            // Nếu lỗi là do Spam quá 2 bài
            else if (error.message && error.message.includes('SPAM_BLOCKED')) {
                toast.error('BẠN ĐÃ ĐẠT GIỚI HẠN 2 BÀI CHỜ! NHƯỜNG NGƯỜI KHÁC VỚI 🤫', { id: toastId, className: 'font-oswald text-brand-pink uppercase tracking-widest' });
            }
            // Các lỗi khác
            else {
                toast.error(error.message || 'LỖI ĐỌC BĂNG ĐĨA', { id: toastId, className: 'font-oswald text-brand-pink uppercase tracking-widest' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="brutal-panel p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                    <h2 className="text-2xl font-jaro font-bold italic tracking-wider uppercase">
                        <span className="bg-brand-blue dark:bg-emerald-400 text-black px-3 py-1 inline-block transform -skew-x-6">THÊM VÀO HÀNG CHỜ</span>
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Chỉ hiện ô nhập Username nếu người dùng chưa lưu tên trước đó */}
                    {!savedUsername && (
                        <div className="relative">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Your Username (Ví dụ: @JohnDoe)"
                                className="w-full h-12 bg-gray-900 border-2 border-brand-pink text-white px-4 focus:outline-none placeholder-gray-600 font-oswald text-lg tracking-wider"
                                disabled={loading}
                            />
                        </div>
                    )}

                    {savedUsername && (
                        <div className="flex justify-between items-center bg-gray-900 px-4 py-3 brutal-border">
                            <span className="font-oswald text-gray-500 uppercase tracking-widest text-sm">ĐĂNG VỚI TÊN</span>
                            <span className="font-oswald font-bold text-brand-pink tracking-wider">{savedUsername}</span>
                        </div>
                    )}

                    <div className="relative">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Dán link YouTube hoặc SoundCloud vào đây..."
                            className="w-full h-14 bg-brand-panel brutal-border text-white px-4 focus:outline-none focus:ring-0 placeholder-gray-500 font-medium font-sans"
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="brutal-btn-blue w-full h-14 flex items-center justify-center text-xl font-oswald disabled:opacity-75 disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-brutal"
                    >
                        {loading ? 'ĐANG XỬ LÝ...' : 'GỬI BÀI HÁT'}
                    </button>
                </form>
            </div>

            {/* Modal Cấm Nonstop Hiện Giữa Màn Hình */}
            {showNonstopError && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="brutal-panel bg-[#ff0055] border-[8px] border-black p-8 md:p-12 max-w-2xl w-full text-center relative overflow-hidden shadow-[20px_20px_0px_0px_rgba(255,255,255,0.1)]">
                        {/* Hiệu ứng chớp giật */}
                        <div className="absolute inset-0 bg-white opacity-0 animate-[shimmer_0.5s_infinite] pointer-events-none"></div>

                        <h2 className="text-5xl md:text-7xl uppercase text-white tracking-widest leading-[0.9] drop-shadow-[4px_4px_0px_#000] rotate-[-2deg] mb-6 relative z-10" style={{ fontFamily: 'var(--font-jaro), Impact, sans-serif' }}>
                            DỪNG LẠI!!! 🛑
                        </h2>

                        <p className="font-oswald text-xl md:text-2xl font-black uppercase text-black bg-yellow-400 p-4 brutal-border rotate-[1deg] mb-8 leading-tight relative z-10">
                            Chủ xị cấm không được mở nhạc NONSTOP ❌<br />
                            <span className="text-lg text-red-700 bg-white px-2 mt-2 inline-block">Hãy tôn trọng thính giác của mọi người!</span>
                        </p>

                        <button
                            onClick={() => setShowNonstopError(false)}
                            className="text-3xl md:text-4xl text-[#ff0055] bg-black py-4 px-12 uppercase tracking-widest hover:bg-white hover:text-black transition-colors brutal-border hover:scale-105 active:scale-95 relative z-10"
                            style={{ fontFamily: 'var(--font-jaro), Impact, sans-serif' }}
                        >
                            ĐÃ RÕ CƯNG 🫡
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
