--
-- PostgreSQL database dump
--

\restrict I74Ma2gWUocco0HJ6jt9gdhcGmTWyqQfPU4nil3mEj1pknggaGBcL2KOrdaSeqL

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

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
-- Name: alertas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alertas (
    id integer NOT NULL,
    zona_id character varying(50),
    tipo character varying(50) NOT NULL,
    sensor character varying(50),
    mensaje text NOT NULL,
    valor numeric(10,2),
    umbral numeric(10,2),
    resuelta boolean DEFAULT false,
    "timestamp" timestamp with time zone DEFAULT now()
);


ALTER TABLE public.alertas OWNER TO postgres;

--
-- Name: alertas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alertas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alertas_id_seq OWNER TO postgres;

--
-- Name: alertas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alertas_id_seq OWNED BY public.alertas.id;


--
-- Name: comandos_pendientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comandos_pendientes (
    id integer NOT NULL,
    zona_id character varying(50) NOT NULL,
    actuador character varying(50) NOT NULL,
    estado character varying(10) NOT NULL,
    origen character varying(20) NOT NULL,
    intentos integer DEFAULT 0,
    procesado boolean DEFAULT false,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE public.comandos_pendientes OWNER TO postgres;

--
-- Name: comandos_pendientes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comandos_pendientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comandos_pendientes_id_seq OWNER TO postgres;

--
-- Name: comandos_pendientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comandos_pendientes_id_seq OWNED BY public.comandos_pendientes.id;


--
-- Name: lecturas_sensores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lecturas_sensores (
    id integer NOT NULL,
    temperatura numeric(5,2),
    humedad_aire numeric(5,2),
    humedad_suelo integer,
    luminosidad integer,
    "timestamp" timestamp with time zone DEFAULT now(),
    zona_id character varying(50)
);


ALTER TABLE public.lecturas_sensores OWNER TO postgres;

--
-- Name: lecturas_sensores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lecturas_sensores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lecturas_sensores_id_seq OWNER TO postgres;

--
-- Name: lecturas_sensores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lecturas_sensores_id_seq OWNED BY public.lecturas_sensores.id;


--
-- Name: log_acciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.log_acciones (
    id integer NOT NULL,
    zona_id character varying(50),
    actuador character varying(50) NOT NULL,
    estado character varying(10) NOT NULL,
    origen character varying(20) NOT NULL,
    sensor_disparador character varying(50),
    valor_sensor numeric(7,2),
    "timestamp" timestamp with time zone DEFAULT now()
);


ALTER TABLE public.log_acciones OWNER TO postgres;

--
-- Name: log_acciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.log_acciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.log_acciones_id_seq OWNER TO postgres;

--
-- Name: log_acciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.log_acciones_id_seq OWNED BY public.log_acciones.id;


--
-- Name: riegos_programados; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.riegos_programados (
    id integer NOT NULL,
    zona_id character varying(50),
    actuador character varying(50) NOT NULL,
    hora time without time zone NOT NULL,
    duracion_minutos integer NOT NULL,
    dias_semana integer[] NOT NULL,
    activo boolean DEFAULT true,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE public.riegos_programados OWNER TO postgres;

--
-- Name: riegos_programados_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.riegos_programados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.riegos_programados_id_seq OWNER TO postgres;

--
-- Name: riegos_programados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.riegos_programados_id_seq OWNED BY public.riegos_programados.id;


--
-- Name: system_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_logs (
    id integer NOT NULL,
    nivel character varying(20) NOT NULL,
    modulo character varying(50) NOT NULL,
    mensaje text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now()
);


ALTER TABLE public.system_logs OWNER TO postgres;

--
-- Name: system_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_logs_id_seq OWNER TO postgres;

--
-- Name: system_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_logs_id_seq OWNED BY public.system_logs.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    usuario character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    rol character varying(20) DEFAULT 'lectura'::character varying NOT NULL,
    activo boolean DEFAULT true,
    creado_en timestamp with time zone DEFAULT now()
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: zonas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.zonas (
    id character varying(50) NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    activa boolean DEFAULT true,
    creada_en timestamp with time zone DEFAULT now()
);


ALTER TABLE public.zonas OWNER TO postgres;

--
-- Name: alertas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alertas ALTER COLUMN id SET DEFAULT nextval('public.alertas_id_seq'::regclass);


--
-- Name: comandos_pendientes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comandos_pendientes ALTER COLUMN id SET DEFAULT nextval('public.comandos_pendientes_id_seq'::regclass);


--
-- Name: lecturas_sensores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lecturas_sensores ALTER COLUMN id SET DEFAULT nextval('public.lecturas_sensores_id_seq'::regclass);


--
-- Name: log_acciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_acciones ALTER COLUMN id SET DEFAULT nextval('public.log_acciones_id_seq'::regclass);


--
-- Name: riegos_programados id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.riegos_programados ALTER COLUMN id SET DEFAULT nextval('public.riegos_programados_id_seq'::regclass);


--
-- Name: system_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_logs ALTER COLUMN id SET DEFAULT nextval('public.system_logs_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: alertas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alertas (id, zona_id, tipo, sensor, mensaje, valor, umbral, resuelta, "timestamp") FROM stdin;
\.


--
-- Data for Name: comandos_pendientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comandos_pendientes (id, zona_id, actuador, estado, origen, intentos, procesado, creado_en) FROM stdin;
\.


--
-- Data for Name: lecturas_sensores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lecturas_sensores (id, temperatura, humedad_aire, humedad_suelo, luminosidad, "timestamp", zona_id) FROM stdin;
1	24.50	65.00	55	72	2026-06-29 15:11:51.275517-05	zona1
2	36.00	65.00	55	72	2026-06-29 16:02:23.87223-05	zona1
\.


--
-- Data for Name: log_acciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.log_acciones (id, zona_id, actuador, estado, origen, sensor_disparador, valor_sensor, "timestamp") FROM stdin;
1	zona1	ventilador	ON	manual	\N	\N	2026-06-29 17:36:45.423436-05
\.


--
-- Data for Name: riegos_programados; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.riegos_programados (id, zona_id, actuador, hora, duracion_minutos, dias_semana, activo, creado_en) FROM stdin;
\.


--
-- Data for Name: system_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_logs (id, nivel, modulo, mensaje, "timestamp") FROM stdin;
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, usuario, password_hash, rol, activo, creado_en) FROM stdin;
1	admin	$2b$10$zMzBAGSaZk.K09okpJ.BYOJcLBdaPoo9gmW7//Cc0KzAHo0qRRMvy	admin	t	2026-06-29 19:18:00.806119-05
\.


--
-- Data for Name: zonas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.zonas (id, nombre, descripcion, activa, creada_en) FROM stdin;
zona1	Zona Principal	\N	t	2026-06-29 16:25:07.219921-05
\.


--
-- Name: alertas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alertas_id_seq', 1, false);


--
-- Name: comandos_pendientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comandos_pendientes_id_seq', 1, false);


--
-- Name: lecturas_sensores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lecturas_sensores_id_seq', 2, true);


--
-- Name: log_acciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.log_acciones_id_seq', 1, true);


--
-- Name: riegos_programados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.riegos_programados_id_seq', 1, false);


--
-- Name: system_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_logs_id_seq', 1, false);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 1, true);


--
-- Name: alertas alertas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alertas
    ADD CONSTRAINT alertas_pkey PRIMARY KEY (id);


--
-- Name: comandos_pendientes comandos_pendientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comandos_pendientes
    ADD CONSTRAINT comandos_pendientes_pkey PRIMARY KEY (id);


--
-- Name: lecturas_sensores lecturas_sensores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lecturas_sensores
    ADD CONSTRAINT lecturas_sensores_pkey PRIMARY KEY (id);


--
-- Name: log_acciones log_acciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_acciones
    ADD CONSTRAINT log_acciones_pkey PRIMARY KEY (id);


--
-- Name: riegos_programados riegos_programados_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.riegos_programados
    ADD CONSTRAINT riegos_programados_pkey PRIMARY KEY (id);


--
-- Name: system_logs system_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_usuario_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_usuario_key UNIQUE (usuario);


--
-- Name: zonas zonas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zonas
    ADD CONSTRAINT zonas_pkey PRIMARY KEY (id);


--
-- Name: idx_alertas_zona; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alertas_zona ON public.alertas USING btree (zona_id, "timestamp" DESC);


--
-- Name: idx_comandos_pendientes; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comandos_pendientes ON public.comandos_pendientes USING btree (procesado, zona_id);


--
-- Name: idx_lecturas_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lecturas_timestamp ON public.lecturas_sensores USING btree ("timestamp" DESC);


--
-- Name: idx_lecturas_zona_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lecturas_zona_timestamp ON public.lecturas_sensores USING btree (zona_id, "timestamp" DESC);


--
-- Name: idx_log_zona_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_log_zona_timestamp ON public.log_acciones USING btree (zona_id, "timestamp" DESC);


--
-- Name: idx_riegos_zona; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_riegos_zona ON public.riegos_programados USING btree (zona_id) WHERE (activo = true);


--
-- Name: idx_system_logs_ts; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_logs_ts ON public.system_logs USING btree ("timestamp" DESC);


--
-- Name: alertas alertas_zona_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alertas
    ADD CONSTRAINT alertas_zona_id_fkey FOREIGN KEY (zona_id) REFERENCES public.zonas(id);


--
-- Name: log_acciones log_acciones_zona_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_acciones
    ADD CONSTRAINT log_acciones_zona_id_fkey FOREIGN KEY (zona_id) REFERENCES public.zonas(id);


--
-- Name: riegos_programados riegos_programados_zona_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.riegos_programados
    ADD CONSTRAINT riegos_programados_zona_id_fkey FOREIGN KEY (zona_id) REFERENCES public.zonas(id);


--
-- PostgreSQL database dump complete
--

\unrestrict I74Ma2gWUocco0HJ6jt9gdhcGmTWyqQfPU4nil3mEj1pknggaGBcL2KOrdaSeqL

