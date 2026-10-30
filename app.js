
(() => {
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));
  const modal = $("#modalBackdrop");
  const toast = $("#toast");
  // Render selected display headings from the supplied Mario Party 7 character sheets.
  // This is a sprite-font treatment rather than a downloadable TTF/OTF font.
  async function loadMP7SpriteTypography() {
    const loadAtlas = async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Could not load " + url);
      const source = await response.text();
      const doc = new DOMParser().parseFromString(source, "image/svg+xml");
      const root = doc.documentElement;
      const glyphs = {};
      root.querySelectorAll('g[id^="g-"]').forEach(group => {
        const key = group.id.slice(2);
        glyphs[key] = {
          x:Number(group.getAttribute("data-x")),
          y:Number(group.getAttribute("data-y")),
          w:Number(group.getAttribute("data-w")),
          h:Number(group.getAttribute("data-h")),
          advance:Number(group.getAttribute("data-advance"))
        };
      });
      return {
        url,
        width:Number(root.getAttribute("width")),
        height:Number(root.getAttribute("height")),
        glyphs
      };
    };

    const [mainAtlas, miniAtlas] = await Promise.all([
      loadAtlas("assets/font/mp7-main-sprites.svg"),
      loadAtlas("assets/font/mp7-minigame-sprites.svg")
    ]);

    const decorate = (selector, atlas, className) => {
      $(selector).forEach(element => {
        if (element.dataset.mp7SpriteReady === "true") return;
        const accessibleText = element.textContent.replace(/\\s+/g," ").trim();
        if (!accessibleText) return;
        element.setAttribute("aria-label",accessibleText);
        element.classList.add(className);

        const walker = document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) {
          if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);
        }
        nodes.forEach(node => {
          const fragment = document.createDocumentFragment();
          const fontSize = parseFloat(getComputedStyle(element).fontSize) || 24;
          const scale = fontSize / 240;
          for (const character of node.nodeValue) {
            if (character === " " || character === "\\u00a0") {
              const spacer = document.createElement("span");
              spacer.className = "mp7-space";
              spacer.setAttribute("aria-hidden","true");
              fragment.appendChild(spacer);
              continue;
            }
            const key = character.toUpperCase();
            const glyph = atlas.glyphs[key];
            if (glyph) {
              const span = document.createElement("span");
              span.className = "mp7-glyph";
              span.setAttribute("aria-hidden","true");
              span.style.width = (glyph.advance * scale) + "px";
              span.style.height = (glyph.h * scale) + "px";
              span.style.backgroundImage = 'url("' + atlas.url + '")';
              span.style.backgroundSize = (atlas.width * scale) + "px " + (atlas.height * scale) + "px";
              span.style.backgroundPosition = (-glyph.x * scale) + "px " + (-glyph.y * scale) + "px";
              fragment.appendChild(span);
            } else {
              const fallback = document.createElement("span");
              fallback.className = "mp7-font-fallback";
              fallback.setAttribute("aria-hidden","true");
              fallback.textContent = character;
              fragment.appendChild(fallback);
            }
          }
          node.replaceWith(fragment);
        });
        element.dataset.mp7SpriteReady = "true";
      });
    };

    decorate(
      ".hero h1,.section-heading h2,.maker-copy h2,.thumb-title,.card-body h3,.mod-info h3,.creator-panel h3,.newsletter h2,.panel-head h3,.modal h2,.brand-copy strong",
      mainAtlas,
      "mp7-font-main"
    );
    decorate(".mini-art strong,.mini-info h3",miniAtlas,"mp7-font-mini");
    document.documentElement.classList.add("mp7-font-ready");
  }

  loadMP7SpriteTypography().catch(error => {
    console.warn("Mario Party 7 lettering fell back to standard headings:",error);
  });

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
      if (sort === "az") return a.dataset.title.localeCompare(b.dataset.title);
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
  // The original Mario Party 7 board maps are all part of the four-player Party Cruise.


  cards.forEach(card => {
    $(".board-details", card).addEventListener("click", () => {
      openModal(card.dataset.title,
        card.dataset.description + " This is an original board from Mario Party 7; follow the Wiki link on the card for more background.",
        "🧭");
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
