# Compartir Pantalla con WebRTC

Este es un programa simple para compartir la pantalla (o una pestaña/ventana) del navegador utilizando la tecnología WebRTC.

## Características:
- Compartición de pantalla completa, ventana o pestaña del navegador en escritorio.
- Compartición de pantalla completa en dispositivos móviles.
- Utiliza WebRTC para conexiones peer-to-peer.
- Integración con Metered.ca para servidores STUN/TURN, mejorando la compatibilidad de conexión.

## Cómo usar:

### Para el que comparte:
1. Abre la aplicación en tu navegador.
2. Haz clic en "Iniciar Compartición".
3. El navegador te pedirá que selecciones qué quieres compartir (pantalla completa, ventana o pestaña).
4. Se generará un ID de sesión único. Comparte este ID con la persona que quieres que vea tu pantalla.

### Para el que ve:
1. Abre la aplicación en tu navegador.
2. Introduce el ID de sesión que te ha proporcionado el que comparte en el campo correspondiente.
3. Haz clic en "Unirse".

## Configuración de Metered.ca:

Para que la aplicación funcione correctamente y tenga la mejor compatibilidad, es necesario configurar tus credenciales de Metered.ca en el archivo `script.js`.

Busca la sección `iceServers` en `script.js` y reemplaza `'YOUR_USERNAME'` y `'YOUR_CREDENTIAL'` con los datos de tu cuenta de Metered.ca.

```javascript
const iceServers = [
    { urls: 'stun:stun.metered.ca:80' },
    {
        urls: 'turn:turn.metered.ca:80?transport=udp',
        username: 'YOUR_USERNAME',
        credential: 'YOUR_CREDENTIAL'
    },
    {
        urls: 'turn:turn.metered.ca:443?transport=tcp',
        username: 'YOUR_USERNAME',
        credential: 'YOUR_CREDENTIAL'
    }
];
```

## Desarrollo Futuro:

Actualmente, la lógica de señalización (para intercambiar ofertas, respuestas y candidatos ICE entre los pares) no está implementada. Esto requerirá un servidor de señalización (por ejemplo, basado en WebSockets) para coordinar las conexiones entre los usuarios. Por ahora, el ID de sesión se genera localmente y la conexión WebRTC no se establece completamente sin un servidor de señalización.
