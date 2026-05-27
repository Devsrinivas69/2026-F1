import { createFileRoute } from "@tanstack/react-router";
import { Code2, Database, Cpu, Globe, Rocket, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="flex-1 bg-[#050505] overflow-y-auto px-4 py-8 md:p-12 font-jetbrains text-[#F5F5F5]">
      <div className="max-w-5xl mx-auto">
        
        {/* Header / Intro */}
        <div className="flex flex-col items-start gap-4 mb-16 border-b border-white/10 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#E8002D] rounded-sm flex items-center justify-center shadow-[0_0_20px_rgba(232,0,45,0.4)]">
              <Code2 className="size-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-orbitron font-black uppercase tracking-tighter">
                Srinivas <span className="text-[#E8002D]">Reddy K.H</span>
              </h1>
              <p className="text-xl text-[#888] font-orbitron uppercase tracking-widest mt-1">
                Lead Architect & Engineer
              </p>
            </div>
          </div>
        </div>

        {/* The Engineering Feat */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          <div className="lg:col-span-2 space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-orbitron font-bold uppercase tracking-widest text-[#E8002D] flex items-center gap-3">
                <Rocket className="size-6" /> Engineering The Broadcast
              </h2>
              <p className="text-lg text-[#aaa] leading-relaxed">
                Building the <strong className="text-white">F1 Live Commander</strong> required bridging the gap between raw, high-frequency telemetry data and broadcast-grade visual rendering. Every millisecond counts. 
              </p>
              <p className="text-lg text-[#aaa] leading-relaxed">
                From parsing millions of GPS data points on the fly using the OpenF1 API, to procedurally generating 3D track surfaces and 2026-spec F1 cars in real-time, this application represents the pinnacle of modern web engineering. It handles real-time caching, data windowing, and edge-deployed Server-Side Rendering to ensure it never misses a beat during a live race.
              </p>
            </section>

            <section className="space-y-6 pt-8 border-t border-white/5">
              <h2 className="text-2xl font-orbitron font-bold uppercase tracking-widest text-white flex items-center gap-3">
                <Cpu className="size-6 text-[#00D2BE]" /> Telemetry Architecture
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TechCard 
                  title="Dynamic 3D Generation"
                  desc="React Three Fiber intercepts thousands of live GPS coordinates to physically construct the exact shape of the active circuit in real-time."
                />
                <TechCard 
                  title="Vercel Edge Rendering"
                  desc="Custom built Node.js adapters bypass edge limitations to bundle TanStack Server Side Rendering across distributed serverless functions."
                />
                <TechCard 
                  title="Aggressive State Caching"
                  desc="Implementation of a custom TanStack Query hook architecture to prevent rate-limiting and handle huge JSON payloads seamlessly."
                />
                <TechCard 
                  title="Cinematic UI/UX"
                  desc="A glassmorphism aesthetic tailored directly for pit walls, with complex data visualization built on Recharts and D3.js."
                />
              </div>
            </section>
          </div>

          {/* Stat Card Sidebar */}
          <div className="space-y-6">
            <div className="bg-[#111] ring-1 ring-white/10 rounded-lg p-6 relative overflow-hidden group hover:ring-[#E8002D]/50 transition-all duration-500">
              {/* Background gradient effect */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8002D]/10 blur-[50px] group-hover:bg-[#E8002D]/20 transition-all duration-500" />
              
              <h3 className="font-orbitron font-bold text-xl uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
                Tech Stack
              </h3>
              
              <ul className="space-y-4">
                <StatRow label="Framework" value="React 19" />
                <StatRow label="Routing" value="TanStack Start" />
                <StatRow label="Build Tool" value="Vite" />
                <StatRow label="3D Engine" value="Three.js (Fiber)" />
                <StatRow label="Styling" value="Tailwind CSS" />
                <StatRow label="Data Fetching" value="TanStack Query" />
                <StatRow label="Data Source" value="OpenF1 API" />
                <StatRow label="Deployment" value="Vercel (Node.js)" />
              </ul>
            </div>

            <div className="bg-[#111] ring-1 ring-[#00D2BE]/20 rounded-lg p-6 flex flex-col items-center justify-center text-center gap-4">
              <ShieldAlert className="size-10 text-[#00D2BE]" />
              <div>
                <h4 className="font-orbitron font-bold uppercase tracking-widest text-white">System Status</h4>
                <p className="text-[#888] text-sm mt-1">All systems nominal. Developed exclusively by Srinivas Reddy K.H.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function TechCard({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="bg-[#0a0a0a] p-5 rounded-md border border-white/5 hover:border-white/15 transition-colors">
      <h3 className="font-orbitron font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-[#777] leading-relaxed">{desc}</p>
    </div>
  );
}

function StatRow({ label, value }: { label: string, value: string }) {
  return (
    <li className="flex justify-between items-center py-1">
      <span className="text-[#888] font-orbitron text-xs uppercase tracking-widest">{label}</span>
      <span className="text-white font-bold text-sm bg-white/5 px-2 py-0.5 rounded-sm">{value}</span>
    </li>
  );
}
