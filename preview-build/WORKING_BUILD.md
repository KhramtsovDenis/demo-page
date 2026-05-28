# Working Build

## Правило рабочих папок

`demo-page-main/demo-page-main` — архив скачанного GitHub-состояния и read-only источник финальных файлов с сервера. Его можно читать и копировать из него файлы в рабочий корень, но нельзя редактировать внутри этой папки.

Корень проекта — рабочая зона. Исправления, которые нужно загрузить на GitHub, должны появляться в корне проекта и соответствующих корневых подпапках.

## Текущая рабочая сборка

Главная страница:

`C:\Users\xramc\OneDrive\Documents\New project\index.html`

Общий CSS-слой:

`C:\Users\xramc\OneDrive\Documents\New project\assets\shared.css`

Общие файлы главной:

`C:\Users\xramc\OneDrive\Documents\New project\assets\home.css`

`C:\Users\xramc\OneDrive\Documents\New project\assets\home.js`

Конструктор черновиков дорожных карт:

`C:\Users\xramc\OneDrive\Documents\New project\roadmap_builder.html`

Общие файлы конструктора дорожных карт:

`C:\Users\xramc\OneDrive\Documents\New project\assets\roadmap-builder.css`

`C:\Users\xramc\OneDrive\Documents\New project\assets\roadmap-builder.js`

Рабочая папка отчетов:

`C:\Users\xramc\OneDrive\Documents\New project\weekly-reports`

Доска недельного отчета:

`C:\Users\xramc\OneDrive\Documents\New project\weekly-reports\weekly_workboard.html`

Общие файлы рабочей доски:

`C:\Users\xramc\OneDrive\Documents\New project\assets\weekly-workboard.css`

`C:\Users\xramc\OneDrive\Documents\New project\assets\weekly-workboard.js`

Опубликованные дорожные карты:

`C:\Users\xramc\OneDrive\Documents\New project\site.html`

`C:\Users\xramc\OneDrive\Documents\New project\release_app.html`

`C:\Users\xramc\OneDrive\Documents\New project\heart_roadmap.html`

`C:\Users\xramc\OneDrive\Documents\New project\neem_roadmap.html`

Активная FW roadmap:

`C:\Users\xramc\OneDrive\Documents\New project\fw_release_roadmap.html`

Рабочий дубль FW roadmap для локальной проверки:

`C:\Users\xramc\OneDrive\Documents\New project\fw_release_roadmap_compact_test.html`

Общие файлы FW roadmap:

`C:\Users\xramc\OneDrive\Documents\New project\assets\fw-release-roadmap.css`

`C:\Users\xramc\OneDrive\Documents\New project\assets\fw-release-roadmap.js`

Публичный реестр отчетов:

`C:\Users\xramc\OneDrive\Documents\New project\weekly-reports\reports.json`

Единый просмотрщик опубликованных отчетов:

`C:\Users\xramc\OneDrive\Documents\New project\weekly-reports\report.html`

JSON-данные отчетов:

`C:\Users\xramc\OneDrive\Documents\New project\weekly-reports\data`

## Состояние на 2026-05-29

- В корне создан рабочий `index.html` с актуальным фиксами главной страницы.
- Собрана папка `preview-build` для безопасной публикации новой версии как вторичной страницы GitHub Pages.
- `demo-page-main/demo-page-main` используется как read-only источник финальных файлов GitHub-проекта.
- `assets/shared.css` подключен первым на активных страницах и содержит общий слой дизайн-токенов.
- Главная страница подключает CSS и JS из `assets/home.css` и `assets/home.js`.
- В корень добавлен рабочий `roadmap_builder.html` для локальных черновиков дорожных карт.
- `roadmap_builder.html` подключает CSS и JS из `assets/roadmap-builder.css` и `assets/roadmap-builder.js`.
- HTML-экспорт конструктора дорожных карт сохраняет данные карты в отдельный state-скрипт и оставляет подключение к общим assets-файлам.
- В корень добавлены `site.html`, `release_app.html` и `fw_release_roadmap.html`, чтобы главная страница не ссылалась на файлы только из read-only архива.
- В корень добавлены рабочие дорожные карты `heart_roadmap.html` и `neem_roadmap.html`, а на главной добавлены ссылки “Сердце” и “NEEM”.
- `fw_release_roadmap.html` собран из актуального рабочего FW-файла и подключает `assets/fw-release-roadmap.css` и `assets/fw-release-roadmap.js`.
- `site.html`, `release_app.html`, `fw_release_roadmap.html`, `heart_roadmap.html` и `neem_roadmap.html` подключают общие `assets/fw-release-roadmap.css` и `assets/fw-release-roadmap.js`.
- Данные каждой опубликованной дорожной карты хранятся в ее HTML как `roadmap-state`, а оформление, кнопки и компактный desktop-режим берутся из общих assets.
- В рабочем `index.html` опубликованные отчеты из `reports.json` имеют приоритет над локальными дублями из `localStorage`.
- Локальная копия недели скрывается на главной, если эта неделя уже есть в `reports.json`.
- Для опубликованных отчетов показывается дата отчета, а не локальное “обновлено”.
- Начат переход на общую архитектуру: рабочая доска подключает CSS и JS из `assets`, старые опубликованные отчеты не меняются.
- Активная FW roadmap подключает CSS и JS из `assets`, экспорт HTML сохраняет данные через отдельный state-скрипт и общий runtime.
- Добавлен единый просмотрщик `weekly-reports/report.html` для отчетов из JSON.
- Данные 22-й недели вынесены в `weekly-reports/data/week-22_2026-05-28.json`.
- `weekly-reports/reports.json` в рабочем корне открывает 22-ю неделю через `report.html?data=week-22_2026-05-28.json`.
- Кнопка “Подготовить публикацию” в недельной доске скачивает JSON-данные отчета и новый `reports.json` для схемы `report.html?data=...`.
- `report.html?data=...` работает в опубликованном режиме: админские кнопки скрыты, но “Сохранить HTML” оставлен как аварийный экспорт результата сотрудника.

## Что загрузить на GitHub после правок

Минимально для фикса главной страницы:

- `index.html`
- `assets/shared.css`, если менялись общие дизайн-токены;
- `assets/home.css`, если менялись стили главной;
- `assets/home.js`, если менялась логика главной.

Для публикации новой недели:

- `index.html`, если в нем были изменения;
- `assets/shared.css`, если менялись общие дизайн-токены;
- `assets/home.css`, если менялись стили главной;
- `assets/home.js`, если менялась логика главной;
- `roadmap_builder.html`, если менялась оболочка конструктора дорожных карт;
- `assets/roadmap-builder.css`, если менялись стили конструктора дорожных карт;
- `assets/roadmap-builder.js`, если менялась логика конструктора дорожных карт;
- `assets/weekly-workboard.css`, если менялись стили рабочей доски;
- `assets/weekly-workboard.js`, если менялась логика рабочей доски;
- `weekly-reports/report.html`, если менялся единый просмотрщик;
- `weekly-reports/data/week-XX_YYYY-MM-DD.json`, если публикуется отчет по новой схеме;
- `assets/fw-release-roadmap.css`, если менялись стили FW roadmap;
- `assets/fw-release-roadmap.js`, если менялась логика FW roadmap;
- `site.html`, если менялась опубликованная RoadMap по сайту;
- `release_app.html`, если менялась опубликованная RoadMap по приложению;
- `heart_roadmap.html`, если менялась опубликованная RoadMap по индексу здоровья сердца;
- `neem_roadmap.html`, если менялась опубликованная RoadMap по NEEM;
- `fw_release_roadmap.html`, если менялась опубликованная FW roadmap;
- `fw_release_roadmap_compact_test.html`, если менялась оболочка FW roadmap;
- новый `weekly-reports/weekly_workboard_week-XX_YYYY-MM-DD.html` только если отчет осознанно публикуется по старой HTML-схеме;
- обновленный `weekly-reports/reports.json`;
- при необходимости обновленный `weekly-reports/weekly_workboard.html`.

## Проверка главной

1. Открыть публичный `weekly-reports/reports.json` напрямую.
2. Убедиться, что опубликованные недели есть в JSON.

## Проверка preview-build

1. Залить папку `preview-build` в корень GitHub-репозитория рядом со старым `index.html`.
2. Открыть `https://<user>.github.io/<repo>/preview-build/`.
3. Проверить главную, “Сайт”, “Приложение”, “FW”, “Сердце”, “NEEM” и недельные отчеты.
4. Старую главную не заменять, пока preview не пройдет проверку.
3. Открыть `index.html` с cache-bust, например `index.html?v=check`.
4. Проверить, что опубликованные недели отображаются как “Опубликованный отчет”.
5. Проверить, что у опубликованных недель нет кнопки “Удалить”.
6. Создать локальный отчет с неделей, которая уже есть в `reports.json`.
7. Вернуться на главную и обновить страницу.
8. Убедиться, что такая неделя все равно отображается как опубликованная.

## Проверка недельной доски

1. Открыть `weekly-reports/weekly_workboard.html`.
2. Создать или открыть отчет через `?report=<id>`.
3. Изменить поле “Сделано” у одной задачи.
4. Открыть “Показать изменения”.
5. Скачать patch через “Скачать изменения”.
6. Нажать “Принять изменения”.
7. Проверить, что подсветка изменений исчезла.
8. Нажать “Подготовить публикацию” и проверить скачивание JSON-файла отчета и `reports.json`.
9. Отдельно проверить “Сохранить HTML”, если нужен резервный HTML-экспорт.
10. Проверить режим скрина и PNG.

## Проверка конструктора дорожных карт

1. Открыть `index.html`.
2. Нажать “Создать карту” или “Создать новую дорожную карту”.
3. Проверить, что открылся `roadmap_builder.html?draft=<id>`.
4. Проверить, что загружены `assets/roadmap-builder.css` и `assets/roadmap-builder.js`.
5. Нажать “Добавить релиз” и убедиться, что появилась карточка релиза.
6. Проверить “Сохранить HTML” в обычном браузере, если нужно проверить реальную загрузку файла.

## Проверка опубликованных дорожных карт

1. С главной открыть “Сайт”, “Приложение”, “FW”, “Сердце” и “NEEM”.
2. Проверить, что открываются `site.html`, `release_app.html`, `fw_release_roadmap.html`, `heart_roadmap.html` и `neem_roadmap.html`.
3. Для всех опубликованных дорожных карт проверить, что загружены `assets/fw-release-roadmap.css` и `assets/fw-release-roadmap.js`.

## Проверка опубликованного отчета

1. Открыть `weekly-reports/report.html?data=week-XX_YYYY-MM-DD.json`.
2. Проверить, что скрыты “Подготовить публикацию”, “Принять изменения”, “Импортировать”, “Заголовок”, “JSON”, “Направление” и “Задача”.
3. Проверить, что доступны “Сохранить HTML”, “Показать изменения”, “Скачать изменения”, “Сбросить изменения”, “Режим скрина” и “PNG”.
4. Открыть карточку существующей задачи и убедиться, что кнопка удаления задачи скрыта.

## Что не трогать без отдельной задачи

- `demo-page-main/demo-page-main`.
- Схему `state.tasks`.
- Структуру `achievements`.
- Логику дорожных карт.
- Расчет release-band.
- Старые резервные HTML в `old` и `backups`.
