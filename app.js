
(() => {
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));
  const modal = $("#modalBackdrop");
  const toast = $("#toast");
  let activePlayer = "all";
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
  }
  function openModal(title, message, icon="✦") {
    $("#modalTitle").textContent = title;
    $("#modalContent").textContent = message;
    $("#modalIcon").textContent = icon;
    modal.hidden = false;
    $("#modalOkay").focus();
  }
  function closeModal() {
    modal.hidden = true;
  }
  $("#modalClose").addEventListener("click", closeModal);
  $("#modalOkay").addEventListener("click", closeModal);
  modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal.hidden) closeModal(); });

  const nav = $("#mainNav");
  $("#mobileMenu").addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    $("#mobileMenu").setAttribute("aria-expanded", String(open));
  });
  $$(".nav-link").forEach(link => link.addEventListener("click", () => {
    $$(".nav-link").forEach(item => item.classList.remove("active"));
    link.classList.add("active");
    nav.classList.remove("open");
    $("#mobileMenu").setAttribute("aria-expanded", "false");
  }));

  const cards = $$(".creation-card", $("#boardGrid"));
  function filterBoards() {
    const query = $("#boardSearch").value.trim().toLowerCase();
    const sort = $("#boardSort").value;
    const grid = $("#boardGrid");
    const sorted = [...cards].sort((a,b) => {
      if (sort === "newest") return b.dataset.date.localeCompare(a.dataset.date);
      if (sort === "popular") return Number(b.dataset.downloads)-Number(a.dataset.downloads);
      return cards.indexOf(a)-cards.indexOf(b);
    });
    sorted.forEach(card => grid.appendChild(card));
    let shown = 0;
    cards.forEach(card => {
      const players = card.dataset.players.split(",");
      const searchable = (card.dataset.title+" "+card.dataset.creator+" "+card.dataset.tags).toLowerCase();
      const matches = (!query || searchable.includes(query)) &&
        (activePlayer === "all" || players.includes(activePlayer));
      card.hidden = !matches;
      if (matches) shown++;
    });
    $("#boardEmpty").hidden = shown !== 0;
  }
  $("#boardSearch").addEventListener("input", filterBoards);
  $("#boardSort").addEventListener("change", filterBoards);
  $$(".filter-chip").forEach(button => button.addEventListener("click", () => {
    $$(".filter-chip").forEach(chip => chip.classList.remove("selected"));
    button.classList.add("selected");
    activePlayer = button.dataset.player;
    filterBoards();
  }));

  cards.forEach(card => {
    $(".board-details", card).addEventListener("click", () => {
      openModal(card.dataset.title,
        "Creator: "+card.dataset.creator+". Supported player count: "+card.dataset.players.replace(",", " or ")+". This is a sample listing for the website preview; board files and real creator profiles are not connected yet.",
        "🧭");
    });
    $(".download-btn", card).addEventListener("click", () => {
      showToast("Board downloads will be available after the backend is connected.");
    });
  });
  $$(".mod-details").forEach(button => button.addEventListener("click", () => {
    const card = button.closest(".mod-card");
    openModal(card.querySelector("h3").textContent, card.querySelector("p").textContent+" This is a showcase entry, not a downloadable mod.", "⚙");
  }));
  $("#signInBtn").addEventListener("click", () => openModal("Sign-in is coming later",
    "The current site is a public static preview. Account registration will be enabled only after the authentication, privacy, and moderation setup is reviewed.","⚓"));
  $("#publishBtn").addEventListener("click", () => openModal("Publishing is in development",
    "The planned flow will let creators submit board packages for review. Uploads are not enabled in this preview, and no files are being sent anywhere.","＋"));
  $("#makerInfoBtn").addEventListener("click", () => openModal("Board Maker roadmap",
    "The planned editor will include draw-to-create paths, automatic space placement, manual editing, board events, NPC placement, asset importing, playtesting, and community publishing.","✎"));
  $("#discussionBtn").addEventListener("click", () => openModal("Community discussions",
    "Discussion previews are placeholders. A real forum will need accounts, moderation, reporting, and clear community rules before it opens.","💬"));
  $("#creatorBtn").addEventListener("click", () => openModal("Creator submissions",
    "Creator profiles and public submissions are planned. For now, this page is a visual preview of the community experience.","★"));
  $("#newsletterForm").addEventListener("submit", event => {
    event.preventDefault();
    showToast("Thanks! Newsletter signup is not connected in this preview.");
    event.currentTarget.reset();
  });
})();
