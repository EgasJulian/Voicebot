import React, { useState, useEffect } from "react";

export const EvaButtonStateTwo = ({stopStream}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center" style={{position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999}}>
      <button
        className={`relative outline-none focus:outline-none transition-transform duration-200 ${
          isHovered ? 'transform scale-110' : ''
        }`}
        onClick={stopStream}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="MARCE Robot Button with Sign"
        style={{
          border: 'none',
          background: 'none'
        }}
      >
        <svg
          width="100"
          height="120"
          viewBox="0 0 220 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          {/* Cuerpo principal */}
          <path
            d="M70 100 C70 100, 55 170, 80 210 C95 240, 125 240, 140 210 C165 170, 150 100, 150 100"
            fill="white"
            stroke="#e0e0e0"
            strokeWidth="2"
            className={isHovered ? 'fill-gray-50' : 'fill-white'}
          />
          
          {/* Sombra central */}
          <path
            d="M80 110 C80 110, 70 170, 90 200 C100 225, 120 225, 130 200 C150 170, 140 110, 140 110"
            fill="url(#bodyGradient)"
            opacity="0.4"
          />

          {/* Cabeza */}
          <ellipse
            cx="110"
            cy="70"
            rx="48"
            ry="40"
            fill="white"
            stroke="#e0e0e0"
            strokeWidth="2"
            className={isHovered ? 'fill-gray-50' : 'fill-white'}
          />
          
          {/* Visor */}
          <ellipse
            cx="110"
            cy="72"
            rx="42"
            ry="29"
            fill="#111111"
            className="drop-shadow-md"
          />
          
          {/* Ojos */}
          {!isBlinking && (
            <>
              <g transform="translate(90, 68) rotate(15)">
                <ellipse
                  cx="0"
                  cy="0"
                  rx="10"
                  ry="5"
                  fill="#4AA8FF"
                  filter="url(#glowEyes)"
                  className="transition-all duration-200"
                />
              </g>
              <g transform="translate(130, 68) rotate(-15)">
                <ellipse
                  cx="0"
                  cy="0"
                  rx="10"
                  ry="5"
                  fill="#4AA8FF"
                  filter="url(#glowEyes)"
                  className="transition-all duration-200"
                />
              </g>
            </>
          )}
          
          {/* Detalles del cuerpo */}
          <path
            d="M85 160 C 95 170, 125 170, 135 160"
            stroke="#e0e0e0"
            strokeWidth="2"
            fill="none"
          />
          
          {/* Brazos */}
          <ellipse
            cx="52"
            cy="150"
            rx="8"
            ry="52"
            fill="white"
            stroke="#e0e0e0"
            strokeWidth="2"
            transform="rotate(15 52 140)"
            className={isHovered ? 'fill-gray-50' : 'fill-white'}
          />
          <ellipse
            cx="168"
            cy="150"
            rx="8"
            ry="52"
            fill="white"
            stroke="#e0e0e0"
            strokeWidth="2"
            transform="rotate(-15 168 140)"
            className={isHovered ? 'fill-gray-50' : 'fill-white'}
          />

          {/* Definiciones de gradientes y filtros */}
          <defs>
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="50%" stopColor="#e0e0e0" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <filter id="glowEyes" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <defs>
            <filter id="neonFilter" x="-50%" y="-50%" width="200%" height="200%">
              {/* Desenfoque para el efecto de brillo */}
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="50%" stopColor="#e0e0e0" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            
            <filter id="glowEyes" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Cartel que sostiene EVA */}
          {/* Se ubica en la zona del brazo derecho (puedes ajustar la posición y la rotación) */}
          <g transform="translate(110,155)">
          {/* Se centra el rectángulo: ancho 80 y alto 30 */}
          <rect
            x="-110"
            y="-25"
            width="220"
            height="50"
            fill="white"
            rx="10"
            ry="5"
            stroke="blue"
            strokeWidth="5"
            filter="url(#neonFilter)"
          />
          <text
            x="0"
            y="5"
            fill="black"
            textAnchor="middle"
            fontSize="20"
            fontWeight="bold"
            // filter="url(#neonFilter)"
          >
            Detener conversación
          </text>
        </g>
        </svg>
      </button>
    </div>
  );
};
