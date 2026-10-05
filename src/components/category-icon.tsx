import React from "react";
import {
  BookOpen,
  Bus,
  CalendarDays,
  Calendar,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Laptop,
  LifeBuoy,
  Megaphone,
  ShieldCheck,
  Users,
  UserPlus,
  Utensils,
  Trophy,
  Sparkles,
  HelpCircle,
  Award,
  Bell,
  Briefcase,
  Calculator,
  Compass,
  FileText,
  Globe,
  Heart,
  Home,
  Info,
  Library,
  Music,
  Palette,
  Phone,
  School,
  Search,
  Star,
  Video,
  Wrench,
  Activity,
  Apple,
  Bookmark,
  Car,
  Clock,
  Coffee,
  Dumbbell,
  Mail,
  MapPin,
  Medal,
  MessageSquare,
  PenTool,
  Smartphone,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS_MAP: Record<string, LucideIcon> = {
  BookOpen,
  GraduationCap,
  School,
  Library,
  Award,
  Bus,
  CalendarDays,
  Calendar,
  Utensils,
  Apple,
  Coffee,
  Trophy,
  Medal,
  Dumbbell,
  HeartPulse,
  HandHeart,
  Heart,
  Stethoscope,
  Activity,
  ShieldCheck,
  Users,
  UserPlus,
  LifeBuoy,
  Laptop,
  Smartphone,
  Megaphone,
  Bell,
  Sparkles,
  Star,
  FileText,
  Calculator,
  Compass,
  MapPin,
  Car,
  Clock,
  Globe,
  Home,
  Info,
  HelpCircle,
  Briefcase,
  Music,
  Palette,
  Video,
  Phone,
  Mail,
  MessageSquare,
  Wrench,
  Bookmark,
  PenTool,
  Search,
};

export interface CategoryIconPreset {
  name: string;
  label: string;
  group:
    | "Educación"
    | "Transporte y Horarios"
    | "Salud y Comunidad"
    | "Deportes y Nutrición"
    | "Tecnología y Otros";
}

export const CATEGORY_ICON_PRESETS: CategoryIconPreset[] = [
  // Educación
  { name: "BookOpen", label: "Libro Abierto", group: "Educación" },
  { name: "GraduationCap", label: "Birrete de Graduación", group: "Educación" },
  { name: "School", label: "Escuela / Colegio", group: "Educación" },
  { name: "Library", label: "Biblioteca", group: "Educación" },
  { name: "Award", label: "Premio / Logro", group: "Educación" },
  { name: "FileText", label: "Documentos", group: "Educación" },
  { name: "Calculator", label: "Calculadora / Matemáticas", group: "Educación" },
  { name: "PenTool", label: "Escritura / Tareas", group: "Educación" },
  { name: "Bookmark", label: "Marcador / Recursos", group: "Educación" },

  // Transporte y Horarios
  { name: "Bus", label: "Autobús Escolar / DART", group: "Transporte y Horarios" },
  { name: "CalendarDays", label: "Calendario Escolar", group: "Transporte y Horarios" },
  { name: "Calendar", label: "Fechas y Eventos", group: "Transporte y Horarios" },
  { name: "Clock", label: "Horarios de Campana", group: "Transporte y Horarios" },
  { name: "MapPin", label: "Ubicación / Paradas", group: "Transporte y Horarios" },
  { name: "Compass", label: "Orientación y Rutas", group: "Transporte y Horarios" },
  { name: "Car", label: "Llegada en Auto / Dropoff", group: "Transporte y Horarios" },

  // Salud y Comunidad
  { name: "HeartPulse", label: "Salud y Vacunas", group: "Salud y Comunidad" },
  { name: "HandHeart", label: "Apoyo Familiar", group: "Salud y Comunidad" },
  { name: "Heart", label: "Bienestar Emocional", group: "Salud y Comunidad" },
  { name: "Stethoscope", label: "Enfermería / Clínicas", group: "Salud y Comunidad" },
  { name: "ShieldCheck", label: "Seguridad Escolar", group: "Salud y Comunidad" },
  { name: "Users", label: "Familias y Estudiantes", group: "Salud y Comunidad" },
  { name: "UserPlus", label: "Inscripciones Nuevas", group: "Salud y Comunidad" },
  { name: "LifeBuoy", label: "Ayuda y Asistencia", group: "Salud y Comunidad" },
  { name: "HelpCircle", label: "Preguntas Frecuentes", group: "Salud y Comunidad" },

  // Deportes y Nutrición
  { name: "Utensils", label: "Comedor / Almuerzo", group: "Deportes y Nutrición" },
  { name: "Apple", label: "Nutrición Saludable", group: "Deportes y Nutrición" },
  { name: "Coffee", label: "Desayuno Escolar", group: "Deportes y Nutrición" },
  { name: "Trophy", label: "Deportes y Torneos", group: "Deportes y Nutrición" },
  { name: "Medal", label: "Medallas de Competición", group: "Deportes y Nutrición" },
  { name: "Dumbbell", label: "Educación Física / Gimnasio", group: "Deportes y Nutrición" },
  { name: "Activity", label: "Actividades Físicas", group: "Deportes y Nutrición" },

  // Tecnología y Otros
  { name: "Laptop", label: "Computadoras / Portátiles", group: "Tecnología y Otros" },
  { name: "Smartphone", label: "Apps y Notificaciones", group: "Tecnología y Otros" },
  { name: "Megaphone", label: "Anuncios y Avisos", group: "Tecnología y Otros" },
  { name: "Bell", label: "Alertas y Recordatorios", group: "Tecnología y Otros" },
  { name: "Sparkles", label: "Destacados / Programas", group: "Tecnología y Otros" },
  { name: "Star", label: "Favoritos y Calificaciones", group: "Tecnología y Otros" },
  { name: "Briefcase", label: "Empleos y Carreras", group: "Tecnología y Otros" },
  { name: "Music", label: "Música y Banda", group: "Tecnología y Otros" },
  { name: "Palette", label: "Arte y Creatividad", group: "Tecnología y Otros" },
  { name: "Video", label: "Videos y Tutoriales", group: "Tecnología y Otros" },
  { name: "Phone", label: "Teléfonos de Contacto", group: "Tecnología y Otros" },
  { name: "Mail", label: "Correo Electrónico", group: "Tecnología y Otros" },
  { name: "Globe", label: "Idiomas e Internet", group: "Tecnología y Otros" },
  { name: "Home", label: "Inicio / Hogar", group: "Tecnología y Otros" },
  { name: "Info", label: "Información General", group: "Tecnología y Otros" },
];

export const ICON_NAMES = Object.keys(CATEGORY_ICONS_MAP);

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  if (!name) {
    return <BookOpen className={className} aria-hidden="true" />;
  }

  // If the icon is an uploaded image, data URL, or external link
  if (
    name.startsWith("data:image/") ||
    name.startsWith("http://") ||
    name.startsWith("https://") ||
    name.startsWith("blob:") ||
    name.startsWith("/")
  ) {
    return (
      <img
        src={name}
        alt=""
        className={`object-contain inline-block shrink-0 ${className || "size-5"}`}
        aria-hidden="true"
      />
    );
  }

  const Icon = CATEGORY_ICONS_MAP[name] ?? BookOpen;
  return <Icon className={className} aria-hidden="true" />;
}
