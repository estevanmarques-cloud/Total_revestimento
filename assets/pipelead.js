(function () {
  "use strict";
  var endpoint = "https://app.pipelead.to/webhook/lead/Nswh3rF8rc";
  var keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id", "campaign_id", "adset_id", "ad_id", "fbclid"];
  var params = new URLSearchParams(window.location.search);
  var entry = { current_uri: window.location.href, referrer_uri: document.referrer || "" };
  keys.forEach(function (key) { var value = params.get(key); if (value) entry[key] = value; });
  function cookie(name) {
    var item = document.cookie.split(";").map(function (part) { return part.trim(); }).find(function (part) { return part.indexOf(name + "=") === 0; });
    if (!item) return "";
    try { return decodeURIComponent(item.slice(name.length + 1)); } catch (_) { return item.slice(name.length + 1); }
  }
  // Preserve the entry URL before routers or other scripts can alter it.
  var storageKey = "total_pipelead_attribution_v1";
  try {
    var stored = JSON.parse(sessionStorage.getItem(storageKey) || "null");
    var hasCampaign = keys.some(function (key) { return !!params.get(key); });
    if (!hasCampaign && stored && typeof stored.current_uri === "string") entry = stored;
    sessionStorage.setItem(storageKey, JSON.stringify(entry));
  } catch (_) {}
  function metadata() {
    var result = Object.assign({}, entry);
    var fbc = cookie("_fbc"), fbp = cookie("_fbp");
    if (fbc) result.fbc = fbc;
    else if (entry.fbclid) result.fbc = "fb.1." + capturedAt + "." + entry.fbclid;
    if (fbp) result.fbp = fbp;
    return result;
  }
  var capturedAt = Date.now();
  window.totalPipelead = {
    metadata: metadata,
    send: async function (data) {
      var payload = Object.assign({}, data);
      keys.concat(["pagina_url"]).forEach(function (key) { delete payload[key]; });
      payload.metadata = metadata();
      var response = await fetch(endpoint, {
        method: "POST", mode: "cors", credentials: "omit",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload), signal: AbortSignal.timeout(25000)
      });
      if (!response.ok) throw new Error("Pipelead HTTP " + response.status);
      var result = null;
      if ((response.headers.get("content-type") || "").includes("application/json")) result = await response.json();
      if (result && (result.success === false || result.ok === false || result.error)) throw new Error("Pipelead recusou o envio");
      return result;
    }
  };
})();
