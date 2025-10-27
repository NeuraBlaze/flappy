# 🐦 Haraszt Flappy

Egy modern, pixel-art stílusú Flappy Bird játék React és TypeScript segítségével.

## ✨ Funkciók

### 🎮 Játékmenet
- **Egyszerű vezérlés**: Kattintás, érintés, Space vagy ↑ nyíl az ugráshoz
- **Fizikus alapú mozgás**: Valósághű gravitáció és lendület
- **Változatos akadályok**: Klasszikus csövek és modern épületek
- **Pontozás**: Pontozz minden átrepült akadályért

### 🚀 Power-upok
- **🛡 Pajzs**: 5 másodperc védelem az ütközésektől
- **⏰ Lassítás**: 3 másodperc slow motion effekt
- **★ Bónusz pont**: +5 extra pont

### 🎨 Vizuális effektek
- **Pixel-perfect rendering**: Éles, 8-bites grafika
- **Részecske rendszer**: Robbanások, nyomvonalak, csillogások
- **Kamera rázkódás**: Dinamikus ütközés effektek
- **Animált háttér**: Mozgó felhők és csillagok
- **Reszponzív design**: Automatikus méretezés minden eszközön

### 🎵 Audio
- **8-bit hangeffektek**: Web Audio API alapú procedurális hangok
- **Dinamikus audio**: Különböző hangok ugráshoz, pontszerzéshez, ütközéshez

### 🛠 Fejlesztői funkciók
- **Debug mód**: Hitboxok megjelenítése (D gomb)
- **Pause/Resume**: P gombbal szüneteltetés
- **LocalStorage**: Automatikus best score mentés

## 🎯 Vezérlés

### Alapvető irányítás
- **Kattintás/Érintés**: Ugrás
- **Space / ↑**: Ugrás
- **P**: Szünet/Folytatás
- **R**: Újrakezdés (game over után)
- **D**: Debug mód be/ki

### Játék állapotok
- **Főmenü**: Kattints a kezdéshez
- **Játék**: Repülj az akadályok között
- **Szünet**: P gombbal szüneteltethető
- **Game Over**: R-rel újrakezdés vagy főmenübe visszatérés

## 🏗 Telepítés és futtatás

### Előfeltételek
- Node.js (16+ verzió ajánlott)
- npm vagy yarn

### Lépések
```bash
# Függőségek telepítése
npm install

# Fejlesztői szerver indítása
npm run dev

# Build készítése
npm run build

# Build előnézet
npm run preview
```

## 🛠 Technológiai stack

- **React 18**: Modern React hooks és functional komponensek
- **TypeScript**: Type-safe fejlesztés
- **Vite**: Gyors build tool és dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Canvas API**: 2D renderelés és animációk
- **Web Audio API**: Procedurális hangeffektek

## 📂 Projekt struktúra

```
src/
├── components/
│   └── HarasztFlappy.tsx    # Fő játék komponens
├── index.css               # Globális stílusok és Tailwind
├── main.tsx               # React alkalmazás belépési pont
└── App.tsx                # App wrapper komponens
```

## 🎮 Játék mechanikák

### Fizika
- **Gravitáció**: Folyamatos lefelé húzás
- **Ugrás impulzus**: Rövid felfelé lökés
- **Forgás**: Madár döntése a sebesség alapján

### Akadályok
- **Klasszikus csövek**: Zöld csövek sapkával
- **Épületek**: Szürke épületek világító ablakokkal
- **Véletlenszerű generálás**: Változó magasságok és típusok

### Power-up rendszer
- **Ritka megjelenés**: ~0.3% esély frame-enként
- **Vizuális feedback**: Pulzáló animáció és különböző színek
- **Időkorlátos hatások**: Automatikus lejárat

### Pontozás
- **1 pont**: Minden sikeres átrepülés
- **+5 pont**: Bónusz power-up gyűjtése
- **Best score**: Automatikus mentés localStorage-ba

## 🔧 Testreszabás

A játék könnyen testreszabható a `world` objektum módosításával:

```typescript
const world = useRef({
  w: 320,           // Világ szélesség
  h: 480,           // Világ magasság  
  gravity: 0.35,    // Gravitációs erő
  jump: -5.8,       // Ugrás ereje
  speed: 1.8,       // Világ sebesség
  gap: 90,          // Akadály rés mérete
  pipeW: 40,        // Akadály szélesség
  pipeSpace: 160,   // Akadályok közti távolság
  groundH: 50,      // Talaj magasság
});
```

## 🐛 Hibakeresés

**Debug mód aktiválása**: Nyomd meg a D gombot a hitboxok megjelenítéséhez.

**Gyakori problémák**:
- *Audio nem szól*: Kattints egyszer a játékterületre (böngésző audió policy)
- *Lassú teljesítmény*: Csökkentsd a részecskék számát
- *Érintés nem működik*: Ellenőrizd a touch event support-ot

## 📱 Mobil támogatás

A játék teljes mértékben támogatja a mobil eszközöket:
- **Touch vezérlés**: Érintéssel ugrás
- **Reszponzív layout**: Automatikus méretezés
- **Optimalizált teljesítmény**: 60 FPS mobil eszközökön

## 🏆 High Score rendszer

- **Automatikus mentés**: localStorage használata
- **Session persistence**: Pontszám megmarad böngésző újrakezdés után
- **Rekord jelzés**: Vizuális feedback új rekordnál

## 📄 Licenc

MIT License - lásd a LICENSE fájlt a részletekért.

## 🤝 Közreműködés

Pull requestek szívesen fogadottak! Nagy változtatások esetén kérjük először nyiss egy issue-t.

---

Készítette: ❤️ és sok ☕ segítségével