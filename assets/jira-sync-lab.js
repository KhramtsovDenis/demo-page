(function () {
    const state = {
        report: null,
        snapshot: null
    };

    const els = {
        reportTitle: document.querySelector("[data-report-title]"),
        taskCount: document.querySelector("[data-task-count]"),
        keyCount: document.querySelector("[data-key-count]"),
        matchCount: document.querySelector("[data-match-count]"),
        diffBody: document.querySelector("[data-diff-body]"),
        diffSections: document.querySelector("[data-diff-sections]"),
        missingKeys: document.querySelector("[data-missing-keys]"),
        weeklyNotes: document.querySelector("[data-weekly-notes]"),
        snapshotInput: document.getElementById("snapshotInput"),
        statusMessage: document.querySelector("[data-status-message]"),
        loadLatestButton: document.querySelector("[data-action='load-latest']")
    };

    const diffGroups = [
        {
            id: "releaseDate",
            title: "Даты релиза",
            description: "Кандидаты на перенос в Jira после ручного подтверждения.",
            fields: [{ id: "releaseDate", label: "Дата релиза" }]
        },
        {
            id: "status",
            title: "Статусы",
            description: "Пока только смотрим. Переводы статусов лучше включать отдельным шагом.",
            fields: [{ id: "status", label: "Статус" }]
        },
        {
            id: "progress",
            title: "Готовность",
            description: "Проценты из отчета и Jira для сверки перед автоматизацией.",
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
            title: "Часы: только контроль",
            description: "Часы намеренно не применяются автоматически.",
            readOnly: true,
            fields: [{ id: "actualHours", label: "Факт часов" }]
        }
    ];

    els.loadLatestButton?.addEventListener("click", loadLatestReport);
    document.querySelector("[data-action='load-sample']")?.addEventListener("click", loadSampleSnapshot);
    document.querySelector("[data-action='load-week-36-snapshot']")?.addEventListener("click", loadWeek36Snapshot);
    document.querySelector("[data-action='download-template']")?.addEventListener("click", downloadTemplate);
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
                    releaseDate: normalizeString(item.releaseDate),
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
            date: normalizeString(item.date),
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

    function normalizeNumber(value) {
        if (value === "" || value === null || typeof value === "undefined") return null;
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    function render() {
        const allTasks = Array.isArray(state.report?.tasks) ? state.report.tasks : [];
        const tasks = allTasks.filter(isSyncCandidate);
        const taskRows = tasks.map((task) => ({ task, keys: extractJiraKeys(task) }));
        const keyedRows = taskRows.filter((row) => row.keys.length);
        const snapshotItems = state.snapshot?.items || [];
        const snapshotByKey = new Map(snapshotItems.map((item) => [item.key, item]));
        const matchedRows = keyedRows.filter((row) => row.keys.some((key) => snapshotByKey.has(key)));

        els.reportTitle.textContent = state.report?.meta || state.report?.title || "не загружен";
        els.taskCount.textContent = String(tasks.length);
        els.keyCount.textContent = String(keyedRows.length);
        els.matchCount.textContent = String(matchedRows.length);

        renderDiffs(matchedRows, snapshotByKey);
        renderMissingKeys(taskRows);
        renderWeeklyNotes(matchedRows, snapshotByKey);
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
        return Array.from(new Set(matches.map((key) => key.toUpperCase())));
    }

    function renderDiffs(matchedRows, snapshotByKey) {
        if (!state.report) {
            showDiffMessage("Сначала загрузите недельный отчет.");
            return;
        }

        if (!state.snapshot) {
            showDiffMessage("Отчет загружен. Теперь загрузите Jira-снимок.");
            return;
        }

        const rowsByGroup = new Map(diffGroups.map((group) => [group.id, []]));
        matchedRows.forEach(({ task, keys }) => {
            const key = keys.find((item) => snapshotByKey.has(item));
            const jiraItem = snapshotByKey.get(key);
            diffGroups.forEach((group) => {
                group.fields.forEach((field) => {
                    if (!hasComparableValue(jiraItem, field.id)) return;
                    const currentValue = readReportValue(task, field.id);
                    const jiraValue = readJiraValue(jiraItem, field.id);
                    const same = stringifyComparable(currentValue) === stringifyComparable(jiraValue);
                    rowsByGroup.get(group.id).push(renderDiffRow(task, key, field, currentValue, jiraValue, same, group));
                });
            });
        });

        const groupMarkup = diffGroups
            .map((group) => renderDiffGroup(group, rowsByGroup.get(group.id) || []))
            .join("");

        els.diffSections.innerHTML = groupMarkup || `<div class="empty-card">Совпадения есть, но в Jira-снимке нет полей для сравнения.</div>`;
    }

    function renderDiffGroup(group, rows) {
        const changedCount = rows.filter((row) => row.changed).length;
        const sameCount = rows.length - changedCount;
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
                    </div>
                </div>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Задача</th>
                                <th>Поле</th>
                                <th>В отчете</th>
                                <th>В Jira</th>
                                <th>Итог</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.length ? rows.map((row) => row.markup).join("") : `<tr><td colspan="5" class="empty">В Jira-снимке нет данных для этого блока.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    }

    function renderDiffRow(task, key, field, currentValue, jiraValue, same, group) {
        const statusLabel = same ? "без изменений" : group.readOnly ? "проверить руками" : "кандидат";
        const statusClass = same ? "same" : group.readOnly ? "readonly" : "changed";
        return {
            changed: !same,
            markup: `
                <tr class="${same ? "" : "is-different"}">
                    <td><strong>${escapeHtml(task.title || key)}</strong><br><small>${escapeHtml(key)}</small></td>
                    <td>${escapeHtml(field.label)}</td>
                    <td>${escapeHtml(formatValue(currentValue))}</td>
                    <td>${escapeHtml(formatValue(jiraValue))}</td>
                    <td><span class="tag ${statusClass}">${statusLabel}</span></td>
                </tr>
            `
        };
    }

    function hasComparableValue(item, fieldId) {
        if (!item) return false;
        if (fieldId === "achievements") return Array.isArray(item.achievements);
        return item[fieldId] !== null && typeof item[fieldId] !== "undefined";
    }

    function readReportValue(task, fieldId) {
        if (fieldId === "achievements") return task.achievements || [];
        return task[fieldId];
    }

    function readJiraValue(item, fieldId) {
        if (fieldId === "achievements") return item.achievements || [];
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
            const key = keys.find((item) => snapshotByKey.has(item));
            const jiraItem = snapshotByKey.get(key);
            (jiraItem?.weeklyNotes || []).forEach((note) => {
                notes.push(`<li><strong>${escapeHtml(task.title || key)}</strong><br>${escapeHtml(note)}</li>`);
            });
        });

        els.weeklyNotes.innerHTML = notes.length
            ? notes.join("")
            : "<li>В совпавших задачах пока нет weeklyNotes.</li>";
    }

    function showTableMessage(message) {
        els.diffBody.innerHTML = `<tr><td colspan="5" class="empty">${escapeHtml(message)}</td></tr>`;
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
                            <th>Задача</th>
                            <th>Поле</th>
                            <th>В отчете</th>
                            <th>В Jira</th>
                            <th>Итог</th>
                        </tr>
                    </thead>
                    <tbody data-diff-body>
                        <tr>
                            <td colspan="5" class="empty">${escapeHtml(message)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        els.diffBody = document.querySelector("[data-diff-body]");
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
