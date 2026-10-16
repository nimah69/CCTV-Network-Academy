import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync("index.html", "utf8");
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
assert.ok(scripts.length > 0, "index.html must contain a JavaScript script");
const appScript = scripts.find((script) => script.includes("const chapters = window.CCTVAcademyData.chapters;"));
assert.ok(appScript, "Could not find the main application script");
new vm.Script(appScript, { filename: "index.html:inline-script" });
assert.ok(html.includes('<script src="js/calculations.js"></script>'), "Pure calculator module must be loaded by the page");
assert.ok(["poe(n,w,r)", "bandwidth(n,rate,r)", "storage(n,rate,days,10,hours,overhead)", "link(load,speed,limit)"].every((call) => appScript.includes("window.CCTVCalculations." + call)), "UI calculators must call the pure calculation module");

const dataSource = fs.readFileSync("js/academy-data.js", "utf8");
new vm.Script(dataSource, { filename: "js/academy-data.js" });
const sandbox = { window: {} };
new vm.Script(dataSource, { filename: "js/academy-data.js" }).runInNewContext(sandbox);
const chapters = sandbox.window.CCTVAcademyData.chapters;

assert.equal(chapters.length, 14, "Expected exactly 14 learning chapters");
let total = 0;
let scenarioCount = 0;
let sourceQuestionCount = 0;
let longestCorrectOptions = 0;
const answerPositions = [0, 0, 0, 0];
const generatedStemPatterns = new Set();
const uniqueQuestionTexts = new Set();

for (const [chapterIndex, chapter] of chapters.entries()) {
  assert.ok(chapter.title && chapter.title.trim(), "Chapter " + (chapterIndex + 1) + " needs a title");
  assert.equal(chapter.quiz.length, 25, 'Chapter "' + chapter.title + '" must contain exactly 25 questions');
  total += chapter.quiz.length;

  for (const [questionIndex, question] of chapter.quiz.entries()) {
    const where = 'Chapter "' + chapter.title + '", question ' + (questionIndex + 1);
    assert.ok(typeof question.q === "string" && question.q.trim().length >= 15, where + ": question text is missing");
    assert.ok(["پایه", "متوسط", "پیشرفته"].includes(question.difficulty), where + ": difficulty label is missing or invalid");
    const normalizedQuestion = question.q.trim().toLocaleLowerCase().replace(/\s+/g, " ");
    assert.ok(!uniqueQuestionTexts.has(normalizedQuestion), where + ": duplicate question text: " + question.q);
    uniqueQuestionTexts.add(normalizedQuestion);
    assert.ok(Array.isArray(question.o) && question.o.length === 4, where + ": expected four options");
    assert.equal(new Set(question.o.map((option) => String(option).trim().toLocaleLowerCase())).size, 4, where + ": options must be unique");
    assert.ok(Number.isInteger(question.a) && question.a >= 0 && question.a < 4, where + ": answer index is invalid");
    assert.ok(typeof question.e === "string" && question.e.trim().length >= 25, where + ": explanation is missing or too short; question=" + question.q);
    assert.ok(!question.e.includes("\\n"), where + ": explanation contains a literal backslash-n sequence");
    answerPositions[question.a]++;
    const optionLengths = question.o.map((option) => String(option).length);
    if (optionLengths[question.a] === Math.max(...optionLengths)) longestCorrectOptions++;

    if (question.kind === "سناریوی کاربردی" || question.kind === "سواد منبع") scenarioCount++;
    if (question.kind === "بازنویسی پرسش‌های جزوه") sourceQuestionCount++;
    if (question.kind === "تمرین مفهومی تکمیلی") {
      generatedStemPatterns.add(question.q.replace(/«.*?»/g, "«موضوع»"));
      assert.ok(!question.o.some((option) => option.includes("این موضوع فقط به نام‌گذاری تجهیزات مربوط است.")), where + ": fallback distractor found");
    }
  }
}

assert.equal(total, 350, "Expected 350 questions in total");
assert.ok(scenarioCount >= 28, "Expected at least 28 explicitly labeled applied scenarios");
assert.equal(sourceQuestionCount, 16, "All 16 source quiz questions (PDF questions 145–160) must be represented");
const sourceQuiz = chapters[12].quiz.filter((question) => question.kind === "بازنویسی پرسش‌های جزوه");
assert.equal(JSON.stringify(sourceQuiz.map((question) => question.sourceId).sort((a, b) => a - b)), JSON.stringify(Array.from({length: 16}, (_, i) => i + 145)), "Source question IDs must cover PDF questions 145–160 exactly");
const expectedSourceAnswers = new Map([[145,"Authentication"],[146,"Authorization"],[147,"RAID"],[148,"TIA-942"],[149,"IEEE 802.3af"],[150,"VLAN"],[151,"فشرده‌سازی ویدئو"],[152,"اختلاف شدید روشنایی"],[153,"نور بسیار شدید"],[154,"IR Cut"],[155,"IP6X"],[156,"غوطه‌وری موقت"],[157,"STP"],[158,"هماهنگ‌سازی زمان"],[159,"میزان داده قابل از دست رفتن"],[160,"هدف زمان بازیابی"]]);
for (const question of sourceQuiz) assert.ok(question.o[question.a].includes(expectedSourceAnswers.get(question.sourceId)), "Incorrect source answer key for PDF question " + question.sourceId);
assert.ok(generatedStemPatterns.size >= 6, "Supplemental questions should use varied stems, not one repeated template");
assert.ok(answerPositions.every((count) => count >= Math.ceil(total * 0.20) && count <= Math.floor(total * 0.30)), "Each correct-answer position must occur between 20% and 30% of the bank");
assert.ok(longestCorrectOptions <= Math.floor(total * 0.35), "The correct answer must not be the longest option in more than 35% of questions");

for (const chapterIndex of [0, 1, 2, 8]) {
  const chapter = chapters[chapterIndex];
  const supplemental = chapter.quiz.filter((question) => question.kind === "تمرین مفهومی تکمیلی");
  assert.equal(supplemental.length, 18, chapter.title + ": expected 18 rewritten supplemental questions");
  assert.equal(new Set(supplemental.map((question) => question.e)).size, supplemental.length, chapter.title + ": each supplemental question needs its own explanation");
  for (const question of supplemental) {
    assert.ok(!/^(در بررسی «|کدام اقدام برای «|اگر با موضوع «|کدام نکته در تصمیم‌گیری درباره «|برای کاهش خطا در «|کدام گزینه رابطه درست‌تری با «|در سناریوی مرتبط با «|کدام توضیح، مفهوم «)/.test(question.q), chapter.title + ": templated question stem remains");
    const lengths = question.o.map((option) => option.length);
    assert.ok(Math.max(...lengths) - Math.min(...lengths) <= 40, chapter.title + ": option lengths are too uneven for question: " + question.q);
  }
}

assert.ok(appScript.includes('const storeKey="cctvAcademyProgressV1";'), "Existing localStorage key must remain unchanged");
assert.ok(appScript.includes("function normalizeProgress"), "Legacy progress data must be normalized without discarding existing fields");
assert.ok(appScript.includes("function exportProgress") && appScript.includes("function importProgressFile"), "JSON progress export/import must be available");
assert.ok(html.includes('id="hddHours"') && html.includes('id="hddOverhead"'), "Storage calculator must expose recording-hours and overhead inputs");
assert.ok(html.includes("سطح دشواری:"), "Quiz UI must show question difficulty");
assert.ok(html.includes('id="hddResult" aria-live="polite"'), "Storage estimate must announce updated results accessibly");
assert.ok(appScript.includes("function buildComprehensiveQuiz") && appScript.includes("function shuffleQuestion"), "Randomized quiz generation must be available");
assert.ok(appScript.includes("state.progress.wrongQuestions"), "Incorrect answers must be persisted for review");
assert.ok(appScript.includes("منبع: جزوه افتا (نسخه ۴۵ صفحه‌ای)"), "Verified source and PDF page references must be displayed");
assert.ok(appScript.includes("شماره سؤال در جزوه"), "Source quiz questions must display their original PDF question numbers");
assert.equal(JSON.stringify(chapters.map((chapter) => chapter.pages)), JSON.stringify(["۱–۴","۵–۱۵","۱۶–۲۹","۳۰–۳۳","۳۳–۳۵","۳۶","۳۶–۳۷","۳۷–۳۸","۳۸–۴۰","۴۱–۴۵","۴۱–۴۲","۴۲–۴۳","۴۳–۴۴","۴۴–۴۵"]), "Chapter page references must match the 45-page source PDF");
const chapterText = (index) => [chapters[index].title, ...chapters[index].sections.flat(), ...chapters[index].supplemental.items.flat(), ...chapters[index].quiz.flatMap((question) => [question.q, ...question.o, question.e])].join(" ");
assert.match(chapterText(3), /Tamper Detection|دسترسی فیزیکی/, "Physical-security chapter must contain physical-security content");
assert.doesNotMatch(chapterText(3), /RAID/, "Backup/RAID content must not be misplaced in the physical-security chapter");
assert.match(chapterText(4), /Firmware|VPN|Firewall/, "Cybersecurity chapter must contain cybersecurity content");
assert.doesNotMatch(chapterText(4), /فیبر نوری|کابل مسی|طول کانال اترنت/, "Cabling/fiber content must not be misplaced in the cybersecurity chapter");
assert.match(chapterText(5), /RPO|RAID|Backup/, "Backup and recovery chapter must contain recovery content");
assert.doesNotMatch(chapterText(5), /فیبر نوری|کابل مسی|VPN همراه/, "Cabling/remote-access questions must not be misplaced in the backup chapter");
assert.match(chapterText(6), /تهدید|آسیب‌پذیری|Risk/, "Risk chapter must contain risk concepts");
assert.match(chapterText(7), /TIA-942|NIST|ISO/, "Standards chapter must contain standards content");
assert.match(chapterText(8), /Packet Loss|Ping|Offline/, "Troubleshooting chapter must contain diagnostic content");

const calculatorSource = fs.readFileSync("js/calculations.js", "utf8");
new vm.Script(calculatorSource, { filename: "js/calculations.js" });
const calculatorModule = { exports: {} };
const calculatorSandbox = { window: {}, module: calculatorModule };
new vm.Script(calculatorSource, { filename: "js/calculations.js" }).runInNewContext(calculatorSandbox);
const calculations = calculatorModule.exports;
assert.ok(["poe", "bandwidth", "storage", "link"].every((name) => typeof calculations[name] === "function"), "All calculator functions must be pure exported functions");

const poe = calculations.poe(8, 12, 25);
assert.equal(poe.total, 120, "PoE reference case should be 120 W");
const bandwidth = calculations.bandwidth(16, 4, 30);
assert.ok(Math.abs(bandwidth.total - 83.2) < 1e-9, "Bandwidth reference case should be 83.2 Mbps");
const storage = calculations.storage(8, 4, 14, 10);
assert.ok(Math.abs(storage.tb - 4.8384) < 1e-9, "Storage reference case should be 4.8384 TB before headroom");
assert.ok(Math.abs(storage.withHeadroom - 5.32224) < 1e-9, "Storage reference case should be 5.32224 TB with 10% headroom");
const link = calculations.link(40, 100, 70);
assert.equal(link.percent, 40, "Link occupancy should be 40%");
assert.equal(link.remaining, 60, "Remaining nominal link capacity should be 60 Mbps");
assert.equal(link.status, "status-good", "Occupancy below the warning threshold should be marked good");
assert.equal(calculations.link(80, 100, 70).status, "status-bad", "Occupancy above the design limit should be marked bad");

const figuresSource = fs.readFileSync("js/figures.js", "utf8");
new vm.Script(figuresSource, { filename: "js/figures.js" });
assert.ok(figuresSource.includes("fig-compare-title") && figuresSource.includes("fig-compare-detail"), "Comparison diagrams must separate titles and descriptions into distinct rows");
assert.ok(figuresSource.includes("max-width:420px") && figuresSource.includes("font-size:14px"), "Figure styles must include legible narrow-screen typography");
assert.ok(figuresSource.includes("Vazirmatn") && figuresSource.includes("Noto Sans Arabic"), "Figure typography must prefer Persian/Arabic-capable fonts with offline fallbacks");
assert.ok(figuresSource.includes("function wrapWords") && figuresSource.includes("function svgText"), "SVG labels must support readable multi-line wrapping");
assert.ok(figuresSource.includes("a.length*86+12") && figuresSource.includes("fig-compare-detail"), "Comparison rows must reserve separate vertical space for wrapped titles and details");
assert.ok(html.includes("Mobile visual refresh") && html.includes("font-size:16px"), "Lesson typography must remain readable on mobile");
const workshopsHtml = fs.readFileSync("workshops.html", "utf8");
assert.ok(!workshopsHtml.includes("font-size:8px") && !workshopsHtml.includes("font-size:9px"), "Workshop SVG labels must not shrink below a readable mobile size");
assert.ok(workshopsHtml.includes("Mobile diagram and typography redesign") && workshopsHtml.includes("grid-template-columns:minmax(0,1fr)"), "Workshop diagrams must stack cleanly on narrow screens");
assert.ok(workshopsHtml.includes("overflow-wrap:anywhere"), "Long diagram labels must wrap instead of causing horizontal overflow");

console.log(JSON.stringify({
  status: "passed",
  chapters: chapters.length,
  questions: total,
  scenarios: scenarioCount,
  sourceQuestions: sourceQuestionCount,
  answerPositions,
  longestCorrectOptions,
  longestCorrectPercent: Number((longestCorrectOptions / total * 100).toFixed(2)),
  generatedStemPatterns: generatedStemPatterns.size,
  calculatorCases: 5
}, null, 2));
