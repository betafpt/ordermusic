'use client';

import { useState, useEffect } from 'react';

export function useAdmin() {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdmin = () => {
            setIsAdmin(localStorage.getItem('retro_music_admin') === 'true');
        };

        checkAdmin();
        window.addEventListener('storage', checkAdmin);
        window.addEventListener('adminStatusChanged', checkAdmin);

        return () => {
            window.removeEventListener('storage', checkAdmin);
            window.removeEventListener('adminStatusChanged', checkAdmin);
        };
    }, []);

    const login = (password: string) => {
        if (password === 'bodobede') {
            localStorage.setItem('retro_music_admin', 'true');
            window.dispatchEvent(new Event('adminStatusChanged'));
            return true;
        }
        return false;
    };

    const logout = () => {
        localStorage.removeItem('retro_music_admin');
        window.dispatchEvent(new Event('adminStatusChanged'));
    };

    return { isAdmin, login, logout };
}
