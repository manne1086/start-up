export default function Footer() {
  return (
    <footer className="w-full border-t-2 border-white/10 py-10 bg-[#0A0A0F]">
      <div className="max-w-5xl mx-auto px-4 flex flex-col items-center justify-center text-center">
        <p className="text-gray-500 font-bold text-sm">
          Built with <span className="text-[#00D4AA]">LangGraph</span> + <span className="text-[#6C47FF]">FastAPI</span>
        </p>
      </div>
    </footer>
  );
}
