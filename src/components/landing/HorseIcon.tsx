"use client";

export default function HorseIcon({
  color = "#c9a84c",
  size = 40,
  className = "",
}: {
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M52 8c-2 0-4 2-6 4l-4 6c-2 2-6 4-10 4h-4c-4 0-8 2-10 6l-4 8c-1 2-2 4-2 6v8c0 2 1 4 3 4h2c2 0 3-2 3-4v-4l2-4 4 12c0 2 2 4 4 4h2c2 0 3-2 3-4l-2-12 6-2 2 14c0 2 2 4 4 4h2c2 0 3-2 3-4V36l4-8 2-6c2-4 2-8 0-10l-4-4z"
        fill={color}
      />
      <circle cx="46" cy="16" r="2" fill="#0d1117" />
    </svg>
  );
}
