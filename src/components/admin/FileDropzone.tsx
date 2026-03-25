"use client";

import { useState, useCallback, useRef } from "react";

interface FileDropzoneProps {
  accept: string;
  label: string;
  description: string;
  onFile: (file: File) => void;
  disabled?: boolean;
}

export default function FileDropzone({
  accept,
  label,
  description,
  onFile,
  disabled = false,
}: FileDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile, disabled]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = "";
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        disabled
          ? "border-[#ddd] bg-[#fafafa] cursor-not-allowed opacity-50"
          : dragOver
            ? "border-[#E85D2A] bg-[#FFF5F0]"
            : "border-[#ddd] hover:border-[#ccc] bg-white"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
      <div className="text-[15px] font-semibold text-[#333] mb-1">{label}</div>
      <div className="text-[13px] text-[#888]">{description}</div>
    </div>
  );
}
