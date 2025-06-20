export class GeminiLiveAPI {
  constructor(endpoint, autoSetup = true, setupConfig=null) {
    this.ws = new WebSocket(endpoint);
    this.onSetupComplete = () => {};
    this.onAudioData = () => {};
    this.onInterrupted = () => {};
    this.onTurnComplete = () => {};
    this.onError = () => {};
    this.onClose = () => {};
    this.onToolCall = () => {};
    this.pendingSetupMessage = null;
    this.autoSetup = autoSetup;
    this.setupConfig = setupConfig;

    this.setupWebSocket()
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
      try {
        let wsResponse;
        if (event.data instanceof Blob) {
          const responseText = await event.data.text();
          wsResponse = JSON.parse(responseText);
        } else {
          wsResponse = JSON.parse(event.data);
        }

        if (wsResponse.setupComplete) {
          this.onSetupComplete();
        } else if (wsResponse.toolCall) {
          this.onToolCall(wsResponse.toolCall);
        } else if (wsResponse.serverContent) {
          if (wsResponse.serverContent.interrupted) {
            this.onInterrupted();
            return;
          }

          if (wsResponse.serverContent.modelTurn?.parts?.[0]?.inlineData) {
            const audioData = wsResponse.serverContent.modelTurn.parts[0].inlineData.data;
            this.onAudioData(audioData);

            if (!wsResponse.serverContent.turnComplete) {
              this.sendContinueSignal();
            }
          }

          if (wsResponse.serverContent.turnComplete) {
            this.onTurnComplete();
          }
        }
      } catch (error) {
        console.error('Error parsing response:', error);
        this.onError('Error parsing response: ' + error.message);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      this.onError('WebSocket Error: ' + error.message);
    };

    this.ws.onclose = (event) => {
      console.log('Connection closed:', event);
      this.onClose(event);
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
            <descripcion>Muestra en pantalla información completa sobre tasas y costos para el crédito.</descripcion>
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
        <accion>Presentar condiciones del crédito pre-aprobado (valor, plazo, cuota y Tasa efectiva anual), ejecutar show_details si desean ver información completa o adicional de tasas y costos</accion>
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

    const defaultConfig = {
      "model": "models/gemini-2.0-flash-live-001",
      "generation_config": {
          "response_modalities": ["AUDIO"],          
          "speech_config": {
              "voice_config": {
                  "prebuilt_voice_config": {
                      "voice_name": "Orus"
                  }
              },
              "language_code": "es-US"
          }
      },
      "system_instruction": {
          "parts": [
              {
                  "text": PROMPT
              }
          ]
      },
      "tools": [
        {"functionDeclarations": [
            {
              name: "navigate_to",
              description: "Navega a diferentes páginas de la aplicación",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  page: {
                    type: Type.STRING,
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
              description: "Muestra en pantalla información completa de tasas y costos para el crédito",
            },
            {
              name: "advance_flow",
              description: "Avanza al paso siguiente para solicitar el crédito de libranza"
            }
          ]
    }]
    };

    const setupMessage = {
      setup: this.setupConfig || defaultConfig
    };

    this.sendSetupMessage(setupMessage);
  }

  sendAudioChunk(base64Audio) {
    const message = {
      realtime_input: {
        media_chunks: [{
          mime_type: "audio/pcm",
          data: base64Audio
        }]
      }
    };
    // console.log("Sending audio message: ", message);
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
