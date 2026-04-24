import ReservationRepository from "../repository/reservationRepository";
import {
  AvailabilityResult,
  CheckAvailabilityBody,
  CreateReservationBody,
  EmployeeSlot,
  GatewayUser,
  HourlySchedule,
  Reservation,
  ReservationStatus,
  ReservationWithServices,
  UpdateReservationBody,
  UserRole,
  WashService,
} from "../types";

class ReservationService {
  private repository: ReservationRepository;

  constructor() {
    this.repository = new ReservationRepository();
  }

  async checkAvailability(
    body: CheckAvailabilityBody
  ): Promise<AvailabilityResult> {
    try {
      const { datetime, total_duration } = body;

      if (!datetime || total_duration === undefined || total_duration === null) {
        throw new Error(
          "Los campos datetime y total_duration son requeridos."
        );
      }

      if (total_duration <= 0) {
        throw new Error(
          "La duración total debe ser mayor a 0 minutos."
        );
      }

      const start = new Date(datetime);
      if (isNaN(start.getTime())) {
        throw new Error(
          `El formato de fecha y hora es inválido. Use ISO 8601 (ej: "2025-06-15T10:00:00Z").`
        );
      }

      if (start < new Date()) {
        throw new Error(
          "No es posible verificar disponibilidad para fechas pasadas."
        );
      }

      // Calcular el fin del slot solicitado
      const end = new Date(start.getTime() + total_duration * 60 * 1000);

      const maxSlots = this.repository.getMaxConcurrentReservations();

      // Contar cuántas reservas activas se solapan con el slot completo
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
          ? `Hay disponibilidad para el slot solicitado. Quedan ${slotsRemaining} cupo(s) de ${maxSlots}.`
          : `No hay disponibilidad para el horario solicitado. Los ${maxSlots} cupos están ocupados durante ese período.`,
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
      const { vehicle_id, datetime, service_ids } = body;

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

      const start = new Date(datetime);
      if (isNaN(start.getTime())) {
        throw new Error(
          `El formato de fecha y hora es inválido. Use ISO 8601 (ej: "2025-06-15T10:00:00Z").`
        );
      }

      if (start < new Date()) {
        throw new Error(
          "No es posible agendar una reserva en una fecha pasada."
        );
      }

      // Calcular duración total real desde los servicios seleccionados
      const totalDuration = foundServices.reduce(
        (sum, s) => sum + Number(s.duration),
        0
      );
      const end = new Date(start.getTime() + totalDuration * 60 * 1000);

      // Verificar disponibilidad con la misma regla de los 3 empleados
      const maxSlots = this.repository.getMaxConcurrentReservations();
      const overlapping = await this.repository.countOverlappingReservations(
        start,
        end
      );

      if (overlapping >= maxSlots) {
        throw new Error(
          `El horario solicitado no está disponible. Los ${maxSlots} cupos están ocupados durante ese período.`
        );
      }

      const reservation = await this.repository.createReservationWithServices(
        vehicle_id,
        start,
        foundServices
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
    for (let i = 0; i < 8; i++) {
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
              start_time: null,
              end_time: null,
              status: null,
            };
          }

          const resStart = new Date(reservation.datetime);
          const resEnd = new Date(
            resStart.getTime() + Number(reservation.total_duration) * 60 * 1000
          );

          return {
            slot_index: idx + 1,
            reservation_id: reservation.id,
            vehicle_id: reservation.vehicle_id,
            placa: resWithVehicle.placa ?? null,
            marca: resWithVehicle.marca ?? null,
            modelo: resWithVehicle.modelo ?? null,
            services: reservation.services.map((s: any) =>
              typeof s === "string" ? s : s.name
            ),
            start_time: resStart.toISOString(),
            end_time: resEnd.toISOString(),
            status: reservation.status,
          };
        }
      );

      schedule.push({
        hour: hourStart.toISOString(),
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
      if (!body.datetime && !body.service_ids) {
        throw new Error(
          "Debe enviar al menos un campo a modificar: datetime o service_ids."
        );
      }

      const reservation = await this.repository.findReservationById(reservationId);

      if (!reservation) {
        throw new Error(
          `La reserva con id "${reservationId}" no existe.`
        );
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

      // Si no se envía nuevo datetime, conservar el actual
      const newDatetime = body.datetime
        ? new Date(body.datetime)
        : new Date(reservation.datetime);

      if (body.datetime && isNaN(newDatetime.getTime())) {
        throw new Error(
          `El formato de fecha y hora es inválido. Use ISO 8601 (ej: "2025-06-15T10:00:00Z").`
        );
      }

      if (newDatetime < new Date()) {
        throw new Error(
          "No es posible reprogramar una reserva en una fecha pasada."
        );
      }

      // Si no se envían nuevos servicios, conservar los actuales
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

      // Verificar disponibilidad del nuevo slot (excluyendo la reserva actual)
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
        throw new Error(
          `El nuevo horario no está disponible. Los ${maxSlots} cupos están ocupados durante ese período.`
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
}

export default ReservationService;