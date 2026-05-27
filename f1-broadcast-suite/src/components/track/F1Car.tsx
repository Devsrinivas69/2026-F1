import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Clone } from "@react-three/drei";
import * as THREE from "three";

interface F1CarProps {
  target: THREE.Vector3;
  color: string;
  driverNumber?: number;
}

export function F1Car({ target, color, driverNumber }: F1CarProps) {
  const group = useRef<THREE.Group>(null);
  
  // Load the optimized Mercedes W14 GLB model from the public folder.
  const { scene } = useGLTF("/cars/mercedes_f1_w14_free.glb");

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

  return (
    <group ref={group} position={target}>
      {/* 
        Wrap the clone in a group to handle scale and rotation offsets.
        3D models from Sketchfab often have arbitrary scales (e.g. 100x too big) 
        and face the wrong direction. Adjust these values until it matches the old car size.
      */}
      <group scale={[0.15, 0.15, 0.15]} position={[0, -0.35, 0]} rotation={[0, Math.PI, 0]}>
        <Clone object={scene} />
      </group>

      {/* Floating Team Color Marker above the car so you can identify them */}
      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

// Preload the model so it starts downloading immediately
useGLTF.preload("/cars/mercedes_f1_w14_free.glb");
