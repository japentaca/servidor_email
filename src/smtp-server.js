import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { emailStorage } from './email-storage.js';

const PORT = process.env.SMTP_PORT || 2525;

const log = (message) => {
  console.log(`[${new Date().toISOString()}] [SMTP] ${message}`);
};

const server = new SMTPServer({
  authOptional: true,
  onAuth(auth, session, callback) {
    log(`Client authenticating: ${auth.username}`);
    return callback(null, { user: auth.username });
  },
  onData(stream, session, callback) {
    let chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', async () => {
      const raw = Buffer.concat(chunks);
      try {
        const parsed = await simpleParser(raw);
        const emailData = {
          from: parsed.from?.text || session.envelope.mailFrom.address,
          to: parsed.to?.value.map(v => v.address) || session.envelope.rcptTo.map(r => r.address),
          subject: parsed.subject,
          text: parsed.text,
          html: parsed.html,
          raw: raw.toString(),
        };

        emailStorage.add(emailData);
        log(`Email received from ${emailData.from} to ${emailData.to.join(', ')}`);
        callback();
      } catch (err) {
        log(`Error parsing email: ${err.message}`);
        callback(err);
      }
    });
  },
  onConnect(session, callback) {
    log(`Client connected: ${session.remoteAddress}`);
    return callback();
  },
  onClose(session) {
    log(`Client disconnected: ${session.remoteAddress}`);
  }
});

export const startSmtpServer = () => {
  server.listen(PORT, () => {
    log(`Server listening on port ${PORT}`);
  });
};

export const stopSmtpServer = (callback) => {
  server.close(callback);
};
