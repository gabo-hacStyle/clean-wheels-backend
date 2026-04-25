// ─── Enums ───────────────────────────────────────────────────────────────────

export enum ReservationStatus {
  PENDIENTE = "pendiente",
  CONFIRMADA = "confirmada",
  EN_PROCESO = "en_proceso",
  FINALIZADA = "finalizada",
  CANCELADA = "cancelada",
}

export enum UserRole {
  CLIENTE = "cliente",
  ADMIN = "admin",
  VISITANTE = "visitante",
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
  color: string;
  created_at: Date;
}

// ─── WashService (servicios del lavadero) ────────────────────────────────────

export interface WashService {
  id: string;
  name: string;
  price: number;
  description: string;
  duration: number;
  is_active: boolean;
  created_at: Date;
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

// ─── Request Bodies ───────────────────────────────────────────────────────────

export interface CreateReservationBody {
  vehicle_id: string;       // UUID del vehículo (ya registrado en el sistema)
  datetime: string;         // ISO 8601: "2025-06-15T10:00:00Z"
  service_ids: string[];    // UUIDs de los servicios seleccionados
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
// Agregar junto a los otros Request Bodies

export interface CheckAvailabilityBody {
  datetime: string;       // ISO 8601: "2025-06-15T10:00:00Z"
  total_duration: number; // Duración total en minutos de los servicios seleccionados
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
  start_time: string | null;
  end_time: string | null;
  status: ReservationStatus | null;
}

export interface HourlySchedule {
  hour: string;              // "2025-06-15T10:00:00.000Z"
  hour_label: string;        // "10:00"
  employees: EmployeeSlot[];
}

export interface UpdateReservationBody {
  datetime?: string;      // nueva fecha/hora ISO 8601
  service_ids?: string[]; // nuevos servicios
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

export interface CreateServiceBody {
  name: string;
  price: number;
  description: string;
  duration: number; // minutos
}

export interface UpdateServiceBody {
  name?: string;
  price?: number;
  description?: string;
  duration?: number;
}