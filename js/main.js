import routes from './routes.js';
import "./ripple.js";
export const store = Vue.reactive({
    dark: JSON.parse(localStorage.getItem('dark')) ?? true,
    darker: JSON.parse(localStorage.getItem('darker')) ?? false,
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
const app = Vue.createApp({
    data: () => ({ store }),
});
const router = VueRouter.createRouter({
    history: VueRouter.createWebHistory(),
    routes,
});
app.use(router);

app.mount("#app");

function initNavUnderline() {

    const nav = document.querySelector(".nav");
    if (!nav) return;

    // Nếu đã có thì dùng lại
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

// Chạy sau khi Vue render
Vue.nextTick(initNavUnderline);

// Chạy lại sau mỗi lần đổi route
router.afterEach(() => {
    Vue.nextTick(initNavUnderline);
});

// Cập nhật khi resize cửa sổ
window.addEventListener("resize", () => {
    Vue.nextTick(initNavUnderline);
});
