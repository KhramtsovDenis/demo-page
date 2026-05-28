# Changelog

## Roadmap Back Link - 2026-05-29

### Changed

- В дорожных картах возвращен текст кнопки “Назад на Главную”.
- В общем CSS дорожных карт восстановлен токен рамки для заметной кнопки возврата.

## Shared Roadmap Runtime - 2026-05-29

### Changed

- `site.html`, `release_app.html`, `heart_roadmap.html` и `neem_roadmap.html` переведены на общий runtime `assets/fw-release-roadmap.css` и `assets/fw-release-roadmap.js`.
- `assets/fw-release-roadmap.js` теперь умеет загружать данные и детали дорожной карты из state-скрипта внутри HTML.
- Общие правки кнопок, карточек и compact desktop-режима теперь применяются ко всем опубликованным дорожным картам.

## Preview Build Package - 2026-05-29

### Added

- Собрана отдельная папка `preview-build` для безопасной проверки новой версии на GitHub Pages без замены текущей главной страницы.
- В `preview-build` добавлены актуальные HTML-страницы, `assets`, `weekly-reports` и короткая инструкция `README_PREVIEW.md`.

## Additional Roadmaps - 2026-05-29

### Added

- В рабочий корень добавлены `heart_roadmap.html` и `neem_roadmap.html` как опубликованные рабочие дорожные карты.
- На главной странице в блок “Дорожные карты” добавлены ссылки “Сердце” и “NEEM”.

### Changed

- В `heart_roadmap.html` и `neem_roadmap.html` перенесен компактный desktop-режим из FW roadmap для ноутбуков и невысоких экранов.

## Complete Roadmap File Set - 2026-05-29

### Added

- В рабочий корень добавлены `site.html` и `release_app.html` из read-only GitHub-копии, чтобы главная страница имела полный набор целевых файлов.
- Добавлен `fw_release_roadmap.html`, собранный из актуального рабочего FW-файла с подключением `assets/fw-release-roadmap.css` и `assets/fw-release-roadmap.js`.

## Roadmap Builder Assets - 2026-05-28

### Changed

- `roadmap_builder.html` перенесен в рабочий корень из read-only GitHub-копии.
- Стили конструктора дорожных карт вынесены в `assets/roadmap-builder.css`.
- Логика конструктора дорожных карт вынесена в `assets/roadmap-builder.js`.
- HTML-экспорт дорожной карты сохраняет данные карты в отдельный state-скрипт и оставляет подключение к общему `assets/roadmap-builder.js`.

## Published Report Mode - 2026-05-28

### Changed

- `weekly-reports/report.html` помечает отчет как опубликованный режим.
- В опубликованном режиме скрыты админские действия недельной доски: подготовка публикации, импорт patch, принятие изменений, редактирование JSON/заголовка/направлений и добавление задач.
- “Сохранить HTML” оставлен доступным в опубликованном режиме как аварийный экспорт текущего результата сотрудника.

## Publication Docs Cleanup - 2026-05-28

### Changed

- Подсказка на главной странице больше не предлагает публиковать новую неделю через автономный HTML.
- `README.md`, `TODO.md` и `WORKING_BUILD.md` приведены к текущей JSON-схеме публикации: `weekly-reports/data/*.json` плюс обновленный `weekly-reports/reports.json`.

## JSON Report Viewer - 2026-05-27

### Added

- Добавлен единый просмотрщик `weekly-reports/report.html`.
- Добавлена папка `weekly-reports/data` и JSON-данные 22-й недели.

### Changed

- `weekly-reports/reports.json` в рабочем корне открывает 22-ю неделю через `report.html?data=week-22_2026-05-28.json`.
- `assets/home.js` умеет брать исходное состояние отчета из JSON-ссылки нового просмотрщика.
- `assets/weekly-workboard.js` не дает старому `localStorage` подменить данные опубликованного JSON-отчета.
- Кнопка “Подготовить публикацию” теперь скачивает JSON-данные отчета и `reports.json` для нового просмотрщика, а HTML-экспорт остается за кнопкой “Сохранить HTML”.

## Shared Workboard Assets - 2026-05-27

### Changed

- Финальная главная страница скопирована из read-only GitHub-копии в рабочий корень.
- Добавлен общий CSS-слой `assets/shared.css` для дизайн-токенов и базовых правил.
- `assets/shared.css` подключен перед page-specific CSS на главной, недельной доске и активной FW roadmap.
- Главная страница `index.html` теперь подключает общий CSS из `assets/home.css`.
- Логика главной страницы вынесена в `assets/home.js`.
- Рабочая доска `weekly-reports/weekly_workboard.html` теперь подключает общий CSS из `assets/weekly-workboard.css`.
- Основная логика рабочей доски вынесена в `assets/weekly-workboard.js`.
- Экспорт новых HTML-отчетов сохраняет данные недели в HTML и оставляет подключение к общим assets-файлам.
- PNG-экспорт берет стили из подключенных stylesheet-файлов, а не только из inline `<style>`.
- Активная FW roadmap `fw_release_roadmap_compact_test.html` теперь подключает общий CSS из `assets/fw-release-roadmap.css`.
- Основная логика FW roadmap вынесена в `assets/fw-release-roadmap.js`.
- Экспорт FW roadmap сохраняет данные карты в HTML через отдельный state-скрипт и оставляет подключение к общему JS.

### Not Changed

- Старые опубликованные отчеты не менялись.
- `demo-page-main/demo-page-main` не менялся.
- Копии `index.html` из `old`, `old/Git` и `backups` не использовались как рабочая главная.

## Main Page Local/Public Report Fix - 2026-05-27

### Fixed

- Опубликованные отчеты из `weekly-reports/reports.json` получили приоритет над локальными дублями той же недели.
- Локальная копия недели скрывается на главной, если эта неделя уже опубликована.
- У опубликованных отчетов не показывается кнопка “Удалить”.
- Дата из `reports.json` трактуется как дата отчета, а не как локальное время обновления.

### Changed

- Создан рабочий `index.html` в корне проекта для загрузки на GitHub.
- `demo-page-main/demo-page-main` закреплен как архив скачанного GitHub-состояния, а не рабочая зона для правок.
- Основные кнопки открытия недельной доски теперь ведут в последний доступный отчет, а не в базовый шаблон.
- Markdown-документация обновлена под текущий порядок работы.

## Public Reports Registry - 2026-05-19

### Added

- Добавлен публичный реестр `weekly-reports/reports.json` для опубликованных недельных отчетов.
- `index.html` загружает опубликованные отчеты из `weekly-reports/reports.json`.

### Changed

- Локальные отчеты из `localStorage` остались черновиками конкретного браузера.
- Для публикации нового отчета нужно загружать HTML в `weekly-reports` и обновлять `weekly-reports/reports.json`.

### Not Changed

- Логика создания, редактирования, patch-workflow, HTML-экспорта, PNG и режима скрина в `weekly-reports/weekly_workboard.html` не менялась.

## Release for GitHub - 2026-05-18

### Added

- `index_reports_v3.html` промоутнут в релизный `index.html`.
- `weekly_workboard_report_builder_patch_v1.html` промоутнут в релизный `weekly-reports/weekly_workboard.html`.
- Добавлена папка `weekly-reports` для недельных отчетов и шаблона доски.
- В релизный builder вошел patch-workflow: “Показать изменения”, “Скачать изменения”, “Импортировать изменения”, “Сбросить изменения”, “Принять изменения”.
- Patch-файлы содержат только измененные задачи и поля, а не весь отчет.
- Импорт patch-файлов поддерживает проверку `reportId`, предупреждение по `baseHash` и разбор конфликтов.

### Changed

- Главная релизная страница ссылается на `weekly-reports/weekly_workboard.html`.
- Текущие изменения можно утвердить кнопкой “Принять изменения”.
- Документация переписана под релизные имена файлов.

### Not Changed

- Данные задач и направлений не пересобирались.
- JSON-схема задач не менялась.
- Логика дорожных карт, карточек проектов, PNG, режима скрина и полного HTML-экспорта не переписывалась.

## Stable Workboard - 2026-05-08

### Added

- Добавлены направления GoBe Lora, GoBe U Simple и GoBe5.
- GoBe-иконки заменены на встроенные SVG.
- Закреплено поле `releaseNumber` для ручной подсветки номера релиза.

### Changed

- Верхний уровень закреплен как “Продуктовые направления”.
- Нижний уровень внутри задачи закреплен как “Контрольные точки”.
- “Продуктовые вехи” считаются по `task.status`, а не по `achievement.status`.
- “Плановый горизонт” считается как дальний горизонт направления.
- Метка “Сегодня” в roadmap стала спокойной синей.
