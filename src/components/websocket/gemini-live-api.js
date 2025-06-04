import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Modality } from '@google/genai';
import { ElevenLabsClient } from 'elevenlabs'; // Importar el cliente de Eleven Labs

// Configura tu clave API de Eleven Labs de forma segura (preferiblemente mediante variables de entorno)
const ELEVENLABS_API_KEY = 'sk_ec362670c88570ca3ec2537964b1afe4bd7a91f4ecf8c78e';
const ELEVENLABS_VOICE_ID = 'QtuQlibCvdX2iBrV4laj'; // Ejemplo: Voz "Rachel" de ElevenLabs, reemplaza si es necesario
//const apiKey = 'AIzaSyBsBmlnPIV76UoM4HfeCehv-AP9T8MJiSA'; 

export class GeminiLiveAPI {
  constructor(geminiApiKey, autoSetup = true, setupConfig = null) {
    this.geminiApiKey = geminiApiKey;
    this.ai = new GoogleGenAI({apiKey: this.geminiApiKey});
    console.log("Inicializando Gemini Live API con clave:", geminiApiKey);    
    this.session = null; // Se inicializará en connect

    this.onSetupComplete = () => {};
    this.onTextData = (text, isFinal) => {};
    this.onAudioData = (audioBase64, mimeType) => {};
    this.onInterrupted = () => {};
    this.onTurnComplete = () => {};
    this.onError = (error) => {}; // Acepta un objeto Error o string
    this.onClose = (event) => {}; // Acepta un objeto CloseEvent o similar
    this.onToolCall = (toolCall) => {}; // Acepta el objeto toolCall del SDK
    this.connectionAttemptCancelled = false;

    this.autoSetup = autoSetup; // El SDK maneja el setup en connect()
    this.setupConfig = setupConfig; // Configuración personalizada para el modelo

    this.audioSampleAccumulator = []; // Para acumular los samples Int16 como números
    this.currentAudioParams = null;   // Para guardar { sampleRate, numChannels, bitsPerSample }
    this.onAudioData = (samples, audioParams) => {};

    this.elevenLabsClient = new ElevenLabsClient({
      apiKey: ELEVENLABS_API_KEY,
    });
    this.currentTurnTextAccumulator = "";

    // La conexión y el setup se inician explícitamente con un método `connect`
  }

  async processAudioStreamForBrowser(audioStream) {
    if (!(audioStream instanceof ReadableStream)) {
      if (audioStream instanceof Blob) {
        const arrayBuffer = await audioStream.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binaryString = '';
        const chunkSize = 8192;
        for (let i = 0; i < uint8Array.byteLength; i += chunkSize) {
          binaryString += String.fromCharCode.apply(null, uint8Array.subarray(i, i + chunkSize));
        }
        return btoa(binaryString);
      } else {
        throw new Error("Formato de stream de ElevenLabs no reconocido o no es ReadableStream.");
      }
    } else {
      const reader = audioStream.getReader();
      const chunksArray = [];
      let totalLength = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunksArray.push(value);
          totalLength += value.length;
        }
      }
      const concatenatedUint8Array = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunksArray) {
        concatenatedUint8Array.set(chunk, offset);
        offset += chunk.length;
      }
      let binaryString = '';
      const chunkSize = 8192; // Re-aplicar chunking para btoa si es necesario por límites de String.fromCharCode
      for (let i = 0; i < concatenatedUint8Array.byteLength; i += chunkSize) {
          binaryString += String.fromCharCode.apply(null, concatenatedUint8Array.subarray(i, i + chunkSize));
      }
      return btoa(binaryString);
    }
  }

  async connect() {
    this.connectionAttemptCancelled = false;
    if (this.session) {
      console.warn("Ya existe una sesión activa. Desconéctate primero si quieres reiniciar.");
      return;
    }

    const modelConfig = this.setupConfig || this.getDefaultModelConfig();    
    const liveRequestOptions = { responseModalities: [Modality.AUDIO],
      speechConfig: { // Nuevo campo para claridad
            audioEncoding: "LINEAR_16",
            //audioEncoding: AudioEncoding.MP3, // Solicitar MP3 para facilitar la reproducción en el navegador
            voiceConfig: {
                prebuiltVoiceConfig: {
                    voiceName: "Orus" // Puedes probar otras voces preconstruidas disponibles
                    // Consulta la documentación de Gemini para nombres de voces válidos.
                    // Ejemplo de voz femenina podría ser "gemini-pro- női (hungarian) o similar, busca en la doc.
                    // Por ahora, Zephyr es un placeholder común.
                }
            },
            speechConfig: { languageCode: "	es-US" }
        },
      systemInstruction: modelConfig.system_instruction, // Puedes mantenerlos si la Prueba 1 de simplificación no funcionó
        tools: modelConfig.tools
        }

    try {
      console.log('Iniciando conexión con Gemini Live API usando SDK...');
      this.session = await this.ai.live.connect({
        model: modelConfig.model, // e.g., "models/gemini-2.0-flash-live-001"                    
        callbacks: {
          onopen: () => {
                    if (this.connectionAttemptCancelled) {
                        console.warn("SDK Callback: onopen - Conexión establecida, PERO YA HABÍA SIDO CANCELADA. Cerrando inmediatamente.");
                        this.session?.close(); // Intentar cerrar la sesión recién abierta
                        this.session = null;
                        return;
                    }
                    console.log('SDK Callback: onopen - Conexión WebSocket establecida.');
                    this.onSetupComplete();
            },
          onmessage: (message) => {
            if (this.connectionAttemptCancelled || !this.session) return;
            this.handleSDKMessage(message);
          },
          onerror: (errorEvent) => {
            console.error('SDK Callback: onerror - Error en WebSocket:', errorEvent);
            const errorMessage = errorEvent.message || (errorEvent.type ? `WebSocket error type: ${errorEvent.type}` : 'Error desconocido en WebSocket del SDK');
            this.onError(errorMessage); // Propaga el error
            this.currentTurnTextAccumulator = "";
          },
          onclose: (closeEvent) => { // El SDK proporciona un CloseEvent
            // ***** AJUSTE CRÍTICO AQUÍ *****
            console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            console.error('SDK Callback: onclose - Conexión WebSocket CERRADA.');
            console.error(`SDK onclose - Código: ${closeEvent.code}`);
            console.error(`SDK onclose - Razón: "${closeEvent.reason}"`);
            console.error(`SDK onclose - ¿Fue Limpio?: ${closeEvent.wasClean}`);
            console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            
            this.onClose(closeEvent); // Propaga el evento completo
            this.currentTurnTextAccumulator = "";
            this.session = null; // Importante: limpiar la sesión
          },
        },
        config : liveRequestOptions,
      });
      if (this.connectionAttemptCancelled) {
            console.warn("SDK: Sesión asignada, PERO la conexión fue cancelada mientras tanto. Cerrando.");
            await this.session?.close();
            this.session = null;
        } else if (this.session) {
            console.log("SDK: Sesión de Gemini Live API (this.session) asignada exitosamente y NO cancelada.");
        } else {
            // Esto podría ocurrir si onopen se canceló y puso session a null
            console.warn("SDK: this.ai.live.connect resolvió, pero this.session es null (posiblemente cancelado en onopen).");
        }
      console.log("SDK: Sesión de Gemini Live API (this.session) asignada exitosamente.");
    } catch (connectionError) {
        if (this.connectionAttemptCancelled) {
            console.warn("SDK: Fallo en this.ai.live.connect(), pero la conexión ya había sido marcada como cancelada:", connectionError.message);
        } else {
            console.error("SDK: Fallo CRÍTICO durante this.ai.live.connect():", connectionError);
            // ... (tu logging de error) ...
            this.onError(/* ... */);
        }
        this.session = null; // Asegurar que la sesión sea nula
        // No relanzar el error si fue cancelado, para evitar que el catch en MarceChat.jsx muestre un error de "cancelación" como si fuera una falla de conexión.
        if (!this.connectionAttemptCancelled) {
             throw connectionError;
        }
    }
}

  _parseMimeTypeForAudioParams(mimeTypeStr) {
    let sampleRate = 24000; // Default basado en el ejemplo de Node.js
    let numChannels = 1;    // Default mono
    const bitsPerSample = 16; // Gemini envía PCM 16-bit

    if (mimeTypeStr) {
        const rateMatch = mimeTypeStr.match(/rate=(\d+)/i);
        if (rateMatch && rateMatch[1]) {
            sampleRate = parseInt(rateMatch[1], 10);
        }
        const channelsMatch = mimeTypeStr.match(/channels=(\d+)/i);
        if (channelsMatch && channelsMatch[1]) {
            numChannels = parseInt(channelsMatch[1], 10);
        }
    }
    const params = { sampleRate, numChannels, bitsPerSample };
    console.log("SDK [_parseMimeTypeForAudioParams]: MimeType In:", mimeTypeStr, "Params Out:", params);
    return params;
  }

  async handleSDKMessage(sdkMessage) {
    console.log("------------------- SDK NUEVO MENSAJE (MODO AUDIO GEMINI + WAVEFILE) -------------------");
    console.log("Mensaje SDK Recibido:", JSON.stringify(sdkMessage, null, 2));

    if (sdkMessage.toolCall) { /* ... (manejo de toolCall como antes) ... */ }

    if (sdkMessage.serverContent) {
        const modelTurn = sdkMessage.serverContent.modelTurn;
        let audioChunkProcessedThisMessage = false;

        if (modelTurn && modelTurn.parts && modelTurn.parts.length > 0) {
            for (const part of modelTurn.parts) {
                if (part.text) {
                    this.currentTurnTextAccumulator += part.text;
                    this.onTextData(this.currentTurnTextAccumulator, false);
                }
                if (part.inlineData && part.inlineData.data && part.inlineData.mimeType?.startsWith('audio/')) {
                    console.log("SDK: Procesando audio part. MimeType:", part.inlineData.mimeType);
                    if (!this.currentAudioParams) { // Si es el primer chunk de audio de esta "sesión de habla"
                        this.currentAudioParams = this._parseMimeTypeForAudioParams(part.inlineData.mimeType);
                    }
                    
                    // Decodificar Base64 a ArrayBuffer
                    const binaryString = atob(part.inlineData.data);
                    const len = binaryString.length;
                    const bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    
                    // Crear Int16Array a partir del ArrayBuffer de los bytes PCM
                    // Asegurarse de que el ArrayBuffer se interpreta correctamente
                    const samples = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / Int16Array.BYTES_PER_ELEMENT);
                    
                    // Acumular los samples (como números)
                    for (let i = 0; i < samples.length; i++) {
                        this.audioSampleAccumulator.push(samples[i]);
                    }
                    audioChunkProcessedThisMessage = true;
                }
            }
        }

        const isTurnComplete = !!sdkMessage.serverContent.turnComplete;
        if (isTurnComplete) {
            console.log("SDK: Turno completo.");
            this.onTurnComplete();
            if (this.currentTurnTextAccumulator.trim().length > 0) {
                this.onTextData(this.currentTurnTextAccumulator.trim(), true);
                this.currentTurnTextAccumulator = "";
            }

            if (this.audioSampleAccumulator.length > 0 && this.currentAudioParams) {
                console.log(`SDK: Enviando ${this.audioSampleAccumulator.length} samples acumulados con params:`, this.currentAudioParams);
                const finalSamplesInt16Array = new Int16Array(this.audioSampleAccumulator);
                this.onAudioData(finalSamplesInt16Array, this.currentAudioParams); // NUEVA FIRMA
                
                // Resetear para la próxima vez
                this.audioSampleAccumulator = [];
                this.currentAudioParams = null;
            } else if (audioChunkProcessedThisMessage) {
                // Esto podría pasar si el último mensaje tenía audio pero el acumulador no se considera listo
                // o si currentAudioParams no se seteó. Revisa logs.
                console.warn("SDK: Turno completo con audio procesado en este mensaje, pero el acumulador está vacío o faltan params. Samples:", this.audioSampleAccumulator.length, "Params:", this.currentAudioParams);
            }
        }
    } else if (sdkMessage.error) { // Manejo de errores a nivel de mensaje del SDK
        console.error("SDK: Mensaje de error recibido del servidor Gemini:", sdkMessage.error);
        this.onError(sdkMessage.error.message || JSON.stringify(sdkMessage.error));
    }
  }
  

  getDefaultModelConfig() {
    const PROMPT = `<identidad>
    <nombre>PACO</nombre>
    <rol>Asistente virtual bancario especializado en créditos de libranza</rol>
    <funcion>Guía experto en proceso de crédito de libranza pre-aprobado y navegación de interfaz crediticia</funcion>
    <personalidad>Competente, confiable, atento y ligeramente cálido con expertise bancario</personalidad>
    <idioma>Español (Colombia)</idioma>
</identidad>
<mandatory>
Expresión de todos los números y valores en ESPAÑOL, recuerda que debes omitir los decimales (ej: $3.328,09 equivale a tres mil trecientos ventiocho pesos) y evitar ser repetitivo a menos que te lo soliciten.
</mandatory>
<conocimiento_experto>
    <especializacion>Créditos de libranza y productos financieros bancario</especializacion>
    <contexto_principal>
        <credito_preaprobado>
            <monto>Dieciocho millones de pesos ($18.000.000)</monto>
            <tipo>Crédito de libranza pre-aprobado</tipo>
            <objetivo>Guiar al usuario a través del proceso de aceptación y documentación</objetivo>
            <condiciones>
                <tasa_efectiva_anual>18.5%</tasa_efectiva_anual>
                <valor_porcentual_total>19.2%</valor_porcentual_total>
                <cuota_mensual>$623.919</cuota_mensual>
                <plazo>72 meses</plazo>
            </condiciones>
        </credito_preaprobado>
    </contexto_principal>
    <areas_expertise>
        <area>
            <concepto>Valor Porcentual Total</concepto>
            <descripcion>Indicador que incluye la totalidad de costos del crédito: tasa de interés, seguros, comisiones y gastos administrativos. Permite comparar diferentes ofertas crediticias de manera transparente.</descripcion>
        </area>
        <area>
            <concepto>Tasa Efectiva Anual</concepto>
            <descripcion>Tasa real de interés que incluye capitalización y todos los costos financieros. Es la tasa verdadera que paga el cliente anualmente, más alta que la tasa nominal debido a la capitalización.</descripcion>
        </area>
        <area>
            <concepto>Seguro de Corrimiento</concepto>
            <descripcion>Póliza que protege al deudor ante el riesgo de pérdida de empleo o incapacidad temporal, cubriendo cuotas del crédito durante el período de desempleo o incapacidad certificada.</descripcion>
        </area>
        <area>
            <concepto>Valor Inicial</concepto>
            <descripcion>Monto base del crédito solicitado antes de aplicar intereses, seguros y gastos adicionales. Es el capital principal que el cliente requiere para su necesidad financiera.</descripcion>
        </area>
        <area>
            <concepto>Valor Total del Seguro</concepto>
            <descripcion>Suma completa de todas las primas de seguros asociados al crédito (vida, desempleo, corrimiento) durante toda la vigencia del préstamo, calculado según el perfil de riesgo del cliente.</descripcion>
        </area>
    </areas_expertise>
</conocimiento_experto>
<capacidades>
    <domina>
        <item>Lectura e interpretación de valores mostrados en pantalla (TEA, cuotas, plazos, seguros).</item>
        <item>Guía paso a paso en proceso de crédito de libranza pre-aprobado.</item>
        <item>Explicación detallada de condiciones crediticias mostradas en interfaz.</item>
        <item>Gestión del avance del proceso de solicitud del crédito, incluyendo la aprobación de documentos.</item>
        <item>Asesoría especializada en optimización de condiciones crediticias y comparación de productos.</item>
    </domina>
    <prohibido>
        <item>Ejecutar dar asesoría legal/fiscal, compartir datos sensibles o comparar bancos.</item>
        <item>Mencionar el uso de funciones salvo que se pregunte.</item>
        <item>Prometer aprobaciones crediticias o condiciones específicas sin evaluación formal.</item>
        <item>Avanzar el proceso sin confirmación explícita del usuario.</item>
    </prohibido>
</capacidades>
<interaccion>
    <estilo>Profesional experto, directo, educativo y enfocado en guiar el proceso crediticio.</estilo>
    <proceso_credito_libranza>
        <paso>Establecer presencia experta y revisar las condiciones del crédito pre-aprobado mostradas en pantalla.</paso>
        <paso>Explicar textualmente al usuario los valores visibles: TEA, cuota mensual, plazo, seguros, costos totales, entre otros.</paso>
        <paso>Consultar si el usuario desea continuar con el proceso basado en las condiciones mostradas.</paso>
        <paso>En caso afirmativo, ejecutar advance_flow automáticamente para proceder.</paso>
        <paso>Cuando aparezcan documentos para aprobación, preguntar específicamente si los aprueba.</paso>
        <paso>Si confirma aprobación de documentos, ejecutar advance_flow para continuar.</paso>
    </proceso_credito_libranza>
</interaccion>
<instrucciones_herramientas>
    <herramientas>
        <herramienta>
            <nombre>navigate_to</nombre>
            <descripcion>Navega a páginas de la aplicación (home, account, credit, card, pay, loan, invest, insurance, mortgage).</descripcion>
        </herramienta>
        <herramienta>
            <nombre>close_connection</nombre>
            <descripcion>Cierra la conexión al despedirse el usuario.</descripcion>
        </herramienta>
        <herramienta>
            <nombre>show_details</nombre>
            <descripcion>Muestra información adicional de tasas y costos para el crédito.</descripcion>
        </herramienta>
        <herramienta>
            <nombre>advance_flow</nombre>
            <descripcion>Avanza al paso siguiente para solicitar el crédito de libranza.</descripcion>
        </herramienta>
    </herramientas>
    <reglas_ejecucion>
        <regla>Presentar textualmente todos los valores mostrados en pantalla del crédito pre-aprobado de forma clara y detallada.</regla>
        <regla>Preguntar al usuario si desea continuar con el proceso después de explicar las condiciones.</regla>
        <regla>Cuando el usuario confirme continuar, ejecutar advance_flow inmediatamente sin preguntar nuevamente.</regla>
        <regla>En etapa de documentos, preguntar específicamente: "¿Aprueba estos documentos para continuar?"</regla>
        <regla>Si confirma aprobación de documentos, ejecutar advance_flow automáticamente.</regla>
        <regla>Usar close_connection cuando el usuario se despida.</regla>
        <regla>Ejecutar todas las funciones sin mencionarlas explícitamente al usuario.</regla>
        <regla>Mantener enfoque en guiar eficientemente el proceso de crédito de libranza.</regla>
    </reglas_ejecucion>
    <flujo_conversacion>
        <momento>Inicio</momento>
        <accion>Saluda y presentate</accion>
        <momento>Explorar Crédito de libranza</momento>
        <accion>Presentar condiciones del crédito pre-aprobado (valor, plazo, cuota y Tasa efectiva anual), ejecutar show_details si lo solicitan</accion>
        <momento>Confirmación de continuidad</momento>
        <accion>Preguntar si desea proceder y ejecutar advance_flow si acepta</accion>
        <momento>Selección de cuenta</momento>
        <accion>Verifica que la cuenta asociada termina en 5271 y ejecutar advance_flow si acepta</accion>
        <momento>Aprobación de documentos</momento>
        <accion>Solicitar confirmación de aprobación y ejecutar advance_flow si acepta</accion>
        <momento>Confirmación de solicitúd de credito</momento>
        <accion>Preguntar si esta seguro de la información diligenciada y ejecutar advance_flow si acepta</accion>
    </flujo_conversacion>
</instrucciones_herramientas>`;

    return { // Este es el objeto que va DENTRO de "setup" gemini-2.0-flash-live-001
      model: "models/gemini-2.5-flash-preview-native-audio-dialog",
      system_instruction: PROMPT ,
      tools: [
        {
          functionDeclarations: [
            {
              name: "navigate_to",
              description: "Navega a diferentes páginas de la aplicación",
              parameters: {
                type: "OBJECT",
                properties: {
                  page: {
                    type: "STRING",
                    description: "Nombre de la página a la que navegar (home, account, credit, card, pay, loan, invest, insurance, mortgage)"
                  }
                },
                required: ["page"]
              }
            },
            {
              name: "close_connection",
              description: `Cierra la conexión con el asistente cuando el usuario utiliza frases de despedida o terminación de la conversación.Tambien habra se cerrara el asistente cuando se exprese que ya no tiene un requerimiento/pregunta en el cual le puedas ayudar.`
            },
            {
              name: "show_details",
              description: "Muestra información completa de tasas y costos para el crédito"
            },
            {
              name: "advance_flow",
              description: "Avanza al paso siguiente para solicitar el crédito de libranza"
            }
          ]
        }]
    };
  }

   async sendAudioChunk(base64Audio) {
    if (!this.session) {
      this.onError("SDK: Sesión no activa para enviar audio.");
      return;
    }
    try {
      // El SDK espera que 'data' sea el string base64.
      // mimeType se infiere o se puede especificar si el SDK lo permite en este método.
      // El ejemplo del SDK para sendRealtimeInput suele ser más abstracto.
      // Revisando la firma de sendRealtimeInput: sendRealtimeInput(realtimeInput: BidiGenerateContentRealtimeInput): void;
      // BidiGenerateContentRealtimeInput: { audio?: Blob | undefined; ... }
      // Blob: { data: string; mimeType: string; }
      await this.session.sendRealtimeInput({
        audio: {
          data: base64Audio,
          mimeType: "audio/pcm;rate=16000" // Es importante especificarlo
        }
      });
    } catch (error) {
      console.error("SDK: Error enviando audio chunk:", error);
      this.onError(error.message || "Error al enviar audio con SDK");
    }
  }

  async sendClientTurns(turns, turnComplete = false) {
    if (!this.session) {
      this.onError("SDK: Sesión no activa para enviar contenido del cliente.");
      return;
    }
    try {
      // `turns` debe ser un array de objetos `ContentPart` o `Content`.
      // Ejemplo: [{ role: "user", parts: [{ text: "hola" }] }]
      // o para imagen: [{ role: "user", parts: [{ inlineData: { data: "...", mimeType:"image/jpeg"}}]}]
      await this.session.sendClientContent({
        turns: turns, // `turns` es un array de `Content` objects
        turnComplete: turnComplete
      });
    } catch (error) {
      console.error("SDK: Error enviando contenido del cliente:", error);
      this.onError(error.message || "Error al enviar contenido del cliente con SDK");
    }
  }

  async sendEndMessage() {
    // Un turno vacío marcado como completo
    await this.sendClientTurns([], true);
  }

  async sendToolResponse(functionResponsesArray) {
    if (!this.session) {
      this.onError("SDK: Sesión no activa para enviar respuesta de herramienta.");
      return;
    }
    try {
      // functionResponsesArray debe ser [{id: string, name: string, response: object}]
      await this.session.sendToolResponse({
        functionResponses: functionResponsesArray
      });
      console.log('SDK: Respuesta de herramienta enviada:', functionResponsesArray);
    } catch (error) {
      console.error("SDK: Error enviando respuesta de herramienta:", error);
      this.onError(error.message || "Error al enviar respuesta de herramienta con SDK");
    }
  }

  isConnected() {
    // El SDK no expone el estado del WebSocket directamente de forma síncrona fácil.
    // Se asume conectado si `this.session` existe y no ha habido un `onclose` o `onerror` reciente.
    // Para una verificación más robusta, necesitarías rastrear el estado basado en los callbacks.
    return !!this.session;
  }

  async disconnect() {
    console.log("SDK: [GeminiLiveAPI.disconnect] Llamado. Estableciendo connectionAttemptCancelled = true.");
    this.connectionAttemptCancelled = true; // Marcar como cancelado para cualquier intento de conexión en curso
    
    if (this.session) {
        console.log("SDK: [GeminiLiveAPI.disconnect] Hay una sesión activa, intentando cerrar...");
        try {
            await this.session.close();
            console.log("SDK: [GeminiLiveAPI.disconnect] Comando de cierre de sesión enviado.");
            // onclose se encargará de poner this.session = null
        } catch (error) {
            console.error("SDK: [GeminiLiveAPI.disconnect] Error al intentar cerrar la sesión:", error);
            this.onError(error.message || "Error al cerrar sesión con SDK");
            this.session = null; // Forzar a null en caso de error al cerrar
        }
    } else {
        console.log("SDK: [GeminiLiveAPI.disconnect] No hay sesión activa para desconectar (this.session es null).");
    }
}
}