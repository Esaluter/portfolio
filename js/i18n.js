window.PortfolioMap = window.PortfolioMap || {};

(function () {
  "use strict";

  const dictionaries = {
    ru: {
      "meta.title": "Evgeny • Portfolio & Experiments",
      "meta.description": "Интерактивная карта-портфолио Евгения: путешествие между проектами, аналитикой, экспериментами и контактами.",
      "site.title": "Evgeny • Portfolio & Experiments",
      "aria.app": "Интерактивная карта портфолио",
      "aria.canvas": "Интерактивная карта",
      "aria.languageToggle": "Переключить язык",
      "aria.menuClose": "Закрыть меню",
      "aria.menuNav": "Разделы портфолио",
      "aria.languageGroup": "Язык",
      "hud.menu": "Меню",
      "hud.language": "Язык",
      "hud.soundOn": "Звук: вкл",
      "hud.soundOff": "Звук: выкл",
      "hud.soundDemo": "Звук включён",
      "controls.title": "Управление",
      "controls.move": "WASD / ←↑→↓ — идти",
      "controls.click": "Клик — идти к точке",
      "controls.interact": "E / Enter — открыть",
      "controls.escape": "Esc — закрыть окно",
      "prompt.open": "Открыть {title}",
      "toast.blocked": "Туда сейчас не пройти",
      "toast.unstuck": "Путник выбрался из препятствия",
      "loading.eyebrow": "Интерактивное портфолио",
      "loading.title": "Подготавливаем карту…",
      "loading.text": "Разворачиваем материк, раскладываем локации и будим путешественника.",
      "intro.eyebrow": "Добро пожаловать",
      "intro.title": "Привет, путник!",
      "intro.text": "Приглашаю тебя немного исследовать этот мир. Используй стрелочки / WASD или просто кликни мышкой.",
      "intro.start": "В путь",
      "menu.eyebrow": "Навигация",
      "menu.title": "Куда отправимся?",
      "menu.analytics": "Аналитика",
      "menu.experiments": "Эксперименты",
      "menu.about": "Обо мне",
      "menu.github": "GitHub",
      "menu.contacts": "Контакты",
      "menu.language": "Язык",
      "menu.sound": "Звук",
      "menu.close": "Закрыть",
      "external.eyebrow": "Внешняя ссылка",
      "external.title": "Перейти на {title}?",
      "external.placeholder": "Сейчас здесь стоит временная ссылка-заглушка. Перед релизом её можно заменить в js/config.js.",
      "external.normal": "Ссылка откроется в новой вкладке.",
      "external.cancel": "Остаться",
      "external.confirm": "Перейти",
      "fallback.eyebrow": "Запасная навигация",
      "fallback.title": "Карта не смогла запуститься",
      "fallback.text": "Основные разделы всё равно доступны.",
      "location.analytics.title": "Аналитика",
      "location.analytics.subtitle": "Данные и дашборды",
      "location.about.title": "Обо мне",
      "location.about.subtitle": "Лагерь и история",
      "location.github.title": "GitHub",
      "location.github.subtitle": "Проекты вне карты",
      "location.contacts.title": "Контакты",
      "location.contacts.subtitle": "Станция связи",
      "location.laboratory.title": "Лаборатория",
      "location.laboratory.subtitle": "Эксперименты",
      "location.snake.title": "Змейка",
      "location.snake.subtitle": "Классическая браузерная игра",
      "location.warehouse.title": "Симулятор склада",
      "location.warehouse.subtitle": "Управление складскими процессами",
      "location.uselessBox.title": "Бесполезная коробка",
      "location.uselessBox.subtitle": "Не трогай тумблер"
    },
    en: {
      "meta.title": "Evgeny • Portfolio & Experiments",
      "meta.description": "Evgeny's interactive portfolio map: a small journey through analytics, experiments, projects and contacts.",
      "site.title": "Evgeny • Portfolio & Experiments",
      "aria.app": "Interactive portfolio map",
      "aria.canvas": "Interactive map",
      "aria.languageToggle": "Switch language",
      "aria.menuClose": "Close menu",
      "aria.menuNav": "Portfolio sections",
      "aria.languageGroup": "Language",
      "hud.menu": "Menu",
      "hud.language": "Language",
      "hud.soundOn": "Sound: on",
      "hud.soundOff": "Sound: off",
      "hud.soundDemo": "Sound enabled",
      "controls.title": "Controls",
      "controls.move": "WASD / ←↑→↓ — move",
      "controls.click": "Click — move to a point",
      "controls.interact": "E / Enter — open",
      "controls.escape": "Esc — close window",
      "prompt.open": "Open {title}",
      "toast.blocked": "No path there right now",
      "toast.unstuck": "Traveller escaped the obstacle",
      "loading.eyebrow": "Interactive portfolio",
      "loading.title": "Preparing the map…",
      "loading.text": "Unfolding the continent, placing the landmarks and waking the traveller.",
      "intro.eyebrow": "Welcome",
      "intro.title": "Hello, traveller!",
      "intro.text": "Take a little journey through this world. Use WASD / arrow keys or simply click with the mouse.",
      "intro.start": "Start journey",
      "menu.eyebrow": "Navigation",
      "menu.title": "Where to?",
      "menu.analytics": "Analytics",
      "menu.experiments": "Experiments",
      "menu.about": "About Me",
      "menu.github": "GitHub",
      "menu.contacts": "Contacts",
      "menu.language": "Language",
      "menu.sound": "Sound",
      "menu.close": "Close",
      "external.eyebrow": "External link",
      "external.title": "Go to {title}?",
      "external.placeholder": "This is a temporary placeholder URL. Replace it in js/config.js before release.",
      "external.normal": "The link will open in a new tab.",
      "external.cancel": "Stay here",
      "external.confirm": "Open",
      "fallback.eyebrow": "Fallback navigation",
      "fallback.title": "The interactive map could not start",
      "fallback.text": "The main sections are still available.",
      "location.analytics.title": "Analytics",
      "location.analytics.subtitle": "Data & dashboards",
      "location.about.title": "About Me",
      "location.about.subtitle": "Camp & story",
      "location.github.title": "GitHub",
      "location.github.subtitle": "Projects outside the map",
      "location.contacts.title": "Contacts",
      "location.contacts.subtitle": "Signal station",
      "location.laboratory.title": "Laboratory",
      "location.laboratory.subtitle": "Experiments",
      "location.snake.title": "Snake",
      "location.snake.subtitle": "Classic browser game",
      "location.warehouse.title": "Warehouse Simulator",
      "location.warehouse.subtitle": "Warehouse operations management",
      "location.uselessBox.title": "Useless Box",
      "location.uselessBox.subtitle": "Don't touch the switch"
    }
  };

  let language = "ru";

  function format(template, vars) {
    return template.replace(/\{(\w+)\}/g, (_, key) => vars?.[key] ?? `{${key}}`);
  }

  function t(key, vars) {
    const dict = dictionaries[language] || dictionaries.ru;
    const fallback = dictionaries.ru[key] || key;
    return format(dict[key] || fallback, vars);
  }

  function applyDocumentMetadata() {
    document.title = t("meta.title");
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute("content", t("meta.description"));
  }

  function setLanguage(nextLanguage) {
    language = dictionaries[nextLanguage] ? nextLanguage : "ru";
    document.documentElement.lang = language;

    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });

    document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
      node.setAttribute("aria-label", t(node.dataset.i18nAria));
    });

    document.querySelectorAll("[data-i18n-title]").forEach((node) => {
      node.setAttribute("title", t(node.dataset.i18nTitle));
    });

    applyDocumentMetadata();
  }

  function getLanguage() {
    return language;
  }

  window.PortfolioMap.I18N = {
    t,
    setLanguage,
    getLanguage,
    supported: Object.keys(dictionaries)
  };
})();
