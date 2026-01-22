import 'dotenv/config';
import { test, after, before } from 'node:test';
import assert from 'node:assert';
import nodemailer from 'nodemailer';
import POP3Client from 'node-pop3';
import { startSmtpServer, stopSmtpServer } from '../src/smtp-server.js';
import { startPop3Server, stopPop3Server } from '../src/pop3-server.js';
import { emailStorage } from '../src/email-storage.js';

const SMTP_PORT = process.env.SMTP_PORT || 2525;
const POP3_PORT = process.env.POP3_PORT || 1110;

before(() => {
  startSmtpServer();
  startPop3Server();
});

after((done) => {
  stopSmtpServer(() => {
    stopPop3Server(done);
  });
});

test('Integration: Sent email via SMTP should be retrievable via POP3', async () => {
  emailStorage.clear();

  // 1. Send email via SMTP
  const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: SMTP_PORT,
    secure: false,
    auth: {
      user: 'testuser',
      pass: 'testpass'
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: 'integration-sender@example.com',
    to: 'integration-receiver@example.com',
    subject: 'Integration Test Email',
    text: 'This is a test of the full SMTP to POP3 flow.',
  };

  await transporter.sendMail(mailOptions);

  // Wait a bit for SMTP to finish parsing and storage
  await new Promise(resolve => setTimeout(resolve, 500));

  // 2. Retrieve email via POP3
  const client = new POP3Client({
    host: 'localhost',
    port: POP3_PORT,
    user: 'testuser',
    password: 'testpassword',
  });

  const list = await client.LIST();
  assert.strictEqual(list.length, 1, 'Should have 1 email in POP3 list');

  const rawEmail = await client.RETR(1);
  assert.ok(rawEmail.includes('Subject: Integration Test Email'), 'Raw email should contain the correct subject');
  assert.ok(rawEmail.includes('This is a test of the full SMTP to POP3 flow.'), 'Raw email should contain the body');
  assert.ok(rawEmail.includes('From: integration-sender@example.com'), 'Raw email should contain the sender');

  await client.QUIT();
});
