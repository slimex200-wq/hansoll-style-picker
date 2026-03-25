"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { Style, Selection, Memo } from "@/lib/types";
import { fetchStyles, fetchSelections, fetchMemos } from "@/lib/api";
import { STATUS_CONFIG } from "@/lib/store";

export default function AdminPage() {
  const [styles, setStyles] = useState<Style[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, sel, m] = await Promise.all([
          fetchStyles(),
          fetchSelections(),
          fetchMemos(),
        ]);
        setStyles(s);
        setSelections(sel);
        setMemos(m);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getVotesForStyle = (styleId: string) => {
    const votes = selections.filter((s) => s.style_id === styleId);
    const counts = { shortlist: 0, maybe: 0, pass: 0 };
    for (const v of votes) {
      counts[v.status]++;
    }
    return { votes, counts, total: votes.length };
  };

  const getLatestMemo = (styleId: string): Memo | undefined => {
    return memos.reduce<Memo | undefined>((latest, m) => {
      if (m.style_id !== styleId) return latest;
      if (!latest) return m;
      return new Date(m.created_at) > new Date(latest.created_at) ? m : latest;
    }, undefined);
  };

  const uniqueUsers = new Set(selections.map((s) => s.user_id)).size;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: "#fafafa" }}>
        <p style={{ color: "#888", fontSize: 14 }}>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <header className="bg-white border-b border-[#e0e0e0] px-4 py-4 sticky top-0 z-10">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#333]">
              Selection Summary
            </h1>
            <div className="text-[13px] text-[#888] mt-0.5">
              SP&apos;27 Talbots Outlet &middot; {uniqueUsers} reviewer{uniqueUsers !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/upload"
              className="text-[13px] text-white bg-[#E85D2A] px-3 py-1.5 rounded-md hover:bg-[#d14e1f] transition-colors"
            >
              Upload PDF
            </a>
            <a
              href="/"
              className="text-[13px] text-[#E85D2A] border border-[#E85D2A] px-3 py-1.5 rounded-md hover:bg-[#FFF5F0] transition-colors"
            >
              Back
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto p-4">
        {[...new Set(styles.map((s) => s.division))].map((division) => (
          <section key={division} className="mb-6">
            <h2 className="text-[14px] font-semibold text-[#333] mb-2">
              {division}{" "}
              <span className="font-normal text-[#888]">
                ({styles.filter((s) => s.division === division).length})
              </span>
            </h2>
            <div className="space-y-3">
          {styles.filter((s) => s.division === division).map((style) => {
            const { counts, total } = getVotesForStyle(style.id);
            const latestMemo = getLatestMemo(style.id);
            return (
              <div
                key={style.id}
                className="bg-white border border-[#eee] rounded-xl p-4 flex gap-4"
              >
                <div className="w-20 h-[100px] bg-[#f0f0f0] rounded-lg flex-shrink-0 overflow-hidden relative">
                  <Image
                    src={style.image_url}
                    alt={style.id}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold text-[#333]">
                    {style.id}
                  </h3>
                  <div className="text-xs text-[#888]">
                    {style.contents} &middot; {style.construction}
                  </div>
                  {total > 0 ? (
                    <div className="flex gap-2 mt-2">
                      {(["shortlist", "maybe", "pass"] as const).map((s) =>
                        counts[s] > 0 ? (
                          <span
                            key={s}
                            className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].text}`}
                          >
                            {STATUS_CONFIG[s].label} {counts[s]}
                          </span>
                        ) : null
                      )}
                    </div>
                  ) : (
                    <div className="text-[13px] text-[#aaa] mt-2">
                      No votes yet
                    </div>
                  )}
                  {latestMemo && (
                    <div className="text-[12px] text-[#666] mt-1.5 truncate">
                      <span className="font-medium text-[#E85D2A]">{latestMemo.user_name}:</span>{" "}
                      {latestMemo.content}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
