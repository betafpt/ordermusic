import FormInput from "@/components/FormInput";
import QueueList from "@/components/QueueList";
import Player from "@/components/Player";
import HistoryList from "@/components/HistoryList";
import Leaderboard from "@/components/Leaderboard";
import ChatBox from "@/components/ChatBox";

export default function Home() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6 xl:gap-8 max-w-[1920px] mx-auto">
      {/* Cột trái: Player & Info & Chat */}
      <div className="flex flex-col gap-6 w-full h-full min-w-0">

        {/* Hàng trên cùng: Màn hình trình chiếu (Player) */}
        <div className="w-full">
          <Player />
        </div>

        {/* Lịch sử và Bảng xếp hạng bên dưới Player */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          <HistoryList />
          <Leaderboard />
        </div>

      </div>

      {/* Cột phải: Form & Queue & Stats */}
      <div className="flex flex-col gap-6 w-full min-w-0">
        <FormInput />
        <QueueList />

        {/* Khung chat thay thế Thống kê */}
        <div className="flex-1 mt-2 min-h-[400px]">
          <ChatBox />
        </div>
      </div>
    </div>
  );
}
