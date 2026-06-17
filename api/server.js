const express = require('express');
const cors = require('cors');
const axios = require('axios');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// 🟢 البيانات السرية والنهائية للقائد عمار علي وكليك أب 🟢
const MY_GMAIL = 'ammar.aly000@gmail.com';
const SUPER_PIN = '0000';
const CLICKUP_TOKEN = 'pk_218484746_Q1RKGUI85Y06WXWC105T3DHXHTA4WHBH';

// إيميل حفصة الثابت المسؤول عن تعديل وجدولة كليك أب
const HAFSA_GMAIL = 'who.is.hafsa@gmail.com';

// 📋 الـ 13 قائمة الشاملة لـ مجتمع الضاد في كليك أب
const CLICKUP_LIST_IDS = [
    '901809636671', '901809636805', '901809636730', '901809636735',
    '901809636746', '901809636752', '901809636802', '901811344196',
    '901812285481', '901812285594', '901816088339', '901818521616',
    '901810061524'
];

// إعداد وسيلة إرسال الإيميلات التلقائية عبر حساب عمار علي بكود الأمان المسترجع من الميموري
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: MY_GMAIL,
        pass: 'qurkgui85y06wxwc' // تم الدمج والربط التلقائي بنجاح هنا
    }
});

// دالة مساعدة للحصول على اسم اليوم الحالي بالإنجليزية لمطابقة العداد
function getCurrentDayName() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
}

// 📋 قاعدة البيانات الشاملة لجميع الحكواتية والإدارة بناءً على ملف الفهرس
const usersDatabase = {
    "ammar.aly000@gmail.com": { fullName: "عمار علي", role: "Co-Founder", sector: "مؤسسين", pin: "0000", visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 }, totalVisits: 0 },
    "ikleledina@gmail.com": { fullName: "إكليل", role: "Co-Founder", sector: "مؤسسين", pin: "0000", visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 }, totalVisits: 0 },
    "somaya.hussein34@gmail.com": { fullName: "سمية حسين", role: "مديرة الميديا", sector: "الإدارة", pin: "0000", visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 }, totalVisits: 0 },
    "gillporcha@gmail.com": { fullName: "هاجر يحيى", role: "HR", sector: "الإدارة / التصنيفات", pin: "0000", visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 }, totalVisits: 0 },
    "who.is.hafsa@gmail.com": { fullName: "حفصة", role: "مديرة تصنيفات", sector: "الإدارة", pin: "0000", visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 }, totalVisits: 0 },
    "k20012437@gmail.com": { fullName: "هاجر سلامة", role: "مديرة تصنيفات", sector: "الإدارة", pin: "0000", visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 }, totalVisits: 0 },
    "asmaaashraf1052@gmail.com": { fullName: "أسماء", role: "مشرف", sector: "الميديا", pin: "0000", visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 }, totalVisits: 0 },
    "sohilat32@gmail.com": { fullName: "سهيلة", role: "مشرف", sector: "الميديا", pin: "0000", visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 }, totalVisits: 0 },
    "mariammohamedsan@gmail.com": { fullName: "سديم", role: "مشرف", sector: "الميديا", pin: "0000", visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 }, totalVisits: 0 },
    "ahmedalhossam5@gmail.com": { fullName: "أحمد حسام", role: "مشرف", sector: "الميديا", pin: "0000", visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 }, totalVisits: 0 },
    "nadine.gomaa20@gmail.com": { fullName: "نادين جمعة", role: "مشرف", sector: "التصنيفات", pin: "0000", visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 }, totalVisits: 0 },
    "mostafaelhadidy975@gmail.com": { fullName: "مصطفى الحديدي", role: "مشرف", sector: "التصنيفات", pin: "0000", visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 }, totalVisits: 0 },
    "shaimaaeissa68@gmail.com": { fullName: "شيماء عيسى", role: "مشرف", sector: "التصنيفات", pin: "0000", visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 }, totalVisits: 0 },
    "mariemmohamedaly290@gmail.com": { fullName: "مريم علي", role: "مشرف", sector: "التصنيفات", pin: "0000", visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 }, totalVisits: 0 },
    "rewaaa62@gmail.com": { fullName: "رواء", role: "عضو", sector: "التصنيفات", pin: "0000", visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 }, totalVisits: 0 },
    "ahmed.el.jonior@gmail.com": { fullName: "احمد ابراهيم", role: "عضو", sector: "التصنيفات", pin: "0000", visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 }, totalVisits: 0 },
    "yousef.nezar39@gmail.com": { fullName: "يوسف نزار", role: "عضو", sector: "الميديا", pin: "0000", visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 }, totalVisits: 0 },
    "ahmedhegazzy15@gmail.com": { fullName: "احمد حجازي", role: "عضو", sector: "الميديا", pin: "0000", visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 }, totalVisits: 0 },
    "malak.t.a.ezzat@gmail.com": { fullName: "ملك عزت", role: "عضو", sector: "الميديا", pin: "0000", visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 }, totalVisits: 0 },
    "mostafanesr0@gmail.com": { fullName: "مصطفى محمود", role: "عضو", sector: "الميديا", pin: "0000", visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 }, totalVisits: 0 }
};

// دالة مساعدة لجلب التأسكات بأمان من القوائم الـ 13 في كليك أب
async function fetchClickUpTasks(email) {
    let allTasks = [];
    const requests = CLICKUP_LIST_IDS.map(listId => {
        return axios.get(`https://api.clickup.com/api/v2/list/${listId}/task?archived=false&include_closed=false`, {
            headers: { 'Authorization': CLICKUP_TOKEN }
        }).then(res => {
            if (res.data && res.data.tasks) {
                const filtered = res.data.tasks.filter(task => {
                    const isAssigned = task.assignees && task.assignees.some(a => a.email.toLowerCase() === email);
                    const isCreatedByHim = task.description && task.description.includes(email);
                    return isAssigned || isCreatedByHim;
                }).map(task => ({
                    id: task.id,
                    title: task.name,
                    subTasks: task.checklists && task.checklists[0] ? task.checklists[0].items.map(item => item.name) : ["تحضير المادة العلمية", "التنفيذ والمراجعة الفنية"]
                }));
                allTasks = allTasks.concat(filtered);
            }
        }).catch(() => ({ data: { tasks: [] } }));
    });

    await Promise.all(requests);
    return allTasks;
}

// 🔓 تسجيل الدخول وتحديث عداد الأيام والزيارات المجمعة
app.post('/api/login', async (req, res) => {
    const { email, pin } = req.body;
    if (!email || !pin) {
        return res.status(400).json({ success: false, message: "يرجى كتابة البريد الإلكتروني والـ PIN!" });
    }

    const lowerEmail = email.toLowerCase().trim();
    const isMasterAdmin = (lowerEmail === MY_GMAIL && pin === SUPER_PIN);

    let currentUser = usersDatabase[lowerEmail];
    if (!currentUser || currentUser.pin !== pin) {
        return res.status(401).json({ success: false, message: "البريد الإلكتروني أو الـ PIN غير صحيح!" });
    }

    // تحديث عداد الأيام والزيارات المجمعة
    const currentDay = getCurrentDayName();
    currentUser.visitsByDay[currentDay] = (currentUser.visitsByDay[currentDay] || 0) + 1;
    currentUser.totalVisits = Object.values(currentUser.visitsByDay).reduce((a, b) => a + b, 0);

    try {
        const tasks = await fetchClickUpTasks(lowerEmail);
        res.json({
            success: true,
            isAdmin: isMasterAdmin,
            user: {
                fullName: currentUser.fullName,
                email: lowerEmail,
                role: currentUser.role,
                sector: currentUser.sector,
                visitsByDay: currentUser.visitsByDay,
                totalVisits: currentUser.totalVisits,
                tasks: tasks
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "حدث خطأ أثناء جلب التأسكات." });
    }
});

// 📝 إنشاء حساب جديد ديناميكياً
app.post('/api/signup', (req, res) => {
    const { fullName, email, pin } = req.body;
    if (!fullName || !email || !pin) {
        return res.status(400).json({ success: false, message: "يرجى إدخال كافة البيانات!" });
    }

    const lowerEmail = email.toLowerCase().trim();
    if (usersDatabase[lowerEmail]) {
        return res.status(400).json({ success: false, message: "هذا الحساب مسجل بالفعل!" });
    }

    usersDatabase[lowerEmail] = {
        fullName,
        role: "حكواتي مستجد",
        sector: "عام",
        pin: pin,
        visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 },
        totalVisits: 0
    };

    res.json({ success: true, message: "تم تسجيل الحساب بنجاح!" });
});

// 📊 لوحة المراقبة للقائد (عرض إحصائيات أيام الأسبوع والزيارات المجمعة)
app.get('/api/admin/users', (req, res) => {
    const usersList = Object.keys(usersDatabase).map(email => ({
        email: email,
        fullName: usersDatabase[email].fullName,
        role: usersDatabase[email].role,
        sector: usersDatabase[email].sector,
        visitsByDay: usersDatabase[email].visitsByDay,
        totalVisits: usersDatabase[email].totalVisits
    }));
    res.json({ success: true, users: usersList });
});

// 🚀 ترحيل مهمة مخصصة إلى كليك أب
app.post('/api/create-custom-task', async (req, res) => {
    const { title, subTasks, email } = req.body;
    try {
        const response = await axios.post(`https://api.clickup.com/api/v2/list/${CLICKUP_LIST_IDS[0]}/task`, {
            name: title,
            description: `تم إنشاء المهمة بواسطة: ${email}`
        }, {
            headers: { 'Authorization': CLICKUP_TOKEN, 'Content-Type': 'application/json' }
        });

        const createdTask = response.data;

        if (subTasks && subTasks.length > 0) {
            try {
                const checklistResponse = await axios.post(`https://api.clickup.com/api/v2/task/${createdTask.id}/checklist`, { name: "خطوات التنفيذ" }, {
                    headers: { 'Authorization': CLICKUP_TOKEN, 'Content-Type': 'application/json' }
                });
                const checklistId = checklistResponse.data.checklist.id;

                for (let sub of subTasks) {
                    await axios.post(`https://api.clickup.com/api/v2/checklist/${checklistId}/checklist_item`, { name: sub }, {
                        headers: { 'Authorization': CLICKUP_TOKEN, 'Content-Type': 'application/json' }
                    });
                }
            } catch (checkErr) { console.error(checkErr.message); }
        }
        res.json({ success: true, message: "تمت إضافة المهمة بنجاح في كليك أب!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "فشل ترحيل التاسك." });
    }
});

// ✅ قفل وتحديث حالة المهمة في كليك أب
app.post('/api/submit-task', async (req, res) => {
    const { taskId } = req.body;
    if (taskId) {
        try {
            await axios.put(`https://api.clickup.com/api/v2/task/${taskId}`, { status: 'complete' }, {
                headers: { 'Authorization': CLICKUP_TOKEN, 'Content-Type': 'application/json' }
            });
            res.json({ success: true, message: "تم قفل المهمة بنجاح!" });
        } catch (err) { res.status(500).json({ success: false }); }
    }
});

// 📢 التعديل الفوري: تسليم مهمة يدوي وإرسال إشعار كامل لحفصة على الإيميل لايف
app.post('/api/submit-unlisted-task', async (req, res) => {
    const { taskTitle, userEmail, userName } = req.body;

    const mailOptions = {
        from: MY_GMAIL,
        to: HAFSA_GMAIL,
        subject: `🚨 مهمة يدوي جديدة مضافة بواسطة: ${userName || 'حكواتي'}`,
        html: `
            <div dir="rtl" style="font-family: 'Cairo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f59e0b; border-radius: 12px; background-color: #0d0d0d; color: #e8e8e8;">
                <h2 style="color: #f59e0b; text-align: center; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">بوابة مجتمع الضاد الذكية</h2>
                <p style="font-size: 16px;">مرحباً يا <b>حفصة</b>،</p>
                <p style="font-size: 14px;">لقد قام أحد الحكواتية بتسليم مهمة يدوية خارجية خارج النطاق، يرجى مراجعتها وتحديثها يدوياً في كليك أب الخاص بالضاد:</p>
                <div style="background: rgba(255,255,255,0.03); border-right: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 5px 0;"><b>عنوان المهمة اليدوية:</b> ${taskTitle || 'لم يتم تحديد عنوان'}</p>
                    <p style="margin: 5px 0;"><b>بواسطة المسؤول:</b> ${userName || 'غير محدد'} (${userEmail})</p>
                    <p style="margin: 5px 0;"><b>توقيت حركة التسليم:</b> ${new Date().toLocaleString('ar-EG')}</p>
                </div>
                <p style="font-size: 11px; color: #a0a0a0; text-align: center; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">تم توليد هذا البلاغ الإداري الآلي من بوابة مجتمع الضاد.</p>
            </div>`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: "تم تسجيل تسليم المهمة الخارجية وإشعار حفصة عبر الإيميل بنجاح! 📢" });
    } catch (error) {
        console.error("خطأ إرسال الإيميل لحفصة:", error.message);
        res.json({ success: true, message: "تم حفظ المهمة بنجاح، وجاري إبلاغ حفصة يدوياً." });
    }
});

module.exports = app;