import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function Finance() {
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [pendingSales, setPendingSales] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Forms state
  const [expenseData, setExpenseData] = useState({ category: '', description: '', amount: '', date: '', paymentMethod: 'cash', transferReference: '' });
  const [invoiceData, setInvoiceData] = useState({ reservationId: '', items: [] });
  const [newItem, setNewItem] = useState({ type: 'servicio', description: '', quantity: 1, unitPrice: '', productId: '' });

  const fetchData = async () => {
    try {
      const [expRes, invRes, resRes, prodRes, txRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/billing'),
        api.get('/reservations'),
        api.get('/inventory/products'),
        api.get('/inventory/transactions')
      ]);
      setExpenses(expRes.data);
      setInvoices(invRes.data);
      
      const sales = txRes.data.filter(t => t.type === 'salida' && t.exitType === 'venta' && t.status === 'pending');
      setPendingSales(sales);
      
      // Solo reservas activas/completadas para facturar
      setReservations(resRes.data.filter(r => r.status !== 'cancelada'));
      setProducts(prodRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', expenseData);
      setIsExpenseModalOpen(false);
      setExpenseData({ category: '', description: '', amount: '', date: '', paymentMethod: 'cash', transferReference: '' });
      fetchData();
    } catch (error) {
      alert('Error guardando gasto');
    }
  };

  const handleAddInvoiceItem = () => {
    if (!newItem.description || !newItem.unitPrice) return alert('Llene descripción y precio');
    
    // Si es tipo producto, buscar el producto
    let finalItem = { ...newItem, unitPrice: parseFloat(newItem.unitPrice), quantity: parseInt(newItem.quantity) };
    if (newItem.type === 'producto' && newItem.productId) {
      const p = products.find(prod => prod.id === newItem.productId);
      if (p) {
        finalItem.description = p.name;
        finalItem.unitPrice = p.salePrice;
      }
    }
    
    setInvoiceData({
      ...invoiceData,
      items: [...invoiceData.items, finalItem]
    });
    setNewItem({ type: 'servicio', description: '', quantity: 1, unitPrice: '', productId: '' });
  };

  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    if (invoiceData.items.length === 0) return alert('Debe agregar al menos un item');
    try {
      await api.post('/billing', invoiceData);
      setIsInvoiceModalOpen(false);
      setInvoiceData({ reservationId: '', items: [] });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error guardando prefactura');
    }
  };

  const payInvoice = async (id) => {
    if(confirm('¿Marcar como pagada?')) {
      try {
        await api.put(`/billing/${id}/pay`);
        fetchData();
      } catch (error) {
        alert('Error al pagar');
      }
    }
  }

  const handleSecureDelete = async (type, id) => {
    const SESSION_KEY = 'adminDeleteSession';
    const SESSION_DURATION = 10 * 60 * 1000;
    
    let pwd = null;
    const sessionStr = localStorage.getItem(SESSION_KEY);
    
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (Date.now() - session.timestamp < SESSION_DURATION) {
        pwd = session.password;
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    }

    if (pwd) {
      const confirmDelete = window.confirm('¿Confirmas que deseas eliminar este registro financieramente? (Sesión activa)');
      if (!confirmDelete) return;
    } else {
      pwd = window.prompt('SEGURIDAD: Se requiere autorización de administrador. Ingrese la contraseña de seguridad para eliminar registros (acceso de 10 min):');
      if (pwd === null) return;
    }
    
    try {
      let url = '';
      if (type === 'expense') url = `/expenses/${id}`;
      else if (type === 'invoice') url = `/billing/${id}`;
      else if (type === 'transaction') url = `/inventory/transactions/${id}`;
      
      await api.delete(url, { data: { password: pwd } });
      
      if (!sessionStr) {
         localStorage.setItem(SESSION_KEY, JSON.stringify({ password: pwd, timestamp: Date.now() }));
         alert('Contraseña aceptada y registro eliminado de forma segura.');
      }
      fetchData();
    } catch (error) {
      localStorage.removeItem(SESSION_KEY); 
      alert(error.response?.data?.message || 'Error al eliminar el registro. Contraseña incorrecta.');
    }
  };

  if (loading) return <div>Cargando finanzas...</div>;

  return (
    <div className="space-y-8">
      {/* SECCION GASTOS */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Control de Gastos</h2>
          <button onClick={() => setIsExpenseModalOpen(true)} className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 flex items-center text-sm">
            <Plus className="w-4 h-4 mr-1" /> Nuevo Gasto
          </button>
        </div>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expenses.map(e => (
                <tr key={e.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(e.date), 'dd/MM/yyyy')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{e.category || 'General'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.description || 'Sin descripción'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold">${e.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleSecureDelete('expense', e.id)} className="text-red-500 hover:text-red-700 transition"><Trash2 className="w-4 h-4 inline"/></button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No hay gastos</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECCION PREFACTURAS Y VENTAS DIRECTAS */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Facturación y Ventas Directas</h2>
          <button onClick={() => setIsInvoiceModalOpen(true)} className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 flex items-center text-sm">
            <Plus className="w-4 h-4 mr-1" /> Crear Prefactura
          </button>
        </div>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reserva / Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map(inv => (
                <tr key={`inv-${inv.id}`}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{inv.reservation?.customer?.name || 'Cliente sin registro'}</div>
                    <div className="text-xs text-gray-500">{inv.reservation ? `Hab: ${inv.reservation.room?.roomNumber}` : 'Venta Directa'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.items?.length} items</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${inv.totalAmount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 text-xs font-bold rounded-full ${inv.status === 'pagada' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                    {inv.status === 'borrador' && (
                      <button onClick={() => payInvoice(inv.id)} className="text-blue-600 hover:text-blue-900 font-bold">Pagar</button>
                    )}
                    <button className="text-gray-400 hover:text-gray-600 transition" title="Exportar PDF (Pendiente)"><Download className="w-4 h-4 inline"/></button>
                    <button onClick={() => handleSecureDelete('invoice', inv.id)} className="text-red-400 hover:text-red-600 transition" title="Eliminar Factura"><Trash2 className="w-4 h-4 inline"/></button>
                  </td>
                </tr>
              ))}
              {pendingSales.map(sale => (
                <tr key={`sal-${sale.id}`} className="bg-amber-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">Venta Rápida (Comida)</div>
                    <div className="text-xs text-gray-500">Sin Factura Oficial</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1 item ({sale.product?.name})</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${(sale.quantity * (sale.price || sale.product?.salePrice || 0)).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 text-xs font-bold rounded-full bg-amber-200 text-amber-800">
                      PENDIENTE
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                    <button onClick={() => handleSecureDelete('transaction', sale.id)} className="text-red-400 hover:text-red-600 transition" title="Eliminar Venta"><Trash2 className="w-4 h-4 inline"/></button>
                  </td>
                </tr>
              ))}
              {(invoices.length === 0 && pendingSales.length === 0) && <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No hay facturas ni ventas</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL GASTOS */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Registrar Gasto</h2>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Categoría</label>
                <select required className="mt-1 block w-full border rounded p-2" value={expenseData.category} onChange={e => setExpenseData({...expenseData, category: e.target.value})}>
                  <option value="">Seleccione...</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Servicios">Servicios Generales</option>
                  <option value="Planilla">Planilla/Empleados</option>
                  <option value="Insumos">Insumos/Stock</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Descripción</label>
                <input required type="text" className="mt-1 block w-full border rounded p-2" value={expenseData.description} onChange={e => setExpenseData({...expenseData, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Monto</label>
                  <input required type="number" step="0.01" className="mt-1 block w-full border rounded p-2" value={expenseData.amount} onChange={e => setExpenseData({...expenseData, amount: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Fecha</label>
                  <input type="date" className="mt-1 block w-full border rounded p-2" value={expenseData.date} onChange={e => setExpenseData({...expenseData, date: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Método Pago</label>
                  <select className="mt-1 block w-full border rounded p-2" value={expenseData.paymentMethod} onChange={e => setExpenseData({...expenseData, paymentMethod: e.target.value})}>
                    <option value="cash">Efectivo</option>
                    <option value="transfer">Transferencia</option>
                    <option value="office">Compra de Oficina</option>
                  </select>
                </div>
                {expenseData.paymentMethod === 'transfer' && (
                  <div>
                    <label className="block text-sm font-medium">Referencia</label>
                    <input type="text" placeholder="# Ref" className="mt-1 block w-full border rounded p-2" value={expenseData.transferReference} onChange={e => setExpenseData({...expenseData, transferReference: e.target.value})} />
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PREFACTURA */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Crear Prefactura</h2>
            <form onSubmit={handleInvoiceSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium">Reserva Asociada</label>
                <select required className="mt-1 block w-full border rounded p-2" value={invoiceData.reservationId} onChange={e => setInvoiceData({...invoiceData, reservationId: e.target.value})}>
                  <option value="">Seleccione reserva...</option>
                  {reservations.map(r => <option key={r.id} value={r.id}>{r.customer?.name} - Hab {r.room?.roomNumber} (Ocupada)</option>)}
                </select>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md border">
                <h3 className="font-semibold text-sm mb-2">Añadir Item</h3>
                <div className="grid grid-cols-12 gap-2 mt-2">
                  <div className="col-span-3">
                    <select className="w-full border p-1 rounded text-sm" value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value, productId: '', description: '', unitPrice: ''})}>
                      <option value="servicio">Servicio/Hab</option>
                      <option value="producto">Producto</option>
                    </select>
                  </div>
                  {newItem.type === 'producto' ? (
                    <div className="col-span-5">
                      <select className="w-full border p-1 rounded text-sm" value={newItem.productId} onChange={e => {
                        const p = products.find(x => x.id === e.target.value);
                        setNewItem({...newItem, productId: e.target.value, description: p?.name, unitPrice: p?.salePrice});
                      }}>
                        <option value="">Escoge producto...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.salePrice})</option>)}
                      </select>
                    </div>
                  ) : (
                    <div className="col-span-5"><input type="text" placeholder="Descripción" className="w-full border p-1 rounded text-sm" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})}/></div>
                  )}
                  <div className="col-span-1"><input type="number" placeholder="Cant." className="w-full border p-1 rounded text-sm" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})}/></div>
                  <div className="col-span-2"><input type="number" placeholder="Precio" disabled={newItem.type === 'producto'} className="w-full border p-1 rounded text-sm bg-white disabled:bg-gray-100" value={newItem.unitPrice} onChange={e => setNewItem({...newItem, unitPrice: e.target.value})}/></div>
                  <div className="col-span-1 border"><button type="button" onClick={handleAddInvoiceItem} className="w-full h-full bg-blue-100 text-blue-800 rounded text-sm">+</button></div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Items a facturar:</h3>
                <ul className="text-sm border rounded divide-y">
                  {invoiceData.items.map((it, idx) => (
                    <li key={idx} className="p-2 flex justify-between">
                      <span>{it.quantity}x {it.description}</span>
                      <span className="font-medium">${it.unitPrice * it.quantity}</span>
                    </li>
                  ))}
                  {invoiceData.items.length === 0 && <li className="p-2 text-gray-500 text-center">No hay items</li>}
                </ul>
                <div className="mt-2 text-right font-bold text-lg">
                  Total: ${invoiceData.items.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0)}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setIsInvoiceModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar Prefactura</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
