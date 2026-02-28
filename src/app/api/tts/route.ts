import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { text } = await request.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const apiKey = process.env.ELEVENLABS_API_KEY;

        if (!apiKey) {
            console.error('ELEVENLABS_API_KEY is missing in environment variables');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Chọn Voice ID của Bella (đọc Tiếng Việt cảm xúc và rõ ràng hơn)
        const voiceId = 'EXAVITQu4vr4xnSDxMaL';

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
                'Accept': 'audio/mpeg'
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5
                }
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('ElevenLabs API Error:', errorData);
            return NextResponse.json({ error: 'Failed to generate speech' }, { status: response.status });
        }

        // Đọc dữ liệu audio stream
        const audioBuffer = await response.arrayBuffer();

        // Trả về file âm thanh trực tiếp dưới dạng luồng
        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'no-store, max-age=0',
            },
        });
    } catch (error) {
        console.error('TTS Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
