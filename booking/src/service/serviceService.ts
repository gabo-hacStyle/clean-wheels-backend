import ServiceRepository from "../repository/serviceRepository";
import { WashService } from "../types";

class WashServiceService {
  private repository: ServiceRepository;

  constructor() {
    this.repository = new ServiceRepository();
  }

  async getAllServices(): Promise<WashService[]> {
    try {
      const services = await this.repository.findAllActive();

      if (services.length === 0) {
        throw new Error("No hay servicios disponibles en este momento.");
      }

      return services;
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[WashServiceService] Error al obtener los servicios: ${err.message}`
      );
    }
  }
}

export default WashServiceService;