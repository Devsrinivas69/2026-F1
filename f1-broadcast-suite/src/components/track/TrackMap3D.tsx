import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { type OF1Driver, type OF1Location } from "@/lib/openf1";

interface Props {
  drivers: OF1Driver[];
  locations: OF1Location[];
}

export function TrackMap3D({ drivers, locations }: Props) {
  const bounds = useMemo(() => {
    if (!locations.length) return null;
    const xs = locations.map((l) => l.x), ys = locations.map((l) => l.y);
    return { xMin: Math.min(...xs), xMax: Math.max(...xs), yMin: Math.min(...ys), yMax: Math.max(...ys) };
  }, [locations]);

  const points = useMemo(() => {
    const map = new Map<number, OF1Location>();
    for (const l of locations) {
      const prev = map.get(l.driver_number);
      if (!prev || (l.date && prev.date && l.date > prev.date)) map.set(l.driver_number, l);
    }
    return Array.from(map.values());
  }, [locations]);

  const trackPath = useMemo(() => {
    if (!bounds) return null;
    const SX = 80 / (bounds.xMax - bounds.xMin || 1);
    const SY = 80 / (bounds.yMax - bounds.yMin || 1);
    const sampled = locations.slice(-2000); // Take more samples
    
    // Deduplicate points that are extremely close to prevent CatmullRomCurve3 errors
    const pts: THREE.Vector3[] = [];
    const minSqDist = 0.0001;
    
    for (const l of sampled) {
      const v = new THREE.Vector3(
        (l.x - (bounds.xMin + bounds.xMax) / 2) * SX,
        0,
        (l.y - (bounds.yMin + bounds.yMax) / 2) * SY,
      );
      if (pts.length === 0 || pts[pts.length - 1].distanceToSquared(v) > minSqDist) {
        pts.push(v);
      }
    }
    
    if (pts.length < 4) return null;
    try {
      return new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.5);
    } catch (e) {
      console.warn("Failed to generate 3D track path:", e);
      return null;
    }
  }, [bounds, locations]);

  const driverMap = useMemo(() => {
    const m = new Map<number, OF1Driver>();
    for (const d of drivers) m.set(d.driver_number, d);
    return m;
  }, [drivers]);

  if (!bounds) {
    return (
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-[10px] text-[#888] font-orbitron uppercase tracking-widest">Awaiting location stream…</span>
      </div>
    );
  }

  return (
    <Canvas camera={{ position: [60, 60, 60], fov: 35 }} dpr={[1, 2]}>
      <ambientLight intensity={0.4} />
      <pointLight position={[50, 80, 50]} intensity={1.2} color="#E8002D" />
      <pointLight position={[-50, 60, -50]} intensity={0.8} color="#00D2BE" />
      {trackPath && (
        <mesh>
          <tubeGeometry args={[trackPath, 256, 0.4, 8, true]} />
          <meshStandardMaterial color="#222" emissive="#111" />
        </mesh>
      )}
      {points.map((p) => {
        const d = driverMap.get(p.driver_number);
        const color = d?.team_colour ? `#${d.team_colour}` : "#888";
        const SX = 80 / (bounds.xMax - bounds.xMin || 1);
        const SY = 80 / (bounds.yMax - bounds.yMin || 1);
        const target = new THREE.Vector3(
          (p.x - (bounds.xMin + bounds.xMax) / 2) * SX,
          1,
          (p.y - (bounds.yMin + bounds.yMax) / 2) * SY,
        );
        return <Car3D key={p.driver_number} target={target} color={color} />;
      })}
      <gridHelper args={[200, 40, "#1a1a1a", "#111"]} position={[0, -0.5, 0]} />
      <OrbitControls enablePan autoRotate autoRotateSpeed={0.4} minDistance={20} maxDistance={200} />
    </Canvas>
  );
}

function Car3D({ target, color }: { target: THREE.Vector3; color: string }) {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!mesh.current) return;
    mesh.current.position.lerp(target, 0.08);
  });
  return (
    <mesh ref={mesh} position={target}>
      <boxGeometry args={[2.2, 0.6, 1.0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
}