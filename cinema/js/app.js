(() => {
  'use strict';

  const CONFIG = {
    dataUrl: 'data/projects.json',
    portfolioUrl: '../index.html'
  };

  const state = {
    projects: [],
    lang: localStorage.getItem('cinemaLang') || 'ru',
    type: localStorage.getItem('cinemaType') || 'all',
    subcategory: 'all',
    tag: 'all',
    sort: localStorage.getItem('cinemaSort') || 'newest',
    currentProjectId: null,
    galleryIndex: 0
  };

  const el = {
    featuredMount: document.getElementById('featuredMount'),
    projectGrid: document.getElementById('projectGrid'),
    resultCount: document.getElementById('resultCount'),
    typeTabs: document.getElementById('typeTabs'),
    subcategoryFilters: document.getElementById('subcategoryFilters'),
    tagFilters: document.getElementById('tagFilters'),
    sortSelect: document.getElementById('sortSelect'),
    viewerOverlay: document.getElementById('viewerOverlay'),
    viewerContent: document.getElementById('viewerContent'),
    emptyState: document.getElementById('emptyState'),
    toast: document.getElementById('toast'),
    backToPortfolio: document.getElementById('backToPortfolio'),
    popcornBtn: document.getElementById('popcornBtn')
  };

  const t = (key) => (window.CINEMA_I18N[state.lang] || window.CINEMA_I18N.ru)[key] || key;
  const localized = (project, field) => project[`${field}_${state.lang}`] || project[`${field}_ru`] || project[field] || '';

  async function init() {
    applyLanguage();
    restoreControls();
    bindEvents();
    el.featuredMount.innerHTML = `<div class="loading-card">${t('loading')}</div>`;

    try {
      const response = await fetch(CONFIG.dataUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      state.projects = await response.json();
      renderAll();
      openFromQuery();
    } catch (error) {
      console.error(error);
      el.featuredMount.innerHTML = `<div class="error-card"><strong>${t('cancelled')}</strong><br>${t('notFound')}</div>`;
      el.projectGrid.innerHTML = `<div class="error-card">projects.json не загрузился. Откройте проект через локальный HTTP-сервер.</div>`;
    }
  }

  function bindEvents() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.lang = btn.dataset.lang;
        localStorage.setItem('cinemaLang', state.lang);
        applyLanguage();
        renderAll();
        if (state.currentProjectId) openProject(state.currentProjectId, false);
      });
    });

    el.typeTabs.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-type]');
      if (!btn) return;
      state.type = btn.dataset.type;
      state.subcategory = 'all';
      state.tag = 'all';
      localStorage.setItem('cinemaType', state.type);
      renderCatalog();
    });

    el.sortSelect.addEventListener('change', () => {
      state.sort = el.sortSelect.value;
      localStorage.setItem('cinemaSort', state.sort);
      renderCatalog();
    });

    el.subcategoryFilters.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-subcategory]');
      if (!btn) return;
      state.subcategory = btn.dataset.subcategory;
      renderCatalog();
    });

    el.tagFilters.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-tag]');
      if (!btn) return;
      state.tag = btn.dataset.tag;
      renderCatalog();
    });

    document.addEventListener('click', (event) => {
      const opener = event.target.closest('[data-open-project]');
      if (opener) openProject(opener.dataset.openProject, true);

      if (event.target.closest('[data-close-viewer]')) closeViewer();

      const galleryNav = event.target.closest('[data-gallery-dir]');
      if (galleryNav) moveGallery(Number(galleryNav.dataset.galleryDir));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !el.viewerOverlay.hidden) closeViewer();
      if (!el.viewerOverlay.hidden && event.key === 'ArrowLeft') moveGallery(-1);
      if (!el.viewerOverlay.hidden && event.key === 'ArrowRight') moveGallery(1);
    });

    el.popcornBtn.addEventListener('click', () => {
      document.body.classList.remove('popcorn-burst');
      void document.body.offsetWidth;
      document.body.classList.add('popcorn-burst');
      showToast(t('popcornToast'));
    });
  }

  function restoreControls() {
    el.sortSelect.value = state.sort;
    document.querySelectorAll('[data-type]').forEach(btn => btn.classList.toggle('is-active', btn.dataset.type === state.type));
  }

  function applyLanguage() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll('[data-i18n]').forEach(node => {
      const key = node.dataset.i18n;
      if (t(key)) node.textContent = t(key);
    });
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.toggle('is-active', btn.dataset.lang === state.lang));
    el.backToPortfolio.href = `${CONFIG.portfolioUrl}?returnFrom=cinema&lang=${state.lang}`;
  }

  function renderAll() {
    applyLanguage();
    renderFeatured();
    renderCatalog();
  }

  function renderFeatured() {
    const project = state.projects.find(p => p.featured) || state.projects[0];
    if (!project) return;

    el.featuredMount.innerHTML = `
      <article class="featured-card">
        <div class="featured-poster-wrap">
          <img class="featured-poster" src="${project.preview}" alt="${escapeHtml(localized(project, 'title'))}" />
          <span class="screening-stamp">${t('nowShowing')}</span>
        </div>
        <div class="featured-info">
          <p class="eyebrow">${t(project.type === 'video' ? 'video' : project.type === 'image' ? 'images' : 'music')}</p>
          <h2>${escapeHtml(localized(project, 'title'))}</h2>
          <p>${escapeHtml(localized(project, 'description'))}</p>
          <div class="featured-meta">
            <span>${formatDate(project.date)}</span>
            ${project.duration ? `<span>${project.duration}</span>` : ''}
            <span>${escapeHtml(subcategoryLabel(project))}</span>
          </div>
          <button class="primary-btn" type="button" data-open-project="${project.id}">${t('open')} →</button>
        </div>
      </article>`;
  }

  function renderCatalog() {
    document.querySelectorAll('[data-type]').forEach(btn => btn.classList.toggle('is-active', btn.dataset.type === state.type));
    renderSubcategories();
    renderTags();

    let projects = state.projects.filter(p => state.type === 'all' || p.type === state.type);
    if (state.subcategory !== 'all') projects = projects.filter(p => subcategoryKey(p) === state.subcategory);
    if (state.tag !== 'all') projects = projects.filter(p => (p.tags || []).includes(state.tag));

    projects = [...projects].sort((a, b) => {
      if (state.sort === 'oldest') return new Date(a.date) - new Date(b.date);
      if (state.sort === 'featured') return Number(b.featured) - Number(a.featured) || new Date(b.date) - new Date(a.date);
      return new Date(b.date) - new Date(a.date);
    });

    el.resultCount.textContent = projects.length;
    el.emptyState.hidden = projects.length > 0;
    el.projectGrid.hidden = projects.length === 0;
    el.projectGrid.innerHTML = projects.map(projectCard).join('');
  }

  function renderSubcategories() {
    const filtered = state.projects.filter(p => state.type === 'all' || p.type === state.type);
    const options = [...new Map(filtered.map(p => [subcategoryKey(p), subcategoryLabel(p)])).entries()];

    if (!options.some(([key]) => key === state.subcategory)) state.subcategory = 'all';

    el.subcategoryFilters.innerHTML = [
      `<button class="chip ${state.subcategory === 'all' ? 'is-active' : ''}" data-subcategory="all">${t('allSubcategories')}</button>`,
      ...options.map(([key, label]) => `<button class="chip ${state.subcategory === key ? 'is-active' : ''}" data-subcategory="${escapeAttr(key)}">${escapeHtml(label)}</button>`)
    ].join('');
  }

  function renderTags() {
    const filtered = state.projects.filter(p => state.type === 'all' || p.type === state.type);
    const tags = [...new Set(filtered.flatMap(p => p.tags || []))].sort();

    if (!tags.includes(state.tag)) state.tag = 'all';

    el.tagFilters.innerHTML = [
      `<button class="chip chip--tag ${state.tag === 'all' ? 'is-active' : ''}" data-tag="all">${t('allTags')}</button>`,
      ...tags.map(tag => `<button class="chip chip--tag ${state.tag === tag ? 'is-active' : ''}" data-tag="${escapeAttr(tag)}">${escapeHtml(tag)}</button>`)
    ].join('');
  }

  function projectCard(project) {
    const typeLabel = t(project.type === 'video' ? 'video' : project.type === 'image' ? 'images' : 'music');
    const icon = project.type === 'video' ? '▶' : project.type === 'music' ? '♪' : '▧';
    return `
      <article class="project-card project-card--${project.type}" data-open-project="${project.id}" tabindex="0" role="button" aria-label="${escapeAttr(localized(project, 'title'))}">
        <div class="card-media">
          <img src="${project.preview}" alt="${escapeAttr(localized(project, 'title'))}" loading="lazy" />
          <span class="media-badge">${icon} ${typeLabel}</span>
          ${project.featured ? `<span class="featured-dot" title="Featured">★</span>` : ''}
        </div>
        <div class="card-body">
          <div class="card-kicker"><span>${escapeHtml(subcategoryLabel(project))}</span><span>${formatDate(project.date)}</span></div>
          <h3>${escapeHtml(localized(project, 'title'))}</h3>
          <p>${escapeHtml(localized(project, 'description'))}</p>
          <div class="card-footer">
            <span>${project.duration || ''}</span>
            <span>${(project.tools || []).slice(0, 2).join(' · ')}</span>
          </div>
        </div>
      </article>`;
  }

  function openProject(id, pushUrl) {
    const project = state.projects.find(p => p.id === id);
    if (!project) {
      showToast(`${t('cancelled')} ${t('notFound')}`);
      return;
    }

    state.currentProjectId = id;
    state.galleryIndex = 0;
    el.viewerContent.innerHTML = viewerTemplate(project);
    el.viewerOverlay.hidden = false;
    document.body.classList.add('viewer-open');

    if (pushUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('project', id);
      history.pushState({ project: id }, '', url);
    }

    setTimeout(() => document.querySelector('.viewer-close')?.focus(), 0);
  }

  function closeViewer() {
    if (el.viewerOverlay.hidden) return;
    el.viewerOverlay.hidden = true;
    document.body.classList.remove('viewer-open');
    state.currentProjectId = null;
    const url = new URL(window.location.href);
    url.searchParams.delete('project');
    history.replaceState({}, '', url);
  }

  function viewerTemplate(project) {
    const media = mediaTemplate(project);
    const extras = (project.extras || []).length ? `
      <section class="viewer-section">
        <h3>${t('materials')}</h3>
        <div class="extras-grid">
          ${project.extras.map(extra => `
            <a href="${extra.url}" target="_blank" rel="noopener" class="extra-item">
              <img src="${extra.url}" alt="${escapeAttr(extra[`label_${state.lang}`] || extra.label_ru || '')}" loading="lazy">
              <span>${escapeHtml(extra[`label_${state.lang}`] || extra.label_ru || '')}</span>
            </a>`).join('')}
        </div>
      </section>` : '';

    const behind = project.behind_the_scenes ? `
      <section class="viewer-section">
        <details class="behind-details">
          <summary>${t('behind')}</summary>
          <h3>${escapeHtml(project.behind_the_scenes[`title_${state.lang}`] || project.behind_the_scenes.title_ru || '')}</h3>
          <ol class="process-list">
            ${(project.behind_the_scenes.steps || []).map(step => `<li>${escapeHtml(step[state.lang] || step.ru || '')}</li>`).join('')}
          </ol>
        </details>
      </section>` : '';

    return `
      <div class="viewer-layout">
        <div class="viewer-media-zone">${media}</div>
        <div class="viewer-copy-zone">
          <p class="eyebrow">${escapeHtml(subcategoryLabel(project))}</p>
          <h2 id="viewerTitle">${escapeHtml(localized(project, 'title'))}</h2>
          <p class="viewer-description">${escapeHtml(localized(project, 'description'))}</p>
          <dl class="meta-list">
            <div><dt>${t('date')}</dt><dd>${formatDate(project.date)}</dd></div>
            ${project.duration ? `<div><dt>${t('duration')}</dt><dd>${project.duration}</dd></div>` : ''}
            <div><dt>${t('tools')}</dt><dd>${escapeHtml((project.tools || []).join(', '))}</dd></div>
          </dl>
          <div class="viewer-tags">${(project.tags || []).map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
        </div>
      </div>
      ${behind}
      ${extras}`;
  }

  function mediaTemplate(project) {
    const media = project.media || {};

    if (project.type === 'image') {
      if (media.kind === 'gallery' && Array.isArray(media.items) && media.items.length) {
        return galleryTemplate(project, media.items);
      }
      return `<div class="image-stage"><img src="${media.url || project.preview}" alt="${escapeAttr(localized(project, 'title'))}"></div>`;
    }

    if (project.type === 'video') {
      if (media.url) {
        return `<video class="media-player" controls poster="${media.poster || project.preview}" preload="metadata"><source src="${media.url}"></video>`;
      }
      return demoStage(project, '▶');
    }

    if (project.type === 'music') {
      if (media.url) {
        return `<div class="audio-stage"><img src="${media.poster || project.preview}" alt="${escapeAttr(localized(project, 'title'))}"><audio controls preload="metadata"><source src="${media.url}"></audio></div>`;
      }
      return `<div class="audio-stage audio-stage--demo"><img src="${project.preview}" alt="${escapeAttr(localized(project, 'title'))}"><div class="demo-audio-wave" aria-hidden="true">▂▅▃▇▄▆▂▅▇▃</div><p>${t('noMedia')}</p></div>`;
    }

    return demoStage(project, '◌');
  }

  function demoStage(project, icon) {
    return `<div class="demo-stage" style="background-image:url('${project.preview}')"><div class="demo-stage-overlay"><span class="demo-play">${icon}</span><strong>${t('demo')}</strong><p>${t('noMedia')}</p></div></div>`;
  }

  function galleryTemplate(project, items) {
    const index = Math.min(state.galleryIndex, items.length - 1);
    return `
      <div class="gallery-stage" data-gallery-project="${project.id}">
        <img src="${items[index]}" alt="${escapeAttr(localized(project, 'title'))} ${index + 1}">
        ${items.length > 1 ? `
          <button class="gallery-nav gallery-nav--prev" type="button" data-gallery-dir="-1" aria-label="${t('previous')}">‹</button>
          <button class="gallery-nav gallery-nav--next" type="button" data-gallery-dir="1" aria-label="${t('next')}">›</button>
          <span class="gallery-count">${index + 1} / ${items.length}</span>` : ''}
      </div>`;
  }

  function moveGallery(direction) {
    const project = state.projects.find(p => p.id === state.currentProjectId);
    const items = project?.media?.items;
    if (!items || items.length < 2) return;
    state.galleryIndex = (state.galleryIndex + direction + items.length) % items.length;
    const mediaZone = document.querySelector('.viewer-media-zone');
    if (mediaZone) mediaZone.innerHTML = galleryTemplate(project, items);
  }

  function openFromQuery() {
    const id = new URL(window.location.href).searchParams.get('project');
    if (!id) return;
    const exists = state.projects.some(p => p.id === id);
    if (exists) openProject(id, false);
    else showToast(`${t('cancelled')} ${t('notFound')}`);
  }

  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.add('is-visible');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => el.toast.classList.remove('is-visible'), 2800);
  }

  function subcategoryKey(project) {
    const value = project.subcategory;
    if (typeof value === 'string') return value;
    return value?.en || value?.ru || 'other';
  }

  function subcategoryLabel(project) {
    const value = project.subcategory;
    if (typeof value === 'string') return value;
    return value?.[state.lang] || value?.ru || value?.en || t('subcategory');
  }

  function formatDate(value) {
    if (!value) return '';
    return new Intl.DateTimeFormat(state.lang === 'ru' ? 'ru-RU' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`));
  }

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]));
  }

  function escapeAttr(value = '') { return escapeHtml(value); }

  window.addEventListener('popstate', () => {
    const id = new URL(window.location.href).searchParams.get('project');
    if (id) openProject(id, false); else if (!el.viewerOverlay.hidden) closeViewer();
  });

  document.addEventListener('keydown', (event) => {
    const card = event.target.closest?.('.project-card');
    if (card && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      openProject(card.dataset.openProject, true);
    }
  });

  init();
})();
