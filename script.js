/* =========================================================
   ESP HOSTING — interactions
   ========================================================= */

(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const PLANS = {
    kaze: {
      name: "Kaze",
      kanji: "風",
      tagline: "Для проектов, которым нужен воздух.",
      basePrice: 14900,
      short: "Ryzen 7 7700X · 64 GB · 2 × 1 TB",
      specs: {
        cpu: "AMD Ryzen 7 7700X",
        ram: "64 GB DDR5",
        storage: "2 × 1 TB NVMe",
        network: "1 Gbps · безлимит"
      },
      locations: ["Токио"]
    },
    mori: {
      name: "Mori",
      kanji: "森",
      tagline: "Для команд, которые растут.",
      basePrice: 29900,
      short: "Ryzen 9 9950X · 128 GB · 2 × 2 TB",
      specs: {
        cpu: "AMD Ryzen 9 9950X",
        ram: "128 GB DDR5 ECC",
        storage: "2 × 2 TB NVMe Gen5",
        network: "10 Gbps · безлимит"
      },
      locations: ["Токио", "Франкфурт"]
    },
    yama: {
      name: "Yama",
      kanji: "山",
      tagline: "Для нагрузки, которой тесно в облаке.",
      basePrice: 89900,
      short: "2 × EPYC 9354 · 512 GB · 4 × 3.84 TB",
      specs: {
        cpu: "2 × AMD EPYC 9354",
        ram: "512 GB DDR5 ECC",
        storage: "4 × 3.84 TB NVMe",
        network: "2 × 10 Gbps"
      },
      locations: ["Токио", "Франкфурт", "Нью-Йорк"]
    }
  };

  const PERIOD_DISCOUNTS = { 1: 0, 3: 0.05, 6: 0.1, 12: 0.15 };
  const BACKUP_PRICE = 1490;

  const moneyFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
  const money = (value) => `${moneyFormatter.format(Math.round(value))} ₽`;

  const pluralMonths = (months) => {
    if (months === 1) return "месяц";
    if (months === 3) return "месяца";
    return "месяцев";
  };

  const periodLabel = (months) => `${months} ${pluralMonths(months)}`;

  const state = {
    planId: null,
    period: 1,
    backup: false,
    method: "card",
    total: 0,
    lastFocused: null,
    paymentTimer: null,
    receipt: null
  };

  /* -------------------------------------------------------
     Header, mobile navigation
     ------------------------------------------------------- */

  const header = $("#siteHeader");
  const menuToggle = $("#menuToggle");
  const mainNav = $("#mainNav");
  const mobileNavQuery = window.matchMedia("(max-width: 980px)");
  let menuOpen = false;
  let scrollTicking = false;

  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 36);
    scrollTicking = false;
  };

  updateHeader();
  window.addEventListener("scroll", () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateHeader);
      scrollTicking = true;
    }
  }, { passive: true });

  const syncNavInert = () => {
    if (mobileNavQuery.matches) {
      mainNav.inert = !menuOpen;
    } else {
      menuOpen = false;
      mainNav.inert = false;
      mainNav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Открыть меню");
      document.body.classList.remove("nav-open");
      header.classList.remove("menu-active");
    }
  };

  const closeMenu = () => {
    if (!menuOpen) return;
    menuOpen = false;
    mainNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Открыть меню");
    document.body.classList.remove("nav-open");
    header.classList.remove("menu-active");
    if (mobileNavQuery.matches) mainNav.inert = true;
  };

  const openMenu = () => {
    menuOpen = true;
    mainNav.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Закрыть меню");
    document.body.classList.add("nav-open");
    header.classList.add("menu-active");
    mainNav.inert = false;
  };

  menuToggle.addEventListener("click", () => {
    if (menuOpen) closeMenu();
    else openMenu();
  });

  $$(".main-nav a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (!menuOpen) return;
    if (!header.contains(event.target)) closeMenu();
  });

  mobileNavQuery.addEventListener("change", syncNavInert);
  syncNavInert();

  /* -------------------------------------------------------
     Time, petals, parallax
     ------------------------------------------------------- */

  const tokyoClock = $("#tokyoClock");
  const networkTime = $("#networkTime");

  const updateClocks = () => {
    try {
      const tokyo = new Intl.DateTimeFormat("ru-RU", {
        timeZone: "Asia/Tokyo",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(new Date());
      if (tokyoClock) tokyoClock.textContent = `${tokyo} JST`;

      const moscow = new Intl.DateTimeFormat("ru-RU", {
        timeZone: "Europe/Moscow",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).format(new Date());
      if (networkTime) networkTime.textContent = `${moscow} MSK`;
    } catch (error) {
      // Time zone formatting is unavailable in some very old environments.
    }
  };

  updateClocks();
  window.setInterval(updateClocks, 1000);

  const heroPetals = $("#heroPetals");
  if (heroPetals && !prefersReducedMotion) {
    for (let i = 0; i < 12; i += 1) {
      const petal = document.createElement("span");
      petal.className = "petal";
      petal.style.left = `${5 + Math.random() * 91}%`;
      petal.style.setProperty("--duration", `${16 + Math.random() * 14}s`);
      petal.style.setProperty("--delay", `${-Math.random() * 26}s`);
      petal.style.setProperty("--opacity", `${0.14 + Math.random() * 0.28}`);
      petal.style.width = `${6 + Math.random() * 6}px`;
      petal.style.height = `${4 + Math.random() * 5}px`;
      heroPetals.appendChild(petal);
    }
  }

  const heroVisual = $("#heroVisual");
  const heroArtWrap = $(".hero-art-wrap");
  let parallaxFrame = null;

  if (heroVisual && heroArtWrap && !prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
    heroVisual.addEventListener("pointermove", (event) => {
      const rect = heroVisual.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      if (parallaxFrame) cancelAnimationFrame(parallaxFrame);
      parallaxFrame = requestAnimationFrame(() => {
        heroArtWrap.style.setProperty("--px", (x * 11).toFixed(2));
        heroArtWrap.style.setProperty("--py", (y * 9).toFixed(2));
      });
    });

    heroVisual.addEventListener("pointerleave", () => {
      heroArtWrap.style.setProperty("--px", "0");
      heroArtWrap.style.setProperty("--py", "0");
    });
  }

  /* -------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------- */

  const revealItems = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.13, rootMargin: "0px 0px -6% 0px" });

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  /* -------------------------------------------------------
     Accessible live region + toast
     ------------------------------------------------------- */

  const liveRegion = document.createElement("div");
  liveRegion.className = "sr-only";
  liveRegion.setAttribute("aria-live", "polite");
  document.body.appendChild(liveRegion);

  const toast = $("#toast");
  let toastTimer = null;

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2400);
  };

  const announce = (message) => {
    liveRegion.textContent = "";
    window.setTimeout(() => {
      liveRegion.textContent = message;
    }, 30);
  };

  /* -------------------------------------------------------
     Plan selection
     ------------------------------------------------------- */

  const planCards = $$(".plan-card");
  const selectionBar = $("#selectionBar");
  const selectionSeal = $("#selectionSeal");
  const selectionName = $("#selectionName");
  const selectionLocation = $("#selectionLocation");
  const selectionSpecs = $("#selectionSpecs");
  const selectionPrice = $("#selectionPrice");
  const clearSelectionButton = $("#clearSelection");
  const openCheckoutButton = $("#openCheckout");

  const getSelectedPlan = () => (state.planId ? PLANS[state.planId] : null);

  const updateSelectionBar = () => {
    const plan = getSelectedPlan();
    if (!plan) {
      selectionBar.classList.remove("is-visible");
      selectionBar.setAttribute("aria-hidden", "true");
      selectionBar.inert = true;
      document.body.classList.remove("has-selection");
      return;
    }

    selectionSeal.textContent = plan.kanji;
    selectionName.textContent = plan.name;
    selectionLocation.textContent = plan.locations.join(" / ");
    selectionSpecs.textContent = plan.short;
    selectionPrice.textContent = money(plan.basePrice);
    selectionBar.removeAttribute("inert");
    selectionBar.setAttribute("aria-hidden", "false");
    selectionBar.classList.add("is-visible");
    document.body.classList.add("has-selection");
  };

  const selectPlan = (planId, options = {}) => {
    const plan = PLANS[planId];
    if (!plan) return;

    state.planId = planId;
    state.period = 1;
    state.backup = false;

    planCards.forEach((card) => {
      const selected = card.dataset.plan === planId;
      card.classList.toggle("is-selected", selected);
      card.setAttribute("aria-checked", String(selected));
    });

    updateSelectionBar();
    announce(`Выбран сервер ${plan.name}, ${money(plan.basePrice)} в месяц.`);

    if (options.focusBar) {
      window.setTimeout(() => openCheckoutButton.focus({ preventScroll: true }), 450);
    }
  };

  const clearSelection = () => {
    state.planId = null;
    planCards.forEach((card) => {
      card.classList.remove("is-selected");
      card.setAttribute("aria-checked", "false");
    });
    updateSelectionBar();
    announce("Выбор сервера сброшен.");
  };

  planCards.forEach((card, index) => {
    card.addEventListener("click", () => selectPlan(card.dataset.plan));

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectPlan(card.dataset.plan, { focusBar: true });
        return;
      }

      if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
        const nextIndex = (index + direction + planCards.length) % planCards.length;
        const nextCard = planCards[nextIndex];
        selectPlan(nextCard.dataset.plan);
        nextCard.focus();
      }
    });
  });

  clearSelectionButton.addEventListener("click", clearSelection);

  /* -------------------------------------------------------
     Checkout: populate order
     ------------------------------------------------------- */

  const checkout = $("#checkout");
  const checkoutPanel = $(".checkout-panel");
  const checkoutClose = $("#checkoutClose");
  const checkoutLayout = $("#checkoutLayout");
  const successView = $("#successView");
  const paymentForm = $("#paymentForm");
  const orderKanji = $("#orderKanji");
  const orderName = $("#orderName");
  const orderTagline = $("#orderTagline");
  const orderSpecs = $("#orderSpecs");
  const locationSelect = $("#locationSelect");
  const periodGrid = $("#periodGrid");
  const backupAddon = $("#backupAddon");
  const payMethods = $("#payMethods");
  const checkoutError = $("#checkoutError");

  const breakdownPlan = $("#breakdownPlan");
  const breakdownBase = $("#breakdownBase");
  const discountRow = $("#discountRow");
  const breakdownDiscount = $("#breakdownDiscount");
  const backupRow = $("#backupRow");
  const breakdownBackup = $("#breakdownBackup");
  const checkoutTotal = $("#checkoutTotal");
  const totalCaption = $("#totalCaption");
  const payButton = $("#payButton");
  const payButtonText = $(".pay-button-text");

  const setOrderAside = (plan) => {
    orderKanji.textContent = plan.kanji;
    orderName.textContent = plan.name;
    orderTagline.textContent = plan.tagline;
    const orderMobileSpecs = $("#orderMobileSpecs");
    if (orderMobileSpecs) orderMobileSpecs.textContent = plan.short;
    orderSpecs.innerHTML = `
      <div><dt>Процессор</dt><dd>${plan.specs.cpu}</dd></div>
      <div><dt>Память</dt><dd>${plan.specs.ram}</dd></div>
      <div><dt>Диски</dt><dd>${plan.specs.storage}</dd></div>
      <div><dt>Канал</dt><dd>${plan.specs.network}</dd></div>
    `;

    locationSelect.innerHTML = "";
    plan.locations.forEach((location) => {
      const option = document.createElement("option");
      option.value = location;
      option.textContent = location;
      locationSelect.appendChild(option);
    });
  };

  const calculateTotal = () => {
    const plan = getSelectedPlan();
    if (!plan) return { months: state.period, base: 0, discount: 0, backup: 0, total: 0 };

    const months = state.period;
    const base = plan.basePrice * months;
    const discount = Math.round(base * PERIOD_DISCOUNTS[months]);
    const backup = state.backup ? BACKUP_PRICE * months : 0;

    return {
      months,
      base,
      discount,
      backup,
      total: base - discount + backup
    };
  };

  const updateTotals = () => {
    const plan = getSelectedPlan();
    if (!plan) return;

    const totals = calculateTotal();
    state.total = totals.total;

    breakdownPlan.textContent = `${plan.name} · ${periodLabel(totals.months)}`;
    breakdownBase.textContent = money(totals.base);
    breakdownDiscount.textContent = `−${money(totals.discount)}`;
    breakdownBackup.textContent = money(totals.backup);
    checkoutTotal.textContent = money(totals.total);
    totalCaption.textContent = `за ${periodLabel(totals.months)}`;
    payButtonText.textContent = `Оплатить ${money(totals.total)}`;

    discountRow.hidden = totals.discount <= 0;
    backupRow.hidden = !state.backup;
  };

  const setPeriod = (months) => {
    state.period = months;
    $$(".period-option", periodGrid).forEach((button) => {
      const active = Number(button.dataset.period) === months;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    updateTotals();
  };

  periodGrid.addEventListener("click", (event) => {
    const button = event.target.closest(".period-option");
    if (!button) return;
    setPeriod(Number(button.dataset.period));
  });

  backupAddon.addEventListener("change", () => {
    state.backup = backupAddon.checked;
    updateTotals();
  });

  const setPaymentMethod = (method) => {
    state.method = method;
    $$(".payment-pane").forEach((pane) => {
      pane.hidden = pane.dataset.pane !== method;
    });
    clearCheckoutError();
  };

  payMethods.addEventListener("change", (event) => {
    const input = event.target.closest('input[name="payment"]');
    if (!input) return;
    setPaymentMethod(input.value);
  });

  /* -------------------------------------------------------
     Checkout: open / close
     ------------------------------------------------------- */

  const pageChildren = [...document.body.children].filter((element) =>
    element !== checkout && element !== toast && element.tagName !== "SCRIPT"
  );
  let pageInertSnapshot = new Map();

  const setPageInert = (inert) => {
    if (inert) {
      pageInertSnapshot = new Map();
      pageChildren.forEach((element) => {
        pageInertSnapshot.set(element, element.inert);
        element.inert = true;
      });
    } else {
      pageChildren.forEach((element) => {
        element.inert = pageInertSnapshot.has(element) ? pageInertSnapshot.get(element) : false;
      });
    }
  };

  const resetCheckoutView = () => {
    checkoutLayout.hidden = false;
    successView.hidden = true;
    checkoutPanel.classList.remove("is-success");
    checkoutError.textContent = "";
    $$(".field-error").forEach((error) => { error.textContent = ""; });
    $$(".field input, .field select").forEach((input) => input.removeAttribute("aria-invalid"));
    payButton.classList.remove("is-loading");
    payButton.disabled = false;
  };

  const openCheckout = () => {
    const plan = getSelectedPlan();
    if (!plan) return;

    state.lastFocused = document.activeElement;
    closeMenu();
    resetCheckoutView();
    paymentForm.reset();
    state.backup = false;
    backupAddon.checked = false;
    setPaymentMethod("card");
    setOrderAside(plan);
    setPeriod(1);
    updateTotals();
    const scrollArea = $(".checkout-scroll");
    if (scrollArea) scrollArea.scrollTop = 0;

    checkout.classList.add("is-open");
    checkout.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    setPageInert(true);

    window.setTimeout(() => checkoutClose.focus({ preventScroll: true }), 80);
  };

  const closeCheckout = () => {
    if (!checkout.classList.contains("is-open")) return;

    window.clearTimeout(state.paymentTimer);
    state.paymentTimer = null;
    payButton.classList.remove("is-loading");
    payButton.disabled = false;

    checkout.classList.remove("is-open");
    checkout.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    setPageInert(false);

    window.setTimeout(() => {
      if (checkout.classList.contains("is-open")) return;
      resetCheckoutView();
      paymentForm.reset();
      state.backup = false;
      backupAddon.checked = false;
      setPeriod(1);
      if (state.lastFocused && document.contains(state.lastFocused)) {
        state.lastFocused.focus({ preventScroll: true });
      }
    }, 280);
  };

  openCheckoutButton.addEventListener("click", openCheckout);
  checkoutClose.addEventListener("click", closeCheckout);
  $$("[data-checkout-close]").forEach((element) => {
    element.addEventListener("click", closeCheckout);
  });

  document.addEventListener("keydown", (event) => {
    if (!checkout.classList.contains("is-open")) {
      if (event.key === "Escape" && menuOpen) closeMenu();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeCheckout();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = $$(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      checkoutPanel
    ).filter((element) => element.offsetParent !== null);

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (!checkoutPanel.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    }
  });

  /* -------------------------------------------------------
     Form formatting, validation, payment simulation
     ------------------------------------------------------- */

  const cardNumber = $("#cardNumber");
  const cardExpiry = $("#cardExpiry");
  const cardCvc = $("#cardCvc");
  const cardName = $("#cardName");
  const sbpPhone = $("#sbpPhone");
  const contactEmail = $("#contactEmail");
  const termsCheckbox = $("#termsCheckbox");
  const fillDemoButton = $("#fillDemo");
  const copyCryptoButton = $("#copyCrypto");
  const cryptoAddress = $("#cryptoAddress");

  const errorElements = {
    cardNumber: $("#cardNumberError"),
    cardExpiry: $("#cardExpiryError"),
    cardCvc: $("#cardCvcError"),
    cardName: $("#cardNameError"),
    sbpPhone: $("#sbpPhoneError"),
    contactEmail: $("#contactEmailError")
  };

  const setFieldError = (input, message) => {
    const error = errorElements[input.id];
    if (message) {
      input.setAttribute("aria-invalid", "true");
      if (error) error.textContent = message;
    } else {
      input.removeAttribute("aria-invalid");
      if (error) error.textContent = "";
    }
  };

  const clearCheckoutError = () => {
    checkoutError.textContent = "";
  };

  const clearFieldErrorOnInput = (input) => {
    input.addEventListener("input", () => setFieldError(input, ""));
  };

  [cardNumber, cardExpiry, cardCvc, cardName, sbpPhone, contactEmail].forEach(clearFieldErrorOnInput);

  cardNumber.addEventListener("input", () => {
    const digits = cardNumber.value.replace(/\D/g, "").slice(0, 16);
    cardNumber.value = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  });

  cardExpiry.addEventListener("input", () => {
    const digits = cardExpiry.value.replace(/\D/g, "").slice(0, 4);
    cardExpiry.value = digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits;
  });

  cardCvc.addEventListener("input", () => {
    cardCvc.value = cardCvc.value.replace(/\D/g, "").slice(0, 4);
  });

  sbpPhone.addEventListener("input", () => {
    let digits = sbpPhone.value.replace(/\D/g, "");
    if (digits.startsWith("8")) digits = `7${digits.slice(1)}`;
    if (!digits.startsWith("7")) digits = `7${digits}`;
    digits = digits.slice(0, 11);

    const part = digits.slice(1);
    let formatted = "+7";
    if (part.length > 0) formatted += ` (${part.slice(0, 3)}`;
    if (part.length >= 4) formatted += `) ${part.slice(3, 6)}`;
    if (part.length >= 7) formatted += `-${part.slice(6, 8)}`;
    if (part.length >= 9) formatted += `-${part.slice(8, 10)}`;
    sbpPhone.value = formatted;
  });

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value.trim());

  const isExpiryValid = (value) => {
    const match = value.match(/^(0[1-9]|1[0-2])\s*\/\s*(\d{2})$/);
    if (!match) return false;
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    const expires = new Date(year, month, 1);
    return expires > new Date();
  };

  const validateForm = () => {
    let valid = true;
    let firstInvalid = null;

    const markInvalid = (input, message) => {
      setFieldError(input, message);
      if (!firstInvalid) firstInvalid = input;
      valid = false;
    };

    if (state.method === "card") {
      const digits = cardNumber.value.replace(/\D/g, "");
      if (digits.length !== 16) markInvalid(cardNumber, "Введите 16 цифр номера карты.");
      if (!isExpiryValid(cardExpiry.value)) markInvalid(cardExpiry, "Укажите срок в формате ММ / ГГ.");
      if (!/^\d{3,4}$/.test(cardCvc.value)) markInvalid(cardCvc, "CVC состоит из 3–4 цифр.");
      if (cardName.value.trim().length < 2) markInvalid(cardName, "Укажите имя, как на карте.");
    }

    if (state.method === "sbp") {
      const digits = sbpPhone.value.replace(/\D/g, "");
      if (digits.length !== 11 || !digits.startsWith("7")) {
        markInvalid(sbpPhone, "Введите российский номер телефона.");
      }
    }

    if (!isValidEmail(contactEmail.value)) {
      markInvalid(contactEmail, "Введите корректный email.");
    }

    if (!termsCheckbox.checked) {
      checkoutError.textContent = "Примите условия аренды, чтобы продолжить.";
      valid = false;
      if (!firstInvalid) firstInvalid = termsCheckbox;
    } else if (!valid) {
      checkoutError.textContent = "Проверьте выделенные поля — в них есть неточности.";
    }

    if (firstInvalid) {
      firstInvalid.focus({ preventScroll: true });
      firstInvalid.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
    }

    return valid;
  };

  const generateOrderNumber = () => {
    const year = new Date().getFullYear();
    const suffix = String(Math.floor(1000 + Math.random() * 9000));
    return `ESP-${year}-${suffix}`;
  };

  const createSuccessPetals = () => {
    const container = $("#successPetals");
    if (!container || prefersReducedMotion) return;
    container.innerHTML = "";
    for (let i = 0; i < 18; i += 1) {
      const petal = document.createElement("span");
      petal.className = "success-petal";
      petal.style.left = `${4 + Math.random() * 92}%`;
      petal.style.setProperty("--delay", `${Math.random() * 1.4}s`);
      petal.style.setProperty("--drift", `${-80 + Math.random() * 160}px`);
      petal.style.width = `${5 + Math.random() * 5}px`;
      petal.style.height = `${4 + Math.random() * 4}px`;
      container.appendChild(petal);
    }
    window.setTimeout(() => { container.innerHTML = ""; }, 6500);
  };

  const showSuccess = (order) => {
    resetCheckoutView();
    checkoutLayout.hidden = true;
    successView.hidden = false;
    checkoutPanel.classList.add("is-success");

    $("#successEmail").textContent = order.email;
    $("#successOrder").textContent = order.number;
    $("#successAmount").textContent = money(order.amount);
    if (toast) toast.classList.remove("is-visible");

    createSuccessPetals();
    announce(`Заказ ${order.number} принят. Демонстрационный платёж на сумму ${money(order.amount)}.`);
    window.setTimeout(() => checkoutClose.focus({ preventScroll: true }), 100);
  };

  paymentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearCheckoutError();

    if (!validateForm()) {
      announce("Проверьте данные формы.");
      return;
    }

    const plan = getSelectedPlan();
    if (!plan) return;

    const order = {
      number: generateOrderNumber(),
      email: contactEmail.value.trim(),
      plan: plan.name,
      kanji: plan.kanji,
      location: locationSelect.value,
      months: state.period,
      backup: state.backup,
      method: state.method,
      amount: state.total,
      base: calculateTotal().base,
      discount: calculateTotal().discount,
      backupPrice: calculateTotal().backup,
      date: new Date()
    };

    state.receipt = order;
    payButton.classList.add("is-loading");
    payButton.disabled = true;
    payButtonText.textContent = "Проводим платёж…";

    window.clearTimeout(state.paymentTimer);
    state.paymentTimer = window.setTimeout(() => {
      showSuccess(order);
    }, 1650);
  });

  fillDemoButton.addEventListener("click", () => {
    const cardRadio = payMethods.querySelector('input[value="card"]');
    cardRadio.checked = true;
    setPaymentMethod("card");

    cardNumber.value = "4276 1600 1234 5678";
    cardExpiry.value = "12 / 29";
    cardCvc.value = "123";
    cardName.value = "IVAN PETROV";
    contactEmail.value = "ivan@example.com";
    termsCheckbox.checked = true;

    [cardNumber, cardExpiry, cardCvc, cardName, contactEmail].forEach((input) => {
      setFieldError(input, "");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    clearCheckoutError();
    showToast("Тестовые данные заполнены");
    payButton.focus({ preventScroll: true });
  });

  copyCryptoButton.addEventListener("click", async () => {
    const address = cryptoAddress.textContent.trim();
    try {
      await navigator.clipboard.writeText(address);
      copyCryptoButton.textContent = "Скопировано";
      showToast("Адрес скопирован");
      window.setTimeout(() => { copyCryptoButton.textContent = "Копировать"; }, 1800);
    } catch (error) {
      const temporary = document.createElement("textarea");
      temporary.value = address;
      temporary.style.position = "fixed";
      temporary.style.opacity = "0";
      document.body.appendChild(temporary);
      temporary.select();
      try {
        document.execCommand("copy");
        copyCryptoButton.textContent = "Скопировано";
        showToast("Адрес скопирован");
        window.setTimeout(() => { copyCryptoButton.textContent = "Копировать"; }, 1800);
      } catch (copyError) {
        showToast("Не удалось скопировать адрес");
      }
      temporary.remove();
    }
  });

  /* -------------------------------------------------------
     Invoice download
     ------------------------------------------------------- */

  const methodNames = { card: "Банковская карта", sbp: "СБП", crypto: "USDT TRC-20" };

  $("#downloadInvoice").addEventListener("click", () => {
    const order = state.receipt;
    if (!order) return;

    const date = new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(order.date);

    const lines = [
      "ESP HOSTING",
      "ДЕМОНСТРАЦИОННЫЙ СЧЁТ",
      "========================================",
      `Номер заказа: ${order.number}`,
      `Дата: ${date}`,
      "",
      "СОСТАВ ЗАКАЗА",
      `Сервер: ${order.plan} (${order.kanji})`,
      `Локация: ${order.location}`,
      `Срок аренды: ${periodLabel(order.months)}`,
      `Бэкапы: ${order.backup ? "включены" : "не включены"}`,
      `Способ оплаты: ${methodNames[order.method] || order.method}`,
      "",
      "РАСЧЁТ",
      `Аренда: ${money(order.base)}`,
      `Скидка за срок: −${money(order.discount)}`,
      `Бэкапы: ${money(order.backupPrice)}`,
      `ИТОГО: ${money(order.amount)}`,
      "",
      "Статус: демонстрационный заказ.",
      "Реальное списание не производилось.",
      "Спасибо, что выбрали ESP Hosting."
    ];

    const blob = new Blob([lines.join("\r\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ESP-invoice-${order.number}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Счёт скачан");
  });

  /* -------------------------------------------------------
     FAQ accordion
     ------------------------------------------------------- */

  const faqItems = $$(".faq-item");

  const closeFaqItem = (item) => {
    const button = $(".faq-question", item);
    const answer = $(".faq-answer", item);
    const wasOpen = item.classList.contains("is-open");
    if (!wasOpen) return;

    item.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
    window.setTimeout(() => {
      if (!item.classList.contains("is-open")) answer.hidden = true;
    }, 460);
  };

  const openFaqItem = (item) => {
    const button = $(".faq-question", item);
    const answer = $(".faq-answer", item);
    answer.hidden = false;
    answer.style.maxHeight = "0px";
    void answer.offsetHeight;
    answer.style.maxHeight = "";
    item.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
  };

  faqItems.forEach((item) => {
    const button = $(".faq-question", item);

    button.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      faqItems.forEach((otherItem) => {
        if (otherItem !== item) closeFaqItem(otherItem);
      });
      if (isOpen) closeFaqItem(item);
      else openFaqItem(item);
    });
  });

  /* -------------------------------------------------------
     Initial state
     ------------------------------------------------------- */

  updateSelectionBar();
  setPeriod(1);
})();
