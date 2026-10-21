// Vercel serverless endpoint: /api/register
// Set GOOGLE_SCRIPT_URL in Vercel Project Settings > Environment Variables.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  const endpoint = process.env.GOOGLE_SCRIPT_URL;

  if (req.method === "GET") {
    if (!endpoint || !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(endpoint)) {
      return res.status(503).json({ ok: false, code: "NOT_CONFIGURED", message: "رابط التسجيل غير مضبوط." });
    }
    try {
      const healthResponse = await fetch(endpoint, {
        method: "GET",
        redirect: "follow",
        headers: { "Accept": "application/json" },
        cache: "no-store"
      });
      const rawHealth = await healthResponse.text();
      let health;
      try { health = JSON.parse(rawHealth); } catch (error) { health = null; }
      const healthy = Boolean(healthResponse.ok && health && health.ok === true && health.service === "مسابقة بيس VX");
      console.log("Registration health check", {
        route: "ready",
        googleAppsScript: healthy ? "reachable" : "unhealthy",
        upstreamStatus: healthResponse.status,
        contentType: healthResponse.headers.get("content-type") || "unknown",
        redirected: healthResponse.redirected,
        responseLooksLikeJson: Boolean(health)
      });
      return res.status(200).json({
        ok: healthy,
        service: "مسابقة بيس VX",
        registrationRoute: "ready",
        googleAppsScript: healthy ? "reachable" : "unhealthy",
        upstreamStatus: healthResponse.status,
        upstreamContentType: healthResponse.headers.get("content-type") || "unknown",
        upstreamRedirected: healthResponse.redirected,
        upstreamHost: safeHost(healthResponse.url),
        responseLooksLikeJson: Boolean(health),
        message: healthy
          ? "الاتصال بخدمة التسجيل جاهز. لم يُضف هذا الفحص تسجيلًا."
          : "Google Apps Script رجّع ردًا غير متوقع بدل JSON. راجع إتاحة تطبيق الويب لأي شخص، وتأكد أن doGet في النسخة المنشورة يرجع JSON."
      });
    } catch (error) {
      const errorName = String(error?.name || "Error").slice(0, 80);
      const errorMessage = String(error?.message || "unknown error").slice(0, 240);
      const causeCode = String(error?.cause?.code || "").slice(0, 80);
      console.error("Apps Script health request failed", {
        errorName,
        errorMessage,
        causeCode
      });
      return res.status(200).json({
        ok: false,
        service: "مسابقة بيس VX",
        registrationRoute: "ready",
        googleAppsScript: "network_error",
        upstreamErrorName: errorName,
        upstreamErrorMessage: errorMessage,
        upstreamCauseCode: causeCode || null,
        message: "وظيفة الموقع تعمل، لكن الاتصال بخدمة Google تعطل. تفاصيل الخطأ مرفقة للتشخيص."
      });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, message: "طريقة الطلب غير مسموحة." });
  }
  if (!endpoint || !/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(endpoint)) {
    return res.status(503).json({ ok: false, code: "NOT_CONFIGURED", message: "لم يتم إعداد رابط Google Apps Script بعد." });
  }
  let body = req.body;
  if (Buffer.isBuffer(body)) body = body.toString("utf8");
  if (typeof body === "string") {
    try { body = JSON.parse(body); }
    catch (error) { return res.status(400).json({ ok: false, message: "بيانات الطلب غير مفهومة." }); }
  }
  const { fullName, phone } = body && typeof body === "object" ? body : {};
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