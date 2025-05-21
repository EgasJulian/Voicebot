import React, { useState, useEffect } from "react";
import Footer from "../components/Footer"; // Assuming Footer component exists
import InfoModal from './InfoModal'; // Import the InfoModal component

// Helper component for consistent summary display (from previous response)
const CreditSummaryDetails = ({ info, generalPreapprovedValue }) => {
  // ... (code from previous response, no changes here)
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
  const [showDetails, setShowDetails] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAccount, setSelectedAccount] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [processingDate, setProcessingDate] = useState("");

  // State for Info Modal
  const [modalContent, setModalContent] = useState({ show: false, title: '', content: '' });

  const infoTooltips = {
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
      content: "Los intereses del período de gracia y/o corrimiento son parte de la capitalización de intereses y serán sumados al capital total que debes pagar. Esto se hace según el Decreto 1454 de 1989, de modo que los intereses se calcularán sobre el valor que debes."
    },
    valorTotalDelSeguro: {
      title: "Valor Total del Seguro",
      content: "Representa la suma de todas las cuotas de seguro que pagarás durante toda la vida de tu crédito. Este valor ya está contemplado en tu cuota mensual con seguro.",
    }
  };

  const openModal = (tooltipKey) => {
    if (infoTooltips[tooltipKey]) {
      setModalContent({
        show: true,
        title: infoTooltips[tooltipKey].title,
        content: infoTooltips[tooltipKey].content,
      });
    }
  };

  const closeModal = () => {
    setModalContent({ show: false, title: '', content: '' });
  };
  
  // Info Icon Component
  const InfoIcon = ({ onClick }) => (
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


  // Datos del crédito (rest of your creditoInfo definition from previous response)
   const creditoInfo = {
    titulo: "Crédito de Libranza",
    valorPreaprobadoGeneral: "$28.000.000,00", 
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
      valorPorcentualTotal: "19.20%", // Matched image_f05528.png
      tasaEfectivaAnual: "18.50%", // Matched image_f05528.png
      seguroDeCorrimiento: "$3.328,09", // Matched image_f05528.png
      comisionDeEstudio: "$130.900,00", // Matched image_f05528.png
      valorInicial: "$18.000.000", // Matched image_f05528.png "Valor inicial" $18.000.000
      valorTotalIntereses: "$8.000.000,00", // Matched image_f05528.png
      valorTotalDelSeguro: "$682.572,54", // Matched image_f05528.png
      cuotaMensualSinSeguro: "$573.919,00", // Matched image_f05528.png
      valorMensualSeguro: "$50.000,00", // Matched image_f05528.png
      valorTotalAPagar: "$26.932.243,60", // Matched image_f05528.png
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
      { nombre: "Autorización del crédito", id: "autorizacion", isPdf: true, pdfPath: "/REGLAMENTO DE CREDITO DE LIBRANZA.pdf" }, //ajustar con docs reales
      { nombre: "Pagaré electrónico", id: "pagare", isPdf: true, pdfPath: "/REGLAMENTO DE CREDITO DE LIBRANZA.pdf" }
    ],
    correoElectronico: "col@mail.com" 
  };


  const resetFlow = () => {
    // ... (code from previous response)
    setCurrentStep(1);
    setShowDetails(false);
    setSelectedAccount(0);
    setTermsAccepted(false);
    setProcessingDate("");
    closeModal(); // Close modal on reset
  };

  const handleConfirmAndProceed = () => {
    // ... (code from previous response)
    setCurrentStep(5); 
    const now = new Date();
    setProcessingDate(
        now.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) + 
        ', ' + 
        now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })
    );
    setTimeout(() => {
      setCurrentStep(6); 
    }, 3000); 
  };

  return (
    <div>
      {/* ... (Outer container div and styling from previous response) ... */}
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
                {/* ... (Header and initial content of Step 1 from previous response) ... */}
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

                {/* Detalles de Tasas y Costos - UPDATED with InfoIcon */}
                {showDetails && (
                  <div className="bg-white text-dark p-3 rounded mb-3">
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
                  {/* ... (Continuar button for Step 1) ... */}
                   <div className="text-center mt-4">
                    <button 
                        className="btn btn-success px-4 py-2" 
                        style={{ backgroundColor: "#009688", border: "none" }}
                        onClick={() => setCurrentStep(2)}
                    >
                        Continuar
                    </button>
                    </div>
              </div>
            )}

            {/* Paso 2: Selección de cuenta (code from previous response, no changes here) */}
            {currentStep === 2 && (
              // ... (Step 2 JSX from previous response)
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
                                backgroundColor: '#007bff', // Blue check indicator
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                              }}>✓</div>
                            </div>
                          )}
                        </div>
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
                    disabled={selectedAccount === null}
                    onClick={() => setCurrentStep(3)}
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
                {/* ... (Header and other content of Step 3) ... */}
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
                          <a href="#" className="text-primary text-decoration-none">{documento.nombre}</a> // Placeholder for other docs
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
                {/* ... (Continuar button for Step 3) ... */}
                <div className="text-center mt-4">
                  <button 
                    className="btn btn-success px-4 py-2" 
                    style={{ 
                      backgroundColor: termsAccepted ? "#009688" : "#cccccc", 
                      border: "none" 
                    }}
                    disabled={!termsAccepted}
                    onClick={() => setCurrentStep(4)} 
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}
            
            {/* Paso 4: Resumen de la Operación (code from previous response, no changes here) */}
            {currentStep === 4 && (
                // ... (Step 4 JSX from previous response)
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
                            onClick={() => setCurrentStep(3)} // Go back to Terms
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

            {/* Paso 5: Pantalla de Carga (code from previous response, no changes here) */}
            {currentStep === 5 && (
                // ... (Step 5 JSX from previous response)
                 <div className="text-center p-4" style={{ backgroundColor: 'transparent' }}> {/* Transparent to use container's white */}
                    <div style={{color: '#072146'}}>
                        <h4 className="mb-3">Crédito de Libranza</h4>
                        {/* Simple Spinner */}
                        <div className="spinner-border text-primary mb-4" role="status" style={{width: '3rem', height: '3rem'}}>
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="fs-5">Ten en cuenta que esta operación puede tomar varios segundos.</p>
                        <p className="fs-5">Espera hasta recibir una respuesta.</p>
                    </div>
                </div>
            )}

            {/* Paso 6: Notificación de Éxito (code from previous response, no changes here) */}
            {currentStep === 6 && (
                // ... (Step 6 JSX from previous response)
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
                        {/* Success Icon (example) */}
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
                            style={{ backgroundColor: "#007bff", border: "none" }} // Using a standard primary blue
                            onClick={resetFlow}
                        >
                            Salir
                        </button>
                    </div>
                </div>
            )}

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