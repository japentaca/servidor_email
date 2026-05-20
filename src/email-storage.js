import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import knex from 'knex';

const MAX_EMAILS = 100;

class EmailStorage {
  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const rootDir = path.resolve(__dirname, '..');
    const dataDir = path.join(rootDir, 'data');
    const dbPath = path.join(dataDir, 'emails.sqlite3');

    this.db = knex({
      client: 'sqlite3',
      connection: {
        filename: dbPath,
      },
      useNullAsDefault: true,
      pool: {
        min: 0,
        max: 1,
      },
    });

    this.ready = this.init(dataDir);
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] [STORAGE] ${message}`);
  }

  async init(dataDir) {
    await fs.mkdir(dataDir, { recursive: true });

    const hasEmailsTable = await this.db.schema.hasTable('emails');
    if (!hasEmailsTable) {
      await this.db.schema.createTable('emails', (table) => {
        table.increments('id').primary();
        table.string('date').notNullable();
        table.string('mailbox');
        table.string('from');
        table.text('to_recipients').notNullable();
        table.string('subject');
        table.text('text');
        table.text('html');
        table.text('raw').notNullable();
      });
      this.log('Initialized SQLite schema');
    } else {
      const hasMailboxColumn = await this.db.schema.hasColumn('emails', 'mailbox');
      if (!hasMailboxColumn) {
        await this.db.schema.alterTable('emails', (table) => {
          table.string('mailbox');
        });
        this.log('Added mailbox column to SQLite schema');
      }
    }

    await this.enforceFifoLimit();
  }

  normalizeMailbox(mailbox) {
    if (!mailbox || typeof mailbox !== 'string') {
      return null;
    }
    return mailbox.trim().toLowerCase();
  }

  serializeEmail(email, mailbox) {
    return {
      date: email.date,
      mailbox: this.normalizeMailbox(mailbox),
      from: email.from ?? null,
      to_recipients: JSON.stringify(email.to ?? []),
      subject: email.subject ?? null,
      text: email.text ?? null,
      html: email.html ?? null,
      raw: email.raw ?? '',
    };
  }

  deserializeEmail(row) {
    return {
      id: row.id,
      date: row.date,
      mailbox: row.mailbox,
      from: row.from,
      to: JSON.parse(row.to_recipients || '[]'),
      subject: row.subject,
      text: row.text,
      html: row.html,
      raw: row.raw,
    };
  }

  async enforceFifoLimit() {
    const [{ count }] = await this.db('emails').count({ count: '*' });
    const total = Number(count);
    const excess = total - MAX_EMAILS;

    if (excess > 0) {
      const oldest = await this.db('emails').select('id').orderBy('id', 'asc').limit(excess);
      const ids = oldest.map((entry) => entry.id);
      await this.db('emails').whereIn('id', ids).del();
      this.log(`FIFO limit reached. Removed ${ids.length} oldest emails`);
    }
  }

  async add(emailData) {
    await this.ready;

    const recipients = Array.isArray(emailData.to)
      ? emailData.to
      : emailData.to
        ? [emailData.to]
        : [];
    const normalizedRecipients = recipients
      .map((recipient) => this.normalizeMailbox(recipient))
      .filter(Boolean);
    const mailboxes = normalizedRecipients.length > 0 ? normalizedRecipients : [null];

    const email = {
      date: new Date().toISOString(),
      ...emailData,
      to: recipients,
    };

    const ids = [];
    for (const mailbox of mailboxes) {
      const row = this.serializeEmail(email, mailbox);
      const inserted = await this.db('emails').insert(row);
      const id = Array.isArray(inserted) ? inserted[0] : inserted;
      ids.push(id);
    }

    await this.enforceFifoLimit();

    const created = {
      id: ids[0],
      mailbox: this.normalizeMailbox(mailboxes[0]),
      ...email,
    };
    this.log(`Added email ID(s): ${ids.join(', ')} from: ${created.from} to mailbox(es): ${mailboxes.filter(Boolean).join(', ') || 'none'}`);
    return created;
  }

  async list(mailbox = null) {
    await this.ready;
    const normalizedMailbox = this.normalizeMailbox(mailbox);
    let query = this.db('emails').select('*').orderBy('id', 'asc');

    if (normalizedMailbox) {
      query = query.where({ mailbox: normalizedMailbox });
    }

    const rows = await query;
    this.log(`Listing ${rows.length} emails`);
    return rows.map((row) => this.deserializeEmail(row));
  }

  async get(id) {
    await this.ready;
    const row = await this.db('emails').where({ id: parseInt(id, 10) }).first();
    const email = row ? this.deserializeEmail(row) : null;
    if (email) {
      this.log(`Retrieved email ID: ${id}`);
    } else {
      this.log(`Email ID: ${id} not found`);
    }
    return email;
  }

  async delete(id) {
    await this.ready;
    const deleted = await this.db('emails').where({ id: parseInt(id, 10) }).del();
    if (deleted > 0) {
      this.log(`Deleted email ID: ${id}`);
      return true;
    }
    this.log(`Delete failed: Email ID: ${id} not found`);
    return false;
  }

  async clear() {
    await this.ready;
    await this.db('emails').del();
    await this.db.raw("DELETE FROM sqlite_sequence WHERE name = 'emails'");
    this.log('Storage cleared');
  }

  async close() {
    await this.db.destroy();
  }
}

export const emailStorage = new EmailStorage();
