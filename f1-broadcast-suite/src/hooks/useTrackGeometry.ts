import { useEffect, useState, useMemo } from "react";
import * as THREE from "three";
import { openf1, type OF1Lap, type OF1Location } from "@/lib/openf1";

export interface TrackGeometryData {
  curve: THREE.CatmullRomCurve3;
  bounds: { xMin: number; xMax: number; yMin: number; yMax: number };
  scaleX: number;
  scaleY: number;
}

const CACHE = new Map<number, TrackGeometryData>();

export function useTrackGeometry(sessionKey: number) {
  const [data, setData] = useState<TrackGeometryData | null>(CACHE.get(sessionKey) || null);
  const [loading, setLoading] = useState(!CACHE.has(sessionKey));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (CACHE.has(sessionKey)) {
      setData(CACHE.get(sessionKey)!);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        // 1. Fetch laps to find a good reference lap
        const laps = await openf1<OF1Lap[]>("laps", { session_key: sessionKey });
        if (cancelled) return;

        // Find a lap with a valid duration (preferably not lap 1 to avoid pit lane starts)
        let refLap = laps.find(l => l.lap_duration && l.lap_number && l.lap_number > 1);
        if (!refLap && laps.length > 0) refLap = laps[0];
        
        if (!refLap) throw new Error("No laps found to generate track geometry");

        // Calculate time range (add a tiny buffer)
        const dateStart = new Date(refLap.date_start!);
        const dateEnd = new Date(dateStart.getTime() + (refLap.lap_duration! * 1000) + 2000); // 2s buffer

        // 2. Fetch location data for this specific lap and driver
        const locations = await openf1<OF1Location[]>("location", {
          session_key: sessionKey,
          driver_number: refLap.driver_number,
          "date>": dateStart.toISOString(),
          "date<": dateEnd.toISOString()
        });

        if (cancelled) return;
        if (!locations || locations.length < 10) throw new Error("Insufficient location data for track mapping");

        // 3. Process coordinates
        const xs = locations.map(l => l.x);
        const ys = locations.map(l => l.y);
        const bounds = {
          xMin: Math.min(...xs),
          xMax: Math.max(...xs),
          yMin: Math.min(...ys),
          yMax: Math.max(...ys),
        };

        const SX = 100 / (bounds.xMax - bounds.xMin || 1);
        const SY = 100 / (bounds.yMax - bounds.yMin || 1);

        const pts: THREE.Vector3[] = [];
        const minSqDist = 0.0001;

        for (const l of locations) {
          const v = new THREE.Vector3(
            (l.x - (bounds.xMin + bounds.xMax) / 2) * SX,
            0,
            (l.y - (bounds.yMin + bounds.yMax) / 2) * SY
          );
          if (pts.length === 0 || pts[pts.length - 1].distanceToSquared(v) > minSqDist) {
            pts.push(v);
          }
        }

        // Create a CLOSED loop CatmullRomCurve3
        const curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.5);
        
        const trackData = { curve, bounds, scaleX: SX, scaleY: SY };
        CACHE.set(sessionKey, trackData);
        setData(trackData);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err as Error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [sessionKey]);

  return { data, loading, error };
}
