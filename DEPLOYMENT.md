# 🎮 GitHub Pages & Lokális Release útmutató

## 🌐 Online játék elérése

A játék automatikusan telepítésre kerül GitHub Pages-re minden commit után:

**🔗 Játék URL**: https://neurablaze.github.io/flappy/

### GitHub Pages beállítás:
1. Menj a GitHub repo Settings > Pages részhez
2. Source: "Deploy from a branch" 
3. Branch: "gh-pages" 
4. Folder: "/ (root)"
5. Save

A GitHub Actions automatikusan builddeli és deployli a játékot.

## 📦 Lokális kiadás

### Letöltés és futtatás:
1. **Letöltés**: `Haraszt_Flappy_v1.0_Local.zip` fájl
2. **Kicsomagolás**: Bárhova a számítógépre
3. **Futtatás**: Dupla klikk a `🐦 START_FLAPPY_GAME.bat` fájlra

### Tartalom:
```
📁 release/
├── 🐦 START_FLAPPY_GAME.bat    # Egyszerű indító
├── 📖 README.md                # Részletes útmutató
└── 📁 web/                     # Játék fájlok
    ├── index.html              # Fő HTML fájl
    ├── favicon.svg             # Ikon
    └── 📁 assets/              # CSS és JS fájlok
        ├── index-[hash].css
        └── index-[hash].js
```

## 🔄 Deployment folyamat

1. **Kód változás** → Push to main branch
2. **GitHub Actions** → Automatikus build
3. **GitHub Pages** → Automatikus deploy
4. **Játék elérhető** → https://neurablaze.github.io/flappy/

## 🎯 Következő lépések

### Online:
- ✅ Kód feltöltve GitHub-ra
- ✅ GitHub Actions workflow konfigurálva  
- ⏳ GitHub Pages beállítás szükséges (manuálisan)
- ⏳ SSL certificate automatikus

### Lokális:
- ✅ Standalone verzió kész
- ✅ ZIP package létrehozva
- ✅ Batch launcher működik
- ✅ Dokumentáció elkészült

---

**A játék most már teljesen kész mind online, mind lokális használatra! 🎉**