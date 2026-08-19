import { 
    auth, 
    db, 
    createUserWithEmailAndPassword, 
    doc, 
    setDoc 
} from '../firebase-init.js';

export function RegisterPage() {
  return `
    <div class="auth-container" style="max-width: 400px; margin: 40px auto; padding: 24px; background: #121216; border-radius: 12px; color: #fff;">
      <h2 style="margin-bottom: 20px; text-align: center;">Tạo tài khoản</h2>
      <form id="register-form" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="input-group">
          <label style="display: block; margin-bottom: 6px; font-size: 14px;">Tên Geometry Dash (Player Name):</label>
          <input type="text" id="reg-username" placeholder="Nhập GD Username..." required 
                 style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #333; background: #1a1a20; color: #fff;" />
        </div>
        <div class="input-group">
          <label style="display: block; margin-bottom: 6px; font-size: 14px;">Mật khẩu:</label>
          <input type="password" id="reg-password" placeholder="Tối thiểu 6 ký tự" required 
                 style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #333; background: #1a1a20; color: #fff;" />
        </div>
        
        <p id="error-message" class="error-text" style="color: #ff4d4d; display: none; font-size: 14px; margin: 0;"></p>

        <button type="submit" class="btn-submit" style="padding: 12px; border-radius: 6px; border: none; background: #a855f7; color: #fff; font-weight: bold; cursor: pointer;">Đăng ký</button>
      </form>
      
      <p class="auth-switch" style="margin-top: 16px; text-align: center; font-size: 14px; color: #aaa;">
        Đã có tài khoản? <a href="#/login" style="color: #a855f7;">Đăng nhập</a>
      </p>
    </div>
  `;
}

export function initRegisterEvents() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const errorEl = document.getElementById('error-message');

    errorEl.style.display = 'none';

    // Biến Username thành Email ảo hợp lệ cho Firebase
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    const virtualEmail = `${cleanUsername}@sclvn.local`;

    try {
      // 1. Tạo user trong Firebase Auth bằng Email ảo
      const userCredential = await createUserWithEmailAndPassword(auth, virtualEmail, password);
      const user = userCredential.user;

      // 2. Lưu tên GD thật vào Firestore Database
      await setDoc(doc(db, "users", user.uid), {
        username: username,
        username_lowercase: username.toLowerCase(),
        role: "player",
        createdAt: new Date().toISOString()
      });

      alert("Đăng ký thành công!");
      window.location.hash = "#/";

    } catch (error) {
      console.error(error);
      errorEl.style.display = 'block';
      if (error.code === 'auth/email-already-in-use') {
        errorEl.textContent = 'Tên Geometry Dash này đã được đăng ký!';
      } else if (error.code === 'auth/weak-password') {
        errorEl.textContent = 'Mật khẩu phải có ít nhất 6 ký tự.';
      } else {
        errorEl.textContent = 'Đăng ký thất bại: ' + error.message;
      }
    }
  });
}

export default {
    template: RegisterPage(),
    mounted() {
        initRegisterEvents();
    }
};
