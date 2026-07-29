/**
 * chat-ui.js
 * توابع عمومی رابط کاربری شبیه چت: نمایش پیام‌ها، دکمه‌های گزینه، نوار پیشرفت،
 * انیمیشن تایپ و کارت‌های محصول. این فایل هیچ منطق تصمیم‌گیری‌ای ندارد؛
 * فقط DOM را می‌سازد و رویدادها را به app.js گزارش می‌دهد.
 */

const ChatUI = (function () {
  const chatLog = document.getElementById("chat-log");
  const progressBar = document.getElementById("progress-bar-fill");
  const progressWrap = document.getElementById("progress-wrap");
  const progressLabel = document.getElementById("progress-label");

  function scrollToBottom() {
    requestAnimationFrame(() => {
      chatLog.scrollTop = chatLog.scrollHeight;
    });
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /**
   * یک پیام از طرف ربات نمایش می‌دهد، همراه با یک انیمیشن کوتاه «در حال تایپ...»
   * @param {string} text
   * @param {Object} [opts]
   * @param {number} [opts.typingDelay=550]
   * @returns {Promise<void>}
   */
  function addBotMessage(text, opts = {}) {
    const typingDelay = opts.typingDelay ?? 550;
    return new Promise((resolve) => {
      const typingBubble = el("div", "msg msg-bot msg-typing");
      typingBubble.setAttribute("aria-hidden", "true");
      typingBubble.innerHTML =
        '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
      chatLog.appendChild(typingBubble);
      scrollToBottom();

      setTimeout(() => {
        typingBubble.remove();
        const bubble = el("div", "msg msg-bot");
        bubble.setAttribute("role", "status");
        bubble.textContent = text;
        chatLog.appendChild(bubble);
        scrollToBottom();
        resolve();
      }, typingDelay);
    });
  }

  /**
   * پیام انتخابی کاربر را (بعد از کلیک روی یک گزینه) در چت نمایش می‌دهد.
   * @param {string} text
   */
  function addUserMessage(text) {
    const bubble = el("div", "msg msg-user", text);
    chatLog.appendChild(bubble);
    scrollToBottom();
  }

  /**
   * دکمه‌های گزینه را نمایش می‌دهد. با کلیک روی هرکدام، همه غیرفعال می‌شوند
   * و onSelect صدا زده می‌شود.
   * @param {Array<{label:string, value:string}>} options
   * @param {(value:string, label:string) => void} onSelect
   */
  function showOptions(options, onSelect) {
    const wrap = el("div", "options");
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "گزینه‌های پاسخ");

    const buttons = options.map((opt) => {
      const btn = el("button", "option-btn", opt.label);
      btn.type = "button";
      btn.setAttribute("aria-label", opt.label);
      btn.addEventListener("click", () => {
        buttons.forEach((b) => (b.disabled = true));
        wrap.classList.add("options-answered");
        onSelect(opt.value, opt.label);
      });
      wrap.appendChild(btn);
      return btn;
    });

    chatLog.appendChild(wrap);
    scrollToBottom();
    return wrap;
  }

  /**
   * نوار پیشرفت را به‌روزرسانی می‌کند.
   * @param {number} step - شماره سؤال فعلی (از 1)
   * @param {number} total - تعداد کل سؤال‌های همان دسته
   */
  function updateProgress(step, total) {
    if (!step || !total) {
      progressWrap.classList.add("hidden");
      return;
    }
    progressWrap.classList.remove("hidden");
    const percent = Math.min(100, Math.round((step / total) * 100));
    progressBar.style.width = percent + "%";
    progressLabel.textContent = `سؤال ${step} از ${total}`;
    progressWrap.setAttribute("aria-valuenow", String(percent));
  }

  function hideProgress() {
    progressWrap.classList.add("hidden");
  }

  /**
   * کارت‌های محصول پیشنهادی را می‌سازد و به چت اضافه می‌کند.
   * @param {Array<{product:Object, score:number, badge:string, reason:string}>} recommendations
   * @param {Object} config
   * @param {(product:Object) => void} onOrderClick
   */
  function showProductCards(recommendations, config, onOrderClick) {
    const wrap = el("div", "product-cards");

    recommendations.forEach((entry) => {
      const { product, badge, reason } = entry;
      const card = el("article", "product-card");
      card.setAttribute("aria-label", `پیشنهاد محصول: ${product.name}`);

      const badgeEl = el("span", "product-badge", badge);
      card.appendChild(badgeEl);

      const imgWrap = el("div", "product-image-wrap");
      const img = document.createElement("img");
      img.src = product.image || config.placeholderImage;
      img.alt = product.name;
      img.loading = "lazy";
      img.onerror = function () {
        this.onerror = null;
        this.src = config.placeholderImage;
      };
      imgWrap.appendChild(img);
      card.appendChild(imgWrap);

      const body = el("div", "product-body");

      const brandEl = el("div", "product-brand", product.brand);
      body.appendChild(brandEl);

      const nameEl = el("h3", "product-name", product.name);
      body.appendChild(nameEl);

      const priceEl = el(
        "div",
        "product-price",
        `${Number(product.price).toLocaleString("fa-IR")} ${config.currency}`
      );
      body.appendChild(priceEl);

      const reasonEl = el("p", "product-reason", reason);
      body.appendChild(reasonEl);

      if (product.tags && product.tags.length) {
        const tagsWrap = el("div", "product-tags");
        product.tags.slice(0, 4).forEach((tag) => {
          tagsWrap.appendChild(el("span", "product-tag", tag));
        });
        body.appendChild(tagsWrap);
      }

      const actions = el("div", "product-actions");

      const viewBtn = el("a", "btn btn-outline", "مشاهده محصول");
      viewBtn.href = product.productUrl || "#";
      viewBtn.target = "_blank";
      viewBtn.rel = "noopener noreferrer";
      viewBtn.setAttribute("aria-label", `مشاهده محصول ${product.name}`);
      actions.appendChild(viewBtn);

      const orderBtn = el("button", "btn btn-primary", "سفارش / مشاوره در واتساپ");
      orderBtn.type = "button";
      orderBtn.setAttribute("aria-label", `سفارش یا مشاوره برای ${product.name} در واتساپ`);
      orderBtn.addEventListener("click", () => onOrderClick(product));
      actions.appendChild(orderBtn);

      body.appendChild(actions);
      card.appendChild(body);
      wrap.appendChild(card);
    });

    chatLog.appendChild(wrap);
    scrollToBottom();
  }

  /**
   * یک بلوک اعلان (مثل «محصولی پیدا نشد» یا هشدار پزشکی) نمایش می‌دهد.
   * @param {string} text
   * @param {"info"|"warning"} type
   */
  function showNotice(text, type = "info") {
    const notice = el("div", `notice notice-${type}`, text);
    notice.setAttribute("role", "note");
    chatLog.appendChild(notice);
    scrollToBottom();
  }

  function clearChat() {
    chatLog.innerHTML = "";
    hideProgress();
  }

  return {
    addBotMessage,
    addUserMessage,
    showOptions,
    updateProgress,
    hideProgress,
    showProductCards,
    showNotice,
    clearChat,
    scrollToBottom,
  };
})();
