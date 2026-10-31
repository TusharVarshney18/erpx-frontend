export function ErpxMascot({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 96 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="erpx-mascot-shell" x1="28" y1="15" x2="68" y2="98" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60A5FA" />
          <stop offset="0.55" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="erpx-mascot-face" x1="48" y1="18" x2="48" y2="47" gradientUnits="userSpaceOnUse">
          <stop stopColor="#172554" />
          <stop offset="1" stopColor="#0B1220" />
        </linearGradient>
      </defs>

      <ellipse cx="48" cy="105" rx="23" ry="4.5" fill="#020617" fillOpacity="0.35" />

      <path d="M35 58 27.8 69.6c-1.6 2.6-.7 5.8 1.9 6.9 2.5 1.1 5.5-.1 6.8-2.7L43 63" stroke="url(#erpx-mascot-shell)" strokeWidth="9" strokeLinecap="round" />
      <path d="m61 58 7.2 11.6c1.6 2.6.7 5.8-1.9 6.9-2.5 1.1-5.5-.1-6.8-2.7L53 63" stroke="url(#erpx-mascot-shell)" strokeWidth="9" strokeLinecap="round" />

      <path d="M42 83v12.5" stroke="url(#erpx-mascot-shell)" strokeWidth="10" strokeLinecap="round" />
      <path d="M54 83v12.5" stroke="url(#erpx-mascot-shell)" strokeWidth="10" strokeLinecap="round" />
      <path d="M36.5 98h10M49.5 98h10" stroke="#93C5FD" strokeWidth="6" strokeLinecap="round" />

      <path d="M48 12V7" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="48" cy="5.5" r="3" fill="#67E8F9" />

      <rect x="17" y="27" width="9" height="16" rx="4.5" fill="#2563EB" stroke="#93C5FD" strokeWidth="2" />
      <rect x="70" y="27" width="9" height="16" rx="4.5" fill="#2563EB" stroke="#93C5FD" strokeWidth="2" />
      <rect x="23" y="12" width="50" height="44" rx="14" fill="url(#erpx-mascot-shell)" stroke="#BFDBFE" strokeWidth="2" />
      <rect x="29" y="18" width="38" height="31" rx="9" fill="url(#erpx-mascot-face)" stroke="#1E3A8A" strokeWidth="1.5" />
      <path d="M37 31c1.7 2.4 4.3 2.4 6 0M53 31c1.7 2.4 4.3 2.4 6 0" stroke="#67E8F9" strokeWidth="2.8" strokeLinecap="round" />
      <path d="m44 39 3 2.5-3 2.5M51 44h4" stroke="#93C5FD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

      <path d="M38.5 51c0-4 3.2-7 7.2-7h4.6c4 0 7.2 3 7.2 7l4.2 29c.7 4.5-2.7 8-7.1 8H41.4c-4.4 0-7.8-3.5-7.1-8l4.2-29Z" fill="url(#erpx-mascot-shell)" stroke="#93C5FD" strokeWidth="2" />
      <rect x="40" y="61" width="16" height="13" rx="4" fill="#1E40AF" stroke="#BFDBFE" strokeWidth="1.5" />
      <path d="m45 66 2.5 2-2.5 2M50.5 70h2.5" stroke="#CFFAFE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}