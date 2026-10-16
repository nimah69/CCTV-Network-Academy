import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync("index.html", "utf8");
const academyCss = fs.readFileSync("css/academy.css", "utf8");
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
assert.ok(html.includes("سطح پیشنهادی:"), "Quiz UI must show question difficulty");
assert.ok(html.includes('id="hddResult" aria-live="polite"'), "Storage estimate must announce updated results accessibly");
assert.ok(appScript.includes("function buildComprehensiveQuiz") && appScript.includes("function shuffleQuestion"), "Randomized quiz generation must be available");
assert.ok(appScript.includes("state.progress.wrongQuestions"), "Incorrect answers must be persisted for review");
assert.ok(appScript.includes("شماره صفحه PDF نیازمند تطبیق"), "Unverified PDF page numbers must be labeled as needing verification");
const auditDocument = fs.readFileSync("docs/CONTENT-AUDIT-2026-10-15.md", "utf8");
assert.match(auditDocument, /وضعیت نیازمند تطبیق/,"Content audit must clearly mark PDF page ranges as unverified");
assert.match(auditDocument, /مدرک قابل بازتولیدی/,"Content audit must disclose the lack of reproducible evidence for prior page verification");
assert.doesNotMatch(auditDocument, /شماره واقعی صفحات PDF|شماره‌ها، صفحه واقعی در PDF/,"Content audit must not state that stored page ranges are verified PDF pages");
assert.ok(!appScript.includes("منبع: جزوه افتا (نسخه ۴۵ صفحه‌ای)"), "Unverified PDF provenance must not be presented as confirmed");
assert.ok(appScript.includes("شماره سؤال در جزوه"), "Source quiz questions must display their original PDF question numbers");
assert.equal(JSON.stringify(chapters.map((chapter) => chapter.pages)), JSON.stringify(["۱–۴","۵–۱۵","۱۶–۲۹","۳۰–۳۳","۳۳–۳۵","۳۶","۳۶–۳۷","۳۷–۳۸","۳۸–۴۰","۴۱–۴۵","۴۱–۴۲","۴۲–۴۳","۴۳–۴۴","۴۴–۴۵"]), "Legacy page metadata must remain unchanged until it can be checked against the source PDF");
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

assert.ok(academyCss.includes("Mobile visual refresh") && academyCss.includes("font-size:16px"), "Lesson typography must remain readable on mobile");
const workshopsHtml = fs.readFileSync("workshops.html", "utf8");
assert.ok(!workshopsHtml.includes("font-size:8px") && !workshopsHtml.includes("font-size:9px"), "Workshop labels must not shrink below a readable mobile size");
assert.ok(workshopsHtml.includes("Mobile diagram and typography redesign") && workshopsHtml.includes("grid-template-columns:minmax(0,1fr)"), "Workshop diagrams must stack cleanly on narrow screens");
assert.ok(workshopsHtml.includes("overflow-wrap:anywhere"), "Long diagram labels must wrap instead of causing horizontal overflow");

assert.ok(workshopsHtml.includes("const flowTimers=new WeakMap()"), "Flow simulator must manage its timers independently per schematic");
assert.ok(workshopsHtml.includes('status.setAttribute("aria-live","polite")'), "Flow simulator must announce its current step accessibly");
assert.ok(workshopsHtml.includes("setInterval(showStep,1100)") && workshopsHtml.includes("clearInterval(timer)"), "Flow simulator must advance through steps and stop its timer");
assert.ok(workshopsHtml.includes('node.classList.add("flow-active")') && workshopsHtml.includes(".schematic-node.flow-active rect"), "Flow simulator must visibly highlight the current device");
assert.ok(workshopsHtml.includes("مسیر آموزشی کامل شد"), "Flow simulator must announce when the data path is complete");


assert.match(appScript, /function updateLessonProgress\(\)/, "Lesson reading progress must update as the user scrolls");
assert.match(appScript, /function restoreStudyPosition\(p\)/, "Saved lesson position must be restored after navigation or reload");
assert.match(appScript, /sectionOffset/, "Study position must retain a section-relative fallback");
assert.match(html, /id="lessonProgress"/, "Lesson view must expose a sticky progress indicator");
assert.match(html, /id="lessonProgressBar"/, "Lesson progress bar must be present");
assert.match(html, /id="lessonSectionLabel"/, "Current lesson section must be identified");
assert.match(academyCss, /\.lesson-progress-sticky\{position:sticky;top:76px/, "Lesson progress must stick below the desktop header");
assert.match(academyCss, /@media\(max-width:850px\)\{\.lesson-progress-sticky\{top:66px/, "Lesson progress must stick below the mobile header");
assert.match(academyCss, /\.bottom-nav \[data-view\]\.active/, "Mobile navigation must visibly indicate the current view");
assert.match(html, /function chapterOneLearningHTML\(\)/, "Chapter one must use the new card-based visual learning experience");
assert.match(html, /function chapterLearningTemplate\(chapter,chapterIndex\)/, "All chapters must use a shared outer learning template");
assert.match(html, /function chapterOneStepContent\(step\)/, "Chapter one must provide explanatory step-by-step guidance");
assert.match(html, /function setChapterOneStep\(step\)/, "Chapter one step navigation must be interactive");
assert.match(html, /function runChapterOneScenario\(kind\)/, "Chapter one must provide a scenario-based diagnostic interaction");
assert.match(html, /data-ch1-scenario="ping"/, "The diagnostic mission must include a successful-ping/no-image scenario");
assert.match(html, /data-ch1-step="2"/, "The learning flow must expose all three steps");
assert.match(html, /aria-live="polite"/, "Interactive feedback must be announced accessibly");
assert.match(html, /این یک شبیه‌سازی آموزشی است/, "The interface must distinguish simulated guidance from real device measurements");
assert.match(academyCss, /\.ch1-equipment-grid\{grid-template-columns:1fr\}/, "Equipment cards must stack on narrow mobile screens");
assert.match(academyCss, /\.ch1-scenario-options\{grid-template-columns:1fr\}/, "Scenario options must stack on narrow mobile screens");
const ch1Start = html.indexOf("function chapterOneLearningHTML()");
const ch1End = html.indexOf("function lessonHTML()", ch1Start);
assert.ok(ch1Start >= 0 && ch1End > ch1Start, "Could not isolate the chapter-one visual learning renderer");
const ch1Renderer = html.slice(ch1Start, ch1End);
assert.doesNotMatch(ch1Renderer, /<svg\b|<table\b|https?:\/\//i, "The new chapter-one experience must avoid SVG/table diagrams and external dependencies");
assert.ok(["دوربین IP","سوئیچ (Switch)","مسیریاب (Router)","ضبط‌کننده / NVR"].every(label => ch1Renderer.includes(label)), "Equipment cards must explain the four core network roles");



assert.match(html, /class="mission-card"/, "Chapter one must use the reusable MissionCard component");
assert.match(html, /class="step-list"/, "Chapter one must use the reusable StepList component");
assert.match(html, /class="compare-card"/, "Chapter one must compare Switch and Router with reusable cards");
assert.match(html, /function chooseChapterOneAction\(action\)/, "Mission actions must return interactive feedback");
assert.match(html, /data-ch1-action="service"/, "The mission must offer a technically sound first action");
assert.match(html, /status:"success"/, "Mission feedback must support semantic status styling");
assert.match(html, /Switch|سوئیچ \(Switch\)/, "Chapter one must explain the switch role");
assert.match(html, /Router|مسیریاب \(Router\)/, "Chapter one must explain the router role");
assert.match(html, /function chapterVisualLearningHTML\(c,chapterIndex\)/, "Every non-first chapter must use the shared visual learning renderer");
assert.match(html, /function quizHTML\(comprehensive=false\)/, "Quizzes must render one question per page");
assert.match(html, /function selectQuizAnswer\(index,value\)/, "Answers must trigger immediate feedback");
assert.match(html, /quiz-progress-meta/, "Quiz progress must be visible");
assert.match(html, /function nextQuizQuestion\(/, "Quiz navigation must include a next action");
assert.match(html, /chapterLearningTemplate\(c,state\.chapter\)/, "All chapter lessons must render through the shared learning template");
assert.match(html, /function setChapterVisualStep\(step\)/, "All-chapter step navigation must work");
assert.match(html, /function checkChapterVisualAnswer\(choice,questionIndex=5\)/, "Review and quick-challenge answers must select the correct question");
const guidedRenderer = html.slice(html.indexOf("function chapterVisualStepHTML"), html.indexOf("function setChapterVisualStep"));
assert.ok(guidedRenderer.includes("const q=(c.quiz||[])[step]"), "Guided review must use quiz questions, not repeat concept explanations");
assert.ok(!guidedRenderer.includes("esc(s[1])"), "Guided review must not render the same explanatory text as key concepts");
assert.ok(guidedRenderer.includes("data-cv-question") && guidedRenderer.includes("cv-review-feedback-"), "Each guided-review question must have isolated answer state and feedback");
assert.ok(html.includes("const q=c.quiz&&c.quiz[5];"), "The quick challenge must use a different question from the guided review");
assert.match(html, /cv-concept-grid/, "Chapter concepts must be presented as responsive cards");
assert.match(html, /aria-live="polite"/, "Chapter learning feedback must be announced accessibly");
assert.match(html, /این بخش ابزار آموزشی است/, "The shared chapter module must disclose simulation limitations");
assert.match(academyCss, /\.cv-concept-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/, "Concept cards must use a responsive grid");
assert.match(academyCss, /@media\(max-width:620px\)\{\.cv-concept-grid,\.cv-answer-grid\{grid-template-columns:minmax\(0,1fr\)\}/, "Visual concept cards must stack on mobile");

assert.match(academyCss, /\.chapter-visual \.cv-concept summary b,/, "Visual card titles must explicitly set a readable foreground color");
assert.ok(academyCss.includes(".chapter-visual .cv-answer-grid button { background: #ffffff;") && academyCss.includes(".chapter-visual .cv-answer-grid button.chosen { background: #f1f2ff; color: #172033; }"), "White answer cards must use dark readable text");
const lessonRendererStart = appScript.indexOf("function lessonHTML()");
const lessonRendererEnd = appScript.indexOf("function legacyChapterLabHTML", lessonRendererStart);
const lessonRenderer = appScript.slice(lessonRendererStart, lessonRendererEnd);
const visibleTemplateIndex = lessonRenderer.indexOf("chapterLearningTemplate(c,state.chapter)");
const collapsedTextIndex = lessonRenderer.indexOf('<details class="micro-full-content">');
assert.ok(visibleTemplateIndex >= 0 && collapsedTextIndex > visibleTemplateIndex, "The redesigned chapter learning module must appear before the collapsed full-text section");
assert.equal(lessonRenderer.split("chapterLearningTemplate(c,state.chapter)").length - 1, 1, "The redesigned learning module must not be duplicated inside the collapsed full-text section");
assert.ok(lessonRenderer.includes("نمایش متن کامل فصل و توضیحات تکمیلی"), "The collapsed section label must accurately describe its remaining contents");
assert.match(appScript, /function studyHeadings\(\)/, "Study progress must track headings in the visible redesign and expanded text");
assert.match(appScript, /const lab=\(window\.CCTVChapterLabs&&window\.CCTVChapterLabs\[chapterIndex\]\|\|\[\]\)\[0\]/, "Each redesigned chapter must use its own practical lab scenario");
assert.match(appScript, /cv-mission-preview/, "Non-first chapters must expose a chapter-specific practical mission preview");
assert.ok(appScript.includes("شروع مأموریت در آزمایشگاه فصل") && appScript.includes("chapterIndex+\')"), "The mission preview must include a chapter-specific lab action");
assert.ok(academyCss.includes(".chapter-visual .cv-section-head p { color: #596579; }"), "Muted section descriptions must retain readable contrast");


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
