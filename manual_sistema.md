# Manual Técnico y Operativo: Sistema Hotelero Joya Amazónica

Este documento describe la arquitectura, el funcionamiento y la conexión entre todos los módulos del sistema de gestión hotelera "Joya Amazónica".

---

## 1. Arquitectura Base (Cómo está construido)

El sistema es una aplicación web moderna (Single Page Application) dividida en dos partes fundamentales que se comunican constantemente:

*   **Frontend (La Interfaz Visual):** Construida con **React.js** y **Tailwind CSS**. Es la cara del sistema, diseñada para ser rápida, sin recargas de página y altamente intuitiva.
*   **Backend (El Motor y Base de Datos):** Construido con **Node.js, Express y Prisma (SQLite)**. Se encarga de procesar las reglas de negocio, hacer los cálculos financieros, aplicar las transacciones y almacenar la información de forma segura.

---

## 2. Módulos Principales y su Funcionamiento

### 2.1. Panel de Control (Dashboard Diario)
Es el centro de mando del recepcionista. Reúne toda la operación en vivo:
*   **Métricas Financieras Vivas:**
    *   **Ingreso Tentativo Diario:** Calcula cuánto dinero se generó estrictamente "hoy" (noches actuales ocupadas + ventas pagadas hoy + consumos fiados hoy).
    *   **Efectivo en Caja:** Refleja la cuenta de la caja fuerte física. *Solo* sube si el método de pago explícito es "Efectivo".
    *   **Cuentas por Cobrar:** Sistema global que agrupa todas las deudas de los huéspedes o clientes de días anteriores y actuales.
*   **Cuadrícula de Habitaciones:** 26 tarjetas de colores que muestran el estado en tiempo real (Disponible, Ocupada, Mantenimiento, Limpieza).
*   **Ventas Rápidas:** Botones globales para acceder independientemente a la venta de *Comida (Restaurante)* o *Venta Directa Externa (Mini-Market)*.

### 2.2. Gestión de Habitaciones y Reservas (Flujo Central)
Este es el flujo principal de servicio al cliente:
1.  **Check-in:** Se selecciona un cliente empadronado, se define la tarifa acordada (la cual puede ser personalizada por cliente) y se marca como "Ocupada". Esto crea automáticamente una "Reserva Activa".
2.  **Durante la estadía:** El software vincula todos los consumos (restaurante u otros) al ID de la Reserva Activa.
3.  **Check-out:** El recepcionista libera la habitación. El sistema junta la cantidad de noches multiplicadas por la tarifa + los recargos manuales. *Nota: Los consumos de restaurante se pagan por separado usando el botón "Facturar" en las Cuentas por Cobrar.*

### 2.3. Módulo de Inventario y Ventas
El control de productos tiene dos ramas principales adaptadas a la operación del hotel:
*   **Venta de Comida (Restaurante):** Optimizada con botones rápidos para tiempos específicos (Desayuno, Almuerzo, Cena). Permite escribir "Notas o Comentarios" a cocina, e inmediatamente fijar si se paga en Efectivo/Transferencia o se carga a la cuenta de la habitación.
*   **Venta Directa:** Un "Carrito de compras" tradicional para productos de recepción (snacks, bebidas, útiles). Posee función de lector de código de barras.

### 2.4. Reportes y Contabilidad
Separa meticulosamente cada centavo.
*   Genera gráficos de Ingresos vs Gastos en los últimos 7 días.
*   Documenta ingresos (separando Efectivo de Transferencia) y Egresos (compras a proveedores, pago de luz, etc.).
*   **Estado de Cuenta (Liquidación):** Permite buscar a un cliente específico, seleccionar en un checklist todo lo que consumió en la semana y generar una sola factura que cobra y cambia el estado de esos productos a "Liquidados/Settled".

---

## 3. Relación y Flujo de Datos (De qué lado a qué lado)

El sistema tiene una lógica estricta de herencia de datos para evitar pérdidas de inventario o dinero.

### 3.1. Caso de Uso: Consumo a Crédito de un Huésped
1.  **Recepción:** El huésped en la Hab. 104 pide un Desayuno desde su cuarto.
2.  **Ingreso de Venta:** El empleado abre *Nueva Venta Comida*, selecciona "Desayuno", escribe en nota "Llevar a cuarto" y elige Método de pago: *Cta Oficina / Hab*.
3.  **Movimiento (Inventario):** El sistema descuenta 1 unidad de stock de la cocina inmediatamente.
4.  **Movimiento (Finanzas):** Se crea una alerta en *Cuentas por Cobrar* ligada al nombre del cliente de la Hab. 104. Esto viaja al "Ingreso Tentativo Diario" (porque se ejecutó hoy), pero **NO** entra al "Efectivo en Caja".
5.  **Liquidación:** Cinco días después el huésped se va. En el historial de *Cuentas por cobrar* se hace clic en *Ir a Facturar*. El sistema convierte ese desayuno "Pendiente" a una "Factura Pagada en Efectivo". En ese milisegundo, la métrica "Efectivo en Caja" sube.

### 3.2. Caso de Uso: Reservas por Internet
1.  **Público:** Un usuario entra a la página pública web e ingresa sus datos y fechas.
2.  **Solicitud:** Viaja al panel de *Reservas Web (Admin)* con estado pendiente.
3.  **Confirmación:** Si el hotel tiene cupo, el administrador aprueba e ingresa el precio.
4.  **Correo Electrónico:** El backend se conecta automáticamente a Gmail (Nodemailer) y dispara un correo formal en formato HTML al cliente diciéndole "Su reserva está aprobada".
5.  **Legado:** El cliente ya queda empadronado internamente en la base de datos de Clientes para el día de su Check-in.

---

## 4. Conclusión Técnica del Ecosistema

Todo el software opera bajo el principio arquitectónico de "Single Source of Truth" (Única fuente de verdad). 
No hay datos sueltos: 
- Un **Ingreso Financiero** siempre debe venir atado de un recorte de **Inventario** o de la facturación de una estancia de **Habitación**.
- Todo cambio viaja seguro al backend local y las métricas se recalculan en tiempo real protegiendo las cuentas cruzadas entre dueños, administradores y la información de los clientes.
