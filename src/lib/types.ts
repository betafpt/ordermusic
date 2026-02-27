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
