import { store } from '../main.js';
import {
    auth,
    db,
    doc,
    setDoc,
    getDoc,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    GoogleAuthProvider,
    updateProfile,
} from '../firebase-init.js';

export default {
    data: () => ({
        mode: 'login', // 'login' | 'register'
        email: '',
        password: '',
        displayName: '',
        error: '',
        loading: false,
        store,
    }),
    template: `
        <main class="page-auth" style="display:flex; justify-content:center; padding: 3rem 1rem;">
            <div style="width: 100%; max-width: 400px; display:flex; flex-direction:column; gap:1rem;">

                <template v-if="store.user">
                    <h1>Xin chào, {{ store.user.displayName }}!</h1>
                    <p class="type-body-lg">Bạn đã đăng nhập bằng {{ store.user.email }}.</p>
                    <router-link class="btn" to="/submit">Đi tới trang Nộp Record</router-link>
                    <router-link v-if="store.user.role === 'admin'" class="btn" to="/admin">Đi tới trang Duyệt Record</router-link>
                    <button class="btn" @click="logout">Đăng xuất</button>
                </template>

                <template v-else>
                    <h1>{{ mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản' }}</h1>

                    <input v-if="mode === 'register'" v-model="displayName" class="btn" type="text" placeholder="Tên hiển thị (tên player của bạn)" />
                    <input v-model="email" class="btn" type="email" placeholder="Email" />
                    <input v-model="password" class="btn" type="password" placeholder="Mật khẩu (ít nhất 6 ký tự)" @keyup.enter="submit" />

                    <p v-if="error" class="error">{{ error }}</p>

                    <button class="btn" :disabled="loading" @click="submit">
                        {{ loading ? 'Đang xử lý...' : (mode === 'login' ? 'Đăng nhập' : 'Đăng ký') }}
                    </button>

                    <button class="btn" :disabled="loading" @click="googleSignIn">
                        Đăng nhập bằng Google
                    </button>

                    <p class="type-label-md" style="cursor:pointer; text-decoration:underline;" @click="toggleMode">
                        {{ mode === 'login' ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập' }}
                    </p>
                </template>
            </div>
        </main>
    `,
    methods: {
        toggleMode() {
            this.mode = this.mode === 'login' ? 'register' : 'login';
            this.error = '';
        },
        async ensureUserDoc(uid, email, displayName) {
            const ref = doc(db, 'users', uid);
            const snap = await getDoc(ref);
            if (!snap.exists()) {
                await setDoc(ref, {
                    email,
                    displayName: displayName || email,
                    role: 'player',
                    createdAt: new Date().toISOString(),
                });
            }
        },
        async submit() {
            this.error = '';
            if (!this.email || !this.password) {
                this.error = 'Vui lòng nhập đầy đủ email và mật khẩu.';
                return;
            }
            this.loading = true;
            try {
                if (this.mode === 'register') {
                    if (!this.displayName.trim()) {
                        throw new Error('Vui lòng nhập tên hiển thị.');
                    }
                    const cred = await createUserWithEmailAndPassword(auth, this.email, this.password);
                    await updateProfile(cred.user, { displayName: this.displayName.trim() });
                    await this.ensureUserDoc(cred.user.uid, this.email, this.displayName.trim());
                } else {
                    await signInWithEmailAndPassword(auth, this.email, this.password);
                }
            } catch (e) {
                this.error = this.translateError(e);
            } finally {
                this.loading = false;
            }
        },
        async googleSignIn() {
            this.error = '';
            this.loading = true;
            try {
                const provider = new GoogleAuthProvider();
                const result = await signInWithPopup(auth, provider);
                await this.ensureUserDoc(result.user.uid, result.user.email, result.user.displayName);
            } catch (e) {
                this.error = this.translateError(e);
            } finally {
                this.loading = false;
            }
        },
        async logout() {
            await signOut(auth);
        },
        translateError(e) {
            const code = e?.code || '';
            if (code.includes('email-already-in-use')) return 'Email này đã được đăng ký rồi.';
            if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'Sai email hoặc mật khẩu.';
            if (code.includes('weak-password')) return 'Mật khẩu quá yếu (tối thiểu 6 ký tự).';
            if (code.includes('invalid-email')) return 'Email không hợp lệ.';
            return e.message || 'Có lỗi xảy ra, thử lại sau.';
        },
    },
};
