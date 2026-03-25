"use client";

import { useState } from "react";

interface NamePromptProps {
  onSubmit: (name: string) => void;
}

export default function NamePrompt({ onSubmit }: NamePromptProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-8 w-full max-w-[320px] text-center"
      >
        <h2 className="text-xl font-semibold text-[#333]">Welcome</h2>
        <p className="text-sm text-[#888] mt-2 mb-5">
          SP&apos;27 Talbots Outlet Collection
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-3 py-3 border border-[#ddd] rounded-lg text-base text-[#333] placeholder:text-[#aaa] focus:outline-none focus:border-[#E85D2A] transition-colors"
          autoFocus
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full mt-3 py-3 bg-[#E85D2A] text-white rounded-lg text-base font-medium disabled:opacity-40 hover:bg-[#d14e1f] transition-colors min-h-[44px]"
        >
          View Collection
        </button>
      </form>
    </div>
  );
}
