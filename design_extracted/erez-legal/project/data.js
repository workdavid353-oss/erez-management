// Mock data for Erez Legal
window.EREZ_DATA = (() => {
  const users = [
    { id: 'u1', name: 'עו"ד ארז כהן',     initials: 'אכ', role: 'owner',     email: 'erez@erez-legal.co.il',     active: true,  cases: 14 },
    { id: 'u2', name: 'מיכל בן-דוד',       initials: 'מב', role: 'secretary', email: 'michal@erez-legal.co.il',   active: true,  cases: 22 },
    { id: 'u3', name: 'עו"ד יוסי לוי',     initials: 'יל', role: 'employee',  email: 'yossi@erez-legal.co.il',    active: true,  cases: 11 },
    { id: 'u4', name: 'עו"ד דנה גולן',     initials: 'דג', role: 'employee',  email: 'dana@erez-legal.co.il',     active: true,  cases: 9  },
    { id: 'u5', name: 'עו"ד רוני שמש',     initials: 'רש', role: 'employee',  email: 'roni@erez-legal.co.il',     active: true,  cases: 7  },
    { id: 'u6', name: 'מתמחה: שירה אזולאי', initials: 'שא', role: 'employee',  email: 'shira@erez-legal.co.il',    active: false, cases: 3  },
  ];

  // Active workers shown as dynamic columns
  const workerCols = users.filter(u => u.active && (u.role === 'employee' || u.role === 'owner'));

  const categories = ['אזרחי', 'פלילי', 'מסחרי', 'משפחה', 'נדל"ן', 'עבודה'];

  // Status values: done | progress | urgent | pending | blocked | null
  const cases = [
    {
      id: 'c1024', name: 'לוי נ\' עיריית תל אביב', subject: 'תביעה מנהלית — היתר בנייה', courtId: '12345-04-25',
      category: 'אזרחי', info: 'דיון הוכחות נקבע ל-12.06', priority: 'high', opened: '14/02/2025',
      status: 'בטיפול',
      tasks: { u1: 'progress', u3: 'urgent', u4: 'pending' },
      updatedAt: '18/05/2026 09:42', updatedBy: 'u2',
    },
    {
      id: 'c1019', name: 'מדינת ישראל נ\' שטרן', subject: 'הגנה פלילית — עבירות מס', courtId: '88421-12-24',
      category: 'פלילי', info: 'הגשת כתב הגנה עד 22.05', priority: 'high', opened: '03/12/2024',
      status: 'דחוף',
      tasks: { u1: 'urgent', u3: 'progress' },
      updatedAt: '18/05/2026 08:11', updatedBy: 'u1',
    },
    {
      id: 'c1031', name: 'אבן-זהר ושות\' בע"מ', subject: 'הסכם מיזוג — בדיקת נאותות', courtId: '—',
      category: 'מסחרי', info: 'תיק מהיר — נדרשת חוו"ד עד סוף השבוע', priority: 'med', opened: '02/04/2025',
      status: 'בטיפול',
      tasks: { u1: 'progress', u4: 'progress', u5: 'pending' },
      updatedAt: '17/05/2026 17:35', updatedBy: 'u4',
    },
    {
      id: 'c1015', name: 'גרינברג — צוואה והורשה', subject: 'התנגדות לקיום צוואה', courtId: '5512-09-24',
      category: 'משפחה', info: 'יורש שני הגיש התנגדות', priority: 'med', opened: '11/09/2024',
      status: 'ממתין',
      tasks: { u3: 'blocked', u5: 'pending' },
      updatedAt: '15/05/2026 14:20', updatedBy: 'u2',
    },
    {
      id: 'c1042', name: 'אופנת רותם — תביעת שכר', subject: 'תביעת עובדת לשעבר', courtId: '33781-03-25',
      category: 'עבודה', info: 'גישור נקבע ל-02.06', priority: 'low', opened: '20/03/2025',
      status: 'בטיפול',
      tasks: { u4: 'done', u5: 'progress' },
      updatedAt: '15/05/2026 11:08', updatedBy: 'u5',
    },
    {
      id: 'c1047', name: 'שדרות הים 14 — קניה', subject: 'עסקת מקרקעין — מימוש זכויות', courtId: '—',
      category: 'נדל"ן', info: 'חתימה משוערת 28.05', priority: 'med', opened: '08/04/2025',
      status: 'בטיפול',
      tasks: { u1: 'progress', u4: 'progress' },
      updatedAt: '14/05/2026 16:50', updatedBy: 'u1',
    },
    {
      id: 'c1009', name: 'חברת קומפס נ\' רביבו', subject: 'הפרת חוזה — שיווק דיגיטלי', courtId: '7721-11-24',
      category: 'מסחרי', info: 'בקשה לסילוק על הסף הוגשה', priority: 'low', opened: '14/11/2024',
      status: 'הושלם',
      tasks: { u1: 'done', u3: 'done', u4: 'done' },
      updatedAt: '13/05/2026 10:22', updatedBy: 'u3',
    },
    {
      id: 'c1050', name: 'שגב נ\' שגב — גירושין', subject: 'הסכם גירושין וחלוקת רכוש', courtId: '14492-05-25',
      category: 'משפחה', info: 'פגישת גישור שלישית בשבוע הבא', priority: 'high', opened: '02/05/2025',
      status: 'דחוף',
      tasks: { u3: 'urgent', u4: 'urgent' },
      updatedAt: '12/05/2026 19:15', updatedBy: 'u3',
    },
    {
      id: 'c1037', name: 'בנייני נצח — ליקויי בנייה', subject: 'תביעה נגד קבלן', courtId: '60012-02-25',
      category: 'אזרחי', info: 'חוו"ד מהנדס בדרך', priority: 'med', opened: '15/02/2025',
      status: 'ממתין',
      tasks: { u3: 'pending', u5: 'blocked' },
      updatedAt: '11/05/2026 12:00', updatedBy: 'u3',
    },
    {
      id: 'c1004', name: 'אזרחות פורטוגלית — משפחת אמיר', subject: 'תיק אזרחות זרה', courtId: '—',
      category: 'מסחרי', info: 'הוגש לקונסוליה — ממתינים', priority: 'low', opened: '24/10/2024',
      status: 'ממתין',
      tasks: { u4: 'pending' },
      updatedAt: '10/05/2026 09:30', updatedBy: 'u4',
    },
    {
      id: 'c1055', name: 'מועצה אזורית רמת הגליל', subject: 'ייעוץ — מכרז ניקיון', courtId: '—',
      category: 'מסחרי', info: 'דרוש מענה עד 24.05', priority: 'med', opened: '11/05/2025',
      status: 'בטיפול',
      tasks: { u1: 'progress', u5: 'progress' },
      updatedAt: '09/05/2026 17:45', updatedBy: 'u1',
    },
    {
      id: 'c1027', name: 'מדינת ישראל נ\' אהרוני', subject: 'הגנה פלילית — תאונת דרכים', courtId: '90187-01-25',
      category: 'פלילי', info: 'הסדר טיעון בבחינה', priority: 'med', opened: '08/01/2025',
      status: 'בטיפול',
      tasks: { u1: 'progress', u3: 'progress' },
      updatedAt: '08/05/2026 14:00', updatedBy: 'u1',
    },
  ];

  const timeline = [
    { date: '18/05/2026 09:42', user: 'u2', action: 'עדכנה את סטטוס המשימה של ד\' גולן ל"בהמתנה"' },
    { date: '17/05/2026 16:20', user: 'u1', action: 'הוסיף הערה: "להכין תרגיר טענות לפני דיון 12.06"' },
    { date: '16/05/2026 11:08', user: 'u3', action: 'צירף מסמך: "כתב טענות — טיוטה v3.docx"' },
    { date: '14/05/2026 13:30', user: 'u2', action: 'יצרה משימה חדשה ושייכה אותה לעו"ד יוסי לוי' },
    { date: '10/05/2026 09:00', user: 'u1', action: 'שינה את הקטגוריה מ"מסחרי" ל"אזרחי"' },
    { date: '02/05/2026 17:14', user: 'u2', action: 'פתחה את התיק במערכת' },
  ];

  const myTasks = [
    { caseId: 'c1019', caseName: 'מדינת ישראל נ\' שטרן',          type: 'הגשת כתב הגנה',             status: 'urgent',   priority: 'high', due: '22/05/2026', notes: 'לבקש הארכה אם צריך' },
    { caseId: 'c1024', caseName: 'לוי נ\' עיריית תל אביב',         type: 'תרגיר טענות לדיון',         status: 'progress', priority: 'high', due: '02/06/2026', notes: '' },
    { caseId: 'c1031', caseName: 'אבן-זהר ושות\' בע"מ',           type: 'חוו"ד — סעיפי אי-תחרות',    status: 'progress', priority: 'med',  due: '24/05/2026', notes: 'לתאם עם דנה' },
    { caseId: 'c1027', caseName: 'מדינת ישראל נ\' אהרוני',        type: 'בחינת הסדר טיעון',          status: 'progress', priority: 'med',  due: '28/05/2026', notes: '' },
    { caseId: 'c1047', caseName: 'שדרות הים 14 — קניה',           type: 'בדיקת זכויות — טאבו',       status: 'pending',  priority: 'low',  due: '26/05/2026', notes: '' },
    { caseId: 'c1055', caseName: 'מועצה אזורית רמת הגליל',         type: 'מענה למכרז',                status: 'progress', priority: 'med',  due: '24/05/2026', notes: '' },
    { caseId: 'c1009', caseName: 'חברת קומפס נ\' רביבו',          type: 'תיוק והעברת תיק לארכיון',   status: 'done',     priority: 'low',  due: '01/05/2026', notes: 'הסתיים' },
    { caseId: 'c1015', caseName: 'גרינברג — צוואה והורשה',         type: 'מענה להתנגדות',             status: 'pending',  priority: 'med',  due: '15/05/2026', notes: 'באיחור — לבדוק' },
  ];

  return { users, workerCols, categories, cases, timeline, myTasks };
})();

// Helper formatters
window.fmtRelative = (dateStr) => {
  return dateStr; // already formatted in mock
};
