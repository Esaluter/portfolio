# 🎬 Кинотеатр в портфолио — V0.1

Статическая персональная медиатека для видео, изображений, музыки и AI-assisted экспериментов.

Главный принцип: **70% удобная медиатека / 30% сумасбродство**.

## Структура

```text
cinema/
├─ index.html
├─ css/
│  └─ cinema.css
├─ js/
│  ├─ app.js
│  └─ i18n.js
├─ data/
│  └─ projects.json
├─ assets/
│  ├─ previews/
│  ├─ demo/
│  └─ ui/
└─ README.md
```

## Как запустить локально

`projects.json` загружается через `fetch`, поэтому двойной клик по `index.html` может не сработать из-за ограничений браузера.

Запустите локальный HTTP-сервер из папки `cinema`.

### Вариант 1 — VS Code Live Server

Откройте `index.html` через расширение Live Server.

### Вариант 2 — Python

```bash
cd cinema
python -m http.server 8000
```

После этого откройте:

```text
http://localhost:8000
```

Для GitHub Pages дополнительный backend не нужен.

---

# Как добавить новую работу за несколько минут

Главное правило проекта: **для добавления новой работы не нужно менять HTML, CSS или JavaScript**.

1. Положите preview/poster в `assets/previews/` либо используйте внешний URL.
2. При необходимости положите локальное media в подходящую папку или подготовьте внешний URL.
3. Откройте `data/projects.json`.
4. Скопируйте похожую запись.
5. Замените данные и задайте уникальный `id`.
6. Сохраните JSON и обновите страницу.

Карточка, фильтры и viewer появятся автоматически.

## Минимальная запись image-проекта

```json
{
  "id": "my-new-art",
  "type": "image",
  "subcategory": {"ru": "арт", "en": "art"},
  "title_ru": "Моя новая работа",
  "title_en": "My New Work",
  "description_ru": "Описание на русском.",
  "description_en": "English description.",
  "preview": "assets/previews/my-new-art.jpg",
  "date": "2026-09-04",
  "tools": ["Nano Banana"],
  "tags": ["AI", "Art"],
  "featured": false,
  "media": {
    "kind": "image",
    "source": "local",
    "url": "assets/previews/my-new-art.jpg"
  }
}
```

## Обязательные поля

- `id` — уникальный ID; используйте латиницу, цифры и дефисы.
- `type` — `video`, `image` или `music`.
- `subcategory` — объект RU/EN или строка.
- `title_ru`, `title_en`.
- `description_ru`, `description_en`.
- `preview`.
- `date` — `YYYY-MM-DD`.
- `media`.

## Опциональные поля

- `duration`.
- `tools`.
- `tags`.
- `featured`.
- `behind_the_scenes`.
- `extras`.

---

# Featured / «Сегодня в кино»

Добавьте:

```json
"featured": true
```

Главная автоматически выберет первый найденный featured-проект. На практике лучше держать `featured: true` только у одной работы.

---

# Video

Сейчас demo-проекты используют заглушку:

```json
"media": {
  "kind": "video",
  "source": "demo",
  "url": "",
  "poster": "assets/previews/poster.jpg"
}
```

Для прямого MP4/WebM URL:

```json
"media": {
  "kind": "video",
  "source": "direct",
  "url": "https://example.com/movie.mp4",
  "poster": "assets/previews/poster.jpg"
}
```

`app.js` использует обычный HTML5 `<video>`.

В будущем можно добавить отдельный renderer для `source: "embed"`, не меняя модель карточек и каталога.

---

# Image

Одна картинка:

```json
"media": {
  "kind": "image",
  "source": "local",
  "url": "assets/media/art.jpg"
}
```

Галерея:

```json
"media": {
  "kind": "gallery",
  "source": "local",
  "items": [
    "assets/media/01.jpg",
    "assets/media/02.jpg",
    "assets/media/03.jpg"
  ]
}
```

Viewer автоматически покажет стрелки и счётчик.

---

# Music

Demo:

```json
"media": {
  "kind": "audio",
  "source": "demo",
  "url": "",
  "poster": "assets/previews/cover.jpg"
}
```

Настоящий аудиофайл:

```json
"media": {
  "kind": "audio",
  "source": "direct",
  "url": "https://example.com/track.mp3",
  "poster": "assets/previews/cover.jpg"
}
```

---

# Behind the scenes

Поле необязательное. Если его нет, секция не показывается.

```json
"behind_the_scenes": {
  "title_ru": "Как это делалось",
  "title_en": "How it was made",
  "steps": [
    {"ru": "Идея", "en": "Idea"},
    {"ru": "Раскадровка", "en": "Storyboard"},
    {"ru": "Монтаж", "en": "Editing"}
  ]
}
```

---

# Дополнительные материалы

```json
"extras": [
  {
    "kind": "image",
    "label_ru": "Концепт-арт",
    "label_en": "Concept art",
    "url": "assets/media/concept.jpg"
  }
]
```

---

# RU / EN

Язык UI и контента переключается кнопками `RU / EN`.

Выбор сохраняется в `localStorage` под ключом:

```text
cinemaLang
```

Основные переводы UI находятся в:

```text
js/i18n.js
```

Контентные переводы находятся в `projects.json`.

---

# Direct links

Любой проект открывается напрямую:

```text
/?project=raccoon-space
```

На GitHub Pages это будет выглядеть примерно так:

```text
https://username.github.io/repository/cinema/?project=raccoon-space
```

При закрытии viewer параметр `project` удаляется без полной перезагрузки.

---

# Возврат в портфолио

URL задаётся в начале файла:

```js
// js/app.js
const CONFIG = {
  dataUrl: 'data/projects.json',
  portfolioUrl: '../index.html'
};
```

Поменяйте `portfolioUrl`, если структура портфолио будет другой.

При переходе добавляется параметр языка:

```text
?lang=ru
```

или

```text
?lang=en
```

---

# Что специально оставлено расширяемым

- новые `type` можно добавить отдельным renderer в `mediaTemplate()`;
- `media.source` не привязан к конкретному хостингу;
- подкатегории строятся автоматически из JSON;
- теги строятся автоматически из JSON;
- карточки не зависят от количества проектов;
- featured читается из данных;
- direct links используют стабильный `id`;
- `extras` можно развивать в тизеры, storyboard, soundtrack и другие материалы.

---

# Не входит в V0.1 / V1

- аккаунты;
- лайки и комментарии;
- backend и database;
- CMS/admin panel;
- загрузка файлов через браузер;
- собственный streaming server;
- рекомендации и алгоритмы;
- сложная игровая навигация.

Кинотеатр остаётся простой, статической и расширяемой авторской медиатекой.
