# 🐇 beli_zec — WHR Master Magistrala v1.0

Dobrodošli u glavno kontrolno čvorište projekta **beli_zec**. Ovo skladište predstavlja udaljeni izvor istine (**Ground Truth**) za našu lokalnu `D:\WHR_2u1\` medijsku magistralu. 

Ovde nema mesta za generativni šum, estetsku improvizaciju ili odokativna rešenja. Ceo cevovod (pipeline) počiva na matematičkom determinizmu i paranoičnoj proveri strukture podataka.

---

## 🔴✏️ KANONSKA PRAVILA CRVENE OLOVKE

Crvena Olovka drži magistralu sterilnom kroz sledeće aksiome:

1. **Identitet nije istinitost:** Samouveren odgovor ili vizuelno lep UI ne znače ništa bez sirovog dokaza u pozadini.
2. **Determinizam se dokazuje na izlazu:** Nijednom alatu se ne veruje na reč (pa ni FFmpeg-u). Uspešan izlazni status (`Exit Code = 0`) samo je preduslov za pokretanje empirijskog merenja.
3. **Nema floating-point nagađanja:** Sva trajanja, frejmovi i audio-klikovi moraju biti eksplicitno fiksirani. Decimalni drift u slici ili zvuku smatra se sistemskom devijacijom (**Zero Deviation Policy**).
4. **Slučajnost postaje lekcija:** Svaka anomalija, neočekivani izlaz ili slučajni skok ispod korisničkog interfejsa (DevTools/DOM) se ne briše. On se beleži, analizira i sidri kao tehnički trag.

---

## 🔍 HIJERARHIJA DOKAZ_CODE VERIFIKACIJE

Sistem verifikacije medijskih aseta i programskog koda podeljen je na stroge slojeve dubine. Svaki naredni sloj dokazuje više o tehničkoj implementaciji:

```text
[ VIZUELNI PRIKAZ ]  --> Korisnički interfejs (UI) / Izrenderovani video (Podložno iluziji)
        │
        ▼
[ STRUKTURNI DOKAZ ] --> ffprobe / DOM elementi / JSON metapodaci (Dokazana struktura)
        │
        ▼
[ KRIPTOGRAFSKI DOKAZ ] -> SHA-256 Hash / Commit SHA / Nepromenljiva istorija (Apsolutni dokaz)
```

### Provera validnosti na magistrali:
Za svaki renderovani segment (Blok) pokreće se automatska provera tri ključna tokena kroz `ffprobe`:
*   `DURATION`: Tačno trajanje u mikrosekundama (npr. `5.000000`).
*   `AVG_FRAME_RATE`: Tačan frejmrejt zaključan na emulaciju (`60/1`).
*   `NB_READ_FRAMES`: Tačan matematički broj frejmova (npr. `300`).

---

## 📁 STRUKTURA DIREKTORIJUMA (D:\WHR_2u1\)

```text
beli_zec/
├── 01_RAW_ASSETS/             # Izvorni resursi
│   └── AUDIO/                 # A1 šina (Master metronom na 150 BPM)
├── 05_METADATA/               # Srce RAG sistema
│   ├── SCENARIO_30s_NOVI.md   # Kanonski scenario (Izvor istine)
│   └── QA_VERIFICATION_LOG.json # Trajni tragovi ffprobe merenja
└── 06_RENDER/                 # Izvršni sloj
    ├── ASSETS/                # PNG overlay-i i C64 HUD grafika
    ├── render_blok_01.bat     # Stabilizovana skripta za Blok 01 (00s - 05s)
    ├── render_blok_02.bat     # Čista CMD skripta za Blok 02 (05s - 10s)
    └── verify_b01.bat         # ffprobe automatski validator
```

---

## ⏱️ VREMENSKA OSA I PROGRES PROJEKTA

*   [x] **Blok 01 (00.000s - 05.000s):** The Spark & Awakening (Strobo fleševi, C64 HUD inicijalizacija) — **ZAKLJUČANO 🔒**
*   [x] **Blok 02 (05.000s - 10.000s):** The Amber Breather (Stabilan kadar, 150 BPM A1 sinhronizacija) — **ZAKLJUČANO 🔒**
*   [ ] **Blok 03 (10.000s - 15.000s):** Ubrzanje ritma, mehanički tasteri i dijagnostika — *Na čekanju ⏳*

---
**Small Hops, Big Changes. WRRAAAAAA!** 🐇🔴✏️
# beli_zec
