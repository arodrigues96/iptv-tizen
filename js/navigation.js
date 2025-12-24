/**
 * Sistema de navegação por teclado/controle remoto
 * Suporta setas, OK, voltar para navegação TV-friendly
 */

class Navigation {
    constructor() {
        this.currentScreen = null;
        this.focusedElement = null;
        this.selectedIndex = 0;
        this.items = [];
        this.onSelectCallback = null;
        
        this.init();
    }

    init() {
        // Event listeners para teclado
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Suporte para eventos do Tizen
        if (typeof tizen !== 'undefined') {
            tizen.tvinputdevice.registerKeyBatch([
                'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
                'Enter', 'Return', 'Back'
            ]);
        }
    }

    handleKeyPress(event) {
        const key = event.key;
        
        // Prevenir comportamento padrão para teclas de navegação
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(key)) {
            event.preventDefault();
        }

        switch(key) {
            case 'ArrowUp':
                this.navigateUp();
                break;
            case 'ArrowDown':
                this.navigateDown();
                break;
            case 'ArrowLeft':
                this.navigateLeft();
                break;
            case 'ArrowRight':
                this.navigateRight();
                break;
            case 'Enter':
            case ' ':
                this.select();
                break;
            case 'Escape':
            case 'Backspace':
                this.goBack();
                break;
        }
    }

    setScreen(screenId) {
        this.currentScreen = screenId;
        this.selectedIndex = 0;
        this.updateItems();
    }

    updateItems() {
        const screen = document.getElementById(this.currentScreen);
        if (!screen) return;

        // Buscar itens navegáveis (grid-item, list-item)
        this.items = Array.from(screen.querySelectorAll('.grid-item, .list-item, input'));
        
        if (this.items.length > 0) {
            this.selectedIndex = Math.min(this.selectedIndex, this.items.length - 1);
            this.updateSelection();
        }
    }

    navigateUp() {
        if (this.items.length === 0) return;
        
        this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
        this.updateSelection();
    }

    navigateDown() {
        if (this.items.length === 0) return;
        
        this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
        this.updateSelection();
    }

    navigateLeft() {
        // Para grids, mover para item à esquerda
        if (this.currentScreen === 'categories-screen') {
            const grid = document.getElementById('categories-grid');
            if (grid) {
                const cols = Math.floor(grid.offsetWidth / 300); // Aproximação de colunas
                if (cols > 1) {
                    this.selectedIndex = Math.max(0, this.selectedIndex - cols);
                    this.updateSelection();
                }
            }
        }
    }

    navigateRight() {
        // Para grids, mover para item à direita
        if (this.currentScreen === 'categories-screen') {
            const grid = document.getElementById('categories-grid');
            if (grid) {
                const cols = Math.floor(grid.offsetWidth / 300);
                if (cols > 1) {
                    this.selectedIndex = Math.min(this.items.length - 1, this.selectedIndex + cols);
                    this.updateSelection();
                }
            }
        }
    }

    updateSelection() {
        // Remover seleção anterior
        this.items.forEach(item => item.classList.remove('selected'));
        
        // Adicionar seleção atual
        if (this.items[this.selectedIndex]) {
            this.items[this.selectedIndex].classList.add('selected');
            this.focusedElement = this.items[this.selectedIndex];
            
            // Scroll para item selecionado
            this.focusedElement.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    }

    select() {
        if (this.focusedElement && this.onSelectCallback) {
            this.onSelectCallback(this.focusedElement);
        } else if (this.focusedElement) {
            // Trigger click se não houver callback
            this.focusedElement.click();
        }
    }

    goBack() {
        // Disparar evento customizado para o app lidar
        window.dispatchEvent(new CustomEvent('navigation:back'));
    }

    setOnSelect(callback) {
        this.onSelectCallback = callback;
    }

    // Método para focar em input de busca
    focusSearch() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.focus();
            this.focusedElement = searchInput;
        }
    }
}

// Exportar instância global
window.navigation = new Navigation();

