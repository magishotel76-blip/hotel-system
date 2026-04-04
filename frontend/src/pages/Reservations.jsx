import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '', roomId: '', checkInDate: '', checkOutDate: '', totalPrice: '', guestsCount: 1, guestNames: ''
  });
  const [editData, setEditData] = useState({ id: '', checkOutDate: '', totalPrice: '' });

  const fetchData = async () => {
    try {
      const [resRes, custRes, roomsRes] = await Promise.all([
        api.get('/reservations'),
        api.get('/customers'),
        api.get('/rooms')
      ]);
      setReservations(resRes.data);
      setCustomers(custRes.data);
      setRooms(roomsRes.data.filter(r => r.status === 'disponible' || r.status === 'ocupada')); // Para selector
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reservations', formData);
      setIsModalOpen(false);
      setFormData({ customerId: '', roomId: '', checkInDate: '', checkOutDate: '', totalPrice: '', guestsCount: 1, guestNames: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error creando reserva');
    }
  };

  const updateStatus = async (id, status, roomId) => {
    try {
      await api.put(`/reservations/${id}`, { status, roomId });
      fetchData();
    } catch (error) {
      alert('Error actualizando estado');
    }
  };

  const deleteReservation = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar completamente esta reserva?')) {
      try {
        await api.delete(`/reservations/${id}`);
        fetchData();
      } catch (error) {
        alert('Error eliminando reserva');
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/reservations/${editData.id}`, { 
        checkOutDate: editData.checkOutDate, 
        totalPrice: editData.totalPrice 
      });
      setEditModalOpen(false);
      fetchData();
    } catch (error) {
      alert('Error actualizando reserva');
    }
  };

  const openEditModal = (res) => {
    setEditData({
      id: res.id,
      checkOutDate: res.checkOutDate.split('T')[0],
      totalPrice: res.totalPrice
    });
    setEditModalOpen(true);
  };

  if (loading) return <div>Cargando reservas...</div>;

  const statusColors = {
    activa: 'bg-blue-100 text-blue-800',
    completada: 'bg-green-100 text-green-800',
    cancelada: 'bg-red-100 text-red-800'
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reservas (Check-in / Check-out)</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" /> Nueva Reserva
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Habitación</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fechas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reservations.map((res) => (
              <tr key={res.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{res.customer?.name}</div>
                  <div className="text-xs text-gray-500">{res.customer?.document}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <div className="flex flex-col">
                    <span>Nº {res.room?.roomNumber}</span>
                    <span className="text-xs text-slate-500 font-normal">{res.guestsCount} Pers.</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(res.checkInDate), 'dd/MM/yyyy')} - {format(new Date(res.checkOutDate), 'dd/MM/yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">${res.totalPrice}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[res.status]}`}>
                    {res.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {res.status === 'activa' && (
                    <div className="flex space-x-2">
                      <button onClick={() => updateStatus(res.id, 'completada', res.roomId)} className="text-green-600 hover:text-green-900" title="Check-out">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button onClick={() => openEditModal(res)} className="text-blue-600 hover:text-blue-900" title="Editar Estadía (Extender)">
                        <Plus className="w-5 h-5" />
                      </button>
                      <button onClick={() => updateStatus(res.id, 'cancelada', res.roomId)} className="text-red-600 hover:text-red-900" title="Cancelar">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  {res.status !== 'activa' && (
                    <button onClick={() => deleteReservation(res.id)} className="text-slate-400 hover:text-red-600 ml-2" title="Eliminar del Historial">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nueva Reserva (Check-in)</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cliente</label>
                <select required className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})}>
                  <option value="">Seleccione cliente...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.document})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Habitación (Disponibles)</label>
                <select required className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})}>
                  <option value="">Seleccione habitación...</option>
                  {rooms.filter(r => r.status === 'disponible').map(r => (
                    <option key={r.id} value={r.id}>Nº {r.roomNumber} - ${r.pricePerNight} / noche</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha Entrada</label>
                  <input required type="date" className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={formData.checkInDate} onChange={e => setFormData({...formData, checkInDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha Salida</label>
                  <input required type="date" className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={formData.checkOutDate} onChange={e => setFormData({...formData, checkOutDate: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cant. Personas</label>
                  <input type="number" min="1" className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={formData.guestsCount} onChange={e => setFormData({...formData, guestsCount: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombres Adicionales</label>
                  <input type="text" placeholder="Ej. Ana, Luis" className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    value={formData.guestNames} onChange={e => setFormData({...formData, guestNames: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Precio Total (Aprox)</label>
                <input required type="number" step="0.01" className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  value={formData.totalPrice} onChange={e => setFormData({...formData, totalPrice: e.target.value})} />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar & Check-in</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Extender Estadía</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nueva Fecha de Salida</label>
                <input required type="date" className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={editData.checkOutDate} onChange={e => setEditData({...editData, checkOutDate: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Precio Total (Actualizado)</label>
                <input required type="number" step="0.01" className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={editData.totalPrice} onChange={e => setEditData({...editData, totalPrice: e.target.value})} />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setEditModalOpen(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
