import { reactive } from 'vue';

export const toastState = reactive({
    message: '',
    type: 'success', // 'success' | 'error' | 'info'
    visible: false
});

export function showToast(msg, type = 'success', duration = 3000) {
    toastState.message = msg;
    toastState.type = type;
    toastState.visible = true;
    setTimeout(() => {
        toastState.visible = false;
    }, duration);
}

export default {
    setup() {
        return { toastState };
    },
    template: `
        <div v-if="toastState.visible" :class="['toast-notification', toastState.type]">
            {{ toastState.message }}
        </div>
    `
};
