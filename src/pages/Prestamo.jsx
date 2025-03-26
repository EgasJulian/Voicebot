import {React, useEffect} from "react";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

export default function Prestamo() {
  const prestamos = [
    { 
      img: "/credito-Libranza-bbva.jpg",
      tipo: "Crédito de Libranza BBVA",
      descripcion: "Ideal para compras diarias con beneficios básicos.",
      beneficios: [
        "Con mejor tasa que un crédito de consumo tradicional de BBVA.",
        "Descuento automático de tu cuota fija a través de tu cuenta de nómina.",
        "Solicitud del producto y tasa de interés de acuerdo al convenio de tu empresa con BBVA.",
        "Un crédito que puedes utilizar en tu compra de cartera o para lo que necesites."
      ]
    },
    { 
      img: "/BBVA-Card-Landing-Vehiculo-Nuevo-o-usado.jpg",
      tipo: "Crédito de vehículo nuevo o usado de servicio particular",
      descripcion: "Te financiamos hasta el 100% de tu vehículo nuevo o usado",
      beneficios: [
        "Puedes pagarlo hasta en 84 meses",
        "Cuotas y tasa fija",
        "Consolida los ingresos con tu familia",
        "No existe costo por estudio de crédito",
        "Con o sin prenda"
      ]
    },
    { 
      img: "/BBVA-Card-Landing-Vivienda-Credito-hipotecario.jpg",
      tipo: "Crédito Hipotecario",
      descripcion: "Para ahorrar todo el año en lo que realmente importa.",
      beneficios: [
        "Adquiere vivienda nueva o usada",
        "Plazos desde 5 hasta  30 años*",
        "Financiamos hasta el 70% del valor para vivienda No VIS (superior a 135 SMLMV).",
        "Financiado hasta el 80% del valor para vivienda VIS (inferior 150 SMLMV para las poblaciones decretadas por el Gobierno Nacional o 135 SMLMV para el resto del país)."
      ]
    },
    { 
      img: "/creditos-libre-inversion.jpg",
      tipo: "Crédito de Libre Inversión",
      descripcion: "Para acumular el doble de puntos cuando compres por internet.",
      beneficios: [
        "Con este tipo de crédito puedes cumplir el sueño que tienes en mente. ¡simula tu crédito hasta $20.000.000 y conoce más de esta alternativa de préstamo!"
      ]
    }
  ];
  

  return (
    <div>
        <div className="d-flex justify-content-center align-items-center min-vh-100" style={{ background: "#f8f9fa", padding: "40px" }}>
          <div className="container d-flex justify-content-center flex-wrap gap-4">
            {prestamos.map((tarjeta, index) => (
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
                    <Link to={'/simulacion_hipoteca'}>
                      <button className="btn w-100 fw-bold" style={{background: "#028484", color: "white"}}>Simula tu crédito</button>
                    </Link>
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