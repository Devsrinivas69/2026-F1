import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface F1CarProps {
  target: THREE.Vector3;
  color: string;
  driverNumber?: number;
}

export function F1Car({ target, color, driverNumber }: F1CarProps) {
  const group = useRef<THREE.Group>(null);
  
  // Smoothly interpolate position and rotation
  useFrame(() => {
    if (!group.current) return;
    
    const prevPos = group.current.position.clone();
    group.current.position.lerp(target, 0.1);
    
    // Calculate direction for rotation (only if moving significantly)
    const dir = new THREE.Vector3().subVectors(group.current.position, prevPos);
    if (dir.lengthSq() > 0.0001) {
      // LookAt requires a target point slightly ahead
      const lookTarget = group.current.position.clone().add(dir);
      // We only want to rotate on the Y axis (yaw), keep pitch and roll 0
      lookTarget.y = group.current.position.y;
      group.current.lookAt(lookTarget);
    }
  });

  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: color, 
    roughness: 0.2, 
    metalness: 0.7,
    emissive: color,
    emissiveIntensity: 0.1
  });
  
  const blackMaterial = new THREE.MeshStandardMaterial({ 
    color: "#111111", 
    roughness: 0.9, 
    metalness: 0.1 
  });
  
  const darkCarbonMaterial = new THREE.MeshStandardMaterial({ 
    color: "#222222", 
    roughness: 0.6, 
    metalness: 0.5 
  });

  return (
    <group ref={group} position={target} scale={[0.5, 0.5, 0.5]}>
      {/* Main Chassis / Monocoque */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.7, 0.4, 3.8]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 0.3, 2.3]} castShadow>
        <boxGeometry args={[0.4, 0.2, 1.0]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>

      {/* Front Wing */}
      <mesh position={[0, 0.2, 2.7]} castShadow>
        <boxGeometry args={[2.0, 0.1, 0.5]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>
      
      {/* Front Wing Endplates */}
      <mesh position={[0.95, 0.3, 2.7]} castShadow>
        <boxGeometry args={[0.1, 0.4, 0.6]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>
      <mesh position={[-0.95, 0.3, 2.7]} castShadow>
        <boxGeometry args={[0.1, 0.4, 0.6]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>

      {/* Sidepods */}
      <mesh position={[0.6, 0.4, -0.2]} castShadow>
        <boxGeometry args={[0.6, 0.4, 1.8]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>
      <mesh position={[-0.6, 0.4, -0.2]} castShadow>
        <boxGeometry args={[0.6, 0.4, 1.8]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>

      {/* Engine Cover / Airbox */}
      <mesh position={[0, 0.8, -0.8]} castShadow>
        <boxGeometry args={[0.4, 0.6, 1.4]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>

      {/* Rear Wing */}
      <mesh position={[0, 0.9, -1.8]} castShadow>
        <boxGeometry args={[1.6, 0.1, 0.4]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 0.7, -1.9]} castShadow>
        <boxGeometry args={[1.6, 0.1, 0.3]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>
      
      {/* Rear Wing Endplates */}
      <mesh position={[0.75, 0.7, -1.8]} castShadow>
        <boxGeometry args={[0.1, 0.6, 0.6]} />
        <primitive object={darkCarbonMaterial} attach="material" />
      </mesh>
      <mesh position={[-0.75, 0.7, -1.8]} castShadow>
        <boxGeometry args={[0.1, 0.6, 0.6]} />
        <primitive object={darkCarbonMaterial} attach="material" />
      </mesh>

      {/* Wheels */}
      {/* Front Left */}
      <mesh position={[0.8, 0.35, 1.7]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.35, 32]} />
        <primitive object={blackMaterial} attach="material" />
      </mesh>
      {/* Front Right */}
      <mesh position={[-0.8, 0.35, 1.7]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.35, 32]} />
        <primitive object={blackMaterial} attach="material" />
      </mesh>
      {/* Rear Left */}
      <mesh position={[0.85, 0.35, -1.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.4, 32]} />
        <primitive object={blackMaterial} attach="material" />
      </mesh>
      {/* Rear Right */}
      <mesh position={[-0.85, 0.35, -1.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.4, 32]} />
        <primitive object={blackMaterial} attach="material" />
      </mesh>
      
      {/* Halo (Simplified as a curved tube or bars) */}
      <mesh position={[0, 0.7, 0.5]} rotation={[-Math.PI / 6, 0, 0]} castShadow>
        <torusGeometry args={[0.3, 0.05, 8, 24, Math.PI]} />
        <primitive object={darkCarbonMaterial} attach="material" />
      </mesh>
    </group>
  );
}
