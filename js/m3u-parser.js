/**
 * Parser para playlists M3U
 * Extrai canais, categorias e metadados de arquivos M3U
 */

class M3UParser {
    constructor() {
        this.channels = [];
        this.categories = new Map();
    }

    /**
     * Carrega e parseia playlist M3U de uma URL
     */
    async loadFromUrl(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Erro ao carregar playlist: ${response.status}`);
            }
            
            const text = await response.text();
            return this.parse(text);
        } catch (error) {
            console.error('Erro ao carregar M3U:', error);
            throw error;
        }
    }

    /**
     * Parseia conteúdo M3U
     */
    parse(m3uContent) {
        this.channels = [];
        this.categories.clear();

        const lines = m3uContent.split('\n');
        let currentChannel = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Linha de informação do canal (#EXTINF)
            if (line.startsWith('#EXTINF:')) {
                currentChannel = this.parseExtInf(line);
            }
            // Linha de URL do stream
            else if (line && !line.startsWith('#') && currentChannel) {
                currentChannel.url = line;
                this.channels.push(currentChannel);
                
                // Agrupar por categoria
                const category = currentChannel.group || 'Geral';
                if (!this.categories.has(category)) {
                    this.categories.set(category, []);
                }
                this.categories.get(category).push(currentChannel);
                
                currentChannel = null;
            }
        }

        return {
            channels: this.channels,
            categories: Array.from(this.categories.keys()).map(name => ({
                category_id: name,
                category_name: name,
                streams: this.categories.get(name)
            }))
        };
    }

    /**
     * Parseia linha #EXTINF
     * Formato: #EXTINF:-1 tvg-id="..." tvg-name="..." tvg-logo="..." group-title="...",Nome do Canal
     */
    parseExtInf(line) {
        const channel = {
            stream_id: null,
            name: '',
            logo: '',
            group: 'Geral',
            url: ''
        };

        // Extrair atributos
        const attrMatch = line.match(/tvg-id="([^"]*)"/);
        if (attrMatch) {
            channel.stream_id = attrMatch[1];
        }

        const nameMatch = line.match(/tvg-name="([^"]*)"/);
        if (nameMatch) {
            channel.name = nameMatch[1];
        }

        const logoMatch = line.match(/tvg-logo="([^"]*)"/);
        if (logoMatch) {
            channel.logo = logoMatch[1];
        }

        const groupMatch = line.match(/group-title="([^"]*)"/);
        if (groupMatch) {
            channel.group = groupMatch[1];
        }

        // Extrair nome do canal (após a vírgula)
        const nameAfterComma = line.match(/,(.+)$/);
        if (nameAfterComma && !channel.name) {
            channel.name = nameAfterComma[1].trim();
        }

        // Gerar ID se não existir
        if (!channel.stream_id) {
            channel.stream_id = this.generateId(channel.name);
        }

        return channel;
    }

    /**
     * Gera ID único baseado no nome
     */
    generateId(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Obtém categorias
     */
    getCategories() {
        return Array.from(this.categories.keys()).map(name => ({
            category_id: name,
            category_name: name
        }));
    }

    /**
     * Obtém canais de uma categoria
     */
    getChannelsByCategory(categoryName) {
        return this.categories.get(categoryName) || [];
    }

    /**
     * Busca canais por nome
     */
    search(query) {
        const searchLower = query.toLowerCase();
        return this.channels.filter(channel => 
            channel.name.toLowerCase().includes(searchLower)
        );
    }

    /**
     * Obtém todos os canais
     */
    getAllChannels() {
        return this.channels;
    }
}

