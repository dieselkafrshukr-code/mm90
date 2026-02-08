
// 🚀 DIESEL ADMIN ENGINE - HYBRID VERSION (Firebase Version)
const firebaseConfig = {
    apiKey: "AIzaSyBFRqe3lhvzG0FoN0uAJlAP-VEz9bKLjUc",
    authDomain: "mre23-4644a.firebaseapp.com",
    projectId: "mre23-4644a",
    storageBucket: "mre23-4644a.firebasestorage.app",
    messagingSenderId: "179268769077",
    appId: "1:179268769077:web:d9fb8cd25ad284ae0de87c"
};

let db = null;
let productsCol = null;
let isFirebaseReady = false;
let adminRole = localStorage.getItem('adminRole') || 'none';

const governorates = [
    "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة", "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", "الوادي الجديد", "السويس", "الشرقية", "دمياط", "بورسعيد", "جنوب سيناء", "كفر الشيخ", "مطروح", "الأقصر", "قنا", "شمال سيناء", "سوهاج", "بني سويف", "أسيوط", "أسوان"
];

// Initialize Firebase
try {
    if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY") {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        productsCol = db.collection('products');
        isFirebaseReady = true;

        firebase.auth().onAuthStateChanged(user => {
            const loginOverlay = document.getElementById('login-overlay');
            const adminContent = document.getElementById('admin-main-content');

            if (user) {
                if (loginOverlay) loginOverlay.style.display = 'none';
                if (adminContent) adminContent.style.display = 'block';
                applyRoleRestrictions();

                if (adminRole === 'all' || adminRole === 'products') { showTab('products'); loadProducts(); }
                else if (adminRole === 'orders') { showTab('orders'); loadOrders(); }
                else if (adminRole === 'shipping') { showTab('shipping'); loadShippingCosts(); }
            } else {
                if (loginOverlay) loginOverlay.style.display = 'flex';
                if (adminContent) adminContent.style.display = 'none';
            }
            showLoader(false);
        });
    }
} catch (error) {
    console.error("Firebase init failed", error);
    showLoader(false);
}

// Emergency Fallback
setTimeout(() => showLoader(false), 5000);

function showLoader(show) {
    const l = document.getElementById('global-loader');
    if (l) l.style.display = show ? 'flex' : 'none';
}

function showTab(tab) {
    document.querySelectorAll('.admin-tabs button').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tab}`)?.classList.add('active');

    document.getElementById('products-section').style.display = 'none';
    document.getElementById('orders-section').style.display = 'none';
    document.getElementById('shipping-section').style.display = 'none';
    const section = document.getElementById(`${tab}-section`);
    if (section) section.style.display = 'block';
}

function applyRoleRestrictions() {
    const tabProducts = document.getElementById('tab-products');
    const tabOrders = document.getElementById('tab-orders');
    const tabShipping = document.getElementById('tab-shipping');

    const hide = (el) => el && (el.style.display = 'none');
    const show = (el) => el && (el.style.display = 'flex');

    if (adminRole === 'products') { show(tabProducts); hide(tabOrders); hide(tabShipping); }
    else if (adminRole === 'orders') { hide(tabProducts); show(tabOrders); hide(tabShipping); }
    else if (adminRole === 'shipping') { hide(tabProducts); hide(tabOrders); show(tabShipping); }
    else if (adminRole === 'all') { show(tabProducts); show(tabOrders); show(tabShipping); }
}

async function loadProducts() {
    if (!db) return;
    const snapshot = await productsCol.get();
    const productsListBody = document.getElementById('products-list-body');
    if (!productsListBody) return;

    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Update Stats
    document.getElementById('stat-total').innerText = products.length;
    document.getElementById('stat-clothes').innerText = products.filter(p => p.category === 'clothes').length;
    document.getElementById('stat-shoes').innerText = products.filter(p => p.category === 'shoes').length;

    productsListBody.innerHTML = products.map(p => {
        const isActive = p.active !== false; // Default to true if not defined
        return `
            <tr>
                <td><img src="${p.image}" class="product-thumb"></td>
                <td><strong>${p.name}</strong></td>
                <td>${p.price} جنيه</td>
                <td>${p.category === 'clothes' ? 'ملابس' : p.category === 'shoes' ? 'أحذية' : 'بناطيل'}</td>
                <td>
                    <div class="actions">
                        <i class="fas ${isActive ? 'fa-eye' : 'fa-eye-slash'}" 
                           style="color: ${isActive ? '#4CAF50' : '#888'}; cursor: pointer;" 
                           onclick="toggleProductStatus('${p.id}', ${isActive})" 
                           title="${isActive ? 'إخفاء من الموقع' : 'إظهار في الموقع'}"></i>
                        <i class="fas fa-edit btn-edit" onclick="editProduct('${p.id}')"></i>
                        <i class="fas fa-trash-alt btn-delete" onclick="deleteProduct('${p.id}')"></i>
                    </div>
                </td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="5" style="text-align:center; padding:30px; opacity:0.5;">لا توجد منتجات حالياً</td></tr>';
}

window.toggleProductStatus = async function (id, currentStatus) {
    if (!id) return;
    try {
        await productsCol.doc(id).update({
            active: !currentStatus
        });
        console.log(`✅ تم تحديث حالة المنتج ${id} إلى ${!currentStatus}`);
        loadProducts(); // Refresh list
    } catch (e) {
        console.error("❌ Error toggling product status:", e);
        alert("فشل تحديث حالة المنتج");
    }
};

window.deleteProduct = async function (id) {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    try {
        await productsCol.doc(id).delete();
        loadProducts();
    } catch (e) {
        alert("حدث خطأ أثناء الحذف");
    }
};

async function loadOrders() {
    if (!db) return;
    const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

    ordersList.innerHTML = snapshot.docs.map(doc => {
        const o = doc.data();
        return `
            <div class="order-card">
                <h3>طلبية من: ${o.customerName}</h3>
                <p>الهاتف: ${o.phone}</p>
                <p>الإجمالي: ${o.total} جنيه</p>
                <p>الحالة: ${o.status}</p>
            </div>
        `;
    }).join('') || '<p>لا توجد طلبات</p>';
}

async function loadShippingCosts() {
    const doc = await db.collection('settings').doc('shipping').get();
    const costs = doc.data() || {};
    // ... rendering for shipping section ...
}

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;

    // Passwords for roles
    if (pass === "diesel_prod") adminRole = 'products';
    else if (pass === "diesel_order") adminRole = 'orders';
    else if (pass === "diesel_ship") adminRole = 'shipping';
    else if (pass === "ديزل_كل_حاجة") adminRole = 'all';
    else {
        alert("كلمة مرور غير صحيحة!");
        return;
    }

    localStorage.setItem('adminRole', adminRole);
    try {
        await firebase.auth().signInWithEmailAndPassword(email, pass);
    } catch (err) {
        alert("خطأ في تسجيل الدخول: " + err.message);
    }
});

document.getElementById('logout-btn')?.addEventListener('click', () => {
    firebase.auth().signOut();
    localStorage.removeItem('adminRole');
    location.reload();
});
