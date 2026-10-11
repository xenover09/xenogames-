/* XENO CONSOLE — Professional Admin Logic */
(function() {
  "use strict";

  var $ = function(id) { return document.getElementById(id); };

  var S = {
    user: "xenover09",
    repo: "xenogames-",
    branch: "main",
    token: "",
    games: [],
    config: {},
    shas: {},
    connected: false
  };

  /* Default seed if offline or first load */
  var DEFAULT_SEED = {
    config: {
      siteName: "Xeno Games",
      logoMark: "X",
      tagline: "Play the crossovers that shouldn't exist.",
      kicker: "XENO GAMES — MOD LAUNCHER",
      heroTitle: "Play the crossovers that",
      heroTitleHighlight: "shouldn't exist.",
      heroSub: "Game mashups, fan ports and impossible crossovers — collected, verified and installed in one click. No 30-step guides. No broken installs. Just press Play.",
      heroCta1Text: "Browse the library",
      heroCta1Link: "#library",
      heroCta2Text: "See the launcher",
      heroCta2Link: "#launcher",
      discordUrl: "#",
      contactEmail: "admin@xenogames.example",
      announcement: "",
      announcementEnabled: false,
      tickerItems: "Voxelcraft × Neon Rush ◆ Starfall Vanguard ◆ Neon Rush ◆ New crossovers monthly ◆ One-click installs",
      slides: [
        { id: "slide-1", type: "image", url: "assets/card-voxel.jpg", title: "Voxelcraft × Neon Rush", subtitle: "Block-building inside a neon racing world", badge: "Featured Showcase", link: "#library" },
        { id: "slide-2", type: "image", url: "assets/card-space.jpg", title: "Starfall Vanguard", subtitle: "Classic space shooter rebuilt for modern PC", badge: "Community Port", link: "#library" },
        { id: "slide-3", type: "image", url: "assets/card-neon-racer.jpg", title: "Neon Rush: Cyberpunk", subtitle: "Anti-gravity racing through futuristic circuits", badge: "Popular Mashup", link: "#library" }
      ],
      proofClips: [
        { id: "clip-1", title: "Voxelcraft × Neon Rush", views: "128K views", duration: "2:47", image: "assets/card-voxel.jpg", link: "#" },
        { id: "clip-2", title: "Starfall Vanguard — full playthrough", views: "86K views", duration: "4:12", image: "assets/card-space.jpg", link: "#" },
        { id: "clip-3", title: "Neon Rush night circuit", views: "54K views", duration: "1:58", image: "assets/card-neon-racer.jpg", link: "#" },
        { id: "clip-4", title: "Ghost Circuit restored", views: "31K views", duration: "3:15", image: "", hue: 280, link: "#" }
      ],
      ads: { headerCode: "", contentCode: "" }
    },
    games: [
      { id: "voxel-neon", title: "Voxelcraft × Neon Rush", tag: "Mashup", blurb: "Block-building inside a neon racing world. Fully verified.", link: "#", image: "assets/card-voxel.jpg", hue: 160, featured: true },
      { id: "starfall", title: "Starfall Vanguard", tag: "Port", blurb: "Classic space shooter, rebuilt for PC.", link: "#", image: "assets/card-space.jpg", hue: 210, featured: true },
      { id: "neon-rush", title: "Neon Rush", tag: "Mashup", blurb: "Anti-gravity racing through cyberpunk streets.", link: "#", image: "assets/card-neon-racer.jpg", hue: 290, featured: false }
    ]
  };

  /* Helper utilities */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function(c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function b64(s) { return btoa(unescape(encodeURIComponent(s))); }
  function ub64(s) { return decodeURIComponent(escape(atob(s.replace(/\n/g, "")))); }

  function toast(msg, ok) {
    var c = $("toastContainer");
    var t = document.createElement("div");
    t.className = "toast " + (ok ? "ok" : "err");
    t.innerHTML = "<span>" + (ok ? "✓" : "⚠") + "</span><span>" + esc(msg) + "</span>";
    c.appendChild(t);
    setTimeout(function() {
      t.style.opacity = "0";
      t.style.transform = "translateX(20px)";
      t.style.transition = "all .3s ease";
      setTimeout(function() { t.remove(); }, 300);
    }, 4500);
  }

  /* GitHub API call */
  function ghApi(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({
      "Accept": "application/vnd.github+json",
      "Authorization": "Bearer " + S.token
    }, opts.headers || {});
    return fetch("https://api.github.com/repos/" + S.user + "/" + S.repo + "/contents/" + path + "?ref=" + S.branch, opts)
      .then(function(r) {
        return r.json().then(function(j) { return { ok: r.ok, status: r.status, json: j }; });
      });
  }

  /* Navigation tab switching */
  var TAB_INFO = {
    dashboard: { title: "Dashboard Overview", sub: "Manage games, hero slider media, and site content" },
    hero: { title: "Hero Section & Media Slider", sub: "Customize headline, CTA buttons, and slide images/videos" },
    games: { title: "Games Library", sub: "Add, edit, and organize all games, mashups, and fan ports" },
    proof: { title: "Community Proof Clips", sub: "Gameplay videos and views showcase underneath Hero" },
    announcements: { title: "Banner & Ticker", sub: "Urgent announcements bar and running marquee ticker" },
    branding: { title: "Site Branding & Socials", sub: "Name, logo badge, tagline, Discord, and contact email" },
    ads: { title: "AdSense & Monetization", sub: "Paste your Google AdSense code or banner units" },
    settings: { title: "GitHub API & Sync", sub: "Access token, repository credentials, and backup tools" }
  };

  function switchTab(tabId) {
    document.querySelectorAll(".nav-link").forEach(function(btn) {
      if (btn.getAttribute("data-tab") === tabId) { btn.classList.add("active"); }
      else { btn.classList.remove("active"); }
    });
    document.querySelectorAll(".tab-pane").forEach(function(pane) {
      pane.classList.remove("active");
    });
    var target = $("tab-" + tabId);
    if (target) target.classList.add("active");

    var info = TAB_INFO[tabId] || { title: "Console", sub: "" };
    $("topbarTitle").textContent = info.title;
    $("topbarBreadcrumb").textContent = info.sub;

    // Mobile sidebar auto-close
    var sb = document.querySelector(".sidebar");
    if (sb) sb.classList.remove("open");
  }

  /* Sync connection state to UI */
  function updateConnectionUI() {
    var pill = $("syncStatusPill");
    var txt = $("syncStatusText");
    var uAvatar = $("userAvatar");
    var uName = $("sidebarUsername");
    var uRepo = $("sidebarRepo");
    var dSync = $("dashSyncState");
    var dBranch = $("dashBranchName");
    var logoutBtn = $("sidebarLogoutBtn");
    var connBox = $("connStatusBox");

    if (S.connected) {
      pill.className = "sync-status-pill connected";
      txt.textContent = "Connected (" + S.branch + ")";
      uAvatar.textContent = (S.user || "X").charAt(0).toUpperCase();
      uName.textContent = S.user;
      uRepo.textContent = S.repo;
      dSync.textContent = "Connected";
      dSync.style.color = "#34d399";
      dBranch.textContent = S.repo + " (" + S.branch + ")";
      logoutBtn.style.display = "block";
      $("btnViewLiveSite").href = "https://" + S.user + ".github.io/" + S.repo + "/";
      if (connBox) {
        connBox.innerHTML = '<p style="color:#6ee7b7;font-weight:700">✓ GitHub Connected to ' + esc(S.user) + '/' + esc(S.repo) + ' (' + esc(S.branch) + ')</p>' +
          '<p class="mut">Aap jo bhi changes save karenge, "Publish" dabate hi live site par sync ho jayengi.</p>' +
          '<button class="btn btn-outline btn-sm" onclick="XP.switchTab(\'settings\')">Manage GitHub Settings</button>';
      }
    } else {
      pill.className = "sync-status-pill disconnected";
      txt.textContent = "Disconnected";
      uName.textContent = "Not Connected";
      uRepo.textContent = "Local mode";
      dSync.textContent = "Offline";
      dSync.style.color = "#f43f5e";
      dBranch.textContent = "Connect token to sync";
      logoutBtn.style.display = "none";
      if (connBox) {
        connBox.innerHTML = '<p class="mut">GitHub token connect nahi hua hai. Live changes directly publish karne ke liye GitHub connect karein.</p>' +
          '<button class="btn btn-volt btn-sm" onclick="XP.switchTab(\'settings\')">🔑 GitHub Settings Setup</button>';
      }
    }
  }

  /* Render all data into UI forms */
  function renderAll() {
    renderDashboard();
    renderHeroForm();
    renderSlidesList();
    renderGamesList();
    renderProofList();
    renderAnnouncementsForm();
    renderBrandingForm();
    renderAdsForm();
    renderSettingsForm();
  }

  function renderDashboard() {
    var totalGames = S.games.length;
    var featGames = S.games.filter(function(g) { return g.featured; }).length;
    var totalSlides = (S.config.slides || []).length;
    var totalProof = (S.config.proofClips || []).length;

    $("dashTotalGames").textContent = totalGames;
    $("dashFeaturedGames").textContent = featGames + " featured games";
    $("dashTotalSlides").textContent = totalSlides;
    $("dashTotalProof").textContent = totalProof;

    $("badgeGames").textContent = totalGames;
    $("badgeSlides").textContent = totalSlides;
    $("badgeProof").textContent = totalProof;
  }

  /* 1. HERO TAB */
  function renderHeroForm() {
    var c = S.config;
    $("hKicker").value = c.kicker || "";
    $("hTitle").value = c.heroTitle || "";
    $("hTitleHighlight").value = c.heroTitleHighlight || "";
    $("hSub").value = c.heroSub || "";
    $("hCta1Text").value = c.heroCta1Text || "";
    $("hCta1Link").value = c.heroCta1Link || "";
    $("hCta2Text").value = c.heroCta2Text || "";
    $("hCta2Link").value = c.heroCta2Link || "";
  }

  function readHeroForm() {
    S.config.kicker = $("hKicker").value.trim();
    S.config.heroTitle = $("hTitle").value.trim();
    S.config.heroTitleHighlight = $("hTitleHighlight").value.trim();
    S.config.heroSub = $("hSub").value.trim();
    S.config.heroCta1Text = $("hCta1Text").value.trim();
    S.config.heroCta1Link = $("hCta1Link").value.trim();
    S.config.heroCta2Text = $("hCta2Text").value.trim();
    S.config.heroCta2Link = $("hCta2Link").value.trim();
  }

  /* SLIDES */
  function renderSlidesList() {
    var container = $("slidesList");
    var slides = S.config.slides || [];
    $("badgeSlides").textContent = slides.length;
    $("dashTotalSlides").textContent = slides.length;

    if (!slides.length) {
      container.innerHTML = '<p class="mut" style="grid-column:1/-1">Koi slide nahi hai. Upar "+ Nayi Slide Add Karein" dabayein.</p>';
      return;
    }

    container.innerHTML = slides.map(function(s, idx) {
      var mediaHtml = "";
      if (s.type === "video") {
        mediaHtml = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--cyan);font-weight:700">▶ Video: ' + esc(s.url) + '</div>';
      } else {
        mediaHtml = '<img src="' + esc(s.url || "assets/card-voxel.jpg") + '" alt="' + esc(s.title) + '">';
      }

      return '<div class="slide-card">' +
        '<div class="slide-card-media">' +
          mediaHtml +
          (s.badge ? '<span class="slide-card-badge">' + esc(s.badge) + '</span>' : '') +
          '<span class="slide-card-type">' + (s.type === "video" ? "VIDEO" : "IMAGE") + '</span>' +
        '</div>' +
        '<div class="slide-card-body">' +
          '<h4>' + esc(s.title || "Untitled Slide") + '</h4>' +
          '<p>' + esc(s.subtitle || "No description") + '</p>' +
        '</div>' +
        '<div class="slide-card-footer">' +
          '<button class="btn btn-outline btn-sm" onclick="XP.openSlideEditor(' + idx + ')">Edit</button>' +
          '<button class="btn btn-danger btn-sm" onclick="XP.deleteSlide(' + idx + ')">Delete</button>' +
        '</div>' +
      '</div>';
    }).join("");
  }

  function openSlideEditor(idx) {
    var modal = $("slideModal");
    var titleEl = $("slideModalTitle");
    var editId = $("slideEditId");

    if (idx === "new") {
      titleEl.textContent = "Add New Hero Slide";
      editId.value = "new";
      $("slideMediaType").value = "image";
      $("slideBadge").value = "Featured Showcase";
      $("slideMediaUrl").value = "";
      $("slideTitle").value = "";
      $("slideSubtitle").value = "";
      $("slideLink").value = "#library";
    } else {
      var s = (S.config.slides || [])[idx];
      if (!s) return;
      titleEl.textContent = "Edit Hero Slide";
      editId.value = idx;
      $("slideMediaType").value = s.type || "image";
      $("slideBadge").value = s.badge || "";
      $("slideMediaUrl").value = s.url || "";
      $("slideTitle").value = s.title || "";
      $("slideSubtitle").value = s.subtitle || "";
      $("slideLink").value = s.link || "#library";
    }

    updateSlidePreview();
    modal.style.display = "flex";
  }

  function closeSlideEditor() {
    $("slideModal").style.display = "none";
  }

  function updateSlidePreview() {
    var type = $("slideMediaType").value;
    var url = $("slideMediaUrl").value.trim();
    var title = $("slideTitle").value.trim() || "Slide Title";
    var sub = $("slideSubtitle").value.trim() || "Slide description will appear here";
    var badge = $("slideBadge").value.trim() || "Featured Showcase";

    $("slidePreviewTitle").textContent = title;
    $("slidePreviewSubtitle").textContent = sub;
    $("slidePreviewBadge").textContent = badge;

    var previewMedia = $("slidePreviewMedia");
    if (type === "video") {
      var ytId = "";
      if (url.indexOf("youtu.be/") > -1) { ytId = url.split("youtu.be/")[1].split(/[?&#]/)[0]; }
      else if (url.indexOf("v=") > -1) { ytId = url.split("v=")[1].split(/[&?#]/)[0]; }

      if (ytId) {
        previewMedia.innerHTML = '<iframe src="https://www.youtube.com/embed/' + esc(ytId) + '?autoplay=0" frameborder="0" style="width:100%;height:100%"></iframe>';
      } else if (url) {
        previewMedia.innerHTML = '<video src="' + esc(url) + '" controls style="width:100%;height:100%;object-fit:cover"></video>';
      } else {
        previewMedia.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-dim)">Video URL enter karein</div>';
      }
    } else {
      if (url) {
        previewMedia.innerHTML = '<img src="' + esc(url) + '" alt="' + esc(title) + '" style="width:100%;height:100%;object-fit:cover">';
      } else {
        previewMedia.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-dim)">Image URL ya path enter karein</div>';
      }
    }
  }

  function saveSlide() {
    var type = $("slideMediaType").value;
    var url = $("slideMediaUrl").value.trim();
    var title = $("slideTitle").value.trim();
    var subtitle = $("slideSubtitle").value.trim();
    var badge = $("slideBadge").value.trim();
    var link = $("slideLink").value.trim();

    if (!title) { toast("Slide ka title enter karein.", false); return; }

    var slideObj = {
      id: "slide-" + Date.now().toString(36),
      type: type,
      url: url,
      title: title,
      subtitle: subtitle,
      badge: badge,
      link: link
    };

    if (!S.config.slides) S.config.slides = [];
    var idx = $("slideEditId").value;
    if (idx === "new") {
      S.config.slides.push(slideObj);
    } else {
      var oldId = S.config.slides[parseInt(idx, 10)].id;
      slideObj.id = oldId || slideObj.id;
      S.config.slides[parseInt(idx, 10)] = slideObj;
    }

    renderSlidesList();
    closeSlideEditor();
    toast("Slide save ho gayi! Upar 'Publish All Changes' se live karein.", true);
  }

  function deleteSlide(idx) {
    if (confirm("Kya aap waqayi ye slide delete karna chahte hain?")) {
      S.config.slides.splice(idx, 1);
      renderSlidesList();
      toast("Slide delete ho gayi.", true);
    }
  }

  /* 2. GAMES TAB */
  function renderGamesList(filtered) {
    var list = filtered || S.games;
    var container = $("gamesTableList");
    $("badgeGames").textContent = S.games.length;
    $("dashTotalGames").textContent = S.games.length;

    if (!list.length) {
      container.innerHTML = '<p class="mut">Koi game nahi mila. "+ Naya Game Add Karein" dabayein.</p>';
      return;
    }

    container.innerHTML = list.map(function(g, idx) {
      var realIdx = S.games.indexOf(g);
      var thumbHtml = "";
      if (g.image) {
        thumbHtml = '<img src="' + esc(g.image) + '" alt="' + esc(g.title) + '">';
      } else {
        var hue = g.hue || 200;
        var init = esc((g.title || "?").charAt(0).toUpperCase());
        thumbHtml = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,hsl(' + hue + ',60%,30%),hsl(' + (hue + 45) + ',65%,15%))">' + init + '</div>';
      }

      return '<div class="game-row">' +
        '<div class="game-row-thumb">' + thumbHtml + '</div>' +
        '<div class="game-row-info">' +
          '<h4>' + esc(g.title) + (g.featured ? ' ⭐' : '') + ' <span class="game-tag-pill">' + esc(g.tag || "Game") + '</span></h4>' +
          '<p>' + esc(g.blurb || "") + ' · <span style="color:var(--text-muted)">' + esc(g.link || "#") + '</span></p>' +
        '</div>' +
        '<div class="game-row-actions">' +
          '<button class="btn btn-outline btn-sm" onclick="XP.openGameEditor(' + realIdx + ')">Edit</button>' +
          '<button class="btn btn-danger btn-sm" onclick="XP.deleteGame(' + realIdx + ')">Delete</button>' +
        '</div>' +
      '</div>';
    }).join("");
  }

  function filterGames() {
    var q = $("gameSearchInput").value.toLowerCase().trim();
    if (!q) { renderGamesList(); return; }
    var res = S.games.filter(function(g) {
      return (g.title || "").toLowerCase().indexOf(q) > -1 ||
             (g.tag || "").toLowerCase().indexOf(q) > -1 ||
             (g.blurb || "").toLowerCase().indexOf(q) > -1;
    });
    renderGamesList(res);
  }

  function openGameEditor(idx) {
    var modal = $("gameModal");
    var titleEl = $("gameModalTitle");
    var editId = $("gEditId");

    if (idx === "new") {
      titleEl.textContent = "Add New Game";
      editId.value = "new";
      $("gTitle").value = "";
      $("gTag").value = "Mashup";
      $("gBlurb").value = "";
      $("gLink").value = "#";
      $("gImage").value = "";
      $("gHue").value = "200";
      $("gFeatured").checked = false;
    } else {
      var g = S.games[idx];
      if (!g) return;
      titleEl.textContent = "Edit Game: " + g.title;
      editId.value = idx;
      $("gTitle").value = g.title || "";
      $("gTag").value = g.tag || "";
      $("gBlurb").value = g.blurb || "";
      $("gLink").value = g.link || "";
      $("gImage").value = g.image || "";
      $("gHue").value = g.hue != null ? g.hue : 200;
      $("gFeatured").checked = !!g.featured;
    }

    updateGamePreview();
    modal.style.display = "flex";
  }

  function closeGameEditor() {
    $("gameModal").style.display = "none";
  }

  function updateGamePreview() {
    var title = $("gTitle").value.trim() || "Game Title";
    var tag = $("gTag").value.trim() || "Mashup";
    var blurb = $("gBlurb").value.trim() || "Game short description here...";
    var img = $("gImage").value.trim();
    var hue = parseInt($("gHue").value, 10) || 200;
    var isFeat = $("gFeatured").checked;

    var preview = $("gameCardPreview");
    var thumbHtml = img
      ? '<div style="aspect-ratio:16/9;overflow:hidden"><img src="' + esc(img) + '" style="width:100%;height:100%;object-fit:cover"></div>'
      : '<div style="aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:36px;color:#fff;background:linear-gradient(135deg,hsl(' + hue + ',60%,30%),hsl(' + (hue + 45) + ',65%,15%))">' + esc(title.charAt(0)) + '</div>';

    preview.innerHTML = '<div style="background:var(--bg-card);border:1px solid var(--line-strong);border-radius:12px;overflow:hidden;max-width:320px">' +
      thumbHtml +
      '<div style="padding:14px;display:flex;flex-direction:column;gap:6px">' +
        '<span class="game-tag-pill" style="align-self:flex-start">' + esc(tag) + '</span>' +
        '<h4 style="font-size:15px;margin:0">' + esc(title) + (isFeat ? ' ⭐' : '') + '</h4>' +
        '<p style="font-size:12.5px;color:var(--text-muted);margin:0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">' + esc(blurb) + '</p>' +
      '</div>' +
    '</div>';
  }

  function saveGame() {
    var title = $("gTitle").value.trim();
    if (!title) { toast("Game ka title enter karein.", false); return; }

    var gameObj = {
      id: (title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "game") + "-" + Date.now().toString(36),
      title: title,
      tag: $("gTag").value.trim() || "Game",
      blurb: $("gBlurb").value.trim(),
      link: $("gLink").value.trim() || "#",
      image: $("gImage").value.trim(),
      hue: parseInt($("gHue").value, 10) || 200,
      featured: $("gFeatured").checked
    };

    var idx = $("gEditId").value;
    if (idx === "new") {
      S.games.push(gameObj);
    } else {
      var old = S.games[parseInt(idx, 10)];
      gameObj.id = old.id || gameObj.id;
      S.games[parseInt(idx, 10)] = gameObj;
    }

    renderGamesList();
    closeGameEditor();
    toast("Game save ho gaya!", true);
  }

  function deleteGame(idx) {
    var g = S.games[idx];
    if (confirm("Kya aap waqayi game delete karna chahte hain: " + (g ? g.title : "") + "?")) {
      S.games.splice(idx, 1);
      renderGamesList();
      toast("Game delete ho gaya.", true);
    }
  }

  /* 3. COMMUNITY PROOF TAB */
  function renderProofList() {
    var container = $("proofList");
    var clips = S.config.proofClips || [];
    $("badgeProof").textContent = clips.length;
    $("dashTotalProof").textContent = clips.length;

    if (!clips.length) {
      container.innerHTML = '<p class="mut" style="grid-column:1/-1">Koi proof clip nahi hai.</p>';
      return;
    }

    container.innerHTML = clips.map(function(c, idx) {
      var th = c.image
        ? '<img src="' + esc(c.image) + '" alt="' + esc(c.title) + '">'
        : '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-weight:800;font-size:24px;color:#fff;background:linear-gradient(135deg,hsl(' + (c.hue || 260) + ',60%,30%),hsl(' + ((c.hue || 260) + 50) + ',65%,15%))">' + esc((c.title || "?").charAt(0)) + '</div>';

      return '<div class="proof-card">' +
        '<div class="proof-thumb">' +
          th +
          '<span class="proof-dur">' + esc(c.duration || "2:00") + '</span>' +
        '</div>' +
        '<div class="proof-body">' +
          '<b>' + esc(c.title) + '</b>' +
          '<span>' + esc(c.views || "") + '</span>' +
        '</div>' +
        '<div class="proof-footer">' +
          '<button class="btn btn-outline btn-sm" onclick="XP.openProofEditor(' + idx + ')">Edit</button>' +
          '<button class="btn btn-danger btn-sm" onclick="XP.deleteProof(' + idx + ')">Delete</button>' +
        '</div>' +
      '</div>';
    }).join("");
  }

  function openProofEditor(idx) {
    var modal = $("proofModal");
    var titleEl = $("proofModalTitle");
    var editId = $("pEditId");

    if (idx === "new") {
      titleEl.textContent = "Add Community Proof Clip";
      editId.value = "new";
      $("pTitle").value = "";
      $("pViews").value = "100K views";
      $("pDuration").value = "2:30";
      $("pLink").value = "#";
      $("pImage").value = "";
    } else {
      var c = (S.config.proofClips || [])[idx];
      if (!c) return;
      titleEl.textContent = "Edit Proof Clip";
      editId.value = idx;
      $("pTitle").value = c.title || "";
      $("pViews").value = c.views || "";
      $("pDuration").value = c.duration || "";
      $("pLink").value = c.link || "";
      $("pImage").value = c.image || "";
    }
    modal.style.display = "flex";
  }

  function closeProofEditor() {
    $("proofModal").style.display = "none";
  }

  function saveProof() {
    var title = $("pTitle").value.trim();
    if (!title) { toast("Clip ka title enter karein.", false); return; }

    var clipObj = {
      id: "clip-" + Date.now().toString(36),
      title: title,
      views: $("pViews").value.trim(),
      duration: $("pDuration").value.trim(),
      link: $("pLink").value.trim() || "#",
      image: $("pImage").value.trim()
    };

    if (!S.config.proofClips) S.config.proofClips = [];
    var idx = $("pEditId").value;
    if (idx === "new") {
      S.config.proofClips.push(clipObj);
    } else {
      var old = S.config.proofClips[parseInt(idx, 10)];
      clipObj.id = old.id || clipObj.id;
      S.config.proofClips[parseInt(idx, 10)] = clipObj;
    }

    renderProofList();
    closeProofEditor();
    toast("Proof clip save ho gaya!", true);
  }

  function deleteProof(idx) {
    if (confirm("Kya aap waqayi clip delete karna chahte hain?")) {
      S.config.proofClips.splice(idx, 1);
      renderProofList();
      toast("Clip delete ho gaya.", true);
    }
  }

  /* 4. ANNOUNCEMENTS & TICKER */
  function renderAnnouncementsForm() {
    var c = S.config;
    $("annEnabled").checked = !!c.announcementEnabled;
    $("annText").value = c.announcement || "";
    $("tickerItemsText").value = c.tickerItems || "";
  }

  function readAnnouncementsForm() {
    S.config.announcementEnabled = $("annEnabled").checked;
    S.config.announcement = $("annText").value.trim();
    S.config.tickerItems = $("tickerItemsText").value.trim();
  }

  /* 5. BRANDING & GENERAL */
  function renderBrandingForm() {
    var c = S.config;
    $("bSiteName").value = c.siteName || "";
    $("bLogoMark").value = c.logoMark || "X";
    $("bTagline").value = c.tagline || "";
    $("bDiscordUrl").value = c.discordUrl || "";
    $("bContactEmail").value = c.contactEmail || "";
  }

  function readBrandingForm() {
    S.config.siteName = $("bSiteName").value.trim();
    S.config.logoMark = $("bLogoMark").value.trim() || "X";
    S.config.tagline = $("bTagline").value.trim();
    S.config.discordUrl = $("bDiscordUrl").value.trim() || "#";
    S.config.contactEmail = $("bContactEmail").value.trim();
  }

  /* 6. ADS */
  function renderAdsForm() {
    var a = S.config.ads || {};
    $("adHeaderCode").value = a.headerCode || "";
    $("adContentCode").value = a.contentCode || "";
  }

  function readAdsForm() {
    if (!S.config.ads) S.config.ads = {};
    S.config.ads.headerCode = $("adHeaderCode").value.trim();
    S.config.ads.contentCode = $("adContentCode").value.trim();
  }

  /* 7. SETTINGS & GITHUB AUTH */
  function renderSettingsForm() {
    $("cfgGhUser").value = S.user;
    $("cfgGhRepo").value = S.repo;
    $("cfgGhBranch").value = S.branch;
    $("cfgGhToken").value = S.token;
  }

  function loadSavedSettings() {
    try {
      var saved = JSON.parse(localStorage.getItem("xp_admin") || "{}");
      if (saved.user) S.user = saved.user;
      if (saved.repo) S.repo = saved.repo;
      if (saved.branch) S.branch = saved.branch;
      if (saved.token) S.token = saved.token;
      return !!saved.token;
    } catch(e) {}
    return false;
  }

  function saveGhSettingsToStorage() {
    S.user = $("cfgGhUser").value.trim() || "xenover09";
    S.repo = $("cfgGhRepo").value.trim() || "xenogames-";
    S.branch = $("cfgGhBranch").value.trim() || "main";
    S.token = $("cfgGhToken").value.trim();
    localStorage.setItem("xp_admin", JSON.stringify({
      user: S.user, repo: S.repo, branch: S.branch, token: S.token
    }));
  }

  function connectAndFetch() {
    saveGhSettingsToStorage();
    if (!S.token) {
      toast("GitHub Personal Access Token enter karein.", false);
      return;
    }

    toast("GitHub se load ho raha hai...", true);
    Promise.all([
      ghApi("data/games.json"),
      ghApi("data/config.json")
    ]).then(function(res) {
      var g = res[0], c = res[1];
      if (!g.ok && g.status === 401) {
        toast("Token galat ya expire ho chuka hai (401 Unauthorized).", false);
        S.connected = false;
        updateConnectionUI();
        return;
      }

      if (g.ok) {
        try { S.games = JSON.parse(ub64(g.json.content)).games || []; } catch(e) {}
        S.shas["data/games.json"] = g.json.sha;
      }
      if (c.ok) {
        try { S.config = JSON.parse(ub64(c.json.content)) || {}; } catch(e) {}
        S.shas["data/config.json"] = c.json.sha;
      }

      S.connected = true;
      updateConnectionUI();
      renderAll();
      toast("Connected! " + S.games.length + " games aur settings load ho gaye.", true);
    }).catch(function(e) {
      toast("Connection error: " + e.message, false);
      S.connected = false;
      updateConnectionUI();
    });
  }

  /* PUBLISH ALL CHANGES */
  function publishAllChanges() {
    // Read all forms into state
    readHeroForm();
    readAnnouncementsForm();
    readBrandingForm();
    readAdsForm();

    if (!S.token) {
      toast("Publish karne ke liye pehle GitHub token connect karein (Settings tab).", false);
      switchTab("settings");
      return;
    }

    var btn = $("btnPublishTop");
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span> Publishing...';
    toast("GitHub par changes publish ho rahe hain...", true);

    var files = [
      { path: "data/games.json", obj: { games: S.games } },
      { path: "data/config.json", obj: S.config }
    ];

    (function uploadNext(i) {
      if (i >= files.length) {
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">💾</span> Publish All Changes';
        toast("✅ Sab kuch GitHub par publish ho gaya! ~1 minute mein site update ho jayegi.", true);
        return;
      }

      var f = files[i];
      var body = {
        message: "Update " + f.path + " via Xeno Console",
        content: b64(JSON.stringify(f.obj, null, 2)),
        branch: S.branch
      };
      if (S.shas[f.path]) body.sha = S.shas[f.path];

      ghApi(f.path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }).then(function(res) {
        if (res.ok) {
          S.shas[f.path] = res.json.content.sha;
          uploadNext(i + 1);
        } else {
          btn.disabled = false;
          btn.innerHTML = '<span class="btn-icon">💾</span> Publish All Changes';
          toast("Publish failed (" + f.path + "): " + (res.json.message || res.status), false);
        }
      }).catch(function(e) {
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">💾</span> Publish All Changes';
        toast("Publish error: " + e.message, false);
      });
    })(0);
  }

  /* BACKUP EXPORT */
  function downloadBackup() {
    var data = { config: S.config, games: S.games, exportedAt: new Date().toISOString() };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "xenogames-backup-" + Date.now() + ".json";
    a.click();
    toast("Backup JSON file download ho gayi!", true);
  }

  /* INIT EVENT LISTENERS */
  document.querySelectorAll(".nav-link").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var tab = btn.getAttribute("data-tab");
      if (tab) switchTab(tab);
    });
  });

  $("btnPublishTop").onclick = publishAllChanges;
  $("btnSaveGhSettings").onclick = connectAndFetch;
  $("btnExportJson").onclick = downloadBackup;

  $("btnClearGhAuth").onclick = function() {
    if (confirm("Disconnect token and logout?")) {
      localStorage.removeItem("xp_admin");
      location.reload();
    }
  };
  $("sidebarLogoutBtn").onclick = function() {
    $("btnClearGhAuth").click();
  };

  var mobToggle = $("mobileToggle");
  if (mobToggle) {
    mobToggle.onclick = function() {
      var sb = document.querySelector(".sidebar");
      if (sb) sb.classList.toggle("open");
    };
  }

  /* Expose globals for onclicks in HTML */
  window.XP = {
    switchTab: switchTab,
    openSlideEditor: openSlideEditor,
    closeSlideEditor: closeSlideEditor,
    updateSlidePreview: updateSlidePreview,
    saveSlide: saveSlide,
    deleteSlide: deleteSlide,
    openGameEditor: openGameEditor,
    closeGameEditor: closeGameEditor,
    updateGamePreview: updateGamePreview,
    saveGame: saveGame,
    deleteGame: deleteGame,
    filterGames: filterGames,
    openProofEditor: openProofEditor,
    closeProofEditor: closeProofEditor,
    saveProof: saveProof,
    deleteProof: deleteProof,
    downloadBackup: downloadBackup
  };

  /* INITIAL STARTUP */
  // Load defaults first
  S.config = JSON.parse(JSON.stringify(DEFAULT_SEED.config));
  S.games = JSON.parse(JSON.stringify(DEFAULT_SEED.games));

  // Try local fetch to read existing repo json
  Promise.all([
    fetch("../data/config.json").then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; }),
    fetch("../data/games.json").then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; })
  ]).then(function(res) {
    if (res[0]) S.config = Object.assign(S.config, res[0]);
    if (res[1] && res[1].games) S.games = res[1].games;
    renderAll();
  }).catch(function() {
    renderAll();
  });

  if (loadSavedSettings() && S.token) {
    renderSettingsForm();
    connectAndFetch();
  } else {
    renderSettingsForm();
    updateConnectionUI();
  }

})();
