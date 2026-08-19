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
        <div v-if="toastState.visible" :style="{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: '0.95rem',
            zIndex: '99999',
            boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
            backgroundColor: toastState.type === 'success' ? '#2e7d32' : (toastState.type === 'error' ? '#d32f2f' : '#0288d1'),
            transition: 'all 0.3s ease'
        }">
            {{ toastState.message }}
        </div>
    `
};
