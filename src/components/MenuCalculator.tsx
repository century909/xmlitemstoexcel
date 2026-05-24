import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import recetarioData from '../assets/recetario.json';

// Simple SVG Icons
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

interface Ingredient {
  name: string;
  qtyPerPerson: number;
  unit: string;
  isSection: boolean;
}

interface Recipe {
  name: string;
  sheet: string;
  baseDiners: number;
  ingredients: Ingredient[];
}

interface ConsumoItem {
  description: string;
  quantity: number;
  totalCost: number;
  price: number;
}

interface MenuCalculatorProps {
  onBackToHome: () => void;
}

export default function MenuCalculator({ onBackToHome }: MenuCalculatorProps) {
  // Load default recipe list
  const recipes: Recipe[] = recetarioData.recipes;
  const defaultMappings: Record<string, string> = recetarioData.defaultMappings;

  // React State
  const [selectedRecipeName, setSelectedRecipeName] = useState<string>(recipes[0]?.name || '');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    // We want the calculation month to default to the NEXT month relative to today,
    // so if it is May 2026, it suggests June 2026.
    // That way, it naturally searches for May 2026 (the current month with invoices).
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().slice(0, 7);
  });
  
  const [diners, setDiners] = useState<number>(10);
  const [previousMonthPrices, setPreviousMonthPrices] = useState<ConsumoItem[]>([]);
  const [priceLoadingStatus, setPriceLoadingStatus] = useState<'loading' | 'loaded' | 'no_data'>('no_data');
  const [previousMonthStr, setPreviousMonthStr] = useState<string>('');
  
  // Custom user mappings and manual price overrides saved in state
  const [customMappings, setCustomMappings] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('menu_custom_mappings');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  
  const [customPrices, setCustomPrices] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('menu_custom_prices');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active recipe object
  const currentRecipe = recipes.find(r => r.name === selectedRecipeName) || recipes[0];

  // Set diners default to the selected recipe base diners when recipe changes
  useEffect(() => {
    if (currentRecipe) {
      setDiners(currentRecipe.baseDiners);
    }
  }, [selectedRecipeName]);

  // Handle selected month changes to compute previous month and load prices
  useEffect(() => {
    if (!selectedMonth) return;
    
    // Calculate previous month string
    const [yearStr, monthStr] = selectedMonth.split('-');
    let year = parseInt(yearStr);
    let month = parseInt(monthStr);
    
    month = month - 1;
    if (month === 0) {
      month = 12;
      year = year - 1;
    }
    
    const prevMonthString = `${year}-${String(month).padStart(2, '0')}`;
    setPreviousMonthStr(prevMonthString);
    
    // Check localStorage for the calculated previous month data
    loadPricesForMonth(prevMonthString);
  }, [selectedMonth]);

  const loadPricesForMonth = (monthStr: string) => {
    setPriceLoadingStatus('loading');
    try {
      const savedData = localStorage.getItem(`consumo_data_${monthStr}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Normalize structure: make sure it has 'price' or compute it
        const normalized = parsed.map((item: any) => ({
          description: item.description || item.Descripción || '',
          quantity: parseFloat(item.quantity || item['Cantidad Total'] || '0'),
          totalCost: parseFloat(item.totalCost || item['Costo Total'] || '0'),
          price: parseFloat(item.price || item['Precio Promedio'] || '0') || 
                 (parseFloat(item.totalCost) / parseFloat(item.quantity)) || 0
        }));
        setPreviousMonthPrices(normalized);
        setPriceLoadingStatus('loaded');
      } else {
        setPreviousMonthPrices([]);
        setPriceLoadingStatus('no_data');
      }
    } catch (e) {
      console.error("Error loading previous month prices", e);
      setPriceLoadingStatus('no_data');
    }
  };

  // Parse custom consumo_data file manually if uploaded by user
  const handleConsumoExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setPriceLoadingStatus('loading');
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<any>(sheet);
        
        if (rows.length === 0) {
          alert('El archivo Excel está vacío.');
          setPriceLoadingStatus('no_data');
          return;
        }

        // Map SheetJS rows to standard ConsumoItem structure
        const mappedItems: ConsumoItem[] = rows
          .map(row => {
            const desc = row['Descripción'] || row['Descripcion'] || row['description'] || '';
            const qty = parseFloat(row['Cantidad Total'] || row['Cantidad_Total'] || row['quantity'] || '0');
            const total = parseFloat(row['Costo Total'] || row['Costo_Total'] || row['totalCost'] || '0');
            const avgPrice = parseFloat(row['Precio Promedio'] || row['Precio_Promedio'] || row['price'] || '0') || 
                             (qty > 0 ? total / qty : 0);
            return {
              description: desc.trim().toUpperCase(),
              quantity: qty,
              totalCost: total,
              price: avgPrice
            };
          })
          .filter(item => item.description && item.description !== 'TOTAL');

        if (mappedItems.length > 0) {
          setPreviousMonthPrices(mappedItems);
          setPriceLoadingStatus('loaded');
          // Save to localStorage for permanent indexing
          localStorage.setItem(`consumo_data_${previousMonthStr}`, JSON.stringify(mappedItems));
        } else {
          alert('No se pudieron extraer datos del Excel. Asegúrate de que tenga las columnas Descripción, Cantidad Total y Costo Total.');
          setPriceLoadingStatus('no_data');
        }
      } catch (err) {
        console.error('Error parsing uploaded consumo Excel:', err);
        alert('Ocurrió un error al procesar el archivo Excel. Verifica el formato.');
        setPriceLoadingStatus('no_data');
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  // Save custom mappings helper
  const handleUpdateMapping = (ingredientName: string, supermarketDescription: string) => {
    const updated = { ...customMappings, [ingredientName]: supermarketDescription };
    setCustomMappings(updated);
    localStorage.setItem('menu_custom_mappings', JSON.stringify(updated));
  };

  // Save custom price helper
  const handleUpdatePrice = (ingredientName: string, price: number) => {
    const updated = { ...customPrices, [ingredientName]: price };
    setCustomPrices(updated);
    localStorage.setItem('menu_custom_prices', JSON.stringify(updated));
  };

  // Reset custom prices and mappings
  const handleResetCustomizations = () => {
    if (window.confirm('¿Deseas restablecer todos los mapeos manuales y precios ingresados a sus valores predeterminados?')) {
      setCustomMappings({});
      setCustomPrices({});
      localStorage.removeItem('menu_custom_mappings');
      localStorage.removeItem('menu_custom_prices');
    }
  };

  // Get pricing details for a recipe ingredient
  const getIngredientPricing = (ingName: string) => {
    const normName = ingName.toLowerCase().trim();
    
    // 1. Check custom overrides first
    if (customPrices[ingName] !== undefined) {
      return {
        mappedItem: 'Costo Manual (Usuario)',
        unitPrice: customPrices[ingName],
        source: 'user_override' as const
      };
    }

    // 2. Identify target description in Excel
    let targetDesc = customMappings[ingName];
    if (!targetDesc) {
      // Check default mappings dictionary
      targetDesc = defaultMappings[normName];
    }
    
    let foundItem: ConsumoItem | undefined;
    
    if (targetDesc) {
      foundItem = previousMonthPrices.find(item => item.description.toUpperCase() === targetDesc.toUpperCase());
    }
    
    // 3. If still not found, do fuzzy search
    if (!foundItem && previousMonthPrices.length > 0) {
      // Try exact string matching on lowercase
      foundItem = previousMonthPrices.find(item => item.description.toLowerCase() === normName);
      
      // Try partial matching
      if (!foundItem) {
        foundItem = previousMonthPrices.find(item => 
          item.description.toLowerCase().includes(normName) || normName.includes(item.description.toLowerCase())
        );
      }
    }

    if (foundItem) {
      return {
        mappedItem: foundItem.description,
        unitPrice: foundItem.price,
        source: 'excel_data' as const
      };
    }

    return {
      mappedItem: targetDesc || 'No encontrado',
      unitPrice: 0,
      source: 'not_found' as const
    };
  };

  // Formatter for Guaraníes
  const formatGs = (value: number) => {
    return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 }).format(value);
  };

  // Escalated ingredient list computation
  const calculatedIngredients = currentRecipe?.ingredients.map(ing => {
    if (ing.isSection) {
      return { ...ing, scaledQty: 0, unitPrice: 0, totalCost: 0, mappedItem: '', source: 'section' as const };
    }
    
    const scaledQty = ing.qtyPerPerson * diners;
    const pricing = getIngredientPricing(ing.name);
    const totalCost = scaledQty * pricing.unitPrice;
    
    return {
      ...ing,
      scaledQty,
      unitPrice: pricing.unitPrice,
      totalCost,
      mappedItem: pricing.mappedItem,
      source: pricing.source
    };
  }) || [];

  const totalMenuCost = calculatedIngredients.reduce((sum, item) => sum + item.totalCost, 0);
  const costPerDiner = diners > 0 ? totalMenuCost / diners : 0;
  const activeIngredientsCount = calculatedIngredients.filter(i => !i.isSection).length;

  // Export Budget menu to XLSX
  const exportBudgetToExcel = () => {
    if (!currentRecipe) return;

    // Set up data array
    const dataToExport: any[] = [];
    
    // Header information rows
    dataToExport.push({ 'A': `PRESUPUESTO ESTIMADO DE MENÚ: ${currentRecipe.name}` });
    dataToExport.push({ 'A': `Mes de Consumo Planificado: ${selectedMonth}` });
    dataToExport.push({ 'A': `Mes de Referencia de Precios: ${previousMonthStr}` });
    dataToExport.push({ 'A': `Comensales Planificados: ${diners}` });
    dataToExport.push({ 'A': `Fecha de Generación: ${new Date().toLocaleDateString('es-PY')}` });
    dataToExport.push({}); // Empty line
    
    // Column headers
    dataToExport.push({
      'A': 'Ingrediente / Sección',
      'B': 'Medida por Persona',
      'C': 'Cantidad Total',
      'D': 'Unidad',
      'E': 'Precio Unitario Promedio (Gs)',
      'F': 'Costo Total Estimado (Gs)'
    });

    // Content rows
    calculatedIngredients.forEach(item => {
      if (item.isSection) {
        dataToExport.push({
          'A': `--- ${item.name.toUpperCase()} ---`,
          'B': '',
          'C': '',
          'D': '',
          'E': '',
          'F': ''
        });
      } else {
        dataToExport.push({
          'A': item.name,
          'B': item.qtyPerPerson,
          'C': item.scaledQty,
          'D': item.unit,
          'E': Math.round(item.unitPrice),
          'F': Math.round(item.totalCost)
        });
      }
    });

    dataToExport.push({}); // Empty line
    
    // Total Summaries
    dataToExport.push({
      'A': 'COSTO TOTAL DEL MENÚ',
      'B': '',
      'C': '',
      'D': '',
      'E': '',
      'F': Math.round(totalMenuCost)
    });
    dataToExport.push({
      'A': 'COSTO ESTIMADO POR COMENSAL',
      'B': '',
      'C': '',
      'D': '',
      'E': '',
      'F': Math.round(costPerDiner)
    });

    // Write worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport, { skipHeader: true });
    
    // Stylings & Merges
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Presupuesto Menú");
    
    // Save file
    XLSX.writeFile(workbook, `presupuesto_${currentRecipe.name.toLowerCase().replace(/\s+/g, '_')}_${selectedMonth}.xlsx`);
  };

  return (
    <div className="calculator-view">
      <div className="view-header">
        <button onClick={onBackToHome} className="btn-back">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Volver al Inicio
        </button>
        <h2>Calculadora de Menús y Costos de Producción</h2>
        <p className="subtitle text-light">Cotiza platos del recetario corporativo escalando por comensales con los precios reales de facturas del mes anterior.</p>
      </div>

      {/* Main Controls Grid */}
      <div className="calculator-controls">
        <div className="control-card">
          <div className="form-group">
            <label htmlFor="recipe-select">Seleccionar Menú / Receta:</label>
            <select
              id="recipe-select"
              value={selectedRecipeName}
              onChange={(e) => setSelectedRecipeName(e.target.value)}
              className="recipe-dropdown"
            >
              {recipes.map((recipe, idx) => (
                <option key={idx} value={recipe.name}>
                  [{recipe.sheet}] {recipe.name}
                </option>
              ))}
            </select>
          </div>

          <div className="controls-row-2">
            <div className="form-group">
              <label htmlFor="diners-input">
                <UsersIcon /> Cantidad de Comensales:
              </label>
              <input
                id="diners-input"
                type="number"
                min="1"
                max="10000"
                value={diners}
                onChange={(e) => setDiners(Math.max(1, parseInt(e.target.value) || 0))}
                className="input-diners"
              />
            </div>

            <div className="form-group">
              <label htmlFor="month-select">
                <CalendarIcon /> Mes a Planificar:
              </label>
              <input
                id="month-select"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="month-selector"
              />
            </div>
          </div>
        </div>

        {/* Pricing reference database card */}
        <div className="database-status-card">
          <h4>Base de Precios del Mes Anterior: <span>{previousMonthStr}</span></h4>
          
          {priceLoadingStatus === 'loading' && (
            <div className="status-loading">
              <div className="spinner mini"></div>
              <span>Buscando base de precios...</span>
            </div>
          )}

          {priceLoadingStatus === 'loaded' && (
            <div className="status-loaded">
              <div className="status-badge success">
                <CheckIcon />
                <span>Base Conectada</span>
              </div>
              <p>Se encontraron <strong>{previousMonthPrices.length}</strong> productos y costos promedio registrados en <strong>{previousMonthStr}</strong>.</p>
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="btn-link-action"
              >
                Actualizar base con Excel (.xlsx)
              </button>
            </div>
          )}

          {priceLoadingStatus === 'no_data' && (
            <div className="status-no-data">
              <div className="status-badge warning">
                <AlertIcon />
                <span>Sin base en navegador</span>
              </div>
              <p>No se encontraron facturas extraídas para <strong>{previousMonthStr}</strong> en el navegador.</p>
              
              <div 
                className="drag-upload-box" 
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadIcon />
                <p>Haz clic para subir el consolidado mensual de compras<br /><span>(ej: consumo_{previousMonthStr}.xlsx)</span></p>
              </div>
            </div>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept=".xlsx" 
            onChange={handleConsumoExcelUpload} 
          />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="summary-kpis">
        <div className="kpi-card cost-total-kpi">
          <span className="kpi-label">Costo Total de Producción</span>
          <h3 className="kpi-val">{formatGs(totalMenuCost)}</h3>
          <span className="kpi-sub">Para {diners} comensales ({activeIngredientsCount} ingredientes)</span>
        </div>

        <div className="kpi-card cost-diner-kpi">
          <span className="kpi-label">Costo Promedio por Persona</span>
          <h3 className="kpi-val">{formatGs(costPerDiner)}</h3>
          <span className="kpi-sub">Es el costo individual estimado del plato</span>
        </div>

        <div className="kpi-card action-kpi">
          <span className="kpi-label">Acciones de Reporte</span>
          <div className="kpi-actions">
            <button 
              onClick={exportBudgetToExcel} 
              disabled={totalMenuCost === 0}
              className="btn-export-budget"
            >
              <DownloadIcon /> Exportar Presupuesto
            </button>
            
            <button 
              onClick={handleResetCustomizations}
              className="btn-reset-mappings"
              title="Restablecer mapeos manuales y precios del usuario"
            >
              Restablecer
            </button>
          </div>
        </div>
      </div>

      {/* Calculated list table */}
      <div className="table-header-box">
        <h3>Desglose de Ingredientes para {currentRecipe?.name} ({diners} comensales)</h3>
        <p className="text-light text-xs">Puedes ajustar el equivalente de supermercado en el dropdown o escribir directamente un costo unitario manual.</p>
      </div>

      <div className="table-container fade-in">
        <table>
          <thead>
            <tr>
              <th>Ingrediente / Sub-sección</th>
              <th className="text-right">Ración p/ Persona</th>
              <th className="text-right">Cant. Total Escalada</th>
              <th>Equivalente Supermercado ({previousMonthStr})</th>
              <th className="text-right">Costo Unitario (Gs)</th>
              <th className="text-right">Costo Total (Gs)</th>
            </tr>
          </thead>
          <tbody>
            {calculatedIngredients.map((item, idx) => {
              if (item.isSection) {
                return (
                  <tr key={idx} className="table-section-row">
                    <td colSpan={6} className="section-title-td">
                      {item.name.toUpperCase()}
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={idx}>
                  <td className="font-semibold">{item.name}</td>
                  <td className="text-right text-light">
                    {item.qtyPerPerson} {item.unit}
                  </td>
                  <td className="text-right font-medium">
                    {item.scaledQty.toFixed(3)} {item.unit}
                  </td>
                  <td>
                    {priceLoadingStatus === 'loaded' ? (
                      <select
                        value={item.mappedItem || ''}
                        onChange={(e) => handleUpdateMapping(item.name, e.target.value)}
                        className={`supermarket-mapping-select ${item.source === 'not_found' ? 'unmapped' : ''}`}
                      >
                        <option value="">-- No mapeado (Sin precio) --</option>
                        {previousMonthPrices.map((consumo, cidx) => (
                          <option key={cidx} value={consumo.description}>
                            {consumo.description}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-light text-xs">Sube la base para mapear</span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="price-input-wrapper">
                      <input
                        type="number"
                        value={Math.round(item.unitPrice) || ''}
                        onChange={(e) => handleUpdatePrice(item.name, parseFloat(e.target.value) || 0)}
                        placeholder="Ingresa gs."
                        className={`price-input ${item.source === 'user_override' ? 'overridden' : ''}`}
                      />
                      <span className="price-symbol">Gs</span>
                    </div>
                  </td>
                  <td className="text-right font-bold text-primary">
                    {formatGs(item.totalCost)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="tfoot-totals-row">
              <th colSpan={3}>Costo Total Consolidado</th>
              <th colSpan={2}>-</th>
              <th className="text-right text-lg text-primary">{formatGs(totalMenuCost)}</th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
