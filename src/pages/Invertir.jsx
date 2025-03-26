import React from "react";
import Footer from "../components/Footer";


export default function Invertir() {
  const inversionesBBVA = [
    {
      img: "Fondo-BBVA-Digital.im1726257023629im.jpg",
      tipo: "Fondo BBVA Digital",
      beneficios: [
        "Inversión inicial desde $20.000",
        "Tiempo de inversión a corto plazo",
        "Disponibilidad de tu dinero inmediata",
        "Rentabilidad histórica anual 2023 de 16,29% E.A.",
        "Comisión de administración de 1,00 % E.A."
      ]
    },
    {
      img: "/banner-enterprises-card.im1572963815338im.jpg",
      tipo: "CDT Tradicional",
      beneficios: [
        "Ahorro a bajo riesgo con alta rentabilidad",
        "Plazos de inversión de 2 hasta 12 meses (1 año)"
      ]
    },
    {
      img: "/Inversion-Banca-Personal-CARD.im1562275027991im.jpg",
      tipo: "CDT Largo Plazo",
      beneficios: [
        "Atractiva rentabilidad con tasa fija",
        "Plazos de inversión hasta 36 meses (3 años)"
      ]
    },
    {
      img: "/Fondo-BBVA-Paramo.im1726257026716im.jpg",
      tipo: "Fondo BBVA Páramo",
      beneficios: [
        "Inversión inicial desde $20.000",
        "Tiempo de inversión a mediano - largo plazo",
        "Disponibilidad de tu dinero inmediata",
        "Rentabilidad histórica anual 2023 de 28,22% E.A.",
        "Comisión de administración de 1,20 % E.A."
      ]
    },
    {
      img: "/Crosseling-Creditos-y-prestamos-para-empresas.im1644877928159im.jpg",
      tipo: "CDT IBR",
      beneficios: [
        "Contrata un CDT en pesos y genera rentabilidad según la tasa de IBR",
        "Plazos de inversión hasta 36 meses (3 años)"
      ]
    },
    {
      img: "/Seguridad-bbva-tips-mobile.im1662651444333im.jpg",
      tipo: "CDT Tasa Variable DTF",
      beneficios: [
        "Contrata un CDT en pesos y genera rentabilidad según la tasa de DTF",
        "Plazos de inversión hasta 36 meses (3 años)"
      ]
    },
    {
      img: "/Fondo-BBVA-Efectivo-Clase-A.im1726257026528im.jpg",
      tipo: "Fondo BBVA Efectivo",
      beneficios: [
        "Inversión inicial desde $50.000",
        "Tiempo de inversión a corto plazo",
        "Disponibilidad de tu dinero inmediata",
        "Rentabilidad histórica anual 2023 de 13,80% E.A.",
        "Comisión de administración de 1,65 % E.A."
      ]
    },
    {
      img: "/BBVA-Card-Landing-Amor-y-amistad-CDT.im1694554656957im.jpg",
      tipo: "CDT Online",
      beneficios: [
        "Ahorra e invierte en un CDT Online",
        "Si inviertes desde $500.000 a $5.000.000 obtienes una rentabilidad con tasa fija",
        "Administración desde la App BBVA o BBVA net"
      ]
    }
  ];

  return (
    <div>
        <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ background: "#f8f9fa", padding: "40px" }}>
          <div className="container d-flex justify-content-center flex-wrap gap-4">
            {inversionesBBVA.map((tarjeta, index) => (
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
                  <div className="mt-auto">

                    <button className="btn w-100 fw-bold" style={{background: "#028484", color: "white"}}>Solicítalo aquí</button>
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
