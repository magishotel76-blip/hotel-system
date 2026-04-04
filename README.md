# Hotel SaaS Management System

Sistema completo de administración hotelera preparado para escalar a SaaS. Incluye los 9 módulos solicitados:
1. Autenticación (JWT + bcrypt)
2. Dashboard Analítico (Recharts)
3. Gestión de Clientes
4. Gestión de Habitaciones
5. Sistema de Reservas (Check-in/out)
6. Inventario Avanzado (Integración Barcode Scanner HTML5)
7. Control de Gastos
8. Prefacturación
9. Reportes

## Tecnologías Utilizadas
* **Frontend**: React + Vite + TailwindCSS + Lucide Icons + Recharts
* **Backend**: Node.js + Express
* **Base de Datos**: PostgreSQL + Prisma ORM

## Instrucciones de Instalación y Ejecución

### 1. Requisitos Previos
Tener instalado Node.js (v16+) y PostgreSQL ejecutándose localmente.

### 2. Configurar Base de Datos
La aplicación ya está configurada en `backend/.env` para conectarse a PostgreSQL con las credenciales que ingresaste (usuario `postgres`, password `123`, puerto `5432`, db `hotel_db`).

Asegúrate de que la base de datos `hotel_db` exista, o créala en tu PostgreSQL (pgAdmin/psql) antes de iniciar.
La estructura de tablas ya se ha empujado con Prima y se ha generado la db.

### 3. Instalar Dependencias Generales
Desde la raíz del proyecto (la carpeta `hotel-system`), instala los paquetes necesarios para ejecutar todo a la vez:
```bash
npm install
```

### 4. Lanzar la Aplicación
Con el siguiente comando, se ejecutarán simultáneamente tanto el Backend (Puerto 5000) como el Frontend en Vite (Puerto 5173).
```bash
npm run dev
```

### 5. Acceder a la plataforma
Abre tu navegador en:
**http://localhost:5173**

**Credenciales de Administrador:**
* **Email:** admin@hotel.com
* **Contraseña:** admin123
