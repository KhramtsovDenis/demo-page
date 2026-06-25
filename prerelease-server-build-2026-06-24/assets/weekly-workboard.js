        const STORAGE_KEY = window.__WORKBOARD_STORAGE_KEY__ || "weekly_workboard_report_builder_state";
        const EXPORTED_STATE_GLOBAL = "__WORKBOARD_EXPORTED_STATE__";
        const FORCE_EXPORTED_STATE = Boolean(window.__WORKBOARD_FORCE_EXPORTED_STATE__);
        const WORKBOARD_MODE = window.__WORKBOARD_MODE__ === "published" ? "published" : "editor";
        const IS_PUBLISHED_MODE = WORKBOARD_MODE === "published";
        const REPORT_REGISTRY_KEY = "healbe_weekly_report_registry";
        const REPORT_RECORD_PREFIX = "healbe_weekly_report_record_";
        const REPORT_QUERY_ID = getReportQueryId();
        const VIEW_MODE_STORAGE_KEY = getActiveStorageKey() + "_view_mode";
        const DEFAULT_VIEW_MODE = "executive";
        const PATCH_FILE_TYPE = "healbe-weekly-report-patch";
        const PATCH_BASE_VERSION = 1;
        const PATCH_AUTHOR_KEY = getActiveStorageKey() + "_patch_author";
        const PATCH_BASELINE_KEY = getActiveStorageKey() + "_patch_baseline";
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
        const PATCH_FIELD_LABELS = {
            title: "Название",
            domain: "Направление",
            owner: "Ответственный",
            description: "Описание",
            releaseDate: "Дата релиза",
            releaseNumber: "Номер релиза",
            status: "Статус",
            completedAt: "Дата завершения",
            releaseProgress: "Общий прогресс",
            weeklyProgress: "Прогресс недели",
            actualHours: "Факт, ч",
            plannedHours: "План, ч",
            artifactTitle: "Ключевой артефакт",
            artifactNote: "Сделано",
            focus: "Риски / Фокус CEO",
            summary: "Executive Summary",
            ceoFocus: "CEO Focus",
            achievements: "Контрольные точки",
            task: "Задача целиком"
        };
        const CONTOUR_CONFIG = [
            {
                id: "weight",
                title: "Управление весом",
                goal: "Пересобираем путь пользователя от данных о весе и энергобалансе к понятному плану действий.",
                projectMatchers: ["Energy Balance Transparency", "Long-term data", "Weight Trend", "Complex indicator", "Weekly plan", "Weekly Plan", "WGHT"]
            },
            {
                id: "cardio",
                title: "Кардио-функции",
                goal: "Формируем пользовательский сценарий оценки сердечно-сосудистого состояния: ЭКГ, аритмия, ВСР и интегральные показатели.",
                projectMatchers: ["ЭКГ", "ВСР", "Аритмия", "Индекс здоровья сердца", "Heart", "HLTH"]
            },
            {
                id: "neem_devices",
                title: "NEEM и устройства",
                goal: "Развиваем устройство NEEM и мультидевайсный контур экосистемы Healbe.",
                projectMatchers: ["NeeM", "NEEM", "умные весы", "Smart scales"]
            },
            {
                id: "regulatory",
                title: "РУ",
                goal: "Ведем отдельное медицинское направление продукта под регистрационное удостоверение.",
                projectMatchers: ["РУ"]
            },
            {
                id: "b2b_research",
                title: "B2B и исследования",
                goal: "Развиваем партнерские, исследовательские и демонстрационные направления: EDA, СПбГУ, НМИЦ, ПМЭФ, умная колонка.",
                projectMatchers: ["EDA", "СПбГУ", "НМИЦ", "Умная колонка", "ПМЭФ", "Грант", "INC"]
            },
            {
                id: "gobe_lora",
                title: "GoBe Lora",
                goal: "ODM/OEM смарт-часы с минимальным набором health-параметров мониторинга, GPS-позиционированием и каналом передачи данных LoRaMesh.",
                projectMatchers: ["GoBe Lora", "LoRa", "LoRaMesh"]
            },
            {
                id: "gobe_u_simple",
                title: "GoBe U Simple",
                goal: "Более дешевый вариант устройства GoBe U, наследующий аппаратную и программную архитектуру, но использующий более дешевые компоненты и материалы.",
                projectMatchers: ["GoBe U Simple", "GoBe U"]
            },
            {
                id: "gobe5",
                title: "GoBe5",
                goal: "Устройство GoBe5 на базе OEM/ODM часов, в которое встроен функционал GoBe U с минимальными доработками ПО. Измерительную часть делает Healbe, а коммуникационную - ODM-партнер.",
                projectMatchers: ["GoBe5", "GoBe 5"]
            }
        ];
        const OTHER_CONTOUR = {
            id: "other",
            title: "Прочее",
            goal: "Направление не привязано автоматически. Требуется отдельная продуктовая группировка."
        };

        function normalizeDirectionItem(direction, index) {
            if (!direction || typeof direction !== "object") return null;
            const id = String(direction.id || "").trim();
            if (!id) return null;
            const projectMatchers = Array.isArray(direction.projectMatchers)
                ? direction.projectMatchers.map((matcher) => String(matcher || "").trim()).filter(Boolean)
                : [];
            const releaseResults = normalizeDirectionReleaseResults(direction.releaseResults);
            return {
                id,
                title: String(direction.title || id).trim() || id,
                goal: String(direction.goal || "").trim(),
                projectMatchers,
                releaseResults,
                icon: String(direction.icon || "").trim(),
                color: String(direction.color || "").trim(),
                order: Number.isFinite(Number(direction.order)) ? Number(direction.order) : index
            };
        }

        function normalizeDirectionReleaseResults(results) {
            if (!Array.isArray(results)) return [];
            return results
                .map((item) => {
                    if (!item || typeof item !== "object") return null;
                    const date = String(item.date || "").trim();
                    const result = String(item.result || item.title || "").trim();
                    const userValue = String(item.userValue || item.value || "").trim();
                    if (!date && !result && !userValue) return null;
                    return { date, result, userValue };
                })
                .filter(Boolean);
        }

        function normalizeDirections(directions) {
            if (!Array.isArray(directions)) return [];
            const seen = new Set();
            return directions
                .map(normalizeDirectionItem)
                .filter((direction) => {
                    if (!direction || seen.has(direction.id)) return false;
                    seen.add(direction.id);
                    return true;
                })
                .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
        }

        function getDefaultDirections() {
            return CONTOUR_CONFIG.map((direction, index) => normalizeDirectionItem({ ...direction, order: index }, index)).filter(Boolean);
        }

        function getDirectionConfig() {
            const customDirections = normalizeDirections(state?.directions);
            return customDirections.length ? customDirections : getDefaultDirections();
        }
        const RELEASE_PACKAGE_CONFIG = [
            {
                id: "release_2026_05_12",
                releaseAppId: 1773776214811,
                title: "NEEM MVP + умные весы + инсайты",
                date: "12.05.2026",
                label: "12 мая",
                releaseUrl: "../release_app.html#1773776214811",
                projectMatchers: ["NeeM MVP", "NEEM-2"]
            },
            {
                id: "release_2026_06_29",
                releaseAppId: 1773776694649,
                title: "Multi-device + Usage history NEEM",
                date: "29.06.2026",
                label: "29 июня",
                releaseUrl: "../release_app.html#1773776694649",
                projectMatchers: ["Multi device", "Multi-device", "Usage history", "NEEM-3", "мультидевайс"]
            },
            {
                id: "release_2026_08_31",
                releaseAppId: 1773777223820,
                title: "Energy Balance Transparency + ЭКГ + Long-term data",
                date: "31.08.2026",
                label: "31 августа",
                releaseUrl: "../release_app.html#1773777223820",
                projectMatchers: ["Energy Balance Transparency", "Long-term data", "ЭКГ"]
            },
            {
                id: "release_2026_10_26",
                releaseAppId: 1773777519158,
                title: "Complex indicator + аритмия",
                date: "26.10.2026",
                label: "26 октября",
                releaseUrl: "../release_app.html#1773777519158",
                projectMatchers: ["Complex indicator", "Аритмия"]
            },
            {
                id: "release_2026_12_23",
                releaseAppId: 1773778008956,
                title: "Weight Trend + ВСР + темная тема + NEEM OTA",
                date: "23.12.2026",
                label: "23 декабря",
                releaseUrl: "../release_app.html#1773778008956",
                projectMatchers: ["Weight Trend", "ВСР", "Индекс здоровья сердца"]
            }
        ];
        const DEFAULT_STATE = {
            title: "Недельный срез продуктовых работ Healbe",
            meta: "Неделя №17 | 23 апреля 2026",
            tasks: [
                { id: 1, domain: "WEIGHT & LIFESTYLE", owner: "Маргарита Ящук", title: "Energy Balance Transparency (WGHT-1)", startDate: "23.10.2025", releaseDate: "31.08.2026", releaseProgress: 38, status: "in-progress", description: "Разделение экранов энергобаланса на приход и расход. Закрепление новых сущностей показателей, для более понятного понимания данных", focus: "", summary: "", artifactTitle: "", artifactNote: "Проектирование функционального контура завершено.\nСтруктура контента и очередность вывода статей согласованы.\nНабор сопроводительных материалов зафиксирован для суточных и долгосрочных сценариев.\nПроектирование функционального контура завершено.\nСтруктура контента и очередность вывода статей согласованы.\nНабор сопроводительных материалов зафиксирован для суточных и долгосрочных сценариев.", achievements: [{ date: "28.10.2025", text: "Продуктовое исследование", status: "done", progress: 100 }, { date: "15.03.2026", text: "Продуктовые требования", status: "done", progress: 40 }, { date: "15.04.2026", text: "UX/UI", status: "in-progress", progress: 60 }, { date: "15.08.2026", text: "Системный анализ", status: "in-progress", progress: 0 }, { date: "15.05.2026", text: "Написание сопроводительных статей", status: "in-progress", progress: 0 }, { date: "10.05.2026", text: "Вычитка и локализация текста для релиза", status: "in-progress", progress: 0 }, { date: "15.05.2026", text: "Тестирование", status: "done", progress: 100 }], ceoFocus: "Отсутствуют", weeklyProgress: 8 },
                { id: 2, domain: "WEIGHT & LIFESTYLE", owner: "Маргарита Ящук", title: "Long-term data (WGHT-111)", releaseDate: "31.08.2026", releaseProgress: 30, status: "in-progress", description: "Месяц и год в метриках веса и энергобаланса.", focus: "Отсутствуют", summary: "", artifactTitle: "", artifactNote: "Заключение НИР по валидации продукта получено.\nПродуктовые требования скорректированы по результатам валидации.\nКонтур дизайн-доработок для годовых данных определен.", achievements: [{ date: "", text: "Написание продуктовых требований к продукту  20.04.2026", status: "planned" }, { date: "", text: "Корректив к дизайну - 13.05.2026", status: "planned" }, { date: "", text: "Системный анализ", status: "planned" }], ceoFocus: "Отсутствуют", weeklyProgress: 30 },
                { id: 3, domain: "WEIGHT & LIFESTYLE", owner: "Маргарита Ящук", title: "NeeM MVP (Sync & Battery) (NEEM-2)", releaseDate: "12.05.2026", releaseProgress: 69, status: "risk", description: "iOS-релиз готов по продукту, но проект тормозят блокеры.", focus: "Определение критичных багов", summary: "", artifactTitle: "", artifactNote: "Результаты прогона тестовой сборки зафиксированы.\nПеречень критических багов iOS сформирован.\nКонтур обсуждения критичности багов Android вынесен на отдельный разбор.", achievements: [{ date: "", text: "Разработка функционала AND/iOS", status: "planned" }, { date: "", text: "Тестирование релиза", status: "planned" }], ceoFocus: "Определение критичных багов", weeklyProgress: 69 },
                { id: 5, domain: "HEALTH", owner: "Александр Петряков", title: "ЭКГ MVP 1.0 B2C (HLTH-3)", releaseDate: "31.08.2026", releaseProgress: 86, status: "in-progress", description: "Функциональный MVP с первичным пользовательским сценарием.", focus: "Отсутствуют", summary: "", artifactTitle: "", artifactNote: "Контур экранов ошибок измерения определен.\nМинорные продуктовые правки зафиксированы.\nДизайн выгружаемых отчетов подготовлен к доработке.", achievements: [{ date: "", text: "Передача в системный анализ", status: "planned" }], ceoFocus: "Отсутствуют", weeklyProgress: 86 },
                { id: 6, domain: "HEALTH", owner: "Александр Петряков", title: "ВСР MVP 1.0 B2C (HLTH-116)", releaseDate: "23.12.2026", releaseProgress: 50, status: "discovery", description: "Исследование пользовательского и медицинского контуров.", focus: "Отсутствуют", summary: "", artifactTitle: "", artifactNote: "Продуктовые требования к функционалу сформированы.\nДокументация НИР по индексу Баевского и пульсу получена.\nБазовый визуальный концепт продемонстрирован продуктовой команде.", achievements: [{ date: "", text: "Продуктовые требования к продукту", status: "planned" }, { date: "", text: "Создание концепта UX/UI", status: "planned" }], ceoFocus: "Отсутствуют", weeklyProgress: 50 },
                { id: 7, domain: "HEALTH", owner: "Александр Петряков", title: "GoBe 5", releaseDate: "", releaseProgress: 37, status: "discovery", description: "Проработка экранов и аналитики UB6.", focus: "Отсутствуют", summary: "Провели анализ присланных устройств на соответствие продуктовым требованиям", artifactTitle: "", artifactNote: "Оценка присланных устройств на соответствие продуктовым требованиям проведена.\nКонтур экранов и программного объема по устройствам зафиксирован.", achievements: [], ceoFocus: "Отсутствуют", weeklyProgress: 37 },
                { id: 9, domain: "B2B & INCUBATOR", owner: "Павел Павлюк", title: "Умная колонка (INC-1)", releaseDate: "20.07.2026", releaseProgress: 72, status: "in-progress", description: "Пилот в активной работе, требуется финализация синхронизации треков.", focus: "Отсутствуют", summary: "", artifactTitle: "", artifactNote: "Поток глубинных интервью РТелеком запущен.\nВторой этап глубинных интервью Oncе проведен в рабочий контур.", achievements: [{ date: "", text: "Исследование второй этап - 25.05.2026", status: "planned" }, { date: "", text: "Исследование Ртелеком  - 12.05.2026", status: "planned" }], ceoFocus: "Отсутствуют", weeklyProgress: 72 },
                { id: 10, domain: "B2B & INCUBATOR", owner: "Павел Павлюк", title: "Healbe EDA Platform (INC-125)", releaseDate: "14.12.2026", releaseProgress: 29, status: "in-progress", description: "Запуск платформенного контура под B2B-партнерства.", focus: "Отсутствуют", summary: "", artifactTitle: "", artifactNote: "Выводы по проведенным кастдевам консолидированы.\nПлан развития проекта подготовлен к согласованию.", achievements: [{ date: "", text: "Проведение кастдевов  30.04.2026", status: "planned" }, { date: "", text: "План развития проекта - 01.05.2026", status: "planned" }], ceoFocus: "Отсутствуют", weeklyProgress: 29 },
                { id: 11, domain: "B2B & INCUBATOR", owner: "Павел Павлюк", title: "Грант СПбГУ (40 больница)", releaseDate: "23.04.2026", releaseProgress: 48, status: "contract", description: "Этап подписания договора и переход к следующему шагу проекта.", focus: "Отсутствуют", summary: "", artifactTitle: "", artifactNote: "Пакет договорных материалов передан на подписание.\nКомплект сопроводительных документов по проекту сформирован.\nЗамечания по договору получены и вынесены в корректировку.", achievements: [{ date: "", text: "Подписание договора - 30.04.2026", status: "planned" }, { date: "", text: "Разработка и внедрение ПО", status: "planned" }], ceoFocus: "Предлагаем изменения по использованию референсого устройства для исследования (Варикард)", weeklyProgress: 48 },
                { id: 12, domain: "B2B & INCUBATOR", owner: "Павел Павлюк", title: "Пре-проекты (ПМЭФ)", releaseDate: "01.06.2026", releaseProgress: 12, status: "evaluation", description: "Подготовка дашбордов и базовых материалов под ПМЭФ.", focus: "Отсутствуют", summary: "", artifactTitle: "", artifactNote: "Продуктовые требования для веб-платформы передачи данных оформлены.\nТребования к доработке прошивки зафиксированы.", achievements: [{ date: "", text: "Продуктовые требования", status: "planned" }, { date: "", text: "Макеты экранов", status: "planned" }, { date: "", text: "Системный анализ WEB и FW - 28.04.2026", status: "planned" }], ceoFocus: "Отсутствуют", weeklyProgress: 12 },
                { id: 1777285952145, domain: "WEIGHT & LIFESTYLE", owner: "Маргарита Ящук", title: "Complex indicator (WGHT-112)", releaseDate: "", releaseProgress: 23, status: "in-progress", description: "Вывод нового пользовательского показателя, показывающий успех по достижению цели по похудению или удержанию веса", focus: "Отсутствуют", summary: "", artifactTitle: "", artifactNote: "Исследование конкурентов проведено.\nПродуктовые требования к показателю сформированы.\nПользовательские данные СХ валидированы на модели показателя.\nКонцепт дизайна показателя подготовлен к презентации.", achievements: [{ date: "", text: "Выгрузка данных от СХ - 17.04.2026", status: "planned" }, { date: "", text: "Передали данные по проекту в НИР", status: "planned" }, { date: "", text: "Заключение от НИР - ?", status: "planned" }, { date: "", text: "UX/UI по продукту - 30.04.2026", status: "planned" }], ceoFocus: "Отсутствуют", weeklyProgress: 23 },
                { id: 1777287977653, domain: "B2B & INCUBATOR", owner: "Маргарита Ящук", title: "НМИЦ ТПМ (INC-87)", releaseDate: "", releaseProgress: 0, status: "in-progress", description: "", focus: "", summary: "", artifactTitle: "", artifactNote: "Контактный контур с Елиашевич поддерживается.\nМетодика взаимодействия с клиниками готовится к выпуску.\nКомплект буклетов по браслету и комбо-формату сформирован.\nПереданные браслеты поставлены на контроль ТП.", achievements: [{ date: "", text: "Буклеты -30.04.2026", status: "planned" }], ceoFocus: "", weeklyProgress: 0 },
                { id: 1777291662751, domain: "B2B & INCUBATOR", owner: "Павел Павлюк", title: "РУ", releaseDate: "", releaseProgress: 34, status: "in-progress", description: "", focus: "", summary: "", artifactTitle: "", artifactNote: "Токсикологическое исследование устройства и ремешков запущено.\nДорожная карта по СМК утверждена.\nКонтур доработок UX/UI зафиксирован.\nПроизводство коробок переведено в запуск.\nРешение по использованию методики определения пульса принято.", achievements: [{ date: "", text: "Токсикологическое испытание ~ 25.05.2026", status: "planned" }, { date: "", text: "Корректировка UX/UI - 30.04.2026", status: "planned" }, { date: "", text: "Изготовление коробок   - 13.05.2026", status: "planned" }], ceoFocus: "", weeklyProgress: 34 },
                { id: 1777292582500, domain: "HEALTH", owner: "Александр Петряков", title: "Аритмия", releaseDate: "26.10.2026", releaseProgress: 48, status: "in-progress", description: "Вывод нового функционала в приложение, позволяющий отслеживать показания Аритмии и сравнения данных за период", focus: "", summary: "", artifactTitle: "", artifactNote: "Продуктовое видение по функционалу передано в НИР.\nКонтур работ для системного анализа сформирован.\nПакет на валидацию и локализацию текста передан в работу.", achievements: [{ date: "", text: "Валидация РНД - 29.04.2026", status: "planned" }, { date: "", text: "Системный анализ", status: "planned" }], ceoFocus: "", weeklyProgress: 48 }
            ]
        };

        const STATUS_META = {
            planned: { label: "В плане", className: "planned" },
            evaluation: { label: "Оценка", className: "evaluation" },
            preparation: { label: "Оценка", className: "evaluation" },
            discovery: { label: "Анализ", className: "discovery" },
            contract: { label: "Договор", className: "contract" },
            "in-progress": { label: "В работе", className: "in-progress" },
            development: { label: "Разработка", className: "development" },
            test: { label: "Тест", className: "test" },
            risk: { label: "Риск", className: "risk" },
            paused: { label: "Пауза", className: "paused" },
            done: { label: "Завершено", className: "done" }
        };

        const LEGACY_ARTIFACT_NOTE = "Сюда можно вынести схему, график, дизайн или любой один визуальный носитель, который лучше всего объясняет статус проекта.";
        const MILESTONE_STATUS_META = {
            planned: { label: "Запланировано", dotClass: "planned" },
            "in-progress": { label: "В работе", dotClass: "in-progress" },
            done: { label: "Готово", dotClass: "done" }
        };

        let state = loadState();
        let editingTaskId = null;
        let expandedTaskId = null;
        let openDetailTaskId = null;
        let suppressDetailCloseCleanup = false;
        let rowClickTimer = null;
        let portfolioClickTimer = null;
        let currentContourFilter = loadContourFilter();
        let expandedExecutiveContourId = null;
        let editingDirectionId = null;
        let originalState = loadPatchBaseline(state);
        let originalStateHash = hashPatchValue(originalState);
        let currentPatchSnapshot = null;
        let currentTaskChangeMap = new Map();
        let pendingImportConflicts = [];

        const executiveView = document.getElementById("executiveView");
        const contourGrid = document.getElementById("contourGrid");
        const directionExpand = document.getElementById("directionExpand");
        const contourFilter = document.getElementById("contourFilter");
        const boardGrid = document.getElementById("boardGrid");
        const summaryText = document.getElementById("summaryText");
        const pageTitle = document.getElementById("pageTitle");
        const pageMeta = document.getElementById("pageMeta");
        const projectDetailHead = document.getElementById("projectDetailHead");
        const taskDialog = document.getElementById("taskDialog");
        const taskForm = document.getElementById("taskForm");
        const deleteTaskBtn = document.getElementById("deleteTaskBtn");
        const taskDialogTitle = document.getElementById("taskDialogTitle");
        const metaDialog = document.getElementById("metaDialog");
        const metaForm = document.getElementById("metaForm");
        const detailDialog = document.getElementById("detailDialog");
        const detailSlide = document.getElementById("detailSlide");
        const jsonDialog = document.getElementById("jsonDialog");
        const jsonEditor = document.getElementById("jsonEditor");
        const jsonStatus = document.getElementById("jsonStatus");
        const directionsDialog = document.getElementById("directionsDialog");
        const directionForm = document.getElementById("directionForm");
        const directionDialogTitle = document.getElementById("directionDialogTitle");
        const directionTitleInput = document.getElementById("directionTitleInput");
        const directionIdInput = document.getElementById("directionIdInput");
        const directionOrderInput = document.getElementById("directionOrderInput");
        const directionGoalInput = document.getElementById("directionGoalInput");
        const directionMatchersInput = document.getElementById("directionMatchersInput");
        const directionReleaseResultsInput = document.getElementById("directionReleaseResultsInput");
        const deleteDirectionBtn = document.getElementById("deleteDirectionBtn");
        const directionsStatus = document.getElementById("directionsStatus");
        const patchImportInput = document.getElementById("patchImportInput");
        const changesDialog = document.getElementById("changesDialog");
        const changesList = document.getElementById("changesList");
        const changesStatus = document.getElementById("changesStatus");
        const conflictsDialog = document.getElementById("conflictsDialog");
        const conflictsList = document.getElementById("conflictsList");
        const importSummaryText = document.getElementById("importSummaryText");
        const conflictsStatus = document.getElementById("conflictsStatus");

        render();
        bindEvents();

        function bindEvents() {
            applyWorkboardMode();
            setupToolbarMenu();
            document.getElementById("saveStateBtn").addEventListener("click", exportStateBackup);
            document.getElementById("publishReportBtn")?.addEventListener("click", preparePublicationPackage);
            document.getElementById("showChangesBtn")?.addEventListener("click", openChangesDialog);
            document.getElementById("downloadPatchBtn")?.addEventListener("click", downloadChangesPatch);
            document.getElementById("importPatchBtn")?.addEventListener("click", () => patchImportInput?.click());
            document.getElementById("resetChangesBtn")?.addEventListener("click", resetChangesToOriginal);
            document.getElementById("acceptChangesBtn")?.addEventListener("click", acceptChangesAsBaseline);
            patchImportInput?.addEventListener("change", handlePatchImportSelection);
            document.getElementById("captureModeBtn").addEventListener("click", toggleCaptureMode);
            document.getElementById("capturePngBtn").addEventListener("click", captureCurrentViewSafe);
            document.getElementById("addTaskBtn").addEventListener("click", () => openTaskDialog());
            document.getElementById("editMetaBtn").addEventListener("click", openMetaDialog);
            document.getElementById("editJsonBtn").addEventListener("click", openJsonDialog);
            document.getElementById("editDirectionsBtn").addEventListener("click", () => openDirectionsDialog());
            document.getElementById("resetBtn")?.addEventListener("click", resetState);
            document.getElementById("closeTaskDialogBtn").addEventListener("click", () => taskDialog.close());
            document.getElementById("cancelTaskBtn").addEventListener("click", () => taskDialog.close());
            deleteTaskBtn.addEventListener("click", deleteCurrentTask);
            taskForm.addEventListener("submit", saveTaskFromForm);
            document.getElementById("addMilestoneBtn").addEventListener("click", appendMilestoneFromBuilder);
            detailDialog.addEventListener("click", (event) => {
                if (event.target === detailDialog) detailDialog.close();
            });
            detailDialog.addEventListener("close", () => {
                if (suppressDetailCloseCleanup) return;
                openDetailTaskId = null;
                document.body.classList.remove("capture-detail-preview");
                document.body.classList.remove("capture-dialog-only");
                syncCaptureModeUi();
            });
            document.getElementById("closeMetaDialogBtn").addEventListener("click", () => metaDialog.close());
            document.getElementById("cancelMetaBtn").addEventListener("click", () => metaDialog.close());
            metaForm.addEventListener("submit", saveMeta);
            document.getElementById("closeJsonDialogBtn").addEventListener("click", () => jsonDialog.close());
            document.getElementById("cancelJsonBtn").addEventListener("click", () => jsonDialog.close());
            document.getElementById("saveJsonBtn").addEventListener("click", saveJson);
            document.getElementById("closeChangesDialogBtn")?.addEventListener("click", () => changesDialog?.close());
            document.getElementById("downloadPatchFromDialogBtn")?.addEventListener("click", downloadChangesPatch);
            document.getElementById("resetChangesFromDialogBtn")?.addEventListener("click", resetChangesToOriginal);
            document.getElementById("acceptChangesFromDialogBtn")?.addEventListener("click", acceptChangesAsBaseline);
            document.getElementById("closeConflictsDialogBtn")?.addEventListener("click", () => conflictsDialog?.close());
            document.getElementById("skipConflictsBtn")?.addEventListener("click", skipPendingConflicts);
            document.getElementById("applyConflictChoicesBtn")?.addEventListener("click", applyConflictChoices);
            document.getElementById("closeDirectionsDialogBtn").addEventListener("click", () => directionsDialog.close());
            document.getElementById("cancelDirectionsBtn").addEventListener("click", () => directionsDialog.close());
            directionForm.addEventListener("submit", saveDirectionFromDialog);
            deleteDirectionBtn.addEventListener("click", deleteCurrentDirection);
            document.addEventListener("click", handleCaptureModeDismiss, true);
            document.addEventListener("keydown", handleCaptureModeEscape, true);
        }

        function applyWorkboardMode() {
            document.body.classList.toggle("is-published-report", IS_PUBLISHED_MODE);
            if (!IS_PUBLISHED_MODE) return;

            [
                "publishReportBtn",
                "importPatchBtn",
                "editMetaBtn",
                "editJsonBtn",
                "editDirectionsBtn",
                "addTaskBtn",
                "deleteTaskBtn",
                "deleteDirectionBtn"
            ].forEach(hideControlById);

            document.querySelectorAll(".toolbar-group-edit").forEach((element) => {
                element.hidden = true;
                element.setAttribute("aria-hidden", "true");
            });
        }

        function hideControlById(id) {
            const element = document.getElementById(id);
            if (!element) return;
            element.hidden = true;
            element.setAttribute("aria-hidden", "true");
            if ("disabled" in element) element.disabled = true;
        }

        function setupToolbarMenu() {
            const toolbar = document.querySelector(".toolbar");
            const toggleButton = document.getElementById("toolbarToggleBtn");
            if (!toolbar || !toggleButton) return;

            const closeMenu = ({ suppressHover = false } = {}) => {
                toolbar.classList.remove("is-open");
                toolbar.classList.toggle("is-hover-suppressed", suppressHover);
                toggleButton.setAttribute("aria-expanded", "false");
                if (suppressHover && document.activeElement instanceof HTMLElement && toolbar.contains(document.activeElement)) {
                    document.activeElement.blur();
                }
            };

            const openMenu = () => {
                toolbar.classList.add("is-open");
                toolbar.classList.remove("is-hover-suppressed");
                toggleButton.setAttribute("aria-expanded", "true");
            };

            toggleButton.addEventListener("click", (event) => {
                event.stopPropagation();
                if (toolbar.classList.contains("is-open")) {
                    closeMenu({ suppressHover: true });
                    return;
                }
                openMenu();
            });

            toolbar.addEventListener("pointerleave", () => {
                toolbar.classList.remove("is-hover-suppressed");
            });

            toggleButton.addEventListener("focus", () => {
                if (!toolbar.matches(":hover")) {
                    toolbar.classList.remove("is-hover-suppressed");
                }
            });

            toolbar.addEventListener("click", (event) => {
                const actionButton = event.target instanceof Element ? event.target.closest("button") : null;
                if (!actionButton || actionButton === toggleButton) return;
                if (window.matchMedia("(max-width: 980px)").matches) {
                    window.setTimeout(() => closeMenu({ suppressHover: true }), 0);
                }
            });
        }

        function render() {
            refreshChangeSnapshot();
            pageTitle.textContent = state.title;
            pageMeta.textContent = state.meta;
            document.title = state.title;
            renderExecutiveView();
            renderDirectionExpand();
            renderContourFilter();
            renderBoard();
            renderSummary();
            syncChangeToolbarState();
        }

        function renderExecutiveView() {
    if (!contourGrid) return;
    const normalizedTasks = (state.tasks || []).map(normalizeTaskFromJson);
    const activeTasks = normalizedTasks.filter((task) => !isCompletedProject(task));
    const contours = buildExecutiveContours(activeTasks);
    const overview = contourGrid.closest(".portfolio-overview");
    if (overview) {
        let summaryRail = overview.querySelector(".portfolio-dashboard-summary");
        if (!summaryRail) {
            summaryRail = document.createElement("section");
            summaryRail.className = "portfolio-dashboard-summary";
            overview.insertBefore(summaryRail, contourGrid);
        }
        summaryRail.innerHTML = renderPortfolioDashboardSummary(contours);

        let completionArea = overview.querySelector(".portfolio-completion-area");
        if (!completionArea) {
            completionArea = document.createElement("section");
            completionArea.className = "portfolio-completion-area";
        }
        overview.insertBefore(completionArea, contourGrid.nextSibling);
        completionArea.innerHTML = renderCompletedProjectsArea(normalizedTasks);
        completionArea.hidden = !completionArea.innerHTML.trim();
        bindCompletedProjectActions(completionArea);
    }
    contourGrid.innerHTML = `
        <div class="portfolio-row is-header">
            <div class="portfolio-cell">Направление</div>
            <div class="portfolio-cell">Что меняем в продукте</div>
            <div class="portfolio-cell">Ближайший результат</div>
            <div class="portfolio-cell">Состояние</div>
            <div class="portfolio-cell portfolio-readiness-head">Готовность</div>
            <div class="portfolio-cell portfolio-action-head" aria-hidden="true"></div>
        </div>
        ${contours.map((summary) => `
            ${renderExecutiveContourCard(summary)}
            ${expandedExecutiveContourId === summary.contour.id ? renderDirectionExpandInline(summary) : ""}
        `).join("")}
    `;
    contourGrid.querySelectorAll(".portfolio-row.is-data[data-contour-id]").forEach((row) => {
        row.addEventListener("click", () => {
            const contourId = row.getAttribute("data-contour-id") || "all";
            if (portfolioClickTimer) window.clearTimeout(portfolioClickTimer);
            portfolioClickTimer = window.setTimeout(() => {
                applyContourFilter(contourId, true);
                portfolioClickTimer = null;
            }, 220);
        });
        row.addEventListener("dblclick", (event) => {
            if (event.target.closest(".portfolio-action")) return;
            event.preventDefault();
            if (portfolioClickTimer) {
                window.clearTimeout(portfolioClickTimer);
                portfolioClickTimer = null;
            }
            const contourId = row.getAttribute("data-contour-id") || null;
            if (contourId) openDirectionsDialog(contourId);
        });
        row.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            const contourId = row.getAttribute("data-contour-id") || "all";
            applyContourFilter(contourId, true);
        });
    });
    contourGrid.querySelectorAll(".portfolio-action[data-contour-id]").forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const contourId = button.getAttribute("data-contour-id") || null;
            toggleDirectionExpand(contourId);
        });
        button.addEventListener("dblclick", (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
    });
}

        function loadContourFilter() {
            try {
                const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
                const validIds = new Set(["all", ...getDirectionConfig().map((item) => item.id)]);
                return validIds.has(stored) ? stored : "all";
            } catch (error) {
                return "all";
            }
        }

        function renderContourFilter() {
            if (!contourFilter) return;
            const filters = [
                { id: "all", title: "Все" },
                ...getDirectionConfig().map((contour) => ({ id: contour.id, title: contour.title }))
            ];
            contourFilter.innerHTML = filters.map((filter) => `
                <button class="contour-filter-btn ${currentContourFilter === filter.id ? "is-active" : ""}" type="button" data-filter-id="${escapeHtml(filter.id)}">
                    ${escapeHtml(filter.title)}
                </button>
            `).join("");
            contourFilter.querySelectorAll("[data-filter-id]").forEach((button) => {
                button.addEventListener("click", () => {
                    const filterId = button.getAttribute("data-filter-id") || "all";
                    applyContourFilter(filterId, false);
                });
            });
        }

        function applyContourFilter(contourId, scrollToProjects) {
            currentContourFilter = contourId || "all";
            if (scrollToProjects && currentContourFilter !== "all") {
                expandedExecutiveContourId = currentContourFilter;
            }
            try {
                localStorage.setItem(VIEW_MODE_STORAGE_KEY, currentContourFilter);
            } catch (error) {
                // ignore storage errors for автономный HTML
            }
            renderExecutiveView();
            renderDirectionExpand();
            renderContourFilter();
            renderBoard();
            renderSummary();
            if (scrollToProjects && projectDetailHead) {
                projectDetailHead.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }

        function toggleDirectionExpand(contourId) {
            expandedExecutiveContourId = expandedExecutiveContourId === contourId ? null : contourId;
            renderExecutiveView();
            renderDirectionExpand();
        }

        function buildExecutiveContours(tasks) {
            const buckets = new Map();
            getDirectionConfig().forEach((contour) => {
                buckets.set(contour.id, { contour, tasks: [] });
            });

            tasks.forEach((task) => {
                const normalized = normalizeTaskFromJson(task, 0);
                const contour = resolveContour(normalized);
                if (buckets.has(contour.id)) {
                    buckets.get(contour.id).tasks.push(normalized);
                }
            });

            return [...buckets.values()].map((entry) => summarizeContour(entry.contour, entry.tasks));
        }

        function summarizeContour(contour, tasks) {
            const uniqueProjects = [...new Map(tasks.map((task) => [String(task.id), task])).values()];
            const releasePackages = collectReleasePackages(uniqueProjects);
            const nearestRelease = pickNearestReleasePackage(releasePackages);
            const riskyTasks = uniqueProjects.filter((task) => isRiskTask(task));
            const weeklyLines = collectWeeklyChanges(uniqueProjects);
            const executiveResult = buildExecutiveResult(uniqueProjects);
            const actualHoursValues = uniqueProjects
                .map((task) => task.actualHours)
                .filter((value) => value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value)));
            const actualHours = actualHoursValues.reduce((sum, value) => sum + Number(value), 0);
            const averageProgress = calculateExecutiveReadiness(uniqueProjects);
            const weeklyProgress = uniqueProjects.reduce((sum, task) => sum + normalizeProgress(task.weeklyProgress), 0);

            return {
                contour,
                projects: uniqueProjects,
                releasePackages,
                nearestRelease,
                hasActualHours: actualHoursValues.length > 0,
                actualHours,
                averageProgress,
                weeklyProgress,
                riskCount: riskyTasks.length,
                riskyTasks,
                weeklyLines,
                executiveResult
            };
        }

        function getPortfolioIcon(id) {
            const icons = {
                weight: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 18v-5M12 18V8M18 18V5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M5 19h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
                cardio: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 20s-7-4.5-8.5-9A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8.5 4c-1.5 4.5-8.5 9-8.5 9Z" fill="currentColor"/></svg>',
                neem_devices: '<svg viewBox="0 0 24 24" fill="none"><rect x="7" y="4" width="10" height="16" rx="3" stroke="currentColor" stroke-width="2"/><path d="M10 16h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
                gobe_lora: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="8" y="2.5" width="8" height="4" rx="1.5" stroke="currentColor" stroke-width="2"/><rect x="6.5" y="6" width="11" height="12" rx="3" stroke="currentColor" stroke-width="2"/><rect x="8" y="17.5" width="8" height="4" rx="1.5" stroke="currentColor" stroke-width="2"/><path d="M8.7 12h2.4l1.5-2.3 2.6 4.2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                gobe_u_simple: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7.4 8.4c1.7-3.2 5.8-4.4 9.1-2.7 3.3 1.8 4.5 5.9 2.7 9.1-1.8 3.3-5.9 4.5-9.1 2.7-3.2-1.7-4.4-5.8-2.7-9.1Z" stroke="currentColor" stroke-width="2"/><path d="M8.7 15.6 15.8 5.9M8.2 18.4l3.4-12.8M12.4 19.3l3.9-12.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12.4" cy="11.4" r=".8" fill="currentColor"/><circle cx="13.5" cy="9.5" r=".7" fill="currentColor"/></svg>',
                gobe5: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="8" y="2.5" width="8" height="4" rx="1.5" stroke="currentColor" stroke-width="2"/><rect x="6.5" y="6" width="11" height="12" rx="3" stroke="currentColor" stroke-width="2"/><rect x="8" y="17.5" width="8" height="4" rx="1.5" stroke="currentColor" stroke-width="2"/><path d="M8.8 12h2.6l1.8 1.8 2.8-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                regulatory: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3 19 6v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6l7-3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
                b2b_research: '<svg viewBox="0 0 24 24" fill="none"><circle cx="8" cy="9" r="3" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="8" r="2.5" stroke="currentColor" stroke-width="2"/><path d="M3.5 19a4.5 4.5 0 0 1 9 0M13.5 19a3.5 3.5 0 0 1 7 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
            };
            return icons[id] || icons.weight;
        }

        function calculateExecutiveReadiness(tasks) {
            if (!tasks.length) return 0;
            const total = tasks.reduce((sum, task) => sum + normalizeProgress(task.releaseProgress), 0);
            return Math.round(total / tasks.length);
        }

        function isTaskInWork(task) {
            const activeStatuses = new Set([
                "discovery",
                "contract",
                "in-progress",
                "development",
                "test",
                "risk"
            ]);

            return activeStatuses.has(String(task?.status || "").trim());
        }

        function buildDirectionHorizon(tasks, releasePackages, reportDate) {
            const dates = [];
            const baseline = reportDate || getReportDate();

            tasks.forEach((task) => {
                const taskReleaseDate = parseDisplayDate(task.releaseDate);
                if (taskReleaseDate && taskReleaseDate.getTime() >= baseline.getTime()) {
                    dates.push(taskReleaseDate);
                }

                (task.achievements || []).forEach((achievement) => {
                    if (!achievement) return;
                    if (!["planned", "in-progress"].includes(achievement.status)) return;

                    const achievementDate = parseDisplayDate(achievement.date);
                    if (achievementDate && achievementDate.getTime() >= baseline.getTime()) {
                        dates.push(achievementDate);
                    }
                });
            });

            (releasePackages || []).forEach((pkg) => {
                const packageDate = parseDisplayDate(pkg.date);
                if (packageDate && packageDate.getTime() >= baseline.getTime()) {
                    dates.push(packageDate);
                }
            });

            if (!dates.length) return "не задан";

            const maxDate = dates.sort((a, b) => b.getTime() - a.getTime())[0];
            return formatHorizonMonth(maxDate);
        }

        function formatHorizonMonth(date) {
            const months = [
                "янв.",
                "февр.",
                "мар.",
                "апр.",
                "мая",
                "июн.",
                "июл.",
                "авг.",
                "сент.",
                "окт.",
                "нояб.",
                "дек."
            ];

            return `${months[date.getMonth()]} ${date.getFullYear()}`;
        }

        function buildExecutiveResult(tasks) {
            const reportDate = getReportDate();
            const releasePackage = pickNearestDirectionReleasePackage(tasks, reportDate);
            if (releasePackage) {
                const packageTasks = tasks.filter((task) => resolveReleasePackage(task)?.id === releasePackage.id);
                const projectTitles = packageTasks
                    .map((task) => cleanProjectTitle(task.title))
                    .filter(Boolean);
                return `${releasePackage.label || formatShortRussianDate(parseDisplayDate(releasePackage.date))}: ${joinUnique(projectTitles).join(" + ") || cleanExecutiveResultText(releasePackage.title)}`;
            }

            const achievementResult = buildFutureAchievementResult(tasks, reportDate);
            if (achievementResult) return achievementResult;

            const releaseDateResult = buildTaskReleaseDateResult(tasks, reportDate);
            return releaseDateResult || "не задан";
        }

        function pickNearestDirectionReleasePackage(tasks, reportDate) {
            const packages = collectReleasePackages(tasks)
                .filter((pkg) => {
                    const parsed = parseDisplayDate(pkg.date);
                    return parsed && parsed.getTime() >= reportDate.getTime();
                })
                .sort((a, b) => compareDisplayDates(a.date, b.date));
            return packages[0] || null;
        }

        function buildFutureAchievementResult(tasks, reportDate) {
            const items = [];
            tasks.forEach((task) => {
                (task.achievements || []).forEach((achievement) => {
                    if (!achievement || achievement.status === "done") return;
                    const parsedDate = parseDisplayDate(achievement.date);
                    if (!parsedDate || parsedDate.getTime() < reportDate.getTime()) return;
                    const text = cleanExecutiveResultText(achievement.text);
                    if (!text || text === "Ближайший результат пока не определен.") return;
                    items.push({ date: parsedDate, text });
                });
            });
            if (!items.length) return "";
            const grouped = new Map();
            items
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .forEach((item) => {
                    const key = formatDateLabel(item.date);
                    if (!grouped.has(key)) grouped.set(key, { date: item.date, texts: [] });
                    grouped.get(key).texts.push(item.text);
                });
            return [...grouped.values()]
                .slice(0, 2)
                .map((group) => `${formatShortRussianDate(group.date)}: ${joinUnique(group.texts).join(" / ")}`)
                .join(" · ");
        }

        function buildTaskReleaseDateResult(tasks, reportDate) {
            const candidates = tasks
                .map((task) => ({ task, date: parseDisplayDate(task.releaseDate) }))
                .filter((item) => item.date && item.date.getTime() >= reportDate.getTime())
                .sort((a, b) => a.date.getTime() - b.date.getTime());
            if (!candidates.length) return "";
            const firstDate = candidates[0].date;
            const sameDateTitles = candidates
                .filter((item) => item.date.getTime() === firstDate.getTime())
                .map((item) => cleanProjectTitle(item.task.title));
            return `${formatShortRussianDate(firstDate)}: ${joinUnique(sameDateTitles).join(" + ")}`;
        }

        function getReportDate() {
            const explicit = parseReportDateValue(state.reportDate);
            if (explicit) return explicit;
            const fromMeta = parseReportDateValue(parseRussianDateFromMeta(String(state.meta || "")));
            if (fromMeta) return fromMeta;
            return new Date(0);
        }

        function parseReportDateValue(value) {
            const raw = String(value || "").trim();
            if (!raw) return null;
            const displayDate = parseDisplayDate(raw);
            if (displayDate) return displayDate;
            const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!isoMatch) return null;
            const parsed = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        }

        function formatShortRussianDate(date) {
            if (!date) return "н/д";
            const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
            return `${date.getDate()} ${months[date.getMonth()]}`;
        }

        function joinUnique(items) {
            return [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))];
        }

        function renderPortfolioDashboardSummary(contours) {
    const total = contours.length;
    const statuses = contours.map(getDirectionHealthStatus);
    const onTrack = statuses.filter((status) => status.id === "on-track").length;
    const attention = statuses.filter((status) => status.id === "attention").length;
    const early = statuses.filter((status) => status.id === "early").length;
    const nearest = buildPortfolioNearestItems(state.tasks);
    const nearestLine = nearest.items.length
        ? nearest.items.map((item) => `${item.date} — ${item.text}`).join("; ")
        : "Ближайшие результаты пока не заданы";

    return `
        <article class="portfolio-summary-card is-total">
            <span class="portfolio-summary-icon" aria-hidden="true">${getSummaryIcon("total")}</span>
            <span class="portfolio-summary-label">Всего направлений</span>
            <strong>${total}</strong>
        </article>
        <article class="portfolio-summary-card is-ok">
            <span class="portfolio-summary-icon" aria-hidden="true">${getSummaryIcon("ok")}</span>
            <span class="portfolio-summary-label">В графике</span>
            <div class="portfolio-summary-value"><strong>${onTrack}</strong><span>${getPortfolioSummaryPercent(onTrack, total)}%</span></div>
        </article>
        <article class="portfolio-summary-card is-warning">
            <span class="portfolio-summary-icon" aria-hidden="true">${getSummaryIcon("warning")}</span>
            <span class="portfolio-summary-label">Требуют внимания</span>
            <div class="portfolio-summary-value"><strong>${attention}</strong><span>${getPortfolioSummaryPercent(attention, total)}%</span></div>
        </article>
        <article class="portfolio-summary-card is-danger">
            <span class="portfolio-summary-icon" aria-hidden="true">${getSummaryIcon("danger")}</span>
            <span class="portfolio-summary-label">Ранняя стадия</span>
            <div class="portfolio-summary-value"><strong>${early}</strong><span>${getPortfolioSummaryPercent(early, total)}%</span></div>
        </article>
        <article class="portfolio-summary-card is-results">
            <span class="portfolio-summary-icon" aria-hidden="true">${getSummaryIcon("results")}</span>
            <div>
                <span class="portfolio-summary-label">Ближайшие ключевые результаты</span>
                <ul class="portfolio-summary-results" title="${escapeHtml(nearestLine)}">
                    ${nearest.items.length
                        ? nearest.items.map((item) => `
                            <li>
                                <span class="summary-result-date">${escapeHtml(item.date)}</span>
                                <span>${escapeHtml(item.text)}</span>
                            </li>
                        `).join("")
                        : `<li class="is-empty"><span>Ближайшие результаты пока не заданы</span></li>`}
                </ul>
            </div>
        </article>
    `;
}

function getSummaryIcon(kind) {
    const icons = {
        total: '<svg viewBox="0 0 96 96" fill="none" aria-hidden="true"><defs><linearGradient id="summaryTotalBg" x1="18" y1="14" x2="82" y2="84" gradientUnits="userSpaceOnUse"><stop stop-color="#2563EB"/><stop offset="1" stop-color="#93C5FD"/></linearGradient><filter id="summaryTotalShadow" x="0" y="0" width="96" height="96" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#0F172A" flood-opacity="0.16"/></filter><filter id="summaryTotalNodeShadow" x="14" y="14" width="68" height="68" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.12"/></filter></defs><rect x="8" y="8" width="80" height="80" rx="22" fill="url(#summaryTotalBg)" filter="url(#summaryTotalShadow)"/><rect x="12" y="12" width="72" height="72" rx="19" fill="white" opacity="0.07"/><g stroke="white" stroke-width="2.6" stroke-linecap="round" opacity="0.7"><path d="M48 48L48 23"/><path d="M48 48L66 30"/><path d="M48 48L73 48"/><path d="M48 48L66 66"/><path d="M48 48L48 73"/><path d="M48 48L30 66"/><path d="M48 48L23 48"/><path d="M48 48L30 30"/></g><g filter="url(#summaryTotalNodeShadow)"><circle cx="48" cy="23" r="5.5" fill="white"/><circle cx="66" cy="30" r="5.5" fill="white"/><circle cx="73" cy="48" r="5.5" fill="white"/><circle cx="66" cy="66" r="5.5" fill="white"/><circle cx="48" cy="73" r="5.5" fill="white"/><circle cx="30" cy="66" r="5.5" fill="white"/><circle cx="23" cy="48" r="5.5" fill="white"/><circle cx="30" cy="30" r="5.5" fill="white"/></g><circle cx="48" cy="48" r="13" fill="white" opacity="0.98"/><circle cx="48" cy="48" r="7" fill="#2563EB"/><g stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M44.5 48.5L47.2 51.2L52.2 45.8"/></g></svg>',
        ok: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5 9.5 17 19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 4 21 20H3L12 4Z" fill="currentColor"/><path d="M12 9v5M12 17h.01" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>',
        danger: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 6v7l4 3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.2"/></svg>',
        results: '<svg viewBox="0 0 24 24" fill="none"><path d="m12 3 2.2 5.2 5.6.5-4.2 3.7 1.3 5.5L12 15l-4.9 2.9 1.3-5.5-4.2-3.7 5.6-.5L12 3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
    };
    return icons[kind] || icons.total;
}

        function getMiniIcon(kind) {
    const icons = {
        plan: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5.5" width="16" height="14" rx="3"/><path d="M8 3.5v4"/><path d="M16 3.5v4"/><path d="M4 10h16"/><path d="M8 15l2.2 2.2L16 12.8"/></g></svg>',
        milestones: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 21V4"/><path d="M6 5h12l-3 4 3 4H6"/><path d="M9 9h5"/></g></svg>'
    };
    return icons[kind] || "";
}

        function buildPortfolioNearestItems(tasks) {
    const baseline = getReportDate();
    const candidates = (tasks || [])
        .map((task, index) => normalizeTaskFromJson(task, index))
        .map((task) => ({ task, date: parseDisplayDate(task.releaseDate) }))
        .filter((item) => item.date && !isCompletedReleaseCandidate(item.task))
        .filter((item) => item.date.getTime() >= baseline.getTime())
        .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (!candidates.length) return { date: "", items: [] };

    const releaseGroups = new Map();
    candidates.forEach((item) => {
        const key = item.date.getTime();
        if (!releaseGroups.has(key)) {
            releaseGroups.set(key, { date: item.date, titles: [] });
        }
        releaseGroups.get(key).titles.push(cleanProjectTitle(item.task.title) || "Релизный результат");
    });

    const nearestItems = [...releaseGroups.values()]
        .slice(0, 3)
        .map((group) => ({
            date: formatShortRussianDate(group.date),
            text: joinUnique(group.titles).join(" + ")
        }));

    return {
        items: nearestItems
    };
}

function isCompletedReleaseCandidate(task) {
    if (String(task?.status || "").trim().toLowerCase() === "done") return true;
    if (normalizeProgress(task?.releaseProgress) >= 100) return true;

    const milestones = (task?.achievements || []).filter(Boolean);
    return milestones.length > 0 && milestones.every((milestone) =>
        String(milestone.status || "").trim().toLowerCase() === "done"
        || normalizeMilestoneProgress(milestone.progress, milestone.status) >= 100
    );
}

function isCompletedProject(task) {
    return String(task?.status || "").trim().toLowerCase() === "done";
}

function getProjectCompletionDate(task) {
    const explicitDate = parseDisplayDate(task?.completedAt);
    if (explicitDate) return explicitDate;
    return isCompletedProject(task) ? getReportDate() : null;
}

function isCompletionInCurrentReport(task, reportDate) {
    const completedDate = getProjectCompletionDate(task);
    if (!completedDate || !reportDate) return false;
    const end = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate());
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return completedDate.getTime() >= start.getTime() && completedDate.getTime() <= end.getTime();
}

function renderCompletedProjectsArea(tasks) {
    const completed = (tasks || [])
        .filter(isCompletedProject)
        .sort((a, b) => (getProjectCompletionDate(b)?.getTime() || 0) - (getProjectCompletionDate(a)?.getTime() || 0));
    if (!completed.length) return "";

    const reportDate = getReportDate();
    const recent = completed.filter((task) => isCompletionInCurrentReport(task, reportDate));
    const archived = completed.filter((task) => !isCompletionInCurrentReport(task, reportDate));
    const recentMarkup = recent.length ? `
        <div class="portfolio-completion-head">
            <div>
                <span class="portfolio-completion-kicker">Результаты недели</span>
                <h3>Завершено на этой неделе</h3>
            </div>
            <span class="portfolio-completion-count">${recent.length}</span>
        </div>
        <div class="portfolio-completion-grid">
            ${recent.map(renderCompletedProjectCard).join("")}
        </div>
    ` : "";
    const archiveMarkup = archived.length ? `
        <details class="portfolio-completion-archive">
            <summary>
                <span>Архив завершенных проектов</span>
                <span class="portfolio-completion-count">${archived.length}</span>
            </summary>
            <div class="portfolio-completion-archive-list">
                ${archived.map(renderArchivedProjectRow).join("")}
            </div>
        </details>
    ` : "";

    return `${recentMarkup}${archiveMarkup}`;
}

function renderCompletedProjectCard(task) {
    const completedDate = getProjectCompletionDate(task);
    const direction = resolveContour(task);
    const hours = normalizeHours(task.actualHours);
    const meta = [direction.title, completedDate ? `завершено ${formatShortRussianDate(completedDate)}` : "завершено", hours !== "" ? `${formatHours(hours)} ч` : ""]
        .filter(Boolean)
        .join(" · ");
    return `
        <button class="portfolio-completed-card" type="button" data-completed-task-id="${escapeHtml(String(task.id))}">
            <span class="portfolio-completed-check" aria-hidden="true">✓</span>
            <span class="portfolio-completed-copy">
                <strong>${escapeHtml(cleanProjectTitle(task.title))}</strong>
                <span>${escapeHtml(meta)}</span>
            </span>
            <span class="portfolio-completed-mark">Готово</span>
        </button>
    `;
}

function renderArchivedProjectRow(task) {
    const completedDate = getProjectCompletionDate(task);
    const direction = resolveContour(task);
    return `
        <button class="portfolio-completed-row" type="button" data-completed-task-id="${escapeHtml(String(task.id))}">
            <span class="portfolio-completed-check" aria-hidden="true">✓</span>
            <strong>${escapeHtml(cleanProjectTitle(task.title))}</strong>
            <span>${escapeHtml(direction.title)}</span>
            <time>${escapeHtml(completedDate ? formatShortRussianDate(completedDate) : "без даты")}</time>
        </button>
    `;
}

function bindCompletedProjectActions(container) {
    container.querySelectorAll("[data-completed-task-id]").forEach((button) => {
        button.addEventListener("click", () => {
            const taskId = button.getAttribute("data-completed-task-id") || "";
            const task = state.tasks.find((item) => String(item.id) === taskId);
            if (task) openDetailDialog(task.id);
        });
    });
}

        function getPortfolioSummaryPercent(value, total) {
    if (!total) return 0;
    return Math.round((value / total) * 100);
}

        function getDirectionHealthStatus(summary) {
    const projects = summary?.projects || [];
    const progress = Number(summary?.averageProgress || 0);
    if (!projects.length) {
        return { id: "unknown", label: "Неизвестно", color: "#94a3b8", textColor: "#64748b" };
    }

    const reportDate = getReportDate();
    const earlyStatuses = new Set(["planned", "preparation", "evaluation", "discovery"]);
    const earlyCount = projects.filter((task) => earlyStatuses.has(String(task.status || "").trim())).length;
    const attentionProjects = projects.filter(hasTaskAttentionSignal);
    const schedule = buildDirectionScheduleSignals(projects, reportDate);
    const earlyShare = earlyCount / projects.length;
    const attentionShare = attentionProjects.length / projects.length;
    const hasNearestAttention = hasAttentionOnNearestProject(projects, reportDate);
    const nearestReadiness = getNearestProjectReadiness(projects, reportDate);

    if (
        schedule.overdueCount > 0
        || schedule.criticalBehindCount > 0
        || hasNearestAttention
        || attentionShare >= 0.3
    ) {
        return { id: "attention", label: "Требует внимания", color: "#f59e0b", textColor: "#ea580c" };
    }
    if (progress <= 15 || (earlyShare >= 0.6 && progress < 35)) {
        return { id: "early", label: "Ранняя стадия", color: "#3b82f6", textColor: "#2563eb" };
    }
    if (schedule.weakSignalCount > 0 || nearestReadiness.lag >= 15 || (!nearestReadiness.hasDate && progress < 35)) {
        return { id: "partial", label: "Частично в графике", color: "#f59e0b", textColor: "#d97706" };
    }
    return { id: "on-track", label: "В графике", color: "#22b76b", textColor: "#16a34a" };
}

        function hasTaskAttentionSignal(task) {
    return hasMeaningfulFocusText(task?.focus)
        || hasMeaningfulFocusText(task?.ceoFocus);
}

        function hasAttentionOnNearestProject(projects, reportDate) {
    const baseline = reportDate || getReportDate();
    if (!projects.length || Number.isNaN(baseline.getTime())) return false;

    const candidates = projects
        .map((task) => ({ task, date: parseDisplayDate(task.releaseDate) }))
        .filter((item) => item.date && item.date.getTime() >= baseline.getTime())
        .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (!candidates.length) return false;

    const nearestTime = candidates[0].date.getTime();
    return candidates
        .filter((item) => item.date.getTime() === nearestTime)
        .some((item) => hasTaskAttentionSignal(item.task));
}

        function getNearestProjectReadiness(projects, reportDate) {
    const baseline = reportDate || getReportDate();
    if (!projects.length || Number.isNaN(baseline.getTime())) {
        return { hasDate: false, actual: 0, expected: 0, lag: 0 };
    }

    const candidates = projects
        .map((task) => ({ task, date: parseDisplayDate(task.releaseDate) }))
        .filter((item) => item.date && item.date.getTime() >= baseline.getTime())
        .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (!candidates.length) {
        const actual = Math.round(Number(projects.reduce((sum, task) => sum + normalizeProgress(task.releaseProgress), 0) / projects.length) || 0);
        return { hasDate: false, actual, expected: 35, lag: Math.max(0, 35 - actual) };
    }

    const nearestTime = candidates[0].date.getTime();
    const nearest = candidates.filter((item) => item.date.getTime() === nearestTime);
    const actual = Math.round(nearest.reduce((sum, item) => sum + normalizeProgress(item.task.releaseProgress), 0) / nearest.length);
    const expected = Math.round(nearest.reduce((sum, item) => sum + getExpectedProgressForTask(item.task, baseline, item.date), 0) / nearest.length);
    return { hasDate: true, actual, expected, lag: Math.max(0, expected - actual) };
}

        function buildDirectionScheduleSignals(projects, reportDate) {
    const baseline = reportDate || getReportDate();
    let overdueCount = 0;
    let criticalBehindCount = 0;
    let weakSignalCount = 0;

    projects.forEach((task) => {
        const progress = normalizeProgress(task.releaseProgress);
        const releaseDate = parseDisplayDate(task.releaseDate);
        if (!releaseDate || Number.isNaN(baseline.getTime())) return;

        const daysToRelease = Math.ceil((releaseDate.getTime() - baseline.getTime()) / 86400000);
        const expected = getExpectedProgressForTask(task, baseline, releaseDate);
        const lag = expected - progress;

        if (daysToRelease < 0 && progress < 100) {
            overdueCount += 1;
            return;
        }
        if ((daysToRelease <= 21 && progress < 50) || lag >= 50) {
            criticalBehindCount += 1;
            return;
        }
        if ((daysToRelease <= 60 && progress < 55) || lag >= 30) {
            weakSignalCount += 1;
        }
    });

    return { overdueCount, criticalBehindCount, weakSignalCount };
}

        function getExpectedProgressForTask(task, reportDate, releaseDate) {
    const daysToRelease = Math.ceil((releaseDate.getTime() - reportDate.getTime()) / 86400000);
    if (daysToRelease <= 30) return 80;
    if (daysToRelease <= 60) return 65;
    if (daysToRelease <= 90) return 50;
    if (daysToRelease <= 180) return 35;
    return 15;
}

        function splitExecutiveResult(value) {
    const raw = String(value || "не задан").trim();
    const firstColon = raw.indexOf(":");
    if (firstColon > 0) {
        return {
            date: raw.slice(0, firstColon).trim(),
            text: raw.slice(firstColon + 1).trim() || "не задан"
        };
    }
    return { date: "", text: raw };
}

function renderPortfolioStateMetric(label, value, kind) {
    const icons = {
        milestones: getMiniIcon("milestones"),
        hours: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2"/><path d="M12 8v4l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
        plan: getMiniIcon("plan")
    };
    return `
        <div class="portfolio-state-card is-${escapeHtml(kind)}">
            <span class="portfolio-state-label">${icons[kind] || ""}${escapeHtml(label)}</span>
            <strong>${escapeHtml(value)}</strong>
        </div>
    `;
}

        function buildDirectionKeyInsight(summary, statusMeta, resultText, horizonText, milestonesText) {
    const resultParts = splitExecutiveResult(summary.executiveResult);
    const result = resultParts.text || resultText || "ближайшем результате";
    return `Направление сфокусировано на ${result}. Готовность ${summary.averageProgress}%, статус — ${statusMeta.label.toLowerCase()}; основной фокус — закрыть ${milestonesText} до горизонта ${horizonText}.`;
}

        function buildDirectionNextAction(summary) {
    const resultParts = splitExecutiveResult(summary.executiveResult);
    const dateText = resultParts.date ? ` к точке ${resultParts.date}` : "";
    const result = resultParts.text || summary.contour.title;
    return `Подготовить и закрыть ${result}${dateText}.`;
}

        function renderDirectionMilestonePanel(summary) {
    const items = summary.projects.map(normalizeDirectionMilestoneItem);
    const total = items.length;
    const done = items.filter((item) => item.status === "done").length;
    const inWork = items.filter((item) => ["in-progress", "development", "test", "contract"].includes(item.status)).length;
    const planned = items.filter((item) => ["planned", "evaluation", "discovery", "paused"].includes(item.status)).length;
    return `
        <div class="direction-panel direction-milestones-panel">
            <div class="direction-panel-head">
                <h4>Продуктовые вехи направления</h4>
                <span>${total} всего</span>
            </div>
            <div class="direction-milestone-summary">
                <span><strong>${inWork}</strong> в работе</span>
                <span><strong>${done}</strong> завершено</span>
                <span><strong>${planned}</strong> запланировано</span>
            </div>
            <ul class="direction-milestone-checklist">
                ${items.map((item) => `
                    <li class="is-${escapeHtml(item.status)}">
                        <span class="direction-milestone-dot" aria-hidden="true"></span>
                        <span class="direction-milestone-name">${escapeHtml(item.title)}</span>
                        <span class="direction-milestone-badge">${escapeHtml(item.label)}</span>
                    </li>
                `).join("")}
            </ul>
        </div>
    `;
}

        function normalizeDirectionMilestoneItem(task) {
    const progress = normalizeProgress(task.releaseProgress);
    const rawStatus = String(task.status || "").trim();
    if (rawStatus === "done" || progress >= 100) {
        return { title: cleanProjectTitle(task.title), status: "done", label: "Готово" };
    }
    const meta = getDirectionTaskStatusMeta(rawStatus);
    return { title: cleanProjectTitle(task.title), status: meta.status, label: meta.label };
}

        function getDirectionTaskStatusMeta(status) {
    const normalized = String(status || "").trim();
    const map = {
        planned: { status: "planned", label: "Запланировано" },
        preparation: { status: "evaluation", label: "Оценка" },
        evaluation: { status: "evaluation", label: "Оценка" },
        discovery: { status: "discovery", label: "Исследование" },
        contract: { status: "contract", label: "Договор" },
        "in-progress": { status: "in-progress", label: "В работе" },
        development: { status: "development", label: "Разработка" },
        test: { status: "test", label: "Тест" },
        paused: { status: "paused", label: "Пауза" },
        done: { status: "done", label: "Готово" },
        risk: { status: "in-progress", label: "В работе" }
    };
    return map[normalized] || map["in-progress"];
}

        function splitReleaseDateLabel(value) {
    const raw = String(value || "н/д").trim();
    const match = raw.match(/^(\d{1,2})(?:\s+(.+))?$/u);
    if (match) {
        return { day: match[1], month: match[2] || "" };
    }
    const parts = raw.split(/\s+/u);
    if (parts.length >= 2 && /^\d{1,2}$/u.test(parts[0])) {
        return { day: parts[0], month: parts.slice(1).join(" ") };
    }
    return { day: raw, month: "" };
}

        function renderExecutiveContourCard(summary) {
    const isExpanded = expandedExecutiveContourId === summary.contour.id;
    const resultParts = splitExecutiveResult(summary.executiveResult);
    const hoursText = summary.hasActualHours ? `${escapeHtml(formatHours(summary.actualHours))} ч` : "н/д";
    const statusMeta = getDirectionHealthStatus(summary);
    const progressAngle = Math.max(0, Math.min(100, summary.averageProgress)) * 3.6;
    const inWorkCount = summary.projects.filter(isTaskInWork).length;
    const milestonesText = `${inWorkCount} / ${summary.projects.length}`;
    const milestonesFullText = `${inWorkCount} в работе / ${summary.projects.length} всего`;
    const horizonText = buildDirectionHorizon(summary.projects, summary.releasePackages, getReportDate());
    const actionLabel = isExpanded ? "Скрыть состав" : "Показать состав";

    return `
        <div class="portfolio-row is-data ${isExpanded ? "is-active" : ""} is-${statusMeta.id}" data-contour-id="${escapeHtml(summary.contour.id)}" role="button" tabindex="0" style="--status-color: ${statusMeta.color}; --status-text: ${statusMeta.textColor};">
            <div class="portfolio-cell portfolio-direction-cell">
                <div class="portfolio-main">
                    <span class="contour-icon is-${escapeHtml(summary.contour.id)}" aria-hidden="true">${getPortfolioIcon(summary.contour.id)}</span>
                    <div class="portfolio-cell-inner">
                        <h3 class="portfolio-contour-title">${escapeHtml(summary.contour.title)}</h3>
                    </div>
                </div>
            </div>
            <div class="portfolio-cell portfolio-change-cell">
                <div class="portfolio-cell-inner">
                    <p class="portfolio-contour-goal">${escapeHtml(shortenText(summary.contour.goal, 150))}</p>
                </div>
            </div>
            <div class="portfolio-cell portfolio-result-cell">
                <div class="portfolio-result-block">
                    ${resultParts.date ? `<span class="portfolio-date-pill">${getMiniIcon("plan")}${escapeHtml(resultParts.date)}</span>` : ""}
                    <p class="portfolio-value portfolio-result">${escapeHtml(resultParts.text || "не задан")}</p>
                </div>
            </div>
            <div class="portfolio-cell portfolio-state-cell">
                <div class="portfolio-state-grid">
                    ${renderPortfolioStateMetric("Вехи", milestonesText, "milestones")}
                    ${renderPortfolioStateMetric("Часы", hoursText, "hours")}
                    ${renderPortfolioStateMetric("План", horizonText, "plan")}
                </div>
            </div>
            <div class="portfolio-cell portfolio-readiness-cell">
                <div class="portfolio-readiness">
                    <div class="portfolio-progress" style="--progress-angle: ${progressAngle}deg; --bar: ${statusMeta.color};">
                        <div class="portfolio-progress-ring" aria-label="Сводная готовность ${summary.averageProgress}%">
                            <span class="portfolio-progress-value">${summary.averageProgress}%</span>
                        </div>
                    </div>
                    <span class="portfolio-status-label">${escapeHtml(statusMeta.label)}</span>
                    <span class="portfolio-status-sr">${escapeHtml(milestonesFullText)}</span>
                </div>
            </div>
            <div class="portfolio-cell portfolio-action-cell">
                <button class="portfolio-action ${isExpanded ? "is-expanded" : ""}" type="button" data-contour-id="${escapeHtml(summary.contour.id)}" aria-label="${actionLabel}" title="${actionLabel}">
                    <span class="portfolio-action-icon" aria-hidden="true">
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                </button>
            </div>
        </div>
    `;
}

        function renderDirectionExpandInline(summary) {
    if (!summary || !summary.projects.length) return "";

    const resultText = buildDirectionExpandNearestPoint(summary);
    const horizonText = buildDirectionHorizon(summary.projects, summary.releasePackages, getReportDate());
    const inWorkCount = summary.projects.filter(isTaskInWork).length;
    const milestonesText = `${inWorkCount} в работе / ${summary.projects.length} всего`;
    const statusMeta = getDirectionHealthStatus(summary);
    const keyInsight = buildDirectionKeyInsight(summary, statusMeta, resultText, horizonText, milestonesText);
    const nextAction = buildDirectionNextAction(summary);
    const packageOrControlPointPanel = renderDirectionPackageOrControlPointPanel(summary);

    return `
        <div class="portfolio-expand-row" data-contour-expand-id="${escapeHtml(summary.contour.id)}" style="--status-color: ${statusMeta.color}; --status-text: ${statusMeta.textColor};">
            <div class="portfolio-expand-anchor" aria-hidden="true"></div>
            <section class="direction-expand is-visible" data-status="${escapeHtml(statusMeta.id)}">
                <div class="direction-expand-story" style="--status-color: ${statusMeta.color}; --status-text: ${statusMeta.textColor};">
                    <article class="direction-insight-card is-key">
                        <span class="direction-insight-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none"><path d="M12 4 20 8.5v7L12 20 4 15.5v-7L12 4Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8 12h8M8 15h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                        </span>
                        <div>
                            <h4>Ключевой вывод</h4>
                            <p>${escapeHtml(keyInsight)}</p>
                        </div>
                    </article>
                    <article class="direction-insight-card is-action">
                        <span class="direction-insight-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none"><path d="M5 12h12M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5" cy="12" r="2" fill="currentColor"/></svg>
                        </span>
                        <div>
                            <h4>Следующее действие</h4>
                            <p>${escapeHtml(shortenText(nextAction, 190))}</p>
                        </div>
                    </article>
                </div>
                <div class="direction-expand-body">
                    ${renderDirectionMilestonePanel(summary)}
                    ${packageOrControlPointPanel}
                </div>
            </section>
        </div>
    `;
}

        function renderDirectionExpand() {
    if (!directionExpand) return;
    directionExpand.classList.remove("is-visible");
    directionExpand.innerHTML = "";
}

        function buildDirectionExpandNearestPoint(summary) {
            if (summary.nearestRelease?.label) {
                return summary.nearestRelease.label;
            }

            const executiveResult = String(summary.executiveResult || "").trim();
            if (!executiveResult) return "не задан";

            const firstColon = executiveResult.indexOf(":");
            if (firstColon > 0) {
                return executiveResult.slice(0, firstColon).trim() || "не задан";
            }

            return executiveResult || "не задан";
        }

        function renderDirectionPackageOrControlPointPanel(summary) {
    const packageRows = buildDirectionPackageRows(summary);
    if (packageRows.length) {
        return `
            <div class="direction-panel direction-release-panel">
                <div class="direction-panel-head">
                    <h4>Релизные результаты</h4>
                    <span>${packageRows.length} точки</span>
                </div>
                <div class="direction-release-timeline">
                    ${packageRows.map((row, index) => {
                        const date = splitReleaseDateLabel(row[0]);
                        return `
                            <article class="direction-release-item ${index === 0 ? "is-nearest" : ""}">
                                <div class="direction-release-date">
                                    <strong>${escapeHtml(date.day)}</strong>
                                    ${date.month ? `<span>${escapeHtml(date.month)}</span>` : ""}
                                </div>
                                <div class="direction-release-copy">
                                    <div class="direction-release-title-row">
                                        <h5>${escapeHtml(row[1] || "Релизный результат")}</h5>
                                        ${index === 0 ? '<span class="direction-release-badge">Ближайшая точка</span>' : ""}
                                    </div>
                                    <p>${escapeHtml(row[2] || "Пользовательский эффект будет уточнен.")}</p>
                                </div>
                            </article>
                        `;
                    }).join("")}
                </div>
            </div>
        `;
    }

    const controlPointRows = buildDirectionControlPointRows(summary.projects, getReportDate());
    return `
        <div class="direction-panel direction-release-panel">
            <div class="direction-panel-head">
                <h4>Ближайшие контрольные точки</h4>
                <span>${controlPointRows.length} точки</span>
            </div>
            <div class="direction-release-timeline">
                ${controlPointRows.map((row, index) => {
                    const date = splitReleaseDateLabel(row[0]);
                    return `
                        <article class="direction-release-item ${index === 0 ? "is-nearest" : ""}">
                            <div class="direction-release-date">
                                <strong>${escapeHtml(date.day)}</strong>
                                ${date.month ? `<span>${escapeHtml(date.month)}</span>` : ""}
                            </div>
                            <div class="direction-release-copy">
                                <div class="direction-release-title-row">
                                    <h5>${escapeHtml(row[1] || "Контрольная точка")}</h5>
                                    ${index === 0 ? '<span class="direction-release-badge">Ближайшая точка</span>' : ""}
                                </div>
                            </div>
                        </article>
                    `;
                }).join("")}
            </div>
        </div>
    `;
}

        function buildDirectionPackageRows(summary) {
            const manualRows = normalizeDirectionReleaseResults(summary.contour.releaseResults).map((item) => [
                item.date || "н/д",
                item.result || "Релизный результат",
                item.userValue || "Пользовательский эффект будет уточнен."
            ]);
            if (manualRows.length) return manualRows;

            return summary.releasePackages.slice(0, 4).map((pkg) => [
                pkg.label || pkg.date || "н/д",
                pkg.title || "Релизный результат",
                getReleaseUserValue(pkg.id, pkg.title)
            ]);
        }

        function buildDirectionControlPointRows(tasks, reportDate) {
            const baseline = reportDate || getReportDate();
            const grouped = new Map();

            tasks.forEach((task) => {
                (task.achievements || []).forEach((achievement) => {
                    if (!achievement || achievement.status === "done") return;
                    const parsedDate = parseDisplayDate(achievement.date);
                    if (!parsedDate || parsedDate.getTime() < baseline.getTime()) return;

                    const key = String(parsedDate.getTime());
                    const group = grouped.get(key) || { date: parsedDate, texts: [] };
                    const text = cleanExecutiveResultText(achievement.text);
                    if (text) group.texts.push(text);
                    grouped.set(key, group);
                });
            });

            const rows = [...grouped.values()]
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .slice(0, 2)
                .map((group) => [
                    formatShortRussianDate(group.date),
                    joinUnique(group.texts).join(" / ")
                ]);

            return rows.length ? rows : [["", "Контрольные точки не заданы"]];
        }

        function getReleaseUserValue(id, title) {
            const values = {
                release_2026_05_12: "Пользователь получает стабильный сценарий NEEM MVP.",
                release_2026_06_29: "Экосистема устройств становится связнее и понятнее.",
                release_2026_08_31: "Пользователь лучше понимает данные и видит долгосрочную динамику.",
                release_2026_10_26: "Пользователь получает новые интерпретируемые показатели состояния.",
                release_2026_12_23: "Пользователь видит тренд и получает более прикладной план действий."
            };
            return values[id] || `Пользовательский эффект: ${title || "результат будет уточнен"}.`;
        }

        function cleanExecutiveResultText(value) {
            return String(value || "")
                .replace(/\([^)]*\)/gu, "")
                .replace(/\b\d{1,2}[./]\d{1,2}[./]\d{2,4}\b/gu, "")
                .replace(/\b\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\b/giu, "")
                .replace(/\s*[·–—-]\s*$/gu, "")
                .replace(/\s{2,}/gu, " ")
                .trim() || "Ближайший результат пока не определен.";
        }

        function cleanProjectTitle(title) {
            return String(title || "Без названия").replace(/\s*\([^)]*\)\s*$/u, "").trim();
        }

        function renderBoard() {
            boardGrid.innerHTML = "";
            const visibleTasks = getVisibleTasks(state.tasks);
            if (!visibleTasks.length) {
                boardGrid.innerHTML = currentContourFilter === "all"
                    ? '<div class="empty">Пока нет задач. Нажмите "Добавить задачу" или вставьте JSON с подготовленным набором работ.</div>'
                    : '<div class="empty">Для выбранного направления задачи пока не найдены. Попробуйте переключиться на другой фильтр.</div>';
                return;
            }
            buildOwnerGroups(visibleTasks).forEach((group) => {
                const block = document.createElement("section");
                block.className = "owner-block";
                const ownerCard = document.createElement("article");
                ownerCard.className = "owner-card";
                ownerCard.innerHTML = `<h2 class="owner-title">Сотрудник</h2><p class="owner-name">${escapeHtml(group.owner)}</p>`;
                block.appendChild(ownerCard);
                const head = document.createElement("div");
                head.className = "owner-table-head";
                head.innerHTML = `
                    <span>Проект</span>
                    <span>Релиз</span>
                    <span>Статус</span>
                    <span>Прогресс</span>
                    <span>Сделано</span>
                    <span>Контрольные точки</span>
                    <span></span>
                `;
                block.appendChild(head);
                group.tasks.forEach((task) => {
                    block.appendChild(buildTaskCard(task));
                    if (expandedTaskId === task.id) {
                        block.appendChild(buildRoadmapPanel(task));
                    }
                });
                boardGrid.appendChild(block);
            });
        }

        function buildTaskCard(task) {
            const card = document.createElement("article");
            card.className = "task-card";
            card.dataset.status = task.status || "in-progress";
            card.dataset.taskId = String(task.id);
            const normalized = enrichTask(task);
            const taskChange = getTaskChange(normalized.id);
            const changedFields = new Set(Object.keys(taskChange?.changedFields || {}));
            if (taskChange) card.classList.add("has-changes");
            const statusMeta = STATUS_META[normalized.status] || STATUS_META["in-progress"];
            const focusText = String(task.focus || "").trim();
            const focusMarkup = focusText
                ? `<p class="task-focus-inline"><span class="task-focus-icon" aria-hidden="true"></span><span class="task-focus-text">${escapeHtml(focusText)}</span></p>`
                : "";
            const releaseProgress = normalizeProgress(normalized.releaseProgress);
            const weeklyProgress = normalizeProgress(normalized.weeklyProgress);
            const hoursMarkup = renderHoursMeta(normalized.actualHours, normalized.plannedHours);
            const releaseBandMarkup = renderReleaseBand(normalized);
            const changeMarkup = taskChange ? renderTaskChangeBadge(taskChange) : "";
            const projectChanged = hasAnyChangedField(changedFields, ["title", "domain", "description", "owner", "focus", "summary", "ceoFocus"]);
            const releaseChanged = hasAnyChangedField(changedFields, ["releaseDate", "releaseNumber"]);
            const statusChanged = hasAnyChangedField(changedFields, ["status", "actualHours", "plannedHours"]);
            const progressChanged = hasAnyChangedField(changedFields, ["releaseProgress", "weeklyProgress"]);
            card.innerHTML = `
                <div class="task-project ${projectChanged ? "field-changed" : ""}">
                    <span class="cell-label">Проект</span>
                    <h3 class="task-title">${escapeHtml(normalized.title || "Без названия")}</h3>
                    ${changeMarkup}
                    <span class="task-program-inline">${escapeHtml(normalized.domain || "Без направления")}</span>
                    <p class="task-meta">${escapeHtml(normalized.description || "Короткое описание не заполнено.")}</p>
                    ${focusMarkup}
                </div>
                <div class="task-release ${releaseChanged ? "field-changed" : ""}">
                    <span class="cell-label">Релиз</span>
                    <div class="task-release-date">${escapeHtml(normalized.releaseDate || "не указан")}</div>
                    ${releaseBandMarkup}
                </div>
                <div class="task-status-progress-cell ${statusChanged ? "field-changed" : ""}">
                    <span class="cell-label">Статус</span>
                    <span class="status-chip ${statusMeta.className}">${statusMeta.label}</span>
                    ${hoursMarkup}
                </div>
                <div class="task-progress-cell ${progressChanged ? "field-changed" : ""}">
                    <span class="cell-label">Прогресс</span>
                    <div class="task-progress-main">Total ${releaseProgress}%</div>
                    <div class="task-progress-sub">Неделя +${weeklyProgress}%</div>
                </div>
                <div class="task-summary-cell ${changedFields.has("artifactNote") || changedFields.has("artifactTitle") ? "field-changed" : ""}">
                    <span class="cell-label">Сделано</span>
                    ${renderCompactText(normalized.artifactNote, "Артефакт не зафиксирован.")}
                </div>
                <div class="task-milestones-cell ${changedFields.has("achievements") ? "field-changed" : ""}">
                    <span class="cell-label">Контрольные точки</span>
                    ${renderCompactMilestones(normalized.achievements, { activeOnly: true })}
                </div>
                <div class="task-actions">
                    <button class="btn-inline" type="button" aria-label="Открыть карточку проекта">▾</button>
                </div>
            `;
            card.querySelector(".btn-inline").addEventListener("click", (event) => {
                event.stopPropagation();
                clearScheduledRoadmapToggle();
                openDetailDialog(task.id);
            });
            card.addEventListener("click", () => scheduleRoadmapToggle(task.id));
            card.addEventListener("dblclick", () => {
                clearScheduledRoadmapToggle();
                openTaskDialog(task.id);
            });
            return card;
        }

        function buildRoadmapPanel(task) {
            const normalized = enrichTask(task);
            const milestones = getRoadmapMilestones(normalized.achievements);
            const summaryText = String(task.summary || "").trim();
            const roadmap = document.createElement("section");
            roadmap.className = "roadmap-panel";
            roadmap.innerHTML = `
                <div class="roadmap-head">
                    <div>
                        <p class="roadmap-title">Дорожная карта проекта</p>
                        ${summaryText ? `<p class="roadmap-summary">${escapeHtml(summaryText)}</p>` : ""}
                    </div>
                </div>
                ${renderRoadmapTrack(milestones, normalized.startDate, normalized.releaseDate)}
            `;
            return roadmap;
        }

        function scheduleRoadmapToggle(taskId) {
            clearScheduledRoadmapToggle();
            rowClickTimer = window.setTimeout(() => {
                toggleRoadmap(taskId);
                rowClickTimer = null;
            }, 220);
        }

        function clearScheduledRoadmapToggle() {
            if (!rowClickTimer) return;
            window.clearTimeout(rowClickTimer);
            rowClickTimer = null;
        }

        function toggleRoadmap(taskId) {
            expandedTaskId = expandedTaskId === taskId ? null : taskId;
            renderBoard();
        }

        function openDetailDialog(taskId) {
            const task = state.tasks.find((item) => item.id === taskId);
            if (!task) return;
            const normalized = enrichTask(task);
            const statusMeta = STATUS_META[normalized.status] || STATUS_META["in-progress"];
            const totalProgress = normalizeProgress(normalized.releaseProgress);
            const weeklyProgress = normalizeProgress(normalized.weeklyProgress);
            const focusText = String(normalized.focus || normalized.ceoFocus || "").trim() || "Отсутствуют";
            const roadmapMarkup = renderRoadmapTrack(getRoadmapMilestones(normalized.achievements), normalized.startDate, normalized.releaseDate);
            const showFocus = hasMeaningfulFocusText(focusText);
            const dialogWidth = window.innerWidth <= 760
                ? Math.max(320, window.innerWidth - 12)
                : Math.max(1180, Math.min(1700, window.innerWidth - 24));
            openDetailTaskId = taskId;
            detailDialog.style.width = `${dialogWidth}px`;
            detailDialog.style.minWidth = `${dialogWidth}px`;
            detailDialog.style.maxWidth = `${dialogWidth}px`;

            detailSlide.innerHTML = `
                <div class="detail-slide-head">
                    <div class="detail-head-main">
                        <div class="detail-head-copy">
                            <h2 class="detail-slide-title">${escapeHtml(normalized.title)}</h2>
                            <p class="detail-slide-subtitle">${escapeHtml(normalized.domain)} | Лид: ${escapeHtml(normalized.owner)} | Старт: ${escapeHtml(normalized.startDate || "не указан")} | <span class="detail-release-meta">Релиз: ${escapeHtml(normalized.releaseDate || "не указан")}</span></p>
                        </div>
                        <div class="detail-head-metrics">
                            <div class="detail-head-metric">
                                <span class="detail-head-metric-label">Статус</span>
                                <span class="status-chip ${statusMeta.className}">${statusMeta.label}</span>
                            </div>
                            <div class="detail-head-metric">
                                <span class="detail-head-metric-label">Готовность</span>
                                <strong class="detail-head-metric-value">${totalProgress}%</strong>
                                <span class="detail-head-progress"><span class="detail-head-progress-fill" style="--value: ${totalProgress}%;"></span></span>
                            </div>
                            <div class="detail-head-metric">
                                <span class="detail-head-metric-label">За неделю</span>
                                <strong class="detail-head-metric-value">+${weeklyProgress}%</strong>
                                <span class="detail-head-progress"><span class="detail-head-progress-fill" style="--value: ${weeklyProgress}%;"></span></span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-actions-right detail-actions-panel">
                        <button class="btn-secondary" type="button" id="detailEditBtn">Редактировать</button>
                        <button class="btn-secondary" type="button" id="detailModeBtn">Режим скрина</button>
                        <button class="btn-secondary" type="button" id="detailCaptureBtn">PNG</button>
                        <button class="btn-secondary" type="button" id="detailCloseBtn">Закрыть</button>
                    </div>
                </div>
                <div class="detail-main">
                    <section class="artifact-box artifact-box-split">
                        <div class="artifact-copy">
                            <h3 class="artifact-title">${escapeHtml(normalized.artifactTitle)}</h3>
                            ${renderArtifactNote(normalized.artifactNote)}
                        </div>
                        <div class="artifact-roadmap-shell">
                            ${roadmapMarkup}
                        </div>
                    </section>
                </div>
                ${showFocus ? `
                <div class="detail-bottom">
                    <section class="detail-bottom-box detail-ceo-box">
                        <p class="detail-bottom-title">Риски / Фокус CEO</p>
                        <p class="detail-side-text">${escapeHtml(focusText)}</p>
                    </section>
                </div>` : ""}
            `;

            detailSlide.style.width = `${dialogWidth}px`;
            detailSlide.style.minWidth = `${dialogWidth}px`;
            detailSlide.style.maxWidth = `${dialogWidth}px`;

            const detailCloseBtn = detailSlide.querySelector("#detailCloseBtn");
            const detailModeBtn = detailSlide.querySelector("#detailModeBtn");
            const detailCaptureBtn = detailSlide.querySelector("#detailCaptureBtn");
            const detailEditBtn = detailSlide.querySelector("#detailEditBtn");

            if (detailCloseBtn) detailCloseBtn.addEventListener("click", () => detailDialog.close());
            if (detailModeBtn) detailModeBtn.addEventListener("click", toggleCaptureMode);
            if (detailCaptureBtn) detailCaptureBtn.addEventListener("click", captureCurrentViewSafe);
            if (detailEditBtn) detailEditBtn.addEventListener("click", () => {
                detailDialog.close();
                openTaskDialog(taskId);
            });
            syncCaptureModeUi();
            detailDialog.showModal();
        }

        function renderSummary() {
            const visibleTasks = getVisibleTasks(state.tasks);
            if (!visibleTasks.length) {
                summaryText.textContent = "Сводка появится после добавления хотя бы одной задачи.";
                return;
            }
            const tasks = [...visibleTasks];
            const biggestRisk = tasks.filter((task) => task.status === "risk").sort((a, b) => normalizeProgress(a.releaseProgress) - normalizeProgress(b.releaseProgress))[0];
            const bestProduct = tasks.slice().sort((a, b) => normalizeProgress((b.weeklyProgress ?? b.productProgress ?? 0)) - normalizeProgress((a.weeklyProgress ?? a.productProgress ?? 0)))[0];
            const weakestRelease = tasks.slice().sort((a, b) => normalizeProgress(a.releaseProgress) - normalizeProgress(b.releaseProgress))[0];
            const focusSamples = tasks.filter((task) => task.focus).slice(0, 2).map((task) => `${task.title}: ${task.focus}`);
            const parts = [];
            if (biggestRisk) parts.push(`<strong>Риск недели:</strong> ${escapeHtml(biggestRisk.title)} требует внимания, общий прогресс к релизу ${normalizeProgress(biggestRisk.releaseProgress)}%.`);
            if (bestProduct) parts.push(`<strong>Сильный трек:</strong> ${escapeHtml(bestProduct.title)} идет с недельным прогрессом ${normalizeProgress(bestProduct.weeklyProgress ?? bestProduct.productProgress ?? 0)}%.`);
            if (weakestRelease && weakestRelease !== biggestRisk) parts.push(`<strong>Зона просадки:</strong> ${escapeHtml(weakestRelease.title)} пока на ${normalizeProgress(weakestRelease.releaseProgress)}% общего прогресса.`);
            if (focusSamples.length) parts.push(`<strong>Фокус:</strong> ${focusSamples.map(escapeHtml).join(" | ")}`);
            summaryText.innerHTML = parts.join(" ");
        }

        function buildOwnerGroups(tasks) {
            const map = new Map();
            const orderedKeys = [];
            tasks.forEach((task) => {
                const key = `${task.owner || "Не назначен"}`;
                if (!map.has(key)) {
                    map.set(key, { owner: task.owner || "Не назначен", tasks: [] });
                    orderedKeys.push(key);
                }
                map.get(key).tasks.push(task);
            });
            return orderedKeys.map((key) => map.get(key));
        }

        function getVisibleTasks(tasks) {
            const activeTasks = tasks.filter((task) => !isCompletedProject(task));
            if (currentContourFilter === "all") return activeTasks;
            return activeTasks.filter((task) => resolveContour(normalizeTaskFromJson(task, 0)).id === currentContourFilter);
        }

        function resolveContour(task) {
            const explicitDirectionId = String(task.directionId || task.contourId || "").trim();
            const directions = getDirectionConfig();
            if (explicitDirectionId) {
                const explicit = directions.find((item) => item.id === explicitDirectionId);
                if (explicit) return explicit;
                if (explicitDirectionId === OTHER_CONTOUR.id) return OTHER_CONTOUR;
            }

            const haystack = `${task.title || ""} ${task.domain || ""}`.toLowerCase();
            const matched = directions.find((contour) =>
                contour.projectMatchers.some((matcher) => haystack.includes(String(matcher).toLowerCase()))
            );
            return matched || OTHER_CONTOUR;
        }

        function resolveReleasePackage(task) {
            if (task.releasePackageId) {
                const explicit = RELEASE_PACKAGE_CONFIG.find((item) => item.id === task.releasePackageId);
                if (explicit) return explicit;
            }

            const haystack = `${task.title || ""}`.toLowerCase();
            const matchedByTitle = RELEASE_PACKAGE_CONFIG.find((pkg) =>
                pkg.projectMatchers.some((matcher) => haystack.includes(String(matcher).toLowerCase()))
            );
            if (matchedByTitle) return matchedByTitle;

            if (task.releaseDate) {
                const matchedByDate = RELEASE_PACKAGE_CONFIG.find((pkg) => pkg.date === task.releaseDate);
                if (matchedByDate) return matchedByDate;
            }

            return null;
        }

        function collectReleasePackages(tasks) {
            return [...new Map(tasks
                .map((task) => resolveReleasePackage(task))
                .filter(Boolean)
                .map((pkg) => [pkg.id, pkg]))
                .values()]
                .sort((a, b) => compareDisplayDates(a.date, b.date));
        }

        function pickNearestReleasePackage(releasePackages) {
            if (!releasePackages.length) return null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const upcoming = releasePackages
                .filter((item) => {
                    const parsed = parseDisplayDate(item.date);
                    return parsed && parsed.getTime() >= today.getTime();
                })
                .sort((a, b) => compareDisplayDates(a.date, b.date));
            return upcoming[0] || releasePackages[0];
        }

        function compareDisplayDates(aValue, bValue) {
            const a = parseDisplayDate(aValue);
            const b = parseDisplayDate(bValue);
            if (a && b) return a.getTime() - b.getTime();
            if (a) return -1;
            if (b) return 1;
            return 0;
        }

        function isRiskTask(task) {
            return task.status === "risk" || hasMeaningfulFocusText(task.focus) || hasMeaningfulFocusText(task.ceoFocus);
        }

        function collectWeeklyChanges(tasks) {
            const rankedTasks = [...tasks].sort((a, b) =>
                normalizeProgress(b.weeklyProgress) - normalizeProgress(a.weeklyProgress) ||
                normalizeProgress(b.releaseProgress) - normalizeProgress(a.releaseProgress)
            );
            const lines = [];
            for (const task of rankedTasks) {
                const taskLines = String(task.artifactNote || "")
                    .split(/\r?\n/)
                    .map((line) => line.trim())
                    .filter(Boolean);
                for (const line of taskLines) {
                    if (!lines.includes(line)) {
                        lines.push(line);
                    }
                    if (lines.length >= 2) break;
                }
                if (lines.length >= 2) break;
            }
            return lines.slice(0, 2);
        }

        function findNextCheckpoint(tasks) {
            const candidates = [];
            tasks.forEach((task) => {
                (task.achievements || []).forEach((achievement) => {
                    if (!achievement) return;
                    if (achievement.status !== "in-progress" && achievement.status !== "planned") return;
                    candidates.push({
                        text: achievement.text || "Контрольная точка не названа",
                        date: hasRenderableMilestoneDate(achievement.date) ? achievement.date : "",
                        parsedDate: parseDisplayDate(achievement.date),
                        taskTitle: task.title
                    });
                });
            });
            if (!candidates.length) return null;
            const dated = candidates
                .filter((item) => item.parsedDate)
                .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
            if (dated.length) {
                return {
                    text: `${dated[0].taskTitle}: ${dated[0].text}`,
                    date: dated[0].date
                };
            }
            return {
                text: `${candidates[0].taskTitle}: ${candidates[0].text}`,
                date: ""
            };
        }

        function openTaskDialog(taskId = null) {
            editingTaskId = taskId;
            const task = state.tasks.find((item) => item.id === taskId);
            const normalizedTask = task ? normalizeTaskFromJson(task, 0) : null;
            taskDialogTitle.textContent = task ? "Редактировать задачу" : "Новая задача";
            deleteTaskBtn.hidden = !task;
            document.getElementById("domainInput").value = normalizedTask?.domain || "";
            document.getElementById("ownerInput").value = normalizedTask?.owner || "Не назначен";
            document.getElementById("titleInput").value = normalizedTask?.title || "";
            document.getElementById("startDateInput").value = normalizedTask?.startDate || "";
            document.getElementById("releaseDateInput").value = normalizedTask?.releaseDate || "";
            document.getElementById("statusInput").value = normalizedTask?.status === "preparation"
                ? "evaluation"
                : (normalizedTask?.status || "in-progress");
            document.getElementById("weeklyProgressInput").value = normalizedTask?.weeklyProgress ?? "";
            document.getElementById("releaseProgressInput").value = normalizedTask?.releaseProgress ?? "";
            document.getElementById("actualHoursInput").value = normalizedTask?.actualHours ?? "";
            document.getElementById("plannedHoursInput").value = normalizedTask?.plannedHours ?? "";
            document.getElementById("releaseNumberInput").value = normalizeReleaseNumber(normalizedTask?.releaseNumber) || "";
            document.getElementById("descriptionInput").value = normalizedTask?.description || "";
            document.getElementById("focusInput").value = normalizedTask?.focus || normalizedTask?.ceoFocus || "";
            document.getElementById("summaryInput").value = normalizedTask?.summary || "";
            document.getElementById("artifactTitleInput").value = normalizedTask?.artifactTitle || "";
            document.getElementById("artifactNoteInput").value = normalizedTask?.artifactNote || "";
            document.getElementById("achievementsInput").value = Array.isArray(normalizedTask?.achievements)
                ? normalizedTask.achievements.map(formatMilestoneLine).join("\n")
                : "";
            resetMilestoneBuilder();
            taskDialog.showModal();
        }

        function saveTaskFromForm(event) {
            event.preventDefault();
            const formData = new FormData(taskForm);
            const existingTask = state.tasks.find((item) => item.id === editingTaskId) || null;
            const releaseNumber = normalizeReleaseNumber(formData.get("releaseNumber"));
            const nextStatus = String(formData.get("status") || "in-progress");
            const reportDate = getReportDate();
            const completionDate = reportDate && reportDate.getFullYear() > 2000 ? reportDate : new Date();
            const completedAt = nextStatus === "done"
                ? (String(existingTask?.completedAt || "").trim() || formatDateLabel(completionDate))
                : "";
            const task = {
                id: editingTaskId || Date.now(),
                domain: String(formData.get("domain") || "").trim() || "Без направления",
                owner: String(formData.get("owner") || "").trim() || "Не назначен",
                title: String(formData.get("title") || "").trim() || "Без названия",
                startDate: String(formData.get("startDate") || "").trim(),
                releaseDate: String(formData.get("releaseDate") || "").trim(),
                status: nextStatus,
                ...(completedAt ? { completedAt } : {}),
                weeklyProgress: normalizeProgress(formData.get("weeklyProgress")),
                releaseProgress: normalizeProgress(formData.get("releaseProgress")),
                actualHours: normalizeHours(formData.get("actualHours")),
                plannedHours: normalizeHours(formData.get("plannedHours")),
                ...(releaseNumber ? { releaseNumber } : {}),
                description: String(formData.get("description") || "").trim(),
                focus: String(formData.get("focus") || "").trim(),
                summary: String(formData.get("summary") || "").trim(),
                artifactTitle: String(formData.get("artifactTitle") || "").trim(),
                artifactNote: String(formData.get("artifactNote") || "").trim(),
                achievements: parseMilestoneLines(formData.get("achievements")),
                ceoFocus: String(formData.get("focus") || "").trim(),
                contourId: existingTask?.contourId || "",
                releasePackageId: existingTask?.releasePackageId || ""
            };
            const existingIndex = state.tasks.findIndex((item) => item.id === task.id);
            if (existingIndex >= 0) state.tasks[existingIndex] = task;
            else state.tasks.push(task);
            persistAndRender();
            taskDialog.close();
        }

        function deleteCurrentTask() {
            if (!editingTaskId) return;
            const task = state.tasks.find((item) => item.id === editingTaskId);
            if (!task) return;
            if (!window.confirm(`Удалить задачу "${task.title}"?`)) return;
            state.tasks = state.tasks.filter((item) => item.id !== editingTaskId);
            persistAndRender();
            taskDialog.close();
        }

        function openMetaDialog() {
            document.getElementById("pageTitleInput").value = state.title;
            document.getElementById("pageMetaInput").value = state.meta;
            metaDialog.showModal();
        }

        function saveMeta(event) {
            event.preventDefault();
            const formData = new FormData(metaForm);
            state.title = String(formData.get("pageTitle") || "").trim() || DEFAULT_STATE.title;
            state.meta = String(formData.get("pageMeta") || "").trim() || DEFAULT_STATE.meta;
            persistAndRender();
            metaDialog.close();
        }

        function openDirectionsDialog(directionId = null) {
            const directions = getDirectionConfig();
            const direction = directionId ? directions.find((item) => item.id === directionId) : null;
            editingDirectionId = direction ? direction.id : null;
            directionsStatus.textContent = "";
            directionDialogTitle.textContent = editingDirectionId ? "Редактирование направления" : "Новое направление";
            directionTitleInput.value = direction?.title || "";
            directionIdInput.value = direction?.id || "";
            directionOrderInput.value = Number.isFinite(Number(direction?.order)) ? Number(direction.order) : directions.length;
            directionGoalInput.value = direction?.goal || "";
            directionMatchersInput.value = Array.isArray(direction?.projectMatchers) ? direction.projectMatchers.join("\n") : "";
            directionReleaseResultsInput.value = formatDirectionReleaseResultsForForm(direction, directionId);
            deleteDirectionBtn.hidden = !editingDirectionId || editingDirectionId === OTHER_CONTOUR.id;
            directionsDialog.showModal();
            setTimeout(() => directionTitleInput.focus(), 0);
        }

        function createDirectionId() {
            return `direction_${Date.now()}`;
        }

        function countDirectionLinks(directionId) {
            const manualCount = state.tasks.filter((task) => {
                const explicitDirectionId = String(task.directionId || task.contourId || "").trim();
                return explicitDirectionId === directionId;
            }).length;
            const resolvedCount = state.tasks.filter((task) =>
                resolveContour(normalizeTaskFromJson(task, 0)).id === directionId
            ).length;
            return { manualCount, resolvedCount };
        }

        function formatDirectionReleaseResultsForForm(direction, directionId = null) {
            const manualResults = normalizeDirectionReleaseResults(direction?.releaseResults);
            if (manualResults.length) {
                return manualResults
                    .map((item) => [item.date, item.result, item.userValue].join(" | "))
                    .join("\n");
            }

            if (!directionId) return "";

            const summary = buildExecutiveContours(state.tasks).find((item) => item.contour.id === directionId);
            if (!summary) return "";

            return buildDirectionPackageRows({ ...summary, contour: { ...summary.contour, releaseResults: [] } })
                .map((row) => row.join(" | "))
                .join("\n");
        }

        function parseDirectionReleaseResultsInput(value) {
            return String(value || "")
                .split(/\n+/)
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => {
                    const parts = line.split("|").map((part) => part.trim());
                    return {
                        date: parts[0] || "",
                        result: parts[1] || "",
                        userValue: parts.slice(2).join(" | ") || ""
                    };
                });
        }

        function collectDirectionFromForm() {
            const directions = getDirectionConfig();
            const id = editingDirectionId || createDirectionId();
            const orderRaw = directionOrderInput.value;
            const matchersRaw = directionMatchersInput.value || "";
            const releaseResults = parseDirectionReleaseResultsInput(directionReleaseResultsInput.value);
            return normalizeDirectionItem({
                id,
                title: directionTitleInput.value,
                goal: directionGoalInput.value,
                projectMatchers: matchersRaw.split(/\n|,/).map((item) => item.trim()).filter(Boolean),
                releaseResults,
                icon: directions.find((item) => item.id === editingDirectionId)?.icon || "",
                color: directions.find((item) => item.id === editingDirectionId)?.color || "",
                order: Number.isFinite(Number(orderRaw)) ? Number(orderRaw) : directions.length
            }, directions.length);
        }

        function saveDirectionFromDialog(event) {
            event.preventDefault();
            const direction = collectDirectionFromForm();
            if (!direction || !direction.title) {
                directionsStatus.textContent = "Нужно указать название направления.";
                return;
            }
            const currentDirections = getDirectionConfig();
            const nextDirections = editingDirectionId
                ? currentDirections.map((item) => item.id === editingDirectionId ? { ...item, ...direction, id: item.id } : item)
                : [...currentDirections, direction];
            state.directions = normalizeDirections(nextDirections);
            persistAndRender();
            directionsDialog.close();
        }

        function deleteCurrentDirection() {
            if (!editingDirectionId) return;
            const directions = getDirectionConfig();
            const direction = directions.find((item) => item.id === editingDirectionId);
            const title = direction?.title || editingDirectionId || "направление";
            const { manualCount, resolvedCount } = countDirectionLinks(editingDirectionId);
            const linkText = resolvedCount
                ? `\n\nСейчас к нему относится задач: ${resolvedCount}. Задачи не удалятся.`
                : "";
            const manualText = manualCount
                ? `\nЗадачи с ручной привязкой (${manualCount}) после сохранения будут перенесены в “Прочее”.`
                : "";
            const confirmed = window.confirm(`Удалить направление “${title}”?${linkText}${manualText}`);
            if (!confirmed) return;
            state.directions = normalizeDirections(directions.filter((item) => item.id !== editingDirectionId));
            state.tasks = state.tasks.map((task) => {
                const explicitDirectionId = String(task.directionId || task.contourId || "").trim();
                if (explicitDirectionId !== editingDirectionId) return task;
                const nextTask = { ...task, contourId: OTHER_CONTOUR.id };
                delete nextTask.directionId;
                return nextTask;
            });
            const validIds = new Set(["all", ...state.directions.map((direction) => direction.id)]);
            if (!validIds.has(currentContourFilter)) currentContourFilter = "all";
            if (expandedExecutiveContourId && !validIds.has(expandedExecutiveContourId)) expandedExecutiveContourId = null;
            persistAndRender();
            directionsDialog.close();
        }

        function openJsonDialog() {
            jsonStatus.textContent = "Можно вставить только массив задач или полный объект state.";
            jsonEditor.value = JSON.stringify(state, null, 2);
            jsonDialog.showModal();
        }

        function saveJson() {
            try {
                const parsed = JSON.parse(jsonEditor.value);
                if (Array.isArray(parsed)) {
                    state.tasks = parsed.map(normalizeTaskFromJson);
                } else if (parsed && typeof parsed === "object") {
                    const directions = normalizeDirections(parsed.directions);
                    state = {
                        title: String(parsed.title || state.title || DEFAULT_STATE.title),
                        meta: String(parsed.meta || state.meta || DEFAULT_STATE.meta),
                        tasks: Array.isArray(parsed.tasks) ? parsed.tasks.map(normalizeTaskFromJson) : [],
                        directions: directions.length ? directions : getDefaultDirections()
                    };
                } else {
                    throw new Error("Неверный формат");
                }
                persistAndRender();
                jsonStatus.textContent = "JSON сохранен.";
                jsonDialog.close();
            } catch (error) {
                jsonStatus.textContent = "Не удалось прочитать JSON. Проверьте запятые, кавычки и структуру.";
            }
        }

        function normalizeTaskFromJson(task, index) {
            const fallbackStartDate = String(task.title || "").trim() === "Energy Balance Transparency (WGHT-1)"
                ? "23.10.2025"
                : "";
            const releaseNumber = normalizeReleaseNumber(task.releaseNumber);
            const explicitDirectionId = String(task.directionId || task.contourId || "").trim();
            const normalizedTask = {
                id: task.id || Date.now() + index,
                domain: String(task.domain || "Без направления"),
                owner: String(task.owner || "Не назначен"),
                title: String(task.title || "Без названия"),
                startDate: String(task.startDate || fallbackStartDate),
                releaseDate: String(task.releaseDate || ""),
                releaseProgress: normalizeProgress(task.releaseProgress),
                status: STATUS_META[task.status] ? task.status : "planned",
                completedAt: String(task.completedAt || "").trim(),
                actualHours: normalizeHours(task.actualHours),
                plannedHours: normalizeHours(task.plannedHours),
                description: String(task.description || ""),
                focus: String(task.focus || ""),
                summary: String(task.summary || ""),
                artifactTitle: String(task.artifactTitle || ""),
                artifactNote: normalizeArtifactNote(task.artifactNote),
                achievements: Array.isArray(task.achievements) ? task.achievements.map(normalizeMilestoneItem).filter(Boolean) : [],
                ceoFocus: String(task.ceoFocus || ""),
                weeklyProgress: normalizeProgress(task.weeklyProgress ?? task.productProgress ?? task.releaseProgress),
                contourId: explicitDirectionId,
                releasePackageId: String(task.releasePackageId || "").trim()
            };
            if (releaseNumber) normalizedTask.releaseNumber = releaseNumber;
            return normalizedTask;
        }

        function enrichTask(task) {
            const normalized = normalizeTaskFromJson(task, 0);
            return {
                ...normalized,
                summary: normalized.summary || `Общий статус проекта ${normalizeProgress(normalized.releaseProgress)}%, недельный прогресс ${normalizeProgress(normalized.weeklyProgress)}%.`,
                artifactTitle: normalized.artifactTitle || "Ключевой артефакт недели",
                artifactNote: normalized.artifactNote || "",
                achievements: normalized.achievements.length ? normalized.achievements : [
                    { date: "", text: "Зафиксировали текущий статус по проекту", status: "planned" },
                    { date: "", text: "Синхронизировали фокус недели", status: "planned" },
                    { date: "", text: "Подготовили следующий управленческий шаг", status: "planned" }
                ],
                ceoFocus: normalized.ceoFocus || normalized.focus || "Критический риск или системный блокер пока не указан.",
                focus: normalized.focus || "Риски пока не заполнены.",
                weeklyProgress: normalizeProgress(normalized.weeklyProgress),
                actualHours: normalized.actualHours,
                plannedHours: normalized.plannedHours
            };
        }

        function renderHoursMeta(actualHours, plannedHours) {
            const actual = formatHours(actualHours);
            const planned = formatHours(plannedHours);
            if (!actual && !planned) return "";
            if (actual && planned) {
                return `<div class="task-status-progress-meta">Факт: ${escapeHtml(actual)} ч / План: ${escapeHtml(planned)} ч</div>`;
            }
            if (actual) {
                return `<div class="task-status-progress-meta">Факт: ${escapeHtml(actual)} ч</div>`;
            }
            return `<div class="task-status-progress-meta">План: ${escapeHtml(planned)} ч</div>`;
        }

        function renderReleaseBand(task) {
            const labels = ["1", "2", "3", "4", "5", "6"];
            const activeNumber = getTaskReleaseNumber(task);
            const activeIndex = activeNumber ? activeNumber - 1 : -1;
            const status = task?.status || "in-progress";
            const boxes = labels.map((label, index) => {
                const isActive = index === activeIndex;
                const className = isActive ? `release-band-box active ${escapeHtml(status || "in-progress")}` : "release-band-box";
                return `<span class="${className}">${label}</span>`;
            }).join("");
            return `<div class="release-band-grid">${boxes}</div>`;
        }

        function getTaskReleaseNumber(task) {
            const manualNumber = normalizeReleaseNumber(task?.releaseNumber);
            if (manualNumber) return manualNumber;
            return getAutomaticReleaseNumberByDate(task?.releaseDate);
        }

        function getAutomaticReleaseNumberByDate(releaseDate) {
            const releaseIndex = getReleaseBandIndex(releaseDate);
            return releaseIndex >= 0 ? releaseIndex + 1 : null;
        }

        function getReleaseBandIndex(releaseDate) {
            const parsed = parseDisplayDate(releaseDate);
            if (!parsed) return -1;
            return Math.max(0, Math.min(5, Math.floor(parsed.getMonth() / 2)));
        }

        function renderArtifactNote(note) {
            const lines = String(note || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
            if (!lines.length) return "";
            if (lines.length === 1) {
                return `<p class="artifact-note">${escapeHtml(lines[0])}</p>`;
            }
            const items = lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
            return `<ol class="artifact-note-list">${items}</ol>`;
        }

        function renderCompactLines(lines, fallback) {
            const normalized = lines.map((line) => String(line || "").trim()).filter(Boolean);
            if (!normalized.length) {
                return `<p>${escapeHtml(fallback)}</p>`;
            }
            return `<ul>${normalized.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`;
        }

        function renderCompactText(text, fallback) {
            const lines = String(text || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
            if (!lines.length) {
                return `<p>${escapeHtml(fallback)}</p>`;
            }
            if (lines.length === 1) {
                return `<p>${escapeHtml(lines[0])}</p>`;
            }
            return `<ul>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`;
        }

        function renderCompactMilestones(items, options = {}) {
            const normalized = (items || []).map(normalizeMilestoneItem).filter(Boolean);
            const filtered = options.activeOnly
                ? normalized.filter((item) => item.status === "in-progress")
                : normalized;
            if (!filtered.length) {
                return `<p>${options.activeOnly ? "Контрольных точек в работе нет." : "Контрольные точки пока не заполнены."}</p>`;
            }
            return `
                <div class="task-milestone-list">
                    ${filtered.map((item) => `
                        <div class="task-milestone-item ${escapeHtml(item.status)}" style="--milestone-progress:${normalizeProgress(item.progress)};">
                            <span class="task-milestone-marker" aria-hidden="true">${getMilestoneMarker(item.status)}</span>
                            <div class="task-milestone-content">
                                <div class="task-milestone-main">
                                    <span class="task-milestone-text">${escapeHtml(item.text)}</span>
                                </div>
                                <div class="task-milestone-meta">
                                    ${item.progress > 0 ? `<span class="task-milestone-progress">${normalizeProgress(item.progress)}%</span>` : ""}
                                    ${hasRenderableMilestoneDate(item.date) ? `<span class="detail-list-date">${escapeHtml(item.date)}</span>` : ""}
                                </div>
                            </div>
                        </div>
                    `).join("")}
                </div>
            `;
        }

        function getRoadmapMilestones(items) {
            return (items || [])
                .map(normalizeMilestoneItem)
                .filter(Boolean)
                .map((item, index) => ({
                    ...item,
                    originalIndex: index,
                    parsedDate: parseDisplayDate(item.date)
                }))
                .map((item, index) => ({
                    ...item,
                    sortedIndex: index
                }));
        }

        function renderRoadmapTrack(items, startDateValue, releaseDate) {
            if (!items.length) {
                return '<div class="roadmap-track" style="--roadmap-count:1;"><p class="roadmap-summary">Контрольные точки проекта пока не заполнены.</p></div>';
            }
            const timeline = buildTimelineLayout(items, startDateValue, releaseDate);
            const cards = timeline.items.map((item) => {
                const placement = item.placement || ((item.layoutIndex ?? item.sortedIndex) % 2 === 0 ? "top" : "bottom");
                const statusIcon = item.status === "done" ? "✓" : item.status === "in-progress" ? "◔" : "○";
                return `
                    <div class="roadmap-item ${placement} ${escapeHtml(item.status)}" style="--milestone-position:${item.position}%;">
                        <article class="roadmap-card ${escapeHtml(item.status)}" style="--milestone-progress:${normalizeProgress(item.progress)};">
                            <div class="roadmap-card-head">
                                <span class="roadmap-status" aria-hidden="true">${statusIcon}</span>
                                ${hasRenderableMilestoneDate(item.date) ? `<span class="roadmap-date">${escapeHtml(item.date)}</span>` : ""}
                            </div>
                            <div class="roadmap-title-text">${escapeHtml(item.text)}</div>
                            <div class="roadmap-progress"><div class="roadmap-progress-fill"></div></div>
                        </article>
                    </div>
                `;
            }).join("");
            const startLabel = getRoadmapBoundaryLabel(timeline.startLabel, "Старт не задан");
            const endLabel = getRoadmapBoundaryLabel(timeline.endLabel, "Релиз не задан");
            return `
                <div class="roadmap-track" style="--roadmap-count:${timeline.items.length}; --today-position:${timeline.todayPosition}%;">
                    <div class="roadmap-today">
                        <span class="roadmap-today-label">Сегодня</span>
                    </div>
                    ${cards}
                </div>
                <div class="roadmap-foot">
                    <span>Старт: ${escapeHtml(startLabel)}</span>
                    <span>Релиз: ${escapeHtml(endLabel)}</span>
                </div>
            `;
        }

        function getRoadmapBoundaryLabel(value, fallback) {
            return String(value || "").trim() || fallback;
        }

        function buildTimelineLayout(items, startDateValue, releaseDate) {
            const dated = items.filter((item) => item.parsedDate);
            const explicitStart = parseDisplayDate(startDateValue);
            const releaseParsed = parseDisplayDate(releaseDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const firstMilestoneDate = dated[0]?.parsedDate || null;
            const actualStartDate = explicitStart && firstMilestoneDate
                ? new Date(Math.min(explicitStart.getTime(), firstMilestoneDate.getTime()))
                : explicitStart || firstMilestoneDate || releaseParsed || today;
            const monthWindowStart = new Date(today);
            monthWindowStart.setDate(monthWindowStart.getDate() - 60);
            const layoutStartBase = actualStartDate > today ? monthWindowStart : actualStartDate;
            const visibleStartDate = layoutStartBase < monthWindowStart ? monthWindowStart : layoutStartBase;
            const endCandidate = releaseParsed || dated[dated.length - 1]?.parsedDate || visibleStartDate;
            const endDate = endCandidate > today ? endCandidate : today;
            const startTime = visibleStartDate.getTime();
            const endTime = endDate.getTime();
            const hasRange = endTime > startTime;
            const compressedPositions = buildCompressedRoadmapPositions(dated, startTime, endTime);
            const basePositions = buildRoadmapBasePositions(items, hasRange, compressedPositions, startTime, endTime);
            const withPositions = items.map((item, index) => ({
                ...item,
                anchorKey: item.parsedDate ? formatDateLabel(item.parsedDate) : `undated-${item.originalIndex}`,
                rawPosition: basePositions[index],
                position: basePositions[index]
            }));
            assignRoadmapLayoutOrder(withPositions);

            const grouped = spreadGroupedMilestones(withPositions);
            const positioned = assignRoadmapLanes(grouped);
            enforceSequentialRoadmapFlow(positioned, 3);
            spreadCrossLaneByProximity(positioned, 14);
            enforceSequentialRoadmapFlow(positioned, 3);
            const displayedPositions = buildDisplayedRoadmapPositions(positioned);

            const todayPosition = getTodayPosition(visibleStartDate, endDate, dated, displayedPositions);
            return {
                items: positioned,
                todayPosition,
                startLabel: formatDateLabel(actualStartDate),
                endLabel: releaseDate || formatDateLabel(endDate)
            };
        }

        function findNearestPosition(items, startIndex, direction) {
            for (let index = startIndex + direction; index >= 0 && index < items.length; index += direction) {
                if (items[index].position !== null) {
                    return { index, position: items[index].position };
                }
            }
            return null;
        }

        function buildCompressedRoadmapPositions(items, startTime, endTime) {
            if (!(endTime > startTime) || !items.length) return new Map();
            const anchors = [];
            const seen = new Set();

            items.forEach((item) => {
                if (!item.parsedDate) return;
                const key = formatDateLabel(item.parsedDate);
                if (seen.has(key)) return;
                seen.add(key);
                anchors.push({
                    key,
                    time: item.parsedDate.getTime()
                });
            });

            if (anchors.length <= 2) {
                const map = new Map();
                anchors.forEach((anchor) => map.set(anchor.key, ((anchor.time - startTime) / (endTime - startTime)) * 100));
                return map;
            }

            const map = new Map();
            anchors.forEach((anchor, index) => {
                const timeRatio = ((anchor.time - startTime) / (endTime - startTime)) * 100;
                const sequenceRatio = (index / (anchors.length - 1)) * 100;
                const blended = timeRatio * 0.72 + sequenceRatio * 0.28;
                map.set(anchor.key, blended);
            });
            return map;
        }

        function getCompressedRoadmapPosition(item, compressedPositions, startTime, endTime) {
            const key = item.parsedDate ? formatDateLabel(item.parsedDate) : "";
            if (key && compressedPositions.has(key)) {
                return compressedPositions.get(key);
            }
            if (!(endTime > startTime) || !item.parsedDate) return null;
            return ((item.parsedDate.getTime() - startTime) / (endTime - startTime)) * 100;
        }

        function buildRoadmapBasePositions(items, hasRange, compressedPositions, startTime, endTime) {
            if (!items.length) return [];

            const fallbackSequence = items.map((_, index) => items.length > 1
                ? 8 + (index / (items.length - 1)) * 84
                : 50);

            if (!hasRange) {
                return fallbackSequence;
            }

            const desired = items.map((item) => item.parsedDate
                ? getCompressedRoadmapPosition(item, compressedPositions, startTime, endTime)
                : null);

            if (!desired.some((value) => value !== null)) {
                return fallbackSequence;
            }

            const edgeGap = 7;

            let index = 0;
            while (index < items.length) {
                if (desired[index] !== null) {
                    index += 1;
                    continue;
                }

                const runStart = index;
                while (index < items.length && desired[index] === null) {
                    index += 1;
                }
                const runEnd = index - 1;
                const runLength = runEnd - runStart + 1;

                let prevIndex = runStart - 1;
                while (prevIndex >= 0 && desired[prevIndex] === null) prevIndex -= 1;

                let nextIndex = index;
                while (nextIndex < items.length && desired[nextIndex] === null) nextIndex += 1;

                const prevPosition = prevIndex >= 0 ? desired[prevIndex] : null;
                const nextPosition = nextIndex < items.length ? desired[nextIndex] : null;

                if (prevPosition !== null && nextPosition !== null) {
                    for (let step = 1; step <= runLength; step += 1) {
                        const ratio = step / (runLength + 1);
                        desired[runStart + step - 1] = prevPosition + (nextPosition - prevPosition) * ratio;
                    }
                    continue;
                }

                if (prevPosition !== null) {
                    for (let step = 0; step < runLength; step += 1) {
                        desired[runStart + step] = prevPosition + edgeGap * (step + 1);
                    }
                    continue;
                }

                if (nextPosition !== null) {
                    for (let step = 0; step < runLength; step += 1) {
                        desired[runEnd - step] = nextPosition - edgeGap * (step + 1);
                    }
                    continue;
                }

                for (let step = 0; step < runLength; step += 1) {
                    desired[runStart + step] = fallbackSequence[runStart + step];
                }
            }

            const firstPosition = desired[0] ?? 8;
            const lastPosition = desired[desired.length - 1] ?? 92;
            if (lastPosition <= 92 && firstPosition >= 8) {
                return desired.map((value) => clampTimelinePosition(value ?? 50, 8, 92));
            }

            const range = Math.max(lastPosition - firstPosition, 1);
            return desired.map((value) => {
                const ratio = ((value ?? firstPosition) - firstPosition) / range;
                return 8 + ratio * 84;
            });
        }

        function assignRoadmapLayoutOrder(items) {
            [...items]
                .sort((a, b) => {
                    const aPosition = a.rawPosition ?? a.position ?? 8;
                    const bPosition = b.rawPosition ?? b.position ?? 8;
                    return aPosition - bPosition || a.originalIndex - b.originalIndex;
                })
                .forEach((item, index) => {
                    item.layoutIndex = index;
                });
            return items;
        }

        function assignRoadmapLanes(items) {
            const minGap = 16;
            const prepared = items.map((item) => ({
                ...item,
                targetPosition: getMilestoneTargetPosition(item),
                position: getMilestoneTargetPosition(item),
                placement: (item.layoutIndex ?? item.sortedIndex) % 2 === 0 ? "top" : "bottom"
            }));

            ["top", "bottom"].forEach((lane) => {
                const laneItems = prepared
                    .filter((item) => item.placement === lane)
                    .sort((a, b) => a.targetPosition - b.targetPosition);

                if (!laneItems.length) return;
                const resolved = resolveLanePositions(laneItems, minGap, 8, 92);
                laneItems.forEach((item, index) => {
                    item.position = resolved[index];
                });
            });

            separateCrossLaneStacks(prepared, minGap);

            return prepared.sort((a, b) => a.originalIndex - b.originalIndex);
        }

        function separateCrossLaneStacks(items, minGap) {
            const crossLaneGap = 12;
            const sorted = [...items].sort((a, b) => {
                const aTarget = a.targetPosition ?? a.position ?? 0;
                const bTarget = b.targetPosition ?? b.position ?? 0;
                return aTarget - bTarget || a.originalIndex - b.originalIndex;
            });

            for (let index = 1; index < sorted.length; index += 1) {
                const prev = sorted[index - 1];
                const current = sorted[index];
                if (prev.placement === current.placement) continue;
                if (Math.abs((current.position ?? 0) - (prev.position ?? 0)) >= crossLaneGap) continue;
                current.position = (prev.position ?? 0) + crossLaneGap;
            }

            ["top", "bottom"].forEach((lane) => {
                const laneItems = sorted
                    .filter((item) => item.placement === lane)
                    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

                if (!laneItems.length) return;
                laneItems.forEach((item) => {
                    item.targetPosition = item.position ?? item.targetPosition ?? 50;
                });
                const resolved = resolveLanePositions(laneItems, minGap, 8, 92);
                laneItems.forEach((item, index) => {
                    item.position = resolved[index];
                });
            });
        }

        function enforceSequentialRoadmapFlow(items, minGap) {
            if (!items.length) return;

            const ordered = [...items].sort((a, b) => {
                const aIndex = a.layoutIndex ?? a.originalIndex;
                const bIndex = b.layoutIndex ?? b.originalIndex;
                return aIndex - bIndex;
            });

            for (let index = 1; index < ordered.length; index += 1) {
                const prev = ordered[index - 1];
                const current = ordered[index];
                const prevPosition = prev.position ?? 8;
                const currentPosition = current.position ?? prevPosition;
                if (currentPosition < prevPosition + minGap) {
                    current.position = prevPosition + minGap;
                }
            }

            const lastPosition = ordered[ordered.length - 1]?.position ?? 92;
            if (lastPosition <= 92) return;

            const firstPosition = ordered[0]?.position ?? 8;
            const range = Math.max(lastPosition - firstPosition, 1);
            ordered.forEach((item) => {
                const ratio = ((item.position ?? firstPosition) - firstPosition) / range;
                item.position = 8 + ratio * 84;
            });
        }

        function spreadCrossLaneByProximity(items, minGap) {
            if (!items.length) return;

            const sorted = [...items].sort((a, b) => {
                const aPosition = a.position ?? 8;
                const bPosition = b.position ?? 8;
                return aPosition - bPosition || a.originalIndex - b.originalIndex;
            });

            for (let index = 1; index < sorted.length; index += 1) {
                const prev = sorted[index - 1];
                const current = sorted[index];
                if (prev.placement === current.placement) continue;
                const prevPosition = prev.position ?? 8;
                const currentPosition = current.position ?? prevPosition;
                const deficit = minGap - (currentPosition - prevPosition);
                if (deficit <= 0) continue;
                for (let follower = index; follower < sorted.length; follower += 1) {
                    sorted[follower].position = (sorted[follower].position ?? currentPosition) + deficit;
                }
            }

            const lastPosition = sorted[sorted.length - 1]?.position ?? 92;
            if (lastPosition <= 92) return;

            const overflow = lastPosition - 92;
            for (let index = 0; index < sorted.length; index += 1) {
                const item = sorted[index];
                const ratio = sorted.length === 1 ? 1 : index / (sorted.length - 1);
                item.position = (item.position ?? 92) - overflow * ratio;
            }
        }

        function resolveLanePositions(items, minGap, min, max) {
            if (items.length === 1) {
                return [clampTimelinePosition(items[0].targetPosition, min, max)];
            }

            const forward = new Array(items.length);
            forward[0] = clampTimelinePosition(items[0].targetPosition, min, max);
            for (let index = 1; index < items.length; index += 1) {
                forward[index] = Math.max(items[index].targetPosition, forward[index - 1] + minGap);
            }

            if (forward[forward.length - 1] <= max) {
                return forward.map((value) => clampTimelinePosition(value, min, max));
            }

            const backward = new Array(items.length);
            backward[backward.length - 1] = max;
            for (let index = items.length - 2; index >= 0; index -= 1) {
                backward[index] = Math.min(items[index].targetPosition, backward[index + 1] - minGap);
            }

            if (backward[0] >= min) {
                return backward.map((value) => clampTimelinePosition(value, min, max));
            }

            const step = (max - min) / (items.length - 1);
            return items.map((_, index) => clampTimelinePosition(min + step * index, min, max));
        }

        function getMilestoneTargetPosition(item) {
            const raw = item.rawPosition ?? item.position ?? 12;
            if (raw < 0) return 4;
            if (raw > 100) return 96;
            return clampTimelinePosition(raw, 8, 92);
        }

        function spreadGroupedMilestones(items) {
            const grouped = new Map();
            items.forEach((item) => {
                const key = item.anchorKey || `undated-${item.originalIndex}`;
                if (!grouped.has(key)) grouped.set(key, []);
                grouped.get(key).push(item);
            });

            const offsetStep = 4;
            grouped.forEach((groupItems) => {
                const sorted = [...groupItems].sort((a, b) => a.originalIndex - b.originalIndex);
                const center = (sorted.length - 1) / 2;
                sorted.forEach((item, index) => {
                    const offset = (index - center) * offsetStep;
                    item.position = (item.position ?? 12) + offset;
                });
            });

            return items;
        }

        function buildDisplayedRoadmapPositions(items) {
            const grouped = new Map();

            items.forEach((item) => {
                if (!item?.parsedDate) return;
                const key = formatDateLabel(item.parsedDate);
                if (!grouped.has(key)) grouped.set(key, []);
                grouped.get(key).push(item.position ?? item.rawPosition ?? 50);
            });

            const map = new Map();
            grouped.forEach((positions, key) => {
                if (!positions.length) return;
                const average = positions.reduce((sum, value) => sum + value, 0) / positions.length;
                map.set(key, average);
            });
            return map;
        }

        function getTodayPosition(startDate, endDate, datedItems = [], compressedPositions = new Map()) {
            const start = startDate.getTime();
            const end = endDate.getTime();
            if (end <= start) return 50;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTime = today.getTime();

            if (!datedItems.length || !(compressedPositions instanceof Map) || !compressedPositions.size) {
                const ratio = ((todayTime - start) / (end - start)) * 100;
                return clampTimelinePosition(Math.round(ratio * 10) / 10);
            }

            const anchors = [];
            const seen = new Set();
            datedItems.forEach((item) => {
                if (!item?.parsedDate) return;
                const key = formatDateLabel(item.parsedDate);
                if (seen.has(key) || !compressedPositions.has(key)) return;
                seen.add(key);
                anchors.push({
                    time: item.parsedDate.getTime(),
                    position: compressedPositions.get(key)
                });
            });

            anchors.sort((a, b) => a.time - b.time);
            if (!anchors.length) {
                const ratio = ((todayTime - start) / (end - start)) * 100;
                return clampTimelinePosition(Math.round(ratio * 10) / 10);
            }

            if (todayTime <= anchors[0].time) {
                const span = Math.max(anchors[0].time - start, 1);
                const ratio = (todayTime - start) / span;
                const position = anchors[0].position * ratio;
                return clampTimelinePosition(Math.round(position * 10) / 10);
            }

            for (let index = 0; index < anchors.length - 1; index += 1) {
                const current = anchors[index];
                const next = anchors[index + 1];
                if (todayTime >= current.time && todayTime <= next.time) {
                    const span = Math.max(next.time - current.time, 1);
                    const ratio = (todayTime - current.time) / span;
                    const position = current.position + (next.position - current.position) * ratio;
                    return clampTimelinePosition(Math.round(position * 10) / 10);
                }
            }

            const lastAnchor = anchors[anchors.length - 1];
            const tailSpan = Math.max(end - lastAnchor.time, 1);
            const tailRatio = (todayTime - lastAnchor.time) / tailSpan;
            const tailPosition = lastAnchor.position + (100 - lastAnchor.position) * tailRatio;
            return clampTimelinePosition(Math.round(tailPosition * 10) / 10);
        }

        function clampTimelinePosition(value, min = 7, max = 93) {
            return Math.max(min, Math.min(max, value));
        }

        function parseDisplayDate(value) {
            const raw = String(value || "").trim();
            if (!raw) return null;
            const match = raw.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})$/);
            if (!match) return null;
            const day = Number(match[1]);
            const month = Number(match[2]) - 1;
            const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
            const parsed = new Date(year, month, day);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        }

        function formatDateLabel(date) {
            const day = String(date.getDate()).padStart(2, "0");
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const year = date.getFullYear();
            return `${day}.${month}.${year}`;
        }

        function normalizeArtifactNote(value) {
            const note = String(value || "").trim();
            return note === LEGACY_ARTIFACT_NOTE ? "" : note;
        }

        function parseMilestoneLines(value) {
            return String(value || "")
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean)
                .map(parseMilestoneLine);
        }

        function normalizeMilestoneItem(item) {
            if (!item) return null;
            if (typeof item === "string") {
                return parseMilestoneLine(item);
            }
            const parsedText = parseMilestoneLine(String(item.text || item.title || "").trim());
            const text = parsedText.text;
            if (!text) return null;
            const rawDate = String(item.date || parsedText.date || "").trim();
            return {
                date: hasRenderableMilestoneDate(rawDate) ? rawDate : "",
                text,
                status: normalizeMilestoneStatus(item.status || parsedText.status || "planned"),
                progress: normalizeMilestoneProgress(item.progress ?? parsedText.progress, item.status || parsedText.status || "planned")
            };
        }

        function formatMilestoneLine(item) {
            const normalized = normalizeMilestoneItem(item);
            if (!normalized) return "";
            const parts = [normalized.status];
            if (normalized.date) {
                parts.push(normalized.date);
                if (normalized.progress > 0) parts.push(normalized.progress);
            } else if (normalized.progress > 0) {
                parts.push(String(normalized.progress));
            }
            parts.push(normalized.text);
            return parts.join(" | ");
        }

        function formatMilestoneShort(item) {
            const normalized = normalizeMilestoneItem(item);
            if (!normalized) return "";
            const marker = normalized.status === "done" ? "✓" : normalized.status === "in-progress" ? "◔" : "○";
            return normalized.date ? `${marker} ${normalized.text} (${normalized.date})` : `${marker} ${normalized.text}`;
        }

        function parseMilestoneLine(line) {
            const value = String(line || "").trim();
            if (!value) return { date: "", text: "", status: "planned", progress: 0 };

            const parts = value.split("|").map((part) => part.trim()).filter(Boolean);
            if (parts.length >= 2) {
                const firstStatus = normalizeMilestoneStatus(parts[0]);
                if (MILESTONE_STATUS_META[firstStatus] && parts.length >= 2) {
                    if (parts.length === 3 && /^\d{1,3}%?$/.test(parts[1])) {
                        return {
                            status: firstStatus,
                            date: "",
                            progress: normalizeMilestoneProgress(parts[1], firstStatus),
                            text: parts[2]
                        };
                    }
                    if (parts.length >= 4 && /^\d{1,3}%?$/.test(parts[2])) {
                        return {
                            status: firstStatus,
                            date: parts[1],
                            progress: normalizeMilestoneProgress(parts[2], firstStatus),
                            text: parts.slice(3).join(" | ")
                        };
                    }
                    if (parts.length >= 3) {
                        return {
                            status: firstStatus,
                            date: parts[1],
                            progress: normalizeMilestoneProgress("", firstStatus),
                            text: parts.slice(2).join(" | ")
                        };
                    }
                    return { status: firstStatus, date: "", progress: normalizeMilestoneProgress("", firstStatus), text: parts[1] };
                }
            }

            const withSeparator = value.match(/^(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})\s*[|—-]\s*(.+)$/);
            if (withSeparator) {
                return { date: withSeparator[1].trim(), text: withSeparator[2].trim(), status: "planned", progress: 0 };
            }

            const plainPrefix = value.match(/^(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})\s+(.+)$/);
            if (plainPrefix) {
                return { date: plainPrefix[1].trim(), text: plainPrefix[2].trim(), status: "planned", progress: 0 };
            }

            return { date: "", text: value, status: "planned", progress: 0 };
        }

        function normalizeMilestoneStatus(value) {
            const raw = String(value || "").trim().toLowerCase();
            if (raw === "done" || raw === "готово") return "done";
            if (raw === "in-progress" || raw === "в работе" || raw === "in progress") return "in-progress";
            return "planned";
        }

        function hasRenderableMilestoneDate(value) {
            const raw = String(value || "").trim();
            if (!raw) return false;
            if (raw === "0") return false;
            return Boolean(parseDisplayDate(raw));
        }

        function hasMeaningfulFocusText(value) {
            const raw = String(value || "").trim().toLowerCase();
            return !["", "отсутствуют", "риски пока не заполнены.", "критический риск или системный блокер пока не указан."].includes(raw);
        }

        function normalizeMilestoneProgress(value, status = "planned") {
            const numeric = Number.parseInt(String(value ?? "").replace("%", "").trim(), 10);
            if (Number.isFinite(numeric)) {
                return Math.max(0, Math.min(100, numeric));
            }
            const normalizedStatus = normalizeMilestoneStatus(status);
            if (normalizedStatus === "done") return 100;
            return 0;
        }

        function appendMilestoneFromBuilder() {
            const preset = document.getElementById("milestonePresetSelect").value.trim();
            const custom = document.getElementById("milestoneCustomInput").value.trim();
            const date = document.getElementById("milestoneDateInput").value.trim();
            const status = normalizeMilestoneStatus(document.getElementById("milestoneStatusSelect").value);
            const progress = normalizeMilestoneProgress(document.getElementById("milestoneProgressInput").value, status);
            const text = custom || preset;
            if (!text) return;

            const textarea = document.getElementById("achievementsInput");
            const parts = [status];
            if (date) {
                parts.push(date);
                if (progress > 0) parts.push(progress);
            } else if (progress > 0) {
                parts.push(String(progress));
            }
            parts.push(text);
            const line = parts.join(" | ");
            textarea.value = textarea.value.trim() ? `${textarea.value.trim()}\n${line}` : line;
            resetMilestoneBuilder();
            textarea.focus();
        }

        function resetMilestoneBuilder() {
            document.getElementById("milestonePresetSelect").value = "";
            document.getElementById("milestoneCustomInput").value = "";
            document.getElementById("milestoneDateInput").value = "";
            document.getElementById("milestoneStatusSelect").value = "planned";
            document.getElementById("milestoneProgressInput").value = "";
        }

        function getMilestoneMarker(status) {
            if (status === "done") return "✓";
            if (status === "in-progress") return "◔";
            return "○";
        }

        function refreshChangeSnapshot() {
            currentPatchSnapshot = buildPatchPayload({ author: "", includeEmpty: true });
            currentTaskChangeMap = new Map(
                (currentPatchSnapshot.changes || []).map((change) => [String(change.taskId), change])
            );
        }

        function syncChangeToolbarState() {
            const count = currentPatchSnapshot?.summary?.changedTasks || 0;
            const label = document.querySelector("#showChangesBtn .toolbar-label");
            if (label) label.textContent = count ? `Изменения (${count})` : "Показать изменения";
            ["downloadPatchBtn", "resetChangesBtn", "acceptChangesBtn"].forEach((id) => {
                const button = document.getElementById(id);
                if (button) button.disabled = count === 0;
            });
        }

        function getTaskChange(taskId) {
            return currentTaskChangeMap.get(String(taskId));
        }

        function hasAnyChangedField(changedFields, fields) {
            return fields.some((field) => changedFields.has(field));
        }

        function renderTaskChangeBadge(change) {
            const fields = Object.keys(change?.changedFields || {});
            const visibleFields = fields.slice(0, 4);
            const hiddenCount = Math.max(0, fields.length - visibleFields.length);
            return `
                <span class="change-badge">Есть изменения</span>
                <div class="changed-field-list">
                    ${visibleFields.map((field) => `<span class="changed-field-pill">${escapeHtml(getPatchFieldLabel(field))}</span>`).join("")}
                    ${hiddenCount ? `<span class="changed-field-pill">+${hiddenCount}</span>` : ""}
                </div>
            `;
        }

        function buildPatchPayload(options = {}) {
            const changes = buildTaskChangeList();
            const summary = summarizePatchChanges(changes);
            return {
                type: PATCH_FILE_TYPE,
                reportId: getPatchReportId(originalState),
                reportTitle: originalState.title || state.title || "",
                reportMeta: originalState.meta || state.meta || "",
                baseVersion: PATCH_BASE_VERSION,
                baseHash: originalStateHash,
                sourceHash: originalStateHash,
                author: String(options.author || "").trim(),
                createdAt: new Date().toISOString(),
                changes,
                potentialConflicts: [],
                summary
            };
        }

        function buildTaskChangeList() {
            const originalTasks = new Map((originalState.tasks || []).map((task) => [String(task.id), task]));
            const currentTasks = new Map((state.tasks || []).map((task) => [String(task.id), task]));
            const changes = [];

            currentTasks.forEach((task, key) => {
                const originalTask = originalTasks.get(key);
                const currentView = buildTaskPatchView(task);
                if (!originalTask) {
                    changes.push({
                        taskId: task.id,
                        taskTitle: task.title || "Новая задача",
                        owner: task.owner || "",
                        operation: "create",
                        changedFields: {
                            task: { before: null, after: currentView }
                        },
                        before: null,
                        after: currentView
                    });
                    return;
                }

                const originalView = buildTaskPatchView(originalTask);
                const changedFields = {};
                PATCH_TRACKED_FIELDS.forEach((field) => {
                    if (!arePatchValuesEqual(originalView[field], currentView[field])) {
                        changedFields[field] = {
                            before: clonePatchData(originalView[field]),
                            after: clonePatchData(currentView[field])
                        };
                    }
                });

                if (Object.keys(changedFields).length) {
                    changes.push({
                        taskId: task.id,
                        taskTitle: task.title || originalTask.title || "Без названия",
                        owner: task.owner || originalTask.owner || "",
                        operation: "update",
                        changedFields,
                        before: originalView,
                        after: currentView
                    });
                }
            });

            originalTasks.forEach((task, key) => {
                if (currentTasks.has(key)) return;
                const originalView = buildTaskPatchView(task);
                changes.push({
                    taskId: task.id,
                    taskTitle: task.title || "Удаленная задача",
                    owner: task.owner || "",
                    operation: "delete",
                    changedFields: {
                        task: { before: originalView, after: null }
                    },
                    before: originalView,
                    after: null
                });
            });

            return changes.sort((a, b) => String(a.taskTitle || "").localeCompare(String(b.taskTitle || ""), "ru"));
        }

        function summarizePatchChanges(changes) {
            return changes.reduce((summary, change) => {
                const fieldNames = Object.keys(change.changedFields || {});
                summary.changedTasks += 1;
                summary.changedFields += fieldNames.length;
                if (fieldNames.includes("achievements") || change.operation !== "update") {
                    summary.changedControlPoints += countChangedControlPoints(change);
                }
                return summary;
            }, { changedTasks: 0, changedFields: 0, changedControlPoints: 0 });
        }

        function countChangedControlPoints(change) {
            if (change.operation === "create") return Array.isArray(change.after?.achievements) ? change.after.achievements.length : 0;
            if (change.operation === "delete") return Array.isArray(change.before?.achievements) ? change.before.achievements.length : 0;
            const before = change.changedFields?.achievements?.before;
            const after = change.changedFields?.achievements?.after;
            if (!Array.isArray(before) && !Array.isArray(after)) return 0;
            return Math.max(Array.isArray(before) ? before.length : 0, Array.isArray(after) ? after.length : 0);
        }

        function buildTaskPatchView(task) {
            const normalized = normalizeTaskFromJson(task || {}, 0);
            const view = { id: normalized.id };
            PATCH_TRACKED_FIELDS.forEach((field) => {
                if (field === "achievements") {
                    view[field] = (normalized.achievements || []).map((item) => ({
                        date: String(item.date || ""),
                        text: String(item.text || ""),
                        status: String(item.status || "planned"),
                        progress: normalizeProgress(item.progress)
                    }));
                    return;
                }
                view[field] = clonePatchData(normalized[field] ?? "");
            });
            return view;
        }

        function openChangesDialog() {
            refreshChangeSnapshot();
            renderChangesDialog();
            changesDialog?.showModal();
        }

        function renderChangesDialog() {
            if (!changesList) return;
            const patch = currentPatchSnapshot || buildPatchPayload({ includeEmpty: true });
            changesStatus.textContent = patch.summary.changedTasks
                ? `${patch.summary.changedTasks} задач, ${patch.summary.changedFields} полей, ${patch.summary.changedControlPoints} контрольных точек.`
                : "Изменений пока нет.";
            if (!patch.changes.length) {
                changesList.innerHTML = '<div class="empty">Изменений относительно исходного отчета пока нет.</div>';
                return;
            }
            changesList.innerHTML = patch.changes.map(renderChangeItem).join("");
        }

        function renderChangeItem(change) {
            const fieldMarkup = Object.entries(change.changedFields || {}).map(([field, diff]) => `
                <div class="change-field">
                    <span class="change-field-name">${escapeHtml(getPatchFieldLabel(field))}</span>
                    <div class="change-compare">
                        <div>
                            <strong>Было</strong>
                            <div class="change-box">${escapeHtml(formatPatchValue(diff.before))}</div>
                        </div>
                        <div>
                            <strong>Стало</strong>
                            <div class="change-box is-after">${escapeHtml(formatPatchValue(diff.after))}</div>
                        </div>
                    </div>
                </div>
            `).join("");
            return `
                <article class="change-item">
                    <div class="change-item-head">
                        <p class="change-project">${escapeHtml(change.taskTitle || "Без названия")}</p>
                        <span class="change-operation">${escapeHtml(getPatchOperationLabel(change.operation))}</span>
                    </div>
                    ${fieldMarkup}
                </article>
            `;
        }

        function downloadChangesPatch() {
            refreshChangeSnapshot();
            const patch = currentPatchSnapshot || buildPatchPayload({ includeEmpty: true });
            if (!patch.changes.length) {
                window.alert("Изменений относительно исходного отчета пока нет.");
                return;
            }
            const author = getOrAskPatchAuthor();
            const payload = { ...buildPatchPayload({ author }) };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = buildPatchFilename(author);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 0);
        }

        function getOrAskPatchAuthor() {
            const stored = localStorage.getItem(PATCH_AUTHOR_KEY) || "";
            const answer = window.prompt("Ваше имя для файла изменений", stored);
            const author = answer === null ? stored : String(answer || "").trim();
            if (author) localStorage.setItem(PATCH_AUTHOR_KEY, author);
            return author;
        }

        function buildPatchFilename(author) {
            const metaText = String(state.meta || originalState.meta || "").trim();
            const weekMatch = metaText.match(/Неделя\s*№?\s*(\d+)/i);
            const parsedDate = parseRussianDateFromMeta(metaText);
            const weekPart = weekMatch ? `week-${weekMatch[1]}` : "week";
            const datePart = parsedDate || formatDateForFilename(new Date());
            const authorPart = author ? `_${slugifyFilenamePart(author)}` : "";
            return `weekly_workboard_patch_${weekPart}_${datePart}${authorPart}.json`;
        }

        function resetChangesToOriginal() {
            if (!currentPatchSnapshot) refreshChangeSnapshot();
            if (!currentPatchSnapshot?.changes?.length) {
                window.alert("Изменений для сброса пока нет.");
                return;
            }
            if (!window.confirm("Сбросить все правки и вернуться к исходному состоянию отчета?")) return;
            state = clonePatchData(originalState);
            persistAndRender();
            changesDialog?.close();
        }

        function acceptChangesAsBaseline() {
            if (!currentPatchSnapshot) refreshChangeSnapshot();
            if (!currentPatchSnapshot?.changes?.length) {
                window.alert("Новых изменений для принятия пока нет.");
                return;
            }
            if (!window.confirm("Принять текущие правки как новую базу отчета? Подсветка изменений исчезнет, и можно будет импортировать следующий patch.")) return;
            originalState = clonePatchData(state);
            originalStateHash = hashPatchValue(originalState);
            persistPatchBaseline(originalState);
            pendingImportConflicts = [];
            persistAndRender();
            changesDialog?.close();
            window.alert("Изменения приняты. Текущий отчет стал новой базой для следующих patch-файлов.");
        }

        async function handlePatchImportSelection(event) {
            const files = Array.from(event.target?.files || []);
            if (event.target) event.target.value = "";
            if (!files.length) return;
            await importPatchFiles(files);
        }

        async function importPatchFiles(files) {
            const summary = { filesImported: 0, tasksUpdated: 0, fieldsUpdated: 0, conflicts: 0, skipped: 0 };
            const conflicts = [];
            for (const file of files) {
                try {
                    const patch = JSON.parse(await readTextFile(file));
                    if (!patch || patch.type !== PATCH_FILE_TYPE) {
                        summary.skipped += 1;
                        window.alert(`Файл "${file.name}" не похож на patch-файл Healbe.`);
                        continue;
                    }
                    if (String(patch.reportId || "") !== getPatchReportId(originalState)) {
                        summary.skipped += 1;
                        window.alert(`Файл "${file.name}" относится к другому отчету и не будет применен.`);
                        continue;
                    }
                    const incomingHash = String(patch.baseHash || patch.sourceHash || "");
                    if (incomingHash && incomingHash !== originalStateHash) {
                        const shouldContinue = window.confirm(`У файла "${file.name}" отличается исходный hash. Продолжить с проверкой конфликтов?`);
                        if (!shouldContinue) {
                            summary.skipped += 1;
                            continue;
                        }
                    }
                    const result = applyPatchObject(patch, file.name);
                    summary.filesImported += 1;
                    summary.tasksUpdated += result.tasksUpdated;
                    summary.fieldsUpdated += result.fieldsUpdated;
                    summary.skipped += result.skipped;
                    conflicts.push(...result.conflicts);
                } catch (error) {
                    summary.skipped += 1;
                    window.alert(`Не удалось прочитать файл "${file.name}". Проверьте JSON.`);
                }
            }

            pendingImportConflicts = conflicts;
            summary.conflicts = conflicts.length;
            persistAndRender();
            if (conflicts.length) {
                renderConflictDialog(summary);
                conflictsDialog?.showModal();
            } else {
                window.alert(`Импорт завершен: файлов ${summary.filesImported}, задач обновлено ${summary.tasksUpdated}, полей обновлено ${summary.fieldsUpdated}, пропущено ${summary.skipped}.`);
            }
        }

        function readTextFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result || ""));
                reader.onerror = () => reject(reader.error);
                reader.readAsText(file, "utf-8");
            });
        }

        function applyPatchObject(patch, fileName) {
            const result = { tasksUpdated: 0, fieldsUpdated: 0, skipped: 0, conflicts: [] };
            (patch.changes || []).forEach((change) => {
                const index = findTaskIndexById(change.taskId);
                if (change.operation === "create") {
                    if (index >= 0) {
                        result.conflicts.push(buildPatchConflict(fileName, change, "task", null, buildTaskPatchView(state.tasks[index]), change.after));
                        return;
                    }
                    state.tasks.push(normalizeTaskFromJson(change.after || change.changedFields?.task?.after || {}, state.tasks.length));
                    result.tasksUpdated += 1;
                    result.fieldsUpdated += Object.keys(change.after || {}).length || 1;
                    return;
                }

                if (index < 0) {
                    result.skipped += 1;
                    return;
                }

                if (change.operation === "delete") {
                    const currentView = buildTaskPatchView(state.tasks[index]);
                    if (arePatchValuesEqual(currentView, change.before || change.changedFields?.task?.before)) {
                        state.tasks.splice(index, 1);
                        result.tasksUpdated += 1;
                        result.fieldsUpdated += 1;
                    } else {
                        result.conflicts.push(buildPatchConflict(fileName, change, "task", change.before, currentView, null));
                    }
                    return;
                }

                let taskWasUpdated = false;
                Object.entries(change.changedFields || {}).forEach(([field, diff]) => {
                    const currentView = buildTaskPatchView(state.tasks[index]);
                    const currentValue = field === "task" ? currentView : currentView[field];
                    if (arePatchValuesEqual(currentValue, diff.before)) {
                        setPatchTaskField(state.tasks[index], field, diff.after);
                        state.tasks[index] = normalizeTaskFromJson(state.tasks[index], index);
                        result.fieldsUpdated += 1;
                        taskWasUpdated = true;
                    } else {
                        result.conflicts.push(buildPatchConflict(fileName, change, field, diff.before, currentValue, diff.after));
                    }
                });
                if (taskWasUpdated) result.tasksUpdated += 1;
            });
            return result;
        }

        function buildPatchConflict(fileName, change, field, before, current, after) {
            return {
                fileName,
                taskId: change.taskId,
                taskTitle: change.taskTitle,
                operation: change.operation,
                field,
                before: clonePatchData(before),
                current: clonePatchData(current),
                after: clonePatchData(after)
            };
        }

        function renderConflictDialog(summary) {
            if (!conflictsList) return;
            importSummaryText.textContent = `Импортировано файлов: ${summary.filesImported}. Автоматически обновлено задач: ${summary.tasksUpdated}, полей: ${summary.fieldsUpdated}. Конфликтов: ${summary.conflicts}. Пропущено: ${summary.skipped}.`;
            conflictsStatus.textContent = "Выберите действие для каждого конфликта.";
            conflictsList.innerHTML = pendingImportConflicts.map((conflict, index) => `
                <article class="conflict-item" data-conflict-index="${index}">
                    <div class="conflict-item-head">
                        <p class="conflict-project">${escapeHtml(conflict.taskTitle || "Без названия")}</p>
                        <span class="change-operation">${escapeHtml(getPatchFieldLabel(conflict.field))}</span>
                    </div>
                    <div class="conflict-compare">
                        <div>
                            <strong>Было в patch</strong>
                            <div class="conflict-box">${escapeHtml(formatPatchValue(conflict.before))}</div>
                        </div>
                        <div>
                            <strong>Сейчас в отчете</strong>
                            <div class="conflict-box">${escapeHtml(formatPatchValue(conflict.current))}</div>
                        </div>
                        <div>
                            <strong>Новое из patch</strong>
                            <div class="conflict-box is-after">${escapeHtml(formatPatchValue(conflict.after))}</div>
                        </div>
                    </div>
                    <div class="conflict-controls">
                        <select class="conflict-action">
                            <option value="keep">Оставить текущее</option>
                            <option value="accept">Принять patch</option>
                            <option value="manual">Объединить вручную</option>
                            <option value="skip">Пропустить</option>
                        </select>
                        <textarea class="conflict-manual" placeholder="Для ручного объединения впишите итоговое значение">${escapeHtml(formatManualConflictValue(conflict.current))}</textarea>
                    </div>
                </article>
            `).join("");
        }

        function applyConflictChoices() {
            if (!pendingImportConflicts.length) {
                conflictsDialog?.close();
                return;
            }
            let applied = 0;
            conflictsList?.querySelectorAll(".conflict-item").forEach((item) => {
                const index = Number(item.getAttribute("data-conflict-index"));
                const conflict = pendingImportConflicts[index];
                if (!conflict) return;
                const action = item.querySelector(".conflict-action")?.value || "keep";
                if (action === "keep" || action === "skip") return;
                const value = action === "manual"
                    ? parseManualConflictValue(item.querySelector(".conflict-manual")?.value || "", conflict)
                    : conflict.after;
                applyConflictResolution(conflict, value);
                applied += 1;
            });
            pendingImportConflicts = [];
            persistAndRender();
            conflictsDialog?.close();
            window.alert(`Конфликты обработаны. Применено решений: ${applied}.`);
        }

        function skipPendingConflicts() {
            pendingImportConflicts = [];
            conflictsDialog?.close();
            window.alert("Конфликты оставлены без изменений.");
        }

        function applyConflictResolution(conflict, value) {
            const index = findTaskIndexById(conflict.taskId);
            if (conflict.operation === "create") {
                const task = normalizeTaskFromJson(value || conflict.after || {}, state.tasks.length);
                if (index >= 0) state.tasks[index] = task;
                else state.tasks.push(task);
                return;
            }
            if (index < 0) return;
            if (conflict.operation === "delete") {
                state.tasks.splice(index, 1);
                return;
            }
            setPatchTaskField(state.tasks[index], conflict.field, value);
            state.tasks[index] = normalizeTaskFromJson(state.tasks[index], index);
        }

        function findTaskIndexById(taskId) {
            return state.tasks.findIndex((task) => String(task.id) === String(taskId));
        }

        function setPatchTaskField(task, field, value) {
            if (!task || field === "task") return;
            if (field === "releaseNumber") {
                const releaseNumber = normalizeReleaseNumber(value);
                if (releaseNumber) task.releaseNumber = releaseNumber;
                else delete task.releaseNumber;
                return;
            }
            task[field] = clonePatchData(value);
        }

        function getPatchReportId(source) {
            const base = source || originalState || state;
            return String(base.reportId || REPORT_QUERY_ID || `report_${hashString(`${base.title || ""}|${base.meta || ""}`)}`);
        }

        function getPatchFieldLabel(field) {
            return PATCH_FIELD_LABELS[field] || field;
        }

        function getPatchOperationLabel(operation) {
            if (operation === "create") return "создано";
            if (operation === "delete") return "удалено";
            return "обновлено";
        }

        function formatPatchValue(value) {
            if (value === null || value === undefined || value === "") return "пусто";
            if (Array.isArray(value)) {
                if (!value.length) return "пусто";
                return value.map((item) => {
                    if (!item || typeof item !== "object") return String(item);
                    const date = item.date ? `${item.date} | ` : "";
                    const status = item.status ? `${item.status} | ` : "";
                    const progress = Number.isFinite(Number(item.progress)) ? `${item.progress}% | ` : "";
                    return `${date}${status}${progress}${item.text || ""}`;
                }).join("\n");
            }
            if (typeof value === "object") return JSON.stringify(value, null, 2);
            return String(value);
        }

        function formatManualConflictValue(value) {
            if (Array.isArray(value) || (value && typeof value === "object")) return JSON.stringify(value, null, 2);
            return value === null || value === undefined ? "" : String(value);
        }

        function parseManualConflictValue(raw, conflict) {
            const text = String(raw || "").trim();
            if (conflict.field === "achievements" || conflict.field === "task") {
                try {
                    return JSON.parse(text);
                } catch (error) {
                    window.alert("Ручное значение для этого поля должно быть валидным JSON. Оставляю текущее значение.");
                    return conflict.current;
                }
            }
            if (["releaseProgress", "weeklyProgress", "actualHours", "plannedHours", "releaseNumber"].includes(conflict.field)) {
                return text === "" ? "" : Number(text);
            }
            return text;
        }

        function arePatchValuesEqual(a, b) {
            return stableStringify(canonicalPatchValue(a)) === stableStringify(canonicalPatchValue(b));
        }

        function canonicalPatchValue(value) {
            if (Array.isArray(value)) return value.map(canonicalPatchValue);
            if (value && typeof value === "object") {
                return Object.keys(value).sort().reduce((result, key) => {
                    result[key] = canonicalPatchValue(value[key]);
                    return result;
                }, {});
            }
            return value === undefined ? null : value;
        }

        function stableStringify(value) {
            return JSON.stringify(canonicalPatchValue(value));
        }

        function clonePatchData(value) {
            if (value === undefined) return undefined;
            return JSON.parse(JSON.stringify(value));
        }

        function hashPatchValue(value) {
            return hashString(stableStringify(value));
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

        function exportStateBackup() {
            downloadTextFile(buildBackupFilename(), buildExportHtml(), "text/html;charset=utf-8");
        }

        async function preparePublicationPackage() {
            let existingReports = [];
            let reportsLoaded = false;

            try {
                const response = await fetch(`./reports.json?ts=${Date.now()}`, { cache: "no-store" });
                if (!response.ok) throw new Error(`reports.json ${response.status}`);
                const parsed = await response.json();
                existingReports = Array.isArray(parsed) ? parsed : [];
                reportsLoaded = true;
            } catch (error) {
                reportsLoaded = false;
            }

            if (!reportsLoaded) {
                const shouldContinue = window.confirm(
                    "Не удалось прочитать текущий reports.json. Сформировать новый reports.json только с текущим отчетом?"
                );
                if (!shouldContinue) return;
            }

            const dataFileName = buildReportDataFilename();
            const reportEntry = buildPublicationReportEntry(dataFileName);
            const nextReports = buildUpdatedReportsRegistry(existingReports, reportEntry);

            downloadTextFile(dataFileName, buildReportDataPayload(), "application/json;charset=utf-8");
            window.setTimeout(() => {
                downloadTextFile("reports.json", `${JSON.stringify(nextReports, null, 2)}\n`, "application/json;charset=utf-8");
            }, 350);
        }

        function downloadTextFile(fileName, payload, type) {
            const blob = new Blob([payload], { type });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 0);
        }

        function buildReportDataPayload() {
            const reportState = buildStateFromSource(state) || state;
            return `${JSON.stringify(reportState, null, 2)}\n`;
        }

        function buildPublicationReportEntry(dataFileName) {
            const tasks = Array.isArray(state.tasks) ? state.tasks : [];
            return {
                title: state.title || "Недельный срез продуктовых работ Healbe",
                meta: state.meta || "",
                url: `report.html?data=${encodeURIComponent(dataFileName)}`,
                updatedAt: parseRussianDateFromMeta(state.meta || "") || formatDateForFilename(new Date()),
                taskCount: tasks.length
            };
        }

        function buildUpdatedReportsRegistry(existingReports, currentEntry) {
            const seen = new Set();
            const merged = [];

            [currentEntry, ...existingReports].forEach((item) => {
                if (!item || typeof item !== "object") return;
                const key = getArchiveReportKey(item);
                if (seen.has(key)) return;
                seen.add(key);
                merged.push(item);
            });

            return merged.sort((a, b) => getArchiveReportSortTime(b) - getArchiveReportSortTime(a));
        }

        function getArchiveReportKey(item) {
            const meta = normalizeArchiveReportPart(item.meta);
            const weekMatch = meta.match(/неделя\s*№?\s*(\d+)/i);
            const dateMatch = meta.match(/(\d{1,2})\s+[а-яa-z]+\s+(\d{4})/i);
            if (weekMatch) {
                return `week:${weekMatch[1]}:${dateMatch ? dateMatch[0] : ""}`;
            }

            const url = normalizeArchiveReportPart(item.url);
            const fileWeekMatch = url.match(/week[-_]?(\d+)[-_](\d{4})[-_](\d{2})[-_](\d{2})/i);
            if (fileWeekMatch) {
                return `file-week:${fileWeekMatch[1]}:${fileWeekMatch[2]}-${fileWeekMatch[3]}-${fileWeekMatch[4]}`;
            }

            return `fallback:${normalizeArchiveReportPart(item.title)}:${meta}:${url}`;
        }

        function normalizeArchiveReportPart(value) {
            return String(value || "")
                .toLowerCase()
                .replace(/ё/g, "е")
                .replace(/\s+/g, " ")
                .trim();
        }

        function getArchiveReportSortTime(item) {
            const byUpdatedAt = parseIsoDateToTime(item.updatedAt);
            if (byUpdatedAt) return byUpdatedAt;

            const byMeta = parseRussianDateFromMeta(item.meta || "");
            if (byMeta) return parseIsoDateToTime(byMeta);

            return 0;
        }

        function parseIsoDateToTime(value) {
            const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (!match) return 0;
            const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
            return Number.isFinite(date.getTime()) ? date.getTime() : 0;
        }

        function buildBackupFilename() {
            const metaText = String(state.meta || "").trim();
            const weekMatch = metaText.match(/Неделя\s*№?\s*(\d+)/i);
            const parsedDate = parseRussianDateFromMeta(metaText);
            const weekPart = weekMatch ? `week-${weekMatch[1]}` : "week";
            const datePart = parsedDate || formatDateForFilename(new Date());
            return `weekly_workboard_${weekPart}_${datePart}.html`;
        }

        function buildReportDataFilename() {
            const metaText = String(state.meta || "").trim();
            const weekMatch = metaText.match(/\d+/);
            const parsedDate = parseRussianDateFromMeta(metaText);
            const weekPart = weekMatch ? `week-${weekMatch[0]}` : "week";
            const datePart = parsedDate || formatDateForFilename(new Date());
            return `${weekPart}_${datePart}.json`;
        }

        function buildExportHtml() {
            const html = document.documentElement.outerHTML;
            const exportStorageKey = `${STORAGE_KEY}_export_${Date.now()}`;
            const exportedStateScript = `<script>window.${EXPORTED_STATE_GLOBAL}=${serializeStateForHtml(state)};window.__WORKBOARD_STORAGE_KEY__=${JSON.stringify(exportStorageKey)};<\/script>`;
            const cleaned = html
                .replace(/<script>window\.__WORKBOARD_EXPORTED_STATE__=[\s\S]*?<\/script>\s*/g, '')
                .replace(/<script\b[^>]*data-report-loader[^>]*>[\s\S]*?<\/script>\s*/gi, '');
            const runtimeScriptPattern = /<script\b[^>]*src=["'][^"']*weekly-workboard\.js[^"']*["'][^>]*><\/script>/i;
            if (runtimeScriptPattern.test(cleaned)) {
                return cleaned.replace(runtimeScriptPattern, `${exportedStateScript}\n    $&`);
            }
            return cleaned.replace(/<\/body>/i, `    ${exportedStateScript}\n</body>`);
        }

        function serializeStateForHtml(value) {
            return JSON.stringify(value)
                .replace(/</g, "\\u003c")
                .replace(/>/g, "\\u003e")
                .replace(/&/g, "\\u0026");
        }

        function parseRussianDateFromMeta(metaText) {
            const months = {
                "января": "01",
                "февраля": "02",
                "марта": "03",
                "апреля": "04",
                "мая": "05",
                "июня": "06",
                "июля": "07",
                "августа": "08",
                "сентября": "09",
                "октября": "10",
                "ноября": "11",
                "декабря": "12"
            };
            const match = metaText.match(/(\d{1,2})\s+([А-Яа-яЁё]+)\s+(\d{4})/);
            if (!match) return "";
            const day = match[1].padStart(2, "0");
            const month = months[match[2].toLowerCase()];
            const year = match[3];
            return month ? `${year}-${month}-${day}` : "";
        }

        function formatDateForFilename(date) {
            const year = String(date.getFullYear());
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        }

        function exitCaptureMode() {
            document.body.classList.remove("capture-mode");
            document.body.classList.remove("capture-detail-preview");
            document.body.classList.remove("capture-dialog-only");
            syncCaptureModeUi();
        }

        function toggleCaptureMode() {
            if (document.body.classList.contains("capture-mode")) return;
            document.body.classList.add("capture-mode");
            if (detailDialog?.open) {
                document.body.classList.add("capture-detail-preview");
                window.requestAnimationFrame(() => {
                    detailDialog.scrollTop = 0;
                    const rect = detailDialog.getBoundingClientRect();
                    const offsetTop = 18;
                    window.scrollBy({ top: rect.top - offsetTop, left: 0, behavior: "instant" });
                });
            }
            syncCaptureModeUi();
        }

        function handleCaptureModeDismiss(event) {
            if (!document.body.classList.contains("capture-mode")) return;
            const target = event.target;
            if (!(target instanceof Element)) return;

            if (target.closest("#capturePngBtn, #detailCaptureBtn")) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            exitCaptureMode();
        }

        function handleCaptureModeEscape(event) {
            if (!document.body.classList.contains("capture-mode")) return;
            if (event.key !== "Escape") return;
            event.preventDefault();
            event.stopPropagation();
            exitCaptureMode();
        }

        function syncCaptureModeUi() {
            const active = document.body.classList.contains("capture-mode");
            const topButton = document.getElementById("captureModeBtn");
            if (topButton) {
                topButton.classList.toggle("is-active", active);
                topButton.title = "Режим скрина";
                const topLabel = topButton.querySelector(".toolbar-label");
                if (topLabel) topLabel.textContent = "Режим скрина";
            }
        }

        function buildDetailCaptureStage() {
            if (!detailSlide) return null;

            const existing = document.getElementById("captureDetailStage");
            if (existing) existing.remove();

            const stage = document.createElement("div");
            stage.id = "captureDetailStage";
            stage.className = "capture-detail-stage";
            stage.style.display = "flex";

            const clone = detailSlide.cloneNode(true);
            clone.querySelectorAll("button").forEach((button) => button.remove());

            const rect = detailSlide.getBoundingClientRect();
            clone.style.width = `${Math.round(rect.width)}px`;
            clone.style.minWidth = `${Math.round(rect.width)}px`;
            clone.style.maxWidth = `${Math.round(rect.width)}px`;

            stage.appendChild(clone);
            document.body.appendChild(stage);

            return { stage, target: clone };
        }

        async function captureCurrentView() {
            if (detailDialog?.open) {
                try {
                    await exportElementAsPng(detailSlide, buildScreenshotFilename(true));
                } catch (error) {
                    window.alert("Не удалось сохранить карточку как PNG. Попробуйте еще раз.");
                }
                return;
            }
            if (!navigator.mediaDevices?.getDisplayMedia) {
                window.alert("Ваш браузер не поддерживает захват экрана для этой кнопки.");
                return;
            }

            const target = document.querySelector(".page");
            if (!target) return;

            const modeButton = document.getElementById("captureModeBtn");
            const wasCaptureMode = document.body.classList.contains("capture-mode");
            if (!wasCaptureMode) {
                document.body.classList.add("capture-mode");
                if (modeButton) modeButton.classList.add("is-active");
            }

            await new Promise((resolve) => window.setTimeout(resolve, 180));

            let stream;
            try {
                stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { preferCurrentTab: true },
                    audio: false
                });

                const video = document.createElement("video");
                video.srcObject = stream;
                video.playsInline = true;
                video.muted = true;

                await new Promise((resolve) => {
                    video.onloadedmetadata = () => resolve();
                });

                await video.play();
                await new Promise((resolve) => window.setTimeout(resolve, 150));

                const rect = target.getBoundingClientRect();
                const scaleX = video.videoWidth / Math.max(window.innerWidth, 1);
                const scaleY = video.videoHeight / Math.max(window.innerHeight, 1);
                const sourceX = Math.max(0, rect.left * scaleX);
                const sourceY = Math.max(0, rect.top * scaleY);
                const sourceWidth = Math.min(video.videoWidth - sourceX, rect.width * scaleX);
                const sourceHeight = Math.min(video.videoHeight - sourceY, rect.height * scaleY);

                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(sourceWidth));
                canvas.height = Math.max(1, Math.round(sourceHeight));

                const context = canvas.getContext("2d");
                context.drawImage(
                    video,
                    sourceX,
                    sourceY,
                    sourceWidth,
                    sourceHeight,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                const link = document.createElement("a");
                link.href = canvas.toDataURL("image/png");
                link.download = buildScreenshotFilename(Boolean(detailDialog?.open));
                link.click();
            } catch (error) {
                if (error?.name !== "NotAllowedError" && error?.name !== "AbortError") {
                    window.alert("Не удалось сделать скриншот. Выберите текущую вкладку и попробуйте еще раз.");
                }
            } finally {
                if (stream) {
                    stream.getTracks().forEach((track) => track.stop());
                }
                if (!wasCaptureMode) {
                    document.body.classList.remove("capture-mode");
                    if (modeButton) modeButton.classList.remove("is-active");
                }
            }
        }

        async function captureCurrentViewSafe() {
            const isDetailCapture = Boolean(detailDialog?.open && detailSlide);
            if (isDetailCapture) {
                try {
                    await exportElementAsPng(detailSlide, buildScreenshotFilename(true));
                } catch (error) {
                    window.alert("Не удалось сохранить карточку как PNG.");
                }
                return;
            }

            if (!navigator.mediaDevices?.getDisplayMedia) {
                window.alert("Ваш браузер не поддерживает захват экрана для этой кнопки.");
                return;
            }

            const target = document.querySelector(".page");
            if (!target) return;

            const modeButton = document.getElementById("captureModeBtn");
            const wasCaptureMode = document.body.classList.contains("capture-mode");
            const wasCaptureShot = document.body.classList.contains("capture-shot");

            if (!wasCaptureMode) {
                document.body.classList.add("capture-mode");
                if (modeButton) modeButton.classList.add("is-active");
            }
            if (!wasCaptureShot) {
                document.body.classList.add("capture-shot");
            }
            await new Promise((resolve) => window.setTimeout(resolve, 220));

            let stream;
            try {
                stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { preferCurrentTab: true },
                    audio: false
                });

                const video = document.createElement("video");
                video.srcObject = stream;
                video.playsInline = true;
                video.muted = true;

                await new Promise((resolve) => {
                    video.onloadedmetadata = () => resolve();
                });

                await video.play();
                await new Promise((resolve) => window.setTimeout(resolve, 180));

                const rect = target.getBoundingClientRect();
                const scaleX = video.videoWidth / Math.max(window.innerWidth, 1);
                const scaleY = video.videoHeight / Math.max(window.innerHeight, 1);
                const sourceX = Math.max(0, Math.round(rect.left * scaleX));
                const sourceY = Math.max(0, Math.round(rect.top * scaleY));
                const sourceWidth = Math.max(1, Math.min(video.videoWidth - sourceX, Math.round(rect.width * scaleX)));
                const sourceHeight = Math.max(1, Math.min(video.videoHeight - sourceY, Math.round(rect.height * scaleY)));

                const canvas = document.createElement("canvas");
                canvas.width = sourceWidth;
                canvas.height = sourceHeight;

                const context = canvas.getContext("2d");
                if (!context) throw new Error("Canvas 2D context is unavailable.");
                context.fillStyle = "#ffffff";
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.drawImage(
                    video,
                    sourceX,
                    sourceY,
                    sourceWidth,
                    sourceHeight,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                const link = document.createElement("a");
                link.href = canvas.toDataURL("image/png");
                link.download = buildScreenshotFilename(isDetailCapture);
                link.click();
            } catch (error) {
                if (error?.name !== "NotAllowedError" && error?.name !== "AbortError") {
                    window.alert("Не удалось сделать скриншот. Выберите текущую вкладку и попробуйте еще раз.");
                }
            } finally {
                if (stream) {
                    stream.getTracks().forEach((track) => track.stop());
                }
                if (!wasCaptureShot) {
                    document.body.classList.remove("capture-shot");
                }
                if (!wasCaptureMode) {
                    document.body.classList.remove("capture-mode");
                    if (modeButton) modeButton.classList.remove("is-active");
                }
                suppressDetailCloseCleanup = false;
                syncCaptureModeUi();
            }
        }

        async function exportElementAsPng(element, fileName) {
            const rect = element.getBoundingClientRect();
            const width = Math.max(1, Math.round(rect.width));
            const height = Math.max(1, Math.round(rect.height));
            const scale = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

            const clone = element.cloneNode(true);
            clone.querySelectorAll("button").forEach((button) => button.remove());
            clone.style.width = `${width}px`;
            clone.style.minWidth = `${width}px`;
            clone.style.maxWidth = `${width}px`;
            clone.style.margin = "0";
            clone.style.boxSizing = "border-box";

            const styleText = getRuntimeStyleText();

            const svg = `
                <svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}" viewBox="0 0 ${width} ${height}">
                    <foreignObject width="100%" height="100%">
                        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;background:#ffffff;overflow:hidden;">
                            <style>${styleText}</style>
                            ${clone.outerHTML}
                        </div>
                    </foreignObject>
                </svg>
            `;

            const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(blob);

            try {
                const image = await loadImage(url);
                const canvas = document.createElement("canvas");
                canvas.width = width * scale;
                canvas.height = height * scale;
                const context = canvas.getContext("2d");
                context.drawImage(image, 0, 0, canvas.width, canvas.height);

                const link = document.createElement("a");
                link.href = canvas.toDataURL("image/png");
                link.download = fileName;
                link.click();
            } finally {
                URL.revokeObjectURL(url);
            }
        }

        function loadImage(url) {
            return new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = reject;
                image.src = url;
            });
        }

        function getRuntimeStyleText() {
            const inlineStyles = Array.from(document.querySelectorAll("style"))
                .map((style) => style.textContent || "")
                .join("\n");
            const stylesheetRules = Array.from(document.styleSheets)
                .map((sheet) => {
                    try {
                        return Array.from(sheet.cssRules || [])
                            .map((rule) => rule.cssText || "")
                            .join("\n");
                    } catch (error) {
                        return "";
                    }
                })
                .filter(Boolean)
                .join("\n");
            return [inlineStyles, stylesheetRules].filter(Boolean).join("\n");
        }

        function buildScreenshotFilename(isDetail) {
            const metaText = pageMeta?.textContent || "";
            const weekMatch = metaText.match(/(\d{1,2})/);
            const weekPart = weekMatch ? `week-${weekMatch[1]}` : "week";
            const datePart = parseRussianDateFromMeta(metaText) || formatDateForFilename(new Date());
            if (isDetail && detailDialog?.open) {
                const title = (detailSlide.querySelector(".detail-slide-title")?.textContent || "detail")
                    .toLowerCase()
                    .replace(/[^a-zа-я0-9]+/gi, "-")
                    .replace(/^-+|-+$/g, "");
                return `weekly_workboard_${weekPart}_${datePart}_${title || "detail"}.png`;
            }
            return `weekly_workboard_${weekPart}_${datePart}_dashboard.png`;
        }

        function slugifyFilenamePart(value) {
            return String(value || "")
                .toLowerCase()
                .replace(/[^a-zа-я0-9]+/gi, "-")
                .replace(/^-+|-+$/g, "") || "weekly-workboard";
        }

        function resetState() {
            if (!window.confirm("Сбросить страницу к стартовому набору задач?")) return;
            state = REPORT_QUERY_ID
                ? createSeedReportState(state)
                : buildStateFromSource(window[EXPORTED_STATE_GLOBAL]) || structuredClone(DEFAULT_STATE);
            persistAndRender();
        }

        function persistAndRender() {
            localStorage.setItem(getActiveStorageKey(), JSON.stringify(state));
            syncReportRegistryEntry();
            render();
        }

        function buildStateFromSource(source) {
            if (!source || typeof source !== "object") return null;
            const directions = normalizeDirections(source.directions);
            const tasks = Array.isArray(source.tasks)
                ? source.tasks.map(normalizeTaskFromJson)
                : structuredClone(DEFAULT_STATE.tasks);
            const sourceReportDate = parseReportDateValue(parseRussianDateFromMeta(String(source.meta || ""))) || new Date();
            tasks.forEach((task) => {
                if (isCompletedProject(task) && !task.completedAt) {
                    task.completedAt = formatDateLabel(sourceReportDate);
                }
            });
            return {
                title: String(source.title || DEFAULT_STATE.title),
                meta: String(source.meta || DEFAULT_STATE.meta),
                tasks,
                directions: directions.length ? directions : getDefaultDirections()
            };
        }

        function loadState() {
            try {
                const exportedState = buildStateFromSource(window[EXPORTED_STATE_GLOBAL]);

                const raw = localStorage.getItem(getActiveStorageKey());
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (REPORT_QUERY_ID && (!Array.isArray(parsed.tasks) || !parsed.tasks.length)) {
                        const seededState = createSeedReportState(parsed);
                        localStorage.setItem(getActiveStorageKey(), JSON.stringify(seededState));
                        syncReportRegistryEntry(seededState);
                        return seededState;
                    }

                    const localState = buildStateFromSource(parsed);
                    if (localState) return localState;
                }

                if (FORCE_EXPORTED_STATE && exportedState) return exportedState;

                if (REPORT_QUERY_ID) {
                    const seededState = createSeedReportState(null);
                    localStorage.setItem(getActiveStorageKey(), JSON.stringify(seededState));
                    syncReportRegistryEntry(seededState);
                    return seededState;
                }

                if (exportedState) return exportedState;

                return structuredClone(DEFAULT_STATE);
            } catch (error) {
                return structuredClone(DEFAULT_STATE);
            }
        }

        function getReportQueryId() {
            try {
                const raw = new URLSearchParams(window.location.search || "").get("report");
                const id = String(raw || "").trim();
                return /^[a-z0-9_-]+$/i.test(id) ? id : "";
            } catch (error) {
                return "";
            }
        }

        function getActiveStorageKey() {
            return REPORT_QUERY_ID ? `${REPORT_RECORD_PREFIX}${REPORT_QUERY_ID}` : STORAGE_KEY;
        }

        function loadPatchBaseline(fallbackState) {
            try {
                const raw = localStorage.getItem(PATCH_BASELINE_KEY);
                if (raw) {
                    const storedBaseline = buildStateFromSource(JSON.parse(raw));
                    if (storedBaseline) return storedBaseline;
                }
            } catch (error) {
            }

            const exportedBaseline = REPORT_QUERY_ID ? null : buildStateFromSource(window[EXPORTED_STATE_GLOBAL]);
            const baseline = exportedBaseline || buildStateFromSource(fallbackState) || structuredClone(DEFAULT_STATE);
            persistPatchBaseline(baseline);
            return clonePatchData(baseline);
        }

        function persistPatchBaseline(sourceState) {
            if (!sourceState) return;
            try {
                localStorage.setItem(PATCH_BASELINE_KEY, JSON.stringify(sourceState));
            } catch (error) {
            }
        }

        function createSeedReportState(record) {
            const baseState = buildStateFromSource(window[EXPORTED_STATE_GLOBAL]) || structuredClone(DEFAULT_STATE);
            const sourceReportDate = parseReportDateValue(parseRussianDateFromMeta(String(baseState.meta || ""))) || new Date();
            const archiveCompletedAt = formatDateLabel(sourceReportDate);
            const seededState = {
                ...baseState,
                title: String(record?.title || baseState.title || DEFAULT_STATE.title),
                meta: String(record?.meta || baseState.meta || DEFAULT_STATE.meta),
                tasks: (baseState.tasks || []).map((task) => {
                    const nextTask = {
                        ...task,
                        artifactNote: "",
                        focus: "",
                        ceoFocus: ""
                    };
                    if (isCompletedProject(nextTask) && archiveCompletedAt) {
                        nextTask.completedAt = archiveCompletedAt;
                    }
                    return nextTask;
                })
            };

            return buildStateFromSource(seededState) || seededState;
        }

        function syncReportRegistryEntry(sourceState = state) {
            if (!REPORT_QUERY_ID || !sourceState) return;

            try {
                const parsed = JSON.parse(localStorage.getItem(REPORT_REGISTRY_KEY) || "[]");
                const registry = Array.isArray(parsed) ? parsed : [];
                const now = Date.now();
                const tasks = Array.isArray(sourceState.tasks) ? sourceState.tasks : [];
                let found = false;

                const next = registry.map((item) => {
                    if (item.id !== REPORT_QUERY_ID) return item;
                    found = true;
                    return {
                        ...item,
                        id: REPORT_QUERY_ID,
                        title: sourceState.title || item.title || "Недельный отчет",
                        meta: sourceState.meta || item.meta || "",
                        taskCount: tasks.length,
                        updatedAt: now,
                        createdAt: item.createdAt || now
                    };
                });

                if (!found) {
                    next.unshift({
                        id: REPORT_QUERY_ID,
                        title: sourceState.title || "Недельный отчет",
                        meta: sourceState.meta || "",
                        taskCount: tasks.length,
                        createdAt: now,
                        updatedAt: now
                    });
                }

                next.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
                localStorage.setItem(REPORT_REGISTRY_KEY, JSON.stringify(next));
            } catch (error) {
            }
        }

        function normalizeProgress(value) {
            const num = Number(value);
            if (!Number.isFinite(num)) return 0;
            return Math.max(0, Math.min(100, Math.round(num)));
        }

        function normalizeHours(value) {
            if (value === null || value === undefined || value === "") return "";
            const num = Number(value);
            if (!Number.isFinite(num) || num < 0) return "";
            return Math.round(num * 100) / 100;
        }

        function normalizeReleaseNumber(value) {
            const num = Number(value);
            if (!Number.isInteger(num) || num < 1 || num > 6) return null;
            return num;
        }

        function formatHours(value) {
            if (value === null || value === undefined || value === "") return "";
            const num = Number(value);
            if (!Number.isFinite(num)) return "";
            if (Number.isInteger(num)) return String(num);
            return String(num).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
        }

        function shortenText(value, maxLength) {
            const text = String(value || "").trim();
            if (!text) return "";
            if (text.length <= maxLength) return text;
            return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
        }

        function pluralizeProjects(count) {
            const mod10 = count % 10;
            const mod100 = count % 100;
            if (mod10 === 1 && mod100 !== 11) return "проект";
            if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "проекта";
            return "проектов";
        }

        function escapeHtml(value) {
            return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
        }
