export enum PaymentMethod {
    EFECTIVO = "efectivo",
    TARJETA = "tarjeta",
    TRANSFERENCIA = "transferencia",
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface FeedbackSummary {
    total: number;
    rating_average: number;
    distribution: Record<number, number>;
    comments: FeedbackItem[];
}

export interface FeedbackItem {
    reservation_id: number;
    rating: number;
    feedback: string;
    created_at: Date;
    vehicle_license_plate: string;
    user_email: string;
}

export interface IngressSummary {
    total_incomes: number;
    total_reservations: number;
    from_date: Date;
    to_date: Date;
    //details: IngressItem[];
}

export interface IngressItem {
    receipt_id: number;
    reservation_id: number;
    user_email: string;
    vehicle_license_plate: string;
    price_final: number;
    payment_method: PaymentMethod;
    payment_datetime: Date;
    services: string;
}

export interface PeriodQuery {
    from: string; // ISO date "2025-01-01"
    to: string;   // ISO date "2025-01-31"
}