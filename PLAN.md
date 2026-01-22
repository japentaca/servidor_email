# Plan: Servidor SMTP y POP3 Simple para Testing

Crear un servidor de email completo en Node.js con SMTP (usando `smtp-server`), POP3 custom (sockets nativos), almacenamiento en memoria FIFO (100 mensajes), configuración .env con fallbacks, logging detallado con timestamps en consola, y suite de tests automáticos.

## Objetivo

Desarrollar un servidor de email ligero para testing de aplicaciones que necesiten enviar y recibir correos, sin depender de servicios externos.

## Tecnologías

- Node.js con ESM modules
- Vanilla JavaScript
- `smtp-server` y `mailparser` para SMTP
- Sockets nativos (`net`) para POP3 custom
- `dotenv` para configuración
- Node.js native test runner para tests
- `nodemailer` y `node-pop3` para tests (devDependencies)

## Steps

### 1. Inicializar proyecto

Crear `package.json` con:
- `"type": "module"` para ESM
- Scripts: `"start"`, `"test"`, `"test:watch"`
- Dependencies: `smtp-server`, `mailparser`, `dotenv`
- DevDependencies: `nodemailer`, `node-pop3`

### 2. Configurar entorno

- Crear `.env.example` con `SMTP_PORT=2525` y `POP3_PORT=1110`
- Crear `.gitignore` excluyendo `.env` y `node_modules`

### 3. Implementar almacenamiento

Crear `src/email-storage.js`:
- Objeto singleton con array de emails
- Formato: `{id, from, to, subject, text, html, raw, date}`
- Límite FIFO de 100 mensajes (borrar más antiguos)
- Métodos: `add()`, `list()`, `get(id)`, `delete(id)`, `clear()`
- Contador auto-incremental para IDs
- Logging de operaciones con timestamps

### 4. Implementar servidor SMTP

Crear `src/smtp-server.js`:
- Usar `SMTPServer` de `smtp-server`
- Puerto con fallback: `process.env.SMTP_PORT || 2525`
- Autenticación abierta (aceptar cualquier credencial)
- Parsear emails con `simpleParser` de `mailparser`
- Generar objeto con formato definido y guardar en storage
- Logging detallado: conexiones, emails recibidos, errores
- Formato log: `[timestamp] [SMTP] mensaje`

### 5. Implementar servidor POP3

Crear `src/pop3-server.js`:
- Usar módulo `net` de Node.js
- Puerto con fallback: `process.env.POP3_PORT || 1110`
- Máquina de estados: AUTHORIZATION → TRANSACTION → UPDATE
- Comandos: USER, PASS (aceptar cualquiera), STAT, LIST, RETR, DELE, QUIT, NOOP, RSET
- Marcar emails para borrado con DELE, aplicar en QUIT
- Logging detallado de comandos y respuestas
- Formato log: `[timestamp] [POP3] mensaje`

### 6. Crear punto de entrada

Crear `index.js`:
- Importar `dotenv/config` primero
- Iniciar servidor SMTP
- Iniciar servidor POP3
- Mostrar banner con puertos activos y estado

### 7. Tests de almacenamiento

Crear `test/email-storage.test.js`:
- Importar `dotenv/config`
- Usar `node:test` y `node:assert`
- Validar todas las operaciones: add, get, list, delete, clear
- Validar límite FIFO de 100 mensajes
- Validar generación de IDs únicos

### 8. Tests de SMTP

Crear `test/smtp-server.test.js`:
- Importar `dotenv/config`
- Usar `nodemailer` para enviar emails de prueba
- Conectar a `process.env.SMTP_PORT || 2525`
- Verificar recepción y parseo correcto en storage
- Validar campos: from, to, subject, text, html

### 9. Tests de POP3

Crear `test/pop3-server.test.js`:
- Importar `dotenv/config`
- Usar cliente `node-pop3`
- Conectar a `process.env.POP3_PORT || 1110`
- Validar autenticación (cualquier credencial)
- Validar comandos: STAT, LIST, RETR, DELE
- Validar flujo completo de lectura y borrado

### 10. Documentar proyecto

Crear `README.md`:
- Descripción del proyecto
- Requisitos (versión Node.js)
- Instalación: `npm install`
- Configuración: .env opcional con fallbacks
- Ejecución: `npm start`
- Tests: `npm test`
- Ejemplos de conexión SMTP/POP3 desde aplicaciones

## Consideraciones técnicas

### Formato de emails almacenados
```javascript
{
  id: 1,                    // Auto-incremental
  from: 'sender@example.com',
  to: ['recipient@example.com'],
  subject: 'Test email',
  text: 'Plain text content',
  html: '<p>HTML content</p>',
  raw: 'Raw email content...',
  date: '2026-01-22T10:30:00.000Z'
}
```

### Logging format
```
[2026-01-22T10:30:15.123Z] [SMTP] Server listening on port 2525
[2026-01-22T10:30:20.456Z] [SMTP] Email received from sender@example.com
[2026-01-22T10:30:25.789Z] [POP3] Client connected
[2026-01-22T10:30:26.012Z] [POP3] Command: USER testuser
```

### Puertos por defecto
- SMTP: 2525 (fallback si .env no define SMTP_PORT)
- POP3: 1110 (fallback si .env no define POP3_PORT)

### Tests
- Tests leen configuración del mismo .env que la aplicación
- Usar `import 'dotenv/config'` al inicio de cada archivo de test
- Ejecutar con: `node --test` o `npm test`

## Comandos de ejecución

```bash
# Instalación
npm install

# Desarrollo
npm start

# Tests
npm test

# Tests en modo watch
npm run test:watch
```
