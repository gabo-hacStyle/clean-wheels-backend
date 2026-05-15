import { pool } from "@config/database";
import {FeedbackItem, IngressItem} from "../types";

class AdminRepository {
    async findFeedbackByPeriod(
        from: Date,
        to: Date
    ): Promise<FeedbackItem[]> {
        const { rows } = await pool.query<FeedbackItem>(
            `SELECT f.reservation_id, f.rating, f.feedback, f.created_at,
                v.placa AS vehicle_license_plate, u.email AS user_email
            FROM feedback f
            INNER JOIN reservations r ON r.id = f.reservation_id
            INNER JOIN vehicles v ON v.id = r.vehicle_id
            INNER JOIN vehicles_users vu ON vu.vehicle_id = v.id
            INNER JOIN users u ON u.id = vu.user_id
            WHERE f.created_at >= $1 AND f.created_at < $2
            ORDER BY f.created_at DESC`,
            [from, to]
        );
        return rows;
    }

    async findIngressByPeriod(
        from: Date,
        to: Date
    ): Promise<IngressItem[]> {
        const { rows } = await pool.query<IngressItem>(
            `SELECT rc.id AS receip_id, rc.reservation_id,
                u.email AS user_email, v.placa AS vehicle_license_plate, rc.precio_final AS price_final,
                rc.payment_method, rc.payment_datetime, STRING_AGG(s.name, ', ' ORDER BY s.name) AS services
            FROM receipts rc
            INNER JOIN reservations r ON r.id = rc.reservation_id
            INNER JOIN vehicles v ON v.id = r.vehicle_id
            INNER JOIN users u ON u.id = rc.user_id
            INNER JOIN reservations_services rs ON rs.reservation_id = r.id
            INNER JOIN services s ON s.id = rs.service_id
            WHERE rc.payment_datetime >= $1
              AND rc.payment_datetime < $2
            GROUP BY rc.id, rc.reservation_id, u.email, v.placa, rc.precio_final,
                     rc.payment_method, rc.payment_datetime`,
            [from, to]
        );
        return rows;
    }
}

export const adminRepository = new AdminRepository();