# מדריך התקנה מקומית — Erez Management

מדריך זה מתעד את כל השלבים להרצת המערכת בסביבה מקומית ללא אינטרנט.
כל הנתונים נשמרים על המחשב המרכזי, וכל משתמשי הרשת מתחברים אליו.

---

## דרישות מקדמיות

התקן את הכלים הבאים על **המחשב המרכזי בלבד**:

| כלי | גרסה מינימלית | קישור הורדה | הערות |
|-----|--------------|-------------|-------|
| Docker Desktop | 4.x+ | https://www.docker.com/products/docker-desktop | חובה להפעיל בהפעלת המחשב |
| Git | 2.x+ | https://git-scm.com/download/win | |
| Node.js | 18.x+ | https://nodejs.org (LTS) | כולל npm אוטומטית |

> על שאר המחשבים ברשת — **לא צריך להתקין כלום**, רק דפדפן.

---

## סביבה זו (מחשב הפיתוח)

```
Docker:        29.4.3   ✅
Docker Compose: 5.1.3   ✅
Git:           2.53.0   ✅
Node.js:       25.5.0   ✅
npm:           11.8.0   ✅
```

---

## שלב 1 — הורדת Supabase Self-Hosted

פתח PowerShell והרץ:

```powershell
# בחר תיקייה, למשל ליד הפרויקט
cd C:\Users\davidferber\Desktop\VS-Code

git clone --depth 1 https://github.com/supabase/supabase
cd supabase\docker
copy .env.example .env
```

---

## שלב 2 — מפתחות JWT (כבר נוצרו)

המפתחות נוצרו ב-2026-05-19 עם Node.js מקומי:

```
JWT_SECRET=0jomJqQWZrPeTEshiC74R9FgMGlVD8xkYyBKNtLO
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWRlbW8iLCJpYXQiOjE3NzkxOTczMjYsImV4cCI6MjA5NDU1NzMyNn0.khCwUj_aXgl6l-ryIgDSt6ykmZpqDmFdRmMco4qRTn8
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UtZGVtbyIsImlhdCI6MTc3OTE5NzMyNiwiZXhwIjoyMDk0NTU3MzI2fQ.9yVKeUkP6HAzujsbqdwtgm4-c0yU06vN7TxDesLjMt8
```

> שמור מפתחות אלה במקום בטוח — הם נחוצים לחיבור האפליקציה.

לסביבה חדשה, צור מפתחות חדשים עם:
```powershell
node -e "
const crypto = require('crypto');
const secret = 'YOUR_JWT_SECRET_HERE';
const b64 = s => Buffer.from(s).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
function jwt(payload) {
  const h = b64(JSON.stringify({alg:'HS256',typ:'JWT'}));
  const p = b64(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(h+'.'+p).digest('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  return h+'.'+p+'.'+sig;
}
const now = Math.floor(Date.now()/1000); const exp = now + 315360000;
console.log('ANON=' + jwt({role:'anon',iss:'supabase-demo',iat:now,exp:exp}));
console.log('SERVICE=' + jwt({role:'service_role',iss:'supabase-demo',iat:now,exp:exp}));
"
```

---

## שלב 3 — הגדרת קובץ `.env`

פתח `supabase\docker\.env` וערוך את השורות הבאות:

```env
############
# Secrets — שנה את כולם לפני הפקה!
############
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD
JWT_SECRET=YOUR_JWT_SECRET_32_CHARS_MIN
ANON_KEY=YOUR_ANON_KEY
SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

############
# API
############
SITE_URL=http://192.168.X.X:3000        # ← IP של המחשב המרכזי
API_EXTERNAL_URL=http://192.168.X.X:8000

############
# Studio (ממשק ניהול)
############
STUDIO_DEFAULT_ORGANIZATION=Erez Legal
STUDIO_DEFAULT_PROJECT=erez-management
```

> החלף `192.168.X.X` ב-IP האמיתי של המחשב המרכזי (ראה שלב 6).

---

## שלב 4 — הפעלת Supabase

```powershell
cd C:\Users\davidferber\Desktop\VS-Code\supabase\docker

docker compose up -d
```

המתן כ-2 דקות בהפעלה ראשונה (הורדת images).
בהפעלות הבאות — פחות מ-30 שניות.

### בדיקה שהכל עלה:
```powershell
docker compose ps
```
כל השירותים צריכים להיות במצב `running`:
- `supabase-kong` (API Gateway — פורט 8000)
- `supabase-auth` (אימות משתמשים)
- `supabase-rest` (REST API)
- `supabase-db` (PostgreSQL — פורט 5432)
- `supabase-studio` (ממשק ניהול — פורט 8000)
- `supabase-realtime`
- `supabase-storage`

---

## שלב 5 — ייבוא הסכמה הקיימת

לאחר שה-DB עלה, הרץ את קובץ הסכמה של הפרויקט:

```powershell
# מתיקיית הפרויקט
cd C:\Users\davidferber\Desktop\VS-Code\erez-management

docker exec -i supabase-db psql -U postgres -d postgres < supabase_schema.sql
```

---

## שלב 6 — מציאת ה-IP של המחשב המרכזי

```powershell
ipconfig | findstr "IPv4"
```

דוגמה לפלט: `IPv4 Address. . . : 192.168.1.100`

רשום את ה-IP כאן לשימוש עתידי: `_________________`

---

## שלב 7 — עדכון האפליקציה

ערוך את `C:\Users\davidferber\Desktop\VS-Code\erez-management\.env.local`:

```env
VITE_SUPABASE_URL=http://192.168.1.100:8000
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

---

## שלב 8 — הרצת האפליקציה

```powershell
cd C:\Users\davidferber\Desktop\VS-Code\erez-management
npm run dev -- --host
```

הדגל `--host` חושף את האפליקציה לרשת המקומית.

האפליקציה תהיה זמינה ב:
- המחשב המרכזי: `http://localhost:5173`
- כל מחשב ברשת: `http://192.168.1.100:5173`

---

## ממשק ניהול Supabase (Studio)

גישה לממשק הניהול (כמו Supabase.com אבל מקומי):
```
http://192.168.1.102:8000
```
- **יוזר:** `supabase`
- **סיסמה:** `ErezAdmin2026!`

משם אפשר לנהל משתמשים, לראות נתונים, להריץ SQL ועוד.

> **חשוב:** אחרי שינוי סיסמה ב-`.env` — `restart` לא מספיק!
> חובה להריץ: `docker compose up -d --force-recreate kong`

---

## הפעלה יומית

בכל פעם שמדליקים את המחשב המרכזי:

```powershell
# 1. הפעל Docker Desktop (אם לא מוגדר אוטומטי)

# 2. הפעל Supabase
cd C:\Users\davidferber\Desktop\VS-Code\supabase\docker
docker compose up -d

# 3. הפעל האפליקציה
cd C:\Users\davidferber\Desktop\VS-Code\erez-management
npm run dev -- --host
```

> **טיפ:** אפשר ליצור קובץ `start.bat` שמריץ את כל זה בלחיצה אחת (ראה קטע "אוטומציה").

---

## כיבוי תקין

```powershell
cd C:\Users\davidferber\Desktop\VS-Code\supabase\docker
docker compose down
```

> **אל תשתמש ב-`docker compose down -v`** — זה ימחק את כל הנתונים!

---

## גיבוי נתונים

### גיבוי ידני של ה-DB:
```powershell
docker exec supabase-db pg_dump -U postgres postgres > backup_$(Get-Date -Format 'yyyyMMdd_HHmm').sql
```

### גיבוי אוטומטי (מומלץ):
הוסף משימה ל-Windows Task Scheduler שמריצה את הפקודה למעלה כל יום.

---

## אוטומציה — קובץ `start.bat`

צור קובץ `C:\Users\davidferber\Desktop\start-erez.bat`:

```bat
@echo off
echo מפעיל את מערכת Erez Management...

echo שלב 1: מפעיל Supabase...
cd /d "C:\Users\davidferber\Desktop\VS-Code\supabase\docker"
docker compose up -d

echo ממתין 10 שניות...
timeout /t 10 /nobreak > nul

echo שלב 2: מפעיל האפליקציה...
cd /d "C:\Users\davidferber\Desktop\VS-Code\erez-management"
start npm run dev -- --host

echo.
echo המערכת פעילה!
echo משתמשים יכולים להתחבר מהרשת.
pause
```

---

## פתרון בעיות נפוצות

| בעיה | פתרון |
|------|-------|
| `docker: command not found` | הפעל Docker Desktop |
| `port 8000 already in use` | `docker compose down` ואז `up` מחדש |
| פורט חסום (Forbidden) | בדוק `netsh interface ipv4 show excludedportrange protocol=tcp` ושנה ב-`.env` |
| משתמשים לא מגיעים מהרשת | בדוק Firewall — פתח פורטים 8000 ו-5173 |
| נתונים נעלמו | ודא שלא הרצת `docker compose down -v` |
| Studio לא נגיש | `docker compose logs studio` לבדיקת שגיאות |
| `Database error querying schema` בהתחברות | שדות NULL ב-auth.users — הרץ: |

```sql
UPDATE auth.users
SET
  email_change               = COALESCE(email_change, ''),
  phone_change               = COALESCE(phone_change, ''),
  email_change_token_new     = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  confirmation_token         = COALESCE(confirmation_token, ''),
  recovery_token             = COALESCE(recovery_token, ''),
  reauthentication_token     = COALESCE(reauthentication_token, '');
```

| שינוי סיסמת Studio לא עובד | `restart` לא מספיק — חובה: `docker compose up -d --force-recreate kong` |

---

## פורטים בשימוש

| פורט | שירות |
|------|-------|
| 5173 | האפליקציה (Vite) |
| 8000 | Supabase API + Studio |
| 5432 | PostgreSQL (DB ישיר) |
| 9999 | Auth service |

---

_עודכן לאחרונה: 2026-05-19_
