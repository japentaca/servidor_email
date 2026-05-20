import { test, beforeEach } from 'node:test';
import assert from 'node:assert';
import { emailStorage } from '../src/email-storage.js';

beforeEach(() => {
  return emailStorage.clear();
});

test('emailStorage.add should add an email and generate ID', async () => {
  const email = await emailStorage.add({ from: 'test@example.com', to: ['user1@example.com'], subject: 'Test' });
  assert.strictEqual(email.id, 1);
  assert.strictEqual(email.from, 'test@example.com');
  assert.strictEqual(email.mailbox, 'user1@example.com');
  const list = await emailStorage.list();
  assert.strictEqual(list.length, 1);
});

test('emailStorage.get should retrieve email by ID', async () => {
  const added = await emailStorage.add({ subject: 'Find me' });
  const retrieved = await emailStorage.get(added.id);
  assert.strictEqual(retrieved.id, added.id);
  assert.strictEqual(retrieved.subject, 'Find me');
});

test('emailStorage.delete should remove email', async () => {
  const email = await emailStorage.add({ subject: 'To delete' });
  const success = await emailStorage.delete(email.id);
  assert.strictEqual(success, true);
  const list = await emailStorage.list();
  assert.strictEqual(list.length, 0);
});

test('emailStorage.clear should empty the storage', async () => {
  await emailStorage.add({ to: ['user1@example.com'], subject: '1' });
  await emailStorage.add({ to: ['user1@example.com'], subject: '2' });
  await emailStorage.clear();
  const list = await emailStorage.list();
  assert.strictEqual(list.length, 0);
});

test('emailStorage should respect FIFO limit of 100', async () => {
  for (let i = 0; i < 110; i++) {
    await emailStorage.add({ to: ['user1@example.com'], subject: `Email ${i}` });
  }
  const list = await emailStorage.list();
  assert.strictEqual(list.length, 100);
  assert.strictEqual(list[0].subject, 'Email 10');
});

test('emailStorage.list should filter by mailbox', async () => {
  await emailStorage.add({ to: ['user1@example.com'], subject: 'User 1 email' });
  await emailStorage.add({ to: ['user2@example.com'], subject: 'User 2 email' });

  const user1List = await emailStorage.list('user1@example.com');
  const user2List = await emailStorage.list('user2@example.com');

  assert.strictEqual(user1List.length, 1);
  assert.strictEqual(user1List[0].subject, 'User 1 email');
  assert.strictEqual(user2List.length, 1);
  assert.strictEqual(user2List[0].subject, 'User 2 email');
});
