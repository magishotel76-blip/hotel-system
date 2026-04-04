--
-- PostgreSQL database dump
--

\restrict re1XuQS27tsJKsC2fGbXJHgfcjJApO6pCKhBAui9UgaGJjZEoUcbLJCE0XVETuC

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Customer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Customer" (
    id text NOT NULL,
    name text NOT NULL,
    document text NOT NULL,
    phone text,
    email text,
    address text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clientType" text DEFAULT 'NATURAL'::text NOT NULL,
    proforma text,
    "customBreakfastPrice" double precision,
    "customDinnerPrice" double precision,
    "customLunchPrice" double precision,
    "customRoomPrice" double precision,
    "customSnackPrice" double precision,
    "companyId" text,
    "companyIndividualPrice" double precision,
    "companySharedPrice" double precision
);


ALTER TABLE public."Customer" OWNER TO postgres;

--
-- Name: Expense; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Expense" (
    id text NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    amount double precision NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "paymentMethod" text DEFAULT 'cash'::text NOT NULL,
    "transferReference" text
);


ALTER TABLE public."Expense" OWNER TO postgres;

--
-- Name: InventoryTransaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."InventoryTransaction" (
    id text NOT NULL,
    "productId" text NOT NULL,
    type text NOT NULL,
    quantity integer NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "customerId" text,
    "exitType" text,
    "reservationId" text,
    "roomId" text,
    "paymentMethod" text DEFAULT 'cash'::text NOT NULL,
    "transferReference" text,
    status text DEFAULT 'pending'::text NOT NULL,
    price double precision
);


ALTER TABLE public."InventoryTransaction" OWNER TO postgres;

--
-- Name: Invoice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Invoice" (
    id text NOT NULL,
    "reservationId" text,
    "totalAmount" double precision NOT NULL,
    status text DEFAULT 'borrador'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "companyId" text,
    "invoiceType" text DEFAULT 'NORMAL'::text NOT NULL,
    "paymentMethod" text DEFAULT 'cash'::text NOT NULL,
    "transferReference" text
);


ALTER TABLE public."Invoice" OWNER TO postgres;

--
-- Name: InvoiceItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."InvoiceItem" (
    id text NOT NULL,
    "invoiceId" text NOT NULL,
    type text NOT NULL,
    description text NOT NULL,
    quantity integer NOT NULL,
    "unitPrice" double precision NOT NULL,
    "totalPrice" double precision NOT NULL,
    "productId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."InvoiceItem" OWNER TO postgres;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    barcode text,
    name text NOT NULL,
    weight text,
    "expirationDate" timestamp(3) without time zone,
    category text,
    supplier text,
    "purchasePrice" double precision NOT NULL,
    "salePrice" double precision NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "minStock" integer DEFAULT 5 NOT NULL,
    "isSellable" boolean DEFAULT true NOT NULL,
    unit text DEFAULT 'unidad'::text NOT NULL
);


ALTER TABLE public."Product" OWNER TO postgres;

--
-- Name: Reservation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Reservation" (
    id text NOT NULL,
    "customerId" text NOT NULL,
    "roomId" text NOT NULL,
    "checkInDate" timestamp(3) without time zone NOT NULL,
    "checkOutDate" timestamp(3) without time zone NOT NULL,
    "totalPrice" double precision NOT NULL,
    status text DEFAULT 'activa'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "guestNames" text,
    "guestsCount" integer DEFAULT 1 NOT NULL
);


ALTER TABLE public."Reservation" OWNER TO postgres;

--
-- Name: Room; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Room" (
    id text NOT NULL,
    "roomNumber" text NOT NULL,
    "roomTypeId" text NOT NULL,
    "pricePerNight" double precision NOT NULL,
    status text DEFAULT 'disponible'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Room" OWNER TO postgres;

--
-- Name: RoomImage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RoomImage" (
    id text NOT NULL,
    "roomId" text NOT NULL,
    "imageUrl" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RoomImage" OWNER TO postgres;

--
-- Name: RoomType; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RoomType" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    price double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RoomType" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role text DEFAULT 'ADMIN'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    avatar text,
    name text
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: WebReservation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WebReservation" (
    id text NOT NULL,
    "roomId" text NOT NULL,
    "responsibleName" text NOT NULL,
    "guestCount" integer NOT NULL,
    company text,
    phone text NOT NULL,
    email text,
    "checkIn" timestamp(3) without time zone NOT NULL,
    "checkOut" timestamp(3) without time zone NOT NULL,
    notes text,
    status text DEFAULT 'pendiente'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."WebReservation" OWNER TO postgres;

--
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Customer" (id, name, document, phone, email, address, notes, "createdAt", "updatedAt", "clientType", proforma, "customBreakfastPrice", "customDinnerPrice", "customLunchPrice", "customRoomPrice", "customSnackPrice", "companyId", "companyIndividualPrice", "companySharedPrice") FROM stdin;
6860b096-ed08-4740-949f-b032f60ae423	Cajilema jorge	WEB-1773858314077	0996307475	Jorgecaji@hotmail.com	\N	Generado desde portal web. Empresa: Joya chef	2026-03-18 18:25:14.079	2026-03-18 18:25:14.079	NATURAL	\N	\N	\N	\N	\N	\N	\N	\N	\N
eef285da-268c-4643-ba27-8a9e3d13defe	Narciza zavala	WEB-1773858330017	0982621871	nazavala1@gmail.con	\N	Generado desde portal web. Empresa: Delfín Rosado	2026-03-18 18:25:30.019	2026-03-18 18:25:30.019	NATURAL	\N	\N	\N	\N	\N	\N	\N	\N	\N
76b6058a-5baa-46f8-bceb-2cb6e13cba41	JOse Alarcon	0802997387	0994152855		Quito	\N	2026-03-18 22:47:51.387	2026-03-18 22:47:51.387	NATURAL	\N	\N	\N	\N	\N	\N	\N	\N	\N
3e68e6d1-081f-4120-b5aa-36be46004f9c	Camilo Guallichico	1710557719	0999717523		Quito	\N	2026-03-18 22:48:40.131	2026-03-18 22:48:40.131	NATURAL	\N	\N	\N	\N	\N	\N	\N	\N	\N
e8caa07e-24ed-4dbe-83f6-308916eec799	Geopexa Corp	1234567890001	Geopexa S.A.		1234567890001	\N	2026-03-18 23:39:11.379	2026-03-19 00:18:21.574	NATURAL	\N	6	6	6	\N	6	\N	\N	\N
7d3cfebc-8352-4e23-b163-ae54eb72a69c	RS ROTH COMPARTIDA X2	12				\N	2026-03-19 02:34:48.765	2026-03-19 02:35:43.422	NATURAL	\N	5.39	5.39	5.39	50	5.39	\N	\N	\N
f6852277-51b2-448a-966d-b0016c349447	MONTENEGRO ORLANDO	123			ALA MOREÑA	\N	2026-03-21 22:23:05.679	2026-03-21 22:23:05.679	NATURAL	\N	\N	\N	\N	20	\N	\N	\N	\N
c7748687-ea04-4f0b-a75c-8bfc4438424a	Jefferson Haro	2200344360	0997526477	djhj2320011@gmail.com	El coca	\N	2026-03-14 21:01:42.762	2026-03-24 16:01:38.094	NATURAL	\N	\N	\N	\N	0	\N	\N	\N	\N
85c3e4b0-1430-4e80-9d43-43f283e5df49	OSCAR MERIZALDE	1717710246	0984915111		QUITO	\N	2026-03-19 02:40:14.169	2026-03-25 15:20:38.453	NATURAL	\N	\N	\N	\N	\N	\N	\N	\N	\N
720c0723-ee79-419e-874c-bb24c867b05a	VERONICA JOMAIRA SOLEDISPA SALTOS	2400333346	0997526477	veronica.soledispa@rsroth.com	ALA MOREÑA	\N	2026-03-25 15:25:45.623	2026-03-25 15:25:45.623	NATURAL	\N	5.39	\N	5.39	30	5.39	\N	\N	\N
69b479ce-57d4-456c-be0e-22a6e6d2ea76	EDWIN ANDRADE	2100277488	0997526477		ALA MOREÑA	\N	2026-03-26 22:33:14.967	2026-03-26 22:33:14.967	NATURAL	\N	5.39	\N	5.39	30	5.39	\N	\N	\N
313de74e-443c-43b4-ab39-0f71cc563096	ELADIO SILVA	0201212297	0997526477		ALA MOREÑA	\N	2026-03-26 22:34:01.063	2026-03-26 22:34:01.063	NATURAL	\N	5.39	\N	5.39	30	5.39	\N	\N	\N
3d3b337c-f2d9-46cf-a112-96056ad16dac	RS ROT	1792123456001	0999999999	\N	Quito, Ecuador	\N	2026-03-27 19:07:51.181	2026-03-27 19:07:51.181	EMPRESA	\N	\N	\N	\N	\N	\N	\N	35	25
f3bb2918-3c1b-45af-81bb-c43f68c7953a	JUAN PEREZ (RS ROT)	1722883344	\N	\N	\N	\N	2026-03-27 19:07:51.228	2026-03-27 19:07:51.228	NATURAL	\N	\N	\N	\N	\N	\N	3d3b337c-f2d9-46cf-a112-96056ad16dac	\N	\N
\.


--
-- Data for Name: Expense; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Expense" (id, category, description, amount, date, "createdAt", "updatedAt", "paymentMethod", "transferReference") FROM stdin;
2039b92a-f7f6-4574-93ca-1486361a88bc	Servicios	fosforera	1.5	2026-03-19 00:00:00	2026-03-19 23:40:44.489	2026-03-19 23:40:44.489	cash	
7809b19d-beac-454f-9735-c9b818feb196	Servicios	3 gas glp x3.75	11.25	2026-03-18 00:00:00	2026-03-20 00:13:24.846	2026-03-20 00:13:24.846	cash	
56d24526-c4fc-4f6d-9818-c3bebf2c7ed7	Servicios	COMPRA DE GAS GLP	22.5	2026-03-23 00:00:00	2026-03-24 02:53:18.061	2026-03-24 02:53:18.061	cash	
dd137e22-748e-4a51-820b-4c7c49119783	Inventario	Compra a Supermaxi - TRANSFERENCIA/OFICINA	199.32	2026-03-24 21:08:57.42	2026-03-24 21:08:57.421	2026-03-24 21:08:57.421	office	\N
7591c3f8-5ffc-4877-b11e-bb0979b60e2b	Insumos	Compra de Canguil para servicio	1.8	2026-03-28 00:00:00	2026-03-29 03:33:11.958	2026-03-29 03:33:11.958	cash	
6af0b0f7-a20a-4ebc-8641-87375c82c5f5	Otros	COMPRA DE GALLINA DE CAMPO PARA ALMUERZO DE HALLIBURTON	20	2026-03-29 00:00:00	2026-03-30 04:22:26.725	2026-03-30 04:22:26.725	cash	
7c91c850-d017-4af5-bdb4-34f08908d7f9	Insumos	COMPRA DE LEVAURA SECA EN SOBRES POR EMERGENCIA	2	2026-03-29 00:00:00	2026-03-30 04:23:16.698	2026-03-30 04:23:16.698	cash	
b78eda85-bb3a-4bd1-80ab-a680ab612f19	Servicios	Compra de GAS GLP	30	2026-03-30 00:00:00	2026-03-31 05:06:50.968	2026-03-31 05:06:50.968	cash	
\.


--
-- Data for Name: InventoryTransaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."InventoryTransaction" (id, "productId", type, quantity, notes, "createdAt", "updatedAt", "customerId", "exitType", "reservationId", "roomId", "paymentMethod", "transferReference", status, price) FROM stdin;
919278c6-d3f1-4525-ab57-1c2545fb1058	f184c346-6858-4794-9aaf-1b348c67119e	salida	1	Venta Directa Externa Almuerzo 24-03-2026	2026-03-24 17:32:14.205	2026-03-24 17:32:14.205	\N	venta	\N	\N	cash	\N	settled	3.75
7283ff9a-6524-4c33-87ec-4b0c24adea4a	80f357d9-c700-4cc8-b3f2-b51429289e87	salida	2	Venta de comida/consumo	2026-03-25 16:18:46.6	2026-03-25 16:18:46.6	\N	venta	\N	0a21def1-ff6e-40e0-93c0-4ac4e7c0d9e2	cash	\N	settled	3.75
0b00a5ec-f4bc-443d-a016-076ba72ec145	f5ed8c9c-f746-4b31-b55d-32c1a1c3d210	salida	1	Venta Directa Externa	2026-03-25 16:24:17.378	2026-03-25 16:24:17.378	\N	venta	\N	\N	cash	\N	settled	1
e168ed72-bfa8-48fd-b1dd-4f775722cb10	f57e8ed6-ec0e-4834-9403-7ac9ec973d06	salida	1	CAMBIO DE MERIENDA POR BEBIDAS (ROTH)	2026-03-26 04:47:57.019	2026-03-26 04:47:57.019	\N	canje	\N	\N	cash	\N	pending	2.695
b17b8ec2-9a25-4bcf-b9a6-5b38fdd519bc	e289144e-047a-49d8-b083-c3c77b50a418	salida	1	CAMBIO DE MERIENDA POR BEBIDAS (ROTH)	2026-03-26 04:47:57.048	2026-03-26 04:47:57.048	\N	canje	\N	\N	cash	\N	pending	2.695
f6aff8f2-b4f7-4d9a-8071-98d238188e8d	f57e8ed6-ec0e-4834-9403-7ac9ec973d06	salida	2	CAMBIO DE MERIENDA POR BEBIDAS	2026-03-26 04:49:43.204	2026-03-26 04:49:43.204	\N	canje	\N	\N	cash	\N	pending	2.695
0e9f2cc8-5190-4bd8-a181-6a02572ba6f2	194b15af-8217-408f-a382-48d465b28955	salida	1	Venta Directa Externa 27-03-2026	2026-03-26 12:19:07.248	2026-03-26 12:19:07.248	\N	venta	\N	\N	cash	\N	settled	3.5
35eb57ef-1a0b-44aa-a3d5-cf744fd8055a	f57e8ed6-ec0e-4834-9403-7ac9ec973d06	salida	1	CAMBIO DE DESAYUNO POR BEBIDAS ( RS ROTH)	2026-03-26 22:39:56.044	2026-03-26 22:39:56.044	\N	canje	\N	\N	cash	\N	pending	2.695
bbe3885a-b41f-4016-95fa-24e367d2daf7	e289144e-047a-49d8-b083-c3c77b50a418	salida	1	CAMBIO DE DESAYUNO POR BEBIDAS ( RS ROTH)	2026-03-26 22:39:56.05	2026-03-26 22:39:56.05	\N	canje	\N	\N	cash	\N	pending	2.695
988b47d8-02a9-41a0-886e-1ce2eabf05a7	194b15af-8217-408f-a382-48d465b28955	salida	1	Venta Directa Externa 27-03-2026	2026-03-27 15:27:10.569	2026-03-27 15:27:10.569	\N	venta	\N	\N	cash	\N	settled	3.5
e13e7616-a476-4c23-b1b9-a8e4dd748178	fca56483-39c6-4d4e-9c2e-2eb13aae2b79	salida	1	Venta Directa Externa	2026-03-24 21:38:37.025	2026-03-27 21:39:07.498	c7748687-ea04-4f0b-a75c-8bfc4438424a	venta	\N	\N	office	\N	settled	1.25
d9819a57-1a2a-4d53-9ff9-9458ab99c4ae	e289144e-047a-49d8-b083-c3c77b50a418	salida	1	Venta Directa Externa	2026-03-24 21:38:37.054	2026-03-27 21:39:07.498	c7748687-ea04-4f0b-a75c-8bfc4438424a	venta	\N	\N	office	\N	settled	1.5
71e86bb4-a60f-4366-8b5a-aa992720b2ec	ad405c4f-2ee8-4abf-a23a-fe3acc58f0a5	salida	1	CAMBIO DE ALMUERZO POR BEBIDAS	2026-03-27 22:48:51.795	2026-03-27 22:48:51.795	\N	canje	\N	\N	cash	\N	pending	2.69
c95c2c6d-b252-403e-a42e-1c40ea4c9351	f5ed8c9c-f746-4b31-b55d-32c1a1c3d210	salida	1	CAMBIO DE ALMUERZO POR BEBIDAS	2026-03-27 22:48:51.813	2026-03-27 22:48:51.813	\N	canje	\N	\N	cash	\N	pending	2.69
329d7b6b-1706-45ab-be11-71de61d69d7b	f184c346-6858-4794-9aaf-1b348c67119e	salida	2	Venta de Almuerzos 28-03-2026	2026-03-29 03:43:19.182	2026-03-29 03:43:19.182	\N	venta	\N	\N	transfer	\N	settled	4
9bdb0716-055d-4a8c-9757-ab375454f001	f5ed8c9c-f746-4b31-b55d-32c1a1c3d210	salida	1	cambio de almuerzo por bebidas	2026-03-29 04:01:57.914	2026-03-29 04:01:57.914	\N	canje	\N	\N	cash	\N	pending	2.69
2d66bb51-9233-4e57-bbff-f37b127aa9d4	e289144e-047a-49d8-b083-c3c77b50a418	salida	1	cambio de almuerzo por bebidas	2026-03-29 04:01:57.924	2026-03-29 04:01:57.924	\N	canje	\N	\N	cash	\N	pending	2.69
4bbe547b-f657-4c7c-96bf-7699221ad697	1c2fe4f8-fa7d-4846-ba38-24945a6454a9	entrada	5	Inventario inicial	2026-03-29 04:13:52.107	2026-03-29 04:13:52.107	\N	\N	\N	\N	cash	\N	pending	\N
667bff9e-5618-45f2-8279-a25aca122650	bae54c55-2f82-4eeb-b3b5-6b72392ae2ec	salida	1	Se canjea Bebidas por Combustible para camioneta del Chivo	2026-03-29 04:16:56.882	2026-03-29 04:16:56.882	\N	canje	\N	\N	cash	\N	pending	2.222222222222222
144666c4-7963-46bc-9ff1-2a2be016adf9	ad405c4f-2ee8-4abf-a23a-fe3acc58f0a5	salida	2	Se canjea Bebidas por Combustible para camioneta del Chivo	2026-03-29 04:16:56.892	2026-03-29 04:16:56.892	\N	canje	\N	\N	cash	\N	pending	2.222222222222222
7b5f7918-50c1-4022-a18b-38774ef3e7f8	b0649f7d-70df-4b5e-b07c-20bffee43494	salida	1	Se canjea Bebidas por Combustible para camioneta del Chivo	2026-03-29 04:16:56.899	2026-03-29 04:16:56.899	\N	canje	\N	\N	cash	\N	pending	2.222222222222222
a3275bb8-3acd-420a-809b-254e05f2bedf	f5ed8c9c-f746-4b31-b55d-32c1a1c3d210	salida	1	Se canjea Bebidas por Combustible para camioneta del Chivo	2026-03-29 04:16:56.906	2026-03-29 04:16:56.906	\N	canje	\N	\N	cash	\N	pending	2.222222222222222
255773cf-28fc-4ebc-94de-d059b590e9cf	22f26b9f-4e0b-4763-ac62-346c672d5379	salida	2	Se canjea Bebidas por Combustible para camioneta del Chivo	2026-03-29 04:16:56.914	2026-03-29 04:16:56.914	\N	canje	\N	\N	cash	\N	pending	2.222222222222222
278a6c7b-d4d0-43db-9096-b69221d5ea4e	1c2fe4f8-fa7d-4846-ba38-24945a6454a9	salida	2	Se canjea Bebidas por Combustible para camioneta del Chivo	2026-03-29 04:16:56.921	2026-03-29 04:16:56.921	\N	canje	\N	\N	cash	\N	pending	2.222222222222222
abe63be4-006a-4662-848b-6d1a9723ace0	020ec253-24c3-460a-bc44-afe07b936a83	salida	1	Venta Directa Externa 29-03-2026	2026-03-29 23:28:40.336	2026-03-29 23:28:40.336	\N	venta	\N	\N	cash	\N	settled	3.5
6fc9394e-aecc-498a-9d3a-ce56698a3b87	020ec253-24c3-460a-bc44-afe07b936a83	salida	1	Venta Directa Externa 30-03-2026 CHIVO	2026-03-30 15:33:12.394	2026-03-30 15:33:12.394	\N	venta	\N	\N	cash	\N	settled	3.5
308fc6b7-24c2-43b5-a026-dc6dc8e0d94e	020ec253-24c3-460a-bc44-afe07b936a83	salida	1	Venta Directa Externa 30-03-2026	2026-03-31 05:05:14.07	2026-03-31 05:05:14.07	\N	venta	\N	\N	cash	\N	settled	3.5
6c24f888-aad5-4606-814d-fb07296cdb4d	f184c346-6858-4794-9aaf-1b348c67119e	salida	40	Venta Directa Externa	2026-03-22 14:38:47.537	2026-03-22 14:38:47.537	e8caa07e-24ed-4dbe-83f6-308916eec799	venta	\N	\N	office	\N	pending	6
2022127a-8518-4ff3-94c8-93bf638fcbcd	f57e8ed6-ec0e-4834-9403-7ac9ec973d06	entrada	36	Producto creado desde factura Supermaxi	2026-03-24 21:08:57.286	2026-03-24 21:08:57.286	\N	\N	\N	\N	office	\N	pending	\N
f20427da-d238-4b00-963b-d8ecf7a4c580	976fb8a2-6fa0-4692-949a-3822ae3bd465	entrada	18	Producto creado desde factura Supermaxi	2026-03-24 21:08:57.339	2026-03-24 21:08:57.339	\N	\N	\N	\N	office	\N	pending	\N
0687e70a-8d56-41ea-a23f-dab3f5757b54	ad405c4f-2ee8-4abf-a23a-fe3acc58f0a5	entrada	24	Producto creado desde factura Supermaxi	2026-03-24 21:08:57.346	2026-03-24 21:08:57.346	\N	\N	\N	\N	office	\N	pending	\N
bfe525a8-00ff-407b-9564-fedf959b5c83	9597bc38-51b0-4338-bd2f-b8b550c6d076	entrada	6	Producto creado desde factura Supermaxi	2026-03-24 21:08:57.352	2026-03-24 21:08:57.352	\N	\N	\N	\N	office	\N	pending	\N
0bb98412-082d-4b7b-bab7-feede4e9ca1d	f709bb58-f7e3-43fb-b0c8-88dae7b5b234	entrada	6	Producto creado desde factura Supermaxi	2026-03-24 21:08:57.36	2026-03-24 21:08:57.36	\N	\N	\N	\N	office	\N	pending	\N
86a53025-a7c1-4734-b013-7e504acd46e6	ee5b3eec-bc6f-495a-8006-554ae0d4ad8b	entrada	6	Producto creado desde factura Supermaxi	2026-03-24 21:08:57.366	2026-03-24 21:08:57.366	\N	\N	\N	\N	office	\N	pending	\N
2417cfab-ea05-4b75-9567-15bbf4e28ba4	49ba8122-3ff5-4ee9-b72a-0ba31d2fede2	entrada	12	Producto creado desde factura Supermaxi	2026-03-24 21:08:57.372	2026-03-24 21:08:57.372	\N	\N	\N	\N	office	\N	pending	\N
139f3dd1-5220-4f02-ac99-cef3ff2e001a	495d339c-e894-4f26-a512-94753f3c51fc	entrada	12	Producto creado desde factura Supermaxi	2026-03-24 21:08:57.378	2026-03-24 21:08:57.378	\N	\N	\N	\N	office	\N	pending	\N
3d566391-99ea-4e98-bab4-d7bf0730eb21	f9fda42b-e81e-453e-a530-82c42380d03c	salida	1	Venta Directa Externa	2026-03-19 23:00:57.679	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	1.25
137044ec-2da8-4861-bd20-2f688f42e96f	194b15af-8217-408f-a382-48d465b28955	salida	2	Venta Directa Externa	2026-03-19 23:17:13.893	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	3.5
4e186a93-4429-4d3b-9987-4bf56e936063	f184c346-6858-4794-9aaf-1b348c67119e	salida	1	Venta Directa Externa	2026-03-19 23:36:10.591	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	3
5583bc34-df1b-4c6f-a76e-ce256d313b0d	f184c346-6858-4794-9aaf-1b348c67119e	salida	1	Venta Directa Externa	2026-03-19 23:38:02.088	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	4.3
d1009897-3798-42ab-bda2-ab10fa91ec5d	f184c346-6858-4794-9aaf-1b348c67119e	salida	2	Venta Directa Externa	2026-03-19 23:38:51.997	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	5.75
687127e0-2fd4-4933-a1cb-3bd984c5d2db	71b69e29-a290-47c2-9a68-dc4b36016a3d	entrada	48	Inventario inicial	2026-03-19 23:53:11.764	2026-03-24 15:57:27.718	\N	\N	\N	\N	cash	\N	settled	\N
72cd424b-917d-489b-8770-61c94ea96ddf	6bd650d0-67bc-4cdf-a66d-96b677b65066	salida	1	Venta Directa Externa	2026-03-20 00:01:16.499	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	5
b317c7cf-b449-42b0-9f13-de9e120d0d20	50a0f9fd-8d66-43b5-b08f-3ee7892acd4c	entrada	10	Inventario inicial	2026-03-20 00:03:43.209	2026-03-24 15:57:27.718	\N	\N	\N	\N	cash	\N	settled	\N
dbf492e2-fa0a-4a65-9561-64c9f70362df	f184c346-6858-4794-9aaf-1b348c67119e	salida	3	Venta Directa Externa	2026-03-20 00:11:42.173	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	5
a229fef1-d668-4cc7-9396-f61c95e73dba	f184c346-6858-4794-9aaf-1b348c67119e	salida	1	Venta Directa Externa	2026-03-20 00:12:06.323	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	5.13
4bb0d9a2-e034-47f4-970b-57af058b740c	f184c346-6858-4794-9aaf-1b348c67119e	salida	3	Venta Directa Externa	2026-03-20 00:12:38.344	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	5
cc422806-5d3a-4f80-838e-f1cd8b9926b4	6bd650d0-67bc-4cdf-a66d-96b677b65066	salida	1	Venta Directa Externa deja jefferon	2026-03-20 00:14:11.169	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	2.72
a7a709c4-581c-4d81-9852-b9511cb3e42e	194b15af-8217-408f-a382-48d465b28955	salida	1	Venta Directa Externa	2026-03-21 00:43:25.612	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	3.5
0e27cb93-4336-4c14-9b55-500f1007b54d	f184c346-6858-4794-9aaf-1b348c67119e	salida	2	Venta Directa Externa	2026-03-21 17:51:42.422	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	3.75
52b31e3d-2cf2-4268-bbdb-efb295c1eea8	e289144e-047a-49d8-b083-c3c77b50a418	entrada	11	Inventario inicial	2026-03-21 22:00:25.032	2026-03-24 15:57:27.718	\N	\N	\N	\N	cash	\N	settled	\N
5ef7354f-cc81-4389-a89d-5887953bc932	e289144e-047a-49d8-b083-c3c77b50a418	salida	1	21-03-2026 CAMBIO POR ALMUERZO RS ROTH	2026-03-21 22:01:35.586	2026-03-24 15:57:27.718	\N	canje	\N	\N	cash	\N	settled	5.39
80229bdc-f667-4c8b-86bd-76c4a0f86f18	71b69e29-a290-47c2-9a68-dc4b36016a3d	salida	12	CAMBIO DE COMIDAS	2026-03-21 22:08:57.93	2026-03-24 15:57:27.718	\N	canje	\N	\N	cash	\N	settled	3
26f03dd9-b7e4-48fb-9715-e95b07261e9f	581b7061-b2cb-4f96-9b2e-f2c6cc9ca2b6	salida	12	CAMBIO DE COMIDAS	2026-03-21 22:08:57.957	2026-03-24 15:57:27.718	\N	canje	\N	\N	cash	\N	settled	3
ad208d30-a8ef-425b-a5a2-9d086635ffcc	f9fda42b-e81e-453e-a530-82c42380d03c	salida	1	CORTESIA PARA PERSONAL PEC AUTORIZADO POR VERONICA CAJILEMA	2026-03-21 22:11:11.371	2026-03-24 15:57:27.718	\N	canje	\N	\N	cash	\N	settled	1
a16b1ac2-9b35-499f-8a5d-bf5ff537dc17	6bd650d0-67bc-4cdf-a66d-96b677b65066	salida	1	Venta Directa Externa desayuno	2026-03-22 12:37:32.922	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	5
0742deb5-d851-434d-af8a-1fdd999164af	6bd650d0-67bc-4cdf-a66d-96b677b65066	salida	3	Venta Directa Externa desayuno	2026-03-22 12:39:52.467	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	5
c0ca3004-f82b-4c7a-9c0f-8397c63faf7a	6bd650d0-67bc-4cdf-a66d-96b677b65066	salida	7	Venta Directa Externa	2026-03-22 13:10:58.549	2026-03-24 15:57:27.718	\N	venta	\N	\N	transfer	#49419928 #49420658	settled	3.75
6efe1450-b331-466f-9ad0-9bb42a219777	f184c346-6858-4794-9aaf-1b348c67119e	salida	2	Venta Directa Externa Almuerzos	2026-03-22 18:03:01.637	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	3.75
41a019bb-bdfc-48e3-aea5-6dd6be075989	f184c346-6858-4794-9aaf-1b348c67119e	salida	9	Venta Directa Externa Almuerzos con Trasferencia	2026-03-22 18:06:23.901	2026-03-24 15:57:27.718	\N	venta	\N	\N	transfer	61800010 61945636 62020549 62044974 6206946 62275519 62477160	settled	3.75
0bf848f5-bff3-49c7-a855-71a2b38d1d46	22f26b9f-4e0b-4763-ac62-346c672d5379	entrada	23	Inventario inicial	2026-03-22 18:54:48.77	2026-03-24 15:57:27.718	\N	\N	\N	\N	cash	\N	settled	\N
81ed600a-a152-4a96-ab8a-94da3a82e004	194b15af-8217-408f-a382-48d465b28955	salida	2	Venta Directa Externa	2026-03-22 22:40:24.062	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	3.5
411f136d-75cd-48fa-9b75-53508df38ae2	f184c346-6858-4794-9aaf-1b348c67119e	salida	5	Venta Directa Externa	2026-03-22 22:42:26.781	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	3
d9c93364-6f20-45fe-84a5-81b3cb5735fa	80f357d9-c700-4cc8-b3f2-b51429289e87	salida	2	Venta Directa Externa 2 Meriendas	2026-03-22 23:33:17.335	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	3.75
f8b7cd51-c90f-42c0-8cc8-70cd3deca3ad	b1fa79e6-238e-486d-87ea-d01f32e9cbed	salida	2	Venta Directa Externa	2026-03-22 23:34:39.836	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	1.5
ef66e252-d4bd-419b-a653-7fb7e9639c52	e289144e-047a-49d8-b083-c3c77b50a418	salida	1	Cambio de almuerzo por bebida 220v	2026-03-24 03:26:46.202	2026-03-24 15:57:27.718	\N	canje	\N	\N	cash	\N	settled	5.39
bdfe64dc-f09a-4cec-ae29-3fd1b1c2d4a8	f5ed8c9c-f746-4b31-b55d-32c1a1c3d210	entrada	24	Producto creado desde factura Supermaxi	2026-03-24 21:08:57.383	2026-03-24 21:08:57.383	\N	\N	\N	\N	office	\N	pending	\N
78b2bf02-261a-47bd-b149-af573fd2e28b	6bd650d0-67bc-4cdf-a66d-96b677b65066	salida	9	Venta Directa Externa	2026-03-23 12:04:10.662	2026-03-24 15:57:27.718	\N	venta	\N	\N	transfer	8859477 88602913 88631354 88631707 88638222 88641576 88663408 88877414 	settled	3.75
8e779ec8-a43e-44c5-b4b9-f289e82d4ec8	6bd650d0-67bc-4cdf-a66d-96b677b65066	salida	2	Venta Directa Externa Desayunos	2026-03-23 13:13:28.305	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	3.75
8bcf4bd1-c5f3-436c-b4c9-1d85bb65dc34	f184c346-6858-4794-9aaf-1b348c67119e	salida	1	Venta Directa Externa ALMUERZO	2026-03-24 02:35:33.924	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	3.75
4ee9b0e6-65b0-4234-9e4b-b914de1ee426	f184c346-6858-4794-9aaf-1b348c67119e	salida	6	Venta Directa Externa ALMUERZOS	2026-03-24 02:58:54.828	2026-03-24 15:57:27.718	\N	venta	\N	\N	transfer	115288173-114879509-2202653695-2200529712-2204267345-111215644	settled	3.75
5cdccf72-f501-478e-9b21-6ec2011d30d5	22f26b9f-4e0b-4763-ac62-346c672d5379	salida	1	Venta Directa Externa	2026-03-24 03:03:05.021	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	0.75
23ad16f0-9f3a-49b7-bb8c-b039d5884d12	71b69e29-a290-47c2-9a68-dc4b36016a3d	salida	1	Venta Directa Externa	2026-03-24 03:08:05.552	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	0.5
5c42003a-cfbf-44f8-a4b2-891d99da3a89	80f357d9-c700-4cc8-b3f2-b51429289e87	salida	2	Venta Directa Externa MERIENDA	2026-03-24 03:09:26.203	2026-03-24 15:57:27.718	\N	venta	\N	\N	cash	\N	settled	4
05c88843-4312-466d-9b8f-74fa61657444	e289144e-047a-49d8-b083-c3c77b50a418	salida	1	Cambio de almuerzo por 2 bebidas	2026-03-24 03:28:40.943	2026-03-24 15:57:27.718	\N	canje	\N	\N	cash	\N	settled	2.695
4f938698-8c2e-49b6-b5d3-8e0e6b710c97	e289144e-047a-49d8-b083-c3c77b50a418	salida	1	cambio de Almuerzo por bebidas	2026-03-24 03:30:42.301	2026-03-24 15:57:27.718	\N	canje	\N	\N	cash	\N	settled	2.69
636f432e-beb1-4020-b4d6-6c6b211ecd7f	9fa7847e-9793-4150-99a1-5b91de402899	salida	1	cambio de Almuerzo por bebidas	2026-03-24 03:30:42.319	2026-03-24 15:57:27.718	\N	canje	\N	\N	cash	\N	settled	2.69
18ce58e8-8741-40d7-bada-d4361b82ad94	581b7061-b2cb-4f96-9b2e-f2c6cc9ca2b6	salida	1	cambio por Merienda	2026-03-24 03:32:42.81	2026-03-24 15:57:27.718	\N	canje	\N	\N	cash	\N	settled	2.695
28a0976d-6951-4b32-be92-8de7f2d74efd	9fa7847e-9793-4150-99a1-5b91de402899	salida	1	cambio por Merienda	2026-03-24 03:32:42.815	2026-03-24 15:57:27.718	\N	canje	\N	\N	cash	\N	settled	2.695
8adba188-0976-468b-8173-ccc1811b3b17	e289144e-047a-49d8-b083-c3c77b50a418	salida	1	cambio de almuerzo	2026-03-24 03:34:17.602	2026-03-24 15:57:27.718	\N	canje	\N	\N	cash	\N	settled	2.695
491da4aa-928e-4f47-9b5a-d39a269fd9d4	b0649f7d-70df-4b5e-b07c-20bffee43494	entrada	24	Producto creado desde factura Supermaxi	2026-03-24 21:08:57.39	2026-03-24 21:08:57.39	\N	\N	\N	\N	office	\N	pending	\N
d9e931d1-6bd0-4ec3-b963-e7d7674eb055	2e4dba1a-6aa9-42a1-9c35-c7f606970f9f	entrada	8	Producto creado desde factura Supermaxi	2026-03-24 21:08:57.396	2026-03-24 21:08:57.396	\N	\N	\N	\N	office	\N	pending	\N
d6b62ff7-fc18-4bf0-8c83-3078a95c57b3	fca56483-39c6-4d4e-9c2e-2eb13aae2b79	entrada	7	Producto creado desde factura Supermaxi	2026-03-24 21:08:57.401	2026-03-24 21:08:57.401	\N	\N	\N	\N	office	\N	pending	\N
b49ce51f-8f78-4d0a-b736-11584d658e18	f832cfdc-ff00-4f5c-bf7a-5574ac0ac13f	entrada	8	Producto creado desde factura Supermaxi	2026-03-24 21:08:57.408	2026-03-24 21:08:57.408	\N	\N	\N	\N	office	\N	pending	\N
325f37dc-f43d-4528-a752-85c3539042eb	020ec253-24c3-460a-bc44-afe07b936a83	entrada	28	Producto creado desde factura Supermaxi	2026-03-24 21:08:57.418	2026-03-24 21:08:57.418	\N	\N	\N	\N	office	\N	pending	\N
9fe9c498-e825-4821-928e-fe163ed2a13c	b0649f7d-70df-4b5e-b07c-20bffee43494	salida	1	Venta Directa Externa	2026-03-25 16:22:51.176	2026-03-25 16:22:51.176	\N	venta	\N	\N	cash	\N	settled	1
2f2db427-9d15-41f3-b46b-f8c52feefd33	80f357d9-c700-4cc8-b3f2-b51429289e87	salida	3	Venta de comida/consumo	2026-03-25 16:25:28.227	2026-03-25 16:25:28.227	\N	venta	\N	\N	cash	\N	settled	3.75
20a88b0e-b4cb-4170-92b2-bff9cced5497	80f357d9-c700-4cc8-b3f2-b51429289e87	salida	3	3 MERIENDAS 25-03-2026	2026-03-26 04:57:17.457	2026-03-26 04:57:17.457	\N	venta	\N	\N	cash	\N	settled	3.75
d23ef174-2b63-4160-a158-6e8304c86e6c	f184c346-6858-4794-9aaf-1b348c67119e	salida	2	Para llevar	2026-03-26 17:18:15.73	2026-03-26 17:18:15.73	\N	venta	\N	\N	transfer	Venta de almuerzos 26-03-2026	settled	5
9b9f48e0-6dcb-4a1d-aeff-96b23c4d00c7	194b15af-8217-408f-a382-48d465b28955	salida	1	Venta Directa Externa 26-03-2026	2026-03-27 04:04:32.83	2026-03-27 04:04:32.83	\N	venta	\N	\N	cash	\N	settled	3.5
350bad65-47b5-4e84-b50e-d031903dc654	f184c346-6858-4794-9aaf-1b348c67119e	salida	3	ALMUERZOS PARA LLEVAR 27-03-2026	2026-03-27 16:55:51.177	2026-03-27 16:55:51.177	\N	venta	\N	\N	cash	\N	settled	4
87bad76f-d87a-4375-9829-588140e465b6	fca56483-39c6-4d4e-9c2e-2eb13aae2b79	salida	1	Venta Directa Externa	2026-03-27 19:29:00.911	2026-03-27 23:51:29.689	c7748687-ea04-4f0b-a75c-8bfc4438424a	venta	\N	\N	office	\N	settled	1.25
58cc2f47-3d46-4aa0-a54a-e99645f96aef	f9fda42b-e81e-453e-a530-82c42380d03c	salida	1	Venta Directa Externa	2026-03-27 19:29:00.936	2026-03-27 23:51:29.689	c7748687-ea04-4f0b-a75c-8bfc4438424a	venta	\N	\N	office	\N	settled	1.25
0ab39a9c-d353-4ba7-8578-d3fcf45c339f	fca56483-39c6-4d4e-9c2e-2eb13aae2b79	salida	1	Venta Directa Externa	2026-03-27 23:50:02.26	2026-03-27 23:51:29.689	c7748687-ea04-4f0b-a75c-8bfc4438424a	venta	\N	\N	office	\N	settled	1.25
72575623-c26d-40d0-a494-6960c37de15f	e289144e-047a-49d8-b083-c3c77b50a418	salida	1	Venta Directa Externa	2026-03-27 23:50:02.283	2026-03-27 23:51:29.689	c7748687-ea04-4f0b-a75c-8bfc4438424a	venta	\N	\N	office	\N	settled	1.5
5a12facc-48dd-457d-be8d-9afc2ec65357	f57e8ed6-ec0e-4834-9403-7ac9ec973d06	salida	2	cambio de desayuno por bebidas	2026-03-29 04:00:29.574	2026-03-29 04:00:29.574	\N	canje	\N	\N	cash	\N	pending	2.695
d0dac0d0-b1e0-4778-bc33-1aaf46b2f5ce	bae54c55-2f82-4eeb-b3b5-6b72392ae2ec	entrada	6	Inventario inicial	2026-03-29 04:06:27.533	2026-03-29 04:06:27.533	\N	\N	\N	\N	cash	\N	pending	\N
447f85cb-6d96-4a32-903f-91318b9ee434	1c2fe4f8-fa7d-4846-ba38-24945a6454a9	entrada	5	Stock sumado automáticamente al detectar nombre repetido	2026-03-29 04:13:52.2	2026-03-29 04:13:52.2	\N	\N	\N	\N	cash	\N	pending	\N
2dddd88f-5912-42c6-8a44-a46d8cd0f7a0	f9fda42b-e81e-453e-a530-82c42380d03c	salida	1	CAMBIO DE 1 DESAYUNO Y 1 ALMUERZO POR BEBIDAS	2026-03-29 17:33:50.506	2026-03-29 17:33:50.506	\N	canje	\N	\N	cash	\N	pending	2.625
8c7fdc5d-36ee-419c-8fe8-5747db4afc53	f57e8ed6-ec0e-4834-9403-7ac9ec973d06	salida	2	CAMBIO DE 1 DESAYUNO Y 1 ALMUERZO POR BEBIDAS	2026-03-29 17:33:50.527	2026-03-29 17:33:50.527	\N	canje	\N	\N	cash	\N	pending	2.625
5e5cbd10-63cd-4652-a910-cc90d71a8a44	2e4dba1a-6aa9-42a1-9c35-c7f606970f9f	salida	1	CAMBIO DE 1 DESAYUNO Y 1 ALMUERZO POR BEBIDAS	2026-03-29 17:33:50.53	2026-03-29 17:33:50.53	\N	canje	\N	\N	cash	\N	pending	2.625
c17d8602-50bf-45f9-aa4d-ec56ac469c15	020ec253-24c3-460a-bc44-afe07b936a83	salida	1	Venta Directa Externa 29-03-2026	2026-03-30 04:20:48.08	2026-03-30 04:20:48.08	\N	venta	\N	\N	cash	\N	settled	3.5
8aee3e43-8c53-4353-b718-1b48172e94a7	020ec253-24c3-460a-bc44-afe07b936a83	salida	1	Venta Directa Externa	2026-03-30 16:56:29.41	2026-03-30 16:56:29.41	\N	venta	\N	\N	transfer	112748457	settled	3.5
\.


--
-- Data for Name: Invoice; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Invoice" (id, "reservationId", "totalAmount", status, "createdAt", "updatedAt", "companyId", "invoiceType", "paymentMethod", "transferReference") FROM stdin;
13dd7ce2-02d4-432c-97d7-6d941a084870	\N	5.25	pagada	2026-03-27 23:51:29.678	2026-03-27 23:51:29.678	c7748687-ea04-4f0b-a75c-8bfc4438424a	NORMAL	transfer	\N
f248759d-019c-4609-a2ad-57d644c8eb4b	2ed6b46e-3519-462d-bb90-5bc185a6f54c	60	borrador	2026-03-26 21:54:03.04	2026-03-27 23:57:22.966	\N	NORMAL	office	\N
86520544-464f-49fe-9cb3-1e28352c5530	4f64e0df-c97f-49a5-9f71-7d02478d4fff	120	borrador	2026-03-29 03:01:27.828	2026-03-29 03:01:27.828	\N	NORMAL	office	\N
046302ff-217d-45a4-9e97-90b96c289d44	a95f36ac-6469-4cf6-8661-4b77ab23233f	30	borrador	2026-03-31 22:35:52.208	2026-03-31 22:35:52.208	\N	NORMAL	office	\N
0ec88ccb-3835-4498-8660-8f04ae41a7e8	3fee9762-7009-4440-80ad-1dbccae51bf5	150	borrador	2026-03-31 22:36:34.097	2026-03-31 22:36:34.097	\N	NORMAL	office	\N
265b8edd-e02a-4c6f-92d5-eeaa7928167d	232743bf-d7f7-4fc6-83c4-46bac5cb8ad0	30	borrador	2026-03-31 22:37:03.833	2026-03-31 22:37:03.833	\N	NORMAL	office	\N
27f09d52-f557-45ad-bcfe-3a2a37bab1c8	fafb260d-92a0-4731-9e44-f7d4b4d127d3	150	borrador	2026-03-31 22:37:35.512	2026-03-31 22:37:35.512	\N	NORMAL	office	\N
\.


--
-- Data for Name: InvoiceItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."InvoiceItem" (id, "invoiceId", type, description, quantity, "unitPrice", "totalPrice", "productId", "createdAt", "updatedAt") FROM stdin;
afbbfbd5-a397-48c7-8a56-52348bb90e7f	f248759d-019c-4609-a2ad-57d644c8eb4b	habitacion	Alojamiento (2 noc)	2	30	60	\N	2026-03-26 21:54:03.04	2026-03-26 21:54:03.04
2ea23731-ef21-4289-b67a-6f1fbf13ca52	13dd7ce2-02d4-432c-97d7-6d941a084870	servicio	Liquidación de consumos acumulados (4 ítems)	1	5.25	5.25	\N	2026-03-27 23:51:29.678	2026-03-27 23:51:29.678
1e13c9ff-7d84-48a6-a280-fcd70274f764	86520544-464f-49fe-9cb3-1e28352c5530	habitacion	Alojamiento (4 noc)	4	30	120	\N	2026-03-29 03:01:27.828	2026-03-29 03:01:27.828
c82683ab-a867-4c77-b033-7e9f34698b88	046302ff-217d-45a4-9e97-90b96c289d44	habitacion	Alojamiento (1 noc)	1	30	30	\N	2026-03-31 22:35:52.208	2026-03-31 22:35:52.208
30d452de-1f45-480f-9ed5-bc7c0a48a6e9	0ec88ccb-3835-4498-8660-8f04ae41a7e8	habitacion	Alojamiento (5 noc)	5	30	150	\N	2026-03-31 22:36:34.097	2026-03-31 22:36:34.097
3d7dbed3-2ac6-48f4-84ff-001d3f17bbff	265b8edd-e02a-4c6f-92d5-eeaa7928167d	habitacion	Alojamiento (1 noc)	1	30	30	\N	2026-03-31 22:37:03.833	2026-03-31 22:37:03.833
4eb26d9d-ed14-40b7-9ebf-6dbc9a4a3eff	27f09d52-f557-45ad-bcfe-3a2a37bab1c8	habitacion	Alojamiento (5 noc)	5	30	150	\N	2026-03-31 22:37:35.512	2026-03-31 22:37:35.512
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Product" (id, barcode, name, weight, "expirationDate", category, supplier, "purchasePrice", "salePrice", stock, "createdAt", "updatedAt", "minStock", "isSellable", unit) FROM stdin;
b1fa79e6-238e-486d-87ea-d01f32e9cbed	7862109430958	Gatorade 473ml	\N	2026-08-18 00:00:00	Bebida	\N	1.1	1.5	2	2026-03-19 22:36:03.719	2026-03-22 23:34:39.839	5	t	unidad
a36d9a8e-1d0b-43ce-b733-0f0cbc6dbe3f	7861024611060	Fuze Tea 500ml	\N	2026-07-27 00:00:00	Bebida	\N	0.7	1.25	0	2026-03-19 22:36:03.684	2026-03-19 22:36:03.684	5	t	unidad
c7487ab8-4328-4d6d-bd2f-4aa2e0dec0f7	7702354945992	Saviloe 320ml	\N	2026-07-08 00:00:00	Bebida	\N	1	1.25	9	2026-03-19 22:36:03.737	2026-03-19 22:36:03.737	5	t	unidad
530efcab-d54c-41f5-887c-4ed2c1375d23	7862100730804	Mayonesa Galón	\N	2026-06-15 00:00:00	Abastos	\N	16.75	16.75	1	2026-03-19 22:47:47.218	2026-03-19 22:47:47.218	5	f	unidad
f79685d3-5fce-4621-a315-4e7403a7d9b9	7861001267129	Mostaza Galón	\N	2027-01-28 00:00:00	Abastos	\N	15.61	15.61	1	2026-03-19 22:47:47.221	2026-03-19 22:47:47.221	5	f	unidad
f832cfdc-ff00-4f5c-bf7a-5574ac0ac13f	\N	IMPERIAL LIMONADA	\N	\N	BEBIDAS	Supermaxi	0.7	1.25	8	2026-03-24 21:08:57.407	2026-03-24 21:08:57.407	5	t	unidad
bae54c55-2f82-4eeb-b3b5-6b72392ae2ec	010	Saviloe 320 ml	\N	2026-05-01 00:00:00	Bebidas	\N	0.5	1	5	2026-03-29 04:06:27.508	2026-03-29 04:16:56.886	5	t	unidad
50a0f9fd-8d66-43b5-b08f-3ee7892acd4c	7861111234567	Test Duplicate	\N	\N	Bebida	\N	1	2	10	2026-03-20 00:03:43.174	2026-03-20 00:03:43.174	5	t	unidad
71b69e29-a290-47c2-9a68-dc4b36016a3d		Agua vitaljoya de 600 ml	\N	\N	bebidas	\N	0.3	0.5	35	2026-03-19 23:53:11.76	2026-03-24 03:08:05.557	5	t	unidad
ad405c4f-2ee8-4abf-a23a-fe3acc58f0a5	\N	COCA COLA	\N	\N	BEBIDAS	Supermaxi	0.7	1.25	21	2026-03-24 21:08:57.344	2026-03-29 04:16:56.895	5	t	unidad
58f68491-7cb7-40ed-a215-005eb1edf061	\N	Recargo Alojamiento	\N	\N	SERVICIO	\N	0	0	999999	2026-03-24 23:02:19.23	2026-03-24 23:02:19.23	0	t	unid
b0649f7d-70df-4b5e-b07c-20bffee43494	\N	GATORADE NON SUGAR APPLE ICE	\N	\N	BEBIDAS	Supermaxi	0.46	1	22	2026-03-24 21:08:57.388	2026-03-29 04:16:56.902	5	t	unidad
f5ed8c9c-f746-4b31-b55d-32c1a1c3d210	\N	GATORADE TROPICAL FRUIT SA	\N	\N	BEBIDAS	Supermaxi	0.46	1	20	2026-03-24 21:08:57.382	2026-03-29 04:16:56.909	5	t	unidad
020ec253-24c3-460a-bc44-afe07b936a83	\N	COCA COLA ORIGINAL	\N	\N	BEBIDAS	Supermaxi	2.41	3.5	23	2026-03-24 21:08:57.415	2026-03-31 05:05:14.086	5	t	unidad
22f26b9f-4e0b-4763-ac62-346c672d5379	7862106704595	Vive 100 300ml	\N	2026-06-18 00:00:00	Bebidas	\N	0.5	0.75	20	2026-03-22 18:54:48.749	2026-03-29 04:16:56.917	5	t	unidad
1c2fe4f8-fa7d-4846-ba38-24945a6454a9	011	FUZE TEA 550 ML	\N	2026-07-27 00:00:00	Bebidas	\N	0.75	1.25	8	2026-03-29 04:13:52.102	2026-03-29 04:16:56.925	5	t	unidad
f9fda42b-e81e-453e-a530-82c42380d03c	009497002993	Pony Malta 330ml	\N	2026-05-17 00:00:00	Bebidas	\N	0.5	1.25	7	2026-03-19 22:36:03.726	2026-03-29 17:33:50.522	5	t	unidad
581b7061-b2cb-4f96-9b2e-f2c6cc9ca2b6	7862109437599	Gatorade 500ml	\N	\N	Bebida	\N	0.75	1.25	7	2026-03-19 22:36:03.73	2026-03-24 03:32:42.812	5	t	unidad
f57e8ed6-ec0e-4834-9403-7ac9ec973d06	\N	COCA COLA LATA	\N	\N	BEBIDAS	Supermaxi	1.04	1.5	28	2026-03-24 21:08:57.247	2026-03-29 17:33:50.528	5	t	unidad
fca56483-39c6-4d4e-9c2e-2eb13aae2b79	\N	IMPERIAL AGUA MINERAL SABOR TORONJA PET	\N	\N	BEBIDAS	Supermaxi	0.7	1.25	4	2026-03-24 21:08:57.399	2026-03-27 23:50:02.275	5	t	unidad
9fa7847e-9793-4150-99a1-5b91de402899	7801610002193	Fanta lata 350ml	\N	2026-07-05 00:00:00	Bebida	\N	1.3	1.5	0	2026-03-19 22:36:03.722	2026-03-24 03:32:42.817	5	t	unidad
2e4dba1a-6aa9-42a1-9c35-c7f606970f9f	\N	IMPERIAL AGUA MINERAL SABOR MANDARINA	\N	\N	BEBIDAS	Supermaxi	0.7	1.25	7	2026-03-24 21:08:57.394	2026-03-29 17:33:50.531	5	t	unidad
f184c346-6858-4794-9aaf-1b348c67119e	\N	Almuerzo	\N	\N	COMIDA	\N	0	10	-84	2026-03-19 01:04:36.816	2026-03-29 03:43:19.214	0	t	plato
976fb8a2-6fa0-4692-949a-3822ae3bd465	\N	GUITIG	\N	\N	BEBIDAS	Supermaxi	0.55	1.25	18	2026-03-24 21:08:57.337	2026-03-24 21:08:57.337	5	t	unidad
9597bc38-51b0-4338-bd2f-b8b550c6d076	\N	FIORA HARMONY FRESA.	\N	\N	BEBIDAS	Supermaxi	0.43	1	6	2026-03-24 21:08:57.35	2026-03-24 21:08:57.35	5	t	unidad
f709bb58-f7e3-43fb-b0c8-88dae7b5b234	\N	INCA KOLA.	\N	\N	BEBIDAS	Supermaxi	0.34	0.75	6	2026-03-24 21:08:57.357	2026-03-24 21:08:57.357	5	t	unidad
ee5b3eec-bc6f-495a-8006-554ae0d4ad8b	\N	SPRITE HARMONY	\N	\N	BEBIDAS	Supermaxi	0.39	1	6	2026-03-24 21:08:57.364	2026-03-24 21:08:57.364	5	t	unidad
49ba8122-3ff5-4ee9-b72a-0ba31d2fede2	\N	GATORADE UVA - vidrio	\N	\N	BEBIDAS	Supermaxi	0.94	1.5	12	2026-03-24 21:08:57.37	2026-03-24 21:08:57.37	5	t	unidad
495d339c-e894-4f26-a512-94753f3c51fc	\N	GATORADE FRUTAS TROPICALES - vidrio	\N	\N	BEBIDAS	Supermaxi	0.94	1.5	12	2026-03-24 21:08:57.377	2026-03-24 21:08:57.377	5	t	unidad
194b15af-8217-408f-a382-48d465b28955	7861024604222	Coca Cola 3 litros	\N	2026-05-03 00:00:00	Bebida	\N	3.1	3.5	0	2026-03-19 22:36:03.744	2026-03-27 15:27:10.591	5	t	unidad
e289144e-047a-49d8-b083-c3c77b50a418	3	220V 600ML	\N	2026-11-07 00:00:00	BEBIDAS	\N	1	1.5	1	2026-03-21 22:00:24.954	2026-03-29 04:01:57.927	5	t	unidad
992396ca-a097-4739-b9f4-9f6d03741796	7861057500027	Sal 2kg	\N	2028-01-06 00:00:00	Abastos	\N	0.97	0.97	13	2026-03-19 22:47:47.16	2026-03-19 22:47:47.16	5	f	unidad
f129d3fc-5f1f-4ed5-bfb1-2a18c27ebede	7861042578871	Panela	\N	2026-07-21 00:00:00	Repostería	\N	2.53	2.53	7	2026-03-19 22:47:47.162	2026-03-19 22:47:47.162	5	f	unidad
e961574b-b0a3-4973-9eb3-2bff8a5cf850	7862100142522	Papel Aluminio 150 m	\N	\N	Plásticos	\N	15	15	2	2026-03-19 22:47:47.165	2026-03-19 22:47:47.165	5	f	unidad
f67dd400-7f98-481f-a83c-837832561283	01	Hojaldrina margarina 2.5kg	\N	2026-04-11 00:00:00	Repostería	\N	9.49	9.49	1	2026-03-19 22:47:47.168	2026-03-19 22:47:47.168	5	f	unidad
2938bb5e-7e6f-47cd-8527-c0760add6c67	7861001235524	Tres Leches 1 litro	\N	2026-09-20 00:00:00	Repostería	\N	4.57	4.57	3	2026-03-19 22:47:47.17	2026-03-19 22:47:47.17	5	f	unidad
9315f939-c79f-4c31-9cb4-433e9883d5a1	\N	Cena	\N	\N	COMIDA	\N	0	10	0	2026-03-19 01:04:36.823	2026-03-24 15:32:09.041	0	t	plato
6bd650d0-67bc-4cdf-a66d-96b677b65066	\N	Desayuno	\N	\N	COMIDA	\N	0	10	-24	2026-03-19 01:04:36.799	2026-03-28 00:00:40.824	0	t	plato
80f357d9-c700-4cc8-b3f2-b51429289e87	\N	Merienda	\N	\N	COMIDA	\N	0	10	-12	2026-03-19 01:04:36.819	2026-03-26 04:57:17.461	0	t	plato
5dcf5a00-8263-42d0-a460-88b2cbbeb594	8410095005149	Cereza Verde 160 gr	\N	2029-09-10 00:00:00	Repostería	\N	3.35	3.35	2	2026-03-19 22:47:47.09	2026-03-19 22:47:47.09	5	f	unidad
91780254-09ca-4432-9520-d4fb58210c38	7861015120076	Mermelada varios sabores 600ml	\N	2027-06-12 00:00:00	Repostería	\N	4.03	4.03	4	2026-03-19 22:47:47.108	2026-03-19 22:47:47.108	5	f	unidad
325b79c9-094e-4367-acd3-92c1dbb2c008	7861001911121	Mermelada varios sabores 290gr	\N	2027-12-18 00:00:00	Repostería	\N	2.65	2.65	2	2026-03-19 22:47:47.112	2026-03-19 22:47:47.112	5	f	unidad
233ca677-381f-4bac-9741-ea329ff9e96a	7861042556824	Leche Evaporada 410ml	\N	2026-10-18 00:00:00	Repostería	\N	2.59	2.59	2	2026-03-19 22:47:47.115	2026-03-19 22:47:47.115	5	f	unidad
edbbf4fa-fa83-470f-8b96-fc661e1271e5	8445291182745	Leche Condensada 393ml	\N	2026-08-10 00:00:00	Repostería	\N	2.5	2.5	6	2026-03-19 22:47:47.119	2026-03-19 22:47:47.119	5	f	unidad
79480a7f-b26f-47b9-b87f-8f9b8be2cdb2	7861001922271	Duraznos mitades en lata 820g	\N	2029-07-06 00:00:00	Repostería	\N	5.13	5.13	4	2026-03-19 22:47:47.122	2026-03-19 22:47:47.122	5	f	unidad
b947e5f0-8e42-4b97-9bf0-380fceed2cec	7861008901446	Flan Cajita	\N	2026-06-21 00:00:00	Repostería	\N	1.65	1.65	11	2026-03-19 22:47:47.125	2026-03-19 22:47:47.125	5	f	unidad
ae279e32-41e7-4c42-9c72-ee8c4318ad09	7862109400548	Chispas de Chocolate 200g	\N	2027-01-16 00:00:00	Repostería	\N	2.73	2.73	3	2026-03-19 22:47:47.127	2026-03-19 22:47:47.127	5	f	unidad
38bcaf18-af52-4fe8-9936-3dd2026ef791	7861008901897	Escencia de Coco	\N	2026-08-20 00:00:00	Repostería	\N	8.58	8.58	1	2026-03-19 22:47:47.13	2026-03-19 22:47:47.13	5	f	unidad
01d0d908-ad73-48bf-8329-d46d42c87af7	7861008914200	Crema Chantipack 1 litro	\N	2026-10-16 00:00:00	Repostería	\N	7.62	7.62	1	2026-03-19 22:47:47.173	2026-03-19 22:47:47.173	5	f	unidad
f22ea206-6608-4baa-9ccd-b35c9b211b5c	7861008901828	Escencia de Vainilla	\N	2026-09-09 00:00:00	Repostería	\N	6.45	6.45	2	2026-03-19 22:47:47.133	2026-03-19 22:47:47.133	5	f	unidad
35ab227f-2e85-41f7-b5ce-70846d68bef0	7862107781939	Miel de abeja 450ml	\N	2026-11-17 00:00:00	Repostería	\N	10	10	1	2026-03-19 22:47:47.137	2026-03-19 22:47:47.137	5	f	unidad
839e107f-4402-4245-a071-205120cb1010	7861063507966	Miel de Maple 355ml	\N	2027-03-22 00:00:00	Repostería	\N	3.55	3.55	1	2026-03-19 22:47:47.14	2026-03-19 22:47:47.14	5	f	unidad
4d919d03-8490-4849-8354-b038663e9643	7861008900364	Crema pastelera 500g	\N	2026-10-02 00:00:00	Repostería	\N	1.74	1.74	6	2026-03-19 22:47:47.175	2026-03-19 22:47:47.175	5	f	unidad
dba98773-ac90-4ad2-9d70-5291f2d79dfa	7861042577775	Gelatina varios sabores	\N	2026-07-24 00:00:00	Repostería	\N	2.8	2.8	15	2026-03-19 22:47:47.177	2026-03-19 22:47:47.177	5	f	unidad
765d18a2-c921-4ac2-b19c-204be82195d3	7862106455053	Cobertura de Chocolate negro 200g	\N	2027-06-18 00:00:00	Repostería	\N	3.75	3.75	3	2026-03-19 22:47:47.18	2026-03-19 22:47:47.18	5	f	unidad
95eecbb3-b735-4d7a-b960-51210aaae665	7861005205660	Café pasado 360gr	\N	2026-10-16 00:00:00	Abastos	\N	5	5	18	2026-03-19 22:47:47.182	2026-03-19 22:47:47.182	5	f	unidad
6d7af041-12af-4eb4-9ba0-18be782b375b	8719200257122	Margarina de mesa 240 gr	\N	2026-08-04 00:00:00	Abastos	\N	1.5	1.5	6	2026-03-19 22:47:47.185	2026-03-19 22:47:47.185	5	f	unidad
cf4e850a-00f6-47e1-ab0e-1358070926ab	7861073101192	Palillos de dientes cj	\N	\N	Abastos	\N	0.3	0.3	37	2026-03-19 22:47:47.188	2026-03-19 22:47:47.188	5	f	unidad
9c47b1db-0ad0-42a2-8e05-bc06bcfedf97	7861008900500	Coco Rallado 500g	\N	2027-01-06 00:00:00	Repostería	\N	10.13	10.13	4	2026-03-19 22:47:47.143	2026-03-19 22:47:47.143	5	f	unidad
62e83a94-2c6e-4bc7-a815-4d0b22d2c8e9	7861008900333	Fruta confitada 500g	\N	2026-08-20 00:00:00	Repostería	\N	3.33	3.33	2	2026-03-19 22:47:47.145	2026-03-19 22:47:47.145	5	f	unidad
9d6ed082-b823-45a3-82b4-dc5005b5f796	7861046000170	Grageas de colores 200g	\N	2028-01-01 00:00:00	Repostería	\N	1.24	1.24	1	2026-03-19 22:47:47.148	2026-03-19 22:47:47.148	5	f	unidad
7f9efb15-8d2d-4db8-bffd-659c452d38b1	7861008900210	Azúcar impalpable 500g	\N	2027-01-15 00:00:00	Repostería	\N	1.6	1.6	1	2026-03-19 22:47:47.151	2026-03-19 22:47:47.151	5	f	unidad
fbb25dea-d15f-428e-8b87-a35679b581a4	7861008912886	Gelatina sin sabor 500g	\N	2026-09-30 00:00:00	Repostería	\N	13.81	13.81	1	2026-03-19 22:47:47.154	2026-03-19 22:47:47.154	5	f	unidad
39db5419-5c4e-451a-bac9-3a547b7b579c	7862122742533	Leche de Coco 500ml	\N	2027-07-16 00:00:00	Repostería	\N	3	3	4	2026-03-19 22:47:47.156	2026-03-19 22:47:47.156	5	f	unidad
b9db9892-44d4-4bd5-96e7-96f2c36acbd9	7862117323358	Galletas salticas 63g	\N	2027-01-15 00:00:00	Extra	\N	0.5	0.5	4	2026-03-19 22:47:47.19	2026-03-19 22:47:47.19	5	f	unidad
a99e1297-6986-4527-b680-de0957d6318b	7861091146366	Galletas Ricas 58g	\N	2026-08-07 00:00:00	Extra	\N	0.5	0.5	7	2026-03-19 22:47:47.193	2026-03-19 22:47:47.193	5	f	unidad
6a2ab423-23bc-4c30-8bbd-bac9e0194674	7861091196743	Galletas María 172g	\N	2026-11-27 00:00:00	Extra	\N	1.3	1.3	4	2026-03-19 22:47:47.196	2026-03-19 22:47:47.196	5	f	unidad
5baac1fa-2962-4976-8abd-16258e25fa71	7622202217531	Galletas Oreo 135 g	\N	2027-02-07 00:00:00	Extra	\N	1.2	1.2	4	2026-03-19 22:47:47.198	2026-03-19 22:47:47.198	5	f	unidad
ba9d276b-cf19-4e4b-910a-c4e19d7f1e72	7622202027925	Galletas Ritz 240 g	\N	2026-08-06 00:00:00	Extra	\N	2.4	2.4	1	2026-03-19 22:47:47.201	2026-03-19 22:47:47.201	5	f	unidad
4cb07288-6a2d-4cd5-8dd7-59f814cdbb40	7861001232011	Coffee Mate 300 gr	\N	2026-12-08 00:00:00	Extra	\N	5.2	5.2	5	2026-03-19 22:47:47.203	2026-03-19 22:47:47.203	5	f	unidad
8bec00cd-e052-41f1-a0c6-810f4612585f	7891000333570	Café Nescafé 160gr	\N	2027-04-30 00:00:00	Abastos	\N	9.65	9.65	34	2026-03-19 22:47:47.206	2026-03-19 22:47:47.206	5	f	unidad
388bf9ea-886b-45ad-aaee-65fccce5fcac	02	Huevos cub	\N	\N	Abastos	\N	3.35	3.35	13	2026-03-19 22:47:47.209	2026-03-19 22:47:47.209	5	f	unidad
58109b9f-f571-4725-a984-e4e7ad09f106	7861007905414	Salsa China Galón	\N	2027-02-23 00:00:00	Abastos	\N	7.65	7.65	1	2026-03-19 22:47:47.212	2026-03-19 22:47:47.212	5	f	unidad
65821bc6-9725-47ae-9131-4ecbd1f88f33	7862128052506	Vinagre blanco Galón	\N	2027-02-26 00:00:00	Abastos	\N	2.7	2.7	2	2026-03-19 22:47:47.214	2026-03-19 22:47:47.214	5	f	unidad
\.


--
-- Data for Name: Reservation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Reservation" (id, "customerId", "roomId", "checkInDate", "checkOutDate", "totalPrice", status, "createdAt", "updatedAt", "guestNames", "guestsCount") FROM stdin;
2ed6b46e-3519-462d-bb90-5bc185a6f54c	720c0723-ee79-419e-874c-bb24c867b05a	0a21def1-ff6e-40e0-93c0-4ac4e7c0d9e2	2026-03-25 15:26:11.342	2026-03-26 15:26:11.342	30	completada	2026-03-25 15:26:08.078	2026-03-26 21:54:03.051	\N	1
4f64e0df-c97f-49a5-9f71-7d02478d4fff	76b6058a-5baa-46f8-bceb-2cb6e13cba41	a1f96b3c-f59f-4eeb-9d86-9790a5e80fd6	2026-03-24 21:58:27.473	2026-03-25 21:58:27.473	30	completada	2026-03-24 21:58:27.334	2026-03-29 03:01:27.862	\N	1
3c128141-1846-498a-8edc-e44097779bfb	85c3e4b0-1430-4e80-9d43-43f283e5df49	a1f96b3c-f59f-4eeb-9d86-9790a5e80fd6	2026-03-31 03:54:25.733	2026-04-01 03:54:25.733	30	activa	2026-03-31 03:54:25.007	2026-03-31 03:54:25.007	\N	1
4c29654d-8e0f-4918-a1c3-be88c2d63eb4	7d3cfebc-8352-4e23-b163-ae54eb72a69c	3f665c87-0bb1-46f9-b325-5343b401ac11	2026-03-19 22:26:07.884	2026-03-20 22:26:07.884	50	activa	2026-03-19 22:26:07.988	2026-03-19 22:26:07.988	\N	1
770265ad-2dcd-49d3-92aa-20aefcfd45c4	3e68e6d1-081f-4120-b5aa-36be46004f9c	38843455-6709-462b-895f-37262c2ae1ee	2026-03-19 22:26:50.341	2026-03-20 22:26:50.341	30	activa	2026-03-19 22:26:50.351	2026-03-19 22:26:50.351	\N	1
9ec9e1c5-294a-49a0-a298-bc45580951ea	f6852277-51b2-448a-966d-b0016c349447	2e80af11-76bb-48c3-aa0d-f1c60937794e	2026-03-21 22:23:32.431	2026-03-22 22:23:32.431	20	activa	2026-03-21 22:23:30.645	2026-03-21 22:23:30.645	\N	1
eca39507-a160-4aa9-a8f4-3ee10c8832a8	c7748687-ea04-4f0b-a75c-8bfc4438424a	9c094c17-6452-425f-876c-e0de87ac6af3	2026-03-22 14:13:37.547	2026-03-23 14:13:37.547	0	activa	2026-03-22 14:13:34.783	2026-03-22 14:13:34.783	Danilo, Javier	2
a13d956e-e938-4a0c-be9e-fc46ed34ac2b	85c3e4b0-1430-4e80-9d43-43f283e5df49	efc00b4e-1360-4a2f-b5cb-49a4046fbe41	2026-03-31 03:54:43.725	2026-04-01 03:54:43.725	30	activa	2026-03-31 03:54:42.676	2026-03-31 03:54:42.676	\N	1
a95f36ac-6469-4cf6-8661-4b77ab23233f	85c3e4b0-1430-4e80-9d43-43f283e5df49	d31dc5a4-dadf-4caf-be68-681aec4135cb	2026-03-31 03:50:28.621	2026-04-01 03:50:28.621	30	completada	2026-03-31 03:50:27.627	2026-03-31 22:35:52.236	\N	1
3fee9762-7009-4440-80ad-1dbccae51bf5	313de74e-443c-43b4-ab39-0f71cc563096	192f54df-2204-44c4-824d-0b6c2568a38f	2026-03-26 22:34:37.14	2026-03-27 22:34:37.14	30	completada	2026-03-26 22:34:35.117	2026-03-31 22:36:34.104	\N	1
232743bf-d7f7-4fc6-83c4-46bac5cb8ad0	85c3e4b0-1430-4e80-9d43-43f283e5df49	bee94af0-09cf-41ab-bed0-299c1eedbff9	2026-03-31 03:49:55.469	2026-04-01 03:49:55.469	30	completada	2026-03-31 03:49:54.514	2026-03-31 22:37:03.839	\N	1
fafb260d-92a0-4731-9e44-f7d4b4d127d3	313de74e-443c-43b4-ab39-0f71cc563096	38843455-6709-462b-895f-37262c2ae1ee	2026-03-26 22:34:51.284	2026-03-27 22:34:51.284	30	completada	2026-03-26 22:34:49.262	2026-03-31 22:37:35.525	\N	1
\.


--
-- Data for Name: Room; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Room" (id, "roomNumber", "roomTypeId", "pricePerNight", status, "createdAt", "updatedAt") FROM stdin;
9c094c17-6452-425f-876c-e0de87ac6af3	003	type-simple	30	mantenimiento	2026-03-14 22:01:17.595	2026-03-24 18:33:26.751
bfe63dde-f564-47e7-a696-8bf99a021604	014	type-simple	30	mantenimiento	2026-03-14 22:01:17.619	2026-03-24 18:33:55.669
7a83a0a5-d661-4ef5-a542-585fc3401297	026	type-shared	25	disponible	2026-03-14 22:01:17.642	2026-03-19 22:22:13.443
367ea7cf-5a10-491c-a21e-b671c981a747	024	type-shared	25	disponible	2026-03-14 22:01:17.638	2026-03-19 22:22:13.443
1d4f21ae-bdf5-4631-92bf-6744dbde82b0	023	type-shared	25	disponible	2026-03-14 22:01:17.636	2026-03-19 22:22:13.443
2f762807-63de-4ef9-b472-251bd005d589	022	type-shared	25	disponible	2026-03-14 22:01:17.635	2026-03-19 22:22:13.443
e0108f41-3f54-4c12-abb1-6dcd1ff648fd	021	type-shared	25	disponible	2026-03-14 22:01:17.633	2026-03-19 22:22:13.443
0bed98f2-3493-45ee-969f-ac810117a7a4	020	type-shared	25	disponible	2026-03-14 22:01:17.631	2026-03-19 22:22:13.443
1fed4ee1-6c28-4c98-90fd-b79a3600affc	019	type-shared	25	disponible	2026-03-14 22:01:17.629	2026-03-19 22:22:13.443
f72e6d90-894f-43b1-80e0-1de793a394ba	025	type-shared	25	disponible	2026-03-14 22:01:17.64	2026-03-19 22:22:13.443
a19b3e6b-67dd-4dfd-b7cc-a4e8cd84420b	017	type-shared	25	disponible	2026-03-14 22:01:17.625	2026-03-19 22:22:13.443
532a56b0-cd2a-4c5c-881f-4176faed975f	005	type-simple	30	disponible	2026-03-14 22:01:17.599	2026-03-19 22:22:13.443
0a21def1-ff6e-40e0-93c0-4ac4e7c0d9e2	008	type-simple	30	disponible	2026-03-14 22:01:17.607	2026-03-26 21:54:03.054
3f665c87-0bb1-46f9-b325-5343b401ac11	002	type-shared	50	ocupada	2026-03-14 22:01:17.593	2026-03-27 19:27:19.2
a1f96b3c-f59f-4eeb-9d86-9790a5e80fd6	011	type-simple	30	ocupada	2026-03-14 22:01:17.614	2026-03-31 03:54:25.021
efc00b4e-1360-4a2f-b5cb-49a4046fbe41	013	type-simple	30	ocupada	2026-03-14 22:01:17.618	2026-03-31 03:54:42.682
d31dc5a4-dadf-4caf-be68-681aec4135cb	004	type-simple	30	disponible	2026-03-14 22:01:17.597	2026-03-31 22:35:53.656
192f54df-2204-44c4-824d-0b6c2568a38f	006	type-simple	30	disponible	2026-03-14 22:01:17.601	2026-03-31 22:36:34.106
bee94af0-09cf-41ab-bed0-299c1eedbff9	015	type-simple	30	disponible	2026-03-14 22:01:17.621	2026-03-31 22:37:03.841
38843455-6709-462b-895f-37262c2ae1ee	018	type-simple	30	disponible	2026-03-14 22:01:17.627	2026-03-31 22:37:35.527
492a1ee7-6105-44a9-a09b-c678190fa162	007	type-simple	30	disponible	2026-03-14 22:01:17.605	2026-03-19 22:22:13.443
7fa62192-8139-43c7-bb8c-cf15555a3eea	010	type-simple	30	disponible	2026-03-14 22:01:17.612	2026-03-19 22:22:13.443
90cc1263-2d16-4cde-a2f7-a4045603cad3	009	type-simple	30	disponible	2026-03-14 22:01:17.61	2026-03-19 22:22:13.443
18cd8820-fdbd-44e6-b2c2-e25fa11d1324	016	type-simple	25	disponible	2026-03-14 22:01:17.623	2026-03-19 22:22:13.443
2e80af11-76bb-48c3-aa0d-f1c60937794e	012	type-simple	30	disponible	2026-03-14 22:01:17.616	2026-03-22 15:21:50.262
25991df2-2eeb-487f-94e2-459162c7fb81	001	type-simple	50	mantenimiento	2026-03-14 22:01:17.584	2026-03-24 18:33:38.707
\.


--
-- Data for Name: RoomImage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RoomImage" (id, "roomId", "imageUrl", "createdAt") FROM stdin;
c6522fb3-3769-457c-bf33-bef4bbafbbab	25991df2-2eeb-487f-94e2-459162c7fb81	/uploads/rooms/room-1773855486828.jpeg	2026-03-18 17:38:06.852
033ecd0f-ee09-4852-b367-c4f1709e73bd	25991df2-2eeb-487f-94e2-459162c7fb81	/uploads/rooms/room-1773855486832.jpeg	2026-03-18 17:38:06.852
292a29e1-e332-406b-abb2-7aa97a5cdad0	25991df2-2eeb-487f-94e2-459162c7fb81	/uploads/rooms/room-1773855486838.jpeg	2026-03-18 17:38:06.852
1d7235b2-236c-4b66-8ed1-b048142da50c	90cc1263-2d16-4cde-a2f7-a4045603cad3	/uploads/rooms/room-1773855584822.jpeg	2026-03-18 17:39:44.847
ad87c4e5-ae8f-44ec-a246-35c3ab26f74e	90cc1263-2d16-4cde-a2f7-a4045603cad3	/uploads/rooms/room-1773855584829.jpeg	2026-03-18 17:39:44.847
d339b3e3-a9dc-45bd-a680-13ab834370a5	90cc1263-2d16-4cde-a2f7-a4045603cad3	/uploads/rooms/room-1773855584836.jpeg	2026-03-18 17:39:44.847
0f2e4ebf-f02f-44e2-a655-b4fe4dea328a	90cc1263-2d16-4cde-a2f7-a4045603cad3	/uploads/rooms/room-1773855584838.jpeg	2026-03-18 17:39:44.847
d0dd0f37-a3d5-4a13-a4c4-ed8671b50d9a	90cc1263-2d16-4cde-a2f7-a4045603cad3	/uploads/rooms/room-1773855584841.jpeg	2026-03-18 17:39:44.847
0e775314-dc0a-43c8-a6b1-fd4e3596872e	2e80af11-76bb-48c3-aa0d-f1c60937794e	/uploads/rooms/room-1773855651604.jpeg	2026-03-18 17:40:51.612
10bca098-e9ed-45e1-bf2b-9db77f77185d	2e80af11-76bb-48c3-aa0d-f1c60937794e	/uploads/rooms/room-1773855865289.jpeg	2026-03-18 17:44:25.302
40873c9b-9534-4caa-b8a1-0edeb6131a5c	2e80af11-76bb-48c3-aa0d-f1c60937794e	/uploads/rooms/room-1773855865291.jpeg	2026-03-18 17:44:25.302
240a6f91-8b16-4e2a-bb46-ce3d59def3b7	2e80af11-76bb-48c3-aa0d-f1c60937794e	/uploads/rooms/room-1773855865294.jpeg	2026-03-18 17:44:25.302
25eef09e-fc7f-45c2-a450-92691940e7fb	2e80af11-76bb-48c3-aa0d-f1c60937794e	/uploads/rooms/room-1773856154530.jpeg	2026-03-18 17:49:14.538
77c37cbb-7d25-4056-bfe4-97e2be7fc08f	18cd8820-fdbd-44e6-b2c2-e25fa11d1324	/uploads/rooms/room-1773856243753.jpeg	2026-03-18 17:50:43.771
16a32c32-5a52-403e-9c21-695053a8a21b	18cd8820-fdbd-44e6-b2c2-e25fa11d1324	/uploads/rooms/room-1773856243754.jpeg	2026-03-18 17:50:43.771
84087fbf-fd91-48da-a53e-9a8384a26794	18cd8820-fdbd-44e6-b2c2-e25fa11d1324	/uploads/rooms/room-1773856243758.jpeg	2026-03-18 17:50:43.771
e365f22b-0415-4835-9305-2dea9c13c79d	18cd8820-fdbd-44e6-b2c2-e25fa11d1324	/uploads/rooms/room-1773856243763.jpeg	2026-03-18 17:50:43.771
d644712c-4713-4bbf-bc51-6abc072ba2f1	18cd8820-fdbd-44e6-b2c2-e25fa11d1324	/uploads/rooms/room-1773856243767.jpeg	2026-03-18 17:50:43.771
ffdd87b5-bd3f-4a4b-aa9f-2a511cca74d6	3f665c87-0bb1-46f9-b325-5343b401ac11	/uploads/rooms/room-1774639635927.jpeg	2026-03-27 19:27:15.953
\.


--
-- Data for Name: RoomType; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RoomType" (id, name, description, price, "createdAt", "updatedAt") FROM stdin;
type-simple	Simple	\N	30	2026-03-14 22:01:17.573	2026-03-14 22:01:17.573
type-shared	Compartida	\N	25	2026-03-14 22:01:17.58	2026-03-14 22:01:17.58
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, password, role, "createdAt", "updatedAt", avatar, name) FROM stdin;
5b5efabd-cc61-491a-a830-295ed9705397	admin@hotel.com	$2b$10$YcXbEnmpO1kpDNKGLaQ4Zu2SPNHPtNS52I8/DDVMOPlUZy4zNgphG	ADMIN	2026-03-14 20:58:04.22	2026-03-27 15:13:36.487	\N	Hotel
\.


--
-- Data for Name: WebReservation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WebReservation" (id, "roomId", "responsibleName", "guestCount", company, phone, email, "checkIn", "checkOut", notes, status, "createdAt") FROM stdin;
\.


--
-- Name: Customer Customer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_pkey" PRIMARY KEY (id);


--
-- Name: Expense Expense_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_pkey" PRIMARY KEY (id);


--
-- Name: InventoryTransaction InventoryTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InventoryTransaction"
    ADD CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY (id);


--
-- Name: InvoiceItem InvoiceItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY (id);


--
-- Name: Invoice Invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: Reservation Reservation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Reservation"
    ADD CONSTRAINT "Reservation_pkey" PRIMARY KEY (id);


--
-- Name: RoomImage RoomImage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RoomImage"
    ADD CONSTRAINT "RoomImage_pkey" PRIMARY KEY (id);


--
-- Name: RoomType RoomType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RoomType"
    ADD CONSTRAINT "RoomType_pkey" PRIMARY KEY (id);


--
-- Name: Room Room_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Room"
    ADD CONSTRAINT "Room_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: WebReservation WebReservation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WebReservation"
    ADD CONSTRAINT "WebReservation_pkey" PRIMARY KEY (id);


--
-- Name: Customer_document_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Customer_document_key" ON public."Customer" USING btree (document);


--
-- Name: Product_barcode_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Product_barcode_key" ON public."Product" USING btree (barcode);


--
-- Name: Room_roomNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Room_roomNumber_key" ON public."Room" USING btree ("roomNumber");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Customer Customer_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: InventoryTransaction InventoryTransaction_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InventoryTransaction"
    ADD CONSTRAINT "InventoryTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: InventoryTransaction InventoryTransaction_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InventoryTransaction"
    ADD CONSTRAINT "InventoryTransaction_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InventoryTransaction InventoryTransaction_reservationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InventoryTransaction"
    ADD CONSTRAINT "InventoryTransaction_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES public."Reservation"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: InventoryTransaction InventoryTransaction_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InventoryTransaction"
    ADD CONSTRAINT "InventoryTransaction_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public."Room"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: InvoiceItem InvoiceItem_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InvoiceItem InvoiceItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "InvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Invoice Invoice_reservationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES public."Reservation"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Reservation Reservation_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Reservation"
    ADD CONSTRAINT "Reservation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Reservation Reservation_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Reservation"
    ADD CONSTRAINT "Reservation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public."Room"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RoomImage RoomImage_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RoomImage"
    ADD CONSTRAINT "RoomImage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public."Room"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Room Room_roomTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Room"
    ADD CONSTRAINT "Room_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES public."RoomType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WebReservation WebReservation_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WebReservation"
    ADD CONSTRAINT "WebReservation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public."Room"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict re1XuQS27tsJKsC2fGbXJHgfcjJApO6pCKhBAui9UgaGJjZEoUcbLJCE0XVETuC

