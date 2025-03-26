import React from "react";
import Footer from "../components/Footer";

export default function Cuenta() {
  const cuentas = [
    {
      tipo: "Cuenta de Ahorros",
      descripcion: "Ideal para ahorrar con intereses atractivos y sin comisiones por manejo.",
      beneficios: ["Sin cuota de manejo", "Acceso en línea 24/7", "Tarjeta débito gratis"]
    },
    {
      tipo: "Cuenta Corriente",
      descripcion: "Perfecta para manejo de grandes sumas y transacciones frecuentes.",
      beneficios: ["Chequera disponible", "Líneas de crédito asociadas", "Facilidad de pagos"]
    },
    {
      tipo: "Cuenta Nómina",
      descripcion: "Especial para recibir tu salario con beneficios exclusivos.",
      beneficios: ["Avances sin costo", "Créditos preaprobados", "Descuentos en servicios"]
    }
  ];

  return (
    <div>  
      <div
        className="container-fluid py-5"
        style={{
          backgroundColor: 'white',
          zIndex: 0,
          width: '100%',
          minHeight: '100vh'
        }}
      >
        <h2 className="text-center text-dark fw-bold mb-4">Tipos de Cuentas</h2>
        <div className="d-flex flex-wrap justify-content-center gap-4">
          {cuentas.map((cuenta, index) => (
            <div
              key={index}
              className="p-4 shadow-lg rounded d-flex flex-column"
              style={{ width: '20rem', backgroundColor: '#ffffff', minHeight: '22rem' }}
            >
              <h4 className="fw-bold mb-2" style={{color: "#072146"}}>{cuenta.tipo}</h4>
              <p className="text-muted flex-grow-1">{cuenta.descripcion}</p>
              <ul className="list-unstyled flex-grow-1">
                {cuenta.beneficios.map((beneficio, i) => (
                  <li key={i} className="text-primary">
                    ✔️ {beneficio}
                  </li>
                ))}
              </ul>
              <button className="btn btn-success w-100 mt-auto" style={{background: "#072146"}}>Abrir Cuenta</button>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>

  );
  
} 
