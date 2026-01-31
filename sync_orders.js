const admin = require('firebase-admin');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 1. إعداد الاتصال بـ Firebase
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ خطأ: ملف serviceAccountKey.json غير موجود!');
    console.log('يرجى تحميل الملف من Firebase (Project Settings -> Service Accounts -> Generate new private key)');
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function generateDailyReport() {
    console.log('⏳ جاري جلب البيانات وتحديث التقارير...');

    try {
        const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();

        if (snapshot.empty) {
            console.log('📭 لا توجد طلبات في قاعدة البيانات.');
            return;
        }

        const allOrders = [];
        const todayOrders = [];
        const stats = {
            totalOrders: 0,
            deliveredOrders: 0,
            pendingOrders: 0,
            totalRevenue: 0,
            todayRevenue: 0
        };

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        snapshot.forEach(doc => {
            const o = doc.data();
            const createdAt = o.createdAt ? o.createdAt.toDate() : null;
            const dateStr = createdAt ? createdAt.toLocaleString('ar-EG') : 'قيد المعالجة';

            // تحويل المنتجات لنص مقروء
            const itemsList = o.items ? o.items.map(i => `${i.name} (${i.color}/${i.size}) x${i.quantity}`).join(' | ') : 'بدون منتجات';

            const orderEntry = {
                "التاريخ": dateStr,
                "اسم العميل": o.customerName || 'بدون اسم',
                "رقم الهاتف": o.phone || 'بدون رقم',
                "العنوان": o.address || 'بدون عنوان',
                "المنتجات": itemsList,
                "الإجمالي": o.total || 0,
                "الحالة": o.status || 'جديد',
                "المعرف ID": doc.id
            };

            allOrders.push(orderEntry);
            stats.totalOrders++;
            stats.totalRevenue += Number(o.total || 0);

            if (o.status === 'تم التسليم') {
                stats.deliveredOrders++;
            } else if (o.status !== 'ملغي') {
                stats.pendingOrders++;
            }

            // تحقق إذا كان الطلب اليوم
            if (createdAt && createdAt >= startOfToday) {
                todayOrders.push(orderEntry);
                stats.todayRevenue += Number(o.total || 0);
            }
        });

        // إنشاء كتاب إكسل جديد
        const workbook = XLSX.utils.book_new();

        // 1. ورقة الملخص العام
        const summaryData = [
            ["إحصائيات المحل الشاملة", ""],
            ["إجمالي عدد الطلبات", stats.totalOrders],
            ["طلبات تم تسليمها", stats.deliveredOrders],
            ["طلبات قيد التنفيذ", stats.pendingOrders],
            ["إجمالي المبيعات", stats.totalRevenue + " ج.م"],
            ["مبيعات اليوم", stats.todayRevenue + " ج.م"],
            ["تاريخ التحديث", new Date().toLocaleString('ar-EG')]
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, wsSummary, "الملخص العام");

        // 2. ورقة طلبات اليوم
        const wsToday = XLSX.utils.json_to_sheet(todayOrders);
        XLSX.utils.book_append_sheet(workbook, wsToday, "طلبات اليوم");

        // 3. ورقة كافة الطلبات
        const wsAll = XLSX.utils.json_to_sheet(allOrders);
        XLSX.utils.book_append_sheet(workbook, wsAll, "كافة الطلبات");

        // ضبط عرض الأعمدة لكل الأوراق
        const cols = [
            { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 35 }, { wch: 50 }, { wch: 15 }, { wch: 15 }, { wch: 25 }
        ];
        wsToday['!cols'] = cols;
        wsAll['!cols'] = cols;
        wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];

        // حفظ الملف
        const filePath = path.join(__dirname, 'تقرير_المبيعات_اليومي.xlsx');
        XLSX.writeFile(workbook, filePath);

        // تحديث ملف الوقت
        fs.writeFileSync(path.join(__dirname, 'last_update.txt'), `آخر تحديث ناجح للتقرير: ${new Date().toLocaleString('ar-EG')}`);

        console.log(`✅ تم تحديث ملف الإكسل: تقرير_المبيعات_اليومي.xlsx`);
        console.log(`⭐ إجمالي الطلبات: ${stats.totalOrders} | مبيعات اليوم: ${stats.todayRevenue} ج.م`);

    } catch (error) {
        console.error('❌ حدث خطأ أثناء التحديث:', error);
    }
}

// البدء
generateDailyReport();
