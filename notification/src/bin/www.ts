#!/usr/bin/env node

import App from "../app";
import debug from "debug";
import http from "http";

const serverDebug = debug("notifications:server");

const normalizePort = (value: string): number | string | false => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return value;
  if (parsed >= 0) return parsed;
  return false;
};

const port = normalizePort(process.env.PORT ?? "3001");
if (port === false) throw new Error("Invalid port");

const appInstance = new App();
const app = appInstance.getApp();

app.set("port", port);
const server = http.createServer(app);

server.listen(port);

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.syscall !== "listen") throw error;
  const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;
  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

server.on("listening", async () => {
  const address = server.address();
  const bind =
    typeof address === "string" ? `pipe ${address}` : `port ${address?.port}`;
  serverDebug(`Listening on ${bind}`);
  console.log(`[Server] Notifications MS corriendo en ${bind}`);

  // Iniciar infraestructura DESPUÉS de que el servidor HTTP esté listo
  try {
    await appInstance.initInfrastructure();
  } catch (error) {
    const err = error as Error;
    console.error(`[Server] Error crítico en infraestructura: ${err.message}`);
    process.exit(1);
  }
});