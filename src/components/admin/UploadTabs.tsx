"use client";

interface UploadTabsProps {
  activeTab: "pdf" | "zip";
  onTabChange: (tab: "pdf" | "zip") => void;
}

const TABS = [
  { id: "pdf" as const, label: "PDF Upload" },
  { id: "zip" as const, label: "Parsed ZIP Upload" },
];

export default function UploadTabs({ activeTab, onTabChange }: UploadTabsProps) {
  return (
    <div className="flex border-b border-[#eee]">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-3 text-[14px] font-medium whitespace-nowrap transition-colors min-h-[44px] ${
            activeTab === tab.id
              ? "text-[#E85D2A] border-b-2 border-[#E85D2A] font-semibold"
              : "text-[#888] hover:text-[#555] border-b-2 border-transparent"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
