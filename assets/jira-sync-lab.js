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
        missingKeys: document.querySelector("[data-missing-keys]"),
        weeklyNotes: document.querySelector("[data-weekly-notes]"),
        snapshotInput: document.getElementById("snapshotInput")
    };

    const comparedFields = [
        { id: "status", label: "Статус" },
        { id: "actualHours", label: "Факт часов" },
        { id: "releaseDate", label: "Дата релиза" },
        { id: "releaseProgress", label: "Готовность" },
        { id: "achievements", label: "Контрольные точки" }
    ];

    document.querySelector("[data-action='load-latest']")?.addEventListener("click", loadLatestReport);
    document.querySelector("[data-action='load-sample']")?.addEventListener("click", loadSampleSnapshot);
    document.querySelector("[data-action='download-template']")?.addEventListener("click", downloadTemplate);
    els.snapshotInput?.addEventListener("change", handleSnapshotUpload);

    loadLatestReport();

    async function loadLatestReport() {
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
        } catch (error) {
            showTableMessage(error.message || "Не удалось загрузить отчет.");
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
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            state.snapshot = normalizeSnapshot(parsed);
            render();
        } catch (error) {
            showTableMessage(error.message || "Не удалось прочитать Jira-снимок.");
        } finally {
            event.target.value = "";
        }
    }

    async function loadSampleSnapshot() {
        try {
            const response = await fetch("./data/jira-sync-sample_week-36.json", { cache: "no-store" });
            if (!response.ok) throw new Error(`jira-sync-sample_week-36.json ${response.status}`);
            state.snapshot = normalizeSnapshot(await response.json());
            render();
        } catch (error) {
            showTableMessage(error.message || "Не удалось загрузить пример Jira-снимка.");
        }
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
        const tasks = Array.isArray(state.report?.tasks) ? state.report.tasks : [];
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

    function extractJiraKeys(task) {
        const source = `${task?.title || ""} ${task?.domain || ""}`;
        const matches = source.match(/[A-ZА-Я]{2,10}-\d+/gi) || [];
        return Array.from(new Set(matches.map((key) => key.toUpperCase())));
    }

    function renderDiffs(matchedRows, snapshotByKey) {
        if (!state.report) {
            showTableMessage("Сначала загрузите недельный отчет.");
            return;
        }

        if (!state.snapshot) {
            showTableMessage("Отчет загружен. Теперь загрузите Jira-снимок.");
            return;
        }

        const rows = [];
        matchedRows.forEach(({ task, keys }) => {
            const key = keys.find((item) => snapshotByKey.has(item));
            const jiraItem = snapshotByKey.get(key);
            comparedFields.forEach((field) => {
                if (!hasComparableValue(jiraItem, field.id)) return;
                const currentValue = readReportValue(task, field.id);
                const jiraValue = readJiraValue(jiraItem, field.id);
                const same = stringifyComparable(currentValue) === stringifyComparable(jiraValue);
                rows.push(`
                    <tr>
                        <td><strong>${escapeHtml(task.title || key)}</strong><br><small>${escapeHtml(key)}</small></td>
                        <td>${escapeHtml(field.label)}</td>
                        <td>${escapeHtml(formatValue(currentValue))}</td>
                        <td>${escapeHtml(formatValue(jiraValue))}</td>
                        <td><span class="tag ${same ? "same" : "changed"}">${same ? "без изменений" : "изменится"}</span></td>
                    </tr>
                `);
            });
        });

        els.diffBody.innerHTML = rows.length
            ? rows.join("")
            : `<tr><td colspan="5" class="empty">Совпадения есть, но в Jira-снимке нет полей для сравнения.</td></tr>`;
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
