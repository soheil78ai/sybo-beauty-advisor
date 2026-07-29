/**
 * recommendation-engine.js
 * موتور امتیازدهی و انتخاب محصول.
 *
 * این فایل مستقل از رابط کاربری است: فقط دیتا می‌گیرد و دیتا برمی‌گرداند،
 * بنابراین بعداً به‌سادگی قابل تست و توسعه است.
 *
 * سیستم امتیازدهی (حداکثر ۱۴ امتیاز در هر دسته):
 *   - تطابق نوع پوست/مو ..................... 4 امتیاز (اجباری؛ اگر صفر شود محصول حذف می‌شود)
 *   - تطابق با نیاز اصلی ...................... 4 امتیاز
 *   - تطابق بافت یا ترجیح محصول ............... 2 امتیاز
 *   - تطابق بودجه ............................. 3 امتیاز (تطابق کامل=3، یک پله فاصله=1)
 *   - محصول ویژه فروشگاه (featured) ........... 1 امتیاز
 *
 * توجه: برای «ضدآفتاب» چون سؤال جداگانه‌ای برای «نیاز اصلی» وجود ندارد،
 * سؤال «رنگی/بی‌رنگ بودن» به‌عنوان معیار ۴ امتیازی در نظر گرفته شده
 * و «بافت» معیار ۲ امتیازی است.
 */

(function () {
  const PRICE_LEVEL_ORDER = ["economy", "mid", "premium", "luxury"];

  /**
   * امتیاز بودجه را حساب می‌کند.
   * @param {string} userBudget - مقدار انتخابی کاربر ("economy"|"mid"|"premium"|"luxury"|"unlimited")
   * @param {string} productPriceLevel
   * @returns {number} امتیاز بین 0 تا 3
   */
  function scoreBudget(userBudget, productPriceLevel) {
    if (userBudget === "unlimited" || userBudget === "any") return 3;
    const userIdx = PRICE_LEVEL_ORDER.indexOf(userBudget);
    const productIdx = PRICE_LEVEL_ORDER.indexOf(productPriceLevel);
    if (userIdx === -1 || productIdx === -1) return 0;
    const distance = Math.abs(userIdx - productIdx);
    if (distance === 0) return 3;
    if (distance === 1) return 1;
    return 0;
  }

  /**
   * امتیاز تطابق نوع پوست/مو را حساب می‌کند. محصولاتی با تگ "all" با هر جوابی مطابقت دارند.
   * @param {string[]} productTypes
   * @param {string} userType
   * @returns {number} 0 یا 4
   */
  function scoreType(productTypes, userType) {
    if (!Array.isArray(productTypes)) return 0;
    if (productTypes.includes("all")) return 4;
    return productTypes.includes(userType) ? 4 : 0;
  }

  /**
   * امتیاز یک معیار «ترجیحی» را حساب می‌کند (بافت، رنگی/بی‌رنگ، ترجیح شامپو، نیاز پوستی و...).
   * اگر کاربر مقدار "any" را انتخاب کرده باشد (یعنی «تفاوتی ندارد» یا «هیچکدام»)، امتیاز کامل داده می‌شود.
   * @param {string|string[]} productValue - مقدار تکی (مثل texture) یا آرایه‌ای (مثل concerns)
   * @param {string} userValue
   * @param {number} weight
   * @returns {number}
   */
  function scorePreference(productValue, userValue, weight) {
    if (userValue === "any" || userValue === "none") return weight;
    if (Array.isArray(productValue)) {
      return productValue.includes(userValue) ? weight : 0;
    }
    return productValue === userValue ? weight : 0;
  }

  /**
   * تعریف نحوه امتیازدهی هر دسته: کدام فیلد محصول با کدام پاسخ کاربر مقایسه شود.
   * answers شیئی است شامل کلیدهای سؤال‌های همان دسته (به app.js نگاه کنید).
   */
  /**
   * هر تابع امتیازدهی، به‌جای یک عدد ساده، شیء { score, strong } برمی‌گرداند.
   * strong=true یعنی محصول هم نوع پوست/مو و هم معیار «نیاز اصلی» (وزن ۴) را کامل پاسخ داده.
   * این پرچم برای جلوگیری از پیشنهاد محصولی استفاده می‌شود که با نیاز صریح کاربر در تضاد است
   * (مثلاً پیشنهاد محصول بی‌رنگ به کاربری که صراحتاً ضدآفتاب رنگی خواسته، فقط به‌خاطر ارزان‌تر بودن).
   */
  const CATEGORY_SCORERS = {
    sunscreen(product, answers) {
      const typeScore = scoreType(product.skinTypes, answers.skinType);
      if (typeScore === 0) return null; // عدم تطابق نوع پوست = حذف محصول
      const colorScore = scorePreference(product.colorType, answers.colorType, 4);
      const textureScore = scorePreference(product.texture, answers.texture, 2);
      const budgetScore = scoreBudget(answers.budget, product.priceLevel);
      return {
        score: typeScore + colorScore + textureScore + budgetScore,
        strong: typeScore === 4 && colorScore === 4,
      };
    },

    cleanser(product, answers) {
      const typeScore = scoreType(product.skinTypes, answers.skinType);
      if (typeScore === 0) return null;
      const concernScore = scorePreference(product.concerns, answers.concern, 4);
      const textureScore = scorePreference(product.texture, answers.texture, 2);
      const budgetScore = scoreBudget(answers.budget, product.priceLevel);
      return {
        score: typeScore + concernScore + textureScore + budgetScore,
        strong: typeScore === 4 && concernScore === 4,
      };
    },

    moisturizer(product, answers) {
      const typeScore = scoreType(product.skinTypes, answers.skinType);
      if (typeScore === 0) return null;
      const drynessScore = scorePreference(product.concerns, answers.dryness, 4);
      const textureScore = scorePreference(product.texture, answers.texture, 2);
      const budgetScore = scoreBudget(answers.budget, product.priceLevel);
      return {
        score: typeScore + drynessScore + textureScore + budgetScore,
        strong: typeScore === 4 && drynessScore === 4,
      };
    },

    shampoo(product, answers) {
      const typeScore = scoreType(product.hairTypes, answers.hairType);
      if (typeScore === 0) return null;
      const needScore = scorePreference(product.concerns, answers.need, 4);
      const prefScore = scorePreference(product.preference, answers.preference, 2);
      const budgetScore = scoreBudget(answers.budget, product.priceLevel);
      return {
        score: typeScore + needScore + prefScore + budgetScore,
        strong: typeScore === 4 && needScore === 4,
      };
    },
  };

  /**
   * برچسب‌های فارسی برای ساخت متن دلیل پیشنهاد
   */
  const LABELS = {
    skinType: {
      oily: "پوست چرب و مستعد جوش",
      dry: "پوست خشک",
      combination: "پوست مختلط",
      normal: "پوست معمولی",
      sensitive: "پوست حساس",
    },
    hairType: {
      oily: "موی چرب",
      dry: "موی خشک",
      normal: "موی معمولی",
      sensitive: "پوست سر حساس",
      "color-treated": "موی رنگ‌شده",
      damaged: "موی آسیب‌دیده",
    },
    budget: {
      economy: "بودجه اقتصادی",
      mid: "بودجه متوسط",
      premium: "بودجه پریمیوم",
      luxury: "بدون محدودیت بودجه",
      unlimited: "بدون محدودیت بودجه",
    },
    texture: {
      light: "بافت سبک و زودجذب",
      creamy: "بافت کرمی و مرطوب‌کننده",
      "oil-free": "بافت فاقد چربی",
      gel: "بافت ژلی",
      foam: "بافت فومی",
      cream: "بافت کرمی",
      "gel-light": "بافت ژلی و سبک",
    },
    colorType: {
      tinted: "رنگی بودن",
      untinted: "بی‌رنگ بودن",
    },
  };

  function reasonPhraseFor(field, value) {
    if (!value || value === "any" || value === "none") return null;
    const table = LABELS[field];
    if (!table) return null;
    return table[value] || null;
  }

  /**
   * متن «دلیل پیشنهاد» را بر اساس پاسخ‌های کاربر می‌سازد.
   */
  function buildReason(category, answers) {
    const parts = [];
    if (category === "shampoo") {
      parts.push(reasonPhraseFor("hairType", answers.hairType));
    } else {
      parts.push(reasonPhraseFor("skinType", answers.skinType));
    }
    parts.push(reasonPhraseFor("texture", answers.texture));
    parts.push(reasonPhraseFor("colorType", answers.colorType));
    parts.push(reasonPhraseFor("budget", answers.budget));

    const clean = parts.filter(Boolean);
    if (clean.length === 0) {
      return "این محصول با توجه به پاسخ‌های شما انتخاب شده است.";
    }
    if (clean.length === 1) {
      return `این محصول به دلیل تناسب با ${clean[0]} پیشنهاد شده است.`;
    }
    const last = clean.pop();
    return `این محصول به دلیل ${clean.join("، ")} و ${last} پیشنهاد شده است.`;
  }

  /**
   * تابع اصلی: بر اساس دسته و پاسخ‌های کاربر، لیست نهایی پیشنهادها را برمی‌گرداند.
   *
   * @param {string} category
   * @param {Object} answers
   * @param {Array} allProducts
   * @param {number} maxResults
   * @returns {Array<{product, score, badge, reason}>}
   */
  function getRecommendations(category, answers, allProducts, maxResults) {
    const scorer = CATEGORY_SCORERS[category];
    if (!scorer) return [];

    const scored = allProducts
      .filter((p) => p.category === category && p.available !== false)
      .map((product) => {
        const result = scorer(product, answers);
        if (result === null) return null;
        let score = result.score;
        if (product.featured) score += 1;
        return { product, score, strong: result.strong };
      })
      .filter(Boolean)
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) return [];

    // برای جلوگیری از پیشنهاد محصولی که با نیاز صریح کاربر در تضاد است
    // (مثلاً محصول بی‌رنگ برای کاربری که رنگی خواسته، صرفاً چون ارزان‌تر است)،
    // در صورت وجود حداقل یک محصول strong، فقط از بین محصولات strong انتخاب می‌کنیم.
    const strongPool = scored.filter((e) => e.strong);
    const pool = strongPool.length > 0 ? strongPool : scored;

    const limit = maxResults || 3;
    const results = [];
    const usedIds = new Set();

    // ۱. بهترین پیشنهاد: بالاترین امتیاز
    const best = pool[0];
    results.push({ ...best, badge: "بهترین پیشنهاد" });
    usedIds.add(best.product.id);

    // ۲. گزینه اقتصادی‌تر: ارزان‌ترین محصول باقی‌مانده (در همان استخر معتبر)
    const remaining = pool.filter((e) => !usedIds.has(e.product.id));
    if (remaining.length > 0 && results.length < limit) {
      const cheapest = [...remaining].sort((a, b) => a.product.price - b.product.price)[0];
      if (cheapest.product.price < best.product.price) {
        results.push({ ...cheapest, badge: "گزینه اقتصادی‌تر" });
        usedIds.add(cheapest.product.id);
      }
    }

    // ۳. پیشنهاد جایگزین: بالاترین امتیاز باقی‌مانده
    const stillRemaining = pool.filter((e) => !usedIds.has(e.product.id));
    if (stillRemaining.length > 0 && results.length < limit) {
      results.push({ ...stillRemaining[0], badge: "پیشنهاد جایگزین" });
      usedIds.add(stillRemaining[0].product.id);
    }

    return results.slice(0, limit).map((entry) => ({
      ...entry,
      reason: buildReason(category, answers),
    }));
  }

  window.RecommendationEngine = {
    getRecommendations,
    // برای تست واحد در صورت نیاز، توابع کمکی هم خروجی داده می‌شوند
    _internal: { scoreBudget, scoreType, scorePreference, buildReason },
  };
})();
