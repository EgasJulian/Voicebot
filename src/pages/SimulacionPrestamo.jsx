import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Footer from '../components/Footer';

const MortgageCalculator = () => {

  // Estados para los inputs del usuario
  const [loanAmount, setLoanAmount] = useState(10000);
  const [interestRate, setInterestRate] = useState(5);
  const [loanTerm, setLoanTerm] = useState(30);
  const [downPayment, setDownPayment] = useState(1000);
  
  // Estados para los resultados calculados
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [amortizationData, setAmortizationData] = useState([]);

  // Cargar valores iniciales desde localStorage o establecer valores predeterminados
  useEffect(() => {
    // Cargar valores de localStorage o establecer valores predeterminados
    if (!localStorage.getItem("loanAmount")) {
      localStorage.setItem("loanAmount", 250000);
    } else {
      setLoanAmount(Number(localStorage.getItem("loanAmount")));
    }

    if (!localStorage.getItem("interestRate")) {
      localStorage.setItem("interestRate", 5);
    } else {
      setInterestRate(Number(localStorage.getItem("interestRate")));
    }

    if (!localStorage.getItem("loanTerm")) {
      localStorage.setItem("loanTerm", 30);
    } else {
      setLoanTerm(Number(localStorage.getItem("loanTerm")));
    }

    if (!localStorage.getItem("downPayment")) {
      localStorage.setItem("downPayment", 40000);
    } else {
      setDownPayment(Number(localStorage.getItem("downPayment")));
    }

    // Configurar event listener para cambios en localStorage de otras pestañas
    window.addEventListener('storage', handleStorageChange);
    
    // Intervalos para verificar cambios en localStorage (útil cuando los cambios ocurren en la misma pestaña)
    const intervalId = setInterval(checkLocalStorageChanges, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  // Manejar cambios en localStorage desde otras pestañas
  const handleStorageChange = (e) => {
    if (e.key === "loanAmount") {
      setLoanAmount(Number(e.newValue));
    } else if (e.key === "interestRate") {
      setInterestRate(Number(e.newValue));
    } else if (e.key === "loanTerm") {
      setLoanTerm(Number(e.newValue));
    } else if (e.key === "downPayment") {
      setDownPayment(Number(e.newValue));
    }
  };

  // Verificar periódicamente cambios en localStorage (para la misma pestaña)
  const checkLocalStorageChanges = () => {
    const storedLoanAmount = Number(localStorage.getItem("loanAmount"));
    const storedInterestRate = Number(localStorage.getItem("interestRate"));
    const storedLoanTerm = Number(localStorage.getItem("loanTerm"));
    const storedDownPayment = Number(localStorage.getItem("downPayment"));

    if (storedLoanAmount !== loanAmount) {
      setLoanAmount(storedLoanAmount);
    }
    if (storedInterestRate !== interestRate) {
      setInterestRate(storedInterestRate);
    }
    if (storedLoanTerm !== loanTerm) {
      setLoanTerm(storedLoanTerm);
    }
    if (storedDownPayment !== downPayment) {
      setDownPayment(storedDownPayment);
    }
  };

  // Calcular los pagos del préstamo cuando cambien los inputs
  useEffect(() => {
    calculateMortgage();
    
    // Actualizar localStorage cuando los valores del estado cambien
    localStorage.setItem("loanAmount", loanAmount);
    localStorage.setItem("interestRate", interestRate);
    localStorage.setItem("loanTerm", loanTerm);
    localStorage.setItem("downPayment", downPayment);
    
  }, [loanAmount, interestRate, loanTerm, downPayment]);

  const calculateMortgage = () => {
    const principal = loanAmount - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    // Calcular el pago mensual usando la fórmula de amortización
    const x = Math.pow(1 + monthlyRate, numberOfPayments);
    const monthly = (principal * x * monthlyRate) / (x - 1);

    if (isFinite(monthly)) {
      setMonthlyPayment(monthly);
      setTotalPayment(monthly * numberOfPayments);
      setTotalInterest(monthly * numberOfPayments - principal);

      // Crear datos para la gráfica de amortización
      const amortizationChart = [];
      let balance = principal;
      let totalInterestPaid = 0;
      let totalPrincipalPaid = 0;

      for (let i = 1; i <= numberOfPayments; i++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthly - interestPayment;
        
        totalInterestPaid += interestPayment;
        totalPrincipalPaid += principalPayment;
        balance -= principalPayment;

        // Agregar datos solo para ciertos meses para no sobrecargar la gráfica
        if (i % 12 === 0 || i === 1 || i === numberOfPayments) {
          amortizationChart.push({
            month: i,
            year: Math.ceil(i / 12),
            balance: balance > 0 ? balance : 0,
            totalInterestPaid,
            totalPrincipalPaid
          });
        }
      }
      setAmortizationData(amortizationChart);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Función para manejar cambios en los inputs y actualizar tanto el estado como localStorage
  const handleInputChange = (setter, key, value) => {
    setter(value);
    localStorage.setItem(key, value);
  };

  return (
    <div>
      <div style={{background: "white"}}>
        <div style={{background: "white", minHeight: '100vh'}} className="flex flex-col md:flex-row gap-6 p-6 bg-gray-50 rounded-lg shadow">
          <div style={{marginLeft: '1rem', paddingTop: '1rem', width: '98%'}}>
            <h3 className="text-2xl font-bold mb-4">Calculadora de Préstamo</h3>
            
            {/* Box informativo que muestra el monto actual del préstamo */}
            <div style={{
              backgroundColor: '#f0f7ff',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              marginLeft: '2rem',
              width: '88%',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Valores actuales</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>Precio propiedad:</span>
                  <p>{formatCurrency(loanAmount)}</p>
                </div>
                <div>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>Cuota inicial:</span>
                  <p>{formatCurrency(downPayment)}</p>
                </div>
                <div>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>Tasa de interés:</span>
                  <p>{interestRate}%</p>
                </div>
                <div>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>Plazo:</span>
                  <p>{loanTerm} años</p>
                </div>
              </div>
            </div>
          
            {/* Gráfico */}
            <div style={{marginLeft: '2rem'}}>
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Evolución del Préstamo</h3>
              </div>
              <div className="h-64 md:h-96">
                <ResponsiveContainer width="88%" height={270}>
                  <LineChart
                    data={amortizationData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="year" 
                      label={{ value: 'Años', position: 'insideBottomRight', offset: -10 }} 
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value)}
                      width={110}
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), ""]}
                      labelFormatter={(value) => `Año ${value}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="balance" 
                      name="Saldo pendiente" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalInterestPaid" 
                      name="Total intereses pagados" 
                      stroke="#ff7300" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalPrincipalPaid" 
                      name="Total capital pagado" 
                      stroke="#28a745" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>El gráfico muestra la evolución del saldo pendiente, los intereses totales pagados y el capital amortizado a lo largo del tiempo.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer></Footer>
    </div>
  );
};

export default MortgageCalculator;