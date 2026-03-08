class FruteriaApp {
  constructor(storageService) {
    this.storage = storageService;
    this.productos = this.storage.loadProductos();
    this.historialVentas = this.storage.loadVentas();
    this.cuentaActual = [];
  }

  init() {
    this.actualizarTablas();
    this.actualizarTablaVentas();
    this.actualizarDashboard();
  }

  cambiarPestana(pestana) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));

    document.getElementById(pestana).classList.add('active');
    document.getElementById('btn-' + pestana).classList.add('active');

    if (pestana === 'dashboard') {
      this.actualizarDashboard();
    }
  }

  async comprimirYConvertirImagen(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const dataUrl = await ImageService.compressToBase64(file);
      document.getElementById('img-base64').value = dataUrl;
      document.getElementById('preview-img').src = dataUrl;
      document.getElementById('preview-img').style.display = 'block';
    } catch (error) {
      alert('No se pudo procesar la imagen.');
    }
  }

  agregarFilaPromo(cant = '', precio = '', tipo = 'multiplos') {
    const div = document.createElement('div');
    div.className = 'promo-fila';
    div.innerHTML = `
      <input type="number" inputmode="decimal" class="p-cant" placeholder="Lleva" value="${cant}">
      <input type="number" inputmode="decimal" class="p-precio" placeholder="Por ($)" value="${precio}">
      <select class="p-tipo">
        <option value="multiplos" ${tipo === 'multiplos' ? 'selected' : ''}>Multiples</option>
        <option value="exacto" ${tipo === 'exacto' ? 'selected' : ''}>Exacto</option>
        <option value="proporcional" ${tipo === 'proporcional' ? 'selected' : ''}>Mayores</option>
      </select>
      <button type="button" class="btn-danger btn-small" onclick="this.parentElement.remove()">❌</button>
    `;
    document.getElementById('lista-promos').appendChild(div);
  }

  guardarProducto() {
    const id = document.getElementById('edit-id').value;
    const nombre = document.getElementById('nombre-prod').value.trim();
    const precio = parseFloat(document.getElementById('precio-prod').value);
    const unidad = document.getElementById('unidad-prod').value;
    const imagen = document.getElementById('img-base64').value;

    if (!nombre || isNaN(precio) || precio <= 0) {
      return alert('Nombre y precio requeridos.');
    }

    const promociones = [];
    document.querySelectorAll('.promo-fila').forEach(fila => {
      const c = parseFloat(fila.querySelector('.p-cant').value);
      const pr = parseFloat(fila.querySelector('.p-precio').value);
      if (c > 0 && pr > 0) {
        promociones.push({
          cant: c,
          precio: pr,
          tipo: fila.querySelector('.p-tipo').value
        });
      }
    });

    const datosProducto = {
      id: id ? parseInt(id, 10) : Date.now(),
      nombre,
      precio,
      unidad,
      promociones,
      imagen
    };

    if (id) {
      this.productos = this.productos.map(p => (p.id == id ? datosProducto : p));
    } else {
      this.productos.push(datosProducto);
    }

    this.storage.saveProductos(this.productos);
    this.limpiarFormularioInventario();
    this.actualizarTablas();
  }

  editarProducto(id) {
    const producto = this.productos.find(p => p.id === id);
    if (!producto) return;

    document.getElementById('edit-id').value = producto.id;
    document.getElementById('nombre-prod').value = producto.nombre;
    document.getElementById('precio-prod').value = producto.precio;
    document.getElementById('unidad-prod').value = producto.unidad || 'kg';
    document.getElementById('img-base64').value = producto.imagen || '';

    const preview = document.getElementById('preview-img');
    if (producto.imagen) {
      preview.src = producto.imagen;
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
    }

    document.getElementById('lista-promos').innerHTML = '';
    (producto.promociones || []).forEach(promo => {
      this.agregarFilaPromo(promo.cant, promo.precio, promo.tipo);
    });
  }

  eliminarProducto(id) {
    if (!confirm('¿Borrar producto?')) return;

    this.productos = this.productos.filter(p => p.id !== id);
    this.storage.saveProductos(this.productos);
    this.actualizarTablas();
  }

  limpiarFormularioInventario() {
    document.querySelectorAll('.form-inventario input').forEach(input => {
      input.value = '';
    });

    document.getElementById('preview-img').style.display = 'none';
    document.getElementById('lista-promos').innerHTML = '';
    document.getElementById('unidad-prod').value = 'kg';
  }

  exportarDatos() {
    if (this.productos.length === 0 && this.historialVentas.length === 0) {
      return alert('No hay datos para exportar.');
    }

    const respaldo = {
      version: 1,
      exportedAt: new Date().toISOString(),
      productos: this.productos,
      ventas: this.historialVentas
    };

    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(respaldo))}`;
    const enlace = document.createElement('a');
    enlace.setAttribute('href', dataStr);
    enlace.setAttribute('download', `fruteria_respaldo_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
  }

  importarDatos(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const jsonCargado = JSON.parse(e.target.result);

        if (Array.isArray(jsonCargado)) {
          this.productos = jsonCargado;
          this.storage.saveProductos(this.productos);
          this.actualizarTablas();
          alert('✅ Inventario restaurado con exito.');
        } else if (jsonCargado && Array.isArray(jsonCargado.productos)) {
          this.productos = jsonCargado.productos;
          this.historialVentas = Array.isArray(jsonCargado.ventas) ? jsonCargado.ventas : this.historialVentas;

          this.storage.saveProductos(this.productos);
          this.storage.saveVentas(this.historialVentas);

          this.actualizarTablas();
          this.actualizarTablaVentas();
          this.actualizarDashboard();
          alert('✅ Respaldo restaurado con exito.');
        } else {
          alert('❌ Formato incorrecto.');
        }
      } catch (error) {
        alert('❌ Error al leer el archivo.');
      }

      event.target.value = '';
    };

    reader.readAsText(file);
  }

  filtrarProductos() {
    const texto = document.getElementById('buscador-caja').value.toLowerCase();
    document.querySelectorAll('#grid-productos .card').forEach(tarjeta => {
      const nombre = tarjeta.querySelector('.title').innerText.toLowerCase();
      tarjeta.style.display = nombre.includes(texto) ? 'block' : 'none';
    });
  }

  seleccionarProductoCaja(id, nombre, unidad) {
    document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));

    const selectedCard = document.getElementById('card-' + id);
    if (selectedCard) selectedCard.classList.add('selected');

    document.getElementById('id-seleccionado').value = id;
    document.getElementById('producto-seleccionado-txt').innerText = `👉 Seleccionaste: ${nombre}`;
    document.getElementById('cantidad-venta').placeholder = `Cantidad en ${unidad}`;
    document.getElementById('cantidad-venta').focus();
  }

  agregarACuenta() {
    const id = parseInt(document.getElementById('id-seleccionado').value, 10);
    const cantidadVenta = parseFloat(document.getElementById('cantidad-venta').value);

    if (isNaN(id) || isNaN(cantidadVenta) || cantidadVenta <= 0) {
      return alert('Selecciona producto y cantidad.');
    }

    const producto = this.productos.find(p => p.id === id);
    if (!producto) {
      return alert('El producto ya no existe en inventario.');
    }

    const quierePromo = document.getElementById('forzar-promo').checked;
    const precioCalculado = PromotionEngine.calculateSubtotal(producto, cantidadVenta, quierePromo);

    this.cuentaActual.push({
      ...producto,
      cantidad: cantidadVenta,
      subtotal: precioCalculado.subtotal,
      notaPromo: precioCalculado.notaPromo,
      idTicket: Date.now()
    });

    document.getElementById('forzar-promo').checked = true;
    document.getElementById('cantidad-venta').value = '';
    this.renderizarCuenta();
  }

  eliminarDeCuenta(idTicket) {
    this.cuentaActual = this.cuentaActual.filter(item => item.idTicket !== idTicket);
    this.renderizarCuenta();
  }

  limpiarCuenta() {
    this.cuentaActual = [];
    document.getElementById('pago-cliente').value = '';
    document.getElementById('producto-seleccionado-txt').innerText = 'Selecciona un producto...';
    document.getElementById('id-seleccionado').value = '';
    document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
    this.renderizarCuenta();
  }

  calcularCambio() {
    const total = parseFloat(document.getElementById('total-cuenta').innerText);
    const pago = parseFloat(document.getElementById('pago-cliente').value) || 0;
    const spanCambio = document.getElementById('cambio-cliente');

    spanCambio.innerText = pago >= total && total > 0 ? (pago - total).toFixed(2) : '0.00';
    spanCambio.style.color = pago >= total && total > 0 ? '#2e7d32' : (pago > 0 ? '#c62828' : '#333');
  }

  terminarVenta() {
    if (this.cuentaActual.length === 0) {
      return alert('Ticket vacio.');
    }

    const total = this.cuentaActual.reduce((sum, item) => sum + item.subtotal, 0);
    const pago = parseFloat(document.getElementById('pago-cliente').value) || 0;
    if (pago < total) {
      return alert('El pago no cubre el total del ticket.');
    }

    const ahora = new Date();
    this.historialVentas.push({
      id: Date.now(),
      fechaISO: Utils.getTodayLocalISO(),
      hora: ahora.toLocaleTimeString(),
      items: [...this.cuentaActual],
      total
    });

    this.storage.saveVentas(this.historialVentas);
    this.limpiarCuenta();
    this.actualizarTablaVentas();
    this.actualizarDashboard();
    alert('✅ Venta registrada.');
  }

  actualizarTablaVentas() {
    const tbodyVentas = document.getElementById('tabla-ventas');
    const hoy = Utils.getTodayLocalISO();
    let totalDia = 0;

    tbodyVentas.innerHTML = '';

    this.historialVentas.forEach(venta => {
      if (venta.fechaISO === hoy) totalDia += venta.total;

      const detallesHtml = (venta.items || [])
        .map(item => `${item.cantidad} ${Utils.escapeHtml(item.unidad || 'kg')} de ${Utils.escapeHtml(item.nombre)}`)
        .join('<br>');

      const hora = Utils.escapeHtml(venta.hora || venta.fecha || '--:--');
      tbodyVentas.innerHTML += `
        <tr>
          <td>${hora}</td>
          <td style="font-size: 14px;">${detallesHtml || '-'}</td>
          <td><strong>$${venta.total.toFixed(2)}</strong></td>
        </tr>`;
    });

    document.getElementById('total-dia').innerText = totalDia.toFixed(2);
  }

  borrarHistorial() {
    if (!confirm('¿Hacer corte definitivo y empezar en cero?')) return;

    this.historialVentas = [];
    this.storage.clearVentas();
    this.actualizarTablaVentas();
    this.actualizarDashboard();
  }

  actualizarDashboard() {
    let totalIngresos = 0;
    const agrupadoProductos = {};

    this.historialVentas.forEach(venta => {
      totalIngresos += venta.total;
      (venta.items || []).forEach(item => {
        if (!agrupadoProductos[item.nombre]) {
          agrupadoProductos[item.nombre] = {
            cantidad: 0,
            dinero: 0,
            unidad: item.unidad || 'kg'
          };
        }

        agrupadoProductos[item.nombre].cantidad += item.cantidad;
        agrupadoProductos[item.nombre].dinero += item.subtotal;
      });
    });

    const listaStats = Object.keys(agrupadoProductos).map(nombre => ({
      nombre,
      cantidad: agrupadoProductos[nombre].cantidad,
      dinero: agrupadoProductos[nombre].dinero,
      unidad: agrupadoProductos[nombre].unidad
    }));

    const topCantidad = [...listaStats].sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);
    const topDinero = [...listaStats].sort((a, b) => b.dinero - a.dinero).slice(0, 5);

    document.getElementById('metric-tickets').innerText = this.historialVentas.length;
    document.getElementById('dash-ingresos').innerText = `$${totalIngresos.toFixed(2)}`;
    document.getElementById('metric-top-prod').innerText = topCantidad.length > 0 ? topCantidad[0].nombre : '-';

    const ulCant = document.getElementById('list-top-cant');
    const ulDinero = document.getElementById('list-top-dinero');
    ulCant.innerHTML = '';
    ulDinero.innerHTML = '';

    topCantidad.forEach((producto, index) => {
      ulCant.innerHTML += `<li><span>${index + 1}. ${producto.nombre}</span> <span class="badge">${producto.cantidad} ${producto.unidad}</span></li>`;
    });

    topDinero.forEach((producto, index) => {
      ulDinero.innerHTML += `<li><span>${index + 1}. ${producto.nombre}</span> <span class="badge" style="background:#e3f2fd; color:#1565c0;">$${producto.dinero.toFixed(2)}</span></li>`;
    });
  }

  actualizarTablas() {
    const tbodyInv = document.getElementById('tabla-inventario');
    const gridCaja = document.getElementById('grid-productos');

    tbodyInv.innerHTML = '';
    gridCaja.innerHTML = '';

    this.productos.forEach(producto => {
      const imgTag = producto.imagen ? `<img src="${producto.imagen}">` : '<div style="font-size:40px;">📦</div>';
      const unidadTxt = producto.unidad === 'pza' ? 'pza' : 'kg';
      const nombreSeguro = Utils.escapeHtml(producto.nombre);

      let htmlPromos = '';
      (producto.promociones || []).forEach(promo => {
        htmlPromos += `<div class="promo">${promo.cant}${unidadTxt} x $${promo.precio}</div>`;
      });

      tbodyInv.innerHTML += `
        <tr>
          <td>${imgTag}</td>
          <td><strong>${nombreSeguro}</strong><br><small>$${producto.precio.toFixed(2)} / ${unidadTxt}</small></td>
          <td>
            <button class="btn-action btn-warning btn-small" onclick="editarProducto(${producto.id})">✏️</button>
            <button class="btn-action btn-danger btn-small" onclick="eliminarProducto(${producto.id})">🗑️</button>
          </td>
        </tr>`;

      gridCaja.innerHTML += `
        <div class="card" id="card-${producto.id}" onclick='seleccionarProductoCaja(${producto.id}, ${JSON.stringify(producto.nombre)}, ${JSON.stringify(unidadTxt)})'>
          ${imgTag}
          <div class="title">${nombreSeguro}</div>
          <div class="price">$${producto.precio.toFixed(2)} / ${unidadTxt}</div>
          ${htmlPromos}
        </div>`;
    });
  }

  renderizarCuenta() {
    const tbodyCuenta = document.getElementById('tabla-cuenta');
    let total = 0;

    tbodyCuenta.innerHTML = '';

    this.cuentaActual.forEach(item => {
      total += item.subtotal;
      tbodyCuenta.innerHTML += `
        <tr>
          <td>${Utils.escapeHtml(item.nombre)} <br><small style="color:#d84315">${Utils.escapeHtml(item.notaPromo)}</small></td>
          <td>${item.cantidad} ${item.unidad || 'kg'}</td>
          <td>$${item.subtotal.toFixed(2)}</td>
          <td><button class="btn-action btn-danger btn-small" onclick="eliminarDeCuenta(${item.idTicket})">❌</button></td>
        </tr>`;
    });

    document.getElementById('total-cuenta').innerText = total.toFixed(2);
    this.calcularCambio();
  }
}
