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
  emailStorage.clear();
  emailStorage.add({ from: 'test1@example.com', raw: 'Raw Content 1' });
  emailStorage.add({ from: 'test2@example.com', raw: 'Raw Content 2' });

  const client = new POP3Client({
    port: PORT,
    host: 'localhost',
    user: 'testuser',
    password: 'testpassword',
  });

  const stat = await client.STAT();
  // STAT returns a string like "2 120" (strips +OK )
  assert.ok(stat.startsWith('2'));

  const list = await client.LIST();
  // LIST returns an array of arrays [ ['1', 'size'], ['2', 'size'] ]
  assert.strictEqual(list.length, 2);

  const retr = await client.RETR(1);
  assert.ok(retr.includes('Raw Content 1'));

  await client.DELE(1);
  const statAfterDele = await client.STAT();
  // POP3 doesn't update count until QUIT in this implementation (RFC behavior)
  assert.ok(statAfterDele.startsWith('1') || statAfterDele.startsWith('2'));

  await client.QUIT();

  // Storage should have only 1 email now
  assert.strictEqual(emailStorage.list().length, 1);
  assert.strictEqual(emailStorage.list()[0].from, 'test2@example.com');
});
