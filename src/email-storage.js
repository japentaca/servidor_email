const MAX_EMAILS = 100;

class EmailStorage {
  constructor() {
    this.emails = [];
    this.nextId = 1;
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] [STORAGE] ${message}`);
  }

  add(emailData) {
    const email = {
      id: this.nextId++,
      date: new Date().toISOString(),
      ...emailData,
    };

    if (this.emails.length >= MAX_EMAILS) {
      const removed = this.emails.shift();
      this.log(`FIFO limit reached. Removed oldest email ID: ${removed.id}`);
    }

    this.emails.push(email);
    this.log(`Added email ID: ${email.id} from: ${email.from}`);
    return email;
  }

  list() {
    this.log(`Listing ${this.emails.length} emails`);
    return [...this.emails];
  }

  get(id) {
    const email = this.emails.find((e) => e.id === parseInt(id));
    if (email) {
      this.log(`Retrieved email ID: ${id}`);
    } else {
      this.log(`Email ID: ${id} not found`);
    }
    return email;
  }

  delete(id) {
    const index = this.emails.findIndex((e) => e.id === parseInt(id));
    if (index !== -1) {
      this.emails.splice(index, 1);
      this.log(`Deleted email ID: ${id}`);
      return true;
    }
    this.log(`Delete failed: Email ID: ${id} not found`);
    return false;
  }

  clear() {
    this.emails = [];
    this.nextId = 1;
    this.log('Storage cleared');
  }
}

export const emailStorage = new EmailStorage();
