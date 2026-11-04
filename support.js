(() => {
  const socket = io({reconnection:true,reconnectionAttempts:Infinity,reconnectionDelay:500,reconnectionDelayMax:8000,randomizationFactor:0.35,timeout:15000,transports:['websocket','polling']});
  UI.bindSystemSocket?.(socket);
  const icon = (name, cls="") => UI.iconHTML(name, cls);
  const state = { user: null, recovery: false, recoveryType: null, selectedFile: null, selectedFileUrl: null, typingTimer: null, typingActive: false, lastTypingSignalAt: 0, composerComposing: false, composerResizeFrame: 0, items: [] };
  const messages = document.getElementById("messages");
  const input = document.getElementById("messageInput");
  const form = document.getElementById("messageForm");
  const fileInput = document.getElementById("fileInput");
  const preview = document.getElementById("attachmentPreview");
  const t = (key, vars) => window.I18N?.t(key, vars) || key;
  const serverText = (message) => window.I18N?.serverMessage(message) || message;
  const displayName = (user) => user?.nickname || user?.username || "?";

  async function loadConversation() {
    try {
      const data = await UI.fetchJSON("/api/messages/support");
      state.user = data.user; state.recovery = data.recovery; state.recoveryType = data.recoveryType || null; state.items = data.messages || [];
      document.getElementById("supportDescription").textContent = state.recovery
        ? t(state.recoveryType === "username" ? "supportRecoveryUsernameDescription" : "supportRecoveryPasswordDescription")
        : t("supportDescription");
      renderAccount(); renderMessages(); socket.emit("chat:read", { scope: "support" });
    } catch (error) {
      if (error.status === 401) location.href = "/login"; else UI.toast(serverText(error.message), "error", t("error"));
    }
  }

  function renderAccount() {
    if (!state.user) return;
    const recoveryModeKey = state.recoveryType === "username" ? "usernameRecoveryMode" : "recoveryMode";
    document.getElementById("supportAccount").innerHTML = `<span><strong>${UI.escapeHTML(t("account"))}:</strong> ${UI.escapeHTML(displayName(state.user))} (@${UI.escapeHTML(state.user.username)})</span><span><strong>${UI.escapeHTML(t("phone"))}:</strong> ${UI.escapeHTML(state.user.phone)}</span><span><strong>${UI.escapeHTML(t("mode"))}:</strong> ${UI.escapeHTML(t(state.recovery ? recoveryModeKey : "memberSupport"))}</span>`;
  }

  function renderMessages() {
    messages.innerHTML = "";
    if (!state.items.length) {
      messages.innerHTML = `<div class="empty-conversation"><div class="empty-illustration">${icon("headset")}</div><h3>${UI.escapeHTML(t("startSupport"))}</h3><p>${UI.escapeHTML(t("supportStartText"))}</p></div>`;
      return;
    }
    state.items.forEach((message) => appendMessage(message, false)); scrollBottom();
  }

  function statusHTML(message) {
    if (message.fromId !== state.user?.id) return "";
    const seen = (message.receiptBy || []).includes("admin");
    return `<span class="delivery-status ${seen ? "seen" : ""}" data-message-status>${seen ? `<span class="receipt-icons">${icon("check")}${icon("check")}</span>` : icon("check","receipt-single")} ${UI.escapeHTML(t(seen ? "seen" : "sent"))}</span>`;
  }

  function appendMessage(message, scroll = true) {
    if (!state.user || messages.querySelector(`[data-message-id="${CSS.escape(message.id)}"]`)) return;
    messages.querySelector(".empty-conversation")?.remove();
    const mine = message.fromId === state.user.id;
    const sender = message.senderRole === "admin" ? t("adminSupport") : displayName(state.user);
    const row = document.createElement("article"); row.className = `message-row ${mine ? "mine" : "other"}`; row.dataset.messageId = message.id;
    row.innerHTML = `${mine ? "" : `<div class="avatar admin-avatar"><img src="/nexchat-logo.svg" alt=""></div>`}<div class="message-column"><div class="message-bubble"><div class="message-meta"><strong>${UI.escapeHTML(sender)}</strong><time>${UI.formatTime(message.createdAt)}</time></div>${message.text ? `<div class="message-text">${UI.escapeHTML(message.text)}</div>` : ""}${UI.attachmentHTML(message.attachment)}</div>${statusHTML(message)}</div>`;
    messages.appendChild(row); if (scroll) scrollBottom();
  }

  function updateRead(messageIds = []) {
    const ids = new Set(messageIds);
    state.items.forEach((message) => {
      if (!ids.has(message.id)) return;
      if (!Array.isArray(message.receiptBy)) message.receiptBy = [];
      if (!message.receiptBy.includes("admin")) message.receiptBy.push("admin");
      const status = messages.querySelector(`[data-message-id="${CSS.escape(message.id)}"] [data-message-status]`);
      if (status) { status.classList.add("seen"); status.innerHTML = `<span class="receipt-icons">${icon("check")}${icon("check")}</span> ${UI.escapeHTML(t("seen"))}`; }
    });
  }

  function scrollBottom() { requestAnimationFrame(() => { messages.scrollTop = messages.scrollHeight; }); }
  async function uploadFile() {
    if (!state.selectedFile) return null;
    if (state.selectedFile.size > 30 * 1024 * 1024) throw new Error(t("fileTooLarge"));
    const data = new FormData(); data.append("file", state.selectedFile);
    const result = await UI.fetchJSON("/api/upload", { method: "POST", body: data }); return result.attachment;
  }

  const resizeSupportComposer = () => {
    if (state.composerResizeFrame) return;
    state.composerResizeFrame = requestAnimationFrame(() => {
      state.composerResizeFrame = 0;
      UI.autoResize(input);
    });
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault(); if (state.composerComposing) return; const text = input.value.trim(); if (!text && !state.selectedFile) return;
    const sendButton = form.querySelector("button[type='submit']"); sendButton.disabled = true;
    try {
      const attachment = await uploadFile();
      socket.emit("chat:send", { scope: "support", text, attachmentId: attachment?.id || null }, (result) => {
        sendButton.disabled = false;
        if (!result?.ok) return UI.toast(serverText(result?.message || t("sendFailed")), "error", t("error"));
        input.value = ""; resizeSupportComposer(); clearAttachment();
        clearTimeout(state.typingTimer);
        if (state.typingActive) socket.emit("chat:typing", { scope: "support", isTyping: false });
        state.typingActive = false;
      });
    } catch (error) { sendButton.disabled = false; UI.toast(serverText(error.message), "error", t("error")); }
  });

  input.addEventListener("compositionstart", () => { state.composerComposing = true; });
  input.addEventListener("compositionend", () => { state.composerComposing = false; input.dispatchEvent(new Event("input", { bubbles: true })); });
  input.addEventListener("input", () => {
    resizeSupportComposer();
    if (state.composerComposing) return;
    const hasText = Boolean(input.value.trim());
    const now = Date.now();
    if (hasText && (!state.typingActive || now - state.lastTypingSignalAt > 2500)) { state.typingActive = true; state.lastTypingSignalAt = now; socket.emit("chat:typing", { scope: "support", isTyping: true }); }
    if (!hasText && state.typingActive) { state.typingActive = false; socket.emit("chat:typing", { scope: "support", isTyping: false }); }
    clearTimeout(state.typingTimer); state.typingTimer = setTimeout(() => { if (state.typingActive) socket.emit("chat:typing", { scope: "support", isTyping: false }); state.typingActive = false; }, 1600);
  });
  input.addEventListener("keydown", (event) => { if (event.key === "Enter" && !event.shiftKey && !event.isComposing && !state.composerComposing) { event.preventDefault(); form.requestSubmit(); } });

  document.getElementById("attachButton").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0]; if (!file) return;
    if (file.size > 30 * 1024 * 1024) { UI.toast(t("fileTooLarge"), "error", t("error")); fileInput.value = ""; return; }
    if (state.selectedFileUrl) URL.revokeObjectURL(state.selectedFileUrl);
    state.selectedFile = file;
    state.selectedFileUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    preview.classList.remove("hidden");
    preview.innerHTML = `${state.selectedFileUrl ? `<img class="attachment-preview-image" src="${state.selectedFileUrl}" alt="">` : `<span class="file-icon">${icon("paperclip")}</span>`}<div class="preview-copy"><strong>${UI.escapeHTML(file.name)}</strong><small>${UI.formatBytes(file.size)} · ${state.selectedFileUrl ? "Chất lượng gốc" : UI.escapeHTML(t("readyToSend"))}</small></div><button type="button" data-remove aria-label="Gỡ tệp">${icon("close")}</button>`;
  });
  preview.addEventListener("click", (event) => { if (event.target.closest("[data-remove]")) clearAttachment(); });
  function clearAttachment() { if (state.selectedFileUrl) URL.revokeObjectURL(state.selectedFileUrl); state.selectedFileUrl = null; state.selectedFile = null; fileInput.value = ""; preview.classList.add("hidden"); preview.innerHTML = ""; }

  socket.on("connect", () => UI.setConnectionState(true, t("readyToSend")));
  socket.on("disconnect", () => UI.setConnectionState(false, "Đang kết nối lại"));
  socket.on("chat:message", (message) => {
    if (message.scope !== "support" || message.supportUserId !== state.user?.id) return;
    state.items.push(message); appendMessage(message);
    if (message.senderRole === "admin") socket.emit("chat:read", { scope: "support" });
  });
  socket.on("chat:read", (payload) => { if (payload.scope === "support" && Array.isArray(payload.messageIds)) updateRead(payload.messageIds); });
  socket.on("chat:typing", (payload) => {
    if (payload.scope !== "support") return;
    const indicator = document.getElementById("typingIndicator");
    document.getElementById("typingText").textContent = t("adminTyping"); indicator.classList.toggle("hidden", !payload.isTyping);
  });
  socket.on("account:notice", (payload) => { document.getElementById("noticeMessage").textContent = serverText(payload.message); UI.openModal("noticeModal"); });
  socket.on("account:restricted", async (restriction) => {
    document.getElementById("noticeMessage").innerHTML = `${UI.escapeHTML(restriction.message || t("accountRestricted"))}<br><br>${UI.restrictionHTML(restriction)}`;
    UI.openModal("noticeModal"); setTimeout(async () => { await UI.fetchJSON("/api/logout", { method: "POST" }).catch(() => null); location.href = "/login"; }, 4000);
  });
  window.addEventListener("languagechange", () => { renderAccount(); renderMessages(); });
  window.addEventListener("load", () => setTimeout(() => document.getElementById("pageLoader")?.classList.add("loaded"), 220));
  window.addEventListener('beforeunload',()=>{clearTimeout(state.typingTimer);if(state.composerResizeFrame)cancelAnimationFrame(state.composerResizeFrame);if(state.selectedFileUrl)URL.revokeObjectURL(state.selectedFileUrl);},{once:true});
  loadConversation();
})();
