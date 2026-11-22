import React, { useId } from 'react';

/**
 * Logo Omni DSS: ba kênh bán hàng (chấm màu) hội tụ về điểm phân tích, đi ra thành mũi tên đi lên (dự đoán / quyết định).
 * Bản tĩnh: public/logo-mark.svg (đầy đủ), public/favicon.svg (giản lược cho cỡ nhỏ).
 */
export const BrandMark: React.FC<{ size?: number; className?: string; title?: string }> = ({ size = 40, className, title = 'Omni DSS' }) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={title} className={className} style={{ flexShrink: 0, display: 'block' }}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".22" />
          <stop offset=".55" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${id}-bg)`} />
      <rect width="64" height="64" rx="16" fill={`url(#${id}-shine)`} />
      <g fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 19.5c8.5 0 10.5 10.6 16.6 11.8" strokeOpacity=".88" />
        <path d="M16 32h15.6" strokeOpacity=".88" />
        <path d="M16 44.5c8.5 0 10.5-10.6 16.6-11.8" strokeOpacity=".88" />
        <path d="M40.3 28.1 50.5 17.9" />
        <path d="M43.4 17h8v8" />
      </g>
      <circle cx="36.4" cy="32" r="5.8" fill="#fff" />
      <circle cx="36.4" cy="32" r="2.3" fill="#4338ca" />
      <circle cx="15" cy="19.5" r="3.6" fill="#67e8f9" />
      <circle cx="15" cy="32" r="3.6" fill="#6ee7b7" />
      <circle cx="15" cy="44.5" r="3.6" fill="#fcd34d" />
    </svg>
  );
};

/** Logo đầy đủ: biểu tượng + chữ "OmniDSS" (màu chữ theo theme qua CSS .brand-wordmark). */
export const BrandLockup: React.FC<{ size?: number; tagline?: string }> = ({ size = 40, tagline }) => (
  <div className="brand-lockup">
    <BrandMark size={size} />
    <div>
      <div className="brand-wordmark" style={{ fontSize: size * 0.5 }}>Omni<b>DSS</b></div>
      {tagline && <div className="brand-tagline">{tagline}</div>}
    </div>
  </div>
);
