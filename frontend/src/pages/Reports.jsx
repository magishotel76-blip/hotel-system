import { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BarChart as BarChartIcon, 
  TrendingUp, 
  DollarSign, 
  Home, 
  Calendar,
  Filter,
  List,
  ArrowRightLeft,
  Search,
  Download,
  Trash2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';

// Removed local API_URL as we use shared api service

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'history'

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  // getAuthHeader removed as api service handles it

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = { startDate, endDate };
      const [reportsRes, historyRes] = await Promise.all([
        api.get('/reports', { params }),
        api.get('/reports/inventory-history', { params })
      ]);
      setReportData(reportsRes.data);
      setHistoryData(historyRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Depend on dates to refresh automatically when changed
  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const handleSecureDelete = async (type, id) => {
    const SESSION_KEY = 'adminDeleteSession';
    const SESSION_DURATION = 10 * 60 * 1000; // 10 minutos
    
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
      const confirmDelete = window.confirm('¿Confirmas que deseas eliminar este registro? (Sesión de eliminación activa)');
      if (!confirmDelete) return;
    } else {
      pwd = window.prompt('ATENCIÓN: Se requiere autorización financiera. Ingrese la contraseña de seguridad para eliminar registros (tendrá acceso activo durante 10 minutos):');
      if (pwd === null) return;
    }
    
    try {
      let url = '';
      if (type === 'transaction') url = `/inventory/transactions/${id}`;
      else if (type === 'expense') url = `/expenses/${id}`;
      else if (type === 'invoice') url = `/billing/${id}`;
      
      await api.delete(url, { data: { password: pwd } });
      
      if (!sessionStr) {
         localStorage.setItem(SESSION_KEY, JSON.stringify({ password: pwd, timestamp: Date.now() }));
         alert('Contraseña aceptada y registro eliminado. Tienes 10 minutos para realizar eliminaciones adicionales sin volver a ingresarla.');
      } else {
         alert('Registro eliminado permanentemente del sistema.');
      }
      
      fetchData();
    } catch (error) {
      localStorage.removeItem(SESSION_KEY); 
      alert(error.response?.data?.message || 'Error al eliminar el registro. Verifique que la contraseña sea correcta.');
    }
  };

  if (loading && !reportData) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const { summary, chartData } = reportData || {};

  const statCards = [
    {
      title: 'Ingreso Tentativo Total',
      value: summary ? `$${summary.tentativeTotalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00',
      description: 'Reservas activas + Todas las ventas',
      icon: TrendingUp,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      title: 'Ingresos Cobrados (Caja)',
      value: summary ? `$${summary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00',
      description: 'Facturas marcadas como pagadas',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Gastos Caja (Hotel)',
      value: summary ? `$${summary.cashExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00',
      description: 'Pagado con efectivo de recepción',
      icon: ArrowRightLeft,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50'
    },
    {
      title: 'Gastos Oficina (Transferencia)',
      value: summary ? `$${summary.officeExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00',
      description: 'Pagos realizados desde oficina',
      icon: List,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  const typeColors = {
    IN: 'bg-blue-100 text-blue-800',
    OUT: 'bg-slate-100 text-slate-800'
  };

  const getReasonBadge = (type, exitType) => {
    if (type === 'IN') return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800">INGRESO</span>;
    if (exitType === 'venta') return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">VENTA</span>;
    if (exitType === 'uso_interno') return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800">USO INTERNO</span>;
    if (exitType === 'cambio') return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800">INTERCAMBIO</span>;
    return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-800">SALIDA</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChartIcon className="w-6 h-6 text-emerald-600" />
            Reportes e Historiales
          </h1>
          <p className="text-slate-500 mt-1">Control financiero y auditoría de inventario</p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white border border-slate-200 text-sm rounded-lg px-3 py-1.5 focus:ring-emerald-500 outline-none text-slate-600"
            />
            <span className="text-slate-400 text-sm">hasta</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white border border-slate-200 text-sm rounded-lg px-3 py-1.5 focus:ring-emerald-500 outline-none text-slate-600"
            />
          </div>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center gap-4">
        <label className="text-sm font-bold text-slate-600 uppercase tracking-widest min-w-max">Tipo de Reporte:</label>
        <select 
          value={activeTab} 
          onChange={(e) => setActiveTab(e.target.value)}
          className="w-full md:w-auto flex-1 bg-white border-2 border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition cursor-pointer appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '3rem' }}
        >
          <option value="analytics">📊 Resumen Financiero General</option>
          <option value="daily_expenses">🍳 Gasto Diario y Cocina (Consumo Interno)</option>
          <option value="tentative_income">💰 Ingreso Tentativo del Día</option>
          <option value="outflows">📦 Control de Salidas, Stocks y Costos</option>
          <option value="history">📝 Historial General de Movimientos</option>
          <option value="canjes">🤝 Canjes y Ganancias Brutas</option>
        </select>
      </div>

      {/* Analytics Tab Content */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 mb-1 tracking-widest uppercase">{stat.title}</p>
                    <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
                    {stat.description && <p className="text-[10px] text-slate-400 mt-2 font-medium">{stat.description}</p>}
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          {chartData && chartData.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                Gastos vs Ingresos
                <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Últimos 7 días del rango seleccionado</span>
              </h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }} dy={10}
                    />
                    <YAxis 
                      axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }} tickFormatter={(value) => `$${value}`}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: '#F8FAFC' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [`$${parseFloat(value).toFixed(2)}`, undefined]}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                    <Bar dataKey="ingresos" name="Ingresos" fill="#10B981" radius={[6, 6, 0, 0]} barSize={40} />
                    <Bar dataKey="gastos" name="Gastos" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gasto Diario y Cocina */}
      {activeTab === 'daily_expenses' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-5 border-b border-slate-100 bg-slate-50">
               <h2 className="font-bold text-slate-700 flex items-center gap-2 text-lg">
                 🍳 Consumo Interno (Cocina y Otros)
               </h2>
             </div>
             <table className="w-full text-left">
               <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                 <tr>
                   <th className="px-6 py-4 font-bold border-b border-slate-200">Fecha</th>
                   <th className="px-6 py-4 font-bold border-b border-slate-200">Producto</th>
                   <th className="px-6 py-4 font-bold border-b border-slate-200 text-right">Cantidad</th>
                   <th className="px-6 py-4 font-bold border-b border-slate-200 text-right">Costo Total</th>
                   <th className="px-4 py-4 font-bold border-b border-slate-200"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {reportData?.detailedReports?.internalConsumptions?.map((tx) => (
                   <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                     <td className="px-6 py-4 text-sm text-slate-500">{new Date(tx.createdAt).toLocaleString()}</td>
                     <td className="px-6 py-4 font-medium text-slate-800">{tx.product?.name} <span className="text-xs text-slate-400 block">{tx.notes}</span></td>
                     <td className="px-6 py-4 text-right font-bold text-slate-700">{tx.quantity}</td>
                     <td className="px-6 py-4 text-right font-bold text-rose-600">${(tx.quantity * (tx.product?.purchasePrice || 0)).toFixed(2)}</td>
                     <td className="px-4 py-4 text-right">
                       <button onClick={() => handleSecureDelete('transaction', tx.id)} className="text-slate-400 hover:text-red-500 transition"><Trash2 className="w-4 h-4 inline" /></button>
                     </td>
                   </tr>
                 ))}
                 {(!reportData?.detailedReports?.internalConsumptions || reportData.detailedReports.internalConsumptions.length === 0) && (
                   <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400 italic">No hay registros de consumo interno</td></tr>
                 )}
               </tbody>
             </table>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-5 border-b border-slate-100 bg-slate-50">
               <h2 className="font-bold text-slate-700 flex items-center gap-2 text-lg">
                 💸 Gastos Operativos Registrados
               </h2>
             </div>
             <table className="w-full text-left">
               <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                 <tr>
                   <th className="px-6 py-4 font-bold border-b border-slate-200">Fecha</th>
                   <th className="px-6 py-4 font-bold border-b border-slate-200">Descripción</th>
                   <th className="px-6 py-4 font-bold border-b border-slate-200">Método</th>
                   <th className="px-6 py-4 font-bold border-b border-slate-200 text-right">Monto</th>
                   <th className="px-4 py-4 font-bold border-b border-slate-200"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {reportData?.detailedReports?.expenses?.map((exp) => (
                   <tr key={exp.id || exp.date} className="hover:bg-slate-50/70 transition">
                     <td className="px-6 py-4 text-sm text-slate-500">{new Date(exp.date).toLocaleDateString()}</td>
                     <td className="px-6 py-4 font-medium text-slate-800">{exp.description}</td>
                     <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{exp.paymentMethod || 'cash'}</td>
                     <td className="px-6 py-4 text-right font-bold text-rose-600">${exp.amount.toFixed(2)}</td>
                     <td className="px-4 py-4 text-right">
                       <button onClick={() => handleSecureDelete('expense', exp.id)} className="text-slate-400 hover:text-red-500 transition"><Trash2 className="w-4 h-4 inline" /></button>
                     </td>
                   </tr>
                 ))}
                 {(!reportData?.detailedReports?.expenses || reportData.detailedReports.expenses.length === 0) && (
                   <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400 italic">No se registraron gastos</td></tr>
                 )}
               </tbody>
             </table>
          </div>
        </div>
      )}

      {/* Ingreso Tentativo del Día */}
      {activeTab === 'tentative_income' && (
        <div className="space-y-6 animate-fade-in">
           <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between">
             <div>
               <p className="text-sm font-bold text-amber-700 uppercase tracking-widest mb-1">Total Ingreso Tentativo ({startDate} al {endDate})</p>
               <h3 className="text-4xl font-black text-amber-900">${reportData?.summary?.tentativeTotalRevenue?.toFixed(2) || '0.00'}</h3>
               <p className="text-xs text-amber-700/70 mt-2 font-medium">Incluye habitaciones ocupadas y ventas registradas cerrando a las 23:59 del rango seleccionado.</p>
             </div>
             <Calendar className="w-16 h-16 text-amber-300 opacity-50" />
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
               <div className="p-5 border-b border-slate-100 bg-slate-50">
                 <h2 className="font-bold text-slate-700 flex items-center gap-2">🛏️ Habitaciones Activas</h2>
               </div>
               <div className="p-4 space-y-3">
                 {reportData?.detailedReports?.activeReservations?.map((res) => (
                   <div key={res.id || Math.random()} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Check-in: {new Date(res.checkInDate).toLocaleDateString()}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Pendiente de cobro final</p>
                      </div>
                      <p className="font-bold text-emerald-600">${res.totalPrice.toFixed(2)}</p>
                   </div>
                 ))}
               </div>
             </div>

             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
               <div className="p-5 border-b border-slate-100 bg-slate-50">
                 <h2 className="font-bold text-slate-700 flex items-center gap-2">🛒 Todas las Ventas del Rango</h2>
               </div>
               <div className="p-4 space-y-3">
                 {reportData?.detailedReports?.allInvoices?.map((inv) => (
                   <div key={`inv-${inv.id || Math.random()}`} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl relative overflow-hidden shadow-sm hover:shadow transition group">
                      <div className={`absolute top-0 left-0 bottom-0 w-1 ${inv.status === 'pagada' ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                      <div className="pl-2">
                        <p className="text-xs font-bold text-slate-800">Factura Oficial</p>
                        <p className={`text-[10px] uppercase font-black tracking-widest mt-1 ${inv.status === 'pagada' ? 'text-emerald-500' : 'text-amber-500'}`}>{inv.status}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold text-emerald-600 font-mono">${inv.totalAmount.toFixed(2)}</p>
                        <button onClick={() => handleSecureDelete('invoice', inv.id)} className="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                      </div>
                   </div>
                 ))}
                 
                 {reportData?.detailedReports?.pendingSales?.map((sale) => (
                   <div key={`sal-${sale.id || Math.random()}`} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl relative overflow-hidden shadow-sm hover:shadow transition group">
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-400"></div>
                      <div className="pl-2">
                        <p className="text-xs font-bold text-slate-800">Venta {sale.product?.name}</p>
                        <p className="text-[10px] uppercase font-black tracking-widest text-amber-500 mt-1">Pendiente</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold text-emerald-600 font-mono">${(sale.quantity * (sale.price || sale.product?.salePrice || 0)).toFixed(2)}</p>
                        <button onClick={() => handleSecureDelete('transaction', sale.id)} className="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                      </div>
                   </div>
                 ))}

                 {(!reportData?.detailedReports?.allInvoices?.length && !reportData?.detailedReports?.pendingSales?.length) && (
                   <p className="text-xs text-slate-400 text-center py-4 italic">No hay ventas registradas en las fechas indicadas.</p>
                 )}
               </div>
             </div>
           </div>
        </div>
      )}

      {/* Control de Salidas, Stocks y Costos */}
      {activeTab === 'outflows' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in relative">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="font-bold text-slate-700 flex items-center gap-2 text-lg">
              📦 Control de Salidas y Costos Operativos
            </h2>
            <div className="bg-rose-100 text-rose-800 px-4 py-2 rounded-xl font-bold text-sm">
              Costo Total Salidas: ${reportData?.detailedReports?.allOutflows?.reduce((acc, out) => acc + (out.quantity * (out.product?.purchasePrice || 0)), 0).toFixed(2) || '0.00'}
            </div>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide sticky top-0 z-20">
                <tr>
                  <th className="px-6 py-4 font-bold border-b border-slate-200">Fecha</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-200">Producto</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-200">Motivo (ExitType)</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-200 text-right">Cant.</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-200 text-right">Costo Unitario</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-200 text-right">Costo Total</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-200 text-right">Precio Venta (Ingreso)</th>
                  <th className="px-4 py-4 font-bold border-b border-slate-200"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData?.detailedReports?.allOutflows?.map((out) => (
                  <tr key={out.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 text-xs text-slate-500">{new Date(out.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{out.product?.name}</td>
                    <td className="px-6 py-4">{getReasonBadge('OUT', out.exitType)}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-700">{out.quantity}</td>
                    <td className="px-6 py-4 text-right text-sm text-slate-500">${(out.product?.purchasePrice || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-bold text-rose-600">${(out.quantity * (out.product?.purchasePrice || 0)).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">
                      {out.exitType === 'venta' ? `$${(out.quantity * (out.price || out.product?.salePrice || 0)).toFixed(2)}` : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="px-4 py-4 text-right">
                       <button onClick={() => handleSecureDelete('transaction', out.id)} className="text-slate-400 hover:text-red-500 transition"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                ))}
                {(!reportData?.detailedReports?.allOutflows || reportData.detailedReports.allOutflows.length === 0) && (
                  <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-400 italic">No hay salidas de inventario registradas en estas fechas</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History Tab Content */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in relative">
          {loading && (
             <div className="absolute inset-0 bg-white/50 z-10 flex justify-center items-center backdrop-blur-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
             </div>
          )}
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
              Auditoría de Movimientos
            </h2>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide sticky top-0 z-20">
                <tr>
                  <th className="px-6 py-4 font-bold border-b border-slate-200">Fecha y Hora</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-200">Producto</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-200">Motivo</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-200 text-right">Cantidad</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-200 text-right">Precio Unit.</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-200 text-right">Subtotal</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-200">Ref. Pago</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-200">Destino / Cliente</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-200 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyData.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(tx.createdAt || tx.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} <br/>
                      <span className="text-xs text-slate-400">{new Date(tx.createdAt || tx.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{tx.product?.name || 'Producto Eliminado'}</p>
                      <p className="text-xs text-slate-400">{tx.product?.category || ''}</p>
                    </td>
                    <td className="px-6 py-4">
                      {getReasonBadge(tx.type, tx.exitType)}
                    </td>
                    <td className={`px-6 py-4 text-right font-black ${tx.type === 'IN' || tx.type === 'entrada' ? 'text-blue-600' : 'text-slate-700'}`}>
                      {tx.type === 'IN' || tx.type === 'entrada' ? '+' : '-'}{tx.quantity}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-slate-600">
                      ${(tx.price || tx.product?.salePrice || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-800">
                      ${(tx.quantity * (tx.price || tx.product?.salePrice || 0)).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {tx.room ? (
                        <span className="flex items-center gap-1"><Home className="w-3 h-3 text-emerald-600" /> Hab. {tx.room.roomNumber}</span>
                      ) : tx.customer ? (
                        <span className="flex items-center gap-1 text-indigo-600 font-medium">{tx.customer.name}</span>
                      ) : (
                        <span className="text-slate-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {tx.transferReference ? (
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">#{tx.transferReference}</span>
                      ) : (
                        <span className="text-slate-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {tx.notes && <p className="text-xs text-slate-400 mt-1">{tx.notes}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleSecureDelete('transaction', tx.id)} className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50" title="Eliminar Movimiento (Revertir Stock)">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {historyData.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                      <List className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      No se encontraron movimientos en este rango de fechas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Canjes y Ganancias Brutas */}
      {activeTab === 'canjes' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-5 border-b border-slate-100 bg-amber-50">
               <h2 className="font-bold text-amber-800 flex items-center gap-2 text-lg">
                 🤝 Historial de Canjes y Beneficio Bruto
               </h2>
               <p className="text-xs text-amber-600 mt-1">Intercambio de inventario por comida/servicios y el margen a favor.</p>
             </div>
             <table className="w-full text-left">
               <thead className="bg-amber-50/50 text-slate-500 text-[10px] uppercase tracking-wider">
                 <tr>
                   <th className="px-6 py-4 font-bold border-b border-slate-200">Fecha</th>
                   <th className="px-6 py-4 font-bold border-b border-slate-200">Producto Entregado</th>
                   <th className="px-6 py-4 font-bold border-b border-slate-200 text-center">Cant.</th>
                   <th className="px-6 py-4 font-bold border-b border-slate-200 text-right">Costo Interno</th>
                   <th className="px-6 py-4 font-bold border-b border-slate-200 text-right">Valor Recibido</th>
                   <th className="px-6 py-4 font-bold border-b border-slate-200 text-right">Ganancia Bruta</th>
                   <th className="px-6 py-4 font-bold border-b border-slate-200">Detalle</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {historyData.filter(tx => tx.exitType === 'canje').map((tx) => {
                    const cost = tx.quantity * (tx.product?.purchasePrice || 0);
                    const received = tx.price || 0;
                    const profit = received - cost;
                    return (
                     <tr key={tx.id} className="hover:bg-slate-50 transition">
                       <td className="px-6 py-4 text-sm text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                       <td className="px-6 py-4 font-bold text-slate-800">{tx.product?.name}</td>
                       <td className="px-6 py-4 text-center font-bold text-slate-600">{tx.quantity}</td>
                       <td className="px-6 py-4 text-right text-sm text-rose-600 font-medium">${cost.toFixed(2)}</td>
                       <td className="px-6 py-4 text-right font-black text-emerald-600">${received.toFixed(2)}</td>
                       <td className={`px-6 py-4 text-right font-black ${profit >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>
                         {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                       </td>
                       <td className="px-6 py-4 text-xs italic text-slate-500 max-w-[200px] truncate">{tx.notes || '-'}</td>
                     </tr>
                    );
                 })}
                 {historyData.filter(tx => tx.exitType === 'canje').length === 0 && (
                   <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-400 italic">No hay canjes registrados en estas fechas.</td></tr>
                 )}
               </tbody>
             </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
