# EduSaaS LMS — Instrucciones de configuración

## 1. Instalar dependencias
```bash
npm install
```

## 2. Configurar variables de entorno
Abre `.env.local` y reemplaza con tus claves reales:
- `NEXT_PUBLIC_SUPABASE_URL` → en supabase.com → Settings → API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → en supabase.com → Settings → API
- `OPENAI_API_KEY` → en platform.openai.com → API Keys

## 3. Configurar la base de datos
En Supabase → SQL Editor → copia y ejecuta el contenido de `database/schema.sql`

## 4. Configurar Storage en Supabase
- Ir a Storage → New bucket → Nombre: `books` → Private

## 5. Iniciar en modo desarrollo
```bash
npm run dev
```
Abrir http://localhost:3000

## 6. Subir a producción (Vercel)
```bash
git init && git add . && git commit -m "initial"
# Conectar en vercel.com y agregar las variables de entorno
```

## Estructura del proyecto
- `app/login` — Página de inicio de sesión
- `app/register` — Registro con selección de colegio y rol
- `app/dashboard` — Panel principal (diferente por rol)
- `app/courses/[id]` — Detalle del curso (libros, foro, calificaciones, estadísticas)
- `app/courses/[id]/books/[bookId]` — Lector PDF interactivo
- `app/api/chat` — API del chat IA por libro
- `app/api/embed-pdf` — API para procesar PDFs con embeddings
- `app/api/grades` — API de calificaciones
- `components/PDFViewer` — Visor PDF con anotaciones y progreso
- `components/AIChat` — Chat IA integrado
- `components/QuizPopup` — Quizzes por página
- `components/Forum` — Foro profesor-alumno
- `components/GradeManager` — Calificaciones con flujo de aprobación
- `components/StatsReport` — Reportes estadísticos
- `database/schema.sql` — Esquema completo de Supabase
- `lib/supabase.ts` — Cliente y tipos de Supabase
