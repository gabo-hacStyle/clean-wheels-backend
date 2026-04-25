import ServiceRepository from "../repository/serviceRepository";
import { CreateServiceBody, UpdateServiceBody, WashService } from "../types";

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

  async createService(body: CreateServiceBody): Promise<WashService> {
  try {
    if (!body.name || body.price === undefined || !body.description || !body.duration) {
      throw new Error(
        "Los campos name, price, description y duration son requeridos."
      );
    }

    if (body.price < 0) throw new Error("El precio no puede ser negativo.");
    if (body.duration <= 0) throw new Error("La duración debe ser mayor a 0 minutos.");

    return await this.repository.create(body);
  } catch (error) {
    const err = error as Error;
    throw new Error(`[WashServiceService] Error al crear servicio: ${err.message}`);
  }
}

async updateService(
  serviceId: string,
  body: UpdateServiceBody
): Promise<WashService> {
  try {
    if (Object.keys(body).length === 0) {
      throw new Error("Debe enviar al menos un campo a actualizar.");
    }

    if (body.price !== undefined && body.price < 0) {
      throw new Error("El precio no puede ser negativo.");
    }

    if (body.duration !== undefined && body.duration <= 0) {
      throw new Error("La duración debe ser mayor a 0 minutos.");
    }

    const existing = await this.repository.findById(serviceId);
    if (!existing) throw new Error(`El servicio "${serviceId}" no existe.`);

    return await this.repository.update(serviceId, body);
  } catch (error) {
    const err = error as Error;
    throw new Error(
      `[WashServiceService] Error al actualizar servicio: ${err.message}`
    );
  }
}

async deactivateService(serviceId: string): Promise<WashService> {
  try {
    const existing = await this.repository.findById(serviceId);
    if (!existing) throw new Error(`El servicio "${serviceId}" no existe.`);
    if (!existing.is_active) throw new Error(`El servicio "${serviceId}" ya está desactivado.`);

    return await this.repository.deactivate(serviceId);
  } catch (error) {
    const err = error as Error;
    throw new Error(
      `[WashServiceService] Error al desactivar servicio: ${err.message}`
    );
  }
}

async deleteService(serviceId: string): Promise<void> {
  try {
    const existing = await this.repository.findById(serviceId);
    if (!existing) throw new Error(`El servicio "${serviceId}" no existe.`);

    await this.repository.delete(serviceId);
  } catch (error) {
    const err = error as Error;
    throw new Error(
      `[WashServiceService] Error al eliminar servicio: ${err.message}`
    );
  }
}
}

export default WashServiceService;