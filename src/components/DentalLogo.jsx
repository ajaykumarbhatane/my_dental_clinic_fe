/**
 * Professional Dental Logo Component
 * Displays a tooth-based dental icon with modern styling
 */

const DentalLogo = ({ size = 'md', variant = 'inline' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const logoSvg = (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClasses[size]} text-blue-600 fill-current`}
    >
      {/* Tooth shape with smile */}
      <g>
        {/* Main tooth */}
        <path
          d="M 50 10 C 60 15 65 25 65 35 L 65 70 C 65 85 57 90 50 90 C 43 90 35 85 35 70 L 35 35 C 35 25 40 15 50 10 Z"
          fill="currentColor"
          opacity="0.9"
        />
        {/* Tooth highlight/shine */}
        <ellipse cx="45" cy="35" rx="8" ry="15" fill="white" opacity="0.3" />
        
        {/* Smile curve (gum line) */}
        <path
          d="M 30 70 Q 50 80 70 70"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          opacity="0.5"
        />
        
        {/* Decorative dots (representing health/care) */}
        <circle cx="55" cy="50" r="2" fill="white" opacity="0.4" />
        <circle cx="45" cy="55" r="2" fill="white" opacity="0.4" />
      </g>
    </svg>
  );

  if (variant === 'with-text') {
    return (
      <div className="flex items-center gap-2">
        {logoSvg}
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold text-blue-600">Dental</span>
          <span className="text-xs text-blue-500 font-medium">Pro</span>
        </div>
      </div>
    );
  }

  return logoSvg;
};

export default DentalLogo;
