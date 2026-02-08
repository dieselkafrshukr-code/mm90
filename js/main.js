// 🚀 DIESEL SHOP - INVINCIBLE ENGINE (Supabase Edition)
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
let remoteProducts = []; // To store products from Supabase
let shippingCosts = {};
const governorates = [
    "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة", "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", "الوادي الجديد", "السويس", "الشرقية", "دمياط", "بورسعيد", "جنوب سيناء", "كفر الشيخ", "مطروح", "الأقصر", "قنا", "شمال سيناء", "سوهاج", "بني سويف", "أسيوط", "أسوان"
];

// Supabase Config
const SUPABASE_URL = 'https://ymdnfohikgjkvdmdrthe.supabase.co';
const SUPABASE_KEY = 'sb_publishable_J0JuDItWsSggSZPj0ATwYA_xXlGI92x';
const db_client = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Initialize Auth
let currentUser = null;

if (db_client) {
    // Initial UI check from LocalStorage (for instant feedback)
    const cachedUser = localStorage.getItem('diesel_user_cache');
    if (cachedUser) {
        try {
            const data = JSON.parse(cachedUser);
            renderAuthUI(data.name);
        } catch (e) { }
    }

    // Auth State Listener
    db_client.auth.onAuthStateChange((event, session) => {
        currentUser = session?.user || null;
        if (currentUser) {
            const name = currentUser.user_metadata?.full_name?.split(' ')[0] || 'حسابي';
            localStorage.setItem('diesel_user_cache', JSON.stringify({ name }));
            updateAuthUI();
            loadCartFromDB();
        } else {
            localStorage.removeItem('diesel_user_cache');
            updateAuthUI();
        }
    });

    // Check initial session
    db_client.auth.getSession().then(({ data: { session } }) => {
        currentUser = session?.user || null;
        updateAuthUI();
    });
}

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

// Emergency Fallback
setTimeout(hideLoader, 5000);

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

    if (db_client) {
        try {
            const { data } = await db_client.from('settings').select('costs').eq('id', 'shipping').single();
            if (data) shippingCosts = data.costs || {};
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

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.onclick = () => closeMobileMenu();
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

            if (!gov) {
                alert("برجاء اختيار المحافظة!");
                submitBtn.disabled = false;
                submitBtn.innerText = "تأكيد الطلب الآن ✨";
                return;
            }

            const orderData = {
                customer_name: document.getElementById('customer-name').value,
                phone: document.getElementById('customer-phone').value,
                gov: gov,
                address: document.getElementById('customer-address').value,
                items: cart,
                items_total: itemsTotal,
                shipping_cost: shippingCost,
                total: itemsTotal + shippingCost,
                status: "جديد",
                payment_method: 'عند الاستلام',
                user_id: currentUser ? currentUser.id : null,
                user_email: currentUser ? currentUser.email : null
            };

            try {
                const { error } = await db_client.from('orders').insert(orderData);
                if (error) throw error;

                cart = [];
                updateCartUI();
                saveCartToDB();
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

    const gLogin = document.getElementById('google-login-btn');
    if (gLogin) gLogin.onclick = signInWithGoogle;

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.onclick = signOutUser;

    const myOrdersBtn = document.getElementById('my-orders-btn');
    if (myOrdersBtn) myOrdersBtn.onclick = (e) => { e.preventDefault(); openMyOrdersModal(); };

    const closeOrders = document.getElementById('close-orders-modal');
    if (closeOrders) closeOrders.onclick = () => document.getElementById('my-orders-modal').classList.remove('active');
}

function renderAll() {
    if (!menContainer) return;
    menContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#fff;">جاري تحميل المنتجات...</div>';

    if (db_client) {
        db_client.from('products').select('*').eq('status', 'active').then(({ data, error }) => {
            if (error) renderFallback();
            else {
                remoteProducts = data;
                filterAndRender('men', activeCategory, 'all');
            }
        });
    } else renderFallback();
}

function renderFallback() {
    remoteProducts = typeof products !== 'undefined' ? products : [];
    filterAndRender('men', activeCategory, 'all');
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
    let filtered = remoteProducts.filter(p => p.status !== 'hidden');

    if (parent !== 'all') {
        if (parent === 'clothes') {
            const clothesSubs = parentSubMap.clothes.map(s => s.id);
            filtered = filtered.filter(p => clothesSubs.includes(p.sub_category) || p.parent_category === 'clothes');
        } else if (parent === 'pants') {
            const pantsSubs = parentSubMap.pants.map(s => s.id);
            filtered = filtered.filter(p => pantsSubs.includes(p.sub_category) || p.parent_category === 'pants');
        } else {
            filtered = filtered.filter(p => p.parent_category === parent || p.sub_category === parent);
        }
    }

    if (sub !== 'all') filtered = filtered.filter(p => p.sub_category === sub);

    if (filtered.length === 0) {
        menContainer.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; opacity:0.5;">لا توجد نتائج مطابقة</div>`;
        return;
    }

    menContainer.innerHTML = filtered.map(p => `
        <div class="product-card" data-aos="fade-up">
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
    selectedColor = (p.color_variants && p.color_variants.length > 0) ? p.color_variants[0].name : "أساسي";

    modalProductName.innerText = p.name;
    modalProductPrice.innerText = `${p.price} جنيه`;
    document.getElementById('modal-img').src = p.image;

    const colorContainer = document.getElementById('modal-color-options');
    const colors = (p.color_variants && p.color_variants.length > 0) ? p.color_variants.map(v => v.name) : ["أساسي"];
    colorContainer.innerHTML = colors.map((c, i) => `<button class="color-btn ${i === 0 ? 'selected' : ''}" onclick="modalSelectColor('${c}', this)">${c}</button>`).join('');

    if (p.color_variants && p.color_variants[0]?.image) document.getElementById('modal-img').src = p.color_variants[0].image;

    renderModalSizes(p, selectedColor);
    sizeModal.classList.add('active');
};

window.modalSelectColor = (color, btn) => {
    selectedColor = color;
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const p = selectedProductForSize;
    if (p.color_variants) {
        const v = p.color_variants.find(x => x.name === color);
        document.getElementById('modal-img').src = v?.image || p.image;
        renderModalSizes(p, color);
    }
};

function renderModalSizes(p, color) {
    const container = document.querySelector('.size-options');
    const sizeLabel = document.querySelector('.size-label:last-of-type');
    let sizes = p.sizes || [];

    if (p.color_variants) {
        const v = p.color_variants.find(x => x.name === color);
        if (v?.sizes) sizes = v.sizes;
    }

    if (sizes.length > 0) {
        if (sizeLabel) sizeLabel.style.display = 'block';
        container.innerHTML = sizes.map(s => `<button class="size-btn" onclick="addToCartFromModal('${s}')">${s}</button>`).join('');
    } else {
        if (sizeLabel) sizeLabel.style.display = 'none';
        container.innerHTML = '<p style="color:var(--primary); font-weight:bold; width:100%; margin:10px 0;">غير متوفر حالياً</p>';
    }
}

window.addToCartFromModal = (size) => {
    const p = selectedProductForSize;
    const color = selectedColor;
    const cartId = `${p.id}-${size}-${color}`;

    let img = p.image;
    if (p.color_variants) {
        const v = p.color_variants.find(x => x.name === color);
        if (v?.image) img = v.image;
    }

    const existing = cart.find(i => i.cartId === cartId);
    if (existing) existing.quantity++;
    else cart.push({ ...p, cartId, size, color, quantity: 1, image: img });

    updateCartUI();
    saveCartToDB();
    sizeModal.classList.remove('active');
    openCartSidebar();
};

function updateCartUI() {
    document.querySelectorAll('.cart-count').forEach(c => c.innerText = cart.reduce((s, i) => s + i.quantity, 0));
    const list = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total-price');
    if (!list) return;

    if (cart.length === 0) {
        list.innerHTML = '<div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; opacity:0.5; gap:20px;"><i class="fas fa-shopping-bag" style="font-size:3rem;"></i><p>السلة فارغة</p></div>';
        totalEl.innerText = '0 جنيه';
    } else {
        list.innerHTML = cart.map(i => `
            <div class="cart-item">
                <img src="${i.image}" alt="${i.name}">
                <div class="cart-item-info">
                    <h4>${i.name}</h4>
                    <div class="cart-item-details">${i.size} | ${i.color}</div>
                    <div class="qty-control">
                        <button class="qty-btn-inc" onclick="updateCartQuantity('${i.cartId}', 1)">+</button>
                        <span>${i.quantity}</span>
                        <button class="qty-btn-dec" onclick="updateCartQuantity('${i.cartId}', -1)">−</button>
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
    if (i) { i.quantity += d; if (i.quantity <= 0) removeFromCart(id); else { updateCartUI(); saveCartToDB(); } }
};

window.removeFromCart = (id) => { cart = cart.filter(x => x.cartId !== id); updateCartUI(); saveCartToDB(); };
function openCartSidebar() { cartSidebar.classList.add('open'); cartOverlay.classList.add('show'); }
function closeCartSidebar() { cartSidebar.classList.remove('open'); cartOverlay.classList.remove('show'); }
function closeMobileMenu() { mobileMenuBtn?.classList.remove('active'); navLinks?.classList.remove('active'); }

async function signInWithGoogle() {
    if (!db_client) return;
    try { await db_client.auth.signInWithOAuth({ provider: 'google' }); } catch (e) { alert("خطأ في الدخول"); }
}

async function signOutUser() {
    if (!db_client) return;
    await db_client.auth.signOut();
    cart = [];
    localStorage.removeItem('diesel_cart');
    updateCartUI();
    document.getElementById('my-orders-modal').classList.remove('active');
}

function updateAuthUI() {
    const name = currentUser ? (currentUser.user_metadata?.full_name?.split(' ')[0] || 'حسابي') : null;
    renderAuthUI(name);
}

window.openMyOrdersModal = () => {
    const modal = document.getElementById('my-orders-modal');
    const loginSection = document.getElementById('orders-login-section');
    const listSection = document.getElementById('orders-list-section');

    if (currentUser) {
        loginSection.style.display = 'none';
        listSection.style.display = 'block';
        document.getElementById('user-email-display').innerText = currentUser.email;
        loadMyOrders();
    } else {
        loginSection.style.display = 'block';
        listSection.style.display = 'none';
    }
    modal.classList.add('active');
};

async function loadMyOrders() {
    const list = document.getElementById('my-orders-list');
    list.innerHTML = 'جاري التحميل...';
    try {
        const { data } = await db_client.from('orders').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
        list.innerHTML = data.map(o => `
            <div class="order-card-mini">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span>${new Date(o.created_at).toLocaleDateString('ar-EG')}</span>
                    <span class="order-status">${o.status}</span>
                </div>
                <div>${o.items.map(i => `<div style="font-size:0.9rem;">${i.name} x${i.quantity}</div>`).join('')}</div>
                <div style="margin-top:10px; font-weight:bold;">الإجمالي: ${o.total} جنيه</div>
            </div>
        `).join('') || '<div style="text-align:center; padding:40px; opacity:0.5;">لا توجد طلبات</div>';
    } catch (e) { list.innerHTML = 'خطأ في التحميل'; }
}

async function saveCartToDB() {
    localStorage.setItem('diesel_cart', JSON.stringify(cart));
    if (currentUser && db_client) {
        await db_client.from('carts').upsert({ user_id: currentUser.id, items: cart });
    }
}

async function loadCartFromDB() {
    if (!currentUser || !db_client) return;
    const { data } = await db_client.from('carts').select('items').eq('user_id', currentUser.id).single();
    if (data?.items?.length > 0) { cart = data.items; updateCartUI(); }
}

function initTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    const icon = themeToggle?.querySelector('i');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    const icon = themeToggle?.querySelector('i');
    if (icon) icon.className = next === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function closeSuccessModal() { document.getElementById('success-modal')?.classList.remove('active'); }
