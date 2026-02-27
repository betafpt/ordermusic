import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
        let title = 'Unknown Title';
        let thumbnailUrl = '';

        // Lấy thông tin từ YouTube
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const res = await fetch(`https://www.youtube.com/oembed?url=${url}&format=json`);
            if (res.ok) {
                const data = await res.json();
                title = data.title;
                thumbnailUrl = data.thumbnail_url;
            }
        }
        // Lấy thông tin từ SoundCloud
        else if (url.includes('soundcloud.com')) {
            const res = await fetch(`https://soundcloud.com/oembed?url=${url}&format=json`);
            if (res.ok) {
                const data = await res.json();
                title = data.title;
                thumbnailUrl = data.thumbnail_url;
            }
        } else {
            return NextResponse.json({ error: 'Unsupported URL format' }, { status: 400 });
        }

        return NextResponse.json({ title, thumbnailUrl });
    } catch (error) {
        console.error('Error fetching metadata:', error);
        return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
    }
}
