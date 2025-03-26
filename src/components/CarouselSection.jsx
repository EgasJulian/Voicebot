import React from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

export default function CarouselSection() {
    (
        <div style={{background: "white"}} className="container my-4">
          <Carousel showThumbs={false} autoPlay infiniteLoop>
            <div className="bg-primary text-white text-center p-5 rounded">
              <h2 className="display-5 fw-bold">Más cerca de lo que quieres</h2>
              <p className="lead">Gracias al convenio de tu empresa con BBVA, obtén mejor tasa para hacer realidad tus metas.</p>
              <button className="btn btn-info text-white">Solicitar</button>
            </div>
            <div className="bg-info text-white text-center p-5 rounded">
              <h2 className="display-5 fw-bold">Haz crecer tus ahorros</h2>
              <p className="lead">Invierte con seguridad y confianza en BBVA.</p>
              <button className="btn btn-primary">Conoce más</button>
            </div>
          </Carousel>
        </div>
      );
} 