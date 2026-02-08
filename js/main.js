// 🚀 DIESEL SHOP - INVINCIBLE ENGINE (Firebase Version)
// --- IMMEDIATE UI FIX: FORCE REMOVE LOADER AFTER 2 SECONDS ---
const forceHideLoader = () => {
    const loaderEl = document.getElementById('loader');
    if (loaderEl) {
        loaderEl.style.opacity = '0';
        setTimeout(() => {
            loaderEl.style.display = 'none';
        }, 800);
    }
    console.log("🚀 Loader forced hidden");
};
setTimeout(forceHideLoader, 2000);

let cart = [];
try {
    const saved = localStorage.getItem('diesel_cart');
    if (saved) cart = JSON.parse(saved);
} catch (e) {
    cart = [];
}

let selectedProductForSize = null;
let selectedColor = null;
let activeCategory = "all";
let remoteProducts = []; // To store products from Firebase
let shippingCosts = {};
const governorates = [
    "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة", "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", "الوادي الجديد", "السويس", "الشرقية", "دمياط", "بورسعيد", "جنوب سيناء", "كفر الشيخ", "مطروح", "الأقصر", "قنا", "شمال سيناء", "سوهاج", "بني سويف", "أسيوط", "أسوان"
];

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyBFRqe3lhvzG0FoN0uAJlAP-VEz9bKLjUc",
    authDomain: "mre23-4644a.firebaseapp.com",
    projectId: "mre23-4644a",
    storageBucket: "mre23-4644a.firebasestorage.app",
    messagingSenderId: "179268769077",
    appId: "1:179268769077:web:d9fb8cd25ad284ae0de87c"
};

// Initialize Firebase
let currentUser = null;
let db = null;

console.log("🔥 بدء تهيئة Firebase...");

try {
    if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY") {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log("✅ تم تهيئة Firebase بنجاح!");
        console.log("📊 Project ID:", firebaseConfig.projectId);

        // Auth State Listener
        firebase.auth().onAuthStateChanged(user => {
            currentUser = user;
            if (user) {
                console.log("👤 مستخدم مسجل:", user.email);
                const name = user.displayName ? user.displayName.split(' ')[0] : 'حسابي';
                localStorage.setItem('diesel_user_cache', JSON.stringify({ name }));
                updateAuthUI();
            } else {
                console.log("👤 لا يوجد مستخدم مسجل (وضع الزائر)");
                localStorage.removeItem('diesel_user_cache');
                updateAuthUI();
            }
        });
    } else {
        console.error("❌ Firebase غير متوفر أو API Key غير صحيح");
    }
} catch (error) {
    console.error("❌ فشل تهيئة Firebase:", error);
}


// ✅ Google Login ENABLED (Firebase Provider is active)
window.signInWithGoogle = async function () {
    console.log("🔐 محاولة تسجيل الدخول بجوجل...");
    const provider = new firebase.auth.GoogleAuthProvider();
    // Force account selection every time
    provider.setCustomParameters({
        prompt: 'select_account'
    });
    try {
        await firebase.auth().signInWithPopup(provider);
        console.log("✅ تم تسجيل الدخول بنجاح!");
    } catch (e) {
        console.error("❌ Google Login Error:", e);
        alert("فشل تسجيل الدخول: " + e.message);
    }
};

window.signOutUser = async function () {
    if (firebase && firebase.auth) {
        await firebase.auth().signOut();
    }
    location.reload();
};

// Separate rendering from logic for reuse
function renderAuthUI(name) {
    const txt = document.getElementById('auth-text');
    const cartLoggedOut = document.getElementById('cart-auth-logged-out');
    const cartLoggedIn = document.getElementById('cart-auth-logged-in');
    const cartUserName = document.getElementById('cart-user-name');

    if (name) {
        if (txt) txt.innerText = name;
        if (cartLoggedOut) cartLoggedOut.style.display = 'none';
        if (cartLoggedIn) {
            cartLoggedIn.style.display = 'flex';
            if (cartUserName) cartUserName.innerText = `أهلاً، ${name}`;
        }
    } else {
        if (txt) txt.innerText = 'دخول';
        if (cartLoggedOut) cartLoggedOut.style.display = 'block';
        if (cartLoggedIn) cartLoggedIn.style.display = 'none';
    }
}

// DOM Elements
let menContainer, cartBtn, closeCart, cartSidebar, cartOverlay, loader, navbar, sizeModal, closeModal, modalProductName, modalProductPrice, mobileMenuBtn, navLinks, themeToggle, subFiltersContainer;

const hideLoader = () => {
    const loaderEl = document.getElementById('loader');
    if (loaderEl) {
        loaderEl.style.opacity = '0';
        setTimeout(() => {
            loaderEl.style.display = 'none';
        }, 800);
    }
};

const initAll = () => {
    if (window.initialized) return;
    window.initialized = true;

    try {
        initElements();
        initTheme();
        setupEventListeners();
        updateCartUI();
        renderAll();
    } catch (error) {
        console.error("Initialization error:", error);
    } finally {
        setTimeout(hideLoader, 1500);
    }
};

document.addEventListener('DOMContentLoaded', initAll);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initAll();
}

function initElements() {
    menContainer = document.getElementById('men-products');
    cartBtn = document.getElementById('cart-btn');
    closeCart = document.getElementById('close-cart');
    cartSidebar = document.getElementById('cart-sidebar');
    cartOverlay = document.getElementById('cart-overlay');
    loader = document.getElementById('loader');
    navbar = document.querySelector('.navbar');
    sizeModal = document.getElementById('size-modal');
    closeModal = document.getElementById('close-modal');
    modalProductName = document.getElementById('modal-product-name');
    modalProductPrice = document.getElementById('modal-product-price');
    mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    navLinks = document.querySelector('.nav-links');
    themeToggle = document.getElementById('theme-toggle');
    subFiltersContainer = document.getElementById('sub-filters-container');
    loadShippingData();
}

async function loadShippingData() {
    const govSelect = document.getElementById('customer-gov');
    if (govSelect) {
        govSelect.innerHTML = '<option value="" disabled selected>اختر المحافظة...</option>' +
            governorates.sort().map(g => `<option value="${g}" style="background: #111; color: #fff;">${g}</option>`).join('');
    }

    if (db) {
        try {
            const doc = await db.collection('settings').doc('shipping').get();
            if (doc.exists) shippingCosts = doc.data() || {};
        } catch (e) { console.error("Error loading shipping costs", e); }
    }
}

window.updateCheckoutTotal = () => {
    const gov = document.getElementById('customer-gov').value;
    const cost = shippingCosts[gov] || 0;
    const itemsTotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);

    const shippingEl = document.getElementById('shipping-cost');
    const totalEl = document.getElementById('form-total-price');

    if (shippingEl) shippingEl.innerText = `${cost} جنيه`;
    if (totalEl) totalEl.innerText = `${itemsTotal + cost} جنيه`;
};

const parentSubMap = {
    all: [],
    clothes: [
        { id: 'hoodies', label: 'هوديز' },
        { id: 'jackets', label: 'جواكت' },
        { id: 'pullover', label: 'بلوفر' },
        { id: 'shirts', label: 'قمصان' },
        { id: 'coats', label: 'بالطو' },
        { id: 'tshirts', label: 'تيشيرت' },
        { id: 'polo', label: 'بولو' }
    ],
    pants: [
        { id: 'jeans', label: 'جينز' },
        { id: 'sweatpants', label: 'سويت بانتس' }
    ],
    shoes: []
};

function setupEventListeners() {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar?.classList.add('scrolled');
        else navbar?.classList.remove('scrolled');
    });

    document.querySelectorAll('.main-filter-btn').forEach(btn => {
        btn.onclick = () => {
            const parent = btn.dataset.parent;
            document.querySelectorAll('.main-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = parent;
            renderSubFilters(parent);
            filterAndRender('men', parent, 'all');
        };
    });

    if (cartBtn) cartBtn.onclick = (e) => { e.preventDefault(); openCartSidebar(); };
    if (closeCart) closeCart.onclick = closeCartSidebar;
    if (cartOverlay) cartOverlay.onclick = closeCartSidebar;

    if (mobileMenuBtn) {
        mobileMenuBtn.onclick = (e) => {
            e.stopPropagation();
            mobileMenuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
        };
    }

    if (themeToggle) themeToggle.onclick = (e) => { e.preventDefault(); toggleTheme(); };
    if (closeModal) closeModal.onclick = () => sizeModal.classList.remove('active');

    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.onclick = () => {
            if (cart.length === 0) return alert("السلة فارغة!");
            closeCartSidebar();
            document.getElementById('checkout-modal').classList.add('active');
            updateCheckoutTotal();
        };
    }

    const closeCheckout = document.getElementById('close-checkout');
    if (closeCheckout) closeCheckout.onclick = () => document.getElementById('checkout-modal').classList.remove('active');

    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.onsubmit = async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('order-submit-btn');
            submitBtn.disabled = true;
            submitBtn.innerText = "جاري الحفظ...";

            const gov = document.getElementById('customer-gov').value;
            const shippingCost = shippingCosts[gov] || 0;
            const itemsTotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);

            const orderData = {
                customerName: document.getElementById('customer-name').value,
                phone: document.getElementById('customer-phone').value,
                gov: gov,
                address: document.getElementById('customer-address').value,
                items: cart,
                total: itemsTotal + shippingCost,
                status: "جديد",
                paymentStatus: 'كاش/عند الاستلام',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                userEmail: currentUser ? currentUser.email : 'زائر'
            };

            try {
                await db.collection('orders').add(orderData);
                cart = [];
                updateCartUI();
                localStorage.setItem('diesel_cart', JSON.stringify(cart));
                document.getElementById('checkout-modal').classList.remove('active');
                document.getElementById('success-modal').classList.add('active');
                orderForm.reset();
            } catch (err) {
                console.error(err);
                alert("حدث خطأ أثناء معالجة الطلب!");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = "تأكيد الطلب الآن ✨";
            }
        };
    }

    const myOrdersBtn = document.getElementById('my-orders-btn');
    if (myOrdersBtn) {
        myOrdersBtn.onclick = (e) => {
            e.preventDefault();
            openMyOrdersModal();
        };
    }

    const closeOrders = document.getElementById('close-orders-modal');
    if (closeOrders) closeOrders.onclick = () => document.getElementById('my-orders-modal').classList.remove('active');

    // Google login button in orders modal
    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) {
        googleLoginBtn.onclick = (e) => {
            e.preventDefault();
            signInWithGoogle();
        };
    }

    // Logout button in orders modal
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            signOutUser();
        };
    }
}

function renderAll() {
    if (!menContainer) return;
    menContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#fff;">جاري تحميل المنتجات...</div>';

    if (db) {
        // Load ALL products (removed status filter to ensure products show)
        db.collection('products').get().then(snapshot => {
            console.log(`🔥 Firebase: تم تحميل ${snapshot.docs.length} منتج`);
            remoteProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (remoteProducts.length === 0) {
                menContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#fff; opacity:0.7;">⚠️ لا توجد منتجات في قاعدة البيانات. استخدم لوحة التحكم لإضافة منتجات.</div>';
            } else {
                filterAndRender('men', activeCategory, 'all');
            }
        }).catch(err => {
            console.error("❌ Firebase Error:", err);
            menContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#f44336;">⚠️ خطأ في الاتصال بقاعدة البيانات</div>';
            renderFallback();
        });
    } else {
        console.warn("⚠️ Firebase غير متاح، استخدام المنتجات المحلية");
        renderFallback();
    }
}

function renderFallback() {
    remoteProducts = typeof products !== 'undefined' ? products : [];
    if (remoteProducts.length === 0) {
        menContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#fff; opacity:0.7;">لا توجد منتجات</div>';
    } else {
        filterAndRender('men', activeCategory, 'all');
    }
}

function renderSubFilters(parent) {
    if (!subFiltersContainer) return;
    const subs = parentSubMap[parent] || [];
    if (subs.length === 0) {
        subFiltersContainer.classList.remove('active');
        subFiltersContainer.style.display = 'none';
        return;
    }

    subFiltersContainer.innerHTML = `<button class="sub-btn active" onclick="applySubFilter('${parent}', 'all', this)">الكل</button>` +
        subs.map(s => `<button class="sub-btn" onclick="applySubFilter('${parent}', '${s.id}', this)">${s.label}</button>`).join('');

    subFiltersContainer.style.display = 'flex';
    subFiltersContainer.classList.add('active');
}

window.applySubFilter = (parent, subId, btn) => {
    subFiltersContainer.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filterAndRender('men', parent, subId);
};

function filterAndRender(section, parent, sub) {
    if (!menContainer) return;
    // Hide products that are explicitly set to inactive
    let filtered = remoteProducts.filter(p => p.active !== false);

    if (parent !== 'all') {
        filtered = filtered.filter(p => p.parentCategory === parent);
    }
    if (sub !== 'all') filtered = filtered.filter(p => p.subCategory === sub);

    if (filtered.length === 0) {
        menContainer.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; opacity:0.5;">لا توجد نتائج مطابقة</div>`;
        return;
    }

    menContainer.innerHTML = filtered.map(p => `
        <div class="product-card">
            <div class="product-img">
                ${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
                <img src="${p.image}" loading="lazy" alt="${p.name}">
                <div class="product-actions" onclick="openSizeModal('${p.id}')">
                    <button class="action-btn"><i class="fas fa-shopping-cart"></i></button>
                </div>
            </div>
            <div class="product-info">
                <span class="product-category-tag">Diesel Men</span>
                <h3>${p.name}</h3>
                <div class="price">${p.price}</div>
            </div>
        </div>
    `).join('');
}

window.openSizeModal = (id) => {
    const p = remoteProducts.find(prod => prod.id == id);
    if (!p) return;
    selectedProductForSize = p;
    selectedColor = (p.colorVariants && p.colorVariants.length > 0) ? p.colorVariants[0].name : "أساسي";

    modalProductName.innerText = p.name;
    modalProductPrice.innerText = `${p.price} جنيه`;
    document.getElementById('modal-img').src = p.image;

    const colorContainer = document.getElementById('modal-color-options');
    const colors = (p.colorVariants && p.colorVariants.length > 0) ? p.colorVariants.map(v => v.name) : ["أساسي"];
    colorContainer.innerHTML = colors.map((c, i) => `<button class="color-btn ${i === 0 ? 'selected' : ''}" onclick="modalSelectColor('${c}', this)">${c}</button>`).join('');

    renderModalSizes(p, selectedColor);
    sizeModal.classList.add('active');
};

window.modalSelectColor = (color, btn) => {
    selectedColor = color;
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const p = selectedProductForSize;
    if (p.colorVariants) {
        const v = p.colorVariants.find(x => x.name === color);
        document.getElementById('modal-img').src = v?.image || p.image;
        renderModalSizes(p, color);
    }
};

function renderModalSizes(p, color) {
    const container = document.querySelector('.size-options');
    let sizes = p.sizes || [];

    if (p.colorVariants) {
        const v = p.colorVariants.find(x => x.name === color);
        if (v?.sizes) sizes = v.sizes;
    }

    if (sizes.length > 0) {
        container.innerHTML = sizes.map(s => `<button class="size-btn" onclick="addToCartFromModal('${s}')">${s}</button>`).join('');
    } else {
        container.innerHTML = '<p style="color:var(--primary); font-weight:bold;">غير متوفر حالياً</p>';
    }
}

window.addToCartFromModal = (size) => {
    const p = selectedProductForSize;
    const color = selectedColor;
    const cartId = `${p.id}-${size}-${color}`;

    let img = p.image;
    if (p.colorVariants) {
        const v = p.colorVariants.find(x => x.name === color);
        if (v?.image) img = v.image;
    }

    const existing = cart.find(i => i.cartId === cartId);
    if (existing) existing.quantity++;
    else cart.push({ ...p, cartId, size, color, quantity: 1, image: img });

    updateCartUI();
    localStorage.setItem('diesel_cart', JSON.stringify(cart));
    sizeModal.classList.remove('active');
    openCartSidebar();
};

function updateCartUI() {
    document.querySelectorAll('.cart-count').forEach(c => c.innerText = cart.reduce((s, i) => s + i.quantity, 0));
    const list = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total-price');
    if (!list) return;

    if (cart.length === 0) {
        list.innerHTML = '<p class="empty-msg">السلة فارغة</p>';
        totalEl.innerText = '0 جنيه';
    } else {
        list.innerHTML = cart.map(i => `
            <div class="cart-item">
                <img src="${i.image}" alt="${i.name}">
                <div class="cart-item-info">
                    <h4>${i.name}</h4>
                    <div class="cart-item-details">${i.size} | ${i.color}</div>
                    <div class="qty-control">
                        <button class="qty-btn" onclick="updateCartQuantity('${i.cartId}', 1)">+</button>
                        <span>${i.quantity}</span>
                        <button class="qty-btn" onclick="updateCartQuantity('${i.cartId}', -1)">−</button>
                    </div>
                </div>
                <div class="delete-btn" onclick="removeFromCart('${i.cartId}')"><i class="fas fa-trash-alt"></i></div>
            </div>
        `).join('');
        totalEl.innerText = `${cart.reduce((s, i) => s + (i.price * i.quantity), 0)} جنيه`;
    }
}

window.updateCartQuantity = (id, d) => {
    const i = cart.find(x => x.cartId === id);
    if (i) { i.quantity += d; if (i.quantity <= 0) removeFromCart(id); else { updateCartUI(); localStorage.setItem('diesel_cart', JSON.stringify(cart)); } }
};

window.removeFromCart = (id) => { cart = cart.filter(x => x.cartId !== id); updateCartUI(); localStorage.setItem('diesel_cart', JSON.stringify(cart)); };
function openCartSidebar() { cartSidebar.classList.add('open'); cartOverlay.classList.add('show'); }
function closeCartSidebar() { cartSidebar.classList.remove('open'); cartOverlay.classList.remove('show'); }

async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try { await firebase.auth().signInWithPopup(provider); } catch (e) { console.error(e); }
}

async function signOutUser() {
    await firebase.auth().signOut();
    location.reload();
}

function updateAuthUI() {
    const name = currentUser ? currentUser.displayName.split(' ')[0] : null;
    renderAuthUI(name);
}

function openMyOrdersModal() {
    console.log("🔓 فتح modal الطلبات...");
    const modal = document.getElementById('my-orders-modal');
    const loginSection = document.getElementById('orders-login-section');
    const ordersSection = document.getElementById('orders-list-section');
    const userEmailDisplay = document.getElementById('user-email-display');

    if (!modal) {
        console.error("❌ modal الطلبات غير موجود");
        return;
    }

    modal.classList.add('active');

    // Show appropriate section based on login state
    if (currentUser) {
        console.log("✅ المستخدم مسجل دخول، عرض الطلبات");
        if (loginSection) loginSection.style.display = 'none';
        if (ordersSection) ordersSection.style.display = 'block';
        if (userEmailDisplay) userEmailDisplay.innerText = currentUser.email;
        loadMyOrders();
    } else {
        console.log("⚠️ المستخدم غير مسجل، عرض صفحة تسجيل الدخول");
        if (loginSection) loginSection.style.display = 'flex';
        if (ordersSection) ordersSection.style.display = 'none';
    }
}

async function loadMyOrders() {
    const list = document.getElementById('my-orders-list');

    if (!list) {
        console.error("❌ عنصر my-orders-list غير موجود في الصفحة");
        return;
    }

    list.innerHTML = '<div style="text-align:center; padding:30px;">جاري التحميل...</div>';

    console.log("📋 بدء تحميل الطلبات...");

    // Check if user is logged in
    if (!currentUser) {
        console.warn("⚠️ المستخدم غير مسجل دخول");
        list.innerHTML = '<p style="text-align:center; padding:20px; opacity:0.7;">يرجى تسجيل الدخول لعرض طلباتك</p>';
        return;
    }

    // Check if Firebase is available
    if (!db) {
        console.error("❌ Firebase غير متصل");
        list.innerHTML = '<p style="text-align:center; padding:20px; color:#f44336;">خطأ في الاتصال بقاعدة البيانات</p>';
        return;
    }

    try {
        console.log("🔍 البحث عن طلبات المستخدم:", currentUser.email);

        // Removed orderBy to avoid index requirement - will sort on client side
        const snapshot = await db.collection('orders')
            .where('userEmail', '==', currentUser.email)
            .get();

        console.log(`📦 تم العثور على ${snapshot.docs.length} طلب`);

        if (snapshot.docs.length === 0) {
            list.innerHTML = '<p style="text-align:center; padding:40px; opacity:0.7;">📭 لا توجد طلبات سابقة</p>';
            return;
        }

        // Sort orders by createdAt on client side
        const orders = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
                const aTime = a.createdAt?.toMillis() || 0;
                const bTime = b.createdAt?.toMillis() || 0;
                return bTime - aTime; // Newest first
            });

        list.innerHTML = orders.map(o => {
            console.log("📄 طلب:", o.id, o);

            return `
                <div class="order-card-mini" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 15px; margin-bottom: 15px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <span style="font-size:0.85rem; opacity:0.7;">${o.createdAt ? o.createdAt.toDate().toLocaleDateString('ar-EG') : 'غير محدد'}</span>
                        <span class="order-status" style="background: #2196F3; color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem;">${o.status || 'جديد'}</span>
                    </div>
                    <div style="margin: 10px 0;">
                        ${o.items ? o.items.map(i => `<div style="font-size:0.9rem; margin: 5px 0;">• ${i.name} × ${i.quantity}</div>`).join('') : 'لا توجد منتجات'}
                    </div>
                    <div style="margin-top:12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); font-weight:bold; color: var(--primary);">
                        الإجمالي: ${o.total || 0} جنيه
                    </div>
                </div>
            `;
        }).join('');

        console.log("✅ تم عرض الطلبات بنجاح");

    } catch (e) {
        console.error("❌ خطأ في تحميل الطلبات:", e);
        list.innerHTML = '<p style="text-align:center; padding:20px; color:#f44336;">حدث خطأ في جلب الطلبات: ' + e.message + '</p>';
    }
}

function initTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
}

function closeSuccessModal() { document.getElementById('success-modal')?.classList.remove('active'); }
