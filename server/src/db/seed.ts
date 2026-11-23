import type { TicketDatabase } from './client.js';
import { statuses, tickets } from './schema.js';

const examples = [
  ['חשבונית חסרה', 'לא קיבלתי חשבונית עבור ההזמנה האחרונה'],
  ['כניסה לחשבון', 'הקוד החד פעמי לא הגיע לטלפון'],
  ['משלוח מתעכב', 'החבילה טרם הגיעה לנקודת האיסוף'],
  ['עדכון כתובת', 'אבקש לעדכן את כתובת המשלוח'],
  ['ביטול הזמנה', 'ההזמנה בוצעה בטעות לפני מספר דקות'],
  ['חשבונית כפולה', 'אותה חשבונית התקבלה פעמיים בדואר'],
  ['שינוי אמצעי תשלום', 'כרטיס האשראי הקודם אינו בתוקף'],
  ['בירור שעות פעילות', ''],
  ['החזר כספי', 'המוצר הוחזר לפני שבוע'],
  ['פריט חסר', 'החבילה לא כללה את כבל הטעינה'],
  ['תיאום טכנאי', 'אפשר לתאם ביקור לשעות הבוקר'],
  ['קופון לא תקין', 'קוד ההנחה נדחה בסיום הרכישה'],
  ['עדכון מספר טלפון', 'המספר שמופיע באישור שגוי'],
  ['אישור הזמנה', ''],
  ['איסוף עצמי', 'מבקש להעביר את ההזמנה לאיסוף בסניף'],
  ['מוצר פגום', 'המוצר הגיע עם מסך שבור'],
  ['הארכת אחריות', 'אשמח לקבל את תנאי ההארכה'],
  ['שינוי מועד משלוח', 'לא אהיה בבית במועד שנקבע'],
  ['העתק חשבונית', 'נדרש עותק עם שם העסק'],
  ['בירור יתרת זיכוי', ''],
  ['חיוב לא מזוהה', 'מופיע חיוב נוסף בכרטיס'],
  ['קבלה על תשלום', 'נדרש מסמך לצורך החזר הוצאות'],
  ['בעיה בעמוד התשלום', 'העמוד נתקע אחרי הזנת פרטי המשלוח'],
  ['שינוי נקודת איסוף', 'נקודת האיסוף שנבחרה סגורה השבוע'],
  ['הזמנה חלקית', 'התקבל רק אחד משני הפריטים'],
] as const;

export function seedTickets(db: TicketDatabase) {
  return db.transaction((tx) => {
    // Serialize the empty-table check with the insert so concurrent seeds are safe.
    const existing = tx.select({ id: tickets.id }).from(tickets).limit(1).get();
    if (existing) return { inserted: 0, total: examples.length };

    const inserted = tx.insert(tickets).values(examples.map(([title, description], index) => ({
      title,
      description,
      status: statuses[index % statuses.length],
      created_at: new Date(Date.UTC(2025, 0, index + 1, 10, 30)),
    }))).run();
    return { inserted: inserted.changes, total: examples.length };
  }, { behavior: 'immediate' });
}
