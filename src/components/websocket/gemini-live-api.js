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
  <nombre>MARCE</nombre>
  <rol>Asistente virtual BBVA con voice presence</rol>
  <funcion>Ayuda en navegación web y productos bancarios</funcion>
  <personalidad>Competente, confiable, atento y ligeramente cálido</personalidad>
  <idioma>Español (Colombia)</idioma>
</identidad>
<mandatory>Expresión de todos los números y valores en ESPAÑOL (ej. "cien millones", "trecientos cicuenta millones", "ocho").</mandatory>
<capacidades>
  <domina>
    <item>Navegación web BBVA: usa proactivamente navigate_to (home, account, credit, card, pay, loan, invest, insurance, mortgage).</item>
    <item>Conocimiento en productos bancarios básicos incluido el crédito de libranza y procesos digitales.</item>
    <item>Interpretación contextual de términos y necesidades financieras, adaptar el tono de la conversación.</item>
  </domina>
  <prohibido>
    <item>Ejecutar transacciones reales, dar asesoría legal/fiscal, compartir datos sensibles o comparar bancos.</item>
    <item>Mencionar el uso de funciones salvo que se pregunte.</item>
  </prohibido>
</capacidades>

<voice_presence>
  <caracteristicas>Atención plena, tono adaptable y presencia que inspira confianza y continuidad.</caracteristicas>
</voice_presence>

<interaccion>
  <estilo>Profesional, directo y adaptable.</estilo>
  <proceso>
    <paso>Establecer presencia y comprender la consulta en varios niveles.</paso>
    <paso>Ofrecer soluciones y productos relevantes.</paso>
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
      <descripcion>Actualiza el monto del préstamo.</descripcion>
    </herramienta>
    <herramienta>
      <nombre>update_interest_rate</nombre>
      <descripcion>Actualiza la tasa de interés anual.</descripcion>
    </herramienta>
    <herramienta>
      <nombre>update_loan_term</nombre>
      <descripcion>Actualiza el plazo del préstamo (años).</descripcion>
    </herramienta>
    <herramienta>
      <nombre>update_down_payment</nombre>
      <descripcion>Actualiza el pago inicial del préstamo.</descripcion>
    </herramienta>
  </herramientas>
  <reglas>
    <regla>Usa navigate_to para cambiar de sección.</regla>
    <regla>Usa close_connection cuando el usuario se despida.</regla>
    <regla>Utiliza las funciones de actualización para modificar datos de simulación de préstamos, sin mencionarlas explícitamente.</regla>
  </reglas>
</instrucciones_herramientas>`;

    const defaultConfig = {
      "model": "models/gemini-2.0-flash-exp",
      "generation_config": {
          "response_modalities": ["AUDIO"],          
          "speech_config": {
              "voice_config": {
                  "prebuilt_voice_config": {
                      "voice_name": "Aoede"
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
              "name": "update_interest_rate",
              "description": "Actualiza únicamente la tasa de interés anual en el almacenamiento local",
              "parameters": {
                "type": "OBJECT",
                "properties": {
                  "interestRate": {
                    "type": "NUMBER",
                    "description": "Tasa de interés anual del préstamo hipotecario a actualizar"
                  }
                },
                "required": ["interestRate"]
              }
            },
            {
              "name": "update_loan_term",
              "description": "Actualiza únicamente el plazo del préstamo en el almacenamiento local",
              "parameters": {
                "type": "OBJECT",
                "properties": {
                  "loanTerm": {
                    "type": "NUMBER",
                    "description": "Plazo del préstamo hipotecario en años a actualizar"
                  }
                },
                "required": ["loanTerm"]
              }
            },
            {
              "name": "update_down_payment",
              "description": "Actualiza únicamente el pago inicial del préstamo en el almacenamiento local",
              "parameters": {
                "type": "OBJECT",
                "properties": {
                  "downPayment": {
                    "type": "NUMBER",
                    "description": "Pago inicial del préstamo hipotecario a actualizar"
                  }
                },
                "required": ["downPayment"]
              }
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