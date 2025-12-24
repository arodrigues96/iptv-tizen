/**
 * Gerenciador de player de vídeo
 * Suporta HLS.js para streams HLS e fallback para player nativo
 */

class VideoPlayer {
    constructor() {
        this.video = document.getElementById('video-player');
        this.hls = null;
        this.currentStream = null;
    }

    /**
     * Inicializa o player
     */
    init() {
        if (!this.video) {
            console.error('Elemento de vídeo não encontrado');
            return;
        }

        // Event listeners
        this.video.addEventListener('loadedmetadata', () => {
            console.log('Vídeo carregado');
        });

        this.video.addEventListener('error', (e) => {
            console.error('Erro no player:', e);
            this.handleError();
        });

        // Suporte para fullscreen
        this.video.addEventListener('dblclick', () => {
            this.toggleFullscreen();
        });
    }

    /**
     * Reproduz um stream
     */
    async play(streamUrl, title = '') {
        try {
            this.currentStream = streamUrl;
            
            // Atualizar título
            const titleEl = document.getElementById('player-title');
            if (titleEl) {
                titleEl.textContent = title;
            }

            // Limpar player anterior
            this.stop();

            // Verificar se é HLS
            if (streamUrl.includes('.m3u8') || streamUrl.includes('m3u8')) {
                await this.playHLS(streamUrl);
            } else {
                await this.playNative(streamUrl);
            }

            // Tentar entrar em fullscreen
            this.requestFullscreen();

        } catch (error) {
            console.error('Erro ao reproduzir:', error);
            this.handleError();
        }
    }

    /**
     * Reproduz stream HLS usando HLS.js
     */
    async playHLS(url) {
        if (Hls.isSupported()) {
            // Usar HLS.js
            this.hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90
            });

            this.hls.loadSource(url);
            this.hls.attachMedia(this.video);

            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                this.video.play().catch(err => {
                    console.error('Erro ao iniciar reprodução:', err);
                });
            });

            this.hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('Erro HLS:', data);
                if (data.fatal) {
                    switch(data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log('Tentando recuperar...');
                            this.hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log('Tentando recuperar erro de mídia...');
                            this.hls.recoverMediaError();
                            break;
                        default:
                            this.hls.destroy();
                            this.handleError();
                            break;
                    }
                }
            });
        } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
            // Fallback para suporte nativo do Safari
            this.video.src = url;
            await this.video.play();
        } else {
            throw new Error('HLS não suportado neste navegador');
        }
    }

    /**
     * Reproduz stream usando player nativo
     */
    async playNative(url) {
        this.video.src = url;
        await this.video.play();
    }

    /**
     * Para a reprodução
     */
    stop() {
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
        
        this.video.pause();
        this.video.src = '';
        this.currentStream = null;
    }

    /**
     * Pausa/Resume
     */
    togglePause() {
        if (this.video.paused) {
            this.video.play();
        } else {
            this.video.pause();
        }
    }

    /**
     * Solicita tela cheia
     */
    requestFullscreen() {
        if (this.video.requestFullscreen) {
            this.video.requestFullscreen().catch(err => {
                console.log('Fullscreen não disponível:', err);
            });
        } else if (this.video.webkitRequestFullscreen) {
            this.video.webkitRequestFullscreen();
        } else if (this.video.mozRequestFullScreen) {
            this.video.mozRequestFullScreen();
        }
    }

    /**
     * Alterna tela cheia
     */
    toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            this.requestFullscreen();
        }
    }

    /**
     * Trata erros
     */
    handleError() {
        // Disparar evento para o app lidar
        window.dispatchEvent(new CustomEvent('player:error', {
            detail: { stream: this.currentStream }
        }));
    }

    /**
     * Obtém elemento de vídeo
     */
    getVideoElement() {
        return this.video;
    }
}

