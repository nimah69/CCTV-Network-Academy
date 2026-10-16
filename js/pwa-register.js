(function () {
  "use strict";
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol !== "https:" && location.hostname !== "localhost") return;
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("./service-worker.js", { scope: "./" })
      .catch(function (error) {
        console.warn("آماده‌سازی حالت آفلاین انجام نشد؛ سایت آنلاین همچنان قابل استفاده است.", error);
      });
  });
})();
