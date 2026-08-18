import { db } from './firebase-init.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
    doc, getDoc, setDoc 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const auth = getAuth();
let isLoginMode = true;
export let currentUser = null;

// DOM Elements
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

// Toggle Modal
authOpenBtn.onclick = () => authModal.style.display = 'flex';
closeModalBtn.onclick = () => authModal.style.display = 'none';

// Chuyển đổi giữa Đăng nhập & Đăng ký
toggleAuthBtn.onclick = () => {
    isLoginMode = !isLoginMode;
    modalTitle.innerText = isLoginMode ? 'Đăng nhập' : 'Đăng ký tài khoản Player';
    authSubmitBtn.innerText = isLoginMode ? 'Đăng nhập' : 'Tạo tài khoản';
    usernameBox.style.display = isLoginMode ? 'none' : 'block';
    toggleText.innerText = isLoginMode ? 'Chưa có tài khoản?' : 'Đã có tài khoản?';
    toggleAuthBtn.innerText = isLoginMode ? 'Đăng ký ngay' : 'Đăng nhập';
};

// Xử lý submit Đăng ký / Đăng nhập
authForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const username = document.getElementById('auth-username').value.trim();

    try {
        if (isLoginMode) {
            // Đăng nhập tự động
            await signInWithEmailAndPassword(auth, email, password);
            alert('Đăng nhập thành công!');
        } else {
            // Đăng ký tự động
            if (!username) return alert('Vui lòng nhập tên Player!');
            
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            // Tự động tạo profile player trên Firestore
            await setDoc(doc(db, 'users', uid), {
                username: username,
                email: email,
                role: 'player', // Mặc định tự cấp quyền Player
                createdAt: new Date().toISOString()
            });

            alert('Đăng ký tài khoản thành công!');
        }
        authModal.style.display = 'none';
    } catch (err) {
        alert('Lỗi: ' + err.message);
    }
};

// Đăng xuất
logoutBtn.onclick = () => signOut(auth);

// Lắng nghe trạng thái tài khoản tự động của Firebase
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists()) {
            currentUser = { uid: user.uid, ...userSnap.data() };
            userNameDisplay.innerText = currentUser.username;
            adminBadge.style.display = currentUser.role === 'admin' ? 'inline-block' : 'none';
        }
        authOpenBtn.style.display = 'none';
        userProfile.style.display = 'flex';
    } else {
        currentUser = null;
        authOpenBtn.style.display = 'inline-block';
        userProfile.style.display = 'none';
    }
});
