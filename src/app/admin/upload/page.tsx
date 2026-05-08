"use client";

import { useState } from "react";
import Link from "next/link";
import UploadTabs from "@/components/admin/UploadTabs";
import FileDropzone from "@/components/admin/FileDropzone";
import ParsePreview from "@/components/admin/ParsePreview";
import ToastContainer, { showToast } from "@/components/Toast";
import type { FabricDetail } from "@/lib/fabric-details";
import { parseFabricMappingWorkbook } from "@/lib/parsers/xlsx-parser";

type ParseState = "idle" | "uploading" | "preview" | "importing" | "done" | "mappingDone";

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
    image_urls?: string[];
    images?: Array<{ filename: string; hasData?: boolean }>;
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

interface FabricMappingResult {
  imported: number;
  errors: string[];
  warnings: string[];
  sourceFile: string;
  sheetName: string;
  updatedAt: string;
  sample: FabricDetail[];
}

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState<"pdf" | "zip" | "excel">("pdf");
  const [state, setState] = useState<ParseState>("idle");
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors: string[];
  } | null>(null);
  const [mappingResult, setMappingResult] = useState<FabricMappingResult | null>(null);

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

  const handleExcelUpload = async (file: File) => {
    setState("uploading");
    try {
      const parsed = await parseFabricMappingWorkbook(await file.arrayBuffer());

      const res = await fetch("/api/import-fabric-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceFile: file.name,
          sheetName: parsed.sheetName,
          warnings: parsed.warnings,
          rows: parsed.rows,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setMappingResult(data);
      setState("mappingDone");
      showToast(`Updated ${data.imported} fabric mappings`, "success");
    } catch (e) {
      showToast(`Excel upload failed: ${(e as Error).message}`, "error");
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
              image_urls: s.image_urls,
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
    setMappingResult(null);
  };

  return (
    <>
      <header className="bg-white border-b border-[#e0e0e0] px-4 py-4 sticky top-0 z-10">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#333]">Upload Styles</h1>
            <div className="text-[13px] text-[#888] mt-0.5">
              Import from PDF, parsed ZIP, or Excel mapping
            </div>
          </div>
          <Link
            href="/admin"
            className="text-[13px] text-[#E85D2A] border border-[#E85D2A] px-3 py-1.5 rounded-md hover:bg-[#FFF5F0] transition-colors"
          >
            Back
          </Link>
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
              ) : activeTab === "zip" ? (
                <FileDropzone
                  accept=".zip"
                  label="Drop ZIP here"
                  description="opendataloader-pdf output (markdown + images folder)"
                  onFile={handleZipUpload}
                />
              ) : (
                <FileDropzone
                  accept=".xlsx"
                  label="Drop Excel here"
                  description='Workbook with "Style-Fabric Mapping" sheet (up to 25MB)'
                  onFile={handleExcelUpload}
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
              <Link
                href="/admin"
                className="px-4 py-2.5 border border-[#ddd] text-[#666] rounded-lg text-[14px] hover:bg-[#f5f5f5] transition-colors"
              >
                View Summary
              </Link>
            </div>
          </div>
        )}

        {state === "mappingDone" && mappingResult && (
          <div className="py-8">
            <div className="bg-white border border-[#eee] rounded-xl p-5">
              <div className="text-[18px] font-semibold text-[#333] mb-1">
                Fabric Mapping Updated
              </div>
              <div className="text-[14px] text-[#777]">
                {mappingResult.imported} rows imported from {mappingResult.sheetName}
              </div>
              <div className="text-[12px] text-[#aaa] mt-1">
                {mappingResult.sourceFile} &middot; {new Date(mappingResult.updatedAt).toLocaleString()}
              </div>

              {mappingResult.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                  <div className="text-[13px] font-semibold text-yellow-700 mb-1">
                    Warnings ({mappingResult.warnings.length})
                  </div>
                  {mappingResult.warnings.map((warning, i) => (
                    <div key={i} className="text-[12px] text-yellow-700">
                      {warning}
                    </div>
                  ))}
                </div>
              )}

              {mappingResult.sample.length > 0 && (
                <div className="border border-[#eee] rounded-lg overflow-hidden mt-4">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-[#fafafa] border-b border-[#eee]">
                        <th className="p-2 text-left text-[#888] font-medium">Style</th>
                        <th className="p-2 text-left text-[#888] font-medium">Fabric</th>
                        <th className="p-2 text-left text-[#888] font-medium hidden sm:table-cell">Supplier</th>
                        <th className="p-2 text-left text-[#888] font-medium hidden md:table-cell">Construction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mappingResult.sample.map((detail) => (
                        <tr key={`${detail.styleId}-${detail.fabricCode}-${detail.option}`} className="border-b border-[#f0f0f0]">
                          <td className="p-2 font-medium text-[#333]">{detail.styleId}</td>
                          <td className="p-2 text-[#666]">{detail.fabricCode || detail.originalText || "-"}</td>
                          <td className="p-2 text-[#666] hidden sm:table-cell">{detail.supplier || "-"}</td>
                          <td className="p-2 text-[#666] hidden md:table-cell">{detail.construction || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex gap-3 mt-5">
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 bg-[#E85D2A] text-white rounded-lg text-[14px] font-semibold hover:bg-[#d14e1f] transition-colors"
                >
                  Upload Another
                </button>
                <Link
                  href="/"
                  className="px-4 py-2.5 border border-[#ddd] text-[#666] rounded-lg text-[14px] hover:bg-[#f5f5f5] transition-colors"
                >
                  View Styles
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <ToastContainer />
    </>
  );
}
