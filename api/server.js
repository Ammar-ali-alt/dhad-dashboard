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

// 💾 رابط الاتصال المباشر والمقفل من صورتك الأخيرة
const MONGODB_URI = 'mongodb+srv://amar11101095770691_db_user:hGu8bhoMistK6Mk2@cluster0.e7f2cve.mongodb.net/dhad_db?retryWrites=true&w=majority';

// دالة اتصال ذكية تضمن إعادة فتح القناة لو فيرسل نومها
async function connectToMongo() {
    if (mongoose.connection.readyState === 1) return;
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("تم الاتصال السحابي بنجاح 💾");
    } catch (e) {
        console.error("خطأ اتصال مونجو:", e.message);
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
        await connectToMongo(); // تأمين الاتصال
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

app.post('/api/login', async (req, res) => {
    const { email, pin } = req.body;
    if (!email || !pin) return res.status(400).json({ success: false });
    const lowerEmail = email.toLowerCase().trim();
    const isMasterAdmin = (lowerEmail === MY_GMAIL && pin === SUPER_PIN);
    try {
        await connectToMongo();
        let currentUser = await User.findOne({ email: lowerEmail });
        if (!currentUser || currentUser.pin !== pin) return res.status(401).json({ success: false });
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

// 🚀 مسار الـ Signup المقفل والمحمي لإجبار فتح الاتصال الفوري بمونجو
app.post('/api/signup', async (req, res) => {
    const { fullName, email, pin } = req.body;
    if (!fullName || !email || !pin) return res.status(400).json({ success: false, message: "بيانات ناقصة" });
    const lowerEmail = email.toLowerCase().trim();
    try {
        await connectToMongo(); // 🛑 إجبار السيرفر على فتح القناة لايف مع مونجو في نفس اللحظة
        const exists = await User.findOne({ email: lowerEmail });
        if (exists) return res.status(400).json({ success: false, message: "مسجل بالفعل" });

        await User.create({
            email: lowerEmail, fullName, pin, role: "حكواتي مستجد", sector: "عام",
            visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 },
            totalVisits: 0
        });
        res.json({ success: true, message: "تم تسجيل حسابك المستجد بنجاح! جرب سجل دخول الحين." });
    } catch (err) {
        console.error("خطأ الساين اب:", err.message);
        res.status(500).json({ success: false, message: "فشل حفظ الحساب السحابي." });
    }
});

app.get('/api/admin/users', async (req, res) => {
    try {
        await connectToMongo();
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