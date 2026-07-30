import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
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

  // Clone and modify the scene per-car so they can have different colors
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Clone the material so we don't overwrite other cars
        if (mesh.material) {
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
          
          // Only tint materials that are relatively bright (avoids tinting black tires)
          if (mat.color && mat.color.getHSL({ h: 0, s: 0, l: 0 }).l > 0.1) {
            // Mix the team color with the original material color for a metallic paint look
            const teamColor = new THREE.Color(color);
            mat.color.lerp(teamColor, 0.8);
            mat.metalness = 0.8;
            mat.roughness = 0.2;
          }
          mesh.material = mat;
        }
      }
    });
    return clone;
  }, [scene, color]);

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
      
      // Calculate a subtle banking angle based on the turn sharpness
      // This is a simple approximation: cross product of velocity and up vector
      const velocity = dir.clone().normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(velocity, up);
      
      // We need previous velocity to get acceleration/turning
      const prevVelocity = group.current.userData.velocity || velocity;
      group.current.userData.velocity = velocity;
      
      // Turn direction: dot product of right vector and change in velocity
      const turnAmount = right.dot(velocity.clone().sub(prevVelocity)) * 50; 
      const bankAngle = THREE.MathUtils.clamp(turnAmount, -0.2, 0.2);

      // Smooth rotation (slerp) including banking
      const targetRotation = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt(group.current.position, lookTarget, up)
      );
      
      // Apply banking on local Z axis
      const bankQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), bankAngle);
      targetRotation.multiply(bankQuat);

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
        <primitive object={clonedScene} />
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
