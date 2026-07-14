/**
 * ==========================================================================
 * AURA STRUCTURAL ENGINE INITIALIZER (main.js)
 * High-Performance Theme & View Orchestrator
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    AuraApp.init();
});

const AuraApp = {
    state: {
        allPosts: [],
        filteredPosts: [],
        theme: 'light'
    },

    async init() {
        this.initThemeEngine();
        this.initVisualInteractions();
        
        if (typeof AuraBlogEngine !== 'undefined') {
            await AuraBlogEngine.init(this);
        }
    },

    initThemeEngine() {
        const cachedTheme = localStorage.getItem('aura-theme') || 'light';
        this.setTheme(cachedTheme);

        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const nextTheme = this.state.theme === 'light' ? 'dark' : 'light';
                this.setTheme(nextTheme);
            });
        }
    },

    setTheme(theme) {
        this.state.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('aura-theme', theme);
        
        const toggleIcon = document.querySelector('#theme-toggle svg');
        if (toggleIcon) {
            if (theme === 'dark') {
                toggleIcon.innerHTML = `<path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"></path><path d="M3 12h1M20 12h1M12 3v1M12 20v1"></path>`;
            } else {
                toggleIcon.innerHTML = `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>`;
            }
        }
    },

    initVisualInteractions() {
        // Modern Spotlight Mouse-Tracking Shadow Effect for Premium Cards
        document.addEventListener('mousemove', (e) => {
            document.querySelectorAll('.card').forEach(card => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });
        });
    }
};

