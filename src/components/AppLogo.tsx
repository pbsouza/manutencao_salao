import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = 'w-10 h-10',
  showText = false,
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className.includes('inline') ? 'inline-flex' : ''}`}>
      <div className={`relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden shadow-md bg-gradient-to-br from-blue-600 to-indigo-800 border border-blue-400/30 ${className}`}>
        <svg
          viewBox="0 0 512 512"
          className="w-full h-full p-1"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="logoAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id="logoShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f1f5f9" />
            </linearGradient>
          </defs>

          {/* Central Emblem Container */}
          <g>
            {/* Shield / Hall Foundation */}
            <path
              d="M 256 80 L 384 140 L 384 270 C 384 355 256 420 256 420 C 256 420 128 355 128 270 L 128 140 Z"
              fill="url(#logoShieldGrad)"
            />

            {/* Outer Shield Border Accent */}
            <path
              d="M 256 80 L 384 140 L 384 270 C 384 355 256 420 256 420 C 256 420 128 355 128 270 L 128 140 Z"
              fill="none"
              stroke="url(#logoAccentGrad)"
              strokeWidth="10"
              strokeLinejoin="round"
            />

            {/* Kingdom Hall Architecture Lines (Stylized Roof & Portico) */}
            <path
              d="M 168 200 L 256 135 L 344 200"
              fill="none"
              stroke="#1e3a8a"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x="188"
              y="208"
              width="136"
              height="72"
              rx="6"
              fill="#e2e8f0"
              stroke="#1e3a8a"
              strokeWidth="10"
            />

            {/* Entrance Doors & Windows */}
            <rect x="236" y="232" width="40" height="48" rx="3" fill="#1e3a8a" />
            <circle cx="212" cy="235" r="10" fill="#3b82f6" />
            <circle cx="300" cy="235" r="10" fill="#3b82f6" />

            {/* Crossed Maintenance Tools Badge */}
            <g transform="translate(256, 335) scale(0.95)">
              <circle
                cx="0"
                cy="0"
                r="46"
                fill="url(#logoAccentGrad)"
                stroke="#ffffff"
                strokeWidth="6"
              />
              <path
                d="M -16 -16 L -26 -6 C -29 -3 -29 2 -26 5 L 8 39 C 11 42 16 42 19 39 L 26 32 C 29 29 29 24 26 21 L -8 -13 C -5 -16 -5 -21 -8 -24 L -16 -16 Z"
                fill="#1e293b"
              />
              <path
                d="M -15 -25 C -23 -27 -31 -22 -33 -14 C -34 -8 -30 -3 -25 -1 L -15 -11 L -9 -5 L -1 -15 C -3 -20 -8 -24 -15 -25 Z"
                fill="#0f172a"
              />
              <path
                d="M -8 2 L -1 9 L 14 -6"
                fill="none"
                stroke="#ffffff"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </g>
        </svg>
      </div>

      {showText && (
        <div className="min-w-0">
          <span className="text-white font-bold text-sm tracking-tight block truncate">
            Manutenção SR
          </span>
          <span className="text-[10px] text-blue-200 block truncate">
            Salão do Reino
          </span>
        </div>
      )}
    </div>
  );
};
