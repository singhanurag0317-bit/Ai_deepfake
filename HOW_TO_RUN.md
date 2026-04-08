
**PowerShell or Command Prompt:**
```bash
cd D:\Project\Ai_deepfake-new\deepscan-frontend
npm start
```

---

## How It Works

### Permanent Fixes Applied:
1. ✓ Environment variables set globally
2. ✓ .npmrc file configured at: `C:\Users\win\.npmrc`
3. ✓ npm shell config fixed: `C:\Windows\System32\cmd.exe`
4. ✓ PowerShell profile configured
5. ✓ Launcher scripts provided

### Why It Was Broken:
npm was trying to use: `C:\Program Files\Python311` ❌
- This path didn't exist
- It only broke postinstall scripts
- **Now fixed to use cmd.exe** ✓

---

## Next Time You Run:
- **No setup needed**
- Just use one of the 3 methods above
- Everything is permanently configured

---

## Troubleshooting

**If npm still shows errors:**
1. Close all terminals
2. Open a fresh terminal
3. Try again
4. Port 3000 already in use? Use `npm start -- --port 3001`

**To verify configuration:**
```bash
npm config ls
npm config get shell
```

Should show: `C:\Windows\System32\cmd.exe`

---

## App Access
Once running, your app is at: **http://localhost:3000**

---

Created: March 19, 2026
