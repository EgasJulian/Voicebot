import React from 'react';

import MarceChat from "../components/MarceChat";

const Layout = ({ children }) => {
  return (
    <div>
      {/* Contenido de la página */}
      {children}

      {/* EVA estará fijo en la esquina inferior derecha */}
      <MarceChat />
    </div>
  );
};

export default Layout;