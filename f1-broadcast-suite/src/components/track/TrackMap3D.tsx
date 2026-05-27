import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import { type OF1Driver, type OF1Location } from "@/lib/openf1";
import { useTrackGeometry } from "@/hooks/useTrackGeometry";
import { F1Car } from "./F1Car";

interface Props {
  sessionKey: number;
  drivers: OF1Driver[];
  locations: OF1Location[];
}

export function TrackMap3D({ sessionKey, drivers, locations }: Props) {
  const { data: trackData, loading, error } = useTrackGeometry(sessionKey);

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
      
      {/* Outer Curbs (Red/White effect approximated by a slightly wider tube below) */}
      <mesh receiveShadow position={[0, -0.1, 0]}>
        <tubeGeometry args={[trackData.curve, 512, 1.5, 8, true]} />
        <meshStandardMaterial color="#E8002D" roughness={1} />
      </mesh>

      {/* Ground Plane (Grass/Environment) */}
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
      <OrbitControls 
        enablePan 
        autoRotate 
        autoRotateSpeed={0.2} 
        minDistance={20} 
        maxDistance={250} 
        maxPolarAngle={Math.PI / 2 - 0.05} // Don't allow camera to go below ground
      />
    </Canvas>
  );
}