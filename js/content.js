/* ==========================================================================
   content.js — ВСЕ данные и тексты сайта (RU + EN).
   Чтобы поменять цены, контакты или работы, достаточно править этот файл.
   ========================================================================== */

/* ---------- Общие данные (не зависят от языка) ---------- */
window.SITE = {
  defaultLang: "ru",                 // язык по умолчанию, если ничего не сохранено в localStorage
  whatsapp: "79285412854",           // WhatsApp — только цифры, с кодом страны, без «+»
  phoneDisplay: "+7 928 541-28-54",  // как номер показывается на сайте
  telegram: "sa4qadi",               // Telegram-username без «@»
  /* Отзывы от клиентов: хранятся в Firebase Firestore (бесплатно).
     Пока projectId/apiKey пустые, форма отправляет отзыв вам в Telegram.
     Как подключить — см. файл ОТЗЫВЫ-НАСТРОЙКА.md */
  reviewsBackend: {
    projectId: "",   // например "al-himma-reviews"
    apiKey: ""       // Web API Key из настроек Firebase-проекта
  }
};

/* ---------- Тексты ---------- */
window.CONTENT = {

  /* ======================= РУССКИЙ ======================= */
  ru: {
    meta: {
      title: "Al-Himma — Абу Сальма: сайты, Telegram-боты, Mini Apps и веб-сервисы",
      description: "Al-Himma — разработка сайтов, Telegram-ботов обратной связи, Telegram Mini Apps и веб-сервисов. Сайт — за 3–7 дней, бот — за 1 день. Пишите в WhatsApp или Telegram."
    },
    brand: {
      name: "Al-Himma",
      owner: "Абу Сальма"
    },
    ui: {
      skip: "К содержимому",
      menu: "Меню",
      close: "Закрыть",
      langLabel: "Язык сайта",
      navLabel: "Основная навигация",
      wa: "WhatsApp",
      waAria: "Написать в WhatsApp",
      tg: "Telegram"
    },
    nav: [
      { id: "services", label: "Услуги" },
      { id: "cases",    label: "Работы" },
      { id: "process",  label: "Процесс" },
      { id: "pricing",  label: "Цены" },
      { id: "reviews",  label: "Отзывы" },
      { id: "faq",      label: "Вопросы" },
      { id: "contacts", label: "Контакты" }
    ],
    hero: {
      title: "Сайты, Telegram-⁠боты и веб-⁠сервисы под ключ",   // ⁠ — не рвать строку на дефисе
      subtitle: "Меня зовут Абу Сальма. Делаю сайты, Telegram-ботов обратной связи, Mini Apps и веб-сервисы. Сначала показываю готовую работу, вместе правим, и только потом — оплата.",
      ctaWa: "Написать в WhatsApp",
      ctaTg: "Написать в Telegram",
      role: "Веб-разработчик",
      points: ["Сайты под ключ", "Telegram-боты", "Telegram Mini Apps", "Веб-сервисы"],
      ctaWorks: "Смотреть работы",
      ctaOrder: "Обсудить проект",
      facts: [
        { value: "3–7 дней", label: "сайт" },
        { value: "1 день",   label: "Telegram-бот" },
        { value: "2 круга",  label: "правок бесплатно" }
      ],
      word: "«аль-химма» — по-арабски «устремлённость»"
    },
    services: {
      title: "Что я делаю",
      lead: "Четыре направления — от первой идеи до работающего продукта.",
      items: [
        {
          title: "Сайты",
          text: "Лендинги, сайты-визитки и интернет-магазины: быстрые, адаптивные, с аккуратной анимацией.",
          points: ["Под все экраны", "Заказ через WhatsApp", "Лёгкие анимации"]
        },
        {
          title: "Веб-сервисы",
          text: "Личные кабинеты, панели управления и внутренние инструменты — от прототипа до запуска.",
          points: ["Frontend, backend, API", "Интеграции", "Роли и админка"]
        },
        {
          title: "Telegram Mini Apps",
          text: "Мини-приложения внутри Telegram: каталоги, запись, сервисы. Открываются в один тап, без установки.",
          points: ["Вход через Telegram", "iOS, Android, Desktop"]
        },
        {
          title: "Боты обратной связи",
          text: "Обращения клиентов приходят вам в Telegram, а ваши ответы возвращаются клиенту от имени бота.",
          points: ["Уведомления в ваш чат", "Готов за 1 день"]
        }
      ]
    },
    cases: {
      title: "Мои проекты",
      lead: "Живые проекты — их можно открыть и посмотреть.",
      visit: "Открыть сайт",
      watch: "Смотреть видео",
      close: "Закрыть",
      items: [
        { img: "assets/cases/badr-market.jpg", url: "https://xuz4ima-sketch.github.io/badr-market/", title: "BadrBook — сайт издательского дома",
          text: "Книги и серии издательства, прайс в Excel для опта и розницы, раздел «Где купить».", tags: ["Сайт", "Каталог", "Прайс"] },
        { img: "assets/cases/santlada.jpg", url: "https://santlada.github.io/", title: "SANTLADA — натяжные потолки в Дагестане",
          text: "Сайт мастера: три полотна с ценой за метр, калькулятор площади с отправкой расчёта в WhatsApp, работы «до и после».", tags: ["Сайт", "Калькулятор", "WhatsApp"] },
        { img: "assets/cases/al-bayan.jpg?v=2", url: "https://al-bayan-academy.github.io/", title: "Al Bayan Academy — онлайн-уроки Корана",
          text: "Сайт онлайн-школы: как идут уроки, учитель, направления, цены и запись на пробное занятие.", tags: ["Сайт", "Онлайн-школа", "Запись"] },
        { img: "assets/cases/all-himma-bot.jpg", url: "https://t.me/all_himma_bot", title: "Al-Himma — Telegram-бот для задач",
          text: "Личный трекер ежедневных задач: напоминания, аналитика выполнения и итоги за месяц.", tags: ["Telegram-бот", "Напоминания", "Аналитика"],
          visit: "Открыть бота" },
        // video — ролик вместо скриншота; img — его обложка; без url кнопки нет
        { img: "assets/cases/arma-demo.jpg", video: "assets/cases/arma-demo.mp4", title: "ARMA — программа учёта для магазина",
          text: "Учёт для магазина материалов для натяжных потолков: продажи и накладные с печатью, склад с поступлениями и остатками, покупатели и долги, зарплаты, отчёты с выгрузкой в Excel.", tags: ["Программа учёта", "Склад", "Отчёты"] }
      ]
    },
    process: {
      title: "Как я работаю",
      lead: "Оплата — после того, как вы увидели готовую работу и мы всё поправили.",
      steps: [
        { title: "Обсуждаем",        time: "в день обращения",  text: "Вы пишете, что нужно. Уточняем задачу, я называю цену и срок." },
        { title: "Делаю",            time: "от 1 до 7 дней",    text: "Сайт — за 3–7 дней, Telegram-бота — за 1 день." },
        { title: "Показываю",        time: "по ходу работы",    text: "Смотрите готовый результат, и мы вместе исправляем нужные моменты." },
        { title: "Оплата и запуск",  time: "после согласования", text: "Вы оплачиваете, я публикую проект и передаю всё, что нужно." },
        { title: "Правки после",     time: "бесплатно",         text: "Ещё два круга изменений, если захочется что-то поправить." }
      ]
    },
    pricing: {
      title: "Цены",
      lead: "Все проекты разные, и к каждому свой подход: одному хватит страницы-визитки, другому нужен магазин с каталогом. Поэтому здесь — ориентиры, а точную цену и срок назову, когда обсудим вашу задачу.",
      from: "от",
      cta: "Обсудить мой проект",
      note: "После оплаты — 2 бесплатных круга правок.",
      items: [
        { name: "Сайт",               price: "12 000 ₽", time: "3–7 дней", text: "Лендинг, визитка или магазин с каталогом и заказом в WhatsApp." },
        { name: "Бот обратной связи", price: "5 000 ₽",  time: "1 день",   text: "Обращения приходят вам в Telegram, ответы уходят клиенту от имени бота." },
        { name: "Mini App",           price: "10 000 ₽", time: "2–4 дня",  text: "Приложение внутри Telegram: каталог, запись или заказ — без установки." },
        { name: "Веб-сервис",         price: "22 000 ₽", time: "4–8 дней", text: "Личные кабинеты, роли, админка, API и интеграции." }
      ]
    },
    reviews: {
      title: "Отзывы клиентов",
      lead: "Работали вместе? Оставьте отзыв — он появится здесь после проверки.",
      empty: "Пока здесь нет отзывов. Вы можете оставить первый.",
      outOf: "из 5",
      form: {
        title: "Оставить отзыв",
        name: "Ваше имя",
        role: "Что заказывали (необязательно)",
        rolePh: "Например: сайт для магазина",
        rating: "Оценка",
        text: "Ваш отзыв",
        textPh: "Как прошла работа, что понравилось",
        submit: "Отправить отзыв",
        sending: "Отправляю…",
        note: "Отзыв публикуется после проверки.",
        ok: "Спасибо! Отзыв отправлен и появится на сайте после проверки.",
        okTg: "Спасибо! Откроется Telegram — отправьте сообщение, и отзыв дойдёт до меня.",
        err: "Не удалось отправить отзыв. Попробуйте ещё раз или напишите мне в Telegram.",
        invalid: "Укажите имя и отзыв (не короче 10 символов).",
        wait: "Вы только что отправили отзыв. Подождите минуту.",
        tgPrefix: "Отзыв для сайта Al-Himma"
      },
      items: []   // отзывы, добавленные вручную: { text, name, role, rating }
    },
    faq: {
      title: "Частые вопросы",
      items: [
        { q: "Сколько это стоит?",
          a: "Сайт — от 12 000 ₽, бот обратной связи — от 5 000 ₽, Mini App — от 10 000 ₽, веб-сервис — от 22 000 ₽. Точную цену называю после обсуждения задачи." },
        { q: "Сколько занимает работа?",
          a: "Сайт — от 3 дней до недели, Telegram-бот — около одного дня, Mini App — 2–4 дня, веб-сервис — 4–8 дней. Точный срок называю после обсуждения задачи." },
        { q: "Как проходят правки?",
          a: "Когда работа готова, я показываю её вам, и мы исправляем нужные моменты. После оплаты у вас есть 2 бесплатных круга изменений." },
        { q: "Что нужно от меня для старта?",
          a: "Короткое описание задачи, примеры, которые нравятся, и тексты или фото, если они уже есть. Остальное беру на себя." },
        { q: "Как оставить отзыв?",
          a: "В разделе «Отзывы» есть форма: укажите имя, оценку и пару предложений. Отзыв появится на сайте после проверки." }
      ]
    },
    contacts: {
      title: "Обсудим ваш проект?",
      text: "Напишите, что нужно, — предложу решение и назову срок и цену. Обычно отвечаю в тот же день.",
      waLabel: "WhatsApp",
      tgLabel: "Telegram",
      waMessage: "Здравствуйте! Хочу обсудить проект.",
      tgMessage: "Здравствуйте! Хочу обсудить проект."
    },
    footer: { rights: "Все права защищены." }
  },

  /* ======================= ENGLISH ======================= */
  en: {
    meta: {
      title: "Al-Himma — Abu Salma: websites, Telegram bots, Mini Apps & web services",
      description: "Al-Himma builds websites, Telegram feedback bots, Telegram Mini Apps and web services. A site in 3–7 days, a bot in 1 day. Message me on WhatsApp or Telegram."
    },
    brand: {
      name: "Al-Himma",
      owner: "Abu Salma"
    },
    ui: {
      skip: "Skip to content",
      menu: "Menu",
      close: "Close",
      langLabel: "Site language",
      navLabel: "Main navigation",
      wa: "WhatsApp",
      waAria: "Message on WhatsApp",
      tg: "Telegram"
    },
    nav: [
      { id: "services", label: "Services" },
      { id: "cases",    label: "Work" },
      { id: "process",  label: "Process" },
      { id: "pricing",  label: "Pricing" },
      { id: "reviews",  label: "Reviews" },
      { id: "faq",      label: "FAQ" },
      { id: "contacts", label: "Contact" }
    ],
    hero: {
      title: "Websites, Telegram bots and web services end to end",
      subtitle: "I’m Abu Salma. I build websites, Telegram feedback bots, Mini Apps and web services. First I show you the finished work, we polish it together, and only then do you pay.",
      ctaWa: "Message on WhatsApp",
      ctaTg: "Message on Telegram",
      role: "Web developer",
      points: ["Websites end to end", "Telegram bots", "Telegram Mini Apps", "Web services"],
      ctaWorks: "View my work",
      ctaOrder: "Discuss a project",
      facts: [
        { value: "3–7 days", label: "a website" },
        { value: "1 day",    label: "a Telegram bot" },
        { value: "2 rounds", label: "of free edits" }
      ],
      word: "“al-himma” is Arabic for “aspiration”"
    },
    services: {
      title: "What I do",
      lead: "Four directions — from the first idea to a working product.",
      items: [
        {
          title: "Websites",
          text: "Landing pages, portfolio sites and online shops: fast, responsive, with tasteful motion.",
          points: ["Every screen size", "Orders via WhatsApp", "Light animation"]
        },
        {
          title: "Web services",
          text: "Customer accounts, dashboards and internal tools — from prototype to launch.",
          points: ["Frontend, backend, API", "Integrations", "Roles and admin"]
        },
        {
          title: "Telegram Mini Apps",
          text: "Apps inside Telegram: catalogs, booking, services. One tap to open, nothing to install.",
          points: ["Sign-in with Telegram", "iOS, Android, Desktop"]
        },
        {
          title: "Feedback bots",
          text: "Customer messages land in your Telegram and your replies go back to the customer as the bot.",
          points: ["Alerts in your chat", "Ready in 1 day"]
        }
      ]
    },
    cases: {
      title: "My projects",
      lead: "Live projects you can open and look at.",
      visit: "Open site",
      watch: "Watch video",
      close: "Close",
      items: [
        { img: "assets/cases/badr-market.jpg", url: "https://xuz4ima-sketch.github.io/badr-market/", title: "BadrBook — publishing house site",
          text: "The publisher’s books and series, an Excel price list for wholesale and retail, and a “Where to buy” section.", tags: ["Website", "Catalog", "Price list"] },
        { img: "assets/cases/santlada.jpg", url: "https://santlada.github.io/", title: "SANTLADA — stretch ceilings in Dagestan",
          text: "A craftsman’s site: three ceiling films priced per m², an area calculator that sends the estimate to WhatsApp, and before/after work.", tags: ["Website", "Calculator", "WhatsApp"] },
        { img: "assets/cases/al-bayan.jpg?v=2", url: "https://al-bayan-academy.github.io/", title: "Al Bayan Academy — online Quran lessons",
          text: "An online school site: how lessons work, the teacher, courses, prices and sign-up for a trial lesson.", tags: ["Website", "Online school", "Sign-up"] },
        { img: "assets/cases/all-himma-bot.jpg", url: "https://t.me/all_himma_bot", title: "Al-Himma — Telegram task bot",
          text: "A personal daily task tracker: reminders, completion analytics and monthly summaries.", tags: ["Telegram bot", "Reminders", "Analytics"],
          visit: "Open bot" },
        { img: "assets/cases/arma-demo.jpg", video: "assets/cases/arma-demo.mp4", title: "ARMA — shop accounting app",
          text: "Accounting for a stretch-ceiling materials shop: sales and printable invoices, stock with receipts and balances, customers and debts, payroll, and reports exported to Excel.", tags: ["Accounting app", "Stock", "Reports"] }
      ]
    },
    process: {
      title: "How I work",
      lead: "You pay after you have seen the finished work and we have polished it.",
      steps: [
        { title: "We talk",            time: "same day",      text: "You tell me what you need. We clarify the task, and I name the price and timeline." },
        { title: "I build",            time: "1 to 7 days",   text: "A site takes 3–7 days, a Telegram bot — 1 day." },
        { title: "I show you",         time: "as we go",      text: "You see the finished result and we fix what needs fixing together." },
        { title: "Payment & launch",   time: "once approved", text: "You pay, I publish the project and hand over everything you need." },
        { title: "Edits after",        time: "free",          text: "Two more rounds of changes if you want to adjust something." }
      ]
    },
    pricing: {
      title: "Pricing",
      lead: "Every project is different and gets its own approach: one client needs a simple card site, another a shop with a catalog. So these are guidelines — I name the exact price and timeline once we discuss your task.",
      from: "from",
      cta: "Discuss my project",
      note: "After payment you get 2 free rounds of edits.",
      items: [
        { name: "Website",      price: "12,000 ₽", time: "3–7 days", text: "A landing page, card site or shop with a catalog and WhatsApp ordering." },
        { name: "Feedback bot", price: "5,000 ₽",  time: "1 day",    text: "Messages arrive in your Telegram, replies go back to the client as the bot." },
        { name: "Mini App",     price: "10,000 ₽", time: "2–4 days", text: "An app inside Telegram: catalog, booking or ordering — nothing to install." },
        { name: "Web service",  price: "22,000 ₽", time: "4–8 days", text: "Customer accounts, roles, admin panel, API and integrations." }
      ]
    },
    reviews: {
      title: "Client reviews",
      lead: "Worked together? Leave a review — it will appear here after a quick check.",
      empty: "No reviews yet. You can leave the first one.",
      outOf: "out of 5",
      form: {
        title: "Leave a review",
        name: "Your name",
        role: "What you ordered (optional)",
        rolePh: "For example: a website for a shop",
        rating: "Rating",
        text: "Your review",
        textPh: "How the work went, what you liked",
        submit: "Send review",
        sending: "Sending…",
        note: "Reviews are published after a check.",
        ok: "Thank you! Your review was sent and will appear on the site after a check.",
        okTg: "Thank you! Telegram will open — send the message and the review will reach me.",
        err: "Could not send the review. Please try again or message me on Telegram.",
        invalid: "Please enter your name and a review (at least 10 characters).",
        wait: "You just sent a review. Please wait a minute.",
        tgPrefix: "Review for the Al-Himma site"
      },
      items: []
    },
    faq: {
      title: "Common questions",
      items: [
        { q: "How much does it cost?",
          a: "A website — from 12,000 ₽, a feedback bot — from 5,000 ₽, a Mini App — from 10,000 ₽, a web service — from 22,000 ₽. I name the exact price after we discuss the task." },
        { q: "How long does it take?",
          a: "A website — from 3 days to a week, a Telegram bot — about one day, a Mini App — 2–4 days, a web service — 4–8 days. I name the exact timeline after we discuss the task." },
        { q: "How do edits work?",
          a: "When the work is ready I show it to you and we fix what needs fixing. After payment you get 2 free rounds of changes." },
        { q: "What do you need from me to start?",
          a: "A short description of the task, examples you like, and texts or photos if you already have them. I take care of the rest." },
        { q: "How do I leave a review?",
          a: "There is a form in the “Reviews” section: enter your name, a rating and a few sentences. The review appears on the site after a check." }
      ]
    },
    contacts: {
      title: "Let’s discuss your project?",
      text: "Tell me what you need — I’ll suggest a solution with a timeline and price. I usually reply the same day.",
      waLabel: "WhatsApp",
      tgLabel: "Telegram",
      waMessage: "Hello! I would like to discuss a project.",
      tgMessage: "Hello! I would like to discuss a project."
    },
    footer: { rights: "All rights reserved." }
  }
};
