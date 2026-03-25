"use client";

import { useState } from "react";
import UploadTabs from "@/components/admin/UploadTabs";
import FileDropzone from "@/components/admin/FileDropzone";
import ParsePreview from "@/components/admin/ParsePreview";
import ToastContainer, { showToast } from "@/components/Toast";

type ParseState = "idle" | "uploading" | "preview" | "importing" | "done";

interface ParsedData {
  styles: Array<{
    style_id: string;
    fabric_no: string;
    contents: string;
    construction: string;
    weight: string;
    finishing: string;
    designed_by: string;
    division: string;
    collection: string;
    fabric_suggestion: {
      fabric_no: string;
      construction: string;
      contents: string;
      weight: string;
    } | null;
    images: Array<{ filename: string; hasData?: boolean }>;
  }>;
  errors: string[];
  warnings: string[];
  metadata: {
    totalPages: number;
    source: string;
    collections: string[];
    divisions: string[];
  };
}

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState<"pdf" | "zip">("pdf");
  const [state, setState] = useState<ParseState>("idle");
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors: string[];
  } | null>(null);

  const handlePdfUpload = async (file: File) => {
    setState("uploading");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-pdf", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setParsedData(data);
      setState("preview");
    } catch (e) {
      showToast(`Upload failed: ${(e as Error).message}`, "error");
      setState("idle");
    }
  };

  const handleZipUpload = async (file: File) => {
    setState("uploading");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-zip", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setParsedData(data);
      setState("preview");
    } catch (e) {
      showToast(`Upload failed: ${(e as Error).message}`, "error");
      setState("idle");
    }
  };

  const handleImport = async (selectedIds: string[]) => {
    if (!parsedData) return;
    setState("importing");

    const selectedStyles = parsedData.styles.filter((s) =>
      selectedIds.includes(s.style_id)
    );

    // Group by collection for batch import
    const byCollection = new Map<string, typeof selectedStyles>();
    for (const style of selectedStyles) {
      const col = style.collection;
      if (!byCollection.has(col)) byCollection.set(col, []);
      byCollection.get(col)!.push(style);
    }

    let totalImported = 0;
    const allErrors: string[] = [];

    for (const [collection, styles] of byCollection) {
      try {
        const res = await fetch("/api/import-styles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            collection,
            styles: styles.map((s) => ({
              style_id: s.style_id,
              fabric_no: s.fabric_no,
              contents: s.contents,
              construction: s.construction,
              weight: s.weight,
              finishing: s.finishing,
              designed_by: s.designed_by,
              division: s.division,
              fabric_suggestion: s.fabric_suggestion,
            })),
          }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error);

        totalImported += result.imported;
        allErrors.push(...(result.errors ?? []));
      } catch (e) {
        allErrors.push(`${collection}: ${(e as Error).message}`);
      }
    }

    setImportResult({ imported: totalImported, errors: allErrors });
    setState("done");
    showToast(`Imported ${totalImported} styles`, "success");
  };

  const handleReset = () => {
    setState("idle");
    setParsedData(null);
    setImportResult(null);
  };

  return (
    <>
      <header className="bg-white border-b border-[#e0e0e0] px-4 py-4 sticky top-0 z-10">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#333]">Upload Styles</h1>
            <div className="text-[13px] text-[#888] mt-0.5">
              Import from PDF or parsed ZIP
            </div>
          </div>
          <a
            href="/admin"
            className="text-[13px] text-[#E85D2A] border border-[#E85D2A] px-3 py-1.5 rounded-md hover:bg-[#FFF5F0] transition-colors"
          >
            Back
          </a>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto p-4">
        {state === "idle" && (
          <>
            <UploadTabs activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="mt-4">
              {activeTab === "pdf" ? (
                <FileDropzone
                  accept=".pdf"
                  label="Drop PDF here"
                  description="Hansoll style suggestion PDF (up to 50MB)"
                  onFile={handlePdfUpload}
                />
              ) : (
                <FileDropzone
                  accept=".zip"
                  label="Drop ZIP here"
                  description="opendataloader-pdf output (markdown + images folder)"
                  onFile={handleZipUpload}
                />
              )}
            </div>
          </>
        )}

        {state === "uploading" && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-[14px] text-[#888]">Processing file...</div>
              <div className="text-[12px] text-[#aaa] mt-1">This may take a moment for large PDFs</div>
            </div>
          </div>
        )}

        {(state === "preview" || state === "importing") && parsedData && (
          <ParsePreview
            styles={parsedData.styles}
            errors={parsedData.errors}
            warnings={parsedData.warnings}
            onImport={handleImport}
            onCancel={handleReset}
            importing={state === "importing"}
          />
        )}

        {state === "done" && importResult && (
          <div className="text-center py-12">
            <div className="text-[18px] font-semibold text-[#333] mb-2">
              Import Complete
            </div>
            <div className="text-[14px] text-[#888] mb-4">
              {importResult.imported} styles imported successfully
              {importResult.errors.length > 0 && (
                <span className="text-red-500">
                  {" "}/ {importResult.errors.length} errors
                </span>
              )}
            </div>
            {importResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-left">
                {importResult.errors.map((err, i) => (
                  <div key={i} className="text-[12px] text-red-600">{err}</div>
                ))}
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleReset}
                className="px-4 py-2.5 bg-[#E85D2A] text-white rounded-lg text-[14px] font-semibold hover:bg-[#d14e1f] transition-colors"
              >
                Upload Another
              </button>
              <a
                href="/admin"
                className="px-4 py-2.5 border border-[#ddd] text-[#666] rounded-lg text-[14px] hover:bg-[#f5f5f5] transition-colors"
              >
                View Summary
              </a>
            </div>
          </div>
        )}
      </main>

      <ToastContainer />
    </>
  );
}
