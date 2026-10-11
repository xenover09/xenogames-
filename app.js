/* XENO GAMES — front-end: renders games from data/games.json + ticker */
(function(){
  "use strict";

  var SEED = {
    config: { siteName:"Xeno Games", tagline:"Play the crossovers that shouldn't exist.",
      heroTitle:"", heroSub:"Game mashups, fan ports and impossible crossovers — collected, verified and installed in one click. No 30-step guides. No broken installs. Just press Play.",
      discordUrl:"#", announcement:"" },
    games: [
      {id:"voxel-neon",title:"Voxelcraft × Neon Rush",tag:"Mashup",blurb:"Block-building inside a neon racing world. Fully verified.",link:"#",image:"assets/card-voxel.jpg",hue:160,featured:true},
      {id:"starfall",title:"Starfall Vanguard",tag:"Port",blurb:"Classic space shooter, rebuilt for PC.",link:"#",image:"assets/card-space.jpg",hue:210,featured:true},
      {id:"neon-rush",title:"Neon Rush",tag:"Mashup",blurb:"Anti-gravity racing through cyberpunk streets.",link:"#",image:"assets/card-neon-racer.jpg",hue:290,featured:false},
      {id:"pixel-dungeons",title:"Pixel Dungeons",tag:"Fan game",blurb:"A tiny roguelike with a huge heart.",link:"#",image:"",hue:30,featured:false},
      {id:"mecha-arena",title:"Mecha Arena",tag:"Mashup",blurb:"Giant robots, small arena, zero mercy.",link:"#",image:"",hue:200,featured:false},
      {id:"ghost-circuit",title:"Ghost Circuit",tag:"Port",blurb:"Haunted-arcade racer, fan restored.",link:"#",image:"",hue:260,featured:false}
    ]
  };

  var DEFAULT_SLIDES = [
    { id: "slide-1", type: "image", url: "assets/card-voxel.jpg", title: "Voxelcraft × Neon Rush", subtitle: "Block-building inside a neon racing world", badge: "Featured Showcase", link: "#library" },
    { id: "slide-2", type: "image", url: "assets/card-space.jpg", title: "Starfall Vanguard", subtitle: "Classic space shooter rebuilt for modern PC", badge: "Community Port", link: "#library" },
    { id: "slide-3", type: "image", url: "assets/card-neon-racer.jpg", title: "Neon Rush: Cyberpunk", subtitle: "Anti-gravity racing through futuristic circuits", badge: "Popular Mashup", link: "#library" }
  ];

  var DEFAULT_PROOF = [
    { id: "clip-1", title: "Voxelcraft × Neon Rush", views: "128K views", duration: "2:47", image: "assets/card-voxel.jpg", link: "#" },
    { id: "clip-2", title: "Starfall Vanguard — full playthrough", views: "86K views", duration: "4:12", image: "assets/card-space.jpg", link: "#" },
    { id: "clip-3", title: "Neon Rush night circuit", views: "54K views", duration: "1:58", image: "assets/card-neon-racer.jpg", link: "#" },
    { id: "clip-4", title: "Ghost Circuit restored", views: "31K views", duration: "3:15", image: "", hue: 280, link: "#" }
  ];

  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}

  function thumb(g){
    if(g.image){
      return '<div class="th"><img loading="lazy" src="'+esc(g.image)+'" alt="'+esc(g.title)+'"></div>';
    }
    var hue=g.hue||200, init=esc((g.title||"?").trim().charAt(0).toUpperCase());
    return '<div class="th fb" style="background:linear-gradient(135deg,hsl('+hue+',55%,24%),hsl('+(hue+45)+',60%,11%))">'+init+'</div>';
  }

  window.XP_toggleDesc = function(idx, btn){
    var el = document.getElementById("gdesc-" + idx);
    if(!el) return;
    var isCol = el.classList.contains("collapsed");
    if(isCol){
      el.classList.remove("collapsed");
      btn.innerHTML = "Show less ▴";
    } else {
      el.classList.add("collapsed");
      btn.innerHTML = "Read more ▾";
    }
  };

  function card(g, idx){
    var btn = (g.link && g.link !== "#")
      ? '<a class="btn btn-volt btn-sm" href="'+esc(g.link)+'" target="_blank" rel="noopener">▶ Play</a>'
      : '<a class="btn btn-gho btn-sm" href="#library">Soon</a>';
    
    var blurb = esc(g.blurb||"");
    var descHtml = '';
    if (blurb.length > 130 || blurb.indexOf('\n') > -1) {
      descHtml = '<div class="gcard-desc collapsed" id="gdesc-' + idx + '">' + blurb + '</div>' +
        '<button class="btn-more" type="button" onclick="XP_toggleDesc(' + idx + ', this)">Read more ▾</button>';
    } else {
      descHtml = '<div class="gcard-desc">' + blurb + '</div>';
    }

    return '<article class="gcard">'+thumb(g)+
      '<div class="tb"><span class="gtag">'+esc(g.tag||"Game")+'</span>'+
      '<h3>'+esc(g.title)+'</h3>' + descHtml +
      '<div class="gf">'+btn+'<span class="verified">verified</span></div></div></article>';
  }

  function renderSlideMedia(s) {
    if (s.type === "video") {
      var u = s.url || "";
      var ytId = "";
      if (u.indexOf("youtu.be/") > -1) { ytId = u.split("youtu.be/")[1].split(/[?&#]/)[0]; }
      else if (u.indexOf("v=") > -1) { ytId = u.split("v=")[1].split(/[&?#]/)[0]; }
      else if (u.indexOf("youtube.com/embed/") > -1) { ytId = u.split("youtube.com/embed/")[1].split(/[?&#]/)[0]; }
      
      if (ytId) {
        return '<iframe src="https://www.youtube.com/embed/' + esc(ytId) + '?autoplay=1&mute=1&loop=1&playlist=' + esc(ytId) + '&controls=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="width:100%;height:100%;border:none;pointer-events:none"></iframe>';
      }
      return '<video src="' + esc(s.url) + '" autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover"></video>';
    }
    return '<img loading="lazy" src="' + esc(s.url || "assets/card-voxel.jpg") + '" alt="' + esc(s.title || "Game Showcase") + '">';
  }

  function render(data){
    var cfg=data.config||{};
    if(cfg.siteName) document.title=cfg.siteName+" — "+(cfg.tagline||"Play the crossovers that shouldn't exist.");
    document.querySelectorAll("[data-sitename]").forEach(function(el){
      var n=esc(cfg.siteName||"Xeno Games"), i=n.indexOf(" ");
      el.innerHTML = i>0 ? n.slice(0,i)+' <b>'+n.slice(i+1)+'</b>' : '<b>'+n+'</b>';
    });
    if(cfg.logoMark){
      document.querySelectorAll("[data-logomark]").forEach(function(el){ el.textContent=cfg.logoMark; });
    }
    if(cfg.kicker){
      document.querySelectorAll("[data-herokicker]").forEach(function(el){ el.textContent=cfg.kicker; });
    }
    if(cfg.heroTitle || cfg.heroTitleHighlight){
      document.querySelectorAll("[data-herotitle]").forEach(function(el){
        var t=esc(cfg.heroTitle||"Play the crossovers that");
        var h=cfg.heroTitleHighlight ? ' <em>'+esc(cfg.heroTitleHighlight)+'</em>' : '';
        el.innerHTML = t + h;
      });
    }
    var hs=document.querySelector("[data-herosub]"); if(hs&&cfg.heroSub) hs.textContent=cfg.heroSub;
    if(cfg.heroCta1Text){
      document.querySelectorAll("[data-herocta1]").forEach(function(el){
        el.textContent=cfg.heroCta1Text;
        if(cfg.heroCta1Link) el.href=cfg.heroCta1Link;
      });
    }
    if(cfg.heroCta2Text){
      document.querySelectorAll("[data-herocta2]").forEach(function(el){
        el.textContent=cfg.heroCta2Text;
        if(cfg.heroCta2Link) el.href=cfg.heroCta2Link;
      });
    }
    document.querySelectorAll("[data-discord]").forEach(function(a){ if(cfg.discordUrl) a.href=cfg.discordUrl; });
    document.querySelectorAll("[data-year]").forEach(function(el){ el.textContent=new Date().getFullYear(); });

    // Announcement banner
    var annBar=document.getElementById("announcement-banner");
    var annTxt=document.getElementById("announcement-text");
    if(annBar && annTxt){
      if(cfg.announcement && cfg.announcementEnabled !== false){
        annTxt.textContent = cfg.announcement;
        annBar.style.display = "block";
      } else {
        annBar.style.display = "none";
      }
    }

    // Dynamic Hero Slides
    var track=document.getElementById("slider-track");
    var dots=document.getElementById("slider-dots");
    var slidesToRender = (cfg.slides && cfg.slides.length) ? cfg.slides : DEFAULT_SLIDES;
    if(track && slidesToRender && slidesToRender.length){
      track.innerHTML = slidesToRender.map(function(s, idx){
        var badge = s.badge ? '<div class="slider-badge">' + esc(s.badge) + '</div>' : '';
        var linkOpen = (s.link && s.link !== '#') ? '<a href="' + esc(s.link) + '" style="display:block;width:100%;height:100%">' : '';
        var linkClose = (s.link && s.link !== '#') ? '</a>' : '';
        return '<div class="slide ' + (idx === 0 ? 'active' : '') + '">' +
          badge + linkOpen + renderSlideMedia(s) +
          '<div class="slide-caption"><h3>' + esc(s.title || "") + '</h3><p>' + esc(s.subtitle || "") + '</p></div>' +
          linkClose + '</div>';
      }).join("");

      if(dots){
        dots.innerHTML = slidesToRender.map(function(s, idx){
          return '<button class="dot ' + (idx === 0 ? 'active' : '') + '" data-index="' + idx + '" aria-label="Slide ' + (idx+1) + '"></button>';
        }).join("");
      }
    }

    // Dynamic Proof Clips
    var proofEl=document.getElementById("proof-clips");
    var proofToRender = (cfg.proofClips && cfg.proofClips.length) ? cfg.proofClips : DEFAULT_PROOF;
    if(proofEl && proofToRender && proofToRender.length){
      proofEl.innerHTML = proofToRender.map(function(c){
        var th = c.image
          ? '<div class="th"><img src="'+esc(c.image)+'" alt="'+esc(c.title)+'"><span class="playb">▶</span><span class="dur">'+esc(c.duration||"2:00")+'</span></div>'
          : '<div class="th fb" style="aspect-ratio:16/9;background:linear-gradient(135deg,hsl('+(c.hue||260)+',60%,25%),hsl('+((c.hue||260)+50)+',65%,12%));display:flex;align-items:center;justify-content:center;font-family:var(--fh);font-weight:800;font-size:44px;color:#fff">'+esc((c.title||"?").charAt(0))+'</div>';
        var clickAttr = (c.link && c.link !== '#') ? ' onclick="window.open(\''+esc(c.link)+'\',\'_blank\')"' : '';
        return '<div class="clip"' + clickAttr + '>' + th + '<div class="cb"><b>'+esc(c.title)+'</b><span>'+esc(c.views||"")+'</span></div></div>';
      }).join("");
    }

    // Games Library
    var games=(data.games||[]).slice().sort(function(a,b){return (b.featured?1:0)-(a.featured?1:0);});
    var grid=document.getElementById("games-grid");
    if(grid) grid.innerHTML=games.map(card).join("")||'<p style="color:var(--mut)">No games yet — check back soon.</p>';

    // Ticker
    var tk=document.getElementById("ticker");
    if(tk){
      var tItems = cfg.tickerItems ? cfg.tickerItems.split("◆").map(function(x){ return x.trim(); }).filter(Boolean) : [];
      if(!tItems.length){
        tItems = games.map(function(g){ return g.title; });
        tItems.push("New crossovers monthly", "One-click installs");
      }
      var tkHtml = tItems.map(function(item){ return '<span>'+esc(item)+'</span><i>◆</i>'; }).join("");
      tk.innerHTML = tkHtml + tkHtml;
    }

    initSlider();
  }

  function initSlider(){
    var slider=document.getElementById("hero-slider");
    if(!slider) return;
    var slides=slider.querySelectorAll(".slide");
    var dots=slider.querySelectorAll(".dot");
    var prevBtn=document.getElementById("slider-prev");
    var nextBtn=document.getElementById("slider-next");
    if(!slides.length) return;

    var cur=0, timer=null;
    function goTo(n){
      cur=(n+slides.length)%slides.length;
      slides.forEach(function(s,i){
        if(i===cur){ s.classList.add("active"); }
        else { s.classList.remove("active"); }
      });
      dots.forEach(function(d,i){
        if(i===cur){ d.classList.add("active"); }
        else { d.classList.remove("active"); }
      });
    }

    function next(){ goTo(cur+1); }
    function prev(){ goTo(cur-1); }

    function startTimer(){
      stopTimer();
      timer=setInterval(next, 4500);
    }
    function stopTimer(){
      if(timer){ clearInterval(timer); timer=null; }
    }

    if(nextBtn) nextBtn.addEventListener("click", function(){ next(); startTimer(); });
    if(prevBtn) prevBtn.addEventListener("click", function(){ prev(); startTimer(); });

    dots.forEach(function(d,i){
      d.addEventListener("click", function(){
        goTo(i);
        startTimer();
      });
    });

    slider.addEventListener("mouseenter", stopTimer);
    slider.addEventListener("mouseleave", startTimer);

    /* Touch swipe support */
    var touchStartX = 0;
    slider.addEventListener("touchstart", function(e){
      if(e.changedTouches && e.changedTouches[0]){
        touchStartX = e.changedTouches[0].clientX;
        stopTimer();
      }
    }, {passive:true});
    slider.addEventListener("touchend", function(e){
      if(e.changedTouches && e.changedTouches[0]){
        var diff = e.changedTouches[0].clientX - touchStartX;
        if(diff > 45) { prev(); }
        else if(diff < -45) { next(); }
        startTimer();
      }
    }, {passive:true});

    startTimer();
  }

  Promise.all([
    fetch("data/config.json").then(function(r){return r.ok?r.json():null;}).catch(function(){return null;}),
    fetch("data/games.json").then(function(r){return r.ok?r.json():null;}).catch(function(){return null;})
  ]).then(function(res){
    render({ config:res[0]||SEED.config, games:res[1]?res[1].games:SEED.games });
  });
})();
