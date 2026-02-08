
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

    // --- Update Stats ---
    if (document.getElementById('stat-total')) document.getElementById('stat-total').innerText = products.length;
    if (document.getElementById('stat-clothes')) document.getElementById('stat-clothes').innerText = products.filter(p => p.category === 'clothes').length;
    if (document.getElementById('stat-shoes')) document.getElementById('stat-shoes').innerText = products.filter(p => p.category === 'shoes').length;

    productsListBody.innerHTML = products.map(p => {
        const isActive = p.active !== false && p.active !== "false";
        return `
            <tr>
                <td><img src="${p.image || ''}" class="product-thumb"></td>
                <td><strong>${p.name || 'بدون اسم'}</strong></td>
                <td>${p.price || 0} جنيه</td>
                <td>${p.category === 'clothes' ? 'ملابس' : p.category === 'shoes' ? 'أحذية' : 'بناطيل'}</td>
                <td>
                    <div class="actions">
                        <i class="fas ${isActive ? 'fa-eye' : 'fa-eye-slash'}" 
                           style="color: ${isActive ? '#4CAF50' : '#888'}; cursor: pointer; font-size: 1.2rem;" 
                           onclick="toggleProductStatus('${p.id}', ${isActive})" 
                           title="${isActive ? 'إخفاء من الموقع' : 'إظهار في الموقع'}"></i>
                        <i class="fas fa-edit btn-edit" style="color: #2196F3; cursor: pointer; font-size: 1.2rem;" onclick="editProduct('${p.id}')"></i>
                        <i class="fas fa-trash-alt btn-delete" style="color: #f44336; cursor: pointer; font-size: 1.2rem;" onclick="deleteProduct('${p.id}')"></i>
                    </div>
                </td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="5" style="text-align:center; padding:30px; opacity:0.5;">لا توجد منتجات حالياً</td></tr>';
}

window.toggleProductStatus = async function (id, currentStatus) {
    if (!id) return;
    try {
        await productsCol.doc(id).update({ active: !currentStatus });
        console.log(`✅ تم تحديث حالة المنتج ${id} إلى ${!currentStatus}`);
        await loadProducts();
    } catch (e) {
        console.error("❌ Error toggling product status:", e);
        alert("فشل تحديث حالة المنتج");
    }
};

window.deleteProduct = async function (id) {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    try {
        await productsCol.doc(id).delete();
        await loadProducts();
    } catch (e) { alert("حدث خطأ أثناء الحذف"); }
};

// --- Missing Functions from HTML ---
const parentSubMap = {
    clothes: [{ id: 'hoodies', label: 'هوديز' }, { id: 'jackets', label: 'جواكت' }, { id: 'pullover', label: 'بلوفر' }, { id: 'shirts', label: 'قمصان' }, { id: 'coats', label: 'بالطو' }, { id: 'tshirts', label: 'تيشيرت' }, { id: 'polo', label: 'بولو' }],
    pants: [{ id: 'jeans', label: 'جينز' }, { id: 'sweatpants', label: 'سويت بانتس' }],
    shoes: []
};

window.updateSubCats = () => {
    const pCatSelect = document.getElementById('p-category');
    const subSelect = document.getElementById('p-subcategory');
    if (!pCatSelect || !subSelect) return;
    const pCat = pCatSelect.value;
    const subs = parentSubMap[pCat] || [];
    subSelect.innerHTML = '<option value="all">الكل</option>' + subs.map(s => `<option value="${s.id}">${s.label}</option>`).join('');
};

window.toggleForm = (show = null) => {
    const f = document.getElementById('productForm');
    if (!f) return;
    if (show === null) f.style.display = f.style.display === 'block' ? 'none' : 'block';
    else f.style.display = show ? 'block' : 'none';
};

window.handleImage = (input) => {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('preview-img');
            if (preview) preview.src = e.target.result;
            const hiddenBase64 = document.getElementById('p-image-base64');
            if (hiddenBase64) hiddenBase64.value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

window.addColorVariant = (data = { name: '', image: '' }) => {
    const container = document.getElementById('color-variants-container');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'color-variant-input';
    div.style = "background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; display: flex; flex-direction: column; gap: 5px;";
    div.innerHTML = `<input type="text" placeholder="اسم اللون" value="${data.name}" class="v-name"><input type="text" placeholder="رابط الصورة" value="${data.image}" class="v-image"><button type="button" onclick="this.parentElement.remove()" style="background:none; color:#f44336; border:none; cursor:pointer;">حذف</button>`;
    container.appendChild(div);
};

document.getElementById('saveProductForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const variants = [];
    document.querySelectorAll('.color-variant-input').forEach(v => {
        const name = v.querySelector('.v-name').value;
        const img = v.querySelector('.v-image').value;
        if (name) variants.push({ name, image: img });
    });

    const priceInput = document.getElementById('p-price');
    const priceVal = priceInput ? Number(priceInput.value) : 0;
    console.log("💰 [Admin] Saving product with price:", priceVal);

    const productData = {
        name: document.getElementById('p-name').value,
        price: priceVal,
        category: document.getElementById('p-category').value,
        subCategory: document.getElementById('p-subcategory').value,
        image: document.getElementById('p-image-base64').value,
        sizes: document.getElementById('p-sizes').value.split(',').map(s => s.trim()),
        badge: document.getElementById('p-badge').value,
        colorVariants: variants,
        active: true,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        showLoader(true);
        if (id) {
            await productsCol.doc(id).update(productData);
        } else {
            await productsCol.add({ ...productData, createdAt: firebase.firestore.FieldValue.serverTimestamp(), active: true });
        }

        await loadProducts(); // Force refresh table
        toggleForm(false);
        setTimeout(() => alert("تم الحفظ بنجاح!"), 100);
    } catch (err) {
        console.error("❌ Save Error:", err);
        alert("خطأ أثناء الحفظ: " + err.message);
    } finally {
        showLoader(false);
    }
});

window.editProduct = async (id) => {
    try {
        const doc = await productsCol.doc(id).get();
        if (!doc.exists) return alert("المنتج غير موجود!");
        const p = doc.data();

        toggleForm(true);
        document.getElementById('edit-id').value = id;
        document.getElementById('p-name').value = p.name || '';
        document.getElementById('p-price').value = p.price || 0;
        document.getElementById('p-category').value = p.category || 'clothes';
        document.getElementById('p-sizes').value = p.sizes ? p.sizes.join(', ') : '';
        document.getElementById('p-image-base64').value = p.image || '';

        const previewEl = document.getElementById('preview-img');
        if (previewEl) previewEl.src = p.image || '';

        const variantsContainer = document.getElementById('color-variants-container');
        if (variantsContainer) {
            variantsContainer.innerHTML = '';
            if (p.colorVariants) p.colorVariants.forEach(v => addColorVariant(v));
        }

        updateSubCats();
        const subCatEl = document.getElementById('p-subcategory');
        if (subCatEl) subCatEl.value = p.subCategory || 'all';
    } catch (err) {
        console.error("❌ Edit Error:", err);
        alert("حدث خطأ أثناء فتح التعديل");
    }
};

async function loadOrders() {
    if (!db) return;
    try {
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
    } catch (e) { console.error("Load orders error", e); }
}

async function loadShippingCosts() {
    if (!db) return;
    const doc = await db.collection('settings').doc('shipping').get();
    const costs = doc.data() || {};
}

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;

    if (pass === "diesel_prod") adminRole = 'products';
    else if (pass === "diesel_order") adminRole = 'orders';
    else if (pass === "diesel_ship") adminRole = 'shipping';
    else if (pass === "ديزل_كل_حاجة") adminRole = 'all';
    else { alert("كلمة مرور غير صحيحة!"); return; }

    localStorage.setItem('adminRole', adminRole);
    try {
        await firebase.auth().signInWithEmailAndPassword(email, pass);
    } catch (err) { alert("خطأ في تسجيل الدخول: " + err.message); }
});

document.getElementById('logout-btn')?.addEventListener('click', () => {
    firebase.auth().signOut();
    localStorage.removeItem('adminRole');
    location.reload();
});
