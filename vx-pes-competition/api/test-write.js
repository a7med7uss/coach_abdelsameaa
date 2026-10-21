// TEMPORARY, one-time registration verification endpoint. Remove after the test.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, message: "Method not allowed." });
  }
  const given = String(req.query?.token || "");
  const expected = String(process.env.VX_TEMP_TEST_TOKEN || "");
  if (!expected || given.length !== expected.length || given !== expected) {
    return res.status(404).json({ ok: false, message: "Not found." });
  }
  const endpoint = process.env.GOOGLE_SCRIPT_URL;
  if (!endpoint) return res.status(503).json({ ok: false, message: "GOOGLE_SCRIPT_URL is not configured." });

  const record = { fullName: "اختبار ربط VX", phone: "01000000000" };
  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8", "Accept": "application/json" },
      body: JSON.stringify(record),
      cache: "no-store"
    });
    const raw = await upstream.text();
    let data;
    try { data = JSON.parse(raw); }
    catch (error) {
      return res.status(502).json({
        ok: false,
        code: "UPSTREAM_NOT_JSON",
        status: upstream.status,
        contentType: upstream.headers.get("content-type") || "unknown",
        redirectedHost: (() => { try { return new URL(upstream.url).host; } catch { return "unknown"; } })(),
        message: "Google returned a non-JSON response. No successful test was confirmed."
      });
    }
    if (data.duplicate) {
      return res.status(200).json({
        ok: true,
        outcome: "duplicate",
        testName: record.fullName,
        testPhone: record.phone,
        message: "This test phone was already registered; no new row was added."
      });
    }
    if (!data.ok) {
      return res.status(502).json({ ok: false, message: data.message || "Google did not confirm the test registration." });
    }
    return res.status(200).json({
      ok: true,
      outcome: "saved",
      testName: record.fullName,
      testPhone: record.phone,
      status: upstream.status,
      redirectedHost: (() => { try { return new URL(upstream.url).host; } catch { return "unknown"; } })(),
      message: "Google Apps Script confirmed the test registration."
    });
  } catch (error) {
    return res.status(502).json({
      ok: false,
      code: String(error?.cause?.code || error?.name || "NETWORK_ERROR").slice(0, 80),
      message: "The test request could not reach Google Apps Script."
    });
  }
}
