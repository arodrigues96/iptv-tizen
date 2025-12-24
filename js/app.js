/**
 * Aplicação principal IPTV Player
 * Integra todos os módulos e gerencia o fluxo da aplicação
 */

class IPTVApp {
    constructor() {
        this.config = null;
        this.api = null;
        this.m3uParser = null;
        this.player = null;
        this.currentScreen = 'loading-screen';
        this.categories = [];
        this.channels = [];
        this.currentCategory = null;
        this.searchQuery = '';
        
        this.init();
    }

    async init() {
        try {
            // Carregar configuração
            await this.loadConfig();
            
            // Inicializar player
            this.player = new VideoPlayer();
            this.player.init();
            
            // Inicializar parser M3U
            this.m3uParser = new M3UParser();
            
            // Configurar navegação
            this.setupNavigation();
            
            // Configurar eventos
            this.setupEvents();
            
            // Carregar dados
            await this.loadData();
            
            // Mostrar tela inicial
            this.showScreen('categories-screen');
            
        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.showError(error.message);
        }
    }

    /**
     * Carrega configuração do arquivo config.js
     */
    async loadConfig() {
        try {
            // Tentar carregar config.js
            const script = document.createElement('script');
            script.src = 'config.js';
            script.type = 'text/javascript';
            
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Timeout ao carregar config.js. Verifique se o arquivo existe e está configurado corretamente.'));
                }, 5000);
                
                script.onload = () => {
                    clearTimeout(timeout);
                    // Pequeno delay para garantir que a variável foi definida
                    setTimeout(() => {
                        if (typeof IPTV_CONFIG !== 'undefined') {
                            this.config = IPTV_CONFIG;
                            resolve();
                        } else {
                            reject(new Error('IPTV_CONFIG não encontrado em config.js. Verifique se o arquivo está configurado corretamente.'));
                        }
                    }, 100);
                };
                script.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error('Erro ao carregar config.js. Verifique se o arquivo existe.'));
                };
                document.head.appendChild(script);
            });
        } catch (error) {
            throw new Error(`Erro ao carregar configuração: ${error.message}`);
        }
    }

    /**
     * Carrega dados do serviço IPTV
     */
    async loadData() {
        try {
            if (this.config.IPTV_TYPE === 'xtream') {
                await this.loadXtreamData();
            } else if (this.config.IPTV_TYPE === 'm3u') {
                await this.loadM3UData();
            } else {
                throw new Error('Tipo de IPTV inválido. Use "xtream" ou "m3u"');
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            throw error;
        }
    }

    /**
     * Carrega dados via Xtream Codes API
     */
    async loadXtreamData() {
        if (!this.config.IPTV_URL || !this.config.IPTV_USERNAME || !this.config.IPTV_PASSWORD) {
            throw new Error('Configuração Xtream incompleta. Verifique IPTV_URL, IPTV_USERNAME e IPTV_PASSWORD');
        }

        this.api = new XtreamAPI(
            this.config.IPTV_URL,
            this.config.IPTV_USERNAME,
            this.config.IPTV_PASSWORD
        );

        // Autenticar
        await this.api.authenticate();

        // Carregar categorias
        const categoriesData = await this.api.getAllCategories();
        
        // Combinar categorias live e VOD
        this.categories = [
            ...categoriesData.live.map(cat => ({ ...cat, type: 'live' })),
            ...categoriesData.vod.map(cat => ({ ...cat, type: 'vod' }))
        ];

        this.renderCategories();
    }

    /**
     * Carrega dados via M3U
     */
    async loadM3UData() {
        if (!this.config.M3U_URL) {
            throw new Error('M3U_URL não configurado');
        }

        const data = await this.m3uParser.loadFromUrl(this.config.M3U_URL);
        this.categories = data.categories.map(cat => ({
            category_id: cat.category_id,
            category_name: cat.category_name,
            type: 'live',
            streams: cat.streams
        }));

        this.renderCategories();
    }

    /**
     * Renderiza categorias na tela
     */
    renderCategories() {
        const grid = document.getElementById('categories-grid');
        if (!grid) return;

        grid.innerHTML = '';

        this.categories.forEach(category => {
            const item = document.createElement('div');
            item.className = 'grid-item';
            item.setAttribute('role', 'listitem');
            item.setAttribute('data-category-id', category.category_id);
            item.setAttribute('data-category-type', category.type);
            item.textContent = category.category_name;
            
            item.addEventListener('click', () => {
                this.selectCategory(category);
            });

            grid.appendChild(item);
        });

        // Atualizar navegação
        navigation.setScreen('categories-screen');
        navigation.updateItems();
        navigation.setOnSelect((element) => {
            const categoryId = element.getAttribute('data-category-id');
            const categoryType = element.getAttribute('data-category-type');
            const category = this.categories.find(c => 
                c.category_id == categoryId && c.type === categoryType
            );
            if (category) {
                this.selectCategory(category);
            }
        });
    }

    /**
     * Seleciona uma categoria e carrega seus canais
     */
    async selectCategory(category) {
        try {
            this.currentCategory = category;
            this.showScreen('channels-screen');
            
            // Atualizar título
            const titleEl = document.getElementById('category-title');
            if (titleEl) {
                titleEl.textContent = category.category_name;
            }

            // Carregar canais
            await this.loadChannels(category);
            
        } catch (error) {
            console.error('Erro ao carregar categoria:', error);
            this.showError(`Erro ao carregar canais: ${error.message}`);
        }
    }

    /**
     * Carrega canais de uma categoria
     */
    async loadChannels(category) {
        try {
            let streams = [];

            if (this.config.IPTV_TYPE === 'xtream') {
                if (category.type === 'live') {
                    streams = await this.api.getLiveStreams(category.category_id);
                } else {
                    streams = await this.api.getVodStreams(category.category_id);
                }
            } else {
                // M3U - canais já estão no objeto category
                streams = category.streams || [];
            }

            this.channels = streams;
            this.renderChannels();
            
        } catch (error) {
            console.error('Erro ao carregar canais:', error);
            throw error;
        }
    }

    /**
     * Renderiza lista de canais
     */
    renderChannels() {
        const list = document.getElementById('channels-list');
        if (!list) return;

        list.innerHTML = '';

        this.channels.forEach(channel => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.setAttribute('role', 'listitem');
            item.setAttribute('data-stream-id', channel.stream_id || channel.id);
            item.setAttribute('data-stream-type', this.currentCategory?.type || 'live');

            // Logo do canal
            if (channel.stream_icon || channel.logo) {
                const logo = document.createElement('img');
                logo.className = 'channel-logo';
                logo.src = channel.stream_icon || channel.logo;
                logo.alt = channel.name;
                logo.onerror = () => { logo.style.display = 'none'; };
                item.appendChild(logo);
            }

            // Informações
            const info = document.createElement('div');
            info.className = 'channel-info';
            
            const name = document.createElement('div');
            name.className = 'channel-name';
            name.textContent = channel.name || channel.title;
            info.appendChild(name);

            if (channel.category_name || channel.group) {
                const group = document.createElement('div');
                group.className = 'channel-group';
                group.textContent = channel.category_name || channel.group;
                info.appendChild(group);
            }

            item.appendChild(info);

            // Event listener
            item.addEventListener('click', () => {
                this.playChannel(channel);
            });

            list.appendChild(item);
        });

        // Atualizar navegação
        navigation.setScreen('channels-screen');
        navigation.updateItems();
        navigation.setOnSelect((element) => {
            const streamId = element.getAttribute('data-stream-id');
            const streamType = element.getAttribute('data-stream-type');
            const channel = this.channels.find(c => 
                (c.stream_id || c.id) == streamId
            );
            if (channel) {
                this.playChannel(channel);
            }
        });
    }

    /**
     * Reproduz um canal
     */
    async playChannel(channel) {
        try {
            let streamUrl = '';

            if (this.config.IPTV_TYPE === 'xtream') {
                const streamType = this.currentCategory?.type || 'live';
                streamUrl = this.api.getStreamUrl(
                    channel.stream_id || channel.id,
                    streamType
                );
            } else {
                // M3U - URL já está no objeto
                streamUrl = channel.url;
            }

            if (!streamUrl) {
                throw new Error('URL do stream não encontrada');
            }

            this.showScreen('player-screen');
            
            const title = channel.name || channel.title || 'Canal';
            await this.player.play(streamUrl, title);
            
        } catch (error) {
            console.error('Erro ao reproduzir:', error);
            this.showError(`Erro ao reproduzir: ${error.message}`);
        }
    }

    /**
     * Mostra tela de busca
     */
    showSearch() {
        this.showScreen('search-screen');
        const input = document.getElementById('search-input');
        if (input) {
            input.value = '';
            input.focus();
            navigation.focusSearch();
        }
    }

    /**
     * Executa busca
     */
    async performSearch(query) {
        if (!query || query.length < 2) {
            return;
        }

        try {
            let results = [];

            if (this.config.IPTV_TYPE === 'xtream') {
                const searchResults = await this.api.search(query);
                results = [...searchResults.live, ...searchResults.vod];
            } else {
                results = this.m3uParser.search(query);
            }

            this.renderSearchResults(results);
            
        } catch (error) {
            console.error('Erro na busca:', error);
        }
    }

    /**
     * Renderiza resultados da busca
     */
    renderSearchResults(results) {
        const list = document.getElementById('search-results');
        if (!list) return;

        list.innerHTML = '';

        if (results.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'list-item';
            empty.textContent = 'Nenhum resultado encontrado';
            list.appendChild(empty);
            return;
        }

        results.forEach(channel => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.setAttribute('data-stream-id', channel.stream_id || channel.id);

            if (channel.stream_icon || channel.logo) {
                const logo = document.createElement('img');
                logo.className = 'channel-logo';
                logo.src = channel.stream_icon || channel.logo;
                logo.alt = channel.name;
                logo.onerror = () => { logo.style.display = 'none'; };
                item.appendChild(logo);
            }

            const info = document.createElement('div');
            info.className = 'channel-info';
            
            const name = document.createElement('div');
            name.className = 'channel-name';
            name.textContent = channel.name || channel.title;
            info.appendChild(name);

            item.appendChild(info);

            item.addEventListener('click', () => {
                this.playChannel(channel);
            });

            list.appendChild(item);
        });

        navigation.setScreen('search-screen');
        navigation.updateItems();
        navigation.setOnSelect((element) => {
            const streamId = element.getAttribute('data-stream-id');
            const channel = results.find(c => 
                (c.stream_id || c.id) == streamId
            );
            if (channel) {
                this.playChannel(channel);
            }
        });
    }

    /**
     * Mostra uma tela específica
     */
    showScreen(screenId) {
        // Esconder todas as telas
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Mostrar tela solicitada
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screenId;
            navigation.setScreen(screenId);
        }
    }

    /**
     * Mostra tela de erro
     */
    showError(message) {
        const errorMsg = document.getElementById('error-message');
        if (errorMsg) {
            errorMsg.textContent = message;
        }
        this.showScreen('error-screen');
    }

    /**
     * Configura eventos
     */
    setupEvents() {
        // Botão voltar
        document.getElementById('back-btn')?.addEventListener('click', () => {
            this.showScreen('categories-screen');
        });

        document.getElementById('search-back-btn')?.addEventListener('click', () => {
            this.showScreen('categories-screen');
        });

        document.getElementById('player-back-btn')?.addEventListener('click', () => {
            this.player.stop();
            if (this.currentCategory) {
                this.showScreen('channels-screen');
            } else {
                this.showScreen('categories-screen');
            }
        });

        // Botão de busca
        document.getElementById('search-btn')?.addEventListener('click', () => {
            this.showSearch();
        });

        // Input de busca
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                searchTimeout = setTimeout(() => {
                    this.performSearch(query);
                }, 300);
            });
        }

        // Botão retry
        document.getElementById('retry-btn')?.addEventListener('click', () => {
            this.showScreen('loading-screen');
            this.loadData().then(() => {
                this.showScreen('categories-screen');
            }).catch(err => {
                this.showError(err.message);
            });
        });

        // Navegação: voltar
        window.addEventListener('navigation:back', () => {
            if (this.currentScreen === 'player-screen') {
                this.player.stop();
                if (this.currentCategory) {
                    this.showScreen('channels-screen');
                } else {
                    this.showScreen('categories-screen');
                }
            } else if (this.currentScreen === 'channels-screen') {
                this.currentCategory = null;
                this.showScreen('categories-screen');
            } else if (this.currentScreen === 'search-screen') {
                this.showScreen('categories-screen');
            }
        });

        // Erro no player
        window.addEventListener('player:error', () => {
            this.showError('Erro ao reproduzir o stream. Tente outro canal.');
        });
    }

    /**
     * Configura navegação
     */
    setupNavigation() {
        // Navegação já está inicializada globalmente
        // Apenas configuramos callbacks quando necessário
    }
}

// Inicializar app quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new IPTVApp();
    });
} else {
    window.app = new IPTVApp();
}

