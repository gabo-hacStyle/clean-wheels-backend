import ReservationRepository from "../repository/reservationRepository";
import NotificationClient from "../infraestructure/email.client";
import { NotificationType, ReservationFormatted, Vehicle} from "../types";
import {
  AvailabilityResult,
  CalendarDay,
  CalendarSlot,
  CheckAvailabilityBody,
  CompleteReservationBody,
  CompleteReservationResult,
  CreateReservationBody,
  EmployeeSlot,
  GatewayUser,
  HourlySchedule,
  PaymentMethod,
  Reservation,
  ReservationStatus,
  ReservationWithServices,
  UpdateReservationBody,
  UserRole,
  WashService,
  WeeklyCalendar,
  WeeklyCalendarQuery,
} from "../types";


import { parseColombiaDT, assertNotPast, formatColombia, splitDatetimeColombia } from "../utils/date.utils";


class ReservationService {
  private repository: ReservationRepository;
  private notificationClient: NotificationClient;

  constructor() {
    this.repository = new ReservationRepository();
    this.notificationClient = NotificationClient.getInstance();
  }

  async checkAvailability(
    body: CheckAvailabilityBody
  ): Promise<AvailabilityResult> {
    try {
      const { date, time, total_duration } = body;

      if (!date || !time) {
        throw new Error("Los campos date y time son requeridos.");
      }

      if (total_duration === undefined || total_duration === null) {
        throw new Error("El campo total_duration es requerido.");
      }

      if (total_duration <= 0) {
        throw new Error("La duración total debe ser mayor a 0 minutos.");
      }

      // Normalizar a UTC
      const start = parseColombiaDT(date, time);

      // Validar que no sea en el pasado
      assertNotPast(start, `El horario "${date} ${time}" (hora Colombia)`);

      const end = new Date(start.getTime() + total_duration * 60 * 1000);
      const maxSlots = this.repository.getMaxConcurrentReservations();
      const overlapping = await this.repository.countOverlappingReservations(
        start,
        end
      );

      const slotsRemaining = maxSlots - overlapping;
      const available = slotsRemaining > 0;

      return {
        available,
        datetime: start.toISOString(),
        end_datetime: end.toISOString(),
        total_duration,
        concurrent_reservations: overlapping,
        slots_remaining: slotsRemaining,
        message: available
          ? `Hay disponibilidad para el ${date} a las ${time} (hora Colombia). Quedan ${slotsRemaining} cupo(s) de ${maxSlots}.`
          : `No hay disponibilidad para el ${date} a las ${time} (hora Colombia). Los ${maxSlots} cupos están ocupados durante ese período.`,
      };
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[ReservationService] Error al verificar disponibilidad: ${err.message}`
      );
    }
  }

  async createReservation(
    body: CreateReservationBody
  ): Promise<ReservationWithServices> {
    try {
      const { vehicle_id, date, time, service_ids } = body;

      if (!date || !time) {
        throw new Error("Los campos date y time son requeridos.");
      }

      if (!service_ids || service_ids.length === 0) {
        throw new Error("Debe seleccionar al menos un servicio.");
      }

      const vehicleExists = await this.repository.findVehicleById(vehicle_id);
      if (!vehicleExists) {
        throw new Error(
          `El vehículo con id "${vehicle_id}" no existe en el sistema.`
        );
      }

      const foundServices: WashService[] =
        await this.repository.findServicesByIds(service_ids);

      if (foundServices.length !== service_ids.length) {
        const foundIds = foundServices.map((s) => s.id);
        const invalidIds = service_ids.filter((id) => !foundIds.includes(id));
        throw new Error(
          `Los siguientes servicios no existen o no están disponibles: ${invalidIds.join(", ")}`
        );
      }

      // Normalizar hora Colombia → UTC
      const start = parseColombiaDT(date, time);

      // Validar que no sea en el pasado
      assertNotPast(start, `El horario "${date} ${time}" (hora Colombia)`);

      const totalDuration = foundServices.reduce(
        (sum, s) => sum + Number(s.duration),
        0
      );
      const end = new Date(start.getTime() + totalDuration * 60 * 1000);

      const maxSlots = this.repository.getMaxConcurrentReservations();
      const overlapping = await this.repository.countOverlappingReservations(
        start,
        end
      );

      if (overlapping >= maxSlots) {
        throw new Error(
          `El horario del ${date} a las ${time} (hora Colombia) no está disponible. Los ${maxSlots} cupos están ocupados durante ese período.`
        );
      }

      const reservation = await this.repository.createReservationWithServices(
        vehicle_id,
        start,  // se guarda en UTC en PostgreSQL
        foundServices
      );

      await this.notificationClient.trigger(
        reservation.id,
        NotificationType.RESERVA_CREADA
      );

      return reservation;
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[ReservationService] Error al crear la reserva: ${err.message}`
      );
    }
  }


  async getUpcomingSchedule(): Promise<HourlySchedule[]> {
  try {
    const now = new Date();
    const from = new Date(now);
    // Redondear al inicio de la hora actual
    from.setMinutes(0, 0, 0);

    const to = new Date(from.getTime() + 8 * 60 * 60 * 1000);

    const reservations = await this.repository.findReservationsNextHours(
      from,
      to
    );

    const maxSlots = this.repository.getMaxConcurrentReservations();
    const schedule: HourlySchedule[] = [];

    // Construir un bloque por cada hora de la ventana
    for (let i = 0; i < 4; i++) {
      const hourStart = new Date(from.getTime() + i * 60 * 60 * 1000);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

      // Filtrar reservas que se solapan con esta hora puntual
      const overlapping = reservations.filter((r) => {
        const resStart = new Date(r.datetime);
        const resEnd = new Date(
          resStart.getTime() + Number(r.total_duration) * 60 * 1000
        );
        return resStart < hourEnd && resEnd > hourStart;
      });

      // Construir los 3 slots de empleado
      const employees: EmployeeSlot[] = Array.from(
        { length: maxSlots },
        (_, idx) => {
          const reservation = overlapping[idx] ?? null;
          const resWithVehicle = reservation as any;

          if (!reservation) {
            return {
              slot_index: idx + 1,
              reservation_id: null,
              vehicle_id: null,
              placa: null,
              marca: null,
              modelo: null,
              services: null,
              status: null,
            };
          }

          return {
            slot_index: idx + 1,
            reservation_id: reservation.id,
            vehicle_id: reservation.vehicle_id,
           placa: resWithVehicle.placa ? censorPlaca(resWithVehicle.placa) : null,
            marca: resWithVehicle.marca ?? null,
            modelo: resWithVehicle.modelo ?? null,
            services: reservation.services.map((s: any) =>
              typeof s === "string" ? s : s.name
            ),
            status: reservation.status,
          };
        }
      );

      schedule.push({
        hour_label: hourStart.toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "America/Bogota",
        }),
        employees,
      });
    }

    return schedule;
  } catch (error) {
    const err = error as Error;
    throw new Error(
      `[ReservationService] Error al obtener el horario de las próximas horas: ${err.message}`
    );
  }
  }

  // Helper privado: verifica que el usuario tenga permisos sobre la reserva.
// Admin: acceso total. Cliente: solo si es dueño de uno de los vehículos.
  private async assertUserCanModify(
    user: GatewayUser,
    reservation: ReservationWithServices
  ): Promise<void> {
    if (user.role === UserRole.ADMIN) return;

    const isOwner = await this.repository.isUserVehicleOwner(
      user.id,
      reservation.vehicle_id
    );

    if (!isOwner) {
      throw new Error(
        "No tienes permisos para modificar esta reserva. Solo el propietario del vehículo o un administrador pueden hacerlo."
      );
    }
  }

  async cancelReservation(
    reservationId: string,
    user: GatewayUser
  ): Promise<Reservation> {
    try {
      const reservation = await this.repository.findReservationById(reservationId);

      if (!reservation) {
        throw new Error(
          `La reserva con id "${reservationId}" no existe.`
        );
      }

      const nonCancellableStatuses: ReservationStatus[] = [
        ReservationStatus.CANCELADA,
        ReservationStatus.FINALIZADA,
      ];

      if (nonCancellableStatuses.includes(reservation.status)) {
        throw new Error(
          `La reserva no puede cancelarse porque su estado actual es "${reservation.status}".`
        );
      }

      await this.assertUserCanModify(user, reservation);

      await this.notificationClient.trigger(
        reservationId,
        NotificationType.RESERVA_CANCELADA
      );

      return await this.repository.cancelReservation(reservationId);
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[ReservationService] Error al cancelar la reserva: ${err.message}`
      );
    }
  }

async updateReservation(
  reservationId: string,
  body: UpdateReservationBody,
  user: GatewayUser
): Promise<ReservationWithServices> {
  try {
    const hasDateChange = Boolean(body.date || body.time);
    const hasServiceChange = body.service_ids && body.service_ids.length > 0;

    if (!hasDateChange && !hasServiceChange) {
      throw new Error(
        "Debe enviar al menos un campo a modificar: date/time o service_ids."
      );
    }

    // Si solo llega uno de los dos (date sin time o time sin date) es ambiguo
    if ((body.date && !body.time) || (!body.date && body.time)) {
      throw new Error(
        "Para cambiar el horario debe enviar tanto date (YYYY-MM-DD) como time (HH:mm)."
      );
    }

    const reservation =
      await this.repository.findReservationById(reservationId);

    if (!reservation) {
      throw new Error(`La reserva con id "${reservationId}" no existe.`);
    }

    const nonEditableStatuses: ReservationStatus[] = [
      ReservationStatus.CANCELADA,
      ReservationStatus.FINALIZADA,
      ReservationStatus.EN_PROCESO,
    ];

    if (nonEditableStatuses.includes(reservation.status)) {
      throw new Error(
        `La reserva no puede modificarse porque su estado actual es "${reservation.status}".`
      );
    }

    await this.assertUserCanModify(user, reservation);

    // Calcular el nuevo datetime: si viene date+time, normalizar; si no, conservar el actual
    let newDatetime: Date;

    if (body.date && body.time) {
      newDatetime = parseColombiaDT(body.date, body.time);
      assertNotPast(
        newDatetime,
        `El nuevo horario "${body.date} ${body.time}" (hora Colombia)`
      );
    } else {
      // Conservar el datetime actual guardado en BD (ya está en UTC)
      newDatetime = new Date(reservation.datetime);
    }

    // Resolver servicios: nuevos o los actuales
    let services: WashService[];

    if (body.service_ids && body.service_ids.length > 0) {
      services = await this.repository.findServicesByIds(body.service_ids);

      if (services.length !== body.service_ids.length) {
        const foundIds = services.map((s) => s.id);
        const invalidIds = body.service_ids.filter(
          (id) => !foundIds.includes(id)
        );
        throw new Error(
          `Los siguientes servicios no existen o no están disponibles: ${invalidIds.join(", ")}`
        );
      }
    } else {
      services = reservation.services;
    }

    const totalDuration = services.reduce(
      (sum, s) => sum + Number(s.duration),
      0
    );
    const end = new Date(newDatetime.getTime() + totalDuration * 60 * 1000);

    const maxSlots = this.repository.getMaxConcurrentReservations();
    const overlapping = await this.repository.countOverlappingReservations(
      newDatetime,
      end,
      reservationId
    );

    if (overlapping >= maxSlots) {
      const label = body.date && body.time
        ? `${body.date} a las ${body.time} (hora Colombia)`
        : formatColombia(newDatetime);

      throw new Error(
        `El horario del ${label} no está disponible. Los ${maxSlots} cupos están ocupados durante ese período.`
      );
    }

    return await this.repository.updateReservation(
      reservationId,
      newDatetime,
      services
    );
  } catch (error) {
    const err = error as Error;
    throw new Error(
      `[ReservationService] Error al modificar la reserva: ${err.message}`
    );
  }
}

  async completeReservation(
  reservationId: string,
  body: CompleteReservationBody,
  user: GatewayUser
): Promise<CompleteReservationResult> {
  try {
    if (!body.payment_method) {
      throw new Error("El campo payment_method es requerido.");
    }

    const validMethods = Object.values(PaymentMethod) as string[];
    if (!validMethods.includes(body.payment_method)) {
      throw new Error(
        `Método de pago inválido: "${body.payment_method}". Valores permitidos: ${validMethods.join(", ")}`
      );
    }

    const reservation = await this.repository.findReservationById(reservationId);
    if (!reservation) {
      throw new Error(`La reserva "${reservationId}" no existe.`);
    }

    const completableStatuses: ReservationStatus[] = [
      ReservationStatus.CONFIRMADA,
      ReservationStatus.EN_PROCESO,
    ];

    if (!completableStatuses.includes(reservation.status)) {
      throw new Error(
        `La reserva no puede completarse porque su estado actual es "${reservation.status}".`
      );
    }

    // Solo admin puede completar reservas
    if (user.role !== UserRole.ADMIN) {
      throw new Error(
        "Solo un administrador puede marcar una reserva como completada."
      );
    }

    const userId = await this.repository.findPrimaryUserByVehicle(
      reservation.vehicle_id
    );
    if (!userId) {
      throw new Error(
        `No se encontró un usuario asociado al vehículo "${reservation.vehicle_id}".`
      );
    }

    await this.notificationClient.trigger(
      reservationId,
      NotificationType.SERVICIO_FINALIZADO
    );

    await this.notificationClient.trigger(
      reservationId,
      NotificationType.SOLICITUD_FEEDBACK
    );

    return await this.repository.completeReservationWithReceipt(
      reservationId,
      userId,
      reservation.total_price,
      body.payment_method
    );
  } catch (error) {
    const err = error as Error;
    throw new Error(
      `[ReservationService] Error al completar la reserva: ${err.message}`
    );
  }
}

  async getActiveReservationsByUser(
    userId: string
  ): Promise<ReservationFormatted[]> {
    try {
      if (!userId || userId.trim() === "") {
        throw new Error("El user_id es requerido.");
      }

      const reservations = await this.repository.findActiveReservationsByUserId(userId);

      return reservations.map((r) => {
        const { date, time } = splitDatetimeColombia(r.datetime);

        // Extraer solo los campos necesarios de la reserva
        const { datetime, created_at, updated_at, services, ...rest } = r as any;

        return {
          ...rest,
          date,
          time,
          services: (services as WashService[]).map((s) => ({
            id:       s.id,
            name:     s.name,
            price:    s.price,
            duration: s.duration,
          })),
        };
      });
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[ReservationService] Error al obtener reservas activas del usuario: ${err.message}`
      );
    }
  }

  async getWeeklyCalendar(query: WeeklyCalendarQuery): Promise<WeeklyCalendar> {
    try {
      if (!query.week_start) {
        throw new Error("El parámetro week_start es requerido (formato: YYYY-MM-DD).");
      }

      // week_start debe ser lunes — se acepta cualquier día y se normaliza
      const startDate = new Date(`${query.week_start}T08:00:00`);
      if (isNaN(startDate.getTime())) {
        throw new Error(
          `Formato de fecha inválido para week_start: "${query.week_start}". Use YYYY-MM-DD.`
        );
      }

      // Fin: domingo a las 18:00 (7 días, hasta las 18 inclusive)
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const occupancy = await this.repository.findSlotOccupancyByWeek(
        startDate,
        endDate
      );

      const maxSlots = this.repository.getMaxConcurrentReservations();

      // Agrupar por día
      const dayMap = new Map<string, CalendarSlot[]>();

      for (const slot of occupancy) {
        const localDate = new Date(slot.slot_start);

        const dateKey = localDate.toLocaleDateString("en-CA", {
          timeZone: "America/Bogota",
        }); // "2025-06-15"

        const hourLabel = localDate.toLocaleTimeString("es-CO", {
          timeZone: "America/Bogota",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }); // "08:00"

        if (!dayMap.has(dateKey)) dayMap.set(dateKey, []);

        dayMap.get(dateKey)!.push({
          hour: hourLabel,
          full: slot.count >= maxSlots,
        });
      }

      // Construir la respuesta ordenada por día
      const days: CalendarDay[] = Array.from(dayMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, slots]) => ({ date, slots }));

      const weekEndDate = new Date(endDate);
      weekEndDate.setDate(weekEndDate.getDate() - 1);

      return {
        week_start: query.week_start,
        week_end: weekEndDate.toLocaleDateString("en-CA", {
          timeZone: "America/Bogota",
        }),
        days,
      };
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[ReservationService] Error generando calendario semanal: ${err.message}`
      );
    }
  }

  async getReservationsByVehicle(
    vehicleId: string
  ): Promise<ReservationFormatted[]> {
    try {
      if (!vehicleId || vehicleId.trim() === "") {
        throw new Error("El vehicleId es requerido.");
      }

      const reservations =
        await this.repository.findReservationsByVehicleId(vehicleId);

      return reservations.map((r) => {
        const { date, time } = splitDatetimeColombia(r.datetime);

        // Extraer solo los campos necesarios de la reserva
        const { datetime, created_at, updated_at, services, ...rest } = r as any;

        return {
          ...rest,
          date,
          time,
          services: (services as WashService[]).map((s) => ({
            id:       s.id,
            name:     s.name,
            price:    s.price,
            duration: s.duration,
          })),
        };
      });
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[ReservationService] Error al obtener el historial del vehículo: ${err.message}`
      );
    }
  }
  
}
  


export function censorPlaca(placa: string): string {
  if (!placa || placa.length <= 2) return placa;
  const first = placa[0];
  const last = placa[placa.length - 1];
  const middle = "*".repeat(placa.length - 2);
  return `${first}${middle}${last}`;
}
export default ReservationService;