'use client';

import React, { useState, useRef, useEffect, useCallback } from "react";
import { base64ToFloat32Array, float32ToPcm16 } from '../lib/utils'; // Asumiendo que estas utilidades existen y son correctas

import { EvaButtonStateOne } from "./common/EvaButtonStateOne";
import { EvaButtonStateTwo } from "./common/EvaButtonStateTwo";

import { GeminiLiveAPI } from "./websocket/gemini-live-api"; // Ajusta la ruta si es necesario
import { useNavigate } from "react-router-dom";

import html2canvas from 'html2canvas';

const totalSteps = 6;

let geminiAPI; // Instancia de la API

export default function MarceChat() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  // const [text, setText] = useState(''); // Para mostrar texto de Gemini

  const audioContextRef = useRef(null);
  const audioInputRef = useRef(null);
  const geminiApiRef = useRef(null); // <--- Usar useRef para la instancia de GeminiLiveAPI
  const currentAudioSourceNode = useRef(null);
  const audioPlaybackQueue = useRef([]);
  const isPlaying = useRef(false);

  const navigate = useNavigate();

  const apiKey = 'AIzaSyBsBmlnPIV76UoM4HfeCehv-AP9T8MJiSA'; // ¡Esto debería estar en el backend!
  const host = 'generativelanguage.googleapis.com';
  // El endpoint del WebSocket se pasará al constructor de GeminiLiveAPI, no se usa directamente aquí.
  const endpoint = `wss://${host}/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
  // let isInterrupted = false; // El backend maneja 'interrupted' de Gemini.

  // --- Funciones de Herramientas (sin cambios) ---
  async function close_connection() {
        console.log("Tool Call: close_connection solicitada.");
        await new Promise(resolve => setTimeout(resolve, 1000)); // Pequeña demora para que cualquier audio final se envíe/reproduzca
        stopStream(); 
    }

  async function update_details() {
    localStorage.removeItem("showDetails");
    localStorage.setItem("showDetails", true);
  }

  async function advance_flow() {
    let currentStep = parseInt(localStorage.getItem("currentStep"), 10);
    if (isNaN(currentStep)) {
      currentStep = 1;
    } else if (currentStep < totalSteps) {
      currentStep += 1;
    } else {
      currentStep = 6;
    }
    localStorage.setItem("currentStep", currentStep);
  }

  async function navigate_to(page) {
    let path = '';
    await new Promise(resolve => setTimeout(resolve, 1000));
    switch(page.toLowerCase()) {
      case 'home': path = '/'; break;
      case 'account': path = '/cuenta'; break;
      case 'credit': path = '/credito'; break;
      case 'card': path = '/tarjeta'; break;
      case 'pay': path = '/pagar'; break;
      case 'loan': path = '/credito'; break;
      case 'invest': path = '/invertir'; break;
      case 'insurance': path = '/seguro'; break;
      case 'mortgage': path = '/simulacion_hipoteca'; break;
      default: console.log(`Route not found: ${page}. Staying on current page.`); return { success: false, page: page };
    }
    if (path) navigate(path);
    return { success: true, page: page, navigatedTo: path };
  }
  // --- Fin Funciones de Herramientas ---

  const initializeAndSetupGeminiAPI = useCallback(() => {
    console.log("MarceChat: Inicializando y configurando GeminiLiveAPI...");
    const api = new GeminiLiveAPI(endpoint, true, null); // El segundo arg es autoSetup, el tercero es setupConfig

    api.onSetupComplete = () => {
      console.log('MarceChat: GeminiLiveAPI - Configuración completa.');
      // Podrías querer confirmar el estado del websocket aquí también
      if (api.ws) {
          console.log("MarceChat: Estado del WebSocket tras onSetupComplete:", api.ws.readyState);
      }
    };

    api.onTextData = (text, isFinal) => {
      console.log(`MarceChat: GeminiLiveAPI - Texto recibido (Final: ${isFinal}):`, text);
      // setText(text); // Actualiza el estado si quieres mostrar el texto en la UI
    };

    api.onAudioData = async (audioData) => {
      console.log('MarceChat: GeminiLiveAPI - Datos de audio (de ElevenLabs) recibidos.');
      await playAudioData(audioData); // Tu función de reproducción
    };

    api.onToolCall = async (toolCall) => {
      console.log('MarceChat: GeminiLiveAPI - Tool call recibido:', toolCall);
      const functionCalls = toolCall.functionCalls;
      const functionResponses = [];
      for (const call of functionCalls) {
        let responsePayload = { success: true };
        if (call.name === 'navigate_to') {
          const navResult = await navigate_to(call.args.page); // Asegúrate que navigate_to existe
          responsePayload = navResult || { success: true, page: call.args.page };
        } else if (call.name === "close_connection") {
          await close_connection(); // Esta función llama a stopStream
        } else if (call.name === "advance_flow") {
          await advance_flow(); // Asegúrate que advance_flow existe
        } else if (call.name === "show_details") {
          await update_details(); // Asegúrate que update_details existe
        } else {
          responsePayload = { success: false, error: `Función ${call.name} no implementada.` };
        }
        functionResponses.push({
          id: call.id, name: call.name, response: { result: { object_value: responsePayload } }
        });
      }
      if (functionResponses.length > 0 && geminiApiRef.current && geminiApiRef.current.ws?.readyState === WebSocket.OPEN) {
        geminiApiRef.current.sendToolResponse(functionResponses);
      }
    };
    
    api.onInterrupted = () => {
        console.log('MarceChat: GeminiLiveAPI - Interrumpido.');
        // Limpiar cola de reproducción si Gemini fue interrumpido
        if (currentAudioSourceNode.current) {
            currentAudioSourceNode.current.onended = null;
            try { currentAudioSourceNode.current.stop(); } catch(e) {}
            currentAudioSourceNode.current.disconnect();
            currentAudioSourceNode.current = null;
        }
        audioPlaybackQueue.current = [];
        isPlaying.current = false;
    };

    api.onClose = (event) => {
      console.log('MarceChat: GeminiLiveAPI - Conexión WebSocket cerrada.', event.code, event.reason);
      // Solo actualizar el estado si no fue un cierre intencional desde stopStream
      // o si el estado es inconsistente.
      if (isStreaming) { // Si el estado del frontend cree que aún debería estar transmitiendo
          setError(prev => prev ? `${prev} | Conexión cerrada inesperadamente.` : `Conexión cerrada: ${event.reason || event.code}`);
          // setIsStreaming(false); // stopStream se encargará de la limpieza completa
          // stopStream(); // Podría ser demasiado agresivo, depende de la causa del cierre
      }
       // Limpiar la referencia si el WebSocket se cierra por cualquier razón
      if (geminiApiRef.current === api) { 
          // geminiApiRef.current = null; // No hacer null aquí, stopStream lo hará.
      }
       // Lo más seguro es dejar que stopStream maneje el seteo de isStreaming a false
    };

    api.onError = (errorMessage) => {
      console.error('MarceChat: GeminiLiveAPI - Error:', errorMessage);
      setError(prev => prev ? `${prev} | Error API: ${errorMessage}` : `Error API: ${errorMessage}`);
      // setIsStreaming(false); // stopStream se encargará
    };

    geminiApiRef.current = api; // Almacenar la instancia en el ref
  }, [isStreaming, endpoint /* , otras dependencias de tus tool_functions si las usas directamente aquí */]);

  const startStream = useCallback(async () => {
    if (isStreaming || geminiApiRef.current) { // Prevenir múltiples inicios o si ya hay una instancia
      console.warn("MarceChat: startStream llamado cuando ya está en streaming o API ya existe. Limpiando primero...");
      // Llama a stopStream para una limpieza completa antes de reintentar.
      // Esto asegura un estado limpio.
      await stopStreamInternalLogic(false); // Limpiar sin enviar mensaje de fin
    }

    setIsStreaming(true);
    setError(null);
    
    initializeAndSetupGeminiAPI(); // Esto asignará la nueva instancia a geminiApiRef.current

    if (!geminiApiRef.current) {
        console.error("MarceChat: Fallo al inicializar GeminiLiveAPI.");
        setError("Error crítico: No se pudo inicializar la API.");
        setIsStreaming(false);
        return;
    }

    try {
      console.log("MarceChat: Esperando conexión de GeminiLiveAPI (ensureConnected)...");
      await geminiApiRef.current.ensureConnected();
      console.log("MarceChat: GeminiLiveAPI conectada. Iniciando stream de audio del usuario...");
      await startAudioInputStream(); 
    } catch (connectError) {
      console.error("MarceChat: Error al conectar o iniciar audio input stream:", connectError);
      setError(prev => prev ? `${prev} | Error de conexión: ${connectError.message}` : `Error de conexión: ${connectError.message}`);
      setIsStreaming(false);
      if (geminiApiRef.current && geminiApiRef.current.ws) {
        geminiApiRef.current.ws.close();
      }
      geminiApiRef.current = null;
    }
  }, [isStreaming, initializeAndSetupGeminiAPI /* otras dependencias si son necesarias */]);


  // Lógica interna de stopStream para ser reutilizable
  const stopStreamInternalLogic = useCallback(async (sendEndMsg = true) => {
    console.log(`MarceChat: Ejecutando lógica interna de stopStream. Enviar mensaje de fin: ${sendEndMsg}`);
    
    if (audioInputRef.current) {
      audioInputRef.current.stream?.getTracks().forEach(track => track.stop());
      audioInputRef.current.source?.disconnect();
      audioInputRef.current.processor?.disconnect();
      // No cierres el audioContextRef.current global aquí si playAudioData lo usa
      audioInputRef.current = null;
      console.log("MarceChat: Stream de micrófono detenido y limpiado.");
    }

    if (currentAudioSourceNode.current) {
      currentAudioSourceNode.current.onended = null;
      try { currentAudioSourceNode.current.stop(); } catch (e) {}
      currentAudioSourceNode.current.disconnect();
      currentAudioSourceNode.current = null;
      console.log("MarceChat: Nodo de reproducción de audio detenido y limpiado.");
    }
    audioPlaybackQueue.current = [];
    isPlaying.current = false;

    const api = geminiApiRef.current; // Capturar la referencia actual
    if (api && api.ws) {
      console.log(`MarceChat: Procesando WebSocket. Estado actual: ${api.ws.readyState}`);
      if (api.ws.readyState === WebSocket.OPEN) {
        if (sendEndMsg) {
          console.log("MarceChat: WebSocket abierto, enviando mensaje de fin y cerrando.");
          api.sendEndMessage();
        } else {
          console.log("MarceChat: WebSocket abierto, cerrando sin enviar mensaje de fin.");
        }
        api.ws.close(1000, "Cierre iniciado por el cliente");
      } else if (api.ws.readyState === WebSocket.CONNECTING) {
        console.log("MarceChat: WebSocket estaba conectando, intentando cerrar.");
        api.ws.close(1000, "Cierre durante conexión");
      } else {
        console.log(`MarceChat: WebSocket no estaba abierto ni conectando (Estado: ${api.ws.readyState}). No se envía mensaje de fin ni se cierra explícitamente aquí si ya está cerrado/cerrando.`);
      }
    } else {
        console.log("MarceChat: No hay instancia de API o WebSocket para cerrar en stopStreamInternalLogic.");
    }
    geminiApiRef.current = null; // Limpiar la referencia
    setIsStreaming(false); // Esto debe ser lo último después de toda la limpieza
    console.log("MarceChat: isStreaming seteado a false. Fin de stopStreamInternalLogic.");
  }, []); // No hay dependencias aquí si solo usa refs y setters de estado

  const startAudioInputStream = async () => { // Ya no necesita `apiInstance` como argumento si usa geminiApiRef.current
    if (!geminiApiRef.current) {
      console.error("MarceChat: geminiApiRef.current no está definido en startAudioInputStream.");
      setError("Error interno: API no lista.");
      setIsStreaming(false);
      return;
    }
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(1024, 1, 1);

      processor.onaudioprocess = (e) => {
        if (geminiApiRef.current && geminiApiRef.current.ws?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = float32ToPcm16(inputData); // Tu función de conversión
          const base64Data = btoa(String.fromCharCode.apply(null, new Uint8Array(pcmData.buffer)));
          geminiApiRef.current.sendAudioChunk(base64Data);
        }
      };
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      audioInputRef.current = { source, processor, stream, context: audioContextRef.current };
      // setIsStreaming(true); // Se setea en startStream antes de llamar a esto.
      console.log("MarceChat: Stream de audio del micrófono iniciado.");
    } catch (err) {
      console.error('MarceChat: Fallo al acceder al micrófono:', err);
      setError('Fallo al acceder al micrófono: ' + err.message);
      setIsStreaming(false); // Asegurar que se revierta el estado
      if (geminiApiRef.current && geminiApiRef.current.ws) { // Intentar cerrar si la API se creó
          geminiApiRef.current.ws.close();
      }
      geminiApiRef.current = null;
    }
  };

  const stopStream = useCallback(() => {
    console.log("MarceChat: stopStream (acción de usuario) llamado.");
    stopStreamInternalLogic(true);
  }, [stopStreamInternalLogic]);

  // Efecto para captura de pantalla (sin cambios, pero revisa su uso con geminiAPI)
  useEffect(() => {
    let intervalId = null;

    const captureScreenshotAndSend = () => {
      // Usar geminiApiRef.current para acceder a la API
      const api = geminiApiRef.current;
      if (api && api.ws && api.ws.readyState === WebSocket.OPEN) {
        console.log("MarceChat: Intentando captura de pantalla...");
        const captureElement = document.querySelector('#root') || document.body;
        html2canvas(captureElement, {
            useCORS: true, logging: false, allowTaint: true, scale: 1,
            // ...otras opciones de html2canvas
        }).then((canvas) => {
          const base64image = canvas.toDataURL("image/jpeg", 0.7).split(',')[1];
          // Ajusta la estructura del mensaje según lo que espere tu backend de Gemini o el endpoint de Google
          const message = {
            client_content: {
              turns: [{ role: "user", parts: [{ inline_data: { mime_type: "image/jpeg", data: base64image }}] }],
              // turn_complete: false // Opcional, si esto debe ser parte de un turno no completado
            }
          };
          api.sendMessage(message); // Usa el método sendMessage de la instancia
          console.log('MarceChat: Mensaje de Screenshot enviado.');
        }).catch((error) => {
          console.error('MarceChat: Error en captura de screenshot con html2canvas:', error);
        });
      } else {
        // Ya no es un error, sino una condición normal si no se está transmitiendo
        // console.warn('MarceChat: WebSocket no disponible para enviar screenshot. Estado de Streaming:', isStreaming, 'API WS State:', api?.ws?.readyState);
      }
    };

    if (isStreaming) {
      console.log("MarceChat: Configurando intervalo para screenshots porque isStreaming = true.");
      intervalId = setInterval(captureScreenshotAndSend, 3000); // Aumentado intervalo para pruebas
    } else {
      // console.log("MarceChat: No configurando intervalo para screenshots porque isStreaming = false.");
      if (intervalId) {
        clearInterval(intervalId);
      }
    }

    return () => {
      // console.log("MarceChat: Limpiando intervalo de screenshot.");
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isStreaming]); // Depender solo de isStreaming. La lógica interna del callback usa geminiApiRef.current.

  // --- Lógica de Reproducción de Audio (playAudioData, playNextInQueue) ---
  // (Asegúrate que estas funciones usen currentAudioSourceNode.current, audioPlaybackQueue.current, isPlaying.current
  // y audioContextRef.current como en la respuesta anterior para interrupción y encolado)
    // Ejemplo (revisar y adaptar de la respuesta anterior):
    const decodeAndPrepareAudio = useCallback(async (base64AudioData) => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const binaryString = atob(base64AudioData);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return audioContextRef.current.decodeAudioData(bytes.buffer);
    }, []);


    const playAudioData = useCallback(async (base64AudioData) => {
        try {
            const newAudioBuffer = await decodeAndPrepareAudio(base64AudioData);
            if (currentAudioSourceNode.current) {
                currentAudioSourceNode.current.onended = null; 
                try { currentAudioSourceNode.current.stop(); } catch (e) {}
                currentAudioSourceNode.current.disconnect();
                currentAudioSourceNode.current = null;
            }
            audioPlaybackQueue.current = [newAudioBuffer];
            isPlaying.current = false; 
            if (!isPlaying.current) { 
                playNextInQueue();
            }
        } catch (e) {
            console.error("Error al decodificar o encolar audio:", e);
            setError("Error al procesar audio: " + e.message);
        }
    }, [decodeAndPrepareAudio]); // playNextInQueue no es dependencia directa de playAudioData


    const playNextInQueue = useCallback(async () => {
        if (audioPlaybackQueue.current.length === 0) {
          isPlaying.current = false;
          return;
        }
        if (isPlaying.current && currentAudioSourceNode.current) { 
            return;
        }
        const audioBufferToPlay = audioPlaybackQueue.current.shift(); 
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            isPlaying.current = false; 
            return;
        }
        try {
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBufferToPlay;
            source.connect(audioContextRef.current.destination);
            currentAudioSourceNode.current = source;
            isPlaying.current = true;
            source.onended = () => {
                if (currentAudioSourceNode.current === source) { 
                    isPlaying.current = false;
                    currentAudioSourceNode.current = null; 
                    playNextInQueue(); 
                }
            };
            source.start();
        } catch (e) {
            console.error("Error al reproducir AudioBuffer:", e);
            setError("Error en reproducción: " + e.message);
            isPlaying.current = false; 
            currentAudioSourceNode.current = null;
        }
    }, []);


  // --- Cleanup Global al Desmontar el Componente ---
  useEffect(() => {
    return () => {
      console.log("MarceChat: Componente desmontándose, llamando a stopStream.");
      // stopStream(); // Llama a la versión envuelta en useCallback
      // Llamar directamente a la lógica interna para asegurar que se ejecute si stopStream no está disponible
      // por alguna razón en el momento del desmontaje.
      stopStreamInternalLogic(true); 
    };
  }, [stopStreamInternalLogic]); // Dependencia de la función memoizada

  return (
    <div>
      {/* ... (Tu UI, botones EvaButtonStateOne, EvaButtonStateTwo) ... */}
      <div className="flex gap-4 p-4">
        {!isStreaming ? (
          <EvaButtonStateOne 
            isStreaming={isStreaming} 
            startStream={startStream} // Usar la versión con useCallback
            // style={{ ... }}
          />
        ) : (
          <EvaButtonStateTwo 
            stopStream={stopStream} // Usar la versión con useCallback
            // style={{ ... }}
          />
        )}
      </div>
      {error && <p className="text-red-500 fixed bottom-2 left-2 bg-white p-2 rounded shadow z-50">Error: {error}</p>}
      {/* ... */}
    </div>
  );
}