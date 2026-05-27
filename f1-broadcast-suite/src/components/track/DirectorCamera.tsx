import { useEffect, useRef, useState, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { type OF1Location, type OF1Driver } from "@/lib/openf1";

interface Props {
  locations: OF1Location[];
  drivers: OF1Driver[];
  trackData: any;
  onSubtitleChange: (subtitle: string) => void;
  onFocusDistanceChange: (dist: number) => void;
}

type ShotType = "HELI" | "TRACKSIDE" | "CHASE";

export function DirectorCamera({ locations, drivers, trackData, onSubtitleChange, onFocusDistanceChange }: Props) {
  const { camera } = useThree();
  const [shot, setShot] = useState<{ type: ShotType; targetDriver?: number; secondaryDriver?: number; startTime: number }>({
    type: "HELI",
    startTime: Date.now()
  });

  const lookAtTarget = useRef(new THREE.Vector3());
  const cameraPosTarget = useRef(new THREE.Vector3(0, 100, 100));

  // Compute 3D positions for all cars
  const carPositions = useMemo(() => {
    const map = new Map<number, { pos: THREE.Vector3; driver: OF1Driver }>();
    const driverMap = new Map(drivers.map(d => [d.driver_number, d]));

    // Only keep latest location per driver
    const latestLocs = new Map<number, OF1Location>();
    for (const l of locations) {
      const prev = latestLocs.get(l.driver_number);
      if (!prev || (l.date && prev.date && l.date > prev.date)) latestLocs.set(l.driver_number, l);
    }

    for (const l of latestLocs.values()) {
      const d = driverMap.get(l.driver_number);
      if (!d) continue;
      const x = (l.x - (trackData.bounds.xMin + trackData.bounds.xMax) / 2) * trackData.scaleX;
      const z = (l.y - (trackData.bounds.yMin + trackData.bounds.yMax) / 2) * trackData.scaleY;
      map.set(l.driver_number, { pos: new THREE.Vector3(x, 1.2, z), driver: d });
    }
    return map;
  }, [locations, drivers, trackData]);

  // AI Director Logic
  useEffect(() => {
    const interval = setInterval(() => {
      const cars = Array.from(carPositions.values());
      if (cars.length === 0) return;

      // Find the closest battle
      let closestPair = null;
      let minDistance = Infinity;

      for (let i = 0; i < cars.length; i++) {
        for (let j = i + 1; j < cars.length; j++) {
          const dist = cars[i].pos.distanceTo(cars[j].pos);
          if (dist < minDistance) {
            minDistance = dist;
            closestPair = [cars[i], cars[j]];
          }
        }
      }

      const now = Date.now();
      const timeSinceLastCut = now - shot.startTime;

      // Don't cut too frequently (minimum 5 seconds per shot)
      if (timeSinceLastCut < 5000) return;

      if (closestPair && minDistance < 15) { // 15 meters ~ 0.2s delta
        // BATTLE DETECTED!
        const [carA, carB] = closestPair;
        
        if (Math.random() > 0.5) {
          // Trackside Camera
          setShot({ type: "TRACKSIDE", targetDriver: carA.driver.driver_number, secondaryDriver: carB.driver.driver_number, startTime: now });
          onSubtitleChange(`BATTLE: ${carA.driver.name_acronym} & ${carB.driver.name_acronym}`);
        } else {
          // Chase Camera
          setShot({ type: "CHASE", targetDriver: carA.driver.driver_number, secondaryDriver: carB.driver.driver_number, startTime: now });
          onSubtitleChange(`ONBOARD: Chasing ${carA.driver.name_acronym} defending from ${carB.driver.name_acronym}`);
        }
      } else {
        // No battles, cycle generic shots
        if (timeSinceLastCut > 10000) {
          const randomCar = cars[Math.floor(Math.random() * cars.length)];
          if (Math.random() > 0.5) {
            setShot({ type: "HELI", startTime: now });
            onSubtitleChange(`AERIAL VIEW`);
          } else {
            setShot({ type: "CHASE", targetDriver: randomCar.driver.driver_number, startTime: now });
            onSubtitleChange(`ONBOARD: ${randomCar.driver.full_name}`);
          }
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [carPositions, shot.startTime, onSubtitleChange]);


  // Smoothly move camera every frame
  useFrame((state, delta) => {
    if (carPositions.size === 0) return;

    const targetCar = shot.targetDriver ? carPositions.get(shot.targetDriver) : Array.from(carPositions.values())[0];
    if (!targetCar) return;

    if (shot.type === "HELI") {
      // High up, orbiting the center or the pack
      const center = new THREE.Vector3(0, 0, 0);
      lookAtTarget.current.lerp(center, delta);
      const time = state.clock.getElapsedTime();
      cameraPosTarget.current.set(Math.sin(time * 0.1) * 150, 100, Math.cos(time * 0.1) * 150);
      onFocusDistanceChange(150); // Large focus dist
    } 
    else if (shot.type === "TRACKSIDE") {
      // Camera is placed statically ahead of the car, panning as it goes by
      lookAtTarget.current.lerp(targetCar.pos, delta * 5);
      
      // Calculate a static trackside position based on where the car was when the shot started
      // For simplicity, we just hover 20m away from the car's current pos on the X/Z plane
      // Wait, to make it static, we should lock the camera position.
      // But we'll do a simple dynamic offset for now
      const offset = new THREE.Vector3(20, 5, 20);
      // Let's just make it smoothly follow but from a fixed distance
      cameraPosTarget.current.lerp(new THREE.Vector3(targetCar.pos.x + 15, 3, targetCar.pos.z + 15), delta * 2);
      
      const dist = camera.position.distanceTo(targetCar.pos);
      onFocusDistanceChange(dist);
    } 
    else if (shot.type === "CHASE") {
      // Tight chase cam behind the car
      lookAtTarget.current.lerp(new THREE.Vector3(targetCar.pos.x, targetCar.pos.y + 1, targetCar.pos.z), delta * 10);
      
      // We don't have rotation of the car directly here, but we can estimate based on velocity.
      // For a cool cinematic shot, we'll orbit slowly around the car at a low angle
      const time = state.clock.getElapsedTime();
      const offset = new THREE.Vector3(Math.sin(time) * 10, 2, Math.cos(time) * 10);
      cameraPosTarget.current.lerp(targetCar.pos.clone().add(offset), delta * 5);

      const dist = camera.position.distanceTo(targetCar.pos);
      onFocusDistanceChange(dist);
    }

    camera.position.lerp(cameraPosTarget.current, delta * 3);
    camera.lookAt(lookAtTarget.current);
  });

  return null;
}
