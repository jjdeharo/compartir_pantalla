// Seleccionar elementos del DOM
const startShareBtn = document.getElementById('start-share-btn');
const sessionIdDisplay = document.getElementById('session-id-display');
const sessionIdInput = document.getElementById('session-id-input');
const joinSessionBtn = document.getElementById('join-session-btn');
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const sessionInfoDiv = document.getElementById('session-info');

// Configuración de los servidores ICE (STUN/TURN) de Metered.ca
// **IMPORTANTE**: Reemplaza estos valores con los de tu cuenta de Metered.ca
// Puedes encontrarlos en tu panel de control de Metered.ca, sección 'ICE Servers'.
const iceServers = [
    // Servidores STUN (para descubrir la IP pública y el puerto)
    { urls: 'stun:stun.metered.ca:80' },
    // Servidores TURN (para retransmitir el tráfico si la conexión directa falla)
    // Asegúrate de reemplazar 'YOUR_USERNAME' y 'YOUR_CREDENTIAL' con tus datos reales.
    { urls: 'turn:turn.metered.ca:80?transport=udp', username: '9745e21b303bdaea589c29bc', credential: 'UgG56tBqCEGNjzLY' },
    { urls: 'turn:turn.metered.ca:443?transport=tcp', username: '9745e21b303bdaea589c29bc', credential: 'UgG56tBqCEGNjzLY' }
    // Puedes añadir más servidores TURN si Metered.ca te los proporciona
];

// Variables globales para PeerJS y streams
let peer;
let localStream;
let mediaConnection;

// Función para inicializar PeerJS
function initializePeer(id = null) {
    const peerConfig = {
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        secure: true,
        debug: 2,
        config: {
            iceServers: iceServers,
            iceTransportPolicy: 'all'
        }
    };

    peer = new Peer(id, peerConfig);

    peer.on('open', (peerId) => {
        console.log('Mi ID de PeerJS es:', peerId);
        sessionIdDisplay.textContent = peerId;
        sessionInfoDiv.style.display = 'block';
    });

    peer.on('error', (err) => {
        console.error('Error en PeerJS:', err);
        alert('Error en la conexión PeerJS. Asegúrate de que el servidor PeerJS esté accesible y tus credenciales de Metered.ca sean correctas.');
    });
}

// --- Lógica del que comparte la pantalla ---
startShareBtn.addEventListener('click', async () => {
    try {
        // Capturar la pantalla (o pestaña/ventana en escritorio, pantalla completa en móvil)
        localStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true // Opcional: incluir audio del sistema
        });
        localVideo.srcObject = localStream;

        // Inicializar PeerJS sin un ID específico para que genere uno nuevo
        initializePeer();

        // Manejar llamadas entrantes (cuando alguien quiere ver mi pantalla)
        peer.on('call', (call) => {
            console.log('Recibiendo llamada de:', call.peer);
            // Responder a la llamada con nuestro stream local
            call.answer(localStream);

            // Cuando el stream remoto llega, mostrarlo
            call.on('stream', (remoteStream) => {
                console.log('Stream remoto recibido del que ve.');
                remoteVideo.srcObject = remoteStream;
            });

            call.on('close', () => {
                console.log('Llamada cerrada.');
                remoteVideo.srcObject = null;
            });

            mediaConnection = call; // Guardar la conexión para futuras referencias
        });

    } catch (error) {
        console.error('Error al iniciar la compartición de pantalla:', error);
        alert('No se pudo iniciar la compartición de pantalla. Asegúrate de haber dado permisos.');
    }
});

// --- Lógica del que se une a la sesión ---
joinSessionBtn.addEventListener('click', async () => {
    const sharerId = sessionIdInput.value.trim();
    if (!sharerId) {
        alert('Por favor, introduce un ID de sesión.');
        return;
    }

    try {
        // Opcional: Capturar stream local si el que se une también quiere enviar video/audio
        // Para compartir pantalla, el que se une no necesita enviar su propia pantalla.
        // Pero si fuera una videollamada, aquí se obtendría la cámara/micrófono.
        // localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        // localVideo.srcObject = localStream;

        // Inicializar PeerJS con un ID nulo para que genere uno nuevo para el que se une
        initializePeer();

        peer.on('open', () => {
            // Llamar al que comparte la pantalla
            const call = peer.call(sharerId, localStream); // localStream puede ser null si no se envía nada

            call.on('stream', (remoteStream) => {
                console.log('Stream remoto recibido del que comparte.');
                remoteVideo.srcObject = remoteStream;
            });

            call.on('close', () => {
                console.log('Llamada cerrada.');
                remoteVideo.srcObject = null;
            });

            call.on('error', (err) => {
                console.error('Error en la llamada:', err);
                alert('Error al intentar conectar con el ID de sesión. Asegúrate de que el ID sea correcto y el que comparte esté activo.');
            });

            mediaConnection = call; // Guardar la conexión para futuras referencias
        });

    } catch (error) {
        console.error('Error al unirse a la sesión:', error);
        alert('No se pudo unir a la sesión. Asegúrate de que el ID sea correcto y el que comparte esté activo.');
    }
});