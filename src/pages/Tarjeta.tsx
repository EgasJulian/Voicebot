import Footer from "../components/Footer";

export default function Tarjeta() {
  const tarjetas = [
    { 
      img: "/visa_classic_card_400x225.webp",
      tipo: "Tarjeta de Crédito Clásica",
      descripcion: "Ideal para compras diarias con beneficios básicos.",
      beneficios: [
        "$0 en cuota de manejo con tu Nómina.",
        "Pago total o parcial de compras puntuales sin recargo."      ]
    },
    { 
      img: "/Captura de pantalla 2025-03-28 093919.png",
      tipo: "Tarjeta de Crédito Coral",
      descripcion: "Para cuidar tus finanzas, cuidando los corales del Caribe.",
      beneficios: [
        "Se aporta 0.66% de tu facturación mensual a la restauración de corales.",
        "Con Apple Pay, puedes pagar de forma rápida y fácil con tu tarjeta desde tu iPhone o Apple Watch.",
        "$0 cuota de manejo por 6 meses."
      ]
    },
    { 
      img: "/Captura de pantalla 2025-03-28 095257.png",
      tipo: "Tarjeta de Crédito Ara",
      descripcion: "Para ahorrar todo el año en lo que realmente importa.",
      beneficios: [
        "5% de devolución para ti por comprar $50.000 o más en Tiendas ara. Valor límite de la devolución hasta $50.000 mensuales por cliente.",
        "$0 en cuota de manejo."
      ]
    },
    { 
      img: "/Captura de pantalla 2025-03-28 095747.png",
      tipo: "Tarjeta de Crédito Aqua",
      descripcion: "Para acumular el doble de puntos cuando compres por internet.",
      beneficios: [
        "$0 en cuota de manejo si tienes Nómina.",
        "Con Apple Pay, puedes pagar de forma rápida y fácil con tu tarjeta desde tu iPhone o Apple Watch.",
        "Avances a partir de los 6 meses de uso. Sujeto a categoría de producto."
      ]
    },
    { 
      img: "/Captura de pantalla 2025-03-28 094017.png",
      tipo: "Tarjeta de Crédito Congelada",
      descripcion: "Para pagar siempre la misma cuota sin importar el monto de tus compras.",
      beneficios: [
        "Puntos por cada compra que hagas.",
        "50% de tu cupo disponible en avances."
      ]
    }
    ,
    { 
      img: "/Captura de pantalla 2025-03-28 094054.png",
      tipo: "Tarjeta de Crédito Black",
      descripcion: "Para manejar tus finanzas con una tarjeta de crédito a tu altura.",
      beneficios: [
        "$0 cuota de manejo con tu Nómina.",
        "10 ingresos gratis para ti y tu acompañante a salas VIP de aeropuertos internacionales, al año."
      ]
    }
  ];

  return (
    <div>
        <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ background: "#f8f9fa", padding: "40px" }}>
          <div className="container d-flex justify-content-center flex-wrap gap-4">
            {tarjetas.map((tarjeta, index) => (
              <div
              key={index}
              className="card border-0 shadow-sm d-flex flex-column"
              style={{ width: "320px", height: "550px" }}
            >
              {/* Imagen de la tarjeta */}
              <img
                src={tarjeta.img}
                className="card-img-top"
                alt={tarjeta.tipo}
                style={{ height: "200px", objectFit: "cover" }}
              />
            
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
            
                {/* Botón alineado abajo */}
                <div className="mt-auto">
                  <button
                    className="btn w-100 fw-bold"
                    style={{ background: "#028484", color: "white" }}
                  >
                    Quiero la mía
                  </button>
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