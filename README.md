# 🧾 XML Items to Excel & AI Menu Costing Calculator

Aplicación PWA para la extracción de facturas electrónicas XML (SIFEN/DNIT - Paraguay), consolidación mensual de compras y **calculadora de menús con Inteligencia Artificial Semántica local**.

---

## 🚀 ¿Qué hace la aplicación?

1. **Extractor de Facturas XML:** Parsea facturas electrónicas SIFEN, agrupa consumos mensuales y calcula el costo total y el precio promedio por unidad de cada insumo comprados en el mes.
2. **Calculadora de Menús y Costos:** Cotiza recetas del recetario corporativo escalando ingredientes por número de comensales.
3. **Motor de IA Semántica en el Navegador:** Utiliza modelos de redes neuronales (*Transformers.js*) corriendo en cliente para emparejar automáticamente los ingredientes de la receta con los productos reales de las facturas mediante **embeddings vectoriales y similitud coseno**.

---

## 🤖 Búsqueda Semántica con Inteligencia Artificial (Local & Offline)

En lugar de simples comparaciones de texto o subcadenas (`includes`), la aplicación integra un modelo de IA que comprende la **naturaleza conceptual** de los insumos.

### ¿Cómo funciona la IA?
* **Modelo:** `Xenova/all-MiniLM-L6-v2` (Sentence-Transformers) empaquetado en WebAssembly/ONNX Runtime.
* **Embeddings Vectoriales:** Convierte cada ingrediente en un vector de **384 dimensiones**.
* **Similitud Coseno:** Calcula la distancia geométrica entre el ingrediente de la receta y los productos comprados en las facturas.
* **Diferenciación Conceptual:** La IA sabe que el ingrediente `"Tomate"` coincide con `"TOMATE FRESCO KILO"` ($\sim 87\%$ similitud), pero descarta `"SALSA DE TOMATE LATA"` por tratarse de un producto procesado/conserva.
* **Privacidad Total:** Funciona **100% offline y en el navegador** sin enviar datos a APIs externas ni requerir API Keys.

---

## 🧠 Lógica y Prioridad de Cálculo de Costos

Para determinar el precio unitario de un ingrediente en la calculadora, se aplica la siguiente jerarquía:

```
[Ingrediente de Receta]
        │
        ├─► 1. Sobrescritura Manual (Precio escrito por el usuario en la tabla)
        ├─► 2. Mapeo Personalizado (Selección del desplegable por el usuario)
        ├─► 3. 🤖 IA Semántica (Embeddings vectoriales de Transformers.js)
        ├─► 4. Mapeo Estático (Diccionario defaultMappings en recetario.json)
        └─► 5. Búsqueda Texto Fallback (Coincidencia aproximada de cadenas)
```

---

## 📊 Funcionalidades Clave

- 📁 **Carga de XML Local o Gmail:** Importación manual de archivos o descarga automática desde Gmail vía OAuth2.
- 👨‍🍳 **Escalado de Recetas:** Cálculo automático de insumos totales según cantidad de comensales.
- 🤖 **Mapeo Inteligente por IA:** Asignación automática de equivalentes de supermercado basada en vectores semánticos.
- 📊 **Exportación Excel (.xlsx):** Generación de presupuestos detallados por menú y consolidados mensuales.
- 🌙 **PWA e Interfaz Moderna:** Funciona instalable, con soporte offline y caché local (IndexedDB).

---

## 🛠️ Stack Tecnológico

- **Frontend:** React 19 + TypeScript + Vite 8
- **Inteligencia Artificial:** `@xenova/transformers` (WebAssembly ONNX)
- **Parseo XML:** `fast-xml-parser` (SIFEN Paraguay)
- **Hojas de Cálculo:** `xlsx` (SheetJS)
- **OAuth Google:** `@react-oauth/google`

---

## ⚙️ Instalación y Desarrollo

```bash
cd xmlitemstoexcel
npm install
npm run dev
```

### Build para Producción

```bash
npm run build
```
Los archivos de producción optimizados se generan en `dist/`.
