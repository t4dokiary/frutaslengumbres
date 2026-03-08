class PromotionEngine {
  static calculateSubtotal(producto, cantidadVenta, quierePromo) {
    let subtotal = 0;
    let cantRestante = cantidadVenta;
    const notasPromo = [];
    const promos = producto.promociones || [];

    if (quierePromo && promos.length > 0) {
      const promosOrdenadas = [...promos].sort((a, b) => b.cant - a.cant);
      for (const promo of promosOrdenadas) {
        if (cantRestante < promo.cant) continue;

        if (promo.tipo === 'exacto' && cantRestante === promo.cant) {
          subtotal += promo.precio;
          cantRestante = 0;
          notasPromo.push('Promo Exacta');
          break;
        }

        if (promo.tipo === 'proporcional') {
          subtotal += cantRestante * (promo.precio / promo.cant);
          cantRestante = 0;
          notasPromo.push('Promo Prop.');
          break;
        }

        if (promo.tipo === 'multiplos') {
          const cantPromos = Math.floor(cantRestante / promo.cant);
          subtotal += cantPromos * promo.precio;
          cantRestante %= promo.cant;
          notasPromo.push(`${cantPromos}x Promo`);
        }
      }
    }

    if (cantRestante > 0) {
      subtotal += cantRestante * producto.precio;
    }

    return {
      subtotal,
      notaPromo: notasPromo.join(' + ')
    };
  }
}
