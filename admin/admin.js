/* Xeno Games admin — GitHub Contents API se games.json + config.json manage karein */
(function(){
"use strict";
var $ = function(id){return document.getElementById(id);};
var S = {user:"",repo:"",branch:"main",token:"",games:[],config:{},shas:{}};

function msg(t,ok){var m=$("msg");m.innerHTML='<div class="msg '+(ok?"ok":"err")+'">'+t+'</div>';window.scrollTo({top:0,behavior:"smooth"});}
function b64(s){return btoa(unescape(encodeURIComponent(s)));}
function ub64(s){return decodeURIComponent(escape(atob(s.replace(/\n/g,""))));}
function api(path,opts){
  opts=opts||{};
  opts.headers=Object.assign({"Accept":"application/vnd.github+json","Authorization":"Bearer "+S.token},opts.headers||{});
  return fetch("https://api.github.com/repos/"+S.user+"/"+S.repo+"/contents/"+path+"?ref="+S.branch,opts)
    .then(function(r){return r.json().then(function(j){return{ok:r.ok,status:r.status,json:j};});});
}
function loadSettings(){
  try{var s=JSON.parse(localStorage.getItem("xp_admin")||"{}");
    if(s.user){S.user=s.user;S.repo=s.repo;S.branch=s.branch||"main";S.token=s.token;
      $("ghUser").value=s.user;$("ghRepo").value=s.repo;$("ghBranch").value=s.branch||"main";$("ghToken").value=s.token;
      $("forgetBtn").style.display="inline-block";return true;}
  }catch(e){}
  return false;
}
function saveSettings(){
  S.user=$("ghUser").value.trim();S.repo=$("ghRepo").value.trim();
  S.branch=$("ghBranch").value.trim()||"main";S.token=$("ghToken").value.trim();
  localStorage.setItem("xp_admin",JSON.stringify({user:S.user,repo:S.repo,branch:S.branch,token:S.token}));
  $("viewSite").href="https://"+S.user+".github.io/"+S.repo+"/";
}
$("forgetBtn").onclick=function(){localStorage.removeItem("xp_admin");location.reload();};

$("connectBtn").onclick=function(){
  saveSettings();
  if(!S.user||!S.repo||!S.token){msg("Username, repo aur token — teeno zaroori hain.",false);return;}
  msg("Load ho raha hai...",true);
  Promise.all([api("data/games.json"),api("data/config.json")]).then(function(res){
    var g=res[0],c=res[1];
    if(!g.ok){msg("games.json nahi mila: "+(g.json.message||g.status)+" — pehle repo mein files upload karein (DEPLOY.md step 2).",false);return;}
    try{S.games=JSON.parse(ub64(g.json.content)).games||[];}catch(e){S.games=[];}
    S.shas["data/games.json"]=g.json.sha;
    if(c.ok){try{S.config=JSON.parse(ub64(c.json.content));}catch(e){S.config={};}S.shas["data/config.json"]=c.json.sha;}
    renderGames();renderConfig();
    $("gamesCard").style.display="block";$("cfgCard").style.display="block";$("forgetBtn").style.display="inline-block";
    msg("Connected! "+S.games.length+" games load ho gaye.",true);
  }).catch(function(e){msg("Error: "+e.message,false);});
};

function renderGames(){
  $("gCount").textContent="("+S.games.length+")";
  var el=$("gamesList");
  el.innerHTML=S.games.map(function(g,i){
    var init=(g.title||"?").trim().charAt(0).toUpperCase();
    var bg=g.image?("background-image:url('"+g.image+"');background-size:cover")
      :("background:linear-gradient(135deg,hsl("+(g.hue||200)+",60%,30%),hsl("+((g.hue||200)+50)+",65%,15%))");
    return '<div class="gitem"><div class="sw" style="'+bg+'">'+(g.image?"":init)+'</div>'+
      '<div class="inf"><b>'+esc(g.title)+(g.featured?' ⭐':"")+'</b><span>'+esc(g.tag||"")+' · '+esc(g.link||"#")+'</span></div>'+
      '<div class="ops"><button class="mini" onclick="XP.edit('+i+')">Edit</button>'+
      '<button class="mini danger" onclick="XP.del('+i+')">Delete</button></div></div>';
  }).join("")||'<p class="mut">Koi game nahi — "Naya game add karein" dabayein.</p>';
}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}

window.XP={
  edit:function(i){var g=S.games[i]||{};
    $("edTitle").textContent="Game edit karein";$("fId").value=i;
    $("fTitle").value=g.title||"";$("fTag").value=g.tag||"";$("fBlurb").value=g.blurb||"";
    $("fLink").value=g.link||"";$("fImage").value=g.image||"";$("fHue").value=(g.hue==null?200:g.hue);
    $("fFeat").checked=!!g.featured;$("editor").style.display="block";
    $("editor").scrollIntoView({behavior:"smooth"});},
  del:function(i){if(confirm("Delete karein: "+(S.games[i]||{}).title+"?")){S.games.splice(i,1);renderGames();}}
};
$("addBtn").onclick=function(){$("edTitle").textContent="Naya game";$("fId").value="new";
  ["fTitle","fTag","fBlurb","fLink","fImage"].forEach(function(id){$(id).value="";});
  $("fHue").value=200;$("fFeat").checked=false;$("editor").style.display="block";};
$("cancelEditBtn").onclick=function(){$("editor").style.display="none";};
$("saveGameBtn").onclick=function(){
  var t=$("fTitle").value.trim();
  if(!t){msg("Title zaroori hai.",false);return;}
  var g={id:(($("fTitle").value||"game").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"game")+"-"+Date.now().toString(36),
    title:t,tag:$("fTag").value.trim()||"Game",blurb:$("fBlurb").value.trim(),
    link:$("fLink").value.trim()||"#",image:$("fImage").value.trim(),
    hue:parseInt($("fHue").value,10)||200,featured:$("fFeat").checked};
  var id=$("fId").value;
  if(id==="new"){S.games.push(g);}else{var old=S.games[parseInt(id,10)]||{};g.id=old.id||g.id;S.games[parseInt(id,10)]=g;}
  renderGames();$("editor").style.display="none";msg("Game list mein save ho gaya — ab Publish dabayein.",true);
};

function renderConfig(){var c=S.config||{};
  $("cName").value=c.siteName||"";$("cTag").value=c.tagline||"";
  $("cHeroT").value=c.heroTitle||"";$("cHeroS").value=c.heroSub||"";
  $("cDiscord").value=c.discordUrl||"";$("cAnn").value=c.announcement||"";}
function readConfig(){return{siteName:$("cName").value.trim(),tagline:$("cTag").value.trim(),
  heroTitle:$("cHeroT").value.trim(),heroSub:$("cHeroS").value.trim(),
  discordUrl:$("cDiscord").value.trim()||"#",announcement:$("cAnn").value.trim()};}

$("pushBtn").onclick=function(){
  saveSettings();
  S.config=readConfig();
  msg("Publish ho raha hai...",true);
  var files=[
    {path:"data/games.json",obj:{games:S.games}},
    {path:"data/config.json",obj:S.config}
  ];
  (function next(i){
    if(i>=files.length){msg("✅ Publish ho gaya! ~1 minute mein site update ho jayegi.",true);return;}
    var f=files[i];
    api(f.path,{method:"PUT",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({message:"Update "+f.path+" via admin",content:b64(JSON.stringify(f.obj,null,2)),sha:S.shas[f.path],branch:S.branch})
    }).then(function(res){
      if(res.ok){S.shas[f.path]=res.json.content.sha;next(i+1);}
      else{msg("Error ("+f.path+"): "+(res.json.message||res.status),false);}
    }).catch(function(e){msg("Error: "+e.message,false);});
  })(0);
};

if(loadSettings()){$("viewSite").href="https://"+S.user+".github.io/"+S.repo+"/";}
})();
