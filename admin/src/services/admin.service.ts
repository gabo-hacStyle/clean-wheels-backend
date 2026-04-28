import {FeedbackItem, FeedbackSummary, IngresosSummary, PeriodoQuery} from "../types";
import { adminRepository } from "../repositories/admin.repository";

class AdminService {
    async getFeedbackSummary(query: PeriodoQuery): Promise<FeedbackSummary> {
        try {
            this.validatePeriodo(query);

            const from = new Date(query.from);
            const to = new Date(query.to);

            to.setHours(23, 59, 59, 999);

            const items: FeedbackItem[] = await adminRepository.findFeedbackByPeriod(from, to);

            if (items.length === 0) {
                throw new Error(
                    `No hay feedback registrado entre ${query.from} y ${query.to}.`
                )
            }

            const total = items.length;

            return {
                total: total,
                comments: items
            };
        } catch (error) {
            const err = error as Error;
            throw new Error(
                `[AdminService] Error generando resumen de feedback: ${err.message}`
            );
        }
    }

    async getIncomesReport(query: PeriodoQuery): Promise<IngresosSummary> {
        try {
            this.validatePeriodo(query);
            const from = new Date(query.from);
            const to = new Date(query.to);
            to.setHours(23, 59, 59, 999);

            const details = await adminRepository.findIngresosByPeriod(from, to);

            if (details.length === 0) {
                throw new Error(
                    `No hay ingresos registrados entre ${query.from} y ${query.to}.`
                )
            }

            const total_incomes = details.reduce(
                (sum, i) => sum + Number(i.price_final),
                0
            );

            return {
                total_incomes: Math.round(total_incomes * 100) / 100,
                total_reservations:  details.length,
                details,
            };
        } catch (error) {
            const err = error as Error;
            throw new Error(
                `[AdminService] Error generando reporte de ingresos: ${err.message}`
            );
        }
    }

    private validatePeriodo(query: PeriodoQuery): void {
        if (!query.from || !query.to) {
            throw new Error("Los parámetros 'from' y 'to' son requeridos (formato: YYYY-MM-DD).");
        }

        const from = new Date(query.from);
        const to = new Date(query.to);

        if (isNaN(from.getTime()) || isNaN(to.getTime())) {
            throw new Error("Formato de fecha inválido. Use YYYY-MM-DD.");
        }

        if (from > to) {
            throw new Error("La fecha 'from' no puede ser posterior a 'to'.");
        }
    }
}

export const adminService = new AdminService();