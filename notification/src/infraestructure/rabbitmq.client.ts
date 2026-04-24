import amqplib, { Connection, Channel } from "amqplib";

// Nombres de exchanges y queues — punto único de verdad para ambos MS
export const EXCHANGES = {
  NOTIFICATIONS: "notifications.exchange",
} as const;

export const QUEUES = {
  RESERVATION_EVENTS: "reservation.events",
  NOTIFICATION_RETRY: "notification.retry",
} as const;

export const ROUTING_KEYS = {
  RESERVATION_CREATED: "reservation.created",
  RESERVATION_CANCELLED: "reservation.cancelled",
  SERVICE_STARTED: "reservation.service.started",
  SERVICE_FINISHED: "reservation.service.finished",
} as const;

class RabbitMQClient {
  private static instance: RabbitMQClient;
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private readonly url: string;

  private constructor() {
    this.url = process.env.RABBITMQ_URL ?? "amqp://localhost:5672";
  }

  public static getInstance(): RabbitMQClient {
    if (!RabbitMQClient.instance) {
      RabbitMQClient.instance = new RabbitMQClient();
    }
    return RabbitMQClient.instance;
  }

  public async connect(): Promise<void> {
    try {
      this.connection = await amqplib.connect(this.url);
      this.channel = await this.connection.createChannel();

      // Declarar exchange principal (topic para routing flexible)
      await this.channel.assertExchange(
        EXCHANGES.NOTIFICATIONS,
        "topic",
        { durable: true }
      );

      // Declarar queues
      await this.channel.assertQueue(QUEUES.RESERVATION_EVENTS, {
        durable: true,
      });
      await this.channel.assertQueue(QUEUES.NOTIFICATION_RETRY, {
        durable: true,
        arguments: {
          // Los mensajes en retry esperan 5 min antes de volver a la queue principal
          "x-dead-letter-exchange": EXCHANGES.NOTIFICATIONS,
          "x-message-ttl": 5 * 60 * 1000,
        },
      });

      // Bindings: qué routing keys escucha cada queue
      for (const key of Object.values(ROUTING_KEYS)) {
        await this.channel.bindQueue(
          QUEUES.RESERVATION_EVENTS,
          EXCHANGES.NOTIFICATIONS,
          key
        );
      }

      // Manejo de cierre inesperado
      this.connection.on("close", () => {
        console.warn("[RabbitMQ] Conexión cerrada inesperadamente. Reconectando...");
        setTimeout(() => this.connect(), 5000);
      });

      this.connection.on("error", (err: Error) => {
        console.error(`[RabbitMQ] Error en conexión: ${err.message}`);
      });

      console.log("[RabbitMQ] Conectado y canales configurados correctamente.");
    } catch (error) {
      const err = error as Error;
      throw new Error(`[RabbitMQ] Error conectando: ${err.message}`);
    }
  }

  // Publicar un mensaje al exchange
  public async publish(
    routingKey: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    try {
      if (!this.channel) {
        throw new Error("Canal no inicializado. Llame a connect() primero.");
      }

      const buffer = Buffer.from(JSON.stringify(payload));

      this.channel.publish(
        EXCHANGES.NOTIFICATIONS,
        routingKey,
        buffer,
        { persistent: true, contentType: "application/json" }
      );
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[RabbitMQ] Error publicando mensaje con routing key "${routingKey}": ${err.message}`
      );
    }
  }

  // Consumir mensajes de una queue
  public async consume(
    queue: string,
    handler: (payload: Record<string, unknown>) => Promise<void>
  ): Promise<void> {
    try {
      if (!this.channel) {
        throw new Error("Canal no inicializado. Llame a connect() primero.");
      }

      // Procesar de a 1 mensaje por vez (fair dispatch)
      this.channel.prefetch(1);

      await this.channel.consume(queue, async (msg) => {
        if (!msg) return;

        try {
          const payload = JSON.parse(msg.content.toString()) as Record<string, unknown>;
          await handler(payload);
          this.channel!.ack(msg);
        } catch (error) {
          const err = error as Error;
          console.error(
            `[RabbitMQ] Error procesando mensaje de "${queue}": ${err.message}`
          );
          // nack sin requeue — el mensaje irá a la dead letter queue si está configurada
          this.channel!.nack(msg, false, false);
        }
      });

      console.log(`[RabbitMQ] Consumiendo mensajes de la queue "${queue}".`);
    } catch (error) {
      const err = error as Error;
      throw new Error(
        `[RabbitMQ] Error iniciando consumer en "${queue}": ${err.message}`
      );
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      console.log("[RabbitMQ] Desconectado correctamente.");
    } catch (error) {
      const err = error as Error;
      throw new Error(`[RabbitMQ] Error al desconectar: ${err.message}`);
    }
  }

  public getChannel(): Channel {
    if (!this.channel) {
      throw new Error(
        "[RabbitMQ] Canal no disponible. Llame a connect() primero."
      );
    }
    return this.channel;
  }
}

export default RabbitMQClient;