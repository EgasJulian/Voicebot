import React from "react";
import { Link } from "react-router-dom";


export default function Header() {
  return (
    <nav style={{background: "#072146"}} className="navbar navbar-expand-lg navbar-dark px-4">
      <Link className="navbar-brand" to="/">
        <img src="logo_bbva_blanco.svg" alt="Logo BBVA Colombia - Creando Oportunidades" role="img" style={{ width: "150px", height: "auto", display: "block" }}/>
      </Link>
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav ms-auto">
          <li className="nav-item">
            <a className="nav-link active" href="#">Personas</a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">Empresas</a>
          </li>
          <li className="nav-item">
            <button className="btn btn-info text-white">Acceso</button>
          </li>
        </ul>
      </div>
    </nav>
    
  );
} 
