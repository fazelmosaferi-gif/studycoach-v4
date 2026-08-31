exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode:405,
      body:JSON.stringify({
        error:"Method not allowed"
      })
    };
  }
  try {
    const body=
      JSON.parse(
        event.body || "{}"
      );
    const apiKey=
      process.env.GROQ_API_KEY;
    if(!apiKey){
      return {
        statusCode:500,
        body:JSON.stringify({
          error:
            "GROQ_API_KEY در تنظیمات Netlify ثبت نشده است."
        })
      };
    }
    const system=`
تو StudyCoach هستی؛
یک مشاور درسی فارسی‌زبان،
دقیق، واقع‌بین و عملی.
وظیفه تو:
- برنامه‌ریزی مطالعه
- تحلیل عملکرد
- پیشنهاد روش مطالعه
- کمک به مرور
- تحلیل آزمون
- مدیریت زمان
- کمک به تست‌زنی
پاسخ‌ها فارسی و ساختاریافته باشند.
اطلاعات دانش‌آموز:
پروفایل:
${JSON.stringify(body.profile || {})}
دروس:
${JSON.stringify(body.subjects || [])}
کارها:
${JSON.stringify(body.tasks || [])}
اشتباهات:
${JSON.stringify(body.mistakes || [])}
`;
    const messages=[
      {
        role:"system",
        content:system
      },
      ...(Array.isArray(body.messages)
        ?body.messages.slice(-12)
        :[])
    ];
    const response=
      await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method:"POST",
          headers:{
            "Authorization":
              `Bearer ${apiKey}`,
            "Content-Type":
              "application/json"
          },
          body:JSON.stringify({
            model:
              "llama-3.3-70b-versatile",
            messages,
            temperature:0.4,
            max_tokens:1200
          })
        }
      );
    const data=
      await response.json();
    if(!response.ok){
      return {
        statusCode:
          response.status,
        body:
          JSON.stringify({
            error:
              data?.error?.message ||
              "Groq API error"
          })
      };
    }
    return {
      statusCode:200,
      headers:{
        "Content-Type":
          "application/json",
        "Cache-Control":
          "no-store"
      },
      body:
        JSON.stringify({
          content:
            data.choices?.[0]
              ?.message?.content || ""
        })
    };
  }catch(error){
    return {
      statusCode:500,
      body:
        JSON.stringify({
          error:
            error.message ||
            "Server error"
        })
    };
  }
};