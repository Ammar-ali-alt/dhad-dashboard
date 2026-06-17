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

// 💾 رابط اتصال قاعدة بيانات مونجو دي بي السحابية الخاصة بك مع دمج الداتا
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://amar11101095770691_db_user:hGu8bhoMistK6Mk2@cluster0.e7f2cve.mongodb.net/dhad_db?retryWrites=true&w=majority&appName=Cluster0';

// الاتصال بـ MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log("تم الاتصال بنجاح بقاعدة بيانات مونجو السحابية لمجتمع الضاد 💾"))
    .catch(err => console.error("خطأ في اتصال مونجو دي بي:", err.message));

// 📝 بناء الـ Schema و الـ Model لحفظ المستخدمين والعدادات للأبد في مونجو
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

const User = mongoose.model('User', userSchema);

// تكتيك الـ Seed: إدراج تيم الفهرس تلقائيًا في المونجو أول مرة لكي لا تحتاج لإدخالهم يدويًا
async function seedInitialUsers() {
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

    try {
        for (let u of defaultUsers) {
            const exists = await User.findOne({ email: u.email });
            if (!exists) {
                await User.create(u);
            }
        }
    } catch (err) { console.log("خطأ في تهيئة مستخدمين مونجو:", err.message); }
}
mongoose.connection.once('open', () => { seedInitialUsers(); });

// إعداد Nodemailer لإشعار حفصة بريديًا
const transporter = nodemailer.createTransport({
    service: 'gmail', host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user: MY_GMAIL, pass: 'qurkgui85y06wxwc' }
});

function getCurrentDayName() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
}

// دالة جلب التأسكات الحية وقراءة بيانات المسؤول بمرونة
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
            let deadlineDate = "غير حدد";
            if (task.due_date) deadlineDate = new Date(parseInt(task.due_date)).toLocaleDateString('ar-EG');

            let deptField = "عام";
            if (task.custom_fields && Array.isArray(task.custom_fields)) {
                const foundDept = task.custom_fields.find(f => f.name && (f.name.includes("القسم") || f.name.includes("Department")));
                if (foundDept && foundDept.value !== undefined && foundDept.type_config && foundDept.type_config.options) {
                    const opt = foundDept.type_config.options[foundDept.value];
                    if (opt && opt.name) deptField = opt.name;
                }
            } else if (task.tags && task.tags.length > 0) {
                deptField = task.tags[0].name;
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

// 🔓 تسجيل الدخول وتحديث عداد الأيام التفاعلي داخل المونجو دي بي
app.post('/api/login', async (req, res) => {
    const { email, pin } = req.body;
    if (!email || !pin) return res.status(400).json({ success: false, message: "بيانات ناقصة!" });

    const lowerEmail = email.toLowerCase().trim();
    const isMasterAdmin = (lowerEmail === MY_GMAIL && pin === SUPER_PIN);

    try {
        let currentUser = await User.findOne({ email: lowerEmail });
        if (!currentUser || currentUser.pin !== pin) {
            return res.status(401).json({ success: false, message: "البريد أو الـ PIN غير صحيح!" });
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

// 📝 إنشاء حساب جديد آمن وحفظه في مونجو دي بي السحابية
app.post('/api/signup', async (req, res) => {
    const { fullName, email, pin } = req.body;
    if (!fullName || !email || !pin) return res.status(400).json({ success: false, message: "يرجى إدخال كافة البيانات!" });

    const lowerEmail = email.toLowerCase().trim();
    try {
        const exists = await User.findOne({ email: lowerEmail });
        if (exists) return res.status(400).json({ success: false, message: "هذا الحساب مسجل بالفعل!" });

        await User.create({
            email: lowerEmail, fullName, pin,
            visitsByDay: { Saturday: 0, Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 }
        });
        res.json({ success: true, message: "تم تسجيل حسابك المستجد بنجاح في السحاب! جرب سجل دخول الحين." });
    } catch (err) { res.status(500).json({ success: false }); }
});

// 📊 جلب التيم من مونجو دي بي لايف لإحصائيات الإدارة
app.get('/api/admin/users', async (req, res) => {
    try {
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

        const response = await axios.post(`https://api.clickup.com/api/v2/list/${CLICKUP_SINGLE_LIST_ID}/task`, taskBody, {
            headers: { 'Authorization': CLICKUP_TOKEN, 'Content-Type': 'application/json' }
        });

        const createdTask = response.data;

        // Auto Assign التلقائي للشخص نفسه لتصبح رسمية وليست مجرد فكرة
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
        res.json({ success: true, message: "تم تعيين وجدولة المهمة بنجاح! 🚀" });
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
        html: `
            <div dir="rtl" style="font-family: 'Cairo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f59e0b; border-radius: 12px; background-color: #060606; color: #e8e8e8;">
                <h2 style="color: #f59e0b; text-align: center; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">بوابة مجتمع الضاد الذكية</h2>
                <p style="font-size: 16px; color: #ffffff;">مرحباً يا <b>حفصة</b>،</p>
                <p style="font-size: 14px; color: #a0a0a0;">لقد قام أحد المسؤولين بتسليم مهمة يدوية خارجية، يرجى مراجعتها وتعديلها داخل كليك أب:</p>
                <div style="background: #0d0d0d; border-right: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 6px; border: 1px solid rgba(245,158,11,0.1);">
                    <p style="margin: 5px 0; font-size: 14px;"><b>📌 عنوان المهمة:</b> <span style="color:#fff;">${taskTitle}</span></p>
                    <p style="margin: 5px 0; font-size: 14px;"><b>👤 المسؤول التنفيذي:</b> <span style="color:#f59e0b;">${userName || 'غير محدد'}</span> (${userEmail})</p>
                    <p style="margin: 5px 0; font-size: 14px;"><b>⏰ توقيت التسليم الحركي:</b> ${new Date().toLocaleString('ar-EG')}</p>
                </div>
            </div>`
    };
    try { await transporter.sendMail(mailOptions); res.json({ success: true, message: "تم تسجيل تسليم المهمة الخارجية وإشعار حفصة بنجاح! 📢" }); } catch (error) { res.status(500).json({ success: false }); }
});

module.exports = app;