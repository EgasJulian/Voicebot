import React, { useState, useEffect } from "react";
import Footer from "../components/Footer"; // Assuming Footer component exists
import InfoModal from './InfoModal'; // Import the InfoModal component

// Helper component for consistent summary display (from previous response)
const CreditSummaryDetails = ({ info, generalPreapprovedValue }) => {
  // ... (código existente del componente CreditSummaryDetails sin cambios)
  const details = {
    valorPreaprobado: generalPreapprovedValue,
    plazo: info.plazo,
    cuotaMensualConSeguro: info.cuotaMensualConSeguro,
    valorADesembolsar: info.valorADesembolsar,
    valorPorcentualTotal: info.tasasYCostos.valorPorcentualTotal || "19.2%",
    tasaEfectivaAnual: info.tasasYCostos.tasaEfectivaAnual || "18.50%",
    seguroDeCorrimiento: info.tasasYCostos.seguroDeCorrimiento || "$3.328,09",
    comisionDeEstudio: info.tasasYCostos.comisionDeEstudio,
    valorTotalDelCapital: info.valorPreaprobado,
    valorTotalDeIntereses: info.tasasYCostos.valorTotalIntereses,
    valorTotalDelSeguro: info.tasasYCostos.valorTotalDelSeguro,
    cuotaMensualSinSeguro: info.tasasYCostos.cuotaMensualSinSeguro,
    valorMensualDelSeguro: info.tasasYCostos.valorMensualSeguro,
    totalAPagar: info.totalAPagar,
  };

  return (
    <div className="bg-white text-dark p-3 rounded mb-3">
      <div className="d-flex justify-content-between mb-2">
        <span>Tu valor preaprobado</span>
        <span className="fw-bold">{details.valorPreaprobado}</span>
      </div>
      <div className="d-flex justify-content-between mb-2">
        <span>Plazo</span>
        <span className="fw-bold">{details.plazo}</span>
      </div>
      <div className="d-flex justify-content-between mb-2">
        <span>Cuota mensual con seguro</span>
        <span className="fw-bold">{details.cuotaMensualConSeguro}</span>
      </div>
      <div className="d-flex justify-content-between mb-2">
        <span>Valor a desembolsar</span>
        <span className="fw-bold">{details.valorADesembolsar}</span>
      </div>
      <hr />
      <div className="d-flex justify-content-between mb-2">
        <span>Valor porcentual total</span>
        <span className="fw-bold">{details.valorPorcentualTotal}</span>
      </div>
      <div className="d-flex justify-content-between mb-2">
        <span>Tasa efectiva anual</span>
        <span className="fw-bold">{details.tasaEfectivaAnual}</span>
      </div>
      <div className="d-flex justify-content-between mb-2">
        <span>Seguro de corrimiento</span>
        <span className="fw-bold">{details.seguroDeCorrimiento}</span>
      </div>
      <div className="d-flex justify-content-between mb-2">
        <span>Comisión de estudio</span>
        <span className="fw-bold">{details.comisionDeEstudio}</span>
      </div>
      <div className="d-flex justify-content-between mb-2">
        <span>Valor total del capital</span>
        <span className="fw-bold">{details.valorTotalDelCapital}</span>
      </div>
      <div className="d-flex justify-content-between mb-2">
        <span>Valor total de intereses</span>
        <span className="fw-bold">{details.valorTotalDeIntereses}</span>
      </div>
      <div className="d-flex justify-content-between mb-2">
        <span>Valor total del seguro</span>
        <span className="fw-bold">{details.valorTotalDelSeguro}</span>
      </div>
        <hr />
      <div className="d-flex justify-content-between mb-2">
        <span>Cuota mensual sin seguro</span>
        <span className="fw-bold">{details.cuotaMensualSinSeguro}</span>
      </div>
      <div className="d-flex justify-content-between mb-2">
        <span>Valor mensual del seguro</span>
        <span className="fw-bold">{details.valorMensualDelSeguro}</span>
      </div>
      <hr />
      <div className="d-flex justify-content-between mb-2 fw-bold" style={{fontSize: '1.1rem'}}>
        <span>Total a pagar</span>
        <span>{details.totalAPagar}</span>
      </div>
    </div>
  );
};

export default function Credito() {
  // 1. Inicializar showDetails desde localStorage o con un valor por defecto.
  const [showDetails, setShowDetails] = useState(() => {
    const storedValue = localStorage.getItem("showDetails");
    if (storedValue === null) {
      localStorage.setItem("showDetails", "false");
      return false;
    }
    return storedValue === "true";
  });

  // --- INICIO: Lógica para currentStep ---
  // 1. Inicializar currentStep desde localStorage o con un valor por defecto (1).
  const [currentStep, setCurrentStep] = useState(() => {
    const storedValue = localStorage.getItem("currentStep");
    const defaultValue = 1;
    if (storedValue === null) {
      localStorage.setItem("currentStep", String(defaultValue));
      return defaultValue;
    }
    const parsedValue = parseInt(storedValue, 10);
    // Asegurar que el valor sea un entero positivo, sino usar el default.
    if (isNaN(parsedValue) || parsedValue <= 0) { 
        localStorage.setItem("currentStep", String(defaultValue));
        return defaultValue;
    }
    return parsedValue;
  });
  // --- FIN: Lógica para currentStep ---

  const [selectedAccount, setSelectedAccount] = useState(1); // Asumiendo que 0 puede ser un valor válido o índice.
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [processingDate, setProcessingDate] = useState("");
  const [modalContent, setModalContent] = useState({ show: false, title: '', content: '' });

  // 2. useEffect para actualizar localStorage cuando el estado showDetails cambie.
  useEffect(() => {
    localStorage.setItem("showDetails", String(showDetails));
    window.dispatchEvent(new CustomEvent('showDetailsChanged', { 
      detail: { showDetails } 
    }));
  }, [showDetails]);

  // --- INICIO: Lógica para currentStep ---
  // 2. useEffect para actualizar localStorage cuando el estado currentStep cambie.
  useEffect(() => {
    localStorage.setItem("currentStep", String(currentStep));
    // Disparar evento personalizado para notificar a otras partes de la aplicación
    window.dispatchEvent(new CustomEvent('currentStepChanged', {
      detail: { currentStep }
    }));
  }, [currentStep]);
  // --- FIN: Lógica para currentStep ---

  // 3. useEffect mejorado para escuchar cambios tanto de storage como de eventos personalizados para showDetails
  useEffect(() => {
    const checkAndUpdateShowDetailsFromStorage = () => {
      const currentStorageValue = localStorage.getItem("showDetails");
      if (currentStorageValue !== null) {
        const currentBoolValue = currentStorageValue === "true";
        setShowDetails(prevState => {
          return prevState !== currentBoolValue ? currentBoolValue : prevState;
        });
      } else {
        localStorage.setItem("showDetails", "false");
        setShowDetails(prevState => prevState !== false ? false : prevState);
      }
    };

    const handleShowDetailsStorageChange = (event) => {
      if (event.key === "showDetails") {
        if (event.newValue !== null) {
          const newValueFromStorage = event.newValue === "true";
          setShowDetails(prevState => prevState !== newValueFromStorage ? newValueFromStorage : prevState);
        } else {
          setShowDetails(prevState => prevState !== false ? false : prevState); // Si se elimina la key, se asume false
        }
      }
    };

    const handleShowDetailsCustomEvent = () => {
      checkAndUpdateShowDetailsFromStorage();
    };

    window.addEventListener('storage', handleShowDetailsStorageChange);
    window.addEventListener('localStorageChanged', handleShowDetailsCustomEvent); // Evento genérico para misma pestaña

    checkAndUpdateShowDetailsFromStorage(); // Verificación inicial
    const intervalId = setInterval(checkAndUpdateShowDetailsFromStorage, 500); // Verificación periódica

    return () => {
      window.removeEventListener('storage', handleShowDetailsStorageChange);
      window.removeEventListener('localStorageChanged', handleShowDetailsCustomEvent);
      clearInterval(intervalId);
    };
  }, []);

  // --- INICIO: Lógica para currentStep ---
  // 3. useEffect mejorado para escuchar cambios tanto de storage como de eventos personalizados para currentStep
  useEffect(() => {
    const storageKey = "currentStep";
    const defaultValue = 1;

    const checkAndUpdateCurrentStepFromStorage = () => {
      const currentStorageValue = localStorage.getItem(storageKey);
      let valueToSet = defaultValue;

      if (currentStorageValue !== null) {
        const parsedValue = parseInt(currentStorageValue, 10);
        if (!isNaN(parsedValue) && parsedValue > 0) {
          valueToSet = parsedValue;
        } else {
          localStorage.setItem(storageKey, String(defaultValue)); // Corregir valor inválido en localStorage
        }
      } else {
        localStorage.setItem(storageKey, String(defaultValue)); // Establecer valor por defecto si no existe
      }
      
      setCurrentStep(prevState => {
        return prevState !== valueToSet ? valueToSet : prevState;
      });
    };

    const handleCurrentStepStorageEvent = (event) => {
      if (event.key === storageKey) {
        checkAndUpdateCurrentStepFromStorage();
      }
    };

    const handleCurrentStepCustomEvent = () => {
        // Evento genérico 'localStorageChanged' disparado, re-chequear currentStep
        checkAndUpdateCurrentStepFromStorage();
    };

    window.addEventListener('storage', handleCurrentStepStorageEvent);
    window.addEventListener('localStorageChanged', handleCurrentStepCustomEvent); // Escucha el mismo evento genérico

    checkAndUpdateCurrentStepFromStorage(); // Verificación inicial al montar

    const intervalId = setInterval(checkAndUpdateCurrentStepFromStorage, 500); // Verificación periódica

    return () => {
      window.removeEventListener('storage', handleCurrentStepStorageEvent);
      window.removeEventListener('localStorageChanged', handleCurrentStepCustomEvent);
      clearInterval(intervalId);
    };
  }, []); // Array de dependencias vacío para que se ejecute una vez al montar y limpiar al desmontar
  // --- FIN: Lógica para currentStep ---

  useEffect(() => {
    let timerId;
    if (currentStep === 5) {
      // Establecer la fecha de procesamiento al entrar al paso 5
      const now = new Date();
      setProcessingDate(
        now.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) +
        ', ' +
        now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })
      );

      // Configurar el temporizador para pasar al paso 6
      timerId = setTimeout(() => {
        setCurrentStep(6);
      }, 3000); // 3 segundos de carga
    }
    // Función de limpieza para el useEffect
    return () => {
      clearTimeout(timerId); // Limpiar el temporizador si currentStep cambia antes de que se complete o si el componente se desmonta
    };
  }, [currentStep]);

  const infoTooltips = {
    // ... (infoTooltips sin cambios)
    valorPorcentualTotal: {
      title: "Valor Porcentual Total (VPT)",
      content: "Es el costo total de tu crédito expresado como un porcentaje anual. Incluye la tasa de interés y todos los demás costos asociados, como seguros y comisiones, permitiéndote comparar diferentes opciones de crédito.",
    },
    tasaEfectivaAnual: {
      title: "Tasa Efectiva Anual (TEA)",
      content: "Es la tasa de interés que realmente pagarás por tu crédito en un año, considerando la capitalización de los intereses. Refleja el costo financiero del préstamo de manera anualizada.",
    },
    seguroDeCorrimiento: {
      title: "Seguro de Corrimiento",
      content: "Este seguro protege el saldo de tu deuda en situaciones imprevistas como fallecimiento o incapacidad total y permanente del titular del crédito, brindando tranquilidad a ti y tu familia.",
    },
    valorInicial: { // This is for "Valor inicial" in tasasYCostos
      title: "Valor Inicial",
      content: "El Valor Inicial en créditos bancarios es el monto principal que el banco otorga al cliente como préstamo, sobre el cual se calculan los intereses durante la vida del crédito."
    },
    valorTotalDelSeguro: {
      title: "Valor Total del Seguro",
      content: "Representa la suma de todas las cuotas de seguro que pagarás durante toda la vida de tu crédito. Este valor ya está contemplado en tu cuota mensual con seguro.",
    }
  };

  const openModal = (tooltipKey) => {
    // ... (openModal sin cambios)
    if (infoTooltips[tooltipKey]) {
      setModalContent({
        show: true,
        title: infoTooltips[tooltipKey].title,
        content: infoTooltips[tooltipKey].content,
      });
    }
  };

  const closeModal = () => {
    // ... (closeModal sin cambios)
    setModalContent({ show: false, title: '', content: '' });
  };
  
  const InfoIcon = ({ onClick }) => (
    // ... (InfoIcon sin cambios)
    <button
      onClick={onClick}
      className="btn btn-link p-0 ms-1"
      style={{ 
        textDecoration: 'none', 
        color: '#007bff',
        backgroundColor: 'transparent',
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        // border: '1px solid #007bff', // Optional: if you want a border
        lineHeight: '18px',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        cursor: 'pointer'
      }}
      aria-label="Más información"
    >
      ?
    </button>
  );

  const creditoInfo = {
    // ... (creditoInfo sin cambios)
    titulo: "Crédito de Libranza",
    valorPreaprobadoGeneral: "$18.000.000,00", 
    valorPreaprobado: "$18.000.000,00", 
    plazo: "72 meses",
    cuotaMensualConSeguro: "$623.919,00",
    valorADesembolsar: "$17.869.100,00",
    totalAPagar: "$26.932.243,60",
    tasaEfectivaAnual: "18.50%", 
    caracteristicas: [
      "Tu tasa es preferencial según el convenio con tu empresa.",
      "La cuota mensual se descuenta directamente de tu nómina o pensión.",
      "Las cuotas son fijas durante la vigencia de tu crédito."
    ],
    beneficios: [
      "Sin requisitos ni verificación del destino del préstamo.",
      "La cuota mensual se descuenta directamente de tu nómina o pensión.",
      "El préstamo te lo dan tus buenos hábitos de pago."
    ],
    tasasYCostos: { 
      valorPorcentualTotal: "19.20%",
      tasaEfectivaAnual: "18.50%",
      seguroDeCorrimiento: "$3.328,09",
      comisionDeEstudio: "$130.900,00",
      valorInicial: "$18.000.000",
      valorTotalIntereses: "$8.000.000,00",
      valorTotalDelSeguro: "$682.572,54",
      cuotaMensualSinSeguro: "$573.919,00",
      valorMensualSeguro: "$50.000,00",
      valorTotalAPagar: "$26.932.243,60",
      cuotaMensualConSeguro: "$623.919,00",
      valorADesembolsar: "$17.869.100,00"
    },
    cuentas: [
      { tipo: "Cuenta nómina", numero: "1234", saldo: "$5.000.000,00" },
      { tipo: "Ahorros", numero: "5071", saldo: "$100.000.000,00" },
      { tipo: "Cuenta corriente", numero: "2349", saldo: "$500.000,00" }
    ],
    documentos: [
      { nombre: "Reglamento para el Crédito de Libranza", id: "reglamento", isPdf: true, pdfPath: "/REGLAMENTO DE CREDITO DE LIBRANZA.pdf" },
      { nombre: "Autorización del crédito", id: "autorizacion", isPdf: true, pdfPath: "/REGLAMENTO DE CREDITO DE LIBRANZA.pdf" },
      { nombre: "Pagaré electrónico", id: "pagare", isPdf: true, pdfPath: "/REGLAMENTO DE CREDITO DE LIBRANZA.pdf" }
    ],
    correoElectronico: "col@mail.com" 
  };

  const resetFlow = () => {
    // setCurrentStep(1) y setShowDetails(false) ya actualizan localStorage
    // gracias a sus respectivos useEffect.
    setCurrentStep(1);
    setShowDetails(false); 
    setSelectedAccount(0); 
    setTermsAccepted(false);
    setProcessingDate("");
    closeModal();
  };

  const handleConfirmAndProceed = () => {
    // Simplemente establece el currentStep a 5.
    // El useEffect [currentStep] se encargará de la lógica de la pantalla de carga
    // y la transición al paso 6.
    setCurrentStep(5); 
  };

  return (
    <div>
      {/* ... (Contenedor exterior y estilos sin cambios) ... */}
      <div
        className="container-fluid py-5"
        style={{
          backgroundColor: 'white',
          zIndex: 0,
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          alignItems: currentStep === 5 ? 'center' : 'flex-start', 
          justifyContent: 'center'
        }}
      >
        <div className="row justify-content-center w-100">
          <div className="col-md-6">
            {/* Paso 1: Panel principal del crédito */}
            {currentStep === 1 && (
              <div 
                className="p-4 shadow-lg rounded"
                style={{ backgroundColor: '#072146', color: 'white' }}
              >
                {/* ... (Header y contenido inicial del Paso 1 sin cambios) ... */}
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h3>{creditoInfo.titulo}</h3>
                  <button className="btn btn-link text-white" onClick={resetFlow}>
                    <i className="fs-5">×</i>
                  </button>
                </div>
                
                <div className="text-center mb-4">
                  <div style={{ fontSize: '3rem', color: '#FFD700' }}>
                    💰
                  </div>
                  <p className="mt-2">¡Felicidades, tienes un crédito libranza preaprobado!</p>
                </div>

                <div className="bg-white text-dark p-3 rounded mb-3">
                  <div className="d-flex justify-content-between">
                    <p className="fw-bold mb-1">TU CRÉDITO</p>                   
                  </div>
                  
                  <p className="mb-1">Este es tu valor preaprobado</p>
                  <h2 className="fw-bold" style={{ color: '#072146' }}>{creditoInfo.valorPreaprobado}</h2>
                  
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <p className="fw-bold mb-1">Plazo</p>
                      <p>{creditoInfo.plazo}</p>
                    </div>
                    <div className="text-end">
                      <p className="mb-1">Cuota mensual con seguro</p>
                      <p className="fw-bold">{creditoInfo.cuotaMensualConSeguro}</p>
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-between mt-2">
                    <div>
                      <p className="mb-1">Valor a desembolsar</p>
                      <p>{creditoInfo.valorADesembolsar}</p>
                    </div>
                    <div className="text-end">
                      <p className="mb-1">Total a pagar</p>
                      <p>{creditoInfo.totalAPagar}</p>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <p className="mb-1">Tasa efectiva anual</p>
                    <p>{creditoInfo.tasaEfectivaAnual}</p>
                  </div>
                </div>

                {/* Características */}
                <div className="mb-3">
                  <h5 className="fw-bold">CARACTERÍSTICAS</h5>
                  <ul className="list-unstyled">
                    {creditoInfo.caracteristicas.map((caracteristica, index) => (
                      <li key={index} className="mb-2">
                        <div className="d-flex">
                          <span className="me-2" style={{ color: '#3498db' }}>■</span>
                          <span>{caracteristica}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Beneficios */}
                <div className="mb-3">
                  <h5 className="fw-bold">BENEFICIOS</h5>
                  <ul className="list-unstyled">
                    {creditoInfo.beneficios.map((beneficio, index) => (
                      <li key={index} className="mb-2">
                        <div className="d-flex">
                          <span className="me-2" style={{ color: '#3498db' }}>■</span>
                          <span>{beneficio}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tasas y Costos - Botón para expandir */}
                <button 
                  className="btn btn-link text-white p-0 mb-2"
                  onClick={() => setShowDetails(!showDetails)} 
                >
                  <h5 className="fw-bold d-inline">TASAS Y COSTOS</h5>
                  {!showDetails && <span className="ms-2">▼</span>}
                  {showDetails && <span className="ms-2">▲</span>}
                </button>

                {/* Detalles de Tasas y Costos - Se muestra según el estado showDetails */}
                {showDetails && (
                  <div className="bg-white text-dark p-3 rounded mb-3">
                    {/* ... (Contenido de Tasas y Costos sin cambios) ... */}
                     <div className="d-flex justify-content-between mb-2">
                      <div>Valor porcentual total <InfoIcon onClick={() => openModal('valorPorcentualTotal')} /></div>
                      <div className="fw-bold">{creditoInfo.tasasYCostos.valorPorcentualTotal}</div>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <div>Tasa efectiva anual <InfoIcon onClick={() => openModal('tasaEfectivaAnual')} /></div>
                      <div className="fw-bold">{creditoInfo.tasasYCostos.tasaEfectivaAnual}</div>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <div>Seguro de corrimiento <InfoIcon onClick={() => openModal('seguroDeCorrimiento')} /></div>
                      <div className="fw-bold">{creditoInfo.tasasYCostos.seguroDeCorrimiento}</div>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <div>Comisión de estudio</div>
                      <div className="fw-bold">{creditoInfo.tasasYCostos.comisionDeEstudio}</div>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <div>Valor inicial <InfoIcon onClick={() => openModal('valorInicial')} /></div>
                      <div className="fw-bold">{creditoInfo.tasasYCostos.valorInicial}</div>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <div>Valor total de intereses</div>
                      <div className="fw-bold">{creditoInfo.tasasYCostos.valorTotalIntereses}</div>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <div>Valor total del seguro <InfoIcon onClick={() => openModal('valorTotalDelSeguro')} /></div>
                      <div className="fw-bold">{creditoInfo.tasasYCostos.valorTotalDelSeguro}</div>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <div>Cuota mensual sin seguro</div>
                      <div className="fw-bold">{creditoInfo.tasasYCostos.cuotaMensualSinSeguro}</div>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <div>Valor mensual del seguro</div>
                      <div className="fw-bold">{creditoInfo.tasasYCostos.valorMensualSeguro}</div>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <div>Valor total a pagar</div>
                      <div className="fw-bold">{creditoInfo.tasasYCostos.valorTotalAPagar}</div>
                    </div>
                    <div className="bg-light p-3 rounded mt-3 mb-3">
                      <div className="d-flex mb-2">
                        <span style={{ color: '#3498db' }}>ⓘ</span>
                        <small className="ms-2">Esta es una proyección estimada, ten en cuenta que podría sumar capitalización de intereses y otros conceptos incluidos. Conoce el valor final en la formalización de la oferta.</small>
                      </div>
                    </div>
                    <div className="fw-bold mb-2">Cuota mensual con seguro</div>
                    <h3 className="fw-bold" style={{ color: '#072146' }}>{creditoInfo.tasasYCostos.cuotaMensualConSeguro}</h3>
                    <div className="d-flex justify-content-between mt-3">
                      <div>Valor a desembolsar</div>
                      <div className="fw-bold">{creditoInfo.tasasYCostos.valorADesembolsar}</div>
                    </div>
                  </div>
                )}
                <div className="text-center mt-4">
                  <button 
                      className="btn btn-success px-4 py-2" 
                      style={{ backgroundColor: "#009688", border: "none" }}
                      onClick={() => setCurrentStep(2)} // Actualizará localStorage
                  >
                      Continuar
                  </button>
                </div>
              </div>
            )}

            {/* Paso 2: Selección de cuenta */}
            {currentStep === 2 && (
              <div 
                className="p-4 shadow-lg rounded"
                style={{ backgroundColor: '#072146', color: 'white' }}
              >
                {/* ... (Contenido del Paso 2 sin cambios, incluyendo onClick={() => setCurrentStep(3)} que actualizará localStorage) ... */}
                 <div className="d-flex justify-content-between align-items-start mb-3">
                  <h3>{creditoInfo.titulo}</h3>
                  <button className="btn btn-link text-white" onClick={resetFlow}>
                    <i className="fs-5">×</i>
                  </button>
                </div>
                
                <div className="bg-white text-dark p-3 rounded mb-3">
                  <div className="d-flex justify-content-between">
                    <p className="fw-bold mb-1">TU CRÉDITO</p>                   
                  </div>
                  
                  <p className="mb-1">Tu valor preaprobado</p>
                  <h2 className="fw-bold" style={{ color: '#072146' }}>{creditoInfo.valorPreaprobado}</h2>
                  
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <p className="fw-bold mb-1">Plazo</p>
                      <p>{creditoInfo.plazo}</p>
                    </div>
                    <div className="text-end">
                      <p className="mb-1">Cuota mensual con seguro</p>
                      <p className="fw-bold">{creditoInfo.cuotaMensualConSeguro}</p>
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-between mt-2">
                    <div>
                      <p className="mb-1">Valor a desembolsar</p>
                      <p>{creditoInfo.valorADesembolsar}</p>
                    </div>
                    <div className="text-end">
                      <p className="mb-1">Total a pagar</p>
                      <p>{creditoInfo.totalAPagar}</p>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <p className="mb-1">Tasa efectiva anual</p>
                    <p>{creditoInfo.tasaEfectivaAnual}</p>
                  </div>
                </div>

                <div className="bg-white text-dark p-3 rounded mb-3">
                  <h5 className="fw-bold" style={{ color: '#072146' }}>CUENTA ASOCIADA</h5>
                  <p>Elige la cuenta donde se desembolsará el crédito y se cobrará la cuota.</p>
                  
                  <div className="mt-3">
                    <h6 className="fw-bold">CUENTAS</h6>
                    
                    {creditoInfo.cuentas.map((cuenta, index) => (
                      <div 
                        key={index} 
                        className={`p-3 mb-2 ${selectedAccount === index ? 'border border-primary shadow-sm' : 'border border-light'}`}
                        style={{ 
                          backgroundColor: selectedAccount === index ? '#eaf2ff' : '#f8f9fa', 
                          borderRadius: '8px',
                          cursor: 'pointer' 
                        }}
                        onClick={() => setSelectedAccount(index)}
                      >
                        <div className="d-flex justify-content-between">
                          <div>
                            <h6 className="fw-bold text-primary mb-1">{cuenta.tipo}</h6>
                            <p className="mb-1 text-muted small">No. ••••{cuenta.numero.slice(-4)}</p>
                            <p className="mb-0 fw-bold">{cuenta.saldo}</p>
                            <small className="text-muted">Saldo disponible</small>
                          </div>
                          {selectedAccount === index && (
                            <div className="align-self-center">
                              <div style={{ 
                                width: '20px', 
                                height: '20px', 
                                borderRadius: '50%', 
                                backgroundColor: '#007bff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                              }}>✓</div>
                            </div>
                          )}
              _            </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="text-center mt-4">
                  <button 
                    className="btn btn-success px-4 py-2" 
                    style={{ 
                      backgroundColor: selectedAccount !== null ? "#009688" : "#cccccc", 
                      border: "none" 
                    }}
                    disabled={selectedAccount === null} //selectedAccount === 0 es una cuenta valida. Si es null no hay seleccion.
                    onClick={() => setCurrentStep(3)} // Actualizará localStorage
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )} 

            {/* Paso 3: Términos y condiciones - UPDATED for PDF Link */}
            {currentStep === 3 && (
              <div 
                className="p-4 shadow-lg rounded"
                style={{ backgroundColor: '#072146', color: 'white' }}
              >
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h3>{creditoInfo.titulo}</h3>
                  <button className="btn btn-link text-white" onClick={resetFlow}>
                    <i className="fs-5">×</i>
                  </button>
                </div>
                
                <div className="bg-white text-dark p-3 rounded mb-3">
                <p className="fw-bold mb-1">TU CRÉDITO</p>                  
                  <p className="mb-1">Tu valor preaprobado</p>
                  <h2 className="fw-bold" style={{ color: '#072146' }}>{creditoInfo.valorPreaprobado}</h2>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <p className="fw-bold mb-1">Plazo</p><p>{creditoInfo.plazo}</p>
                    </div>
                    <div className="text-end">
                      <p className="mb-1">Cuota mensual con seguro</p><p className="fw-bold">{creditoInfo.cuotaMensualConSeguro}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white text-dark p-3 rounded mb-3">
                  <h5 className="fw-bold">CUENTA ASOCIADA</h5>
                  <div className="mt-2">
                    <h6 className="fw-bold text-primary">
                      {creditoInfo.cuentas[selectedAccount !== null ? selectedAccount : 0].tipo}
                    </h6>
                    <p className="mb-1">•{creditoInfo.cuentas[selectedAccount !== null ? selectedAccount : 0].numero}</p>
                  </div>
                </div>

                <div className="bg-white text-dark p-3 rounded mb-3">
                  <h5 className="fw-bold">TÉRMINOS Y CONDICIONES</h5>
                  <p>Para continuar, abre y revisa cada documento. Confirma una vez que los hayas leído.</p>
                  
                  <div className="mt-3">
                    {creditoInfo.documentos.map((documento, index) => (
                      <div key={index} className="d-flex align-items-center mb-2 p-2 border rounded bg-light">
                        <span className="text-primary me-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-file-earmark-text" viewBox="0 0 16 16">
                            <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"/>
                            <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1L13 4.5V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/>
                          </svg>
                        </span>
                        {documento.isPdf ? (
                          <a href={documento.pdfPath} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none">
                            {documento.nombre}
                          </a>
                        ) : (
                          <a href="#" className="text-primary text-decoration-none">{documento.nombre}</a>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 d-flex align-items-center form-check">
                    <input 
                      type="checkbox" 
                      id="acceptTerms" 
                      className="form-check-input me-2"
                      checked={termsAccepted}
                      onChange={() => setTermsAccepted(!termsAccepted)}
                      style={{width: '1.2em', height: '1.2em'}}
                    />
                    <label htmlFor="acceptTerms" className="form-check-label mb-0 small">
                      He leído y acepto el contenido de los documentos y las condiciones del crédito.
                    </label>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <button 
                    className="btn btn-success px-4 py-2" 
                    style={{ backgroundColor: termsAccepted ? "#009688" : "#cccccc", border: "none" }}
                    disabled={!termsAccepted}
                    onClick={() => setCurrentStep(4)} 
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}
            
            {/* Paso 4: Resumen de la Operación */}
            {currentStep === 4 && (
              <div 
                className="p-4 shadow-lg rounded"
                style={{ backgroundColor: '#072146', color: 'white' }}
              >
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h3>Resumen de tu Crédito de Libranza</h3>
                  <button className="btn btn-link text-white" onClick={resetFlow}>
                    <i className="fs-5">×</i>
                  </button>
                </div>
                <CreditSummaryDetails info={creditoInfo} generalPreapprovedValue={creditoInfo.valorPreaprobadoGeneral} />
                <div className="bg-white text-dark p-3 rounded mb-3">
                  <h6 className="fw-bold">CUENTA ASOCIADA PARA DESEMBOLSO Y PAGO</h6>
                  <p className="mb-1">
                    {creditoInfo.cuentas[selectedAccount].tipo} No. ••••{creditoInfo.cuentas[selectedAccount].numero.slice(-4)}
                  </p>
                  <p className="text-muted small">
                    En esta cuenta se desembolsará el crédito y se cobrará la cuota mensual.
                  </p>
                </div>
                <div className="bg-white text-dark p-3 rounded mb-3">
                  <h6 className="fw-bold">CORREO ELECTRÓNICO PARA NOTIFICACIONES</h6>
                  <p className="mb-1">{creditoInfo.correoElectronico}</p>
                  <p className="text-muted small">
                    Recibirás los documentos y notificaciones de tu crédito en este correo.
                  </p>
                </div>
                <div className="alert alert-info mt-3" style={{backgroundColor: '#e9f5fe', color: '#072146', border: '1px solid #aed6f4'}}>
                  <small>Por favor, revisa que toda la información sea correcta antes de continuar. Al presionar "Confirmar y solicitar", aceptas iniciar el proceso de contratación de tu Crédito de Libranza.</small>
                </div>
                <div className="d-flex justify-content-between mt-4">
                  <button 
                    className="btn btn-outline-light px-4 py-2"
                    onClick={() => setCurrentStep(3)}
                  >
                    Atrás
                  </button>
                  <button 
                    className="btn btn-success px-4 py-2" 
                    style={{ backgroundColor: "#009688", border: "none" }}
                    onClick={handleConfirmAndProceed}
                  >
                    Confirmar y solicitar
                  </button>
                </div>
              </div>
            )}

            {/* Paso 5: Pantalla de Carga */}
            {currentStep === 5 && (
              <div className="text-center p-4" style={{ backgroundColor: 'transparent' }}>
                <div style={{color: '#072146'}}>
                  <h4 className="mb-3">Crédito de Libranza</h4>
                  <div className="spinner-border text-primary mb-4" role="status" style={{width: '3rem', height: '3rem'}}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="fs-5">Ten en cuenta que esta operación puede tomar varios segundos.</p>
                  <p className="fs-5">Espera hasta recibir una respuesta.</p>
                </div>
              </div>
            )}

            {/* Paso 6: Notificación de Éxito */}
            {currentStep === 6 && (
              <div 
                className="p-4 shadow-lg rounded"
                style={{ backgroundColor: '#072146', color: 'white' }}
              >
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h3>Crédito de Libranza</h3>
                  <button className="btn btn-link text-white" onClick={resetFlow}>
                    <i className="fs-5">×</i>
                  </button>
                </div>
                <div className="text-center my-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="#28a745" className="bi bi-check-circle-fill mb-2" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                  </svg>
                  <h4 className="mb-1" style={{color: '#28a745'}}>¡Solicitud en Proceso!</h4>
                  <p className="text-light small">Contratación en proceso: {processingDate}</p>
                </div>
                <CreditSummaryDetails info={creditoInfo} generalPreapprovedValue={creditoInfo.valorPreaprobadoGeneral} />
                <div className="bg-white text-dark p-3 rounded mb-3 text-center">
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#007bff" className="bi bi-info-circle-fill me-2" viewBox="0 0 16 16">
                      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                    </svg>
                    <h6 className="mb-0" style={{color: '#072146'}}>Información Importante</h6>
                  </div>
                  <p className="small mb-1">
                    Estamos verificando tu información. Si nuestra respuesta es positiva, depositaremos el dinero del crédito en tu cuenta asociada.
                  </p>
                  <p className="small mb-1">
                    De ser negativa, te notificaremos por correo electrónico al siguiente día hábil.
                  </p>
                  <hr className="my-2"/>
                  <p className="small mb-0">
                    Recibirás los documentos y el estado de tu solicitud en tu correo electrónico registrado: <strong className="text-primary">{creditoInfo.correoElectronico}</strong>
                  </p>
                </div>
                <div className="text-center mt-4">
                  <button 
                    className="btn btn-primary px-5 py-2" 
                    style={{ backgroundColor: "#007bff", border: "none" }}
                    onClick={resetFlow}
                  >
                    Salir
                  </button>
                </div>
              </div>
            )}
            {/* Fin del código proporcionado por el usuario */}
          </div>
        </div>
      </div>
      <Footer />
      <InfoModal 
        show={modalContent.show}
        title={modalContent.title}
        content={modalContent.content}
        onClose={closeModal}
      />
    </div>
  );
}