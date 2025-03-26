import React from "react";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import "../styles/QuickAccess.css";

export default function Pagar() {
  const opcionesPago = [
    { label: "Cuentas de ahorro y corrientes", icon: "💳", desc: "Transfiere y recarga dinero a cuentas BBVA."},
    { label: "Dinero móvil", icon: "💳", desc: "Transfiere y recarga dinero solo con el número de celular del destinatario." },
    { label: "Tarjeta de crédito", icon: "💳", desc: "Paga tarjetas de crédito BBVA que sean tuyas o de alguien más."},
    { label: "Préstamos", icon: "💵", desc: "Abona a créditos BBVA que sean tuyos o de alguien más."},
  ];

  return (
    <div>
      <div style={{backgroundColor: 'white', padding: '1rem' , zIndex: 0,
        width: '100%',
        minHeight: '100%'}}>
        <h2 className="text-center fw-normal mb-5 mt-3">Paga o recarga en línea y sin costo</h2>
        <h5 className="text-center fw-lighter mb-4">El botón PSE es la forma más fácil y rápida para hacer pagos y recargas desde otros bancos a productos BBVA, ya sean tuyos o de otros. Elige la opción que necesites.</h5>
        <div className="container d-flex justify-content-center flex-wrap gap-4">
          {opcionesPago.map((opcion, index) => (
            <div key={index} className="custom-card col-4 col-md-2 d-flex justify-content-center">
              <div className="custom-card p-3 d-flex flex-column align-items-center justify-content-center text-center flex-grow-1" style={{ height: '100%' }}>
                <div className="fs-1 mb-2 flex-grow-1">{opcion.icon}</div>
                <h5 className="fw-bold flex-grow-1">{opcion.label}</h5>
                <div className="fw-lighter fs-10 flex-grow-1">{opcion.desc}</div>
                <Link className="text-decoration-none flex-grow-1"><h6 className="fw-bold py-3">Conoce más</h6></Link>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer></Footer>
    </div>
  );
}
