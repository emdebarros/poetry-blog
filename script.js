// Poetry Blog JavaScript
class PoetryBlog {
    constructor() {
        this.data = null;
        this.currentTab = 'intro';
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupNavigation();
            this.renderContent();
            this.setupAccordion();
            
            // Show the intro tab by default
            this.showTab('intro');
        } catch (error) {
            console.error('Error initializing blog:', error);
        }
    }

    async loadData() {
        try {
            const response = await fetch('poems.json');
            this.data = await response.json();
        } catch (error) {
            console.error('Error loading poems data:', error);
            // Fallback data if JSON fails to load
            this.data = {
                intro: {
                    title: "Why I'm Here",
                    quote: "Poetry teaches us to choose every word with devotion and care, and invites us to listen to them with tenderness and awe. In this simple act, we find the purest foundation of love.",
                    quoteAuthor: "Emma De Barros",
                    body: "This is my space to express myself as I've fallen in love with poetry.\n\nIt's a form of therapy. It gives me breath while taking my breath away.\nIt's where my love lives. It's where I can be understood. It's where I grow.\n\nMy Infinite Adore, when your heart is ready, you'll know where to find me."
                },
                analyses: [],
                originals: []
            };
        }
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = link.getAttribute('data-tab');
                this.showTab(tab);
            });
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            const tab = e.state?.tab || 'intro';
            this.showTab(tab, false);
        });

        // Set initial state
        const hash = window.location.hash.slice(1) || 'intro';
        history.replaceState({ tab: hash }, '', `#${hash}`);
    }

    showTab(tabName, updateHistory = true) {
        // Hide all tabs
        const allTabs = document.querySelectorAll('.tab-content');
        allTabs.forEach(tab => {
            tab.style.display = 'none';
        });

        // Show selected tab
        const selectedTab = document.getElementById(tabName);
        if (selectedTab) {
            selectedTab.style.display = 'block';
        }

        // Update navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-tab') === tabName) {
                link.classList.add('active');
            }
        });

        // Update browser history
        if (updateHistory) {
            history.pushState({ tab: tabName }, '', `#${tabName}`);
        }

        this.currentTab = tabName;
    }

    renderContent() {
        this.renderIntro();
        this.renderAnalysis();
        this.renderOriginals();
    }

    renderIntro() {
        if (!this.data.intro) return;

        const quoteTextElement = document.getElementById('intro-quote-text');
        const quoteAuthorElement = document.getElementById('intro-quote-author');
        const introBodyElement = document.getElementById('intro-body');
        const infiniteAdoreElement = document.getElementById('intro-infinite-adore');

        if (quoteTextElement) {
            quoteTextElement.textContent = `"${this.data.intro.quote}"`;
        }

        if (quoteAuthorElement) {
            quoteAuthorElement.textContent = `— ${this.data.intro.quoteAuthor}`;
        }

        if (introBodyElement && this.data.intro.body) {
            const bodyParts = this.data.intro.body.split('\n\nMy Infinite Adore, when your heart is ready, you\'ll know where to find me.');
            const mainBody = bodyParts[0];
            const infiniteAdorePart = 'My Infinite Adore, when your heart is ready, you\'ll know where to find me.';

            // Convert newlines to paragraphs
            const paragraphs = mainBody.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
            introBodyElement.innerHTML = paragraphs;

            if (infiniteAdoreElement) {
                infiniteAdoreElement.textContent = infiniteAdorePart;
            }
        }
    }

    renderAnalysis() {
        const container = document.getElementById('analysis-content');
        if (!container || !this.data.analyses) return;

        if (this.data.analyses.length === 0) {
            container.innerHTML = '<p class="text-muted">No analysis pieces available yet.</p>';
            return;
        }

        container.innerHTML = this.data.analyses.map((poem, index) => `
            <div class="accordion-item" data-id="analysis-${index}">
                <button class="accordion-trigger">
                    <div class="accordion-header">
                        <h3 class="accordion-title">${this.escapeHtml(poem.title)}</h3>
                        <p class="accordion-subtitle">by ${this.escapeHtml(poem.author)}</p>
                    </div>
                    <span class="accordion-icon">▼</span>
                </button>
                <div class="accordion-content">
                    <div class="poem-text">${this.escapeHtml(poem.fullText)}</div>
                    ${poem.analysis ? `
                        <div class="poem-analysis">
                            <h4 class="analysis-title">Analysis</h4>
                            <div class="analysis-text">${this.formatMarkdown(poem.analysis)}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    renderOriginals() {
        const container = document.getElementById('originals-content');
        if (!container || !this.data.originals) return;

        if (this.data.originals.length === 0) {
            container.innerHTML = '<p class="text-muted">No original poems available yet.</p>';
            return;
        }

        container.innerHTML = this.data.originals.map((poem, index) => `
            <div class="accordion-item" data-id="original-${index}">
                <button class="accordion-trigger">
                    <div class="accordion-header">
                        <h3 class="accordion-title">${this.escapeHtml(poem.title)}</h3>
                        <p class="accordion-subtitle">${this.formatDate(poem.date)}</p>
                    </div>
                    <span class="accordion-icon">▼</span>
                </button>
                <div class="accordion-content">
                    <div class="poem-text">${this.escapeHtml(poem.text)}</div>
                    ${poem.notes ? `
                        <div class="poem-notes">
                            <h4 class="notes-title">Notes</h4>
                            <p class="notes-text">${this.escapeHtml(poem.notes)}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    setupAccordion() {
        // Use event delegation for accordion functionality
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('.accordion-trigger');
            if (!trigger) return;

            e.preventDefault();
            const accordionItem = trigger.closest('.accordion-item');
            
            // Toggle the clicked item
            accordionItem.classList.toggle('active');
            
            // Optional: Close other accordions in the same container
            // const container = accordionItem.closest('.accordion-container');
            // const otherItems = container.querySelectorAll('.accordion-item');
            // otherItems.forEach(item => {
            //     if (item !== accordionItem) {
            //         item.classList.remove('active');
            //     }
            // });
        });
    }

    formatMarkdown(text) {
        if (!text) return '';
        
        // First escape HTML to prevent XSS
        let formatted = this.escapeHtml(text);
        
        // Convert markdown formatting
        // Bold text: **text** or __text__
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');
        
        // Italic text: *text* or _text_ (but not if it's part of bold)
        formatted = formatted.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
        formatted = formatted.replace(/(?<!_)_([^_\n]+)_(?!_)/g, '<em>$1</em>');
        
        // Convert double line breaks to paragraphs
        const paragraphs = formatted.split('\n\n').filter(p => p.trim());
        
        return paragraphs.map(paragraph => {
            // Trim whitespace and convert single line breaks to <br>
            const content = paragraph.trim().replace(/\n/g, '<br>');
            return `<p>${content}</p>`;
        }).join('');
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.getFullYear().toString();
        } catch (error) {
            return dateString;
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the blog when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PoetryBlog();
});

// Handle page visibility changes for better performance
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Re-initialize any animations or effects if needed
    }
});
