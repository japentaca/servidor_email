import { emailStorage } from '../src/email-storage.js';

async function main() {
  try {
    await emailStorage.clear();
    console.log('SQLite limpiada correctamente.');
  } finally {
    await emailStorage.close();
  }
}

main().catch((error) => {
  console.error(`Error limpiando la DB: ${error.message}`);
  process.exit(1);
});
