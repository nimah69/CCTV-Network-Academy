const DEVICES = new Set(["router", "switch", "camera", "nvr", "monitor", "ups"]);
const LINKS = new Set(["router-switch", "switch-camera", "switch-nvr", "nvr-monitor", "router-camera", "switch-switch"]);
const SWITCH_PORTS = new Set([8, 16, 24, 48]);

export function normalizeTopologyConfig(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("ساختار فایل سناریو معتبر نیست.");
  }
  if (value.schemaVersion !== 1) throw new Error("نسخه فایل سناریو پشتیبانی نمی‌شود.");
  if (!Array.isArray(value.equipment) || !Array.isArray(value.links)) {
    throw new Error("فهرست تجهیزات یا اتصال‌ها وجود ندارد.");
  }
  const validateIds = (items, allowed, label) => {
    if (items.some(item => typeof item !== "string" || !allowed.has(item))) {
      throw new Error(label + " شامل مقدار ناشناخته است.");
    }
    if (new Set(items).size !== items.length) throw new Error(label + " مقدار تکراری دارد.");
    return [...items];
  };
  const equipment = validateIds(value.equipment, DEVICES, "تجهیزات");
  const links = validateIds(value.links, LINKS, "اتصال‌ها");
  const cameraCount = Number(value.cameraCount);
  if (!Number.isInteger(cameraCount) || cameraCount < 1 || cameraCount > 256) {
    throw new RangeError("تعداد دوربین باید عدد صحیحی بین ۱ تا ۲۵۶ باشد.");
  }
  const switchPorts = Number(value.switchPorts);
  if (!SWITCH_PORTS.has(switchPorts)) {
    throw new RangeError("تعداد پورت سوئیچ باید ۸، ۱۶، ۲۴ یا ۴۸ باشد.");
  }
  return { schemaVersion: 1, equipment, links, cameraCount, switchPorts };
}

export function readTopologyConfig(root = document) {
  const checked = selector => [...root.querySelectorAll(selector + " input:checked")].map(input => input.value);
  return normalizeTopologyConfig({
    schemaVersion: 1,
    equipment: checked("#equipmentChecks"),
    links: checked("#linkChecks"),
    cameraCount: Number(root.querySelector("#camCount")?.value),
    switchPorts: Number(root.querySelector("#switchPorts")?.value)
  });
}

export function applyTopologyConfig(config, root = document) {
  const safe = normalizeTopologyConfig(config);
  for (const selector of ["#equipmentChecks", "#linkChecks"]) {
    const selected = new Set(selector === "#equipmentChecks" ? safe.equipment : safe.links);
    for (const input of root.querySelectorAll(selector + " input[type=checkbox]")) {
      input.checked = selected.has(input.value);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
  root.querySelector("#camCount").value = String(safe.cameraCount);
  root.querySelector("#switchPorts").value = String(safe.switchPorts);
  root.querySelector("#camCount").dispatchEvent(new Event("change", { bubbles: true }));
  root.querySelector("#switchPorts").dispatchEvent(new Event("change", { bubbles: true }));
  root.querySelector("#checkTopology").click();
  return safe;
}

function initTopologyScenarioIO() {
  const status = document.querySelector("#topologyScenarioStatus");
  const fileInput = document.querySelector("#topologyScenarioFile");
  const say = (message, isError = false) => {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("bad", isError);
    status.classList.toggle("good", !isError);
  };
  document.querySelector("#exportTopologyScenario")?.addEventListener("click", () => {
    try {
      const config = readTopologyConfig();
      const blob = new Blob([JSON.stringify(config, null, 2) + "\n"], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "cctv-topology-scenario.json";
      anchor.hidden = true;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      say("سناریوی فعلی به‌صورت JSON آماده و ذخیره شد.");
    } catch (error) {
      say(error.message || "ذخیره سناریو ناموفق بود.", true);
    }
  });
  document.querySelector("#importTopologyScenario")?.addEventListener("click", () => fileInput?.click());
  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      if (file.size > 100_000) throw new Error("حجم فایل سناریو نباید بیشتر از ۱۰۰ کیلوبایت باشد.");
      const parsed = JSON.parse(await file.text());
      applyTopologyConfig(parsed);
      say("سناریو بارگذاری شد؛ نقشه و تحلیل طراحی به‌روزرسانی شدند.");
    } catch (error) {
      say(error.message || "فایل سناریو قابل بارگذاری نیست.", true);
    } finally {
      fileInput.value = "";
    }
  });
}
if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initTopologyScenarioIO, { once: true });
  else initTopologyScenarioIO();
}
