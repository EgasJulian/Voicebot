import React from "react";
import Footer from "../components/Footer";
import "../styles/QuickAccess.css";
import { Link } from "react-router-dom";

export default function Seguro() {
  const seguros = [
    { 
      img: "/cajeros-bbva-card.jpg",
      tipo: "Seguro Hurto ATM", 
      beneficios: [
        "Protección contra robos en cajeros automáticos.",
        "Cobertura de dinero retirado en caso de hurto.",
        "Asistencia legal en caso de incidentes.",
        "Indemnización por lesiones durante el asalto."
      ]
    },
    { 
      img: "/Woman-sea-sunset-mountains.jpg",
      tipo: "Seguro Vida Integral Premium", 
      beneficios: [
        "Cobertura en caso de fallecimiento por cualquier causa.",
        "Indemnización por invalidez total y permanente.",
        "Asistencia funeraria sin costo adicional.",
        "Opciones de ahorro e inversión a largo plazo."
      ]
    },
    { 
      img: "oncologico.jpg",
      tipo: "Seguro Oncológico", 
      beneficios: [
        "Cobertura total de tratamientos oncológicos.",
        "Acceso a consultas y diagnósticos especializados.",
        "Indemnización por diagnóstico de cáncer.",
        "Soporte psicológico y asesoría médica."
      ]
    },
    { 
      img: "/seguro-de-vida-vital.jpg",
      tipo: "Seguro Familia Vital", 
      beneficios: [
        "Cobertura médica para toda la familia.",
        "Acceso a consultas con especialistas.",
        "Reembolso por hospitalización y cirugías.",
        "Asistencia médica en el hogar."
      ]
    },
    { 
      img: "/seguro-de-vida-vital.jpg",
      tipo: "Seguro Accidentes Personales Salud", 
      beneficios: [
        "Indemnización por accidentes personales.",
        "Reembolso de gastos médicos por accidente.",
        "Cobertura de incapacidad temporal o permanente.",
        "Asistencia médica de emergencia 24/7."
      ]
    }
  ];

  return (
      <div>
          <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ background: "#f8f9fa", padding: "40px" }}>
            <div className="container d-flex justify-content-center flex-wrap gap-4">
              {seguros.map((tarjeta, index) => (
                <div key={index} className="card border-0 shadow-sm d-flex flex-column" style={{ width: "320px", minHeight: "500px" }}>
                  {/* Imagen de la tarjeta */}
                  <img src={tarjeta.img} className="card-img-top" alt={tarjeta.tipo} />
  
                  {/* Contenido de la tarjeta */}
                  <div className="card-body d-flex flex-column flex-grow-1">
                    <h5 className="fw-bold text-dark p-2">{tarjeta.tipo}</h5>
  
                    {/* Lista de beneficios con "-" */}
                    <ul className="list-unstyled text-muted flex-grow-1">
                      {tarjeta.beneficios.map((beneficio, i) => (
                        <li className="p-1" key={i}>- {beneficio}</li>
                      ))}
                    </ul>
  
  
                    {/* Botones alineados abajo */}
                    <div className="custom-card mt-auto">
                      <Link className="text-decoration-none" style={{ color: '#1e76b9' }}> <h6 className="fw-bold">Más información</h6></Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        <Footer></Footer>
      </div>
    );
}
