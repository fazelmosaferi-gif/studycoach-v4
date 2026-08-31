const KEY="studycoach_v5";
const defaults={
  profile:{
    name:"",
    target:"پزشکی دانشگاه تهران",
    dailyHours:8,
    examDate:""
  },
  subjects:[
    {
      id:"bio",
      name:"زیست‌شناسی",
      hours:0,
      goal:0
    },
    {
      id:"chem",
      name:"شیمی",
      hours:0,
      goal:0
    },
    {
      id:"math",
      name:"ریاضی",
      hours:0,
      goal:0
    },
    {
      id:"phys",
      name:"فیزیک",
      hours:0,
      goal:0
    }
  ],
  tasks:[],
  mistakes:[],
  reviews:[],
  tests:[],
  messages:[],
  settings:{
    dark:false,
    autoPlan:true
  }
};
let state=load();
let page="dashboard";
let timer={
  sec:1500,
  running:false,
  id:null
};
function load(){
  try{
    return {
      ...defaults,
      ...JSON.parse(
        localStorage.getItem(KEY)||"{}"
      )
    };
  }catch{
    return structuredClone(defaults);
  }
}
function save(){
  localStorage.setItem(
    KEY,
    JSON.stringify(state)
  );
}
function toast(message){
  const t=document.querySelector("#toast");
  if(!t)return;
  t.textContent=message;
  t.classList.add("show");
  setTimeout(
    ()=>t.classList.remove("show"),
    2200
  );
}
function today(){
  return new Date()
    .toISOString()
    .slice(0,10);
}
function id(){
  return Date.now().toString(36)+
    Math.random().toString(36).slice(2,7);
}
function esc(s=""){
  return String(s).replace(
    /[&<>"']/g,
    m=>({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#039;"
    }[m])
  );
}
function render(){
  document
    .querySelectorAll(".nav-item")
    .forEach(x=>{
      x.classList.toggle(
        "active",
        x.dataset.page===page
      );
    });
  document.body.classList.toggle(
    "dark",
    !!state.settings.dark
  );
  const views={
    dashboard,
    planner,
    subjects,
    tasks,
    mistakes,
    review,
    tests,
    ai,
    profile,
    settings
  };
  document.querySelector("#main")
    .innerHTML=
    (views[page]||dashboard)();
  bind();
}
function shell(title,sub,body){
  return `
    <div class="between">
      <div>
        <h1 class="page-title">
          ${title}
        </h1>
        <div class="muted">
          ${sub||""}
        </div>
      </div>
    </div>
    ${body}
  `;
}
function dashboard(){
  const done=
    state.tasks.filter(x=>x.done).length;
  const total=
    state.tasks.length;
  const hours=
    state.tasks
      .filter(x=>x.done)
      .reduce(
        (a,x)=>a+(+x.minutes||0),
        0
      )/60;
  const pct=
    total
      ?Math.round(done/total*100)
      :0;
  return shell(
    "داشبورد",
    "تصویر کلی وضعیت مطالعه امروز",
    `
    <div class="grid section">
      <div class="card">
        <div class="muted">
          تکالیف
        </div>
        <div class="stat">
          ${done}/${total}
        </div>
        <div class="progress">
          <i style="width:${pct}%"></i>
        </div>
      </div>
      <div class="card">
        <div class="muted">
          ساعت مطالعه ثبت‌شده
        </div>
        <div class="stat">
          ${hours.toFixed(1)}
        </div>
      </div>
      <div class="card">
        <div class="muted">
          اشتباهات
        </div>
        <div class="stat">
          ${state.mistakes.length}
        </div>
      </div>
      <div class="card">
        <div class="muted">
          آزمون‌ها
        </div>
        <div class="stat">
          ${state.tests.length}
        </div>
      </div>
    </div>
    <div class="grid2 section">
      <div class="card">
        <div class="between">
          <h3>
            کارهای امروز
          </h3>
          <button
            class="btn small"
            data-go="tasks">
            مدیریت
          </button>
        </div>
        <div class="list">
          ${
            state.tasks
              .filter(x=>x.date===today())
              .slice(0,6)
              .map(t=>`
                <div class="item check">
                  <input
                    type="checkbox"
                    data-task="${t.id}"
                    ${t.done?"checked":""}
                  >
                  <span>
                    ${esc(t.title)}
                    <span class="tag">
                      ${esc(t.subject||"عمومی")}
                    </span>
                  </span>
                </div>
              `)
              .join("")
              ||
              `<div class="empty">
                برای امروز کاری ثبت نشده.
              </div>`
          }
        </div>
      </div>
      <div class="card">
        <h3>
          تمرکز سریع
        </h3>
        <div
          class="timer"
          id="timer">
          25:00
        </div>
        <div
          class="row"
          style="justify-content:center">
          <button
            class="btn"
            id="startTimer">
            شروع
          </button>
          <button
            class="btn secondary"
            id="resetTimer">
            بازنشانی
          </button>
        </div>
      </div>
    </div>
    `
  );
}
function planner(){
  return shell(
    "برنامه‌ریزی هوشمند",
    "برنامه روزانه را بساز",
    `
    <div class="card section">
      <div class="form-grid">
        <label>
          ساعت مطالعه هدف
          <input
            id="planHours"
            type="number"
            min="1"
            max="20"
            value="${state.profile.dailyHours}"
          >
        </label>
        <label>
          تاریخ هدف
          <input
            id="planDate"
            type="date"
            value="${state.profile.examDate||""}"
          >
        </label>
      </div>
      <div
        class="row"
        style="margin-top:12px">
        <button
          class="btn"
          id="generatePlan">
          ساخت برنامه امروز
        </button>
        <button
          class="btn secondary"
          id="clearToday">
          پاک‌کردن کارهای امروز
        </button>
      </div>
    </div>
    <div class="grid section">
      ${state.subjects.map(s=>`
        <div class="card">
          <div class="between">
            <h3>
              ${esc(s.name)}
            </h3>
            <span class="tag">
              ${s.hours||0} ساعت
            </span>
          </div>
          <p class="muted">
            سهم پیشنهادی:
            ${
              (
                state.profile.dailyHours/
                Math.max(
                  1,
                  state.subjects.length
                )
              ).toFixed(1)
            }
            ساعت
          </p>
        </div>
      `).join("")}
    </div>
    `
  );
}
function subjects(){
  return shell(
    "دروس",
    "مدیریت درس‌ها",
    `
    <div class="grid section">
      ${state.subjects.map(s=>`
        <div class="card">
          <div class="between">
            <h3>
              ${esc(s.name)}
            </h3>
            <span class="tag">
              ${s.hours||0} ساعت
            </span>
          </div>
          <label class="muted">
            هدف ساعت هفتگی
            <input
              data-hours="${s.id}"
              type="number"
              min="0"
              value="${s.hours||0}"
            >
          </label>
          <div
            class="row"
            style="margin-top:10px">
            <button
              class="btn small"
              data-addtask="${s.id}">
              افزودن کار
            </button>
          </div>
        </div>
      `).join("")}
    </div>
    `
  );
}
function tasks(){
  return shell(
    "وظایف",
    "کارهای مطالعه",
    `
    <div class="card section">
      <div class="form-grid">
        <input
          id="taskTitle"
          placeholder="مثلاً زیست: فصل ۳ + ۳۰ تست"
        >
        <select id="taskSubject">
          ${state.subjects.map(s=>`
            <option value="${s.id}">
              ${esc(s.name)}
            </option>
          `).join("")}
        </select>
        <input
          id="taskMinutes"
          type="number"
          min="5"
          value="60"
          placeholder="دقیقه"
        >
        <input
          id="taskDate"
          type="date"
          value="${today()}"
        >
      </div>
      <button
        class="btn"
        id="addTask"
        style="margin-top:12px">
        افزودن کار
      </button>
    </div>
    <div class="list section">
      ${
        state.tasks.map(t=>`
          <div class="item between">
            <div class="check">
              <input
                type="checkbox"
                data-task="${t.id}"
                ${t.done?"checked":""}
              >
              <div>
                <b>
                  ${esc(t.title)}
                </b>
                <div class="muted">
                  ${esc(t.subject||"عمومی")}
                  ·
                  ${t.minutes} دقیقه
                  ·
                  ${t.date}
                </div>
              </div>
            </div>
            <button
              class="btn danger small"
              data-delete-task="${t.id}">
              حذف
            </button>
          </div>
        `).join("")
        ||
        `<div class="empty">
          هنوز کاری ثبت نشده.
        </div>`
      }
    </div>
    `
  );
}
function mistakes(){
  return shell(
    "دفترچه اشتباهات",
    "اشتباهات تستی را ثبت کن",
    `
    <div class="card section">
      <div class="form-grid">
        <input
          id="mistakeTopic"
          placeholder="مبحث"
        >
        <input
          id="mistakeQ"
          placeholder="شماره سؤال"
        >
        <textarea
          class="full"
          id="mistakeNote"
          placeholder="علت اشتباه، نکته و راه‌حل"
        ></textarea>
      </div>
      <button
        class="btn"
        id="addMistake"
        style="margin-top:12px">
        ثبت اشتباه
      </button>
    </div>
    <div class="list section">
      ${
        state.mistakes.map(m=>`
          <div class="item">
            <div class="between">
              <b>
                ${esc(m.topic)}
              </b>
              <span class="tag">
                ${esc(m.q||"سؤال")}
              </span>
            </div>
            <p>
              ${esc(m.note)}
            </p>
            <div class="row">
              <button
                class="btn small"
                data-review-mistake="${m.id}">
                افزودن به مرور
              </button>
              <button
                class="btn danger small"
                data-delete-mistake="${m.id}">
                حذف
              </button>
            </div>
          </div>
        `).join("")
        ||
        `<div class="empty">
          دفترچه خالی است.
        </div>`
      }
    </div>
    `
  );
}
function review(){
  return shell(
    "مرور هوشمند",
    "مرور فاصله‌دار",
    `
    <div class="card section">
      <div class="form-grid">
        <input
          id="reviewTitle"
          placeholder="موضوع مرور"
        >
        <select id="reviewLevel">
          <option value="1">
            مرور ۱
          </option>
          <option value="2">
            مرور ۲
          </option>
          <option value="3">
            مرور ۳
          </option>
          <option value="4">
            مرور ۴
          </option>
        </select>
      </div>
      <button
        class="btn"
        id="addReview"
        style="margin-top:12px">
        برنامه‌ریزی مرور
      </button>
    </div>
    <div class="list section">
      ${
        state.reviews.map(r=>`
          <div class="item between">
            <div>
              <b>
                ${esc(r.title)}
              </b>
              <div class="muted">
                مرور ${r.level}
                ·
                موعد ${r.due}
              </div>
            </div>
            <button
              class="btn small"
              data-done-review="${r.id}">
              انجام شد
            </button>
          </div>
        `).join("")
        ||
        `<div class="empty">
          مروری ثبت نشده.
        </div>`
      }
    </div>
    `
  );
}
function tests(){
  const avg=
    state.tests.length
    ?
    state.tests.reduce(
      (a,x)=>a+(+x.score||0),
      0
    )/state.tests.length
    :
    0;
  return shell(
    "آزمون و تست",
    "نتیجه آزمون‌ها",
    `
    <div class="grid section">
      <div class="card">
        <div class="muted">
          تعداد آزمون
        </div>
        <div class="stat">
          ${state.tests.length}
        </div>
      </div>
      <div class="card">
        <div class="muted">
          میانگین درصد
        </div>
        <div class="stat">
          ${avg.toFixed(1)}%
        </div>
      </div>
    </div>
    <div class="card section">
      <div class="form-grid">
        <input
          id="testName"
          placeholder="نام آزمون"
        >
        <input
          id="testScore"
          type="number"
          min="0"
          max="100"
          placeholder="درصد"
        >
      </div>
      <button
        class="btn"
        id="addTest"
        style="margin-top:12px">
        ثبت نتیجه
      </button>
    </div>
    <div class="list section">
      ${
        state.tests.map(t=>`
          <div class="item between">
            <div>
              <b>
                ${esc(t.name)}
              </b>
              <div class="muted">
                ${t.date}
              </div>
            </div>
            <span class="tag">
              ${t.score}%
            </span>
          </div>
        `).join("")
      }
    </div>
    `
  );
}
function ai(){
  return shell(
    "AI Coach",
    "مشاور هوشمند",
    `
    <div class="card section">
      <div
        id="chat"
        class="chat">
        ${
          state.messages.map(m=>`
            <div
              class="bubble ${
                m.role==="user"
                ?"user"
                :"ai"
              }">
              ${esc(m.content)}
            </div>
          `).join("")
          ||
          `<div class="empty">
            سؤالت را درباره برنامه‌ریزی،
            درس‌خواندن یا تحلیل عملکرد بپرس.
          </div>`
        }
      </div>
      <div
        class="row"
        style="margin-top:10px">
        <textarea
          id="aiInput"
          style="min-height:70px"
          placeholder="مثلاً برای فردا با ۸ ساعت مطالعه چه برنامه‌ای پیشنهاد می‌کنی؟"
        ></textarea>
        <button
          class="btn"
          id="sendAI">
          ارسال
        </button>
      </div>
    </div>
    `
  );
}
function profile(){
  return shell(
    "پروفایل",
    "اطلاعات شخصی برنامه",
    `
    <div class="card section">
      <div class="form-grid">
        <label>
          نام
          <input
            id="pName"
            value="${esc(state.profile.name)}"
          >
        </label>
        <label>
          هدف
          <input
            id="pTarget"
            value="${esc(state.profile.target)}"
          >
        </label>
        <label>
          ساعت مطالعه روزانه
          <input
            id="pHours"
            type="number"
            min="1"
            max="20"
            value="${state.profile.dailyHours}"
          >
        </label>
        <label>
          تاریخ هدف
          <input
            id="pDate"
            type="date"
            value="${state.profile.examDate||""}"
          >
        </label>
      </div>
      <button
        class="btn"
        id="saveProfile"
        style="margin-top:12px">
        ذخیره پروفایل
      </button>
    </div>
    `
  );
}
function settings(){
  return shell(
    "تنظیمات",
    "کنترل ظاهر و داده‌ها",
    `
    <div class="card section">
      <label class="check">
        <input
          id="darkMode"
          type="checkbox"
          ${state.settings.dark?"checked":""}
        >
        حالت تاریک
      </label>
      <label
        class="check"
        style="margin-top:12px">
        <input
          id="autoPlan"
          type="checkbox"
          ${state.settings.autoPlan?"checked":""}
        >
        پیشنهاد برنامه هوشمند
      </label>
    </div>
    <div
      class="card danger-zone section">
      <h3>
        مدیریت داده‌ها
      </h3>
      <p class="muted">
        پاک‌کردن داده‌ها برگشت‌پذیر نیست.
      </p>
      <button
        class="btn danger"
        id="resetData">
        حذف همه داده‌ها
      </button>
    </div>
    `
  );
}
function addTask(){
  const title=
    document
      .querySelector("#taskTitle")
      .value
      .trim();
  if(!title){
    return toast(
      "عنوان کار را وارد کن"
    );
  }
  state.tasks.push({
    id:id(),
    title,
    subject:
      document
        .querySelector("#taskSubject")
        .value,
    minutes:
      +document
        .querySelector("#taskMinutes")
        .value||60,
    date:
      document
        .querySelector("#taskDate")
        .value||today(),
    done:false
  });
  save();
  render();
  toast("کار اضافه شد");
}
async function sendAI(){
  const input=
    document.querySelector("#aiInput");
  const text=
    input.value.trim();
  if(!text)return;
  state.messages.push({
    role:"user",
    content:text
  });
  save();
  render();
  try{
    const res=
      await fetch(
        "/.netlify/functions/ai",
        {
          method:"POST",
          headers:{
            "Content-Type":
              "application/json"
          },
          body:JSON.stringify({
            messages:
              state.messages.slice(-12),
            profile:
              state.profile,
            subjects:
              state.subjects,
            tasks:
              state.tasks.slice(-20),
            mistakes:
              state.mistakes.slice(-20)
          })
        }
      );
    const data=
      await res.json();
    if(!res.ok){
      throw new Error(
        data.error||
        "خطای سرور"
      );
    }
    state.messages.push({
      role:"assistant",
      content:
        data.content||
        "پاسخی دریافت نشد."
    });
    save();
    render();
  }catch(e){
    state.messages.push({
      role:"assistant",
      content:
        "خطا در اتصال به AI: "+
        e.message
    });
    save();
    render();
  }
}
function setupTimer(){
  const el=
    document.querySelector("#timer");
  if(!el)return;
  const paint=()=>{
    const m=
      String(
        Math.floor(
          timer.sec/60
        )
      ).padStart(2,"0");
    const s=
      String(
        timer.sec%60
      ).padStart(2,"0");
    el.textContent=
      `${m}:${s}`;
  };
  paint();
  document
    .querySelector("#startTimer")
    ?.addEventListener(
      "click",
      ()=>{
        if(timer.running)return;
        timer.running=true;
        timer.id=
          setInterval(
            ()=>{
              timer.sec--;
              paint();
              if(timer.sec<=0){
                clearInterval(
                  timer.id
                );
                timer.running=false;
                toast(
                  "جلسه تمرکز تمام شد 🎉"
                );
              }
            },
            1000
          );
      }
    );
  document
    .querySelector("#resetTimer")
    ?.addEventListener(
      "click",
      ()=>{
        clearInterval(
          timer.id
        );
        timer.running=false;
        timer.sec=1500;
        paint();
      }
    );
}
function bind(){
  document
    .querySelector("#menuBtn")
    ?.addEventListener(
      "click",
      ()=>{
        document
          .querySelector("#sidebar")
          .classList.toggle("open");
      }
    );
  document
    .querySelector("#themeBtn")
    ?.addEventListener(
      "click",
      ()=>{
        state.settings.dark=
          !state.settings.dark;
        save();
        render();
      }
    );
  document
    .querySelectorAll(".nav-item")
    .forEach(b=>{
      b.addEventListener(
        "click",
        ()=>{
          page=b.dataset.page;
          document
            .querySelector("#sidebar")
            .classList.remove("open");
          render();
        }
      );
    });
  document
    .querySelectorAll("[data-go]")
    .forEach(b=>{
      b.addEventListener(
        "click",
        ()=>{
          page=b.dataset.go;
          render();
        }
      );
    });
  document
    .querySelectorAll("[data-task]")
    .forEach(c=>{
      c.addEventListener(
        "change",
        ()=>{
          const t=
            state.tasks.find(
              x=>x.id===c.dataset.task
            );
          if(t){
            t.done=
              c.checked;
            save();
            render();
          }
        }
      );
    });
  document
    .querySelector("#addTask")
    ?.addEventListener(
      "click",
      addTask
    );
  document
    .querySelectorAll(
      "[data-delete-task]"
    )
    .forEach(b=>{
      b.addEventListener(
        "click",
        ()=>{
          state.tasks=
            state.tasks.filter(
              x=>
                x.id!==b.dataset.deleteTask
            );
          save();
          render();
        }
      );
    });
  document
    .querySelector("#addMistake")
    ?.addEventListener(
      "click",
      ()=>{
        const topic=
          mistakeTopic.value.trim();
        if(!topic){
          return toast(
            "مبحث را وارد کن"
          );
        }
        state.mistakes.push({
          id:id(),
          topic,
          q:mistakeQ.value,
          note:mistakeNote.value,
          date:today()
        });
        save();
        render();
        toast("اشتباه ثبت شد");
      }
    );
  document
    .querySelectorAll(
      "[data-delete-mistake]"
    )
    .forEach(b=>{
      b.addEventListener(
        "click",
        ()=>{
          state.mistakes=
            state.mistakes.filter(
              x=>
                x.id!==b.dataset.deleteMistake
            );
          save();
          render();
        }
      );
    });
  document
    .querySelectorAll(
      "[data-review-mistake]"
    )
    .forEach(b=>{
      b.addEventListener(
        "click",
        ()=>{
          const m=
            state.mistakes.find(
              x=>
                x.id===
                b.dataset.reviewMistake
            );
          if(m){
            state.reviews.push({
              id:id(),
              title:
                m.topic+
                " — "+
                m.q,
              level:1,
              due:today()
            });
            save();
            render();
            toast(
              "به مرور اضافه شد"
            );
          }
        }
      );
    });
  document
    .querySelector("#addReview")
    ?.addEventListener(
      "click",
      ()=>{
        const title=
          reviewTitle.value.trim();
        if(!title){
          return toast(
            "موضوع مرور را وارد کن"
          );
        }
        const l=
          +reviewLevel.value;
        const d=
          new Date();
        d.setDate(
          d.getDate()+
          [1,3,7,14][l-1]
        );
        state.reviews.push({
          id:id(),
          title,
          level:l,
          due:
            d.toISOString()
              .slice(0,10)
        });
        save();
        render();
      }
    );
  document
    .querySelectorAll(
      "[data-done-review]"
    )
    .forEach(b=>{
      b.addEventListener(
        "click",
        ()=>{
          const r=
            state.reviews.find(
              x=>
                x.id===
                b.dataset.doneReview
            );
          if(r){
            r.level=
              Math.min(
                4,
                r.level+1
              );
            const d=
              new Date();
            d.setDate(
              d.getDate()+
              [1,3,7,14][r.level-1]
            );
            r.due=
              d.toISOString()
                .slice(0,10);
            save();
            render();
          }
        }
      );
    });
  document
    .querySelector("#addTest")
    ?.addEventListener(
      "click",
      ()=>{
        const name=
          testName.value.trim();
        if(!name){
          return toast(
            "نام آزمون را وارد کن"
          );
        }
        state.tests.push({
          id:id(),
          name,
          score:
            Math.max(
              0,
              Math.min(
                100,
                +testScore.value||0
              )
            ),
          date:today()
        });
        save();
        render();
      }
    );
  document
    .querySelector("#saveProfile")
    ?.addEventListener(
      "click",
      ()=>{
        state.profile={
          ...state.profile,
          name:
            pName.value.trim(),
          target:
            pTarget.value.trim(),
          dailyHours:
            +pHours.value||8,
          examDate:
            pDate.value
        };
        save();
        toast(
          "پروفایل ذخیره شد"
        );
      }
    );
  document
    .querySelector("#darkMode")
    ?.addEventListener(
      "change",
      e=>{
        state.settings.dark=
          e.target.checked;
        save();
        render();
      }
    );
  document
    .querySelector("#autoPlan")
    ?.addEventListener(
      "change",
      e=>{
        state.settings.autoPlan=
          e.target.checked;
        save();
      }
    );
  document
    .querySelector("#resetData")
    ?.addEventListener(
      "click",
      ()=>{
        if(
          confirm(
            "همه داده‌ها حذف شود؟"
          )
        ){
          state=
            structuredClone(
              defaults
            );
          save();
          render();
          toast(
            "داده‌ها حذف شد"
          );
        }
      }
    );
  document
    .querySelectorAll(
      "[data-hours]"
    )
    .forEach(i=>{
      i.addEventListener(
        "change",
        ()=>{
          const s=
            state.subjects.find(
              x=>
                x.id===
                i.dataset.hours
            );
          if(s){
            s.hours=
              +i.value||0;
            save();
          }
        }
      );
    });
  document
    .querySelectorAll(
      "[data-addtask]"
    )
    .forEach(b=>{
      b.addEventListener(
        "click",
        ()=>{
          page="tasks";
          render();
          setTimeout(
            ()=>{
              document
                .querySelector(
                  "#taskSubject"
                )
                .value=
                b.dataset.addtask;
            },
            0
          );
        }
      );
    });
  document
    .querySelector("#generatePlan")
    ?.addEventListener(
      "click",
      ()=>{
        state.profile.dailyHours=
          +planHours.value||8;
        const mins=
          Math.round(
            state.profile.dailyHours*
            60/
            Math.max(
              1,
              state.subjects.length
            )
          );
        state.subjects.forEach(s=>{
          state.tasks.push({
            id:id(),
            title:
              `مطالعه هدفمند ${s.name}`,
            subject:s.id,
            minutes:mins,
            date:today(),
            done:false
          });
        });
        save();
        render();
        toast(
          "برنامه امروز ساخته شد"
        );
      }
    );
  document
    .querySelector("#clearToday")
    ?.addEventListener(
      "click",
      ()=>{
        state.tasks=
          state.tasks.filter(
            x=>x.date!==today()
          );
        save();
        render();
      }
    );
  document
    .querySelector("#sendAI")
    ?.addEventListener(
      "click",
      sendAI
    );
  setupTimer();
}
render();