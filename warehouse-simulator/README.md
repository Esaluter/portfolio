# Warehouse Simulator / Симулятор склада

Браузерная management-игра о работе склада как единой операционной системы. Игрок управляет потоком заказов, распределяет персонал между процессами, устраняет узкие места, развивает склад и старается удержать SLA под растущей нагрузкой.

A browser-based warehouse management game about keeping an entire operation running. Manage order flow, redistribute staff, remove bottlenecks, upgrade the warehouse, react to events, and keep SLA under control as demand grows.

![Warehouse Simulator gameplay](assets/gameplay.png)

## Идея / Concept

Поток проходит через пять последовательных процессов:

**Приёмка → Размещение → Сборка → Упаковка → Отгрузка**  
**Receiving → Putaway → Picking → Packing → Shipping**

Каждая зона имеет ограниченную производительность, а между процессами находятся буферы. Если один этап перестаёт справляться, очередь растёт, проблема распространяется назад по цепочке, заказы стареют, SLA падает — и при длительном критическом состоянии склад останавливается.

The game deliberately uses a simplified mathematical model rather than simulating a real WMS or individual orders and workers. The goal is to make operational dependencies, capacity constraints and bottlenecks easy to see and manage.

## Основные механики / Features

- 5 связанных складских процессов и 4 ограниченных буфера;
- FIFO-поток, возраст заказов и backpressure при переполнении;
- визуальные очереди и индикация bottleneck;
- Worker и Trainee, найм, обучение и перераспределение персонала;
- доход за успешно отгруженный поток;
- улучшения зон, буферов и общескладских процессов;
- SLA, восстановление после критического состояния и Warehouse Shutdown;
- три режима: **Normal Shift, Black Friday, Endless**;
- 38 событий: Information, Problem и Decision;
- временные эффекты, условия, веса и cooldown событий;
- решения с компромиссами: деньги, производительность, входящий поток и риски;
- Pause / ×1 / ×2 / ×4;
- RU / EN;
- подсказки, tooltips и раздел «Как играть»;
- итоговая статистика и графики SLA / входящего потока;
- лучший Endless score в `localStorage`;
- необязательный звук, выключенный по умолчанию.

## Сценарии / Scenarios

**Normal Shift / Обычная смена** — более спокойный режим для знакомства с системой.  
**Black Friday / Чёрная пятница** — высокая стартовая нагрузка, сильные пики и мало времени на ошибки.  
**Endless** — нагрузка постепенно растёт; задача — продержаться как можно дольше.

![Scenario selection](assets/scenario-selection.png)

## Как играть / How to play

Следите за очередями и мощностью процессов. Если одна зона начинает отставать, перераспределите сотрудников, наймите стажёров или вложитесь в улучшения. Больший буфер даёт дополнительное время на реакцию, но сам по себе не устраняет bottleneck.

Деньги начисляются после успешной отгрузки. Случайные события могут временно помочь или ухудшить ситуацию, а Decision events заставляют выбирать между стоимостью, риском и производительностью.

SLA (Service Level Agreement / уровень сервиса) показывает своевременность обработки заказов. Чем дольше поток задерживается в системе, тем ниже SLA. Если критический SLA сохраняется слишком долго, наступает **Warehouse Shutdown**.

## Технологии / Tech stack

- HTML5
- CSS3
- Vanilla JavaScript
- Canvas / SVG for lightweight visual feedback and result charts
- localStorage
- no frameworks, backend, database or build step

Проект полностью статический и подходит для GitHub Pages.

## Запуск локально / Run locally

Сборка не требуется.

1. Скачайте или клонируйте проект.
2. Откройте `index.html` в современном браузере.

No build step is required: download or clone the project and open `index.html` in a modern browser.

## Структура проекта / Project structure

```text
warehouse-simulator/
├── index.html          # UI structure
├── style.css           # visual style and animations
├── script.js           # game model, loop and UI logic
├── scenarios.js        # scenario configuration and balance
├── events.js           # event library and event rules
├── translations.js     # RU / EN localization
└── assets/             # local visual assets / screenshots
```

Основные коэффициенты сценариев вынесены в `scenarios.js`, события — в `events.js`, пользовательские тексты — в `translations.js`. Благодаря этому баланс, события и локализацию можно менять без переписывания основного игрового цикла.

## Зачем этот проект / Why I built it

Проект показывает склад не как набор отдельных операций, а как связанную систему: локальная проблема на одном этапе влияет на очереди, загрузку следующих и предыдущих процессов, SLA и итоговый результат всей смены.

This project explores a warehouse as an interconnected operational system: a local capacity problem can propagate through queues, buffers, service level and the final result of the entire shift.

Главный принцип проекта:

> **Простая математическая модель под капотом — живой склад на экране.**  
> **A simple mathematical model underneath — a living warehouse on screen.**
