interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * CS Logbook Logo — รูปหนังสือเปิด (open book) สำหรับใช้ใน sidebar และหน้า login
 */
export function CSLogbookLogo({ size = 40, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="csbook-bg"
          x1="0"
          y1="0"
          x2="40"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#142e60" />
        </linearGradient>
      </defs>

      {/* พื้นหลัง rounded rect */}
      <rect width="40" height="40" rx="12" fill="url(#csbook-bg)" />

      {/* หน้าซ้ายของหนังสือ (สว่างกว่า) */}
      <path
        d="M20 11.5v18c-2.6-1-5.7-1.7-8.5-1.7V11.5c2.8 0 5.9 0.7 8.5 1.7z"
        fill="white"
        fillOpacity="0.92"
      />

      {/* หน้าขวาของหนังสือ (จางกว่า) */}
      <path
        d="M20 11.5v18c2.6-1 5.7-1.7 8.5-1.7V11.5c-2.8 0-5.9 0.7-8.5 1.7z"
        fill="white"
        fillOpacity="0.40"
      />

      {/* เส้นสันหนังสือ (spine) */}
      <line
        x1="20"
        y1="11.5"
        x2="20"
        y2="29.5"
        stroke="white"
        strokeWidth="1.5"
        strokeOpacity="0.55"
      />

      {/* เส้นบันทึกในหน้าซ้าย (logbook lines) */}
      <line
        x1="12.5"
        y1="17"
        x2="18.5"
        y2="18.1"
        stroke="#1e3a8a"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeOpacity="0.65"
      />
      <line
        x1="12.5"
        y1="20.5"
        x2="18.5"
        y2="21.4"
        stroke="#1e3a8a"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeOpacity="0.65"
      />
      <line
        x1="12.5"
        y1="24"
        x2="16.5"
        y2="24.7"
        stroke="#1e3a8a"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeOpacity="0.65"
      />

      {/* เส้นโค้งล่างสุด (book binding) */}
      <path
        d="M11.5 29.5 C15 32 25 32 28.5 29.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.75"
        fill="none"
      />
    </svg>
  );
}
