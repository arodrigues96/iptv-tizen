/**
 * Cliente para Xtream Codes API
 * Gerencia autenticação e requisições à API
 */

class XtreamAPI {
    constructor(url, username, password) {
        // Converter HTTP para HTTPS se a página estiver em HTTPS (evitar mixed content)
        let processedUrl = url.replace(/\/$/, ''); // Remove trailing slash
        if (window.location.protocol === 'https:' && processedUrl.startsWith('http://')) {
            processedUrl = processedUrl.replace('http://', 'https://');
        }
        this.baseUrl = processedUrl;
        this.username = username;
        this.password = password;
        this.serverInfo = null;
    }

    /**
     * Autentica e obtém informações do servidor
     */
    async authenticate() {
        try {
            const url = `${this.baseUrl}/player_api.php?username=${this.username}&password=${this.password}`;
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/e2db86f0-3e51-4fba-8d95-27a01cf275ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'xtream-api.js:authenticate:beforeFetch',message:'Antes de fazer fetch',data:{url:url,baseUrl:this.baseUrl,protocol:url.startsWith('https')?'https':url.startsWith('http')?'http':'unknown',currentPageProtocol:window.location.protocol,urlAfterFix:url},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            const response = await fetch(url, {
                mode: 'cors',
                credentials: 'omit'
            });
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/e2db86f0-3e51-4fba-8d95-27a01cf275ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'xtream-api.js:authenticate:afterFetch',message:'Após fetch',data:{status:response.status,statusText:response.statusText,ok:response.ok,headers:Object.fromEntries(response.headers.entries())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            
            if (!response.ok) {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/e2db86f0-3e51-4fba-8d95-27a01cf275ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'xtream-api.js:authenticate:notOk',message:'Response não OK',data:{status:response.status,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                // #endregion
                throw new Error(`Erro de autenticação: ${response.status}`);
            }
            
            this.serverInfo = await response.json();
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/e2db86f0-3e51-4fba-8d95-27a01cf275ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'xtream-api.js:authenticate:success',message:'Autenticação bem-sucedida',data:{hasServerInfo:!!this.serverInfo},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            return this.serverInfo;
        } catch (error) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/e2db86f0-3e51-4fba-8d95-27a01cf275ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'xtream-api.js:authenticate:catch',message:'Erro na autenticação',data:{errorName:error.name,errorMessage:error.message,errorStack:error.stack,isNetworkError:error.message.includes('fetch')||error.message.includes('network')||error.message.includes('Failed to fetch'),isCorsError:error.message.includes('CORS')||error.message.includes('cors')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            console.error('Erro na autenticação:', error);
            throw error;
        }
    }

    /**
     * Obtém categorias de canais ao vivo
     */
    async getLiveCategories() {
        try {
            const url = `${this.baseUrl}/player_api.php?username=${this.username}&password=${this.password}&action=get_live_categories`;
            const response = await fetch(url, {
                mode: 'cors',
                credentials: 'omit'
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao buscar categorias: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar categorias:', error);
            throw error;
        }
    }

    /**
     * Obtém lista de canais ao vivo
     */
    async getLiveStreams(categoryId = null) {
        try {
            let url = `${this.baseUrl}/player_api.php?username=${this.username}&password=${this.password}&action=get_live_streams`;
            if (categoryId) {
                url += `&category_id=${categoryId}`;
            }
            
            const response = await fetch(url, {
                mode: 'cors',
                credentials: 'omit'
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao buscar canais: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar canais:', error);
            throw error;
        }
    }

    /**
     * Obtém categorias VOD (Filmes)
     */
    async getVodCategories() {
        try {
            const url = `${this.baseUrl}/player_api.php?username=${this.username}&password=${this.password}&action=get_vod_categories`;
            const response = await fetch(url, {
                mode: 'cors',
                credentials: 'omit'
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao buscar categorias VOD: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar categorias VOD:', error);
            throw error;
        }
    }

    /**
     * Obtém lista de filmes/séries
     */
    async getVodStreams(categoryId = null) {
        try {
            let url = `${this.baseUrl}/player_api.php?username=${this.username}&password=${this.password}&action=get_vod_streams`;
            if (categoryId) {
                url += `&category_id=${categoryId}`;
            }
            
            const response = await fetch(url, {
                mode: 'cors',
                credentials: 'omit'
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao buscar VOD: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar VOD:', error);
            throw error;
        }
    }

    /**
     * Obtém URL do stream para reprodução
     */
    getStreamUrl(streamId, streamType = 'live') {
        if (streamType === 'live') {
            return `${this.baseUrl}/live/${this.username}/${this.password}/${streamId}.m3u8`;
        } else {
            return `${this.baseUrl}/movie/${this.username}/${this.password}/${streamId}.mkv`;
        }
    }

    /**
     * Busca canais/VOD por nome
     */
    async search(query) {
        try {
            const [liveStreams, vodStreams] = await Promise.all([
                this.getLiveStreams(),
                this.getVodStreams()
            ]);

            const searchLower = query.toLowerCase();
            
            const liveResults = liveStreams.filter(stream => 
                stream.name.toLowerCase().includes(searchLower)
            );
            
            const vodResults = vodStreams.filter(stream => 
                stream.name.toLowerCase().includes(searchLower)
            );

            return {
                live: liveResults,
                vod: vodResults
            };
        } catch (error) {
            console.error('Erro na busca:', error);
            throw error;
        }
    }

    /**
     * Obtém todas as categorias (live + VOD)
     */
    async getAllCategories() {
        try {
            const [liveCategories, vodCategories] = await Promise.all([
                this.getLiveCategories(),
                this.getVodCategories()
            ]);

            return {
                live: liveCategories,
                vod: vodCategories
            };
        } catch (error) {
            console.error('Erro ao buscar todas as categorias:', error);
            throw error;
        }
    }
}

