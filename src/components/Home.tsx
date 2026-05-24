

// Custom SVG Icons
const ExtractorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const CalculatorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="22" x2="9" y2="16" />
    <line x1="15" y1="22" x2="15" y2="16" />
    <line x1="9" y1="16" x2="9" y2="9" />
    <line x1="15" y1="16" x2="15" y2="9" />
    <line x1="9" y1="9" x2="9" y2="2" />
    <line x1="15" y1="9" x2="15" y2="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="16" x2="21" y2="16" />
  </svg>
);

interface HomeProps {
  onSelectView: (view: 'extractor' | 'calculator') => void;
}

export default function Home({ onSelectView }: HomeProps) {
  return (
    <div className="home-dashboard fade-in">
      <div className="welcome-banner">
        <h2>Gestión de Costos y Planificación de Menús</h2>
        <p className="subtitle">
          Selecciona una de las herramientas de la empresa para comenzar a trabajar. Las herramientas colaboran automáticamente sincronizando los costos extraídos con las recetas de cocina.
        </p>
      </div>

      <div className="dashboard-grid">
        {/* Card 1: Extractor */}
        <div className="dashboard-card" onClick={() => onSelectView('extractor')}>
          <div className="card-icon-wrapper extractor-icon">
            <ExtractorIcon />
          </div>
          <div className="card-content">
            <h3>Extractor de Ítems XML</h3>
            <p>
              Carga las facturas electrónicas (.xml) de la empresa o impórtalas directamente desde Gmail.
              El sistema sumará las cantidades y calculará los precios promedio consolidados de cada producto comprado durante el mes.
            </p>
            <span className="card-action-link">
              Comenzar a extraer
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
          </div>
        </div>

        {/* Card 2: Calculator */}
        <div className="dashboard-card" onClick={() => onSelectView('calculator')}>
          <div className="card-icon-wrapper calculator-icon">
            <CalculatorIcon />
          </div>
          <div className="card-content">
            <h3>Calculadora de Menús</h3>
            <p>
              Planifica los menús semanales de la empresa usando el recetario de platos precargado.
              Escala los ingredientes automáticamente según la cantidad de comensales y calcula los costos de producción con los precios reales de las facturas del mes anterior.
            </p>
            <span className="card-action-link">
              Abrir calculadora
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div className="integration-badge-box">
        <div className="badge-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <polyline points="12 16 16 12 12 8" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </div>
        <div>
          <h4>Sincronización Inteligente Activada</h4>
          <p>
            Cuando consolides los precios de las facturas de un mes con el Extractor XML, esos precios promedio quedarán indexados automáticamente. La Calculadora de Menús los leerá al planificar platos en el mes siguiente.
          </p>
        </div>
      </div>
    </div>
  );
}
