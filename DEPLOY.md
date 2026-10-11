# XENO GAMES — Deploy Guide (100% FREE, koi kharcha nahi)

## Site kya hai
- `index.html` — public landing page (premium design: proof clips, game library, launcher mockup, install terminal, FAQ)
- `admin/` — admin panel: khud game links add/edit/delete karo
- `data/games.json` — games ka data (admin panel isi ko update karta hai)
- `data/config.json` — site name, hero text, Discord link
- `privacy.html`, `about.html`, `contact.html` — AdSense ke liye zaroori pages

## Step 1 — Files GitHub par dalo
Tumhara repo pehle se bana hai: **xenogames-**
1. Purani files par **nayi files upload** karo (same tareeqa: "uploading an existing file" → sab select → Commit)
   - Nayi zip ke andar `xenogames` folder ki **sari files** hain
2. Purani files overwrite ho jayengi — koi masla nahi

## Step 2 — GitHub Pages ON karo (free hosting)
1. Repo → **Settings** → **Pages**
2. Source: **Deploy from a branch** → Branch: **main** → folder: **/ (root)** → Save
3. ~1 minute baad site live: `https://xenover09.github.io/xenogames-/`

## Step 3 — Admin panel connect karo
1. Site kholo: `https://xenover09.github.io/xenogames-/admin/`
2. **Personal Access Token** banao: https://github.com/settings/tokens/new?scopes=repo&description=xenogames-admin
   - Sirf **repo** tick karo → Generate → token copy karo
   - (Token sirf tumhare browser mein save hota hai, kahin aur nahi jata)
3. Admin mein: username `xenover09`, repo `xenogames-`, branch `main`, token paste → **Connect & Load**
4. Games add/edit/delete karo → **"Sab kuch site par publish karein"** dabao → ~1 min mein site update

## Step 4 — Apna naam/email lagao
- Site ka naam waghera: admin panel → **Site settings**
- Contact page ka email: `contact.html` mein `admin@xenogames.example` ko apne email se badlo
- Discord link: admin panel → Site settings → Discord link

---

# ADS LAGANE KA TAREEQA (Google AdSense — free)

1. **Site live ho** (Step 2) + asal content ho (games + FAQ + About + Privacy + Contact — sab ready hai)
2. Apply karo: https://www.google.com/adsense → apni site ka URL do
3. Google verify karega — approval mein **kuch din** lag sakte hain
4. Approve hone ke baad **Ad unit** banao → code ko `index.html` ke 3 `<!-- ADSENSE SLOT -->` boxes mein paste karo → files dobara upload karo

## Seedhi baat (yaad rakho)
- Approval ke liye **asal content** likho — games ki description khud likho, copy-paste nahi
- **Earning traffic se aati hai** — bina visitors ke kuch nahi; pehle promote karo (YouTube/TikTok/Instagram)
- **Kabhi khud apne ads par click nahi karna** — account ban ho jata hai
- Kharcha: **Rs 0** (GitHub + Pages + AdSense sab free)
