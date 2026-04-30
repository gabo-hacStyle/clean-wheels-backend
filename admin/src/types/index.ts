export enum UserRole {
    CLIENT = "cliente",
    ADMIN = "admin",
    GUEST = "visitante",
}

export interface GatewayUser {
    id: string;
    role: UserRole;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface FeedbackSummary {
    total: number;
    // promedio_rating: number;
    // distribucion: Record<number, number>; // { 1: 2, 2: 0, 3: 1, 4: 5, 5: 10 }
    comments: FeedbackItem[];
}

export interface FeedbackItem {
    reservation_id: string;
    feedback: string;
    created_at: Date;
    vehicle_placa: string;
    user_email: string;
}

export interface IngresosSummary {
    total_incomes: number;
    total_reservations: number;
    details: IngresoItem[];
}

export interface IngresoItem {
    receipt_id: string;
    reservation_id: string;
    user_email: string;
    vehicle_license_plate: string;
    price_final: number;
    payment_method: string;
    payment_datetime: Date;
    services:    string;
}

export interface PeriodoQuery {
    from: string; // ISO date "2025-01-01"
    to: string;   // ISO date "2025-01-31"
}