// The ApnaKart cart logo.
export function LogoIcon({
  size,
  tile = "fill-accent",
  line = "#fff",
  wheels = "#FFC94D",
}: {
  size: number;
  tile?: string;
  line?: string;
  wheels?: string;
}) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 36 36">
      <rect width="36" height="36" rx="11" className={tile} />
      <path
        d="M9 11h3l2.5 11h10L27 14H14"
        fill="none"
        stroke={line}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="26.5" r="1.8" fill={wheels} />
      <circle cx="24" cy="26.5" r="1.8" fill={wheels} />
    </svg>
  );
}
