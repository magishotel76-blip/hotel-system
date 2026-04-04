import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Globe, CheckCircle, XCircle, ArrowRightCircle, Info, Phone, Mail, Building, Users, Calendar, Clock, Trash2 
} from 'lucide-react';

const WebReservationsAdmin = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/web-reservations/admin/requests');
      setRequests(data);
    } catch (error) {
      console.error('Error fetching web requests', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/web-reservations/admin/requests/${id}/status`, { status });
      fetchRequests();
      setIsDetailOpen(false);
    } catch (error) {
      alert('Error al actualizar el estado');
    }
  };

  const handleConvertToOfficial = async (id) => {
    if (!window.confirm('¿Deseas convertir esta solicitud en una RESERVA OFICIAL? Esto creará un cliente y ocupará la habitación.')) return;
    try {
      await api.post(`/web-reservations/admin/requests/${id}/convert`);
      alert('¡Convertida con éxito!');
      fetchRequests();
      setIsDetailOpen(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Error al convertir la reserva');
    }
  };

  const openDetail = (req) => {
    setSelectedRequest(req);
    setIsDetailOpen(true);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#064e3b]"></div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <Globe className="w-8 h-8 mr-3 text-[#064e3b]" />
            Solicitudes de Reservas Web
          </h1>
          <p className="text-slate-500 mt-1">Gestiona los requerimientos que llegan desde el portal público</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#064e3b] text-white text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Fecha Solicitud</th>
                <th className="px-6 py-4 font-bold">Responsable</th>
                <th className="px-6 py-4 font-bold">Habitación</th>
                <th className="px-6 py-4 font-bold">Fechas</th>
                <th className="px-6 py-4 font-bold">Estado</th>
                <th className="px-6 py-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length === 0 ? (
                <tr>
                   <td colSpan="6" className="px-6 py-12 text-center text-slate-400 italic">No hay solicitudes web registradas actualmente.</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                      {new Date(req.createdAt).toLocaleDateString()} <br/>
                      {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{req.responsibleName}</div>
                      <div className="text-xs text-slate-400">{req.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="font-medium text-indigo-600">Hab. {req.room.roomNumber}</span>
                       <div className="text-[10px] text-slate-400 uppercase font-bold">{req.room.roomType.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-medium text-slate-600 flex items-center">
                         <Calendar className="w-3 h-3 mr-1" /> {new Date(req.checkIn).toLocaleDateString()}
                      </div>
                      <div className="text-xs font-medium text-slate-400 flex items-center">
                         <Calendar className="w-3 h-3 mr-1" /> {new Date(req.checkOut).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                         req.status === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                         req.status === 'confirmada' ? 'bg-emerald-100 text-emerald-700' :
                         'bg-rose-100 text-rose-700'
                       }`}>
                         {req.status === 'pendiente' && <Clock className="w-3 h-3 mr-1" />}
                         {req.status === 'confirmada' && <CheckCircle className="w-3 h-3 mr-1" />}
                         {req.status === 'rechazada' && <XCircle className="w-3 h-3 mr-1" />}
                         {req.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                       <button onClick={() => openDetail(req)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Ver Detalles">
                          <Info className="w-5 h-5" />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail & Action Dialog (Drawer style mock or Modal) */}
      {isDetailOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex justify-end">
           <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsDetailOpen(false)}></div>
           <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-[slideLeft_0.3s_ease-out]">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#064e3b] text-white">
                <h3 className="text-lg font-bold uppercase tracking-wider">Detalle de Solicitud</h3>
                <button onClick={() => setIsDetailOpen(false)} className="p-2 text-white/50 hover:text-white transition">&times;</button>
              </div>
              
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Información del Cliente</h4>
                    <div className="space-y-3">
                       <div className="flex items-center">
                          <Users className="w-4 h-4 mr-3 text-slate-400" />
                          <div>
                            <p className="text-sm font-bold text-slate-800">{selectedRequest.responsibleName}</p>
                            <p className="text-xs text-slate-500">{selectedRequest.guestCount} personas</p>
                          </div>
                       </div>
                       <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-3 text-slate-400" />
                          <p className="text-sm text-slate-600">{selectedRequest.phone}</p>
                       </div>
                       <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-3 text-slate-400" />
                          <p className="text-sm text-slate-600">{selectedRequest.email || 'No proporcionado'}</p>
                       </div>
                       <div className="flex items-center">
                          <Building className="w-4 h-4 mr-3 text-slate-400" />
                          <p className="text-sm text-slate-600">{selectedRequest.company || 'Particular'}</p>
                       </div>
                    </div>
                 </div>

                 <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                    <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-3">Estadía Solicitada</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Check-In</p>
                          <p className="text-sm font-bold text-slate-800">{new Date(selectedRequest.checkIn).toLocaleDateString()}</p>
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Check-Out</p>
                          <p className="text-sm font-bold text-slate-800">{new Date(selectedRequest.checkOut).toLocaleDateString()}</p>
                       </div>
                       <div className="col-span-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Habitación</p>
                          <p className="text-sm font-bold text-indigo-700">Habitación {selectedRequest.room.roomNumber} ({selectedRequest.room.roomType.name})</p>
                       </div>
                    </div>
                 </div>

                 {selectedRequest.notes && (
                   <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Observaciones</h4>
                      <div className="p-3 bg-white border border-slate-200 rounded-xl text-sm italic text-slate-600 drop-shadow-sm">
                         "{selectedRequest.notes}"
                      </div>
                   </div>
                 )}

                 <div className="pt-6 border-t border-slate-100 space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-4">Acciones Administrativas</h4>
                    
                    {selectedRequest.status === 'pendiente' && (
                      <button 
                        onClick={() => handleConvertToOfficial(selectedRequest.id)}
                        className="w-full flex items-center justify-center p-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20"
                      >
                         <ArrowRightCircle className="w-5 h-5 mr-2" />
                         Confirmar y Convertir a Reserva
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                       <button 
                         onClick={() => handleStatusUpdate(selectedRequest.id, 'rechazada')}
                         className="flex items-center justify-center py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-bold hover:bg-rose-100 transition"
                       >
                          <XCircle className="w-5 h-5 mr-2" />
                          Rechazar
                       </button>
                       <button 
                         onClick={() => handleStatusUpdate(selectedRequest.id, 'pendiente')}
                         className="flex items-center justify-center py-3 bg-slate-50 text-slate-600 border border-slate-100 rounded-xl font-bold hover:bg-slate-100 transition"
                       >
                          <Clock className="w-5 h-5 mr-2" />
                          Pendiente
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />
    </div>
  );
};

export default WebReservationsAdmin;
