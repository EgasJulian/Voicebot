import React from "react";
import CarouselSection from "../components/CarouselSection";
import QuickAccess from "../components/QuickAccess";
import Footer from "../components/Footer";

export default function Home() {
  const oportunidades = [
    {
      titulo: "Crédito de Libranza BBVA",
      descripcion: "Obtén mejores tasas para cumplir tus metas.",
      accion: "Solicitar"
    },
    {
      titulo: "Paga tus préstamos fácilmente",
      descripcion: "Realiza pagos en línea sin complicaciones.",
      accion: "Paga aquí"
    },
    {
      titulo: "Tarjetas de crédito BBVA",
      descripcion: "Descubre todas las ventajas que tenemos para ti.",
      accion: "Conoce más"
    }
  ];

  return (
    <div>
      <div style={{background: "gray", zIndex: 0, width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
      <CarouselSection />
      <QuickAccess />
      <section className="bg-light py-4 flex-grow-1 d-flex flex-column" style={{height: '100%'}}>
        <h2 className="text-center">Más oportunidades</h2>
        <div className="container d-flex justify-content-center flex-wrap gap-4 my-3">
          {oportunidades.map((oportunidad, index) => (
            <div key={index} className="border p-4 rounded shadow" style={{ width: '300px', height: '15rem'}}>
              <h4>{oportunidad.titulo}</h4>
              <p>{oportunidad.descripcion}</p>
              <button className="btn btn-primary w-100 position-relative" style={{ bottom: "-2rem"}}>{oportunidad.accion}</button>
            </div>
          ))}
        </div>
      </section>
      </div>
      <Footer></Footer>
    </div>
  );
} 
