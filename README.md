# Servidor de Email para Testing (SMTP & POP3)

Servidor de email ligero en Node.js diseñado para testing de aplicaciones. Permite recibir correos vía SMTP y consultarlos vía POP3 usando persistencia en SQLite.

## Características

- **Servidor SMTP**: Recibe correos en el puerto 2525 (configurable).
- **Servidor POP3**: Acceso a correos recibidos en el puerto 1110 (configurable).
- **Persistencia SQLite + Knex**: Guarda correos en `data/emails.sqlite3`.
- **Almacenamiento FIFO**: Mantiene los últimos 100 mensajes persistidos.
- **Logging detallado**: Seguimiento de cada comando y evento en la consola.

## Requisitos

- Node.js v20.x o superior

## Instalación

```bash
npm install
```

## Configuración

Crea un archivo `.env` (basado en `.env.example`) para cambiar los puertos por defecto:

```env
SMTP_PORT=2525
POP3_PORT=1110
```

La base de datos SQLite se crea automáticamente en `data/emails.sqlite3`.

## Ejecución

```bash
npm start
```

## Tests

El proyecto incluye una suite de tests completos usando el test runner nativo de Node.js.

```bash
npm test
```

## Uso

### Conexión SMTP (Ejemplo con Nodemailer)

```javascript
const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 2525,
  secure: false, // TLS opcional
  auth: { user: 'any', pass: 'any' }
});
```

### Conexión POP3

Cualquier cliente POP3 puede conectarse a `localhost:1110`. Acepta cualquier usuario y contraseña.

### Script para leer todos los correos

Puedes listar y mostrar el contenido completo de todos los correos de un servidor POP3 con:

```bash
npm run read:emails -- 127.0.0.1:1110
```

Tambien soporta IPv6 entre corchetes:

```bash
npm run read:emails -- [::1]:1110
```

---

Este proyecto es de licencia MIT y fue creado por **Javier Ntaca**, director del LITAT.

