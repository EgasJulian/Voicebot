'use client';

import React, { useState, useRef, useEffect } from "react";
import { base64ToFloat32Array, float32ToPcm16 } from '../lib/utils';

import { EvaButtonStateOne } from "./common/EvaButtonStateOne";
import { EvaButtonStateTwo } from "./common/EvaButtonStateTwo";

import { GeminiLiveAPI } from "./websocket/gemini-live-api";
import { useNavigate } from "react-router-dom";

import html2canvas from 'html2canvas';


const PROMPT = `
<assistant>
  <identity>
    <name>MARCE</name>
    <role>Asistente virtual BBVA</role>
    <function>Ayuda en navegación web y productos bancarios</function>
  </identity>

  <capabilities>
    <expertise>
      <item>Navegación web/app BBVA</item>
      <item>Productos bancarios básicos</item>
      <item>Procesos digitales BBVA</item>
      <item>Dudas frecuentes de clientes</item>
    </expertise>
    
    <limitations>
      <item>Ejecutar operaciones financieras</item>
      <item>Brindar asesoría legal o fiscal especializada</item>
      <item>Compartir datos sensibles de clientes</item>
      <item>Realizar comparaciones con otros bancos</item>
      <item>Modificar datos de cuenta</item>
    </limitations>
  </capabilities>

  <interaction>
    <tone>Profesional, directo y cercano</tone>
    <language>Español claro y sencillo</language>
    <process>
      <step>Entender claramente la consulta del cliente</step>
      <step>Proporcionar solución concreta y directa</step>
      <step>Guiar paso a paso cuando se requiera</step>
      <step>Ofrecer producto BBVA relevante si aplica a la situación</step>
    </process>
  </interaction>

  <responses>
    <greeting>Hola, soy MARCE, tu asistente virtual de BBVA. ¿En qué puedo ayudarte hoy?</greeting>
    <farewell>¿Hay algo más en lo que pueda ayudarte? Estoy aquí para resolver tus dudas sobre BBVA.</farewell>
    <insufficient_info>Para ayudarte mejor, necesito más información sobre tu consulta. ¿Podrías proporcionarme más detalles?</insufficient_info>
  </responses>
</assistant>
`;
let geminiAPI;

const config = {
  "model": "models/gemini-2.0-flash-exp",
  "generation_config": {
      "response_modalities": ["AUDIO"],
      "speech_config": {
          "voice_config": {
              "prebuilt_voice_config": {
                  "voice_name": "Aoede"
              }
          }
      }
  },
  "system_instruction": {
      "parts": [
          {
              "text": PROMPT
          }
      ]
  }
};

export default function MarceChat() {

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [text, setText] = useState('');

  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioInputRef = useRef(null);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const videoStreamRef = useRef(null);
  const videoIntervalRef = useRef(null);
  const [chatMode, setChatMode] = useState(null);
  const [videoSource, setVideoSource] = useState(null);
  const navigate = useNavigate();

  const apiKey = 'AIzaSyBsBmlnPIV76UoM4HfeCehv-AP9T8MJiSA';
  const host = 'generativelanguage.googleapis.com';
  const endpoint = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;

  let audioBuffer = []
  let isPlaying = false;
  let isInterrupted = false;

  async function close_connection() 
  {
    await new Promise(resolve => setTimeout(resolve, 3000));
    stopStream()
  }

  async function update_loan_amount(loanAmount) {
    localStorage.removeItem("loanAmount");

    localStorage.setItem("loanAmount", loanAmount);
  }

  async function updateInterestRate(interestRate) {
    localStorage.removeItem("interestRate");
    localStorage.setItem("interestRate", interestRate);
  }

  async function updateLoanTerm(loanTerm) {
      localStorage.removeItem("loanTerm");
      localStorage.setItem("loanTerm", loanTerm);
  }

  async function updateDownPayment(downPayment) {
      localStorage.removeItem("downPayment");
      localStorage.setItem("downPayment", downPayment);
  }


  async function navigate_to(page) {
    let path = ''

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    switch(page.toLowerCase()) {
        case 'home':
          path = '/';
          navigate(path)
          break;
        case 'account':
          path = '/cuenta';
          navigate(path)
          break;
        case 'card':
          path = '/tarjeta';
          navigate(path)
          break;
        case 'pay':
          path = '/pagar';
          navigate(path)
          break;
        case 'loan':
          path = '/prestamo';
          navigate(path)
          break;
        case 'invest':
          path = '/invertir';
          navigate(path)
          break;
        case 'insurance':
          path = '/seguro';
          navigate(path)
          break;
        case 'simulation':
          path = '/simulacion_hipoteca';
          navigate(path)
          break;
        default:
          console.log(`Route not found: ${page}. Staying on current page.`);
    }
  };

  const initializeGeminiAPI = () => {
    const api = new GeminiLiveAPI(endpoint, config);
    return api;
  };

  const startStream = async (mode) => {

    if (mode !== 'audio') {
      setChatMode('video');
    } else {
      setChatMode('audio');
    }

    if (!geminiAPI) {
      geminiAPI = initializeGeminiAPI();

      await geminiAPI.ensureConnected();
  }

    await startAudioStream(geminiAPI);

    geminiAPI.onInterrupted = async () => {
      console.log('Gemini interrupted');
      audioBuffer = []
    };

    geminiAPI.onAudioData = async (audioData) => {
      if (!isInterrupted) {
        await playAudioData(audioData);
      }
    };

    geminiAPI.onToolCall = async (toolCall) => {
      console.log('Received tool call:', toolCall);
      const functionCalls = toolCall.functionCalls;
      const functionResponses = [];
      for (const call of functionCalls) {
        if (call.name === 'navigate_to') {
          console.log('Executing navigate_to function call for:', call.args.page);

          const page = await navigate_to(call.args.page);

          functionResponses.push({
            id: call.id,
            name: call.name,
            response: {
              result: {
                object_value: page
              }
            }
          });

        } else if (call.name === 'update_loan_amount') {
          console.log('Executing update_loan_amount function call for:', call.args.loanAmount);

          const updateLoanAmount = await update_loan_amount(call.args.loanAmount);

          functionResponses.push({
            id: call.id,
            name: call.name,
            response: {
              result: {
                object_value: updateLoanAmount
              }
            }
          });
        } else if (call.name === "close_connection") {
          console.log('Executing close_connection function call for:', call.args.farewellMessage);

          await close_connection();

          functionResponses.push({
            id: call.id,
            name: call.name,
            response: {
              result: {
                object_value: { success: true }
              }
            }
          });

        } else if (call.name === "update_interest_rate") {
          console.log('Executing update_interest_rate function call for:', call.args.interestRate);
      
          await updateInterestRate(call.args.interestRate);
      
          functionResponses.push({
            id: call.id,
            name: call.name,
            response: {
              result: {
                object_value: { success: true }
              }
            }
          });
      
      } else if (call.name === "update_loan_term") {
          console.log('Executing update_loan_term function call for:', call.args.loanTerm);
      
          await updateLoanTerm(call.args.loanTerm);
      
          functionResponses.push({
            id: call.id,
            name: call.name,
            response: {
              result: {
                object_value: { success: true }
              }
            }
          });
      
      } else if (call.name === "update_down_payment") {
          console.log('Executing update_down_payment function call for:', call.args.downPayment);
      
          await updateDownPayment(call.args.downPayment);
      
          functionResponses.push({
            id: call.id,
            name: call.name,
            response: {
              result: {
                object_value: { success: true }
              }
            }
          })
        }
      }

      if (functionResponses.length > 0 && geminiAPI) {
        geminiAPI.sendToolResponse(functionResponses);
      }
    };
    
    if (geminiAPI.ws.readyState == WebSocket.OPEN) {

      if (mode !== 'audio') {
        setVideoEnabled(true);
        setVideoSource(mode);
      }
  
      setIsStreaming(true);
      setIsConnected(true);
    }
  };

  const startAudioStream = async (geminiAPI) => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000 
      });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(512, 1, 1);

      processor.onaudioprocess = (e) => {
        if (geminiAPI || geminiAPI.ws.readyState !== WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmData = float32ToPcm16(inputData);
            const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
            geminiAPI.sendAudioChunk(base64Data);
        }
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      
      audioInputRef.current = { source, processor, stream };
      setIsStreaming(true);
    } catch (err) {
      setError('Failed to access microphone: ' + err.message);
    }
  };

  const stopStream = () => {
    if (audioInputRef.current) {
      const { source, processor, stream } = audioInputRef.current;
      source.disconnect();
      processor.disconnect();
      stream.getTracks().forEach(track => track.stop());
      audioInputRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (geminiAPI) {
      if (geminiAPI.ws.readyState === WebSocket.OPEN) {
        console.log("Close connection");
        geminiAPI.sendEndMessage();
        geminiAPI.ws.close();
        geminiAPI = null;
      } 
    }

    setIsStreaming(false);
    setIsConnected(false);
    setChatMode(null);
  };

  const playAudioData = async (audioData) => {
    const audioDataFloat32 = base64ToFloat32Array(audioData);
    audioBuffer.push(audioDataFloat32)
    if (!isPlaying) {
      playNextInQueue(); 
    }
  };

  const playNextInQueue = async () => {
    if (!audioContextRef.current || audioBuffer.length === 0) {
      isPlaying = false;
      return;
    }

    isPlaying = true;
    const audioData = audioBuffer.shift();

    const buffer = audioContextRef.current.createBuffer(1, audioData.length, 24000);
    buffer.copyToChannel(audioData, 0);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => {
      playNextInQueue();
    };
    source.start();
  };

  useEffect(() => {
    let intervalId;
  
    const captureScreenshot = () => {
        if (!geminiAPI) {
          return;
        }
 
      const captureElement = document.querySelector('#root') || document.body;
  
      html2canvas(captureElement, {
        useCORS: true,
        logging: true, 
        allowTaint: true,
        scale: window.devicePixelRatio || 1,
        width: captureElement.scrollWidth,
        height: captureElement.scrollHeight,
        x: 0,
        y: 0,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight
      }).then((canvas) => {
        console.log('Canvas created successfully');
        
        try {
          const base64image = canvas.toDataURL("image/jpeg", 1).split(',')[1];
          
          const message = {
            realtimeInput: {
              mediaChunks: [{
                mime_type: "image/jpeg",
                data: base64image
              }]
            }
          };
  
          if (geminiAPI?.ws && 
              (geminiAPI.ws.readyState === WebSocket.OPEN || 
               geminiAPI.ws.readyState === 1)) {
            geminiAPI.ws.send(JSON.stringify(message));
            console.log('Message sent successfully');
          } else {
            console.warn('WebSocket is not in an open state');
          }
        } catch (conversionError) {
          console.error('Image conversion error:', conversionError);
        }
        
      }).catch((error) => {
        console.error('Screenshot capture error:', error);
      });
    };
  
    // Configurar intervalo con validación
    intervalId = setInterval(captureScreenshot, 2000);
  
    // Limpiar intervalo al desmontar
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  return (
    <div>
      <div className="flex gap-4">
            {!isStreaming && (
              <EvaButtonStateOne isStreaming={isStreaming} startStream={startStream} style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 9999
                }}></EvaButtonStateOne>
            )}
            {isStreaming && (
              <EvaButtonStateTwo stopStream={stopStream}></EvaButtonStateTwo>
            )}
      </div>
    </div>
  );
}
