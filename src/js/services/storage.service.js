class StorageService {
  constructor(productosKey, ventasKey) {
    this.productosKey = productosKey;
    this.ventasKey = ventasKey;
  }

  loadProductos() {
    return JSON.parse(localStorage.getItem(this.productosKey)) || [];
  }

  loadVentas() {
    return JSON.parse(localStorage.getItem(this.ventasKey)) || [];
  }

  saveProductos(productos) {
    localStorage.setItem(this.productosKey, JSON.stringify(productos));
  }

  saveVentas(ventas) {
    localStorage.setItem(this.ventasKey, JSON.stringify(ventas));
  }

  clearVentas() {
    localStorage.removeItem(this.ventasKey);
  }
}
