/*
=========================================================
 StudyCoach V5
 Netlify Function — AI Backend
=========================================================
Endpoint:
POST /.netlify/functions/ai
Body:
{
  "message": "..."
}
Optional:
{
  "message": "...",
  "history": [
    {
      "role": "user",
      "content": "..."
    },
    {
      "role": "assistant",
      "content": "..."
    }
  ],
  "student": {
    "grade": "دوازدهم",
    "field": "تجربی",
    "goal": "پزشکی دانشگاه تهران",
    "exam": "کنکور",
    "dailyHours": 10
  }
}
Environment variable required:
GROQ_API_KEY
=========================================================
*/
const CORS_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
/* =======================================================
   Helpers
======================================================= */
function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: CORS_HEADERS
    }
  );
}
function cleanText(value, maxLength = 12000) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLength);
}
function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-12)
    .map(item => {
      const role =
        item?.role === "assistant"
          ? "assistant"
          : "user";
      return {
        role,
        content: cleanText(item?.content, 6000)
      };
    })
    .filter(item => item.content);
}
function buildStudentContext(student) {
  if (!student || typeof student !== "object") {
    return "";
  }
  const parts = [];
  if (student.name)
    parts.push(`نام دانش‌آموز: ${cleanText(student.name, 100)}`);
  if (student.grade)
    parts.push(`پایه: ${cleanText(student.grade, 100)}`);
  if (student.field)
    parts.push(`رشته: ${cleanText(student.field, 100)}`);
  if (student.goal)
    parts.push(`هدف: ${cleanText(student.goal, 200)}`);
  if (student.exam)
    parts.push(`هدف آزمونی: ${cleanText(student.exam, 200)}`);
  if (student.dailyHours != null)
    parts.push(`ساعت مطالعه روزانه: ${cleanText(student.dailyHours, 50)}`);
  if (student.weakSubjects)
    parts.push(
      `درس‌های ضعیف: ${cleanText(
        Array.isArray(student.weakSubjects)
          ? student.weakSubjects.join("، ")
          : student.weakSubjects,
        500
      )}`
    );
  if (student.strongSubjects)
    parts.push(
      `درس‌های قوی: ${cleanText(
        Array.isArray(student.strongSubjects)
          ? student.strongSubjects.join("، ")
          : student.strongSubjects,
        500
      )}`
    );
  if (!parts.length) return "";
  return `
اطلاعات فعلی دانش‌آموز:
${parts.map(x => "- " + x).join("\n")}
`;
}
/* =======================================================
   System Prompt
======================================================= */
const SYSTEM_PROMPT = `
تو StudyCoach V5 هستی؛
یک مشاور هوشمند، دقیق، عملی و شخصی‌سازی‌شده برای دانش‌آموز ایرانی.
هدف اصلی تو این است که دانش‌آموز بعد از هر پاسخ دقیقاً بداند:
«الان چه کاری باید انجام بدهم؟»
=========================================================
حوزه‌های کاری
=========================================================
- برنامه‌ریزی روزانه
- برنامه‌ریزی هفتگی
- برنامه‌ریزی ماهانه
- کنکور
- امتحانات نهایی
- مدیریت زمان
- روش مطالعه
- تست‌زنی
- مرور
- جمع‌بندی
- تحلیل آزمون
- تحلیل درصدها
- تحلیل نمرات
- شناسایی نقاط ضعف
- اولویت‌بندی مباحث
- جبران عقب‌افتادگی
- مدیریت حجم زیاد مطالب
- افزایش بازدهی
- ایجاد عادت مطالعه
- مدیریت زمان بین درس‌ها
- پیشنهاد ترتیب مطالعه
- طراحی برنامه فشرده
- طراحی برنامه واقع‌بینانه
- همراهی و پیگیری دانش‌آموز
=========================================================
قوانین اصلی
=========================================================
1. به طور پیش‌فرض همیشه فارسی پاسخ بده.
2. پاسخ‌ها باید عملی باشند؛
از جملات کلی مثل «بیشتر تلاش کن» یا
«برنامه‌ریزی کن» بدون توضیح عملی خودداری کن.
3. اگر کاربر برنامه خواست:
   - زمان را به بازه‌های مشخص تقسیم کن.
   - نام درس را مشخص کن.
   - فعالیت را مشخص کن.
   - حجم مطالعه را مشخص کن.
   - تست و مرور را مشخص کن.
   - اولویت را مشخص کن.
4. اگر اطلاعات کافی وجود ندارد:
   بهترین برنامه ممکن را ارائه کن.
   فقط اگر واقعاً ضروری بود یک سؤال کوتاه بپرس.
5. اگر دانش‌آموز عقب افتاده است:
   همه مطالب را یکجا پیشنهاد نده.
   ابتدا مهم‌ترین مباحث را انتخاب کن.
6. بین این موارد تعادل ایجاد کن:
   مطالعه
   تست
   تحلیل
   مرور
   استراحت
7. اگر کاربر برنامه بسیار سنگین می‌خواهد:
   برنامه را تا حد ممکن فشرده کن،
   اما برنامه غیرواقعی و خطرناک طراحی نکن.
8. برای برنامه‌های درسی از جدول استفاده کن.
9. پاسخ‌ها را ساختاریافته بنویس.
10. از Markdown ساده استفاده کن.
11. از ایموجی به مقدار کم استفاده کن.
12. اگر کاربر درباره یک درس سؤال دارد:
   پاسخ را متناسب با همان درس بده.
13. اگر کاربر نتیجه آزمون یا نمره داد:
   حتماً این سه مورد را مشخص کن:
   - نقطه قوت
   - نقطه ضعف
   - اقدام بعدی
14. اگر کاربر گفت «نمی‌توانم درس بخوانم»:
   به جای سرزنش، یک اقدام کوچک و قابل اجرا پیشنهاد کن.
15. اگر کاربر چند کار همزمان می‌خواهد:
   اولویت‌بندی کن.
16. اگر کاربر زمان محدودی دارد:
   برنامه را بر اساس بیشترین بازده تنظیم کن.
17. هیچ‌وقت وانمود نکن که اطلاعاتی را می‌دانی که به تو داده نشده است.
18. درباره تاریخ‌ها و زمان باقی‌مانده:
   اگر تاریخ دقیق در پیام یا اطلاعات دانش‌آموز وجود دارد،
   بر اساس همان محاسبه کن.
19. پاسخ نباید بیش از حد طولانی باشد مگر اینکه کاربر
   صراحتاً برنامه کامل یا توضیح مفصل بخواهد.
=========================================================
حالت مشاور خصوصی
=========================================================
در صورت وجود اطلاعات دانش‌آموز:
- هدف او را در نظر بگیر.
- سطح او را در نظر بگیر.
- ساعت مطالعه او را در نظر بگیر.
- درس‌های ضعیف را در اولویت مناسب قرار بده.
- از پیشنهادهای تکراری خودداری کن.
- برنامه را شخصی‌سازی کن.
=========================================================
فرمت پیشنهادی برنامه
=========================================================
| زمان | درس | فعالیت | حجم | تست/مرور |
|------|-----|---------|-----|----------|
بعد از جدول:
1. اولویت امروز
2. مهم‌ترین کار
3. معیار موفقیت امروز
=========================================================
تحلیل آزمون
=========================================================
اگر اطلاعات آزمون داده شد:
1. وضعیت کلی
2. درس‌های قوی
3. درس‌های ضعیف
4. علت احتمالی افت
5. اولویت اصلاح
6. برنامه جبرانی
7. اقدام بعدی
=========================================================
لحن
=========================================================
دوستانه
جدی
حمایتی
واقع‌بینانه
انگیزشی
بدون سرزنش
تو قرار نیست فقط جواب بدهی؛
باید به دانش‌آموز کمک کنی تصمیم بگیرد قدم بعدی چیست.
`;
/* =======================================================
   Main Handler
======================================================= */
export default async function handler(request) {
  /* -------------------------------------------------------
     CORS
  ------------------------------------------------------- */
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS
    });
  }
  /* -------------------------------------------------------
     Method
  ------------------------------------------------------- */
  if (request.method !== "POST") {
    return json(
      {
        success: false,
        error: "Only POST requests are allowed."
      },
      405
    );
  }
  /* -------------------------------------------------------
     API Key
  ------------------------------------------------------- */
  const apiKey =
    Netlify.env.get("GROQ_API_KEY");
  if (!apiKey) {
    return json(
      {
        success: false,
        error:
          "GROQ_API_KEY در تنظیمات Netlify تعریف نشده است."
      },
      500
    );
  }
  /* -------------------------------------------------------
     Parse Body
  ------------------------------------------------------- */
  let body;
  try {
    body = await request.json();
  } catch {
    return json(
      {
        success: false,
        error: "JSON درخواست نامعتبر است."
      },
      400
    );
  }
  /* -------------------------------------------------------
     Message
  ------------------------------------------------------- */
  const userMessage =
    cleanText(body?.message, 12000);
  if (!userMessage) {
    return json(
      {
        success: false,
        error: "پیام خالی است."
      },
      400
    );
  }
  /* -------------------------------------------------------
     Optional Conversation History
  ------------------------------------------------------- */
  const history =
    normalizeHistory(body?.history);
  /* -------------------------------------------------------
     Optional Student Profile
  ------------------------------------------------------- */
  const studentContext =
    buildStudentContext(body?.student);
  /* -------------------------------------------------------
     Build Messages
  ------------------------------------------------------- */
  const messages = [
    {
      role: "system",
      content:
        SYSTEM_PROMPT +
        studentContext
    }
  ];
  for (const item of history) {
    messages.push({
      role: item.role,
      content: item.content
    });
  }
  messages.push({
    role: "user",
    content: userMessage
  });
  /* -------------------------------------------------------
     Groq Request
  ------------------------------------------------------- */
  let groqResponse;
  try {
    groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization":
            `Bearer ${apiKey}`,
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          model:
            "openai/gpt-oss-20b",
          messages,
          temperature: 0.7,
          max_completion_tokens: 4096
        })
      }
    );
  } catch (error) {
    return json(
      {
        success: false,
        error:
          "اتصال به سرویس هوش مصنوعی برقرار نشد.",
        details:
          String(error?.message || error)
      },
      502
    );
  }
  /* -------------------------------------------------------
     Groq Error
  ------------------------------------------------------- */
  if (!groqResponse.ok) {
    let errorData = {};
    try {
      errorData =
        await groqResponse.json();
    } catch {
      errorData = {};
    }
    const message =
      errorData?.error?.message ||
      errorData?.message ||
      `Groq API Error: ${groqResponse.status}`;
    return json(
      {
        success: false,
        error: message,
        status: groqResponse.status
      },
      groqResponse.status
    );
  }
  /* -------------------------------------------------------
     Parse Result
  ------------------------------------------------------- */
  let result;
  try {
    result =
      await groqResponse.json();
  } catch {
    return json(
      {
        success: false,
        error:
          "پاسخ دریافتی از هوش مصنوعی قابل خواندن نبود."
      },
      502
    );
  }
  /* -------------------------------------------------------
     Extract Answer
  ------------------------------------------------------- */
  const answer =
    result
      ?.choices?.[0]
      ?.message
      ?.content;
  if (!answer) {
    return json(
      {
        success: false,
        error:
          "هوش مصنوعی پاسخ متنی برنگرداند."
      },
      502
    );
  }
  /* -------------------------------------------------------
     Success
  ------------------------------------------------------- */
  return json(
    {
      success: true,
      answer:
        String(answer).trim(),
      model:
        result?.model ||
        "openai/gpt-oss-20b"
    },
    200
  );
}