/* =========================================================
   StudyCoach V5 Ultimate
   Main Application
========================================================= */

"use strict";

/* =========================================================
   CONFIG
========================================================= */

const APP_VERSION = "5.0.0";
const STORAGE_KEY = "studycoach_v5_state";

const SUBJECTS = [
  "زیست",
  "شیمی",
  "فیزیک",
  "ریاضی",
  "دینی",
  "فارسی",
  "عربی",
  "زبان"
];

const SCIENCE_SUBJECTS = [
  "زیست",
  "شیمی",
  "فیزیک",
  "ریاضی"
];

const DEFAULT_STATE = {
  version: APP_VERSION,

  profile: {
    name: "",
    goal: "پزشکی دانشگاه تهران",
    examDate: "",
    dailyGoal: 8
  },

  settings: {
    darkMode: false
  },

  studySessions: [],

  tests: [],

  tasks: [],

  reviews: [],

  messages: [],

  plan: [],

  createdAt: new Date().toISOString(),

  updatedAt: new Date().toISOString()
};


/* =========================================================
   GLOBALS
========================================================= */

let state = loadState();

let timer = {
  duration: 25 * 60,
  remaining: 25 * 60,
  running: false,
  interval: null
};


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => document.querySelectorAll(selector);

function byId(id) {
  return document.getElementById(id);
}


/* =========================================================
   STORAGE
========================================================= */

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}


function loadState() {

  try {

    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return cloneDefaultState();
    }

    const parsed = JSON.parse(raw);

    return normalizeState(parsed);

  } catch (error) {

    console.error("StudyCoach load error:", error);

    return cloneDefaultState();
  }
}


function normalizeState(data) {

  const base = cloneDefaultState();

  return {

    ...base,

    ...data,

    profile: {
      ...base.profile,
      ...(data.profile || {})
    },

    settings: {
      ...base.settings,
      ...(data.settings || {})
    },

    studySessions: Array.isArray(data.studySessions)
      ? data.studySessions
      : [],

    tests: Array.isArray(data.tests)
      ? data.tests
      : [],

    tasks: Array.isArray(data.tasks)
      ? data.tasks
      : [],

    reviews: Array.isArray(data.reviews)
      ? data.reviews
      : [],

    messages: Array.isArray(data.messages)
      ? data.messages
      : [],

    plan: Array.isArray(data.plan)
      ? data.plan
      : []

  };
}


function saveState() {

  state.updatedAt = new Date().toISOString();

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );

}


/* =========================================================
   DATE HELPERS
========================================================= */

function todayKey() {

  const d = new Date();

  const y = d.getFullYear();

  const m = String(d.getMonth() + 1).padStart(2, "0");

  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
}


function dateKey(date) {

  const d = new Date(date);

  const y = d.getFullYear();

  const m = String(d.getMonth() + 1).padStart(2, "0");

  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
}


function daysAgo(n) {

  const d = new Date();

  d.setHours(0, 0, 0, 0);

  d.setDate(d.getDate() - n);

  return dateKey(d);
}


function formatDate(date) {

  if (!date) return "—";

  try {

    return new Intl.DateTimeFormat(
      "fa-IR",
      {
        year: "numeric",
        month: "long",
        day: "numeric"
      }
    ).format(new Date(date));

  } catch {

    return date;
  }
}


/* =========================================================
   NUMBER HELPERS
========================================================= */

function faNumber(value) {

  return new Intl.NumberFormat("fa-IR")
    .format(Number(value) || 0);
}


function percent(value) {

  return `${faNumber(Math.round(Number(value) || 0))}٪`;
}


function clamp(value, min, max) {

  return Math.min(
    max,
    Math.max(min, value)
  );
}


/* =========================================================
   TOAST
========================================================= */

let toastTimeout = null;

function toast(message) {

  const element = byId("toast");

  if (!element) return;

  element.textContent = message;

  element.classList.add("show");

  clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {

    element.classList.remove("show");

  }, 2500);
}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

const PAGE_NAMES = {

  dashboard: {
    title: "داشبورد",
    subtitle: "وضعیت امروزت را بررسی کن"
  },

  coach: {
    title: "مشاور هوشمند",
    subtitle: "با مشاور شخصی خودت صحبت کن"
  },

  planner: {
    title: "برنامه‌ریزی",
    subtitle: "برنامه مطالعه هوشمند بساز"
  },

  subjects: {
    title: "دروس",
    subtitle: "وضعیت هر درس را بررسی کن"
  },

  tests: {
    title: "ثبت تست",
    subtitle: "عملکرد تستی خودت را ثبت کن"
  },

  reviews: {
    title: "مرور هوشمند",
    subtitle: "مباحث مهم را دوباره مرور کن"
  },

  timer: {
    title: "تایمر مطالعه",
    subtitle: "وارد حالت تمرکز شو"
  },

  analytics: {
    title: "تحلیل عملکرد",
    subtitle: "روند پیشرفت خودت را ببین"
  },

  goals: {
    title: "اهداف",
    subtitle: "هدف تحصیلی خودت را مدیریت کن"
  },

  settings: {
    title: "تنظیمات",
    subtitle: "تنظیمات StudyCoach"
  }

};


function navigate(page) {

  $$(".page").forEach(section => {

    const target =
      section.dataset.pageContent === page;

    section.classList.toggle(
      "active",
      target
    );

  });


  $$(".nav-item").forEach(button => {

    button.classList.toggle(
      "active",
      button.dataset.page === page
    );

  });


  const meta =
    PAGE_NAMES[page] ||
    PAGE_NAMES.dashboard;


  const title = byId("pageTitle");

  const subtitle = byId("pageSubtitle");

  if (title) {
    title.textContent = meta.title;
  }

  if (subtitle) {
    subtitle.textContent = meta.subtitle;
  }


  const sidebar =
    byId("sidebar");

  if (sidebar) {
    sidebar.classList.remove("open");
  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =========================================================
   PROFILE
========================================================= */

function updateProfileUI() {

  const name =
    state.profile.name ||
    "دانش‌آموز";


  const goal =
    state.profile.goal ||
    "پزشکی";


  if (byId("sidebarUserName")) {
    byId("sidebarUserName").textContent =
      name;
  }


  if (byId("sidebarUserGoal")) {
    byId("sidebarUserGoal").textContent =
      `هدف: ${goal}`;
  }


  if (byId("welcomeTitle")) {

    byId("welcomeTitle").textContent =
      `سلام ${name} 👋`;

  }


  if (byId("welcomeText")) {

    byId("welcomeText").textContent =
      `آماده‌ای امروز برای ${goal} یک قدم جلوتر بروی؟`;

  }


  if (byId("goalInput")) {
    byId("goalInput").value =
      state.profile.goal || "";
  }


  if (byId("examDateInput")) {
    byId("examDateInput").value =
      state.profile.examDate || "";
  }


  if (byId("dailyGoalInput")) {
    byId("dailyGoalInput").value =
      state.profile.dailyGoal || 8;
  }


  if (byId("nameInput")) {
    byId("nameInput").value =
      state.profile.name || "";
  }


  if (byId("profileGoalInput")) {
    byId("profileGoalInput").value =
      state.profile.goal || "";
  }


  updateGoalUI();
}


function saveProfile() {

  const name =
    byId("nameInput")?.value.trim() || "";


  const goal =
    byId("profileGoalInput")?.value.trim() ||
    state.profile.goal;


  state.profile.name = name;

  state.profile.goal = goal;

  saveState();

  updateProfileUI();

  toast("پروفایل ذخیره شد ✅");
}


function saveGoal() {

  const goal =
    byId("goalInput")?.value.trim();


  const examDate =
    byId("examDateInput")?.value;


  const dailyGoal =
    Number(
      byId("dailyGoalInput")?.value
    ) || 8;


  if (goal) {
    state.profile.goal = goal;
  }

  state.profile.examDate = examDate;

  state.profile.dailyGoal =
    clamp(dailyGoal, 1, 20);


  saveState();

  updateProfileUI();

  toast("هدف ذخیره شد 🎯");
}


/* =========================================================
   GOAL UI
========================================================= */

function updateGoalUI() {

  if (byId("currentGoal")) {

    byId("currentGoal").textContent =
      state.profile.goal ||
      "هدف تعیین نشده";

  }


  const countdown =
    byId("examCountdown");


  if (!countdown) return;


  if (!state.profile.examDate) {

    countdown.textContent =
      "تاریخ آزمون هنوز تنظیم نشده است.";

    return;
  }


  const exam =
    new Date(
      state.profile.examDate +
      "T00:00:00"
    );


  const now =
    new Date();


  const diff =
    exam.getTime() -
    now.getTime();


  const days =
    Math.ceil(
      diff /
      (1000 * 60 * 60 * 24)
    );


  if (days > 0) {

    countdown.textContent =
      `${faNumber(days)} روز تا آزمون باقی مانده`;

  } else if (days === 0) {

    countdown.textContent =
      "امروز روز آزمون است! 🔥";

  } else {

    countdown.textContent =
      "تاریخ آزمون گذشته است.";

  }

}


/* =========================================================
   STUDY STATISTICS
========================================================= */

function getTodayStudyMinutes() {

  const today =
    todayKey();


  return state.studySessions

    .filter(
      session =>
        session.date === today
    )

    .reduce(
      (sum, session) =>
        sum + Number(session.minutes || 0),
      0
    );
}


function getTotalStudyMinutes() {

  return state.studySessions.reduce(
    (sum, session) =>
      sum + Number(session.minutes || 0),
    0
  );
}


function getTodayTests() {

  const today =
    todayKey();


  return state.tests.filter(
    test =>
      test.date === today
  );
}


function getTotalTests() {

  return state.tests.reduce(
    (sum, test) =>
      sum + Number(test.total || 0),
    0
  );
}


function getCorrectTests() {

  return state.tests.reduce(
    (sum, test) =>
      sum + Number(test.correct || 0),
    0
  );
}


function getOverallAccuracy() {

  const total =
    getTotalTests();


  if (!total) {
    return 0;
  }


  return (
    getCorrectTests() /
    total
  ) * 100;
}


/* =========================================================
   STREAK
========================================================= */

function calculateStreak() {

  let streak = 0;

  let current =
    new Date();

  current.setHours(
    0, 0, 0, 0
  );


  while (true) {

    const key =
      dateKey(current);


    const studied =
      state.studySessions.some(
        x => x.date === key
      );


    const tested =
      state.tests.some(
        x => x.date === key
      );


    if (!studied && !tested) {

      break;

    }


    streak++;

    current.setDate(
      current.getDate() - 1
    );

  }


  return streak;
}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

  const todayStudy =
    getTodayStudyMinutes();


  const todayTests =
    getTodayTests();


  const todayTotal =
    todayTests.reduce(
      (sum, test) =>
        sum + Number(test.total || 0),
      0
    );


  const todayCorrect =
    todayTests.reduce(
      (sum, test) =>
        sum + Number(test.correct || 0),
      0
    );


  const todayAccuracy =
    todayTotal
      ? (todayCorrect / todayTotal) * 100
      : 0;


  const streak =
    calculateStreak();


  if (byId("todayStudy")) {

    byId("todayStudy").textContent =
      faNumber(todayStudy);

  }


  if (byId("todayTests")) {

    byId("todayTests").textContent =
      faNumber(todayTotal);

  }


  if (byId("todayAccuracy")) {

    byId("todayAccuracy").textContent =
      percent(todayAccuracy);

  }


  if (byId("todayStreak")) {

    byId("todayStreak").textContent =
      faNumber(streak);

  }


  if (byId("streakValue")) {

    byId("streakValue").textContent =
      faNumber(streak);

  }


  updateTodayTasks();

}


/* =========================================================
   TASKS
========================================================= */

function updateTodayTasks() {

  const container =
    byId("todayTasks");


  if (!container) return;


  const today =
    todayKey();


  const tasks =
    state.tasks.filter(
      task =>
        task.date === today
    );


  if (!tasks.length) {

    container.innerHTML = `
      <div class="empty-state">
        هنوز کاری برای امروز ثبت نشده.
      </div>
    `;

    return;
  }


  container.innerHTML =
    tasks.map(task => {

      const index =
        state.tasks.indexOf(task);


      return `
        <div class="task-item ${task.done ? "done" : ""}">

          <label class="task-check">

            <input
              type="checkbox"
              data-task-index="${index}"
              ${task.done ? "checked" : ""}
            >

            <span>
              ${escapeHTML(task.text)}
            </span>

          </label>

          <button
            class="task-delete"
            data-delete-task="${index}"
            type="button"
          >
            ×
          </button>

        </div>
      `;

    }).join("");


  container
    .querySelectorAll("[data-task-index]")
    .forEach(input => {

      input.addEventListener(
        "change",
        event => {

          const index =
            Number(
              event.target.dataset.taskIndex
            );


          state.tasks[index].done =
            event.target.checked;


          saveState();

          updateTodayTasks();

          toast(
            event.target.checked
              ? "کار انجام شد ✅"
              : "کار دوباره فعال شد"
          );

        }
      );

    });


  container
    .querySelectorAll("[data-delete-task]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(
              button.dataset.deleteTask
            );


          state.tasks.splice(
            index,
            1
          );


          saveState();

          updateTodayTasks();

          toast("کار حذف شد");

        }
      );

    });

}


function openModal(id) {

  const modal =
    byId(id);

  if (!modal) return;

  modal.classList.remove("hidden");
}


function closeModal(id) {

  const modal =
    byId(id);

  if (!modal) return;

  modal.classList.add("hidden");
}


function addTask() {

  const input =
    byId("taskInput");


  if (!input) return;


  const text =
    input.value.trim();


  if (!text) {

    toast("عنوان کار را وارد کن");

    return;
  }


  state.tasks.push({

    id:
      crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()),

    date:
      todayKey(),

    text,

    done: false

  });


  saveState();

  input.value = "";

  closeModal("taskModal");

  updateTodayTasks();

  toast("کار اضافه شد ✅");
}


/* =========================================================
   STUDY SESSION
========================================================= */

function saveStudySession() {

  const subject =
    byId("studySubject")?.value ||
    "مطالعه";


  const minutes =
    Number(
      byId("studyMinutes")?.value
    );


  if (!minutes || minutes <= 0) {

    toast("زمان مطالعه را وارد کن");

    return;
  }


  state.studySessions.push({

    id:
      crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()),

    date:
      todayKey(),

    subject,

    minutes,

    createdAt:
      new Date().toISOString()

  });


  saveState();

  closeModal("studyModal");

  updateAll();

  toast(
    `${faNumber(minutes)} دقیقه مطالعه ثبت شد 📚`
  );
}


/* =========================================================
   TESTS
========================================================= */

function saveTest() {

  const subject =
    byId("testSubject")?.value;


  const total =
    Number(
      byId("testTotal")?.value
    );


  const correct =
    Number(
      byId("testCorrect")?.value
    );


  const wrong =
    Number(
      byId("testWrong")?.value
    );


  const blank =
    Number(
      byId("testBlank")?.value
    );


  if (!total || total <= 0) {

    toast("تعداد تست را وارد کن");

    return;
  }


  if (
    correct < 0 ||
    wrong < 0 ||
    blank < 0
  ) {

    toast("اعداد نامعتبر هستند");

    return;
  }


  if (
    correct +
    wrong +
    blank !==
    total
  ) {

    toast(
      "صحیح + غلط + نزده باید برابر کل تست باشد"
    );

    return;
  }


  state.tests.push({

    id:
      crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()),

    date:
      todayKey(),

    subject,

    total,

    correct,

    wrong,

    blank,

    accuracy:
      total
        ? (correct / total) * 100
        : 0,

    createdAt:
      new Date().toISOString()

  });


  saveState();

  renderTestHistory();

  updateAll();

  toast("تست ثبت شد 📝");
}


/* =========================================================
   TEST HISTORY
========================================================= */

function renderTestHistory() {

  const container =
    byId("testHistory");


  if (!container) return;


  if (!state.tests.length) {

    container.innerHTML = `
      <div class="empty-state">
        هنوز تستی ثبت نشده است.
      </div>
    `;

    return;
  }


  const tests =
    [...state.tests]
      .reverse()
      .slice(0, 30);


  container.innerHTML =
    tests.map(test => {

      const accuracy =
        Number(test.accuracy || 0);


      return `
        <div class="history-item">

          <div>

            <strong>
              ${escapeHTML(test.subject)}
            </strong>

            <small>
              ${formatDate(test.date)}
            </small>

          </div>

          <div class="history-stats">

            <span>
              کل: ${faNumber(test.total)}
            </span>

            <span class="ok">
              صحیح: ${faNumber(test.correct)}
            </span>

            <span class="bad">
              غلط: ${faNumber(test.wrong)}
            </span>

            <span>
              نزده: ${faNumber(test.blank)}
            </span>

            <strong>
              ${percent(accuracy)}
            </strong>

          </div>

        </div>
      `;

    }).join("");
}


/* =========================================================
   SUBJECTS
========================================================= */

function subjectStats(subject) {

  const tests =
    state.tests.filter(
      test =>
        test.subject === subject
    );


  const study =
    state.studySessions
      .filter(
        session =>
          session.subject === subject
      )
      .reduce(
        (sum, session) =>
          sum + Number(session.minutes || 0),
        0
      );


  const total =
    tests.reduce(
      (sum, test) =>
        sum + Number(test.total || 0),
      0
    );


  const correct =
    tests.reduce(
      (sum, test) =>
        sum + Number(test.correct || 0),
      0
    );


  const accuracy =
    total
      ? (correct / total) * 100
      : 0;


  return {
    tests: total,
    correct,
    accuracy,
    study
  };
}


function renderSubjects() {

  const container =
    byId("subjectsGrid");


  if (!container) return;


  container.innerHTML =
    SUBJECTS.map(subject => {

      const stats =
        subjectStats(subject);


      const level =
        stats.tests === 0
          ? "بدون داده"
          : stats.accuracy >= 80
            ? "قوی"
            : stats.accuracy >= 60
              ? "متوسط"
              : "نیازمند تقویت";


      const width =
        clamp(
          stats.accuracy,
          0,
          100
        );


      return `
        <div class="subject-card">

          <div class="subject-card-top">

            <div class="subject-icon">
              ${subjectIcon(subject)}
            </div>

            <div>

              <h3>
                ${subject}
              </h3>

              <span>
                ${level}
              </span>

            </div>

          </div>


          <div class="subject-progress">

            <div
              class="subject-progress-bar"
              style="width:${width}%"
            ></div>

          </div>


          <div class="subject-metrics">

            <span>
              📖 ${faNumber(stats.study)} دقیقه
            </span>

            <span>
              📝 ${faNumber(stats.tests)} تست
            </span>

            <span>
              🎯 ${percent(stats.accuracy)}
            </span>

          </div>

        </div>
      `;

    }).join("");
}


function subjectIcon(subject) {

  const icons = {

    "زیست": "🧬",

    "شیمی": "⚗️",

    "فیزیک": "⚡",

    "ریاضی": "📐",

    "دینی": "📖",

    "فارسی": "📚",

    "عربی": "✍️",

    "زبان": "🌐"

  };


  return icons[subject] || "📚";
}


/* =========================================================
   SMART REVIEWS
========================================================= */

function generateReviews() {

  const reviews = [];


  SUBJECTS.forEach(subject => {

    const stats =
      subjectStats(subject);


    if (
      stats.tests > 0 &&
      stats.accuracy < 70
    ) {

      reviews.push({

        subject,

        priority: "high",

        reason:
          "دقت تستی کمتر از ۷۰٪ است.",

        action:
          "مرور مبحث‌های غلط و سپس تست آموزشی"

      });

    } else if (
      stats.study > 0 &&
      stats.tests === 0
    ) {

      reviews.push({

        subject,

        priority: "medium",

        reason:
          "مطالعه ثبت شده ولی تستی ثبت نشده.",

        action:
          "پس از مطالعه چند تست آموزشی بزن"

      });

    } else if (
      stats.tests > 0 &&
      stats.accuracy < 85
    ) {

      reviews.push({

        subject,

        priority: "medium",

        reason:
          "دقت هنوز به سطح هدف نرسیده.",

        action:
          "مرور اشتباهات و تست زمان‌دار"

      });

    }

  });


  return reviews
    .sort(
      (a, b) =>
        priorityScore(b.priority) -
        priorityScore(a.priority)
    );

}


function priorityScore(priority) {

  if (priority === "high") return 3;

  if (priority === "medium") return 2;

  return 1;
}


function renderReviews() {

  const container =
    byId("reviewsList");


  if (!container) return;


  const reviews =
    generateReviews();


  if (!reviews.length) {

    container.innerHTML = `
      <div class="empty-state">
        فعلاً مورد فوری برای مرور پیدا نشد. ادامه بده 💪
      </div>
    `;

    return;
  }


  container.innerHTML =
    reviews.map(item => {

      return `
        <div class="review-card">

          <div class="review-top">

            <div class="subject-icon">
              ${subjectIcon(item.subject)}
            </div>

            <div>

              <h3>
                ${item.subject}
              </h3>

              <span class="priority-${item.priority}">
                ${
                  item.priority === "high"
                    ? "اولویت بالا"
                    : "اولویت متوسط"
                }
              </span>

            </div>

          </div>

          <p>
            ${item.reason}
          </p>

          <strong>
            پیشنهاد: ${item.action}
          </strong>

        </div>
      `;

    }).join("");
}


/* =========================================================
   PLAN GENERATOR
========================================================= */

function generatePlan() {

  const hours =
    Number(
      byId("planHours")?.value
    ) || 8;


  const priority =
    byId("planPriority")?.value ||
    "زیست";


  const intensity =
    byId("planIntensity")?.value ||
    "normal";


  const sessionMinutes =
    Number(
      byId("sessionMinutes")?.value
    ) || 50;


  const totalMinutes =
    clamp(hours, 1, 20) * 60;


  const breakMinutes =
    intensity === "aggressive"
      ? 5
      : intensity === "heavy"
        ? 8
        : 10;


  const sessions =
    Math.max(
      1,
      Math.floor(
        totalMinutes /
        sessionMinutes
      )
    );


  const order =
    buildSubjectOrder(priority);


  const plan = [];


  for (
    let i = 0;
    i < sessions;
    i++
  ) {

    const subject =
      order[
        i % order.length
      ];


    plan.push({

      id:
        `${Date.now()}-${i}`,

      index:
        i + 1,

      subject,

      minutes:
        sessionMinutes,

      break:
        breakMinutes,

      date:
        todayKey(),

      completed:
        false

    });

  }


  state.plan = plan;

  saveState();

  renderPlan();

  toast("برنامه جدید ساخته شد ✨");
}


function buildSubjectOrder(priority) {

  const stats =
    SUBJECTS.map(subject => {

      const s =
        subjectStats(subject);


      return {
        subject,
        accuracy: s.accuracy,
        study: s.study
      };

    });


  const weaknesses =
    stats
      .sort(
        (a, b) =>
          a.accuracy -
          b.accuracy
      )
      .map(x => x.subject);


  const result = [
    priority,
    ...weaknesses,
    ...SCIENCE_SUBJECTS,
    ...SUBJECTS
  ];


  return [
    ...new Set(result)
  ];

}


function renderPlan() {

  const container =
    byId("generatedPlan");


  if (!container) return;


  if (!state.plan.length) {

    container.innerHTML = `
      <div class="empty-state">
        برای ساخت برنامه تنظیمات را انتخاب کن.
      </div>
    `;

    return;
  }


  container.innerHTML =
    state.plan.map((item, index) => {

      return `
        <div class="plan-item">

          <div class="plan-number">
            ${faNumber(index + 1)}
          </div>

          <div class="plan-main">

            <strong>
              ${subjectIcon(item.subject)}
              ${item.subject}
            </strong>

            <span>
              ${faNumber(item.minutes)} دقیقه مطالعه
            </span>

          </div>

          <div class="plan-break">
            ${faNumber(item.break)} دقیقه استراحت
          </div>

        </div>
      `;

    }).join("");


  updatePlanGoalPreview();
}


function updatePlanGoalPreview() {

  const hours =
    Number(
      byId("planHours")?.value
    ) || state.profile.dailyGoal || 8;


  if (byId("planGoalPreview")) {

    byId("planGoalPreview").textContent =
      `${faNumber(hours)} ساعت مطالعه`;

  }

}


function clearPlan() {

  state.plan = [];

  saveState();

  renderPlan();

  toast("برنامه پاک شد");
}


/* =========================================================
   TIMER
========================================================= */

function setTimer(minutes) {

  stopTimer();

  timer.duration =
    minutes * 60;

  timer.remaining =
    timer.duration;

  updateTimerUI();

}


function updateTimerUI() {

  const element =
    byId("timerClock");


  if (!element) return;


  const minutes =
    Math.floor(
      timer.remaining / 60
    );


  const seconds =
    timer.remaining % 60;


  element.textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

}


function startTimer() {

  if (timer.running) {

    stopTimer();

    return;
  }


  timer.running = true;


  const button =
    byId("startTimerButton");


  if (button) {
    button.textContent =
      "⏸ توقف";
  }


  timer.interval =
    setInterval(() => {

      timer.remaining--;

      updateTimerUI();


      if (timer.remaining <= 0) {

        stopTimer();

        const minutes =
          Math.round(
            timer.duration / 60
          );


        state.studySessions.push({

          id:
            String(Date.now()),

          date:
            todayKey(),

          subject:
            "جلسه تمرکز",

          minutes,

          createdAt:
            new Date().toISOString()

        });


        saveState();

        updateAll();

        toast(
          `جلسه ${faNumber(minutes)} دقیقه‌ای تمام شد 🎉`
        );

      }

    }, 1000);

}


function stopTimer() {

  if (timer.interval) {

    clearInterval(
      timer.interval
    );

  }


  timer.interval = null;

  timer.running = false;


  const button =
    byId("startTimerButton");


  if (button) {

    button.textContent =
      "▶ شروع";

  }

}


function resetTimer() {

  stopTimer();

  timer.remaining =
    timer.duration;

  updateTimerUI();

}


/* =========================================================
   ANALYTICS
========================================================= */

function renderAnalytics() {

  const totalStudy =
    getTotalStudyMinutes();


  const totalTests =
    getTotalTests();


  const accuracy =
    getOverallAccuracy();


  const streak =
    calculateStreak();


  if (byId("analyticsStudy")) {

    byId("analyticsStudy").innerHTML =
      `<strong>${faNumber(totalStudy)}</strong> دقیقه`;

  }


  if (byId("analyticsTests")) {

    byId("analyticsTests").innerHTML =
      `<strong>${faNumber(totalTests)}</strong> تست`;

  }


  if (byId("analyticsAccuracy")) {

    byId("analyticsAccuracy").innerHTML =
      `<strong>${percent(accuracy)}</strong>`;

  }


  if (byId("analyticsStreak")) {

    byId("analyticsStreak").innerHTML =
      `<strong>${faNumber(streak)}</strong> روز`;

  }


  renderWeeklyChart();

  renderWeaknesses();

}


function renderWeeklyChart() {

  const container =
    byId("weeklyChart");


  if (!container) return;


  const data = [];


  for (
    let i = 6;
    i >= 0;
    i--
  ) {

    const key =
      daysAgo(i);


    const minutes =
      state.studySessions
        .filter(
          session =>
            session.date === key
        )
        .reduce(
          (sum, session) =>
            sum + Number(session.minutes || 0),
          0
        );


    data.push({

      key,

      minutes

    });

  }


  const max =
    Math.max(
      ...data.map(x => x.minutes),
      1
    );


  container.innerHTML = `

    <div class="weekly-bars">

      ${data.map(item => {

        const height =
          Math.max(
            5,
            (item.minutes / max) * 100
          );


        return `

          <div class="weekly-bar-column">

            <div class="weekly-bar-value">
              ${faNumber(item.minutes)}
            </div>

            <div class="weekly-bar-track">

              <div
                class="weekly-bar"
                style="height:${height}%"
              ></div>

            </div>

            <span>
              ${shortDay(item.key)}
            </span>

          </div>

        `;

      }).join("")}

    </div>
  `;

}


function shortDay(key) {

  const d =
    new Date(
      key + "T00:00:00"
    );


  return new Intl.DateTimeFormat(
    "fa-IR",
    {
      weekday: "short"
    }
  ).format(d);

}


function renderWeaknesses() {

  const container =
    byId("weaknessList");


  if (!container) return;


  const data =
    SUBJECTS.map(subject => {

      const stats =
        subjectStats(subject);


      return {

        subject,

        accuracy:
          stats.accuracy,

        tests:
          stats.tests

      };

    })


    .filter(
      x => x.tests > 0
    )


    .sort(
      (a, b) =>
        a.accuracy -
        b.accuracy
    );


  if (!data.length) {

    container.innerHTML =
      "هنوز داده کافی وجود ندارد.";

    return;
  }


  container.innerHTML =
    data
      .slice(0, 4)
      .map(x => {

        return `
          <div class="weakness-item">

            <span>
              ${subjectIcon(x.subject)}
              ${x.subject}
            </span>

            <strong>
              ${percent(x.accuracy)}
            </strong>

          </div>
        `;

      })
      .join("");

}


/* =========================================================
   AI
========================================================= */

async function callAI(message) {

  const response =
    await fetch(
      "/.netlify/functions/ai",
      {

        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({

            message,

            profile:
              state.profile,

            history:
              state.messages
                .slice(-12)

          })

      }
    );


  if (!response.ok) {

    let errorText =
      "خطا در اتصال به AI";


    try {

      const error =
        await response.json();


      errorText =
        error.error ||
        error.message ||
        errorText;

    } catch {}


    throw new Error(
      errorText
    );

  }


  const data =
    await response.json();


  return (
    data.reply ||
    data.message ||
    "پاسخی دریافت نشد."
  );

}


/* =========================================================
   AI CONTEXT
========================================================= */

function buildAIContext() {

  const studyToday =
    getTodayStudyMinutes();


  const testsToday =
    getTodayTests();


  const todayTotal =
    testsToday.reduce(
      (sum, x) =>
        sum + Number(x.total || 0),
      0
    );


  const todayCorrect =
    testsToday.reduce(
      (sum, x) =>
        sum + Number(x.correct || 0),
      0
    );


  const accuracy =
    todayTotal
      ? (todayCorrect / todayTotal) * 100
      : 0;


  const weak =
    SUBJECTS
      .map(subject => {

        const s =
          subjectStats(subject);

        return {
          subject,
          accuracy: s.accuracy,
          tests: s.tests
        };

      })

      .filter(
        x => x.tests > 0
      )

      .sort(
        (a, b) =>
          a.accuracy -
          b.accuracy
      )

      .slice(0, 3);


  return {

    todayStudy,

    todayTests:
      todayTotal,

    todayAccuracy:
      accuracy,

    totalStudy:
      getTotalStudyMinutes(),

    totalTests:
      getTotalTests(),

    overallAccuracy:
      getOverallAccuracy(),

    streak:
      calculateStreak(),

    weakSubjects:
      weak,

    goal:
      state.profile.goal,

    examDate:
      state.profile.examDate

  };

}


/* =========================================================
   AI CHAT
========================================================= */

function appendChatMessage(role, text) {

  const container =
    byId("chatMessages");


  if (!container) return;


  const wrapper =
    document.createElement("div");


  wrapper.className =
    `chat-message ${
      role === "user"
        ? "user-message"
        : "ai-message"
    }`;


  wrapper.innerHTML = `

    <div class="message-avatar">
      ${
        role === "user"
          ? "👨‍🎓"
          : "🤖"
      }
    </div>

    <div class="message-content">

      <strong>
        ${
          role === "user"
            ? "من"
            : "مشاور"
        }
      </strong>

      <p>
        ${escapeHTML(text)}
      </p>

    </div>

  `;


  container.appendChild(
    wrapper
  );


  container.scrollTop =
    container.scrollHeight;

}


async function sendMessage() {

  const input =
    byId("chatInput");


  if (!input) return;


  const message =
    input.value.trim();


  if (!message) return;


  appendChatMessage(
    "user",
    message
  );


  state.messages.push({

    role: "user",

    text: message,

    date:
      new Date().toISOString()

  });


  input.value = "";


  const loading =
    byId("loadingOverlay");


  if (loading) {

    loading.classList.remove(
      "hidden"
    );

  }


  try {

    const context =
      buildAIContext();


    const enrichedMessage = `

${message}

اطلاعات فعلی دانش‌آموز:

هدف:
${state.profile.goal}

تاریخ آزمون:
${state.profile.examDate || "نامشخص"}

مطالعه امروز:
${context.todayStudy} دقیقه

تست امروز:
${context.todayTests}

دقت امروز:
${Math.round(context.todayAccuracy)}٪

کل مطالعه:
${context.totalStudy} دقیقه

کل تست:
${context.totalTests}

دقت کل:
${Math.round(context.overallAccuracy)}٪

استمرار:
${context.streak} روز

نقاط ضعف احتمالی:
${context.weakSubjects.map(
  x =>
    `${x.subject}: ${Math.round(x.accuracy)}٪`
).join("، ") || "داده کافی نیست"}

    `;


    const reply =
      await callAI(
        enrichedMessage
      );


    appendChatMessage(
      "ai",
      reply
    );


    state.messages.push({

      role: "assistant",

      text: reply,

      date:
        new Date().toISOString()

    });


    saveState();

  } catch (error) {

    console.error(error);


    appendChatMessage(
      "ai",
      "متأسفانه اتصال به مشاور برقرار نشد. تنظیمات Netlify و GROQ_API_KEY را بررسی کن."
    );

  } finally {

    if (loading) {

      loading.classList.add(
        "hidden"
      );

    }

  }

}


/* =========================================================
   DASHBOARD AI ADVICE
========================================================= */

async function analyzeDashboard() {

  const output =
    byId("dashboardAdvice");


  if (!output) return;


  output.textContent =
    "در حال تحلیل وضعیتت...";


  const context =
    buildAIContext();


  const prompt = `

وضعیت دانش‌آموز را تحلیل کن.

هدف:
${state.profile.goal}

مطالعه امروز:
${context.todayStudy} دقیقه

تست امروز:
${context.todayTests}

دقت امروز:
${Math.round(context.todayAccuracy)}٪

کل مطالعه:
${context.totalStudy} دقیقه

کل تست:
${context.totalTests}

دقت کل:
${Math.round(context.overallAccuracy)}٪

استمرار:
${context.streak} روز

نقاط ضعف:
${context.weakSubjects.map(
  x =>
    `${x.subject}: ${Math.round(x.accuracy)}٪`
).join("، ") || "نامشخص"}

در ۵ تا ۸ خط بگو امروز دقیقاً چه کار کند.
اولویت‌ها را مشخص کن.
`;


  try {

    const reply =
      await callAI(prompt);


    output.textContent =
      reply;

  } catch {

    output.textContent =
      "فعلاً AI در دسترس نیست. بر اساس عملکرد ثبت‌شده، ابتدا ضعیف‌ترین درس را مرور کن و سپس تست آموزشی بزن.";

  }

}


/* =========================================================
   BACKUP
========================================================= */

function exportBackup() {

  const data =
    JSON.stringify(
      state,
      null,
      2
    );


  const blob =
    new Blob(
      [data],
      {
        type:
          "application/json"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const a =
    document.createElement("a");


  a.href = url;

  a.download =
    `studycoach-backup-${todayKey()}.json`;


  document.body.appendChild(a);

  a.click();

  a.remove();

  URL.revokeObjectURL(url);

  toast("فایل پشتیبان آماده شد 💾");
}


function importBackup(file) {

  if (!file) return;


  const reader =
    new FileReader();


  reader.onload =
    event => {

      try {

        const imported =
          JSON.parse(
            event.target.result
          );


        state =
          normalizeState(
            imported
          );


        saveState();

        updateAll();

        toast(
          "اطلاعات بازیابی شد ✅"
        );

      } catch {

        toast(
          "فایل پشتیبان معتبر نیست"
        );

      }

    };


  reader.readAsText(
    file
  );

}


/* =========================================================
   CLEAR DATA
========================================================= */

function clearAllData() {

  const confirmed =
    window.confirm(
      "تمام اطلاعات StudyCoach پاک شود؟ این کار قابل بازگشت نیست."
    );


  if (!confirmed) return;


  localStorage.removeItem(
    STORAGE_KEY
  );


  state =
    cloneDefaultState();


  updateAll();

  toast(
    "تمام اطلاعات پاک شد"
  );

}


/* =========================================================
   THEME
========================================================= */

function updateThemeUI() {

  const dark =
    state.settings.darkMode;


  document.body.classList.toggle(
    "dark",
    dark
  );


  const button =
    byId("themeButton");


  if (button) {

    button.textContent =
      dark
        ? "☀️"
        : "🌙";

  }

}


function toggleTheme() {

  state.settings.darkMode =
    !state.settings.darkMode;


  saveState();

  updateThemeUI();

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================================
   EVENT BINDINGS
========================================================= */

function bindNavigation() {

  $$(".nav-item").forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          navigate(
            button.dataset.page
          );

        }
      );

    }
  );

}


function bindQuickActions() {

  $$(".quick-action")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const action =
            button.dataset.action;


          if (action === "study") {

            openModal(
              "studyModal"
            );

          }


          if (action === "test") {

            navigate("tests");

          }


          if (action === "plan") {

            navigate("planner");

          }


          if (action === "timer") {

            navigate("timer");

          }

        }
      );

    });

}


function bindSuggestionButtons() {

  $$(".suggestion-button")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const input =
            byId("chatInput");


          if (!input) return;


          input.value =
            button.textContent.trim();


          navigate("coach");

          input.focus();

        }
      );

    });

}


function bindModalButtons() {

  $$("[data-close-modal]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          closeModal(
            button.dataset.closeModal
          );

        }
      );

    });


  $$(".modal")
    .forEach(modal => {

      modal.addEventListener(
        "click",
        event => {

          if (
            event.target === modal
          ) {

            modal.classList.add(
              "hidden"
            );

          }

        }
      );

    });

}


function bindAllEvents() {

  bindNavigation();

  bindQuickActions();

  bindSuggestionButtons();

  bindModalButtons();


  byId("menuButton")
    ?.addEventListener(
      "click",
      () => {

        byId("sidebar")
          ?.classList.toggle(
            "open"
          );

      }
    );


  byId("themeButton")
    ?.addEventListener(
      "click",
      toggleTheme
    );


  byId("dashboardPlanButton")
    ?.addEventListener(
      "click",
      () => {

        navigate("planner");

      }
    );


  byId("dashboardCoachButton")
    ?.addEventListener(
      "click",
      () => {

        navigate("coach");

      }
    );


  byId("analyzeButton")
    ?.addEventListener(
      "click",
      analyzeDashboard
    );


  byId("addTaskButton")
    ?.addEventListener(
      "click",
      () => {

        openModal(
          "taskModal"
        );

      }
    );


  byId("saveTaskButton")
    ?.addEventListener(
      "click",
      addTask
    );


  byId("saveStudyButton")
    ?.addEventListener(
      "click",
      saveStudySession
    );


  byId("saveTestButton")
    ?.addEventListener(
      "click",
      saveTest
    );


  byId("generatePlanButton")
    ?.addEventListener(
      "click",
      generatePlan
    );


  byId("clearPlanButton")
    ?.addEventListener(
      "click",
      clearPlan
    );


  byId("startTimerButton")
    ?.addEventListener(
      "click",
      startTimer
    );


  byId("resetTimerButton")
    ?.addEventListener(
      "click",
      resetTimer
    );


  $$(".timer-preset")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          $$(".timer-preset")
            .forEach(
              b =>
                b.classList.remove(
                  "active"
                )
            );


          button.classList.add(
            "active"
          );


          setTimer(
            Number(
              button.dataset.minutes
            )
          );

        }
      );

    });


  byId("sendMessageButton")
    ?.addEventListener(
      "click",
      sendMessage
    );


  byId("chatInput")
    ?.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {

          event.preventDefault();

          sendMessage();

        }

      }
    );


  byId("saveGoalButton")
    ?.addEventListener(
      "click",
      saveGoal
    );


  byId("saveProfileButton")
    ?.addEventListener(
      "click",
      saveProfile
    );


  byId("backupButton")
    ?.addEventListener(
      "click",
      exportBackup
    );


  byId("settingsBackupButton")
    ?.addEventListener(
      "click",
      exportBackup
    );


  byId("restoreButton")
    ?.addEventListener(
      "click",
      () =>
        byId("restoreFile")?.click()
    );


  byId("settingsRestoreButton")
    ?.addEventListener(
      "click",
      () =>
        byId("restoreFile")?.click()
    );


  byId("restoreFile")
    ?.addEventListener(
      "change",
      event =>
        importBackup(
          event.target.files[0]
        )
    );


  byId("clearDataButton")
    ?.addEventListener(
      "click",
      clearAllData
    );


  byId("quickPlan")
    ?.addEventListener(
      "click",
      () => {

        navigate("planner");

        generatePlan();

      }
    );


  byId("planHours")
    ?.addEventListener(
      "input",
      updatePlanGoalPreview
    );

}


/* =========================================================
   UPDATE ALL
========================================================= */

function updateAll() {

  updateThemeUI();

  updateProfileUI();

  updateDashboard();

  renderSubjects();

  renderTestHistory();

  renderReviews();

  renderPlan();

  renderAnalytics();

  updatePlanGoalPreview();

}


/* =========================================================
   INITIALIZATION
========================================================= */

function initializeApp() {

  console.log(
    `StudyCoach V${APP_VERSION} initialized`
  );


  bindAllEvents();

  updateAll();

  updateTimerUI();

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