'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { FiSend } from 'react-icons/fi';
import { toast } from 'sonner';
import { useAdmin } from '@/hooks/useAdmin';

interface ChatMessage {
    id: string;
    username: string;
    message: string;
    created_at: string;
}

// Hàm mượn Web Audio API để phát tiếng "Ting Ting" nhẹ nhàng
const playTingSound = () => {
    try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();

        const playOscillator = (startTime: number, freq: number) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.type = 'sine'; // Âm mượt như chuông
            osc.frequency.setValueAtTime(freq, startTime);

            // Định hình âm lượng: tăng nhanh (attack) -> giảm dần (decay)
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.4);
        };

        // Ting 1 (Cao)
        playOscillator(ctx.currentTime, 880);
        // Ting 2 (Cao hơn chút xíu)
        playOscillator(ctx.currentTime + 0.15, 1108.73);
    } catch (e) {
        console.error("Audio play failed", e);
    }
};

export default function ChatBox() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [username, setUsername] = useState('ANONYMOUS');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { isAdmin } = useAdmin();

    // Lấy username từ LocalStorage và Tải tin nhắn cũ
    useEffect(() => {
        const loadName = () => {
            const storedName = localStorage.getItem('retro_music_username');
            if (storedName) setUsername(storedName);
            else setUsername('ANONYMOUS');
        };

        loadName();
        window.addEventListener('usernameChanged', loadName);

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (!error && data) {
                // Đảo ngược mảng để in từ cũ đến mới (trên xuống dưới)
                setMessages(data.reverse());
            }
        };

        fetchMessages();

        // Đăng ký kênh nhận Tin Nhắn Mới bằng Supabase Realtime
        const channel = supabase
            .channel('public:chat_messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                (payload) => {
                    const newMessage = payload.new as ChatMessage;

                    // Phát tiếng chuông báo tin nhắn mới nếu đó không phải tin mình gửi
                    const currentName = localStorage.getItem('retro_music_username');
                    if (newMessage.username !== currentName) {
                        playTingSound();
                    }

                    setMessages(prev => {
                        // Giữ tối đa 50 tin nhắn cho mượt
                        const updated = [...prev, newMessage];
                        if (updated.length > 50) updated.shift();
                        return updated;
                    });
                })
            .subscribe();

        return () => {
            window.removeEventListener('usernameChanged', loadName);
            supabase.removeChannel(channel);
        };
    }, []);

    // Scroll xuống cuối cùng mỗi khi có tin nhắn mới
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        const text = input.trim();
        if (!text) return;

        // Block Spam: Nếu chưa cài tên
        if (username === 'ANONYMOUS') {
            return toast.error('HÃY NHẬP TÊN BÊN KHUNG THÊM BÀI HÁT TRƯỚC KHI CHAT!', { className: 'font-oswald uppercase' });
        }

        // CHẶN TÊN ADMIN CHAT
        if (username.toLowerCase() === 'admin' && !isAdmin) {
            return toast.error('Tên "admin" chỉ dành cho Quản Trị Viên! Hành vi mạo danh sẽ bị khóa mõm.', { className: 'font-oswald uppercase' });
        }

        setInput(''); // Xóa ô nhập ngay lập tức cho mượt

        const { error } = await supabase.from('chat_messages').insert([
            { username, message: text }
        ]);

        if (error) {
            toast.error('LỖI GỬI TIN NHẮN');
        }
    };

    const handleDeleteMessage = async (id: string) => {
        try {
            const { error } = await supabase.from('chat_messages').delete().eq('id', id);
            if (error) throw error;
            // Xóa ở giao diện ngay cho mượt, không cần đợi socket
            setMessages(prev => prev.filter(msg => msg.id !== id));
        } catch {
            toast.error('LỖI KHI XÓA TIN NHẮN');
        }
    };

    return (
        <div className="brutal-panel p-4 flex flex-col gap-4 h-[400px] w-full bg-brand-bg relative mt-8">
            <h3 className="text-2xl font-jaro font-bold italic tracking-wider uppercase border-b-4 border-black pb-2">
                <span className="bg-brand-blue dark:bg-emerald-400 text-black px-3 py-1 inline-block transform -skew-x-6">💬 NHẮN NHỦ GÌ KHÔNG?</span>
            </h3>

            {/* Khung chứa tin nhắn */}
            <div className="flex-1 overflow-y-auto brutal-scrollbar pr-2 flex flex-col gap-2">
                {messages.length === 0 ? (
                    <p className="text-gray-500 font-oswald text-center mt-4">Chưa có ai gáy cả...</p>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.username === username;
                        return (
                            <div key={msg.id} className={`flex flex-col mb-2 group ${isMe ? 'items-end' : 'items-start'}`}>
                                <span className={`font-oswald text-[10px] font-bold uppercase tracking-widest mb-1 
                                    ${isMe ? 'text-brand-blue' : 'text-brand-pink'}`}>
                                    {msg.username}
                                </span>
                                <div className={`inline-flex max-w-[90%] break-words items-center gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <span className={`font-oswald text-lg ${isMe ? 'text-white' : 'text-gray-200'}`}>
                                        {msg.message}
                                    </span>
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleDeleteMessage(msg.id)}
                                            className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-red-500 hover:text-white hover:bg-red-500 p-1 rounded transition-all"
                                            title="Xóa tin nhắn (Admin)"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Form Nhập Tin Nhắn */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 mt-auto pt-2 border-t-4 border-black border-dashed">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="CHỬI THỀ = BAN"
                    maxLength={100}
                    className="flex-1 min-w-0 brutal-input h-12 text-lg uppercase"
                />
                <button
                    type="submit"
                    disabled={!input.trim()}
                    className="brutal-btn-blue h-12 w-12 flex items-center justify-center shrink-0 disabled:opacity-50"
                >
                    <FiSend size={20} />
                </button>
            </form>
        </div>
    );
}
