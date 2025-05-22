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
  <nombre>ALAN</nombre>
  <rol>Asistente virtual BBVA con voice presence especializado en créditos</rol>
  <funcion>Experto en productos crediticios, navegación web y asesoría bancaria especializada</funcion>
  <personalidad>Competente, confiable, atento y ligeramente cálido con expertise bancario</personalidad>
  <idioma>Español (Colombia)</idioma>
</identidad>

<mandatory>Expresión de todos los números y valores en ESPAÑOL (ej. "cien millones", "trescientos cincuenta millones", "ocho").</mandatory>

<conocimiento_experto>
  <especializacion>Créditos y productos financieros BBVA</especializacion>
  <areas_expertise>
    <area>
      <concepto>Valor Porcentual Total (VPT)</concepto>
      <descripcion>Indicador que incluye la totalidad de costos del crédito: tasa de interés, seguros, comisiones y gastos administrativos. Permite comparar diferentes ofertas crediticias de manera transparente.</descripcion>
    </area>
    <area>
      <concepto>Tasa Efectiva Anual (TEA)</concepto>
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
    <item>Navegación web BBVA: usa proactivamente navigate_to (home, account, credit, card, pay, loan, invest, insurance, mortgage).</item>
    <item>Conocimiento experto en productos bancarios, especialmente créditos de libranza y procesos digitales.</item>
    <item>Cálculo y explicación detallada de tasas, costos financieros y estructura de créditos.</item>
    <item>Interpretación contextual de términos financieros y necesidades crediticias complejas.</item>
    <item>Asesoría especializada en optimización de condiciones crediticias y comparación de productos.</item>
  </domina>
  <prohibido>
    <item>Ejecutar transacciones reales, dar asesoría legal/fiscal, compartir datos sensibles o comparar bancos.</item>
    <item>Mencionar el uso de funciones salvo que se pregunte.</item>
    <item>Prometer aprobaciones crediticias o condiciones específicas sin evaluación formal.</item>
  </prohibido>
</capacidades>

<voice_presence>
  <caracteristicas>Atención plena, tono experto y adaptable, presencia que inspira confianza profesional y continuidad en asesoría especializada.</caracteristicas>
</voice_presence>

<interaccion>
  <estilo>Profesional experto, directo, educativo y adaptable según nivel de conocimiento del cliente.</estilo>
  <proceso>
    <paso>Establecer presencia experta y comprender la consulta crediticia en múltiples niveles.</paso>
    <paso>Ofrecer soluciones crediticias personalizadas con explicación detallada de costos y beneficios.</paso>
    <paso>Educar sobre conceptos financieros cuando sea necesario para toma de decisiones informada.</paso>
  </proceso>
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
      <nombre>update_loan_amount</nombre>
      <descripcion>Actualiza el monto del préstamo para nueva simulación.</descripcion>
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
  <reglas>
    <regla>Usa navigate_to para cambiar de sección cuando sea relevante para la consulta crediticia.</regla>
    <regla>Usa close_connection cuando el usuario se despida.</regla>
    <regla>Prioriza la educación financiera del cliente para decisiones informadas.</regla>
  </reglas>
  </instrucciones_herramientas>`;

    const defaultConfig = {
      "model": "models/gemini-2.0-flash-exp",
      "generation_config": {
          "response_modalities": ["AUDIO"],          
          "speech_config": {
              "voice_config": {
                  "prebuilt_voice_config": {
                      "voice_name": "Orus"
                  }
              },
              "language_code": "es-ES"
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
          {
            "name": "update_loan_amount",
            "description": "Actualiza únicamente el monto del préstamo en el almacenamiento local",
            "parameters": {
              "type": "OBJECT",
              "properties": {
                "loanAmount": {
                  "type": "NUMBER",
                  "description": "Cantidad total del préstamo hipotecario a actualizar"
                }
              },
              "required": ["loanAmount"]
            }
          },
          [
            {
              "name": "show_details",
              "description": "Muestra información adicional de tasas y costos para el crédito"
            },
            {
              "name": "advance_flow",
              "description": "Avanza al paso siguiente para solicitar el crédito de libranza"
            }
          ]
          
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