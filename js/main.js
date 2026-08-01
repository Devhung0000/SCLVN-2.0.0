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

app.mount('#app');

window.addEventListener("load", () => {

    const nav = document.querySelector(".nav");

    const underline = document.querySelector(".apple-underline");

    const tabs = nav.querySelectorAll(".nav__tab");

    function move(el){

        underline.style.left = el.offsetLeft + "px";

        underline.style.width = el.offsetWidth + "px";

    }

    const active = nav.querySelector(".router-link-active");

    if(active) move(active);

    tabs.forEach(tab=>{

        tab.addEventListener("mouseenter",()=>move(tab));

    });

    nav.addEventListener("mouseleave",()=>{

        const active = nav.querySelector(".router-link-active");

        if(active) move(active);

    });

});
