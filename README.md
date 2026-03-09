# Fruteria POS

Aplicacion web tipo punto de venta (POS) para fruteria y legumbres.

Incluye modulos de:
- Caja (venta rapida)
- Inventario (alta, edicion, promociones, respaldo)
- Historial (ventas del dia y corte)
- Reportes (metricas y top productos)

Tambien esta preparada como PWA para instalacion en movil y soporte offline.

## Demo local

Importante: para que `manifest.json` y `sw.js` funcionen, abre el proyecto con servidor HTTP/HTTPS (no `file://`).

Ejemplo rapido con VS Code (recomendado):
1. Instalar extension `Live Server`.
2. Abrir `index.html`.
3. Ejecutar `Open with Live Server`.

Ejemplo con Python:
```bash
python -m http.server 5500
```
Luego abrir:
`http://localhost:5500`

## Estructura del proyecto

```text
pres/
|- index.html
|- manifest.json
|- sw.js
|- README.md
`- src/
	|- content/
	|  |- inventario.html
	|  |- ventas.html
	|  |- historial.html
	|  `- reporte.html
	|- css/
	|  `- bootstrap/
	|- js/
	|  |- app/
	|  |- core/
	|  |- services/
	|  `- main.js
	`- img/
```

## Stack tecnico

- HTML5
- Bootstrap 5 (local)
- JavaScript Vanilla (arquitectura por modulos)
- LocalStorage para persistencia
- Service Worker + Web App Manifest (PWA)

## Arquitectura JS

- `src/js/app/fruteria.app.js`
  - Logica principal de negocio (inventario, venta, historial y dashboard).
- `src/js/services/storage.service.js`
  - Persistencia en `localStorage`.
- `src/js/services/promotion.engine.js`
  - Reglas de promociones y calculo de subtotal.
- `src/js/services/image.service.js`
  - Compresion y conversion de imagen a base64.
- `src/js/core/utils.js`
  - Utilidades generales (`escapeHtml`, fecha local ISO).
- `src/js/main.js`
  - Inicializacion, registro del service worker y puente de funciones globales para el HTML.

## Funcionalidades principales

### Caja
- Busqueda de productos.
- Seleccion de producto y cantidad.
- Aplicacion de promociones.
- Calculo de total, pago y cambio.
- Registro de venta.

### Inventario
- Crear/editar/eliminar productos.
- Unidad por kilo o pieza.
- Carga de imagen del producto.
- Configuracion de promociones.
- Busqueda en catalogo actual.
- Exportar/importar respaldo JSON.

### Historial y corte
- Tabla de ventas del dia.
- Total vendido del dia.
- Corte para reiniciar historial.

### Reportes
- Total de tickets.
- Ingresos acumulados.
- Producto estrella.
- Top 5 por volumen y top 5 por ingreso.

## PWA e instalacion movil

El proyecto incluye:
- `manifest.json`
- `sw.js`
- `theme-color` y `rel="manifest"` en todas las paginas

En Android (Chrome):
1. Abrir la app por `http://` o `https://`.
2. Esperar a que cargue completamente.
3. Menu del navegador -> `Instalar app`.

## Practicas de cache implementadas

Estas son las practicas aplicadas en `sw.js`:

1. Versionado explicito de cache.
	- `STATIC_CACHE = fruteria-static-v10`
	- `RUNTIME_CACHE = fruteria-runtime-v10`
	- Beneficio: control de invalidacion en despliegues.

2. Precache de recursos criticos (App Shell).
	- Se precargan HTML principales, JS/CSS locales, `manifest.json`, icono y `sw.js`.
	- Beneficio: arranque mas rapido y experiencia offline basica.

3. Limpieza de caches antiguas en `activate`.
	- Se eliminan keys distintas a la version activa.
	- Beneficio: evita archivos obsoletos y reduce uso de almacenamiento.

4. Estrategia `Network First` para navegacion HTML.
	- Intenta red primero para contenido actualizado.
	- Si falla, usa cache; si no existe, responde con fallback de "Sin conexion".
	- Beneficio: equilibrio entre frescura y resiliencia offline.

5. Estrategia `Stale While Revalidate` para recursos locales.
	- Devuelve cache rapido y actualiza en segundo plano.
	- Beneficio: mejor rendimiento percibido con actualizaciones progresivas.

6. Estrategia `Cache First` para recursos externos.
	- Reusa cache cuando existe; si no, consulta red y guarda.
	- Beneficio: menor latencia y menor consumo de red para assets repetidos.

7. Manejo de metodos HTTP.
	- Solo intercepta peticiones `GET`.
	- Beneficio: evita interferir con operaciones no idempotentes.

8. Activacion inmediata.
	- `self.skipWaiting()` y `self.clients.claim()`.
	- Beneficio: actualizaciones del SW mas rapidas y consistentes.

## Buenas practicas de mantenimiento (cache)

Cuando cambies archivos estaticos importantes:
1. Aumenta version en `STATIC_CACHE` y `RUNTIME_CACHE`.
2. Verifica que los paths en `urlsToPrecache` sigan correctos.
3. Haz hard refresh en navegador para validar assets nuevos.

## Estado del proyecto

- Enfoque actual: SPA multipagina con modulos separados y UX optimizada para caja.
- Objetivo siguiente recomendado: agregar pruebas basicas de flujos criticos (venta, respaldo y restauracion).

---

Si deseas, puedo agregar tambien:
- seccion de "Roadmap" con siguientes mejoras,
- convencion de commits,
- guia de despliegue en GitHub Pages o Netlify.
