import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Camera, X, Image as ImageIcon } from 'lucide-react';

// Reusable Drawer Component
const Drawer = ({ isOpen, onClose, title, children, widthClass = "max-w-md" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className={`relative w-full ${widthClass} bg-white h-full shadow-2xl flex flex-col animate-[slideLeft_0.3s_ease-out]`}>
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({ 
    roomNumber: '', roomTypeId: '', pricePerNight: '', status: 'disponible',
    images: [] // To store current room images
  });
  const [editingId, setEditingId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const closeDrawer = () => setIsDrawerOpen(false);

  const fetchData = async () => {
    try {
      const [roomsRes, typesRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/rooms/types')
      ]);
      setRooms(roomsRes.data);
      setRoomTypes(typesRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      await api.post(`/rooms/${editingId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Refresh single room to get new images
      const { data } = await api.get(`/rooms/${editingId}`);
      setFormData(prev => ({ ...prev, images: data.images }));
      fetchData(); // Refresh list too
    } catch (error) {
      alert('Error subiendo imágenes');
    }
  };

  const handleImageDelete = async (imageId) => {
    if (!window.confirm('¿Eliminar esta imagen?')) return;
    try {
      await api.delete(`/rooms/images/${imageId}`);
      setFormData(prev => ({ ...prev, images: prev.images.filter(img => img.id !== imageId) }));
      fetchData();
    } catch (error) {
      alert('Error eliminando imagen');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/rooms/${editingId}`, formData);
      } else {
        await api.post('/rooms', formData);
      }
      setIsDrawerOpen(false);
      setFormData({ roomNumber: '', roomTypeId: '', pricePerNight: '', status: 'disponible' });
      setEditingId(null);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error guardando habitación');
    }
  };

  const statusColors = {
    disponible: 'bg-emerald-100 text-emerald-800',
    ocupada: 'bg-rose-100 text-rose-800',
    limpieza: 'bg-amber-100 text-amber-800',
    mantenimiento: 'bg-slate-100 text-slate-800'
  };

  if (loading) return (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Habitaciones</h1>
          <p className="text-slate-500 mt-1">Configuración de cuartos y tarifas</p>
        </div>
        <button
          onClick={() => {
            setFormData({ roomNumber: '', roomTypeId: '', pricePerNight: '', status: 'disponible' });
            setEditingId(null);
            setIsDrawerOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" /> Nueva Habitación
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Número</th>
                <th className="px-6 py-4 font-medium">Tipo</th>
                <th className="px-6 py-4 font-medium">Precio/Noche</th>
                <th className="px-6 py-4 font-medium">Estado actual</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 font-medium text-slate-800">Habitación {room.roomNumber}</td>
                  <td className="px-6 py-4 text-slate-600">{room.roomType?.name}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">${parseFloat(room.pricePerNight).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-full uppercase tracking-wide ${statusColors[room.status]}`}>
                      {room.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => {
                        setEditingId(room.id);
                        setFormData({
                          roomNumber: room.roomNumber,
                          roomTypeId: room.roomTypeId,
                          pricePerNight: room.pricePerNight,
                          status: room.status,
                          images: room.images || []
                        });
                        setIsDrawerOpen(true);
                      }} 
                      className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition" title="Editar / Fotos">
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setEditingId(room.id);
                        setFormData({
                          roomNumber: room.roomNumber,
                          roomTypeId: room.roomTypeId,
                          pricePerNight: room.pricePerNight,
                          status: room.status,
                          images: room.images || []
                        });
                        setIsDrawerOpen(true);
                      }} 
                      className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition" title="Editar">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {/* Add delete room later if needed, but not requested now */}
                  </td>
                </tr>
              ))}
              {rooms.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No hay habitaciones configuradas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer isOpen={isDrawerOpen} onClose={closeDrawer} title={editingId ? 'Editar Habitación' : 'Nueva Habitación'}>
        <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Número de Habitación</label>
            <input required type="text"
              value={formData.roomNumber} onChange={e => setFormData({...formData, roomNumber: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Tipo de Habitación</label>
            <select required
              value={formData.roomTypeId} onChange={e => setFormData({...formData, roomTypeId: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">Seleccione un tipo</option>
              {roomTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {roomTypes.length === 0 && <p className="text-[10px] text-rose-500 mt-1 font-medium">Debe crear tipos de habitación en la API primero.</p>}
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Precio por Noche</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input required type="number" step="0.01"
                value={formData.pricePerNight} onChange={e => setFormData({...formData, pricePerNight: e.target.value})}
                className="w-full pl-7 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Estado Inicial</label>
            <select
              value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="disponible">Disponible</option>
              {/* Ocupada is usually handled via reservation, but left for manually fixing state */}
              <option value="ocupada">Ocupada</option>
              <option value="limpieza">Limpieza</option>
              <option value="mantenimiento">Mantenimiento</option>
            </select>
          </div>

          {editingId && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
               <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wide">Galería de Imágenes</label>
               
               <div className="grid grid-cols-3 gap-2 mb-4">
                  {formData.images && formData.images.map((img) => (
                    <div key={img.id} className="relative aspect-square group rounded-lg overflow-hidden border border-slate-200">
                      <img src={img.imageUrl.startsWith('http') ? img.imageUrl : `${window.location.protocol}//${window.location.host}${img.imageUrl}`} alt="Room" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => handleImageDelete(img.id)}
                        className="absolute inset-0 bg-rose-600/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg bg-white hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer transition text-slate-400 hover:text-emerald-600">
                    <Plus className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold">Subir</span>
                    <input type="file" multiple className="hidden" onChange={handleImageUpload} accept="image/*" />
                  </label>
               </div>
               <p className="text-[10px] text-slate-400">Máximo 5 fotos por habitación. Formatos: JPG, PNG.</p>
            </div>
          )}

          <div className="pt-6 mt-auto border-t border-slate-100 flex justify-end gap-3 pb-2">
            <button type="button" onClick={closeDrawer} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-sm">Guardar Habitación</button>
          </div>
        </form>
      </Drawer>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />
    </div>
  );
}
