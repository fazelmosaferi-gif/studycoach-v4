"use strict";

/* =========================================================
   STUDYCOACH FINAL
   100% LOCAL / FREE / NO API
========================================================= */

const DB_KEY = "StudyCoach_FINAL_DATABASE";
const THEME_KEY = "StudyCoach_FINAL_THEME";

/* =========================================================
   DEFAULT DATABASE
========================================================= */

const DEFAULT_DB = {
  version: 1,

  profile: {
    name: "",
    goal: "پزشکی",
    examDate: "",
    dailyHours: 8,
    startTime: "07:00",
    breakMinutes: 15
  },

  subjects: [
    {
      id: "bio",
      name: "زیست",
      level: 3,
      priority: 5,
      color: "green"
    },
    {
      id: "chem",
      name: "شیمی",
      level: 2,
      priority: 5,
      color: "blue"
    },
    {
      id: "math",
      name: "ریاضی",
      level: 2,
      priority: 4,
      color: "purple"
    },
    {
      id: "phys",
      name: "فیزیک",
      level: 3,
      priority: 4,
      color: "orange"
    }
  ],

  topics: [],
  plans: [],
  sessions: [],
  tests: [],
  mistakes: [],
  reviews: [],
  exams: [],
  messages: [],
  goals: [],
  achievements: [],

  xp: 0,
  streak: 0,
  lastStudyDate: "",
  createdAt: new Date().toISOString()
};

let DB = loadDatabase();

let currentPage = "home";

let TIMER = {
  seconds: 0,
  running: false,
  interval: null,
  subject: "",
  topic: ""
};

/* =========================================================
   DATABASE
========================================================= */

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadDatabase() {

  try {

    const saved =
      localStorage.getItem(DB_KEY);

    if (!saved) {
      return clone(DEFAULT_DB);
    }

    const data = JSON.parse(saved);

    return mergeDatabase(
      clone(DEFAULT_DB),
      data
    );

  } catch (error) {

    console.error(error);

    return clone(DEFAULT_DB);
  }
}

function mergeDatabase(base, data) {

  if (!data || typeof data !== "object") {
    return base;
  }

  Object.keys(base).forEach(key => {

    if (
      data[key] !== undefined &&
      data[key] !== null
    ) {
      base[key] = data[key];
    }

  });

  return base;
}

function saveDatabase() {

  try {

    localStorage.setItem(
      DB_KEY,
      JSON.stringify(DB)
    );

  } catch (error) {

    console.error(
      "Could not save database",
      error
    );

    toast("فضای ذخیره‌سازی کافی نیست");
  }
}

/* =========================================================
   HELPERS
========================================================= */

function uid() {

  if (
    typeof crypto !== "undefined" &&
    crypto.randomUUID
  ) {
    return crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .substring(2)
  );
}

function today() {

  const d = new Date();

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
}

function dateObject(dateString) {

  if (!dateString) {
    return new Date();
  }

  const p =
    dateString.split("-").map(Number);

  return new Date(
    p[0],
    p[1] - 1,
    p[2]
  );
}

function fa(value) {

  return String(value)
    .replace(
      /\d/g,
      d => "۰۱۲۳۴۵۶۷۸۹"[d]
    );
}

function escapeHTML(value) {

  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[c])
    );
}

function minutesText(minutes) {

  minutes = Math.max(
    0,
    Math.round(Number(minutes) || 0)
  );

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h > 0) {
    return `${fa(h)} ساعت ${fa(m)} دقیقه`;
  }

  return `${fa(m)} دقیقه`;
}

function shortTime(minutes) {

  minutes = Math.max(
    0,
    Math.round(minutes || 0)
  );

  return (
    String(Math.floor(minutes / 60) % 24)
      .padStart(2, "0") +
    ":" +
    String(minutes % 60)
      .padStart(2, "0")
  );
}

function toMinutes(time) {

  const parts =
    String(time || "07:00")
      .split(":")
      .map(Number);

  return (
    (parts[0] || 0) * 60 +
    (parts[1] || 0)
  );
}

function average(numbers) {

  if (!numbers.length) {
    return null;
  }

  return Math.round(
    numbers.reduce(
      (a, b) => a + Number(b || 0),
      0
    ) / numbers.length
  );
}

function clamp(value, min, max) {

  return Math.max(
    min,
    Math.min(max, value)
  );
}

function toast(message) {

  const element =
    document.getElementById("toast");

  if (!element) return;

  element.textContent = message;

  element.classList.add("show");

  clearTimeout(
    toast.timeout
  );

  toast.timeout =
    setTimeout(() => {
      element.classList.remove("show");
    }, 1800);
}

/* =========================================================
   BASIC STATS
========================================================= */

function studyMinutes(date = today()) {

  return DB.sessions
    .filter(x => x.date === date)
    .reduce(
      (sum, x) =>
        sum + Number(x.minutes || 0),
      0
    );
}

function testCount(date = today()) {

  return DB.tests
    .filter(x => x.date === date)
    .reduce(
      (sum, x) =>
        sum + Number(x.count || 0),
      0
    );
}

function testAccuracy(date = today()) {

  const tests =
    DB.tests.filter(
      x => x.date === date
    );

  if (!tests.length) {
    return null;
  }

  return average(
    tests.map(
      x => Number(x.accuracy || 0)
    )
  );
}

function totalStudyMinutes() {

  return DB.sessions.reduce(
    (sum, x) =>
      sum + Number(x.minutes || 0),
    0
  );
}

function totalTests() {

  return DB.tests.reduce(
    (sum, x) =>
      sum + Number(x.count || 0),
    0
  );
}

function overallAccuracy() {

  if (!DB.tests.length) {
    return null;
  }

  return average(
    DB.tests.map(
      x => Number(x.accuracy || 0)
    )
  );
}

function daysUntilExam() {

  if (!DB.profile.examDate) {
    return null;
  }

  const exam =
    dateObject(DB.profile.examDate);

  const now = new Date();

  exam.setHours(23,59,59,999);

  return Math.max(
    0,
    Math.ceil(
      (exam - now) /
      86400000
    )
  );
}

/* =========================================================
   SUBJECT ANALYSIS
========================================================= */

function subjectTests(subject) {

  return DB.tests.filter(
    x => x.subject === subject.name
  );
}

function subjectSessions(subject) {

  return DB.sessions.filter(
    x => x.subject === subject.name
  );
}

function subjectMistakes(subject) {

  return DB.mistakes.filter(
    x => x.subject === subject.name
  );
}

function subjectAccuracy(subject) {

  const tests =
    subjectTests(subject);

  if (!tests.length) {
    return null;
  }

  return average(
    tests.map(
      x => Number(x.accuracy || 0)
    )
  );
}

function subjectStudy(subject) {

  return subjectSessions(subject)
    .reduce(
      (sum, x) =>
        sum + Number(x.minutes || 0),
      0
    );
}

function subjectScore(subject) {

  const accuracy =
    subjectAccuracy(subject);

  const mistakes =
    subjectMistakes(subject).length;

  let score =
    accuracy === null
      ? 45 + subject.level * 8
      : accuracy;

  score += subject.level * 3;
  score += subject.priority * 2;
  score -= mistakes * 2;

  return clamp(
    Math.round(score),
    0,
    100
  );
}

function weakestSubject() {

  return DB.subjects
    .map(subject => ({
      subject,
      score: subjectScore(subject)
    }))
    .sort(
      (a,b) => a.score - b.score
    )[0]?.subject || DB.subjects[0];
}

/* =========================================================
   ADAPTIVE COACH
========================================================= */

function coachDecision() {

  if (!DB.profile.name) {

    return {
      title: "پروفایل را کامل کن",
      text:
        "نام، هدف و ساعت مطالعه روزانه را ثبت کن تا مشاور شخصی‌سازی شود."
    };
  }

  const target =
    Number(DB.profile.dailyHours || 8) * 60;

  const studied =
    studyMinutes();

  const accuracy =
    testAccuracy();

  const pendingPlans =
    DB.plans.filter(
      x =>
        x.date === today() &&
        !x.done
    );

  const dueReviews =
    DB.reviews.filter(
      x =>
        !x.done &&
        x.date <= today()
    );

  const weak =
    weakestSubject();

  const weakScore =
    subjectScore(weak);

  if (dueReviews.length) {

    return {
      title: "مرور در اولویت است 🔄",
      text:
        `${fa(dueReviews.length)} مرور سررسید شده داری. ` +
        "قبل از اضافه‌کردن حجم جدید، مرورهای مهم را انجام بده."
    };
  }

  if (
    accuracy !== null &&
    accuracy < 50
  ) {

    return {
      title: "کیفیت مهم‌تر از حجم است ⚠️",
      text:
        `دقت امروز ${fa(accuracy)}٪ است. ` +
        "فعلاً تست بیشتر اضافه نکن؛ غلط‌ها را تحلیل و همان مبحث را مرور کن."
    };
  }

  if (
    studied < target * 0.35 &&
    new Date().getHours() >= 14
  ) {

    return {
      title: "شروع فوری 🚀",
      text:
        `امروز فقط ${minutesText(studied)} مطالعه ثبت شده. ` +
        "یک جلسه کوتاه ۳۰ تا ۴۵ دقیقه‌ای را همین حالا شروع کن."
    };
  }

  if (weakScore < 55) {

    return {
      title: "نقطه ضعف شناسایی شد 🎯",
      text:
        `${weak.name} فعلاً ضعیف‌ترین درس توست. ` +
        "یک جلسه رفع ضعف برای آن در برنامه قرار بده."
    };
  }

  if (pendingPlans.length) {

    const p =
      pendingPlans[0];

    return {
      title: "قدم بعدی 📌",
      text:
        `${p.subject} — ${p.topic} ` +
        `(${fa(p.duration)} دقیقه)`
    };
  }

  if (studied >= target * 0.9) {

    return {
      title: "هدف امروز تقریباً کامل شد 🏆",
      text:
        "مرور اشتباهات را انجام بده و سپس مطالعه سنگین جدید اضافه نکن."
    };
  }

  return {
    title: "ادامه بده 💪",
    text:
      "جلسه بعدی را شروع کن و نتیجه را ثبت کن تا تصمیم مشاور دقیق‌تر شود."
  };
}

/* =========================================================
   PAGE ROUTER
========================================================= */

function navigate(page) {

  currentPage = page;

  document
    .querySelectorAll(".nav-item")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page === page
      );

    });

  const pages = {
    home: renderHome,
    coach: renderCoach,
    plan: renderPlan,
    study: renderStudy,
    tests: renderTests,
    mistakes: renderMistakes,
    analytics: renderAnalytics,
    settings: renderSettings
  };

  if (pages[page]) {
    pages[page]();
  } else {
    renderHome();
  }

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });
}

/* =========================================================
   HOME
========================================================= */

function renderHome() {

  const app =
    document.getElementById("app");

  const studied =
    studyMinutes();

  const target =
    Number(DB.profile.dailyHours || 8) * 60;

  const progress =
    clamp(
      Math.round(
        studied /
        Math.max(1,target) *
        100
      ),
      0,
      100
    );

  const accuracy =
    testAccuracy();

  const decision =
    coachDecision();

  app.innerHTML = `

    <section class="card hero">

      <div>

        <span class="pill">
          StudyCoach FINAL
        </span>

        <h2>
          ${
            DB.profile.name
              ? `سلام ${escapeHTML(DB.profile.name)} 👋`
              : "سلام 👋"
          }
        </h2>

        <p class="muted">
          هدف:
          ${escapeHTML(DB.profile.goal || "تعیین نشده")}
        </p>

        <div class="offline-status">
          <i class="offline-dot"></i>
          کاملاً محلی و رایگان
        </div>

      </div>

      <div class="hero-score">

        <strong>
          ${fa(progress)}٪
        </strong>

        <span>
          پیشرفت امروز
        </span>

      </div>

    </section>


    <section class="grid grid-4">

      ${statCard(
        minutesText(studied),
        "مطالعه امروز"
      )}

      ${statCard(
        fa(testCount()),
        "تست امروز"
      )}

      ${statCard(
        accuracy === null
          ? "—"
          : fa(accuracy) + "٪",
        "دقت امروز"
      )}

      ${statCard(
        daysUntilExam() === null
          ? "—"
          : fa(daysUntilExam()),
        "روز تا آزمون"
      )}

    </section>


    <section class="card">

      <div class="card-title">

        <h3>
          📅 برنامه امروز
        </h3>

        <button
          class="primary"
          onclick="smartPlan()"
        >
          برنامه هوشمند
        </button>

      </div>

      ${todayPlansHTML()}

    </section>


    <section class="card">

      <div class="card-title">

        <h3>
          🧠 تصمیم مشاور
        </h3>

        <span class="badge">
          تطبیقی
        </span>

      </div>

      <div class="advice">

        <div class="advice-title">
          ${escapeHTML(decision.title)}
        </div>

        <div>
          ${escapeHTML(decision.text)}
        </div>

      </div>

    </section>


    <section class="card">

      <div class="card-title">
        <h3>⚡ دسترسی سریع</h3>
      </div>

      <div class="quick-grid">

        <button
          class="quick-action"
          onclick="navigate('study')"
        >
          <span>⏱️</span>
          <small>شروع مطالعه</small>
        </button>

        <button
          class="quick-action"
          onclick="navigate('tests')"
        >
          <span>📝</span>
          <small>ثبت تست</small>
        </button>

        <button
          class="quick-action"
          onclick="navigate('mistakes')"
        >
          <span>⚠️</span>
          <small>اشتباهات</small>
        </button>

      </div>

    </section>


    <section class="card">

      <div class="card-title">
        <h3>🔄 مرورهای امروز</h3>
      </div>

      ${reviewsHTML()}

    </section>


    <section class="card">

      <div class="card-title">
        <h3>🏆 وضعیت انگیزشی</h3>
      </div>

      <div class="grid grid-3">

        ${statCard(
          fa(DB.xp || 0),
          "XP"
        )}

        ${statCard(
          "🔥 " + fa(DB.streak || 0),
          "Streak"
        )}

        ${statCard(
          levelFromXP(),
          "Level"
        )}

      </div>

    </section>
  `;
}

function statCard(value,label) {

  return `
    <div class="card stat-card">
      <strong>${value}</strong>
      <span>${label}</span>
    </div>
  `;
}

function todayPlansHTML() {

  const list =
    DB.plans.filter(
      x => x.date === today()
    );

  if (!list.length) {

    return `
      <div class="empty">
        برنامه‌ای برای امروز وجود ندارد.
        <br>
        روی «برنامه هوشمند» بزن.
      </div>
    `;
  }

  return `
    <div class="list">

      ${list.map(plan => `

        <div class="item ${plan.done ? "done" : ""}">

          <span class="dot ${
            plan.done ? "green" : ""
          }"></span>

          <div class="item-main">

            <strong>
              ${escapeHTML(plan.start)}
              ·
              ${escapeHTML(plan.subject)}
            </strong>

            <small>
              ${escapeHTML(plan.topic)}
              ·
              ${fa(plan.duration)}
              دقیقه
              ·
              ${escapeHTML(plan.type)}
            </small>

          </div>

          <div class="item-actions">

            <button
              onclick="togglePlan('${plan.id}')"
            >
              ${plan.done ? "✓" : "انجام شد"}
            </button>

          </div>

        </div>

      `).join("")}

    </div>
  `;
}

/* =========================================================
   SMART PLANNER
========================================================= */

function smartPlan() {

  if (!DB.profile.name) {

    toast(
      "ابتدا پروفایل را کامل کن"
    );

    navigate("settings");

    return;
  }

  DB.plans =
    DB.plans.filter(
      x => x.date !== today()
    );

  const target =
    Math.max(
      120,
      Number(DB.profile.dailyHours || 8) * 60
    );

  let current =
    toMinutes(
      DB.profile.startTime || "07:00"
    );

  let used = 0;

  const subjects =
    DB.subjects
      .map(subject => ({
        subject,
        score: subjectScore(subject)
      }))
      .sort(
        (a,b) =>
          (
            100-a.score +
            a.subject.priority*8
          ) -
          (
            100-b.score +
            b.subject.priority*8
          )
      );

  let index = 0;

  while (
    used + 45 <= target &&
    index < 30
  ) {

    const item =
      subjects[index % subjects.length];

    const subject =
      item.subject;

    let duration;

    if (item.score < 50) {
      duration = 75;
    } else if (item.score < 70) {
      duration = 60;
    } else {
      duration = 50;
    }

    duration =
      Math.min(
        duration,
        target-used
      );

    if (duration < 45) {
      break;
    }

    let type;

    if (item.score < 55) {
      type = "رفع ضعف";
    } else if (index % 3 === 1) {
      type = "تست + تحلیل";
    } else {
      type = "مرور فعال";
    }

    DB.plans.push({

      id: uid(),

      date: today(),

      start:
        shortTime(current),

      subject:
        subject.name,

      topic:
        item.score < 55
          ? "مبحث ضعیف"
          : "مبحث فعلی",

      duration,

      type,

      done:false

    });

    used += duration;

    current +=
      duration +
      Number(
        DB.profile.breakMinutes || 15
      );

    index++;
  }

  saveDatabase();

  toast(
    "برنامه هوشمند ساخته شد"
  );

  navigate(currentPage);
}

/* =========================================================
   PLAN
========================================================= */

function renderPlan() {

  const app =
    document.getElementById("app");

  app.innerHTML = `

    <section class="card">

      <div class="card-title">

        <h2>
          📅 برنامه تطبیقی
        </h2>

        <button
          class="primary"
          onclick="smartPlan()"
        >
          بازسازی
        </button>

      </div>

      <p class="muted">
        برنامه با توجه به سطح دروس،
        عملکرد تستی و هدف مطالعه ساخته می‌شود.
      </p>

      ${todayPlansHTML()}

    </section>


    <section class="card">

      <h3>
        🔄 جبران عقب‌افتادگی
      </h3>

      <button
        onclick="recoveryPlan()"
      >
        محاسبه برنامه جبرانی
      </button>

      <div
        id="recoveryResult"
        class="advice"
        style="margin-top:10px"
      >
        برای محاسبه دکمه بالا را بزن.
      </div>

    </section>


    <section class="card">

      <h3>
        📆 برنامه آینده
      </h3>

      ${futurePlansHTML()}

    </section>

  `;
}

function togglePlan(id) {

  const plan =
    DB.plans.find(
      x => x.id === id
    );

  if (!plan) return;

  const wasDone =
    plan.done;

  plan.done =
    !plan.done;

  if (!wasDone) {

    DB.xp =
      Number(DB.xp || 0) + 10;

    updateStreak();
  }

  saveDatabase();

  navigate(currentPage);
}

function recoveryPlan() {

  const box =
    document.getElementById(
      "recoveryResult"
    );

  if (!box) return;

  const pending =
    DB.plans
      .filter(
        x =>
          x.date === today() &&
          !x.done
      )
      .sort(
        (a,b) =>
          b.duration-a.duration
      );

  if (!pending.length) {

    box.textContent =
      "جلسه عقب‌افتاده‌ای وجود ندارد 🎉";

    return;
  }

  const keep =
    pending.slice(
      0,
      Math.max(
        1,
        Math.ceil(
          pending.length * .6
        )
      )
    );

  box.innerHTML = `

    <b>
      این جلسه‌ها اولویت دارند:
    </b>

    <br><br>

    ${keep.map(x =>
      `• ${escapeHTML(x.subject)}
       — ${escapeHTML(x.topic)}`
    ).join("<br>")}

    <br><br>

    بقیه جلسه‌های کم‌اولویت را
    به روز بعد منتقل کن.
  `;
}

function futurePlansHTML() {

  const future =
    DB.plans
      .filter(
        x => x.date > today()
      )
      .slice(0,20);

  if (!future.length) {

    return `
      <div class="empty">
        برنامه آینده‌ای ثبت نشده.
      </div>
    `;
  }

  return `
    <div class="list">

      ${future.map(x => `

        <div class="item">

          <div class="item-main">

            <strong>
              ${escapeHTML(x.date)}
              ·
              ${escapeHTML(x.subject)}
            </strong>

            <small>
              ${escapeHTML(x.topic)}
              ·
              ${fa(x.duration)}
              دقیقه
            </small>

          </div>

        </div>

      `).join("")}

    </div>
  `;
}

/* =========================================================
   COACH
========================================================= */

function renderCoach() {

  const app =
    document.getElementById("app");

  const decision =
    coachDecision();

  app.innerHTML = `

    <section class="card">

      <h2>
        🤖 مشاور خصوصی
      </h2>

      <p class="muted">
        موتور مشاور روی خود دستگاه اجرا می‌شود
        و برای کارکرد آن API پولی لازم نیست.
      </p>

      <div class="advice">

        <div class="advice-title">
          ${escapeHTML(decision.title)}
        </div>

        ${escapeHTML(decision.text)}

      </div>

    </section>


    <section class="card">

      <div
        id="chat"
        class="chat"
      >

        ${
          DB.messages.length
            ? DB.messages
                .slice(-15)
                .map(message => `

                  <div class="msg user">
                    ${escapeHTML(message.question)}
                  </div>

                  <div class="msg bot">
                    ${escapeHTML(message.answer)}
                  </div>

                `)
                .join("")
            : `
              <div class="msg bot">
                سلام! وضعیت مطالعه‌ات را بگو
                تا بر اساس اطلاعات ثبت‌شده
                راهنمایی‌ات کنم.
              </div>
            `
        }

      </div>

      <div class="form">

        <textarea
          id="coachQuestion"
          rows="4"
          placeholder="مثلاً امروز ۲ ساعت عقب افتادم، چه کار کنم؟"
        ></textarea>

        <button
          class="primary"
          onclick="askCoach()"
        >
          پرسیدن
        </button>

      </div>

    </section>

  `;
}

function askCoach() {

  const input =
    document.getElementById(
      "coachQuestion"
    );

  if (!input) return;

  const question =
    input.value.trim();

  if (!question) {
    return;
  }

  const answer =
    generateCoachAnswer(
      question
    );

  DB.messages.push({

    id:uid(),

    date:today(),

    question,

    answer

  });

  saveDatabase();

  renderCoach();
}

function generateCoachAnswer(question) {

  const weak =
    weakestSubject();

  const pending =
    DB.plans.filter(
      x =>
        x.date === today() &&
        !x.done
    );

  const due =
    DB.reviews.filter(
      x =>
        !x.done &&
        x.date <= today()
    );

  const accuracy =
    testAccuracy();

  const q =
    question.toLowerCase();

  if (
    /عقب|جبران|نرسید|نخوندم|عقب افتادم/
      .test(q)
  ) {

    if (pending.length) {

      return (
        `اول «${pending[0].subject} — ` +
        `${pending[0].topic}» را انجام بده. ` +
        "همه عقب‌افتادگی را یک‌جا فشرده نکن."
      );

    }

    return (
      "برنامه امروز را بازسازی کن " +
      "و جلسه‌های مهم‌تر را در اولویت قرار بده."
    );
  }

  if (
    /ضعف|ضعیف|کدام درس|کدوم درس/
      .test(q)
  ) {

    return (
      `بر اساس داده‌های فعلی، ` +
      `${weak.name} ضعیف‌ترین درس ثبت‌شده است. ` +
      "برای آن یک جلسه رفع ضعف و سپس تست آموزشی انجام بده."
    );
  }

  if (
    /مرور|فراموش/
      .test(q)
  ) {

    if (due.length) {

      return (
        `${fa(due.length)} مرور سررسید شده داری. ` +
        "اول مرورهای سررسیدشده را انجام بده."
      );
    }

    return (
      "مرور عقب‌افتاده‌ای ثبت نشده. " +
      "بعد از مطالعه، مرور فاصله‌دار را ادامه بده."
    );
  }

  if (
    /ساعت|مطالعه|چقدر بخون/
      .test(q)
  ) {

    return (
      `امروز ${minutesText(studyMinutes())} ` +
      `مطالعه ثبت شده و هدف روزانه ` +
      `${fa(DB.profile.dailyHours || 8)} ساعت است.`
    );
  }

  if (
    /تست|درصد|دقت/
      .test(q)
  ) {

    if (accuracy !== null) {

      return (
        `میانگین دقت امروز ${fa(accuracy)}٪ است. ` +
        (
          accuracy < 60
            ? "فعلاً تحلیل غلط‌ها را در اولویت قرار بده."
            : "می‌توانی به‌تدریج حجم تست را افزایش بدهی."
        )
      );
    }

    return (
      "هنوز تستی برای امروز ثبت نشده است."
    );
  }

  if (
    /برنامه|امروز|کار کنم/
      .test(q)
  ) {

    const decision =
      coachDecision();

    return (
      `${decision.title}: ${decision.text}`
    );
  }

  return (
    `وضعیت فعلی: ` +
    `${minutesText(studyMinutes())} مطالعه امروز، ` +
    `${fa(testCount())} تست و ` +
    `${
      accuracy === null
        ? "بدون داده دقت"
        : fa(accuracy)+"٪ دقت"
    }. ` +
    `نقطه ضعف فعلی: ${weak.name}.`
  );
}

/* =========================================================
   STUDY TIMER
========================================================= */

function renderStudy() {

  const app =
    document.getElementById("app");

  app.innerHTML = `

    <section class="card">

      <h2>
        ⏱️ جلسه مطالعه
      </h2>

      <div class="form">

        <select id="studySubject">

          ${DB.subjects.map(
            s =>
              `<option>
                ${escapeHTML(s.name)}
              </option>`
          ).join("")}

        </select>

        <input
          id="studyTopic"
          placeholder="مبحث"
        >

      </div>

      <div class="timer">

        <div
          id="timerDisplay"
          class="timer-display"
        >
          ${formatTimer()}
        </div>

        <div class="timer-state">
          ${
            TIMER.running
              ? "در حال مطالعه..."
              : "آماده شروع"
          }
        </div>

      </div>

      <div class="timer-controls">

        <button
          class="primary"
          onclick="startTimer()"
        >
          شروع
        </button>

        <button
          onclick="pauseTimer()"
        >
          توقف
        </button>

        <button
          class="green"
          onclick="finishTimer()"
        >
          ثبت جلسه
        </button>

        <button
          onclick="resetTimer()"
        >
          صفر کردن
        </button>

      </div>

    </section>


    <section class="card">

      <h3>
        📚 جلسات اخیر
      </h3>

      ${recentSessionsHTML()}

    </section>

  `;
}

function formatTimer() {

  const seconds =
    Math.max(
      0,
      Number(TIMER.seconds || 0)
    );

  const h =
    Math.floor(seconds / 3600);

  const m =
    Math.floor(seconds / 60) % 60;

  const s =
    seconds % 60;

  return [
    h,
    m,
    s
  ]
    .map(
      x =>
        String(x).padStart(2,"0")
    )
    .join(":");
}

function updateTimerDisplay() {

  const element =
    document.getElementById(
      "timerDisplay"
    );

  if (element) {
    element.textContent =
      formatTimer();
  }
}

function startTimer() {

  if (TIMER.running) {
    return;
  }

  const subject =
    document.getElementById(
      "studySubject"
    );

  const topic =
    document.getElementById(
      "studyTopic"
    );

  if (subject) {
    TIMER.subject =
      subject.value;
  }

  if (topic) {
    TIMER.topic =
      topic.value.trim();
  }

  TIMER.running = true;

  TIMER.interval =
    setInterval(() => {

      TIMER.seconds++;

      updateTimerDisplay();

    },1000);

  toast("جلسه شروع شد");
}

function pauseTimer() {

  TIMER.running = false;

  clearInterval(
    TIMER.interval
  );

  TIMER.interval = null;

  toast("جلسه متوقف شد");
}

function resetTimer() {

  pauseTimer();

  TIMER.seconds = 0;

  updateTimerDisplay();

  toast("تایمر صفر شد");
}

function finishTimer() {

  pauseTimer();

  const minutes =
    Math.round(
      TIMER.seconds / 60
    );

  if (minutes < 1) {

    toast(
      "حداقل یک دقیقه مطالعه کن"
    );

    return;
  }

  const subject =
    TIMER.subject ||
    document.getElementById(
      "studySubject"
    )?.value ||
    DB.subjects[0]?.name ||
    "مطالعه";

  const topic =
    TIMER.topic ||
    document.getElementById(
      "studyTopic"
    )?.value.trim() ||
    "مطالعه";

  DB.sessions.push({

    id:uid(),

    date:today(),

    minutes,

    subject,

    topic

  });

  /* مرور فاصله‌دار */

  [
    1,
    3,
    7,
    14,
    30
  ].forEach(days => {

    const d =
      dateObject(today());

    d.setDate(
      d.getDate() + days
    );

    DB.reviews.push({

      id:uid(),

      date:
        d.toISOString()
          .slice(0,10),

      subject,

      topic,

      done:false

    });

  });

  DB.xp =
    Number(DB.xp || 0) +
    Math.max(
      5,
      Math.round(minutes / 5)
    );

  updateStreak();

  TIMER.seconds = 0;
  TIMER.subject = "";
  TIMER.topic = "";

  saveDatabase();

  toast(
    "جلسه با موفقیت ثبت شد"
  );

  navigate("study");
}

function recentSessionsHTML() {

  const sessions =
    DB.sessions
      .slice()
      .reverse()
      .slice(0,15);

  if (!sessions.length) {

    return `
      <div class="empty">
        هنوز جلسه‌ای ثبت نشده.
      </div>
    `;
  }

  return `
    <div class="list">

      ${sessions.map(x => `

        <div class="item">

          <div class="item-main">

            <strong>
              ${escapeHTML(x.subject)}
            </strong>

            <small>
              ${escapeHTML(x.topic)}
              ·
              ${minutesText(x.minutes)}
              ·
              ${escapeHTML(x.date)}
            </small>

          </div>

        </div>

      `).join("")}

    </div>
  `;
}

/* =========================================================
   TESTS
========================================================= */

function renderTests() {

  const app =
    document.getElementById("app");

  app.innerHTML = `

    <section class="card">

      <h2>
        📝 ثبت تست
      </h2>

      <div class="form">

        <select id="testSubject">

          ${DB.subjects.map(
            s =>
              `<option>
                ${escapeHTML(s.name)}
              </option>`
          ).join("")}

        </select>

        <input
          id="testTopic"
          placeholder="مبحث"
        >

        <input
          id="testCount"
          type="number"
          min="1"
          placeholder="تعداد تست"
        >

        <input
          id="testAccuracy"
          type="number"
          min="0"
          max="100"
          placeholder="درصد"
        >

        <input
          id="testTime"
          type="number"
          min="0"
          placeholder="زمان به دقیقه"
        >

        <select id="testCause">

          <option>
            بدون مشکل خاص
          </option>

          <option>
            ضعف مفهومی
          </option>

          <option>
            بی‌دقتی
          </option>

          <option>
            محاسبات
          </option>

          <option>
            کمبود زمان
          </option>

          <option>
            فراموشی
          </option>

        </select>

        <button
          class="primary"
          onclick="saveTest()"
        >
          ثبت نتیجه
        </button>

      </div>

    </section>


    <section class="card">

      <h3>
        📋 نتایج اخیر
      </h3>

      ${recentTestsHTML()}

    </section>

  `;
}

function saveTest() {

  const subject =
    document.getElementById(
      "testSubject"
    )?.value;

  const topic =
    document.getElementById(
      "testTopic"
    )?.value.trim() ||
    "نامشخص";

  const count =
    Number(
      document.getElementById(
        "testCount"
      )?.value
    );

  const accuracy =
    Number(
      document.getElementById(
        "testAccuracy"
      )?.value
    );

  const time =
    Number(
      document.getElementById(
        "testTime"
      )?.value
    ) || 0;

  const cause =
    document.getElementById(
      "testCause"
    )?.value ||
    "بدون مشکل خاص";

  if (
    !count ||
    accuracy < 0 ||
    accuracy > 100
  ) {

    toast(
      "اطلاعات تست را درست وارد کن"
    );

    return;
  }

  DB.tests.push({

    id:uid(),

    date:today(),

    subject,

    topic,

    count,

    accuracy,

    time,

    cause

  });

  if (accuracy < 60) {

    DB.mistakes.push({

      id:uid(),

      date:today(),

      subject,

      topic,

      accuracy,

      cause,

      resolved:false

    });

  }

  DB.xp =
    Number(DB.xp || 0) +
    Math.max(
      5,
      Math.round(count / 5)
    );

  saveDatabase();

  toast(
    "نتیجه ثبت شد"
  );

  navigate("tests");
}

function recentTestsHTML() {

  const tests =
    DB.tests
      .slice()
      .reverse()
      .slice(0,20);

  if (!tests.length) {

    return `
      <div class="empty">
        هنوز تستی ثبت نشده.
      </div>
    `;
  }

  return `
    <div class="list">

      ${tests.map(x => `

        <div class="item">

          <div class="item-main">

            <strong>
              ${escapeHTML(x.subject)}
              ·
              ${fa(x.accuracy)}٪
            </strong>

            <small>
              ${fa(x.count)} تست
              ·
              ${escapeHTML(x.topic)}
              ·
              ${escapeHTML(x.cause)}
            </small>

          </div>

          <button
            onclick="deleteTest('${x.id}')"
          >
            حذف
          </button>

        </div>

      `).join("")}

    </div>
  `;
}

function deleteTest(id) {

  DB.tests =
    DB.tests.filter(
      x => x.id !== id
    );

  saveDatabase();

  navigate("tests");
}

/* =========================================================
   MISTAKES
========================================================= */

function renderMistakes() {

  const app =
    document.getElementById("app");

  const mistakes =
    DB.mistakes
      .slice()
      .reverse();

  app.innerHTML = `

    <section class="card">

      <h2>
        ⚠️ دفتر اشتباهات
      </h2>

      <p class="muted">
        تست‌های زیر ۶۰٪ به‌صورت خودکار
        وارد دفتر اشتباهات می‌شوند.
      </p>

      ${
        mistakes.length
          ? `
            <div class="list">

              ${mistakes.map(x => `

                <div class="item">

                  <span class="dot red"></span>

                  <div class="item-main">

                    <strong>
                      ${escapeHTML(x.subject)}
                      ·
                      ${escapeHTML(x.topic)}
                    </strong>

                    <small>
                      ${escapeHTML(x.cause)}
                      ·
                      ${fa(x.accuracy)}٪
                      ·
                      ${escapeHTML(x.date)}
                    </small>

                  </div>

                  <div class="item-actions">

                    <button
                      onclick="resolveMistake('${x.id}')"
                    >
                      ${
                        x.resolved
                          ? "باز"
                          : "حل شد"
                      }
                    </button>

                    <button
                      class="danger"
                      onclick="deleteMistake('${x.id}')"
                    >
                      حذف
                    </button>

                  </div>

                </div>

              `).join("")}

            </div>
          `
          : `
            <div class="empty">
              اشتباه ثبت‌شده‌ای وجود ندارد 🎉
            </div>
          `
      }

    </section>

  `;
}

function resolveMistake(id) {

  const mistake =
    DB.mistakes.find(
      x => x.id === id
    );

  if (!mistake) return;

  mistake.resolved =
    !mistake.resolved;

  saveDatabase();

  navigate("mistakes");
}

function deleteMistake(id) {

  DB.mistakes =
    DB.mistakes.filter(
      x => x.id !== id
    );

  saveDatabase();

  navigate("mistakes");
}

/* =========================================================
   REVIEWS
========================================================= */

function reviewsHTML() {

  const due =
    DB.reviews
      .filter(
        x =>
          !x.done &&
          x.date <= today()
      )
      .slice(0,12);

  if (!due.length) {

    return `
      <div class="empty">
        مرور سررسیدشده نداری 🎉
      </div>
    `;
  }

  return `
    <div class="list">

      ${due.map(x => `

        <div class="item">

          <span class="dot"></span>

          <div class="item-main">

            <strong>
              ${escapeHTML(x.subject)}
            </strong>

            <small>
              ${escapeHTML(x.topic)}
              ·
              ${escapeHTML(x.date)}
            </small>

          </div>

          <button
            onclick="completeReview('${x.id}')"
          >
            انجام شد
          </button>

        </div>

      `).join("")}

    </div>
  `;
}

function completeReview(id) {

  const review =
    DB.reviews.find(
      x => x.id === id
    );

  if (!review) return;

  review.done = true;

  DB.xp =
    Number(DB.xp || 0) + 5;

  saveDatabase();

  toast(
    "مرور ثبت شد"
  );

  navigate(currentPage);
}

/* =========================================================
   ANALYTICS
========================================================= */

function renderAnalytics() {

  const app =
    document.getElementById("app");

  const total =
    totalStudyMinutes();

  const tests =
    totalTests();

  const accuracy =
    overallAccuracy();

  app.innerHTML = `

    <section class="card">

      <h2>
        📊 داشبورد تحلیل
      </h2>

      <div class="grid grid-4">

        ${statCard(
          minutesText(total),
          "مطالعه کل"
        )}

        ${statCard(
          fa(tests),
          "تست کل"
        )}

        ${statCard(
          accuracy === null
            ? "—"
            : fa(accuracy)+"٪",
          "میانگین دقت"
        )}

        ${statCard(
          "🔥 "+fa(DB.streak || 0),
          "Streak"
        )}

      </div>

    </section>


    <section class="card">

      <h3>
        🎯 وضعیت دروس
      </h3>

      <div class="grid grid-2">

        ${DB.subjects.map(
          renderSubjectAnalysis
        ).join("")}

      </div>

    </section>


    <section class="card">

      <h3>
        ⚠️ تحلیل علت خطاها
      </h3>

      ${errorAnalysisHTML()}

    </section>


    <section class="card">

      <h3>
        📅 عملکرد ۷ روز اخیر
      </h3>

      ${weeklyHTML()}

    </section>

  `;
}

function renderSubjectAnalysis(subject) {

  const accuracy =
    subjectAccuracy(subject);

  const study =
    subjectStudy(subject);

  const mistakes =
    subjectMistakes(subject).length;

  const score =
    subjectScore(subject);

  return `

    <div class="subject-card">

      <div class="subject-header">

        <strong>
          ${escapeHTML(subject.name)}
        </strong>

        <span class="subject-meta">
          امتیاز ${fa(score)}
        </span>

      </div>

      <div class="subject-meta">

        دقت:
        ${
          accuracy === null
            ? "بدون داده"
            : fa(accuracy)+"٪"
        }

        ·

        مطالعه:
        ${minutesText(study)}

      </div>

      <div style="height:9px;margin-top:9px">

        <div class="progress">

          <i
            style="width:${score}%"
          ></i>

        </div>

      </div>

      <small class="muted">

        ${fa(mistakes)}
        خطای ثبت‌شده

      </small>

    </div>
  `;
}

function errorAnalysisHTML() {

  const counts = {};

  DB.mistakes.forEach(
    mistake => {

      const cause =
        mistake.cause ||
        "نامشخص";

      counts[cause] =
        (counts[cause] || 0) + 1;
    }
  );

  const items =
    Object.entries(counts)
      .sort(
        (a,b) => b[1]-a[1]
      );

  if (!items.length) {

    return `
      <div class="empty">
        هنوز داده کافی وجود ندارد.
      </div>
    `;
  }

  return items
    .map(
      x =>
        `<span class="chip">
          ${escapeHTML(x[0])}:
          ${fa(x[1])}
        </span>`
    )
    .join("");
}

function weeklyHTML() {

  let html = "";

  for (
    let i = 6;
    i >= 0;
    i--
  ) {

    const d =
      dateObject(today());

    d.setDate(
      d.getDate() - i
    );

    const date =
      d.toISOString()
        .slice(0,10);

    const minutes =
      studyMinutes(date);

    const percent =
      clamp(
        Math.round(
          minutes / 360 * 100
        ),
        0,
        100
      );

    html += `

      <div class="item">

        <div class="item-main">

          <strong>
            ${escapeHTML(date)}
          </strong>

          <div
            class="progress"
            style="margin-top:5px"
          >

            <i
              style="width:${percent}%"
            ></i>

          </div>

        </div>

        <strong>
          ${minutesText(minutes)}
        </strong>

      </div>
    `;
  }

  return html;
}

/* =========================================================
   SETTINGS
========================================================= */

function renderSettings() {

  const app =
    document.getElementById("app");

  const p =
    DB.profile;

  app.innerHTML = `

    <section class="card">

      <h2>
        ⚙️ پروفایل
      </h2>

      <div class="form">

        <input
          id="profileName"
          placeholder="نام"
          value="${escapeHTML(p.name)}"
        >

        <input
          id="profileGoal"
          placeholder="هدف اصلی"
          value="${escapeHTML(p.goal)}"
        >

        <label>
          تاریخ آزمون
        </label>

        <input
          id="profileExam"
          type="date"
          value="${p.examDate || ""}"
        >

        <label>
          ساعت مطالعه هدف
        </label>

        <input
          id="profileHours"
          type="number"
          min="1"
          max="18"
          value="${p.dailyHours || 8}"
        >

        <label>
          شروع برنامه
        </label>

        <input
          id="profileStart"
          type="time"
          value="${p.startTime || "07:00"}"
        >

        <label>
          استراحت بین جلسات
        </label>

        <input
          id="profileBreak"
          type="number"
          min="5"
          max="60"
          value="${p.breakMinutes || 15}"
        >

        <button
          class="primary"
          onclick="saveProfile()"
        >
          ذخیره
        </button>

      </div>

    </section>


    <section class="card">

      <h3>
        📚 سطح و اولویت درس‌ها
      </h3>

      <p class="muted">
        سطح: ۱ ضعیف تا ۵ قوی
        <br>
        اولویت: ۱ کم تا ۵ زیاد
      </p>

      <div class="list">

        ${DB.subjects.map(subject => `

          <div class="item">

            <div class="item-main">

              <strong>
                ${escapeHTML(subject.name)}
              </strong>

            </div>

            <input
              style="width:70px"
              type="number"
              min="1"
              max="5"
              value="${subject.level}"
              onchange="
                changeSubject(
                  '${subject.id}',
                  'level',
                  this.value
                )
              "
            >

            <input
              style="width:70px"
              type="number"
              min="1"
              max="5"
              value="${subject.priority}"
              onchange="
                changeSubject(
                  '${subject.id}',
                  'priority',
                  this.value
                )
              "
            >

          </div>

        `).join("")}

      </div>

    </section>


    <section class="card">

      <h3>
        💾 پشتیبان اطلاعات
      </h3>

      <p class="muted">
        اطلاعات StudyCoach فقط در مرورگر ذخیره می‌شود.
        برای احتیاط، مرتب Backup بگیر.
      </p>

      <div class="dashboard-actions">

        <button
          class="blue"
          onclick="exportDatabase()"
        >
          📤 خروجی
        </button>

        <button
          onclick="
            document
              .getElementById('importFile')
              .click()
          "
        >
          📥 بازیابی
        </button>

        <input
          id="importFile"
          type="file"
          accept=".json"
          hidden
          onchange="importDatabase(this)"
        >

      </div>

    </section>


    <section class="card">

      <h3>
        📱 امکانات
      </h3>

      <div class="dashboard-actions">

        <button
          onclick="installApp()"
        >
          📲 نصب روی صفحه اصلی
        </button>

        <button
          onclick="window.print()"
        >
          🖨️ چاپ گزارش
        </button>

      </div>

    </section>


    <section class="card">

      <h3>
        🗑️ مدیریت اطلاعات
      </h3>

      <button
        class="danger"
        onclick="resetDatabase()"
      >
        پاک کردن تمام اطلاعات
      </button>

    </section>


    <section class="card">

      <h3>
        ℹ️ StudyCoach FINAL
      </h3>

      <p class="muted">

        نسخه آفلاین و رایگان.
        بدون API پولی،
        بدون حساب کاربری اجباری،
        بدون ارسال اطلاعات مطالعه به سرور.

      </p>

    </section>

  `;
}

function saveProfile() {

  DB.profile = {

    name:
      document
        .getElementById("profileName")
        .value
        .trim(),

    goal:
      document
        .getElementById("profileGoal")
        .value
        .trim(),

    examDate:
      document
        .getElementById("profileExam")
        .value,

    dailyHours:
      clamp(
        Number(
          document
            .getElementById("profileHours")
            .value
        ) || 8,
        1,
        18
      ),

    startTime:
      document
        .getElementById("profileStart")
        .value ||
      "07:00",

    breakMinutes:
      clamp(
        Number(
          document
            .getElementById("profileBreak")
            .value
        ) || 15,
        5,
        60
      )

  };

  saveDatabase();

  toast(
    "پروفایل ذخیره شد"
  );

  smartPlan();
}

function changeSubject(
  id,
  property,
  value
) {

  const subject =
    DB.subjects.find(
      x => x.id === id
    );

  if (!subject) return;

  subject[property] =
    clamp(
      Number(value) || 3,
      1,
      5
    );

  saveDatabase();

  toast(
    "تغییر ذخیره شد"
  );
}

/* =========================================================
   XP / LEVEL / STREAK
========================================================= */

function levelFromXP() {

  const xp =
    Number(DB.xp || 0);

  return fa(
    Math.floor(xp / 100) + 1
  );
}

function updateStreak() {

  const current =
    today();

  if (
    DB.lastStudyDate === current
  ) {
    return;
  }

  if (!DB.lastStudyDate) {

    DB.streak = 1;
    DB.lastStudyDate =
      current;

    return;
  }

  const last =
    dateObject(
      DB.lastStudyDate
    );

  const now =
    dateObject(current);

  const difference =
    Math.round(
      (now-last) /
      86400000
    );

  if (difference === 1) {

    DB.streak =
      Number(DB.streak || 0) + 1;

  } else if (difference > 1) {

    DB.streak = 1;

  }

  DB.lastStudyDate =
    current;
}

/* =========================================================
   BACKUP / RESTORE
========================================================= */

function exportDatabase() {

  const blob =
    new Blob(
      [
        JSON.stringify(
          DB,
          null,
          2
        )
      ],
      {
        type:
          "application/json"
      }
    );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;

  a.download =
    `StudyCoach-Backup-${today()}.json`;

  document.body.appendChild(a);

  a.click();

  a.remove();

  setTimeout(
    () =>
      URL.revokeObjectURL(url),
    1000
  );

  toast(
    "پشتیبان ساخته شد"
  );
}

function importDatabase(input) {

  const file =
    input.files?.[0];

  if (!file) {
    return;
  }

  const reader =
    new FileReader();

  reader.onload = () => {

    try {

      const data =
        JSON.parse(
          reader.result
        );

      if (
        !data ||
        typeof data !== "object"
      ) {
        throw new Error(
          "Invalid database"
        );
      }

      DB =
        mergeDatabase(
          clone(DEFAULT_DB),
          data
        );

      saveDatabase();

      toast(
        "اطلاعات بازیابی شد"
      );

      navigate("home");

    } catch (error) {

      console.error(error);

      toast(
        "فایل پشتیبان معتبر نیست"
      );
    }

  };

  reader.readAsText(file);

  input.value = "";
}

function resetDatabase() {

  const confirmed =
    confirm(
      "تمام اطلاعات StudyCoach حذف شود؟ این کار قابل بازگشت نیست."
    );

  if (!confirmed) {
    return;
  }

  localStorage.removeItem(
    DB_KEY
  );

  location.reload();
}

/* =========================================================
   DARK MODE
========================================================= */

function loadTheme() {

  const theme =
    localStorage.getItem(
      THEME_KEY
    );

  if (theme === "dark") {

    document.body
      .classList.add("dark");

  }

  updateDarkButton();
}

function toggleDarkMode() {

  document.body
    .classList.toggle("dark");

  const dark =
    document.body
      .classList
      .contains("dark");

  localStorage.setItem(
    THEME_KEY,
    dark ? "dark" : "light"
  );

  updateDarkButton();
}

function updateDarkButton() {

  const button =
    document.getElementById(
      "darkBtn"
    );

  if (!button) return;

  button.textContent =
    document.body
      .classList
      .contains("dark")
      ? "☀️"
      : "🌙";
}

/* =========================================================
   QUICK ADD
========================================================= */

function quickAdd() {

  showModal(`

    <h3>
      ⚡ افزودن سریع
    </h3>

    <div class="quick-grid">

      <button
        class="quick-action"
        onclick="
          closeModal();
          navigate('study');
        "
      >
        <span>⏱️</span>
        مطالعه
      </button>

      <button
        class="quick-action"
        onclick="
          closeModal();
          navigate('tests');
        "
      >
        <span>📝</span>
        تست
      </button>

      <button
        class="quick-action"
        onclick="
          closeModal();
          navigate('mistakes');
        "
      >
        <span>⚠️</span>
        اشتباه
      </button>

    </div>

  `);
}

/* =========================================================
   MODAL
========================================================= */

function showModal(content) {

  const modal =
    document.getElementById(
      "modal"
    );

  const box =
    document.getElementById(
      "modalContent"
    );

  if (!modal || !box) {
    return;
  }

  box.innerHTML =
    content;

  modal.classList.remove(
    "hidden"
  );
}

function closeModal() {

  const modal =
    document.getElementById(
      "modal"
    );

  if (!modal) return;

  modal.classList.add(
    "hidden"
  );
}

/* =========================================================
   PWA INSTALL
========================================================= */

let deferredInstallPrompt = null;

window.addEventListener(
  "beforeinstallprompt",
  event => {

    event.preventDefault();

    deferredInstallPrompt =
      event;
  }
);

async function installApp() {

  if (
    !deferredInstallPrompt
  ) {

    toast(
      "در Safari از Share → Add to Home Screen استفاده کن"
    );

    return;
  }

  try {

    await deferredInstallPrompt.prompt();

    await deferredInstallPrompt.userChoice;

    deferredInstallPrompt =
      null;

  } catch (error) {

    console.error(error);

  }
}

/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEvents() {

  document
    .querySelectorAll(".nav-item")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          navigate(
            button.dataset.page
          );

        }
      );

    });

  const dark =
    document.getElementById(
      "darkBtn"
    );

  if (dark) {

    dark.addEventListener(
      "click",
      toggleDarkMode
    );

  }

  const quick =
    document.getElementById(
      "quickAddBtn"
    );

  if (quick) {

    quick.addEventListener(
      "click",
      quickAdd
    );

  }

  const modal =
    document.getElementById(
      "modal"
    );

  if (modal) {

    modal.addEventListener(
      "click",
      event => {

        if (
          event.target === modal
        ) {
          closeModal();
        }

      }
    );

  }

  const close =
    document.getElementById(
      "modalClose"
    );

  if (close) {

    close.addEventListener(
      "click",
      closeModal
    );

  }

}

/* =========================================================
   KEYBOARD SHORTCUTS
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {
      closeModal();
    }

  }
);

/* =========================================================
   INITIALIZE
========================================================= */

function initializeApp() {

  loadTheme();

  setupEvents();

  navigate("home");

}

/* =========================================================
   START
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeApp
  );

} else {

  initializeApp();

}
