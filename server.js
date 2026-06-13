const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// تشغيل الملفات الثابتة (الواجهة) من فولدر public
app.use(express.static(path.join(__dirname, 'public')));

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

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: MY_GMAIL, pass: MY_APP_PASSWORD }
});

function sendAdminApprovalEmail(req, fullName, email) {
    const approvalLink = `${req.protocol}://${req.get('host')}/api/admin/approve-via-email?email=${encodeURIComponent(email)}`;
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
    sendAdminApprovalEmail(req, fullName, email);
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
                return task.assignees && task.assignees.some(assignee => assignee.email.toLowerCase() === email.toLowerCase());
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

// أي مسار غير الـ API يعرض صفحة الـ index.html علطول
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// تشغيل السيرفر التقليدي المظبوط لـ ريلواي
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`السيرفر شغال بنجاح على بورت ${PORT}`);
}); const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// تشغيل الملفات الثابتة (الواجهة) من فولدر public
app.use(express.static(path.join(__dirname, 'public')));

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

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: MY_GMAIL, pass: MY_APP_PASSWORD }
});

function sendAdminApprovalEmail(req, fullName, email) {
    const approvalLink = `${req.protocol}://${req.get('host')}/api/admin/approve-via-email?email=${encodeURIComponent(email)}`;
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
    sendAdminApprovalEmail(req, fullName, email);
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
                return task.assignees && task.assignees.some(assignee => assignee.email.toLowerCase() === email.toLowerCase());
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

// أي مسار غير الـ API يعرض صفحة الـ index.html علطول
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// تشغيل السيرفر التقليدي المظبوط لـ ريلواي
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`السيرفر شغال بنجاح على بورت ${PORT}`);
});