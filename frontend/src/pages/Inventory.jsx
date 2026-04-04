import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import api from '../services/api';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Plus, Maximize, Edit2, Search, ArrowRightLeft, ShoppingCart, Archive, LayoutGrid, List, UploadCloud, CheckCircle, BedDouble, X, ClipboardList, AlertTriangle, Clock, DollarSign } from 'lucide-react';

// Helper: get stock status
const getStockStatus = (stock, minStock) => {
  if (stock <= 0) return { label: 'Agotado', color: 'bg-red-100 text-red-700', icon: '🔴' };
  if (stock <= minStock) return { label: 'Bajo Stock', color: 'bg-amber-100 text-amber-700', icon: '🟡' };
  return { label: 'Normal', color: 'bg-emerald-100 text-emerald-700', icon: '🟢' };
};

// Helper: get expiration status
const getExpirationStatus = (expirationDate) => {
  if (!expirationDate) return null;
  const now = new Date();
  const exp = new Date(expirationDate);
  const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Vencido', color: 'bg-red-100 text-red-700 border border-red-200', days: diffDays };
  if (diffDays <= 30) return { label: `Vence en ${diffDays}d`, color: 'bg-amber-100 text-amber-700 border border-amber-200', days: diffDays };
  return { label: `Vence en ${diffDays}d`, color: 'bg-slate-100 text-slate-500', days: diffDays };
};

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
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'grid' or 'table'
  
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  
  // Drawers state
  const [activeDrawer, setActiveDrawer] = useState(null); // 'product' | 'transaction' | 'upload' | null
  
  const closeDrawer = () => setActiveDrawer(null);

  const [editingId, setEditingId] = useState(null);
  const [productForm, setProductForm] = useState({
    barcode: '', name: '', purchasePrice: '', salePrice: '', stock: '0', category: '', minStock: '5', expirationDate: '', isSellable: true, unit: 'unidad'
  });
  const [formError, setFormError] = useState('');
  const [productMovements, setProductMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const [allTransactions, setAllTransactions] = useState([]);
  const [selectedTransactionGroup, setSelectedTransactionGroup] = useState(null);

  const [transactionForm, setTransactionForm] = useState({
    productId: '', type: 'salida', exitType: 'venta', quantity: 1, roomId: '', customerId: '', notes: '',
    paymentMethod: 'cash', transferReference: '', price: ''
  });

  const [activeRooms, setActiveRooms] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Batch withdrawal state (UserForm)
  const [batchItems, setBatchItems] = useState([]);
  const [batchSearchTerm, setBatchSearchTerm] = useState('');
  const [batchNotes, setBatchNotes] = useState('Uso Operativo / Cocina');
  const [batchExitType, setBatchExitType] = useState('uso_interno');
  const [batchPrice, setBatchPrice] = useState('');

  const [activeLoans, setActiveLoans] = useState([]);
  const [isLoanFormOpen, setIsLoanFormOpen] = useState(false);
  const [loanSearchTerm, setLoanSearchTerm] = useState('');
  const [loanForm, setLoanForm] = useState({ productId: '', type: 'salida', quantity: 1, notes: '' });

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [detectedProducts, setDetectedProducts] = useState([]); // Will now hold generic rows arrays []
  const [columnMappings, setColumnMappings] = useState({}); // Stores { colIndex: 'fieldType' }

  const [invoiceProvider, setInvoiceProvider] = useState('');
  const [invoiceCategory, setInvoiceCategory] = useState('');
  const [invoicePaymentMethod, setInvoicePaymentMethod] = useState('office'); // default to office
  const [invoiceTransferReference, setInvoiceTransferReference] = useState('');
  const [isSellableMap, setIsSellableMap] = useState({}); // { rowIndex: boolean }

  // Derived categories for autocomplete - Memoized for performance
  const existingCategories = useMemo(() => {
    return Array.isArray(products) ? [...new Set(products.map(p => p.category).filter(Boolean))] : [];
  }, [products]); 

  // Max Columns calculation - Memoized
  const maxCols = useMemo(() => {
    if (!Array.isArray(detectedProducts) || detectedProducts.length === 0) return 1;
    return Math.min(20, detectedProducts.reduce((max, r) => Math.max(max, Array.isArray(r) ? r.length : 0), 1));
  }, [detectedProducts]);

  // Computed total of the detected products based on mapping - Memoized
  const invoiceTotal = useMemo(() => {
    if (!Array.isArray(detectedProducts)) return 0;
    return detectedProducts.reduce((sum, row) => {
      if (!Array.isArray(row)) return sum;
      let qty = 0;
      let price = 0;
      Object.entries(columnMappings).forEach(([idx, role]) => {
        const rawVal = row[idx];
        if (!rawVal) return;
        
        if (role === 'quantity') {
          const val = String(rawVal).replace(/[^\d.,-]/g, '').replace(',', '.');
          qty = parseFloat(val) || 0;
        }
        if (role === 'purchasePrice') {
          const val = String(rawVal).replace(/[^\d.,-]/g, '').replace(',', '.');
          price = parseFloat(val) || 0;
        }
      });
      return sum + (qty * price);
    }, 0);
  }, [detectedProducts, columnMappings]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [productsRes, roomsRes, custRes, loansRes] = await Promise.all([
        api.get('/inventory/products'),
        api.get('/rooms'),
        api.get('/customers'),
        api.get('/inventory/transactions?exitType=prestamo')
      ]);
      setProducts(productsRes.data);
      setActiveRooms(roomsRes.data.filter(r => r.status === 'ocupada'));
      setCustomers(custRes.data);
      setActiveLoans(loansRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTransactions = async () => {
    try {
      const { data } = await api.get('/inventory/transactions');
      setAllTransactions(data);
    } catch (error) {
      console.error('Error fetching generic transactions', error);
    }
  };

  const handleTransactionClick = (trans) => {
    // Group logic: same notes AND within 5 minutes (300000ms) of each other
    const baseTime = new Date(trans.createdAt).getTime();
    const group = allTransactions.filter(t => 
       t.notes === trans.notes && 
       Math.abs(new Date(t.createdAt).getTime() - baseTime) <= 300000
    );
    setSelectedTransactionGroup(group.length > 0 ? group : [trans]);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const filteredProducts = products.filter(p => 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchTerm))) &&
    p.category?.trim().toUpperCase() !== 'COMIDA'
  );

  const groupedProducts = useMemo(() => {
    const groups = {};
    filteredProducts.forEach(p => {
      const cat = (p.category || 'GENERAL').toUpperCase();
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    
    return Object.keys(groups).sort((a, b) => {
      if (a === 'MARISCOS') return -1;
      if (b === 'MARISCOS') return 1;
      if (a === 'RES') return -1;
      if (b === 'RES') return 1;
      return a.localeCompare(b);
    }).reduce((obj, key) => {
      obj[key] = groups[key];
      return obj;
    }, {});
  }, [filteredProducts]);

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/inventory/products/${editingId}`, productForm);
      } else {
        await api.post('/inventory/products', productForm);
      }
      closeDrawer();
      fetchInitialData();
    } catch (error) {
      setFormError(error.response?.data?.message || 'Error guardando producto');
      // No cerramos el drawer para que el usuario pueda corregir
    }
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...transactionForm };
      if (payload.exitType === 'canje' && payload.price) {
        payload.price = (parseFloat(payload.price) / payload.quantity).toString();
      }
      
      // Forzar pago de oficina para usos internos o cambios (no afecta caja efectiva)
      if (payload.type === 'salida' && (payload.exitType === 'uso_interno' || payload.exitType === 'cambio')) {
        payload.paymentMethod = 'office';
      }

      await api.post('/inventory/transactions', payload);
      closeDrawer();
      setTransactionForm({ 
        productId: '', type: 'salida', exitType: 'venta', quantity: 1, roomId: '', customerId: '', notes: '',
        paymentMethod: 'cash', transferReference: '', price: ''
      });
      fetchInitialData();
      alert('Transacción registrada exitosamente. Si fue venta de habitación, se añadió a la prefactura.');
    } catch (error) {
      alert(error.response?.data?.message || 'Error en la transacción');
    }
  };

  const openTransactionDrawer = (product, defaultType = 'salida') => {
    setTransactionForm({
      ...transactionForm,
      productId: product.id,
      type: defaultType,
      quantity: 1,
      paymentMethod: 'cash',
      transferReference: ''
    });
    setActiveDrawer('transaction');
  };

  const openProductDrawer = async (product = null) => {
    if (product) {
       setProductForm({
         barcode: product.barcode || '', name: product.name, purchasePrice: product.purchasePrice, 
         salePrice: product.salePrice, stock: product.stock, category: product.category || '',
         minStock: product.minStock ?? 5, expirationDate: product.expirationDate ? product.expirationDate.substring(0, 10) : '',
         isSellable: product.isSellable ?? true,
         unit: product.unit || 'unidad'
       });
       setEditingId(product.id);
       
       // Fetch last 5 movements
       setLoadingMovements(true);
       try {
         const { data } = await api.get(`/inventory/transactions?productId=${product.id}&limit=5`);
         setProductMovements(data);
       } catch (error) {
         console.error('Error fetching movements:', error);
         setProductMovements([]);
       } finally {
         setLoadingMovements(false);
       }
    } else {
       setProductForm({ barcode: '', name: '', purchasePrice: '', salePrice: '', stock: '0', category: '', minStock: '5', expirationDate: '', isSellable: true, unit: 'unidad' });
       setEditingId(null);
       setProductMovements([]);
    }
    setFormError(''); // Reset error when opening
    setActiveDrawer('product');
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('invoice', selectedFile);

    try {
      setUploading(true);
      const { data } = await api.post('/inventory/upload-invoice', formData);
      setDetectedProducts(data.tableRows || []);
      setColumnMappings({}); // Reset mappings upon new upload
      setInvoiceProvider('');
      setInvoiceCategory('');
      setInvoiceTransferReference('');
    } catch (error) {
      alert('Axios Error: ' + error.message + ' | Details: ' + JSON.stringify(error.response?.data || 'No response body'));
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const confirmDetectedProducts = async () => {
    // Check if critical columns have been mapped
    const definedColumns = Object.values(columnMappings).filter(val => val !== 'ignore');
    if (!definedColumns.includes('name') || !definedColumns.includes('quantity')) {
      return alert('Debes asignar al menos una columna de Nombre y una columna de Cantidad usando los selectores dorados superiores para continuar.');
    }

    // Build the products payload based on the mapping
    const structuredProducts = detectedProducts.map((row, rowIndex) => {
      const productData = { 
        category: 'General',
        isSellable: isSellableMap[rowIndex] !== undefined ? isSellableMap[rowIndex] : true
      }; 
      Object.entries(columnMappings).forEach(([colIndex, fieldType]) => {
        if (fieldType !== 'ignore' && row[colIndex]) {
           const valRegex = row[colIndex].replace(/[^\d.,]/g, '').replace(',', '.'); // Cleanup numbers
           if (fieldType === 'quantity') productData.quantity = parseInt(valRegex) || 0;
           else if (fieldType === 'purchasePrice') productData.purchasePrice = parseFloat(valRegex) || 0;
           else if (fieldType === 'salePrice') productData.salePrice = parseFloat(valRegex) || 0;
           else if (fieldType === 'expirationDate') productData.expirationDate = row[colIndex];
           else productData[fieldType] = row[colIndex].trim();
        }
      });
      return productData;
    }).filter(p => p.name && p.quantity > 0); // Discard unmapped or unparsable rows

    if (structuredProducts.length === 0) {
      return alert('No hay filas válidas extraídas con ese mapeo.');
    }

    try {
      const payload = {
        products: structuredProducts,
        provider: invoiceProvider,
        category: invoiceCategory,
        paymentMethod: invoicePaymentMethod,
        totalCost: invoiceTotal,
        transferReference: invoiceTransferReference
      };

      await api.post('/inventory/transactions/import-pdf', payload);
      alert('Productos importados/actualizados correctamente');
      setDetectedProducts([]);
      setColumnMappings({});
      setInvoiceProvider('');
      setInvoiceCategory('');
      setInvoiceTransferReference('');
      setActiveDrawer(null);
      fetchInitialData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error importando productos de la factura');
    }
  };

  const updateDetectedProduct = (rowIndex, colIndex, value) => {
    const newRows = [...detectedProducts];
    newRows[rowIndex][colIndex] = value;
    setDetectedProducts(newRows);
  };

  const removeDetectedProduct = (index) => {
    const newRows = detectedProducts.filter((_, i) => i !== index);
    setDetectedProducts(newRows);
  };

  const handleBatchItemAdd = (product) => {
    if (!batchItems.find(item => item.id === product.id)) {
      setBatchItems([...batchItems, { ...product, quantity: '' }]);
    }
  };

  const handleBatchItemRemove = (id) => {
    setBatchItems(batchItems.filter(item => item.id !== id));
  };

  const handleBatchItemQuantity = (id, quantity) => {
    setBatchItems(batchItems.map(item => item.id === id ? { ...item, quantity: quantity === '' ? '' : parseInt(quantity) } : item));
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    if (batchItems.length === 0) return alert('Agrega al menos un producto');
    
    const invalidItems = batchItems.filter(i => !i.quantity || isNaN(i.quantity) || i.quantity <= 0);
    if (invalidItems.length > 0) return alert('Por favor ingresa una cantidad válida mayor a 0 para todos los productos seleccionados.');
    
    let perItemPrice = undefined;
    if (batchExitType === 'canje') {
      if (!batchPrice || parseFloat(batchPrice) <= 0) return alert('Ingresa el valor total recibido por el canje.');
      if (!batchNotes || batchNotes === 'Uso Operativo / Cocina') return alert('Debes agregar notas justificando el canje (Ej. "Por 5 almuerzos").');
      
      const totalQuantity = batchItems.reduce((sum, item) => sum + parseInt(item.quantity), 0);
      perItemPrice = (parseFloat(batchPrice) / totalQuantity).toString();
    }
    
    try {
      await api.post('/inventory/transactions/bulk', {
        type: 'salida',
        exitType: batchExitType,
        notes: batchNotes,
        paymentMethod: (batchExitType === 'uso_interno' || batchExitType === 'cambio') ? 'office' : 'cash',
        items: batchItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          ...(perItemPrice && { price: perItemPrice })
        }))
      });
      closeDrawer();
      setBatchItems([]);
      setBatchNotes('Uso Operativo / Cocina');
      setBatchExitType('uso_interno');
      setBatchPrice('');
      fetchInitialData();
      alert('Salida múltiple registrada exitosamente.');
    } catch (error) {
      alert(error.response?.data?.message || 'Error en la salida múltiple');
    }
  };

  const handleLoanSubmit = async (e) => {
    e.preventDefault();
    if (!loanForm.productId) return alert('Debes seleccionar un producto.');
    if (!loanForm.notes) return alert('Debes agregar una referencia o nota.');
    try {
      await api.post('/inventory/transactions', {
        ...loanForm,
        exitType: 'prestamo'
      });
      fetchInitialData();
      setIsLoanFormOpen(false);
      setLoanSearchTerm('');
      setLoanForm({ productId: '', type: 'salida', quantity: 1, notes: '' });
      alert('Préstamo registrado exitosamente.');
    } catch (err) {
      alert(err.response?.data?.message || 'Error al registrar préstamo');
    }
  };

  const handleSettleLoan = async (id) => {
    if (!window.confirm('¿Confirmas que este préstamo ha sido saldado (devuelto o pagado)?')) return;
    try {
      await api.put(`/inventory/transactions/${id}/settle`);
      fetchInitialData();
    } catch(err) {
      alert(err.response?.data?.message || 'Error al saldar préstamo');
    }
  };

  const deleteProduct = async (id, name) => {
    if (window.confirm(`¿Estás seguro de eliminar el producto "${name}" y todo su historial?`)) {
      try {
        await api.delete(`/inventory/products/${id}`);
        fetchInitialData();
      } catch(error) {
        alert(error.response?.data?.message || 'Error al eliminar');
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventario Visual</h1>
          <p className="text-slate-500 mt-1">Gestión de stock, PDF y ventas</p>
        </div>
        <div className="flex flex-wrap gap-3">
           <button
            onClick={() => { fetchAllTransactions(); setSelectedTransactionGroup(null); setActiveDrawer('transactions_history'); }}
            className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition"
          >
            <Clock className="w-5 h-5 mr-2" />
            Historial Transacciones
          </button>
           <button
            onClick={() => setActiveDrawer('upload')}
            className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-xl hover:bg-indigo-100 transition"
          >
            <UploadCloud className="w-5 h-5 mr-2" />
            Cargar Factura PDF
          </button>
          <button
            onClick={() => setActiveDrawer('batch')}
            className="flex items-center px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 font-bold rounded-xl hover:bg-amber-100 transition"
          >
            <ClipboardList className="w-5 h-5 mr-2" />
            Salida Rápida (Cocina)
          </button>
          <button
            onClick={() => setActiveDrawer('loans')}
            className="flex items-center px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 font-bold rounded-xl hover:bg-purple-100 transition"
          >
            <ArrowRightLeft className="w-5 h-5 mr-2" />
            Control de Préstamos
          </button>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition"
          >
            <Maximize className="w-5 h-5 mr-2" />
            Scanner
          </button>
          <button
            onClick={() => openProductDrawer()}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Crear
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-shadow"
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
             <button 
               onClick={() => setViewMode('grid')} 
               className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
               title="Vista Cuadrícula">
               <LayoutGrid className="w-5 h-5" />
             </button>
             <button 
               onClick={() => setViewMode('table')} 
               className={`p-2 rounded-lg transition ${viewMode === 'table' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
               title="Vista Tabla">
               <List className="w-5 h-5" />
             </button>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Nombre</th>
                  <th className="px-6 py-4 font-medium text-center">Categoría</th>
                  <th className="px-6 py-4 font-medium text-center">Precio Venta</th>
                  <th className="px-6 py-4 font-medium text-center">Stock</th>
                  <th className="px-6 py-4 font-medium text-center">Estado</th>
                  <th className="px-6 py-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(groupedProducts).map(([category, products]) => (
                  <Fragment key={category}>
                    <tr className="bg-slate-50 border-y border-slate-100 italic">
                      <td colSpan="6" className="px-6 py-2 text-[10px] font-bold text-slate-500 uppercase">
                        {category} ({products.length})
                      </td>
                    </tr>
                    {products.map((p) => {
                      const stockStatus = getStockStatus(p.stock, p.minStock ?? 5);
                      const expStatus = getExpirationStatus(p.expirationDate);
                  return (
                  <tr key={p.id} className={`hover:bg-slate-50/50 transition ${p.stock <= 0 ? 'bg-red-50/30' : p.stock <= (p.minStock ?? 5) ? 'bg-amber-50/30' : ''}`}>
                    <td onClick={() => openProductDrawer(p)} className="cursor-pointer px-6 py-4 font-medium text-slate-800 hover:text-emerald-600">
                      <div className="flex items-center gap-2">
                        {p.name}
                        {!p.isSellable && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Interno</span>}
                      </div>
                      {expStatus && expStatus.days <= 30 && (
                        <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${expStatus.color}`}>
                          <Clock className="w-3 h-3" /> {expStatus.label}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-center">{p.category || 'N/A'}</td>
                    <td className="px-6 py-4 text-emerald-600 font-medium text-center">${p.salePrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                        {p.stock} {p.unit || 'unid'} / {p.minStock ?? 5}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${stockStatus.color}`}>
                        {stockStatus.icon} {stockStatus.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => openTransactionDrawer(p, 'salida')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition" title="Registrar Salida / Venta"><ShoppingCart className="w-5 h-5" /></button>
                      <button onClick={() => openTransactionDrawer(p, 'entrada')} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition" title="Registrar Entrada"><Archive className="w-5 h-5" /></button>
                      <button onClick={() => deleteProduct(p.id, p.name)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 rounded-lg transition" title="Eliminar Producto (Admin)"><Edit2 className="w-5 h-5 hidden" /> <span className="font-bold text-xs">DEL</span></button>
                    </td>
                  </tr>);
                })}
              </Fragment>
            ))}
          </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Object.entries(groupedProducts).map(([category, products]) => (
              <Fragment key={category}>
                <div className="col-span-full mt-4 mb-1 flex items-center">
                  <div className="h-px flex-1 bg-slate-100"></div>
                  <span className="mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{category}</span>
                  <div className="h-px flex-1 bg-slate-100"></div>
                </div>
                {products.map((p) => (
                  <div key={p.id} className="group relative bg-white border border-slate-200 rounded-2xl p-4 flex flex-col hover:border-emerald-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div onClick={() => openProductDrawer(p)} className="cursor-pointer flex-1 flex flex-col items-center text-center justify-center py-4">
                       <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                          p.category?.toUpperCase() === 'BEBIDAS' ? 'bg-blue-100 text-blue-500' :
                          p.category?.toUpperCase() === 'ALCOHOL' ? 'bg-amber-100 text-amber-500' :
                          p.category?.toUpperCase() === 'ALIMENTOS' ? 'bg-orange-100 text-orange-500' :
                          'bg-slate-100 text-slate-500'
                       }`}>
                         <Archive className="w-8 h-8 opacity-80" />
                       </div>
                       <h3 className="font-bold text-slate-800 text-sm leading-tight mb-1">{p.name}</h3>
                       <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">{p.category || 'General'}</span>
                    </div>
                    
                    <div className="mt-auto border-t border-slate-100 pt-3">
                       {(() => { const ss = getStockStatus(p.stock, p.minStock ?? 5); return ss.label !== 'Normal' ? (
                         <div className={`flex items-center gap-1 mb-2 px-2 py-1 rounded-lg text-[10px] font-bold ${ss.color}`}>
                           <AlertTriangle className="w-3 h-3" /> {ss.icon} {ss.label} (mín: {p.minStock ?? 5})
                         </div>
                       ) : null; })()}
                       <div className="flex justify-between items-end mb-3">
                         <div>
                           <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Stock</p>
                           <p className={`font-bold ${p.stock <= (p.minStock ?? 5) ? 'text-rose-600' : 'text-emerald-600'}`}>{p.stock} / {p.minStock ?? 5}</p>
                         </div>
                         <div className="text-right">
                           <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Precio</p>
                           <p className="font-bold text-slate-800">${p.salePrice.toFixed(2)}</p>
                         </div>
                       </div>
                       <div className="grid grid-cols-2 gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm pt-2">
                         <button onClick={() => openTransactionDrawer(p, 'salida')} className="flex items-center justify-center py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition font-medium text-xs">
                           <ShoppingCart className="w-3.5 h-3.5 mr-1"/> Uso
                         </button>
                         <button onClick={() => openTransactionDrawer(p, 'entrada')} className="flex items-center justify-center py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition font-medium text-xs">
                           <Plus className="w-3.5 h-3.5 mr-1"/> Stock
                         </button>
                       </div>
                    </div>
                  </div>
                ))}
              </Fragment>
            ))}
          </div>
        )}
      </div>

      {/* DRAWER: Product Form */}
      <Drawer isOpen={activeDrawer === 'product'} onClose={closeDrawer} title={editingId ? 'Editar Producto' : 'Crear Nuevo Producto'}>
        {formError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2 animate-shake">
            <AlertTriangle className="w-4 h-4" />
            {formError}
          </div>
        )}
        <form onSubmit={handleProductSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Código de Barras</label>
            <input type="text"
              value={productForm.barcode} onChange={e => setProductForm({...productForm, barcode: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Opcional" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Nombre del Producto</label>
            <input required type="text"
              value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Categoría</label>
            <input type="text"
              value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ej. Bebidas, Snacks" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Precio Compra</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input required type="number" step="0.01"
                  value={productForm.purchasePrice} onChange={e => setProductForm({...productForm, purchasePrice: e.target.value})}
                  className="w-full pl-7 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Precio Venta</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input required type="number" step="0.01"
                  value={productForm.salePrice} onChange={e => setProductForm({...productForm, salePrice: e.target.value})}
                  className="w-full pl-7 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {!editingId && (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Stock Inicial</label>
                <input type="number"
                  value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Stock Mínimo</label>
              <input type="number" min="0"
                value={productForm.minStock} onChange={e => setProductForm({...productForm, minStock: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Unidad de Medida</label>
                <select 
                  value={productForm.unit} 
                  onChange={e => setProductForm({...productForm, unit: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="unidad">Unidad(es)</option>
                  <option value="kg">Kilogramo(s)</option>
                  <option value="libra">Libra(s)</option>
                  <option value="quintal">Quintal(es)</option>
                  <option value="paquete">Paquete(s)</option>
                  <option value="litro">Litro(s)</option>
                  <option value="otro">Otro (Manual)</option>
                </select>
             </div>
             {productForm.unit === 'otro' || !['unidad', 'kg', 'libra', 'quintal', 'paquete', 'litro'].includes(productForm.unit) ? (
               <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Especificar Unidad</label>
                  <input 
                    type="text"
                    value={productForm.unit === 'otro' ? '' : productForm.unit}
                    onChange={e => setProductForm({...productForm, unit: e.target.value})}
                    placeholder="Ej: Gramos, Caja..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
               </div>
             ) : (
               <div className="flex items-center justify-center text-xs text-slate-400 font-medium">
                  Selección predefinida activa
               </div>
             )}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Fecha de Caducidad</label>
            <input type="date"
              value={productForm.expirationDate} onChange={e => setProductForm({...productForm, expirationDate: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>

          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
             <input 
               type="checkbox" 
               id="isSellable"
               checked={productForm.isSellable}
               onChange={e => setProductForm({...productForm, isSellable: e.target.checked})}
               className="w-5 h-5 accent-emerald-600 rounded"
             />
             <label htmlFor="isSellable" className="text-sm font-bold text-emerald-800 cursor-pointer">
               Producto disponible para la venta (POS / Restaurante)
               <p className="text-[10px] text-emerald-600 font-normal uppercase tracking-wide">Si se desmarca, solo se podrá usar para consumo interno (Cocina)</p>
             </label>
          </div>

          <div className="pt-6 my-6 border-t border-slate-100 flex justify-end gap-3 mt-auto">
            <button type="button" onClick={closeDrawer} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-sm">Guardar Producto</button>
          </div>
        </form>

        {/* Historial de Movimientos (solo si está editando) */}
        {editingId && (
          <div className="mt-8 border-t border-slate-200 pt-6 px-1">
            <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Últimos 5 Movimientos
            </h4>
            {loadingMovements ? (
              <p className="text-xs text-slate-400">Cargando movimientos...</p>
            ) : productMovements.length > 0 ? (
              <div className="space-y-3">
                {productMovements.slice(0, 5).map((mov, idx) => (
                  <div key={mov.id || idx} className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-sm">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${mov.type === 'entrada' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {mov.type === 'entrada' ? 'ENTRADA' : 'SALIDA'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{mov.exitType || 'AJUSTE'}</span>
                        {mov.paymentMethod === 'office' && <span className="bg-blue-100 text-blue-700 text-[9px] px-2 py-0.5 rounded-full font-bold">{mov.type === 'salida' ? 'PAGO PENDIENTE (POR COBRAR)' : 'COMPRA DE OFICINA'}</span>}
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">{mov.notes || 'Sin observación'}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-1 tracking-wider uppercase">{new Date(mov.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xl font-black ${mov.type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {mov.type === 'entrada' ? '+' : '-'}{mov.quantity}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mt-1 text-right">Cant.</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl border border-slate-100">No hay movimientos recientes para este producto.</p>
            )}
          </div>
        )}
      </Drawer>

      {/* DRAWER: Transactions History */}
      <Drawer isOpen={activeDrawer === 'transactions_history'} onClose={closeDrawer} title="Historial y Detalles de Transacciones" widthClass="max-w-xl">
         {selectedTransactionGroup ? (
           <div className="animate-[slideLeft_0.2s_ease-out]">
             <button onClick={() => setSelectedTransactionGroup(null)} className="mb-4 text-xs font-bold text-slate-500 hover:text-emerald-600 flex items-center transition">
               &larr; Volver a la lista
             </button>
             
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1">Detalles del Grupo / Operación</h4>
                <p className="text-xs text-slate-600 mb-3">{selectedTransactionGroup[0].notes || 'Sin notas'}</p>
                <div className="flex gap-2 text-[10px] font-bold">
                   <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-500">{new Date(selectedTransactionGroup[0].createdAt).toLocaleString()}</span>
                   <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-500">Items: {selectedTransactionGroup.length}</span>
                   {selectedTransactionGroup[0].paymentMethod && <span className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-emerald-700">Pago: {selectedTransactionGroup[0].paymentMethod}</span>}
                </div>
             </div>

             <h5 className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-3">Productos Afectados</h5>
             <div className="space-y-2">
               {selectedTransactionGroup.map((t) => (
                  <div key={t.id} className="bg-white border border-slate-100 rounded-xl p-3 flex justify-between items-center shadow-sm">
                     <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black ${t.type === 'entrada' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                           {t.type === 'entrada' ? '+' : '-'}
                        </div>
                        <div>
                           <p className="text-sm font-bold text-slate-800">{t.product?.name || 'Desconocido'}</p>
                           <p className="text-[10px] font-medium uppercase text-slate-400">Tipo: {t.exitType || 'General'}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className={`text-sm font-black ${t.type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.quantity} unids.</p>
                        <p className="text-[10px] text-slate-500 font-bold">${(t.price || t.product?.salePrice || 0).toFixed(2)}/u</p>
                     </div>
                  </div>
               ))}
             </div>
           </div>
         ) : (
           <div className="space-y-2">
             <p className="text-xs text-slate-500 mb-4 px-1">Haz clic en cualquier transacción para ver sus detalles o si agrupa varias operaciones (como una compra de múltiples productos por PDF).</p>
             {allTransactions.length > 0 ? allTransactions.map((t) => (
                <div 
                  key={t.id} 
                  onClick={() => handleTransactionClick(t)}
                  className="bg-white border border-slate-100 rounded-xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:border-emerald-300 hover:shadow transition group"
                >
                   <div className="max-w-[70%]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${t.type === 'entrada' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {t.type === 'entrada' ? 'ENTRADA' : 'SALIDA'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t.exitType || 'GENERAL'}</span>
                      </div>
                      <p className="text-xs text-slate-800 font-bold line-clamp-1 group-hover:text-emerald-700 transition">{t.product?.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{t.notes || 'Sin detalle'}</p>
                   </div>
                   <div className="text-right">
                      <p className={`text-lg font-black ${t.type === 'entrada' ? 'text-emerald-500' : 'text-rose-500'}`}>{t.type === 'entrada' ? '+' : '-'}{t.quantity}</p>
                      <p className="text-[9px] text-slate-400 font-bold tracking-wider mt-1">{new Date(t.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      <p className="text-[8px] text-slate-400 uppercase">{new Date(t.createdAt).toLocaleDateString()}</p>
                   </div>
                </div>
             )) : (
                <p className="text-center text-sm text-slate-500 py-6">No hay transacciones registradas.</p>
             )}
           </div>
         )}
      </Drawer>

      {/* DRAWER: Transaction */}
      <Drawer isOpen={activeDrawer === 'transaction'} onClose={closeDrawer} title={transactionForm.type === 'entrada' ? 'Ingreso de Mercadería' : 'Salida Comercial o Interna'}>
        <form onSubmit={handleTransactionSubmit} className="space-y-5">
           
           {/* Product Info Display */}
           {(() => {
             const prod = products.find(p => p.id === transactionForm.productId);
             if (!prod) return null;
             return (
               <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center mb-2 shadow-sm">
                 <div>
                   <h4 className="font-bold text-slate-800 text-lg">{prod.name}</h4>
                   <p className="text-xs font-medium text-slate-500 uppercase tracking-wide bg-slate-200 inline-block px-2 py-0.5 rounded-full mt-1">{prod.category || 'General'}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] uppercase font-bold text-slate-400">Stock Actual</p>
                   <p className={`text-2xl font-black ${prod.stock < 10 ? 'text-rose-500' : 'text-emerald-600'}`}>{prod.stock}</p>
                 </div>
               </div>
             );
           })()}

           <div className="grid grid-cols-2 gap-4 bg-slate-50 p-1 rounded-xl mb-4 border border-slate-200">
             <button type="button" onClick={()=>setTransactionForm({...transactionForm, type: 'entrada'})} className={`py-2 rounded-lg text-sm font-bold transition ${transactionForm.type === 'entrada' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}>ENTRADA</button>
             <button type="button" onClick={()=>setTransactionForm({...transactionForm, type: 'salida'})} className={`py-2 rounded-lg text-sm font-bold transition ${transactionForm.type === 'salida' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500'}`}>SALIDA</button>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Cantidad</label>
               <input type="number" required min="1"
                 value={transactionForm.quantity} onChange={e => setTransactionForm({...transactionForm, quantity: parseInt(e.target.value)})}
                 className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Método de Pago</label>
               <select 
                 value={transactionForm.paymentMethod} 
                 onChange={e => setTransactionForm({...transactionForm, paymentMethod: e.target.value})}
                 className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
               >
                 <option value="cash">Efectivo</option>
                 <option value="transfer">Transferencia</option>
                 <option value="office">{transactionForm.type === 'salida' ? 'Pago Pendiente / Por Cobrar' : 'Compra de Oficina'}</option>
               </select>
             </div>
           </div>

           {transactionForm.paymentMethod === 'transfer' && (
             <div className="animate-fade-in bg-indigo-50/30 p-3 rounded-xl border border-indigo-100 mb-4">
               <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Nº de Orden de Transferencia</label>
               <input 
                 type="text"
                 placeholder="Ej: 0012345"
                 value={transactionForm.transferReference}
                 onChange={e => setTransactionForm({...transactionForm, transferReference: e.target.value})}
                 className="w-full p-3 bg-white border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
               />
             </div>
           )}

           {transactionForm.type === 'salida' && (
             <div className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Motivo de Salida</label>
                 <select value={transactionForm.exitType} onChange={e => setTransactionForm({...transactionForm, exitType: e.target.value})}
                   className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                   <option value="venta">Venta a Habitación/Cliente</option>
                   <option value="uso_interno">Uso Interno Operativo</option>
                   <option value="cambio">Merma / Intercambio Simple</option>
                   <option value="canje">Canje por Comida/Servicios</option>
                   <option value="prestamo">Préstamo Interno a Terceros</option>
                 </select>
               </div>
               
               {transactionForm.exitType === 'canje' && (
                 <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 animate-fade-in space-y-3">
                   <p className="text-xs text-amber-700 font-medium">Registra el valor equivalente de lo que recibes a cambio (para calcular la ganancia del canje).</p>
                   <div>
                     <label className="block text-xs font-bold text-amber-800 mb-1.5 uppercase tracking-wide">Valor que recibes a cambio ($)</label>
                     <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 font-bold">$</span>
                       <input 
                         type="number" step="0.01" required
                         value={transactionForm.price} 
                         onChange={e => setTransactionForm({...transactionForm, price: e.target.value})}
                         className="w-full pl-7 p-3 bg-white border border-amber-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 text-amber-900 outline-none font-bold"
                         placeholder="Ej: 15.00"
                       />
                     </div>
                   </div>
                 </div>
               )}
               
               {transactionForm.exitType === 'venta' && (
                 <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                   <label className="block text-xs font-bold text-emerald-700 mb-2 uppercase tracking-wide flex items-center"><BedDouble className="w-4 h-4 mr-1"/> Cargar a Prefactura</label>
                   <select value={transactionForm.roomId} onChange={e => setTransactionForm({...transactionForm, roomId: e.target.value})}
                     className="w-full p-3 bg-white border border-emerald-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-emerald-900 outline-none font-medium">
                     <option value="">-- Consumo Al Paso (No facturar) --</option>
                     {activeRooms.map(r => <option key={r.id} value={r.id}>Habitación {r.roomNumber}</option>)}
                   </select>
                 </div>
               )}
             </div>
           )}

           <div>
             <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Notas y Observaciones {(transactionForm.exitType === 'canje' || transactionForm.exitType === 'prestamo') ? '(OBLIGATORIO)' : ''}</label>
             <textarea rows="3" required={transactionForm.exitType === 'canje' || transactionForm.exitType === 'prestamo'} value={transactionForm.notes} onChange={e => setTransactionForm({...transactionForm, notes: e.target.value})}
               className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
               placeholder={transactionForm.exitType === 'canje' ? 'Ej: Por 3 firmas de comida del cliente X' : transactionForm.exitType === 'prestamo' ? 'Ej: A Joya Chef (devuelven mañana)' : 'Destino, justificación del gasto, etc.'}></textarea>
           </div>

           <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
             <button type="button" onClick={closeDrawer} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition">Cancelar</button>
             <button type="submit" className={`px-5 py-2.5 text-sm font-medium text-white rounded-xl shadow-sm transition ${transactionForm.type === 'entrada' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
               Confirmar Transacción
             </button>
           </div>
        </form>
      </Drawer>

      {/* DRAWER: Upload Invoice PDF */}
      <Drawer isOpen={activeDrawer === 'upload'} onClose={closeDrawer} title="Carga Automática de Facturas PDF" widthClass="max-w-2xl">
        <div className="space-y-6">
          <p className="text-sm text-slate-600">Sube la factura de tu proveedor (Súpermaxi, Tía, Proveedor Local) en formato PDF. El sistema extraerá los productos compatibles para reabastecer el inventario más rápido.</p>
          
          <form onSubmit={handleFileUpload} className="relative border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-2xl p-8 text-center hover:bg-indigo-50/60 transition group">
            <input type="file" accept="application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-0" onChange={e => {
                if(e.target.files && e.target.files.length > 0) {
                  setSelectedFile(e.target.files[0]);
                  setDetectedProducts([]);
                }
            }} />
            <div className="relative z-10 pointer-events-none">
              <UploadCloud className="w-12 h-12 text-indigo-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="text-indigo-900 font-bold mb-1">
                {selectedFile ? selectedFile.name : 'Arrastra un archivo PDF o haz clic aquí'}
              </h4>
              <p className="text-xs text-indigo-500 font-medium">Solo archivos PDF (Max 5MB)</p>
            </div>
            {selectedFile && (
              <button disabled={uploading} type="submit" className="relative z-20 mt-4 bg-indigo-600 text-white font-bold py-2 px-6 rounded-xl hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center">
                {uploading ? (
                  <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>Analizando OCR...</>
                ) : 'Procesar Factura'}
              </button>
            )}
          </form>

          {detectedProducts && detectedProducts.length > 0 && (
            <div className="animate-fade-in border border-emerald-200 rounded-2xl overflow-hidden mt-6">
              <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-200 flex items-center justify-between text-emerald-800">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" /> <span className="font-bold text-sm">Configurar Columnas Extraídas</span>
                </div>
                <span className="text-xs bg-emerald-200 text-emerald-900 px-2 py-1 rounded-lg font-bold">{detectedProducts.length} filas detectadas</span>
              </div>
              <div className="p-4 bg-white border-b border-slate-100 italic text-xs text-slate-500">
                El sistema ha extraído las siguientes filas del PDF. Asigna qué significa cada columna usando los selectores dorados en la cabecera. Ignora las columnas que no necesites.
              </div>

              {/* Formulario de Metadatos de Factura */}
              <div className="p-5 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proveedor / Supplier</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Pronaca, Supermaxi..."
                    value={invoiceProvider}
                    onChange={e => setInvoiceProvider(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoría Global</label>
                  <input 
                    type="text" 
                    list="invoice-categories"
                    placeholder="Ej: Cárnicos, Abarrotes..."
                    value={invoiceCategory}
                    onChange={e => setInvoiceCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                  />
                  <datalist id="invoice-categories">
                    {existingCategories.map(cat => <option key={cat} value={cat} />)}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Origen del Pago</label>
                  <select 
                    value={invoicePaymentMethod}
                    onChange={e => setInvoicePaymentMethod(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm cursor-pointer"
                  >
                    <option value="office">Compra de Oficina</option>
                    <option value="cash">Efectivo de Caja Hotel</option>
                  </select>
                </div>
              </div>

              {invoicePaymentMethod === 'office' && (
                <div className="px-5 pb-5 bg-slate-50 border-b border-slate-200 animate-fade-in">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Número de Orden de Transferencia</label>
                   <input 
                     type="text" 
                     placeholder="Ingresa el número de referencia aquí..."
                     value={invoiceTransferReference}
                     onChange={e => setInvoiceTransferReference(e.target.value)}
                     className="w-full md:w-1/2 bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                   />
                </div>
              )}
              <div className="p-0 border-b border-slate-100 overflow-x-auto max-h-[400px]">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 font-medium text-xs sticky top-0 z-10 shadow-sm border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 w-10 text-center bg-slate-100 border-r border-slate-200 text-slate-400">#</th>
                      <th className="px-4 py-2 w-16 text-center text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 border-r border-emerald-100">Venta</th>
                      {Array.from({ length: maxCols }).map((_, colIndex) => (
                        <th key={`header-${colIndex}`} className="px-2 py-2 min-w-[150px]">
                          <select 
                            className="w-full bg-amber-50 border border-amber-200 text-amber-900 rounded p-1.5 text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                            value={columnMappings[colIndex] || 'ignore'}
                            onChange={(e) => setColumnMappings({...columnMappings, [colIndex]: e.target.value})}
                          >
                            <option value="ignore">Ignorar Columna</option>
                            <option value="name">Nombre del Producto</option>
                            <option value="quantity">Cantidad</option>
                            <option value="purchasePrice">Precio de Compra</option>
                            <option value="salePrice">Precio de Venta</option>
                            <option value="expirationDate">Fecha Caducidad</option>
                            <option value="unit">Unidad de Medida</option>
                          </select>
                        </th>
                      ))}
                      <th className="px-2 py-2 sticky right-0 bg-slate-50 border-l border-slate-200"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {detectedProducts.slice(0, 100).map((row, rowIndex) => (
                      <tr key={`row-${rowIndex}`} className="border-t border-slate-100 hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-2 text-center text-xs text-slate-400 font-mono bg-slate-50 border-r border-slate-100">{rowIndex + 1}</td>
                        <td className="px-4 py-2 text-center bg-emerald-50/20 border-r border-emerald-50">
                          <input 
                            type="checkbox" 
                            checked={isSellableMap[rowIndex] !== undefined ? isSellableMap[rowIndex] : true}
                            onChange={e => setIsSellableMap({...isSellableMap, [rowIndex]: e.target.checked})}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                        {Array.from({ length: maxCols }).map((_, colIndex) => {
                          const cellValue = Array.isArray(row) ? (row[colIndex] || '') : (colIndex === 0 ? String(row || '') : '');
                          return (
                            <td key={`cell-${rowIndex}-${colIndex}`} className={`px-2 py-2 ${columnMappings[colIndex] !== 'ignore' && columnMappings[colIndex] ? 'bg-emerald-50/30' : ''}`}>
                              <input 
                                type="text" 
                                value={cellValue} 
                                onChange={e => {
                                  setDetectedProducts(prev => {
                                    const next = [...prev];
                                    if (!Array.isArray(next[rowIndex])) next[rowIndex] = [String(next[rowIndex] || '')];
                                    const nextRow = [...next[rowIndex]];
                                    nextRow[colIndex] = e.target.value;
                                    next[rowIndex] = nextRow;
                                    return next;
                                  });
                                }}
                                className={`w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-400 focus:bg-white rounded p-1 text-sm outline-none transition-colors ${columnMappings[colIndex] !== 'ignore' && columnMappings[colIndex] ? 'font-medium text-slate-800' : 'text-slate-400'}`} 
                              />
                            </td>
                          );
                        })}
                        <td className="px-2 py-2 text-center sticky right-0 bg-white border-l border-slate-50">
                            <button type="button" onClick={() => removeDetectedProduct(rowIndex)} className="text-rose-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded transition-colors" title="Borrar Fila"><X className="w-4 h-4"/></button>
                        </td>
                      </tr>
                    ))}
                    {detectedProducts.length > 100 && (
                      <tr className="bg-slate-50">
                        <td colSpan={maxCols + 2} className="px-6 py-4 text-center text-xs text-slate-400 italic">
                          Mostrando las primeras 100 de {detectedProducts.length} filas detectadas por rendimiento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 p-5 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Resumen de Importación</span>
                    <div className="flex items-center gap-4 mt-1">
                       <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span className="text-sm font-medium text-slate-700">{detectedProducts.length} filas</span>
                       </div>
                       <div className="h-4 w-[1px] bg-slate-200"></div>
                       <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <span className="text-lg font-black text-slate-900">${invoiceTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => { setDetectedProducts([]); setColumnMappings({}); }}
                      className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="button" 
                      onClick={confirmDetectedProducts}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-8 rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 group"
                    >
                      Confirmar e Importar
                      <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    </button>
                 </div>
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* DRAWER: Batch Output (UserForm) */}
      <Drawer isOpen={activeDrawer === 'batch'} onClose={closeDrawer} title="Salida Múltiple (Uso de Cocina)" widthClass="max-w-xl">
        <div className="space-y-6">
          <p className="text-sm text-slate-600">Busca y selecciona varios productos a la vez para registrar su salida por uso interno (Cocina, limpieza, bar, etc).</p>
          
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Buscar productos para agregar..."
              value={batchSearchTerm}
              onChange={(e) => setBatchSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 transition-shadow outline-none"
            />
          </div>
          
          {batchSearchTerm && (
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50">
              {products.filter(p => p.name.toLowerCase().includes(batchSearchTerm.toLowerCase())).slice(0, 10).map(p => (
                <div key={p.id} onClick={() => { handleBatchItemAdd(p); setBatchSearchTerm(''); }} className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-sm font-medium flex justify-between items-center text-slate-700">
                  <span>{p.name} <span className="text-xs text-slate-400 font-normal ml-2">({p.stock} en stock)</span></span>
                  <Plus className="w-4 h-4 text-emerald-600" />
                </div>
              ))}
            </div>
          )}

          <div className="border border-slate-200 rounded-xl overflow-hidden mt-4 bg-white shadow-sm">
            <table className="w-full text-sm text-left flex-col grow">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3 text-center">Stock</th>
                  <th className="px-4 py-3 text-center">A Descargar</th>
                  <th className="px-2 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batchItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{item.name}</p>
                    </td>
                    <td className={`px-4 py-3 text-center font-bold ${item.stock < item.quantity ? 'text-rose-500' : 'text-slate-600'}`}>
                      {item.stock} {item.unit || ''}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <input type="number" min="1" max={item.stock} value={item.quantity} onChange={e => handleBatchItemQuantity(item.id, e.target.value)}
                          className="w-16 bg-amber-50 text-amber-900 font-bold border border-amber-200 rounded-lg p-1.5 text-center focus:border-amber-500 outline-none" />
                        <span className="text-[10px] font-bold text-amber-600 uppercase">{item.unit || 'unid'}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center">
                       <button type="button" onClick={() => handleBatchItemRemove(item.id)} className="text-rose-400 hover:text-rose-600 p-1 bg-white rounded-md shadow-sm border border-slate-200 hover:border-rose-300 transition-colors"><X className="w-4 h-4 mx-auto"/></button>
                    </td>
                  </tr>
                ))}
                {batchItems.length === 0 && (
                  <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-400 italic text-sm">No has agregado productos a la lista de salida. Búscalos arriba.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Motivo de Salida Múltiple</label>
              <select value={batchExitType} onChange={e => {
                  setBatchExitType(e.target.value);
                  if (e.target.value === 'canje') setBatchNotes('');
                  else setBatchNotes('Uso Operativo / Cocina');
                }}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                <option value="uso_interno">Salida para Uso Interno (Cocina/Limpieza)</option>
                <option value="canje">Canje Masivo por Comida/Servicios (Barter)</option>
              </select>
            </div>

            {batchExitType === 'canje' && (
               <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 animate-fade-in space-y-3">
                 <p className="text-xs text-amber-700 font-medium">Registra el valor equivalente <b>TOTAL</b> de lo que recibes a cambio por <b>TODO</b> este grupo de productos.</p>
                 <div>
                   <label className="block text-xs font-bold text-amber-800 mb-1.5 uppercase tracking-wide">Valor Total que recibes a cambio ($)</label>
                   <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 font-bold">$</span>
                     <input 
                       type="number" step="0.01" required
                       value={batchPrice} 
                       onChange={e => setBatchPrice(e.target.value)}
                       className="w-full pl-7 p-3 bg-white border border-amber-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 text-amber-900 outline-none font-bold"
                       placeholder="Ej: 30.00"
                     />
                   </div>
                 </div>
               </div>
            )}

            <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl">
               <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Notas y Observaciones {batchExitType === 'canje' ? '(Obligatorio)' : '(Opcional)'}</label>
               <textarea rows="2" required={batchExitType === 'canje'} value={batchNotes} onChange={e => setBatchNotes(e.target.value)}
                 className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                 placeholder={batchExitType === 'canje' ? 'Ej: A cambio de 4 platos de pollo a la brasa' : "Uso en cocina, preparado de desayuno buffet..."}></textarea>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3 mt-4">
             <button type="button" onClick={closeDrawer} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition">Cancelar</button>
             <button type="button" onClick={handleBatchSubmit} disabled={batchItems.length === 0} className="px-5 py-2.5 text-sm font-bold bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 transition shadow-sm flex items-center">
               Confirmar Salida Múltiple ({batchItems.length})
             </button>
          </div>
        </div>
      </Drawer>

      {/* DRAWER: Loans Control */}
      <Drawer isOpen={activeDrawer === 'loans'} onClose={closeDrawer} title="Control de Préstamos Internos" widthClass="max-w-4xl">
        <div className="space-y-6">
          <div className="flex justify-between items-start gap-4">
            <p className="text-sm text-slate-600 max-w-xl">Historial completo de préstamos y transferencias operativas con sucursales o terceros (Ej: Joya Chef).</p>
            <button 
              onClick={() => setIsLoanFormOpen(!isLoanFormOpen)}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center shrink-0 transition"
            >
              {isLoanFormOpen ? 'Cerrar Formulario' : '+ Registrar Nuevo Préstamo'}
            </button>
          </div>

          {isLoanFormOpen && (
            <form onSubmit={handleLoanSubmit} className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl shadow-sm animate-fade-in space-y-4">
              <h4 className="font-bold text-indigo-900 border-b border-indigo-100 pb-2">Registrar Movimiento de Préstamo</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-indigo-800 mb-1.5 uppercase tracking-wide">Producto</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar producto a prestar..."
                      value={loanSearchTerm}
                      onChange={(e) => setLoanSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    />
                  </div>
                  
                  {loanSearchTerm && (
                    <div className="absolute z-50 mt-1 max-h-40 w-[300px] overflow-y-auto border border-indigo-100 rounded-xl bg-white shadow-xl">
                      {products.filter(p => p.name.toLowerCase().includes(loanSearchTerm.toLowerCase())).slice(0, 10).map(p => (
                        <div key={p.id} onClick={() => { setLoanForm({...loanForm, productId: p.id}); setLoanSearchTerm(p.name); }} className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm font-medium flex justify-between items-center text-slate-700">
                          <span>{p.name} <span className="text-xs text-slate-400 font-normal ml-2">({p.stock} en stock)</span></span>
                          <Plus className="w-4 h-4 text-indigo-600" />
                        </div>
                      ))}
                    </div>
                  )}
                  {loanForm.productId && !loanSearchTerm.includes('(') && (
                    <div className="mt-2 text-[10px] font-bold text-indigo-600 uppercase">Seleccionado: {products.find(p=>p.id===loanForm.productId)?.name}</div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-800 mb-1.5 uppercase tracking-wide">Tipo</label>
                  <select 
                    value={loanForm.type} onChange={e => setLoanForm({...loanForm, type: e.target.value})}
                    className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  >
                    <option value="salida">SALIDA</option>
                    <option value="entrada">ENTRADA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-800 mb-1.5 uppercase tracking-wide">Cantidad</label>
                  <input 
                    type="number" min="1" required
                    value={loanForm.quantity} onChange={e => setLoanForm({...loanForm, quantity: parseInt(e.target.value)})}
                    className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-indigo-800 mb-1.5 uppercase tracking-wide">Referencia o Descripción (A quién prestamos o nos prestó)</label>
                <input 
                  type="text" required placeholder="Ej: Préstamo a Joya Chef, nos devuelve el lunes"
                  value={loanForm.notes} onChange={e => setLoanForm({...loanForm, notes: e.target.value})}
                  className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              
              <div className="flex justify-end pt-2">
                <button type="submit" className="px-5 py-2.5 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-sm">
                  Confirmar Guardado
                </button>
              </div>
            </form>
          )}
          
          <div className="border border-slate-200 rounded-xl overflow-hidden mt-4 bg-white shadow-sm flex flex-col h-full">
            <table className="w-full text-sm text-left flex-col grow">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3 text-center">Cantidad</th>
                  <th className="px-4 py-3 text-center">Referencia (Notas)</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeLoans.map(loan => (
                  <tr key={loan.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-500 font-medium whitespace-nowrap">
                      {new Date(loan.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      {loan.type === 'salida' ? (
                        <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center w-max"><ArrowRightLeft className="w-3 h-3 mr-1"/> Salida</span>
                      ) : (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center w-max"><ArrowRightLeft className="w-3 h-3 mr-1" /> Entrada</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800 break-words line-clamp-2">{loan.product?.name}</p>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-600 whitespace-nowrap">
                       {loan.quantity} {loan.product?.unit || 'unid'}
                    </td>
                    <td className="px-4 py-3 text-center italic text-slate-500 text-xs truncate max-w-[150px]">
                       {loan.notes || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                       {loan.status === 'pagado' || loan.status === 'settled' ? (
                         <span className="text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-1 rounded-md uppercase tracking-wide flex items-center justify-center w-max mx-auto"><CheckCircle className="w-3 h-3 mr-1" /> Saldado</span>
                       ) : (
                         <span className="text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1 rounded-md uppercase tracking-wide flex items-center justify-center w-max mx-auto"><Clock className="w-3 h-3 mr-1" /> Pendiente</span>
                       )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(loan.status === 'pending' || loan.status !== 'settled') && (
                        <button onClick={() => handleSettleLoan(loan.id)} className="bg-white border border-slate-200 shadow-sm text-[10px] font-bold text-slate-600 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 py-1.5 px-2 rounded-lg transition-all active:scale-95 whitespace-nowrap uppercase tracking-wider">
                          ✓ Marcar Saldado
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {activeLoans.length === 0 && (
                  <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-400 italic text-sm">No hay préstamos internos regristrados en el sistema.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="pt-2 flex justify-end gap-3 mt-4">
             <button type="button" onClick={closeDrawer} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition">Cerrar Panel</button>
          </div>
        </div>
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
