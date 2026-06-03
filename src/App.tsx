import { useState, useEffect } from 'react';
import './App.css';
import Logo from './assets/logo.png';
import Home from './components/Home';
import XmlExtractor from './components/XmlExtractor';
import MenuCalculator from './components/MenuCalculator';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'extractor' | 'calculator'>('home');
  const [theme, setTheme] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('theme');
      return saved || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch { }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <div className="App">
      <header className="App-header-nav">
        <div className="header-container">
          <div className="header-brand" onClick={() => setCurrentView('home')}>
            <img src={Logo} alt="Facturas Logo" className="header-logo" />
            <div>
              <span className="brand-title">Nilda Proyectos</span>
              <span className="brand-subtitle">Facturas & Costos</span>
            </div>
          </div>

          <nav className="header-navigation">
            <button 
              className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
              onClick={() => setCurrentView('home')}
            >
              Inicio
            </button>
            <button 
              className={`nav-link ${currentView === 'extractor' ? 'active' : ''}`}
              onClick={() => setCurrentView('extractor')}
            >
              Extractor XML
            </button>
            <button 
              className={`nav-link ${currentView === 'calculator' ? 'active' : ''}`}
              onClick={() => setCurrentView('calculator')}
            >
              Calculadora de Menús
            </button>
          </nav>

          <button aria-label="Cambiar tema" className="theme-toggle" onClick={toggleTheme}>
            <span>{theme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}</span>
            <div className="dot" />
          </button>
        </div>
      </header>

      <main className="App-main-content">
        {currentView === 'home' && (
          <Home onSelectView={setCurrentView} />
        )}
        
        {currentView === 'extractor' && (
          <XmlExtractor onBackToHome={() => setCurrentView('home')} />
        )}
        
        {currentView === 'calculator' && (
          <MenuCalculator onBackToHome={() => setCurrentView('home')} />
        )}
      </main>

      <footer className="App-footer">
        <p>&copy; {new Date().getFullYear()} Nilda Proyectos - Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

export default App;
