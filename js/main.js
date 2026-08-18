import routes from './routes.js';
import "./ripple.js";
import './auth.js'; // Import để gắn listener cho Modal Auth
import {
    auth, db, doc, getDoc, onAuthStateChanged,
} from './firebase-init.js';

export const store = Vue.reactive({
    dark: JSON.parse(localStorage.getItem('dark')) ?? true,
    darker: JSON.parse(localStorage.getItem('darker')) ?? false,
    user: null,
    authLoading: true,
    toggleDark() {
        if (this.dark == true && this.darker == false) {
            this.darker = true;
        } else {
            this.darker = false;
            this.dark = !this.dark;
        }
        localStorage.setItem('dark', JSON.stringify(this.dark));
        localStorage.setItem('darker', JSON.stringify(this.darker));
    },
});

// Lắng nghe trạng thái đăng nhập Firebase
onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
        try {
            const snap = await getDoc(doc(db, 'users', fbUser.uid));
            const userData = snap.exists() ? snap.data() : {};
            
            store.user = {
                uid: fbUser.uid,
                email: fbUser.email,
                displayName: userData.username || fbUser.displayName || fbUser.email.split('@')[0],
                avatar: userData.avatar || '',
                role: userData.role || 'player',
            };
        } catch (e) {
            console.error('Lỗi tải hồ sơ user:', e);
            store.user = {
                uid: fbUser.uid,
                email: fbUser.email,
                displayName: fbUser.email.split('@')[0],
                avatar: '',
                role: 'player',
            };
        }
    } else {
        store.user = null;
    }
    store.authLoading = false;
});

const app = Vue.createApp({
    data: () => ({ store }),
});

const router = VueRouter.createRouter({
    history: VueRouter.createWebHistory(),
    routes,
});

app.use(router);
app.mount("#app");

// Hiệu ứng thanh gạch chân Navigation
function initNavUnderline() {
    const nav = document.querySelector(".nav");
    if (!nav) return;
    
    let underline = nav.querySelector(".nav-highlight");
    if (!underline) {
        underline = document.createElement("div");
        underline.className = "nav-highlight";
        nav.appendChild(underline);
    }
    const tabs = [...nav.querySelectorAll(".nav__tab")];
    
    function move(target) {
        if (!target) return;
        const navRect = nav.getBoundingClientRect();
        const rect = target.getBoundingClientRect();
        underline.style.left = `${rect.left - navRect.left}px`;
        underline.style.width = `${rect.width}px`;
    }
    
    function moveToActive() {
        move(nav.querySelector(".router-link-active"));
    }
    
    moveToActive();
    tabs.forEach(tab => {
        tab.onmouseenter = () => move(tab);
    });
    nav.onmouseleave = moveToActive;
}

// Lắng nghe sự kiện chuyển trang để vẽ lại underline
Vue.nextTick(initNavUnderline);
router.afterEach(() => {
    Vue.nextTick(initNavUnderline);
});
window.addEventListener("resize", () => {
    Vue.nextTick(initNavUnderline);
});
