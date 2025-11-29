let allRecipes = [];
let _rowListenerAttached = false;

function initStickyNav() {
    const nav = document.querySelector('.nav-pill');
    if (!nav) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.boundingClientRect.top <= 0 && !entry.isIntersecting) {
                nav.classList.add('stuck');
            } else {
                nav.classList.remove('stuck');
            }
        });
    }, { root: null, threshold: [0], rootMargin: '0px' });

    let sentinel = document.createElement('div');
    sentinel.style.position = 'absolute';
    sentinel.style.top = (nav.getBoundingClientRect().top + window.scrollY - 1) + 'px';
    sentinel.style.width = '1px';
    sentinel.style.height = '1px';
    sentinel.className = 'nav-sentinel';
    document.body.appendChild(sentinel);
    observer.observe(sentinel);
}



async function getData() {
    const url = 'https://free-to-play-games-database.p.rapidapi.com/api/games';

    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': 'a11affe668mshfdd32bdff4206e5p11a57bjsn45f709233a22',
            'x-rapidapi-host': 'free-to-play-games-database.p.rapidapi.com'
        }
    };

    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error('Status: ' + response.status);
        }

        const data = await response.json();

       
        allRecipes = data;

        console.log(allRecipes);
        displayData();

    } catch (error) {
        console.error('Fetch error:', error);
        const row = document.querySelector('.row');
        if (row) row.innerHTML = `<p class="text-danger">API Error</p>`;
    }
}

function displayData() {
    const allIndices = allRecipes.map((_, i) => i);
    renderByIndices(allIndices);
}

function renderByIndices(indices) {
    const row = document.querySelector('.row');
    if (!row) return console.warn('No element with selector .row found');
    try {
        let cartona = '';
        const placeholder = 'https://via.placeholder.com/600x300?text=No+Image';

        indices.forEach(idx => {
            const i = Number(idx);
            const game = allRecipes[i] || {};
            const title = game.title || 'Unknown Title';
            const thumbnail = game.thumbnail || placeholder;
            const desc = (game.short_description || 'No description available').replace(/\n/g, ' ');
            const genre = game.genre || '—';
            const platform = game.platform || '—';

            cartona += `
            <div class="col-sm-6 col-md-4 col-lg-3 mb-4 d-flex">
                <div class="game-card shadow-sm" data-index="${i}">
                    <img src="${thumbnail}" class="card-img-top" alt="${title}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <h5 class="game-title">${title}</h5>
                            <div class="game-badge">Free</div>
                        </div>
                        <p class="game-desc">${desc}</p>
                    </div>
                    <div class="chips">
                        <span class="chip">${genre}</span>
                        <span class="chip">${platform}</span>
                    </div>
                </div>
            </div>`;
        });

        row.innerHTML = cartona || `<p class="text-muted"></p>`;

        if (!_rowListenerAttached) {
            row.addEventListener('click', function (e) {
                try {
                    const cardEl = e.target.closest('.game-card');
                    if (!cardEl) return;
                    const anchor = e.target.closest('a');
                    if (anchor) return;

                    const idx = cardEl.dataset.index;
                    const game = allRecipes[idx];
                    if (game) openGameModal(game);
                } catch (innerErr) {
                    console.error('Handler error:', innerErr);
                }
            });
            _rowListenerAttached = true;
        }

    } catch (err) {
        console.error('Error while rendering games:', err);
        if (row) row.innerHTML = `<p class="text-danger"> ${err.message}</p>`;
    }
}

function setupNavFilters() {
    const nav = document.querySelector('.nav-pill');
    if (!nav) return;

    const links = nav.querySelectorAll('.nav-links a');
    const normalize = (str) => (str || '').toLowerCase().trim();

    const customCategories = {
        sailing: [0, 1, 2, 3, 4],
        permadeath: [5, 6, 7, 8, 9],
        superhero: [10, 11, 12, 13, 14],
        pixel: [15, 16, 17, 18, 19]
    };

    links.forEach(a => {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            links.forEach(x => x.classList.remove('active'));
            this.classList.add('active');

            const text = normalize(this.textContent);

            if (!text) {
                displayData();
                return;
            }

            if (customCategories[text]) {
                renderByIndices(customCategories[text]);
                return;
            }

            const matchedIndices = [];
            for (let i = 0; i < allRecipes.length; i++) {
                const gGenre = normalize(allRecipes[i].genre);
                if (!gGenre) continue;
                if (gGenre === text || gGenre.includes(text)) {
                    matchedIndices.push(i);
                }
            }

            const row = document.querySelector('.row');
            if (matchedIndices.length === 0) {
                if (row) row.innerHTML = `<div class="col-12"><p class="text-muted"> ${this.textContent}</p></div>`;
                return;
            }

            renderByIndices(matchedIndices);
        });
    });
}

function openGameModal(game) {
    let modal = document.getElementById('gameModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'gameModal';
    modal.className = 'game-modal';
    modal.innerHTML = `
        <div class="game-modal-dialog" role="dialog" aria-modal="true">
            <button class="game-modal-close" aria-label="Close">&times;</button>
            <div class="game-modal-left">
                <img src="${game.thumbnail || ''}" alt="${game.title}">
            </div>
            <div class="game-modal-right">
                <div class="modal-header">
                    <div class="modal-title-main">Details Game</div>
                    <div style="width:36px"></div>
                </div>
                <div class="content-wrap">
                    <h3 class="game-modal-title">${game.title}</h3>
                    <div class="meta-row"><div class="meta-label">Category:</div><div class="game-modal-chips"><span class="game-modal-chip">${game.genre || ''}</span></div></div>
                    <div class="meta-row"><div class="meta-label">Platform:</div><div class="game-modal-chips"><span class="game-modal-chip">${game.platform || ''}</span></div></div>
                    ${game.status ? `<div class="meta-row"><div class="meta-label">Status:</div><div class="game-modal-chips"><span class="game-modal-chip">${game.status}</span></div></div>` : ''}
                    <p class="game-modal-desc">${(game.short_description || '').replace(/\n/g, '<br>')}</p>
                    <div class="game-modal-actions"><a class="btn" href="${game.game_url || '#'}" target="_blank" rel="noopener">Show Game</a></div>
                </div>
            </div>
        </div>`;

    document.body.appendChild(modal);

    modal.querySelector('.game-modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', escHandler);

    function closeModal() {
        const m = document.getElementById('gameModal');
        if (m) m.remove();
        document.removeEventListener('keydown', escHandler);
    }

    function escHandler(e) {
        if (e.key === 'Escape') closeModal();
    }
}

document.addEventListener('DOMContentLoaded', function () {
    initStickyNav();
    if (typeof setupNavFilters === 'function') setupNavFilters();
    getData();
});
