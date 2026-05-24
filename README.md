# 🧾 XML Items to Excel

Extractor de ítems de facturas electrónicas XML (SIFEN/DNIT - Paraguay) con consolidado mensual de productos y costos.

## ¿Qué hace?

Parsea archivos XML de facturas electrónicas paraguayas, extrae los ítems/productos de cada una, los agrupa por descripción y genera un consolidado con:

- **Descripción del producto** (normalizada a mayúsculas)
- **Cantidad total** comprada en el período
- **Costo total** acumulado
- **Precio promedio** por unidad

Ideal para responder: *"¿Cuánto gasté en X este mes?"*

## Funcionalidades

- 📁 **Carga local** — Seleccioná múltiples archivos .xml a mano
- 📧 **Integración Gmail** — Conectá tu cuenta de Google y buscá facturas XML adjuntas por mes y empresa (OAuth2)
- 📊 **Exportación XLSX** — Descargá el consolidado en Excel con fila de totales
- 🔄 **Agregación automática** — Productos con el mismo nombre se consolidan en una sola fila
- 🌙 **Tema claro/oscuro** — Toggle de tema con persistencia en localStorage
- 📱 **PWA** — Instalable como aplicación (manifest + service worker)

## Stack

- React 19 + TypeScript
- Vite 8
- `fast-xml-parser` — Parseo de XML SIFEN
- `xlsx` — Generación de archivos Excel
- `@react-oauth/google` — Autenticación Gmail
- `vite-plugin-pwa` — Soporte PWA

## Estructura de datos esperada

El parser busca la estructura estándar SIFEN:

```
rDE → DE → gDtipDE → gCamItem[]
  ├── dDesProSer      → Descripción del producto
  ├── dCantProSer     → Cantidad
  └── gValorItem
       ├── gValorRestaItem.dTotOpeItem  → Total por ítem
       └── dTotBruOpeItem               → Fallback
```

## Instalación

```bash
cd xmlitemstoexcel
npm install
npm run dev
```

## Build

```bash
npm run build
```

Los archivos de producción se generan en `dist/`.

## Configuración Gmail

1. Crear proyecto en [Google Cloud Console](https://console.cloud.google.com/)
2. Habilitar Gmail API
3. Crear credenciales OAuth2 (Web client)
4. Colocar el `client_secret_*.json` en la raíz del proyecto
5. Configurar el Client ID en `index.html` (script de Google Identity)

---

## 🚧 Funcionalidades Pendientes

### 1. Guardado en Google Drive

Exportar los archivos XLSX generados directamente a Google Drive del usuario, permitiendo:

- Selección de carpeta destino en Drive
- Auto-nombrado por mes (ej: `consumo_2026-05.xlsx`)
- Overwrite o versión nueva si el archivo ya existe
- Requiere agregar scope `https://www.googleapis.com/auth/drive.file` al OAuth

### 2. Buscador de ítem por nombre

Filtro de búsqueda en tiempo real sobre la tabla de ítems consolidados:

- Input de texto con debounce
- Búsqueda case-insensitive sobre la descripción
- Highlight de coincidencias
- Filtro parcial (match por substring, no solo exacto)
- Mostrar contador de resultados filtrados vs total
