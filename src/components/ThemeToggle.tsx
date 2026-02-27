'use client';

import { useEffect, useState } from 'react';
import { FiMoon, FiSun } from 'react-icons/fi';

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);

    // Kích hoạt theme lúc mới load trang
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDark(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    // Hàm ấn nút đổi theme
    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);

        if (newTheme) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className={`flex items-center gap-2 px-3 py-1 font-oswald font-bold tracking-widest text-sm uppercase transition-all
                ${isDark
                    ? 'bg-black text-[#00f0ff] border-2 border-[#ff0055] shadow-[0_0_10px_#ff0055]'
                    : 'bg-white text-black border-2 border-black brutal-shadow-hover'
                }`}
            title="ĐỔI GIAO DIỆN LÓA MẮT"
        >
            {isDark ? (
                <>
                    <FiMoon className="text-lg animate-pulse" />
                    <span>CYBERPUNK</span>
                </>
            ) : (
                <>
                    <FiSun className="text-lg" />
                    <span>BRUTAL</span>
                </>
            )}
        </button>
    );
}
