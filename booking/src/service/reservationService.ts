import ReservationRepository from "../repository/reservationRepository";
import {
  CreateReservationBody,
  ReservationWithServices,
  WashService,
} from "../types";

class ReservationService {
  private repository: ReservationRepository;

  constructor() {
    this.repository = new ReservationRepository();
  }

  async createReservation(
    body: CreateReservationBody
  ): Promise<ReservationWithServices> {
    try {
      const { vehicle_id, datetime, service_ids } = body;

      // Validar que se envió al menos un servicio
      if (!service_ids || service_ids.length === 0) {
        throw new Error("Debe seleccionar al menos un servicio.");
      }

      // Validar que el vehículo existe
      const vehicleExists = await this.repository.findVehicleById(vehicle_id);
      if (!vehicleExists) {
        throw new Error(
          `El vehículo con id "${vehicle_id}" no existe en el sistema.`
        );
      }

      // Validar que los servicios existen y están activos
      const foundServices: WashService[] =
        await this.repository.findServicesByIds(service_ids);

      if (foundServices.length !== service_ids.length) {
        const foundIds = foundServices.map((s) => s.id);
        const invalidIds = service_ids.filter((id) => !foundIds.includes(id));
        throw new Error(
          `Los siguientes servicios no existen o no están disponibles: ${invalidIds.join(", ")}`
        );
      }

      // Validar disponibilidad del horario
      const parsedDatetime = new Date(datetime);
      if (isNaN(parsedDatetime.getTime())) {
        throw new Error(
          `El formato de fecha y hora es inválido. Use ISO 8601 (ej: "2025-06-15T10:00:00Z").`
        );
      }

      const slotTaken = await this.repository.isSlotTaken(parsedDatetime);
      if (slotTaken) {
        throw new Error(
          `El horario "${datetime}" no está disponible. Por favor seleccione otro.`
        );
      }

      // Crear la reserva
      const reservation = await this.repository.createReservationWithServices(
        vehicle_id,
        parsedDatetime,
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
}

export default ReservationService;