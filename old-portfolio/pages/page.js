(function () {
  "use strict";

  const copy = {
    ru: {
      eyebrow: "Раздел портфолио",
      common: "",
      back: "← На карту",
      titles: {
        analytics: "Аналитика",
        about: "Обо мне",
        laboratory: "Эксперименты",
        contacts: "Контакты"
      },
      analytics: `Для проектов по аналитике данных я создал отдельный дашборд в Yandex DataLens.
        В нём собраны мои учебные и практические проекты, примеры визуализаций и работы с данными.

        <a href="https://datalens.yandex/tjwdh9gz68q6d?_theme=dark" target="_blank" rel="noopener noreferrer">Открыть дашборд в DataLens →</a>`,

      about: 
      `Меня зовут Евгений. Я аналитик с большим опытом в логистике, складах, транспорте и автоматизации процессов. Мне нравится разбираться, как работают системы, находить в них проблемы и превращать идеи в работающие решения.

      Этот сайт — моё личное пространство для проектов и экспериментов. Здесь я собираю то, что делаю с данными, кодом и искусственным интеллектом: аналитику и автоматизацию, небольшие веб-проекты, игры, изображения, видео и иногда вещи, которым сложно подобрать нормальную категорию.

      Часть проектов здесь практическая, часть сделана ради эксперимента, а часть — просто потому, что мне стало интересно: «А что, если попробовать вот так?»`,
            
      laboratory: 
      `В Лаборатории собраны мои небольшие проекты, эксперименты и практические решения.
        Здесь есть автоматизация, инструменты, игры и просто идеи, которые мне было интересно превратить во что-то работающее.

        <a href="https://datalens.yandex/0w26s5wwwfwqj?_theme=dark" target="_blank" rel="noopener noreferrer">Открыть Лабораторию в DataLens →</a>`,

      contacts: 
      `Если хотите связаться со мной, проще всего сделать это одним из способов ниже.
      Электронная почта: <a href="mailto:esaluter@mail.ru">esaluter@mail.ru</a>
      Telegram: <a href="https://t.me/Esaluter" target="_blank" rel="noopener noreferrer">@Esaluter</a>
      Резюме на hh.ru: <a href="https://ekaterinburg.hh.ru/resume/ce68cd30ff0293258a0039ed1f3335335a4346?hhtmFrom=applicant_profile" target="_blank" rel="noopener noreferrer">Открыть резюме →</a>`,
    },
    en: {
      eyebrow: "Portfolio section",
      common: "",
      back: "← Back to map",
      titles: {
        analytics: "Analytics",
        about: "About Me",
        laboratory: "Experiments",
        contacts: "Contacts"
      },
      analytics: 
      `I created a separate Yandex DataLens dashboard for my data analytics projects.
      It brings together my educational and practical projects, along with examples of data visualization and analysis.
      <a href="https://datalens.yandex/tjwdh9gz68q6d?_theme=dark" target="_blank" rel="noopener noreferrer">Open the DataLens dashboard →</a>`,

      about: 
      `My name is Evgenii. I’m an analyst with extensive experience in logistics, warehousing, transportation, and process automation. I enjoy understanding how systems work, finding problems, and turning ideas into practical solutions.

      This website is my personal space for projects and experiments. It’s where I collect things I build with data, code, and AI: analytics and automation, small web projects, games, images, videos, and occasionally things that are difficult to put into any reasonable category.

      Some of these projects are practical, some are experiments, and some exist simply because I wondered: “What if I tried this?”`,
            
      laboratory: 
      `The Laboratory is a collection of my smaller projects, experiments, and practical solutions.
        It includes automation, tools, games, and ideas that I simply found interesting enough to turn into something that works.

        <a href="https://datalens.yandex/0w26s5wwwfwqj?_theme=dark" target="_blank" rel="noopener noreferrer">Open the Laboratory in DataLens →</a>`,

      contacts: 
      `If you'd like to get in touch, you can reach me through any of the options below.
      Email: <a href="mailto:esaluter@mail.ru">esaluter@mail.ru</a>
      Telegram: <a href="https://t.me/Esaluter" target="_blank" rel="noopener noreferrer">@Esaluter</a>
      CV on hh.ru: <a href="https://ekaterinburg.hh.ru/resume/ce68cd30ff0293258a0039ed1f3335335a4346?hhtmFrom=applicant_profile" target="_blank" rel="noopener noreferrer">View my CV →</a>`,
    }
  };

  const params = new URLSearchParams(window.location.search);
  const locationId = document.body.dataset.location || params.get("from") || "analytics";
  const language = params.get("lang") === "en" ? "en" : "ru";
  const sound = params.get("sound") === "1" ? "1" : "0";
  const strings = copy[language];

  document.documentElement.lang = language;
  const eyebrow = document.getElementById("pageEyebrow");
  const title = document.getElementById("pageTitle");
  const description = document.getElementById("pageDescription");
  const common = document.getElementById("pageCommon");
  const back = document.getElementById("backToMap");

  if (eyebrow) eyebrow.textContent = strings.eyebrow;
  if (title) title.textContent = strings.titles[locationId] || locationId;
  document.title = `${strings.titles[locationId] || locationId} — Evgeny Portfolio`;
  if (description) description.innerHTML = strings[locationId] || "";
  if (common) common.textContent = strings.common;
  if (back) {
    const url = new URL("../index.html", window.location.href);
    url.searchParams.set("returnFrom", locationId);
    url.searchParams.set("lang", language);
    url.searchParams.set("sound", sound);
    back.href = url.href;
    back.textContent = strings.back;
  }
})();
