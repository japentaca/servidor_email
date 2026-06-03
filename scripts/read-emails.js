import POP3Client from 'node-pop3';

const DEFAULT_USER = 'any';
const DEFAULT_PASSWORD = 'any';

function parseTarget(target) {
  if (!target) {
    throw new Error('Falta parametro ip:puerto. Ejemplo: 127.0.0.1:1110');
  }

  const ipv6Match = target.match(/^\[([^\]]+)\]:(\d+)$/);
  if (ipv6Match) {
    return { host: ipv6Match[1], port: Number(ipv6Match[2]) };
  }

  const match = target.match(/^([^:]+):(\d+)$/);
  if (!match) {
    throw new Error('Formato invalido. Usa ip:puerto, por ejemplo 192.168.1.20:110');
  }

  return { host: match[1], port: Number(match[2]) };
}

function normalizeList(listResult) {
  if (!Array.isArray(listResult)) {
    return [];
  }

  return listResult
    .map((entry) => {
      if (Array.isArray(entry) && entry.length >= 1) {
        return Number(entry[0]);
      }

      if (typeof entry === 'string') {
        const parts = entry.trim().split(/\s+/);
        return Number(parts[0]);
      }

      return Number.NaN;
    })
    .filter((index) => Number.isInteger(index) && index > 0);
}

async function main() {
  const target = process.argv[2];
  const { host, port } = parseTarget(target);

  const client = new POP3Client({
    host,
    port,
    user: DEFAULT_USER,
    password: DEFAULT_PASSWORD,
  });

  try {
    console.log(`Conectado a ${host}:${port}`);
    console.log(`Autenticando como ${DEFAULT_USER}`);

    const list = await client.LIST();
    const messageNumbers = normalizeList(list);

    if (messageNumbers.length === 0) {
      console.log('No hay correos en el buzon.');
      return;
    }

    console.log(`Se encontraron ${messageNumbers.length} correo(s).`);

    for (const messageNumber of messageNumbers) {
      const rawEmail = await client.RETR(messageNumber);
      console.log('='.repeat(80));
      console.log(`Correo #${messageNumber}`);
      console.log('-'.repeat(80));
      console.log(rawEmail);
      console.log();
    }
  } finally {
    await client.QUIT().catch(() => {
      // Ignore QUIT errors to avoid hiding retrieval output.
    });
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
