import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, Lock, Flame } from "lucide-react";
import { firestore } from "@/integrations/firebase/client";

export const Route = createFileRoute("/settings")({ component: Settings });

const FIELDS = [
  { label: "API Key", value: "AIzaSyDXX…ktV4" },
  { label: "Auth Domain", value: "f1-commander.firebaseapp.com" },
  { label: "Project ID", value: "f1-commander" },
  { label: "Storage Bucket", value: "f1-commander.firebasestorage.app" },
  { label: "Messaging Sender ID", value: "358371046919" },
  { label: "App ID", value: "1:358371…879ca2" },
] as const;

function Settings() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    try {
      firestore(); // Initializes Firebase — throws if misconfigured
      setStatus("ready");
    } catch (err) {
      console.error("[Firebase] init error:", err);
      setStatus("error");
    }
  }, []);

  return (
    <section className="py-12 px-6 lg:px-12 min-h-[calc(100vh-60px)]">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#FF6D00] font-orbitron font-bold mb-2">
            Firebase · Config
          </p>
          <h1 className="font-orbitron text-3xl md:text-4xl font-semibold mb-2 flex items-center gap-3">
            <Flame className="size-8 text-[#FF6D00]" />
            Firebase Config
          </h1>
          <p className="text-[#888] text-sm max-w-[60ch]">
            Firebase credentials are embedded in the application and initialize Firebase SDK on load.
            Firestore is used for persistent race session caching and user preferences.
          </p>
        </header>

        <div className="bg-[#111] ring-1 ring-white/5 rounded-md p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-sm bg-[#FF6D00]/10 ring-1 ring-[#FF6D00]/30 grid place-items-center">
              <ShieldCheck className="size-5 text-[#FF6D00]" />
            </div>
            <div>
              <p className="font-orbitron text-sm uppercase tracking-widest text-white">
                {status === "loading" && "Initializing Firebase…"}
                {status === "ready" && "Firebase connected"}
                {status === "error" && "Firebase init failed"}
              </p>
              <p className="text-[11px] text-[#666] font-jetbrains">
                {status === "ready" && "Project: f1-commander · All services online."}
                {status === "error" && "Check console for details."}
                {status === "loading" && "Connecting to Firestore…"}
              </p>
            </div>
          </div>

          <div className="border-t border-white/5 pt-5 space-y-2">
            {FIELDS.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-xs font-jetbrains">
                <span className="text-[#888] uppercase tracking-widest text-[10px] font-orbitron">
                  {label}
                </span>
                <span className="flex items-center gap-2 text-[#666]">
                  <Lock className="size-3" />
                  <span className="text-[#888]">{value}</span>
                  {status === "ready" && <CheckCircle2 className="size-3.5 text-[#FF6D00]" />}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-[#111] ring-1 ring-white/5 rounded-md p-4">
            <p className="text-[10px] font-orbitron uppercase tracking-widest text-[#FF6D00] mb-1">Firestore</p>
            <p className="text-xs text-[#888]">Race session data, standings cache, user preferences</p>
          </div>
          <div className="bg-[#111] ring-1 ring-white/5 rounded-md p-4">
            <p className="text-[10px] font-orbitron uppercase tracking-widest text-[#FF6D00] mb-1">Analytics</p>
            <p className="text-xs text-[#888]">Usage telemetry · Measurement ID: G-39W8QMK9ZJ</p>
          </div>
        </div>

        <p className="text-[10px] text-[#666] mt-6 leading-relaxed">
          OpenF1 API is called directly without a proxy. Firebase Firestore is used for caching session
          data to reduce redundant API calls and improve load time.
        </p>
      </div>
    </section>
  );
}