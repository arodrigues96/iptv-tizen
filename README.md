# IPTV Tizen Player

Player IPTV para Samsung Tizen que roda no navegador e pode ser publicado via GitHub Pages.

## Características

- Suporte para Xtream Codes API e playlists M3U
- Interface otimizada para TV com navegação por controle remoto
- Categorias de canais
- Busca de canais
- Player de vídeo com suporte HLS

## Configuração

1. Copie o arquivo `config.example.js` para `config.js`:
   ```bash
   cp config.example.js config.js
   ```

2. Edite `config.js` e preencha com suas credenciais:
   ```javascript
   const IPTV_CONFIG = {
       IPTV_TYPE: 'xtream', // ou 'm3u'
       IPTV_URL: 'https://seu-servidor.com:porta',
       IPTV_USERNAME: 'seu_usuario',
       IPTV_PASSWORD: 'sua_senha',
       M3U_URL: 'https://seu-servidor.com/playlist.m3u' // se usar M3U
   };
   ```

## Navegação

- **Setas ↑↓**: Navegar na lista de itens
- **Setas ←→**: Navegar entre seções (quando aplicável)
- **OK/Enter**: Selecionar item ou reproduzir canal
- **Voltar/ESC**: Voltar para tela anterior
- **Buscar**: Use o botão de busca no menu principal

## Publicação no GitHub Pages

1. Faça commit de todos os arquivos (exceto `config.js`)
2. No repositório GitHub, vá em Settings > Pages
3. Selecione a branch e pasta (geralmente `/root` ou `/docs`)
4. O app estará disponível em `https://seu-usuario.github.io/iptv-tizen/`

**Nota**: Como `config.js` está no `.gitignore`, você precisará configurá-lo diretamente no GitHub Pages ou usar variáveis de ambiente de outra forma.

## Estrutura

```
iptv-tizen/
├── index.html          # Página principal
├── css/
│   └── style.css       # Estilos TV-friendly
├── js/
│   ├── app.js          # Lógica principal
│   ├── navigation.js   # Sistema de navegação
│   ├── xtream-api.js   # Cliente Xtream Codes
│   ├── m3u-parser.js   # Parser M3U
│   └── player.js       # Gerenciador de vídeo
├── config.example.js   # Exemplo de configuração
├── config.js          # Suas credenciais (não commitado)
├── .gitignore
└── README.md
```

## Tecnologias

- HTML5/CSS3/JavaScript vanilla
- HLS.js para streams HLS
- Fetch API para requisições HTTP

