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
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/e2db86f0-3e51-4fba-8d95-27a01cf275ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'player.js:play:entry',message:'Iniciando reprodução',data:{streamUrl:streamUrl,title:title,isHLS:streamUrl.includes('.m3u8')||streamUrl.includes('m3u8')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'stream-error'})}).catch(()=>{});
            // #endregion
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
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/e2db86f0-3e51-4fba-8d95-27a01cf275ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'player.js:play:beforeHLS',message:'Antes de playHLS',data:{streamUrl:streamUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'stream-error'})}).catch(()=>{});
                // #endregion
                await this.playHLS(streamUrl);
            } else {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/e2db86f0-3e51-4fba-8d95-27a01cf275ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'player.js:play:beforeNative',message:'Antes de playNative',data:{streamUrl:streamUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'stream-error'})}).catch(()=>{});
                // #endregion
                await this.playNative(streamUrl);
            }

            // Tentar entrar em fullscreen
            this.requestFullscreen();

        } catch (error) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/e2db86f0-3e51-4fba-8d95-27a01cf275ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'player.js:play:catch',message:'Erro ao reproduzir',data:{errorName:error.name,errorMessage:error.message,errorStack:error.stack,streamUrl:streamUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'stream-error'})}).catch(()=>{});
            // #endregion
            console.error('Erro ao reproduzir:', error);
            this.handleError();
        }
    }

    /**
     * Reproduz stream HLS usando HLS.js
     */
    async playHLS(url) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e2db86f0-3e51-4fba-8d95-27a01cf275ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'player.js:playHLS:entry',message:'Iniciando playHLS',data:{url:url,hlsSupported:Hls.isSupported(),nativeSupported:this.video.canPlayType('application/vnd.apple.mpegurl')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'stream-error'})}).catch(()=>{});
        // #endregion
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
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/e2db86f0-3e51-4fba-8d95-27a01cf275ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'player.js:playHLS:manifestParsed',message:'Manifest parsed',data:{url:url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'stream-error'})}).catch(()=>{});
                // #endregion
                this.video.play().catch(err => {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/e2db86f0-3e51-4fba-8d95-27a01cf275ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'player.js:playHLS:playError',message:'Erro ao iniciar play',data:{errorName:err.name,errorMessage:err.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'stream-error'})}).catch(()=>{});
                    // #endregion
                    console.error('Erro ao iniciar reprodução:', err);
                });
            });

            this.hls.on(Hls.Events.ERROR, (event, data) => {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/e2db86f0-3e51-4fba-8d95-27a01cf275ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'player.js:playHLS:hlsError',message:'Erro HLS',data:{fatal:data.fatal,type:data.type,details:data.details,url:url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'stream-error'})}).catch(()=>{});
                // #endregion
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
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/e2db86f0-3e51-4fba-8d95-27a01cf275ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'player.js:playHLS:nativeFallback',message:'Usando fallback nativo',data:{url:url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'stream-error'})}).catch(()=>{});
            // #endregion
            this.video.src = url;
            await this.video.play();
        } else {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/e2db86f0-3e51-4fba-8d95-27a01cf275ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'player.js:playHLS:notSupported',message:'HLS não suportado',data:{url:url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'stream-error'})}).catch(()=>{});
            // #endregion
            throw new Error('HLS não suportado neste navegador');
        }
    }

    /**
     * Reproduz stream usando player nativo
     */
    async playNative(url) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e2db86f0-3e51-4fba-8d95-27a01cf275ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'player.js:playNative:entry',message:'Iniciando playNative',data:{url:url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'stream-error'})}).catch(()=>{});
        // #endregion
        this.video.src = url;
        try {
            await this.video.play();
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/e2db86f0-3e51-4fba-8d95-27a01cf275ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'player.js:playNative:success',message:'Play iniciado com sucesso',data:{url:url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'stream-error'})}).catch(()=>{});
            // #endregion
        } catch (err) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/e2db86f0-3e51-4fba-8d95-27a01cf275ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'player.js:playNative:error',message:'Erro ao iniciar play nativo',data:{errorName:err.name,errorMessage:err.message,url:url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'stream-error'})}).catch(()=>{});
            // #endregion
            throw err;
        }
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

