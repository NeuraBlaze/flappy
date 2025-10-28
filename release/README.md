# 🐦 Szenyo-madár - Lokális Kiadás

## 🚀 Azonnali indítás

**Egyszerűen dupla klikk a `🐦 START_SZENYO_GAME.bat` fájlra!**

A játék automatikusan megnyílik a böngészőben a http://localhost:8080 címen.

## 📋 Rendszerkövetelmények

- **Windows 7 vagy újabb**
- **Bármilyen modern böngésző** (Chrome, Firefox, Edge, Safari)
- **Python 3.x** (általában előre telepített Windows 10/11-en)

## 🎮 Vezérlés

### Alapvető irányítás
- **Kattintás/Érintés**: Ugrás
- **Space / ↑ nyíl**: Ugrás
- **P**: Szünet/Folytatás
- **R**: Újrakezdés (game over után)
- **D**: Debug mód be/ki

### Power-upok
- **🛡 Kék**: Pajzs - 5 másodperc védelem
- **⏰ Lila**: Lassítás - 3 másodperc slow motion
- **★ Arany**: Bónusz - +5 extra pont

## 🔧 Manuális indítás

Ha a batch fájl nem működik:

### 1. opció - Python szerver
```bash
cd web
python -m http.server 8080
```

### 2. opció - Node.js
```bash
npx serve web -p 8080
```

### 3. opció - Bármilyen más web szerver
Egyszerűen szolgáld ki a `web` mappa tartalmát egy helyi web szerveren.

## 📱 Mobil támogatás

A játék teljes mértékben támogatja a mobil eszközöket:
- **Touch vezérlés**: Érintéssel ugrás
- **Reszponzív layout**: Automatikus méretezés
- **Offline játék**: Nincs szükség internet kapcsolatra

## 🎯 Játékmenet tippek

1. **Türelem**: Lassan és egyenletesen repülj
2. **Power-upok**: Gyűjtsd össze őket a magasabb pontszámért
3. **Pajzs**: Használd ki a védelem idejét nehéz részekben
4. **Lassítás**: Tökéletes szűk helyzetekhez

## 🏆 Pontozás

- **1 pont**: Minden átrepült akadály
- **+5 pont**: Bónusz power-up gyűjtése
- **Best score**: Automatikusan mentődik

## 🔍 Hibaelhárítás

**A játék nem indul el:**
- Ellenőrizd, hogy a `web` mappa létezik-e
- Próbáld meg manuálisan indítani (lásd fent)

**Lassú teljesítmény:**
- Zárd be a többi böngésző tabot
- Kapcsold ki a debug módot (D gomb)

**Hang nem szól:**
- Kattints egyszer a játékterületre
- Ellenőrizd a böngésző hangbeállításait

## 📄 Licenc

MIT License - Szabad felhasználás és módosítás.

---

**Készítette**: NeuraBlaze
**Verzió**: 1.0.0
**Dátum**: 2025

Jó játékot! 🎮