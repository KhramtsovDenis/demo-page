(function () {
    const state = {
        report: null,
        reportDataFile: "",
        snapshot: null,
        selectedDiffIds: new Set(),
        seenDiffIds: new Set(),
        lastDiffEntries: [],
        pendingDefaultSelection: false
    };

    const PATCH_FILE_TYPE = "healbe-weekly-report-patch";
    const PATCH_BASE_VERSION = 1;
    const DEFAULT_SELECTED_GROUP_IDS = new Set(["releaseDate", "progress"]);
    const PATCH_TRACKED_FIELDS = [
        "title",
        "domain",
        "owner",
        "description",
        "releaseDate",
        "releaseNumber",
        "status",
        "completedAt",
        "releaseProgress",
        "weeklyProgress",
        "actualHours",
        "plannedHours",
        "artifactTitle",
        "artifactNote",
        "focus",
        "summary",
        "ceoFocus",
        "achievements"
    ];

    const els = {
        reportTitle: document.querySelector("[data-report-title]"),
        taskCount: document.querySelector("[data-task-count]"),
        keyCount: document.querySelector("[data-key-count]"),
        matchCount: document.querySelector("[data-match-count]"),
        diffBody: document.querySelector("[data-diff-body]"),
        diffSections: document.querySelector("[data-diff-sections]"),
        changeCards: document.querySelector("[data-change-cards]"),
        missingKeys: document.querySelector("[data-missing-keys]"),
        weeklyNotes: document.querySelector("[data-weekly-notes]"),
        snapshotInput: document.getElementById("snapshotInput"),
        statusMessage: document.querySelector("[data-status-message]"),
        loadLatestButton: document.querySelector("[data-action='load-latest']"),
        selectedCount: document.querySelector("[data-selected-count]")
    };

    const diffGroups = [
        {
            id: "releaseDate",
            title: "Даты релиза",
            description: "Кандидаты на перенос из Jira-снимка в недельный отчет.",
            fields: [{ id: "releaseDate", label: "Дата релиза" }]
        },
        {
            id: "status",
            title: "Статусы",
            description: "По умолчанию не попадают в patch: статусы требуют отдельного решения.",
            fields: [{ id: "status", label: "Статус" }]
        },
        {
            id: "progress",
            title: "Готовность",
            description: "Проценты из Jira-снимка для обновления готовности в отчете.",
            fields: [{ id: "releaseProgress", label: "Готовность" }]
        },
        {
            id: "achievements",
            title: "Контрольные точки",
            description: "Самая чувствительная часть: здесь сначала нужен предпросмотр, потом применение.",
            fields: [{ id: "achievements", label: "Контрольные точки" }]
        },
        {
            id: "hours",
            title: "Часы",
            description: "Часы можно тестово включать в patch, если Jira-снимок уже посчитан по согласованным людям.",
            fields: [{ id: "actualHours", label: "Факт часов" }]
        },
        {
            id: "weeklyNotes",
            title: "Тезисы недели",
            description: "Комментарии weeklyNotes из Jira-снимка можно перенести в поле сделанного за неделю.",
            fields: [{ id: "weeklyNotes", label: "Тезисы недели" }]
        }
    ];

    els.loadLatestButton?.addEventListener("click", loadLatestReport);
    document.querySelector("[data-action='load-sample']")?.addEventListener("click", loadSampleSnapshot);
    document.querySelector("[data-action='load-week-36-snapshot']")?.addEventListener("click", loadWeek36Snapshot);
    document.querySelector("[data-action='download-template']")?.addEventListener("click", downloadTemplate);
    document.querySelector("[data-action='download-report-patch']")?.addEventListener("click", downloadReportPatch);
    document.querySelector("[data-action='download-jira-doc']")?.addEventListener("click", downloadJiraUpdateDocument);
    document.querySelector("[data-action='select-all-diffs']")?.addEventListener("click", selectAllDiffs);
    document.querySelector("[data-action='clear-diff-selection']")?.addEventListener("click", clearDiffSelection);
    document.querySelectorAll("[data-patch-group]").forEach((input) => {
        input.addEventListener("change", handleGroupSelectionChange);
    });
    els.diffSections?.addEventListener("change", handleDiffSelectionChange);
    els.changeCards?.addEventListener("click", handleChangeCardClick);
    els.snapshotInput?.addEventListener("change", handleSnapshotUpload);

    loadLatestReport();

    async function loadLatestReport() {
        setStatus("Загружаю последний отчет из weekly-reports/reports.json...", "info");
        setLoading(true);
        try {
            const reportsResponse = await fetch("./reports.json", { cache: "no-store" });
            if (!reportsResponse.ok) throw new Error(`reports.json ${reportsResponse.status}`);
            const reports = await reportsResponse.json();
            const latest = Array.isArray(reports) ? reports[0] : reports?.reports?.[0];
            if (!latest?.url) throw new Error("В reports.json не найден последний отчет.");

            const dataFile = extractDataFile(latest.url);
            if (!dataFile) throw new Error("Последний отчет должен быть в формате report.html?data=week-XX.json.");

            const dataResponse = await fetch(`./data/${encodeURIComponent(dataFile)}`, { cache: "no-store" });
            if (!dataResponse.ok) throw new Error(`data/${dataFile} ${dataResponse.status}`);
            state.report = await dataResponse.json();
            state.reportDataFile = dataFile;
            resetDiffSelection(false);
            render();
            setStatus(`Отчет загружен: ${state.report?.meta || dataFile}. Теперь можно загрузить пример или Jira-снимок.`, "ok");
        } catch (error) {
            const message = error.message || "Не удалось загрузить отчет.";
            setStatus(message, "error");
            showTableMessage(message);
        } finally {
            setLoading(false);
        }
    }

    function extractDataFile(url) {
        try {
            const parsed = new URL(url, window.location.href);
            const file = parsed.searchParams.get("data") || "";
            return /^[a-z0-9_.-]+\.json$/i.test(file) ? file : "";
        } catch (error) {
            return "";
        }
    }

    async function handleSnapshotUpload(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        setStatus(`Читаю Jira-снимок: ${file.name}...`, "info");
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            state.snapshot = normalizeSnapshot(parsed);
            resetDiffSelection(true);
            render();
            setStatus(`Jira-снимок загружен: ${state.snapshot.items.length} задач.`, "ok");
        } catch (error) {
            const message = error.message || "Не удалось прочитать Jira-снимок.";
            setStatus(message, "error");
            showTableMessage(message);
        } finally {
            event.target.value = "";
        }
    }

    async function loadSampleSnapshot() {
        setStatus("Загружаю пример Jira-снимка...", "info");
        try {
            const response = await fetch("./data/jira-sync-sample_week-36.json", { cache: "no-store" });
            if (!response.ok) throw new Error(`jira-sync-sample_week-36.json ${response.status}`);
            state.snapshot = normalizeSnapshot(await response.json());
            resetDiffSelection(true);
            render();
            setStatus(`Пример загружен: ${state.snapshot.items.length} задач.`, "ok");
        } catch (error) {
            const message = error.message || "Не удалось загрузить пример Jira-снимка.";
            setStatus(message, "error");
            showTableMessage(message);
        }
    }

    async function loadWeek36Snapshot() {
        await loadSnapshotFromUrl("./data/jira-sync-snapshot_week-36_2026-09-03.json", "Jira-снимок 36 недели");
    }

    async function loadSnapshotFromUrl(url, label) {
        setStatus(`Загружаю ${label}...`, "info");
        try {
            const response = await fetch(url, { cache: "no-store" });
            if (!response.ok) throw new Error(`${url} ${response.status}`);
            state.snapshot = normalizeSnapshot(await response.json());
            resetDiffSelection(true);
            render();
            setStatus(`${label} загружен: ${state.snapshot.items.length} задач.`, "ok");
        } catch (error) {
            const message = error.message || `Не удалось загрузить ${label}.`;
            setStatus(message, "error");
            showTableMessage(message);
        }
    }

    function setStatus(message, type) {
        if (!els.statusMessage) return;
        els.statusMessage.innerHTML = escapeHtml(message);
        els.statusMessage.classList.toggle("is-ok", type === "ok");
        els.statusMessage.classList.toggle("is-error", type === "error");
    }

    function setLoading(isLoading) {
        if (!els.loadLatestButton) return;
        els.loadLatestButton.disabled = isLoading;
        els.loadLatestButton.textContent = isLoading ? "Загружаю..." : "Загрузить последнюю неделю";
    }

    function resetDiffSelection(useDefaultSelection = false) {
        state.selectedDiffIds = new Set();
        state.seenDiffIds = new Set();
        state.lastDiffEntries = [];
        state.pendingDefaultSelection = useDefaultSelection;
    }

    function normalizeSnapshot(input) {
        const rawItems = Array.isArray(input) ? input : Array.isArray(input?.items) ? input.items : [];
        return {
            generatedAt: input?.generatedAt || "",
            items: rawItems
                .map((item) => ({
                    key: String(item.key || "").trim().toUpperCase(),
                    title: String(item.title || item.summary || "").trim(),
                    status: normalizeString(item.status),
                    actualHours: normalizeNumber(item.actualHours),
                    releaseDate: normalizeDateString(item.releaseDate),
                    releaseProgress: normalizeNumber(item.releaseProgress),
                    achievements: normalizeMilestones(item.achievements || item.milestones),
                    weeklyNotes: normalizeNotes(item.weeklyNotes || item.notes)
                }))
                .filter((item) => item.key)
        };
    }

    function normalizeMilestones(value) {
        if (!Array.isArray(value)) return null;
        return value.map((item) => ({
            date: normalizeDateString(item.date),
            text: normalizeString(item.text || item.summary || item.title),
            status: normalizeString(item.status),
            progress: normalizeNumber(item.progress)
        }));
    }

    function normalizeNotes(value) {
        if (!Array.isArray(value)) return [];
        return value.map((item) => String(item || "").trim()).filter(Boolean);
    }

    function normalizeString(value) {
        const next = String(value ?? "").trim();
        return next || null;
    }

    function normalizeDateString(value) {
        const raw = String(value ?? "").trim();
        if (!raw) return null;
        const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (iso) return `${iso[3]}.${iso[2]}.${iso[1]}`;
        return raw;
    }

    function normalizeNumber(value) {
        if (value === "" || value === null || typeof value === "undefined") return null;
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    function render() {
        const context = getSyncContext();

        els.reportTitle.textContent = state.report?.meta || state.report?.title || "не загружен";
        els.taskCount.textContent = String(context.tasks.length);
        els.keyCount.textContent = String(context.keyedRows.length);
        els.matchCount.textContent = String(context.matchedRows.length);

        const diffEntries = buildDiffEntries(context);
        state.lastDiffEntries = diffEntries;
        syncDiffSelection(diffEntries);
        renderChangeCards(diffEntries);
        renderDiffs(diffEntries);
        updateSelectionUi(diffEntries);
        renderMissingKeys(context.taskRows);
        renderWeeklyNotes(context.matchedRows, context.snapshotByKey);
    }

    function getSyncContext() {
        const allTasks = Array.isArray(state.report?.tasks) ? state.report.tasks : [];
        const tasks = allTasks.filter(isSyncCandidate);
        const taskRows = tasks.map((task) => ({ task, keys: extractJiraKeys(task) }));
        const keyedRows = taskRows.filter((row) => row.keys.length);
        const snapshotItems = state.snapshot?.items || [];
        const snapshotByKey = new Map(snapshotItems.map((item) => [item.key, item]));
        const matchedRows = keyedRows
            .map((row) => ({ ...row, keys: resolveMatchedJiraKeys(row.keys, snapshotByKey) }))
            .filter((row) => row.keys.length);
        return { tasks, taskRows, keyedRows, snapshotByKey, matchedRows };
    }

    function isSyncCandidate(task) {
        if (!task || typeof task !== "object") return false;
        const status = String(task.status || "").trim().toLowerCase();
        if (status === "done" || status === "completed" || status === "archived") return false;
        if (task.hidden === true || task.archived === true) return false;
        if (String(task.completedAt || "").trim()) return false;
        return true;
    }

    function extractJiraKeys(task) {
        const source = `${task?.title || ""} ${task?.domain || ""}`;
        const matches = source.match(/[A-ZА-Я][A-ZА-Я0-9]{1,15}-\d+/gi) || [];
        const wildcardMatches = source.match(/[A-ZА-Я][A-ZА-Я0-9]{1,15}-\*/gi) || [];
        return Array.from(new Set([
            ...matches.map((key) => key.toUpperCase()),
            ...wildcardMatches.map((key) => key.toUpperCase())
        ]));
    }

    function resolveMatchedJiraKeys(keys, snapshotByKey) {
        const snapshotKeys = Array.from(snapshotByKey.keys());
        return Array.from(new Set(keys.flatMap((key) => {
            if (key.endsWith("-*")) {
                const prefix = key.slice(0, -1);
                return snapshotKeys.filter((snapshotKey) => snapshotKey.startsWith(prefix));
            }
            return snapshotByKey.has(key) ? [key] : [];
        })));
    }

    function buildDiffEntries(context) {
        if (!state.report || !state.snapshot) return [];
        const entries = [];
        context.matchedRows.forEach(({ task, keys }) => {
            const match = getJiraMatchForRow(keys, context.snapshotByKey);
            if (!match.item) return;
            const key = match.key;
            const jiraItem = match.item;
            diffGroups.forEach((group) => {
                group.fields.forEach((field) => {
                    if (!hasComparableValue(jiraItem, field.id)) return;
                    const currentValue = readReportValue(task, field.id);
                    const jiraValue = readJiraValue(jiraItem, field.id);
                    const same = stringifyComparable(currentValue) === stringifyComparable(jiraValue);
                    const reportField = field.id === "weeklyNotes" ? "artifactNote" : field.id;
                    entries.push({
                        id: buildDiffId(task, key, field.id),
                        groupId: group.id,
                        groupTitle: group.title,
                        fieldId: field.id,
                        reportField,
                        fieldLabel: field.label,
                        key,
                        task,
                        taskId: task.id,
                        taskTitle: task.title || jiraItem?.title || key,
                        currentValue,
                        jiraValue,
                        same,
                        readOnly: group.readOnly === true,
                        canPatch: !same && group.readOnly !== true
                    });
                });
            });
        });
        return entries;
    }

    function getJiraMatchForRow(keys, snapshotByKey) {
        const items = keys
            .map((key) => snapshotByKey.get(key))
            .filter(Boolean);
        if (items.length <= 1) {
            const item = items[0] || null;
            return { key: item?.key || keys[0] || "", item };
        }
        return {
            key: keys.join(", "),
            item: aggregateJiraItems(items)
        };
    }

    function aggregateJiraItems(items) {
        const achievements = items.flatMap((item) => Array.isArray(item.achievements) ? item.achievements : []);
        const weeklyNotes = items.flatMap((item) => Array.isArray(item.weeklyNotes) ? item.weeklyNotes : []);
        return {
            key: items.map((item) => item.key).join(", "),
            title: items.map((item) => item.title).filter(Boolean).join(", "),
            status: pickSameValue(items.map((item) => item.status)),
            actualHours: sumNumbers(items.map((item) => item.actualHours)),
            releaseDate: pickLatestDate(items.map((item) => item.releaseDate)),
            releaseProgress: pickSameValue(items.map((item) => item.releaseProgress)),
            achievements: achievements.length ? achievements : null,
            weeklyNotes
        };
    }

    function pickSameValue(values) {
        const normalized = values.filter((value) => value !== null && typeof value !== "undefined" && value !== "");
        const unique = Array.from(new Set(normalized.map((value) => stringifyComparable(value))));
        return unique.length === 1 ? normalized[0] : null;
    }

    function sumNumbers(values) {
        const numbers = values.filter((value) => Number.isFinite(Number(value))).map(Number);
        if (!numbers.length) return null;
        return Math.round(numbers.reduce((sum, value) => sum + value, 0) * 10) / 10;
    }

    function pickLatestDate(values) {
        const dated = values
            .map((value) => ({ value, time: getDateTime(value) }))
            .filter((item) => Number.isFinite(item.time))
            .sort((a, b) => b.time - a.time);
        return dated[0]?.value || null;
    }

    function getDateTime(value) {
        const raw = String(value || "").trim();
        const display = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (display) return new Date(Number(display[3]), Number(display[2]) - 1, Number(display[1])).getTime();
        const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])).getTime();
        return NaN;
    }

    function buildDiffId(task, key, fieldId) {
        return hashString(`${task?.id || ""}|${key || ""}|${fieldId || ""}`);
    }

    function syncDiffSelection(diffEntries) {
        const validIds = new Set(diffEntries.map((entry) => entry.id));
        state.selectedDiffIds = new Set(
            Array.from(state.selectedDiffIds).filter((id) => validIds.has(id))
        );

        const selectedGroups = state.pendingDefaultSelection
            ? DEFAULT_SELECTED_GROUP_IDS
            : getSelectedPatchGroups();
        diffEntries.forEach((entry) => {
            if (state.seenDiffIds.has(entry.id)) return;
            state.seenDiffIds.add(entry.id);
            if (entry.canPatch && selectedGroups.has(entry.groupId)) {
                state.selectedDiffIds.add(entry.id);
            }
        });
        state.pendingDefaultSelection = false;
    }

    function renderChangeCards(diffEntries) {
        if (!els.changeCards) return;

        if (!state.report) {
            els.changeCards.innerHTML = `<div class="empty-card">Сначала загрузите недельный отчет.</div>`;
            return;
        }

        if (!state.snapshot) {
            els.changeCards.innerHTML = `<div class="empty-card">Отчет загружен. Теперь загрузите Jira-снимок.</div>`;
            return;
        }

        const changedEntries = diffEntries.filter((entry) => !entry.same);
        if (!changedEntries.length) {
            els.changeCards.innerHTML = `<div class="empty-card">Отличий нет. Jira и отчет совпадают по загруженным полям.</div>`;
            return;
        }

        const groups = new Map();
        changedEntries.forEach((entry) => {
            const key = String(entry.taskId || entry.key);
            if (!groups.has(key)) {
                groups.set(key, {
                    taskTitle: entry.taskTitle,
                    jiraKey: entry.key,
                    entries: []
                });
            }
            groups.get(key).entries.push(entry);
        });

        els.changeCards.innerHTML = Array.from(groups.values())
            .sort((a, b) => String(a.taskTitle || "").localeCompare(String(b.taskTitle || ""), "ru"))
            .map(renderTaskChangeCard)
            .join("");
    }

    function renderTaskChangeCard(group) {
        return `
            <article class="change-card">
                <div class="change-card-head">
                    <div>
                        <h3>${escapeHtml(group.taskTitle)}</h3>
                        <p>${escapeHtml(group.jiraKey)}</p>
                    </div>
                    <span class="tag selected">${group.entries.length} измен.</span>
                </div>
                <div class="change-fields">
                    ${group.entries.map(renderChangeField).join("")}
                </div>
            </article>
        `;
    }

    function renderChangeField(entry) {
        const selected = state.selectedDiffIds.has(entry.id);
        const canToggle = entry.canPatch;
        const buttonLabel = selected ? "Jira" : "Снято";
        const title = canToggle
            ? "Нажмите, чтобы включить или убрать это изменение из patch"
            : "Это поле только для контроля";
        return `
            <section class="change-field ${selected ? "is-selected" : "is-muted"}">
                <div class="change-field-top">
                    <div>
                        <span>${escapeHtml(entry.groupTitle)}</span>
                        <strong>${escapeHtml(entry.fieldLabel)}</strong>
                    </div>
                    <button class="jira-cube ${selected ? "is-selected" : ""}" type="button" data-change-toggle="${escapeHtml(entry.id)}" ${canToggle ? "" : "disabled"} title="${escapeHtml(title)}">${escapeHtml(buttonLabel)}</button>
                </div>
                <div class="change-values">
                    <div>
                        <span>В отчете</span>
                        <p>${escapeHtml(formatValue(entry.currentValue))}</p>
                    </div>
                    <div>
                        <span>В Jira</span>
                        <p>${escapeHtml(formatValue(entry.jiraValue))}</p>
                    </div>
                </div>
            </section>
        `;
    }

    function handleChangeCardClick(event) {
        const button = event.target?.closest?.("[data-change-toggle]");
        if (!button || button.disabled) return;
        const id = button.dataset.changeToggle;
        if (!id) return;
        if (state.selectedDiffIds.has(id)) {
            state.selectedDiffIds.delete(id);
        } else {
            state.selectedDiffIds.add(id);
        }
        render();
    }

    function renderDiffs(diffEntries) {
        if (!state.report) {
            showDiffMessage("Сначала загрузите недельный отчет.");
            return;
        }

        if (!state.snapshot) {
            showDiffMessage("Отчет загружен. Теперь загрузите Jira-снимок.");
            return;
        }

        const rowsByGroup = new Map(diffGroups.map((group) => [group.id, []]));
        diffEntries.forEach((entry) => {
            rowsByGroup.get(entry.groupId)?.push(entry);
        });

        const groupMarkup = diffGroups
            .map((group) => renderDiffGroup(group, rowsByGroup.get(group.id) || []))
            .join("");

        els.diffSections.innerHTML = groupMarkup || `<div class="empty-card">Совпадения есть, но в Jira-снимке нет полей для сравнения.</div>`;
    }

    function renderDiffGroup(group, rows) {
        const changedCount = rows.filter((row) => !row.same).length;
        const sameCount = rows.length - changedCount;
        const selectableCount = rows.filter((row) => row.canPatch).length;
        const selectedCount = rows.filter((row) => state.selectedDiffIds.has(row.id)).length;
        return `
            <section class="diff-card ${group.readOnly ? "is-readonly" : ""}">
                <div class="diff-card-head">
                    <div>
                        <h3>${escapeHtml(group.title)}</h3>
                        <p>${escapeHtml(group.description)}</p>
                    </div>
                    <div class="diff-stats">
                        <span class="tag changed">${changedCount} отлич.</span>
                        <span class="tag same">${sameCount} совп.</span>
                        ${selectableCount ? `<span class="tag selected">${selectedCount} выбрано</span>` : ""}
                    </div>
                </div>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Выбор</th>
                                <th>Задача</th>
                                <th>Поле</th>
                                <th>В отчете</th>
                                <th>В Jira</th>
                                <th>Итог</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.length ? rows.map(renderDiffRow).join("") : `<tr><td colspan="6" class="empty">В Jira-снимке нет данных для этого блока.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    }

    function renderDiffRow(entry) {
        const selected = state.selectedDiffIds.has(entry.id);
        const statusLabel = entry.same
            ? "без изменений"
            : entry.readOnly
                ? "только контроль"
                : selected
                    ? "в patch"
                    : "не выбрано";
        const statusClass = entry.same
            ? "same"
            : entry.readOnly
                ? "readonly"
                : selected
                    ? "selected"
                    : "changed";
        const checkbox = entry.canPatch
            ? `<input type="checkbox" data-diff-select="${escapeHtml(entry.id)}" aria-label="Выбрать изменение ${escapeHtml(entry.fieldLabel)} для ${escapeHtml(entry.taskTitle)}" ${selected ? "checked" : ""}>`
            : `<span class="select-placeholder">-</span>`;
        return `
            <tr class="${entry.same ? "" : "is-different"}">
                <td class="select-cell">${checkbox}</td>
                <td><strong>${escapeHtml(entry.taskTitle)}</strong><br><small>${escapeHtml(entry.key)}</small></td>
                <td>${escapeHtml(entry.fieldLabel)}</td>
                <td class="value-cell">${escapeHtml(formatValue(entry.currentValue))}</td>
                <td class="value-cell">${escapeHtml(formatValue(entry.jiraValue))}</td>
                <td><span class="tag ${statusClass}">${statusLabel}</span></td>
            </tr>
        `;
    }

    function updateSelectionUi(diffEntries = state.lastDiffEntries) {
        const selectable = diffEntries.filter((entry) => entry.canPatch);
        const selected = selectable.filter((entry) => state.selectedDiffIds.has(entry.id));
        if (els.selectedCount) {
            els.selectedCount.textContent = `Выбрано: ${selected.length} из ${selectable.length}`;
        }
        syncGroupControls(diffEntries);
    }

    function syncGroupControls(diffEntries = state.lastDiffEntries) {
        document.querySelectorAll("[data-patch-group]").forEach((input) => {
            const groupRows = diffEntries.filter((entry) => entry.canPatch && entry.groupId === input.value);
            const selectedRows = groupRows.filter((entry) => state.selectedDiffIds.has(entry.id));
            input.disabled = groupRows.length === 0;
            input.checked = groupRows.length > 0 && selectedRows.length === groupRows.length;
            input.indeterminate = selectedRows.length > 0 && selectedRows.length < groupRows.length;
        });
    }

    function handleDiffSelectionChange(event) {
        const input = event.target?.closest?.("[data-diff-select]");
        if (!input) return;
        if (input.checked) {
            state.selectedDiffIds.add(input.dataset.diffSelect);
        } else {
            state.selectedDiffIds.delete(input.dataset.diffSelect);
        }
        render();
    }

    function handleGroupSelectionChange(event) {
        const input = event.currentTarget;
        const groupId = input.value;
        const groupRows = state.lastDiffEntries.filter((entry) => entry.canPatch && entry.groupId === groupId);
        groupRows.forEach((entry) => {
            if (input.checked) state.selectedDiffIds.add(entry.id);
            else state.selectedDiffIds.delete(entry.id);
        });
        render();
    }

    function selectAllDiffs() {
        state.lastDiffEntries.forEach((entry) => {
            if (entry.canPatch) state.selectedDiffIds.add(entry.id);
        });
        render();
        setStatus(`Выбраны все доступные изменения: ${state.selectedDiffIds.size}.`, "ok");
    }

    function clearDiffSelection() {
        state.lastDiffEntries.forEach((entry) => {
            if (entry.canPatch) state.selectedDiffIds.delete(entry.id);
        });
        render();
        setStatus("Выбор изменений снят.", "info");
    }

    function hasComparableValue(item, fieldId) {
        if (!item) return false;
        if (fieldId === "achievements") return Array.isArray(item.achievements);
        if (fieldId === "weeklyNotes") return Array.isArray(item.weeklyNotes) && item.weeklyNotes.length > 0;
        return item[fieldId] !== null && typeof item[fieldId] !== "undefined";
    }

    function readReportValue(task, fieldId) {
        if (fieldId === "achievements") return task.achievements || [];
        if (fieldId === "weeklyNotes") return task.artifactNote || "";
        return task[fieldId];
    }

    function readJiraValue(item, fieldId) {
        if (fieldId === "achievements") return item.achievements || [];
        if (fieldId === "weeklyNotes") return (item.weeklyNotes || []).join("\n");
        return item[fieldId];
    }

    function stringifyComparable(value) {
        return JSON.stringify(value ?? "");
    }

    function formatValue(value) {
        if (Array.isArray(value)) {
            if (!value.length) return "нет";
            return value.map((item) => {
                const date = item.date ? `${item.date} | ` : "";
                const progress = typeof item.progress === "number" ? ` | ${item.progress}%` : "";
                return `${date}${item.text || ""}${progress}`;
            }).join("\n");
        }
        if (value === null || typeof value === "undefined" || value === "") return "пусто";
        return String(value);
    }

    function renderMissingKeys(taskRows) {
        const missing = taskRows.filter((row) => !row.keys.length).map((row) => row.task?.title).filter(Boolean);
        els.missingKeys.innerHTML = missing.length
            ? missing.map((title) => `<li>${escapeHtml(title)}</li>`).join("")
            : "<li>Все задачи имеют Jira-ключ или похожий идентификатор.</li>";
    }

    function renderWeeklyNotes(matchedRows, snapshotByKey) {
        if (!state.snapshot) {
            els.weeklyNotes.innerHTML = "<li>Загрузите Jira-снимок с weeklyNotes.</li>";
            return;
        }

        const notes = [];
        matchedRows.forEach(({ task, keys }) => {
            const match = getJiraMatchForRow(keys, snapshotByKey);
            const key = match.key;
            const jiraItem = match.item;
            (jiraItem?.weeklyNotes || []).forEach((note) => {
                notes.push(`<li><strong>${escapeHtml(task.title || key)}</strong><br>${escapeHtml(note)}</li>`);
            });
        });

        els.weeklyNotes.innerHTML = notes.length
            ? notes.join("")
            : "<li>В совпавших задачах пока нет weeklyNotes.</li>";
    }

    function showTableMessage(message) {
        els.diffBody.innerHTML = `<tr><td colspan="6" class="empty">${escapeHtml(message)}</td></tr>`;
    }

    function showDiffMessage(message) {
        if (!els.diffSections) {
            showTableMessage(message);
            return;
        }

        els.diffSections.innerHTML = `
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Выбор</th>
                            <th>Задача</th>
                            <th>Поле</th>
                            <th>В отчете</th>
                            <th>В Jira</th>
                            <th>Итог</th>
                        </tr>
                    </thead>
                    <tbody data-diff-body>
                        <tr>
                            <td colspan="6" class="empty">${escapeHtml(message)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        els.diffBody = document.querySelector("[data-diff-body]");
    }

    function downloadReportPatch() {
        if (!state.report) {
            window.alert("Сначала загрузите недельный отчет.");
            return;
        }
        if (!state.snapshot) {
            window.alert("Сначала загрузите Jira-снимок.");
            return;
        }

        const selectedEntries = getSelectedPatchEntries();
        const patch = buildReportPatchPayload(selectedEntries);
        if (!patch.changes.length) {
            window.alert("Выберите хотя бы одно изменение. Patch не сформирован.");
            return;
        }

        downloadJson(buildReportPatchFilename(), patch);
        setStatus(`Patch сформирован: ${patch.summary.changedTasks} задач, ${patch.summary.changedFields} полей.`, "ok");
    }

    function buildReportPatchPayload(selectedEntries) {
        const changes = buildReportPatchChanges(selectedEntries);
        return {
            type: PATCH_FILE_TYPE,
            reportId: getPatchReportId(state.report),
            reportTitle: state.report?.title || "",
            reportMeta: state.report?.meta || "",
            baseVersion: PATCH_BASE_VERSION,
            baseHash: "",
            sourceHash: "",
            author: "jira-sync",
            createdAt: new Date().toISOString(),
            source: {
                type: "jira-sync-lab",
                reportDataFile: state.reportDataFile || "",
                snapshotGeneratedAt: state.snapshot?.generatedAt || ""
            },
            changes,
            potentialConflicts: [],
            summary: summarizePatchChanges(changes)
        };
    }

    function getSelectedPatchEntries() {
        return state.lastDiffEntries.filter((entry) => entry.canPatch && state.selectedDiffIds.has(entry.id));
    }

    function getSelectedPatchGroups() {
        return new Set(
            Array.from(document.querySelectorAll("[data-patch-group]:checked"))
                .map((input) => input.value)
                .filter(Boolean)
        );
    }

    function buildReportPatchChanges(selectedEntries) {
        const changesByTask = new Map();

        selectedEntries.forEach((entry) => {
            const mapKey = String(entry.taskId || entry.key);
            if (!changesByTask.has(mapKey)) {
                changesByTask.set(mapKey, {
                    task: entry.task,
                    key: entry.key,
                    changedFields: {}
                });
            }
            applyDiffEntryToChangedFields(changesByTask.get(mapKey).changedFields, entry);
        });

        return Array.from(changesByTask.values())
            .map(({ task, key, changedFields }) => {
                if (!Object.keys(changedFields).length) return null;
                const before = buildTaskPatchView(task);
                const after = applyChangedFieldsToView(before, changedFields);
                return {
                    taskId: task.id,
                    taskTitle: task.title || key,
                    owner: task.owner || "",
                    operation: "update",
                    changedFields,
                    before,
                    after
                };
            })
            .filter(Boolean)
            .sort((a, b) => String(a.taskTitle || "").localeCompare(String(b.taskTitle || ""), "ru"));
    }

    function applyDiffEntryToChangedFields(changedFields, entry) {
        if (!entry?.canPatch) return;

        if (entry.fieldId === "weeklyNotes") {
            const nextNote = entry.jiraValue;
            if (!nextNote) return;
            addPatchFieldChange(changedFields, "artifactNote", entry.task.artifactNote || "", nextNote);
            if (!String(entry.task.artifactTitle || "").trim()) {
                addPatchFieldChange(changedFields, "artifactTitle", entry.task.artifactTitle || "", "Выводы недели");
            }
            return;
        }

        addPatchFieldChange(changedFields, entry.reportField, entry.currentValue, entry.jiraValue);
    }

    function addPatchFieldChange(changedFields, field, before, after) {
        if (stringifyComparable(before) === stringifyComparable(after)) return;
        changedFields[field] = {
            before: clonePatchData(before ?? ""),
            after: clonePatchData(after ?? "")
        };
    }

    function buildTaskPatchView(task) {
        const view = { id: task?.id };
        PATCH_TRACKED_FIELDS.forEach((field) => {
            if (field === "achievements") {
                view[field] = Array.isArray(task?.achievements)
                    ? task.achievements.map((item) => ({
                        date: String(item?.date || ""),
                        text: String(item?.text || ""),
                        status: String(item?.status || "planned"),
                        progress: normalizeProgress(item?.progress)
                    }))
                    : [];
                return;
            }
            view[field] = clonePatchData(task?.[field] ?? "");
        });
        return view;
    }

    function applyChangedFieldsToView(before, changedFields) {
        const after = clonePatchData(before);
        Object.entries(changedFields).forEach(([field, diff]) => {
            after[field] = clonePatchData(diff.after);
        });
        return after;
    }

    function summarizePatchChanges(changes) {
        return changes.reduce((summary, change) => {
            const fields = Object.keys(change.changedFields || {});
            summary.changedTasks += 1;
            summary.changedFields += fields.length;
            if (fields.includes("achievements")) {
                const before = change.changedFields.achievements?.before;
                const after = change.changedFields.achievements?.after;
                summary.changedControlPoints += Math.max(
                    Array.isArray(before) ? before.length : 0,
                    Array.isArray(after) ? after.length : 0
                );
            }
            return summary;
        }, { changedTasks: 0, changedFields: 0, changedControlPoints: 0 });
    }

    function getPatchReportId(report) {
        const base = report || {};
        return String(base.reportId || `report_${hashString(`${base.title || ""}|${base.meta || ""}`)}`);
    }

    function buildReportPatchFilename() {
        const meta = String(state.report?.meta || "");
        const weekMatch = meta.match(/Неделя\s*№?\s*(\d+)/i);
        const weekPart = weekMatch ? `week-${weekMatch[1]}` : "week";
        const datePart = parseRussianDateFromMeta(meta) || formatDateForFilename(new Date());
        return `weekly_workboard_patch_${weekPart}_${datePart}_jira-sync.json`;
    }

    function parseRussianDateFromMeta(meta) {
        const normalized = String(meta || "").toLowerCase().replace(/ё/g, "е");
        const match = normalized.match(/(\d{1,2})\s+([а-я]+)\s+(\d{4})/i);
        if (!match) return "";
        const months = {
            января: "01",
            февраля: "02",
            марта: "03",
            апреля: "04",
            мая: "05",
            июня: "06",
            июля: "07",
            августа: "08",
            сентября: "09",
            октября: "10",
            ноября: "11",
            декабря: "12"
        };
        const month = months[match[2]];
        if (!month) return "";
        return `${match[3]}-${month}-${String(match[1]).padStart(2, "0")}`;
    }

    function formatDateForFilename(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function normalizeProgress(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return 0;
        return Math.max(0, Math.min(100, Math.round(number)));
    }

    function clonePatchData(value) {
        if (typeof value === "undefined") return undefined;
        return JSON.parse(JSON.stringify(value));
    }

    function hashString(value) {
        let hash = 2166136261;
        const text = String(value || "");
        for (let index = 0; index < text.length; index += 1) {
            hash ^= text.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(16).padStart(8, "0");
    }

    function downloadJson(filename, payload) {
        const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function downloadJiraUpdateDocument() {
        if (!state.report) {
            window.alert("Сначала загрузите недельный отчет.");
            return;
        }
        if (!state.snapshot) {
            window.alert("Сначала загрузите Jira-снимок.");
            return;
        }

        const changedEntries = state.lastDiffEntries.filter((entry) => !entry.same);
        if (!changedEntries.length) {
            window.alert("Расхождений между отчетом и Jira-снимком нет.");
            return;
        }

        downloadText(buildJiraUpdateFilename(), buildJiraUpdateMarkdown(changedEntries), "text/markdown;charset=utf-8");
        setStatus(`Документ для Jira сформирован: ${changedEntries.length} расхождений.`, "ok");
    }

    function buildJiraUpdateMarkdown(changedEntries) {
        const lines = [
            "# Что обновить в Jira",
            "",
            `Отчет: ${state.report?.meta || state.reportDataFile || "не указан"}`,
            `Jira-снимок: ${state.snapshot?.generatedAt || "дата снимка не указана"}`,
            "",
            "Документ показывает расхождения между отчетом и Jira-снимком. Перед изменением Jira проверьте строки вручную.",
            "",
            "| Задача | Jira-ключ | Поле | В отчете | В Jira | Рекомендация |",
            "| --- | --- | --- | --- | --- | --- |"
        ];

        changedEntries
            .slice()
            .sort((a, b) => String(a.taskTitle || "").localeCompare(String(b.taskTitle || ""), "ru")
                || String(a.fieldLabel || "").localeCompare(String(b.fieldLabel || ""), "ru"))
            .forEach((entry) => {
                lines.push([
                    entry.taskTitle,
                    entry.key,
                    entry.fieldLabel,
                    formatValue(entry.currentValue),
                    formatValue(entry.jiraValue),
                    getJiraUpdateRecommendation(entry)
                ].map(toMarkdownCell).join(" | ").replace(/^/, "| ").replace(/$/, " |"));
            });

        lines.push("");
        return `${lines.join("\n")}\n`;
    }

    function getJiraUpdateRecommendation(entry) {
        if (entry.fieldId === "status") return "проверить статус вручную";
        if (entry.fieldId === "achievements") return "проверить контрольные точки";
        if (entry.fieldId === "weeklyNotes") return "проверить комментарии недели";
        if (entry.fieldId === "actualHours") return "сверить worklog";
        return "обновить Jira, если отчет проверен";
    }

    function toMarkdownCell(value) {
        return String(value ?? "")
            .replace(/\r?\n/g, "<br>")
            .replace(/\|/g, "\\|")
            .trim() || "пусто";
    }

    function buildJiraUpdateFilename() {
        const meta = String(state.report?.meta || "");
        const weekMatch = meta.match(/Неделя\s*№?\s*(\d+)/i);
        const weekPart = weekMatch ? `week-${weekMatch[1]}` : "week";
        const datePart = parseRussianDateFromMeta(meta) || formatDateForFilename(new Date());
        return `jira-update-candidates_${weekPart}_${datePart}.md`;
    }

    function downloadText(filename, content, type = "text/plain;charset=utf-8") {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function downloadTemplate() {
        const template = {
            generatedAt: new Date().toISOString(),
            items: [
                {
                    key: "WGHT-111",
                    title: "Long-term data",
                    status: "in-progress",
                    actualHours: 621.5,
                    releaseDate: "20.12.2026",
                    releaseProgress: 80,
                    milestones: [
                        {
                            date: "09.09.2026",
                            text: "PRD",
                            status: "in-progress",
                            progress: 60
                        }
                    ],
                    weeklyNotes: [
                        "Короткий тезис для артефактов недели из комментария Jira."
                    ]
                }
            ]
        };
        const blob = new Blob([`${JSON.stringify(template, null, 2)}\n`], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "jira-sync-snapshot-template.json";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
})();
