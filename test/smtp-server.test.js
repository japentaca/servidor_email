import 'dotenv/config';
import { test, after, before } from 'node:test';
import assert from 'node:assert';
import nodemailer from 'nodemailer';
import { startSmtpServer, stopSmtpServer } from '../src/smtp-server.js';
import { emailStorage } from '../src/email-storage.js';

const PORT = process.env.SMTP_PORT || 2525;

before(() => {
  startSmtpServer();
});

after((done) => {
  stopSmtpServer(done);
});

test('SMTP server should receive and store emails', async () => {
  emailStorage.clear();

  const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: PORT,
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
    from: 'sender@example.com',
    to: 'receiver@example.com',
    subject: 'Test SMTP',
    text: 'Hello world',
    html: '<b>Hello world</b>'
  };

  await transporter.sendMail(mailOptions);

  // Wait a bit for async parsing
  await new Promise(resolve => setTimeout(resolve, 500));

  const emails = emailStorage.list();
  assert.strictEqual(emails.length, 1);
  assert.strictEqual(emails[0].from, 'sender@example.com');
  assert.deepStrictEqual(emails[0].to, ['receiver@example.com']);
  assert.strictEqual(emails[0].subject, 'Test SMTP');
  assert.strictEqual(emails[0].text, 'Hello world');
  assert.strictEqual(emails[0].html, '<b>Hello world</b>');
});
