import { ElevenLabsClient } from 'elevenlabs'; // Importar el cliente de Eleven Labs

// Configura tu clave API de Eleven Labs de forma segura (preferiblemente mediante variables de entorno)
const ELEVENLABS_API_KEY = 'sk_ec362670c88570ca3ec2537964b1afe4bd7a91f4ecf8c78e'; // ¡REEMPLAZA ESTO!
const ELEVENLABS_VOICE_ID = 'QtuQlibCvdX2iBrV4laj'; // Ejemplo: Voz "Rachel" de ElevenLabs, reemplaza si es necesario

export class GeminiLiveAPI {
  constructor(endpoint, autoSetup = true, setupConfig = null) {
    this.ws = new WebSocket(endpoint);
    this.onSetupComplete = () => {};
    this.onTextData = (text, isFinal) => {}; // Modificado para indicar si el texto es final del turno
    this.onAudioData = () => {};
    this.onInterrupted = () => {};
    this.onTurnComplete = () => {}; // Callback original cuando el modelo indica fin de turno
    this.onError = () => {};
    this.onClose = () => {};
    this.onToolCall = () => {};
    this.pendingSetupMessage = null;
    this.autoSetup = autoSetup;
    this.setupConfig = setupConfig;

    this.elevenLabsClient = new ElevenLabsClient({
      apiKey: ELEVENLABS_API_KEY, // ¡RECUERDA TU API KEY!
    });

    this.currentTurnTextAccumulator = ""; // Para acumular texto del turno actual de Gemini

    this.setupWebSocket();
  }

  // Función helper para procesar el stream de audio de ElevenLabs y convertir a Base64
  // (Esta es la función que ya tienes y que adaptamos para el navegador)
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
      const chunkSize = 8192;
      for (let i = 0; i < concatenatedUint8Array.byteLength; i += chunkSize) {
        binaryString += String.fromCharCode.apply(null, concatenatedUint8Array.subarray(i, i + chunkSize));
      }
      return btoa(binaryString);
    }
  }

  setupWebSocket() {
  this.ws.onopen = () => {
      console.log('WebSocket connection is opening...');
      if (this.autoSetup) {
        this.sendDefaultSetup();
      } else if (this.pendingSetupMessage) {
        console.log('Sending pending setup message:', this.pendingSetupMessage);
        this.ws.send(JSON.stringify(this.pendingSetupMessage));
        this.pendingSetupMessage = null;
      }
    };

  this.ws.onmessage = async (event) => {
    console.log("------------------- NUEVO MENSAJE WS -------------------");
    let rawData = event.data;
    let wsResponse;

    try {
      // Parseo de la respuesta
      if (event.data instanceof Blob) {
        rawData = await event.data.text();
        console.log("Mensaje WS (Blob convertido a texto):", rawData);
        wsResponse = JSON.parse(rawData);
      } else if (typeof event.data === 'string') {
        rawData = event.data;
        console.log("Mensaje WS (String):", rawData);
        wsResponse = JSON.parse(rawData);
      } else if (event.data instanceof ArrayBuffer || (typeof Buffer !== 'undefined' && event.data instanceof Buffer)) {
        rawData = new TextDecoder().decode(event.data);
        console.log("Mensaje WS (Buffer/ArrayBuffer convertido a texto):", rawData);
        wsResponse = JSON.parse(rawData);
      } else {
        console.warn('Tipo de dato de evento no manejado directamente:', typeof event.data, event.data);
        rawData = event.data.toString(); // Intento genérico
        wsResponse = JSON.parse(rawData);
      }
      console.log("Respuesta WS Parseada:", JSON.stringify(wsResponse, null, 2));

      // ---- Procesamiento de la respuesta parseada ----

      if (wsResponse.setupComplete) {
        console.log(">>> SETUP COMPLETE <<<");
        this.onSetupComplete();
        return; // Fin del procesamiento para este mensaje
      }

      if (wsResponse.toolCall) {
        console.log(">>> TOOL CALL RECIBIDO <<<", JSON.stringify(wsResponse.toolCall));
        // Si había texto acumulado ANTES de un tool call, decide qué hacer.
        // Por lo general, el tool call es una acción que el modelo espera se complete.
        if (this.currentTurnTextAccumulator.trim().length > 0) {
            console.warn("Texto acumulado existente ANTES de tool call:", this.currentTurnTextAccumulator);
            // Opcional: Enviar este texto a TTS si crees que es una frase completa.
            // this.onTextData(this.currentTurnTextAccumulator, true); // Considerarlo final
            // this.currentTurnTextAccumulator = ""; // Limpiar si decides que el tool call lo invalida
        }
        this.onToolCall(wsResponse.toolCall);
        return; // Fin del procesamiento para este mensaje
      }

      if (wsResponse.serverContent) {
        console.log("Procesando serverContent:", JSON.stringify(wsResponse.serverContent, null, 2));

        if (wsResponse.serverContent.interrupted) {
          console.log(">>> INTERRUPTED <<<");
          this.onInterrupted();
          this.currentTurnTextAccumulator = ""; // Limpiar texto acumulado
          return; // Fin del procesamiento
        }

        let newTextInThisMessage = "";
        if (wsResponse.serverContent.modelTurn?.parts?.[0]?.text) {
          newTextInThisMessage = wsResponse.serverContent.modelTurn.parts[0].text;
          this.currentTurnTextAccumulator += newTextInThisMessage;
          console.log("Texto parcial añadido:", newTextInThisMessage, "|| Acumulado AHORA:", this.currentTurnTextAccumulator);
          this.onTextData(this.currentTurnTextAccumulator, false); // Feedback progresivo
        }

        const isTurnComplete = !!wsResponse.serverContent.turnComplete;
        console.log("¿Turn Complete?:", isTurnComplete);

        if (isTurnComplete) {
          this.onTurnComplete(); // Llama al callback original de Gemini

          if (this.currentTurnTextAccumulator.trim().length > 0) {
            const textToSpeak = this.currentTurnTextAccumulator.trim();
            // IMPORTANTE: Resetear ANTES de la llamada asíncrona a Eleven Labs
            this.currentTurnTextAccumulator = ""; 
            
            console.log(`>>> LLAMANDO A ELEVEN LABS con (Turno Completo): "${textToSpeak}" <<<`);
            this.onTextData(textToSpeak, true); // Texto final para el frontend

            try {
              const audioStream = await this.elevenLabsClient.generate({
                voice: ELEVENLABS_VOICE_ID,
                text: textToSpeak,
                model_id: "eleven_multilingual_v2",
                output_format: "mp3_44100_128", // O el que estés usando
              });
              console.log("Stream de Eleven Labs recibido.");
              
              const audioBase64 = await this.processAudioStreamForBrowser(audioStream);
              console.log('Audio de Eleven Labs procesado y listo para enviar al frontend.');
              this.onAudioData(audioBase64);

            } catch (elevenLabsError) {
              console.error('Error DIRECTO con Eleven Labs TTS:', elevenLabsError);
              this.onError('Eleven Labs TTS Error: ' + elevenLabsError.message);
            }
          } else {
            console.log("Turno completo, pero NO hay texto acumulado para Eleven Labs.");
            this.onTextData("", true); // Notificar al frontend que el turno terminó sin texto útil para TTS
            this.currentTurnTextAccumulator = ""; // Asegurar que esté limpio
          }
        } else {
          // Si el turno NO está completo
          // ¿Debemos enviar sendContinueSignal()?
          // Sí, si Gemini ha respondido de alguna forma (con texto o sin él pero es un modelTurn)
          // y el turno no ha terminado, necesita la señal para continuar.
          // La API de Gemini bidi-stream usualmente espera esto.
          if (wsResponse.serverContent.modelTurn) { // Si hubo CUALQUIER modelTurn
             console.log("Turno NO completo, enviando sendContinueSignal()...");
             this.sendContinueSignal();
          } else {
             console.log("Turno NO completo, pero no hubo modelTurn en este mensaje. No se envía continue signal.");
          }
        }
      } else {
        console.log("Mensaje WS sin setupComplete, toolCall, ni serverContent. ¿Qué es?:", JSON.stringify(wsResponse, null, 2));
      }

    } catch (error) {
      console.error('Error GRAVE en ws.onmessage:', error, '|| Datos sin procesar:', rawData);
      this.onError('Error GRAVE en ws.onmessage: ' + error.message);
      this.currentTurnTextAccumulator = ""; // Limpiar por si acaso
    }
    console.log("------------------- FIN MENSAJE WS -------------------");
  };

    this.ws.onerror = (error) => { // ... (sin cambios) ... 
    };
    this.ws.onclose = (event) => { // ... (sin cambios) ... 
    };
  }

  sendMessage(message) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not open. Current state:', this.ws.readyState);
      this.onError('WebSocket is not ready. Please try again.');
    }
  }

  sendSetupMessage(setupMessage) {
    if (this.ws.readyState === WebSocket.OPEN) {
      console.log('Sending setup message:', setupMessage);
      this.ws.send(JSON.stringify(setupMessage));
    } else {
      console.log('Connection not ready, queuing setup message');
      this.pendingSetupMessage = setupMessage;
    }
  }

  sendDefaultSetup() {
    // Modificado: PROMPT ajustado para no mencionar la voz de Gemini
    const PROMPT = `<identidad>
  <nombre>PACO</nombre>
  <rol>Asistente virtual BEBEUVA especializado en créditos de libranza</rol>
  <funcion>Guía experto en proceso de crédito de libranza pre-aprobado y navegación de interfaz crediticia</funcion>
  <personalidad>Competente, confiable, atento y ligeramente cálido con expertise bancario</personalidad>
  <idioma>Español (Colombia)</idioma>
</identidad>

<mandatory>
Expresión de todos los números y valores en ESPAÑOL, recuerda que debes omitir los decimales (ej: $3.328,09 equivale a tres mil trecientos ventiocho pesos) y evitar ser repetitivo a menos que te lo soliciten.
</mandatory>

<conocimiento_experto>
  <especializacion>Créditos de libranza y productos financieros BEBEUVA</especializacion>
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
    <item>Navegación web BEBEUVA: usa proactivamente navigate_to (home, account, credit, card, pay, loan, invest, insurance, mortgage).</item>
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

    // Modificado: Configuración para salida de TEXTO de Gemini
    const defaultConfig = {
      "model": "models/gemini-2.0-flash-exp", // o el modelo que estés usando
      "generation_config": {
          "response_modalities": ["TEXT"], // Cambiado a TEXT
          // "speech_config": {} // Eliminada o comentada la speech_config
      },
      "system_instruction": {
          "parts": [
              {
                  "text": PROMPT
              }
          ]
      },
      "tools": [ /* ... (tu configuración de tools sin cambios) ... */
        {"functionDeclarations": [
          {
            "name": "navigate_to",
            "description": "Navega a diferentes páginas de la aplicación",
            "parameters": {
              "type": "OBJECT",
              "properties": {
                "page": {
                  "type": "STRING",
                  "description": "Nombre de la página a la que navegar (home, account, credit, card, pay, loan, invest, insurance, mortgage)"
                }
              },
              "required": ["page"]
            }
          },
          {
            "name": "close_connection",
            "description": `Cierra la conexión con el asistente cuando el usuario utiliza frases de despedida o terminación de la conversación.Tambien habra se cerrara el asistente cuando se exprese que ya no tiene un requerimiento/pregunta en el cual le puedas ayudar.`
          },
          { // Asegúrate de que este objeto esté correctamente formateado como un objeto, no un array.
            "name": "show_details",
            "description": "Muestra información completa de tasas y costos para el crédito"
          },
          { // Asegúrate de que este objeto esté correctamente formateado como un objeto, no un array.
            "name": "advance_flow",
            "description": "Avanza al paso siguiente para solicitar el crédito de libranza"
          }
        ]
      }]
    };
     // Corrección en la estructura de tools:
     // La parte de "tools" donde tenías un array dentro de functionDeclarations como [ {name: "show_details"}, {name: "advance_flow"} ]
     // debería ser una lista plana de declaraciones de funciones. Lo he corregido arriba, asumiendo que cada una es una función separada.
     // Si "show_details" y "advance_flow" eran parte de una sola declaración, la estructura original era incorrecta.

    const setupMessage = {
      setup: this.setupConfig || defaultConfig
    };

    this.sendSetupMessage(setupMessage);
  }

  sendAudioChunk(base64Audio) {
    const message = {
      realtime_input: {
        media_chunks: [{
          mime_type: "audio/pcm", // El frontend envía audio/pcm
          data: base64Audio
        }]
      }
    };
    this.sendMessage(message);
  }

  sendEndMessage() {
    const message = {
      client_content: {
        turns: [{
          role: "user",
          parts: []
        }],
        turn_complete: true
      }
    };
    this.sendMessage(message);
  }

  sendContinueSignal() {
    const message = {
      client_content: {
        turns: [{
          role: "user",
          parts: []
        }],
        turn_complete: false
      }
    };
    this.sendMessage(message);
  }

  sendToolResponse(functionResponses) {
    const toolResponse = {
      tool_response: {
        function_responses: functionResponses
      }
    };
    console.log('Sending tool response:', toolResponse);
    this.sendMessage(toolResponse);
  }

  async ensureConnected() {
    if (this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);

      const onOpen = () => {
        clearTimeout(timeout);
        this.ws.removeEventListener('open', onOpen);
        this.ws.removeEventListener('error', onError);
        resolve();
      };

      const onError = (error) => {
        clearTimeout(timeout);
        this.ws.removeEventListener('open', onOpen);
        this.ws.removeEventListener('error', onError);
        reject(error);
      };

      this.ws.addEventListener('open', onOpen);
      this.ws.addEventListener('error', onError);
    });
  }
}