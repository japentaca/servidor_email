import 'dotenv/config';
import { startSmtpServer } from './src/smtp-server.js';
import { startPop3Server } from './src/pop3-server.js';

console.log('--- EMAIL TESTING SERVER ---');
startSmtpServer();
startPop3Server();
console.log('-----------------------------');
