import { test, beforeEach } from 'node:test';
import assert from 'node:assert';
import { emailStorage } from '../src/email-storage.js';

beforeEach(() => {
  emailStorage.clear();
});

test('emailStorage.add should add an email and generate ID', () => {
  const email = emailStorage.add({ from: 'test@example.com', subject: 'Test' });
  assert.strictEqual(email.id, 1);
  assert.strictEqual(email.from, 'test@example.com');
  assert.strictEqual(emailStorage.list().length, 1);
});

test('emailStorage.get should retrieve email by ID', () => {
  const added = emailStorage.add({ subject: 'Find me' });
  const retrieved = emailStorage.get(added.id);
  assert.deepStrictEqual(added, retrieved);
});

test('emailStorage.delete should remove email', () => {
  const email = emailStorage.add({ subject: 'To delete' });
  const success = emailStorage.delete(email.id);
  assert.strictEqual(success, true);
  assert.strictEqual(emailStorage.list().length, 0);
});

test('emailStorage.clear should empty the storage', () => {
  emailStorage.add({ subject: '1' });
  emailStorage.add({ subject: '2' });
  emailStorage.clear();
  assert.strictEqual(emailStorage.list().length, 0);
});

test('emailStorage should respect FIFO limit of 100', () => {
  for (let i = 0; i < 110; i++) {
    emailStorage.add({ subject: `Email ${i}` });
  }
  const list = emailStorage.list();
  assert.strictEqual(list.length, 100);
  assert.strictEqual(list[0].subject, 'Email 10');
});
