const prisma = require('../config/db');
require('fs').appendFileSync('pdf_debug.log', "DEBUG: inventory.controller.js loaded at " + new Date().toISOString() + "\n");

// @desc    Get all products
// @route   GET /api/inventory/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { transactions: true } }
      }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

// @desc    Get product by barcode
// @route   GET /api/inventory/products/barcode/:barcode
// @access  Private
const getProductByBarcode = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { barcode: req.params.barcode },
    });
    
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Producto no encontrado por código de barras' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product by barcode', error: error.message });
  }
};

// @desc    Create new product
// @route   POST /api/inventory/products
// @access  Private
const createProduct = async (req, res) => {
  const { barcode, name, purchasePrice, salePrice, stock, minStock, category, supplier, weight, expirationDate, isSellable, unit } = req.body;

  try {
    // Check if product with same name already exists to avoid duplicates
    const duplicate = await prisma.product.findFirst({ where: { name } });
    if (duplicate) {
      const addedStock = parseInt(stock) || 0;
      const updated = await prisma.product.update({
        where: { id: duplicate.id },
        data: { stock: duplicate.stock + addedStock }
      });
      if (addedStock > 0) {
        await prisma.inventoryTransaction.create({
          data: {
            productId: duplicate.id,
            type: 'entrada',
            quantity: addedStock,
            notes: 'Stock sumado automáticamente al detectar nombre repetido'
          }
        });
      }
      return res.status(200).json(updated);
    }

    const product = await prisma.product.create({
      data: {
        barcode,
        name,
        purchasePrice: parseFloat(purchasePrice) || 0,
        salePrice: parseFloat(salePrice) || 0,
        stock: parseInt(stock) || 0,
        minStock: parseInt(minStock) || 5,
        category,
        supplier,
        weight,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        isSellable: isSellable === undefined ? true : isSellable,
        unit: unit || 'unidad'
      }
    });

    if (stock > 0) {
      await prisma.inventoryTransaction.create({
        data: {
          productId: product.id,
          type: 'entrada',
          quantity: parseInt(stock),
          notes: 'Inventario inicial',
        }
      });
    }

    res.status(201).json(product);
  } catch (error) {
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'campo';
      return res.status(400).json({ message: `Error: El ${field} ya existe en otro producto.` });
    }
    res.status(500).json({ message: 'Error al crear producto', error: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/inventory/:id
// @access  Private
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { barcode, name, purchasePrice, salePrice, stock, minStock, category, supplier, weight, expirationDate, isSellable, unit } = req.body;

  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        barcode,
        name,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        salePrice: salePrice ? parseFloat(salePrice) : undefined,
        stock: stock !== undefined ? parseInt(stock) : undefined,
        minStock: minStock !== undefined ? parseInt(minStock) : undefined,
        category,
        supplier,
        weight,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        isSellable: isSellable === undefined ? undefined : isSellable,
        unit: unit || undefined
      }
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar producto', error: error.message });
  }
};

// @desc    Register inventory transaction
// @route   POST /api/inventory/transactions
// @access  Private
const addTransaction = async (req, res) => {
  const { productId, type, exitType, roomId, customerId, quantity, price, notes, paymentMethod, transferReference } = req.body; 
  // type = 'entrada' o 'salida'
  // exitType = 'venta', 'uso_interno', 'cambio'

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    let newStock = product.stock;
    if (type === 'entrada') newStock += parseInt(quantity);
    if (type === 'salida') {
      if (product.category?.toUpperCase() !== 'COMIDA' && newStock < quantity) {
        return res.status(400).json({ message: 'Stock insuficiente' });
      }
      newStock -= parseInt(quantity);
    }

    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Create transaction
      const trans = await tx.inventoryTransaction.create({
        data: { 
          productId, 
          type, 
          exitType: exitType || null, 
          roomId: roomId || null,
          customerId: customerId || null,
          quantity: parseInt(quantity),
          price: price ? parseFloat(price) : (type === 'salida' ? product.salePrice : product.purchasePrice),
          notes,
          paymentMethod: paymentMethod || 'cash',
          transferReference: transferReference || null
        },
      });

      // 2. Update stock
      await tx.product.update({
        where: { id: productId },
        data: { stock: newStock },
      });

      // 3. If it's a VENTA to a ROOM, try to attach it to an active reservation for pre-billing
      if (type === 'salida' && exitType === 'venta' && roomId) {
        // Find active reservation for this room
        const activeRes = await tx.reservation.findFirst({
          where: { roomId: roomId, status: 'activa' }
        });

        if (activeRes) {
          // Check if a draft invoice already exists for this reservation
          let invoice = await tx.invoice.findFirst({
            where: { reservationId: activeRes.id, status: 'borrador' }
          });

          const itemTotal = product.salePrice * parseInt(quantity);

          if (!invoice) {
            invoice = await tx.invoice.create({
              data: {
                reservationId: activeRes.id,
                totalAmount: itemTotal,
                status: 'borrador'
              }
            });
          } else {
            await tx.invoice.update({
              where: { id: invoice.id },
              data: { totalAmount: invoice.totalAmount + itemTotal }
            });
          }

          // Add the item to the invoice
          await tx.invoiceItem.create({
            data: {
              invoiceId: invoice.id,
              type: 'producto',
              description: `Consumo de habitación: ${product.name}`,
              quantity: parseInt(quantity),
              unitPrice: product.salePrice,
              totalPrice: itemTotal,
              productId: product.id
            }
          });
        }
      }

      return trans;
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Error en la transacción', error: error.message });
  }
};

// @desc    Register bulk inventory transactions
// @route   POST /api/inventory/transactions/bulk
// @access  Private Admin
const addTransactionsBulk = async (req, res) => {
  const { type, exitType, roomId, customerId, notes, items, paymentMethod, transferReference } = req.body;
  // items = [{ productId, quantity }]

  try {
    const transactionResult = await prisma.$transaction(async (tx) => {
      const createdTransactions = [];
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new Error(`Producto ${item.productId} no encontrado`);

        let newStock = product.stock;
        if (type === 'entrada') newStock += parseInt(item.quantity);
        if (type === 'salida') {
          if (newStock < item.quantity) throw new Error(`Stock insuficiente para ${product.name}`);
          newStock -= parseInt(item.quantity);
        }

          const trans = await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              type,
              exitType: exitType || null,
              roomId: roomId || null,
              customerId: customerId || null,
              quantity: parseInt(item.quantity),
              price: item.price !== undefined ? parseFloat(item.price) : (type === 'salida' ? product.salePrice : product.purchasePrice),
              notes,
              paymentMethod: paymentMethod || 'cash',
              transferReference: transferReference || null
            }
          });

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: newStock }
        });

        createdTransactions.push(trans);
      }
      return createdTransactions;
    });

    res.status(201).json({ message: 'Transacciones procesadas', count: transactionResult.length });
  } catch (error) {
    res.status(500).json({ message: 'Error en transacciones masivas', error: error.message });
  }
};

// @desc    Get transactions
// @route   GET /api/inventory/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const { exitType } = req.query;
    const whereClause = {};
    if (exitType) {
      whereClause.exitType = exitType;
    }

    const trans = await prisma.inventoryTransaction.findMany({
      where: whereClause,
      include: { product: true, room: true, customer: true },
      orderBy: { createdAt: 'desc' },
      ...(exitType ? {} : { take: 50 })
    });
    res.json(trans);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
};

const PDFParser = require("pdf2json");

// @desc    Upload supplier invoice PDF and extract products
// @route   POST /api/inventory/upload-invoice
// @access  Private
const uploadInvoice = async (req, res) => {
  require('fs').appendFileSync('pdf_debug.log', "DEBUG: Entered uploadInvoice\n");
  try {
    if (!req.file) {
      require('fs').appendFileSync('pdf_debug.log', "DEBUG: No file uploaded\n");
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const tableRows = [];

    const pdfData = await new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();
        pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
        pdfParser.on("pdfParser_dataReady", pdfData => resolve(pdfData));
        pdfParser.parseBuffer(req.file.buffer);
    });

    const pages = pdfData?.formImage?.Pages || pdfData?.Pages || [];
    
    if (pages.length === 0) {
        console.log("PDF Data Keys:", Object.keys(pdfData));
    }

    let startCapturing = false;
    const finalTableRows = [];

    pages.forEach(page => {
      const rowsMap = new Map();
      
      page.Texts.forEach(t => {
        try {
          const text = decodeURIComponent(t.R[0].T).trim();
          if (!text) return;
          
          let foundY = null;
          for (const y of rowsMap.keys()) {
            if (Math.abs(y - t.y) < 0.4) { // Lower threshold for more precise rows
              foundY = y;
              break;
            }
          }
          
          if (foundY !== null) {
            rowsMap.get(foundY).push({ x: t.x, text });
          } else {
            rowsMap.set(t.y, [{ x: t.x, text }]);
          }
        } catch (e) {}
      });
      
      const sortedYs = Array.from(rowsMap.keys()).sort((a, b) => a - b);
      
      sortedYs.forEach(y => {
        const rowItems = rowsMap.get(y);
        rowItems.sort((a, b) => a.x - b.x);
        
        const mergedColumns = [];
        let currentGroup = [];
        rowItems.forEach((item) => {
          if (currentGroup.length === 0) currentGroup.push(item);
          else {
            const lastItem = currentGroup[currentGroup.length - 1];
            if (item.x - lastItem.x < 1.2) currentGroup.push(item); // Much lower threshold to keep columns distinct
            else {
              mergedColumns.push(currentGroup.map(i => i.text).join(' '));
              currentGroup = [item];
            }
          }
        });
        if (currentGroup.length > 0) mergedColumns.push(currentGroup.map(i => i.text).join(' '));

        const rowText = mergedColumns.join(' ').toUpperCase();
        require('fs').appendFileSync('pdf_debug.log', `DEBUG: Row at Y=${y} | Cols=${mergedColumns.length} | Text=[${rowText}]\n`);
        
        // Header detection: Start capturing after seeing column headers
        // Use regex to be more flexible with spacing/accents
        const headerRegex = /CANTIDAD.*DESCRIPCI|DESCRIPCI.*CANTIDAD/i;
        if (!startCapturing && headerRegex.test(rowText)) {
          require('fs').appendFileSync('pdf_debug.log', "DEBUG: Start condition met at Y=" + y + "\n");
          startCapturing = true;
          return; // Skip the header row itself
        }

        // Footer detection: Stop capturing on subtotal / total
        if (startCapturing && (rowText.includes('SUBTOTAL') || rowText.includes('VALOR TOTAL') || rowText.includes('TOTAL SIN'))) {
          require('fs').appendFileSync('pdf_debug.log', "DEBUG: Stop condition met at Y=" + y + "\n");
          startCapturing = false;
        }

        if (startCapturing && mergedColumns.length > 0) {
          // HEURISTIC: Multi-line merging
          const lastRow = finalTableRows[finalTableRows.length - 1];
          // A row is a start of a new product if it has 5+ columns or starts with a barcode-like string
          const startsWithBarcode = /^\d{7,}/.test(mergedColumns[0].replace(/\s/g, ''));
          const hasManyCols = mergedColumns.length >= 4;
          const isNewProduct = startsWithBarcode || hasManyCols;

          if (lastRow && !isNewProduct) {
             require('fs').appendFileSync('pdf_debug.log', "DEBUG: Merging as continuation: " + mergedColumns[0] + "\n");
             // Merge into the description column (usually index 3 or last if fewer)
             let descIndex = lastRow.length > 3 ? 3 : lastRow.length - 1;
             lastRow[descIndex] = (lastRow[descIndex] + ' ' + mergedColumns.join(' ')).trim();
          } else {
             finalTableRows.push(mergedColumns);
          }
        }
      });
    });

    res.json({
      message: 'PDF procesado exitosamente',
      tableRows: finalTableRows,
      rawTextSummary: 'Filtered table data applied'
    });

  } catch (error) {
    const fs = require('fs');
    fs.writeFileSync('error_log.txt', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('Error processing PDF (Full Stack):', error);
    res.status(500).json({ message: 'Error procesando la factura PDF', error: error.message, stack: error.stack });
  }
};

// @desc    Delete transaction and revert stock
// @route   DELETE /api/inventory/transactions/:id
// @access  Private Admin
const deleteTransaction = async (req, res) => {
  const { password } = req.body || {};
  if (password !== 'Tumiprincesa') {
    return res.status(401).json({ message: 'Contraseña de seguridad incorrecta' });
  }

  try {
    const transaction = await prisma.inventoryTransaction.findUnique({ where: { id: req.params.id } });
    if (!transaction) return res.status(404).json({ message: 'No encontrada' });
    
    // Auto-revert stock on delete if product exists
    const product = await prisma.product.findUnique({ where: { id: transaction.productId } });
    if (product) {
      if (transaction.type === 'entrada') {
        await prisma.product.update({
          where: { id: transaction.productId },
          data: { stock: { decrement: transaction.quantity } }
        });
      } else {
        await prisma.product.update({
          where: { id: transaction.productId },
          data: { stock: { increment: transaction.quantity } }
        });
      }
    }

    await prisma.inventoryTransaction.delete({ where: { id: req.params.id } });
    res.json({ message: 'Movimiento eliminado y stock revertido de forma segura' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting transaction', error: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/inventory/products/:id
// @access  Private Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    // Verify it's not used in historical invoices
    const usedInInvoices = await prisma.invoiceItem.count({ where: { productId: req.params.id } });
    if (usedInInvoices > 0) {
      return res.status(400).json({ message: 'No se puede eliminar porque este producto está asociado a facturas del historial de ventas.' });
    }

    // Delete related inventory tracking first
    await prisma.inventoryTransaction.deleteMany({
      where: { productId: req.params.id }
    });

    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

// @desc    Import products from curated PDF preview
// @route   POST /api/inventory/transactions/import-pdf
// @access  Private Admin
const importPdfProducts = async (req, res) => {
  const { products, provider, category, paymentMethod, totalCost, transferReference } = req.body; 
  
  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: 'No se recibieron productos para importar' });
  }

  try {
    const results = { created: 0, updated: 0, errors: [] };

    // Transaction to ensure all or nothing, although we handle item errors individually in the result
    // But Expense should only be created if at least one product is processed correctly
    let successCount = 0;

    for (const item of products) {
      try {
        const qty = parseInt(item.quantity) || 0;
        if (qty <= 0) {
          results.errors.push(`${item.name}: cantidad inválida`);
          continue;
        }

        // Search for existing product by name (case-insensitive)
        const allProducts = await prisma.product.findMany();
        const existing = allProducts.find(p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase());

        const productData = {
          stock: (existing?.stock || 0) + qty,
          purchasePrice: item.purchasePrice ? parseFloat(item.purchasePrice) : (existing?.purchasePrice || 0),
          salePrice: item.salePrice ? parseFloat(item.salePrice) : (existing?.salePrice || 0),
          expirationDate: item.expirationDate ? new Date(item.expirationDate) : (existing?.expirationDate || null),
          supplier: provider || item.supplier || existing?.supplier || '',
          category: category || item.category || existing?.category || 'General',
          isSellable: item.isSellable !== undefined ? item.isSellable : (existing?.isSellable ?? true)
        };

        if (existing) {
          await prisma.product.update({
            where: { id: existing.id },
            data: productData
          });
          await prisma.inventoryTransaction.create({
            data: {
              productId: existing.id,
              type: 'entrada',
              quantity: qty,
              notes: `Factura ${provider || ''} - Pago: ${paymentMethod || 'No especificado'}`,
              paymentMethod: paymentMethod || 'office',
              transferReference: transferReference || null
            }
          });
          results.updated++;
        } else {
          const newProduct = await prisma.product.create({
            data: {
              name: item.name.trim(),
              ...productData,
              minStock: 5
            }
          });
          await prisma.inventoryTransaction.create({
            data: {
              productId: newProduct.id,
              type: 'entrada',
              quantity: qty,
              notes: `Producto creado desde factura ${provider || ''}`,
              paymentMethod: paymentMethod || 'office',
              transferReference: transferReference || null
            }
          });
          results.created++;
        }
        successCount++;
      } catch (itemError) {
        results.errors.push(`${item.name}: ${itemError.message}`);
      }
    }

    // Automatically create an Expense record if we have a totalCost and a provider
    if (successCount > 0 && totalCost > 0) {
      await prisma.expense.create({
        data: {
          category: 'Inventario',
          description: `Compra a ${provider || 'Proveedor'} - ${paymentMethod === 'cash' ? 'EFECTIVO HOTEL' : 'TRANSFERENCIA/OFICINA'}`,
          amount: parseFloat(totalCost),
          date: new Date(),
          paymentMethod: paymentMethod || 'office',
          transferReference: transferReference || null
        }
      });
    }

    res.json({ 
      message: `Importación completada: ${results.created} creados, ${results.updated} actualizados${results.errors.length > 0 ? `, ${results.errors.length} errores` : ''}`,
      results 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en importación PDF', error: error.message });
  }
};

// @desc    Register a food sale (consumption) linked to a room/reservation
// @route   POST /api/inventory/food-sale
// @access  Private
const registerFoodSale = async (req, res) => {
  const { productId, quantity, price, roomId, reservationId, customerId, paymentMethod, transferReference, notes, items } = req.body;

  try {
    if (items && Array.isArray(items) && items.length > 0) {
      const result = await prisma.$transaction(async (tx) => {
         const created = [];
         for (const item of items) {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            if (!product) throw new Error(`Producto no encontrado (ID: ${item.productId})`);
            if (product.category?.toUpperCase() !== 'COMIDA' && product.stock < item.quantity) {
              throw new Error(`Stock insuficiente para ${product.name}`);
            }
            
            const transaction = await tx.inventoryTransaction.create({
              data: {
                productId: item.productId,
                type: 'salida',
                exitType: 'venta',
                roomId: roomId || null,
                reservationId: reservationId || null,
                customerId: customerId || null,
                quantity: item.quantity,
                price: item.price !== undefined && item.price !== null ? parseFloat(item.price) : product.salePrice,
                paymentMethod: paymentMethod || 'cash',
                transferReference: transferReference || null,
                notes: notes || 'Venta directa múltiple',
                status: (paymentMethod === 'office' || (roomId && !paymentMethod)) ? 'pending' : 'settled'
              }
            });

            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } }
            });
            created.push(transaction);
         }
         return created;
      });
      return res.json({ message: 'Venta múltiple registrada con éxito', transactions: result });
    }

    // Código original para un solo item
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    
    // Safety check for category and stock
    const isFood = (product.category || '').toUpperCase() === 'COMIDA';
    if (!isFood && (product.stock || 0) < quantity) {
      return res.status(400).json({ message: 'Stock insuficiente' });
    }

    // 1. Create inventory transaction
    const transaction = await prisma.inventoryTransaction.create({
      data: {
        productId,
        type: 'salida',
        exitType: 'venta',
        roomId: roomId || null,
        reservationId: reservationId || null,
        customerId: customerId || null,
        quantity: parseInt(quantity) || 1,
        price: price ? parseFloat(price) : (product.salePrice || 0),
        paymentMethod: paymentMethod || 'cash',
        transferReference: transferReference || null,
        notes: notes || 'Venta de comida/consumo',
        status: (paymentMethod === 'office' || (roomId && !paymentMethod)) ? 'pending' : 'settled'
      }
    });

    // 2. Reduce stock (if not food or if we track food stock)
    await prisma.product.update({
      where: { id: productId },
      data: { stock: { decrement: parseInt(quantity) || 1 } }
    });

    res.json({ message: 'Venta registrada con éxito', transaction });
  } catch (error) {
    console.error('Error in registerFoodSale:', error);
    res.status(500).json({ message: 'Error al registrar la venta', error: error.message });
  }
};

// @desc    Register an internal consumption (deduct stock without sale)
// @route   POST /api/inventory/internal-consumption
// @access  Private
const registerInternalConsumption = async (req, res) => {
  const { productId, quantity, notes } = req.body;

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    if (product.stock < quantity) return res.status(400).json({ message: 'Stock insuficiente' });

    // 1. Create inventory transaction
    const transaction = await prisma.inventoryTransaction.create({
      data: {
        productId,
        type: 'salida',
        exitType: 'uso_interno',
        quantity: parseInt(quantity),
        notes: notes || 'Consumo interno / Cocina',
        status: 'settled' // Internal consumption is "settled" by default
      }
    });

    // 2. Reduce stock
    await prisma.product.update({
      where: { id: productId },
      data: { stock: { decrement: parseInt(quantity) } }
    });

    res.json({ message: 'Consumo interno registrado con éxito', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar el consumo', error: error.message });
  }
};

// @desc    Settle (Pay/Return) an inventory transaction (like a loan)
// @route   PUT /api/inventory/transactions/:id/settle
// @access  Private Admin
const settleTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const trans = await prisma.inventoryTransaction.findUnique({ where: { id } });
    if (!trans) return res.status(404).json({ message: 'Transacción no encontrada' });

    const updated = await prisma.inventoryTransaction.update({
      where: { id },
      data: { status: 'settled' }
    });
    res.json({ message: 'Transacción saldada correctamente', transaction: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error al saldar la transacción', error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  addTransaction,
  addTransactionsBulk,
  getTransactions,
  settleTransaction,
  deleteTransaction,
  uploadInvoice,
  importPdfProducts,
  registerFoodSale,
  registerInternalConsumption
};
