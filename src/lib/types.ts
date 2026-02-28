export interface Song {
    id: string;
    created_at: string;
    url: string;
    title: string;
    thumbnail_url: string;
    added_by: string; // Tên người gửi lời yêu cầu
    is_played: boolean; // Trạng thái: đang chờ / đã phát
    upvotes?: number;
    downvotes?: number;
}

export interface Vote {
    id: string;
    song_id: string;
    voter_name: string;
    vote_type: 'up' | 'down';
    created_at: string;
}
