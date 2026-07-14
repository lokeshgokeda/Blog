/**
 * ==========================================================================
 * AURA CONTENT ARCHITECTURE ENGINE (blog.js)
 * Headless Local Storage CMS & Layout Controller
 * ==========================================================================
 */

const AuraBlogEngine = {
    context: null,
    searchQuery: '',
    selectedCategory: 'all',

    async init(appContext) {
        this.context = appContext;
        this.initStorageSystem();
        
        this.injectSkeletons('#posts-container', 3);
        await this.fetchPostDatabase();
        
        if (document.getElementById('posts-container')) {
            this.initIndexView();
            this.initFAQ();
            this.initContactForm();
        } else if (document.getElementById('article-payload')) {
            this.initArticleView();
            this.initCommentsSection();
        }
    },

    initStorageSystem() {
        if (!localStorage.getItem('aura-likes')) localStorage.setItem('aura-likes', JSON.stringify({}));
        if (!localStorage.getItem('aura-bookmarks')) localStorage.setItem('aura-bookmarks', JSON.stringify({}));
    },

    async fetchPostDatabase() {
        try {
            await new Promise(resolve => setTimeout(resolve, 300)); // Cinematic render latency
            const response = await fetch('data/posts.json');
            if (!response.ok) throw new Error('Data sync fail.');
            const data = await response.json();
            this.context.state.allPosts = data;
            this.context.state.filteredPosts = [...data];
        } catch (error) {
            console.error('System Data Loading Fault:', error);
        }
    },

    injectSkeletons(targetSelector, count) {
        const target = document.querySelector(targetSelector);
        if (!target) return;
        target.innerHTML = Array(count).fill(`
            <div class="card skeleton-card">
                <div class="card-img-wrapper skeleton-box"></div>
                <div class="card-content">
                    <div class="skeleton-box" style="height: 12px; width: 30%; margin-bottom: 1rem; border-radius:4px;"></div>
                    <div class="skeleton-box" style="height: 24px; width: 90%; margin-bottom: 0.85rem; border-radius:4px;"></div>
                    <div class="skeleton-box" style="height: 16px; width: 100%; border-radius:4px;"></div>
                </div>
            </div>
        `).join('');
    },

    initIndexView() {
        this.renderGrid(this.context.state.filteredPosts);
        
        const search = document.getElementById('search-input');
        search?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase().trim();
            this.processPipeline();
        });

        document.querySelectorAll('.pill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.pill-btn').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                this.selectedCategory = btn.getAttribute('data-category');
                this.processPipeline();
            });
        });
    },

    processPipeline() {
        const bookmarks = JSON.parse(localStorage.getItem('aura-bookmarks'));
        this.context.state.filteredPosts = this.context.state.allPosts.filter(post => {
            const matchesSearch = post.title.toLowerCase().includes(this.searchQuery) || 
                                  post.description.toLowerCase().includes(this.searchQuery);
            
            if (this.selectedCategory === 'bookmarks') {
                return matchesSearch && bookmarks[post.id];
            }
            const matchesCategory = this.selectedCategory === 'all' || 
                                    post.category.toLowerCase() === this.selectedCategory;
            return matchesSearch && matchesCategory;
        });
        this.renderGrid(this.context.state.filteredPosts);
    },

    renderGrid(posts) {
        const container = document.getElementById('posts-container');
        if (!container) return;

        if (posts.length === 0) {
            container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 5rem 0;">No matching platform assets found.</p>`;
            return;
        }

        const likes = JSON.parse(localStorage.getItem('aura-likes'));
        const bookmarks = JSON.parse(localStorage.getItem('aura-bookmarks'));

        container.innerHTML = posts.map(post => {
            const isLiked = likes[post.id] ? 'active' : '';
            const isBookmarked = bookmarks[post.id] ? 'active' : '';
            return `
                <div class="card" data-id="${post.id}">
                    <a href="post.html?id=${post.id}" class="card-img-wrapper" style="display:block;">
                        <img class="card-img" src="${post.heroImage}" alt="" loading="lazy">
                    </a>
                    <div class="card-content">
                        <div class="card-meta">
                            <span>${post.category}</span>
                            <div style="display:flex; gap: 0.75rem;">
                                <button class="btn-card-action bookmark-toggle ${isBookmarked}" aria-label="Bookmark post">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                                </button>
                            </div>
                        </div>
                        <a href="post.html?id=${post.id}" style="text-decoration:none; color:inherit;">
                            <h2 class="card-title">${post.title}</h2>
                        </a>
                        <p class="card-excerpt">${post.description}</p>
                        <div class="card-footer">
                            <span>By ${post.author}</span>
                            <button class="btn-card-action like-toggle ${isLiked}" style="display:flex; align-items:center; gap:0.25rem;">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                <span class="like-count">${post.likesCount + (likes[post.id] ? 1 : 0)}</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.bindCardControls();
    },

    bindCardControls() {
        document.querySelectorAll('.like-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const card = btn.closest('.card');
                const id = card.getAttribute('data-id');
                let likes = JSON.parse(localStorage.getItem('aura-likes'));
                const counter = btn.querySelector('.like-count');
                let currentVal = parseInt(counter.textContent);

                if (likes[id]) {
                    delete likes[id];
                    btn.classList.remove('active');
                    btn.querySelector('svg').setAttribute('fill', 'none');
                    counter.textContent = currentVal - 1;
                } else {
                    likes[id] = true;
                    btn.classList.add('active');
                    btn.querySelector('svg').setAttribute('fill', 'currentColor');
                    counter.textContent = currentVal + 1;
                }
                localStorage.setItem('aura-likes', JSON.stringify(likes));
            });
        });

        document.querySelectorAll('.bookmark-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const card = btn.closest('.card');
                const id = card.getAttribute('data-id');
                let bookmarks = JSON.parse(localStorage.getItem('aura-bookmarks'));

                if (bookmarks[id]) {
                    delete bookmarks[id];
                    btn.classList.remove('active');
                    btn.querySelector('svg').setAttribute('fill', 'none');
                } else {
                    bookmarks[id] = true;
                    btn.classList.add('active');
                    btn.querySelector('svg').setAttribute('fill', 'currentColor');
                }
                localStorage.setItem('aura-bookmarks', JSON.stringify(bookmarks));
                if (this.selectedCategory === 'bookmarks') this.processPipeline();
            });
        });
    },

    initArticleView() {
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');
        const activePost = this.context.state.allPosts.find(p => p.id === postId) || this.context.state.allPosts[0];
        
        if (!activePost) return;

        document.title = `${activePost.title} // Aura`;
        
        document.getElementById('post-header-target').innerHTML = `
            <div class="card-meta" style="justify-content: center; margin-bottom: 1.5rem;">
                <span>${activePost.category}</span><span>•</span><span>${activePost.date}</span>
            </div>
            <h1 class="post-title">${activePost.title}</h1>
            <div style="text-align: center; font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 3.5rem;">
                By <strong style="color: var(--text-primary)">${activePost.author}</strong> — ${activePost.readingTime}
            </div>
            <img class="post-hero-image" src="${activePost.heroImage}" alt="">
        `;

        const bodyTarget = document.getElementById('post-body-target');
        bodyTarget.innerHTML = activePost.content;

        this.buildTOC(bodyTarget);
        this.trackProgress();
        this.initCodeBlocks();
    },

    buildTOC(body) {
        const headings = body.querySelectorAll('h2');
        const container = document.getElementById('toc-list-container');
        if (!container || headings.length === 0) return;

        container.innerHTML = Array.from(headings).map((h, i) => {
            h.id = `node-${i}`;
            return `<li><a href="#node-${i}">${h.textContent}</a></li>`;
        }).join('');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    document.querySelectorAll('.toc-list a').forEach(a => a.classList.remove('active'));
                    document.querySelector(`.toc-list a[href="#${entry.target.id}"]`)?.classList.add('active');
                }
            });
        }, { rootMargin: '-20% 0px -60% 0px' });

        headings.forEach(h => observer.observe(h));
    },

    trackProgress() {
        const progress = document.getElementById('progress-indicator');
        if (!progress) return;
        window.addEventListener('scroll', () => {
            const win = window.scrollY;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            progress.style.width = (height > 0 ? (win / height) * 100 : 0) + '%';
        });
    },

    initCodeBlocks() {
        document.querySelectorAll('pre code').forEach((codeBlock) => {
            const pre = codeBlock.parentElement;
            const container = document.createElement('div');
            container.className = 'code-container';
            pre.parentNode.insertBefore(container, pre);
            
            const header = document.createElement('div');
            header.className = 'code-header';
            header.innerHTML = `<span>ECMAScript (ES6)</span><button class="copy-btn">Copy</button>`;
            
            container.appendChild(header);
            container.appendChild(pre);

            header.querySelector('.copy-btn').addEventListener('click', (e) => {
                navigator.clipboard.writeText(codeBlock.textContent);
                e.target.textContent = 'Copied!';
                setTimeout(() => e.target.textContent = 'Copy', 2000);
            });
        });
    },

    initFAQ() {
        document.querySelectorAll('.faq-trigger').forEach(trigger => {
            trigger.addEventListener('click', () => {
                const item = trigger.closest('.faq-item');
                const isActive = item.classList.contains('active');
                document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
                if (!isActive) item.classList.add('active');
            });
        });
    },

    initContactForm() {
        const form = document.getElementById('pro-contact-form');
        if (!form) return;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            btn.textContent = 'Transmitting...';
            setTimeout(() => {
                btn.textContent = 'Success - Logged';
                btn.style.background = '#10b981';
                btn.style.borderColor = '#10b981';
                form.reset();
            }, 1200);
        });
    },

    initCommentsSection() {
        const form = document.getElementById('comment-form');
        const list = document.getElementById('comments-list-target');
        if (!form || !list) return;

        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id') || 'default';
        const storageKey = `comments-${postId}`;

        const loadComments = () => {
            const comments = JSON.parse(localStorage.getItem(storageKey)) || [
                { name: 'Sarah Chen', body: 'The structural optimization methods outlined in this node are incredibly clean. Outstanding write-up.', date: 'July 13, 2026' }
            ];
            list.innerHTML = comments.map(c => `
                <div class="comment-card">
                    <div class="comment-header">
                        <strong style="color:var(--text-primary);">${c.name}</strong>
                        <span style="color:var(--text-muted);">${c.date}</span>
                    </div>
                    <p style="font-size:1rem; color:var(--text-secondary);">${c.body}</p>
                </div>
            `).join('');
        };

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameEl = document.getElementById('commenter-name');
            const bodyEl = document.getElementById('comment-body');
            const comments = JSON.parse(localStorage.getItem(storageKey)) || [];

            comments.push({
                name: nameEl.value,
                body: bodyEl.value,
                date: 'Just Now'
            });

            localStorage.setItem(storageKey, JSON.stringify(comments));
            nameEl.value = '';
            bodyEl.value = '';
            loadComments();
        });

        loadComments();
    }
};

