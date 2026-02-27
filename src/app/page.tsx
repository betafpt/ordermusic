import FormInput from "@/components/FormInput";
import QueueList from "@/components/QueueList";
import Player from "@/components/Player";
import { FiMusic } from "react-icons/fi";

export default function Home() {
  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col items-center justify-center text-center space-y-2 py-4 md:py-8">
        <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 mb-2">
          <FiMusic className="text-3xl text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          Music Queue System
        </h1>
        <p className="text-zinc-400 max-w-md mx-auto">
          Cùng nhau tạo nên một playlist tuyệt vời. Gửi link bài hát bạn thích và âm nhạc sẽ được phát tự động.
        </p>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto w-full">
        {/* Cột trái: Form & Queue (Chiếm 5 phần) */}
        <div className="lg:col-span-5 flex flex-col gap-8 order-2 lg:order-1">
          <FormInput />
          <QueueList />
        </div>

        {/* Cột phải: Player (Chiếm 7 phần) */}
        <div className="lg:col-span-7 order-1 lg:order-2 sticky top-8">
          <Player />
        </div>
      </div>
    </div>
  );
}
