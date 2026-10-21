/**
 * إعدادات واجهة مسابقة بيس VX.
 * رابط Google Apps Script يتم حفظه في Vercel Environment Variables باسم GOOGLE_SCRIPT_URL،
 * وليس هنا، حتى تستطيع واجهة الخادم قراءة نتيجة التسجيل ومنع الأرقام المكررة.
 * رمز adminPin يخص التصدير المحلي التجريبي فقط، وليس وسيلة أمان للإدارة.
 */
window.VX_CONFIG = {
  adminPin: "4286"
};
