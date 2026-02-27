'use client';

import { useEffect, useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import { supabase } from '@/lib/supabase';
import { Song } from '@/lib/types';
import { FiUser, FiPlay, FiPause, FiSkipForward } from 'react-icons/fi';

export default function Player() {
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [playing, setPlaying] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isMounted, setIsMounted] = useState(false);
    const playerRef = useRef<any>(null);

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
                .order('order_index', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (!error && data) {
                setCurrentSong(prev => {
                    if (prev?.id !== data.id) {
                        setPlaying(true);
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
    }, []);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleEnded = async () => {
        if (!currentSong || !isHost) return;
        setProgress(0);
        await supabase.from('queue').update({ is_played: true }).eq('id', currentSong.id);
    };

    const skipSong = async () => {
        if (!currentSong || !isHost) return;
        setProgress(0);
        await supabase.from('queue').update({ is_played: true }).eq('id', currentSong.id);
    };

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
                        className="brutal-btn-blue px-8 py-4 text-2xl"
                    >
                        ACTIVATE HOST PLAYER
                    </button>
                    <p className="mt-4 font-oswald text-gray-400 tracking-widest">
                        WARNING: AUDIO WILL PLAY ON THIS DEVICE
                    </p>
                </div>
            )}

            {/* Video Player (Đã ẩn) */}
            {isMounted && currentSong && isHost && (
                <div className="absolute top-0 left-0 w-2 h-2 opacity-0 pointer-events-none overflow-hidden">
                    {/* @ts-ignore */}
                    <ReactPlayer
                        ref={playerRef}
                        url={currentSong.url}
                        playing={playing}
                        onEnded={handleEnded}
                        onDuration={(d: number) => setDuration(d)}
                        onProgress={({ played, playedSeconds }: any) => {
                            setProgress(played * 100);
                            setCurrentTime(playedSeconds);
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
                        controls={true}
                        muted={false}
                        config={{
                            youtube: {
                                playerVars: {
                                    showinfo: 1,
                                    autoplay: 1,
                                    rel: 0,
                                    modestbranding: 1,
                                    origin: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'
                                }
                            } as any,
                        }}
                        onError={(e: any) => {
                            console.error("Player Error:", e);
                            skipSong();
                        }}
                    />
                </div>
            )}

            {/* Phần đỉnh: Player UI Box */}
            <div className="brutal-panel p-6 bg-brand-panel grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] xl:grid-cols-[2fr_1fr] gap-6 items-center">
                {/* Cassette Tape UI */}
                <div className="brutal-border bg-gray-300 p-2 md:p-4 relative w-full aspect-[1.6/1]">
                    {/* Label băng */}
                    <div className="absolute top-4 left-4 right-4 h-8 bg-brand-blue brutal-border flex items-center px-3 z-10">
                        <span className="font-oswald text-white font-bold tracking-widest text-xs">MIX TAPE #042</span>
                    </div>
                    {/* Center transparent window */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[40%] bg-white brutal-border overflow-hidden flex items-center justify-between px-6 z-0">
                        {/* Left Spool */}
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-[6px] border-black flex items-center justify-center shrink-0">
                            <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full border-4 border-dashed border-black ${playing ? 'tape-wheel' : 'tape-wheel-paused'}`}></div>
                        </div>
                        {/* Right Spool */}
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-[6px] border-black flex items-center justify-center shrink-0">
                            <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full border-4 border-dashed border-black ${playing ? 'tape-wheel' : 'tape-wheel-paused'}`}></div>
                        </div>
                    </div>
                    {/* Vạch kẻ đen dán nhãn */}
                    <div className="absolute inset-x-8 bottom-6 h-1 bg-black"></div>
                    {/* Rãnh đút màng Cassette ở dưới */}
                    <div className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 w-32 h-6 bg-brand-panel brutal-border border-b-0" style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0 100%)' }}></div>
                </div>

                {/* Các nút bấm */}
                <div className="flex flex-col gap-4 w-full justify-center">
                    <div className="flex justify-end">
                        <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 tracking-widest brutal-border">TYPE II - CHROME</span>
                    </div>
                    <div className="brutal-border bg-black p-4 text-brand-blue font-oswald text-xl tracking-widest font-bold h-20 flex flex-col justify-center">
                        <span className="text-[10px] text-gray-500 mb-1">STATUS</span>
                        {currentSong ? (playing ? 'PLAYING >>' : 'PAUSED ||') : 'STOPPED []'}
                    </div>

                    <div className="flex gap-4">
                        <button onClick={skipSong} className="flex-1 brutal-btn-blue bg-brand-panel h-12 flex items-center justify-center text-xl">
                            <FiSkipForward />
                        </button>
                        <button onClick={() => setPlaying(!playing)} className={`flex-1 ${playing ? 'brutal-btn-pink' : 'brutal-border bg-brand-panel text-white'} h-12 flex items-center justify-center text-xl`}>
                            {playing ? <FiPause /> : <FiPlay />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Phần Text to khổng lồ */}
            <div className="flex flex-col uppercase mt-4 md:mt-8 min-w-0">
                <h1 className="font-sans font-black text-6xl md:text-[6rem] xl:text-[8rem] leading-none truncate tracking-tighter" style={{ fontFamily: 'Impact, sans-serif' }}>
                    {titles.main}
                </h1>
                <h2 className="font-sans font-black text-4xl md:text-6xl xl:text-[5rem] leading-tight text-brand-blue italic truncate tracking-tighter" style={{ fontFamily: 'Impact, sans-serif' }}>
                    {titles.sub}
                </h2>
            </div>

            {/* Progress Bar Ảo/Thật */}
            <div className="flex flex-col gap-2 mt-4 font-oswald font-bold tracking-wider text-xl">
                <div className="flex justify-between">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
                <div className="h-6 w-full brutal-border bg-brand-panel flex">
                    <div className="h-full bg-brand-blue border-r-4 border-black transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }}></div>
                </div>
                {/* Thanh trượt con lăn */}
                <div className="h-10 mt-2 brutal-border bg-brand-bg relative flex items-center px-4">
                    <div className="w-full h-1 bg-black absolute left-0 right-0 top-1/2 -translate-y-1/2"></div>
                    <div className="absolute w-6 h-6 rounded-full brutal-border bg-brand-pink z-10 transition-all duration-1000" style={{ left: `calc(${progress}% - 12px)` }}></div>
                </div>
            </div>

            {/* Dòng cuối Submitter */}
            <div className="flex items-center justify-between mt-auto pt-4 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-pink brutal-border flex items-center justify-center text-white">
                        <FiUser size={24} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-oswald text-gray-400 font-bold uppercase tracking-widest">SUBMITTED BY</span>
                        <span className="font-oswald text-xl font-bold tracking-wider uppercase">{currentSong ? currentSong.added_by : '@NOBODY'}</span>
                    </div>
                </div>

                <div className="brutal-border px-4 py-2 bg-brand-panel flex items-center gap-2">
                    <span className="font-oswald font-bold uppercase text-sm tracking-wider">YOUTUBE MUSIC</span>
                </div>
            </div>
        </div>
    );
}
