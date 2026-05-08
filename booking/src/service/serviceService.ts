import ServiceRepository from "../repository/serviceRepository";
import { CreateServiceBody, UpdateServiceBody, WashService, WashServiceResponse, WashServiceResponseAdmin } from "../types";

class WashServiceService {
  private repository: ServiceRepository;

  constructor() {
    this.repository = new ServiceRepository();
  }

  async getAllServices(): Promise<WashServiceResponse[]> {
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

  async getAllServicesAdmin(): Promise<WashServiceResponseAdmin[]> {
    try {
      const services = await this.repository.findAll();
      if (services.length === 0) {
        throw new Error("No hay servicios registrados en este momento.");
      }
      return services;
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[WashServiceService] Error al obtener los servicios para admin: ${err.message}`
      );
    }
  }

async createService(body: CreateServiceBody): Promise<WashService> {
  try {
    const { name, price, description, url, duration, category_id } = body;

    if (!name || price === undefined || !description || !duration || !category_id) {
      throw new Error(
        "Los campos name, price, description, duration y category_id son requeridos."
      );
    }

    if (price < 0) throw new Error("El precio no puede ser negativo.");
    if (duration <= 0) throw new Error("La duración debe ser mayor a 0 minutos.");

    const categoryValid = await this.repository.categoryExists(category_id);
    if (!categoryValid) {
      throw new Error(
        `La categoría con id "${category_id}" no existe o está desactivada.`
      );
    }

    return await this.repository.create({
      name: name.trim(),
      price,
      description: description.trim(),
      url: url ? url.trim() : "",
      duration,
      category_id,
    });
  } catch (error) {
    const err = error as Error;
    throw new Error(
      `[WashServiceService] Error al crear servicio: ${err.message}`
    );
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
    if (!existing) {
      throw new Error(`El servicio "${serviceId}" no existe.`);
    }

    if (body.category_id) {
      const categoryValid = await this.repository.categoryExists(
        body.category_id
      );
      if (!categoryValid) {
        throw new Error(
          `La categoría con id "${body.category_id}" no existe o está desactivada.`
        );
      }
    }

    const data: Partial<WashService> = {};
    if (body.name)        data.name        = body.name.trim();
    if (body.price !== undefined) data.price = body.price;
    if (body.description) data.description = body.description.trim();
    if (body.url !== undefined)   data.url  = body.url ? body.url.trim() : undefined;
    if (body.duration !== undefined) data.duration = body.duration;
    if (body.category_id) data.category_id = body.category_id;

    return await this.repository.update(serviceId, data);
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