import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Khai báo lại hoặc lấy app Firebase đã init
let auth, db;
try {
    const app = getApps().length > 0 ? getApps()[0] : null;
    if (app) {
        auth = getAuth(app);
        db = getFirestore(app);
    } else {
        console.error("Firebase App chưa được khởi tạo! Hãy kiểm tra main.js hoặc firebase-init.js");
    }
} catch (e) {
    console.error("Lỗi khi tải Firebase Auth:", e);
}

let isLoginMode = true;
export let currentUser = null;

// Lấy các phần tử DOM
document.addEventListener('DOMContentLoaded', () => {
    const authModal = document.getElementById('auth-modal');
    const authOpenBtn = document.getElementById('auth-open-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const toggleAuthBtn = document.getElementById('toggle-auth-btn');
    const authForm = document.getElementById('auth-form');
    const usernameBox = document.getElementById('username-box');
    const modalTitle = document.getElementById('modal-title');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const toggleText = document.getElementById('toggle-text');

    const userProfile = document.getElementById('user-profile');
    const userNameDisplay = document.getElementById('user-name-display');
    const adminBadge = document.getElementById('admin-badge');
    const logoutBtn = document.getElementById('logout-btn');

    if (!authOpenBtn || !authModal) return;

    // 1. Mở / Đóng Modal
    authOpenBtn.onclick = () => {
        authModal.style.display = 'flex';
    };

    closeModalBtn.onclick = () => {
        authModal.style.display = 'none';
    };

    // Đóng khi click ngoài khung modal
    window.onclick = (e) => {
        if (e.target === authModal) {
            authModal.style.display = 'none';
        }
    };

    // 2. Chuyển đổi Đăng nhập <-> Đăng ký
    toggleAuthBtn.onclick = () => {
        isLoginMode = !isLoginMode;
        modalTitle.innerText = isLoginMode ? 'Login' : 'Register Player Account';
        authSubmitBtn.innerText = isLoginMode ? 'Login' : 'Create Account';
        usernameBox.style.display = isLoginMode ? 'none' : 'block';
        toggleText.innerText = isLoginMode ? "Don't have an account?" : "Already have an account?";
        toggleAuthBtn.innerText = isLoginMode ? "Register now" : "Login";
    };

    // 3. Xử lý Đăng ký / Đăng nhập khi bấm Submit Form
    authForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const username = document.getElementById('auth-username').value.trim();

        if (!auth) {
            alert("Chưa kết nối được với Firebase. Vui lòng kiểm tra lại cấu hình Firebase!");
            return;
        }

        try {
            if (isLoginMode) {
                // Đăng nhập
                await signInWithEmailAndPassword(auth, email, password);
                alert('Đăng nhập thành công!');
            } else {
                // Đăng ký
                if (!username) {
                    alert('Vui lòng nhập tên Player!');
                    return;
                }
                
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const uid = userCredential.user.uid;

                // Tự động lưu thông tin user vào Firestore
                await setDoc(doc(db, 'users', uid), {
                    username: username,
                    email: email,
                    role: 'player', // Mặc định là player
                    createdAt: new Date().toISOString()
                });

                alert('Đăng ký tài khoản thành công!');
            }
            authModal.style.display = 'none';
        } catch (err) {
            alert('Lỗi: ' + err.message);
        }
    };

    // 4. Xử lý Đăng xuất
    logoutBtn.onclick = async () => {
        if (auth) {
            await signOut(auth);
            alert("Đã đăng xuất!");
        }
    };

    // 5. Theo dõi trạng thái tài khoản
    if (auth) {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userSnap = await getDoc(doc(db, 'users', user.uid));
                    if (userSnap.exists()) {
                        currentUser = { uid: user.uid, ...userSnap.data() };
                        userNameDisplay.innerText = currentUser.username;
                        adminBadge.style.display = currentUser.role === 'admin' ? 'inline-block' : 'none';
                    } else {
                        userNameDisplay.innerText = user.email.split('@')[0];
                    }
                } catch (err) {
                    console.error("Lỗi lấy thông tin user:", err);
                }
                authOpenBtn.style.display = 'none';
                userProfile.style.display = 'flex';
            } else {
                currentUser = null;
                authOpenBtn.style.display = 'inline-block';
                userProfile.style.display = 'none';
            }
        });
    }
});
