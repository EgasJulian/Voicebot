import React, { useState, useEffect, useRef } from 'react';

const TypewriterBubble = () => {
  const fullText = "Hola, soy ALAN, ¿en qué te puedo ayudar?";
  const [displayedText, setDisplayedText] = useState("");
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const startTyping = () => {
    let index = 0;
    setDisplayedText("");
    
    // Clear any existing intervals/timeouts
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    intervalRef.current = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedText(prev => prev + fullText[index]);
        index++;
      } else {
        clearInterval(intervalRef.current);
        // Cambiado a 10000ms (10 segundos)
        timeoutRef.current = setTimeout(startTyping, 10000);
      }
    }, 100);
  };

  useEffect(() => {
    startTyping();
    
    // Cleanup function
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-md max-w-md">
      {displayedText}
      <span className="inline-block w-1 h-5 bg-black ml-1 animate-pulse">
      </span>
    </div>
  );
};

export default TypewriterBubble;

