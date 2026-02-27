import FormInput from "@/components/FormInput";
import QueueList from "@/components/QueueList";
import Player from "@/components/Player";

export default function Home() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2.25fr_1fr] gap-6 lg:gap-8">
      {/* Cột trái: Player & Info */}
      <div className="flex flex-col gap-6 w-full h-full min-w-0">
        <Player />
      </div>

      {/* Cột phải: Form & Queue & Stats */}
      <div className="flex flex-col gap-6 w-full min-w-0">
        <FormInput />
        <QueueList />

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-4 mt-auto">
          <div className="brutal-panel bg-brand-pink border-4 border-black p-4 text-white">
            <p className="text-xs font-oswald font-black uppercase tracking-wider mb-1">Listeners</p>
            <p className="text-4xl font-oswald font-bold leading-none">128</p>
          </div>
          <div className="brutal-panel bg-brand-panel border-4 border-black p-4 text-white">
            <p className="text-xs font-oswald font-black uppercase tracking-wider text-gray-400 mb-1">Queue Time</p>
            <p className="text-4xl font-oswald font-bold leading-none">18m</p>
          </div>
        </div>
      </div>
    </div>
  );
}
