        const ROADMAP_STATE_GLOBAL = '__FW_ROADMAP_INITIAL_DATA__';
        const ROADMAP_DETAIL_STATE_GLOBAL = '__FW_ROADMAP_INITIAL_DETAIL_DATA__';
        const ROADMAP_VERSION_GLOBAL = '__FW_ROADMAP_APP_VERSION__';

        /* DATA_START */
        const DEFAULT_INITIAL_DATA = [
    {
        "id": 1779660711366,
        "title": "Шагомер 2.0 + ВСР + Пульс покоя",
        "desc": "1: повышает точность подсчета шагов и снижает расхождения с рыночными лидерами по метрике MAPE.\n2: обновляет расчет базовых метрик ВСР для оценки вегетативной регуляции; рефакторинг должен повысить устойчивость FW-реализации.\n3: формирует более корректный истинный пульс покоя как базу для кардио-аналитики и последующих пользовательских выводов.",
        "status": "planned",
        "date": "05.08.2026"
    },
    {
        "id": 1779660711367,
        "title": "БЭН 2.0 + Улучшение гидратации + Гемоглобин PoC",
        "desc": "1: обновляет стресс/EDA-контур и готовит основу для дальнейшего развития нейроактивности.\n2: повышает точность трекинга потерь жидкости и делает показатель гидратации ближе к реальной динамике веса/потерь воды.\n3: готовит среднесуточный показатель гемоглобина в браслете как часть направления лаборатории на руке; цель - приблизить оценку к данным анализа крови.",
        "status": "planned",
        "date": "05.08.2026"
    },
    {
        "id": 1779660711368,
        "title": "Расход 2.0 + Объединение расходов + Улучшение Aritmo + Часовые пояса",
        "desc": "1: уточняет расчет расхода калорий и повышает доверие к данным активности/энергозатрат.\n2: переводит модули на единый метод расчета расхода, уменьшая расхождения между разными частями продукта.\n3: оптимизирует длительность скрининга аритмий и добавляет класс иных аритмий, расширяя полезность кардио-мониторинга.\n4: снижает риск потери или полного обнуления данных при перелетах и смене timezone; конфликтные данные должны ограничиваться только периодом сдвига времени.",
        "status": "planned",
        "date": "05.10.2026"
    },
    {
        "id": 1779660711369,
        "title": "ЧСС 2.0",
        "desc": "Влияние релиза: улучшает точность трекинга ЧСС и сравнение с конкурентами, чтобы приблизить качество измерений к лидерам рынка.",
        "status": "planned",
        "date": "05.12.2026"
    },
    {
        "id": 1779660711370,
        "title": "Сон 2.0 + Тремор Паркинсон + Тремор психологический",
        "desc": "1: уточняет определение начала/конца сна и фаз сна, повышая практическую ценность sleep-аналитики для пользователя.\n2: добавляет оценку тремора, сопоставимую с клиническими шкалами UPDRS, в контуре GoBeU.\n3: добавляет детекцию стрессового/психогенного тремора и связывает его с пиками КГР, усиливая контур стресс-аналитики.",
        "status": "planned",
        "date": "05.02.2027"
    }
];
        /* DATA_END */

        const INITIAL_DATA = Array.isArray(window[ROADMAP_STATE_GLOBAL])
            ? window[ROADMAP_STATE_GLOBAL]
            : (Array.isArray(window.__ROADMAP_INITIAL_DATA__) ? window.__ROADMAP_INITIAL_DATA__ : DEFAULT_INITIAL_DATA);
        const INITIAL_DETAIL_DATA = window[ROADMAP_DETAIL_STATE_GLOBAL] && typeof window[ROADMAP_DETAIL_STATE_GLOBAL] === 'object'
            ? window[ROADMAP_DETAIL_STATE_GLOBAL]
            : ((window.__ROADMAP_INITIAL_DETAIL_DATA__ && typeof window.__ROADMAP_INITIAL_DETAIL_DATA__ === 'object') ? window.__ROADMAP_INITIAL_DETAIL_DATA__ : {});
        const APP_VERSION = window[ROADMAP_VERSION_GLOBAL] || window.__ROADMAP_APP_VERSION__ || 'v-1779664338478';

        const QUERY = new URLSearchParams(window.location.search);
        const DRAFT_ID = QUERY.get('draft');
        const AUTO_ACTION = QUERY.get('action');
        const IS_DRAFT_MODE = Boolean(DRAFT_ID);
        const DRAFT_REGISTRY_KEY = 'healbe_roadmap_draft_registry';
        const DRAFT_RECORD_KEY = IS_DRAFT_MODE ? `healbe_roadmap_draft_record_${DRAFT_ID}` : '';


        const STATUS_MAP = {
            done: { label: '✅ Сделано', class: 'status-done' },
            progress: { label: '🟡 В работе', class: 'status-progress' },
            planned: { label: '🔵 Запланировано', class: 'status-planned' }
        };

        const LEGACY_KEYS = [
            'roadmap_smart_speaker_data',
            'roadmap_smart_speaker_title',
            'roadmap_smart_speaker_app_version'
        ];

        const PAGE_KEY_PREFIX = getPageKeyPrefix();
        const STORAGE_KEY = IS_DRAFT_MODE ? '' : `healbe_roadmap_data_${PAGE_KEY_PREFIX}`;
        const TITLE_STORAGE_KEY = IS_DRAFT_MODE ? '' : `healbe_roadmap_title_${PAGE_KEY_PREFIX}`;
        const DETAIL_STORAGE_KEY = IS_DRAFT_MODE ? `healbe_roadmap_draft_detail_record_${DRAFT_ID}` : `healbe_roadmap_detail_data_${PAGE_KEY_PREFIX}`;
        const VERSION_KEY = IS_DRAFT_MODE ? '' : `healbe_roadmap_version_${PAGE_KEY_PREFIX}`;
        const lastViewportMode = { mobile: isMobileView(), compact: isCompactDesktopView() };

        let milestones = [];
        let milestoneDetails = {};
        let editingId = null;
        let dragStartIndex = -1;
        let activeDetailId = null;
        let detailEditingId = null;

        function getPageKeyPrefix() {
            if (IS_DRAFT_MODE) {
                return `draft_${String(DRAFT_ID).replace(/[^a-z0-9а-яё]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase()}`;
            }
            const raw = decodeURIComponent(window.location.pathname || 'roadmap');
            return raw.replace(/[^a-z0-9а-яё]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase() || 'roadmap';
        }

        function getDraftRegistry() {
            try {
                const parsed = JSON.parse(localStorage.getItem(DRAFT_REGISTRY_KEY) || '[]');
                return Array.isArray(parsed) ? parsed : [];
            } catch (error) {
                return [];
            }
        }

        function setDraftRegistry(items) {
            localStorage.setItem(DRAFT_REGISTRY_KEY, JSON.stringify(items));
        }

        function upsertDraftRegistry(payload) {
            if (!IS_DRAFT_MODE) return;
            const items = getDraftRegistry();
            const index = items.findIndex(item => item.id === DRAFT_ID);
            const nextItem = {
                id: DRAFT_ID,
                title: payload.title,
                createdAt: payload.createdAt,
                updatedAt: payload.updatedAt,
                fileName: `${slugify(payload.title || 'roadmap')}.html`,
                stats: payload.stats
            };

            if (index >= 0) {
                items[index] = { ...items[index], ...nextItem };
            } else {
                items.unshift(nextItem);
            }

            setDraftRegistry(items);
        }

        function buildDraftRecord(titleValue = '', list = milestones, currentCreatedAt = Date.now()) {
            const title = (titleValue || document.getElementById('roadmapTitle')?.innerText || '[Новая дорожная карта]').trim() || '[Новая дорожная карта]';
            const stats = {
                total: list.length,
                done: list.filter(item => item.status === 'done').length,
                progress: list.filter(item => item.status === 'progress').length,
                planned: list.filter(item => item.status === 'planned').length
            };

            return {
                id: DRAFT_ID,
                title,
                milestones: list,
                createdAt: currentCreatedAt,
                updatedAt: Date.now(),
                stats
            };
        }

        function getCurrentFileName() {
            const raw = decodeURIComponent(window.location.pathname || '');
            const fileName = raw.split('/').pop();
            if (fileName && /\.[a-z0-9]+$/i.test(fileName)) return fileName;
            return '';
        }

        function guessHubPath() {
            const remembered = localStorage.getItem('healbe_roadmap_last_hub');
            if (remembered) {
                return `./${remembered}`;
            }

            const currentName = getCurrentFileName();
            if (currentName && /^roadmap_builder/i.test(currentName)) {
                return `./${currentName.replace(/^roadmap_builder/i, 'index')}`;
            }

            try {
                const ref = document.referrer ? new URL(document.referrer) : null;
                const refName = ref ? decodeURIComponent(ref.pathname).split('/').pop() : '';
                if (refName) return `./${refName}`;
            } catch (error) {
            }

            return './index.html';
        }

        function applyBackLink() {
            const backLink = document.getElementById('backToHubLink');
            if (!backLink) return;
            backLink.href = guessHubPath();
        }

        function isMobileView() {
            return window.matchMedia('(max-width: 920px)').matches;
        }

        function isCompactDesktopView() {
            return !isMobileView() && window.matchMedia('(max-height: 820px), (max-width: 1440px)').matches;
        }

        function buildInitialDetailData(items) {
            return items.reduce((acc, item) => {
                acc[item.id] = {
                    features: splitDetailFeatures(item.desc),
                    featuresManual: false,
                    impact: 'Пользователь увидит изменения, заявленные в описании релиза, в рамках текущего черновика.',
                    notes: 'Детали релиза пока не заполнены.',
                    owner: inferDetailOwner(item.title, item.desc)
                };
                return acc;
            }, {});
        }

        function sanitizeDetailData(detail, fallback = {}) {
            return {
                owner: String((detail && detail.owner) || fallback.owner || 'Product').trim() || 'Product',
                features: Array.isArray(detail && detail.features)
                    ? detail.features.map(item => String(item || '').trim()).filter(Boolean)
                    : (Array.isArray(fallback.features) ? fallback.features : []),
                featuresManual: Boolean(
                    (detail && detail.featuresManual === true) ||
                    (fallback && fallback.featuresManual === true)
                ),
                impact: String((detail && detail.impact) || fallback.impact || 'Пользовательские изменения пока не описаны.').trim()
                    || 'Пользовательские изменения пока не описаны.',
                notes: normalizeNotesText((detail && detail.notes) || fallback.notes || 'Детали релиза пока не заполнены.')
                    || 'Детали релиза пока не заполнены.'
            };
        }

        function splitDetailFeatures(text) {
            const source = String(text || '').split(/\n+/).map(part => part.trim()).filter(Boolean);
            if (!source.length) {
                return ['Состав релиза пока не заполнен.'];
            }
            return source;
        }

        function inferDetailOwner(title, desc) {
            const probe = `${title || ''} ${desc || ''}`.toLowerCase();
            const parts = [];
            if (probe.includes('дизайн') || probe.includes('интерф') || probe.includes('онбординг')) parts.push('UX/UI');
            if (probe.includes('ios') || probe.includes('android') || probe.includes('прилож') || probe.includes('сайт')) parts.push('MA');
            if (probe.includes('аналит') || probe.includes('метрик')) parts.push('Analytics');
            return parts.length ? [...new Set(parts)].join(' + ') : 'Product';
        }

        function normalizeNotesText(text) {
            const lines = String(text || '')
                .split(/\n+/)
                .map(line => line.trim())
                .filter(Boolean);
            return lines.join('\n');
        }

        function saveDetailData() {
            localStorage.setItem(DETAIL_STORAGE_KEY, JSON.stringify(milestoneDetails));
        }

        function syncDetailDataWithMilestones() {
            const nextDetails = {};
            const defaults = buildInitialDetailData(milestones);

            milestones.forEach(item => {
                const fallback = defaults[item.id] || {};
                const stored = milestoneDetails[item.id] || {};
                nextDetails[item.id] = sanitizeDetailData(stored, fallback);
                if (!nextDetails[item.id].features.length) {
                    nextDetails[item.id].features = Array.isArray(fallback.features) && fallback.features.length
                        ? fallback.features
                        : ['Состав релиза пока не заполнен.'];
                }
            });

            milestoneDetails = nextDetails;
            saveDetailData();
        }

        function restoreDetailState() {
            const fallbackInitialDetails = {
                ...buildInitialDetailData(milestones),
                ...INITIAL_DETAIL_DATA
            };
            const storedDetailData = localStorage.getItem(DETAIL_STORAGE_KEY);

            if (storedDetailData) {
                try {
                    milestoneDetails = JSON.parse(storedDetailData);
                } catch (error) {
                    milestoneDetails = fallbackInitialDetails;
                }
            } else {
                milestoneDetails = fallbackInitialDetails;
            }

            if (!milestoneDetails || typeof milestoneDetails !== 'object') {
                milestoneDetails = {};
            }

            syncDetailDataWithMilestones();
        }

        function ensureDetailDrawerElements() {
            return {
                overlay: document.getElementById('detailOverlay'),
                drawer: document.getElementById('detailDrawer'),
                title: document.getElementById('detailDrawerTitle'),
                meta: document.getElementById('detailMeta'),
                body: document.getElementById('detailDrawerBody'),
                editBtn: document.getElementById('detailEditBtn')
            };
        }

        

        function getDetailById(id) {
            const item = milestones.find(entry => entry.id === id);
            if (!item) return null;
            return milestoneDetails[id] || buildInitialDetailData([item])[id];
        }

        function renderDetailView(item, detail) {
            const elements = ensureDetailDrawerElements();
            const features = (detail.features || []).map((feature, index) => `
                <li class="detail-feature-item">
                    <span class="detail-feature-num">${index + 1}</span>
                    <span class="detail-feature-text">${escapeHTML(feature)}</span>
                </li>
            `).join('');

            if (elements.editBtn) {
                elements.editBtn.hidden = false;
                elements.editBtn.textContent = 'Редактировать';
            }

            elements.body.innerHTML = `
                <section class="detail-section">
                    <h3>Что входит в релиз</h3>
                    <ul class="detail-feature-list">${features}</ul>
                </section>
                <section class="detail-section">
                    <h3>Что изменится для пользователя</h3>
                    <p>${escapeHTML(detail.impact || 'Пользовательские изменения пока не описаны.')}</p>
                </section>
                <section class="detail-section">
                    <h3>Примечания</h3>
                    <p class="detail-notes-text">${escapeHTML(detail.notes || 'Детали релиза пока не заполнены.')}</p>
                </section>
            `;
        }

        

        function renderDetailEditForm(item, detail) {
            const elements = ensureDetailDrawerElements();

            if (elements.editBtn) {
                elements.editBtn.hidden = true;
            }

            elements.body.innerHTML = `
                <form class="detail-edit-form" id="detailEditForm">
                    <label class="detail-field">
                        <span>Контур релиза</span>
                        <input id="detailEditOwner" type="text" value="${escapeHTML(detail.owner || 'Product')}" placeholder="Например: Product + UX/UI">
                    </label>
                    <label class="detail-field">
                        <span>Что входит в релиз</span>
                        <textarea id="detailEditFeatures" rows="6" placeholder="Одна строка = один пункт">${escapeHTML((detail.features || []).join('\n'))}</textarea>
                    </label>
                    <label class="detail-field">
                        <span>Что изменится для пользователя</span>
                        <textarea id="detailEditImpact" rows="5" placeholder="Опиши пользовательские изменения">${escapeHTML(detail.impact || '')}</textarea>
                    </label>
                    <label class="detail-field">
                        <span>Примечания</span>
                        <textarea id="detailEditNotes" rows="6" placeholder="Одна строка = одно примечание">${escapeHTML(detail.notes || '')}</textarea>
                    </label>
                    <div class="detail-edit-actions">
                        <button class="detail-edit-btn detail-cancel-btn" id="detailEditCancelBtn" type="button">Отмена</button>
                        <button class="detail-edit-btn detail-save-btn" id="detailEditSaveBtn" type="submit">Сохранить</button>
                    </div>
                </form>
            `;

            const form = document.getElementById('detailEditForm');
            const cancelBtn = document.getElementById('detailEditCancelBtn');
            if (form) {
                form.addEventListener('submit', saveDetailEdit);
            }
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    detailEditingId = null;
                    renderDetailDrawer();
                });
            }

            elements.body.scrollTop = 0;
            requestAnimationFrame(() => {
                elements.body.scrollTop = 0;
            });
        }

        

        function renderDetailDrawer() {
            if (activeDetailId === null) return;

            const item = milestones.find(entry => entry.id === activeDetailId);
            if (!item) return;

            const detail = getDetailById(activeDetailId);
            const elements = ensureDetailDrawerElements();
            if (!elements.drawer) return;

            elements.title.textContent = item.title || 'Детали релиза';
            elements.meta.innerHTML = `
                <span class="detail-meta-chip">${escapeHTML(STATUS_MAP[item.status].label)}</span>
                <span class="detail-meta-chip">Плановая дата: ${escapeHTML(item.date || 'Не указана')}</span>
                <span class="detail-meta-chip">Контур: ${escapeHTML(detail.owner || 'Product')}</span>
            `;

            if (detailEditingId === activeDetailId) {
                renderDetailEditForm(item, detail);
            } else {
                renderDetailView(item, detail);
            }
        }

        function startDetailEdit(event) {
            if (event) event.preventDefault();
            if (activeDetailId === null) return;
            detailEditingId = activeDetailId;
            renderDetailDrawer();
        }

        

        function saveDetailEdit(event) {
            event.preventDefault();
            if (activeDetailId === null) return;

            const currentDetail = getDetailById(activeDetailId) || {};
            const features = String(document.getElementById('detailEditFeatures')?.value || '')
                .split(/\n+/)
                .map(line => line.trim())
                .filter(Boolean);

            milestoneDetails[activeDetailId] = sanitizeDetailData({
                ...currentDetail,
                owner: String(document.getElementById('detailEditOwner')?.value || '').trim() || 'Product',
                features,
                featuresManual: true,
                impact: String(document.getElementById('detailEditImpact')?.value || '').trim() || 'Пользовательские изменения пока не описаны.',
                notes: normalizeNotesText(document.getElementById('detailEditNotes')?.value || '') || 'Детали релиза пока не заполнены.'
            }, currentDetail);

            saveDetailData();
            detailEditingId = null;
            renderDetailDrawer();
        }

        function syncActiveDetailCards() {
            document.querySelectorAll('.card[data-card-id]').forEach((card) => {
                const id = Number(card.getAttribute('data-card-id'));
                card.classList.toggle('active-detail', activeDetailId === id);
            });
        }

        function openDetail(id, event) {
            if (event) event.stopPropagation();
            const item = milestones.find(entry => entry.id === id);
            if (!item) return;

            activeDetailId = id;
            detailEditingId = null;

            const elements = ensureDetailDrawerElements();
            if (!elements.overlay || !elements.drawer) return;

            elements.overlay.hidden = false;
            elements.overlay.classList.add('is-open');
            elements.drawer.classList.add('is-open');
            elements.drawer.setAttribute('aria-hidden', 'false');

            renderDetailDrawer();
            syncActiveDetailCards();
        }

        function closeDetail() {
            activeDetailId = null;
            detailEditingId = null;
            const elements = ensureDetailDrawerElements();
            if (!elements.overlay || !elements.drawer) return;
            elements.overlay.classList.remove('is-open');
            elements.drawer.classList.remove('is-open');
            if (document.activeElement && elements.drawer.contains(document.activeElement)) {
                document.activeElement.blur();
            }
            elements.drawer.setAttribute('aria-hidden', 'true');
            window.setTimeout(() => {
                if (!elements.overlay.classList.contains('is-open')) {
                    elements.overlay.hidden = true;
                }
            }, 220);
            syncActiveDetailCards();
        }

        function ensureActiveDetailState() {
            const activeStillExists = activeDetailId !== null && milestones.some(item => item.id === activeDetailId);

            if (!activeStillExists) {
                if (activeDetailId !== null) {
                    closeDetail();
                }
                return;
            }

            if (detailEditingId !== null && detailEditingId !== activeDetailId) {
                detailEditingId = null;
            }

            renderDetailDrawer();
            syncActiveDetailCards();
        }

        function init() {
            applyBackLink();
            migrateStorageIfNeeded();
            restoreState();
            bindStaticEvents();
            render();
            setupPanScroll();
            setupViewportWatcher();
            setupHeaderScroll();
            updateHeaderCompactState();

            if (AUTO_ACTION === 'export') {
                setTimeout(() => exportHTML(), 220);
            }
        }

        function migrateStorageIfNeeded() {
            if (IS_DRAFT_MODE) return;
            const savedVersion = localStorage.getItem(VERSION_KEY);
            if (savedVersion !== APP_VERSION) {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(TITLE_STORAGE_KEY);
                LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
                localStorage.setItem(VERSION_KEY, APP_VERSION);
            }
        }

        function restoreState() {
            const titleEl = document.getElementById('roadmapTitle');

            if (IS_DRAFT_MODE) {
                const storedDraft = localStorage.getItem(DRAFT_RECORD_KEY);
                if (storedDraft) {
                    try {
                        const parsed = JSON.parse(storedDraft);
                        milestones = Array.isArray(parsed.milestones) ? parsed.milestones : [...INITIAL_DATA];
                        titleEl.innerText = (parsed.title || titleEl.innerText || '[Новая дорожная карта]').trim();
                        document.title = `${titleEl.innerText.trim()} Roadmap`;
                        upsertDraftRegistry(buildDraftRecord(titleEl.innerText.trim(), milestones, parsed.createdAt || Date.now()));
                        restoreDetailState();
                        return;
                    } catch (error) {
                    }
                }

                milestones = [...INITIAL_DATA];
                titleEl.innerText = titleEl.innerText.trim() || '[Новая дорожная карта]';
                document.title = `${titleEl.innerText.trim()} Roadmap`;
                const initialRecord = buildDraftRecord(titleEl.innerText.trim(), milestones, Date.now());
                localStorage.setItem(DRAFT_RECORD_KEY, JSON.stringify(initialRecord));
                upsertDraftRegistry(initialRecord);
                restoreDetailState();
                return;
            }

            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try {
                    milestones = JSON.parse(stored);
                } catch (error) {
                    milestones = [...INITIAL_DATA];
                }
            } else {
                milestones = [...INITIAL_DATA];
            }

            const storedTitle = localStorage.getItem(TITLE_STORAGE_KEY);
            if (storedTitle) {
                titleEl.innerText = storedTitle;
                document.title = `${storedTitle} Roadmap`;
            } else {
                document.title = `${titleEl.innerText.trim()} Roadmap`;
            }

            restoreDetailState();
        }

        function bindStaticEvents() {
            const titleEl = document.getElementById('roadmapTitle');

            titleEl.addEventListener('blur', () => {
                const newTitle = titleEl.innerText.trim() || '[Новая дорожная карта]';
                titleEl.innerText = newTitle;
                document.title = `${newTitle} Roadmap`;

                if (IS_DRAFT_MODE) {
                    saveToStorage();
                } else {
                    localStorage.setItem(TITLE_STORAGE_KEY, newTitle);
                }
            });

            titleEl.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    titleEl.blur();
                }
            });

            document.getElementById('addBtn').addEventListener('click', addMilestone);
            document.getElementById('importBtn').addEventListener('click', () => document.getElementById('fileInput').click());
            document.getElementById('fileInput').addEventListener('change', handleImport);
            document.getElementById('exportDocxBtn').addEventListener('click', exportDOCX);
            document.getElementById('exportBtn').addEventListener('click', exportHTML);
            document.getElementById('resetStorageBtn').addEventListener('click', resetLocalData);

            const overlay = document.getElementById('detailOverlay');
            const closeBtn = document.getElementById('detailCloseBtn');
            const editBtn = document.getElementById('detailEditBtn');
            if (overlay) overlay.addEventListener('click', closeDetail);
            if (closeBtn) closeBtn.addEventListener('click', closeDetail);
            if (editBtn) editBtn.addEventListener('click', startDetailEdit);
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && activeDetailId !== null) {
                    closeDetail();
                }
            });
        }

        

document.addEventListener('wheel', (event) => {
                const textarea = event.target.closest('.edit-form textarea');
                if (!textarea) return;

                const hasVerticalScroll = textarea.scrollHeight > textarea.clientHeight + 1;
                if (!hasVerticalScroll) return;

                event.preventDefault();
                event.stopPropagation();
                textarea.scrollTop += event.deltaY;
            }, { passive: false });
        function setupViewportWatcher() {
            window.addEventListener('resize', debounce(() => {
                const currentMobile = isMobileView();
                const currentCompact = isCompactDesktopView();
                if (currentMobile !== lastViewportMode.mobile || currentCompact !== lastViewportMode.compact) {
                    lastViewportMode.mobile = currentMobile;
                    lastViewportMode.compact = currentCompact;
                    render();
                    setupPanScroll();
                }
                updateHeaderCompactState();
            }, 120));
        }

        function setupHeaderScroll() {
            window.addEventListener('scroll', updateHeaderCompactState, { passive: true });
        }

        function updateHeaderCompactState() {
            const header = document.querySelector('.page-header');
            if (!header) return;

            if (!isMobileView()) {
                header.classList.remove('is-collapsed');
                return;
            }

            header.classList.toggle('is-collapsed', window.scrollY > 56);
        }

        function addMilestone() {
            const newItem = {
                id: Date.now(),
                title: 'Новый релиз',
                desc: 'Описание задачи',
                status: 'planned',
                date: 'Месяц 2026'
            };

            milestones.push(newItem);
            editingId = newItem.id;
            syncDetailDataWithMilestones();
            saveToStorage();
            render();

            const wrapper = document.getElementById('scrollWrapper');
            setTimeout(() => {
                if (isMobileView()) {
                    wrapper.scrollTo({ top: wrapper.scrollHeight, behavior: 'smooth' });
                } else {
                    wrapper.scrollTo({ left: wrapper.scrollWidth, behavior: 'smooth' });
                }
            }, 80);
        }

        function saveToStorage() {
            if (IS_DRAFT_MODE) {
                let createdAt = Date.now();
                const existing = localStorage.getItem(DRAFT_RECORD_KEY);
                if (existing) {
                    try {
                        createdAt = JSON.parse(existing).createdAt || createdAt;
                    } catch (error) {
                    }
                }

                const record = buildDraftRecord(document.getElementById('roadmapTitle').innerText.trim(), milestones, createdAt);
                localStorage.setItem(DRAFT_RECORD_KEY, JSON.stringify(record));
                upsertDraftRegistry(record);
                return;
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(milestones));
        }

        function updateStats() {
            const done = milestones.filter(item => item.status === 'done').length;
            const progress = milestones.filter(item => item.status === 'progress').length;
            const planned = milestones.filter(item => item.status === 'planned').length;

            document.getElementById('statTotal').innerText = milestones.length;
            document.getElementById('statDone').innerText = done;
            document.getElementById('statProgress').innerText = progress;
            document.getElementById('statPlanned').innerText = planned;
        }

        function render() {
            const container = document.getElementById('roadmapContainer');
            container.innerHTML = '';
            const mobile = isMobileView();
            const compact = isCompactDesktopView();
            container.className = `roadmap-container ${mobile ? 'mobile' : 'desktop'}${compact ? ' compact' : ''}`;

            if (!milestones.length) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-box">
                            <h3>Пока пусто</h3>
                            <p>Добавь первый релиз вручную или загрузи данные из DOCX / CSV, и таймлайн сразу соберется.</p>
                        </div>
                    </div>
                `;
                updateStats();
                return;
            }

            if (mobile) {
                renderMobile(container);
            } else {
                renderDesktop(container);
            }

            updateStats();
            syncActiveDetailCards();
        }

        function renderDesktop(container) {
            if (isCompactDesktopView()) {
                renderCompactDesktop(container);
                return;
            }

            renderFullDesktop(container);
        }

        function renderFullDesktop(container) {
            const line = document.createElement('div');
            line.className = 'timeline-line';
            container.appendChild(line);

            milestones.forEach((item, index) => {
                const column = document.createElement('div');
                column.className = `desktop-column ${STATUS_MAP[item.status].class}`;
                column.dataset.index = index;
                column.draggable = editingId === null;

                if (editingId === null) {
                    column.addEventListener('dragstart', handleDragStart);
                    column.addEventListener('dragover', handleDragOver);
                    column.addEventListener('dragleave', handleDragLeave);
                    column.addEventListener('drop', handleDrop);
                    column.addEventListener('dragend', handleDragEnd);
                }

                const isTop = index % 2 === 0;
                column.innerHTML = `
                    ${isTop ? buildSlotHTML(item, 'top-slot') : '<div class="slot top-slot empty"></div>'}
                    <div class="node-row"><div class="dot"></div></div>
                    ${isTop ? '<div class="slot bottom-slot empty"></div>' : buildSlotHTML(item, 'bottom-slot')}
                `;

                attachCardEvents(column, item.id);
                container.appendChild(column);
            });
        }

        function renderCompactDesktop(container) {
            const line = document.createElement('div');
            line.className = 'timeline-line';
            container.appendChild(line);

            milestones.forEach((item, index) => {
                const column = document.createElement('div');
                column.className = `compact-column ${STATUS_MAP[item.status].class}`;
                column.dataset.index = index;
                column.draggable = editingId === null;

                if (editingId === null) {
                    column.addEventListener('dragstart', handleDragStart);
                    column.addEventListener('dragover', handleDragOver);
                    column.addEventListener('dragleave', handleDragLeave);
                    column.addEventListener('drop', handleDrop);
                    column.addEventListener('dragend', handleDragEnd);
                }

                column.innerHTML = `
                    <div class="compact-node-row"><div class="dot"></div></div>
                    <div class="compact-connector"></div>
                    <div class="compact-card-slot">${buildCardShellHTML(item)}</div>
                `;

                attachCardEvents(column, item.id);
                container.appendChild(column);
            });
        }

        function renderMobile(container) {
            const line = document.createElement('div');
            line.className = 'mobile-line';
            container.appendChild(line);

            milestones.forEach((item) => {
                const row = document.createElement('div');
                row.className = `mobile-row ${STATUS_MAP[item.status].class}`;
                row.innerHTML = `
                    <div class="mobile-node"><div class="dot"></div></div>
                    <div class="mobile-card-wrap">${buildCardShellHTML(item)}</div>
                `;
                attachCardEvents(row, item.id);
                container.appendChild(row);
            });
        }

        function buildSlotHTML(item, slotClass) {
            return `
                <div class="slot ${slotClass}">
                    <div class="connector"></div>
                    ${buildCardShellHTML(item)}
                </div>
            `;
        }

        function buildCardShellHTML(item) {
            return `
                <div class="card ${editingId === item.id ? 'editing' : ''} ${activeDetailId === item.id ? 'active-detail' : ''}" data-card-id="${item.id}">
                    ${editingId === item.id ? getEditFormHTML(item) : getCardHTML(item)}
                </div>
            `;
        }

        function getCardHTML(item) {
            return `
                <div class="card-actions">
                    <button class="icon-btn" type="button" onclick="startEdit(${item.id}, event)" title="Редактировать" aria-label="Редактировать">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>
                        </svg>
                    </button>
                    <button class="icon-btn delete" type="button" onclick="deleteItem(${item.id}, event)" title="Удалить" aria-label="Удалить">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M3 6h18"></path>
                            <path d="M8 6V4h8v2"></path>
                            <path d="M19 6l-1 14H6L5 6"></path>
                            <path d="M10 11v6"></path>
                            <path d="M14 11v6"></path>
                        </svg>
                    </button>
                </div>
                <div class="card-header">
                    <span class="status-badge">${STATUS_MAP[item.status].label}</span>
                </div>
                <div class="card-main">
                    <div class="card-title" title="${escapeHTML(item.title)}">${escapeHTML(item.title)}</div>
                    <div class="card-desc" title="${escapeHTML(item.desc)}">${escapeHTML(item.desc)}</div>
                </div>
                <div class="card-footer">
                    <div class="card-date">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <rect x="3.5" y="5" width="17" height="15.5" rx="3"></rect>
                            <path d="M7.5 3.5V6.5"></path>
                            <path d="M16.5 3.5V6.5"></path>
                            <path d="M3.5 9H20.5"></path>
                            <path d="M8 12.5H8.01"></path>
                            <path d="M12 12.5H12.01"></path>
                            <path d="M16 12.5H16.01"></path>
                        </svg>
                        <span>${escapeHTML(item.date)}</span>
                    </div>
                    <button class="card-detail-link" type="button" onclick="openDetail(${item.id}, event)">
                        Подробнее <span aria-hidden="true">→</span>
                    </button>
                </div>
            `;
        }

        function getEditFormHTML(item) {
            return `
                <div class="edit-form" onclick="event.stopPropagation()">
                    <input type="text" id="edit-title" value="${escapeHTML(item.title)}" placeholder="Название">
                    <select id="edit-status">
                        <option value="done" ${item.status === 'done' ? 'selected' : ''}>✅ Сделано</option>
                        <option value="progress" ${item.status === 'progress' ? 'selected' : ''}>🟡 В работе</option>
                        <option value="planned" ${item.status === 'planned' ? 'selected' : ''}>🔵 Запланировано</option>
                    </select>
                    <textarea id="edit-desc" placeholder="Описание">${escapeHTML(item.desc)}</textarea>
                    <input type="text" id="edit-date" value="${escapeHTML(item.date)}" placeholder="Срок">
                    <div class="edit-actions">
                        <button class="btn-cancel" type="button" onclick="cancelEdit(event)">Отмена</button>
                        <button class="btn-save" type="button" onclick="saveEdit(${item.id}, event)">Сохранить</button>
                    </div>
                </div>
            `;
        }

        function attachCardEvents(root, id) {
            const card = root.querySelector(`[data-card-id="${id}"]`);
            if (!card) return;
            card.addEventListener('dblclick', (event) => {
                if (editingId !== id) {
                    startEdit(id, event);
                }
            });
        }

        window.deleteItem = function(id, event) {
            event.stopPropagation();
            if (!confirm('Удалить этот релиз?')) return;
            milestones = milestones.filter(item => item.id !== id);
            if (editingId === id) editingId = null;
            syncDetailDataWithMilestones();
            saveToStorage();
            ensureActiveDetailState();
            render();
        };

        window.startEdit = function(id, event) {
            if (event) event.stopPropagation();
            editingId = id;
            render();
            requestAnimationFrame(() => {
                const card = document.querySelector(`.card[data-card-id="${id}"]`);
                if (card) {
                    card.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
                    card.scrollTop = 0;
                }
                const firstField = document.getElementById('edit-title');
                if (firstField) firstField.focus();
            });
        };

        window.cancelEdit = function(event) {
            event.stopPropagation();
            editingId = null;
            render();
        };

        window.saveEdit = function(id, event) {
            event.stopPropagation();

            const title = document.getElementById('edit-title').value.trim() || 'Без названия';
            const desc = document.getElementById('edit-desc').value.trim();
            const status = document.getElementById('edit-status').value;
            const date = document.getElementById('edit-date').value.trim();

            const index = milestones.findIndex(item => item.id === id);
            if (index !== -1) {
                milestones[index] = { ...milestones[index], title, desc, status, date };

                const currentDetail = milestoneDetails[id] || buildInitialDetailData([milestones[index]])[id];
                if (currentDetail.featuresManual !== true) {
                    milestoneDetails[id] = sanitizeDetailData({
                        ...currentDetail,
                        features: splitDetailFeatures(desc),
                        featuresManual: false
                    }, currentDetail);
                    saveDetailData();
                }

                syncDetailDataWithMilestones();
                saveToStorage();
            }

            editingId = null;
            ensureActiveDetailState();
            render();
        };

        function handleDragStart(event) {
            if (editingId !== null) {
                event.preventDefault();
                return;
            }
            dragStartIndex = Number(this.dataset.index);
            this.classList.add('dragging');
            event.dataTransfer.effectAllowed = 'move';
            setTimeout(() => { this.style.opacity = '0.45'; }, 0);
        }

        function handleDragOver(event) {
            event.preventDefault();
            const overColumn = event.currentTarget;
            if (overColumn && !overColumn.classList.contains('dragging')) {
                overColumn.classList.add('drag-over');
            }
        }

        function handleDragLeave() {
            this.classList.remove('drag-over');
        }

        function handleDrop(event) {
            event.preventDefault();
            const dropIndex = Number(this.dataset.index);
            this.classList.remove('drag-over');

            if (dragStartIndex === -1 || dragStartIndex === dropIndex) return;

            const moved = milestones.splice(dragStartIndex, 1)[0];
            milestones.splice(dropIndex, 0, moved);
            syncDetailDataWithMilestones();
            saveToStorage();
            ensureActiveDetailState();
            render();
        }

        function handleDragEnd() {
            this.classList.remove('dragging');
            this.style.opacity = '1';
            dragStartIndex = -1;
            document.querySelectorAll('.desktop-column, .compact-column').forEach(col => col.classList.remove('drag-over'));
        }

        function resetLocalData() {
            const message = IS_DRAFT_MODE
                ? 'Очистить этот черновик и вернуть его к пустому состоянию?'
                : 'Очистить локально сохраненные данные этой страницы и перезагрузить ее?';

            const ok = confirm(message);
            if (!ok) return;

            if (IS_DRAFT_MODE) {
                const titleEl = document.getElementById('roadmapTitle');
                titleEl.innerText = '[Новая дорожная карта]';
                milestones = [];
                const record = buildDraftRecord(titleEl.innerText.trim(), milestones, Date.now());
                localStorage.setItem(DRAFT_RECORD_KEY, JSON.stringify(record));
                upsertDraftRegistry(record);
                localStorage.removeItem(DETAIL_STORAGE_KEY);
                milestoneDetails = {};
                activeDetailId = null;
                editingId = null;
                render();
                return;
            }

            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(TITLE_STORAGE_KEY);
            localStorage.removeItem(DETAIL_STORAGE_KEY);
            localStorage.removeItem(VERSION_KEY);
            LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
            location.reload();
        }

        function exportHTML() {
            editingId = null;
            render();

            const currentTitle = document.getElementById('roadmapTitle').innerText.trim() || 'Roadmap';
            const clone = document.documentElement.cloneNode(true);

            const titleNode = clone.querySelector('title');
            if (titleNode) titleNode.innerText = `${currentTitle} Roadmap`;

            const titleHeading = clone.querySelector('#roadmapTitle');
            if (titleHeading) titleHeading.innerText = currentTitle;

            const stateScript = buildExportStateScript(milestones, milestoneDetails, `v-${Date.now()}`);
            const scripts = clone.querySelectorAll('script');
            scripts.forEach(script => {
                const src = script.getAttribute('src') || '';
                const scriptText = script.textContent || '';
                if (
                    src.includes('mammoth')
                    || src.includes('jszip')
                    || src.includes('fw-release-roadmap.js')
                ) {
                    return;
                }
                if (
                    scriptText.includes(ROADMAP_STATE_GLOBAL)
                    || scriptText.includes(ROADMAP_DETAIL_STATE_GLOBAL)
                    || scriptText.includes(ROADMAP_VERSION_GLOBAL)
                    || scriptText.includes('__ROADMAP_INITIAL_DATA__')
                    || scriptText.includes('__ROADMAP_INITIAL_DETAIL_DATA__')
                    || scriptText.includes('__ROADMAP_APP_VERSION__')
                ) {
                    script.remove();
                    return;
                }
                script.remove();
            });

            const appScript = clone.querySelector('script[src*="fw-release-roadmap.js"]');
            if (appScript) {
                appScript.insertAdjacentHTML('beforebegin', `${stateScript}\n    `);
            }

            const container = clone.querySelector('#roadmapContainer');
            if (container) container.innerHTML = '';

            const finalHTML = '<!DOCTYPE html>\n' + clone.outerHTML;
            const blob = new Blob([finalHTML], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            const currentFileName = getCurrentFileName();
            const downloadName = (IS_DRAFT_MODE || /^roadmap_builder/i.test(currentFileName || ''))
                ? `${slugify(currentTitle)}.html`
                : (getCurrentFileName() || `${slugify(currentTitle)}.html`);
            a.download = downloadName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        }

        function buildExportStateScript(data, detailData, version) {
            return `<script>window.${ROADMAP_STATE_GLOBAL}=${serializeForHtml(data)};window.${ROADMAP_DETAIL_STATE_GLOBAL}=${serializeForHtml(detailData || {})};window.${ROADMAP_VERSION_GLOBAL}=${JSON.stringify(version)};<\/script>`;
        }

        function serializeForHtml(value) {
            return JSON.stringify(value)
                .replace(/</g, '\\u003c')
                .replace(/>/g, '\\u003e')
                .replace(/&/g, '\\u0026');
        }


        async function exportDOCX() {
            const rows = [
                ['Название', 'Краткое описание', 'Статус', 'Примерный срок'],
                ...milestones.map(item => [
                    item.title || '',
                    item.desc || '',
                    statusCodeToText(item.status),
                    item.date || ''
                ])
            ];

            if (typeof JSZip === 'undefined') {
                alert('Не удалось подготовить DOCX. Проверь подключение к интернету и обнови страницу.');
                return;
            }

            try {
                const blob = await createDocxBlob(rows);
                downloadBlob(blob, `${slugify(document.getElementById('roadmapTitle').innerText.trim() || 'roadmap')}.docx`);
            } catch (error) {
                console.error(error);
                alert('Ошибка при формировании DOCX-файла.');
            }
        }

        function statusCodeToText(code) {
            if (code === 'done') return 'Сделано';
            if (code === 'progress') return 'В работе';
            return 'Запланировано';
        }

        function downloadBlob(blob, filename) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        }

        async function createDocxBlob(rows) {
            const zip = new JSZip();
            zip.file('[Content_Types].xml', getDocxContentTypes());
            zip.folder('_rels').file('.rels', getDocxRootRels());
            zip.folder('word').file('document.xml', getDocxDocument(rows));
            return zip.generateAsync({ type: 'blob' });
        }

        function getDocxContentTypes() {
            return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
        }

        function getDocxRootRels() {
            return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
        }

        function getDocxDocument(rows) {
            const widths = [3200, 6400, 2400, 2600];
            const tblGrid = widths.map(width => `<w:gridCol w:w="${width}"/>`).join('');
            const bodyRows = rows.map((row, rowIndex) => `
                <w:tr>${row.map((cell, index) => buildDocxCell(cell, widths[index] || 2400, rowIndex === 0)).join('')}</w:tr>`).join('');

            return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
 xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
 xmlns:v="urn:schemas-microsoft-com:vml"
 xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
 xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
 xmlns:w10="urn:schemas-microsoft-com:office:word"
 xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
 xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
 xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
 xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
 xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
 xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
 mc:Ignorable="w14 wp14">
  <w:body>
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="0" w:type="auto"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="8" w:space="0" w:color="D8DFF0"/>
          <w:left w:val="single" w:sz="8" w:space="0" w:color="D8DFF0"/>
          <w:bottom w:val="single" w:sz="8" w:space="0" w:color="D8DFF0"/>
          <w:right w:val="single" w:sz="8" w:space="0" w:color="D8DFF0"/>
          <w:insideH w:val="single" w:sz="8" w:space="0" w:color="D8DFF0"/>
          <w:insideV w:val="single" w:sz="8" w:space="0" w:color="D8DFF0"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tblGrid>${tblGrid}</w:tblGrid>${bodyRows}
    </w:tbl>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="850" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
        }

        function buildDocxCell(value, width, isHeader) {
            const content = String(value || '').split(/\n+/).map(part => escapeXml(part)).filter(Boolean);
            const runs = (content.length ? content : ['']).map((part, index) => {
                const prefix = index > 0 ? '<w:br/>' : '';
                return `${prefix}<w:t xml:space="preserve">${part}</w:t>`;
            }).join('');

            return `
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="${width}" w:type="dxa"/>
                        ${isHeader ? '<w:shd w:fill="F5F3FF"/>' : ''}
                    </w:tcPr>
                    <w:p>
                        <w:r>
                            ${isHeader ? '<w:rPr><w:b/></w:rPr>' : ''}
                            ${runs}
                        </w:r>
                    </w:p>
                </w:tc>`;
        }

        function escapeXml(value) {
            return String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        }

        function handleImport(event) {
            const file = event.target.files[0];
            if (!file) return;

            const ext = file.name.split('.').pop().toLowerCase();

            if (ext === 'docx') {
                const reader = new FileReader();
                reader.onload = function(loadEvent) {
                    const arrayBuffer = loadEvent.target.result;

                    mammoth.convertToHtml({ arrayBuffer }).then((result) => {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = result.value;

                        const table = tempDiv.querySelector('table');
                        if (table) {
                            const rows = [];
                            table.querySelectorAll('tr').forEach((tr) => {
                                const row = [];
                                tr.querySelectorAll('td, th').forEach((cell) => row.push(cell.innerText.trim()));
                                if (row.length >= 3) rows.push(row);
                            });
                            processParsedData(rows);
                        } else {
                            return mammoth.extractRawText({ arrayBuffer }).then((res) => {
                                processParsedData(parseCSV(res.value));
                            });
                        }
                    }).catch((error) => {
                        alert('Ошибка чтения Word-файла. Проверь, что это именно .docx');
                        console.error(error);
                    });
                };
                reader.readAsArrayBuffer(file);
            } else {
                const reader = new FileReader();
                reader.onload = function(loadEvent) {
                    processParsedData(parseCSV(loadEvent.target.result));
                };
                reader.readAsText(file);
            }

            event.target.value = '';
        }

        function processParsedData(rows) {
            if (!rows || rows.length === 0) {
                alert('Не удалось найти данные. Проверь, что в файле есть таблица или CSV-текст.');
                return;
            }

            let startIdx = 0;
            if (rows[0][0] && rows[0][0].toLowerCase().includes('название')) {
                startIdx = 1;
            }

            const newMilestones = [];
            for (let i = startIdx; i < rows.length; i++) {
                const row = rows[i];
                if (row.length < 3) continue;

                newMilestones.push({
                    id: Date.now() + i,
                    title: row[0] || 'Без названия',
                    desc: row[1] || '',
                    status: mapStatusToCode(row[2]),
                    date: row[3] || ''
                });
            }

            if (!newMilestones.length) {
                alert('Не удалось распознать структуру данных в файле.');
                return;
            }

            const replace = confirm('Заменить текущую дорожную карту данными из файла?\n\nОК - заменить всё\nОтмена - добавить в конец');
            milestones = replace ? newMilestones : milestones.concat(newMilestones);
            editingId = null;
            syncDetailDataWithMilestones();
            saveToStorage();
            ensureActiveDetailState();
            render();

            const wrapper = document.getElementById('scrollWrapper');
            setTimeout(() => {
                if (isMobileView()) {
                    wrapper.scrollTo({ top: replace ? 0 : wrapper.scrollHeight, behavior: 'smooth' });
                } else {
                    wrapper.scrollTo({ left: replace ? 0 : wrapper.scrollWidth, behavior: 'smooth' });
                }
            }, 80);
        }

        function parseCSV(text) {
            const result = [];
            let row = [];
            let inQuotes = false;
            let currentValue = '';

            for (let i = 0; i < text.length; i++) {
                const char = text[i];

                if (char === '"') {
                    if (inQuotes && text[i + 1] === '"') {
                        currentValue += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    row.push(currentValue.trim());
                    currentValue = '';
                } else if (char === '\n' && !inQuotes) {
                    row.push(currentValue.trim());
                    if (row.length > 1 || row[0] !== '') result.push(row);
                    row = [];
                    currentValue = '';
                } else if (char !== '\r') {
                    currentValue += char;
                }
            }

            if (currentValue !== '' || row.length > 0) {
                row.push(currentValue.trim());
                result.push(row);
            }

            return result;
        }

        function mapStatusToCode(value) {
            if (!value) return 'planned';
            const s = String(value).toLowerCase().trim();
            if (s.includes('завершено') || s.includes('сделано') || s.includes('готово')) return 'done';
            if (s.includes('работе') || s.includes('процессе')) return 'progress';
            return 'planned';
        }

        function escapeHTML(value) {
            return String(value).replace(/[&<>'"]/g, (char) => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[char] || char));
        }

        function slugify(value) {
            return String(value)
                .toLowerCase()
                .replace(/[^a-z0-9а-яё]+/gi, '_')
                .replace(/^_+|_+$/g, '') || 'roadmap';
        }

        function debounce(fn, wait) {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => fn(...args), wait);
            };
        }

        function setupPanScroll() {
            const slider = document.getElementById('scrollWrapper');
            if (!slider) return;

            if (window.matchMedia('(max-width: 920px)').matches) {
                slider.onmousedown = null;
                slider.onmousemove = null;
                slider.onmouseup = null;
                slider.onmouseleave = null;
                slider.onwheel = null;
                slider.style.cursor = 'default';
                return;
            }

            let isDown = false;
            let startX = 0;
            let scrollLeft = 0;

            slider.style.cursor = 'grab';

            slider.onmousedown = (event) => {
                if (event.target.closest('.card') || event.target.closest('button') || event.target.closest('a')) return;
                isDown = true;
                slider.style.cursor = 'grabbing';
                startX = event.pageX - slider.offsetLeft;
                scrollLeft = slider.scrollLeft;
            };

            slider.onmouseleave = () => {
                isDown = false;
                slider.style.cursor = 'grab';
            };

            slider.onmouseup = () => {
                isDown = false;
                slider.style.cursor = 'grab';
            };

            slider.onmousemove = (event) => {
                if (!isDown) return;
                const x = event.pageX - slider.offsetLeft;
                const walk = (x - startX) * 1.75;
                slider.scrollLeft = scrollLeft - walk;
            };

            slider.onwheel = (event) => {
                if (event.target.closest('.edit-form textarea')) {
                    return;
                }

                if (event.target.closest('.card-desc')) {
                    return;
                }

                const hasVerticalOverflow = slider.scrollHeight > slider.clientHeight + 2;
                const hasHorizontalOverflow = slider.scrollWidth > slider.clientWidth + 2;
                const mostlyVertical = Math.abs(event.deltaY) > Math.abs(event.deltaX);

                if (event.shiftKey && hasHorizontalOverflow) {
                    event.preventDefault();
                    slider.scrollLeft += event.deltaY || event.deltaX;
                    return;
                }

                if (mostlyVertical && hasVerticalOverflow) {
                    return;
                }

                if (mostlyVertical && hasHorizontalOverflow) {
                    event.preventDefault();
                    slider.scrollLeft += event.deltaY;
                }
            };
        }


        if (IS_DRAFT_MODE) {
            const subtitleEl = document.querySelector('.subtitle');
            const workspaceTitle = document.querySelector('.workspace-title');
            if (subtitleEl) subtitleEl.textContent = 'Черновик хранится локально в браузере. После сборки карты нажми «Сохранить HTML» и залей файл на GitHub.';
            if (workspaceTitle) workspaceTitle.textContent = 'Таймлайн черновика';
        }

        init();
