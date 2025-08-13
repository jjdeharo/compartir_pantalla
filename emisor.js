document.addEventListener('DOMContentLoaded', () => {
    const statusHeading = document.getElementById('status-heading');
    const statusText = document.getElementById('status-text');
    const localVideo = document.getElementById('local-video');
    const spinner = document.getElementById('spinner');
    const startSharingBtn = document.getElementById('start-sharing-btn'); // Nuevo botón

    // Misma configuración de servidores que en el script original para asegurar la conexión
    const iceServers = [
        { urls: 'stun:stun.metered.ca:80' },
        { urls: 'turn:turn.metered.ca:80?transport=udp', username: '9745e21b303bdaea589c29bc', credential: 'UgG56tBqCEGNjzLY' },
        { urls: 'turn:turn.metered.ca:443?transport=tcp', username: '9745e21b303bdaea589c29bc', credential: 'UgG56tBqCEGNjzLY' }
    ];

    // --- Verificación de origen seguro --- (Recomendación 1)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        statusHeading.textContent = 'Origen no seguro';
        statusText.textContent =
            'Abre esta página en HTTPS (o localhost) para poder compartir pantalla.';
        spinner.style.display = 'none';
        startSharingBtn.style.display = 'none';
        return;
    }

    // --- Verificación de soporte de getDisplayMedia --- (Recomendación 2)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        statusHeading.textContent = 'No compatible';
        statusText.textContent = 'Este navegador no permite compartir pantalla.';
        spinner.style.display = 'none';
        startSharingBtn.style.display = 'none';
        return;
    }

    // Obtener el ID del receptor de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const receiverId = urlParams.get('id');

    if (!receiverId) {
        statusHeading.textContent = 'Error';
        statusText.textContent = 'No se ha proporcionado un ID de receptor en la URL.';
        spinner.style.display = 'none';
        startSharingBtn.style.display = 'none';
        return;
    }

    // Inicializar PeerJS
    const peer = new Peer({
        config: {
            iceServers: iceServers,
            iceTransportPolicy: 'all'
        }
    });

    peer.on('open', async (id) => {
        console.log('Conectado al servidor PeerJS con ID:', id);
        // Ahora esperamos el clic del usuario para iniciar la compartición
        startSharingBtn.style.display = 'block'; // Mostrar el botón
        statusHeading.textContent = 'Listo para Compartir';
        statusText.textContent = 'Haz clic en el botón para iniciar la compartición de tu pantalla.';
    });

    // Función para iniciar la compartición de pantalla
    startSharingBtn.addEventListener('click', async () => {
        startSharingBtn.style.display = 'none'; // Ocultar el botón
        spinner.style.display = 'block'; // Mostrar spinner
        statusHeading.textContent = 'Conectando...';
        statusText.textContent = 'Por favor, concede permiso para compartir pantalla.';

        try {
            const isAndroid = /Android/i.test(navigator.userAgent);
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { preferCurrentTab: true },
                audio: isAndroid ? false : { echoCancellation: true } // Recomendación 3
            });
            localVideo.srcObject = stream;

            statusHeading.textContent = 'Conectando...';
            statusText.textContent = 'Estableciendo conexión con el proyector.';

            const call = peer.call(receiverId, stream);

            call.on('stream', () => { // Esto es más para confirmación, el stream importante es el remoto
                statusHeading.textContent = '¡Conectado y Transmitiendo!';
                statusText.textContent = 'Puedes volver a esta ventana para detener la transmisión.';
                spinner.style.display = 'none';
            });

            call.on('close', () => {
                statusHeading.textContent = 'Desconectado';
                statusText.textContent = 'La transmisión ha finalizado.';
                stream.getTracks().forEach(track => track.stop());
                startSharingBtn.style.display = 'block'; // Mostrar botón de nuevo
            });

            call.on('error', (err) => {
                console.error('Error en la llamada:', err);
                statusHeading.textContent = 'Error de Conexión';
                statusText.textContent = `No se pudo conectar. Asegúrate de que el código QR es correcto. Error: ${err.message}`;
                spinner.style.display = 'none';
                startSharingBtn.style.display = 'block'; // Mostrar botón de nuevo
            });

        } catch (error) {
            console.error('Error al obtener la pantalla:', error);
            let errorMessage = 'No se puede transmitir sin el permiso para compartir pantalla.';
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Permiso denegado por el usuario. Por favor, acepta el diálogo de compartición de pantalla.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No se encontró ninguna pantalla o ventana para compartir.';
            } else if (error.name === 'AbortError') {
                errorMessage = 'La compartición de pantalla fue cancelada.';
            } else {
                errorMessage += ` (${error.name}: ${error.message})`;
            }
            statusHeading.textContent = 'Permiso Denegado';
            statusText.textContent = errorMessage;
            spinner.style.display = 'none';
            startSharingBtn.style.display = 'block'; // Mostrar botón de nuevo
        }
    });

    peer.on('error', (err) => {
        console.error('Error en PeerJS:', err);
        statusHeading.textContent = 'Error de PeerJS';
        statusText.textContent = 'No se pudo conectar al servicio de intermediación.';
        spinner.style.display = 'none';
        startSharingBtn.style.display = 'block'; // Mostrar botón de nuevo
    });
});
