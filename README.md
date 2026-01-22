# Servidor de Email para Testing (SMTP & POP3)

Servidor de email ligero en Node.js diseñado para testing de aplicaciones. Permite recibir correos vía SMTP y consultarlos vía POP3 o inspeccionando el almacenamiento en memoria.

## Características

- **Servidor SMTP**: Recibe correos en el puerto 2525 (configurable).
- **Servidor POP3**: Acceso a correos recibidos en el puerto 1110 (configurable).
- **Almacenamiento FIFO**: Mantiene los últimos 100 mensajes en memoria.
- **Sin dependencias de DB**: Todo se guarda en memoria para máxima velocidad en tests.
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

---
Proyecto creado para el curso de Arquitectura de Grandes Clientes (AGC) - LITAT.
