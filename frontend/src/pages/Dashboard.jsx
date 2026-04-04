import { useState, useEffect } from 'react';
import { startOfMonth } from 'date-fns';
import api from '../services/api';
import { 
  BedDouble, DollarSign, CalendarClock, AlertTriangle, CheckCircle, Clock, Wrench, X, User as UserIcon, TrendingUp, Wallet,
  ChevronLeft, ChevronRight, Image as ImageIcon, Plus, Trash2, Search, Utensils, Landmark, ShoppingCart, Minus, Banknote, Building, Bed
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Simple Drawer Component for Dashboard
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

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Drawer state
  const [activeDrawer, setActiveDrawer] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showFoodSaleForm, setShowFoodSaleForm] = useState(false);
  const [activeFoodDrawer, setActiveFoodDrawer] = useState(false);
  const [activeExternalDrawer, setActiveExternalDrawer] = useState(false);
  const [isStatementDrawerOpen, setIsStatementDrawerOpen] = useState(false);
  const [statementData, setStatementData] = useState(null);
  const [statementFilter, setStatementFilter] = useState({
    customerId: '',
    startDate: startOfMonth(new Date()).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [lightbox, setLightbox] = useState({ isOpen: false, images: [], activeIndex: 0 });
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const [foodForm, setFoodForm] = useState({
    productId: '',
    quantity: 1,
    paymentMethod: '',
    transferReference: '',
    price: '',
    roomId: '',
    customerId: '',
    notes: ''
  });
  const [showSurchargeForm, setShowSurchargeForm] = useState(false);
  const [surchargeForm, setSurchargeForm] = useState({
    amount: '',
    description: '',
    paymentMethod: '',
    transferReference: ''
  });
  const [checkoutForm, setCheckoutForm] = useState({
    nights: 1,
    pricePerNight: 0,
    paymentMethod: '',
    transferReference: ''
  });
  const [externalForm, setExternalForm] = useState({
    customerId: '',
    paymentMethod: '',
    transferReference: '',
    notes: 'Venta Directa Externa'
  });
  const [externalCart, setExternalCart] = useState([]);
  const [externalSearch, setExternalSearch] = useState('');
  const [externalSearchResults, setExternalSearchResults] = useState([]);

  useEffect(() => {
    if (!externalSearch) {
      setExternalSearchResults([]);
      return;
    }
    const lower = externalSearch.toLowerCase();
    setExternalSearchResults(products.filter(p => 
      p.isSellable && 
      p.category?.toUpperCase() !== 'COMIDA' && 
      (p.name.toLowerCase().includes(lower) || (p.barcode && p.barcode.includes(lower)))
    ));
  }, [externalSearch, products]);

  const addExternalItem = (product) => {
    const existing = externalCart.find(i => i.product.id === product.id);
    if (existing) {
      setExternalCart(externalCart.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setExternalCart([...externalCart, { product, quantity: 1, price: getEffectivePrice(externalForm.customerId, product) }]);
    }
    setExternalSearch('');
  };

  const removeExternalItem = (productId) => {
    setExternalCart(externalCart.filter(i => i.product.id !== productId));
  };

  const updateExternalItemQuantity = (productId, delta) => {
    setExternalCart(externalCart.map(i => {
      if (i.product.id === productId) {
        return { ...i, quantity: Math.max(1, i.quantity + delta) };
      }
      return i;
    }));
  };
  const [roomForm, setRoomForm] = useState({
    status: 'disponible',
    isNewCustomer: false,
    customerId: '',
    // New customer fields
    newName: '',
    newDocument: '',
    newPhone: '',
    newEmail: '',
    newClientType: 'NATURAL',
    newCompanyId: '',
    // Reservation fields
    guestsCount: 1,
    guestNames: '',
    roomPrice: 0
  });

  const [filterStatus, setFilterStatus] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(null); // 'income', 'cash', 'inventory'
  const [settleForm, setSettleForm] = useState({ finalAmount: 0, paymentMethod: 'office' });
  const [isSettling, setIsSettling] = useState(false);
  const [roomError, setRoomError] = useState('');
  const [foodError, setFoodError] = useState('');
  const [externalError, setExternalError] = useState('');


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
      
      // Save session
      localStorage.setItem(SESSION_KEY, JSON.stringify({ password: pwd, timestamp: Date.now() }));
      
      fetchData();
      alert('Registro eliminado correctamente');
    } catch (error) {
      alert(error.response?.data?.message || 'Error al eliminar. Verifique la contraseña.');
    }
  };

  const fetchData = async () => {
    try {
      const [metricsRes, roomsRes, custRes, productsRes] = await Promise.all([
        api.get('/dashboard/metrics'),
        api.get('/rooms'),
        api.get('/customers'),
        api.get('/inventory/products')
      ]);
      setMetrics(metricsRes.data);
      const sortedRooms = roomsRes.data.sort((a, b) => parseInt(a.roomNumber) - parseInt(b.roomNumber));
      setRooms(sortedRooms);
      setCustomers(custRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openRoomDrawer = (room) => {
    setSelectedRoom(room);
    
    let nights = 1;
    let basePrice = room.pricePerNight;
    const activeRes = room?.reservations?.find(r => r.status === 'activa');
    if (activeRes) {
      const checkIn = new Date(activeRes.checkInDate);
      const now = new Date();
      
      // Calculate calendar days difference (Midnight rule)
      const d1 = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate());
      const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      
      nights = diffDays < 1 ? 1 : diffDays;
      basePrice = activeRes.totalPrice || room.pricePerNight;
    }

    setRoomForm({
      status: room.status,
      customerId: '',
      guestsCount: 1,
      guestNames: '',
      roomPrice: room.pricePerNight
    });
    setCheckoutForm({
      nights: nights,
      pricePerNight: basePrice,
      paymentMethod: '',
      transferReference: ''
    });
    setRoomError('');
    setActiveDrawer(true);
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('¿Eliminar este consumo?')) return;
    try {
      await api.delete(`/inventory/transactions/${id}`);
      fetchData(); // Refresh to update room totals
      // Also update selectedRoom locally if drawer is open
      const res = await api.get(`/rooms/${selectedRoom.id}`);
      setSelectedRoom(res.data);
    } catch (error) {
      alert('Error al eliminar consumo');
    }
  };

  const handleRoomUpdate = async (e) => {
    e.preventDefault();
    try {
      let finalCustomerId = roomForm.customerId;

      // Handle Quick Customer Creation
      if (roomForm.status === 'ocupada' && roomForm.isNewCustomer) {
        const custRes = await api.post('/customers', {
          name: roomForm.newName,
          document: roomForm.newDocument,
          phone: roomForm.newPhone,
          email: roomForm.newEmail,
          clientType: roomForm.newClientType,
          companyId: roomForm.newCompanyId || undefined
        });
        finalCustomerId = custRes.data.id;
      }

      if (roomForm.status === 'ocupada' && finalCustomerId) {
        // Automatically create a reservation (checking in)
        const checkInDate = new Date();
        const checkOutDate = new Date(Date.now() + 86400000); // Tomorrow
        await api.post('/reservations', {
          customerId: finalCustomerId,
          roomId: selectedRoom.id,
          checkInDate: checkInDate.toISOString(),
          checkOutDate: checkOutDate.toISOString(),
          totalPrice: parseFloat(roomForm.roomPrice),
          guestsCount: roomForm.guestsCount,
          guestNames: roomForm.guestNames
        });
        alert('Reserva creada y habitación marcada como ocupada.');
      } else if ((roomForm.status === 'disponible' || roomForm.status === 'limpieza') && selectedRoom.status === 'ocupada') {
        // Check-out logic
        await api.post(`/rooms/${selectedRoom.id}/checkout`, {
          status: roomForm.status,
          nights: checkoutForm.nights,
          pricePerNight: checkoutForm.pricePerNight,
          paymentMethod: checkoutForm.paymentMethod,
          transferReference: checkoutForm.transferReference
        });
        alert('Checkout completado con éxito.');
      } else {
        // Just update room status
        await api.put(`/rooms/${selectedRoom.id}`, {
          status: roomForm.status
        });
      }
      setActiveDrawer(false);
      fetchData(); // Refresh all
    } catch (error) {
      setRoomError(error.response?.data?.message || 'Error actualizando habitación');
    }
  };

  const handleFoodSale = async (e) => {
    e.preventDefault();
    try {
      const activeRes = selectedRoom?.reservations?.find(r => r.status === 'activa');
      await api.post('/inventory/food-sale', {
        ...foodForm,
        roomId: selectedRoom?.id || foodForm.roomId || undefined,
        reservationId: activeRes?.id,
        customerId: activeRes?.customerId || foodForm.customerId || undefined
      });
      setFoodForm({ productId: '', quantity: 1, paymentMethod: '', transferReference: '', price: '', roomId: '', customerId: '', notes: '' });
      setFoodError('');
      setShowFoodSaleForm(false);
      setActiveFoodDrawer(false);
      fetchData();
    } catch (error) {
      setFoodError(error.response?.data?.message || error.message);
    }
  };

  const handleSurcharge = async (e) => {
    e.preventDefault();
    try {
      if (!surchargeForm.amount || !surchargeForm.description) return setRoomError('Completa todos los campos del recargo.');
      const surchargeProduct = products.find(p => p.name === 'Recargo Alojamiento');
      if (!surchargeProduct) return setRoomError('No se encontró el producto de recargo en el sistema.');
      const activeRes = selectedRoom?.reservations?.find(r => r.status === 'activa');
      await api.post('/inventory/food-sale', {
        productId: surchargeProduct.id,
        quantity: 1,
        price: surchargeForm.amount,
        paymentMethod: surchargeForm.paymentMethod,
        transferReference: surchargeForm.transferReference,
        notes: `Recargo - ${surchargeForm.description}`,
        roomId: selectedRoom.id,
        reservationId: activeRes?.id,
        customerId: activeRes?.customerId
      });
      setSurchargeForm({ amount: '', description: '', paymentMethod: '', transferReference: '' });
      setRoomError('');
      setShowSurchargeForm(false);
      fetchData();
    } catch (error) {
      setRoomError(error.response?.data?.message || 'Error al registrar recargo');
    }
  };

  const getEffectivePrice = (customerId, product) => {
    if (!product) return 0;
    const customer = customers.find(c => c.id === customerId);

    if (customer) {
      // Map meal names to customer custom price fields
      const mealMap = {
        'Desayuno': customer.customBreakfastPrice,
        'Almuerzo': customer.customLunchPrice,
        'Merienda': customer.customSnackPrice,
        'Cena': customer.customDinnerPrice
      };

      const customPrice = mealMap[product.name];
      if (customPrice !== null && customPrice !== undefined && customPrice !== '') {
        return parseFloat(customPrice);
      }
    }

    return product?.salePrice || 0;
  };

  const handleExternalSale = async (e) => {
    e.preventDefault();
    if (externalCart.length === 0) return setExternalError('Debes agregar al menos un producto a la venta.');
    try {
      await api.post('/inventory/food-sale', {
        type: 'salida',
        exitType: 'venta',
        customerId: externalForm.customerId,
        notes: externalForm.notes,
        paymentMethod: externalForm.paymentMethod,
        transferReference: externalForm.transferReference,
        items: externalCart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.price
        }))
      });
      // alert('Venta Múltiple Registrada');
      setExternalCart([]);
      setActiveExternalDrawer(false);
      setExternalError('');
      setExternalSearch('');
      setExternalForm({ ...externalForm, customerId: '', paymentMethod: '', transferReference: '', notes: 'Venta Directa Externa' });
      fetchData();
    } catch (error) {
      console.error('Error external sale:', error);
      setExternalError(error.response?.data?.message || 'Error al registrar venta');
    }
  };

  const closeDrawer = () => {
    setIsStatementDrawerOpen(false);
    setStatementData(null);
    setSettleForm({
      finalAmount: '',
      paymentMethod: 'office',
      notes: ''
    });
  };

  const fetchStatement = async () => {
    if (!statementFilter.customerId) return;
    try {
      const { data } = await api.get('/reports/customer-statement', { params: statementFilter });
      setStatementData(data);
      // Pre-fill settle form with current total
      setSettleForm(prev => ({ ...prev, finalAmount: data.summary.totalAmount }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleSettle = async () => {
    if (!statementData || !statementData.transactions.length) return;
    if (!settleForm.finalAmount || isNaN(settleForm.finalAmount)) return alert('Ingrese un monto válido');

    try {
      setIsSettling(true);
      await api.post('/reports/customer-statement/settle', {
        customerId: statementFilter.customerId,
        transactionIds: statementData.transactions.map(t => t.id),
        finalAmount: settleForm.finalAmount,
        paymentMethod: settleForm.paymentMethod,
        notes: settleForm.notes
      });
      alert('¡Consumos liquidados y factura generada con éxito! El saldo del cliente ha sido reiniciado.');
      setStatementData(null);
      fetchData(); // Use fetchData to refresh all data
      closeDrawer();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al liquidar');
    } finally {
      setIsSettling(false);
    }
  };

  const openLightbox = (images, index = 0) => {
    setLightbox({ isOpen: true, images: images.map(img => img.imageUrl || img), activeIndex: index });
  };

  const closeLightbox = () => {
    setLightbox({ ...lightbox, isOpen: false });
  };

  const nextImage = () => {
    setLightbox(prev => ({
      ...prev,
      activeIndex: (prev.activeIndex + 1) % prev.images.length
    }));
  };

  const prevImage = () => {
    setLightbox(prev => ({
      ...prev,
      activeIndex: (prev.activeIndex - 1 + prev.images.length) % prev.images.length
    }));
  };

  if (loading) return (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  );

  const statCards = [
    { id: 'occupancy', name: 'Ocupación Hoy', value: `${metrics?.occupancyRate}%`, icon: BedDouble, color: 'text-amber-600', bg: 'bg-amber-50', interactive: true },
    { id: 'active_reservations', name: 'Reservas Activas', value: metrics?.activeReservationsCount, icon: CalendarClock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'projected', name: 'Ingreso Tentativo Diario', value: `$${metrics?.tentativeRevenue?.toLocaleString()}`, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50', interactive: true },
    { id: 'cash', name: 'Efectivo en Caja', value: `$${metrics?.cashInHotel?.toLocaleString()}`, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', interactive: true },
    { id: 'food_today', name: 'Ventas Comida (Hoy)', value: `$${metrics?.foodRevenueToday?.toFixed(2)}`, icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-50', interactive: true },
    { id: 'pending_office', name: 'Cuentas por Cobrar', value: `$${metrics?.totalPendingOffice?.toFixed(2)}`, icon: Landmark, color: 'text-blue-600', bg: 'bg-blue-50', interactive: true },
    { id: 'inventory', name: 'Alertas Inventario', value: metrics?.lowStockProducts, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', interactive: true },
  ];

  const handleCardClick = (id) => {
    if (id === 'occupancy') {
      setFilterStatus(filterStatus === 'ocupada' ? null : 'ocupada');
      // Scroll to rooms grid
      document.getElementById('rooms-grid')?.scrollIntoView({ behavior: 'smooth' });
    } else if (['income', 'cash', 'inventory', 'pending_office', 'food_today', 'projected'].includes(id)) {
       if (id === 'food_today') {
          setShowDetailModal(id);
       } else {
          setShowDetailModal(id);
       }
    }
  };

  const getRoomColorStyles = (status) => {
    switch (status) {
      case 'disponible': return 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100';
      case 'ocupada': return 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100';
      case 'limpieza': return 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100';
      case 'mantenimiento': return 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200';
      default: return 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100';
    }
  };

  const getRoomIcon = (status) => {
    switch (status) {
      case 'disponible': return <CheckCircle className="w-5 h-5 mx-auto mb-2 text-emerald-500" />;
      case 'ocupada': return <BedDouble className="w-5 h-5 mx-auto mb-2 text-rose-500" />;
      case 'limpieza': return <Clock className="w-5 h-5 mx-auto mb-2 text-amber-500" />;
      case 'mantenimiento': return <Wrench className="w-5 h-5 mx-auto mb-2 text-slate-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center glass-panel p-6 sm:p-8 rounded-3xl mb-8 gap-6 animate-slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 w-full lg:w-auto">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Panel Principal</h1>
            <p className="text-slate-500 font-medium mt-1">Gestión interactiva del hotel</p>
          </div>
          <div className="hidden sm:block h-12 w-px bg-slate-200"></div>
          <div className="bg-slate-50/80 px-5 py-3 rounded-2xl border border-slate-200/50 flex flex-col justify-center gap-0.5 shadow-inner">
             <span className="text-2xl font-mono font-black text-emerald-900">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
             <span className="text-[10px] font-black text-emerald-600/70 uppercase tracking-[0.2em]">
                {now.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
             </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <button 
            onClick={() => setActiveFoodDrawer(true)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-bold hover:from-orange-400 hover:to-amber-400 transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:scale-95"
          >
            <Utensils className="w-5 h-5" /> Venta Comida
          </button>
          <button 
            onClick={() => setActiveExternalDrawer(true)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-2xl font-bold hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:scale-95"
          >
            <Plus className="w-5 h-5" /> Venta Directa
          </button>
          <button 
            onClick={() => setIsStatementDrawerOpen(true)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-emerald-900 border-2 border-emerald-100 rounded-2xl font-bold hover:border-emerald-500 hover:bg-emerald-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95"
          >
            <CalendarClock className="w-5 h-5" /> Consumos
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {statCards.map((item) => (
          <div 
            key={item.name} 
            onClick={() => item.interactive && handleCardClick(item.id)}
            className={`glass-panel p-6 rounded-[24px] ${item.interactive ? 'cursor-pointer hover:border-emerald-300 hover:shadow-2xl hover:-translate-y-1' : 'border-white/40'} transition-all duration-300 relative group overflow-hidden`}
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-white/40 to-transparent rounded-full pointer-events-none blur-2xl group-hover:bg-white/60 transition-all"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-sm font-bold text-slate-500 mb-1">{item.name}</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">{item.value}</h3>
              </div>
              <div className={`p-3.5 rounded-2xl ${item.bg} shadow-sm border border-white/50 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
            </div>
            {item.interactive && (
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-wider backdrop-blur-md">Ver Detalle</div>
              </div>
            )}
            {item.id === 'occupancy' && filterStatus === 'ocupada' && (
              <div className="mt-3 inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-100/80 p-1.5 px-2.5 rounded-xl border border-amber-200/50 shadow-sm backdrop-blur-md">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Filtrando Ocupadas
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Metric Detail Modals (Secondary Drawers) */}
      <Drawer isOpen={!!showDetailModal} onClose={() => setShowDetailModal(null)} title={`Detalle: ${statCards.find(c => c.id === showDetailModal)?.name}`} widthClass="max-w-xl">
         {showDetailModal === 'income' && (
           <div className="space-y-4">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 mb-6">
                <p className="text-xs font-bold text-emerald-700 uppercase mb-1">Total Cobrado Hoy</p>
                <h4 className="text-3xl font-black text-emerald-800">${metrics?.dailyIncome.toLocaleString()}</h4>
              </div>
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Reservas del Día</h5>
              <div className="space-y-2">
                {metrics?.breakdowns?.dailyReservations?.length > 0 ? metrics.breakdowns.dailyReservations.map(res => (
                  <div key={res.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{res.customer?.name}</p>
                      <p className="text-[10px] text-slate-500">Habitación {res.room?.roomNumber} • {res.guestsCount} pers.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">${res.totalPrice.toFixed(2)}</p>
                      <p className="text-[9px] font-black uppercase text-slate-400">{res.status}</p>
                    </div>
                  </div>
                )) : <p className="text-sm text-slate-400 italic text-center py-4">No hay cobros registrados hoy</p>}
              </div>
           </div>
         )}

         {showDetailModal === 'projected' && (
           <div className="space-y-6">
              <div className="bg-violet-50 p-4 rounded-xl border border-violet-100">
                 <p className="text-[10px] font-bold text-violet-700 uppercase">Ingreso Tentativo (Acumulado Hoy)</p>
                 <p className="text-xl font-black text-violet-800">${metrics?.tentativeRevenue?.toFixed(2)}</p>
                 <p className="text-xs text-violet-600 mt-1">Suma de las habitaciones ocupadas y los consumos a cuenta del día de hoy.</p>
              </div>
              
              <div>
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Alojamiento (Habitaciones Ocupadas)</h5>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                   {metrics?.breakdowns?.activeRooms?.map((res, idx) => (
                     <div key={res.id || idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs font-bold text-slate-800">Habitación {res.room.roomNumber} - {res.customer?.name || 'Venta Público'}</p>
                          <p className="text-xs font-bold text-emerald-600">+${(res.customer?.lodgingPrice ?? res.room?.pricePerNight ?? 0).toFixed(2)}</p>
                        </div>
                        <p className="text-[10px] text-slate-500">{res.room.roomType?.name}</p>
                     </div>
                   ))}
                   {(!metrics?.breakdowns?.activeRooms || metrics.breakdowns.activeRooms.length === 0) && <p className="text-xs text-slate-400 text-center py-2 italic">Sin habitaciones ocupadas</p>}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Consumos por Cobrar (Generados Hoy)</h5>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                   {metrics?.breakdowns?.unpaidSalesToday?.map((sale, idx) => (
                     <div key={sale.id || idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs font-bold text-slate-800">{sale.product.name} (x{sale.quantity})</p>
                          <p className="text-xs font-bold text-emerald-600">+${(sale.quantity * (sale.price || sale.product.salePrice)).toFixed(2)}</p>
                        </div>
                     </div>
                   ))}
                   {(!metrics?.breakdowns?.unpaidSalesToday || metrics.breakdowns.unpaidSalesToday.length === 0) && <p className="text-xs text-slate-400 text-center py-2 italic">Sin consumos a cuenta hoy</p>}
                </div>
              </div>
           </div>
         )}

         {showDetailModal === 'cash' && (
           <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                   <p className="text-[10px] font-bold text-emerald-700 uppercase">Ingresos</p>
                   <p className="text-xl font-black text-emerald-800">+${metrics?.breakdowns?.cashIncomes?.reduce((s,i)=>s+i.totalAmount,0).toFixed(2)}</p>
                 </div>
                 <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                   <p className="text-[10px] font-bold text-rose-700 uppercase">Gastos</p>
                   <p className="text-xl font-black text-rose-800">-${metrics?.breakdowns?.expenses?.reduce((s,e)=>s+e.amount,0).toFixed(2)}</p>
                 </div>
              </div>
              
              <div>
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Historial Completo de Ingresos</h5>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                   {metrics?.breakdowns?.cashIncomes?.map((inv, idx) => (
                      <div key={inv.id || idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-between group">
                         <div className="flex justify-between items-center mb-1">
                           <p className="text-xs font-bold text-slate-800 line-clamp-1">{inv.description || 'Factura'}</p>
                           <p className="text-xs font-bold text-emerald-600">+${inv.totalAmount.toFixed(2)}</p>
                         </div>
                         <div className="flex justify-between items-center">
                           <p className="text-[10px] font-medium text-slate-500">{new Date(inv.updatedAt).toLocaleString()}</p>
                           <button 
                             onClick={() => handleSecureDelete(inv.description?.includes('Venta') ? 'transaction' : 'invoice', inv.id)}
                             className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition"
                             title="Borrar Registro"
                           >
                             <Trash2 className="w-3.5 h-3.5" />
                           </button>
                         </div>
                      </div>
                   ))}
                   {(!metrics?.breakdowns?.cashIncomes || metrics.breakdowns.cashIncomes.length === 0) && <p className="text-xs text-slate-400 text-center py-2 italic">Sin ingresos registrados</p>}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Historial Completo de Gastos</h5>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                   {metrics?.breakdowns?.expenses?.map((exp, idx) => (
                     <div key={exp.id || idx} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                        <div className="flex justify-between items-center">
                           <p className="text-xs font-bold text-slate-800 line-clamp-1">{exp.description}</p>
                           <p className="text-xs font-bold text-rose-600 flex-shrink-0">-${exp.amount.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                           <p className="text-[9px] font-black uppercase text-slate-400">Rubro: {exp.category}</p>
                           {exp.date && <p className="text-[9px] font-medium text-slate-500">{new Date(exp.date).toLocaleString()}</p>}
                        </div>
                     </div>
                   ))}
                   {(!metrics?.breakdowns?.expenses || metrics.breakdowns.expenses.length === 0) && <p className="text-xs text-slate-400 text-center py-2 italic">Sin gastos registrados</p>}
                </div>
              </div>
           </div>
         )}

         {showDetailModal === 'inventory' && (
           <div className="space-y-4">
              <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 mb-6">
                <p className="text-xs font-bold text-rose-700 uppercase mb-1">Alertas de Stock</p>
                <h4 className="text-3xl font-black text-rose-800">{metrics?.lowStockProducts}</h4>
              </div>
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Productos por Agotarse</h5>
              <div className="space-y-2">
                {metrics?.breakdowns?.lowStockProductsList?.length > 0 ? metrics.breakdowns.lowStockProductsList.map(prod => (
                  <div key={prod.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{prod.name}</p>
                      <p className="text-[10px] text-slate-500">{prod.category || 'Sin categoría'}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${prod.stock <= 2 ? 'text-rose-600' : 'text-amber-600'}`}>Stock: {prod.stock}</p>
                      <p className="text-[9px] font-black uppercase text-slate-400">Min: {prod.minStock}</p>
                    </div>
                  </div>
                )) : <p className="text-sm text-slate-400 italic text-center py-4">No hay alertas de stock hoy</p>}
              </div>
            </div>
         )}

         {showDetailModal === 'pending_office' && (
           <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-blue-700 uppercase mb-1">Cuentas por Cobrar Globales</p>
                  <h4 className="text-3xl font-black text-blue-800">${metrics?.totalPendingOffice?.toFixed(2)}</h4>
                </div>
                <button 
                  onClick={() => { setShowDetailModal(null); setIsStatementDrawerOpen(true); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow hover:bg-blue-700 flex items-center gap-2"
                >
                  <CalendarClock className="w-4 h-4" /> Ir a Facturar
                </button>
              </div>
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Deudas Agrupadas por Cliente / Habitación</h5>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {(() => {
                  const pending = metrics?.breakdowns?.pendingTransactions || [];
                  if (pending.length === 0) return <p className="text-sm text-slate-400 italic text-center py-4">No hay cuentas por cobrar</p>;
                  
                  const grouped = pending.reduce((acc, t) => {
                    const name = t.customer?.name || (t.room ? `Hab. ${t.room.roomNumber}` : 'Público General');
                    if (!acc[name]) acc[name] = { total: 0, items: [] };
                    acc[name].total += t.quantity * (t.price || t.product?.salePrice || 0);
                    acc[name].items.push(t);
                    return acc;
                  }, {});

                  return Object.entries(grouped).sort((a,b) => b[1].total - a[1].total).map(([name, data]) => (
                    <details key={name} className="bg-white border text-sm border-slate-200 rounded-xl mb-2 group shadow-sm">
                      <summary className="p-4 cursor-pointer flex justify-between items-center font-bold text-slate-700 outline-none list-none hover:bg-slate-50 rounded-xl">
                         <div className="flex items-center gap-3">
                           <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] sm:text-xs shrink-0">{data.items.length}</span>
                           <span className="truncate max-w-[150px] sm:max-w-xs">{name}</span>
                         </div>
                         <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                           <span className="text-blue-600">${data.total.toFixed(2)}</span>
                           <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90 text-slate-300" />
                         </div>
                      </summary>
                      <div className="px-4 pb-4 pt-1 space-y-2 border-t border-slate-100 mx-2 mt-1">
                         {data.items.map(t => (
                           <div key={t.id} className="text-[11px] sm:text-xs flex justify-between border-b border-slate-50 pb-1.5 pt-1.5 last:border-0 last:pb-0 text-slate-500">
                            <span className="truncate pr-2">{new Date(t.createdAt).toLocaleDateString()} - {t.quantity}x {t.product?.name}</span>
                            <div className="flex items-center gap-2">
                               <span className="font-bold shrink-0">${(t.quantity * (t.price || t.product?.salePrice || 0)).toFixed(2)}</span>
                               <button 
                                 onClick={() => handleSecureDelete('transaction', t.id)}
                                 className="text-slate-300 hover:text-rose-500 transition"
                                 title="Borrar Registro"
                               >
                                 <Trash2 className="w-3 h-3" />
                               </button>
                            </div>
                           </div>
                         ))}
                      </div>
                    </details>
                  ));
                })()}
              </div>
            </div>
         )}

         {showDetailModal === 'food_today' && (
           <div className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-6 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-orange-700 uppercase mb-1">Ventas de Comida Hoy</p>
                  <h4 className="text-3xl font-black text-orange-800">${metrics?.foodRevenueToday?.toFixed(2)}</h4>
                </div>
                <button 
                  onClick={() => { setShowDetailModal(null); setActiveFoodDrawer(true); }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold shadow hover:bg-orange-700 flex items-center gap-2"
                >
                  <Utensils className="w-4 h-4" /> Vender Comida
                </button>
              </div>
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Historial de Hoy</h5>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                 {metrics?.breakdowns?.dailyFoodSales?.length > 0 ? metrics.breakdowns.dailyFoodSales.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(t => (
                    <div key={t.id} className="p-3 bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col justify-between group">
                       <div className="flex justify-between items-center mb-1">
                         <p className="text-sm font-bold text-slate-800">{t.quantity}x {t.product?.name}</p>
                         <p className="text-sm font-bold text-emerald-600">${(t.quantity * (t.price || t.product?.salePrice || 0)).toFixed(2)}</p>
                       </div>
                       <div className="flex justify-between items-start mt-1">
                         <div className="flex-1">
                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                               {t.paymentMethod === 'cash' && <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase">Efectivo</span>}
                               {t.paymentMethod === 'transfer' && <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase">Transf</span>}
                               {t.paymentMethod === 'office' && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">Pendiente de Pago</span>}
                               <span className="ml-1">{new Date(t.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </p>
                            {t.notes && <p className="text-[10px] text-slate-400 font-medium italic max-w-[150px] mt-1">"{t.notes}"</p>}
                         </div>
                         <button 
                             onClick={() => handleSecureDelete('transaction', t.id)}
                             className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition ml-2"
                             title="Borrar Registro"
                           >
                             <Trash2 className="w-3.5 h-3.5" />
                         </button>
                       </div>
                    </div>
                 )) : <p className="text-sm text-slate-400 italic text-center py-4">No se han registrado comidas hoy</p>}
              </div>
           </div>
         )}
      </Drawer>

      {/* 26-Room Visual Dashboard */}
      <div id="rooms-grid" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800">
            {filterStatus ? `Habitaciones ${filterStatus.toUpperCase()}S` : `Estado de Habitaciones (Total: 26)`}
          </h2>
          <div className="flex items-center gap-4">
            {filterStatus && (
              <button 
                onClick={() => setFilterStatus(null)}
                className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 hover:bg-rose-100 transition"
              >
                Quitar Filtro
              </button>
            )}
            <div className="flex space-x-4 text-[10px] font-bold uppercase tracking-widest">
              <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-1.5"></span>Disponible</div>
              <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 mr-1.5"></span>Ocupada</div>
              <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 mr-1.5"></span>Limpieza</div>
              <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 mr-1.5"></span>Mantenimiento</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 whitespace-nowrap md:grid-cols-6 lg:grid-cols-8 gap-4">
          {rooms.filter(r => !filterStatus || r.status === filterStatus).map((room) => (
            <div 
              key={room.id}
              onClick={() => openRoomDrawer(room)}
              className={`p-4 rounded-xl border text-center cursor-pointer transition transform hover:-translate-y-1 relative overflow-hidden ${getRoomColorStyles(room.status)}`}
              title={`Clic para editar estado de habitación ${room.roomNumber}`}
            >
              <div className="relative z-10">
                {getRoomIcon(room.status)}
                <h3 className="text-lg font-bold">{room.roomNumber}</h3>
                <p className="text-[10px] uppercase font-bold opacity-80 mt-1 truncate">{room.status}</p>
                <p className="text-[10px] opacity-70 truncate">{room.roomType?.name}</p>
              </div>
              {room.images && room.images.length > 0 && (
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <img src={`http://${window.location.hostname}:5000${room.images[0].imageUrl}`} alt="Room" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Room Edition Drawer */}
      <Drawer isOpen={activeDrawer} onClose={() => setActiveDrawer(false)} title={`Habitación ${selectedRoom?.roomNumber}`}>
        {roomError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {roomError}
          </div>
        )}
        <form onSubmit={handleRoomUpdate} className="space-y-6">
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            {selectedRoom?.images && selectedRoom.images.length > 0 ? (
               <div className="space-y-3">
                  <div className="w-full h-48 rounded-xl overflow-hidden relative group cursor-pointer shadow-sm" onClick={() => openLightbox(selectedRoom.images, 0)}>
                    <img src={`http://${window.location.hostname}:5000${selectedRoom.images[0].imageUrl}`} alt="Room Main" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <ImageIcon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  {selectedRoom.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {selectedRoom.images.map((img, idx) => (
                        <div 
                          key={img.id} 
                          onClick={() => openLightbox(selectedRoom.images, idx)}
                          className="w-16 h-16 rounded-lg flex-shrink-0 overflow-hidden border border-slate-200 cursor-pointer hover:border-emerald-500 transition shadow-sm"
                        >
                          <img src={`http://${window.location.hostname}:5000${img.imageUrl}`} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                        </div>
                      ))}
                    </div>
                  )}
               </div>
            ) : (
               <div className="flex flex-col items-center py-4">
                 {getRoomIcon(selectedRoom?.status)}
               </div>
            )}
            <div className="text-center mt-3">
              <h2 className="text-xl font-bold text-slate-800">Nº {selectedRoom?.roomNumber}</h2>
              <p className="text-sm text-slate-500">{selectedRoom?.roomType?.name} - ${selectedRoom?.pricePerNight}/noche</p>
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Actualizar Estado</label>
             <select 
               className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
               value={roomForm.status} 
               onChange={e => setRoomForm({...roomForm, status: e.target.value})}
             >
               <option value="disponible">Disponible</option>
               <option value="ocupada">Ocupada</option>
               <option value="limpieza">Limpieza</option>
               <option value="mantenimiento">Mantenimiento</option>
             </select>
          </div>

          {/* CHECKOUT MODAL LOGIC */}
          {(roomForm.status === 'disponible' || roomForm.status === 'limpieza') && selectedRoom?.status === 'ocupada' && (
             <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl animate-fade-in space-y-4">
                <div className="bg-white p-4 rounded-2xl border-2 border-rose-100 shadow-inner space-y-3 relative overflow-hidden">
                    {/* Decorative Receipt Top */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-rose-200" />
                    
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-tighter">Resumen de Cuenta</span>
                        {selectedRoom?.reservations?.find(r => r.status === 'activa')?.customer?.company && (
                          <div className="flex items-center gap-1.5 py-0.5 px-2 bg-rose-600 text-white rounded-full text-[9px] font-black uppercase ring-2 ring-rose-200">
                             <Building className="w-3 h-3" /> Convenio: {selectedRoom.reservations.find(r => r.status === 'activa').customer.company.name}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Check-in</p>
                        <p className="text-[10px] font-black text-slate-700">{new Date(selectedRoom?.reservations?.find(r => r.status === 'activa')?.checkInDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="space-y-2 border-y border-dashed border-rose-200 py-3">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5"><Bed className="w-3.5 h-3.5 text-rose-400" /> Alojamiento ({checkoutForm.nights} x ${checkoutForm.pricePerNight})</span>
                        <span className="font-mono">${(checkoutForm.nights * checkoutForm.pricePerNight).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5"><Utensils className="w-3.5 h-3.5 text-rose-400" /> Consumos y Suministros</span>
                        <span className="font-mono">${(selectedRoom?.inventoryTransactions?.filter(t => t.status !== 'settled').reduce((sum, t) => sum + (t.quantity * t.price), 0) || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-sm font-black text-rose-900 uppercase">Total a Liquidar</span>
                      <span className="text-2xl font-black text-rose-600 font-mono tracking-tighter">
                        ${((checkoutForm.nights * checkoutForm.pricePerNight) + (selectedRoom?.inventoryTransactions?.filter(t => t.status !== 'settled').reduce((sum, t) => sum + (t.quantity * t.price), 0) || 0)).toFixed(2)}
                      </span>
                    </div>

                    <div className="pt-4 space-y-3 border-t border-rose-100 mt-2">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-[9px] font-black text-rose-400 mb-1 uppercase tracking-widest">Método de Pago</label>
                          <select 
                            className="w-full p-2 bg-white border border-rose-200 rounded-lg text-xs font-bold text-rose-700 outline-none focus:ring-2 focus:ring-rose-500 transition"
                            value={checkoutForm.paymentMethod}
                            onChange={e => setCheckoutForm({...checkoutForm, paymentMethod: e.target.value})}
                            required={(roomForm.status === 'disponible' || roomForm.status === 'limpieza') && selectedRoom.status === 'ocupada'}
                          >
                            <option value="">-- Seleccionar --</option>
                            <option value="cash">Efectivo</option>
                            <option value="transfer">Transferencia</option>
                            <option value="office">Crédito / RS ROTH</option>
                          </select>
                        </div>
                        {checkoutForm.paymentMethod === 'transfer' && (
                          <div className="flex-1">
                             <label className="block text-[9px] font-black text-rose-400 mb-1 uppercase tracking-widest">Referencia</label>
                             <input 
                              type="text" 
                              placeholder="# Ref" 
                              className="w-full p-2 bg-white border border-rose-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-rose-500"
                              value={checkoutForm.transferReference}
                              onChange={e => setCheckoutForm({...checkoutForm, transferReference: e.target.value})}
                            />
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Añadir Consumo Rápido</p>
                        <div className="flex gap-2">
                           <select 
                             className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-[10px] outline-none"
                             onChange={e => {
                               const prod = products.find(p => p.id === e.target.value);
                               if (prod) {
                                 const activeRes = selectedRoom?.reservations?.find(r => r.status === 'activa');
                                 setFoodForm({
                                   ...foodForm, 
                                   productId: prod.id,
                                   price: getEffectivePrice(activeRes?.customerId, prod)
                                 });
                                 setShowFoodSaleForm(true);
                               }
                             }}
                           >
                             <option value="">+ Agregar Comida/Producto</option>
                             {products.filter(p => p.isSellable).sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                               <option key={p.id} value={p.id}>{p.name} (${p.salePrice})</option>
                             ))}
                           </select>
                        </div>
                      </div>
                    </div>
                 </div>

                 <div className="space-y-3">
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Método de Liquidación</label>
                   <div className="grid grid-cols-3 gap-2">
                     {[
                       { id: 'cash', label: 'Efectivo', icon: Banknote },
                       { id: 'transfer', label: 'Transferencia', icon: Landmark },
                       { id: 'office', label: 'Crédito / Ofic.', icon: Building }
                     ].map(method => (
                       <button
                         key={method.id}
                         type="button"
                         onClick={() => setCheckoutForm({...checkoutForm, paymentMethod: method.id})}
                         className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 ${
                           checkoutForm.paymentMethod === method.id 
                            ? 'bg-rose-600 border-rose-600 text-white shadow-lg scale-[1.02]' 
                            : 'bg-white border-slate-100 text-slate-400 hover:border-rose-200 hover:text-rose-400'
                         } ${method.id === 'office' && selectedRoom?.reservations?.find(r => r.status === 'activa')?.customer?.companyId ? 'ring-2 ring-rose-400 ring-offset-2 animate-pulse-subtle' : ''}`}
                       >
                         <method.icon className="w-5 h-5 mb-1.5" />
                         <span className="text-[10px] font-black uppercase tracking-tighter">{method.label}</span>
                       </button>
                     ))}
                   </div>
                   
                   {checkoutForm.paymentMethod === 'transfer' && (
                     <div className="animate-slide-up">
                       <input 
                         type="text" 
                         placeholder="Ref. de Transferencia / Factura" 
                         className="w-full p-3 bg-white border-2 border-rose-100 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none shadow-sm"
                         value={checkoutForm.transferReference}
                         onChange={e => setCheckoutForm({...checkoutForm, transferReference: e.target.value})}
                         required
                       />
                     </div>
                   )}
                 </div>
              </div>
          )}
                 {roomForm.status === 'ocupada' && selectedRoom?.status !== 'ocupada' && (
             <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl animate-fade-in space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-indigo-900 flex items-center uppercase tracking-widest">
                    <UserIcon className="w-4 h-4 mr-1.5" /> Registro de Entrada
                  </label>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${!roomForm.isNewCustomer ? 'bg-indigo-600 text-white' : 'text-indigo-400 bg-indigo-100'}`}>Existente</span>
                    <button 
                      type="button"
                      onClick={() => setRoomForm({...roomForm, isNewCustomer: !roomForm.isNewCustomer})}
                      className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${roomForm.isNewCustomer ? 'bg-emerald-500' : 'bg-indigo-200'}`}
                    >
                      <span className={`${roomForm.isNewCustomer ? 'translate-x-4' : 'translate-x-1'} inline-block h-2 w-2 transform rounded-full bg-white transition-transform`} />
                    </button>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${roomForm.isNewCustomer ? 'bg-emerald-600 text-white' : 'text-slate-400 bg-slate-100'}`}>Nuevo</span>
                  </div>
                </div>

                {!roomForm.isNewCustomer ? (
                  <select 
                    className="w-full p-3 bg-white border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm font-medium"
                    value={roomForm.customerId}
                    onChange={e => {
                      const custId = e.target.value;
                      const cust = customers.find(c => c.id === custId);
                      let finalPrice = cust?.customRoomPrice || selectedRoom.pricePerNight;
                      
                      // Logic for Company Pricing (Individual vs Shared)
                      if (cust?.company) {
                        const isShared = selectedRoom?.roomType?.name?.toLowerCase().includes('compar') || 
                                         selectedRoom?.roomType?.id === 'type-shared';
                        if (isShared && cust.company.companySharedPrice) {
                          finalPrice = cust.company.companySharedPrice;
                        } else if (!isShared && cust.company.companyIndividualPrice) {
                          finalPrice = cust.company.companyIndividualPrice;
                        }
                      }

                      setRoomForm({
                        ...roomForm, 
                        customerId: custId,
                        roomPrice: finalPrice
                      });
                    }}
                    required={roomForm.status === 'ocupada' && selectedRoom?.status !== 'ocupada' && !roomForm.isNewCustomer}
                  >
                    <option value="">-- Seleccionar Huésped --</option>
                    {customers.sort((a,b)=>a.name.localeCompare(b.name)).map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.document}) {c.company ? ` - [${c.company.name}]` : ''}</option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-3 animate-slide-up">
                    <input type="text" placeholder="Nombre Completo" required
                      className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={roomForm.newName} onChange={e => setRoomForm({...roomForm, newName: e.target.value})} />
                    
                    <div className="grid grid-cols-2 gap-2">
                       <input type="text" placeholder="Cédula / RUC" required
                        className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={roomForm.newDocument} onChange={e => setRoomForm({...roomForm, newDocument: e.target.value})} />
                       <input type="text" placeholder="Teléfono"
                        className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={roomForm.newPhone} onChange={e => setRoomForm({...roomForm, newPhone: e.target.value})} />
                    </div>

                    <div className="flex gap-2 p-1 bg-white rounded-xl border border-indigo-100">
                      <button type="button" onClick={() => setRoomForm({...roomForm, newClientType: 'NATURAL'})}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${roomForm.newClientType === 'NATURAL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}>Personal</button>
                      <button type="button" onClick={() => setRoomForm({...roomForm, newClientType: 'EMPRESA'})}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${roomForm.newClientType === 'EMPRESA' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}>Empresa</button>
                    </div>

                    {roomForm.newClientType === 'NATURAL' && (
                      <select 
                        className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={roomForm.newCompanyId}
                        onChange={e => setRoomForm({...roomForm, newCompanyId: e.target.value})}
                      >
                        <option value="">¿Viene por alguna empresa?</option>
                        {customers.filter(c => c.clientType === 'EMPRESA').map(emp => (
                          <option key={emp.id} value={emp.id}>Envía: {emp.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
                
                <div className="pt-2 border-t border-indigo-100">
                  <div className="relative mb-3">
                    <label className="block text-[10px] font-black text-indigo-400 mb-1 uppercase tracking-widest ml-1">Tarifa Alojamiento</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300" />
                      <input 
                        type="number" step="0.01"
                        className="w-full p-3 pl-10 bg-white border border-indigo-200 rounded-xl text-lg font-black text-indigo-700 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                        value={roomForm.roomPrice}
                        onChange={e => setRoomForm({...roomForm, roomPrice: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-indigo-900 mb-1 uppercase tracking-tight">Cant. Personas</label>
                      <input type="number" min="1" 
                        className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={roomForm.guestsCount}
                        onChange={e => setRoomForm({...roomForm, guestsCount: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-indigo-900 mb-1 uppercase tracking-tight">Nombres Extra</label>
                      <input type="text" placeholder="Ej. Esposa, Hijo"
                        className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={roomForm.guestNames}
                        onChange={e => setRoomForm({...roomForm, guestNames: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
             </div>
          )}

          {selectedRoom?.status === 'ocupada' && (
            <div className="bg-white border text-center border-slate-200 p-4 rounded-xl space-y-3">
              {(() => {
                const activeRes = selectedRoom?.reservations?.find(r => r.status === 'activa');
                if (activeRes) {
                  return (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-left mb-3">
                       <h4 className="text-xs font-bold text-emerald-800 uppercase mb-1">Huésped Principal:</h4>
                       <p className="text-sm font-medium text-emerald-700">{activeRes.customer?.name}</p>
                       <div className="flex justify-between mt-2 pt-2 border-t border-emerald-200/60">
                         <span className="text-xs font-bold text-emerald-800">Personas:</span>
                         <span className="text-xs font-bold text-emerald-700">{activeRes.guestsCount}</span>
                       </div>
                       {activeRes.guestNames && (
                         <div className="mt-1">
                           <span className="text-xs font-bold text-emerald-800">Acompañantes:</span>
                           <p className="text-xs text-emerald-700 italic">{activeRes.guestNames}</p>
                         </div>
                       )}
                    </div>
                  );
                }
                return null;
              })()}
              <p className="text-xs font-bold text-slate-500 uppercase">Gestión de Consumos</p>
              
              {!showFoodSaleForm && !showSurchargeForm && (
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button" 
                    onClick={() => setShowFoodSaleForm(true)} 
                    className="w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Utensils className="w-4 h-4" /> Comida
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setRoomForm({...roomForm, status: 'disponible'});
                      // Ensure nights is recalculated upon manual trigger too
                      openRoomDrawer(selectedRoom);
                    }} 
                    className="w-full py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition flex items-center justify-center gap-1.5 shadow-sm uppercase tracking-tight"
                  >
                    <CheckCircle className="w-4 h-4" /> Cobrar / Cerrar
                  </button>
                </div>
              )}

              {/* List of Pending Consumptions */}
              {selectedRoom?.inventoryTransactions?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Consumos Pendientes</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {selectedRoom.inventoryTransactions.map(t => (
                      <div key={t.id} className="flex justify-between items-center group bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="text-[11px] font-bold text-slate-700 truncate">{t.product?.name || t.notes || 'Consumo'}</p>
                          <p className="text-[9px] text-slate-500">{t.quantity} x ${t.price?.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-emerald-600">${(t.quantity * t.price).toFixed(2)}</span>
                          <button 
                            type="button"
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-md transition opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {showFoodSaleForm && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="space-y-3 animate-fade-in mb-6">
                  {foodError && (
                    <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-700 text-[10px] rounded-lg">
                      {foodError}
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Nuevo Consumo</h4>
                    <button type="button" onClick={() => setShowFoodSaleForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>
                  </div>
                  
                  <select 
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    value={foodForm.productId}
                    onChange={e => {
                      const prod = products.find(p => p.id === e.target.value);
                      const activeRes = selectedRoom?.reservations?.find(r => r.status === 'activa');
                      setFoodForm({
                        ...foodForm, 
                        productId: e.target.value,
                        price: getEffectivePrice(activeRes?.customerId, prod)
                      });
                    }}
                    required
                  >
                    <option value="">-- Seleccionar Producto --</option>
                    {products.filter(p => p.isSellable && p.category?.toUpperCase() === 'COMIDA').sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  {/* Botones Rápidos de Comida */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['Desayuno', 'Almuerzo', 'Merienda', 'Cena'].map(meal => {
                      const mealProd = products.find(p => p.name === meal);
                      return (
                        <button 
                          key={meal}
                          type="button" 
                          onClick={() => {
                            if (!mealProd) return;
                            const activeRes = selectedRoom?.reservations?.find(r => r.status === 'activa');
                            setFoodForm({
                              ...foodForm, 
                              productId: mealProd.id,
                              price: getEffectivePrice(activeRes?.customerId, mealProd)
                            });
                          }}
                          className={`py-1.5 px-3 rounded-lg text-[10px] font-bold transition border ${foodForm.productId === mealProd?.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}
                        >
                          {meal}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input 
                        type="number" min="1" 
                        className="w-full p-2 pr-10 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                        value={foodForm.quantity}
                        onChange={e => setFoodForm({...foodForm, quantity: parseInt(e.target.value)})}
                        required
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">
                        {products.find(p => p.id === foodForm.productId)?.unit || 'unid'}
                      </span>
                    </div>
                    <select 
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                      value={foodForm.paymentMethod}
                      onChange={e => setFoodForm({...foodForm, paymentMethod: e.target.value})}
                      required
                    >
                      <option value="" disabled>-- Seleccione Método --</option>
                      <option value="cash">Efectivo</option>
                      <option value="transfer">Transferencia</option>
                      <option value="office">Pendiente / Cargar a Hab.</option>
                    </select>
                  </div>

                  <div className="relative">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Precio Final</label>
                    <input 
                      type="number" step="0.01"
                      placeholder="Precio Final" 
                      className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500"
                      value={foodForm.price}
                      onChange={e => setFoodForm({...foodForm, price: e.target.value})}
                    />
                  </div>

                  {foodForm.paymentMethod === 'transfer' && (
                    <input 
                      type="text" 
                      placeholder="Ref. Transferencia" 
                      className="w-full p-2 bg-white border border-indigo-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                      value={foodForm.transferReference}
                      onChange={e => setFoodForm({...foodForm, transferReference: e.target.value})}
                    />
                  )}
                  
                  <button 
                    type="button" 
                    onClick={handleFoodSale}
                    disabled={!foodForm.productId}
                    className="w-full py-2 bg-slate-800 text-white rounded-lg text-xs font-black disabled:opacity-50"
                  >
                    REGISTRAR CONSUMO
                  </button>
                </div>
              </div>
              )}

              {showSurchargeForm && (
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 animate-fade-in mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-[10px] font-black uppercase text-rose-800 tracking-widest">Registrar Penalidad / Recargo</h4>
                    <button type="button" onClick={() => setShowSurchargeForm(false)} className="text-rose-400 hover:text-rose-600"><X className="w-3 h-3" /></button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-rose-600 mb-1 uppercase tracking-wider">Motivo del Recargo</label>
                      <input 
                        type="text" 
                        placeholder="Ej. Toalla perdida, limpieza extra..." 
                        className="w-full p-2 bg-white border border-rose-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-rose-500"
                        value={surchargeForm.description}
                        onChange={e => setSurchargeForm({...surchargeForm, description: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                       <div>
                         <label className="block text-[10px] font-bold text-rose-600 mb-1 uppercase tracking-wider">Monto ($)</label>
                         <input 
                           type="number" step="0.01" min="0.01"
                           placeholder="0.00" 
                           className="w-full p-2 bg-white border border-rose-200 rounded-lg text-xs font-bold text-rose-700 outline-none focus:ring-2 focus:ring-rose-500"
                           value={surchargeForm.amount}
                           onChange={e => setSurchargeForm({...surchargeForm, amount: e.target.value})}
                           required
                         />
                       </div>
                       <div>
                         <label className="block text-[10px] font-bold text-rose-600 mb-1 uppercase tracking-wider">Pago</label>
                         <select 
                           className="w-full p-2 bg-white border border-rose-200 text-rose-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                           value={surchargeForm.paymentMethod}
                           onChange={e => setSurchargeForm({...surchargeForm, paymentMethod: e.target.value})}
                           required
                         >
                           <option value="" disabled>-- Seleccione Método --</option>
                           <option value="office">Pendiente (A la cuenta)</option>
                           <option value="cash">Efectivo (Pagado ya)</option>
                           <option value="transfer">Transferencia (Pagado)</option>
                         </select>
                       </div>
                    </div>

                    {surchargeForm.paymentMethod === 'transfer' && (
                      <input 
                        type="text" 
                        placeholder="Ref. Transferencia" 
                        className="w-full p-2 bg-white border border-rose-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-rose-500"
                        value={surchargeForm.transferReference}
                        onChange={e => setSurchargeForm({...surchargeForm, transferReference: e.target.value})}
                      />
                    )}
                    
                    <button 
                      type="button" 
                      onClick={handleSurcharge}
                      disabled={!surchargeForm.description || !surchargeForm.amount}
                      className="w-full py-2 mt-2 bg-rose-700 text-white rounded-lg text-xs font-black disabled:opacity-50 hover:bg-rose-800 transition"
                    >
                      APLICAR RECARGO
                    </button>
                  </div>
                </div>
              )}

              <button 
                type="button" 
                onClick={() => navigate('/inventory')} 
                className="w-full py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
              >
                Ir a Inventario Completo
              </button>
            </div>
          )}

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
             <button type="button" onClick={() => setActiveDrawer(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition">Cancelar</button>
             <button type="submit" className="px-5 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-sm">Actualizar Habitación</button>
          </div>
        </form>
      </Drawer>

      {/* Dedicated Food Sale Drawer */}
      <Drawer isOpen={activeFoodDrawer} onClose={() => {setActiveFoodDrawer(false); setFoodError('');}} title="Venta de Restaurante / Comida">
        {foodError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {foodError}
          </div>
        )}
        <form onSubmit={handleFoodSale} className="space-y-5">
           <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-center gap-3">
             <div className="p-2 bg-orange-100 rounded-lg">
                <Utensils className="w-6 h-6 text-orange-700" />
             </div>
             <div>
                <p className="text-xs font-bold text-orange-800 uppercase tracking-wider">Restaurante / Bar</p>
                <p className="text-[10px] text-orange-600">Para consumos internos y público general</p>
             </div>
           </div>

           <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Cliente / Habitación (Opcional)</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                value={foodForm.roomId || foodForm.customerId || ''}
                onChange={e => {
                   const val = e.target.value;
                   let roomId = '';
                   let customerId = '';
                   
                   if (val.startsWith('ROOM_')) {
                     roomId = val.replace('ROOM_', '');
                     const r = rooms.find(room => room.id === roomId);
                     customerId = r?.reservations?.find(res => res.status === 'activa')?.customerId || '';
                   } else if (val) {
                     customerId = val;
                   }

                   const prod = products.find(p => p.id === foodForm.productId);
                   setFoodForm({
                      ...foodForm, 
                      roomId,
                      customerId,
                      price: prod ? getEffectivePrice(customerId, prod) : foodForm.price
                   });
                }}
              >
                <option value="">-- Público General --</option>
                <optgroup label="Habitaciones Ocupadas">
                  {rooms.filter(r => r.status === 'ocupada').map(r => {
                    const activeRes = r.reservations?.find(res => res.status === 'activa');
                    return <option key={`room_${r.id}`} value={`ROOM_${r.id}`}>Hab {r.roomNumber} - {activeRes?.customer?.name || 'Ocupada'}</option>
                  })}
                </optgroup>
                <optgroup label="Clientes Empadronados">
                  {customers && Array.isArray(customers) && [...customers].sort((a,b) => (a.name || '').localeCompare(b.name || '')).map(c => (
                    <option key={`cust_${c.id}`} value={c.id}>{c.name} ({c.document})</option>
                  ))}
                </optgroup>
              </select>
           </div>

           <div className="bg-white p-4 rounded-xl border border-slate-200">
             <div className="space-y-3">
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
                  value={foodForm.productId}
                  onChange={e => {
                    const prod = products.find(p => p.id === e.target.value);
                    setFoodForm({
                      ...foodForm, 
                      productId: e.target.value,
                      price: getEffectivePrice(foodForm.customerId, prod)
                    });
                  }}
                  required
                >
                  <option value="">-- Seleccionar Plato o Bebida --</option>
                  {products.filter(p => p.isSellable && p.category?.toUpperCase() === 'COMIDA').sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['Desayuno', 'Almuerzo', 'Merienda', 'Cena'].map((meal, idx) => {
                    const mealProd = products.find(p => p.name === meal);
                    return (
                      <button 
                        key={`global_meal_${idx}`}
                        type="button" 
                        onClick={() => {
                          if (!mealProd) return;
                          setFoodForm({
                            ...foodForm, 
                            productId: mealProd.id,
                            price: getEffectivePrice(foodForm.customerId, mealProd)
                          });
                        }}
                        className={`py-2 px-3 rounded-xl text-[11px] font-bold transition border ${foodForm.productId === mealProd?.id ? 'bg-orange-600 text-white border-orange-600' : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'}`}
                      >
                        {meal}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Cantidad</label>
                    <input 
                      type="number" min="1" 
                      className="w-full p-3 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                      value={foodForm.quantity}
                      onChange={e => setFoodForm({...foodForm, quantity: parseInt(e.target.value) || 1})}
                      required
                    />
                    <span className="absolute right-3 top-9 text-[10px] font-bold text-slate-400 uppercase">
                      {products.find(p => p.id === foodForm.productId)?.unit || 'u.'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Método Pago</label>
                    <select 
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                      value={foodForm.paymentMethod}
                      onChange={e => setFoodForm({...foodForm, paymentMethod: e.target.value})}
                    >
                      <option value="cash">Efectivo</option>
                      <option value="transfer">Transferencia</option>
                      <option value="office">Pendiente / Cargar a Hab.</option>
                    </select>
                  </div>
                </div>

                <div className="relative mt-2">
                  <label className="block text-[10px] font-bold text-orange-600 mb-1 uppercase tracking-wider">Precio Final (C/U)</label>
                  <input 
                    type="number" step="0.01"
                    className="w-full p-3 bg-orange-50 border border-orange-200 rounded-xl text-lg font-black text-orange-800 outline-none focus:ring-2 focus:ring-orange-500"
                    value={foodForm.price}
                    onChange={e => setFoodForm({...foodForm, price: e.target.value})}
                  />
                </div>

                {foodForm.paymentMethod === 'transfer' && (
                  <div className="mt-2">
                    <input 
                      type="text" 
                      placeholder="Ref. Transferencia" 
                      className="w-full p-3 bg-white border border-indigo-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      value={foodForm.transferReference}
                      onChange={e => setFoodForm({...foodForm, transferReference: e.target.value})}
                    />
                  </div>
                )}
                
                <div className="mt-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Notas / Comentarios (Opcional)</label>
                  <textarea 
                    rows="2"
                    placeholder="Ejem: Sin cebolla, extra salsa..."
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
                    value={foodForm.notes}
                    onChange={e => setFoodForm({...foodForm, notes: e.target.value})}
                  />
                </div>
             </div>
           </div>
           
           <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => setActiveFoodDrawer(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition">Cancelar</button>
              <button type="submit" disabled={!foodForm.productId} className="px-5 py-2.5 text-sm font-medium bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition shadow-lg shadow-orange-700/20 active:scale-95 disabled:opacity-50">REGISTRAR CONSUMO</button>
           </div>
        </form>
      </Drawer>

      {/* External Sale Drawer */}
      <Drawer isOpen={activeExternalDrawer} onClose={() => {setActiveExternalDrawer(false); setExternalError('');}} title="Nueva Venta Directa (No Huésped)">
        {externalError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {externalError}
          </div>
        )}
        <form onSubmit={handleExternalSale} className="space-y-6">
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
             <div className="p-2 bg-emerald-100 rounded-lg">
                <Plus className="w-6 h-6 text-emerald-700" />
             </div>
             <div>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Venta Directa</p>
                <p className="text-[10px] text-emerald-600">Para clientes que no están en el hotel</p>
             </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Cliente (Opcional)</label>
             <select 
               className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
               value={externalForm.customerId}
               onChange={e => {
                  const custId = e.target.value;
                  const prod = products.find(p => p.id === externalForm.productId);
                  setExternalForm({
                     ...externalForm, 
                     customerId: custId,
                     price: prod ? getEffectivePrice(custId, prod) : externalForm.price
                  });
               }}
             >
               <option value="">-- Venta al Público (Sin Nombre) --</option>
               {customers && Array.isArray(customers) && [...customers].sort((a,b) => (a.name || '').localeCompare(b.name || '')).map(c => (
                 <option key={c.id} value={c.id}>{c.name} ({c.document})</option>
               ))}
             </select>
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Buscar y Agregar Productos</label>
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Escribe el nombre o código de barras..." 
                  className="w-full p-3 pl-10 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                  value={externalSearch}
                  onChange={e => setExternalSearch(e.target.value)}
                />
                {externalSearchResults.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100">
                     {externalSearchResults.map(p => (
                       <div 
                         key={p.id} 
                         onClick={() => addExternalItem(p)}
                         className="flex justify-between items-center p-3 hover:bg-emerald-50 cursor-pointer transition"
                       >
                          <div>
                             <p className="text-sm font-bold text-slate-800">{p.name}</p>
                             <p className="text-[10px] text-slate-500">Stock: {p.stock} | Precio Unitario: ${getEffectivePrice(externalForm.customerId, p).toFixed(2)}</p>
                          </div>
                          <button type="button" className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg"><Plus className="w-4 h-4"/></button>
                       </div>
                     ))}
                  </div>
                )}
             </div>
          </div>

          {externalCart.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
               <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest flex justify-between items-center">
                 <span>Carrito ({externalCart.reduce((total, i) => total + i.quantity, 0)} items)</span>
               </div>
               <div className="divide-y divide-slate-100">
                  {externalCart.map(item => (
                    <div key={item.product.id} className="p-3 bg-white flex flex-col gap-2 relative group">
                       <div className="flex justify-between items-start">
                          <div className="pr-6">
                             <p className="font-bold text-sm text-slate-800 leading-tight">{item.product.name}</p>
                             <p className="text-[10px] text-slate-500">Precio Original: ${item.product.salePrice.toFixed(2)}</p>
                          </div>
                          <button type="button" onClick={() => removeExternalItem(item.product.id)} className="absolute right-2 top-2 p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                       <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                            <button type="button" onClick={() => updateExternalItemQuantity(item.product.id, -1)} className="p-1 hover:bg-white rounded shadow-sm text-slate-600"><Minus className="w-3 h-3"/></button>
                            <span className="w-8 text-center text-xs font-bold text-slate-800">{item.quantity}</span>
                            <button type="button" onClick={() => updateExternalItemQuantity(item.product.id, 1)} className="p-1 hover:bg-white rounded shadow-sm text-slate-600"><Plus className="w-3 h-3"/></button>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-bold text-slate-400 uppercase">P. Unit $</span>
                             <input type="number" step="0.01" value={item.price} onChange={(e) => {
                                const nv = parseFloat(e.target.value) || 0;
                                setExternalCart(externalCart.map(i => i.product.id === item.product.id ? {...i, price: nv} : i));
                             }} className="w-16 p-1 text-right border border-emerald-200 bg-emerald-50 rounded text-xs font-bold text-emerald-700 outline-none" />
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="p-3 bg-emerald-50 border-t border-emerald-100 flex justify-between items-center">
                 <p className="text-xs font-bold text-emerald-800 uppercase">Total a Pagar</p>
                 <p className="text-xl font-black text-emerald-600">${externalCart.reduce((total, i) => total + (i.price * i.quantity), 0).toFixed(2)}</p>
               </div>
            </div>
          )}
            <div>
               <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Método Pago</label>
               <select 
                 className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-800"
                 value={externalForm.paymentMethod}
                 onChange={e => setExternalForm({...externalForm, paymentMethod: e.target.value})}
                 required
               >
                 <option value="" disabled>-- Seleccione Método --</option>
                 <option value="cash">Efectivo</option>
                 <option value="transfer">Transferencia</option>
                 <option value="office">Pendiente / Cargar a Hab.</option>
               </select>
             </div>

          {externalForm.paymentMethod === 'transfer' && (
            <div className="animate-fade-in">
               <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Referencia de Transferencia</label>
               <input 
                 type="text" 
                 placeholder="Ej. #001234" 
                 className="w-full p-3 bg-white border border-indigo-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                 value={externalForm.transferReference}
                 onChange={e => setExternalForm({...externalForm, transferReference: e.target.value})}
               />
            </div>
          )}

          <div>
             <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Notas / Detalles</label>
             <textarea 
               className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
               rows="2"
               placeholder="Ej: Para Geopexa, Almuerzo ejecutivo..."
               value={externalForm.notes}
               onChange={e => setExternalForm({...externalForm, notes: e.target.value})}
             />
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
             <button type="button" onClick={() => setActiveExternalDrawer(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition">Cancelar</button>
             <button type="submit" className="px-5 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-700/20 active:scale-95">REGISTRAR VENTA</button>
          </div>
        </form>
      </Drawer>

      {/* Customer Statement Drawer */}
      <Drawer isOpen={isStatementDrawerOpen} onClose={() => { setIsStatementDrawerOpen(false); setStatementData(null); }} title="Estado de Cuenta / Consumos Multi-Mes" widthClass="max-w-2xl">
        <div className="space-y-6">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                   <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Seleccionar Cliente</label>
                   <select 
                     className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                     value={statementFilter.customerId}
                     onChange={e => setStatementFilter({...statementFilter, customerId: e.target.value})}
                   >
                     <option value="">-- Buscar Cliente --</option>
                     {customers.map(c => (
                       <option key={c.id} value={c.id}>{c.name} ({c.document})</option>
                     ))}
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Fecha Inicio</label>
                   <input 
                     type="date"
                     className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                     value={statementFilter.startDate}
                     onChange={e => setStatementFilter({...statementFilter, startDate: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Fecha Fin</label>
                   <input 
                     type="date"
                     className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                     value={statementFilter.endDate}
                     onChange={e => setStatementFilter({...statementFilter, endDate: e.target.value})}
                   />
                </div>
             </div>
             <button 
               onClick={fetchStatement}
               className="w-full py-3 bg-[#064e3b] text-white rounded-xl font-bold hover:bg-emerald-900 transition flex items-center justify-center gap-2"
             >
               <Search className="w-5 h-5" /> Consultar Consumos
             </button>
          </div>

          {statementData ? (
            <div className="space-y-4 animate-fade-in">
               <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                  <div>
                     <h4 className="text-lg font-bold text-slate-800">{statementData.customer.name}</h4>
                     <p className="text-xs text-slate-500">{statementData.customer.document}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-xs font-bold text-slate-400 uppercase">Total Acumulado</p>
                     <p className="text-2xl font-black text-emerald-700">${statementData.summary.totalAmount.toFixed(2)}</p>
                  </div>
               </div>

               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead>
                     <tr className="text-slate-400 font-bold border-b border-slate-100">
                       <th className="py-3 px-2">Fecha</th>
                       <th className="py-3 px-2">Producto</th>
                       <th className="py-3 px-2 text-center">Cant.</th>
                       <th className="py-3 px-2 text-right">Unit.</th>
                       <th className="py-3 px-2 text-right">Subtotal</th>
                     </tr>
                   </thead>
                   <tbody>
                     {statementData.transactions.length > 0 ? statementData.transactions.map(t => (
                       <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                         <td className="py-3 px-2 text-slate-500 text-[11px]">{new Date(t.createdAt).toLocaleDateString()}</td>
                         <td className="py-3 px-2 font-medium text-slate-700">{t.product.name}</td>
                         <td className="py-3 px-2 text-center text-slate-600">{t.quantity}</td>
                         <td className="py-3 px-2 text-right text-slate-500">${(t.price || t.product.salePrice).toFixed(2)}</td>
                         <td className="py-3 px-2 text-right font-bold text-slate-800">${(t.quantity * (t.price || t.product.salePrice)).toFixed(2)}</td>
                       </tr>
                     )) : (
                       <tr>
                         <td colSpan="5" className="py-8 text-center text-slate-400 italic">No hay consumos en este rango</td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
               
               <div className="flex justify-between items-center p-4 bg-slate-900 text-white rounded-2xl mt-4">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-white/10 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                     </div>
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Acumulado</span>
                  </div>
                  <span className="text-xl font-black">${statementData.summary.totalAmount.toFixed(2)}</span>
               </div>

                {/* SESIÓN DE LIQUIDACIÓN / COBRO FINAL */}
                <div className="mt-8 pt-8 border-t border-slate-200">
                   <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                      <h5 className="font-bold text-amber-800 flex items-center gap-2 mb-4">
                         <DollarSign className="w-5 h-5" /> Finalizar y Cobrar Periodo
                      </h5>
                      <div className="space-y-4">
                         <div>
                            <label className="block text-[10px] font-bold text-amber-600 mb-1 uppercase tracking-widest">Monto Final a Cobrar (Ajustable)</label>
                            <input 
                              type="number" 
                              className="w-full p-3 bg-white border border-amber-300 rounded-xl text-lg font-black text-slate-800 outline-none focus:ring-2 focus:ring-amber-500" 
                              value={settleForm.finalAmount}
                              onChange={e => setSettleForm({...settleForm, finalAmount: e.target.value})}
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-3">
                            <div>
                               <label className="block text-[10px] font-bold text-amber-600 mb-1 uppercase tracking-widest">Método</label>
                               <select 
                                 className="w-full p-2 bg-white border border-amber-300 rounded-lg text-sm outline-none"
                                 value={settleForm.paymentMethod}
                                 onChange={e => setSettleForm({...settleForm, paymentMethod: e.target.value})}
                               >
                                  <option value="office">Pendiente / Cargar a Hab.</option>
                                  <option value="transfer">Transferencia</option>
                                  <option value="cash">Efectivo</option>
                               </select>
                            </div>
                            <div className="flex items-end">
                               <button 
                                 disabled={isSettling}
                                 onClick={handleSettle}
                                 className="w-full py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition shadow-sm disabled:opacity-50"
                               >
                                  {isSettling ? 'Saldando...' : 'Saldar Cuenta'}
                               </button>
                            </div>
                         </div>
                         <p className="text-[10px] text-amber-600 italic">
                            * Al saldar, estos consumos dejarán de aparecer en futuros reportes y se generará una factura final.
                         </p>
                      </div>
                   </div>
                </div>
                
                <button 
                  onClick={() => window.print()} 
                  className="flex items-center justify-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition w-full py-2 border-2 border-dashed border-slate-100 rounded-xl mt-4"
                >
                  <Search className="w-4 h-4" /> Generar Comprobante PDF (Próximamente)
                </button>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-4">
               <CalendarClock className="w-16 h-16 opacity-10" />
               <p className="text-sm italic">Seleccione un cliente y rango de fechas para ver el detalle de cobro.</p>
            </div>
          )}
        </div>
      </Drawer>

      {/* Admin Lightbox */}
      {lightbox.isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 animate-fade-in">
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
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-300"
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
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
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
}
