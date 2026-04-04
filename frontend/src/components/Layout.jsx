import { useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Hotel, LayoutDashboard, Users, BedDouble, 
  CalendarCheck, PackageSearch, Receipt, LogOut, FileText, BarChart, Settings, X, User as UserIcon, Camera, Globe
} from 'lucide-react';
import api from '../services/api';

// Reusable Drawer
const Drawer = ({ isOpen, onClose, title, children, widthClass = "max-w-md" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className={`relative w-full ${widthClass} bg-white h-full shadow-2xl flex flex-col animate-[slideLeft_0.3s_ease-out]`}>
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
      <style>{`
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default function Layout() {
  const { user, logout, updateUser } = useAuth();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar ? `http://${window.location.hostname}:5000${user.avatar}` : null);
  const [isSaving, setIsSaving] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Clientes', href: '/customers', icon: Users },
    { name: 'Habitaciones', href: '/rooms', icon: BedDouble },
    { name: 'Reservas', href: '/reservations', icon: CalendarCheck },
    { name: 'Reservas Web', href: '/web-reservations', icon: Globe },
    { name: 'Inventario', href: '/inventory', icon: PackageSearch },
    { name: 'Ventas & Gastos', href: '/finance', icon: Receipt },
    { name: 'Reportes', href: '/reports', icon: BarChart },
  ];

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData();
      if (profileName) formData.append('name', profileName);
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await api.put('/auth/profile', formData);
      
      updateUser(res.data);
      setIsProfileOpen(false);
    } catch (error) {
      alert('Error al guardar el perfil');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-emerald-950 to-[#064e3b] text-white flex flex-col shadow-2xl shadow-emerald-900/20 sticky top-0 h-screen shrink-0 overflow-y-auto border-r border-emerald-800/50">
        <div className="h-24 flex flex-col justify-center px-6 border-b border-white/5 bg-black/10 backdrop-blur-sm">
          <div className="flex items-center">
            <Hotel className="h-7 w-7 text-amber-500 mr-2" />
            <span className="text-sm font-bold tracking-widest text-emerald-50 uppercase tracking-[0.2em]">JOYA AMAZÓNICA</span>
          </div>
          <div className="flex items-center gap-2 mt-1 px-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 status-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            </span>
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] font-sans drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]">SISTEMA ACTIVADO</span>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
                            (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-emerald-950 font-bold shadow-lg shadow-amber-500/20 translate-x-1'
                    : 'text-emerald-100/80 hover:bg-white/5 hover:text-white hover:translate-x-1'
                } group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300`}
              >
                <item.icon
                  className={`${
                    isActive ? 'text-emerald-950' : 'text-emerald-400/70 group-hover:text-amber-400'
                  } mr-3 flex-shrink-0 h-5 w-5 transition-colors`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        {/* User Profile Area */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div 
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center mb-4 p-3 hover:bg-white/10 rounded-2xl cursor-pointer transition-all duration-300 border border-transparent hover:border-white/10 group"
            title="Editar Mi Perfil"
          >
            {user.avatar ? (
              <img
                src={`http://${window.location.hostname}:5000${user.avatar}`}
                alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-emerald-700 shrink-0" 
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-900/50 flex items-center justify-center shrink-0 border border-emerald-700/50">
                <UserIcon className="w-5 h-5 text-emerald-400" />
              </div>
            )}
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user.name || 'Sin Nombre'}</p>
              <p className="text-xs font-medium text-emerald-200/70 truncate">{user.email}</p>
            </div>
            <Settings className="w-4 h-4 ml-auto text-emerald-200/50 group-hover:text-amber-400 transition-colors" />
          </div>

          <button
            onClick={logout}
            className="flex items-center justify-center w-full px-3 py-2.5 text-sm font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition-colors border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none mix-blend-multiply"></div>
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative z-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Profile Drawer */}
      <Drawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} title="Mi Perfil">
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
            <div className="relative group cursor-pointer inline-block">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center border-4 border-white shadow-md">
                  <UserIcon className="w-10 h-10 text-indigo-400" />
                </div>
              )}
              <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition cursor-pointer backdrop-blur-sm">
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">Cambiar</span>
              </label>
              <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center max-w-[200px]">Haz clic en la imagen para subir tu propia foto.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Mostrar</label>
            <input 
              type="text" 
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={profileName}
              onChange={e => setProfileName(e.target.value)}
              placeholder="Ej. Juan Pérez"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
             <input 
               type="text" 
               className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed outline-none"
               value={user.email}
               readOnly
               disabled
             />
             <p className="text-xs text-slate-400 mt-1">El email no puede ser modificado.</p>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
             <button type="button" onClick={() => setIsProfileOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition">Cancelar</button>
             <button type="submit" disabled={isSaving} className={`px-5 py-2.5 text-sm font-medium text-white rounded-xl transition shadow-sm ${isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
               {isSaving ? 'Guardando...' : 'Guardar Perfil'}
             </button>
          </div>
        </form>
      </Drawer>

    </div>
  );
}
