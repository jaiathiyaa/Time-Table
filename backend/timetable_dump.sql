--
-- PostgreSQL database dump
--

\restrict ttGVTgU8CJ1Cl3tZJ6bSQ0D1CufnXlN772ih21kYKVOvWy7E4ty0fBzuoYsNFse

-- Dumped from database version 18.4 (Debian 18.4-1)
-- Dumped by pg_dump version 18.4 (Debian 18.4-1)

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: jaiathiyaa
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO jaiathiyaa;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: jaiathiyaa
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: academic_years; Type: TABLE; Schema: public; Owner: jaiathiyaa
--

CREATE TABLE public.academic_years (
    id integer NOT NULL,
    name character varying NOT NULL,
    is_active boolean
);


ALTER TABLE public.academic_years OWNER TO jaiathiyaa;

--
-- Name: academic_years_id_seq; Type: SEQUENCE; Schema: public; Owner: jaiathiyaa
--

CREATE SEQUENCE public.academic_years_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.academic_years_id_seq OWNER TO jaiathiyaa;

--
-- Name: academic_years_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jaiathiyaa
--

ALTER SEQUENCE public.academic_years_id_seq OWNED BY public.academic_years.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: jaiathiyaa
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying NOT NULL,
    details json,
    "timestamp" timestamp without time zone
);


ALTER TABLE public.audit_logs OWNER TO jaiathiyaa;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: jaiathiyaa
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO jaiathiyaa;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jaiathiyaa
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: classrooms; Type: TABLE; Schema: public; Owner: jaiathiyaa
--

CREATE TABLE public.classrooms (
    id integer NOT NULL,
    room_no character varying NOT NULL,
    capacity integer NOT NULL,
    department_id integer,
    is_available boolean
);


ALTER TABLE public.classrooms OWNER TO jaiathiyaa;

--
-- Name: classrooms_id_seq; Type: SEQUENCE; Schema: public; Owner: jaiathiyaa
--

CREATE SEQUENCE public.classrooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.classrooms_id_seq OWNER TO jaiathiyaa;

--
-- Name: classrooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jaiathiyaa
--

ALTER SEQUENCE public.classrooms_id_seq OWNED BY public.classrooms.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: jaiathiyaa
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name character varying NOT NULL,
    code character varying NOT NULL
);


ALTER TABLE public.departments OWNER TO jaiathiyaa;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: jaiathiyaa
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO jaiathiyaa;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jaiathiyaa
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: faculties; Type: TABLE; Schema: public; Owner: jaiathiyaa
--

CREATE TABLE public.faculties (
    id integer NOT NULL,
    user_id integer,
    name character varying NOT NULL,
    code character varying NOT NULL,
    email character varying NOT NULL,
    department_id integer NOT NULL,
    max_workload integer,
    availability json
);


ALTER TABLE public.faculties OWNER TO jaiathiyaa;

--
-- Name: faculties_id_seq; Type: SEQUENCE; Schema: public; Owner: jaiathiyaa
--

CREATE SEQUENCE public.faculties_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.faculties_id_seq OWNER TO jaiathiyaa;

--
-- Name: faculties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jaiathiyaa
--

ALTER SEQUENCE public.faculties_id_seq OWNED BY public.faculties.id;


--
-- Name: faculty_subject_mappings; Type: TABLE; Schema: public; Owner: jaiathiyaa
--

CREATE TABLE public.faculty_subject_mappings (
    id integer NOT NULL,
    subject_id integer NOT NULL,
    faculty_id integer NOT NULL,
    section_id integer NOT NULL,
    hours_allocated integer NOT NULL
);


ALTER TABLE public.faculty_subject_mappings OWNER TO jaiathiyaa;

--
-- Name: faculty_subject_mappings_id_seq; Type: SEQUENCE; Schema: public; Owner: jaiathiyaa
--

CREATE SEQUENCE public.faculty_subject_mappings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.faculty_subject_mappings_id_seq OWNER TO jaiathiyaa;

--
-- Name: faculty_subject_mappings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jaiathiyaa
--

ALTER SEQUENCE public.faculty_subject_mappings_id_seq OWNED BY public.faculty_subject_mappings.id;


--
-- Name: laboratories; Type: TABLE; Schema: public; Owner: jaiathiyaa
--

CREATE TABLE public.laboratories (
    id integer NOT NULL,
    lab_name character varying NOT NULL,
    capacity integer NOT NULL,
    department_id integer,
    is_available boolean
);


ALTER TABLE public.laboratories OWNER TO jaiathiyaa;

--
-- Name: laboratories_id_seq; Type: SEQUENCE; Schema: public; Owner: jaiathiyaa
--

CREATE SEQUENCE public.laboratories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.laboratories_id_seq OWNER TO jaiathiyaa;

--
-- Name: laboratories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jaiathiyaa
--

ALTER SEQUENCE public.laboratories_id_seq OWNED BY public.laboratories.id;


--
-- Name: sections; Type: TABLE; Schema: public; Owner: jaiathiyaa
--

CREATE TABLE public.sections (
    id integer NOT NULL,
    name character varying NOT NULL,
    department_id integer NOT NULL,
    semester_id integer NOT NULL
);


ALTER TABLE public.sections OWNER TO jaiathiyaa;

--
-- Name: sections_id_seq; Type: SEQUENCE; Schema: public; Owner: jaiathiyaa
--

CREATE SEQUENCE public.sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sections_id_seq OWNER TO jaiathiyaa;

--
-- Name: sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jaiathiyaa
--

ALTER SEQUENCE public.sections_id_seq OWNED BY public.sections.id;


--
-- Name: semesters; Type: TABLE; Schema: public; Owner: jaiathiyaa
--

CREATE TABLE public.semesters (
    id integer NOT NULL,
    academic_year_id integer NOT NULL,
    semester_number integer NOT NULL,
    regulation character varying NOT NULL
);


ALTER TABLE public.semesters OWNER TO jaiathiyaa;

--
-- Name: semesters_id_seq; Type: SEQUENCE; Schema: public; Owner: jaiathiyaa
--

CREATE SEQUENCE public.semesters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.semesters_id_seq OWNER TO jaiathiyaa;

--
-- Name: semesters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jaiathiyaa
--

ALTER SEQUENCE public.semesters_id_seq OWNED BY public.semesters.id;


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: jaiathiyaa
--

CREATE TABLE public.subjects (
    id integer NOT NULL,
    code character varying NOT NULL,
    name character varying NOT NULL,
    department_id integer NOT NULL,
    semester_id integer NOT NULL,
    weekly_hours integer NOT NULL,
    is_lab boolean,
    lab_duration integer,
    preferred_afternoon boolean
);


ALTER TABLE public.subjects OWNER TO jaiathiyaa;

--
-- Name: subjects_id_seq; Type: SEQUENCE; Schema: public; Owner: jaiathiyaa
--

CREATE SEQUENCE public.subjects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subjects_id_seq OWNER TO jaiathiyaa;

--
-- Name: subjects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jaiathiyaa
--

ALTER SEQUENCE public.subjects_id_seq OWNED BY public.subjects.id;


--
-- Name: time_slots; Type: TABLE; Schema: public; Owner: jaiathiyaa
--

CREATE TABLE public.time_slots (
    id integer NOT NULL,
    day character varying NOT NULL,
    period_no integer NOT NULL,
    start_time character varying NOT NULL,
    end_time character varying NOT NULL,
    is_break boolean,
    break_name character varying
);


ALTER TABLE public.time_slots OWNER TO jaiathiyaa;

--
-- Name: time_slots_id_seq; Type: SEQUENCE; Schema: public; Owner: jaiathiyaa
--

CREATE SEQUENCE public.time_slots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.time_slots_id_seq OWNER TO jaiathiyaa;

--
-- Name: time_slots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jaiathiyaa
--

ALTER SEQUENCE public.time_slots_id_seq OWNED BY public.time_slots.id;


--
-- Name: timetable_cells; Type: TABLE; Schema: public; Owner: jaiathiyaa
--

CREATE TABLE public.timetable_cells (
    id integer NOT NULL,
    timetable_id integer NOT NULL,
    time_slot_id integer NOT NULL,
    subject_id integer,
    faculty_id integer,
    classroom_id integer,
    laboratory_id integer,
    is_locked boolean
);


ALTER TABLE public.timetable_cells OWNER TO jaiathiyaa;

--
-- Name: timetable_cells_id_seq; Type: SEQUENCE; Schema: public; Owner: jaiathiyaa
--

CREATE SEQUENCE public.timetable_cells_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.timetable_cells_id_seq OWNER TO jaiathiyaa;

--
-- Name: timetable_cells_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jaiathiyaa
--

ALTER SEQUENCE public.timetable_cells_id_seq OWNED BY public.timetable_cells.id;


--
-- Name: timetables; Type: TABLE; Schema: public; Owner: jaiathiyaa
--

CREATE TABLE public.timetables (
    id integer NOT NULL,
    academic_year_id integer NOT NULL,
    semester_id integer NOT NULL,
    section_id integer NOT NULL,
    version integer,
    is_active boolean,
    created_at timestamp without time zone,
    created_by_id integer
);


ALTER TABLE public.timetables OWNER TO jaiathiyaa;

--
-- Name: timetables_id_seq; Type: SEQUENCE; Schema: public; Owner: jaiathiyaa
--

CREATE SEQUENCE public.timetables_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.timetables_id_seq OWNER TO jaiathiyaa;

--
-- Name: timetables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jaiathiyaa
--

ALTER SEQUENCE public.timetables_id_seq OWNED BY public.timetables.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: jaiathiyaa
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying NOT NULL,
    email character varying NOT NULL,
    password_hash character varying NOT NULL,
    role character varying NOT NULL,
    department_id integer
);


ALTER TABLE public.users OWNER TO jaiathiyaa;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: jaiathiyaa
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO jaiathiyaa;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jaiathiyaa
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: academic_years id; Type: DEFAULT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.academic_years ALTER COLUMN id SET DEFAULT nextval('public.academic_years_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: classrooms id; Type: DEFAULT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.classrooms ALTER COLUMN id SET DEFAULT nextval('public.classrooms_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: faculties id; Type: DEFAULT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.faculties ALTER COLUMN id SET DEFAULT nextval('public.faculties_id_seq'::regclass);


--
-- Name: faculty_subject_mappings id; Type: DEFAULT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.faculty_subject_mappings ALTER COLUMN id SET DEFAULT nextval('public.faculty_subject_mappings_id_seq'::regclass);


--
-- Name: laboratories id; Type: DEFAULT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.laboratories ALTER COLUMN id SET DEFAULT nextval('public.laboratories_id_seq'::regclass);


--
-- Name: sections id; Type: DEFAULT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.sections ALTER COLUMN id SET DEFAULT nextval('public.sections_id_seq'::regclass);


--
-- Name: semesters id; Type: DEFAULT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.semesters ALTER COLUMN id SET DEFAULT nextval('public.semesters_id_seq'::regclass);


--
-- Name: subjects id; Type: DEFAULT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.subjects ALTER COLUMN id SET DEFAULT nextval('public.subjects_id_seq'::regclass);


--
-- Name: time_slots id; Type: DEFAULT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.time_slots ALTER COLUMN id SET DEFAULT nextval('public.time_slots_id_seq'::regclass);


--
-- Name: timetable_cells id; Type: DEFAULT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.timetable_cells ALTER COLUMN id SET DEFAULT nextval('public.timetable_cells_id_seq'::regclass);


--
-- Name: timetables id; Type: DEFAULT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.timetables ALTER COLUMN id SET DEFAULT nextval('public.timetables_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: academic_years; Type: TABLE DATA; Schema: public; Owner: jaiathiyaa
--

COPY public.academic_years (id, name, is_active) FROM stdin;
1	2026-2027	f
2	2025-2026	t
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: jaiathiyaa
--

COPY public.audit_logs (id, user_id, action, details, "timestamp") FROM stdin;
1	1	GENERATE_TIMETABLE	{"section_ids": [1], "academic_year_id": 1, "semester_id": 5, "status": "success", "prioritize_afternoon_labs": true, "minimize_faculty_gaps": true}	2026-06-28 08:34:46.026865
2	1	GENERATE_TIMETABLE	{"section_ids": [1, 2], "academic_year_id": 1, "semester_id": 5, "status": "success", "prioritize_afternoon_labs": true, "minimize_faculty_gaps": true}	2026-06-28 08:36:23.335584
3	1	GENERATE_TIMETABLE	{"section_ids": [1, 2], "academic_year_id": 1, "semester_id": 5, "status": "success", "prioritize_afternoon_labs": true, "minimize_faculty_gaps": true}	2026-06-28 08:38:22.128676
4	1	GENERATE_TIMETABLE	{"section_ids": [1, 2], "academic_year_id": 1, "semester_id": 5, "status": "success", "prioritize_afternoon_labs": true, "minimize_faculty_gaps": true}	2026-06-28 08:59:20.590192
5	1	GENERATE_TIMETABLE	{"section_ids": [1, 2], "academic_year_id": 1, "semester_id": 5, "status": "success", "prioritize_afternoon_labs": true, "minimize_faculty_gaps": true}	2026-06-28 09:01:50.416516
6	1	GENERATE_TIMETABLE	{"section_ids": [1, 2], "academic_year_id": 1, "semester_id": 5, "status": "success", "prioritize_afternoon_labs": true, "minimize_faculty_gaps": true}	2026-06-28 09:37:27.385275
7	1	GENERATE_TIMETABLE	{"section_ids": [3], "academic_year_id": 2, "semester_id": 11, "status": "success", "prioritize_afternoon_labs": true, "minimize_faculty_gaps": true}	2026-06-29 04:07:09.505301
8	1	GENERATE_TIMETABLE	{"section_ids": [3], "academic_year_id": 2, "semester_id": 11, "status": "success", "prioritize_afternoon_labs": true, "minimize_faculty_gaps": true}	2026-06-29 04:20:26.41554
9	1	GENERATE_TIMETABLE	{"section_ids": [3], "academic_year_id": 2, "semester_id": 11, "status": "success", "prioritize_afternoon_labs": true, "minimize_faculty_gaps": true}	2026-06-29 04:26:26.854334
10	1	GENERATE_TIMETABLE	{"section_ids": [3], "academic_year_id": 2, "semester_id": 11, "status": "success", "prioritize_afternoon_labs": true, "minimize_faculty_gaps": true}	2026-06-29 04:28:49.578402
11	1	GENERATE_TIMETABLE	{"section_ids": [3], "academic_year_id": 2, "semester_id": 11, "status": "success", "prioritize_afternoon_labs": true, "minimize_faculty_gaps": true}	2026-06-29 04:30:54.333535
12	1	GENERATE_TIMETABLE	{"section_ids": [3], "academic_year_id": 2, "semester_id": 11, "status": "success", "prioritize_afternoon_labs": true, "minimize_faculty_gaps": true}	2026-06-29 04:32:57.318889
13	1	GENERATE_TIMETABLE	{"section_ids": [3], "academic_year_id": 2, "semester_id": 11, "status": "success", "prioritize_afternoon_labs": true, "minimize_faculty_gaps": true}	2026-06-29 05:07:07.034086
\.


--
-- Data for Name: classrooms; Type: TABLE DATA; Schema: public; Owner: jaiathiyaa
--

COPY public.classrooms (id, room_no, capacity, department_id, is_available) FROM stdin;
1	LH-101	60	1	t
2	LH-102	60	1	t
4	LH-201	60	1	t
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: jaiathiyaa
--

COPY public.departments (id, name, code) FROM stdin;
1	Computer Science & Engineering	CSE
\.


--
-- Data for Name: faculties; Type: TABLE DATA; Schema: public; Owner: jaiathiyaa
--

COPY public.faculties (id, user_id, name, code, email, department_id, max_workload, availability) FROM stdin;
1	\N	Dr. Rajesh Raman	TCS01	rajesh@college.edu	1	16	{"Monday": [1, 2, 3, 4, 5, 6, 7], "Tuesday": [1, 2, 3, 4, 5, 6, 7], "Wednesday": [1, 2, 3, 4, 5, 6, 7], "Thursday": [1, 2, 3, 4, 5, 6, 7], "Friday": [1, 2, 3, 4, 5, 6, 7], "Saturday": [1, 2, 3, 4, 5, 6, 7]}
2	\N	Dr. Priya Srinivasan	TCS02	priya@college.edu	1	16	{"Monday": [1, 2, 3, 4, 5, 6, 7], "Tuesday": [1, 2, 3, 4, 5, 6, 7], "Wednesday": [1, 2, 3, 4, 5, 6, 7], "Thursday": [1, 2, 3, 4, 5, 6, 7], "Friday": [1, 2, 3, 4, 5, 6, 7], "Saturday": [1, 2, 3, 4, 5, 6, 7]}
3	\N	Prof. Kumar Swamy	TCS03	kumar@college.edu	1	16	{"Monday": [1, 2, 3, 4, 5, 6, 7], "Tuesday": [1, 2, 3, 4, 5, 6, 7], "Wednesday": [1, 2, 3, 4, 5, 6, 7], "Thursday": [1, 2, 3, 4, 5, 6, 7], "Friday": [1, 2, 3, 4, 5, 6, 7], "Saturday": [1, 2, 3, 4, 5, 6, 7]}
4	\N	Mrs. Shalini Roy	TCS04	shalini@college.edu	1	16	{"Monday": [1, 2, 3, 4, 5, 6, 7], "Tuesday": [1, 2, 3, 4, 5, 6, 7], "Wednesday": [1, 2, 3, 4, 5, 6, 7], "Thursday": [1, 2, 3, 4, 5, 6, 7], "Friday": [1, 2, 3, 4, 5, 6, 7], "Saturday": [1, 2, 3, 4, 5, 6, 7]}
10	\N	Mr. V. Yathavaraj	TCS06	yathavaraj@college.edu	1	18	{"Monday": [1, 2, 3, 4, 5, 6, 7], "Tuesday": [1, 2, 3, 4, 5, 6, 7], "Wednesday": [1, 2, 3, 4, 5, 6, 7], "Thursday": [1, 2, 3, 4, 5, 6, 7], "Friday": [1, 2, 3, 4, 5, 6, 7], "Saturday": [1, 2, 3, 4, 5, 6, 7]}
11	\N	Ms. S. R. Ramya	TCS07	ramya@college.edu	1	18	{"Monday": [1, 2, 3, 4, 5, 6, 7], "Tuesday": [1, 2, 3, 4, 5, 6, 7], "Wednesday": [1, 2, 3, 4, 5, 6, 7], "Thursday": [1, 2, 3, 4, 5, 6, 7], "Friday": [1, 2, 3, 4, 5, 6, 7], "Saturday": [1, 2, 3, 4, 5, 6, 7]}
12	\N	Dr. S. Saranya	TCS08	saranya@college.edu	1	18	{"Monday": [1, 2, 3, 4, 5, 6, 7], "Tuesday": [1, 2, 3, 4, 5, 6, 7], "Wednesday": [1, 2, 3, 4, 5, 6, 7], "Thursday": [1, 2, 3, 4, 5, 6, 7], "Friday": [1, 2, 3, 4, 5, 6, 7], "Saturday": [1, 2, 3, 4, 5, 6, 7]}
13	\N	Dr. D. Palanikkumar	TCS09	palanikkumar@college.edu	1	18	{"Monday": [1, 2, 3, 4, 5, 6, 7], "Tuesday": [1, 2, 3, 4, 5, 6, 7], "Wednesday": [1, 2, 3, 4, 5, 6, 7], "Thursday": [1, 2, 3, 4, 5, 6, 7], "Friday": [1, 2, 3, 4, 5, 6, 7], "Saturday": [1, 2, 3, 4, 5, 6, 7]}
16	\N	Ms. S. Rajeswari	TCS10	rajeswari@college.edu	1	18	{"Monday": [1, 2, 3, 4, 5, 6, 7], "Tuesday": [1, 2, 3, 4, 5, 6, 7], "Wednesday": [1, 2, 3, 4, 5, 6, 7], "Thursday": [1, 2, 3, 4, 5, 6, 7], "Friday": [1, 2, 3, 4, 5, 6, 7], "Saturday": [1, 2, 3, 4, 5, 6, 7]}
17	\N	Dr. V. Brindhashree	TCS11	brindhashree@college.edu	1	18	{"Monday": [1, 2, 3, 4, 5, 6, 7], "Tuesday": [1, 2, 3, 4, 5, 6, 7], "Wednesday": [1, 2, 3, 4, 5, 6, 7], "Thursday": [1, 2, 3, 4, 5, 6, 7], "Friday": [1, 2, 3, 4, 5, 6, 7], "Saturday": [1, 2, 3, 4, 5, 6, 7]}
18	\N	Dr. R. Praveen Raju	TCS12	praveenraju@college.edu	1	18	{"Monday": [1, 2, 3, 4, 5, 6, 7], "Tuesday": [1, 2, 3, 4, 5, 6, 7], "Wednesday": [1, 2, 3, 4, 5, 6, 7], "Thursday": [1, 2, 3, 4, 5, 6, 7], "Friday": [1, 2, 3, 4, 5, 6, 7], "Saturday": [1, 2, 3, 4, 5, 6, 7]}
19	\N	Ms. P. Nisha	TCS13	nisha@college.edu	1	18	{"Monday": [1, 2, 3, 4, 5, 6, 7], "Tuesday": [1, 2, 3, 4, 5, 6, 7], "Wednesday": [1, 2, 3, 4, 5, 6, 7], "Thursday": [1, 2, 3, 4, 5, 6, 7], "Friday": [1, 2, 3, 4, 5, 6, 7], "Saturday": [1, 2, 3, 4, 5, 6, 7]}
20	\N	Open Elective Staff	FOE01	oe@college.edu	1	18	{"Monday": [1, 2, 3, 4, 5, 6, 7], "Tuesday": [1, 2, 3, 4, 5, 6, 7], "Wednesday": [1, 2, 3, 4, 5, 6, 7], "Thursday": [1, 2, 3, 4, 5, 6, 7], "Friday": [1, 2, 3, 4, 5, 6, 7], "Saturday": [1, 2, 3, 4, 5, 6, 7]}
9	4	Dr. R. Jayasudha	TCS05	jayasudha@college.edu	1	18	{"Monday": [1, 2, 3, 4, 5, 6, 7], "Tuesday": [1, 2, 3, 4, 5, 6, 7], "Wednesday": [1, 2, 3, 4, 5, 6, 7], "Thursday": [1, 2, 3, 4, 5, 6, 7], "Friday": [1, 2, 3, 4, 5, 6, 7], "Saturday": [1, 2, 3, 4, 5, 6, 7]}
\.


--
-- Data for Name: faculty_subject_mappings; Type: TABLE DATA; Schema: public; Owner: jaiathiyaa
--

COPY public.faculty_subject_mappings (id, subject_id, faculty_id, section_id, hours_allocated) FROM stdin;
24	13	9	3	5
25	14	10	3	4
26	15	11	3	5
27	16	13	3	3
30	19	20	3	3
31	20	16	3	1
32	21	17	3	2
33	22	10	3	4
34	23	19	3	2
\.


--
-- Data for Name: laboratories; Type: TABLE DATA; Schema: public; Owner: jaiathiyaa
--

COPY public.laboratories (id, lab_name, capacity, department_id, is_available) FROM stdin;
1	CSE-LAB-1	40	1	t
2	CSE-LAB-2	40	1	t
4	A-BLOCK PGM LAB 4	40	1	t
5	D-BLOCK PGM LAB 10	40	1	t
3	ECE-LAB-1	40	\N	t
\.


--
-- Data for Name: sections; Type: TABLE DATA; Schema: public; Owner: jaiathiyaa
--

COPY public.sections (id, name, department_id, semester_id) FROM stdin;
3	A	1	11
\.


--
-- Data for Name: semesters; Type: TABLE DATA; Schema: public; Owner: jaiathiyaa
--

COPY public.semesters (id, academic_year_id, semester_number, regulation) FROM stdin;
1	1	1	R2025
2	1	2	R2025
3	1	3	R2025
4	1	4	R2025
5	1	5	R2025
6	1	6	R2025
7	1	7	R2025
8	1	8	R2025
9	2	1	R2022
10	2	2	R2022
11	2	3	R2022
12	2	4	R2022
13	2	5	R2022
14	2	6	R2022
15	2	7	R2022
16	2	8	R2022
\.


--
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: jaiathiyaa
--

COPY public.subjects (id, code, name, department_id, semester_id, weekly_hours, is_lab, lab_duration, preferred_afternoon) FROM stdin;
1	CS501	Database Management Systems	1	5	6	f	3	f
2	CS502	Operating Systems	1	5	6	f	3	f
3	CS503	Computer Networks	1	5	6	f	3	f
4	CS504	Microprocessors	1	5	6	f	3	f
5	CS511	DBMS Laboratory	1	5	6	t	3	t
6	CS512	OS Laboratory	1	5	6	t	3	t
13	22UMA302	Discrete Structures	1	11	5	f	3	f
14	22UCS301	Data Structures Concepts	1	11	4	f	3	f
15	22UCS302	Formal Languages and Automata Theory	1	11	5	f	3	f
16	22UCS303	Data Science Essentials	1	11	3	f	3	f
19	OE I	Open Elective I	1	11	3	f	3	f
20	22UOC301	Design Thinking	1	11	1	f	3	f
21	22UEN301	Interpersonal Skills & Personality Development	1	11	2	f	3	f
22	22UCS304	Data Structures Concepts Laboratory	1	11	4	t	2	f
23	22UCS407	Idea & Design Sprint	1	11	2	t	2	f
\.


--
-- Data for Name: time_slots; Type: TABLE DATA; Schema: public; Owner: jaiathiyaa
--

COPY public.time_slots (id, day, period_no, start_time, end_time, is_break, break_name) FROM stdin;
1	Monday	1	08:45	09:40	f	\N
2	Monday	2	09:40	10:35	f	\N
3	Monday	0	10:35	10:50	t	Morning Break
4	Monday	3	10:50	11:45	f	\N
5	Monday	4	11:45	12:40	f	\N
6	Monday	0	12:40	01:30	t	Lunch
7	Monday	5	01:30	02:25	f	\N
8	Monday	6	02:25	03:20	f	\N
9	Monday	0	03:20	03:35	t	Afternoon Break
10	Monday	7	03:35	04:30	f	\N
11	Tuesday	1	08:45	09:40	f	\N
12	Tuesday	2	09:40	10:35	f	\N
13	Tuesday	0	10:35	10:50	t	Morning Break
14	Tuesday	3	10:50	11:45	f	\N
15	Tuesday	4	11:45	12:40	f	\N
16	Tuesday	0	12:40	01:30	t	Lunch
17	Tuesday	5	01:30	02:25	f	\N
18	Tuesday	6	02:25	03:20	f	\N
19	Tuesday	0	03:20	03:35	t	Afternoon Break
20	Tuesday	7	03:35	04:30	f	\N
21	Wednesday	1	08:45	09:40	f	\N
22	Wednesday	2	09:40	10:35	f	\N
23	Wednesday	0	10:35	10:50	t	Morning Break
24	Wednesday	3	10:50	11:45	f	\N
25	Wednesday	4	11:45	12:40	f	\N
26	Wednesday	0	12:40	01:30	t	Lunch
27	Wednesday	5	01:30	02:25	f	\N
28	Wednesday	6	02:25	03:20	f	\N
29	Wednesday	0	03:20	03:35	t	Afternoon Break
30	Wednesday	7	03:35	04:30	f	\N
31	Thursday	1	08:45	09:40	f	\N
32	Thursday	2	09:40	10:35	f	\N
33	Thursday	0	10:35	10:50	t	Morning Break
34	Thursday	3	10:50	11:45	f	\N
35	Thursday	4	11:45	12:40	f	\N
36	Thursday	0	12:40	01:30	t	Lunch
37	Thursday	5	01:30	02:25	f	\N
38	Thursday	6	02:25	03:20	f	\N
39	Thursday	0	03:20	03:35	t	Afternoon Break
40	Thursday	7	03:35	04:30	f	\N
41	Friday	1	08:45	09:40	f	\N
42	Friday	2	09:40	10:35	f	\N
43	Friday	0	10:35	10:50	t	Morning Break
44	Friday	3	10:50	11:45	f	\N
45	Friday	4	11:45	12:40	f	\N
46	Friday	0	12:40	01:30	t	Lunch
47	Friday	5	01:30	02:25	f	\N
48	Friday	6	02:25	03:20	f	\N
49	Friday	0	03:20	03:35	t	Afternoon Break
50	Friday	7	03:35	04:30	f	\N
51	Saturday	1	08:45	09:40	f	\N
52	Saturday	2	09:40	10:35	f	\N
53	Saturday	0	10:35	10:50	t	Morning Break
54	Saturday	3	10:50	11:45	f	\N
55	Saturday	4	11:45	12:40	f	\N
56	Saturday	0	12:40	01:30	t	Lunch
57	Saturday	5	01:30	02:25	f	\N
58	Saturday	6	02:25	03:20	f	\N
59	Saturday	0	03:20	03:35	t	Afternoon Break
60	Saturday	7	03:35	04:30	f	\N
\.


--
-- Data for Name: timetable_cells; Type: TABLE DATA; Schema: public; Owner: jaiathiyaa
--

COPY public.timetable_cells (id, timetable_id, time_slot_id, subject_id, faculty_id, classroom_id, laboratory_id, is_locked) FROM stdin;
1021	18	41	21	17	1	\N	f
1022	18	42	13	9	1	\N	f
1023	18	44	16	13	1	\N	f
1024	18	45	15	11	1	\N	f
1025	18	47	23	19	\N	1	f
1026	18	48	23	19	\N	1	f
1027	18	50	20	16	1	\N	f
1028	18	1	19	20	1	\N	f
1029	18	2	20	16	1	\N	f
1030	18	4	15	11	1	\N	f
1031	18	5	14	10	1	\N	f
1032	18	7	16	13	1	\N	f
1033	18	8	21	17	1	\N	f
1034	18	10	13	9	1	\N	f
1035	18	51	19	20	1	\N	f
1036	18	52	16	13	1	\N	f
1037	18	54	21	17	1	\N	f
1038	18	55	13	9	1	\N	f
1039	18	57	22	10	\N	1	f
1040	18	58	22	10	\N	1	f
1041	18	60	20	16	1	\N	f
1042	18	31	14	10	1	\N	f
1043	18	32	13	9	1	\N	f
1044	18	34	21	17	1	\N	f
1045	18	35	20	16	1	\N	f
1046	18	37	16	13	1	\N	f
1047	18	38	19	20	1	\N	f
1048	18	40	15	11	1	\N	f
1049	18	11	15	11	1	\N	f
1050	18	12	21	17	1	\N	f
1051	18	14	13	9	1	\N	f
1052	18	15	14	10	1	\N	f
1053	18	17	19	20	1	\N	f
1054	18	18	16	13	1	\N	f
1055	18	20	20	16	1	\N	f
1056	18	21	15	11	1	\N	f
1057	18	22	16	13	1	\N	f
1058	18	24	21	17	1	\N	f
1059	18	25	14	10	1	\N	f
1060	18	27	22	10	\N	1	f
1061	18	28	22	10	\N	1	f
1062	18	30	20	16	1	\N	f
1063	18	49	\N	\N	\N	\N	f
1064	18	43	\N	\N	\N	\N	f
1065	18	46	\N	\N	\N	\N	f
1066	18	9	\N	\N	\N	\N	f
1067	18	3	\N	\N	\N	\N	f
1068	18	6	\N	\N	\N	\N	f
1069	18	53	\N	\N	\N	\N	f
1070	18	56	\N	\N	\N	\N	f
1071	18	59	\N	\N	\N	\N	f
1072	18	39	\N	\N	\N	\N	f
1073	18	33	\N	\N	\N	\N	f
1074	18	36	\N	\N	\N	\N	f
1075	18	16	\N	\N	\N	\N	f
1076	18	19	\N	\N	\N	\N	f
1077	18	13	\N	\N	\N	\N	f
1078	18	23	\N	\N	\N	\N	f
1079	18	26	\N	\N	\N	\N	f
1080	18	29	\N	\N	\N	\N	f
661	12	41	14	10	1	\N	f
662	12	42	21	17	1	\N	f
663	12	44	20	16	1	\N	f
664	12	45	15	11	1	\N	f
665	12	47	23	19	\N	1	f
666	12	48	23	19	\N	1	f
667	12	50	13	9	1	\N	f
669	12	2	16	13	1	\N	f
670	12	4	20	16	1	\N	f
671	12	5	13	9	1	\N	f
672	12	7	14	10	1	\N	f
673	12	8	15	11	1	\N	f
675	12	51	13	9	1	\N	f
677	12	54	19	20	1	\N	f
679	12	57	22	10	\N	1	f
680	12	58	22	10	\N	1	f
681	12	60	14	10	1	\N	f
683	12	32	19	20	1	\N	f
684	12	34	20	16	1	\N	f
686	12	37	22	10	\N	1	f
687	12	38	22	10	\N	1	f
688	12	40	15	11	1	\N	f
689	12	11	21	17	1	\N	f
690	12	12	19	20	1	\N	f
691	12	14	16	13	1	\N	f
692	12	15	15	11	1	\N	f
693	12	17	20	16	1	\N	f
694	12	18	13	9	1	\N	f
695	12	20	14	10	1	\N	f
696	12	21	15	11	1	\N	f
697	12	22	19	20	1	\N	f
698	12	24	21	17	1	\N	f
700	12	27	16	13	1	\N	f
701	12	28	13	9	1	\N	f
702	12	30	20	16	1	\N	f
703	12	49	\N	\N	\N	\N	f
704	12	43	\N	\N	\N	\N	f
705	12	46	\N	\N	\N	\N	f
706	12	9	\N	\N	\N	\N	f
707	12	3	\N	\N	\N	\N	f
708	12	6	\N	\N	\N	\N	f
709	12	53	\N	\N	\N	\N	f
710	12	56	\N	\N	\N	\N	f
711	12	59	\N	\N	\N	\N	f
712	12	39	\N	\N	\N	\N	f
713	12	33	\N	\N	\N	\N	f
714	12	36	\N	\N	\N	\N	f
715	12	16	\N	\N	\N	\N	f
716	12	19	\N	\N	\N	\N	f
717	12	13	\N	\N	\N	\N	f
718	12	23	\N	\N	\N	\N	f
719	12	26	\N	\N	\N	\N	f
720	12	29	\N	\N	\N	\N	f
721	13	41	21	17	1	\N	f
722	13	42	13	9	1	\N	f
723	13	44	14	10	1	\N	f
724	13	45	16	13	1	\N	f
725	13	47	23	19	\N	1	f
726	13	48	23	19	\N	1	f
728	13	1	21	17	1	\N	f
730	13	4	19	20	1	\N	f
731	13	5	15	11	1	\N	f
732	13	7	22	10	\N	1	f
733	13	8	22	10	\N	1	f
734	13	10	20	16	1	\N	f
735	13	51	13	9	1	\N	f
736	13	52	16	13	1	\N	f
737	13	54	19	20	1	\N	f
738	13	55	15	11	1	\N	f
739	13	57	14	10	1	\N	f
741	13	60	20	16	1	\N	f
742	13	31	13	9	1	\N	f
743	13	32	16	13	1	\N	f
744	13	34	19	20	1	\N	f
746	13	37	22	10	\N	1	f
668	12	1	\N	\N	1	\N	f
678	12	55	\N	\N	1	\N	f
682	12	31	\N	\N	1	\N	f
727	13	50	\N	\N	1	\N	f
729	13	2	\N	\N	1	\N	f
674	12	10	\N	\N	1	\N	f
676	12	52	\N	\N	1	\N	f
685	12	35	\N	\N	1	\N	f
699	12	25	\N	\N	1	\N	f
740	13	58	\N	\N	1	\N	f
745	13	35	\N	\N	1	\N	f
747	13	38	22	10	\N	1	f
748	13	40	15	11	1	\N	f
749	13	11	13	9	1	\N	f
750	13	12	16	13	1	\N	f
751	13	14	19	20	1	\N	f
752	13	15	15	11	1	\N	f
753	13	17	14	10	1	\N	f
755	13	20	20	16	1	\N	f
756	13	21	13	9	1	\N	f
757	13	22	16	13	1	\N	f
758	13	24	19	20	1	\N	f
759	13	25	15	11	1	\N	f
760	13	27	14	10	1	\N	f
762	13	30	20	16	1	\N	f
763	13	49	\N	\N	\N	\N	f
764	13	43	\N	\N	\N	\N	f
765	13	46	\N	\N	\N	\N	f
766	13	9	\N	\N	\N	\N	f
767	13	3	\N	\N	\N	\N	f
768	13	6	\N	\N	\N	\N	f
769	13	53	\N	\N	\N	\N	f
770	13	56	\N	\N	\N	\N	f
771	13	59	\N	\N	\N	\N	f
772	13	39	\N	\N	\N	\N	f
773	13	33	\N	\N	\N	\N	f
774	13	36	\N	\N	\N	\N	f
775	13	16	\N	\N	\N	\N	f
776	13	19	\N	\N	\N	\N	f
777	13	13	\N	\N	\N	\N	f
778	13	23	\N	\N	\N	\N	f
779	13	26	\N	\N	\N	\N	f
780	13	29	\N	\N	\N	\N	f
781	14	41	15	11	1	\N	f
782	14	42	19	20	1	\N	f
784	14	45	21	17	1	\N	f
785	14	47	23	19	\N	1	f
786	14	48	23	19	\N	1	f
787	14	50	14	10	1	\N	f
789	14	2	14	10	1	\N	f
790	14	4	15	11	1	\N	f
791	14	5	13	9	1	\N	f
792	14	7	22	10	\N	1	f
793	14	8	22	10	\N	1	f
794	14	10	21	17	1	\N	f
795	14	51	20	16	1	\N	f
796	14	52	15	11	1	\N	f
797	14	54	19	20	1	\N	f
798	14	55	13	9	1	\N	f
799	14	57	22	10	\N	1	f
800	14	58	22	10	\N	1	f
801	14	60	16	13	1	\N	f
802	14	31	19	20	1	\N	f
804	14	34	20	16	1	\N	f
806	14	37	13	9	1	\N	f
807	14	38	15	11	1	\N	f
808	14	40	16	13	1	\N	f
809	14	11	14	10	1	\N	f
810	14	12	15	11	1	\N	f
811	14	14	13	9	1	\N	f
812	14	15	20	16	1	\N	f
814	14	18	16	13	1	\N	f
816	14	21	13	9	1	\N	f
818	14	24	20	16	1	\N	f
820	14	27	16	13	1	\N	f
821	14	28	19	20	1	\N	f
822	14	30	14	10	1	\N	f
823	14	49	\N	\N	\N	\N	f
824	14	43	\N	\N	\N	\N	f
825	14	46	\N	\N	\N	\N	f
826	14	9	\N	\N	\N	\N	f
827	14	3	\N	\N	\N	\N	f
828	14	6	\N	\N	\N	\N	f
829	14	53	\N	\N	\N	\N	f
830	14	56	\N	\N	\N	\N	f
831	14	59	\N	\N	\N	\N	f
832	14	39	\N	\N	\N	\N	f
833	14	33	\N	\N	\N	\N	f
834	14	36	\N	\N	\N	\N	f
835	14	16	\N	\N	\N	\N	f
836	14	19	\N	\N	\N	\N	f
837	14	13	\N	\N	\N	\N	f
838	14	23	\N	\N	\N	\N	f
839	14	26	\N	\N	\N	\N	f
840	14	29	\N	\N	\N	\N	f
841	15	41	21	17	1	\N	f
842	15	42	19	20	1	\N	f
844	15	45	20	16	1	\N	f
845	15	47	23	19	\N	1	f
846	15	48	23	19	\N	1	f
849	15	2	16	13	1	\N	f
850	15	4	13	9	1	\N	f
851	15	5	21	17	1	\N	f
852	15	7	14	10	1	\N	f
853	15	8	15	11	1	\N	f
854	15	10	19	20	1	\N	f
855	15	51	19	20	1	\N	f
857	15	54	13	9	1	\N	f
858	15	55	15	11	1	\N	f
859	15	57	22	10	\N	1	f
860	15	58	22	10	\N	1	f
861	15	60	14	10	1	\N	f
862	15	31	13	9	1	\N	f
863	15	32	19	20	1	\N	f
864	15	34	21	17	1	\N	f
865	15	35	15	11	1	\N	f
866	15	37	22	10	\N	1	f
867	15	38	22	10	\N	1	f
869	15	11	16	13	1	\N	f
871	15	14	19	20	1	\N	f
872	15	15	13	9	1	\N	f
873	15	17	15	11	1	\N	f
875	15	20	14	10	1	\N	f
876	15	21	19	20	1	\N	f
877	15	22	16	13	1	\N	f
878	15	24	13	9	1	\N	f
879	15	25	15	11	1	\N	f
882	15	30	14	10	1	\N	f
883	15	49	\N	\N	\N	\N	f
884	15	43	\N	\N	\N	\N	f
885	15	46	\N	\N	\N	\N	f
886	15	9	\N	\N	\N	\N	f
887	15	3	\N	\N	\N	\N	f
888	15	6	\N	\N	\N	\N	f
889	15	53	\N	\N	\N	\N	f
890	15	56	\N	\N	\N	\N	f
891	15	59	\N	\N	\N	\N	f
892	15	39	\N	\N	\N	\N	f
893	15	33	\N	\N	\N	\N	f
894	15	36	\N	\N	\N	\N	f
895	15	16	\N	\N	\N	\N	f
896	15	19	\N	\N	\N	\N	f
897	15	13	\N	\N	\N	\N	f
898	15	23	\N	\N	\N	\N	f
899	15	26	\N	\N	\N	\N	f
900	15	29	\N	\N	\N	\N	f
901	16	41	21	17	1	\N	f
902	16	42	19	20	1	\N	f
904	16	45	14	10	1	\N	f
905	16	47	23	19	\N	1	f
906	16	48	23	19	\N	1	f
907	16	50	13	9	1	\N	f
909	16	2	16	13	1	\N	f
911	16	5	15	11	1	\N	f
912	16	7	22	10	\N	1	f
913	16	8	22	10	\N	1	f
914	16	10	14	10	1	\N	f
915	16	51	13	9	1	\N	f
916	16	52	16	13	1	\N	f
918	16	55	15	11	1	\N	f
919	16	57	22	10	\N	1	f
920	16	58	22	10	\N	1	f
921	16	60	14	10	1	\N	f
922	16	31	13	9	1	\N	f
923	16	32	20	16	1	\N	f
926	16	37	15	11	1	\N	f
927	16	38	16	13	1	\N	f
928	16	40	21	17	1	\N	f
929	16	11	19	20	1	\N	f
930	16	12	16	13	1	\N	f
931	16	14	15	11	1	\N	f
933	16	17	14	10	1	\N	f
934	16	18	13	9	1	\N	f
935	16	20	20	16	1	\N	f
936	16	21	13	9	1	\N	f
937	16	22	15	11	1	\N	f
938	16	24	19	20	1	\N	f
939	16	25	21	17	1	\N	f
940	16	27	14	10	1	\N	f
943	16	49	\N	\N	\N	\N	f
944	16	43	\N	\N	\N	\N	f
945	16	46	\N	\N	\N	\N	f
946	16	9	\N	\N	\N	\N	f
947	16	3	\N	\N	\N	\N	f
948	16	6	\N	\N	\N	\N	f
949	16	53	\N	\N	\N	\N	f
950	16	56	\N	\N	\N	\N	f
951	16	59	\N	\N	\N	\N	f
952	16	39	\N	\N	\N	\N	f
953	16	33	\N	\N	\N	\N	f
954	16	36	\N	\N	\N	\N	f
955	16	16	\N	\N	\N	\N	f
956	16	19	\N	\N	\N	\N	f
957	16	13	\N	\N	\N	\N	f
958	16	23	\N	\N	\N	\N	f
959	16	26	\N	\N	\N	\N	f
960	16	29	\N	\N	\N	\N	f
961	17	41	20	16	1	\N	f
962	17	42	13	9	1	\N	f
963	17	44	16	13	1	\N	f
964	17	45	21	17	1	\N	f
965	17	47	23	19	\N	1	f
966	17	48	23	19	\N	1	f
967	17	50	14	10	1	\N	f
969	17	2	19	20	1	\N	f
970	17	4	15	11	1	\N	f
971	17	5	13	9	1	\N	f
972	17	7	22	10	\N	1	f
973	17	8	22	10	\N	1	f
974	17	10	21	17	1	\N	f
975	17	51	21	17	1	\N	f
977	17	54	15	11	1	\N	f
978	17	55	20	16	1	\N	f
979	17	57	13	9	1	\N	f
980	17	58	19	20	1	\N	f
981	17	60	14	10	1	\N	f
982	17	31	14	10	1	\N	f
984	17	34	13	9	1	\N	f
986	17	37	16	13	1	\N	f
987	17	38	19	20	1	\N	f
988	17	40	15	11	1	\N	f
990	17	12	15	11	1	\N	f
991	17	14	13	9	1	\N	f
992	17	15	20	16	1	\N	f
993	17	17	22	10	\N	1	f
994	17	18	22	10	\N	1	f
995	17	20	16	13	1	\N	f
996	17	21	13	9	1	\N	f
997	17	22	20	16	1	\N	f
1000	17	27	16	13	1	\N	f
1001	17	28	15	11	1	\N	f
1002	17	30	14	10	1	\N	f
1003	17	49	\N	\N	\N	\N	f
1004	17	43	\N	\N	\N	\N	f
1005	17	46	\N	\N	\N	\N	f
1006	17	9	\N	\N	\N	\N	f
1007	17	3	\N	\N	\N	\N	f
1008	17	6	\N	\N	\N	\N	f
1009	17	53	\N	\N	\N	\N	f
1010	17	56	\N	\N	\N	\N	f
1011	17	59	\N	\N	\N	\N	f
1012	17	39	\N	\N	\N	\N	f
1013	17	33	\N	\N	\N	\N	f
1014	17	36	\N	\N	\N	\N	f
1015	17	16	\N	\N	\N	\N	f
1016	17	19	\N	\N	\N	\N	f
1017	17	13	\N	\N	\N	\N	f
1018	17	23	\N	\N	\N	\N	f
1019	17	26	\N	\N	\N	\N	f
1020	17	29	\N	\N	\N	\N	f
908	16	1	\N	\N	1	\N	f
925	16	35	\N	\N	1	\N	f
932	16	15	\N	\N	1	\N	f
942	16	30	\N	\N	1	\N	f
985	17	35	\N	\N	1	\N	f
989	17	11	\N	\N	1	\N	f
998	17	24	\N	\N	1	\N	f
903	16	44	\N	\N	1	\N	f
910	16	4	\N	\N	1	\N	f
917	16	54	\N	\N	1	\N	f
924	16	34	\N	\N	1	\N	f
941	16	28	\N	\N	1	\N	f
968	17	1	\N	\N	1	\N	f
976	17	52	\N	\N	1	\N	f
983	17	32	\N	\N	1	\N	f
999	17	25	\N	\N	1	\N	f
803	14	32	\N	\N	1	\N	f
815	14	20	\N	\N	1	\N	f
817	14	22	\N	\N	1	\N	f
847	15	50	\N	\N	1	\N	f
848	15	1	\N	\N	1	\N	f
874	15	18	\N	\N	1	\N	f
880	15	27	\N	\N	1	\N	f
754	13	18	\N	\N	1	\N	f
761	13	28	\N	\N	1	\N	f
783	14	44	\N	\N	1	\N	f
788	14	1	\N	\N	1	\N	f
805	14	35	\N	\N	1	\N	f
813	14	17	\N	\N	1	\N	f
819	14	25	\N	\N	1	\N	f
843	15	44	\N	\N	1	\N	f
856	15	52	\N	\N	1	\N	f
868	15	40	\N	\N	1	\N	f
870	15	12	\N	\N	1	\N	f
881	15	28	\N	\N	1	\N	f
\.


--
-- Data for Name: timetables; Type: TABLE DATA; Schema: public; Owner: jaiathiyaa
--

COPY public.timetables (id, academic_year_id, semester_id, section_id, version, is_active, created_at, created_by_id) FROM stdin;
12	2	11	3	1	f	2026-06-29 04:07:09.449123	1
13	2	11	3	2	f	2026-06-29 04:20:26.34937	1
14	2	11	3	3	f	2026-06-29 04:26:26.834533	1
15	2	11	3	4	f	2026-06-29 04:28:49.535837	1
16	2	11	3	5	f	2026-06-29 04:30:54.296624	1
17	2	11	3	6	f	2026-06-29 04:32:57.275356	1
18	2	11	3	7	t	2026-06-29 05:07:07.00046	1
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: jaiathiyaa
--

COPY public.users (id, username, email, password_hash, role, department_id) FROM stdin;
1	admin	admin@college.edu	$2b$12$T/V7.qcFbfZB3GHRoNXkjOLn72LjRtj5.FYLx9s87swl/WE6JHpP6	super_admin	\N
2	rajesh	rajesh@college.edu	$2b$12$2RKxuIiUXSzPo3/fTEPngeyLKcA/tcUS9t8CtQ.hbc8U7bIfcuSvK	faculty	\N
3	Jai	jai@gmail.com	$2b$12$TNnoNYs7aX1mNQvX1zDnD.mqFiouh2rUrp6kt1xSIgjV3yo3NI7bi	faculty	\N
4	jayasudha	jayasudha@college.edu	$2b$12$8CTie/9AdDy8y2S7q2ooeuVlKFrV.lVe8tZtPfGf7ZHMbP.Ak06V2	faculty	1
\.


--
-- Name: academic_years_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jaiathiyaa
--

SELECT pg_catalog.setval('public.academic_years_id_seq', 2, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jaiathiyaa
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 13, true);


--
-- Name: classrooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jaiathiyaa
--

SELECT pg_catalog.setval('public.classrooms_id_seq', 6, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jaiathiyaa
--

SELECT pg_catalog.setval('public.departments_id_seq', 4, true);


--
-- Name: faculties_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jaiathiyaa
--

SELECT pg_catalog.setval('public.faculties_id_seq', 20, true);


--
-- Name: faculty_subject_mappings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jaiathiyaa
--

SELECT pg_catalog.setval('public.faculty_subject_mappings_id_seq', 34, true);


--
-- Name: laboratories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jaiathiyaa
--

SELECT pg_catalog.setval('public.laboratories_id_seq', 5, true);


--
-- Name: sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jaiathiyaa
--

SELECT pg_catalog.setval('public.sections_id_seq', 3, true);


--
-- Name: semesters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jaiathiyaa
--

SELECT pg_catalog.setval('public.semesters_id_seq', 16, true);


--
-- Name: subjects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jaiathiyaa
--

SELECT pg_catalog.setval('public.subjects_id_seq', 23, true);


--
-- Name: time_slots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jaiathiyaa
--

SELECT pg_catalog.setval('public.time_slots_id_seq', 60, true);


--
-- Name: timetable_cells_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jaiathiyaa
--

SELECT pg_catalog.setval('public.timetable_cells_id_seq', 1080, true);


--
-- Name: timetables_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jaiathiyaa
--

SELECT pg_catalog.setval('public.timetables_id_seq', 18, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jaiathiyaa
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- Name: time_slots _day_period_break_uc; Type: CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.time_slots
    ADD CONSTRAINT _day_period_break_uc UNIQUE (day, period_no, is_break, break_name);


--
-- Name: sections _section_name_dept_sem_uc; Type: CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT _section_name_dept_sem_uc UNIQUE (name, department_id, semester_id);


--
-- Name: academic_years academic_years_pkey; Type: CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.academic_years
    ADD CONSTRAINT academic_years_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: classrooms classrooms_pkey; Type: CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.classrooms
    ADD CONSTRAINT classrooms_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: faculties faculties_pkey; Type: CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.faculties
    ADD CONSTRAINT faculties_pkey PRIMARY KEY (id);


--
-- Name: faculty_subject_mappings faculty_subject_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.faculty_subject_mappings
    ADD CONSTRAINT faculty_subject_mappings_pkey PRIMARY KEY (id);


--
-- Name: laboratories laboratories_pkey; Type: CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.laboratories
    ADD CONSTRAINT laboratories_pkey PRIMARY KEY (id);


--
-- Name: sections sections_pkey; Type: CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_pkey PRIMARY KEY (id);


--
-- Name: semesters semesters_pkey; Type: CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.semesters
    ADD CONSTRAINT semesters_pkey PRIMARY KEY (id);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: time_slots time_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.time_slots
    ADD CONSTRAINT time_slots_pkey PRIMARY KEY (id);


--
-- Name: timetable_cells timetable_cells_pkey; Type: CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.timetable_cells
    ADD CONSTRAINT timetable_cells_pkey PRIMARY KEY (id);


--
-- Name: timetables timetables_pkey; Type: CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.timetables
    ADD CONSTRAINT timetables_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_academic_years_id; Type: INDEX; Schema: public; Owner: jaiathiyaa
--

CREATE INDEX ix_academic_years_id ON public.academic_years USING btree (id);


--
-- Name: ix_academic_years_name; Type: INDEX; Schema: public; Owner: jaiathiyaa
--

CREATE UNIQUE INDEX ix_academic_years_name ON public.academic_years USING btree (name);


--
-- Name: ix_audit_logs_id; Type: INDEX; Schema: public; Owner: jaiathiyaa
--

CREATE INDEX ix_audit_logs_id ON public.audit_logs USING btree (id);


--
-- Name: ix_classrooms_id; Type: INDEX; Schema: public; Owner: jaiathiyaa
--

CREATE INDEX ix_classrooms_id ON public.classrooms USING btree (id);


--
-- Name: ix_classrooms_room_no; Type: INDEX; Schema: public; Owner: jaiathiyaa
--

CREATE UNIQUE INDEX ix_classrooms_room_no ON public.classrooms USING btree (room_no);


--
-- Name: ix_departments_code; Type: INDEX; Schema: public; Owner: jaiathiyaa
--

CREATE UNIQUE INDEX ix_departments_code ON public.departments USING btree (code);


--
-- Name: ix_departments_id; Type: INDEX; Schema: public; Owner: jaiathiyaa
--

CREATE INDEX ix_departments_id ON public.departments USING btree (id);


--
-- Name: ix_departments_name; Type: INDEX; Schema: public; Owner: jaiathiyaa
--

CREATE UNIQUE INDEX ix_departments_name ON public.departments USING btree (name);


--
-- Name: ix_faculties_code; Type: INDEX; Schema: public; Owner: jaiathiyaa
--

CREATE UNIQUE INDEX ix_faculties_code ON public.faculties USING btree (code);


--
-- Name: ix_faculties_id; Type: INDEX; Schema: public; Owner: jaiathiyaa
--

CREATE INDEX ix_faculties_id ON public.faculties USING btree (id);


--
-- Name: ix_faculty_subject_mappings_id; Type: INDEX; Schema: public; Owner: jaiathiyaa
--

CREATE INDEX ix_faculty_subject_mappings_id ON public.faculty_subject_mappings USING btree (id);


--
-- Name: ix_laboratories_id; Type: INDEX; Schema: public; Owner: jaiathiyaa
--

CREATE INDEX ix_laboratories_id ON public.laboratories USING btree (id);


--
-- Name: ix_laboratories_lab_name; Type: INDEX; Schema: public; Owner: jaiathiyaa
--

CREATE UNIQUE INDEX ix_laboratories_lab_name ON public.laboratories USING btree (lab_name);


--
-- Name: ix_sections_id; Type: INDEX; Schema: public; Owner: jaiathiyaa
--

CREATE INDEX ix_sections_id ON public.sections USING btree (id);


--
-- Name: ix_semesters_id; Type: INDEX; Schema: public; Owner: jaiathiyaa
--

CREATE INDEX ix_semesters_id ON public.semesters USING btree (id);


--
-- Name: ix_subjects_code; Type: INDEX; Schema: public; Owner: jaiathiyaa
--

CREATE UNIQUE INDEX ix_subjects_code ON public.subjects USING btree (code);


--
-- Name: ix_subjects_id; Type: INDEX; Schema: public; Owner: jaiathiyaa
--

CREATE INDEX ix_subjects_id ON public.subjects USING btree (id);


--
-- Name: ix_time_slots_id; Type: INDEX; Schema: public; Owner: jaiathiyaa
--

CREATE INDEX ix_time_slots_id ON public.time_slots USING btree (id);


--
-- Name: ix_timetable_cells_id; Type: INDEX; Schema: public; Owner: jaiathiyaa
--

CREATE INDEX ix_timetable_cells_id ON public.timetable_cells USING btree (id);


--
-- Name: ix_timetables_id; Type: INDEX; Schema: public; Owner: jaiathiyaa
--

CREATE INDEX ix_timetables_id ON public.timetables USING btree (id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: jaiathiyaa
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: jaiathiyaa
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: jaiathiyaa
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: classrooms classrooms_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.classrooms
    ADD CONSTRAINT classrooms_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: faculties faculties_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.faculties
    ADD CONSTRAINT faculties_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: faculties faculties_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.faculties
    ADD CONSTRAINT faculties_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: faculty_subject_mappings faculty_subject_mappings_faculty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.faculty_subject_mappings
    ADD CONSTRAINT faculty_subject_mappings_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.faculties(id) ON DELETE CASCADE;


--
-- Name: faculty_subject_mappings faculty_subject_mappings_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.faculty_subject_mappings
    ADD CONSTRAINT faculty_subject_mappings_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE CASCADE;


--
-- Name: faculty_subject_mappings faculty_subject_mappings_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.faculty_subject_mappings
    ADD CONSTRAINT faculty_subject_mappings_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: laboratories laboratories_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.laboratories
    ADD CONSTRAINT laboratories_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: sections sections_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: sections sections_semester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id) ON DELETE CASCADE;


--
-- Name: semesters semesters_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.semesters
    ADD CONSTRAINT semesters_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;


--
-- Name: subjects subjects_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- Name: subjects subjects_semester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id) ON DELETE CASCADE;


--
-- Name: timetable_cells timetable_cells_classroom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.timetable_cells
    ADD CONSTRAINT timetable_cells_classroom_id_fkey FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id) ON DELETE SET NULL;


--
-- Name: timetable_cells timetable_cells_faculty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.timetable_cells
    ADD CONSTRAINT timetable_cells_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.faculties(id) ON DELETE SET NULL;


--
-- Name: timetable_cells timetable_cells_laboratory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.timetable_cells
    ADD CONSTRAINT timetable_cells_laboratory_id_fkey FOREIGN KEY (laboratory_id) REFERENCES public.laboratories(id) ON DELETE SET NULL;


--
-- Name: timetable_cells timetable_cells_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.timetable_cells
    ADD CONSTRAINT timetable_cells_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;


--
-- Name: timetable_cells timetable_cells_time_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.timetable_cells
    ADD CONSTRAINT timetable_cells_time_slot_id_fkey FOREIGN KEY (time_slot_id) REFERENCES public.time_slots(id) ON DELETE CASCADE;


--
-- Name: timetable_cells timetable_cells_timetable_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.timetable_cells
    ADD CONSTRAINT timetable_cells_timetable_id_fkey FOREIGN KEY (timetable_id) REFERENCES public.timetables(id) ON DELETE CASCADE;


--
-- Name: timetables timetables_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.timetables
    ADD CONSTRAINT timetables_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;


--
-- Name: timetables timetables_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.timetables
    ADD CONSTRAINT timetables_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: timetables timetables_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.timetables
    ADD CONSTRAINT timetables_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE CASCADE;


--
-- Name: timetables timetables_semester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.timetables
    ADD CONSTRAINT timetables_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id) ON DELETE CASCADE;


--
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jaiathiyaa
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: jaiathiyaa
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict ttGVTgU8CJ1Cl3tZJ6bSQ0D1CufnXlN772ih21kYKVOvWy7E4ty0fBzuoYsNFse

