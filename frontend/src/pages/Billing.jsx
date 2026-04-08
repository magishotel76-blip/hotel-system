import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { 
  FileText, Plus, Search, CheckCircle, Clock, Eye, Download, Printer 
} from 'lucide-react';
import html2pdf from 'html2pdf.js';

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedResId, setSelectedResId] = useState('');
  
  // Template Editing State
  const printRef = useRef();
  
  const [billData, setBillData] = useState({
    invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
    razonSocial: '',
    ruc: '',
    fecha: new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
    direccion: '',
    correo: '',
    telefono: '',
    firma1: 'Javier Samaniego / Jefferson Haro',
    cargo1: 'Supervisor',
    entidad1: 'HOTEL CAJOYAM',
    firma2: 'CLIENTE',
    reservationId: null,
    items: []
  });

  const [dateRange, setDateRange] = useState('Del 01 al 31 de Enero del 2026');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, reservationsRes, customersRes] = await Promise.all([
        api.get('/billing'),
        api.get('/reservations'),
        api.get('/customers')
      ]);
      setInvoices(invoicesRes.data);
      setReservations(reservationsRes.data.filter(r => r.status === 'activa'));
      setCustomers(customersRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectReservation = async (resId) => {
    setSelectedResId(resId);
    if (!resId) return;

    try {
      setLoading(true);
      const res = await api.get(`/billing/pending/${resId}`);
      const { reservation, nights, pendingTransactions } = res.data;

      // Group consumptions by name/price
      const itemsMap = {};
      pendingTransactions.forEach(t => {
        const key = `${t.product.name}-${t.price}`;
        if (itemsMap[key]) {
          itemsMap[key].cantidad += t.quantity;
        } else {
          itemsMap[key] = {
            cantidad: t.quantity,
            detalle: t.product.name,
            valorUnitario: t.price
          };
        }
      });

      const consumptionItems = Object.values(itemsMap);
      
      const newItems = [
        { 
          cantidad: nights, 
          detalle: `Servicio de Hospedaje - Hab. ${reservation.room.roomNumber}`, 
          valorUnitario: reservation.totalPrice / Math.max(1, (new Date(reservation.checkOutDate) - new Date(reservation.checkInDate)) / (1000 * 60 * 60 * 24)) || reservation.room.pricePerNight 
        },
        ...consumptionItems
      ];

      setBillData({
        ...billData,
        reservationId: reservation.id,
        razonSocial: reservation.customer.name,
        ruc: reservation.customer.document,
        direccion: reservation.customer.address || '',
        correo: reservation.customer.email || '',
        telefono: reservation.customer.phone || '',
        firma2: reservation.customer.name,
        items: newItems
      });

      setDateRange(`Del ${new Date(reservation.checkInDate).toLocaleDateString()} al ${new Date().toLocaleDateString()}`);
      setIsModalOpen(true);
    } catch (error) {
      console.error(error);
      alert('Error cargando cargos pendientes');
    } finally {
      setLoading(false);
    }
  };

  const saveInvoice = async () => {
    try {
      setLoading(true);
      const payload = {
        reservationId: billData.reservationId,
        items: billData.items.map(i => ({
          type: i.detalle.includes('Hospedaje') ? 'habitacion' : 'producto',
          description: i.detalle,
          quantity: i.cantidad,
          unitPrice: i.valorUnitario
        }))
      };
      await api.post('/billing', payload);
      fetchData();
      setIsModalOpen(false);
      alert('Prefactura guardada exitosamente');
    } catch (error) {
      console.error(error);
      alert('Error guardando factura');
    } finally {
      setLoading(false);
    }
  };

  const handlePdfGenerate = () => {
    const element = printRef.current;
    const opt = {
      margin: 0.5,
      filename: `Prefactura_${billData.invoiceNo}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const calculateSubtotal = () => {
    return billData.items.reduce((acc, item) => acc + (item.cantidad * item.valorUnitario), 0);
  };

  const subtotal = calculateSubtotal();
  const iva = subtotal * 0.15;
  const total = subtotal + iva;

  const handleItemChange = (index, field, value) => {
    const newItems = [...billData.items];
    newItems[index][field] = field === 'detalle' ? value : parseFloat(value) || 0;
    setBillData({ ...billData, items: newItems });
  };

  const addItem = () => {
    setBillData({
      ...billData,
      items: [...billData.items, { cantidad: 1, detalle: 'Nuevo ítem', valorUnitario: 0.00 }]
    });
  };

  const removeItem = (index) => {
    const newItems = billData.items.filter((_, i) => i !== index);
    setBillData({ ...billData, items: newItems });
  };

  const handlePayInvoice = async (id) => {
    try {
      await api.put(`/billing/${id}/pay`);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Facturación & Liquidación</h1>
          <p className="text-slate-500 mt-1">Generación de cuentas por cobrar y prefacturas corporativas</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <select 
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-w-[250px]"
              value={selectedResId}
              onChange={(e) => handleSelectReservation(e.target.value)}
            >
              <option value="">Seleccionar Reserva Activa...</option>
              {reservations.map(res => (
                <option key={res.id} value={res.id}>
                  Hab. {res.room?.roomNumber} - {res.customer?.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Crear Manual</span>
          </button>
        </div>
      </div>

      {/* Historial de Facturas */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Cuentas por Cobrar / Historial</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Factura #</th>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Monto</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && invoices.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Cargando registros...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No hay facturas registradas</td></tr>
              ) : (
                invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono font-bold text-indigo-600">{inv.id.substring(0,8).toUpperCase()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-700">{inv.reservation?.customer?.name || 'Cliente Externo'}</div>
                    <div className="text-xs text-slate-400">Hab. {inv.reservation?.room?.roomNumber || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">${inv.totalAmount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      inv.status === 'pagada' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                     {inv.status === 'borrador' && (
                        <button 
                          onClick={() => handlePayInvoice(inv.id)} 
                          className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm transition"
                        >
                          LIQUIDAR CUENTA
                        </button>
                      )}
                      <button className="p-2 text-slate-400 hover:text-indigo-600 transition" title="Ver Detalle">
                        <Eye className="w-4 h-4" />
                      </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL GENERADOR DE PLANTILLA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center p-4 z-50 overflow-y-auto pt-10 pb-10">
          <div className="bg-gray-200 rounded-xl w-full max-w-5xl overflow-hidden flex flex-col shadow-2xl relative">
            
            {/* Toolbar */}
            <div className="bg-slate-800 text-white p-4 flex justify-between items-center sticky top-0 z-10 shadow-lg top-toolbar">
               <div>
                 <h3 className="font-bold">Editor de Plantilla: Joya Amazónica</h3>
                 <p className="text-xs text-slate-400">Edita los campos directamente haciendo clic sobre ellos o añade ítems.</p>
               </div>
               <div className="flex space-x-3">
                 <button onClick={addItem} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded flex items-center text-sm font-medium transition">
                   <Plus className="w-4 h-4 mr-1"/> Añadir Fila
                 </button>
                 <button onClick={saveInvoice} className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 rounded flex items-center text-sm font-medium transition shadow-lg border border-emerald-600/20">
                    <CheckCircle className="w-4 h-4 mr-1"/> Guardar en Sistema
                 </button>
                 <button onClick={handlePdfGenerate} className="px-3 py-2 bg-indigo-500 hover:bg-indigo-400 rounded flex items-center text-sm font-medium transition shadow">
                   <Download className="w-4 h-4 mr-1"/> Generar PDF
                 </button>
                 <button onClick={() => setIsModalOpen(false)} className="px-3 py-2 text-rose-400 hover:text-rose-300 font-bold ml-2">Cerrar</button>
               </div>
            </div>

            {/* A4 Paper Container */}
            <div className="p-8 pb-16 flex justify-center bg-gray-200 overflow-y-auto">
              {/* Paper Element that gets printed */}
              <div 
                ref={printRef} 
                className="bg-white shadow-xl a4-paper text-[11px] text-black font-sans w-[210mm] min-h-[297mm] h-auto p-[1cm] border border-gray-300 relative"
              >
                {/* Header Row */}
                <div className="flex border border-black mb-4 h-[100px]">
                  <div className="w-1/3 border-r border-black flex items-center justify-center p-2">
                    <div className="text-center font-bold text-amber-700 leading-tight">
                       <span className="text-2xl font-serif">CMZ</span><br/>
                       <span className="text-green-800 text-sm tracking-widest">JOYA AMAZÓNICA</span><br/>
                       <span className="font-signature text-amber-600 italic">Cajoyam</span>
                    </div>
                  </div>
                  <div className="w-2/3 p-2 text-[10px] flex flex-col justify-center leading-snug">
                     <p className="font-bold text-[#003366]">CATERING JOYA AMAZONICA CAJOYAM S.A.S</p>
                     <p>RUC: <span className="font-bold text-sm">229033539947001</span></p>
                     <p>Dir: Calle: JUMANDY y AVENIDA FUNDADORES / Sacha</p>
                     <p>Email: <span className="text-blue-600 underline">hotel_cajoyam@joyachef.com</span></p>
                  </div>
                </div>

                {/* Client Info Row */}
                <div className="flex border border-black mb-4">
                  <div className="w-2/3 border-r border-black">
                    <div className="border-b border-black flex"><div className="w-1/4 p-1 font-bold">RAZÓN SOCIAL:</div><input className="w-3/4 p-1 outline-none bg-transparent" value={billData.razonSocial} onChange={e=>setBillData({...billData, razonSocial: e.target.value})} /></div>
                    <div className="border-b border-black flex"><div className="w-1/4 p-1 font-bold">RUC:</div><input className="w-3/4 p-1 outline-none bg-transparent" value={billData.ruc} onChange={e=>setBillData({...billData, ruc: e.target.value})} /></div>
                    <div className="border-b border-black flex"><div className="w-1/4 p-1 font-bold">FECHA:</div><input className="w-3/4 p-1 outline-none bg-transparent" value={billData.fecha} onChange={e=>setBillData({...billData, fecha: e.target.value})} /></div>
                    <div className="border-b border-black flex"><div className="w-1/4 p-1 font-bold">DIRECCIÓN:</div><input className="w-3/4 p-1 outline-none bg-transparent" value={billData.direccion} onChange={e=>setBillData({...billData, direccion: e.target.value})} /></div>
                    <div className="border-b border-black flex"><div className="w-1/4 p-1 font-bold">CORREO:</div><input className="w-3/4 p-1 outline-none bg-transparent text-blue-600 underline" value={billData.correo} onChange={e=>setBillData({...billData, correo: e.target.value})} /></div>
                    <div className="flex"><div className="w-1/4 p-1 font-bold">TELÉFONO:</div><input className="w-3/4 p-1 outline-none bg-transparent" value={billData.telefono} onChange={e=>setBillData({...billData, telefono: e.target.value})} /></div>
                  </div>
                  <div className="w-1/3 flex flex-col justify-center items-center p-2 text-center bg-blue-50/20">
                     <div className="text-[16px] font-bold text-[#003366] tracking-wide">PREFACTURA</div>
                     <input className="text-red-600 font-bold text-center outline-none bg-transparent w-full" value={billData.invoiceNo} onChange={e=>setBillData({...billData, invoiceNo: e.target.value})} />
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full border-collapse border border-black text-center mb-6">
                  <thead>
                    <tr className="border-b border-black bg-gray-50 uppercase text-[10px]">
                       <th className="border-r border-black p-2 w-[12%]">CANTIDAD</th>
                       <th className="border-r border-black p-2 w-[55%] font-medium">DETALLE</th>
                       <th className="border-r border-black p-2 w-[15%]">VALOR<br/>UNITARIO</th>
                       <th className="p-2 w-[18%]">SUBTOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billData.items.map((item, index) => (
                      <tr key={index} className="border-b border-black group relative">
                        <td className="border-r border-black p-1 font-bold relative">
                           <input type="number" className="w-full text-center outline-none" value={item.cantidad} onChange={(e)=>handleItemChange(index, 'cantidad', e.target.value)}/>
                           <button onClick={()=>removeItem(index)} className="absolute -left-6 top-1/2 -translate-y-1/2 text-rose-500 opacity-0 group-hover:opacity-100 no-print" title="Remover">&times;</button>
                        </td>
                        <td className="border-r border-black p-1 text-left px-2">
                           <input type="text" className="w-full outline-none" value={item.detalle} onChange={(e)=>handleItemChange(index, 'detalle', e.target.value)}/>
                        </td>
                        <td className="border-r border-black p-1">
                           <div className="flex justify-between px-1"><span>$</span><input type="number" step="0.01" className="w-12 text-right outline-none" value={item.valorUnitario} onChange={(e)=>handleItemChange(index, 'valorUnitario', e.target.value)}/></div>
                        </td>
                        <td className="p-1">
                           <div className="flex justify-between px-4"><span>$</span><span>{(item.cantidad * item.valorUnitario).toLocaleString('en-US',{minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>
                        </td>
                      </tr>
                    ))}
                    {/* Empty Rows Fill to match template height roughly */}
                    {Array.from({length: Math.max(0, 10 - billData.items.length)}).map((_, i) => (
                      <tr key={`empty-${i}`} className="border-b border-black h-7"><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td></td></tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals Section */}
                <div className="flex justify-between mb-16">
                   <div className="w-[48%] border border-black p-2">
                     <p className="font-bold">Servicio de CATERING</p>
                     <p className="font-bold">HOTEL CAJOYAM</p>
                     <input className="w-full font-bold text-[10px] mt-8 outline-none" value={dateRange} onChange={(e)=>setDateRange(e.target.value)} />
                   </div>
                   
                   <div className="w-[48%]">
                     <table className="w-full border-collapse border border-black text-left">
                       <tbody>
                         <tr className="border-b border-black">
                            <td className="p-2 w-[40%]">SubTotal</td>
                            <td className="p-2 border-l border-black w-[60%] flex justify-between pr-4 font-mono font-medium"><span>$</span><span>{subtotal.toLocaleString('en-US',{minimumFractionDigits:2, maximumFractionDigits:2})}</span></td>
                         </tr>
                         <tr className="border-b border-black">
                            <td className="p-2">IVA 15%</td>
                            <td className="p-2 border-l border-black flex justify-between pr-4 font-mono font-medium"><span>$</span><span>{iva.toLocaleString('en-US',{minimumFractionDigits:2, maximumFractionDigits:2})}</span></td>
                         </tr>
                         <tr className="font-bold">
                            <td className="p-2">Total Factura</td>
                            <td className="p-2 border-l border-black flex justify-between pr-4 font-mono text-[12px]"><span>$</span><span>{total.toLocaleString('en-US',{minimumFractionDigits:2, maximumFractionDigits:2})}</span></td>
                         </tr>
                       </tbody>
                     </table>
                   </div>
                </div>

                {/* Signatures */}
                <div className="flex justify-between w-full mt-auto pt-10 px-4 absolute bottom-12 left-0 right-0">
                  <div className="w-[45%] flex flex-col items-center">
                    <div className="border-b border-black mb-1 w-4/5"></div>
                    <input className="font-bold italic text-center outline-none bg-transparent w-full" value={billData.firma1} onChange={e=>setBillData({...billData, firma1: e.target.value})} />
                    <input className="font-bold italic text-center outline-none bg-transparent w-full" value={billData.cargo1} onChange={e=>setBillData({...billData, cargo1: e.target.value})} />
                    <input className="font-bold italic text-center outline-none bg-transparent w-full" value={billData.entidad1} onChange={e=>setBillData({...billData, entidad1: e.target.value})} />
                  </div>
                  <div className="w-[45%] flex flex-col items-center">
                    <div className="border-b border-black mb-1 w-4/5"></div>
                    <input className="font-bold italic text-center outline-none bg-transparent w-full" value={billData.firma2 !== 'CLIENTE' ? billData.firma2 : (billData.razonSocial || 'CLIENTE')} onChange={e=>setBillData({...billData, firma2: e.target.value})} />
                  </div>
                </div>

              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Internal CSS for printing adjustments */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print { display: none !important; }
        }
      `}} />

    </div>
  );
}
