    (function () {
      const DRAFT_REGISTRY_KEY = 'healbe_roadmap_draft_registry';
      const DRAFT_RECORD_PREFIX = 'healbe_roadmap_draft_record_';
      const REPORT_REGISTRY_KEY = 'healbe_weekly_report_registry';
      const REPORT_RECORD_PREFIX = 'healbe_weekly_report_record_';
      const REPORT_BUILDER_PATH = './weekly-reports/weekly_workboard.html';
      const PUBLIC_REPORTS_PATH = './weekly-reports/reports.json';
      const EMBEDDED_PUBLIC_REPORTS = [
        {
          title: 'Недельный срез продуктовых работ Healbe',
          meta: 'Неделя №25 | 18 июня 2026',
          url: 'report.html?data=week-25_2026-06-18.json',
          updatedAt: '2026-06-18',
          taskCount: 22
        },
        {
          title: 'Недельный срез продуктовых работ Healbe',
          meta: 'Неделя №24 | 11 июня 2026',
          url: 'weekly_workboard_week-24_2026-06-11.html',
          updatedAt: '2026-06-11',
          taskCount: 22
        },
        {
          title: 'Недельный срез продуктовых работ Healbe',
          meta: 'Неделя №23 | 4 июня 2026',
          url: 'weekly_workboard_week-23_2026-06-04.html',
          updatedAt: '2026-06-04',
          taskCount: 21
        },
        {
          title: 'Недельный срез продуктовых работ Healbe',
          meta: 'Неделя №22 | 28 мая 2026',
          url: 'weekly_workboard_week-22_2026-05-28.html',
          updatedAt: '2026-05-28',
          taskCount: 21
        },
        {
          title: 'Недельный срез продуктовых работ Healbe',
          meta: 'Неделя №21 | 21 Мая 2026',
          url: 'weekly_workboard_week-21_2026-05-21.html',
          updatedAt: '2026-05-21',
          taskCount: 20
        },
        {
          title: 'Недельный срез продуктовых работ Healbe',
          meta: 'Неделя №20 | 14 Мая 2026',
          url: 'weekly_workboard_week-20_2026-05-14.html',
          updatedAt: '2026-05-14',
          taskCount: 21
        }
      ];
      let publicReportRegistry = [];

      function getCurrentFileName() {
        const raw = decodeURIComponent(window.location.pathname || '');
        return raw.split('/').pop() || 'index.html';
      }

      function guessBuilderPath() {
        const currentName = getCurrentFileName();
        if (!currentName) return './roadmap_builder.html';

        if (/^index/i.test(currentName)) {
          return `./${currentName.replace(/^index/i, 'roadmap_builder')}`;
        }

        return './roadmap_builder.html';
      }

      const BUILDER_PATH = guessBuilderPath();
      const siteCandidates = ['./site.html', './site_roadmap_healbe_soft_v2.html'];
      const releaseCandidates = ['./release_app.html', './release_app', './release_app_healbe_soft_v2.html'];

      const siteTopLink = document.getElementById('siteLinkTop');
      const siteCardLink = document.getElementById('siteLinkCard');
      const topLink = document.getElementById('releaseLinkTop');
      const cardLink = document.getElementById('releaseLinkCard');
      const draftGrid = document.getElementById('draftGrid');
      const reportGrid = document.getElementById('reportGrid');
      const reportSearchInput = document.getElementById('reportSearchInput');
      const draftModal = document.getElementById('draftModal');
      const draftTitleInput = document.getElementById('draftTitle');
      const draftForm = document.getElementById('draftForm');
      const reportModal = document.getElementById('reportModal');
      const reportTitleInput = document.getElementById('reportTitle');
      const reportMetaInput = document.getElementById('reportMeta');
      const reportForm = document.getElementById('reportForm');
      const latestReportLinks = Array.from(document.querySelectorAll('[data-latest-report-link="true"]'));

      function getRegistry() {
        try {
          const parsed = JSON.parse(localStorage.getItem(DRAFT_REGISTRY_KEY) || '[]');
          return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
          return [];
        }
      }

      function setRegistry(items) {
        localStorage.setItem(DRAFT_REGISTRY_KEY, JSON.stringify(items));
      }

      function getReportRegistry() {
        try {
          const parsed = JSON.parse(localStorage.getItem(REPORT_REGISTRY_KEY) || '[]');
          return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
          return [];
        }
      }

      function setReportRegistry(items) {
        localStorage.setItem(REPORT_REGISTRY_KEY, JSON.stringify(items));
      }

      function getRecordKey(id) {
        return `${DRAFT_RECORD_PREFIX}${id}`;
      }

      function getReportRecordKey(id) {
        return `${REPORT_RECORD_PREFIX}${id}`;
      }

      function getDraftRecord(id) {
        try {
          const parsed = JSON.parse(localStorage.getItem(getRecordKey(id)) || 'null');
          return parsed && typeof parsed === 'object' ? parsed : null;
        } catch (error) {
          return null;
        }
      }

      function slugify(value) {
        return String(value || 'roadmap')
          .toLowerCase()
          .replace(/[^a-z0-9а-яё]+/gi, '_')
          .replace(/^_+|_+$/g, '') || 'roadmap';
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

      function formatDate(value) {
        if (!value) return 'только что';
        if (isDateOnlyValue(value)) return formatDateOnly(value);
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'без даты';
        return new Intl.DateTimeFormat('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(date);
      }

      function isDateOnlyValue(value) {
        return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
      }

      function parseDateOnly(value) {
        const match = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return null;
        const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        return Number.isNaN(date.getTime()) ? null : date;
      }

      function formatDateOnly(value) {
        const date = parseDateOnly(value) || new Date(value);
        if (Number.isNaN(date.getTime())) return 'без даты';
        return new Intl.DateTimeFormat('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).format(date);
      }

      function getReportTimelineLabel(item) {
        const raw = item?.updatedAt || item?.createdAt || item?.date || '';
        if (item?.source === 'public' && isDateOnlyValue(raw)) {
          return `дата отчета: ${formatDateOnly(raw)}`;
        }

        return `обновлено: ${formatDate(raw)}`;
      }

      function getStats(record) {
        const milestones = Array.isArray(record?.milestones) ? record.milestones : [];
        return {
          total: milestones.length,
          done: milestones.filter(item => item.status === 'done').length,
          progress: milestones.filter(item => item.status === 'progress').length,
          planned: milestones.filter(item => item.status === 'planned').length
        };
      }

      function syncRegistry() {
        const registry = getRegistry();
        const next = [];

        registry.forEach((item) => {
          const record = getDraftRecord(item.id);
          if (!record) return;

          const stats = getStats(record);
          next.push({
            ...item,
            title: (record.title || item.title || '[Новая дорожная карта]').trim(),
            createdAt: record.createdAt || item.createdAt || Date.now(),
            updatedAt: record.updatedAt || item.updatedAt || item.createdAt || Date.now(),
            stats
          });
        });

        next.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        setRegistry(next);
        return next;
      }

      function renderDrafts() {
        const registry = syncRegistry();

        if (!registry.length) {
          draftGrid.innerHTML = `
            <div class="empty-box">
              <h3>Пока нет черновиков</h3>
              <p>
                Нажми «Создать новую дорожную карту», задай название и открой пустой таймлайн.
                Импорт DOCX / CSV доступен уже внутри редактора.
              </p>
              <div class="empty-actions">
                <button class="btn btn-primary" type="button" data-open-draft-modal="true">Создать первую дорожную карту</button>
              </div>
            </div>
          `;
          return;
        }

        draftGrid.innerHTML = registry.map((item) => `
          <article class="draft-card">
            <div class="draft-top">
              <span class="pill">Local draft</span>
              <h3>${escapeHTML(item.title)}</h3>
              <p>
                Локальный черновик для подготовки новой дорожной карты. После сборки структуры открой его и
                сохрани как отдельный HTML-файл для публикации.
              </p>

              <div class="draft-meta">
                <span class="meta-chip">обновлено: ${escapeHTML(formatDate(item.updatedAt))}</span>
                <span class="meta-chip">всего вех: ${item.stats.total}</span>
                <span class="status-chip done">сделано: ${item.stats.done}</span>
                <span class="status-chip progress">в работе: ${item.stats.progress}</span>
                <span class="status-chip planned">запланировано: ${item.stats.planned}</span>
              </div>
            </div>

            <div class="draft-bottom">
              <a class="btn btn-primary" href="${BUILDER_PATH}?draft=${encodeURIComponent(item.id)}">Открыть</a>
              <a class="btn btn-soft" href="${BUILDER_PATH}?draft=${encodeURIComponent(item.id)}&action=export">Экспорт HTML</a>
              <button class="btn btn-danger" type="button" data-delete-draft="${escapeHTML(item.id)}">Удалить</button>
            </div>
          </article>
        `).join('');
      }

      function syncReportRegistry() {
        const registry = getReportRegistry();
        const next = registry.map((item) => {
          let record = null;
          try {
            record = JSON.parse(localStorage.getItem(getReportRecordKey(item.id)) || 'null');
          } catch (error) {
            record = null;
          }

          const tasks = Array.isArray(record?.tasks) ? record.tasks : [];
          return {
            ...item,
            title: record?.title || item.title || 'Недельный отчет',
            meta: record?.meta || item.meta || '',
            taskCount: tasks.length || item.taskCount || 0,
            createdAt: record?.createdAt || item.createdAt || Date.now(),
            updatedAt: record?.updatedAt || item.updatedAt || item.createdAt || Date.now()
          };
        });

        next.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        setReportRegistry(next);
        return next;
      }

      function renderLocalReportsOnlyLegacy() {
        const registry = syncReportRegistry();
        const query = String(reportSearchInput?.value || '').trim().toLowerCase();
        const visibleRegistry = query
          ? registry.filter((item) => `${item.title || ''} ${item.meta || ''}`.toLowerCase().includes(query))
          : registry;

        if (!reportGrid) return;

        if (!registry.length) {
          reportGrid.innerHTML = `
            <div class="empty-box">
              <h3>Пока нет локальных недельных отчетов</h3>
              <p>
                Нажми «Создать отчет недели», укажи неделю и дату. Новый отчет откроется в доске отчетов
                с сохраненной структурой проектов и пустым блоком «Сделано».
              </p>
              <div class="empty-actions">
                <button class="btn btn-primary" type="button" data-open-report-modal="true">Создать первый отчет</button>
              </div>
            </div>
          `;
          return;
        }

        if (!visibleRegistry.length) {
          reportGrid.innerHTML = `
            <div class="empty-box">
              <h3>Ничего не найдено</h3>
              <p>Попробуй другой номер недели, дату или часть названия отчета.</p>
            </div>
          `;
          return;
        }

        const [latest, ...archive] = visibleRegistry;
        const renderReportActions = (item) => `
          <a class="btn btn-primary" href="${REPORT_BUILDER_PATH}?report=${encodeURIComponent(item.id)}">Открыть</a>
          <button class="btn btn-danger" type="button" data-delete-report="${escapeHTML(item.id)}">Удалить</button>
        `;

        reportGrid.innerHTML = `
          <div class="report-stack">
            <article class="report-latest">
              <div class="report-row-title">
                <span class="pill">Последний отчет</span>
                <strong>${escapeHTML(latest.title)}</strong>
                <span>${escapeHTML(latest.meta || 'Неделя и дата не указаны')}</span>
                <div class="draft-meta">
                  <span class="meta-chip">${escapeHTML(getReportTimelineLabel(latest))}</span>
                  <span class="meta-chip">задач: ${Number(latest.taskCount || 0)}</span>
                </div>
              </div>
              <div class="report-row-actions">
                ${renderReportActions(latest)}
              </div>
            </article>

            <div class="report-archive-note">
              Архив ниже остается компактным даже при 52 отчетах в году: одна строка на неделю, без больших карточек.
            </div>

            <div class="report-list" aria-label="Архив недельных отчетов">
              ${archive.length ? archive.map((item) => `
                <article class="report-row">
                  <div class="report-row-title">
                    <strong>${escapeHTML(item.title)}</strong>
                    <span>${escapeHTML(item.meta || 'Неделя и дата не указаны')}</span>
                  </div>
                  <div class="report-cell">${escapeHTML(getReportTimelineLabel(item))}</div>
                  <div class="report-cell">задач: ${Number(item.taskCount || 0)}</div>
                  <div class="report-row-actions">
                    ${renderReportActions(item)}
                  </div>
                </article>
              `).join('') : `
                <div class="empty-box">
                  <h3>Архив пока пуст</h3>
                  <p>Когда появятся следующие недели, они будут добавляться сюда компактными строками.</p>
                </div>
              `}
            </div>
          </div>
        `;
      }

      function getReportSortTime(item) {
        const metaTime = parseReportMetaTime(item?.meta);
        if (metaTime) return metaTime;

        const urlTime = parseReportUrlTime(item?.url || item?.template);
        if (urlTime) return urlTime;

        const raw = item?.updatedAt || item?.createdAt || item?.date || 0;
        const numeric = Number(raw);
        if (Number.isFinite(numeric) && numeric > 0) return numeric;

        const date = new Date(raw);
        return Number.isNaN(date.getTime()) ? 0 : date.getTime();
      }

      function parseReportMetaTime(meta) {
        const source = String(meta || '').toLowerCase().replace(/ё/g, 'е');
        const match = source.match(/(\d{1,2})\s+([а-яa-z]+)\s+(\d{4})/i);
        if (!match) return 0;

        const months = {
          января: 0,
          февраль: 1,
          февраля: 1,
          март: 2,
          марта: 2,
          апрель: 3,
          апреля: 3,
          май: 4,
          мая: 4,
          июнь: 5,
          июня: 5,
          июль: 6,
          июля: 6,
          август: 7,
          августа: 7,
          сентябрь: 8,
          сентября: 8,
          октябрь: 9,
          октября: 9,
          ноябрь: 10,
          ноября: 10,
          декабрь: 11,
          декабря: 11
        };

        const month = months[match[2]];
        if (month === undefined) return 0;

        const date = new Date(Number(match[3]), month, Number(match[1]));
        return Number.isNaN(date.getTime()) ? 0 : date.getTime();
      }

      function parseReportUrlTime(url) {
        const match = String(url || '').match(/week[-_]?\d+[-_](\d{4})[-_](\d{2})[-_](\d{2})/i);
        if (!match) return 0;

        const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        return Number.isNaN(date.getTime()) ? 0 : date.getTime();
      }

      function resolvePublishedReportUrl(url) {
        const raw = String(url || '').trim();
        if (!raw) return '';
        if (/^(https?:|\.\/|\.\.\/|\/)/i.test(raw)) return raw;
        if (raw.startsWith('weekly-reports/')) return `./${raw}`;
        return `./weekly-reports/${raw.replace(/^\/+/, '')}`;
      }

      function normalizePublishedReport(item, index) {
        if (!item || typeof item !== 'object') return null;

        const url = resolvePublishedReportUrl(item.url || item.href || item.file || item.fileName);
        if (!url) return null;

        const updatedAt = item.updatedAt || item.date || item.createdAt || '';
        const createdAt = item.createdAt || updatedAt || '';
        return {
          id: item.id || `published_${index}_${url}`,
          title: item.title || 'Недельный отчет',
          meta: item.meta || item.subtitle || '',
          taskCount: Number(item.taskCount || item.tasks || 0) || 0,
          createdAt,
          updatedAt,
          url,
          source: 'public'
        };
      }

      async function loadPublicReports() {
        try {
          const response = await fetch(PUBLIC_REPORTS_PATH, { cache: 'no-store' });
          if (!response.ok) throw new Error(`reports.json ${response.status}`);

          const payload = await response.json();
          const list = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.reports)
              ? payload.reports
              : [];

          publicReportRegistry = list
            .map((item, index) => normalizePublishedReport(item, index))
            .filter(Boolean);
        } catch (error) {
          publicReportRegistry = EMBEDDED_PUBLIC_REPORTS
            .map((item, index) => normalizePublishedReport(item, index))
            .filter(Boolean);
        }
      }

      function normalizeReportIdentityPart(value) {
        return String(value || '')
          .toLowerCase()
          .replace(/ё/g, 'е')
          .replace(/\s+/g, ' ')
          .trim();
      }

      function getReportIdentityKey(item) {
        const meta = normalizeReportIdentityPart(item?.meta);
        const weekMatch = meta.match(/неделя\s*№?\s*(\d+)/i);
        const dateMatch = meta.match(/(\d{1,2})\s+[а-яa-z]+\s+(\d{4})/i);
        if (weekMatch) {
          return `week:${weekMatch[1]}:${dateMatch ? dateMatch[0] : ''}`;
        }

        const url = normalizeReportIdentityPart(item?.url || item?.template);
        const fileWeekMatch = url.match(/week[-_]?(\d+)[-_](\d{4})[-_](\d{2})[-_](\d{2})/i);
        if (fileWeekMatch) {
          return `file-week:${fileWeekMatch[1]}:${fileWeekMatch[2]}-${fileWeekMatch[3]}-${fileWeekMatch[4]}`;
        }

        const title = normalizeReportIdentityPart(item?.title);
        return `fallback:${title}:${meta}:${url}`;
      }

      function getCombinedReportRegistry() {
        const seen = new Set();
        const localItems = syncReportRegistry().map((item) => ({
          ...item,
          source: 'local'
        }));
        const combined = [];

        publicReportRegistry.forEach((item) => {
          const key = getReportIdentityKey(item);
          if (seen.has(key)) return;
          seen.add(key);
          combined.push(item);
        });

        localItems.forEach((item) => {
          const key = getReportIdentityKey(item);
          if (seen.has(key)) return;
          seen.add(key);
          combined.push(item);
        });

        return combined.sort((a, b) => getReportSortTime(b) - getReportSortTime(a));
      }

      function getReportOpenHref(item) {
        if (!item) return REPORT_BUILDER_PATH;
        if (item.source === 'public' && item.url) return item.url;
        return `${REPORT_BUILDER_PATH}?report=${encodeURIComponent(item.id)}`;
      }

      function updateLatestReportLinks(registry = getCombinedReportRegistry()) {
        const latestPublic = publicReportRegistry
          .slice()
          .sort((a, b) => getReportSortTime(b) - getReportSortTime(a))[0];
        const latest = latestPublic || (Array.isArray(registry) ? registry[0] : null);
        const href = getReportOpenHref(latest);

        latestReportLinks.forEach((link) => {
          const label = link.textContent.trim() || 'Открыть доску отчетов';
          link.href = href;
          link.setAttribute(
            'aria-label',
            latest ? `${label}: ${latest.meta || latest.title || 'недельный отчет'}` : label
          );
        });
      }

      function renderReports() {
        const registry = getCombinedReportRegistry();
        updateLatestReportLinks(registry);
        const query = String(reportSearchInput?.value || '').trim().toLowerCase();
        const visibleRegistry = query
          ? registry.filter((item) => `${item.title || ''} ${item.meta || ''} ${item.url || ''}`.toLowerCase().includes(query))
          : registry;

        if (!reportGrid) return;

        if (!registry.length) {
          reportGrid.innerHTML = `
            <div class="empty-box">
              <h3>Пока нет опубликованных недельных отчетов</h3>
              <p>
                Чтобы отчет появился у всех коллег, скачай JSON через “Подготовить публикацию”,
                положи его в <code>weekly-reports/data</code> и обнови <code>weekly-reports/reports.json</code>.
              </p>
              <div class="empty-actions">
                <button class="btn btn-primary" type="button" data-open-report-modal="true">Создать локальный отчет</button>
              </div>
            </div>
          `;
          return;
        }

        if (!visibleRegistry.length) {
          reportGrid.innerHTML = `
            <div class="empty-box">
              <h3>Ничего не найдено</h3>
              <p>Попробуй другой номер недели, дату или часть названия отчета.</p>
            </div>
          `;
          return;
        }

        const renderTaskCount = (item) => {
          const count = Number(item.taskCount || 0);
          return count > 0 ? `задач: ${count}` : 'задач: н/д';
        };

        const renderReportActions = (item) => {
          const openLink = `<a class="btn btn-primary" href="${escapeHTML(getReportOpenHref(item))}">Открыть</a>`;
          if (item.source === 'public') return openLink;

          return `${openLink}
            <button class="btn btn-danger" type="button" data-delete-report="${escapeHTML(item.id)}">Удалить</button>`;
        };

        const getReportStatusMeta = (item) => {
          if (item.source === 'local') {
            return { label: 'Локальный черновик', className: 'is-local' };
          }
          return hasLocalPublishedReportCopy(item)
            ? { label: 'Есть изменения', className: 'is-changed' }
            : { label: 'Опубликованный отчет', className: 'is-public' };
        };

        const renderReportStatusPill = (item) => {
          const status = getReportStatusMeta(item);
          return `<span class="pill report-source-pill ${status.className}">${status.label}</span>`;
        };

        const [latest, ...archive] = visibleRegistry;

        reportGrid.innerHTML = `
          <div class="report-stack">
            <article class="report-latest">
              <div class="report-row-title">
                ${renderReportStatusPill(latest)}
                <strong>${escapeHTML(latest.title)}</strong>
                <span>${escapeHTML(latest.meta || 'Неделя и дата не указаны')}</span>
                <div class="draft-meta">
                  <span class="meta-chip">${escapeHTML(getReportTimelineLabel(latest))}</span>
                  <span class="meta-chip">${renderTaskCount(latest)}</span>
                </div>
              </div>
              <div class="report-row-actions">
                ${renderReportActions(latest)}
              </div>
            </article>

            <div class="report-archive-note">
              Архив ниже остается компактным даже при 52 отчетах в году: одна строка на неделю, без больших карточек.
            </div>

            <div class="report-list" aria-label="Архив недельных отчетов">
              ${archive.length ? archive.map((item) => `
                <article class="report-row">
                  <div class="report-row-title">
                    ${renderReportStatusPill(item)}
                    <strong>${escapeHTML(item.title)}</strong>
                    <span>${escapeHTML(item.meta || 'Неделя и дата не указаны')}</span>
                  </div>
                  <div class="report-cell">${escapeHTML(getReportTimelineLabel(item))}</div>
                  <div class="report-cell">${renderTaskCount(item)}</div>
                  <div class="report-row-actions">
                    ${renderReportActions(item)}
                  </div>
                </article>
              `).join('') : `
                <div class="empty-box">
                  <h3>Архив пока пуст</h3>
                  <p>Когда появятся следующие недели, они будут добавляться сюда компактными строками.</p>
                </div>
              `}
            </div>
          </div>
        `;
      }

      function hasLocalPublishedReportCopy(item) {
        if (!item || item.source !== 'public') return false;
        const dataFile = getReportDataFileName(item.url);
        if (!dataFile) return false;
        try {
          return Boolean(localStorage.getItem(getPublishedReportStorageKey(dataFile)));
        } catch (error) {
          return false;
        }
      }

      function getReportDataFileName(url) {
        try {
          const resolved = new URL(resolvePublishedReportUrl(url), window.location.href);
          const file = String(resolved.searchParams.get('data') || '').trim();
          return /^[a-z0-9_.-]+\.json$/i.test(file) ? file : '';
        } catch (error) {
          return '';
        }
      }

      function getPublishedReportStorageKey(dataFile) {
        return 'weekly_workboard_report_data_' + String(dataFile || '').replace(/[^a-z0-9_-]/gi, '_');
      }

      async function resolveLink(candidates, links) {
        for (const candidate of candidates) {
          try {
            const response = await fetch(candidate, { method: 'HEAD', cache: 'no-store' });
            if (response.ok) {
              links.forEach((link) => {
                if (link) link.href = candidate;
              });
              return;
            }
          } catch (error) {
          }
        }
      }

      async function resolveReleaseLink() {
        await resolveLink(siteCandidates, [siteTopLink, siteCardLink]);
        await resolveLink(releaseCandidates, [topLink, cardLink]);
      }

      function openModal() {
        draftModal.classList.add('is-open');
        draftModal.setAttribute('aria-hidden', 'false');
        setTimeout(() => draftTitleInput.focus(), 40);
      }

      function closeModal() {
        draftModal.classList.remove('is-open');
        draftModal.setAttribute('aria-hidden', 'true');
      }

      function openReportModal() {
        if (!reportModal) return;
        if (reportMetaInput && !reportMetaInput.value.trim()) {
          reportMetaInput.value = guessNextReportMeta();
        }
        reportModal.classList.add('is-open');
        reportModal.setAttribute('aria-hidden', 'false');
        setTimeout(() => reportMetaInput?.focus(), 40);
      }

      function closeReportModal() {
        if (!reportModal) return;
        reportModal.classList.remove('is-open');
        reportModal.setAttribute('aria-hidden', 'true');
      }

      function guessNextReportMeta() {
        const reports = getCombinedReportRegistry();
        const latest = reports.slice().sort((a, b) => getReportSortTime(b) - getReportSortTime(a))[0];
        const source = String(latest?.meta || '').trim();
        const weekMatch = source.match(/Неделя\s*№?\s*(\d+)/i);
        const nextWeek = weekMatch ? Number(weekMatch[1]) + 1 : getIsoWeekNumber(getNextThursday(new Date()));
        const sourceDate = parseReportMetaDate(source);
        const nextDate = sourceDate ? addDays(sourceDate, 7) : getNextThursday(new Date());
        return `Неделя №${nextWeek} | ${formatRussianReportDate(nextDate)}`;
      }

      function parseReportMetaDate(meta) {
        const source = String(meta || '').toLowerCase().replace(/ё/g, 'е');
        const match = source.match(/(\d{1,2})\s+([а-яa-z]+)\s+(\d{4})/i);
        if (!match) return null;

        const month = getRussianMonthIndex(match[2]);
        if (month === null) return null;

        const date = new Date(Number(match[3]), month, Number(match[1]));
        return Number.isNaN(date.getTime()) ? null : date;
      }

      function getRussianMonthIndex(monthName) {
        const months = {
          января: 0,
          февраль: 1,
          февраля: 1,
          март: 2,
          марта: 2,
          апрель: 3,
          апреля: 3,
          май: 4,
          мая: 4,
          июнь: 5,
          июня: 5,
          июль: 6,
          июля: 6,
          август: 7,
          августа: 7,
          сентябрь: 8,
          сентября: 8,
          октябрь: 9,
          октября: 9,
          ноябрь: 10,
          ноября: 10,
          декабрь: 11,
          декабря: 11
        };
        const index = months[String(monthName || '').toLowerCase().replace(/ё/g, 'е')];
        return index === undefined ? null : index;
      }

      function addDays(date, days) {
        const next = new Date(date);
        next.setDate(next.getDate() + days);
        return next;
      }

      function getNextThursday(date) {
        const next = new Date(date);
        const currentDay = next.getDay();
        const targetDay = 4;
        let diff = (targetDay - currentDay + 7) % 7;
        if (diff === 0) diff = 7;
        next.setDate(next.getDate() + diff);
        return next;
      }

      function getIsoWeekNumber(date) {
        const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNumber = target.getUTCDay() || 7;
        target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
        const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
        return Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
      }

      function formatRussianReportDate(date) {
        const months = [
          'января',
          'февраля',
          'марта',
          'апреля',
          'мая',
          'июня',
          'июля',
          'августа',
          'сентября',
          'октября',
          'ноября',
          'декабря'
        ];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
      }

      function createDraft(title) {
        const id = `draft_${Date.now()}`;
        const cleanTitle = (title || '[Новая дорожная карта]').trim() || '[Новая дорожная карта]';
        const now = Date.now();
        const record = {
          id,
          title: cleanTitle,
          milestones: [],
          createdAt: now,
          updatedAt: now,
          stats: { total: 0, done: 0, progress: 0, planned: 0 }
        };

        localStorage.setItem(getRecordKey(id), JSON.stringify(record));
        const registry = getRegistry();
        registry.unshift({
          id,
          title: cleanTitle,
          createdAt: now,
          updatedAt: now,
          fileName: `${slugify(cleanTitle)}.html`,
          stats: record.stats
        });
        setRegistry(registry);
        localStorage.setItem('healbe_roadmap_last_hub', getCurrentFileName());
        location.href = `${BUILDER_PATH}?draft=${encodeURIComponent(id)}`;
      }

      async function createReport(title, meta) {
        const id = `report_${Date.now()}`;
        const cleanTitle = (title || 'Недельный срез продуктовых работ Healbe').trim() || 'Недельный срез продуктовых работ Healbe';
        const cleanMeta = (meta || '').trim() || 'Неделя №20 | 14 мая 2026';
        const now = Date.now();
        const seedState = await buildNextReportSeedState(cleanTitle, cleanMeta);
        const record = {
          id,
          title: cleanTitle,
          meta: cleanMeta,
          createdAt: now,
          updatedAt: now,
          taskCount: Array.isArray(seedState?.tasks) ? seedState.tasks.length : 0,
          template: 'weekly-reports/weekly_workboard.html',
          resetWeeklyDone: true,
          ...(seedState || {})
        };

        localStorage.setItem(getReportRecordKey(id), JSON.stringify(record));
        const registry = getReportRegistry();
        registry.unshift(record);
        setReportRegistry(registry);
        location.href = `${REPORT_BUILDER_PATH}?report=${encodeURIComponent(id)}`;
      }

      async function buildNextReportSeedState(title, meta) {
        if (!publicReportRegistry.length) {
          await loadPublicReports();
        }

        const latestPublic = publicReportRegistry
          .slice()
          .sort((a, b) => getReportSortTime(b) - getReportSortTime(a))[0];
        const latest = latestPublic || getCombinedReportRegistry()[0];
        const sourceState = await loadReportStateFromRegistryItem(latest);
        if (!sourceState) return null;

        const sourceReportDate = parseReportMetaDate(sourceState.meta || latest?.meta || '');
        const targetReportDate = parseReportMetaDate(meta);
        const archiveCompletedDate = sourceReportDate || (targetReportDate ? addDays(targetReportDate, -7) : null);
        const archiveCompletedAt = archiveCompletedDate ? formatDateOnly(archiveCompletedDate) : '';

        return {
          ...sourceState,
          title,
          meta,
          tasks: Array.isArray(sourceState.tasks)
            ? sourceState.tasks.map((task) => {
              const nextTask = {
                ...task,
                artifactNote: '',
                focus: '',
                ceoFocus: ''
              };
              if (String(nextTask.status || '').trim().toLowerCase() === 'done' && archiveCompletedAt) {
                nextTask.completedAt = archiveCompletedAt;
              }
              return nextTask;
            })
            : [],
          directions: Array.isArray(sourceState.directions) ? sourceState.directions : []
        };
      }

      async function loadReportStateFromRegistryItem(item) {
        if (!item) return null;

        if (item.source === 'local') {
          const localState = readLocalReportState(item.id);
          if (localState) return localState;
        }

        if (item.url) {
          const fetchedState = await fetchReportStateFromHtml(item.url);
          if (fetchedState) return fetchedState;
        }

        return null;
      }

      function readLocalReportState(id) {
        if (!id) return null;
        try {
          const record = JSON.parse(localStorage.getItem(getReportRecordKey(id)) || 'null');
          return record && Array.isArray(record.tasks) && record.tasks.length ? record : null;
        } catch (error) {
          return null;
        }
      }

      async function fetchReportStateFromHtml(url) {
        try {
          const dataUrl = resolveReportDataUrl(url);
          if (dataUrl) {
            const dataResponse = await fetch(dataUrl, { cache: 'no-store' });
            if (!dataResponse.ok) return null;
            const dataState = await dataResponse.json();
            return dataState && Array.isArray(dataState.tasks) ? dataState : null;
          }

          const response = await fetch(url, { cache: 'no-store' });
          if (!response.ok) return null;
          return extractWorkboardStateFromHtml(await response.text());
        } catch (error) {
          return null;
        }
      }

      function resolveReportDataUrl(url) {
        try {
          const resolved = new URL(url, window.location.href);
          const dataFile = String(resolved.searchParams.get('data') || '').trim();
          if (!/^[a-z0-9_.-]+\.json$/i.test(dataFile)) return '';
          if (!/\/report\.html$/i.test(resolved.pathname)) return '';
          return new URL(`data/${dataFile}`, resolved).href;
        } catch (error) {
          return '';
        }
      }

      function extractWorkboardStateFromHtml(html) {
        const marker = 'window.__WORKBOARD_EXPORTED_STATE__=';
        const start = String(html || '').indexOf(marker);
        if (start < 0) return null;

        const jsonStart = start + marker.length;
        const end = String(html).indexOf(';<\/script>', jsonStart);
        if (end < 0) return null;

        try {
          const state = JSON.parse(String(html).slice(jsonStart, end));
          return state && Array.isArray(state.tasks) ? state : null;
        } catch (error) {
          return null;
        }
      }

      function deleteDraft(id) {
        const ok = confirm('Удалить этот локальный черновик?');
        if (!ok) return;

        localStorage.removeItem(getRecordKey(id));
        const next = getRegistry().filter(item => item.id !== id);
        setRegistry(next);
        renderDrafts();
      }

      function deleteReport(id) {
        const ok = confirm('Удалить этот локальный недельный отчет?');
        if (!ok) return;

        localStorage.removeItem(getReportRecordKey(id));
        const next = getReportRegistry().filter(item => item.id !== id);
        setReportRegistry(next);
        renderReports();
      }

      document.addEventListener('click', (event) => {
        const draftLink = event.target.closest('a[href*="roadmap_builder"]');
        if (draftLink) {
          localStorage.setItem('healbe_roadmap_last_hub', getCurrentFileName());
        }

        const openTrigger = event.target.closest('[data-open-draft-modal="true"]');
        if (openTrigger) {
          openModal();
          return;
        }

        const openReportTrigger = event.target.closest('[data-open-report-modal="true"]');
        if (openReportTrigger) {
          openReportModal();
          return;
        }

        const deleteTrigger = event.target.closest('[data-delete-draft]');
        if (deleteTrigger) {
          deleteDraft(deleteTrigger.getAttribute('data-delete-draft'));
          return;
        }

        const deleteReportTrigger = event.target.closest('[data-delete-report]');
        if (deleteReportTrigger) {
          deleteReport(deleteReportTrigger.getAttribute('data-delete-report'));
          return;
        }

        if (event.target === draftModal) {
          closeModal();
        }

        if (event.target === reportModal) {
          closeReportModal();
        }
      });

      document.getElementById('createDraftBtnTop').addEventListener('click', openModal);
      document.getElementById('createDraftBtnSection').addEventListener('click', openModal);
      document.getElementById('closeDraftModal').addEventListener('click', closeModal);
      document.getElementById('createReportBtnTop')?.addEventListener('click', openReportModal);
      document.getElementById('createReportBtnSection')?.addEventListener('click', openReportModal);
      document.getElementById('closeReportModal')?.addEventListener('click', closeReportModal);
      reportSearchInput?.addEventListener('input', renderReports);

      draftForm.addEventListener('submit', (event) => {
        event.preventDefault();
        createDraft(draftTitleInput.value);
      });

      reportForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        createReport(reportTitleInput.value, reportMetaInput.value);
      });

      window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && draftModal.classList.contains('is-open')) {
          closeModal();
        }
        if (event.key === 'Escape' && reportModal?.classList.contains('is-open')) {
          closeReportModal();
        }
      });

      resolveReleaseLink();
      renderReports();
      loadPublicReports().finally(renderReports);
      renderDrafts();
    })();
