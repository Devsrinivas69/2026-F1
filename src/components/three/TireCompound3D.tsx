import { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { tireColor } from "@/lib/teams";
import { X } from "lucide-react";

interface Props {
  compound?: string;
  laps?: number;
  driverCode?: string;
  onClose?: () => void;
}

export function TireCompound3D({ compound, laps, driverCode, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md grid place-items-center p-6 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#111] ring-1 ring-white/10 rounded-md p-6 w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 size-7 grid place-items-center rounded-sm text-[#888] hover:text-white hover:bg-white/5"
        >
          <X className="size-4" />
        </button>
        <div className="flex items-baseline gap-3 mb-1">
          {driverCode && (
            <span className="font-orbitron text-[10px] uppercase tracking-[0.3em] text-[#E8002D]">{driverCode}</span>
          )}
          <span className="font-orbitron text-sm font-bold" style={{ color: tireColor(compound) }}>
            {compound?.toUpperCase() ?? "NO TIRE DATA"}
          </span>
        </div>
        {laps != null && (
          <p className="text-[10px] text-[#888] font-jetbrains uppercase tracking-widest mb-3">{laps} laps on compound</p>
        )}
        <div className="aspect-square bg-black/40 rounded-sm ring-1 ring-white/5">
          <Canvas camera={{ position: [0, 0, 5], fov: 40 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[5, 5, 5]} intensity={1.4} color={tireColor(compound)} />
            <pointLight position={[-5, -3, 2]} intensity={0.6} />
            <Tire color={tireColor(compound)} />
          </Canvas>
        </div>
        <p className="mt-3 text-[9px] text-[#666] uppercase tracking-widest text-center">Click or press ESC to dismiss</p>
      </div>
    </div>
  );
}

function Tire({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.x += dt * 0.6;
  });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[1.4, 0.55, 24, 64]} />
      <meshStandardMaterial color="#0a0a0a" emissive={color} emissiveIntensity={0.4} roughness={0.5} />
    </mesh>
  );
}