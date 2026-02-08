
// 🚀 DIESEL ADMIN ENGINE - HYBRID VERSION (Supabase Edition)
const SUPABASE_URL = 'https://ymdnfohikgjkvdmdrthe.supabase.co';
const SUPABASE_KEY = 'sb_publishable_J0JuDItWsSggSZPj0ATwYA_xXlGI92x';
const db_client = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

let productsCol = null;
let isSupabaseReady = !!db_client;
let adminRole = localStorage.getItem('adminRole') || 'none';
let currentUser = null;

const governorates = [
    "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة", "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", "الوادي الجديد", "السويس", "الشرقية", "دمياط", "بورسعيد", "جنوب سيناء", "كفر الشيخ", "مطروح", "الأقصر", "قنا", "شمال سيناء", "سوهاج", "بني سويف", "أسيوط", "أسوان"
];

// Initialize Supabase Auth Logic
async function initAdminAuth() {
    if (!db_client) return;

    // SECURITY: If we came from the home page button, force a logout to ask for credentials again
    if (sessionStorage.getItem('force_admin_login') === 'true') {
        sessionStorage.removeItem('force_admin_login');
        await db_client.auth.signOut();
        localStorage.removeItem('adminRole');
        adminRole = 'none';
        console.log("🔒 Security: Fresh login forced from home page.");
    }

    const { data: { session } } = await db_client.auth.getSession();
    handleAdminAuthChange(session);

    db_client.auth.onAuthStateChange((_event, session) => {
        handleAdminAuthChange(session);
    });
}

function handleAdminAuthChange(session) {
    const loginOverlay = document.getElementById('login-overlay');
    const adminContent = document.getElementById('admin-main-content');
    currentUser = session?.user || null;

    if (currentUser) {
        if (loginOverlay) loginOverlay.style.display = 'none';
        if (adminContent) adminContent.style.display = 'block';
        applyRoleRestrictions();

        // Auto load based on role
        if (adminRole === 'products' || adminRole === 'all') { showTab('products'); loadProducts(); }
        else if (adminRole === 'orders') { showTab('orders'); loadOrders(); }
        else if (adminRole === 'shipping') { showTab('shipping'); loadShippingCosts(); }
    } else {
        if (loginOverlay) loginOverlay.style.display = 'flex';
        if (adminContent) adminContent.style.display = 'none';
    }
    showLoader(false);
}

// Emergency Fallback for Global Loader
setTimeout(() => showLoader(false), 5000);

document.addEventListener('DOMContentLoaded', () => {
    initAdminAuth();
    setupAdminEventListeners();
});

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
    document.getElementById(`${tab}-section`).style.display = 'block';
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
    else { hide(tabProducts); hide(tabOrders); hide(tabShipping); }
}

// Placeholder functions for the rest of admin.js logic which would be tied to Supabase
async function loadProducts() {
    showLoader(true);
    const { data, error } = await db_client.from('products').select('*');
    // ... rendering logic ...
    showLoader(false);
}

async function loadOrders() {
    showLoader(true);
    const { data, error } = await db_client.from('orders').select('*').order('created_at', { ascending: false });
    // ... rendering logic ...
    showLoader(false);
}

async function loadShippingCosts() {
    const { data } = await db_client.from('settings').select('costs').eq('id', 'shipping').single();
    // ...
}

function setupAdminEventListeners() {
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;

        // Manual Role check (as before)
        if (pass === "diesel_prod") adminRole = 'products';
        else if (pass === "diesel_order") adminRole = 'orders';
        else if (pass === "diesel_ship") adminRole = 'shipping';
        else if (pass === "ديزل_كل_حاجة") adminRole = 'all';
        else {
            document.getElementById('login-error').innerText = "كلمة مرور غير صحيحة!";
            document.getElementById('login-error').style.display = 'block';
            return;
        }

        localStorage.setItem('adminRole', adminRole);
        const { error } = await db_client.auth.signInWithPassword({ email, password: pass });
        if (error) {
            document.getElementById('login-error').innerText = error.message;
            document.getElementById('login-error').style.display = 'block';
        }
    });

    document.getElementById('btn-logout')?.addEventListener('click', async () => {
        await db_client.auth.signOut();
        localStorage.removeItem('adminRole');
        location.reload();
    });
}
