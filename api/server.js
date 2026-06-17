const express = require('express');
const cors = require('cors');
const axios = require('axios');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// 🟢 البيانات السرية والنهائية للقائد عمار علي وكليك أب 🟢
const MY_GMAIL = 'ammar.aly000@gmail.com';
const SUPER_PIN = '0000';
const CLICKUP_TOKEN = 'pk_218484746_Q1RKGUI85Y06WXWC105T3DHXHTA4WHBH';
const HAFSA_GMAIL = 'who.is.hafsa@gmail.com';
const CLICKUP_SINGLE_LIST_ID = '901818521616';

// 💾 رابط الاتصال السحابي المباشر بمونجو دي بي لمجتمع الضاد
const MONGODB_URI = 'mongodb+srv://amar11101095770691_db_user:hGu8bhoMistK6Mk2@cluster0.e7f2cve.mongodb.net/dhad_db?retryWrites=true&w=majority';

// لستة تيم الإدارة والفهرس الأساسي
const defaultUsers = [
    { email: "ammar.aly000@gmail.com", fullName: "عمار علي", role: "Co-Founder", sector: "مؤسسين", pin: "0000" },
    { email: "ikleledina@gmail.com", fullName: "إكليل", role: "Co-Founder", sector: "مؤسسين", pin: "0000" },
    { email: "somaya.hussein34@gmail.com", fullName: "سمية حسين", role: "مديرة الميديا", sector: "الإدارة", pin: "0000" },
    { email: "gillporcha@gmail.com", fullName: "هاجر يحيى", role: "HR", sector: "الإدارة / التصنيفات", pin: "0000" },
    { email: "who.is.hafsa@gmail.com", fullName: "حفصة", role: "مديرة تصنيفات", sector: "الإدارة", pin: "0000" },
    { email: "k20012437@gmail.com", fullName: "هاجر سلامة", role: "مديرة تصنيفات", sector: "الإدارة", pin: "0000" },
    { email: "asmaaashraf1052@gmail.com", fullName: "أسماء", role: "مشرف", sector: "الميديا", pin: "0000" },
    { email: "sohilat32@gmail.com", fullName: "سهيلة", role: "مشرف", sector: "الميديا", pin: "0000" },
    { email: "mariammohamedsan@gmail.com", fullName: "سديم", role: "مشرف", sector: "الميديا", pin: "0000" },
    { email: "ahmedalhossam5@gmail.com", fullName: "أحمد حسام", role: "مشرف", sector: "الميديا", pin: "0000" },
    { email: "nadine.gomaa20@gmail.com", fullName: "نادين جمعة", role: "مشرف", sector: "التصنيفات", pin: "0000" },
    { email: "mostafaelhadidy975@gmail.com", fullName: "مصطفى الحديدي", role: "مشرف", sector: "التصنيفات", pin: "0000" },
    { email: "shaimaaeissa68@gmail.com", fullName: "شيماء عيسى", role: "مشرف", sector: "التصنيفات", pin: "0000" },
    { email: "mariemmohamedaly290@gmail.com", fullName: "مريم علي", role: "مشرف", sector: "التصنيفات", pin: "0000" },
    { email: "rewaaa62@gmail.com", fullName: "رواء", role: "عضو", sector: "التصنيفات", pin: "0000" },
    { email: "ahmed.el.jonior@gmail.com", fullName: "احمد ابراهيم", role: "عضو", sector: "التصنيفات", pin: "0000" },
    { email: "yousef.nezar39@gmail.com", fullName: "يوسف نزار", role: "عضو", sector: "الميديا", pin: "0000" },
    { email: "ahmedhegazzy15@gmail.com", fullName: "احمد حجازي", role: "عضو", sector: "الميديا", pin: "0000" },
    { email: "malak.t.a.ezzat@gmail.com", fullName: "ملك عزت", role: "عضو", sector: "الميديا", pin: "0000" },
    { email: "mostafanesr0@gmail.com", fullName: "مصطفى محمود", role: "عضو", sector: "الميديا", pin: "0000" }
];

// دالة الاتصال والتأكد من وجود مستخدمي الإدارة فوراً
async function connectToMongoAndSeed() {
    if (mongoose.connection.readyState !== 1) {
        try {
            await mongoose.connect(MONGODB_URI);
            console.log("تم الاتصال السحابي بمونجو بنجاح 💾");
        } catch (e) {
            console.error("خطأ اتصال مونجو:", e.message);
            return;
        }
    }

    // تكتيك الحرق التلقائي: لو الأدمينز مش في الداتا بيز السحابية نزلهم فوراً
    try {
        const count = await User.countDocuments();
        if (count < defaultUsers.length) {
            for (let u of defaultUsers) {
                const exists = await User.findOne({ email: u.email.toLowerCase().trim() });
                if (!exists) {
                    await User.create({
                        ...u,
                        visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 },
                        totalVisits: 0
                    });
                }
            }
            console.log("تم فحص وتأمين وجود حسابات الإدارة بنجاح!");
        }
    } catch (err) {
        console.log("تنبيه في فحص الأدمينز:", err.message);
    }
}

// 📝 بناء الـ Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    fullName: { type: String, required: true },
    role: { type: String, default: 'حكواتي مستجد' },
    sector: { type: String, default: 'عام' },
    pin: { type: String, required: true },
    visitsByDay: {
        Saturday: { type: Number, default: 0 },
        Sunday: { type: Number, default: 0 },
        Monday: { type: Number, default: 0 },
        Tuesday: { type: Number, default: 0 },
        Wednesday: { type: Number, default: 0 },
        Thursday: { type: Number, default: 0 },
        Friday: { type: Number, default: 0 }
    },
    totalVisits: { type: Number, default: 0 }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

const transporter = nodemailer.createTransport({
    service: 'gmail', host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user: MY_GMAIL, pass: 'qurkgui85y06wxwc' }
});

function getCurrentDayName() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
}

async function fetchSingleListTasks(email, isAdmin) {
    try {
        const response = await axios.get(`https://api.clickup.com/api/v2/list/${CLICKUP_SINGLE_LIST_ID}/task?archived=false&include_closed=false`, {
            headers: { 'Authorization': CLICKUP_TOKEN }
        });
        const tasks = response.data.tasks || [];
        return await Promise.all(tasks.filter(task => {
            if (isAdmin) return true;
            const isAssigned = task.assignees && task.assignees.some(a => a.email.toLowerCase() === email);
            const isCreatedByHim = task.description && task.description.includes(email);
            return isAssigned || isCreatedByHim;
        }).map(async (task) => {
            let deadlineDate = "غير محدد";
            if (task.due_date) deadlineDate = new Date(parseInt(task.due_date)).toLocaleDateString('ar-EG');
            let deptField = "عام";
            if (task.custom_fields && Array.isArray(task.custom_fields)) {
                const foundDept = task.custom_fields.find(f => f.name && (f.name.includes("القسم") || f.name.includes("Department")));
                if (foundDept && foundDept.value !== undefined && foundDept.type_config && foundDept.type_config.options) {
                    const opt = foundDept.type_config.options[foundDept.value];
                    if (opt && opt.name) deptField = opt.name;
                }
            }
            let assigneeEmail = "غير مخصص";
            let assigneeName = "بدون مسؤول";
            if (task.assignees && task.assignees.length > 0) {
                assigneeEmail = task.assignees[0].email.toLowerCase().trim();
                const matchedUser = await User.findOne({ email: assigneeEmail });
                assigneeName = matchedUser ? matchedUser.fullName : task.assignees[0].username;
            }
            return {
                id: task.id, title: task.name, department: deptField, dueDate: deadlineDate,
                dueDateRaw: task.due_date ? parseInt(task.due_date) : 0,
                assignedEmail: assigneeEmail, assignedName: assigneeName,
                subTasks: task.checklists && task.checklists[0] ? task.checklists[0].items.map(item => item.name) : ["تحضير المادة العلمية", "التنفيذ والمراجعة الفنية"]
            };
        }));
    } catch (err) { return []; }
}

// 🔐 مسار تسجيل الدخول المحدث
app.post('/api/login', async (req, res) => {
    const { email, pin } = req.body;
    if (!email || !pin) return res.status(400).json({ success: false, message: "بيانات ناقصة" });
    const lowerEmail = email.toLowerCase().trim();
    const isMasterAdmin = (lowerEmail === MY_GMAIL && pin === SUPER_PIN);
    try {
        await connectToMongoAndSeed(); // اتصال وفحص أوتوماتيكي فوري لقاعدة البيانات
        let currentUser = await User.findOne({ email: lowerEmail });
        if (!currentUser || currentUser.pin !== pin) {
            return res.status(401).json({ success: false, message: "البريد أو الـ PIN غير صحيح" });
        }
        const currentDay = getCurrentDayName();
        currentUser.visitsByDay[currentDay] = (currentUser.visitsByDay[currentDay] || 0) + 1;
        currentUser.totalVisits = Object.values(currentUser.visitsByDay.toObject()).reduce((a, b) => a + b, 0);
        await currentUser.save();
        const tasks = await fetchSingleListTasks(lowerEmail, isMasterAdmin);
        res.json({
            success: true, isAdmin: isMasterAdmin,
            user: {
                fullName: currentUser.fullName, email: lowerEmail, role: currentUser.role, sector: currentUser.sector,
                visitsByDay: currentUser.visitsByDay, totalVisits: currentUser.totalVisits, tasks: tasks
            }
        });
    } catch (error) { res.status(500).json({ success: false }); }
});

// 🚀 مسار تسجيل الحسابات الجديدة
app.post('/api/signup', async (req, res) => {
    const { fullName, email, pin } = req.body;
    if (!fullName || !email || !pin) return res.status(400).json({ success: false, message: "بيانات ناقصة" });
    const lowerEmail = email.toLowerCase().trim();
    try {
        await connectToMongoAndSeed();
        const exists = await User.findOne({ email: lowerEmail });
        if (exists) return res.status(400).json({ success: false, message: "مسجل بالفعل" });

        await User.create({
            email: lowerEmail, fullName, pin, role: "حكواتي مستجد", sector: "عام",
            visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 },
            totalVisits: 0
        });
        res.json({ success: true, message: "تم تسجيل حسابك المستجد بنجاح!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "فشل حفظ الحساب السحابي." });
    }
});

app.get('/api/admin/users', async (req, res) => {
    try {
        await connectToMongoAndSeed();
        const usersList = await User.find({});
        res.json({ success: true, users: usersList });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.post('/api/create-custom-task', async (req, res) => {
    const { title, subTasks, email, dueDate } = req.body;
    try {
        let clickUpTimestamp = dueDate ? new Date(dueDate).getTime() : null;
        const taskBody = { name: title, description: `تم إنشاء وتحريك المهمة بواسطة بوابة مجتمع الضاد: ${email}` };
        if (clickUpTimestamp) taskBody.due_date = clickUpTimestamp;
        const response = await axios.post(`https://api.clickup.com/api/v2/list/${CLICKUP_SINGLE_LIST_ID}/task`, taskBody, { headers: { 'Authorization': CLICKUP_TOKEN, 'Content-Type': 'application/json' } });
        const createdTask = response.data;
        try {
            const listUsersResponse = await axios.get(`https://api.clickup.com/api/v2/list/${CLICKUP_SINGLE_LIST_ID}/member`, { headers: { 'Authorization': CLICKUP_TOKEN } });
            const clickUpUsers = listUsersResponse.data.members || [];
            const matchedMember = clickUpUsers.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
            if (matchedMember) {
                await axios.put(`https://api.clickup.com/api/v2/task/${createdTask.id}`, { assignees: { add: [matchedMember.id] } }, { headers: { 'Authorization': CLICKUP_TOKEN, 'Content-Type': 'application/json' } });
            }
        } catch (e) { }
        if (subTasks && subTasks.length > 0) {
            const checklistResponse = await axios.post(`https://api.clickup.com/api/v2/task/${createdTask.id}/checklist`, { name: "خطوات التنفيذ" }, { headers: { 'Authorization': CLICKUP_TOKEN, 'Content-Type': 'application/json' } });
            const checklistId = checklistResponse.data.checklist.id;
            for (let sub of subTasks) {
                await axios.post(`https://api.clickup.com/api/v2/checklist/${checklistId}/checklist_item`, { name: sub }, { headers: { 'Authorization': CLICKUP_TOKEN, 'Content-Type': 'application/json' } });
            }
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/api/submit-task', async (req, res) => {
    const { taskId } = req.body;
    if (taskId) {
        try {
            await axios.put(`https://api.clickup.com/api/v2/task/${taskId}`, { status: 'complete' }, { headers: { 'Authorization': CLICKUP_TOKEN, 'Content-Type': 'application/json' } });
            res.json({ success: true });
        } catch (err) { res.status(500).json({ success: false }); }
    }
});

app.post('/api/submit-unlisted-task', async (req, res) => {
    const { taskTitle, userEmail, userName } = req.body;
    if (!taskTitle || !userEmail) return res.status(400).json({ success: false });
    const mailOptions = {
        from: `"بوابة مجتمع الضاد الذكية" <${MY_GMAIL}>`, to: HAFSA_GMAIL,
        subject: `🚨 مهمة يدوي جديدة مضافة بواسطة: ${userName || 'حكواتي'}`,
        html: `<div dir="rtl"><h2>بوابة مجتمع الضاد الذكية</h2><p>تسليم مهمة يدوي: ${taskTitle} بواسطة ${userName} (${userEmail})</p></div>`
    };
    try { await transporter.sendMail(mailOptions); res.json({ success: true }); } catch (error) { res.status(500).json({ success: false }); }
});

module.exports = app;