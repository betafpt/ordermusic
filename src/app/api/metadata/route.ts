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

        let cleanUrl = url;

        // Lấy thông tin từ YouTube & Làm sạch URL
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            // Trích xuất chính xác Video ID (để loại bỏ list, time, channel,..)
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);

            if (match && match[2].length === 11) {
                // Tạo lại một link sạch tinh tươm
                cleanUrl = `https://www.youtube.com/watch?v=${match[2]}`;
            }

            // Dùng link nguyên gốc hoặc link sạch để fetch Metadata từ Oembed youtube
            const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json`);
            if (res.ok) {
                const data = await res.json();
                title = data.title;
                thumbnailUrl = data.thumbnail_url;

                // Tải trang Youtube nguyên thủy để bóc tách thời lượng
                try {
                    const htmlRes = await fetch(cleanUrl);
                    const htmlText = await htmlRes.text();
                    const durationMatch = htmlText.match(/"lengthSeconds":"(\d+)"/);
                    if (durationMatch && durationMatch[1]) {
                        const durationSeconds = parseInt(durationMatch[1], 10);
                        if (durationSeconds > 300) { // Quá 5 phút
                            return NextResponse.json({ error: 'TOO_LONG_BLOCKED' }, { status: 400 });
                        }
                    }
                } catch (e) {
                    console.error("Lỗi cào dữ liệu độ dài video YouTube:", e);
                }
            }
        }
        // Lấy thông tin từ SoundCloud
        else if (url.includes('soundcloud.com')) {
            const res = await fetch(`https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`);
            if (res.ok) {
                const data = await res.json();
                title = data.title;
                thumbnailUrl = data.thumbnail_url;
            }
        } else {
            return NextResponse.json({ error: 'Unsupported URL format' }, { status: 400 });
        }

        const lowerTitle = title.toLowerCase();

        // Chặn nhạc nonstop
        if (lowerTitle.includes('nonstop')) {
            return NextResponse.json({ error: 'NONSTOP_BLOCKED' }, { status: 400 });
        }

        // Chặn J97, Jack97
        if (lowerTitle.includes('j97') || lowerTitle.includes('jack') || lowerTitle.includes('đom đóm') || lowerTitle.includes('hồng nhan') || lowerTitle.includes('bạc phận') || lowerTitle.includes('sóng gió')) {
            return NextResponse.json({ error: 'J97_BLOCKED' }, { status: 400 });
        }

        return NextResponse.json({ title, thumbnailUrl, cleanUrl });
    } catch (error) {
        console.error('Error fetching metadata:', error);
        return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
    }
}
