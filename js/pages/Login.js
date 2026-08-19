import { store } from '../main.js';
import {
    auth,
    db,
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    GoogleAuthProvider,
    updateProfile,
} from '../firebase-init.js';

export default {
    data: () => ({
        mode: 'login',
        usernameOrEmail: '',
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
                    <h1>Xin chào, {{ store.user.displayName || 'Player' }}!</h1>
                    <p class="type-body-lg">Bạn đã đăng nhập bằng {{ store.user.email }}.</p>
                    <router-link class="btn" to="/submit">Đi tới trang Nộp Record</router-link>
                    <router-link v-if="store.user.role === 'admin'" class="btn" to="/admin">Đi tới trang Duyệt Record</router-link>
                    <button class="btn" @click="logout">Đăng xuất</button>
                </template>

                <template v-else>
                    <h1>{{ mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản' }}</h1>

                    <!-- Form Đăng ký -->
                    <template v-if="mode === 'register'">
                        <input v-model="displayName" class="btn" type="text" placeholder="Tên Geometry Dash (Tên player của bạn)" />
                        <input v-model="email" class="btn" type="email" placeholder="Email" />
                    </template>

                    <!-- Form Đăng nhập -->
                    <template v-else>
                        <input v-model="usernameOrEmail" class="btn" type="text" placeholder="Tên Geometry Dash hoặc Email" />
                    </template>

                    <input v-model="password" class="btn" type="password" placeholder="Mật khẩu (ít nhất 6 ký tự)" @keyup.enter="submit" />

                    <p v-if="error" class="error" style="color: #ff4d4d; margin: 0;">{{ error }}</p>

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
        async saveUserToFirestore(uid, email, username) {
            const userRef = doc(db, 'users', uid);
            const lowerName = username.toLowerCase().trim();

            await setDoc(userRef, {
                uid: uid,
                email: email,
                username: username.trim(),
                username_lowercase: lowerName,
                displayName: username.trim(),
                role: 'player',
                createdAt: new Date().toISOString(),
            }, { merge: true });
        },
        async submit() {
            this.error = '';
            this.loading = true;

            try {
                if (this.mode === 'register') {
                    const gdName = this.displayName.trim();
                    const inputEmail = this.email.trim();

                    if (!gdName) throw new Error('Vui lòng nhập Tên Geometry Dash.');
                    if (!inputEmail || !this.password) throw new Error('Vui lòng nhập Email và Mật khẩu.');

                    // 1. Kiểm tra xem Tên GD này đã có người đăng ký chưa
                    const usersRef = collection(db, 'users');
                    const q = query(usersRef, where('username_lowercase', '==', gdName.toLowerCase()));
                    const querySnap = await getDocs(q);

                    if (!querySnap.empty) {
                        throw new Error('Tên Geometry Dash này đã được sử dụng!');
                    }

                    // 2. Tạo Auth Account
                    const cred = await createUserWithEmailAndPassword(auth, inputEmail, this.password);

                    // 3. Update Profile & Lưu Firestore
                    await updateProfile(cred.user, { displayName: gdName });
                    await this.saveUserToFirestore(cred.user.uid, inputEmail, gdName);

                } else {
                    // LUỒNG ĐĂNG NHẬP
                    const input = this.usernameOrEmail.trim();
                    if (!input || !this.password) throw new Error('Vui lòng điền đầy đủ thông tin.');

                    let targetEmail = input;

                    // Nếu input KHÔNG chứa ký tự '@' -> Đây là Tên GD -> Cần tìm Email tương ứng
                    if (!input.includes('@')) {
                        const usersRef = collection(db, 'users');
                        const q = query(usersRef, where('username_lowercase', '==', input.toLowerCase()));
                        const querySnap = await getDocs(q);

                        if (querySnap.empty) {
                            throw new Error('Tên Geometry Dash không tồn tại.');
                        }

                        // Lấy email từ document tìm được
                        const userData = querySnap.docs[0].data();
                        targetEmail = userData.email;
                    }

                    // Tiến hành Đăng nhập Firebase Auth bằng Email
                    await signInWithEmailAndPassword(auth, targetEmail, this.password);
                }
            } catch (e) {
                console.error(e);
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
                const user = result.user;
                
                // Lấy tên google hoặc fallback lấy phần tên email
                const defaultName = user.displayName || user.email.split('@')[0];
                await this.saveUserToFirestore(user.uid, user.email, defaultName);
            } catch (e) {
                console.error(e);
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
            if (e.message && !code) return e.message; // Trả về thông báo lỗi tùy chỉnh (custom throw Error)
            if (code.includes('email-already-in-use')) return 'Email này đã được đăng ký rồi.';
            if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'Sai tên đăng nhập/email hoặc mật khẩu.';
            if (code.includes('weak-password')) return 'Mật khẩu phải từ 6 ký tự trở lên.';
            if (code.includes('invalid-email')) return 'Định dạng Email không hợp lệ.';
            return e.message || 'Có lỗi xảy ra, xin thử lại.';
        },
    },
};
