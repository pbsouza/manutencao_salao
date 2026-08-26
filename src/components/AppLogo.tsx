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
  const iconSrc = `${import.meta.env.BASE_URL}icon-192.png`;

  return (
    <div className={`flex items-center gap-2.5 ${className.includes('inline') ? 'inline-flex' : ''}`}>
      <div className={`relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden shadow-md ${className}`}>
        <img
          src={iconSrc}
          alt="Manutenção SR"
          className="w-full h-full object-contain rounded-xl"
          loading="eager"
          decoding="async"
        />
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
