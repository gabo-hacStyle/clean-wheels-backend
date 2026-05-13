import ReservationRepository from "../repository/reservationRepository";
import NotificationClient from "../infraestructure/email.client";
import { NotificationType, ReservationFormatted, SaveVehicleRequest, Vehicle} from "../types";
import VehicleRepository from "../repository/vehicleRepository";

class VehicleService {
    
    private repository: VehicleRepository

    constructor() {
        this.repository = new VehicleRepository();
    } 

    async getVehiclesByUser(userId: string): Promise<Vehicle[]> {
    try {      if (!userId || userId.trim() === "") {
        throw new Error("El userId es requerido.");
      }
      const vehicles = await this.repository.findVehiclesByUserId(userId);

      return vehicles;
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[VehicleService] Error al obtener los vehículos del usuario: ${err.message}`
      );
    }
  }

  async saveVehicleForUser(
  userId: string,
  body: SaveVehicleRequest
): Promise<Vehicle> {
  try {
    const { placa, marca, modelo } = body;

    // Validaciones del body
    if (!placa || placa.trim() === "") {
      throw new Error("El campo placa es requerido.");
    }
    if (!marca || marca.trim() === "") {
      throw new Error("El campo marca es requerido.");
    }
    if (!modelo || modelo.trim() === "") {
      throw new Error("El campo modelo es requerido.");
    }

    const placaNormalizada = placa.trim().toUpperCase();

    // Verificar si el vehículo ya existe en el sistema por placa
    let vehicle = await this.repository.findVehicleByPlaca(placaNormalizada);

    if (vehicle) {
      // El vehículo existe — verificar que no esté ya vinculado a este usuario
      const alreadyLinked = await this.repository.isVehicleAlreadyLinkedToUser(
        vehicle.id,
        userId
      );

      if (alreadyLinked) {
        throw new Error(
          `El vehículo con placa "${placaNormalizada}" ya está registrado en tu cuenta.`
        );
      }

      // Vehículo existe pero no está vinculado → solo vincular
      await this.repository.linkVehicleToUser(vehicle.id, userId);
    } else {
      // El vehículo no existe → crear y vincular
      vehicle = await this.repository.createVehicle(
        placaNormalizada,
        marca.trim(),
        modelo.trim()
      );

      await this.repository.linkVehicleToUser(vehicle.id, userId);
    }

    return vehicle;
  } catch (error) {
    const err = error as Error;
    throw new Error(
      `[VehicleService] Error al registrar vehículo: ${err.message}`
    );
  }
}
}

export default VehicleService;