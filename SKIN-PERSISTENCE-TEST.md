# 🐦 SKIN PERSISTENCE TEST GUIDE

## 🧪 Test Lépések - Skin & Ability Mentés

### 1. Skin váltás tesztelése

1. **Indítsd el a játékot:**
   ```
   npm run dev
   ```

2. **Nyisd meg a böngészőt:** `http://localhost:3011/flappy/`

3. **Konzol megnyitása:** Tilde `~` gomb

4. **Aktuális skin ellenőrzése:**
   ```
   status
   ```
   Látnod kell az aktuális skin információkat

5. **Skin váltás cheat kóddal:**
   ```
   szeretlekmario
   ```
   Ez felold minden skint

6. **Skin megváltoztatása:**
   - Click a "Bird Selector" gombra a jobboldali menüben
   - Válassz ki egy másik skint (pl. Warrior Bird 🗡️)
   - Kattints rá hogy aktiváld

### 2. Persistence ellenőrzése

7. **Böngésző frissítése:**
   ```
   F5 vagy Ctrl+R
   ```

8. **Konzol ismételt megnyitása:** `~`

9. **Skin állapot ellenőrzése:**
   ```
   status
   ```

10. **Várt eredmény:**
    - Az utoljára kiválasztott skin aktív kell legyen
    - A képességek megfelelően inicializálódtak
    - A console log mutatja: "🐦 Bird initialized with skin: [skin name]"

### 3. Browser DevTools ellenőrzés

11. **F12 → Console tab**
    
12. **Keress a következő log üzenetre:**
    ```
    🐦 Bird initialized with skin: [skin name]
    ```

13. **LocalStorage ellenőrzés:**
    - F12 → Application tab → Local Storage
    - Keress: `szenyo_madar_selected_skin`
    - Értéke a kiválasztott skin ID kell legyen

### 4. Ability működés tesztelése

14. **Játék indítása:** Space vagy Click

15. **Ability ellenőrzés (ha Warrior Bird van kiválasztva):**
    - Extra élet kell legyen (2 élet)
    - Auto shield működik
    - Can shoot (lövés R gombbal)

### 5. Újraindítás teszt

16. **Böngésző bezárása és újranyitása**

17. **Ismételd a 2-es lépést** (persistence check)

## ✅ Sikerkritériumok

- [ ] Skin váltás működik
- [ ] LocalStorage menti a kiválasztott skint
- [ ] Oldal frissítéskor betölti a mentett skint
- [ ] Abilities megfelelően inicializálódnak
- [ ] Console log megerősíti a skin betöltést
- [ ] Játék indításkor az abilities aktívak

## 🐛 Ha valami nem működik

### Debug parancsok:
```javascript
// Konzolban (F12):
localStorage.getItem('szenyo_madar_selected_skin')
```

### Hibajavítás:
- Töröld a localStorage-t és kezdd újra
- Ellenőrizd a console hibákat (F12)
- Próbáld inkognito módban

---

**Expected Output Example:**
```
🐦 Bird initialized with skin: Warrior Bird
{
  lives: 2,
  abilities: {
    extraLives: 1,
    autoShield: 300,
    canShoot: true,
    ...
  }
}
```

## 📝 Technical Details

### Modified Code:
- Added `useEffect` for skin initialization on component mount
- Bird state now updates with selected skin abilities
- localStorage integration for persistence
- Console logging for debugging

### Skin Abilities Loaded:
- `extraLives` → bird.current.lives
- `autoShield` → bird.current.autoShieldTimer  
- `canShoot` → bird.current.canShoot
- `shadowTeleport` → bird.current.shadowTeleportsLeft
- `darkAura` → bird.current.darkAuraActive
- `pixelMode` → bird.current.pixelModeActive
- `powerUpMagnet` → bird.current.powerUpMagnetActive