'use client';

import { useEffect, useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import { supabase } from '@/lib/supabase';
import { Song } from '@/lib/types';
import { FiUser, FiPlay, FiPause, FiSkipForward } from 'react-icons/fi';
import { AiOutlineArrowUp, AiOutlineArrowDown } from 'react-icons/ai';
import { toast } from 'sonner';
import { useAdmin } from '@/hooks/useAdmin';


import AudioVisualizer from './AudioVisualizer';

export default function Player() {
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [playing, setPlaying] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isMounted, setIsMounted] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false); // Trạng thái "Đang thu âm/Đọc"
    const [volume, setVolume] = useState(1); // 0.0 to 1.0
    const [isMCEnabled, setIsMCEnabled] = useState(true);
    const isMCEnabledRef = useRef(true);
    const playerRef = useRef<any>(null);
    const { isAdmin } = useAdmin();

    useEffect(() => {
        isMCEnabledRef.current = isMCEnabled;
    }, [isMCEnabled]);

    // Hàm gọi dàn Loa Phường của chị Google lên đọc văn bản, đọc xong trả về Promise resolve
    const playTTS = (text: string): Promise<void> => {
        return new Promise((resolve) => {
            if (!('speechSynthesis' in window)) {
                console.warn('Trình duyệt không hỗ trợ Text To Speech');
                resolve();
                return;
            }

            // Hủy các giọng đọc cũ đang kẹt
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'vi-VN'; // Giọng Việt Nam
            utterance.rate = 1.0; // Tốc độ bình thường
            utterance.pitch = 1.2; // Giọng hơi cao một chút (tone nữ MC)

            // Đọc xong thì đi tiếp
            utterance.onend = () => {
                setIsSpeaking(false);
                resolve();
            };

            // Xử lý lỗi: Dù lỗi cũng cho đi tiếp để khỏi treo app
            utterance.onerror = (e) => {
                console.error("Lỗi đọc TTS:", e);
                setIsSpeaking(false);
                resolve();
            };

            setIsSpeaking(true);
            window.speechSynthesis.speak(utterance);
        });
    };

    const formatTime = (seconds: number) => {
        if (isNaN(seconds) || seconds === 0) return '00:00';
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    useEffect(() => {
        const fetchCurrentSong = async () => {
            const { data, error } = await supabase
                .from('queue')
                .select('*')
                .eq('is_played', false)
                .order('created_at', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (!error && data) {
                setCurrentSong(prev => {
                    // Nếu là bài nhảy mới
                    if (prev?.id !== data.id) {
                        // Nếu là Host, cho phép Giọng đọc Google lên phát thanh
                        if (isAdmin && isMCEnabledRef.current) {
                            const nameParts = getDisplayTitles(data.title);
                            const textToRead = `Tiếp theo là bài hát: ${nameParts.main}, do ${data.added_by} đóng góp. Mời quý vị thưởng thức!`;

                            // Ngừng nhạc, gọi loa phường
                            setPlaying(false);
                            playTTS(textToRead).then(() => {
                                setPlaying(true); // Đọc xong thả rông cho hát
                            });
                        } else {
                            // Của khán giả thì cứ tự Play
                            setPlaying(true);
                        }
                        return data;
                    }

                    // Nếu id trùng nhau (cùng bài hát đó), nhưng có thay đổi về upvote, downvote từ database Realtime
                    if (prev?.upvotes !== data.upvotes || prev?.downvotes !== data.downvotes) {
                        return data;
                    }

                    return prev;
                });
            } else {
                setCurrentSong(null);
            }
        };

        fetchCurrentSong();

        const channel = supabase
            .channel('public:queue:player')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'queue' }, () => {
                fetchCurrentSong();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isAdmin]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleEnded = async () => {
        setProgress(0);
        if (currentSong && isHost) {
            await supabase.from('queue').update({ is_played: true }).eq('id', currentSong.id);
        }
    };

    const skipSong = async () => {
        setProgress(0);
        if (currentSong && (isHost || isAdmin)) {
            await supabase.from('queue').update({ is_played: true }).eq('id', currentSong.id);
        }
    };

    // Theo dõi số Downvote, nếu quá 3 thì ĐÁ VĂNG
    useEffect(() => {
        if (currentSong && currentSong.downvotes !== undefined && currentSong.downvotes >= 3 && isHost) {
            toast.error('BÀI HÁT QUÁ DỞ! ĐÃ BỊ CỘNG ĐỒNG ĐÁ VĂNG 🥾', { className: 'font-oswald uppercase text-white bg-black border-[4px] border-[#ff0055]' });
            skipSong();
        }
    }, [currentSong?.downvotes, isHost]);

    // Chia Tên và Tác giả từ Title
    const getDisplayTitles = (title: string) => {
        if (!title) return { main: 'NO TRACK', sub: 'UNKNOWN' };
        const parts = title.split('-');
        if (parts.length > 1) {
            return { main: parts[1].trim(), sub: parts[0].trim() };
        }
        return { main: title.substring(0, 30), sub: 'VARIOUS ARTISTS' };
    };

    const titles = getDisplayTitles(currentSong?.title || '');

    return (
        <div className="brutal-panel p-6 flex flex-col gap-8 h-full bg-brand-bg relative overflow-hidden">
            {!isHost && !hasInteracted && (
                <div className="absolute inset-0 bg-brand-bg/90 z-50 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
                    <button
                        onClick={() => {
                            setIsHost(true);
                            setHasInteracted(true);
                            setPlaying(true);
                        }}
                        className="brutal-btn-blue px-8 py-4 text-2xl uppercase tracking-widest"
                    >
                        KÍCH HOẠT MÁY CHỦ
                    </button>
                    <p className="mt-4 font-oswald text-gray-400 tracking-widest uppercase">
                        SẼ PHÁT ĐỘNG ÂM THANH TRÊN THIẾT BỊ NÀY
                    </p>
                </div>
            )}

            {/* Phần Video Player (Màn hình CRT ảo, Brutalist TV) */}
            <div className="brutal-panel bg-brand-panel p-4 grid grid-cols-1 lg:grid-cols-[2fr_1fr] xl:grid-cols-[2.5fr_1fr] gap-6">
                {/* Cột trái TV: bao gồm Màn Hình + Sóng Nhạc bên dưới */}
                <div className="flex flex-col gap-2 w-full">
                    {/* Màn hình TV thay cho Cassette tape cũ */}
                    <div className="brutal-border bg-black relative w-full aspect-video flex items-center justify-center p-2">
                        {/* Retro TV Bezel/Frame */}
                        <div className="absolute top-2 left-4 z-10 flex flex-col gap-1">
                            <span className="font-oswald text-white font-black tracking-widest text-[10px] sm:text-xs">AV1 // STEREO</span>
                            {isSpeaking && (
                                <span className="font-oswald text-[#ff0055] font-black tracking-widest text-[10px] sm:text-xs animate-pulse">
                                    🎙️ ĐANG GIỚI THIỆU...
                                </span>
                            )}
                        </div>



                        {isMounted && currentSong && isHost ? (
                            <div className="w-full h-full relative cursor-pointer">
                                {/* @ts-ignore */}
                                <ReactPlayer
                                    ref={playerRef}
                                    url={currentSong.url}
                                    playing={playing && !isSpeaking && hasInteracted}
                                    volume={volume}
                                    onEnded={handleEnded}
                                    onDuration={(d: number) => setDuration(d)}
                                    onProgress={({ played, playedSeconds }: any) => {
                                        setProgress(played * 100);
                                        setCurrentTime(playedSeconds);

                                        // Chặn Video Quảng Cáo nhảy ra của Youtube: Chuyển bài sớm 1 giây
                                        if (duration > 0 && playedSeconds >= duration - 1) {
                                            if (isHost) handleEnded();
                                        }
                                    }}
                                    onReady={() => {
                                        if (hasInteracted) {
                                            setPlaying(true);
                                        }
                                    }}
                                    onPlay={() => setPlaying(true)}
                                    onPause={() => setPlaying(false)}
                                    onStart={() => {
                                        if (hasInteracted) setPlaying(true);
                                    }}
                                    width="100%"
                                    height="100%"
                                    controls={false} // Khôi phục ấn thanh Play youtube mặc định
                                    muted={false}
                                    onError={(e: any) => {
                                        console.error("Youtube Player Error Cátched:", e);
                                        // Báo lỗi ra FrontEnd cho người xem biết
                                        if (e === 100) toast.error("Video Youtube này bị lỗi hoặc không tồn tại. Bỏ qua!");
                                        else if (e === 101 || e === 150) toast.error("Tác giả của Video Youtube này Cấm phát bên ngoài app. Bỏ qua!");
                                        else toast.error("Có lỗi đường truyền khi đọc Video Youtube. Bỏ qua!");

                                        // Lập tức nhảy nhạc sau 2 giây để tránh kẹt sảnh
                                        setTimeout(() => {
                                            skipSong();
                                        }, 2000);
                                    }}
                                    config={{
                                        youtube: {
                                            playerVars: {
                                                showinfo: 0,
                                                controls: 0,
                                                disablekb: 1,
                                                fs: 0,
                                                autoplay: 1,
                                                rel: 0, // 0 = Không đề xuất các video từ kênh/playlist liên quan khi hết bài
                                                modestbranding: 1,
                                                origin: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'
                                            }
                                        } as any
                                    }}
                                />
                                {/* Lớp filter CRT */}
                                <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiLz48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMDAwIi8+PC9zdmc+')]"></div>
                            </div>
                        ) : (
                            // Màn hình chờ rỗng
                            <div className="w-full h-full brutal-border border-gray-700 bg-gray-900 flex items-center justify-center relative overflow-hidden">
                                <h3 className="font-oswald text-gray-500 font-bold tracking-[0.2em] text-xl z-20 animate-pulse">KHÔNG CÓ TÍN HIỆU</h3>
                            </div>
                        )}
                    </div>
                    {/* Cột sóng nhạc gắn dưới đáy TV */}
                    <AudioVisualizer isPlaying={playing && !isSpeaking} />
                </div>

                {/* Các nút bấm */}
                <div className="flex flex-col gap-2 w-full justify-center">
                    <div className="flex justify-end">
                        <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 tracking-widest brutal-border">LOẠI II - ĐĨA TRANH</span>
                    </div>
                    <div className="brutal-border bg-black p-4 text-brand-blue font-oswald text-xl tracking-widest font-bold h-20 flex flex-col justify-center mb-2">
                        <span className="text-[10px] text-gray-500 mb-1">TRẠNG THÁI</span>
                        {currentSong ? (playing ? 'ĐANG PHÁT >>' : 'TẠM DỪNG ||') : 'ĐÃ DỪNG []'}
                    </div>

                    <div className="flex gap-4 items-center">
                        <button
                            onClick={skipSong}
                            disabled={!isAdmin}
                            className="flex-1 brutal-btn-blue bg-brand-panel h-12 flex items-center justify-center text-xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!isAdmin ? "Chỉ Admin mới có quyền gõ Đầu Đĩa" : ""}
                        >
                            <FiSkipForward />
                        </button>
                        <button
                            onClick={() => {
                                if (!isAdmin) return toast.error('CHỈ ADMIN MỚI CHỈNH ĐƯỢC NHẠC', { className: 'font-oswald uppercase' });
                                if (playerRef.current) {
                                    try {
                                        const internalPlayer = playerRef.current.getInternalPlayer();
                                        if (playing) {
                                            if (internalPlayer && typeof internalPlayer.pauseVideo === 'function') {
                                                internalPlayer.pauseVideo();
                                            }
                                        } else {
                                            if (internalPlayer && typeof internalPlayer.playVideo === 'function') {
                                                internalPlayer.playVideo();
                                            }
                                        }
                                    } catch (e) {
                                        console.log(e);
                                    }
                                }
                                setPlaying(!playing);
                            }}
                            className={`flex-1 ${playing ? 'brutal-btn-pink' : 'brutal-border bg-brand-panel text-white'} h-12 flex items-center justify-center text-xl hover:scale-105 active:scale-95 transition-transform ${!isAdmin ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:active:scale-100' : ''}`}
                            title={!isAdmin ? "Chỉ Admin mới có quyền gõ Đầu Đĩa" : ""}
                        >
                            {playing ? <FiPause /> : <FiPlay />}
                        </button>
                    </div>

                    {/* Các tính năng giành riêng cho Admin */}
                    {isAdmin && (
                        <div className="flex flex-col gap-4 mt-4 brutal-border bg-black p-4">
                            {/* Thanh chỉnh Âm lượng */}
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-brand-blue font-bold tracking-widest uppercase mb-2">ĐIỀU CHỈNH ÂM LƯỢNG MÁY CHỦ</span>
                                <div className="flex items-center gap-4">
                                    <span className="font-oswald font-bold text-gray-500 text-sm">MIN</span>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={volume}
                                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                                        className="flex-1 h-3 bg-gray-700 brutal-border appearance-none cursor-pointer accent-brand-pink"
                                    />
                                    <span className="font-oswald font-bold text-brand-pink text-sm">MAX</span>
                                </div>
                            </div>

                            {/* Bật / Tắt MC Ảo */}
                            <div className="flex flex-col gap-1 pt-4 border-t-2 border-dashed border-gray-700">
                                <span className="text-[10px] text-brand-blue font-bold tracking-widest uppercase mb-2">MC ẢO GIỚI THIỆU BÀI HÁT</span>
                                <button
                                    onClick={() => setIsMCEnabled(!isMCEnabled)}
                                    className={`w-full h-10 border-[3px] flex items-center justify-center font-oswald text-sm font-bold tracking-widest uppercase transition-colors ${isMCEnabled
                                        ? 'bg-brand-pink text-black border-black hover:bg-white hover:text-black'
                                        : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700 hover:text-white'
                                        }`}
                                >
                                    {isMCEnabled ? '🔊 ĐANG BẬT MC' : '🔇 ĐÃ TẮT MC'}
                                </button>
                            </div>

                            {/* Ép Tải Lại Trang (Live Update) */}
                            <div className="flex flex-col gap-1 pt-4 border-t-2 border-dashed border-gray-700">
                                <span className="text-[10px] text-brand-blue font-bold tracking-widest uppercase mb-2">LIVE UPDATE</span>
                                <button
                                    onClick={async () => {
                                        if (confirm("⚠️ BẠN CÓ CHẮC KHÔNG?\nHành động này sẽ ép TẤT CẢ các thiết bị đang mở trang web (kể cả điện thoại khách) giật Refresh (F5) ngay lập tức.\n\nChỉ dùng khi vừa Update Code mới từ Github.")) {
                                            toast.loading("Đang phát tín hiệu bắt buộc Tải lại trang...");

                                            await supabase.channel('public:app:settings').send({
                                                type: 'broadcast',
                                                event: 'force-reload',
                                                payload: { timestamp: new Date().toISOString() }
                                            });

                                            toast.success("Đã phát lệnh thả bom F5 thành công!");
                                        }
                                    }}
                                    className="w-full h-10 border-[3px] border-[#ff0055] flex items-center justify-center font-oswald text-sm text-white font-bold tracking-widest uppercase transition-colors bg-[#ff0055]/20 hover:bg-[#ff0055]"
                                >
                                    🔄 ÉP TẢI LẠI TRÀNG TOÀN BỘ CLIENT
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Progress Bar - Đã đưa lên ngay dưới TV/Controls */}
                <div className="flex flex-col gap-2 font-oswald font-bold tracking-wider text-xl lg:col-span-2 xl:col-span-2 group">
                    <div className="flex justify-between text-gray-400 group-hover:text-white transition-colors duration-300">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                    {/* Container thanh chạy */}
                    <div
                        className="h-6 w-full bg-brand-bg flex border-4 border-black relative overflow-hidden cursor-pointer shadow-[0_0_10px_rgba(29,144,245,0.2)] group-hover:shadow-[0_0_20px_rgba(29,144,245,0.6)] transition-all duration-300"
                        onClick={(e) => {
                            if (!playerRef.current) return;
                            const bounds = e.currentTarget.getBoundingClientRect();
                            const percent = (e.clientX - bounds.left) / bounds.width;
                            playerRef.current.seekTo(percent, 'fraction');
                        }}
                    >
                        {/* Thanh xanh biển */}
                        <div className="h-full bg-brand-blue border-r-4 border-black transition-all duration-1000 ease-linear group-hover:brightness-125" style={{ width: `${progress}%` }}></div>
                        {/* Hiệu ứng tia sáng quét ngang thanh */}
                        <div className="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:animate-[shimmer_2s_infinite]"></div>
                    </div>
                </div>
            </div>

            {/* Phần Text to khổng lồ */}
            <div className="flex flex-col uppercase mt-2 md:mt-4 min-w-0 flex-1 justify-center">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-[1.1] text-wrap break-words tracking-normal pb-2 line-clamp-3" style={{ fontFamily: 'var(--font-jaro), Impact, sans-serif' }}>
                    {titles.main}
                </h1>
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl leading-[1.1] text-brand-blue italic text-wrap break-words tracking-normal line-clamp-2" style={{ fontFamily: 'var(--font-jaro), Impact, sans-serif' }}>
                    {titles.sub}
                </h2>
            </div>

            {/* Dòng cuối Submitter & Tương tác Cộng đồng */}
            <div className="flex items-center justify-between mt-auto pt-6 flex-wrap gap-4 border-t-4 border-black border-dashed">
                <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-4 group cursor-pointer transition-transform hover:-translate-y-1">
                        <div className="w-12 h-12 bg-brand-pink brutal-border flex items-center justify-center text-white relative">
                            <FiUser size={24} className="animate-pulse" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-black rounded-full animate-ping"></div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-black rounded-full"></div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-oswald text-gray-500 font-bold uppercase tracking-widest group-hover:text-brand-pink transition-colors">ĐƯỢC ĐÓNG GÓP BỞI</span>
                            <span className="font-oswald text-2xl font-black tracking-widest uppercase text-brand-blue group-hover:text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-colors">
                                {currentSong ? currentSong.added_by : '@CHƯA_CÓ_AI'}
                            </span>
                        </div>
                    </div>

                    {/* VOTE BUTTONS đưa lên sát bên Tên Người Đóng Góp */}
                    {currentSong && (
                        <div className="flex items-center gap-3 ml-2 lg:ml-6">
                            <button
                                onClick={async () => {
                                    if (!currentSong) return;
                                    const { error } = await supabase.rpc('increment_upvote', { row_id: currentSong.id });
                                    if (!error) toast.success("Đã Vote 1 vé cho bài này!");
                                }}
                                className="w-12 h-12 brutal-border bg-gray-900 text-white flex items-center justify-center hover:bg-green-500 hover:-translate-y-1 active:translate-y-0 transition-all group relative"
                                title="Nghe Rất Cuốn!"
                            >
                                <span className="absolute -top-2 -right-2 bg-green-500 border-2 border-black text-[10px] font-black w-6 h-6 flex items-center justify-center text-white z-10">{currentSong?.upvotes || 0}</span>
                                <span className="text-xl group-hover:animate-bounce">👍</span>
                            </button>

                            <button
                                onClick={async () => {
                                    if (!currentSong) return;
                                    const { error } = await supabase.rpc('increment_downvote', { row_id: currentSong.id });
                                    if (!error) toast.success("Đã chê bài hát này!");
                                }}
                                className="w-12 h-12 brutal-border bg-gray-900 text-white flex items-center justify-center hover:bg-red-500 hover:-translate-y-1 active:translate-y-0 transition-all group relative"
                                title="Nghe Hơi Tệ"
                            >
                                <span className="absolute -top-2 -right-2 bg-red-500 border-2 border-black text-[10px] font-black w-6 h-6 flex items-center justify-center text-white z-10">{currentSong?.downvotes || 0}</span>
                                <span className="text-xl group-hover:animate-bounce">👎</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="brutal-border px-6 py-2 bg-black text-brand-pink flex items-center gap-2 hover:bg-brand-pink hover:text-black transition-colors cursor-pointer group animate-bounce-slow">
                    <span className="font-oswald font-black uppercase text-sm tracking-widest group-hover:scale-110 transition-transform">
                        • NHẠC TỪ YOUTUBE •
                    </span>
                </div>
            </div>
        </div>
    );
}
