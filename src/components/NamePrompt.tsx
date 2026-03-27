"use client";

import { useState, useEffect, useRef } from "react";

const SUPABASE_STORAGE =
  "https://lflpwfgndgnxoydfvbms.supabase.co/storage/v1/object/public/style-images";

const ONBOARDING_IMAGES = [
  `${SUPABASE_STORAGE}/SP27_TALBOTS_OUTLET/HDW127079/HDW127079-0.png`,
  `${SUPABASE_STORAGE}/onboarding/mi_p14_x318.png`,
  `${SUPABASE_STORAGE}/SP27_TALBOTS_OUTLET/HDW126208/HDW126208-0.png`,
  `${SUPABASE_STORAGE}/onboarding/mi_p11_x128.png`,
  `${SUPABASE_STORAGE}/SP27-TALBOTS-OUTLET/HDW127182/HDW127182-0.png`,
  `${SUPABASE_STORAGE}/onboarding/mi_p81_x1386.png`,
  `${SUPABASE_STORAGE}/SP27-TALBOTS-OUTLET/HMW320041/HMW320041-1.png`,
  `${SUPABASE_STORAGE}/onboarding/mi_p74_x1212.png`,
  `${SUPABASE_STORAGE}/SP27_TALBOTS_OUTLET/HMW326235/HMW326235-0.png`,
  `${SUPABASE_STORAGE}/onboarding/mi_p72_x1163.png`,
  `${SUPABASE_STORAGE}/onboarding/mi_p26_x605.png`,
  `${SUPABASE_STORAGE}/onboarding/mi_p85_x1473.png`,
  `${SUPABASE_STORAGE}/onboarding/mi_p13_x139.png`,
  `${SUPABASE_STORAGE}/onboarding/mi_p12_x133.png`,
  `${SUPABASE_STORAGE}/onboarding/mi_p20_x437.png`,
  `${SUPABASE_STORAGE}/onboarding/mi_p49_x881.png`,
  `${SUPABASE_STORAGE}/onboarding/mi_p50_x889.png`,
  `${SUPABASE_STORAGE}/onboarding/mi_p58_x988.png`,
  `${SUPABASE_STORAGE}/onboarding/mi_p63_x1042.png`,
  `${SUPABASE_STORAGE}/onboarding/mi_p36_x744.png`,
  `${SUPABASE_STORAGE}/onboarding/mi_p98_x1628.png`,
  `${SUPABASE_STORAGE}/SP27-TALBOTS-OUTLET/HDW127182/HDW127182-1.png`,
  `${SUPABASE_STORAGE}/SP27-TALBOTS-OUTLET/HMW320041/HMW320041-2.png`,
  `${SUPABASE_STORAGE}/SP27-TALBOTS-OUTLET/HDW127182/HDW127182-2.png`,
];

function shuffle(arr: string[]): string[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ConveyorTrack({
  images,
  direction,
  duration,
  top,
}: {
  images: string[];
  direction: "left" | "right";
  duration: number;
  top: string;
}) {
  const doubled = [...images, ...images];

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        display: "flex",
        gap: 12,
        animation: `slide-${direction} ${duration}s linear infinite`,
      }}
    >
      {doubled.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={src}
          alt=""
          loading="lazy"
          style={{
            width: 180,
            height: 220,
            objectFit: "cover",
            borderRadius: 8,
            flexShrink: 0,
            opacity: 0.35,
          }}
        />
      ))}
    </div>
  );
}

interface NamePromptProps {
  onSubmit: (name: string) => void;
}

export default function NamePrompt({ onSubmit }: NamePromptProps) {
  const [name, setName] = useState("");
  const [exiting, setExiting] = useState(false);
  const [tracks, setTracks] = useState<string[][]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const all = shuffle(ONBOARDING_IMAGES);
    const chunkSize = Math.ceil(all.length / 4);
    setTracks([
      all.slice(0, chunkSize),
      shuffle(all).slice(0, chunkSize),
      shuffle(all).slice(0, chunkSize),
      shuffle(all).slice(0, chunkSize),
    ]);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setExiting(true);
    setTimeout(() => onSubmit(trimmed), 600);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "#1A1917",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes slide-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes slide-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @keyframes card-enter {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes card-exit {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-20px) scale(0.95); }
        }
      `}</style>

      {/* Conveyor belt background */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
        {tracks.length > 0 && (
          <>
            <ConveyorTrack images={tracks[0]} direction="left" duration={45} top="-20px" />
            <ConveyorTrack images={tracks[1]} direction="right" duration={50} top="210px" />
            <ConveyorTrack images={tracks[2]} direction="left" duration={42} top="440px" />
            <ConveyorTrack images={tracks[3]} direction="right" duration={48} top="670px" />
          </>
        )}
      </div>

      {/* Radial overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, rgba(26,25,23,0.7) 100%)",
          pointerEvents: "none",
          opacity: exiting ? 0.3 : 1,
          transition: "opacity 0.8s ease",
        }}
      />

      {/* Login card */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        {!exiting ? (
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            style={{
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderRadius: 16,
              padding: "48px 40px",
              width: "100%",
              maxWidth: 380,
              textAlign: "center",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05), 0 20px 60px rgba(0,0,0,0.15)",
              animation: "card-enter 0.8s cubic-bezier(0.16,1,0.3,1) both 0.3s",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.15em",
                textTransform: "uppercase" as const,
                color: "#9B9590",
                marginBottom: 8,
              }}
            >
              Hansoll Textile
            </div>
            <h2
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: 32,
                fontWeight: 400,
                color: "#2C2C2C",
                marginBottom: 4,
                letterSpacing: "-0.02em",
              }}
            >
              Talbots Outlet
            </h2>
            <div
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontStyle: "italic",
                fontSize: 18,
                color: "#C45A2D",
                marginBottom: 8,
              }}
            >
              SP&apos;27 Collection
            </div>
            <p style={{ fontSize: 14, color: "#9B9590", marginBottom: 32, lineHeight: 1.5 }}>
              Selected styles for buyer review
            </p>

            {/* Stats */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 24,
                marginBottom: 24,
                paddingBottom: 20,
                borderBottom: "1px solid #E8E4E0",
              }}
            >
              {[
                { n: "5", l: "Styles" },
                { n: "2", l: "Divisions" },
                { n: "Mar", l: "2026" },
              ].map((s) => (
                <div key={s.l} style={{ textAlign: "center" as const }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: "#2C2C2C" }}>{s.n}</div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#9B9590",
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.06em",
                      marginTop: 2,
                    }}
                  >
                    {s.l}
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <span style={{ flex: 1, height: 1, background: "#E8E4E0" }} />
              <span
                style={{
                  fontSize: 11,
                  color: "#9B9590",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.1em",
                }}
              >
                Enter your name
              </span>
              <span style={{ flex: 1, height: 1, background: "#E8E4E0" }} />
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Kim"
              autoFocus
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "1px solid #E8E4E0",
                borderRadius: 8,
                fontSize: 15,
                color: "#2C2C2C",
                background: "#FAF9F7",
                outline: "none",
                marginBottom: 12,
              }}
              onFocus={(e) => (e.target.style.borderColor = "#C45A2D")}
              onBlur={(e) => (e.target.style.borderColor = "#E8E4E0")}
            />
            <button
              type="submit"
              disabled={!name.trim()}
              style={{
                width: "100%",
                padding: 14,
                border: "none",
                borderRadius: 8,
                background: name.trim() ? "#C45A2D" : "#C45A2D66",
                color: "white",
                fontSize: 15,
                fontWeight: 500,
                cursor: name.trim() ? "pointer" : "default",
                transition: "background 0.2s",
                minHeight: 44,
              }}
            >
              View Collection
            </button>

            <div style={{ marginTop: 20, fontSize: 12, color: "#9B9590" }}>
              Your selections will be saved under this name
            </div>
          </form>
        ) : (
          <div
            style={{
              textAlign: "center",
              animation: "card-enter 0.5s ease both",
            }}
          >
            <div
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: 28,
                color: "white",
                marginBottom: 8,
              }}
            >
              Welcome, {name.trim()}
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
              Loading collection...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
