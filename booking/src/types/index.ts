// ─── Enums ───────────────────────────────────────────────────────────────────

export enum ReservationStatus {
  PENDIENTE = "pendiente",
  CONFIRMADA = "confirmada",
  EN_PROCESO = "en_proceso",
  FINALIZADA = "finalizada",
  CANCELADA = "cancelada",
}

export enum UserRole {
  CLIENTE = "CLIENT",
  ADMIN = "ADMIN",
  VISITANTE = "GUEST",
}

// ─── Auth (manejado por Auth MS, solo lo que nos interesa aquí) ──────────────

export interface AuthenticatedUser {
  id: string;
  email: string;
  rol: UserRole;
}

// ─── Vehicle ─────────────────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  created_at: Date;
}

// ─── WashService (servicios del lavadero) ────────────────────────────────────

export interface WashService {
  id: string;
  name: string;
  price: number;
  description: string;
  url: string;
  duration: number;
  is_active: boolean;
  category_id: string;
  created_at: Date;
}

export interface WashServiceResponseAdmin {
  id: string;
  name: string;
  price: number;
  description: string;
  duration: number;
  is_active: boolean;
  category_name: string;
  image_url: string | null;
  created_at: Date;
}

export interface WashServiceResponse {
  id: string;
  name: string;
  price: number;
  description: string;
  duration: number;
  category_name: string;
  image_url: string | null; 
}

export interface Category {
  id: string;
  name: string;
  description: string;
  created_at: Date;
  updated_at: Date; 
}

export interface CategoryWithServices extends Category {
  services: WashService[];
}

export interface CreateCategoryBody {
  name: string;
  description: string;
}

export interface UpdateCategoryBody {
  name?: string;
  description?: string;
}

export interface CreateServiceBody {
  name: string;
  price: number;
  description: string;
  url: string | null;
  duration: number;
  category_id: string;
}

export interface UpdateServiceBody {
  name?: string;
  price?: number;
  description?: string;
  url?: string;
  duration?: number;
  category_id?: string; 
}

// ─── Reservation ─────────────────────────────────────────────────────────────

export interface Reservation {
  id: string;
  vehicle_id: string;
  datetime: Date;
  status: ReservationStatus;
  total_price: number;
  total_duration: number;
  created_at: Date;
  updated_at: Date;
}

export interface ReservationService {
  id: string;
  reservation_id: string;
  service_id: string;
}

export interface ReservationWithServices extends Reservation {
  services: WashService[];
}


export interface CreateReservationBody {
  vehicle_id: string;
  date: string;           // "2025-06-15" (YYYY-MM-DD)
  time: string;           // "13:00" (HH:mm, hora Colombia)
  service_ids: string[];
}


export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
// Agregar junto a los otros Request Bodies

export interface CheckAvailabilityBody {
  date: string;           // "2025-06-15" (YYYY-MM-DD)
  time: string;           // "13:00" o "15:30" (HH:mm, hora Colombia)
  total_duration: number; // minutos
}

export interface AvailabilityResult {
  available: boolean;
  datetime: string;
  end_datetime: string;
  total_duration: number;
  concurrent_reservations: number;
  slots_remaining: number;
  message: string;
}

export interface EmployeeSlot {
  slot_index: number;        // 1, 2 o 3 (representa el empleado)
  reservation_id: string | null;
  vehicle_id: string | null;
  placa: string | null;
  marca: string | null;
  modelo: string | null;
  services: string[] | null; // nombres de los servicios
  status: ReservationStatus | null;
}

export interface HourlySchedule {
  hour_label: string;        // "10:00"
  employees: EmployeeSlot[];
}

export interface UpdateReservationBody {
  date?: string;          // "2025-06-15" (YYYY-MM-DD)
  time?: string;          // "13:00" (HH:mm, hora Colombia)
  service_ids?: string[];
}
// Lo que el gateway inyecta en cada request
export interface GatewayUser {
  id: string;
  role: UserRole;
}


export interface Receipt {
  id: string;
  user_id: string;
  reservation_id: string;
  discount: number;
  precio_final: number;
  payment_method: string;
  payment_datetime: Date;
  created_at: Date;
}

export interface CompleteReservationResult {
  reservation: Reservation;
  receipt: Receipt;
}

export enum PaymentMethod {
  EFECTIVO = "efectivo",
  TARJETA = "tarjeta",
  TRANSFERENCIA = "transferencia",
}

export interface CompleteReservationBody {
  payment_method: PaymentMethod;
}

// Calendario
export interface CalendarSlot {
  hour: string;       // "08:00"
  full: boolean;
}

export interface CalendarDay {
  date: string;       // "2025-06-15"
  slots: CalendarSlot[];
}

export interface WeeklyCalendar {
  week_start: string;
  week_end: string;
  days: CalendarDay[];
}

export interface WeeklyCalendarQuery {
  week_start: string; // ISO date "2025-06-15" — lunes de la semana
}



export enum NotificationType {
  RESERVA_CREADA = "reserva_creada",
  RESERVA_CANCELADA = "reserva_cancelada",
  RECORDATORIO_24H = "recordatorio_24h",
  SERVICIO_INICIADO = "servicio_iniciado",
  SERVICIO_FINALIZADO = "servicio_finalizado",
  SOLICITUD_FEEDBACK = "solicitud_feedback",
  REPORTE_DIARIO = "reporte_diario",
}

export interface ReservationFormatted
  extends Omit<Reservation, "datetime" | "created_at" | "updated_at"> {
  date: string;
  time: string;
  services: Pick<WashService, "id" | "name" | "price" | "duration">[];
}

export interface SaveVehicleRequest {
  placa: string;
  marca: string;
  modelo: string;
}