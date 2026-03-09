class FruteriaApp {
  constructor(storageService) {
    this.storage = storageService;
    this.productos = this.storage.loadProductos();
    this.historialVentas = this.storage.loadVentas();
    this.cuentaActual = [];
  }

  init() {
    if (document.getElementById('tabla-inventario') || document.getElementById('grid-productos')) {
      this.actualizarTablas();
    }

    if (document.getElementById('tabla-ventas') && document.getElementById('total-dia')) {
      this.actualizarTablaVentas();
    }

    if (document.getElementById('metric-tickets')) {
      this.actualizarDashboard();
    }
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
    div.className = 'promo-fila row g-2 align-items-center mb-2';
    div.innerHTML = `
      <div class="col-12 col-md-3">
        <input type="number" inputmode="decimal" class="p-cant form-control" placeholder="Lleva" value="${cant}">
      </div>
      <div class="col-12 col-md-3">
        <input type="number" inputmode="decimal" class="p-precio form-control" placeholder="Por ($)" value="${precio}">
      </div>
      <div class="col-12 col-md-4">
        <select class="p-tipo form-select">
          <option value="multiplos" ${tipo === 'multiplos' ? 'selected' : ''}>Multiples</option>
          <option value="exacto" ${tipo === 'exacto' ? 'selected' : ''}>Exacto</option>
          <option value="proporcional" ${tipo === 'proporcional' ? 'selected' : ''}>Mayores</option>
        </select>
      </div>
      <div class="col-12 col-md-2">
        <button type="button" class="btn btn-outline-danger btn-sm w-100" onclick="this.parentElement.parentElement.remove()">Quitar</button>
      </div>
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
    const buscador = document.getElementById('buscador-caja');
    if (!buscador) return;

    const texto = buscador.value.toLowerCase();
    document.querySelectorAll('#grid-productos .product-item').forEach(tarjeta => {
      const nombre = tarjeta.querySelector('.title').innerText.toLowerCase();
      tarjeta.style.display = nombre.includes(texto) ? '' : 'none';
    });
  }

  filtrarInventario() {
    const buscador = document.getElementById('buscador-inventario');
    const tabla = document.getElementById('tabla-inventario');
    if (!buscador || !tabla) return;

    const texto = buscador.value.toLowerCase().trim();
    tabla.querySelectorAll('tr').forEach(fila => {
      const contenido = fila.innerText.toLowerCase();
      fila.style.display = contenido.includes(texto) ? '' : 'none';
    });
  }

  seleccionarProductoCaja(id, nombre, unidad) {
    const selectedTxt = document.getElementById('producto-seleccionado-txt');
    const idSeleccionado = document.getElementById('id-seleccionado');
    const cantidadInput = document.getElementById('cantidad-venta');
    if (!selectedTxt || !idSeleccionado || !cantidadInput) return;

    document.querySelectorAll('.product-card').forEach(c => {
      c.classList.remove('border-success', 'border-2', 'shadow');
    });

    const selectedCard = document.getElementById('card-' + id);
    if (selectedCard) selectedCard.classList.add('border-success', 'border-2', 'shadow');

    idSeleccionado.value = id;
    selectedTxt.innerText = `👉 Seleccionaste: ${nombre}`;
    cantidadInput.placeholder = `Cantidad en ${unidad}`;
    cantidadInput.focus();
  }

  agregarACuenta() {
    const idInput = document.getElementById('id-seleccionado');
    const cantidadInput = document.getElementById('cantidad-venta');
    const promoCheckbox = document.getElementById('forzar-promo');
    if (!idInput || !cantidadInput || !promoCheckbox) return;

    const id = parseInt(idInput.value, 10);
    const cantidadVenta = parseFloat(cantidadInput.value);

    if (isNaN(id) || isNaN(cantidadVenta) || cantidadVenta <= 0) {
      return alert('Selecciona producto y cantidad.');
    }

    const producto = this.productos.find(p => p.id === id);
    if (!producto) {
      return alert('El producto ya no existe en inventario.');
    }

    const quierePromo = promoCheckbox.checked;
    const precioCalculado = PromotionEngine.calculateSubtotal(producto, cantidadVenta, quierePromo);

    this.cuentaActual.push({
      ...producto,
      cantidad: cantidadVenta,
      subtotal: precioCalculado.subtotal,
      notaPromo: precioCalculado.notaPromo,
      idTicket: Date.now()
    });

    promoCheckbox.checked = true;
    cantidadInput.value = '';
    this.renderizarCuenta();
  }

  eliminarDeCuenta(idTicket) {
    this.cuentaActual = this.cuentaActual.filter(item => item.idTicket !== idTicket);
    this.renderizarCuenta();
  }

  limpiarCuenta() {
    const pagoCliente = document.getElementById('pago-cliente');
    const selectedTxt = document.getElementById('producto-seleccionado-txt');
    const idSeleccionado = document.getElementById('id-seleccionado');

    this.cuentaActual = [];
    if (pagoCliente) pagoCliente.value = '';
    if (selectedTxt) selectedTxt.innerText = 'Selecciona un producto...';
    if (idSeleccionado) idSeleccionado.value = '';
    document.querySelectorAll('.product-card').forEach(c => {
      c.classList.remove('border-success', 'border-2', 'shadow');
    });
    this.renderizarCuenta();
  }

  calcularCambio() {
    const spanCambio = document.getElementById('cambio-cliente');
    const totalCuenta = document.getElementById('total-cuenta');
    const pagoCliente = document.getElementById('pago-cliente');
    if (!spanCambio || !totalCuenta || !pagoCliente) return;

    const total = parseFloat(totalCuenta.innerText) || 0;
    const pago = parseFloat(pagoCliente.value) || 0;

    spanCambio.innerText = pago >= total && total > 0 ? (pago - total).toFixed(2) : '0.00';
    spanCambio.style.color = pago >= total && total > 0 ? '#2e7d32' : (pago > 0 ? '#c62828' : '#333');
  }

  terminarVenta() {
    if (this.cuentaActual.length === 0) {
      return alert('Ticket vacio.');
    }

    const total = this.cuentaActual.reduce((sum, item) => sum + item.subtotal, 0);
    const pagoInput = document.getElementById('pago-cliente');
    if (!pagoInput) return;

    const pago = parseFloat(pagoInput.value) || 0;
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
    const totalDiaEl = document.getElementById('total-dia');
    if (!tbodyVentas || !totalDiaEl) return;

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
          <td class="small">${detallesHtml || '-'}</td>
          <td><strong>$${venta.total.toFixed(2)}</strong></td>
        </tr>`;
    });

    totalDiaEl.innerText = totalDia.toFixed(2);
  }

  borrarHistorial() {
    if (!confirm('¿Hacer corte definitivo y empezar en cero?')) return;

    this.historialVentas = [];
    this.storage.clearVentas();
    this.actualizarTablaVentas();
    this.actualizarDashboard();
  }

  actualizarDashboard() {
    const ticketsEl = document.getElementById('metric-tickets');
    const ingresosEl = document.getElementById('dash-ingresos');
    const topProdEl = document.getElementById('metric-top-prod');
    const ulCant = document.getElementById('list-top-cant');
    const ulDinero = document.getElementById('list-top-dinero');
    if (!ticketsEl || !ingresosEl || !topProdEl || !ulCant || !ulDinero) return;

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

    ticketsEl.innerText = this.historialVentas.length;
    ingresosEl.innerText = `$${totalIngresos.toFixed(2)}`;
    topProdEl.innerText = topCantidad.length > 0 ? topCantidad[0].nombre : '-';

    ulCant.innerHTML = '';
    ulDinero.innerHTML = '';

    topCantidad.forEach((producto, index) => {
      ulCant.innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center"><span>${index + 1}. ${producto.nombre}</span><span class="badge text-bg-success rounded-pill">${producto.cantidad} ${producto.unidad}</span></li>`;
    });

    topDinero.forEach((producto, index) => {
      ulDinero.innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center"><span>${index + 1}. ${producto.nombre}</span><span class="badge text-bg-primary rounded-pill">$${producto.dinero.toFixed(2)}</span></li>`;
    });
  }

  actualizarTablas() {
    const tbodyInv = document.getElementById('tabla-inventario');
    const gridCaja = document.getElementById('grid-productos');
    if (!tbodyInv && !gridCaja) return;

    if (tbodyInv) tbodyInv.innerHTML = '';
    if (gridCaja) gridCaja.innerHTML = '';

    const isCompactGrid = !!(gridCaja && gridCaja.classList.contains('grid-compact'));

    this.productos.forEach(producto => {
      const imgTagTable = producto.imagen
        ? `<img src="${producto.imagen}" alt="${Utils.escapeHtml(producto.nombre)}" style="width:56px; height:56px; object-fit:cover; border-radius:8px;">`
        : '<div class="bg-light border rounded d-flex align-items-center justify-content-center" style="width:56px; height:56px;">📦</div>';
      const imgTagCard = producto.imagen
        ? `<img src="${producto.imagen}" alt="${Utils.escapeHtml(producto.nombre)}" class="card-img-top" style="height:120px; object-fit:cover;">`
        : '<div class="bg-light border-bottom d-flex align-items-center justify-content-center" style="height:120px;">📦</div>';
      const unidadTxt = producto.unidad === 'pza' ? 'pza' : 'kg';
      const nombreSeguro = Utils.escapeHtml(producto.nombre);

      let htmlPromos = '';
      (producto.promociones || []).forEach(promo => {
        htmlPromos += `<span class="badge text-bg-warning me-1">${promo.cant}${unidadTxt} x $${promo.precio}</span>`;
      });

      if (tbodyInv) {
        tbodyInv.innerHTML += `
        <tr>
          <td>${imgTagTable}</td>
          <td><strong>${nombreSeguro}</strong><br><small>$${producto.precio.toFixed(2)} / ${unidadTxt}</small></td>
          <td>
            <button class="btn btn-sm btn-outline-warning me-1" onclick="editarProducto(${producto.id})">Editar</button>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminarProducto(${producto.id})">Eliminar</button>
          </td>
        </tr>`;
      }

      if (gridCaja) {
        const promoCompact = (producto.promociones || []).length > 0
          ? '<span class="badge text-bg-warning mt-1">Promo</span>'
          : '';

        const cardBodyHtml = isCompactGrid
          ? `
            <div class="card-body p-1 text-center">
              <div class="title fw-semibold text-truncate" style="font-size:11px;">${nombreSeguro}</div>
              <div class="price text-secondary" style="font-size:10px;">$${producto.precio.toFixed(2)} / ${unidadTxt}</div>
              ${promoCompact}
            </div>`
          : `
            <div class="card-body">
              <div class="title fw-semibold">${nombreSeguro}</div>
              <div class="price text-secondary small mb-2">$${producto.precio.toFixed(2)} / ${unidadTxt}</div>
              <div>${htmlPromos}</div>
            </div>`;

        const imageBlock = isCompactGrid
          ? (producto.imagen
            ? `<img src="${producto.imagen}" alt="${Utils.escapeHtml(producto.nombre)}" class="card-img-top" style="height:58px; object-fit:cover; filter:blur(0.6px);">`
            : '<div class="bg-light border-bottom d-flex align-items-center justify-content-center" style="height:58px;">📦</div>')
          : imgTagCard;

        const compactCardStyle = isCompactGrid
          ? 'cursor:pointer; aspect-ratio:1/1;'
          : 'cursor:pointer;';

        gridCaja.innerHTML += `
        <div class="col product-item">
          <div class="card product-card h-100" id="card-${producto.id}" style="${compactCardStyle}" onclick='seleccionarProductoCaja(${producto.id}, ${JSON.stringify(producto.nombre)}, ${JSON.stringify(unidadTxt)})'>
            ${imageBlock}
            ${cardBodyHtml}
          </div>
        </div>`;
      }
    });

    this.filtrarInventario();
  }

  renderizarCuenta() {
    const tbodyCuenta = document.getElementById('tabla-cuenta');
    const totalCuenta = document.getElementById('total-cuenta');
    if (!tbodyCuenta || !totalCuenta) return;

    let total = 0;

    tbodyCuenta.innerHTML = '';

    this.cuentaActual.forEach(item => {
      total += item.subtotal;
      tbodyCuenta.innerHTML += `
        <tr>
          <td>${Utils.escapeHtml(item.nombre)} <br><small style="color:#d84315">${Utils.escapeHtml(item.notaPromo)}</small></td>
          <td>${item.cantidad} ${item.unidad || 'kg'}</td>
          <td>$${item.subtotal.toFixed(2)}</td>
          <td><button class="btn btn-sm btn-outline-danger" onclick="eliminarDeCuenta(${item.idTicket})">Quitar</button></td>
        </tr>`;
    });

    totalCuenta.innerText = total.toFixed(2);
    this.calcularCambio();
  }
}
