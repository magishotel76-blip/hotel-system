import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Building, User, FileText } from 'lucide-react';

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

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({ 
    clientType: 'NATURAL', 
    name: '', 
    document: '', 
    email: '', 
    phone: '', 
    address: '',
    proforma: '',
    customRoomPrice: '',
    customBreakfastPrice: '',
    customLunchPrice: '',
    customSnackPrice: '',
    customDinnerPrice: '',
    companyId: '',
    companyIndividualPrice: '',
    companySharedPrice: ''
  });
  
  const [editingId, setEditingId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const closeDrawer = () => setIsDrawerOpen(false);

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/customers/${editingId}`, formData);
      } else {
        await api.post('/customers', formData);
      }
      setFormData({ 
        clientType: 'NATURAL', name: '', document: '', email: '', phone: '', address: '', proforma: '',
        customRoomPrice: '', customBreakfastPrice: '', customLunchPrice: '', customSnackPrice: '', customDinnerPrice: '',
        companyId: '', companyIndividualPrice: '', companySharedPrice: ''
      });
      setEditingId(null);
      fetchCustomers();
    } catch (error) {
      alert(error.response?.data?.message || 'Error guardando cliente');
    }
  };

  const handleEdit = (customer) => {
    setFormData({
      clientType: customer.clientType || 'NATURAL',
      name: customer.name,
      document: customer.document,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      proforma: customer.proforma || '',
      customRoomPrice: customer.customRoomPrice || '',
      customBreakfastPrice: customer.customBreakfastPrice || '',
      customLunchPrice: customer.customLunchPrice || '',
      customSnackPrice: customer.customSnackPrice || '',
      customDinnerPrice: customer.customDinnerPrice || '',
      companyId: customer.companyId || '',
      companyIndividualPrice: customer.companyIndividualPrice || '',
      companySharedPrice: customer.companySharedPrice || ''
    });
    setEditingId(customer.id);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      try {
        await api.delete(`/customers/${id}`);
        fetchCustomers();
      } catch (error) {
        alert(error.response?.data?.message || 'Error eliminando cliente');
      }
    }
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
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Clientes (CRM)</h1>
          <p className="text-slate-500 mt-1">Huéspedes naturales y convenios corporativos</p>
        </div>
        <button
          onClick={() => {
            setFormData({ 
              clientType: 'NATURAL', name: '', document: '', email: '', phone: '', address: '', proforma: '',
              customRoomPrice: '', customBreakfastPrice: '', customLunchPrice: '', customSnackPrice: '', customDinnerPrice: '',
              companyId: '', companyIndividualPrice: '', companySharedPrice: ''
            });
            setEditingId(null);
            setIsDrawerOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" /> Nuevo Cliente
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Tipo</th>
                <th className="px-6 py-4 font-medium">Nombre / Empresa</th>
                <th className="px-6 py-4 font-medium">Cédula / RUC</th>
                <th className="px-6 py-4 font-medium">Contacto</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4">
                    {c.clientType === 'EMPRESA' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                        <Building className="w-3 h-3 mr-1" /> Empresa
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        <User className="w-3 h-3 mr-1" /> Natural
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">
                    <span onClick={() => handleEdit(c)} className="cursor-pointer hover:text-emerald-600 transition">{c.name}</span>
                    {c.company && (
                      <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 mt-1 inline-flex items-center">
                        <Building className="w-2.5 h-2.5 mr-1" /> {c.company.name}
                      </div>
                    )}
                    {c.proforma && <div className="text-xs text-slate-400 font-normal flex items-center mt-1"><FileText className="w-3 h-3 mr-1"/> Tiene Proforma</div>}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-600">{c.document}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-800">{c.email || '-'}</div>
                    <div className="text-sm text-slate-500">{c.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleEdit(c)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition" title="Editar">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No hay clientes registrados en el sistema</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWER CRUD */}
      <Drawer isOpen={isDrawerOpen} onClose={closeDrawer} title={editingId ? 'Editar Cliente' : 'Nuevo Cliente / Empresa'}>
        <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-5">
          
          <div className="flex p-1 bg-slate-100 rounded-xl mb-2 shrink-0 border border-slate-200">
            <button
              type="button"
              onClick={() => setFormData({...formData, clientType: 'NATURAL'})}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                formData.clientType === 'NATURAL' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Persona Natural
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, clientType: 'EMPRESA'})}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                formData.clientType === 'EMPRESA' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Empresa
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
              {formData.clientType === 'EMPRESA' ? 'Razón Social' : 'Nombres y Apellidos'}
            </label>
            <input required type="text" 
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
              {formData.clientType === 'EMPRESA' ? 'RUC' : 'Cédula / Pasaporte'}
            </label>
            <input required type="text"
              value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          {formData.clientType === 'NATURAL' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">¿Pertenece a una Empresa? (Opcional)</label>
              <select 
                value={formData.companyId} onChange={e => setFormData({...formData, companyId: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Cliente Particular (Ninguna)</option>
                {customers.filter(c => c.clientType === 'EMPRESA').map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email"
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Teléfono</label>
              <input type="text"
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Dirección Física</label>
            <input type="text"
              value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          {formData.clientType === 'EMPRESA' && (
            <div className="shrink-0">
              <label className="block text-xs font-bold text-indigo-600 mb-1.5 uppercase tracking-wide">Notas Internas / Proforma</label>
              <textarea rows="2"
                value={formData.proforma} onChange={e => setFormData({...formData, proforma: e.target.value})}
                placeholder="Detalles adicionales del convenio..."
                className="w-full p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-indigo-900 resize-none" 
              />
            </div>
          )}

          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-4 shrink-0">
            <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center">
              <Plus className="w-3 h-3 mr-1" /> Tarifas Especiales (Opcional)
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase">Hospedaje (Precio General)</label>
                <input type="number" step="0.01" value={formData.customRoomPrice} onChange={e => setFormData({...formData, customRoomPrice: e.target.value})}
                  placeholder="Precio normal" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              
              {formData.clientType === 'EMPRESA' && (
                <>
                  <div>
                    <label className="block text-[9px] font-bold text-indigo-600 mb-1 uppercase">Precio Individual</label>
                    <input type="number" step="0.01" value={formData.companyIndividualPrice} onChange={e => setFormData({...formData, companyIndividualPrice: e.target.value})}
                      className="w-full p-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-indigo-600 mb-1 uppercase">Precio Compartido</label>
                    <input type="number" step="0.01" value={formData.companySharedPrice} onChange={e => setFormData({...formData, companySharedPrice: e.target.value})}
                      className="w-full p-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </>
              )}

              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase">Desayuno</label>
                <input type="number" step="0.01" value={formData.customBreakfastPrice} onChange={e => setFormData({...formData, customBreakfastPrice: e.target.value})}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase">Almuerzo</label>
                <input type="number" step="0.01" value={formData.customLunchPrice} onChange={e => setFormData({...formData, customLunchPrice: e.target.value})}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase">Merienda</label>
                <input type="number" step="0.01" value={formData.customSnackPrice} onChange={e => setFormData({...formData, customSnackPrice: e.target.value})}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase">Cena</label>
                <input type="number" step="0.01" value={formData.customDinnerPrice} onChange={e => setFormData({...formData, customDinnerPrice: e.target.value})}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <p className="text-[9px] text-emerald-600/70 italic font-medium mt-1">* Si se dejan vacíos, se usarán los precios estándar.</p>
          </div>

          <div className="pt-6 mt-auto border-t border-slate-100 flex justify-end gap-3 pb-2">
            <button type="button" onClick={closeDrawer} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-sm">Guardar Datos</button>
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
