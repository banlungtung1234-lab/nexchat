(() => {
  const systemSocket = typeof io === "function" ? io({reconnection:true,reconnectionAttempts:Infinity,reconnectionDelay:500,reconnectionDelayMax:8000,randomizationFactor:0.35,timeout:15000,transports:['websocket','polling']}) : null;
  UI.bindSystemSocket?.(systemSocket);
  UI.loadSystemState?.();
  const tabs = [...document.querySelectorAll(".auth-tab")];
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const title = document.getElementById("authTitle");
  const subtitle = document.getElementById("authSubtitle");
  const formMessage = document.getElementById("formMessage");
  let activeTab = "login";

  function tr(key, vars) { return window.I18N?.t(key, vars) || key; }
  function translatedError(error) { return window.I18N?.serverMessage(error?.message) || error?.message || tr("error"); }

  function setMessage(element, message = "", success = false) {
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("success", success);
  }


  const phoneErrorMessages = {
    vi: "Số điện thoại phải có 10 số và bắt đầu bằng 03, 05, 07, 08 hoặc 09.",
    en: "Use a valid Vietnamese mobile number starting with 03, 05, 07, 08 or 09.",
    zh: "请输入以 03、05、07、08 或 09 开头的有效越南手机号码。",
    ru: "Введите корректный номер Вьетнама, начинающийся с 03, 05, 07, 08 или 09.",
    de: "Gib eine gültige vietnamesische Mobilnummer ein, die mit 03, 05, 07, 08 oder 09 beginnt.",
    th: "กรอกหมายเลขมือถือเวียดนามที่ถูกต้อง โดยขึ้นต้นด้วย 03, 05, 07, 08 หรือ 09",
    es: "Usa un número móvil vietnamita válido que empiece por 03, 05, 07, 08 o 09.",
    fr: "Utilisez un numéro mobile vietnamien valide commençant par 03, 05, 07, 08 ou 09.",
    ja: "03、05、07、08、09 で始まる有効なベトナム携帯番号を入力してください。"
  };
  function phoneErrorText() {
    return phoneErrorMessages[window.I18N?.language || "vi"] || phoneErrorMessages.vi;
  }
  function normalizeVietnamPhone(value) {
    let phone = String(value || "").trim().replace(/[\s.()\-]/g, "");
    if (phone.startsWith("+84")) phone = `0${phone.slice(3)}`;
    else if (phone.startsWith("84") && phone.length === 11) phone = `0${phone.slice(2)}`;
    return phone.replace(/\D/g, "").slice(0, 10);
  }
  function validVietnamPhone(value) {
    return /^(03|05|07|08|09)\d{8}$/.test(normalizeVietnamPhone(value));
  }
  function updatePhoneValidation(input, errorNode, force = false) {
    if (!input || !errorNode) return true;
    const hasValue = input.value.trim().length > 0;
    const valid = hasValue && validVietnamPhone(input.value);
    const showError = hasValue && !valid && (force || input.dataset.touched === "true");
    input.classList.toggle("is-invalid", showError);
    errorNode.textContent = showError ? phoneErrorText() : "";
    errorNode.classList.toggle("hidden", !showError);
    input.setCustomValidity(showError ? phoneErrorText() : "");
    return valid;
  }
  function bindPhoneField(inputId, errorId) {
    const input = document.getElementById(inputId);
    const errorNode = document.getElementById(errorId);
    if (!input || !errorNode) return;
    input.addEventListener("input", () => {
      let value = input.value.replace(/[^\d+]/g, "");
      value = value.startsWith("+") ? `+${value.slice(1).replace(/\+/g, "")}` : value.replace(/\+/g, "");
      input.value = value.slice(0, 12);
      updatePhoneValidation(input, errorNode, false);
    });
    input.addEventListener("blur", () => {
      input.dataset.touched = "true";
      updatePhoneValidation(input, errorNode, true);
      if (validVietnamPhone(input.value)) input.value = normalizeVietnamPhone(input.value);
    });
  }

  function switchTab(tab, focus = true) {
    activeTab = tab;
    tabs.forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
    const isLogin = tab === "login";
    loginForm.classList.toggle("hidden", !isLogin);
    registerForm.classList.toggle("hidden", isLogin);
    title.textContent = tr(isLogin ? "welcomeBack" : "createAccount");
    subtitle.textContent = tr(isLogin ? "loginSubtitle" : "registerSubtitle");
    setMessage(formMessage);
    document.body.classList.toggle("auth-register-active", !isLogin);
    requestAnimationFrame(() => {
      document.querySelector(".auth-card")?.scrollTo({ top: 0, behavior: "instant" });
      if (window.innerWidth <= 820) window.scrollTo({ top: 0, behavior: "instant" });
    });
    const mobileTouch = matchMedia("(max-width: 820px) and (pointer: coarse)").matches;
    if (focus && !mobileTouch) setTimeout(() => (isLogin ? document.getElementById("loginUsername") : document.getElementById("registerUsername"))?.focus(), 40);
  }

  tabs.forEach((button) => button.addEventListener("click", () => switchTab(button.dataset.tab)));
  window.addEventListener("languagechange", () => switchTab(activeTab, false));
  bindPhoneField("registerPhone", "registerPhoneError");
  bindPhoneField("recoveryPhone", "recoveryPhoneError");
  window.addEventListener("languagechange", () => {
    updatePhoneValidation(document.getElementById("registerPhone"), document.getElementById("registerPhoneError"), true);
    updatePhoneValidation(document.getElementById("recoveryPhone"), document.getElementById("recoveryPhoneError"), true);
  });

  const passwordStrengthMessages = {
    vi:["Tối thiểu 8 ký tự, gồm chữ và số","Còn yếu","Trung bình","Mạnh","Rất mạnh"],
    en:["Use 8+ characters with letters and numbers","Weak","Fair","Strong","Very strong"],
    es:["Usa 8+ caracteres con letras y números","Débil","Media","Fuerte","Muy fuerte"],
    fr:["Utilisez 8+ caractères avec lettres et chiffres","Faible","Moyen","Fort","Très fort"],
    ja:["英字と数字を含む8文字以上","弱い","普通","強い","とても強い"]
  };
  function updatePasswordStrength() {
    const input = document.getElementById("registerPassword");
    const meter = document.getElementById("passwordStrength");
    const label = document.getElementById("passwordStrengthText");
    if (!input || !meter || !label) return;
    const value = input.value;
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Za-zÀ-ỹ]/u.test(value) && /\d/.test(value)) score += 1;
    if (value.length >= 12 && /[^A-Za-zÀ-ỹ0-9]/u.test(value)) score += 1;
    if (value.length >= 16 && /[a-zà-ỹ]/u.test(value) && /[A-ZÀ-Ỹ]/u.test(value)) score += 1;
    meter.dataset.level = String(score);
    const messages = passwordStrengthMessages[window.I18N?.language] || passwordStrengthMessages.en;
    label.textContent = value ? messages[Math.max(1, score)] : messages[0];
  }
  document.getElementById("registerPassword")?.addEventListener("input", updatePasswordStrength);
  window.addEventListener("languagechange", updatePasswordStrength);

  const requestedTab = new URLSearchParams(location.search).get("tab");
  if (["login","register"].includes(requestedTab)) switchTab(requestedTab, false);

  const rememberLoginInput = document.getElementById("rememberLogin");
  const loginUsernameInput = document.getElementById("loginUsername");
  function loadRememberedLogin() {
    try {
      const remembered = localStorage.getItem("nexchat-remember-login") === "1";
      const username = localStorage.getItem("nexchat-remembered-username") || "";
      rememberLoginInput.checked = remembered;
      if (remembered && username && !loginUsernameInput.value) loginUsernameInput.value = username;
    } catch (_) {}
  }
  function persistRememberedLogin(username) {
    try {
      if (rememberLoginInput.checked) {
        localStorage.setItem("nexchat-remember-login", "1");
        localStorage.setItem("nexchat-remembered-username", username);
      } else {
        localStorage.removeItem("nexchat-remember-login");
        localStorage.removeItem("nexchat-remembered-username");
      }
    } catch (_) {}
  }
  loadRememberedLogin();

  function openNicknameModal(suggested = "") {
    const form = document.getElementById("nicknameForm");
    form.reset();
    document.getElementById("nicknameInput").value = suggested;
    setMessage(document.getElementById("nicknameMessage"));
    UI.openModal("nicknameModal");
  }

  function showLoginSuccess({ admin = false, redirect = null, next = null } = {}) {
    const modal = document.getElementById("loginSuccessModal");
    const check = document.getElementById("loginSuccessCheck");
    const titleNode = document.getElementById("loginSuccessTitle");
    const messageNode = document.getElementById("loginSuccessMessage");

    titleNode.textContent = tr(admin ? "adminLoginSuccessTitle" : "loginSuccessTitle");
    messageNode.textContent = tr(admin ? "adminLoginSuccessText" : "loginSuccessText");
    modal.classList.remove("is-complete");
    check.innerHTML = UI.iconHTML("check");
    UI.openModal("loginSuccessModal");

    window.setTimeout(() => modal.classList.add("is-complete"), 360);
    window.setTimeout(() => {
      if (typeof next === "function") {
        modal.classList.add("hidden");
        document.body.style.overflow = "";
        next();
        return;
      }
      document.getElementById("pageLoader")?.classList.remove("loaded");
      window.setTimeout(() => { location.href = redirect || (admin ? "/admin" : "/chat"); }, 180);
    }, 1250);
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = loginForm.querySelector("button[type='submit']");
    const identifier = document.getElementById("loginUsername").value.trim();
    const passwordInput = document.getElementById("loginPassword");
    const password = passwordInput.value;
    if (!identifier || !password) return setMessage(formMessage, tr("loginRequired"));
    UI.setLoading(button, true);
    setMessage(formMessage);
    try {
      const data = await UI.fetchJSON("/api/login", { method: "POST", body: { identifier, password, remember: rememberLoginInput.checked } });
      persistRememberedLogin(identifier);
      if (data.requiresSecondPassword) {
        document.getElementById("secondFactorForm").reset();
        document.querySelector("#secondFactorModal .second-factor-card")?.classList.remove("is-error", "is-success");
        setMessage(document.getElementById("secondFactorMessage"));
        UI.openModal("secondFactorModal");
      } else if (data.requiresUserSecondFactor) {
        document.getElementById("userSecondFactorForm").reset();
        setMessage(document.getElementById("userSecondFactorMessage"));
        UI.openModal("userSecondFactorModal");
        setTimeout(() => document.getElementById("userSecondPassword")?.focus(), 80);
      } else if (data.needsNickname) {
        showLoginSuccess({ next: () => openNicknameModal(data.suggestedNickname || identifier) });
      } else {
        showLoginSuccess({ redirect: data.redirect || "/chat" });
      }
    } catch (error) {
      if (error.data?.restriction) showRestriction(error.data.restriction);
      else setMessage(formMessage, translatedError(error));
    } finally {
      passwordInput.value = "";
      UI.setLoading(button, false);
    }
  });

  document.getElementById("userSecondFactorForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector("button[type='submit']");
    const input = document.getElementById("userSecondPassword");
    const message = document.getElementById("userSecondFactorMessage");
    if (!input.value) return setMessage(message, tr("secondPassword"));
    UI.setLoading(button, true);
    setMessage(message);
    try {
      const data = await UI.fetchJSON("/api/user/verify-level2", { method: "POST", body: { password: input.value } });
      UI.closeModal("userSecondFactorModal");
      if (data.needsNickname) showLoginSuccess({ next: () => openNicknameModal(data.suggestedNickname || loginUsernameInput.value.trim()) });
      else showLoginSuccess({ redirect: data.redirect || "/chat" });
    } catch (error) {
      if (error.data?.restriction) showRestriction(error.data.restriction);
      else setMessage(message, translatedError(error));
      input.select();
    } finally { UI.setLoading(button, false); }
  });
  document.getElementById("cancelUserSecondFactor")?.addEventListener("click", async () => {
    try { await UI.fetchJSON("/api/logout", { method: "POST" }); } catch (_) {}
    UI.closeModal("userSecondFactorModal");
    document.getElementById("userSecondFactorForm")?.reset();
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = registerForm.querySelector("button[type='submit']");
    const phoneInput = document.getElementById("registerPhone");
    const phoneError = document.getElementById("registerPhoneError");
    const body = {
      username: document.getElementById("registerUsername").value.trim(),
      phone: normalizeVietnamPhone(phoneInput.value),
      email: document.getElementById("registerEmail").value.trim(),
      password: document.getElementById("registerPassword").value,
      confirmPassword: document.getElementById("registerConfirmPassword").value,
    };
    phoneInput.dataset.touched = "true";
    if (!body.username || !phoneInput.value.trim() || !body.password || !body.confirmPassword) return setMessage(formMessage, tr("requiredFields"));
    if (!updatePhoneValidation(phoneInput, phoneError, true)) return setMessage(formMessage, phoneErrorText());
    phoneInput.value = body.phone;
    if (body.password !== body.confirmPassword) return setMessage(formMessage, tr("passwordMismatch"));
    if (body.password.length < 8 || !/[A-Za-zÀ-ỹ]/u.test(body.password) || !/\d/.test(body.password)) return setMessage(formMessage, passwordStrengthMessages[window.I18N?.language]?.[0] || passwordStrengthMessages.en[0]);
    UI.setLoading(button, true);
    setMessage(formMessage);
    try {
      const data = await UI.fetchJSON("/api/register", { method: "POST", body });
      setTimeout(() => openNicknameModal(data.suggestedNickname || body.username), 180);
    } catch (error) {
      setMessage(formMessage, translatedError(error));
    } finally {
      UI.setLoading(button, false);
    }
  });

  document.getElementById("nicknameForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const nickname = document.getElementById("nicknameInput").value.trim();
    const message = document.getElementById("nicknameMessage");
    const button = event.currentTarget.querySelector("button[type='submit']");
    if (!nickname) return setMessage(message, tr("nicknameRequired"));
    UI.setLoading(button, true);
    setMessage(message);
    try {
      const data = await UI.fetchJSON("/api/profile/nickname", { method: "POST", body: { nickname } });
      document.getElementById("pageLoader")?.classList.remove("loaded");
      setTimeout(() => { location.href = data.redirect || "/chat"; }, 280);
    } catch (error) {
      setMessage(message, translatedError(error));
    } finally {
      UI.setLoading(button, false);
    }
  });

  document.getElementById("secondFactorForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector("button[type='submit']");
    const message = document.getElementById("secondFactorMessage");
    const input = document.getElementById("secondPassword");
    const card = document.querySelector("#secondFactorModal .second-factor-card");
    if (!input.value) {
      setMessage(message, tr("secondPasswordPlaceholder"));
      input.focus();
      return;
    }
    card?.classList.remove("is-error", "is-success");
    UI.setLoading(button, true);
    setMessage(message);
    try {
      const data = await UI.fetchJSON("/api/admin/verify", { method: "POST", body: { password: input.value } });
      card?.classList.add("is-success");
      await new Promise((resolve) => setTimeout(resolve, 180));
      UI.closeModal("secondFactorModal");
      showLoginSuccess({ admin: true, redirect: data.redirect || "/admin" });
    } catch (error) {
      setMessage(message, translatedError(error));
      card?.classList.remove("is-error");
      void card?.offsetWidth;
      card?.classList.add("is-error");
      input.select();
    } finally { UI.setLoading(button, false); }
  });

  let recoveryMode = "password";
  let recoveryStep = "identity";

  function setRecoveryStep(step, focus = true) {
    recoveryStep = step === "code" ? "code" : "identity";
    const identity = document.getElementById("recoveryIdentityStep");
    const codePanel = document.getElementById("recoveryCodeStep");
    const usernameInput = document.getElementById("recoveryUsername");
    const phoneInput = document.getElementById("recoveryPhone");
    const codeInput = document.getElementById("recoveryCode");
    const submitText = document.getElementById("recoverySubmitText");
    identity?.classList.toggle("hidden", recoveryStep === "code");
    codePanel?.classList.toggle("hidden", recoveryStep !== "code");
    if (usernameInput) usernameInput.disabled = recoveryStep === "code" || recoveryMode === "username";
    if (phoneInput) phoneInput.disabled = recoveryStep === "code";
    if (codeInput) { codeInput.disabled = recoveryStep !== "code"; codeInput.required = recoveryStep === "code"; }
    if (submitText) submitText.textContent = tr(recoveryStep === "code" ? "verify" : "sendVerificationCode");
    const description = document.getElementById("recoveryDescription");
    if (description) {
      description.dataset.i18n = recoveryStep === "code" ? "recoveryCodeSent" : (recoveryMode === "username" ? "recoveryUsernameText" : "recoveryPasswordText");
      description.textContent = tr(description.dataset.i18n);
    }
    if (focus) setTimeout(() => document.getElementById(recoveryStep === "code" ? "recoveryCode" : (recoveryMode === "username" ? "recoveryPhone" : "recoveryUsername"))?.focus(), 40);
  }

  function setRecoveryMode(mode, focus = true) {
    recoveryMode = mode === "username" ? "username" : "password";
    const forgotUsername = recoveryMode === "username";
    const usernameField = document.getElementById("recoveryUsernameField");
    const usernameInput = document.getElementById("recoveryUsername");
    const usernameNotice = document.getElementById("recoveryUsernameNotice");
    const description = document.getElementById("recoveryDescription");
    document.querySelectorAll("[data-recovery-mode]").forEach((button) => {
      const active = button.dataset.recoveryMode === recoveryMode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    usernameField?.classList.toggle("hidden", forgotUsername);
    usernameNotice?.classList.toggle("hidden", !forgotUsername);
    if (usernameInput) {
      usernameInput.required = !forgotUsername;
      usernameInput.disabled = forgotUsername;
      if (forgotUsername) usernameInput.value = "";
    }
    if (description && recoveryStep === "identity") {
      description.dataset.i18n = forgotUsername ? "recoveryUsernameText" : "recoveryPasswordText";
      description.textContent = tr(description.dataset.i18n);
    }
    if (usernameInput) usernameInput.disabled = forgotUsername || recoveryStep === "code";
    setMessage(document.getElementById("recoveryMessage"));
    if (focus) setTimeout(() => document.getElementById(forgotUsername ? "recoveryPhone" : "recoveryUsername")?.focus(), 40);
  }

  document.querySelectorAll("[data-recovery-mode]").forEach((button) => {
    button.addEventListener("click", () => setRecoveryMode(button.dataset.recoveryMode));
  });
  window.addEventListener("languagechange", () => { setRecoveryMode(recoveryMode, false); setRecoveryStep(recoveryStep, false); });

  document.getElementById("recoveryRestart").addEventListener("click", () => {
    setRecoveryStep("identity", false);
    setMessage(document.getElementById("recoveryMessage"));
    const phone = document.getElementById("recoveryPhone");
    if (phone) { phone.disabled = false; phone.dataset.touched = "false"; }
    updatePhoneValidation(phone, document.getElementById("recoveryPhoneError"), false);
    setRecoveryMode(recoveryMode, true);
  });

  document.getElementById("forgotButton").addEventListener("click", () => {
    document.getElementById("recoveryForm").reset();
    setRecoveryStep("identity", false);
    document.getElementById("recoveryCode").value = "";
    document.getElementById("recoveryPhone").disabled = false;
    document.getElementById("recoveryPhone").dataset.touched = "false";
    updatePhoneValidation(document.getElementById("recoveryPhone"), document.getElementById("recoveryPhoneError"), false);
    setRecoveryMode("password", false);
    UI.openModal("recoveryModal");
    setTimeout(() => document.getElementById("recoveryUsername")?.focus(), 80);
  });

  document.getElementById("recoveryForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector("button[type='submit']");
    const message = document.getElementById("recoveryMessage");
    const usernameInput = document.getElementById("recoveryUsername");
    const phoneInput = document.getElementById("recoveryPhone");
    const phoneError = document.getElementById("recoveryPhoneError");
    UI.setLoading(button, true);
    setMessage(message);
    try {
      if (recoveryStep === "code") {
        const code = document.getElementById("recoveryCode").value.trim();
        if (!/^\d{4,10}$/.test(code)) {
          document.getElementById("recoveryCode").focus();
          return setMessage(message, tr("recoveryCodeInvalid"));
        }
        const data = await UI.fetchJSON("/api/recovery/verify", { method: "POST", body: { code } });
        location.href = data.redirect || "/support";
        return;
      }
      const username = recoveryMode === "password" ? usernameInput.value.trim() : "";
      if (recoveryMode === "password" && !/^[a-zA-Z0-9._]{3,24}$/.test(username)) {
        usernameInput.focus();
        return setMessage(message, tr("usernameRequiredForPassword"));
      }
      phoneInput.dataset.touched = "true";
      if (!updatePhoneValidation(phoneInput, phoneError, true)) return setMessage(message, phoneErrorText());
      const phone = normalizeVietnamPhone(phoneInput.value);
      phoneInput.value = phone;
      const data = await UI.fetchJSON("/api/recovery/start", { method: "POST", body: { recoveryType: recoveryMode, username, phone } });
      setRecoveryStep("code", true);
      setMessage(message, data.message || tr("recoveryCodeSent"));
    } catch (error) { setMessage(message, translatedError(error)); }
    finally { UI.setLoading(button, false); }
  });

  function showRestriction(restriction) {
    document.getElementById("restrictionTitle").textContent = restriction.type === "ban" ? "Tài khoản đã bị cấm" : "Tài khoản đang bị khóa";
    document.getElementById("restrictionMessage").textContent = restriction.message || tr("accountRestricted");
    document.getElementById("restrictionDetails").innerHTML = UI.restrictionHTML(restriction);
    UI.openModal("restrictionModal");
  }

  async function restorePendingNickname() {
    try {
      const session = await UI.fetchJSON("/api/session");
      if (session.role === "user" && session.needsNickname) openNicknameModal(session.user?.username || "");
    } catch (_) {}
  }

  window.addEventListener("load", () => {
    setTimeout(() => document.getElementById("pageLoader")?.classList.add("loaded"), 220);
    restorePendingNickname();
  });
})();
