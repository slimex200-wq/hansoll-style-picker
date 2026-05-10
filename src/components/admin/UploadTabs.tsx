"use client";

export type UploadTabId = "pdf" | "zip" | "excel" | "imageZip";

interface UploadTabsProps {
  activeTab: UploadTabId;
  onTabChange: (tab: UploadTabId) => void;
}

const TABS: Array<{ id: UploadTabId; label: string; shortLabel: string }> = [
  { id: "pdf", label: "PDF Upload", shortLabel: "PDF" },
  { id: "zip", label: "Parsed ZIP Upload", shortLabel: "ZIP" },
  { id: "excel", label: "Excel Mapping Upload", shortLabel: "Excel Mapping" },
  { id: "imageZip", label: "Style Image Batch", shortLabel: "Images" },
];

export default function UploadTabs({ activeTab, onTabChange }: UploadTabsProps) {
  return (
    <div className="flex overflow-x-auto border-b border-[#eee] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`shrink-0 px-4 py-3 text-[14px] font-medium whitespace-nowrap transition-colors min-h-[44px] ${
            activeTab === tab.id
              ? "text-[#E85D2A] border-b-2 border-[#E85D2A] font-semibold"
              : "text-[#888] hover:text-[#555] border-b-2 border-transparent"
          }`}
        >
          <span className="hidden sm:inline">{tab.label}</span>
          <span className="sm:hidden">{tab.shortLabel}</span>
        </button>
      ))}
    </div>
  );
}
