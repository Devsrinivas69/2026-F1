import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

interface F1CarProps {
  target: THREE.Vector3;
  color: string;
  driverNumber?: number;
}

export function F1Car({ target, color, driverNumber }: F1CarProps) {
  const group = useRef<THREE.Group>(null);
  
  // Smoothly interpolate position and rotation
  useFrame((state, delta) => {
    if (!group.current) return;
    
    const prevPos = group.current.position.clone();
    group.current.position.lerp(target, 10 * delta); // frame-rate independent lerp
    
    // Calculate direction for rotation
    const dir = new THREE.Vector3().subVectors(group.current.position, prevPos);
    if (dir.lengthSq() > 0.0001) {
      const lookTarget = group.current.position.clone().add(dir);
      lookTarget.y = group.current.position.y; // keep level
      
      // Smooth rotation (slerp)
      const targetRotation = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt(group.current.position, lookTarget, new THREE.Vector3(0, 1, 0))
      );
      group.current.quaternion.slerp(targetRotation, 10 * delta);
    }
  });

  // High-fidelity PBR Materials
  const materials = useMemo(() => {
    return {
      paint: new THREE.MeshPhysicalMaterial({ 
        color: color,
        metalness: 0.6,
        roughness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      }),
      carbon: new THREE.MeshPhysicalMaterial({ 
        color: "#151515", 
        metalness: 0.8,
        roughness: 0.6,
        clearcoat: 0.5,
        clearcoatRoughness: 0.3,
      }),
      rubber: new THREE.MeshStandardMaterial({ 
        color: "#0a0a0a", 
        roughness: 0.9, 
        metalness: 0.1 
      }),
      rims: new THREE.MeshStandardMaterial({ 
        color: "#222", 
        metalness: 0.9, 
        roughness: 0.2 
      })
    };
  }, [color]);

  return (
    <group ref={group} position={target} scale={[0.4, 0.4, 0.4]}>
      
      {/* --- CHASSIS & MONOCOQUE --- */}
      {/* Main Body */}
      <RoundedBox args={[0.6, 0.35, 2.5]} position={[0, 0.35, 0]} radius={0.1} castShadow receiveShadow>
        <primitive object={materials.paint} attach="material" />
      </RoundedBox>

      {/* Nose Cone (sloped) */}
      <mesh position={[0, 0.25, 1.8]} rotation={[-0.15, 0, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 1.5, 4]} />
        <primitive object={materials.paint} attach="material" />
      </mesh>

      {/* Sidepods (Aggressive undercut) */}
      <RoundedBox args={[1.4, 0.3, 1.2]} position={[0, 0.3, -0.2]} radius={0.15} castShadow>
        <primitive object={materials.paint} attach="material" />
      </RoundedBox>
      
      {/* Floor (Carbon Fiber) */}
      <RoundedBox args={[1.6, 0.05, 2.8]} position={[0, 0.15, -0.1]} radius={0.02} castShadow receiveShadow>
        <primitive object={materials.carbon} attach="material" />
      </RoundedBox>

      {/* Engine Cover & Shark Fin */}
      <mesh position={[0, 0.6, -0.8]} castShadow>
        <boxGeometry args={[0.2, 0.4, 1.2]} />
        <primitive object={materials.paint} attach="material" />
      </mesh>
      <mesh position={[0, 0.75, -1.2]} rotation={[0.2, 0, 0]} castShadow>
        <boxGeometry args={[0.05, 0.4, 0.8]} />
        <primitive object={materials.carbon} attach="material" />
      </mesh>


      {/* --- AERODYNAMICS --- */}
      {/* Front Wing Main Plane */}
      <RoundedBox args={[1.8, 0.05, 0.3]} position={[0, 0.15, 2.3]} radius={0.02} castShadow>
        <primitive object={materials.carbon} attach="material" />
      </RoundedBox>
      {/* Front Wing Upper Flaps (Painted) */}
      <RoundedBox args={[1.8, 0.05, 0.2]} position={[0, 0.25, 2.2]} rotation={[0.1, 0, 0]} radius={0.01} castShadow>
        <primitive object={materials.paint} attach="material" />
      </RoundedBox>
      {/* Front Wing Endplates */}
      <mesh position={[0.9, 0.25, 2.25]} rotation={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.05, 0.3, 0.5]} />
        <primitive object={materials.carbon} attach="material" />
      </mesh>
      <mesh position={[-0.9, 0.25, 2.25]} rotation={[0, -0.1, 0]} castShadow>
        <boxGeometry args={[0.05, 0.3, 0.5]} />
        <primitive object={materials.carbon} attach="material" />
      </mesh>

      {/* Rear Wing Main Plane */}
      <RoundedBox args={[1.0, 0.05, 0.3]} position={[0, 0.8, -1.8]} radius={0.02} castShadow>
        <primitive object={materials.carbon} attach="material" />
      </RoundedBox>
      {/* Rear Wing DRS Flap */}
      <RoundedBox args={[1.0, 0.05, 0.2]} position={[0, 0.95, -1.9]} rotation={[-0.1, 0, 0]} radius={0.01} castShadow>
        <primitive object={materials.paint} attach="material" />
      </RoundedBox>
      {/* Rear Wing Endplates */}
      <mesh position={[0.48, 0.7, -1.85]} castShadow>
        <boxGeometry args={[0.05, 0.6, 0.5]} />
        <primitive object={materials.carbon} attach="material" />
      </mesh>
      <mesh position={[-0.48, 0.7, -1.85]} castShadow>
        <boxGeometry args={[0.05, 0.6, 0.5]} />
        <primitive object={materials.carbon} attach="material" />
      </mesh>

      {/* Halo */}
      <mesh position={[0, 0.65, 0.2]} rotation={[-Math.PI / 8, 0, 0]} castShadow>
        <torusGeometry args={[0.25, 0.03, 8, 24, Math.PI]} />
        <primitive object={materials.carbon} attach="material" />
      </mesh>
      <mesh position={[0, 0.55, 0.45]} rotation={[0.4, 0, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.3]} />
        <primitive object={materials.carbon} attach="material" />
      </mesh>


      {/* --- WHEELS --- */}
      {[
        [0.8, 0.35, 1.5],   // Front Left
        [-0.8, 0.35, 1.5],  // Front Right
        [0.8, 0.35, -1.3],  // Rear Left
        [-0.8, 0.35, -1.3]  // Rear Right
      ].map((pos, i) => (
        <group key={i} position={new THREE.Vector3(...pos)}>
          {/* Tire */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
            <cylinderGeometry args={[0.35, 0.35, 0.35, 32]} />
            <primitive object={materials.rubber} attach="material" />
          </mesh>
          {/* Wheel Cover (Aero) */}
          <mesh rotation={[0, 0, Math.PI / 2]} position={[i % 2 === 0 ? 0.18 : -0.18, 0, 0]}>
            <circleGeometry args={[0.25, 32]} />
            <primitive object={materials.rims} attach="material" />
          </mesh>
        </group>
      ))}

    </group>
  );
}
