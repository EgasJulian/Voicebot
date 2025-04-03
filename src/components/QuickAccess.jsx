import React from "react";
import { Link } from "react-router-dom";
import "../styles/QuickAccess.css";

export default function QuickAccess() {
  const items = [
    { label: "Necesito una cuenta", icon: "💳", path: "/cuenta" },
    { label: "Quiero una tarjeta", icon: "💳", path: "/tarjeta" },
    { label: "Quiero pagar y recargar", icon: "💰", path: "/pagar" },
    { label: "Necesito un préstamo", icon: "💵", path: "/prestamo" },
    { label: "Quiero invertir", icon: "📈", path: "/invertir" },
    { label: "Quiero un seguro", icon: "🛡️", path: "/seguro" },
  ];

  return (
    <div
      style={{ background: 'white', width: '100vw' }}
      className="d-flex flex-column align-items-center justify-content-center py-5 text-center"
    >
      <h2 className="fw-normal mb-2" style={{ color: 'black', fontSize: 38 }}>
        ¿Qué necesito hoy?
      </h2>
      <div className="row justify-content-center">
        {items.map((item, index) => (
          <div key={index} className="custom-card col-6 col-md-4 col-lg-2 mb-4 d-flex justify-content-center">
            <Link to={item.path} className="text-decoration-none" style={{ color: '#1e76b9' }}>
              <div className="p-2 d-flex flex-column align-items-center justify-content-center text-center" style={{ height: '100%' }}>
                <div className="fs-1 mb-2">{item.icon}</div>
                <h6 className="fw-bold">{item.label}</h6>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}