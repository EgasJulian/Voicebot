import React from "react";
import Footer from "../components/Footer";

export default function Tarjeta() {
  const tarjetas = [
    { 
      img: "/tarjeta-de-credito-Clasica-Visa.jpg",
      tipo: "Tarjeta de Crédito Clásica",
      descripcion: "Ideal para compras diarias con beneficios básicos.",
      beneficios: [
        "$0 en cuota de manejo con tu Nómina BBVA.",
        "Pago total o parcial de compras puntuales sin recargo."      ]
    },
    { 
      img: "/tarjeta-de-credito-Coral.jpg",
      tipo: "Tarjeta de Crédito Coral",
      descripcion: "Para cuidar tus finanzas, cuidando los corales del Caribe colombiano.",
      beneficios: [
        "BBVA aporta 0.66% de tu facturación mensual a la restauración de corales.",
        "Con Apple Pay, puedes pagar de forma rápida y fácil con tu tarjeta BBVA desde tu iPhone o Apple Watch.",
        "$0 cuota de manejo por 6 meses."
      ]
    },
    { 
      img: "/tarjeta-de-credito-Ara.jpg",
      tipo: "Tarjeta de Crédito Ara Visa",
      descripcion: "Para ahorrar todo el año en lo que realmente importa.",
      beneficios: [
        "5% de devolución para ti por comprar $50.000 o más en Tiendas ara. Valor límite de la devolución hasta $50.000 mensuales por cliente.",
        "Con Apple Pay, puedes pagar de forma rápida y fácil con tu tarjeta BBVA desde tu iPhone o Apple Watch.",
        "$0 en cuota de manejo."
      ]
    },
    { 
      img: "/Tarjeta-de-credito-Aqua-Clasica.jpg",
      tipo: "Tarjeta de Crédito Aqua Visa",
      descripcion: "Para acumular el doble de puntos cuando compres por internet.",
      beneficios: [
        "$0 en cuota de manejo si tienes Nómina BBVA.",
        "Con Apple Pay, puedes pagar de forma rápida y fácil con tu tarjeta BBVA desde tu iPhone o Apple Watch.",
        "Avances a partir de los 6 meses de uso. Sujeto a categoría de producto."
      ]
    },
    { 
      img: "/tarjeta-de-credito-Congelada.jpg",
      tipo: "Tarjeta de Crédito Congelada Visa",
      descripcion: "Para pagar siempre la misma cuota sin importar el monto de tus compras.",
      beneficios: [
        "Puntos BBVA por cada compra que hagas.",
        "50% de tu cupo disponible en avances."
      ]
    }
    ,
    { 
      img: "/tarjeta-de-credito-Black-Master.jpg",
      tipo: "Tarjeta de Crédito Black Mastercard",
      descripcion: "Para manejar tus finanzas con una tarjeta de crédito a tu altura.",
      beneficios: [
        "$0 cuota de manejo con tu Nómina BBVA.",
        "10 ingresos gratis para ti y tu acompañante a salas VIP de aeropuertos internacionales, al año."
      ]
    }
  ];

  return (
    <div>
        <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ background: "#f8f9fa", padding: "40px" }}>
          <div className="container d-flex justify-content-center flex-wrap gap-4">
            {tarjetas.map((tarjeta, index) => (
              <div key={index} className="card border-0 shadow-sm d-flex flex-column" style={{ width: "320px", minHeight: "500px" }}>
                {/* Imagen de la tarjeta */}
                <img src={tarjeta.img} className="card-img-top" alt={tarjeta.tipo} />

                {/* Contenido de la tarjeta */}
                <div className="card-body d-flex flex-column flex-grow-1">
                  <h5 className="fw-bold text-dark">{tarjeta.tipo}</h5>
                  <p className="text-muted">{tarjeta.descripcion}</p>

                  {/* Lista de beneficios con "-" */}
                  <ul className="list-unstyled text-muted flex-grow-1">
                    {tarjeta.beneficios.map((beneficio, i) => (
                      <li key={i}>- {beneficio}</li>
                    ))}
                  </ul>


                  {/* Botones alineados abajo */}
                  <div className="mt-auto">

                    <button className="btn w-100 fw-bold" style={{background: "#028484", color: "white"}}>Quiero la mía</button>
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