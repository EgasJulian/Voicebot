import React from "react";
import CarouselSection from "../components/CarouselSection";
import { useNavigate } from "react-router-dom";
import QuickAccess from "../components/QuickAccess";
import Footer from "../components/Footer";

export default function Home() {
  const navigate = useNavigate();

  const oportunidades = [
    {
      id: "libranza",
      titulo: "Crédito de Libranza",
      descripcion: "Obtén mejores tasas para cumplir tus metas.",
      accion: "Solicitar",
      ruta: "/credito"
    },
    {
      id: "pagos",
      titulo: "Paga tus préstamos fácilmente",
      descripcion: "Realiza pagos en línea sin complicaciones.",
      accion: "Paga aquí"
    },
    {
      id: "tarjetas",
      titulo: "Tarjetas de crédito",
      descripcion: "Descubre todas las ventajas que tenemos para ti.",
      accion: "Conoce más"
    }
  ];

  const handleNavigation = (ruta) => {
    navigate(ruta);
  };

  return (
    <div>
      <div style={{background: "gray", zIndex: 0, width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
      <CarouselSection />
      <QuickAccess />
      <section className="bg-light py-4 flex-grow-1 d-flex flex-column" style={{height: '100%'}}>
        <h2 className="text-center">Más oportunidades </h2>
        <div className="container d-flex justify-content-center flex-wrap gap-4 my-3">
          {oportunidades.map((oportunidad) => (
            <div key={oportunidad.id} className="card shadow-sm" style={{ width: "300px", height: "13rem" }}>
              <div className="card-body d-flex flex-column h-100">
                <h5 className="card-title">{oportunidad.titulo}</h5>
                <p className="card-text flex-grow-1">{oportunidad.descripcion}</p>
                <button 
                  className="btn btn-primary w-100 mt-auto"
                  onClick={() => handleNavigation(oportunidad.ruta)}
                  >
                    {oportunidad.accion}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      </div>
      <Footer></Footer>
    </div>
  );
} 
