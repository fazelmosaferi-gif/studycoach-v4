export default async function handler(request) {

    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    };

    /*
    ================================================
    CORS PREFLIGHT
    ================================================
    */

    if (request.method === "OPTIONS") {

        return new Response(
            null,
            {
                status: 204,
                headers
            }
        );

    }


    /*
    ================================================
    ONLY POST
    ================================================
    */

    if (request.method !== "POST") {

        return new Response(

            JSON.stringify({
                error: "Only POST requests are allowed."
            }),

            {
                status:405,
                headers
            }

        );

    }


    /*
    ================================================
    API KEY
    ================================================
    */

    const apiKey =
        Netlify.env.get("GROQ_API_KEY");


    if (!apiKey) {

        return new Response(

            JSON.stringify({
                error:
                    "GROQ_API_KEY در تنظیمات Netlify وارد نشده است."
            }),

            {
                status:500,
                headers
            }

        );

    }


    /*
    ================================================
    REQUEST BODY
    ================================================
    */

    let body;

    try {

        body =
            await request.json();

    } catch {

        return new Response(

            JSON.stringify({
                error:
                    "JSON درخواست نامعتبر است."
            }),

            {
                status:400,
                headers
            }

        );

    }


    const userMessage =
        String(
            body?.message || ""
        ).trim();


    if (!userMessage) {

        return new Response(

            JSON.stringify({
                error:
                    "پیام خالی است."
            }),

            {
                status:400,
                headers
            }

        );

    }


    /*
    ================================================
    STUDYCOACH SYSTEM PROMPT
    ================================================
    */

    const systemPrompt = `

تو StudyCoach V5 هستی؛
یک مشاور هوشمند و حرفه‌ای برای دانش‌آموز ایرانی.

وظیفه تو کمک به دانش‌آموز در:

- برنامه‌ریزی درسی
- کنکور
- امتحانات نهایی
- مدیریت زمان
- روش مطالعه
- تست‌زنی
- مرور
- جمع‌بندی
- تحلیل عملکرد
- رفع عقب‌افتادگی
- اولویت‌بندی مباحث
- افزایش بازدهی

است.

قوانین:

1. همیشه فارسی پاسخ بده مگر کاربر زبان دیگری بخواهد.

2. پاسخ‌ها باید عملی و قابل اجرا باشند.

3. اگر کاربر برنامه می‌خواهد،
برنامه را دقیق و مرحله‌ای ارائه کن.

4. اگر اطلاعات کافی نیست،
بهترین پیشنهاد ممکن را بده و در صورت نیاز
در انتهای پاسخ سؤال کوتاهی برای تکمیل اطلاعات بپرس.

5. از پاسخ‌های کلی و غیرعملی خودداری کن.

6. اگر کاربر عقب افتاده است،
اولویت‌بندی کن و همه چیز را همزمان پیشنهاد نده.

7. در برنامه‌ریزی، تعادل بین مطالعه،
تست، مرور و استراحت منطقی را رعایت کن.

8. برای مباحث درسی، پاسخ را ساختاریافته بده.

9. از Markdown ساده استفاده کن.

10. لحن تو دوستانه، جدی، انگیزشی و حرفه‌ای باشد.

11. اگر کاربر از تو تحلیل عملکرد خواست،
نقاط قوت، نقاط ضعف و اقدام بعدی را مشخص کن.

12. هدف اصلی تو این است که دانش‌آموز
بداند دقیقاً قدم بعدی چیست.

`;


    /*
    ================================================
    GROQ REQUEST
    ================================================
    */

    const groqResponse = await fetch(

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
                    "openai/gpt-oss-20b",

                messages:[

                    {
                        role:"system",
                        content:
                            systemPrompt
                    },

                    {
                        role:"user",
                        content:
                            userMessage
                    }

                ],

                temperature:0.7,

                max_completion_tokens:4096

            })

        }

    );


    /*
    ================================================
    GROQ ERROR
    ================================================
    */

    if (!groqResponse.ok) {

        let errorData;

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


        return new Response(

            JSON.stringify({
                error: message
            }),

            {
                status:
                    groqResponse.status,
                headers
            }

        );

    }


    /*
    ================================================
    RESULT
    ================================================
    */

    const result =
        await groqResponse.json();


    const answer =
        result
        ?.choices?.[0]
        ?.message
        ?.content;


    if (!answer) {

        return new Response(

            JSON.stringify({
                error:
                    "Groq پاسخ متنی برنگرداند."
            }),

            {
                status:502,
                headers
            }

        );

    }


    /*
    ================================================
    SUCCESS
    ================================================
    */

    return new Response(

        JSON.stringify({

            success:true,

            answer:String(answer),

            model:
                result?.model ||
                "openai/gpt-oss-20b"

        }),

        {
            status:200,
            headers
        }

    );

}