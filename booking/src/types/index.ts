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