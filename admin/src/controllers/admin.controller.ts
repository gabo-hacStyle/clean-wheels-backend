import type { Request, Response } from 'express';
import logger from "@utils/logger";
import { ApiResponse, FeedbackSummary, IngressSummary, PeriodQuery } from "../types";
import { adminService } from "../services/admin.service";

export const adminController = {
    getFeedback: async (req: Request, res: Response) => {
        try {
            const query: PeriodQuery = {
                from: req.query.from as string,
                to: req.query.to as string,
            };

            const summary: FeedbackSummary = await adminService.getFeedbackSummary(query);

            const response: ApiResponse<FeedbackSummary> = {
                success: true,
                data: summary,
                message: `Feedback del periodo ${query.from} al ${query.to}. Total: ${summary.total} calificación(es).`
            };

            res.status(200).json(response);
        } catch (error) {
            const err = error as Error;
            logger.error("Error: ", err.message);
            const isNotFound = err.message.includes("No hay feedback");
            const isValidation =
                err.message.includes("requeridos") ||
                err.message.includes("inválido") ||
                err.message.includes("posterior");

            const response: ApiResponse<null> = {
                success: false,
                error: err.message,
            };

            res.status(isNotFound ? 404 : isValidation ? 422 : 500).json(response);
        }
    },

    getIncomes: async (req: Request, res: Response) => {
        try {
            const query: PeriodQuery = {
                from: req.query.from as string,
                to: req.query.to as string,
            };

            const report: IngressSummary = await adminService.getIncomesReport(query);

            const response: ApiResponse<IngressSummary> = {
                success: true,
                data: report,
                message: `Ingresos del periodo ${query.from} al ${query.to}. Total: $${report.total_incomes}.`,
            };

            res.status(200).json(response);
        } catch (error) {
            const err = error as Error;

            logger.error("Error: ", err.message);

            const isNotFound = err.message.includes("No hay ingresos");
            const isValidation =
                err.message.includes("requeridos") ||
                err.message.includes("inválido") ||
                err.message.includes("posterior");

            const response: ApiResponse<null> = {
                success: false,
                error: err.message,
            };

            res.status(isNotFound ? 404 : isValidation ? 422 : 500).json(response);
        }
    }
}