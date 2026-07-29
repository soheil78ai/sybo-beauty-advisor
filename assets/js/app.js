/**
 * app.js
 * کنترل‌کننده اصلی جریان گفتگو: تعریف دسته‌ها و سؤال‌های هر دسته، مدیریت state،
 * بازگشت/شروع مجدد، و اتصال موتور پیشنهاد (recommendation-engine.js) به رابط چت (chat-ui.js).
 */

(function () {
  const CONFIG = window.SAIBO_CONFIG;
  const PRODUCTS = window.PRODUCTS;

  /**
   * تعریف سؤال‌های هر دسته. هر سؤال یک id (کلید ذخیره پاسخ در answers)،
   * متن سؤال و لیست گزینه‌ها {label, value} دارد.
   */
  const CATEGORY_FLOWS = {
    sunscreen: {
      label: "ضدآفتاب",
      questions: [
        {
          key: "skinType",
          text: "نوع پوستت چیه؟",
          options: [
            { label: "چرب و مستعد جوش", value: "oily" },
            { label: "خشک", value: "dry" },
            { label: "مختلط", value: "combination" },
            { label: "معمولی", value: "normal" },
            { label: "حساس", value: "sensitive" },
          ],
        },
        {
          key: "colorType",
          text: "ضدآفتاب رنگی می‌خوای یا بی‌رنگ؟",
          options: [
            { label: "رنگی", value: "tinted" },
            { label: "بی‌رنگ", value: "untinted" },
            { label: "تفاوتی ندارد", value: "any" },
          ],
        },
        {
          key: "texture",
          text: "چه نوع بافتی ترجیح می‌دی؟",
          options: [
            { label: "سبک و زودجذب", value: "light" },
            { label: "کرمی و مرطوب‌کننده", value: "creamy" },
            { label: "فاقد چربی", value: "oil-free" },
            { label: "تفاوتی ندارد", value: "any" },
          ],
        },
        {
          key: "budget",
          text: "حدود بودجه‌ات چقدره؟",
          options: [
            { label: "اقتصادی", value: "economy" },
            { label: "متوسط", value: "mid" },
            { label: "پریمیوم", value: "premium" },
            { label: "محدودیت بودجه ندارم", value: "unlimited" },
          ],
        },
      ],
    },

    cleanser: {
      label: "شوینده صورت",
      questions: [
        {
          key: "skinType",
          text: "نوع پوستت چیه؟",
          options: [
            { label: "چرب و مستعد جوش", value: "oily" },
            { label: "خشک", value: "dry" },
            { label: "مختلط", value: "combination" },
            { label: "معمولی", value: "normal" },
            { label: "حساس", value: "sensitive" },
          ],
        },
        {
          key: "concern",
          text: "پوستت حساسیت داره یا جوش فعال داری؟",
          options: [
            { label: "پوست حساس دارم", value: "sensitive" },
            { label: "جوش فعال دارم", value: "acne-active" },
            { label: "هیچکدام، فقط شست‌وشوی روزمره", value: "none" },
          ],
        },
        {
          key: "texture",
          text: "چه بافتی برای شوینده ترجیح می‌دی؟",
          options: [
            { label: "ژل", value: "gel" },
            { label: "فوم", value: "foam" },
            { label: "کرمی", value: "cream" },
            { label: "تفاوتی ندارد", value: "any" },
          ],
        },
        {
          key: "budget",
          text: "حدود بودجه‌ات چقدره؟",
          options: [
            { label: "اقتصادی", value: "economy" },
            { label: "متوسط", value: "mid" },
            { label: "پریمیوم", value: "premium" },
            { label: "محدودیت بودجه ندارم", value: "unlimited" },
          ],
        },
      ],
    },

    moisturizer: {
      label: "آبرسان و مرطوب‌کننده",
      questions: [
        {
          key: "skinType",
          text: "نوع پوستت چیه؟",
          options: [
            { label: "چرب و مستعد جوش", value: "oily" },
            { label: "خشک", value: "dry" },
            { label: "مختلط", value: "combination" },
            { label: "معمولی", value: "normal" },
            { label: "حساس", value: "sensitive" },
          ],
        },
        {
          key: "dryness",
          text: "میزان خشکی یا کم‌آبی پوستت چقدره؟",
          options: [
            { label: "خیلی خشک و کشیده", value: "severe-dryness" },
            { label: "کمی خشک", value: "mild-dryness" },
            { label: "نرمال، کمبود آب ندارم", value: "none" },
            { label: "چرب اما کم‌آب", value: "oil-control" },
          ],
        },
        {
          key: "texture",
          text: "چه بافتی ترجیح می‌دی؟",
          options: [
            { label: "ژلی و سبک", value: "gel-light" },
            { label: "کرمی", value: "creamy" },
            { label: "فاقد چربی", value: "oil-free" },
            { label: "تفاوتی ندارد", value: "any" },
          ],
        },
        {
          key: "budget",
          text: "حدود بودجه‌ات چقدره؟",
          options: [
            { label: "اقتصادی", value: "economy" },
            { label: "متوسط", value: "mid" },
            { label: "پریمیوم", value: "premium" },
            { label: "محدودیت بودجه ندارم", value: "unlimited" },
          ],
        },
      ],
    },

    shampoo: {
      label: "شامپو",
      questions: [
        {
          key: "hairType",
          text: "وضعیت مو یا پوست سرت چطوره؟",
          options: [
            { label: "چرب", value: "oily" },
            { label: "خشک", value: "dry" },
            { label: "معمولی", value: "normal" },
            { label: "حساس", value: "sensitive" },
            { label: "رنگ‌شده یا آسیب‌دیده", value: "color-treated" },
          ],
        },
        {
          key: "need",
          text: "مهم‌ترین نیازت چیه؟",
          options: [
            { label: "کنترل چربی", value: "oil-control" },
            { label: "کاهش خشکی", value: "dryness" },
            { label: "مراقبت از موی رنگ‌شده", value: "color-care" },
            { label: "کاهش شوره", value: "dandruff-control" },
            { label: "تقویت مو", value: "strengthening" },
            { label: "مصرف روزانه", value: "daily-use" },
          ],
        },
        {
          key: "preference",
          text: "چه نوع محصولی رو ترجیح می‌دی؟",
          options: [
            { label: "اقتصادی", value: "economical" },
            { label: "بدون سولفات", value: "sulfate-free" },
            { label: "تخصصی", value: "specialized" },
            { label: "تفاوتی ندارد", value: "any" },
          ],
        },
        {
          key: "budget",
          text: "حدود بودجه‌ات چقدره؟",
          options: [
            { label: "اقتصادی", value: "economy" },
            { label: "متوسط", value: "mid" },
            { label: "پریمیوم", value: "premium" },
            { label: "محدودیت بودجه ندارم", value: "unlimited" },
          ],
        },
      ],
    },
  };

  const CATEGORY_MENU = [
    { label: "ضدآفتاب", value: "sunscreen" },
    { label: "شوینده صورت", value: "cleanser" },
    { label: "آبرسان و مرطوب‌کننده", value: "moisturizer" },
    { label: "شامپو", value: "shampoo" },
  ];

  const STORAGE_KEY = "sybo_session_v1";

  /** state داخلی گفتگو */
  let state = {
    category: null,
    step: 0, // ایندکس سؤال فعلی در آرایه questions
    answers: {},
  };

  function saveSession() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* localStorage در دسترس نیست؛ بدون مشکل نادیده گرفته می‌شود */
    }
  }

  function clearSession() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      /* noop */
    }
  }

  function resetState() {
    state = { category: null, step: 0, answers: {} };
    clearSession();
  }

  function buildWhatsappLink(product) {
    const message = CONFIG.whatsappMessageTemplate.replace("{productName}", product.name);
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${CONFIG.whatsappNumber}?text=${encoded}`;
  }

  function handleOrderClick(product) {
    const url = buildWhatsappLink(product);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function showRestartButton() {
    ChatUI.showOptions([{ label: "شروع مجدد", value: "restart" }], () => {
      start();
    });
  }

  function showBackAndRestart(onBack) {
    const opts = [];
    if (onBack) opts.push({ label: "بازگشت به سؤال قبل", value: "back" });
    opts.push({ label: "شروع مجدد", value: "restart" });
    return opts;
  }

  /** نتایج پایانی را بر اساس state.answers نمایش می‌دهد */
  async function showResults() {
    ChatUI.hideProgress();
    await ChatUI.addBotMessage("بر اساس جواب‌هات، این گزینه‌ها می‌تونن انتخاب‌های مناسب‌تری برای تو باشن.");

    const recommendations = RecommendationEngine.getRecommendations(
      state.category,
      state.answers,
      PRODUCTS,
      CONFIG.maxRecommendations
    );

    if (recommendations.length === 0) {
      ChatUI.showNotice(CONFIG.noMatchMessage, "info");
      ChatUI.showOptions(
        [
          { label: "دریافت مشاوره در واتساپ", value: "consult" },
          { label: "شروع مجدد", value: "restart" },
        ],
        (value) => {
          if (value === "consult") {
            const msg = CONFIG.whatsappMessageTemplate.replace("{productName}", "مناسب برای " + CATEGORY_FLOWS[state.category].label);
            window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
          } else {
            start();
          }
        }
      );
      clearSession();
      return;
    }

    ChatUI.showProductCards(recommendations, CONFIG, handleOrderClick);
    ChatUI.showNotice(CONFIG.disclaimerText, "warning");
    showRestartButton();
    clearSession();
  }

  /** سؤال فعلی را نمایش می‌دهد */
  async function askCurrentQuestion() {
    const flow = CATEGORY_FLOWS[state.category];
    const question = flow.questions[state.step];

    ChatUI.updateProgress(state.step + 1, flow.questions.length);
    await ChatUI.addBotMessage(question.text);

    ChatUI.showOptions(question.options, (value, label) => {
      ChatUI.addUserMessage(label);
      state.answers[question.key] = value;
      state.step += 1;
      saveSession();

      if (state.step >= flow.questions.length) {
        showResults();
      } else {
        askCurrentQuestion();
      }
    });

    // دکمه بازگشت به سؤال قبل (در صورت وجود سؤال قبلی)
    if (state.step > 0) {
      const backWrap = document.createElement("div");
      backWrap.className = "back-link-wrap";
      const backBtn = document.createElement("button");
      backBtn.type = "button";
      backBtn.className = "back-link";
      backBtn.textContent = "‹ بازگشت به سؤال قبل";
      backBtn.setAttribute("aria-label", "بازگشت به سؤال قبل");
      backBtn.addEventListener("click", () => {
        state.step -= 1;
        const lastKey = flow.questions[state.step].key;
        delete state.answers[lastKey];
        // دو پیام آخر (سؤال + گزینه‌ها) از چت حذف نمی‌شوند تا تاریخچه گفتگو حفظ شود؛
        // به‌جای آن سؤال قبلی دوباره پرسیده می‌شود.
        askCurrentQuestion();
      });
      backWrap.appendChild(backBtn);
      document.getElementById("chat-log").appendChild(backWrap);
      ChatUI.scrollToBottom();
    }
  }

  async function handleCategorySelect(value, label) {
    ChatUI.addUserMessage(label);
    state.category = value;
    state.step = 0;
    state.answers = {};
    saveSession();
    await askCurrentQuestion();
  }

  async function showCategoryMenu() {
    await ChatUI.addBotMessage("دنبال چه محصولی هستی؟");
    ChatUI.showOptions(CATEGORY_MENU, handleCategorySelect);
  }

  /** شروع یا شروعِ مجددِ گفتگو */
  async function start() {
    resetState();
    ChatUI.clearChat();
    await ChatUI.addBotMessage(CONFIG.welcomeMessage, { typingDelay: 400 });
    ChatUI.showOptions([{ label: "شروع انتخاب محصول", value: "start" }], () => {
      ChatUI.addUserMessage("شروع انتخاب محصول");
      showCategoryMenu();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    // هدر: نام سیستم/فروشگاه و لوگو از config.js
    const logoImg = document.getElementById("brand-logo");
    const brandName = document.getElementById("brand-name");
    if (logoImg) {
      logoImg.src = CONFIG.logo;
      logoImg.alt = CONFIG.systemName;
      logoImg.onerror = function () {
        this.style.display = "none";
      };
    }
    if (brandName) brandName.textContent = CONFIG.systemName;
    document.title = `${CONFIG.systemName} | ${CONFIG.systemTagline}`;

    const restartTopBtn = document.getElementById("restart-top-btn");
    if (restartTopBtn) {
      restartTopBtn.addEventListener("click", () => start());
    }

    start();
  });
})();
