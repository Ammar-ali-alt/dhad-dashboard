const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// 🟢 بيانات عمار علي السرية والنهائية 🟢
const MY_GMAIL = 'ammar.aly000@gmail.com';
const MY_APP_PASSWORD = 'oyrosprrmbjaalqa';
const CLICKUP_TOKEN = 'pk_218484746_Q1RKGUI85Y06WXWC105T3DHXHTA4WHBH';

// 📋 الـ 13 قائمة الشاملة لـ مجتمع الضاد في كليك أب
const CLICKUP_LIST_IDS = [
    '901809636671', '901809636805', '901809636730', '901809636735',
    '901809636746', '901809636752', '901809636802', '901811344196',
    '901812285481', '901812285594', '901816088339', '901818521616',
    '901810061524'
];

// القائمة الافتراضية لترحيل التاسكات الجديدة المخصصة
const DEFAULT_CREATION_LIST = '901809636671'; 

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: MY_GMAIL, pass: MY_APP_PASSWORD }
});

// تثبيت الدومين الحقيقي هنا لمنع الـ ضرب في Vercel
function sendAdminApprovalEmail(fullName, email) {
    const domain = 'https://dhad-dashboard-eiji.vercel.app'; // الدومين بتاعك من السكرين شوت
    const approvalLink = `${domain}/api/admin/approve-via-email?email=${encodeURIComponent(email)}`;
    
    const mailOptions = {
        from: MY_GMAIL,
        to: MY_GMAIL,
        subject: `✨ طلب أكسس جديد في مجتمع الضاد: ${fullName}`,
        html: `
            <div dir="rtl" style="font-family: sans-serif; background-color: #121212; color: #e0e0e0; padding: 20px; border-radius: 10px; border: 1px solid #2d2d2d; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #f59e0b; text-align: center;">طلب انضمام جديد 📋</h2>
                <p>يا عمار، فيه أدمن جديد سجل ومستني تفعيلك للأكسس:</p>
                <div style="background-color: #1e1e1e; padding: 15px; border-radius: 8px; border: 1px solid #3d3d3d; margin-bottom: 25px;">
                    <p><strong>الاسم:</strong> ${fullName}</p>
                    <p><strong>الإيميل:</strong> ${email}</p>
                </div>
                <div style="text-align: center;">
                    <a href="${approvalLink}" style="background-color: #10b981; color: white; text-decoration: none; padding: 12px 30px; font-weight: bold; border-radius: 8px; display: inline-block;">✔️ تفعيل الأكسس فوراً</a>
                </div>
            </div>
        `
    };
    transporter.sendMail(mailOptions, (err) => { if (err) console.log('خطأ إيميل:', err); });
}

let usersDatabase = {
    "amar11101095770691@gmail.com": {
        fullName: "عمار علي",
        pin: "1111",
        status: "active",
        dailyVisits: 0
    }
};

app.post('/api/signup', (req, res) => {
    const { fullName, email, pin } = req.body;
    if (usersDatabase[email]) return res.status(400).json({ success: false, message: "الإيميل مسجل بالفعل!" });
    
    usersDatabase[email] = { fullName, pin, status: "pending", dailyVisits: 0 };
    
    // استدعاء الدالة المصلحة والآمنة
    sendAdminApprovalEmail(fullName, email);
    
    res.json({ success: true, message: "تم تسجيل بياناتك بنجاح! في انتظار موافقة تفعيل عمار علي." });
});

app.get('/api/admin/approve-via-email', (req, res) => {
    const { email } = req.query;
    if (usersDatabase[email]) {
        usersDatabase[email].status = "active";
        return res.send(`<div dir="rtl" style="font-family: sans-serif; text-align: center; padding-top: 50px; background-color: #121212; color: white; min-height: 100vh;"><h1>✔️ تم تفعيل حساب الأدمن بنجاح يا عمار!</h1></div>`);
    }
    res.status(400).send("المستخدم غير موجود!");
});

app.post('/api/login', async (req, res) => {
    const { email, pin } = req.body;
    if (email === MY_GMAIL && pin === "0000") return res.json({ success: true, isAdmin: true });
    const user = usersDatabase[email];
    if (!user || user.pin !== pin) return res.status(401).json({ success: false, message: "الإيميل أو الـ PIN غلط!" });
    if (user.status === "pending") return res.status(403).json({ success: false, message: "حسابك لسه مستني موافقة وتفعيل عمار علي." });

    user.dailyVisits += 1;

    try {
        const requests = CLICKUP_LIST_IDS.map(listId =>
            axios.get(`https://api.clickup.com/api/v2/list/${listId}/task?archived=false&include_closed=false`, {
                headers: { 'Authorization': CLICKUP_TOKEN }
            }).catch(() => ({ data: { tasks: [] } }))
        );

        const responses = await Promise.all(requests);
        let allUserTasks = [];

        responses.forEach(response => {
            const listTasks = response.data.tasks || [];
            const filtered = listTasks.filter(task => {
                const isAssigned = task.assignees && task.assignees.some(assignee => assignee.email.toLowerCase() === email.toLowerCase());
                const isCreatedByHim = task.description && task.description.includes(email);
                const isNotDone = task.status && task.status.status.toLowerCase() !== 'complete' && task.status.status.toLowerCase() !== 'done';
                
                return (isAssigned || isCreatedByHim) && isNotDone;
            }).map(task => ({
                id: task.id,
                title: task.name,
                subTasks: task.checklists && task.checklists[0] ? task.checklists[0].items.map(item => item.name) : ["تحضير المادة العلمية", "التنفيذ والمراجعة مع عمار"]
            }));
            allUserTasks = allUserTasks.concat(filtered);
        });

        res.json({ success: true, isAdmin: false, user: { ...user, tasks: allUserTasks } });
    } catch (error) {
        res.json({ success: true, isAdmin: false, user: { ...user, tasks: [] } });
    }
});

// 🟢 استقبال ترحيل التاسكات المخصصة لكليك أب 🟢
app.post('/api/create-custom-task', async (req, res) => {
    const { email, title, subTasks } = req.body;
    
    try {
        const clickupTaskData = {
            name: title,
            description: `تم إنشاؤه بواسطة الأدمن: ${email} عبر البوابة الذكية.`,
            status: "to do"
        };

        const response = await axios.post(`https://api.clickup.com/api/v2/list/${DEFAULT_CREATION_LIST}/task`, clickupTaskData, {
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
            } catch (checkErr) { console.log('خطأ تشيك ليست:', checkErr.message); }
        }

        res.json({ success: true, message: "تمت إضافة التاسك بنجاح في كليك أب!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "فشل ترحيل التاسك لكليك أب." });
    }
});

app.post('/api/submit-task', async (req, res) => {
    const { username, taskTitle, timeSpent, taskId } = req.body;
    if (taskId) {
        try {
            await axios.put(`https://api.clickup.com/api/v2/task/${taskId}`, { status: 'complete' }, {
                headers: { 'Authorization': CLICKUP_TOKEN, 'Content-Type': 'application/json' }
            });
        } catch (clickUpErr) { console.log(clickUpErr.message); }
    }
    const mailOptions = {
        from: MY_GMAIL, to: MY_GMAIL,
        subject: `✅ تاسك منجز ومقفل في كليك أب: ${username}`,
        html: `<div dir="rtl" style="font-family: sans-serif; padding: 15px; border: 1px solid #10b981; border-radius: 8px;"><p>الأدمن: <b>${username}</b></p><p>التاسك: <b>${taskTitle}</b></p><p>الوقت المستغرق: <b>${timeSpent}</b></p></div>`
    };
    transporter.sendMail(mailOptions, (err) => { if (err) console.log(err); });
    res.json({ success: true });
});

app.post('/api/submit-unlisted-task', (req, res) => {
    const { username, taskTitle } = req.body;
    const mailOptions = {
        from: MY_GMAIL, to: MY_GMAIL,
        subject: `⚠️ تسليم سريع (تاسك غير مدرج) من: ${username}`,
        html: `<div dir="rtl" style="font-family: sans-serif; padding: 15px; border: 1px solid #ef4444; border-radius: 8px;"><p>الأدمن: <b>${username}</b></p><p>عنوان الشغل: <b>${taskTitle}</b></p></div>`
    };
    transporter.sendMail(mailOptions, (err) => { if (err) console.log(err); });
    res.json({ success: true });
});

module.exports = app;