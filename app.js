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

  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}

  function thumb(g){
    if(g.image){
      return '<div class="th"><img loading="lazy" src="'+esc(g.image)+'" alt="'+esc(g.title)+'"></div>';
    }
    var hue=g.hue||200, init=esc((g.title||"?").trim().charAt(0).toUpperCase());
    return '<div class="th fb" style="background:linear-gradient(135deg,hsl('+hue+',55%,24%),hsl('+(hue+45)+',60%,11%))">'+init+'</div>';
  }

  function card(g){
    var btn = (g.link && g.link !== "#")
      ? '<a class="btn btn-volt btn-sm" href="'+esc(g.link)+'" target="_blank" rel="noopener">▶ Play</a>'
      : '<a class="btn btn-gho btn-sm" href="#library">Soon</a>';
    return '<article class="gcard">'+thumb(g)+
      '<div class="tb"><span class="gtag">'+esc(g.tag||"Game")+'</span>'+
      '<h3>'+esc(g.title)+'</h3><p>'+esc(g.blurb||"")+'</p>'+
      '<div class="gf">'+btn+'<span class="verified">verified</span></div></div></article>';
  }

  function render(data){
    var cfg=data.config||{};
    if(cfg.siteName) document.title=cfg.siteName+" — "+(cfg.tagline||"Play the crossovers that shouldn't exist.");
    document.querySelectorAll("[data-sitename]").forEach(function(el){
      var n=esc(cfg.siteName||"Xeno Games"), i=n.indexOf(" ");
      el.innerHTML = i>0 ? n.slice(0,i)+' <b>'+n.slice(i+1)+'</b>' : '<b>'+n+'</b>';
    });
    var hs=document.querySelector("[data-herosub]"); if(hs&&cfg.heroSub) hs.textContent=cfg.heroSub;
    document.querySelectorAll("[data-discord]").forEach(function(a){ if(cfg.discordUrl) a.href=cfg.discordUrl; });
    document.querySelectorAll("[data-year]").forEach(function(el){ el.textContent=new Date().getFullYear(); });

    var games=(data.games||[]).slice().sort(function(a,b){return (b.featured?1:0)-(a.featured?1:0);});
    var grid=document.getElementById("games-grid");
    if(grid) grid.innerHTML=games.map(card).join("")||'<p style="color:var(--mut)">No games yet — check back soon.</p>';

    var tk=document.getElementById("ticker");
    if(tk){
      var names=games.map(function(g){return '<span>'+esc(g.title)+'</span><i>◆</i>';}).join("");
      names+='<span>New crossovers monthly</span><i>◆</i><span>One-click installs</span><i>◆</i>';
      tk.innerHTML=names+names; /* duplicated for seamless loop */
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
