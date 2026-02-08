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
            if (currentUser) openMyOrdersModal();
            else signInWithGoogle();
        };
    }

    const closeOrders = document.getElementById('close-orders-modal');
    if (closeOrders) closeOrders.onclick = () => document.getElementById('my-orders-modal').classList.remove('active');
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
    let filtered = remoteProducts;

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
    const modal = document.getElementById('my-orders-modal');
    modal.classList.add('active');
    loadMyOrders();
}

async function loadMyOrders() {
    const list = document.getElementById('my-orders-list');
    list.innerHTML = 'جاري التحميل...';
    try {
        const snapshot = await db.collection('orders').where('userEmail', '==', currentUser.email).orderBy('createdAt', 'desc').get();
        list.innerHTML = snapshot.docs.map(doc => {
            const o = doc.data();
            return `
                <div class="order-card-mini">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <span>${o.createdAt ? o.createdAt.toDate().toLocaleDateString('ar-EG') : ''}</span>
                        <span class="order-status">${o.status}</span>
                    </div>
                    <div>${o.items.map(i => `<div style="font-size:0.9rem;">${i.name} x${i.quantity}</div>`).join('')}</div>
                    <div style="margin-top:10px; font-weight:bold;">الإجمالي: ${o.total} جنيه</div>
                </div>
            `;
        }).join('') || '<p style="text-align:center; padding:20px;">لا توجد طلبات</p>';
    } catch (e) { list.innerHTML = 'حدث خطأ في جلب الطلبات'; }
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
