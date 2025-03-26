import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Cuenta from "./pages/Cuenta";
import Tarjeta from "./pages/Tarjeta";
import Pagar from "./pages/Pagar";
import Prestamo from "./pages/Prestamo";
import Invertir from "./pages/Invertir";
import Seguro from "./pages/Seguro";
import Layout from "./pages/Layout";
import MortgageCalculator from './pages/SimulacionPrestamo'

export default function App() {
  return (
    <Router>
      <Header />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cuenta" element={<Cuenta />} />
          <Route path="/tarjeta" element={<Tarjeta />} />
          <Route path="/pagar" element={<Pagar />} />
          <Route path="/prestamo" element={<Prestamo />} />
          <Route path="/invertir" element={<Invertir />} />
          <Route path="/seguro" element={<Seguro />} />
          <Route path="/simulacion_hipoteca" element={<MortgageCalculator />}></Route>
        </Routes>
      </Layout>
    </Router>
  );
}