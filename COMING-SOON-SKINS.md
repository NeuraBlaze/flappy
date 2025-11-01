# 🚧 COMING SOON SKINS FEATURE

## 📋 Változtatások Összefoglalója

### ✨ Új Funkció: "Hamarosan" Skinok

A következő speciális skinek mostantól **"Coming Soon"** státuszban vannak:

#### 🔮 Coming Soon Skinek:
- **😈 Démoni Madár** - Sötét erők és árnyék teleport
- **⚡ Villám Madár** - Elektromos erők és láncvillám
- **🦸‍♂️ Szupermadár** - Szupererők és lézer látás  
- **🦄 Egyszarvú Madár** - Mágikus szarv és varázslatok

### 🛠️ Technikai Implementáció

#### 1. Interface Módosítás
```typescript
interface BirdSkin {
  // ... existing properties
  comingSoon?: boolean; // Új tulajdonság
}
```

#### 2. Skin Definíciók Frissítve
```typescript
{
  id: "demon",
  name: "Démoni Madár", 
  description: "Hamarosan...",
  comingSoon: true // Új flag
}
```

#### 3. Unlock Logic Frissítés
```typescript
const isSkinUnlocked = (skin: BirdSkin) => {
  // Coming soon skins are never unlocked
  if (skin.comingSoon) return false;
  // ... rest of unlock logic
}
```

#### 4. Selection Prevention
```typescript
const selectBirdSkin = (skinId: string) => {
  const skin = birdSkins.current.find(s => s.id === skinId);
  if (skin && isSkinUnlocked(skin) && !skin.comingSoon) {
    // Only allow selection of non-coming-soon skins
  }
}
```

### 🎨 UI Változások

#### Bird Selector Update
- **🔮 Speciális ikon** coming soon skineknél
- **🚧 "Hamarosan..." szöveg** 
- **Lila szín téma** a coming soon gomboknak
- **Nem kattintható** állapot
- **Nincs ability megjelenítés** coming soon skineknél

#### Vizuális Jelzések:
```css
/* Coming Soon Button Style */
border: purple-600
background: purple-900/30  
opacity: 75%
cursor: not-allowed
```

### ✅ Funkcionális Tesztelés

#### Test Cases:
1. **Skinok megjelennek** a Bird Selector-ban
2. **Nem választhatóak ki** a coming soon skinok
3. **Speciális vizuális jelzés** (🔮 ikon + lila theme)
4. **"🚧 Hamarosan... 🚧" szöveg** jelenik meg
5. **Nincs ability display** coming soon skineknél
6. **Cheat kódok sem aktiválják** őket

### 🎯 Eredmény

#### Előnyök:
- ✅ **Hype építés** - játékosok látják mi jön
- ✅ **Clean UI** - nincs funkcionalitás nélküli elem
- ✅ **Future-proof** - könnyen aktiválhatóak később
- ✅ **Konzisztens UX** - egyértelmű jelzések

#### Használat:
```typescript
// Skin aktiválásához később:
{
  id: "demon",
  name: "Démoni Madár",
  description: "Sötét erők: életlopás és árnyék teleport!",
  comingSoon: false // Vagy töröld a sort
}
```

### 🎮 Játékos Élmény

1. **Bird Selector megnyitása** → speciális skinok láthatóak
2. **Coming Soon skinekre kattintás** → semmi nem történik
3. **Vizuális feedback** → lila, disable megjelenés
4. **Expectation setting** → "Hamarosan..." üzenet

---

## 📝 Következő Lépések

Ha aktiválni szeretnéd bármelyik skint:
1. Töröld a `comingSoon: true` sort
2. Állítsd vissza az eredeti `description`-t  
3. Implementáld a speciális ability-ket

**Status: ✅ READY FOR TESTING**

A funkció elkészült és tesztelhető a `http://localhost:3011/flappy/` címen!