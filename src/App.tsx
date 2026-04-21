import React, { useState, useEffect } from 'react';
import { XMLParser } from 'fast-xml-parser';
import * as XLSX from 'xlsx';
import { useGoogleLogin } from '@react-oauth/google';
import './App.css';
import Logo from './assets/logo.png';

// Simple SVG Icons
const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const GmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const CompanyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

// Interfaces
interface ItemData {
  description: string;
  quantity: number;
  totalCost: number;
}

// --- Componente Principal ---
function App() {
  const [items, setItems] = useState<ItemData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [theme, setTheme] = useState<string>(() => {
    const saved = document.documentElement.getAttribute('data-theme');
    return saved || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch { }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // --- Lógica de Parseo ---
  const extractItemsFromXml = (xmlString: string, fileName: string): ItemData[] => {
    const options = {
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      alwaysArray: ['gCamItem']
    };
    const parser = new XMLParser(options);
    try {
      const parsedXml = parser.parse(xmlString);
      const de = parsedXml?.['rDE']?.['DE'];
      const itemsList = de?.gDtipDE?.gCamItem;

      if (!itemsList || !Array.isArray(itemsList)) {
        console.warn(`Archivo ${fileName} no contiene ítems válidos.`);
        return [];
      }

      return itemsList.map((item: any) => ({
        description: item.dDesProSer || 'Sin descripción',
        quantity: parseFloat(item.dCantProSer || '0'),
        totalCost: parseFloat(item.gValorItem?.gValorRestaItem?.dTotOpeItem || item.gValorItem?.dTotBruOpeItem || '0'),
      }));
    } catch (err) {
      console.error(`Error parseando ${fileName}:`, err);
      return [];
    }
  };

  const aggregateItems = (allItems: ItemData[]) => {
    const aggregated = new Map<string, ItemData>();

    allItems.forEach(item => {
      const normalizedDesc = item.description.trim().toUpperCase();
      const existing = aggregated.get(normalizedDesc);
      if (existing) {
        existing.quantity += item.quantity;
        existing.totalCost += item.totalCost;
      } else {
        aggregated.set(normalizedDesc, { ...item, description: normalizedDesc });
      }
    });

    return Array.from(aggregated.values()).sort((a, b) => b.totalCost - a.totalCost);
  };

  // --- Lógica de Gmail ---
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      await fetchGmailAttachments(tokenResponse.access_token, selectedMonth, companyName);
    },
    onError: () => {
      setStatusMessage('Error en el inicio de sesión con Google.');
      setIsError(true);
    },
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
  });

  useEffect(() => {
    if (accessToken) {
      fetchGmailAttachments(accessToken, selectedMonth, companyName);
    }
  }, [selectedMonth, accessToken, companyName]);

  const fetchGmailAttachments = async (token: string, month: string, company: string) => {
    setStatusMessage('Autenticado. Buscando facturas en Gmail...');
    setIsError(false);
    setIsLoading(true);
    setItems([]);

    try {
      const [year, monthNumber] = month.split('-');
      const startDate = `${year}-${monthNumber}-01`;
      const nextMonthDate = new Date(parseInt(year), parseInt(monthNumber), 1);
      const nextMonthYear = nextMonthDate.getFullYear();
      const nextMonthNum = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
      const formattedEndDate = `${nextMonthYear}-${nextMonthNum}-01`;

      let query = `has:attachment filename:xml after:${startDate} before:${formattedEndDate}`;
      if (company) query += ` from:${company}`;

      const listResponse = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!listResponse.ok) throw new Error('No se pudo listar los correos de Gmail.');
      const listData = await listResponse.json();

      if (!listData.messages || listData.resultSizeEstimate === 0) {
        setStatusMessage('No se encontraron correos con archivos adjuntos XML para el mes seleccionado.');
        setIsLoading(false);
        return;
      }

      setStatusMessage(`Se encontraron ${listData.messages.length} correos. Procesando ítems...`);

      const allItems: ItemData[] = [];
      for (const message of listData.messages.slice(0, 50)) {
        const msgResponse = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!msgResponse.ok) continue;
        const msgData = await msgResponse.json();
        const parts = msgData.payload.parts || [];

        for (const part of parts) {
          if (part.filename && part.filename.toLowerCase().endsWith('.xml') && part.body.attachmentId) {
            const attachResponse = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${message.id}/attachments/${part.body.attachmentId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!attachResponse.ok) continue;
            const attachData = await attachResponse.json();

            const xmlString = atob(attachData.data.replace(/-/g, '+').replace(/_/g, '/'));
            const extracted = extractItemsFromXml(xmlString, part.filename);
            allItems.push(...extracted);
          }
        }
      }

      if (allItems.length > 0) {
        const aggregated = aggregateItems(allItems);
        setItems(aggregated);
        setStatusMessage(`Se procesaron ${allItems.length} ítems en total de las facturas de Gmail.`);
      } else {
        setStatusMessage('Se buscaron los correos pero no se encontraron ítems válidos.');
        setIsError(true);
      }

    } catch (error) {
      console.error('Error al conectar con Gmail:', error);
      setStatusMessage('Ocurrió un error al procesar los archivos de Gmail.');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Lógica de Archivos Locales ---
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      setStatusMessage('No se seleccionaron archivos.');
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setItems([]);
    setStatusMessage(null);
    setIsError(false);
    const allItems: ItemData[] = [];

    for (const file of Array.from(files)) {
      const xmlString = await file.text();
      const extracted = extractItemsFromXml(xmlString, file.name);
      allItems.push(...extracted);
    }

    if (allItems.length > 0) {
      const aggregated = aggregateItems(allItems);
      setItems(aggregated);
      setStatusMessage(`Se procesaron ${allItems.length} ítems de los archivos locales.`);
    } else {
      setStatusMessage('No se pudieron procesar los archivos o no contenían ítems válidos.');
      setIsError(true);
    }

    setIsLoading(false);
  };

  // --- Lógica de Exportación ---
  const downloadXLSX = () => {
    if (items.length === 0) { alert('No hay datos para exportar.'); return; }

    const dataToExport = items.map(item => ({
      'Descripción': item.description,
      'Cantidad Total': item.quantity,
      'Costo Total': item.totalCost,
      'Precio Promedio': item.totalCost / item.quantity
    }));

    const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);

    dataToExport.push({
      'Descripción': 'TOTAL',
      'Cantidad Total': 0,
      'Costo Total': totalCost,
      'Precio Promedio': 0
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Items del Mes");
    XLSX.writeFile(workbook, `consumo_${selectedMonth}.xlsx`);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const LoadingSpinner = () => (
    <div className="spinner-container">
      <div className="spinner"></div>
      <p>Procesando ítems de facturas...</p>
    </div>
  );

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
            <img src={Logo} alt="Facturas" width={40} height={40} />
            <div>
              <h1>Extractor de Ítems de Facturas XML</h1>
              <p>Consolidado mensual de productos comprados y costos totales.</p>
            </div>
          </div>
          <button aria-label="Cambiar tema" className="theme-toggle" onClick={toggleTheme}>
            <span>{theme === 'dark' ? 'Modo oscuro' : 'Modo claro'}</span>
            <div className="dot" />
          </button>
        </div>
      </header>
      <main>
        <div className="actions">
          <div className="actions-grid">
            <label htmlFor="file-upload" className="button-grid button-upload">
              <FileIcon />
              <span>Cargar Archivos</span>
            </label>
            <input id="file-upload" type="file" accept=".xml,text/xml" multiple onChange={handleFileChange} />

            <button onClick={() => login()} className="button-grid button-gmail">
              <GmailIcon />
              <span>Buscar en Gmail</span>
            </button>

            <button
              onClick={downloadXLSX}
              disabled={items.length === 0}
              className="button-grid button-download"
            >
              <DownloadIcon />
              <span>Descargar XLSX</span>
            </button>
          </div>

          <div className="filters">
            <div className="filter-item">
              <CalendarIcon />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="month-selector"
              />
            </div>
            <div className="filter-item">
              <CompanyIcon />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Filtrar por empresa"
                className="company-selector"
              />
            </div>
          </div>
        </div>

        {isLoading && <LoadingSpinner />}
        {statusMessage && (
          <div className={isError ? 'error-message' : 'status-message'}>
            {isError ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            )}
            <span>{statusMessage}</span>
          </div>
        )}

        {items.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Descripción del Producto</th>
                  <th className="text-right">Cantidad Total</th>
                  <th className="text-right">Costo Total</th>
                  <th className="text-right">Precio Promedio</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.description}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">{formatNumber(item.totalCost)}</td>
                    <td className="text-right">{formatNumber(item.totalCost / item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th>TOTALConsolidado</th>
                  <th className="text-right">-</th>
                  <th className="text-right">{formatNumber(items.reduce((s, i) => s + i.totalCost, 0))}</th>
                  <th className="text-right">-</th>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          !isLoading && (
            <div style={{ maxWidth: 800, margin: '2rem auto 3rem', padding: '2rem', border: '1px dashed var(--border-color)', borderRadius: 16, background: 'var(--card-background)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ marginTop: 0 }}>Comienza extrayendo los ítems de tus facturas</h3>
              <p style={{ color: 'var(--text-light)' }}>Carga tus archivos .xml o búscalos en Gmail. La aplicación sumará las cantidades y costos de cada producto encontrado en todas las facturas del mes.</p>
            </div>
          )
        )}
      </main>
    </div>
  );
}

export default App;
