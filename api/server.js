const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// 🟢 بيانات عمار علي السرية والنهائية 🟢
const MY_GMAIL = 'ammar.aly000@gmail.com';
const SUPER_PIN = '0000';
const CLICKUP_TOKEN = 'pk_218484746_Q1RKGUI85Y06WXWC105T3DHXHTA4WHBH';

// 📋 الـ 13 قائمة الشاملة لـ مجتمع الضاد في كليك أب
const CLICKUP_LIST_IDS = [
    '901809636671', '901809636805', '901809636730', '901809636735',
    '901809636746', '901809636752', '901809636802', '901811344196',
    '901812285481', '901812285594', '901816088339', '901818521616',
    '901810061524'
];

const DEFAULT_CREATION_LIST = '901809636671';

// قاعدة بيانات حية ومباشرة في الميموري (بتتفعل فوراً بدون انتظار موافقة)
let usersDatabase = {
    "amar11101095770691@gmail.com": {
        fullName: "عمار علي",
        pin: "1111",
        status: "active",
        dailyVisits: 0
    }
};

// 📝 إنشاء حساب جديد: بينزل active فوراً من غير إيميل تفعيل
app.post('/api/signup', (req, res) => {
    const { fullName, email, pin } = req.body;
    const lowerEmail = email.toLowerCase();

    if (usersDatabase[lowerEmail]) {
        return res.status(400).json({ success: false, message: "البريد الإلكتروني ده مسجل بالفعل يا صاحبي!" });
    }

    usersDatabase[lowerEmail] = {
        fullName,
        pin,
        status: "active",
        dailyVisits: 0
    };

    res.json({ success: true, message: "تم إنشاء حسابك بنجاح! تقدر تسجل دخول الحين فوراً 🚀" });
});

// 🔓 تسجيل الدخول وجلب التاسكات
app.post('/api/login', async (req, res) => {
    const { email, pin } = req.body;
    const lowerEmail = email.toLowerCase();

    // لو عمار علي داخل بالـ PIN السري الرئيسي (0000)
    if (lowerEmail === MY_GMAIL && pin === SUPER_PIN) {
        return res.json({
            success: true,
            isAdmin: true,
            message: "مرحباً بالقائد الأعلى للضاد 🔥"
        });
    }

    const user = usersDatabase[lowerEmail];
    if (!user || user.pin !== pin) {
        return res.status(401).json({ success: false, message: "البريد الإلكتروني أو الـ PIN فيه حاجة غلط!" });
    }

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
                const isAssigned = task.assignees && task.assignees.some(assignee => assignee.email.toLowerCase() === lowerEmail);
                const isCreatedByHim = task.description && task.description.includes(lowerEmail);
                const isNotDone = task.status && task.status.status.toLowerCase() !== 'complete' && task.status.status.toLowerCase() !== 'done';

                return (isAssigned || isCreatedByHim) && isNotDone;
            }).map(task => ({
                id: task.id,
                title: task.name,
                subTasks: task.checklists && task.checklists[0] ? task.checklists[0].items.map(item => item.name) : ["تحضير المادة العلمية", "التنفيذ والمراجعة الفنية"]
            }));
            allUserTasks = allUserTasks.concat(filtered);
        });

        res.json({ success: true, isAdmin: false, user: { ...user, tasks: allUserTasks } });
    } catch (error) {
        res.json({ success: true, isAdmin: false, user: { ...user, tasks: [] } });
    }
});

// 📊 خاص بعمار: Endpoint لجلب قائمة بكل الأدمنز لمراقبة الداتا جوه اللوحة
app.get('/api/admin/users', (req, res) => {
    // بنرجع لستة بكل الأدمنز المسجلين في السيستم
    const adminsList = Object.keys(usersDatabase).map(email => ({
        email: email,
        fullName: usersDatabase[email].fullName,
        dailyVisits: usersDatabase[email].dailyVisits
    }));
    res.json({ success: true, users: adminsList });
});

// 🚀 ترحيل التاسكات المخصصة لكليك أب
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

        res.json({ success: true, message: "تمت إضافة المهمة بنجاح في كليك أب!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "فشل ترحيل التاسك لكليك أب." });
    }
});

app.post('/api/submit-task', async (req, res) => {
    const { taskId } = req.body;
    if (taskId) {
        try {
            await axios.put(`https://api.clickup.com/api/v2/task/${taskId}`, { status: 'complete' }, {
                headers: { 'Authorization': CLICKUP_TOKEN, 'Content-Type': 'application/json' }
            });
        } catch (clickUpErr) { console.log(clickUpErr.message); }
    }
    res.json({ success: true });
});

app.post('/api/submit-unlisted-task', (req, res) => {
    res.json({ success: true });
});

module.exports = app;