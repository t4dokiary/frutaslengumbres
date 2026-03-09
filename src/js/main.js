const LS_PRODUCTOS_KEY = 'fruteria_productos_v7';
const LS_VENTAS_KEY = 'fruteria_ventas_v7';
const APP_ROOT_PATH = window.location.pathname.includes('/src/content/') ? '../../' : './';

if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${APP_ROOT_PATH}sw.js`).catch(() => {
      // Ignore registration failures when service worker is not present yet.
    });
  });
}

const app = new FruteriaApp(new StorageService(LS_PRODUCTOS_KEY, LS_VENTAS_KEY));

function hasRequiredDom() {
  const requiredIds = ['tabla-inventario', 'grid-productos', 'tabla-ventas', 'tabla-cuenta', 'metric-tickets'];
  return requiredIds.some(id => document.getElementById(id));
}

document.addEventListener('DOMContentLoaded', () => {
  if (hasRequiredDom()) {
    app.init();
  }
});

function cambiarPestana(pestana) {
  app.cambiarPestana(pestana);
}

function comprimirYConvertirImagen(event) {
  app.comprimirYConvertirImagen(event);
}

function agregarFilaPromo(cant = '', precio = '', tipo = 'multiplos') {
  app.agregarFilaPromo(cant, precio, tipo);
}

function guardarProducto() {
  app.guardarProducto();
}

function editarProducto(id) {
  app.editarProducto(id);
}

function eliminarProducto(id) {
  app.eliminarProducto(id);
}

function limpiarFormularioInventario() {
  app.limpiarFormularioInventario();
}

function exportarDatos() {
  app.exportarDatos();
}

function importarDatos(event) {
  app.importarDatos(event);
}

function filtrarProductos() {
  app.filtrarProductos();
}

function filtrarInventario() {
  app.filtrarInventario();
}

function seleccionarProductoCaja(id, nombre, unidad) {
  app.seleccionarProductoCaja(id, nombre, unidad);
}

function agregarACuenta() {
  app.agregarACuenta();
}

function eliminarDeCuenta(idTicket) {
  app.eliminarDeCuenta(idTicket);
}

function limpiarCuenta() {
  app.limpiarCuenta();
}

function calcularCambio() {
  app.calcularCambio();
}

function terminarVenta() {
  app.terminarVenta();
}

function actualizarTablaVentas() {
  app.actualizarTablaVentas();
}

function borrarHistorial() {
  app.borrarHistorial();
}

function actualizarDashboard() {
  app.actualizarDashboard();
}

function actualizarTablas() {
  app.actualizarTablas();
}

function renderizarCuenta() {
  app.renderizarCuenta();
}
