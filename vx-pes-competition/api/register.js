// Vercel serverless endpoint: /api/register
// Set GOOGLE_SCRIPT_URL in Vercel Project Settings > Environment Variables.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "طريقة الطلب غير مسموحة." });
  }
  const endpoint = process.env.GOOGLE_SCRIPT_URL;
  if (!endpoint || !/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(endpoint)) {
    return res.status(503).json({ ok: false, code: "NOT_CONFIGURED", message: "لم يتم إعداد رابط Google Apps Script بعد." });
  }
  const { fullName, phone } = req.body || {};
  const name = String(fullName || "").trim().replace(/\s+/g, " ");
  const normalizedPhone = normalizePhone(phone || "");
  if (name.split(/\s+/).filter(Boolean).length < 3) return res.status(400).json({ ok: false, message: "اكتب الاسم الثلاثي." });
  if (!/^(?:\+?20)?0?1[0125]\d{8}$/.test(normalizedPhone) &&
      !/^20?1[0125]\d{8}$/.test(normalizedPhone) &&
      !/^01[0125]\d{8}$/.test(normalizedPhone)) {
    return res.status(400).json({ ok: false, message: "رقم الهاتف غير صحيح." });
  }
  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ fullName: name, phone: normalizedPhone })
    });
    const raw = await upstream.text();
    let result;
    try { result = JSON.parse(raw); }
    catch {
      console.error("Google Apps Script returned a non-JSON response.");
      return res.status(502).json({ ok: false, message: "خدمة التسجيل رجعت ردًا غير متوقع." });
    }
    if (result.duplicate) return res.status(409).json({ ok: false, duplicate: true, message: "رقم الهاتف مسجل بالفعل." });
    if (!result.ok) return res.status(400).json({ ok: false, message: result.message || "تعذر تسجيل البيانات." });
    return res.status(200).json({ ok: true, id: result.id, message: "تم التسجيل بنجاح." });
  } catch (error) {
    console.error("Registration upstream request failed:", error?.message || "unknown error");
    return res.status(502).json({ ok: false, message: "تعذر الاتصال بخدمة التسجيل." });
  }
}
function normalizePhone(value) {
  const arabic = "٠١٢٣٤٥٦٧٨٩", persian = "۰۱۲۳۴۵۶۷۸۹";
  return String(value).replace(/[٠-٩۰-۹]/g, c => {const a=arabic.indexOf(c);return String(a>=0?a:persian.indexOf(c));}).replace(/[\s()+.\-]/g, "");
}