'use client';

import { useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';

export default function LoginButton() {
    const { isAdmin, login, logout } = useAdmin();
    const [isOpen, setIsOpen] = useState(false);
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        if (login(password)) {
            localStorage.setItem('retro_music_username', 'ADMIN');
            window.dispatchEvent(new Event('usernameChanged'));
            setIsOpen(false);
            setPassword('');
            toast.success('CHÀO MỪNG QUẢN TRỊ VIÊN!', { className: 'font-oswald tracking-widest uppercase' });
        } else {
            toast.error('SAI MẬT KHẨU!', { className: 'font-oswald tracking-widest uppercase text-brand-pink' });
        }
    };

    if (isAdmin) {
        return (
            <button
                onClick={() => {
                    logout();
                    localStorage.removeItem('retro_music_username');
                    window.dispatchEvent(new Event('usernameChanged'));
                    toast.success('Đã thoát quyền QUẢN TRỊ VIÊN', { className: 'font-oswald uppercase' });
                }}
                className="brutal-btn-pink px-6 h-10 font-oswald text-lg bg-green-500 hover:bg-green-400"
            >
                [ADMIN] ĐĂNG XUẤT
            </button>
        );
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="brutal-btn-pink px-6 h-10 font-oswald text-lg"
            >
                ĐĂNG NHẬP
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="brutal-panel p-6 bg-brand-bg w-full max-w-sm relative border-[4px] border-brand-pink">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-white font-oswald text-xl w-8 h-8 flex items-center justify-center brutal-border"
                        >
                            X
                        </button>
                        <h2 className="font-jaro text-2xl uppercase mb-4 text-white">Xác Minh Quyền Hạn</h2>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    handleLogin();
                                }
                            }}
                            className="w-full h-12 mb-4 bg-gray-900 border-2 border-brand-pink text-white px-4 focus:outline-none placeholder-gray-600 font-oswald text-lg"
                            placeholder="Nhập Mật Khẩu..."
                            autoFocus
                        />
                        <button
                            onClick={handleLogin}
                            className="brutal-btn-blue w-full h-12 uppercase tracking-widest"
                        >
                            Đăng Nhập
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
