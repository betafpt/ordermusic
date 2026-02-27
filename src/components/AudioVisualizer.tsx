export default function AudioVisualizer({ isPlaying }: { isPlaying: boolean }) {
    // Tạo 20 cột sóng nhạc
    const bars = Array.from({ length: 40 });

    return (
        <div className="w-full h-8 flex items-end justify-between gap-[2px] bg-black brutal-border p-1 overflow-hidden">
            {bars.map((_, i) => (
                <div
                    key={i}
                    className={`w-full bg-brand-pink border-t-2 border-black origin-bottom transition-all duration-75`}
                    style={{
                        // Chiều cao ngẫu nhiên liên tục khi đang play
                        height: isPlaying ? `${Math.floor(Math.random() * 80) + 20}%` : '5%',
                        // Đổi màu cột chẵn/lẻ cho đẹp
                        backgroundColor: i % 3 === 0 ? '#ff0055' : i % 2 === 0 ? '#00f0ff' : '#fff',
                        // Thêm animation CSS tự giật
                        animation: isPlaying
                            ? `bounce ${0.3 + Math.random() * 0.5}s infinite alternate`
                            : 'none',
                        animationDelay: `${Math.random()}s`
                    }}
                />
            ))}

            <style jsx>{`
                @keyframes bounce {
                    0% {
                        transform: scaleY(0.2);
                    }
                    100% {
                        transform: scaleY(1);
                    }
                }
            `}</style>
        </div>
    );
}
