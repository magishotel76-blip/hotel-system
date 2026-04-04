import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Hotel, Users, Calendar, Phone, Mail, Building, FileText, X, CheckCircle, ChevronLeft, ChevronRight 
} from 'lucide-react';

const PublicReservations = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Lightbox state
  const [lightbox, setLightbox] = useState({ isOpen: false, images: [], activeIndex: 0 });
  
  const [formData, setFormData] = useState({
    responsibleName: '',
    guestCount: 1,
    company: '',
    phone: '',
    email: '',
    checkIn: '',
    checkOut: '',
    notes: ''
  });

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { data } = await api.get('/web-reservations/public/rooms');
        setRooms(data);
      } catch (error) {
        console.error('Error fetching rooms', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const handleReserveClick = (room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const openLightbox = (images, index = 0) => {
    setLightbox({ isOpen: true, images, activeIndex: index });
  };

  const closeLightbox = () => {
    setLightbox({ ...lightbox, isOpen: false });
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setLightbox(prev => ({
      ...prev,
      activeIndex: (prev.activeIndex + 1) % prev.images.length
    }));
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setLightbox(prev => ({
      ...prev,
      activeIndex: (prev.activeIndex - 1 + prev.images.length) % prev.images.length
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/web-reservations/public/reserve', {
        ...formData,
        roomId: selectedRoom.id
      });
      setSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(false);
        setFormData({
          responsibleName: '',
          guestCount: 1,
          company: '',
          phone: '',
          email: '',
          checkIn: '',
          checkOut: '',
          notes: ''
        });
      }, 3000);
    } catch (error) {
      alert('Error al enviar la solicitud. Por favor intenta de nuevo.');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#064e3b]"></div>
      <p className="mt-4 text-[#064e3b] font-medium">Cargando habitaciones...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-[#064e3b] text-white py-8 px-6 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="h-20 w-20 bg-emerald-950 rounded-full flex items-center justify-center mb-4 border-2 border-amber-500 shadow-xl">
             <Hotel className="h-10 w-10 text-amber-500" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-widest uppercase">HOTEL JOYA AMAZÓNICA</h1>
          <p className="text-amber-500 font-serif text-xl tracking-[0.3em] uppercase mt-1">Cajoyam</p>
          <div className="w-24 h-1 bg-amber-500 mt-6 rounded-full"></div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-6 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#064e3b] mb-4">Solicita tu Reserva</h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Explora nuestras habitaciones disponibles y envía una solicitud de reserva. 
            Nuestro equipo te contactará para confirmar tu estadía.
          </p>
        </div>
      </section>

      {/* Rooms Grid */}
      <main className="max-w-7xl mx-auto py-12 px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200 flex flex-col hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
              {/* Image Slider Mockup */}
              <div className="relative h-48 bg-slate-200 overflow-hidden">
                {room.images && room.images.length > 0 ? (
                  <img 
                    src={`http://${window.location.hostname}:5000${room.images[0]}`} 
                    alt={`Habitación ${room.roomNumber}`} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 cursor-pointer"
                    onClick={() => openLightbox(room.images, 0)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                    <Hotel className="w-12 h-12 mb-2 opacity-20" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Sin imagen</span>
                  </div>
                )}
                {room.images && room.images.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full font-bold">
                    1 / {room.images.length}
                  </div>
                )}
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                   <h3 className="text-xl font-bold text-[#064e3b]">Hab. {room.roomNumber}</h3>
                   <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${room.roomType === 'compartida' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                     {room.roomType}
                   </span>
                </div>
                
                <p className="text-sm text-slate-500 mb-6 line-clamp-2">
                  Habitación {room.roomType === 'compartida' ? 'amplia para grupos o familias' : 'privada y confortable'} con todas las comodidades.
                </p>
                
                <button 
                  onClick={() => handleReserveClick(room)}
                  className="mt-auto w-full py-3 bg-[#064e3b] text-white font-bold rounded-xl hover:bg-emerald-900 transition-colors shadow-md hover:shadow-emerald-900/20"
                >
                  RESERVAR
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-6">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
            <div>
               <h3 className="text-xl font-bold text-[#064e3b]">HOTEL JOYA AMAZÓNICA</h3>
               <p className="text-slate-500 text-sm mt-1">Sacha - Ecuador</p>
            </div>
            <div className="flex flex-col md:flex-row gap-6 text-sm">
               <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
                  <p className="text-[#064e3b] font-bold">Jefferson Haro</p>
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Supervisor</p>
                  <p className="font-mono text-emerald-700">0997526477</p>
               </div>
               <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
                  <p className="text-[#064e3b] font-bold">Jorge Cajilema</p>
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Gerente</p>
                  <p className="font-mono text-emerald-700">0996307475</p>
               </div>
            </div>
            <div className="text-sm text-slate-400">
               © 2026 Cajoyam. Todos los derechos reservados.
            </div>
         </div>
      </footer>

      {/* Reservation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#064e3b]/80 backdrop-blur-sm" onClick={() => !success && setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-[scaleIn_0.3s_ease-out]">
            {success ? (
              <div className="p-12 text-center animate-fade-in">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                   <CheckCircle className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-black text-[#064e3b] mb-2 uppercase">¡Solicitud Enviada!</h2>
                <p className="text-slate-600">Hemos recibido tu requerimiento. Nuestro equipo te contactará pronto al número proporcionado.</p>
              </div>
            ) : (
              <>
                <div className="bg-[#064e3b] text-white px-8 py-6 flex justify-between items-center border-b border-white/10">
                   <div>
                     <h3 className="text-xl font-bold uppercase tracking-wider">Solicitar Habitación {selectedRoom?.roomNumber}</h3>
                     <p className="text-amber-500 text-xs font-medium uppercase tracking-[0.2em]">{selectedRoom?.roomType}</p>
                   </div>
                   <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition">
                     <X className="w-6 h-6" />
                   </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[70vh]">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Nombre Completo del Responsable</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input required type="text" value={formData.responsibleName} onChange={e => setFormData({...formData, responsibleName: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#064e3b] outline-none transition" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Nº de Personas</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input required type="number" min="1" value={formData.guestCount} onChange={e => setFormData({...formData, guestCount: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#064e3b] outline-none transition" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Empresa (Opcional)</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#064e3b] outline-none transition" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Teléfono / WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#064e3b] outline-none transition" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Email (Opcional)</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#064e3b] outline-none transition" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Fecha de Ingreso</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input required type="date" value={formData.checkIn} onChange={e => setFormData({...formData, checkIn: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#064e3b] outline-none transition" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Fecha de Salida</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input required type="date" value={formData.checkOut} onChange={e => setFormData({...formData, checkOut: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#064e3b] outline-none transition" />
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Observaciones Extras</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <textarea rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#064e3b] outline-none transition resize-none" placeholder="¿Algún requerimiento especial?"></textarea>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 pt-4">
                    <button type="submit" className="w-full py-4 bg-[#064e3b] text-amber-500 text-lg font-black rounded-2xl shadow-xl hover:bg-emerald-900 transition-all duration-300 transform hover:scale-[1.02] shadow-emerald-900/40">
                      ENVIAR SOLICITUD DE RESERVA
                    </button>
                    <p className="text-center text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">Al presionar confirmas que los datos son correctos</p>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Lightbox / Gallery Viewer */}
      {lightbox.isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 animate-fade-in group/light">
          <button 
            onClick={closeLightbox}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition z-50 bg-black/20"
          >
            <X className="w-8 h-8" />
          </button>
          
          <div className="relative w-full max-w-5xl aspect-[4/3] flex items-center justify-center">
            {lightbox.images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-3 hover:bg-white/10 rounded-full transition z-50 bg-black/20"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-3 hover:bg-white/10 rounded-full transition z-50 bg-black/20"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
            
            <img 
              src={`http://${window.location.hostname}:5000${lightbox.images[lightbox.activeIndex]}`}
              alt="Full view"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scale-up"
            />
          </div>

          <div className="mt-8 flex gap-2 overflow-x-auto p-2 max-w-full no-scrollbar">
            {lightbox.images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setLightbox(prev => ({ ...prev, activeIndex: idx }))}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${lightbox.activeIndex === idx ? 'border-amber-500 scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
              >
                <img src={`http://${window.location.hostname}:5000${img}`} className="w-full h-full object-cover" alt="thumbnail" />
              </button>
            ))}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes scale-up {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-up {
          animation: scale-up 0.3s ease-out forwards;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
};

export default PublicReservations;
