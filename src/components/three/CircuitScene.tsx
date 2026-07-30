import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// Stylized hero scene: a glowing circuit outline + 3 cars looping it + starfield.
export function CircuitScene() {
  return (
    <Canvas camera={{ position: [0, 22, 32], fov: 38 }} dpr={[1, 2]} gl={{ antialias: true }}>
      <color attach="background" args={["#0a0a0a"]} />
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 30, 0]} intensity={1.2} color="#E8002D" />
      <pointLight position={[20, 10, 20]} intensity={0.6} color="#FFD700" />
      <pointLight position={[-20, 10, -20]} intensity={0.6} color="#00D2BE" />
      <Stars radius={120} depth={60} count={2200} factor={3} fade speed={0.4} />
      <Circuit />
      <Runner color="#E8002D" offset={0} />
      <Runner color="#FFD700" offset={0.33} />
      <Runner color="#00D2BE" offset={0.66} />
      <EffectComposer>
        <Bloom intensity={0.9} luminanceThreshold={0.2} luminanceSmoothing={0.4} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}

const curve = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-14, 0, -8),
    new THREE.Vector3(-10, 0, 4),
    new THREE.Vector3(-4, 0, 8),
    new THREE.Vector3(2, 0, 6),
    new THREE.Vector3(8, 0, 10),
    new THREE.Vector3(14, 0, 4),
    new THREE.Vector3(12, 0, -4),
    new THREE.Vector3(6, 0, -8),
    new THREE.Vector3(0, 0, -10),
    new THREE.Vector3(-8, 0, -10),
  ],
  true,
  "catmullrom",
  0.5,
);

function Circuit() {
  const geom = useMemo(() => new THREE.TubeGeometry(curve, 280, 0.35, 8, true), []);
  return (
    <mesh geometry={geom}>
      <meshStandardMaterial color="#1a1a1a" emissive="#E8002D" emissiveIntensity={0.4} />
    </mesh>
  );
}

function Runner({ color, offset }: { color: string; offset: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!mesh.current) return;
    const t = (state.clock.elapsedTime * 0.06 + offset) % 1;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    mesh.current.position.set(p.x, 0.6, p.z);
    mesh.current.lookAt(p.x + tangent.x, 0.6, p.z + tangent.z);
  });
  return (
    <mesh ref={mesh}>
      <boxGeometry args={[1.6, 0.5, 0.8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} />
    </mesh>
  );
}