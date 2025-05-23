import React, { useState, useEffect } from "react";

const TypewriterBubble = () => {
  const fullText = "Hola, soy PACO, ¿en qué te puedo ayudar?";
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(fullText.slice(0, index + 1));
      index++;
      if (index === fullText.length) {
        clearInterval(interval);
      }
    }, 100); // Ajusta la velocidad (100ms por letra)
    return () => clearInterval(interval);
  }, [fullText]);

  return (
    <div
      className="message-bubble"
      style={{
        backgroundColor: '#fff',
        border: '2px solid #00008B',
        borderRadius: '15px',
        padding: '10px 15px',
        boxShadow: '0 0 10px rgba(0, 0, 139, 0.5)',
        fontFamily: 'monospace',
        fontSize: '12px',
        maxWidth: '130px',
        marginTop: '20px',
        position: 'relative'
      }}
    >
      {displayedText}
      <span
        className="cursor"
        style={{
          display: 'inline-block',
          marginLeft: '2px',
          animation: 'blink 1s infinite'
        }}
      >
        |
      </span>
    </div>
  );
};

export const EvaButtonStateOne = ({isStreaming, startStream}) => {
    const [isBlinking, setIsBlinking] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    
    
    // Efecto para el parpadeo automático
    useEffect(() => {
      const blinkInterval = setInterval(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 500);
      }, 3000);
      
      return () => clearInterval(blinkInterval);
    }, []);
    
 
    return (
      <div className="flex flex-col items-center justify-center" style={{position: 'fixed',
        bottom: '5%',
        right: '1%',
        zIndex: 9999}}>
        <TypewriterBubble/>
        <button
          className={`relative outline-none focus:outline-none transition-transform duration-200 ${
            isHovered ? 'transform scale-110' : ''
            
          }`}
          onClick={() => startStream('screen')}
          disabled={isStreaming}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-label="MARCE Robot Button"
          style={{
            border: 'none',       
            background: 'none'
          }}
        >
          {/* SVG del robot EVA */}
          <svg
            width="130"
            height="120"
            viewBox="0 0 220 260"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
          >
            {/* Cuerpo principal con forma de embudo más pronunciada */}
            <path
              d="M70 100 C70 100, 55 170, 80 210 C95 240, 125 240, 140 210 C165 170, 150 100, 150 100"
              fill="white"
              stroke="#e0e0e0"
              strokeWidth="2"
              className={isHovered ? "fill-gray-50" : "fill-white"}
            />
            
            {/* Sombra central para dar profundidad al cuerpo */}
            <path
              d="M80 110 C80 110, 70 170, 90 200 C100 225, 120 225, 130 200 C150 170, 140 110, 140 110"
              fill="url(#bodyGradient)"
              opacity="0.4"
            />
  
            {/* Cabeza elíptica */}
            <ellipse
              cx="110"
              cy="70"
              rx="48"
              ry="40"
              fill="white"
              stroke="#e0e0e0"
              strokeWidth="2"
              className={isHovered ? "fill-gray-50" : "fill-white"}
            />
            
            {/* Pantalla/Visor de la cara (negro) completamente ovalada */}
            <ellipse
              cx="110"
              cy="72"
              rx="42"
              ry="29"
              fill="#111111"
              className="drop-shadow-md"
            />
            
            {/* Ojos (azules con brillo) ovalados e inclinados 30° */}
            {!isBlinking && (
              <>
                {/* Ojo izquierdo inclinado 30° */}
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
                
                {/* Ojo derecho inclinado 30° */}
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
            
            {/* Brazos flotantes MUY cercanos pero sin tocar el cuerpo */}
            <ellipse
              cx="52"
              cy="150"
              rx="8"
              ry="52"
              fill="white"
              stroke="#e0e0e0"
              strokeWidth="2"
              transform="rotate(15 52 140)"
              className={isHovered ? "fill-gray-50" : "fill-white"}
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
              className={isHovered ? "fill-gray-50" : "fill-white"}
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
          </svg>
          
          {/* Reflejo/sombra debajo del robot */}
          <div className="w-32 h-4 bg-black/10 rounded-full mx-auto mt-2 blur-sm" />
        </button>
      </div>
    );
  };
