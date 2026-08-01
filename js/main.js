import routes from './routes.js';
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

Vue.nextTick(initAppleUnderline);

router.afterEach(() => {

    Vue.nextTick(initAppleUnderline);

});

function initAppleUnderline() {

    const nav = document.querySelector(".nav");
    const underline = document.querySelector(".apple-underline");

    if (!nav || !underline) return;

    const tabs = nav.querySelectorAll(".nav__tab");

    function move(el) {

        underline.style.left = el.offsetLeft + "px";
        underline.style.width = el.offsetWidth + "px";

    }

    function updateActive() {

        const active = nav.querySelector(".router-link-active");

        if (active) move(active);

    }

    updateActive();

    tabs.forEach(tab => {

        tab.onmouseenter = () => move(tab);

    });

    nav.onmouseleave = updateActive;

}
