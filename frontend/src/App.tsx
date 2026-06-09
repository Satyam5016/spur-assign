import { ChatWidget } from "./components/ChatWidget";

export default function App() {
  return (
    <main className="min-h-screen bg-[#eef4f1] px-4 py-4 text-slate-900 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-32px)] w-full max-w-5xl items-center justify-center">
        <ChatWidget />
      </div>
    </main>
  );
}
