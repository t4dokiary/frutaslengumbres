# Fruteria y Legumbres POS

Aplicacion web tipo POS (Punto de Venta) para una tienda de frutas y legumbres.
Permite administrar inventario, registrar ventas, calcular cambio y consultar metricas del dia desde el navegador.

## Caracteristicas

- Caja rapida con seleccion de productos y calculo de ticket.
- Soporte de unidades por `kg` y por `pza`.
- Promociones por producto (multiplos, exacto y proporcional).
- Inventario con foto, precio, unidad y edicion de productos.
- Historial de ventas con corte para reiniciar el dia.
- Dashboard con tickets, ingresos y ranking de productos.
- Respaldo e importacion de datos en formato JSON.
- Funcionamiento offline basico con PWA (`manifest.json` + `sw.js`).
- Interfaz responsive para movil y escritorio.
- Arquitectura modular en JavaScript para facilitar mantenimiento.

## Demo

Puedes abrir el proyecto localmente con doble clic en `index.html`.

Si quieres publicar una demo, puedes usar GitHub Pages o Netlify y agregar aqui el enlace:

`https://tu-demo-aqui.com`

## Capturas

Agrega imagenes en una carpeta `assets/` y enlazalas aqui:

```md
![Caja](assets/caja.png)
![Inventario](assets/inventario.png)
![Dashboard](assets/dashboard.png)
```

## Tecnologias

- HTML5
- CSS3
- JavaScript Vanilla
- Bootstrap 5 (layout responsive)
- LocalStorage
- Service Worker (PWA)

## Arquitectura JS

El proyecto fue separado por capas para hacerlo mas mantenible:

- `js/core/utils.js`: utilidades generales.
- `js/services/storage.service.js`: persistencia local (`localStorage`).
- `js/services/image.service.js`: compresion y conversion de imagen.
- `js/services/promotion.engine.js`: motor de promociones.
- `js/app/fruteria.app.js`: logica principal de la aplicacion.
- `js/main.js`: punto de entrada e integracion con la UI.

`app.js` queda como archivo legado informativo y ya no es el punto de carga principal.

## Estructura del proyecto

```text
.
|-- index.html
|-- styles.css
|-- js/
|   |-- core/
|   |   `-- utils.js
|   |-- services/
|   |   |-- storage.service.js
|   |   |-- image.service.js
|   |   `-- promotion.engine.js
|   |-- app/
|   |   `-- fruteria.app.js
|   `-- main.js
|-- app.js
|-- sw.js
|-- manifest.json
`-- README.md
```

## Como usar

1. Clona o descarga este repositorio.
2. Abre `index.html` en tu navegador (Edge, Chrome, Firefox o Safari).
3. Registra productos en la pestana `Inventario`.
4. Vende en la pestana `Caja`.
5. Revisa `Historial` y `Dashboard`.

## Datos y respaldos

- Los datos se guardan en `localStorage` del navegador.
- Puedes exportar un respaldo JSON con inventario y ventas.
- La importacion acepta:
  - Formato antiguo: arreglo de productos.
  - Formato nuevo: objeto con `productos` y `ventas`.

## Desarrollo

- El orden de carga de scripts se define en `index.html`.
- Si cambias nombres/rutas dentro de `js/`, actualiza tambien `sw.js` para mantener el cache offline.
- Para forzar actualizacion del service worker, incrementa `CACHE_NAME` en `sw.js`.

## Roadmap

- Control de stock por entradas/salidas.
- Filtro de ventas por rango de fechas.
- Impresion de ticket.
- Reportes de utilidad por producto.

## Contribuciones

Las contribuciones son bienvenidas.

1. Haz un fork.
2. Crea una rama: `git checkout -b feature/nueva-mejora`.
3. Haz commit de tus cambios.
4. Abre un Pull Request.

## Licencia

Este proyecto puede usarse con fines personales o comerciales pequenos.
Si deseas una licencia formal, agrega un archivo `LICENSE` (por ejemplo MIT).