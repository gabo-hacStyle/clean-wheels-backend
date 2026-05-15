export enum NotificationType {
  RESERVA_CREADA = "reserva_creada",
  RESERVA_CANCELADA = "reserva_cancelada",
  RECORDATORIO_24H = "recordatorio_24h",
  SERVICIO_INICIADO = "servicio_iniciado",
  SERVICIO_FINALIZADO = "servicio_finalizado",
  SOLICITUD_FEEDBACK = "solicitud_feedback",
  REPORTE_DIARIO = "reporte_diario",
}

export enum NotificationChannel {
  EMAIL = "email",
}

export enum NotificationStatus {
  PENDIENTE = "pendiente",
  ENVIADA = "enviada",
  FALLIDA = "fallida",
}

export enum ReservationStatus {
  PENDIENTE = "pendiente",
  CONFIRMADA = "confirmada",
  EN_PROCESO = "en_proceso",
  FINALIZADA = "finalizada",
  CANCELADA = "cancelada",
}

// ─── Entidades de BD ──────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  user_id: string;
  vehicle_id: string;
  reservation_id: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  scheduled_at: Date;
  sent_at: Date | null;
  created_at: Date;
}

export interface ReservationDetail {
  id: string;
  vehicle_id: string;
  datetime: Date;
  status: ReservationStatus;
  total_duration: number;
  total_price: number;
  placa: string;
  marca: string;
  modelo: string;
  user_email: string;
  user_id: string;
  services: string[]; // nombres de los servicios
}

export interface Feedback {
  id: string;
  reservation_id: string;
  rating: number;
  feedback: string;
  created_at: Date;
}

// ─── Request Bodies ───────────────────────────────────────────────────────────

export interface TriggerNotificationBody {
  reservation_id: string;
  type: NotificationType;
}

export interface SubmitFeedbackBody {
  reservation_id: string;
  rating: number;    // 1 - 5
  feedback: string;
}

// ─── Internos ────────────────────────────────────────────────────────────────

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export interface DailyReportRow {
  reservation_id: string;
  datetime: Date;
  placa: string;
  marca: string;
  modelo: string;
  services: string;
  status: ReservationStatus;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Lo que el gateway inyecta en cada request
export interface GatewayUser {
  id: string;
  role: UserRole;
}
export enum UserRole {
  CLIENTE = "cliente",
  ADMIN = "admin",
  VISITANTE = "visitante",
}