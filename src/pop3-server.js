import net from 'net';
import { emailStorage } from './email-storage.js';

const PORT = process.env.POP3_PORT || 1110;

const log = (message) => {
  console.log(`[${new Date().toISOString()}] [POP3] ${message}`);
};

const STATES = {
  AUTHORIZATION: 'AUTHORIZATION',
  TRANSACTION: 'TRANSACTION',
  UPDATE: 'UPDATE',
};

class Pop3Session {
  constructor(socket) {
    this.socket = socket;
    this.state = STATES.AUTHORIZATION;
    this.user = null;
    this.deletedIds = new Set();
    this.emails = []; // Snapshot of emails at the start of transaction
  }

  send(message) {
    log(`Response: ${message}`);
    this.socket.write(`${message}\r\n`);
  }

  handleCommand(line) {
    const [command, ...args] = line.trim().split(' ');
    const cmd = command.toUpperCase();
    log(`Command: ${cmd} ${args.join(' ')}`);

    switch (cmd) {
      case 'USER':
        this.user = args[0];
        this.send('+OK User accepted');
        break;
      case 'PASS':
        this.state = STATES.TRANSACTION;
        this.emails = emailStorage.list();
        this.send('+OK Welcome');
        break;
      case 'STAT':
        if (this.state !== STATES.TRANSACTION) return this.send('-ERR Must login first');
        const activeEmails = this.emails.filter(e => !this.deletedIds.has(e.id));
        const totalSize = activeEmails.reduce((acc, e) => acc + (e.raw?.length || 0), 0);
        this.send(`+OK ${activeEmails.length} ${totalSize}`);
        break;
      case 'LIST':
        if (this.state !== STATES.TRANSACTION) return this.send('-ERR Must login first');
        if (args[0]) {
          const index = parseInt(args[0]) - 1;
          const email = this.emails[index];
          if (!email || this.deletedIds.has(email.id)) return this.send('-ERR No such message');
          this.send(`+OK ${args[0]} ${email.raw?.length || 0}`);
        } else {
          const active = this.emails
            .map((e, i) => ({ e, i }))
            .filter(({ e }) => !this.deletedIds.has(e.id));
          this.send(`+OK ${active.length} messages`);
          active.forEach(({ e, i }) => this.send(`${i + 1} ${e.raw?.length || 0}`));
          this.send('.');
        }
        break;
      case 'RETR':
        if (this.state !== STATES.TRANSACTION) return this.send('-ERR Must login first');
        const retrIdx = parseInt(args[0]) - 1;
        const retrEmail = this.emails[retrIdx];
        if (!retrEmail || this.deletedIds.has(retrEmail.id)) return this.send('-ERR No such message');
        this.send(`+OK ${retrEmail.raw?.length || 0} octets`);
        this.socket.write(retrEmail.raw + '\r\n.\r\n');
        break;
      case 'DELE':
        if (this.state !== STATES.TRANSACTION) return this.send('-ERR Must login first');
        const deleIdx = parseInt(args[0]) - 1;
        const deleEmail = this.emails[deleIdx];
        if (!deleEmail || this.deletedIds.has(deleEmail.id)) return this.send('-ERR No such message');
        this.deletedIds.add(deleEmail.id);
        this.send(`+OK Message ${args[0]} deleted`);
        break;
      case 'RSET':
        if (this.state !== STATES.TRANSACTION) return this.send('-ERR Must login first');
        this.deletedIds.clear();
        this.send('+OK Reset');
        break;
      case 'NOOP':
        this.send('+OK');
        break;
      case 'QUIT':
        if (this.state === STATES.TRANSACTION) {
          this.state = STATES.UPDATE;
          this.deletedIds.forEach(id => emailStorage.delete(id));
        }
        this.send('+OK Goodbye');
        this.socket.end();
        break;
      case 'CAPA':
        this.send('+OK Capability list follows');
        this.send('USER');
        this.send('IMPLEMENTATION Simple-Node-POP3');
        this.send('.');
        break;
      default:
        this.send('-ERR Unknown command');
    }
  }
}

const server = net.createServer((socket) => {
  log(`Client connected: ${socket.remoteAddress}`);
  const session = new Pop3Session(socket);
  session.send('+OK POP3 server ready');

  let buffer = '';
  socket.on('data', (data) => {
    buffer += data.toString();
    while (buffer.includes('\r\n')) {
      const line = buffer.substring(0, buffer.indexOf('\r\n'));
      buffer = buffer.substring(buffer.indexOf('\r\n') + 2);
      session.handleCommand(line);
    }
  });

  socket.on('end', () => log(`Client disconnected: ${socket.remoteAddress}`));
  socket.on('error', (err) => log(`Socket error: ${err.message}`));
});

export const startPop3Server = () => {
  server.listen(PORT, () => {
    log(`Server listening on port ${PORT}`);
  });
};

export const stopPop3Server = (callback) => {
  server.close(callback);
};
