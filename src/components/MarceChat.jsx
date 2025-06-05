  'use client';

import React, { useState, useRef, useEffect, useCallback } from "react";
import { float32ToPcm16 } from '../lib/utils'; // Asumiendo que estas utilidades existen y son correctas

import { EvaButtonStateOne } from "./common/EvaButtonStateOne";
import { EvaButtonStateTwo } from "./common/EvaButtonStateTwo";

import { GeminiLiveAPI } from "./websocket/gemini-live-api"; // Ajusta la ruta si es necesario
import { useNavigate } from "react-router-dom";
import { WaveFile } from 'wavefile';

import html2canvas from 'html2canvas';

const totalSteps = 6;

function parseAudioMimeType(mimeType) {
    console.log("[parseAudioMimeType] MimeType RECIBIDO de Gemini:", mimeType);
    const defaults = { sampleRate: 24000, numChannels: 1, bitsPerSample: 16 };
    if (!mimeType) {
        console.warn("[parseAudioMimeType] MimeType es nulo o indefinido, usando defaults:", defaults);
        return defaults;
    }
    const params = mimeType.split(';').map(param => param.trim());
    const audioFormatPart = params[0].toLowerCase();
    if (audioFormatPart.includes('l16') || audioFormatPart.includes('linear16')) {
        defaults.bitsPerSample = 16;
    } else {
        console.warn(`[parseAudioMimeType] Formato no reconocido como L16: ${audioFormatPart}. Asumiendo 16 bits.`);
    }
    for (let i = 1; i < params.length; i++) {
        const [key, value] = params[i].split('=').map(s => s.trim().toLowerCase());
        if (key && value) {
            if (key === 'rate' || key === 'samplerate') {
                const rate = parseInt(value, 10);
                if (!isNaN(rate) && rate > 0) defaults.sampleRate = rate;
                else console.warn(`[parseAudioMimeType] Tasa de muestreo inválida: ${value}. Usando default ${defaults.sampleRate}Hz.`);
            } else if (key === 'channels') {
                const channels = parseInt(value, 10);
                if (!isNaN(channels) && channels > 0) defaults.numChannels = channels;
                else console.warn(`[parseAudioMimeType] Canales inválidos: ${value}. Usando default ${defaults.numChannels}.`);
            }
        }
    }
    console.log("[parseAudioMimeType] Parámetros de audio FINALES:", defaults);
    return defaults;
}

function createWavHeader(pcmDataLength, options) {
    const numChannels = options.numChannels || 1;
    const sampleRate = options.sampleRate || 24000; // Default a 24kHz si no se especifica
    const bitsPerSample = options.bitsPerSample || 16;

    const blockAlign = numChannels * (bitsPerSample / 8);
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcmDataLength;

    const buffer = new ArrayBuffer(44); // Longitud del encabezado WAV
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true); // ChunkSize (36 + SubChunk2Size)
    writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true);  // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true); // Subchunk2Size (data size)

    return buffer;
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

export default function MarceChat() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  // Refs para valores que pueden necesitarse en callbacks o lógica asíncrona
  // y para evitar dependencias innecesarias en useCallback/useEffect
  const geminiApiRef = useRef(null);
  const audioInputRef = useRef(null);
  const currentAudioSourceNode = useRef(null);
  const audioPlaybackQueue = useRef([]);
  const isPlayingRef = useRef(false); // Para el estado de reproducción de audio
  const audioContextRef = useRef(null);

  // Ref para rastrear si el componente está montado
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    console.log("MarceChat: Componente REALMENTE MONTADO (useEffect []).");
    return () => {
      mountedRef.current = false;
      console.log("MarceChat: Componente REALMENTE DESMONTÁNDOSE (useEffect [] cleanup). Limpiando...");
      // Lógica de limpieza como la definimos antes (llamar a api.disconnect(), etc.)
      const api = geminiApiRef.current;
      if (api) { api.disconnect(); }
      if (audioInputRef.current) { /* limpiar audioInputRef */ }
      // ... más limpieza si es necesaria
    };
  }, []);

  // Ref para el estado de isStreaming, para acceso en callbacks sin causar redefiniciones
  const isStreamingRef = useRef(isStreaming);
  useEffect(() => {
    isStreamingRef.current = isStreaming;
    console.log(`MarceChat: useEffect[isStreaming] - isStreaming AHORA ES: ${isStreaming}`);
  }, [isStreaming]);

  const navigate = useNavigate();

  const geminiApiKey = 'AIzaSyBDJ_ajMtXnecQScU-A3yADo-lU5yS0Vtc'; // ¡Esto debería estar idealmente en una config del lado del servidor o variable de entorno!

  const playAudioWithWavefile = useCallback(async (samplesInt16Array, audioParams) => {
    if (!mountedRef.current) {
        console.log("MarceChat: [playAudioWithWavefile] Abortado, componente no montado.");
        return;
    }
    if (!samplesInt16Array || samplesInt16Array.length === 0) {
        console.warn("MarceChat: [playAudioWithWavefile] No hay samples para reproducir.");
        return;
    }
        if (!audioParams || !audioParams.sampleRate || !audioParams.numChannels || !audioParams.bitsPerSample) {
            console.error("MarceChat: [playAudioWithWavefile] Faltan parámetros de audio válidos.", audioParams);
            return;
        }

        console.log("MarceChat: [playAudioWithWavefile] Recibidos samples:", samplesInt16Array.length);

        if (currentAudioSourceNode.current) {
        console.log("MarceChat: [playAudioWithWavefile] Deteniendo y limpiando audio anterior...");
        currentAudioSourceNode.current.onended = null; // Quitar el callback onended anterior para evitar efectos secundarios
        try {
            currentAudioSourceNode.current.stop();
        } catch (e) {
            console.warn("MarceChat: [playAudioWithWavefile] Error menor al detener el source anterior (podría ya estar detenido):", e.message);
        }
        currentAudioSourceNode.current.disconnect();
        currentAudioSourceNode.current = null; // Marcar como nulo INMEDIATAMENTE
        isPlayingRef.current = false; // Actualizar el estado de reproducción
        } 

        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        } else if (audioContextRef.current.state === 'suspended') {
            try {
                await audioContextRef.current.resume();
            } catch (resumeError) { /* ... manejo de error ... */ return; }
        }

        try {
        const wf = new WaveFile();
        wf.fromScratch(audioParams.numChannels, audioParams.sampleRate, String(audioParams.bitsPerSample), samplesInt16Array);
        const wavUint8Array = wf.toBuffer();
        if (wavUint8Array.byteLength <= 44) { /* ... error si es muy pequeño ... */ return; }
        const wavArrayBuffer = wavUint8Array.buffer.slice(wavUint8Array.byteOffset, wavUint8Array.byteOffset + wavUint8Array.byteLength);

        console.log("MarceChat: [playAudioWithWavefile] Decodificando datos WAV...");
        const audioBuffer = await audioContextRef.current.decodeAudioData(wavArrayBuffer);
        console.log("MarceChat: [playAudioWithWavefile] AudioBuffer decodificado.");

        if (!mountedRef.current) { // Volver a chequear si el componente se desmontó durante el await
            console.log("MarceChat: [playAudioWithWavefile] Componente desmontado durante decodeAudioData. Abortando reproducción.");
            return;
        }
        
        // Si currentAudioSourceNode.current fue seteado por otra llamada concurrente mientras esperábamos decodeAudioData,
        // lo detenemos de nuevo. Esto es una doble seguridad.
        if (currentAudioSourceNode.current) {
            console.warn("MarceChat: [playAudioWithWavefile] currentAudioSourceNode fue reasignado durante decodeAudioData. Deteniendo de nuevo.");
            currentAudioSourceNode.current.onended = null; 
            try { currentAudioSourceNode.current.stop(); } catch (e) {}
            currentAudioSourceNode.current.disconnect();
            currentAudioSourceNode.current = null;
            isPlayingRef.current = false;
        }

        const sourceNode = audioContextRef.current.createBufferSource();
        sourceNode.buffer = audioBuffer;
        sourceNode.connect(audioContextRef.current.destination);
        
        currentAudioSourceNode.current = sourceNode; // Asignar el NUEVO source ANTES de onended
        isPlayingRef.current = true;

        sourceNode.onended = () => {
            console.log("MarceChat: [playAudioWithWavefile] source.onended disparado.");
            // Solo limpiar si este es el source que realmente terminó y el componente está montado
            if (mountedRef.current && currentAudioSourceNode.current === sourceNode) {
                console.log("MarceChat: [playAudioWithWavefile] Limpiando después de que el audio actual terminó.");
                isPlayingRef.current = false;
                // No es necesario desconectar aquí si no se va a reutilizar, pero no hace daño.
                // sourceNode.disconnect(); // El source ya está desconectado implícitamente al terminar si no está en loop.
                currentAudioSourceNode.current = null;
            } else if (currentAudioSourceNode.current !== sourceNode) {
                console.log("MarceChat: [playAudioWithWavefile] source.onended disparado para un source antiguo/diferente. Ignorando limpieza de currentAudioSourceNode.");
            }
        };
        
        console.log("MarceChat: [playAudioWithWavefile] Iniciando reproducción del nuevo AudioBuffer.");
        sourceNode.start(0);

    } catch (error) {
            console.error("MarceChat: [playAudioWithWavefile] Error:", error);
            if (mountedRef.current) setError("Error al reproducir audio con wavefile: " + error.message);
        }
    // }, [setError, isPlaying, currentAudioSourceNode, audioContextRef]); // Ajustar dependencias
    }, [setError]);
  
  // --- Funciones de Herramientas (sin cambios en su lógica interna) ---
  async function close_connection() {
    console.log("Tool Call: close_connection solicitada.");
    await new Promise(resolve => setTimeout(resolve, 1000));
    stopStream();
    // stopStream se llama dentro de la lógica de manejo de la herramienta o por el usuario
    // No es necesario llamar a stopStream() aquí directamente si la herramienta implica el fin de la interacción.
    // Si la herramienta es solo 'cerrar la conexión' pero el widget podría seguir, entonces stopStream no debe llamarse aquí.
    // Asumiendo que 'close_connection' implica detener el stream del widget:
    // La llamada a stopStream() ya está en initializeAndSetupGeminiAPI -> api.onToolCall
    // Si el modelo llama a close_connection, el frontend debe reaccionar deteniendo el stream
    // stopStream(); // Esta línea se gestionará en el callback onToolCall
  }

  async function update_details() {
    localStorage.removeItem("showDetails");
    localStorage.setItem("showDetails", "true"); // Guardar como string
  }

  async function advance_flow() {
    let currentStep = parseInt(localStorage.getItem("currentStep"), 10);
    if (isNaN(currentStep)) {
      currentStep = 1;
    } else if (currentStep < totalSteps) {
      currentStep += 1;
    } else {
      currentStep = totalSteps; // No exceder el total
    }
    localStorage.setItem("currentStep", currentStep.toString());
  }

  async function navigate_to(pageName) { // pageName es el argumento de la función
    let path = '';
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simular demora
    switch(pageName.toLowerCase()) { // Usar pageName
      case 'home': path = '/'; break;
      case 'account': path = '/cuenta'; break;
      case 'credit': path = '/credito'; break;
      case 'card': path = '/tarjeta'; break;
      case 'pay': path = '/pagar'; break;
      case 'loan': path = '/credito'; break; // Alias para crédito
      case 'invest': path = '/invertir'; break;
      case 'insurance': path = '/seguro'; break;
      case 'mortgage': path = '/simulacion_hipoteca'; break;
      default: 
        console.log(`Route not found: ${pageName}. Staying on current page.`); 
        return { success: false, page: pageName, error: `Ruta no encontrada: ${pageName}` };
    }
    if (path) navigate(path);
    return { success: true, page: pageName, navigatedTo: path };
  }
  // --- Fin Funciones de Herramientas ---

const initializeAndConnectGeminiAPI = useCallback(async () => {
    if (!mountedRef.current) {
        console.warn("MarceChat: [initializeAndConnectGeminiAPI] Intento de ejecutar en componente no montado. Abortando.");
        return false;
    }
    console.log("MarceChat: [initializeAndConnectGeminiAPI] Creando instancia de GeminiLiveAPI...");
    const api = new GeminiLiveAPI(geminiApiKey, true, null);
    geminiApiRef.current = api; // Asignar inmediatamente

    api.onSetupComplete = () => {
     if (!mountedRef.current) return; // <<<< AÑADIR ESTA VERIFICACIÓN
     console.log('MarceChat Callback: API Setup Complete.');
 };
    api.onTextData = (text, isFinal) => {
        if (!mountedRef.current) return;
        console.log(`MarceChat Callback: API TextData (Final: ${isFinal}):`, text);
        // Tu lógica para mostrar texto aquí
    };
    api.onAudioData = async (samplesInt16Array, audioParams) => {
        if (!mountedRef.current) return;
        console.log(`MarceChat Callback: API AudioData (SAMPLES) Recibidos. Samples: ${samplesInt16Array?.length}, Params:`, audioParams);
        await playAudioWithWavefile(samplesInt16Array, audioParams); // playAudioData necesita ser useCallback o definido fuera
    };
    api.onToolCall = async (toolCall) => {
        if (!mountedRef.current) {
            console.warn("MarceChat: [onToolCall] ignorado, componente no montado.");
            return;
        }
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.log('MarceChat Callback: api.onToolCall RECIBIDO:', JSON.stringify(toolCall, null, 2));
        const functionCalls = toolCall.functionCalls;
        const functionResponses = [];
        for (const call of functionCalls) {
            console.log(`MarceChat: Procesando functionCall: ${call.name}`, "Args:", call.args);
            let responsePayload = { success: true };
            try {
                if (call.name === 'navigate_to') {
                    responsePayload = await navigate_to(call.args.page);
                } else if (call.name === "close_connection") {
                    await close_connection(); // Esto podría llamar a stopStream
                                          // lo que podría cambiar isStreaming.
                                          // Si close_connection es llamado por el modelo,
                                          // el stream debe terminar.
                } else if (call.name === "advance_flow") {
                    await advance_flow();
                } else if (call.name === "show_details") { // Asumiendo que esta es la correcta, antes 'update_details'
                    await update_details();
                } else {
                    console.warn(`Función ${call.name} no implementada.`);
                    responsePayload = { success: false, error: `Función ${call.name} no implementada.` };
                }
            } catch (toolError) {
                console.error(`Error ejecutando la herramienta ${call.name}:`, toolError);
                responsePayload = { success: false, error: `Error en ${call.name}: ${toolError.message}` };
            }
            functionResponses.push({
                id: call.id,
                name: call.name,
                response: { result: { object_value: responsePayload } }
            });
        }
        if (mountedRef.current && geminiApiRef.current && functionResponses.length > 0) {
            console.log("MarceChat: Enviando respuestas de herramientas a GeminiLiveAPI:", functionResponses);
            geminiApiRef.current.sendToolResponse(functionResponses);
        }
    };

    api.onInterrupted = () => {
      if (!mountedRef.current) return;
      console.log('MarceChat Callback: API Interrupted.');
      if (currentAudioSourceNode.current) {
        currentAudioSourceNode.current.onended = null;
        try { currentAudioSourceNode.current.stop(); } catch (e) { /* ignore */ }
        currentAudioSourceNode.current.disconnect();
        currentAudioSourceNode.current = null;
      }
      audioPlaybackQueue.current = [];
      isPlayingRef.current = false;
    };
    
    api.onClose = (closeEvent) => {
        if (!mountedRef.current) {
         console.warn("MarceChat Callback: api.onClose IGNORADO porque el componente ya no está montado.");
         return;
     }
        console.error('MarceChat Callback: api.onClose - LA CONEXIÓN DEL SDK SE CERRÓ.');
        console.error(`MarceChat onClose Detalle - Código: ${closeEvent?.code}, Razón: "${closeEvent?.reason}", Limpio: ${closeEvent?.wasClean}`);
        const currentIsStreaming = isStreamingRef.current;
        if (currentIsStreaming) {
            const closeMessage = `Conexión cerrada (API): ${closeEvent?.code} - ${closeEvent?.reason || 'sin razón específica'}`;
            setError(prev => prev ? `${prev} | ${closeMessage}` : closeMessage);
            console.log("MarceChat: [api.onClose] Estableciendo isStreaming a false.");
            setIsStreaming(false);
        }
    };

    api.onError = (errorMsg) => {
        if (!mountedRef.current) {
         console.warn("MarceChat Callback: api.onError IGNORADO porque el componente ya no está montado.");
         return;
     }
        console.error('MarceChat Callback: api.onError - ERROR REPORTADO POR LA API DEL SDK.');
        console.error('MarceChat onError Detalle:', errorMsg);
        const currentIsStreaming = isStreamingRef.current;
        setError(prev => prev ? `${prev} | Error API: ${errorMsg}` : `Error API: ${errorMsg}`);
        if (currentIsStreaming) {
            console.log("MarceChat: [api.onError] Error en API, estableciendo isStreaming a false.");
            setIsStreaming(false);
        }
    };

    try {
        console.log("MarceChat: [initializeAndConnectGeminiAPI] Intentando conectar la instancia (api.connect())...");
        await api.connect();
        console.log("MarceChat: [initializeAndConnectGeminiAPI] Llamada a api.connect() completada.");

        if (!mountedRef.current) { // Volver a chequear después del await
            console.warn("MarceChat: [initializeAndConnectGeminiAPI] Componente desmontado DESPUÉS de api.connect(). Limpiando sesión si existe.");
            await api.disconnect(); // Desconectar la sesión recién creada
            return false;
        }

        if (!api.isConnected()) {
            console.error("MarceChat: [initializeAndConnectGeminiAPI] api.connect() completó, pero la sesión interna NO está activa.");
            setError(prevError => prevError || "Fallo la conexión de sesión SDK post-connect (silencioso en API).");
            return false;
        } else {
            console.log("MarceChat: [initializeAndConnectGeminiAPI] Conexión con SDK GeminiLiveAPI establecida y verificada.");
            return true;
        }
    } catch (error) {
        console.error("MarceChat: [initializeAndConnectGeminiAPI] Error explícito ATRAPADO (proveniente de api.connect()):", error);
        if (mountedRef.current) { // Solo setear error si aún está montado
            const displayMessage = error.message || (typeof error === 'string' ? error : "Error desconocido al conectar.");
            setError(prevError => prevError || `Fallo al conectar (catch en init): ${displayMessage}`);
        }
        return false;
    }
  // }, [geminiApiKey, navigate, playAudioData]); // Añadir playAudioData si es un useCallback
  // Para hacerlo más estable, playAudioData también debería ser useCallback o definido fuera.
  // Si playAudioData depende de refs, no necesita estar en las dependencias.
  // Por ahora, asumimos que playAudioData es estable o no causa problemas aquí.
  // Las dependencias principales son las que cambian y fuerzan la re-creación de esta función.
  }, [geminiApiKey, navigate]);

  const stopStreamInternalLogic = useCallback(async (calledFromUnmount = false) => {
    // Esta función debe ser estable o sus dependencias muy controladas.
    // Usa refs para acceder a geminiApiRef, audioInputRef, etc.
    console.log(`MarceChat: [stopStreamInternalLogic] Ejecutando. isStreamingRef.current: ${isStreamingRef.current}`);

    if (audioInputRef.current) {
        console.log("MarceChat: [stopStreamInternalLogic] Limpiando recursos de audio input...");
        audioInputRef.current.stream?.getTracks().forEach(track => track.stop());
        audioInputRef.current.processor?.disconnect();
        audioInputRef.current.source?.disconnect();
        audioInputRef.current = null;
    }
    if (currentAudioSourceNode.current) {
        console.log("MarceChat: [stopStreamInternalLogic] Limpiando nodo de reproducción de audio...");
        currentAudioSourceNode.current.onended = null;
        try { currentAudioSourceNode.current.stop(); } catch (e) { /* ignorar */ }
        currentAudioSourceNode.current.disconnect();
        currentAudioSourceNode.current = null;
    }
    audioPlaybackQueue.current = [];
    isPlayingRef.current = false;

    const api = geminiApiRef.current;
    if (api) { // No es necesario chequear api.isConnected() aquí, disconnect debe ser idempotente
      console.log(`MarceChat: [stopStreamInternalLogic] Desconectando instancia de GeminiLiveAPI.`);
      await api.disconnect(); // disconnect en GeminiLiveAPI ahora maneja la bandera 'connectionAttemptCancelled'
    }
    
    // Solo anular geminiApiRef si no estamos en el proceso de unmount,
    // ya que el unmount se encarga de la "destrucción" de la instancia del componente.
    // O, mejor aún, anularlo siempre para asegurar limpieza.
    geminiApiRef.current = null;

    // Solo llamar a setIsStreaming(false) si el componente todavía está montado
    // Y si el estado actual es true (para evitar renders innecesarios)
    if (mountedRef.current && isStreamingRef.current) {
        console.log("MarceChat: [stopStreamInternalLogic] Estableciendo isStreaming a false.");
        setIsStreaming(false);
    }
    console.log("MarceChat: [stopStreamInternalLogic] Finalizado.");
  // }, []); // HACIENDO ESTO ESTABLE: Dependencias mínimas.
  // Las funciones como setIsStreaming tienen identidad estable.
  // Si necesita leer otros estados, debe usar refs.
  }, [setIsStreaming]); // setIsStreaming es estable. Si necesita otros setters, añadirlos.

  
  const startStream = useCallback(async () => {
    console.log("MarceChat: [startStream] Iniciando. isStreamingRef.current:", isStreamingRef.current);

    if (isStreamingRef.current || geminiApiRef.current?.isConnected()) {
        console.warn("MarceChat: [startStream] Ya en streaming o conectado. Limpiando primero...");
        await stopStreamInternalLogic();
        await new Promise(resolve => setTimeout(resolve, 100)); // Pequeña pausa para que el estado se asiente
    }

    console.log("MarceChat: [startStream] Estableciendo isStreaming a true.");
    setIsStreaming(true); // Esto causará un re-render. useEffect actualizará isStreamingRef.current
    setError(null);

    // Esperar al siguiente ciclo de tick para que el estado de isStreaming y el ref se actualicen
    await new Promise(resolve => setTimeout(resolve, 0)); 

    if (!mountedRef.current) {
        console.warn("MarceChat: [startStream] Componente desmontado ANTES de initializeAndConnectGeminiAPI. Abortando.");
        return;
    }
    
    console.log("MarceChat: [startStream] isStreamingRef.current ANTES de initializeAndConnectGeminiAPI:", isStreamingRef.current);
    const connectSuccess = await initializeAndConnectGeminiAPI();

    console.log("MarceChat: [startStream] DESPUÉS de initializeAndConnectGeminiAPI. connectSuccess:", connectSuccess, "API conectada AHORA:", geminiApiRef.current?.isConnected());
    console.log("MarceChat: [startStream] Valor de isStreamingRef.current en este punto:", isStreamingRef.current);

    if (!mountedRef.current) {
        console.warn("MarceChat: [startStream] Componente desmontado DESPUÉS de initializeAndConnectGeminiAPI. Abortando.");
        return;
    }

    if (!connectSuccess || !geminiApiRef.current?.isConnected()) {
        console.error("MarceChat: [startStream] La conexión falló o se perdió. connectSuccess:", connectSuccess, "isConnected:", geminiApiRef.current?.isConnected());
        if (isStreamingRef.current) {
            console.log("MarceChat: [startStream] Estableciendo isStreaming a false debido a fallo/pérdida de conexión.");
            setIsStreaming(false); 
        }
        return;
    }

    try {
        if (!isStreamingRef.current) { // Chequeo final con el ref
            console.warn("MarceChat: [startStream] isStreamingRef.current es false ANTES de llamar a startAudioInputStream. Abortando.");
            return;
        }
        console.log("MarceChat: [startStream] API conectada y isStreamingRef.current es true. Iniciando stream de audio...");
        await startAudioInputStream();
        console.log("MarceChat: [startStream] startAudioInputStream aparentemente completado.");
    } catch (streamError) {
        console.error("MarceChat: [startStream] Error ATRAPADO durante startAudioInputStream:", streamError);
        if (mountedRef.current) {
            setError(`Error de stream de audio: ${streamError.message || streamError}`);
            if (isStreamingRef.current) {
                await stopStreamInternalLogic();
            }
        }
    }
  }, [initializeAndConnectGeminiAPI, stopStreamInternalLogic, setIsStreaming, setError]);


const startAudioInputStream = async () => {
  if (!mountedRef.current) {
        console.warn("MarceChat: [startAudioInputStream] Abortado, componente no montado.");
        return;
    }
  if (!geminiApiRef.current?.isConnected()) { // Usar isConnected() de la clase API
    console.error("MarceChat: geminiApiRef.current no está conectado en startAudioInputStream.");
    setError("Error interno: API no conectada para iniciar audio.");
    // setIsStreaming(false); // stopStreamInternalLogic lo manejará si es necesario
    await stopStreamInternalLogic(false); // Limpiar si la API no está lista
    return;
  }
  console.log("MarceChat: [startAudioInputStream] Iniciando configuración de audio. isStreamingRef.current:", isStreamingRef.current);

  // Asegurarse que el AudioContext está activo (especialmente después de inactividad de la página)
  if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        console.log("MarceChat: [startAudioInputStream] Creando nuevo AudioContext.");
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    } else if (audioContextRef.current.state === 'suspended') {
        console.log("MarceChat: [startAudioInputStream] Resumiendo AudioContext suspendido.");
        try {
            await audioContextRef.current.resume();
        } catch (resumeError) {
      console.error("MarceChat: Error al resumir AudioContext:", resumeError);
      setError("Error al activar audio: " + resumeError.message);
      await stopStreamInternalLogic(false);
      return;
    }
  }

  try {
    console.log("MarceChat: [startAudioInputStream] Solicitando getUserMedia.");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("MarceChat: [startAudioInputStream] getUserMedia exitoso.");

        if (!mountedRef.current || !isStreamingRef.current) { // Doble chequeo después de await
            console.warn("MarceChat: [startAudioInputStream] Componente desmontado o streaming detenido DESPUÉS de getUserMedia. Abortando configuración de procesador.");
            stream.getTracks().forEach(track => track.stop()); // Detener tracks si ya no se necesitan
            return;
        }

        const source = audioContextRef.current.createMediaStreamSource(stream);
        const processor = audioContextRef.current.createScriptProcessor(512, 1, 1); // Usa el buffer size de tus logs
        console.log("MarceChat: [startAudioInputStream] ScriptProcessorNode creado. Buffer size:", processor.bufferSize);

        processor.onaudioprocess = (e) => {
            // ***** AJUSTE CRÍTICO EN LA CONDICIÓN Y EL LOG *****
            if (geminiApiRef.current?.isConnected() && isStreamingRef.current) {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmData = float32ToPcm16(inputData);
                const base64Data = btoa(String.fromCharCode.apply(null, new Uint8Array(pcmData.buffer)));
                geminiApiRef.current.sendAudioChunk(base64Data);
            } else {
                // Este log ahora usa isStreamingRef.current para ser preciso
                if (audioInputRef.current) { // Solo loguea si el input de audio estaba activo
                    if (!isStreamingRef.current) {
                        console.warn(`MarceChat: [onaudioprocess] NO SE ENVÍA AUDIO porque isStreamingRef.current es: ${isStreamingRef.current}`);
                    }
                    if (!geminiApiRef.current?.isConnected()) {
                        console.warn("MarceChat: [onaudioprocess] NO SE ENVÍA AUDIO porque API no está conectada.");
                    }
                }
            }
        };

    source.connect(processor);
    processor.connect(audioContextRef.current.destination); // Necesario para que onaudioprocess funcione

    audioInputRef.current = { source, processor, stream, context: audioContextRef.current };
    console.log("MarceChat: Stream de audio del micrófono iniciado y procesador conectado.");
    console.log(`MarceChat: [startAudioInputStream] FINALIZANDO. isStreamingRef.current: ${isStreamingRef.current}, API conectada: ${geminiApiRef.current?.isConnected()}`);

    // **NUEVO AJUSTE OPCIONAL: Enviar un "ping" o señal de inicio si es necesario**
    // A veces, enviar un primer mensaje de "estoy aquí y escuchando" puede ayudar.
    // Esto es especulativo y depende del comportamiento exacto del modelo.
    // if (geminiApiRef.current?.isConnected()) {
    //   console.log("MarceChat: Enviando señal inicial post-micrófono (turno no completo).");
    //   geminiApiRef.current.sendClientTurns([], false); // Envía un turno de usuario vacío, no completo
    // }

  } catch (err) {
    console.error('MarceChat: Fallo al acceder al micrófono o configurar el procesador:', err);
    setError('Fallo al acceder al micrófono: ' + err.message);
    await stopStreamInternalLogic(false);
  }
};

  const stopStream = useCallback(async () => { // Hacerla async si las operaciones internas lo son
    console.log("MarceChat: stopStream (acción de usuario con SDK) llamado.");
    await stopStreamInternalLogic(true);
  }, [stopStreamInternalLogic]);

  useEffect(() => {
    let intervalId = null;
    const captureScreenshotAndSend = async () => { // Hacerla async
      const api = geminiApiRef.current;
      if (api?.isConnected() && isStreaming) { // Usar api.isConnected()
        // ... (lógica de html2canvas igual)
        // const base64image = ...;
        // const messageForGeminiApiClass = { ... } // No, ahora usamos el método de la clase
        // await api.sendMessage(messageForGeminiApiClass); // NO, usar método específico si existe
        // EN LUGAR DE CONSTRUIR EL MENSAJE AQUÍ, LLAMAR AL MÉTODO DE LA CLASE:
        // await api.sendImage(base64image, "image/jpeg"); // Asumiendo que creaste este método en GeminiLiveAPI
      }
    };
    // ... (lógica del intervalo igual)
    // Ejemplo de cómo enviar imagen usando el método de la clase:
    const captureAndSend = async () => {
        const api = geminiApiRef.current;
        if (api?.isConnected() && isStreaming) {
            console.log("MarceChat SDK: Intentando captura de pantalla...");
            const captureElement = document.querySelector('#root') || document.body;
            try {
                const canvas = await html2canvas(captureElement, { /* ... opciones ... */ });
                const base64image = canvas.toDataURL("image/jpeg", 0.5).split(',')[1];
                await api.sendImage(base64image, "image/jpeg"); // Método de la clase API
                console.log('MarceChat SDK: Screenshot enviado vía sendImage.');
            } catch (error) {
                console.error('MarceChat SDK: Error en captura o envío de screenshot:', error);
            }
        }
    };
    if (isStreaming) {
        // captureAndSend(); // Inmediato
        // intervalId = setInterval(captureAndSend, 5000);
    } // Lógica de intervalo igual

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isStreaming]); // geminiApiRef no necesita ser dependencia aquí si se accede a .current

const decodeAndPrepareAudio = useCallback(async (base64AudioData, mimeType) => {
        console.log("decodeAndPrepareAudio - MimeType recibido:", mimeType);
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            console.log("decodeAndPrepareAudio: Creando/Recreando AudioContext.");
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        } else if (audioContextRef.current.state === 'suspended') {
            console.log("decodeAndPrepareAudio: Resumiendo AudioContext suspendido.");
            await audioContextRef.current.resume();
        }

        // 1. Decodificar Base64 a Uint8Array (datos PCM crudos)
        const binaryString = atob(base64AudioData);
        const pcmData = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            pcmData[i] = binaryString.charCodeAt(i);
        }
        console.log("decodeAndPrepareAudio: Longitud datos PCM crudos (bytes):", pcmData.byteLength);

        // 2. Parsear MimeType para obtener parámetros de audio
        const audioParams = parseAudioMimeType(mimeType); // Usa la nueva función
        console.log("decodeAndPrepareAudio: Parámetros de audio parseados:", audioParams);


        // 3. Crear encabezado WAV
        const header = createWavHeader(pcmData.byteLength, audioParams);
        console.log("decodeAndPrepareAudio: Encabezado WAV creado, longitud (bytes):", header.byteLength);

        // 4. Concatenar encabezado y datos PCM
        const wavBytes = new Uint8Array(header.byteLength + pcmData.byteLength);
        wavBytes.set(new Uint8Array(header), 0);
        wavBytes.set(pcmData, header.byteLength);
        console.log("decodeAndPrepareAudio: Datos WAV completos (header + PCM), longitud (bytes):", wavBytes.byteLength);


        // 5. Decodificar el ArrayBuffer del WAV completo
        try {
            // decodeAudioData espera un ArrayBuffer
            const audioBuffer = await audioContextRef.current.decodeAudioData(wavBytes.buffer);
            console.log("decodeAndPrepareAudio: Audio decodificado exitosamente a AudioBuffer.");
            return audioBuffer;
        } catch (decodeError) {
            console.error("Error al DECODIFICAR datos WAV construidos:", decodeError);
            console.error("Parámetros usados para WAV:", audioParams);
            console.error("Longitud PCM data:", pcmData.byteLength, "Longitud Header:", header.byteLength);
            setError(`Error al decodificar audio WAV: ${decodeError.message}`);
            throw decodeError;
        }
    }, []); // audioContextRef es un ref, no necesita ser dependencia si no cambia su asignación.

    const playNextInQueue = useCallback(async () => {
    if (audioPlaybackQueue.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }
    // No reproducir si ya algo está sonando (aunque la lógica de playAudioData debería prevenir esto)
    if (isPlayingRef.current && currentAudioSourceNode.current) { 
      return;
    }

    const audioBufferToPlay = audioPlaybackQueue.current.shift(); 
    
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      console.warn("AudioContext para reproducción no está listo o está cerrado.");
      isPlayingRef.current = false; 
      // Reintentar inicializar si es necesario o manejar el error
      return;
    }
     if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
    }

    try {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferToPlay;
      source.connect(audioContextRef.current.destination);
      currentAudioSourceNode.current = source;
      isPlayingRef.current = true;
      
      source.onended = () => {
        // Solo procesar 'onended' si este source es el que realmente terminó.
        if (currentAudioSourceNode.current === source) { 
          isPlayingRef.current = false;
          currentAudioSourceNode.current.disconnect(); // Limpiar conexión del source
          currentAudioSourceNode.current = null; 
          playNextInQueue(); 
        }
      };
      source.start();
    } catch (e) {
      console.error("Error al reproducir AudioBuffer de ElevenLabs:", e);
      setError("Error en reproducción de audio: " + e.message);
      isPlayingRef.current = false; 
      if (currentAudioSourceNode.current) {
          currentAudioSourceNode.current.disconnect();
      }
      currentAudioSourceNode.current = null;
    }
  }, []); 


  const playAudioData = useCallback(async (base64AudioData, mimeType) => { // Ahora acepta mimeType
        try {
            // Pasar mimeType a decodeAndPrepareAudio
            const newAudioBuffer = await decodeAndPrepareAudio(base64AudioData, mimeType);
            
            if (currentAudioSourceNode.current) {
                currentAudioSourceNode.current.onended = null;
                try { currentAudioSourceNode.current.stop(); } catch (e) { /* ignorar */ }
                currentAudioSourceNode.current.disconnect();
                currentAudioSourceNode.current = null;
            }
            audioPlaybackQueue.current = [newAudioBuffer];
            isPlayingRef.current = false;
            
            if (!isPlayingRef.current) {
                playNextInQueue();
            }
        } catch (e) {
            console.error("Error en playAudioData (posiblemente de decodeAndPrepareAudio):", e);
            // setError ya debería estar seteado por decodeAndPrepareAudio si el error fue allí
        }
    }, [decodeAndPrepareAudio, playNextInQueue]);

  useEffect(() => {
    mountedRef.current = true;
    console.log("MarceChat: Componente REALMENTE MONTADO (useEffect []).");

    return () => {
      mountedRef.current = false;
      console.log("MarceChat: Componente REALMENTE DESMONTÁNDOSE (useEffect [] cleanup). Limpiando...");
      
      // Lógica de stopStreamInternalLogic directamente aquí o una versión simplificada para unmount
      const api = geminiApiRef.current;
      if (api) {
        api.disconnect(); // Marcará la conexión como cancelada en la instancia de GeminiLiveAPI
      }
      if (audioInputRef.current) {
        audioInputRef.current.stream?.getTracks().forEach(track => track.stop());
        audioInputRef.current.processor?.disconnect();
        audioInputRef.current.source?.disconnect();
        audioInputRef.current = null;
      }
      // ... (limpieza de currentAudioSourceNode, etc.)
      // No llamar a setIsStreaming(false) aquí, el estado se destruye con el componente.
    };
  }, []);

  return (
    <div>
      <div className="flex gap-4 p-4">
        {!isStreaming ? (
          <EvaButtonStateOne 
            isStreaming={isStreaming} 
            startStream={startStream}
          />
        ) : (
          <EvaButtonStateTwo 
            stopStream={stopStream}
          />
        )}
      </div>
      {error && <p className="text-red-500 fixed bottom-2 left-2 bg-white p-2 rounded shadow z-50">Error: {error}</p>}
    </div>
  );
}