-- ============================================================
-- LMS SAAS — Esquema completo de base de datos
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- Extensión para vectores (chat IA)
CREATE EXTENSION IF NOT EXISTS vector;

-- ── EDITORIALES ──────────────────────────────────────────────
CREATE TABLE publishers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── COLEGIOS (tenants) ───────────────────────────────────────
CREATE TABLE schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#2563eb',
  subdomain TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'trial'
    CHECK (subscription_status IN ('active','inactive','trial')),
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PERFILES DE USUARIO ──────────────────────────────────────
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN (
    'superadmin','publisher_admin','school_director',
    'school_admin','teacher','student','parent'
  )),
  school_id UUID REFERENCES schools(id),
  publisher_id UUID REFERENCES publishers(id),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PERÍODOS ACADÉMICOS ──────────────────────────────────────
CREATE TABLE academic_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  starts_at DATE,
  ends_at DATE,
  is_active BOOLEAN DEFAULT FALSE
);

-- ── CURSOS ───────────────────────────────────────────────────
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  grade_level TEXT,
  section TEXT,
  subject TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── MATRÍCULAS ───────────────────────────────────────────────
CREATE TABLE enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, student_id)
);

-- ── LIBROS ───────────────────────────────────────────────────
CREATE TABLE books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  publisher_id UUID REFERENCES publishers(id),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  cover_url TEXT,
  subject TEXT,
  grade_level TEXT,
  total_pages INT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── LICENCIAS (colegio ↔ libro) ──────────────────────────────
CREATE TABLE book_licenses (
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id),
  licensed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (school_id, book_id)
);

-- ── ANOTACIONES ──────────────────────────────────────────────
CREATE TABLE annotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  page_number INT NOT NULL,
  highlight_text TEXT,
  note TEXT,
  color TEXT DEFAULT 'yellow',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── QUIZZES ──────────────────────────────────────────────────
CREATE TABLE quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  page_number INT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option INT NOT NULL,
  explanation TEXT
);

CREATE TABLE quiz_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  selected_option INT NOT NULL,
  is_correct BOOLEAN,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CALIFICACIONES CON FLUJO DE APROBACIÓN ───────────────────
CREATE TABLE grades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  period_id UUID REFERENCES academic_periods(id),
  teacher_id UUID REFERENCES profiles(id),
  score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft','pending','approved','rejected','published'
  )),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── FORO ─────────────────────────────────────────────────────
CREATE TABLE forum_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES forum_posts(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── MENSAJES DIRECTOS ────────────────────────────────────────
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── NOTIFICACIONES ───────────────────────────────────────────
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PROGRESO DE LECTURA ──────────────────────────────────────
CREATE TABLE reading_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_page INT DEFAULT 1,
  total_pages_read INT DEFAULT 0,
  time_spent_minutes INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, student_id)
);

-- ── CHUNKS PARA CHAT IA ──────────────────────────────────────
CREATE TABLE book_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  page_number INT,
  content TEXT NOT NULL,
  embedding VECTOR(1536)
);

-- ── TAREAS ───────────────────────────────────────────────────
CREATE TABLE assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  max_score NUMERIC(5,2) DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assignment_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  file_url TEXT,
  text_response TEXT,
  score NUMERIC(5,2),
  feedback TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted','graded','returned')),
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================

-- Trigger: crear perfil al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: notificar al alumno cuando su nota es publicada
CREATE OR REPLACE FUNCTION notify_grade_published()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    INSERT INTO notifications (user_id, message, type)
    VALUES (NEW.student_id, 'Tu calificación ha sido publicada. Ingresa a ver tu nota.', 'grade');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_grade_published
AFTER UPDATE ON grades
FOR EACH ROW EXECUTE FUNCTION notify_grade_published();

-- Función de búsqueda semántica para el chat IA
CREATE OR REPLACE FUNCTION match_book_chunks(
  query_embedding VECTOR(1536),
  book_id_filter UUID,
  match_count INT DEFAULT 5
)
RETURNS TABLE (content TEXT, page_number INT, similarity FLOAT)
LANGUAGE SQL STABLE AS $$
  SELECT content, page_number,
    1 - (embedding <=> query_embedding) AS similarity
  FROM book_chunks
  WHERE book_id = book_id_filter
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;

-- Cada usuario solo ve su propio perfil (o el admin los de su colegio)
CREATE POLICY "Users see own profile"
ON profiles FOR SELECT USING (
  auth.uid() = id OR
  school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())
);

-- Calificaciones: alumnos solo ven las publicadas
CREATE POLICY "Students see published grades only"
ON grades FOR SELECT USING (
  student_id = auth.uid() AND status = 'published'
  OR teacher_id = auth.uid()
  OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('school_director','school_admin','superadmin')
);

-- Anotaciones: cada alumno solo ve las suyas
CREATE POLICY "Users see own annotations"
ON annotations FOR ALL USING (user_id = auth.uid());
