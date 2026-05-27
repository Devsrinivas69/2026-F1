import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, DepthOfField } from "@react-three/postprocessing";
import * as THREE from "three";
import { type OF1Driver, type OF1Location } from "@/lib/openf1";
import { useTrackGeometry } from "@/hooks/useTrackGeometry";
import { F1Car } from "./F1Car";
import { DirectorCamera } from "./DirectorCamera";
import { Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  sessionKey: number;
  drivers: OF1Driver[];
  locations: OF1Location[];
}

export function TrackMap3D({ sessionKey, drivers, locations }: Props) {
  const { data: trackData, loading, error } = useTrackGeometry(sessionKey);
  const [isDirectorMode, setIsDirectorMode] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const [focusDistance, setFocusDistance] = useState(10);

  const points = useMemo(() => {
    const map = new Map<number, OF1Location>();
    for (const l of locations) {
      const prev = map.get(l.driver_number);
      if (!prev || (l.date && prev.date && l.date > prev.date)) map.set(l.driver_number, l);
    }
    return Array.from(map.values());
  }, [locations]);

  const driverMap = useMemo(() => {
    const m = new Map<number, OF1Driver>();
    for (const d of drivers) m.set(d.driver_number, d);
    return m;
  }, [drivers]);

  if (loading || !trackData) {
    return (
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-[10px] text-[#888] font-orbitron uppercase tracking-widest">Generating Track Geometry…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-[10px] text-[#E8002D] font-orbitron uppercase tracking-widest">Failed to build track</span>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      
      {/* UI Overlay */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 pointer-events-none">
        <button 
          onClick={() => setIsDirectorMode(!isDirectorMode)}
          className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-md ring-1 transition-all backdrop-blur-md ${
            isDirectorMode 
              ? "bg-[#E8002D]/20 ring-[#E8002D] text-white"
              : "bg-black/50 ring-white/10 text-[#888] hover:text-white"
          }`}
        >
          <Video className="size-4" />
          <span className="text-[10px] font-orbitron font-bold uppercase tracking-widest">
            {isDirectorMode ? "Director Active" : "Enable AI Director"}
          </span>
          {isDirectorMode && (
            <span className="flex size-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[#E8002D] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E8002D]"></span>
            </span>
          )}
        </button>
      </div>

      {/* Subtitles Overlay */}
      <AnimatePresence>
        {isDirectorMode && subtitle && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-10 left-0 right-0 z-10 flex justify-center pointer-events-none"
          >
            <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-full ring-1 ring-white/10 max-w-xl text-center">
              <p className="text-[#FFD700] font-orbitron text-xs font-bold tracking-widest uppercase mb-1">Live Broadcast AI</p>
              <p className="text-white font-jetbrains text-sm">{subtitle}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Canvas camera={{ position: [0, 80, 80], fov: 40 }} dpr={[1, 2]} shadows>
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[50, 100, 50]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[2048, 2048]} 
        />
        
        {/* The Track Mesh (Asphalt) */}
        <mesh receiveShadow position={[0, 0, 0]}>
          <tubeGeometry args={[trackData.curve, 512, 1.2, 8, true]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} metalness={0.1} />
        </mesh>
        
        {/* Outer Curbs */}
        <mesh receiveShadow position={[0, -0.1, 0]}>
          <tubeGeometry args={[trackData.curve, 512, 1.5, 8, true]} />
          <meshStandardMaterial color="#E8002D" roughness={1} />
        </mesh>

        {/* Ground Plane */}
        <mesh receiveShadow position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[500, 500]} />
          <meshStandardMaterial color="#0a0a0a" roughness={1} />
        </mesh>

        {/* Live Cars */}
        {points.map((p) => {
          const d = driverMap.get(p.driver_number);
          const color = d?.team_colour ? `#${d.team_colour}` : "#888";
          const target = new THREE.Vector3(
            (p.x - (trackData.bounds.xMin + trackData.bounds.xMax) / 2) * trackData.scaleX,
            1.2, // Raise slightly above track surface
            (p.y - (trackData.bounds.yMin + trackData.bounds.yMax) / 2) * trackData.scaleY,
          );
          return <F1Car key={p.driver_number} target={target} color={color} driverNumber={d?.driver_number} />;
        })}

        <gridHelper args={[300, 60, "#222", "#111"]} position={[0, -0.4, 0]} />
        
        {!isDirectorMode && (
          <OrbitControls 
            enablePan 
            autoRotate 
            autoRotateSpeed={0.2} 
            minDistance={20} 
            maxDistance={250} 
            maxPolarAngle={Math.PI / 2 - 0.05}
          />
        )}

        {isDirectorMode && (
          <>
            <DirectorCamera 
              locations={locations} 
              drivers={drivers} 
              trackData={trackData} 
              onSubtitleChange={setSubtitle}
              onFocusDistanceChange={setFocusDistance}
            />
            {/* Cinematic Depth of Field */}
            <EffectComposer multisampling={4}>
              <DepthOfField 
                focusDistance={Math.max(0, focusDistance / 500)} // Normalized somewhat
                focalLength={0.05} 
                bokehScale={4} 
                height={480} 
              />
            </EffectComposer>
          </>
        )}
      </Canvas>
    </div>
  );
}