import nodemailer, { Transporter, SendMailOptions } from "nodemailer";
import { EmailPayload } from "../types";

class Mailer {
  private static instance: Mailer;
  private transporter: Transporter;

  
  private constructor() {
    // Nodemailer con contraseña de aplicación para Gmail
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: String(process.env.MAIL_USER),
        pass: String(process.env.MAIL_PASSWORD),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  public static getInstance(): Mailer {
    if (!Mailer.instance) {
      Mailer.instance = new Mailer();
    }
    return Mailer.instance;
  }

  public async send(payload: EmailPayload): Promise<void> {
    try {
      const options: SendMailOptions = {
        from: `"Lavadero" <${process.env.MAIL_USER}>`,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      };

      await this.transporter.sendMail(options);
      console.log(`[Mailer] Email enviado a ${payload.to} — "${payload.subject}"`);
    } catch (error) {
      const err = error as Error;
      throw new Error(`[Mailer] Error enviando email a ${payload.to}: ${err.message}`);
    }
  }

  public async verify(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log("[Mailer] Conexión con Gmail verificada correctamente.");
    } catch (error) {
      const err = error as Error;
      throw new Error(`[Mailer] Error verificando conexión con Gmail: ${err.message}`);
    }
  }
}

export default Mailer;