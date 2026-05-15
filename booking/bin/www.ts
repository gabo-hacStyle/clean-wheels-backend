#!/usr/bin/env node
import App from '../src/app';
const appInstance = new App();
const app = appInstance.getApp();
import debug from 'debug';
import http from 'http';


const serverDebug = debug('booking:server');

const normalizePort = (value: string): number | string | false => {
  const parsedPort = Number.parseInt(value, 10);

  if (Number.isNaN(parsedPort)) {
    return value;
  }

  if (parsedPort >= 0) {
    return parsedPort;
  }

  return false;
};

const port = normalizePort(process.env.PORT ?? '3000');

if (port === false) {
  throw new Error('Invalid port');
}


app.set('port', port);

const server = http.createServer(app);

server.listen(port);
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

server.on('listening', () => {
  const address = server.address();
  const bind = typeof address === 'string' ? `pipe ${address}` : `port ${address?.port}`;
  serverDebug(`Listening on ${bind}`);

  console.log(`Servidor escuchando en ${bind}`);
  console.log(`Modo: ${process.env.NODE_ENV || 'desarrollo'}`);
});