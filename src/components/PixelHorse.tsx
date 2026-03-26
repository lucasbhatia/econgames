"use client";

/**
 * Pixel art horse sprite — configurable color, size, and facing direction.
 * 16x12 grid rendered as SVG rectangles.
 */
export default function PixelHorse({
  color = "#b8941f",
  size = 32,
  facing = "right",
  className = "",
  galloping = false,
}: {
  color?: string;
  size?: number;
  facing?: "left" | "right";
  className?: string;
  galloping?: boolean;
}) {
  // 16x12 pixel grid — 1 = filled, 0 = empty
  const sprite = [
    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,1,1,1,0,1,1,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,1,0,0,1,1,0,0,1,0,0,0,0,0,0],
    [0,0,1,0,0,1,0,0,0,1,0,0,0,0,0,0],
    [0,0,1,0,0,1,0,0,0,1,0,0,0,0,0,0],
    [0,1,1,0,0,1,1,0,1,1,0,0,0,0,0,0],
  ];

  // Galloping variant — legs in different positions
  const spriteGallop = [
    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,1,1,1,0,1,1,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,0],
    [1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ];

  const grid = galloping ? spriteGallop : sprite;
  const px = size / 16;
  const h = px * 12;
  const scaleX = facing === "left" ? -1 : 1;

  // Darker shade for depth
  const darkerColor = adjustBrightness(color, -30);

  return (
    <svg
      width={size}
      height={h}
      viewBox={`0 0 ${size} ${h}`}
      className={className}
      style={{ transform: `scaleX(${scaleX})` }}
    >
      {grid.map((row, y) =>
        row.map((cell, x) => {
          if (!cell) return null;
          // Add depth: bottom rows slightly darker
          const isLeg = y >= 8;
          const fill = isLeg ? darkerColor : color;
          return (
            <rect
              key={`${x}-${y}`}
              x={x * px}
              y={y * px}
              width={px}
              height={px}
              fill={fill}
              rx={px > 2 ? 0.5 : 0}
            />
          );
        })
      )}
      {/* Eye */}
      <rect
        x={13 * px}
        y={3 * px}
        width={px * 0.6}
        height={px * 0.6}
        fill="#ffffff"
        rx={0.5}
      />
    </svg>
  );
}

function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
