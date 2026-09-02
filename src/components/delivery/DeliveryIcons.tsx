import React from 'react';

/**
 * Animated Express Scooter / Bike Rider Icon
 * Features moving speed lines and subtle bike vibration for a fast express feel.
 */
export function ExpressRiderIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-emerald-600 overflow-visible"
      >
        <defs>
          <style>{`
            @keyframes speedLine {
              0% { transform: translateX(12px); opacity: 0; }
              50% { opacity: 1; }
              100% { transform: translateX(-16px); opacity: 0; }
            }
            @keyframes bikeRide {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-1.5px) rotate(-1deg); }
            }
            @keyframes wheelSpin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .speed-line-1 { animation: speedLine 0.6s linear infinite; }
            .speed-line-2 { animation: speedLine 0.6s linear 0.2s infinite; }
            .speed-line-3 { animation: speedLine 0.6s linear 0.4s infinite; }
            .bike-body { animation: bikeRide 0.4s ease-in-out infinite; }
            .wheel { transform-origin: center; animation: wheelSpin 0.5s linear infinite; }
          `}</style>
        </defs>

        {/* Dynamic Speed Wind Lines */}
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="56" y1="18" x2="44" y2="18" className="speed-line-1 opacity-75" />
          <line x1="60" y1="30" x2="48" y2="30" className="speed-line-2 opacity-90" strokeWidth="2.5" />
          <line x1="52" y1="42" x2="40" y2="42" className="speed-line-3 opacity-60" />
        </g>

        {/* Bike and Rider Group */}
        <g className="bike-body">
          {/* Rider Helmet */}
          <circle cx="32" cy="18" r="6" fill="currentColor" />
          
          {/* Rider Body / Coat */}
          <path
            d="M26 26C26 24 28 23 32 23C36 23 39 25 41 29L35 34L26 31V26Z"
            fill="currentColor"
          />

          {/* Delivery Backpack */}
          <rect x="18" y="21" width="8" height="12" rx="2" fill="#047857" />

          {/* Scooter Body Shield */}
          <path
            d="M36 34L44 34C46 34 47.5 35.5 47 37.5L44 48H32L36 34Z"
            fill="currentColor"
          />

          {/* Seat & Base Frame */}
          <path
            d="M16 41H38C40 41 41 43 40 45L38 48H18L16 41Z"
            fill="#065F46"
          />

          {/* Windshield */}
          <path
            d="M42 27L46 34H43L40 27H42Z"
            fill="currentColor"
            opacity="0.7"
          />

          {/* Front Wheel */}
          <g className="wheel" style={{ transformOrigin: '42px 50px' }}>
            <circle cx="42" cy="50" r="7" stroke="currentColor" strokeWidth="3" fill="white" />
            <circle cx="42" cy="50" r="2" fill="currentColor" />
            <line x1="42" y1="43" x2="42" y2="57" stroke="currentColor" strokeWidth="1" />
            <line x1="35" y1="50" x2="49" y2="50" stroke="currentColor" strokeWidth="1" />
          </g>

          {/* Rear Wheel */}
          <g className="wheel" style={{ transformOrigin: '20px 50px' }}>
            <circle cx="20" cy="50" r="7" stroke="currentColor" strokeWidth="3" fill="white" />
            <circle cx="20" cy="50" r="2" fill="currentColor" />
            <line x1="20" y1="43" x2="20" y2="57" stroke="currentColor" strokeWidth="1" />
            <line x1="13" y1="50" x2="27" y2="50" stroke="currentColor" strokeWidth="1" />
          </g>

          {/* Headlight Flare */}
          <polygon points="46,36 56,33 56,41" fill="#FDE047" opacity="0.85" />
        </g>

        {/* Road Track Line */}
        <line x1="4" y1="57" x2="60" y2="57" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" opacity="0.4" />
      </svg>
    </div>
  );
}

/**
 * Animated Standard Delivery Truck Icon
 * Features spinning wheels, moving road dashes, and cargo vibration.
 */
export function StandardTruckIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-[#6B1725] overflow-visible"
      >
        <defs>
          <style>{`
            @keyframes truckDrive {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-1.2px); }
            }
            @keyframes truckWheel {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes roadMove {
              0% { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: -20; }
            }
            .truck-chassis { animation: truckDrive 0.5s ease-in-out infinite; }
            .truck-wheel { transform-origin: center; animation: truckWheel 0.7s linear infinite; }
            .road-line { animation: roadMove 0.5s linear infinite; }
          `}</style>
        </defs>

        {/* Truck Chassis Group */}
        <g className="truck-chassis">
          {/* Main Cargo Container */}
          <rect x="6" y="16" width="34" height="26" rx="3" fill="currentColor" />

          {/* Decorative Gold Branding Stripe on Cargo Box */}
          <rect x="6" y="27" width="34" height="4" fill="#B08A3C" />

          {/* Truck Cabin Front */}
          <path
            d="M40 24H50C52.5 24 54.5 26 55 28.5L57 35C57.5 36.5 58 38 58 40V42H40V24Z"
            fill="currentColor"
          />

          {/* Cabin Window */}
          <path
            d="M43 27H49C50.5 27 51.5 28 52 29.5L53.5 34H43V27Z"
            fill="#FAF7F0"
          />

          {/* Bumper Light */}
          <rect x="57" y="39" width="3" height="3" rx="1" fill="#FDE047" />

          {/* Front Wheel */}
          <g className="truck-wheel" style={{ transformOrigin: '48px 44px' }}>
            <circle cx="48" cy="44" r="6" stroke="#292524" strokeWidth="3" fill="white" />
            <circle cx="48" cy="44" r="2" fill="#292524" />
            <line x1="48" y1="38" x2="48" y2="50" stroke="#292524" strokeWidth="1" />
            <line x1="42" y1="44" x2="54" y2="44" stroke="#292524" strokeWidth="1" />
          </g>

          {/* Rear Wheel */}
          <g className="truck-wheel" style={{ transformOrigin: '18px 44px' }}>
            <circle cx="18" cy="44" r="6" stroke="#292524" strokeWidth="3" fill="white" />
            <circle cx="18" cy="44" r="2" fill="#292524" />
            <line x1="18" y1="38" x2="18" y2="50" stroke="#292524" strokeWidth="1" />
            <line x1="12" y1="44" x2="24" y2="44" stroke="#292524" strokeWidth="1" />
          </g>
        </g>

        {/* Animated Moving Road Track */}
        <line
          x1="2"
          y1="52"
          x2="62"
          y2="52"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray="8 6"
          className="road-line opacity-50"
        />
      </svg>
    </div>
  );
}
