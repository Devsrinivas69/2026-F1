import { useEffect, useRef, useState, useCallback } from "react";

export function useEngineAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null); // Fundamental
  const osc2Ref = useRef<OscillatorNode | null>(null); // Sub/Harmonic
  const osc3Ref = useRef<OscillatorNode | null>(null); // High Harmonic
  const filterRef = useRef<BiquadFilterNode | null>(null); // Engine tone filter
  const masterGainRef = useRef<GainNode | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);

  const initAudio = useCallback(() => {
    if (ctxRef.current) return;
    
    const ctx = new window.AudioContext();
    ctxRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1000; // Muffled by default
    filter.connect(masterGain);
    filterRef.current = filter;

    // V6 Engine fundamental
    const osc1 = ctx.createOscillator();
    osc1.type = "sawtooth";
    osc1.connect(filter);
    osc1.start();
    osc1Ref.current = osc1;

    // First harmonic (perfect fifth approx)
    const osc2 = ctx.createOscillator();
    osc2.type = "sawtooth";
    osc2.connect(filter);
    osc2.start();
    osc2Ref.current = osc2;

    // Second harmonic (octave)
    const osc3 = ctx.createOscillator();
    osc3.type = "sawtooth";
    
    // Reduce volume of high harmonics slightly
    const osc3Gain = ctx.createGain();
    osc3Gain.gain.value = 0.5;
    osc3.connect(osc3Gain);
    osc3Gain.connect(filter);
    
    osc3.start();
    osc3Ref.current = osc3;

    setIsPlaying(true);
    
    // Fade in
    masterGain.gain.setTargetAtTime(0.5, ctx.currentTime, 0.1);
  }, []);

  const stopAudio = useCallback(() => {
    if (!ctxRef.current) return;
    const ctx = ctxRef.current;
    
    if (masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    }
    
    setTimeout(() => {
      osc1Ref.current?.stop();
      osc2Ref.current?.stop();
      osc3Ref.current?.stop();
      ctx.close();
      ctxRef.current = null;
      setIsPlaying(false);
    }, 200);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (ctxRef.current && ctxRef.current.state !== "closed") {
        ctxRef.current.close();
      }
    };
  }, []);

  // Update audio parameters based on telemetry
  const updateEngineState = useCallback((rpm: number, throttle: number) => {
    if (!ctxRef.current || !isPlaying) return;
    const ctx = ctxRef.current;

    // Avoid sudden jumps by interpolating to the new values over a small window
    const time = ctx.currentTime + 0.1; 

    // V6 Fundamental Hz = (RPM / 60) * 3
    // Clamp RPM to a sensible range just in case
    const safeRpm = Math.max(3000, Math.min(15000, rpm || 3000));
    const fundamentalHz = (safeRpm / 60) * 3;

    if (osc1Ref.current && osc2Ref.current && osc3Ref.current) {
      osc1Ref.current.frequency.setTargetAtTime(fundamentalHz, ctx.currentTime, 0.2);
      osc2Ref.current.frequency.setTargetAtTime(fundamentalHz * 1.5, ctx.currentTime, 0.2); // Fifth
      osc3Ref.current.frequency.setTargetAtTime(fundamentalHz * 2.0, ctx.currentTime, 0.2); // Octave
    }

    if (filterRef.current) {
      // Throttle opens the filter, making it sound more aggressive and raspy
      // 0% throttle = 1000Hz (muffled idle/coasting)
      // 100% throttle = 8000Hz (screaming)
      const safeThrottle = Math.max(0, Math.min(100, throttle || 0));
      const targetFilterFreq = 1000 + (safeThrottle / 100) * 7000;
      filterRef.current.frequency.setTargetAtTime(targetFilterFreq, ctx.currentTime, 0.2);
    }
    
    if (masterGainRef.current) {
      // Modulate master volume based on throttle
      // Min volume 0.3, max volume 0.8
      const safeThrottle = Math.max(0, Math.min(100, throttle || 0));
      const targetVol = 0.3 + (safeThrottle / 100) * 0.5;
      masterGainRef.current.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.2);
    }
  }, [isPlaying]);

  return {
    isPlaying,
    initAudio,
    stopAudio,
    updateEngineState
  };
}
