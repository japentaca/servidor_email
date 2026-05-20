import 'dotenv/config';
import { test, after, before } from 'node:test';
import assert from 'node:assert';
import POP3Client from 'node-pop3';
import { startPop3Server, stopPop3Server } from '../src/pop3-server.js';
import { emailStorage } from '../src/email-storage.js';

const PORT = process.env.POP3_PORT || 1110;

before(() => {
  startPop3Server();
});

after((done) => {
  stopPop3Server(done);
});

test('POP3 server should handle basic commands', async () => {
  await emailStorage.clear();
  await emailStorage.add({ from: 'test1@example.com', to: ['testuser@example.com'], raw: 'Raw Content 1' });
  await emailStorage.add({ from: 'test2@example.com', to: ['otheruser@example.com'], raw: 'Raw Content 2' });

  const client = new POP3Client({
    port: PORT,
    host: 'localhost',
    user: 'testuser@example.com',
    password: 'testpassword',
  });

  const stat = await client.STAT();
  // STAT returns a string like "2 120" (strips +OK )
  assert.ok(stat.startsWith('1'));

  const list = await client.LIST();
  // LIST returns an array of arrays [ ['1', 'size'], ['2', 'size'] ]
  assert.strictEqual(list.length, 1);

  const retr = await client.RETR(1);
  assert.ok(retr.includes('Raw Content 1'));

  await client.DELE(1);
  const statAfterDele = await client.STAT();
  // Deleted messages are hidden in the current transaction.
  assert.ok(statAfterDele.startsWith('0'));

  await client.QUIT();

  // Storage should keep other user's mailbox untouched
  const userMailbox = await emailStorage.list('testuser@example.com');
  const otherMailbox = await emailStorage.list('otheruser@example.com');
  assert.strictEqual(userMailbox.length, 0);
  assert.strictEqual(otherMailbox.length, 1);
  assert.strictEqual(otherMailbox[0].from, 'test2@example.com');
});
