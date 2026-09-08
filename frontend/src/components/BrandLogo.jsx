import React from 'react';
import finovaLogo from '../assets/finova-logo.png';

/**
 * Reusable BrandLogo Component for Finova
 *
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg' | 'xl'} [props.size='md'] Size preset
 * @param {boolean} [props.showText=false] Whether to display adjacent text alongside the logo
 * @param {boolean} [props.showTagline=false] Whether to display the tagline under the title
 * @param {string} [props.badge] Optional badge string (e.g., 'v1.0' or 'ADMIN')
 * @param {string} [props.className] Additional classes for the container
 * @param {string} [props.imgClassName] Additional classes for the <img>
 */
const BrandLogo = ({
  size = 'md',
  showText = false,
  showTagline = false,
  badge,
  className = '',
  imgClassName = '',
}) => {
  const sizeMap = {
    xs: 'h-7 w-auto',
    sm: 'h-9 w-auto',
    md: 'h-11 w-auto',
    lg: 'h-16 w-auto',
    xl: 'h-24 w-auto',
  };

  const selectedSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src={finovaLogo}
        alt="Finova - Smart Banking. Smarter Future."
        className={`${selectedSize} object-contain transition-transform duration-200 ${imgClassName}`}
      />
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-tight text-slate-900 text-lg leading-none">
              FINOVA
            </span>
            {badge && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 border border-brand-200">
                {badge}
              </span>
            )}
          </div>
          {showTagline && (
            <span className="text-[10px] font-medium text-slate-500 tracking-tight mt-0.5">
              Smart Banking. Smarter Future.
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
