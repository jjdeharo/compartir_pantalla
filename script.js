document.addEventListener('DOMContentLoaded', () => {
    // Seleccionar los nuevos elementos del DOM
    const instructionsDiv = document.getElementById('instructions');
    const qrContainer = document.getElementById('qr-container');
    const urlDisplay = document.getElementById('url-display');
    const remoteVideo = document.getElementById('remote-video');
    const statusMessage = document.getElementById('status-message'); // <-- Elemento para notificaciones

    // Misma configuración de servidores para máxima compatibilidad
    const iceServers = [
        { urls: 'stun:stun.metered.ca:80' },
        { urls: 'turn:turn.metered.ca:80?transport=udp', username: '9745e21b303bdaea589c29bc', credential: 'UgG56tBqCEGNjzLY' },
        { urls: 'turn:turn.metered.ca:443?transport=tcp', username: '9745e21b303bdaea589c29bc', credential: 'UgG56tBqCEGNjzLY' }
    ];

    // Inicializar PeerJS para el receptor
    const peer = new Peer({
        config: {
            iceServers: iceServers,
            iceTransportPolicy: 'all'
        }
    });

    // 1. Cuando el receptor se conecta al servidor de intermediación
    peer.on('open', (peerId) => {
        console.log('Receptor listo con ID:', peerId);
        statusMessage.style.display = 'none'; // Ocultar mensaje de estado al conectar

        // Construir la URL para el emisor
        const url = new URL('emisor.html', window.location.href);
        url.searchParams.set('id', peerId);
        const fullUrl = url.href;

        // Mostrar la URL en la página
        urlDisplay.textContent = fullUrl;

        // Generar el código QR
        qrContainer.innerHTML = ''; // Limpiar por si se reconecta
        new QRCode(qrContainer, {
            text: fullUrl,
            width: 256,
            height: 256,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    });

    // 2. Cuando un emisor llama
    peer.on('call', (call) => {
        console.log('Llamada entrante de:', call.peer);

        // El receptor no envía vídeo, solo responde para aceptar la conexión
        call.answer();

        // Ocultar las instrucciones y mostrar el vídeo
        instructionsDiv.style.display = 'none';
        remoteVideo.style.display = 'block';

        // 3. Cuando llega el stream de vídeo del emisor
        call.on('stream', (remoteStream) => {
            console.log('Stream de vídeo recibido.');
            remoteVideo.srcObject = remoteStream;
        });

        // 4. Cuando la llamada termina
        call.on('close', () => {
            console.log('Llamada terminada.');
            remoteVideo.srcObject = null;
            remoteVideo.style.display = 'none';
            instructionsDiv.style.display = 'flex'; // Mostrar de nuevo las instrucciones
        });

        call.on('error', (err) => {
            console.error('Error en la llamada:', err);
            statusMessage.textContent = 'Ocurrió un error durante la llamada.';
            statusMessage.style.display = 'block';
        });
    });

    peer.on('error', (err) => {
        console.error('Error en PeerJS:', err);
        statusMessage.textContent = `Error de conexión: ${err.message}. Intentando reconectar...`;
        statusMessage.style.display = 'block';
    });

    peer.on('disconnected', () => {
        console.log('Desconectado del servidor PeerJS. Intentando reconectar...');
        statusMessage.textContent = 'Conexión perdida. Intentando reconectar...';
        statusMessage.style.display = 'block';
        peer.reconnect();
    });
});
