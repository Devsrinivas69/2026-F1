export function ScanlineOverlay({ intensity = 0.04 }: { intensity?: number }) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 scanlines"
      style={{ opacity: intensity, mixBlendMode: "overlay" }}
    />
  );
}