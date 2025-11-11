const LibelulaService = {
  config: {
    baseURL: 'https://api.libelula.bo/v1',
    apiKey: 'MOCK_API_KEY',
    isMock: true
  },

  crearPagoQR: async (pedidoData) => {
    console.log('🦋 Libélula: Creando pago QR...', pedidoData);

    if (LibelulaService.config.isMock) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockResponse = {
            success: true,
            transaction_id: `TRX_${Date.now()}`,
            qr_url: LibelulaService.generarQRDataURL(pedidoData),
            qr_image: LibelulaService.generarQRDataURL(pedidoData),
            status: 'pending',
            amount: pedidoData.total,
            currency: 'BOB',
            reference: pedidoData.numero_pedido,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            payment_url: `https://libelula.bo/pay/${Date.now()}`
          };

          console.log('✅ Libélula Mock: Pago creado', mockResponse);
          resolve(mockResponse);
        }, 1500);
      });

    } else {
      try {
        const response = await fetch(`${LibelulaService.config.baseURL}/qr/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LibelulaService.config.apiKey}`
          },
          body: JSON.stringify({
            amount: pedidoData.total,
            currency: 'BOB',
            reference: pedidoData.numero_pedido,
            description: `Pedido ${pedidoData.numero_pedido} - Panadería Belén`,
            customer: {
              name: pedidoData.cliente_nombre,
              email: pedidoData.cliente_email,
              phone: pedidoData.cliente_telefono
            },
            callback_url: `${window.location.origin}/api/pagos/callback`,
            return_url: `${window.location.origin}/pedidos/confirmacion`
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Error al crear pago');
        }

        return data;

      } catch (error) {
        console.error('❌ Error en Libélula:', error);
        throw error;
      }
    }
  },

  verificarPago: async (transaction_id) => {
    console.log('🦋 Libélula: Verificando pago...', transaction_id);

    if (LibelulaService.config.isMock) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockResponse = {
            success: true,
            transaction_id: transaction_id,
            status: 'pending',
            amount: 0,
            currency: 'BOB',
            paid_at: null
          };

          console.log('✅ Libélula Mock: Estado del pago', mockResponse);
          resolve(mockResponse);
        }, 500);
      });

    } else {
      try {
        const response = await fetch(
          `${LibelulaService.config.baseURL}/qr/status/${transaction_id}`,
          {
            headers: {
              'Authorization': `Bearer ${LibelulaService.config.apiKey}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Error al verificar pago');
        }

        return data;

      } catch (error) {
        console.error('❌ Error al verificar pago:', error);
        throw error;
      }
    }
  },

  cancelarPago: async (transaction_id) => {
    console.log('🦋 Libélula: Cancelando pago...', transaction_id);

    if (LibelulaService.config.isMock) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            transaction_id: transaction_id,
            status: 'cancelled'
          });
        }, 500);
      });

    } else {
      try {
        const response = await fetch(
          `${LibelulaService.config.baseURL}/qr/cancel/${transaction_id}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LibelulaService.config.apiKey}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Error al cancelar pago');
        }

        return data;

      } catch (error) {
        console.error('❌ Error al cancelar pago:', error);
        throw error;
      }
    }
  },

  generarQRDataURL: (pedidoData) => {
    // Fallback: QR placeholder
    const texto = `Pedido: ${pedidoData.numero_pedido}\nTotal: Bs ${pedidoData.total}\nCliente: ${pedidoData.cliente_nombre}`;
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%23fff'/%3E%3Ctext x='50%25' y='40%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%23333'%3EQR de Pago%3C/text%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='14' fill='%23666'%3E${pedidoData.numero_pedido}%3C/text%3E%3Ctext x='50%25' y='60%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='18' font-weight='bold' fill='%2310b981'%3EBs ${pedidoData.total}%3C/text%3E%3C/svg%3E`;
  },

  formatearMonto: (monto) => {
    return parseFloat(monto).toFixed(2);
  },

  validarMonto: (monto) => {
    const montoNum = parseFloat(monto);
    return !isNaN(montoNum) && montoNum > 0;
  }
};

window.LibelulaService = LibelulaService;

console.log('🦋 Libélula Service cargado (Modo:', LibelulaService.config.isMock ? 'MOCK' : 'REAL', ')');