import { auth, db } from '../firebase-init.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.x.x/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore.js";

export function RegisterPage() {
  return `
    <div class="auth-container">
      <h2>Tạo tài khoản</h2>
      <form id="register-form">
        <div class="input-group">
          <input type="text" id="reg-username" placeholder="Tên Geometry Dash (Player Name)" required />
        </div>
        <div class="input-group">
          <input type="email" id="reg-email" placeholder="Email của bạn" required />
        </div>
        <div class="input-group">
          <input type="password" id="reg-password" placeholder="Mật khẩu" required />
        </div>
        
        <p id="error-message" class="error-text" style="color: #ff4d4d; display: none;"></p>

        <button type="submit" class="btn-submit">Đăng ký</button>
      </form>
      
      <p class="auth-switch">
        Đã có tài khoản? <a href="#/login">Đăng nhập</a>
      </p>
    </div>
  `;
}

// Hàm gắn sự kiện Submit Form (Gọi sau khi render HTML ra màn hình)
export function initRegisterEvents() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const errorEl = document.getElementById('error-message');

    errorEl.style.display = 'none';

    try {
      // 1. Tạo tài khoản trong Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Lưu profile user vào Firestore Database
      await setDoc(doc(db, "users", user.uid), {
        username: username,
        username_lowercase: username.toLowerCase(), // Lưu để sau này đăng nhập bằng Username
        email: email,
        role: "player",
        createdAt: new Date().toISOString()
      });

      alert("Đăng ký thành công!");
      window.location.hash = "#/"; // Chuyển về trang chủ

    } catch (error) {
      console.error(error);
      errorEl.style.display = 'block';
      if (error.code === 'auth/email-already-in-use') {
        errorEl.textContent = 'Email này đã được đăng ký rồi.';
      } else if (error.code === 'auth/weak-password') {
        errorEl.textContent = 'Mật khẩu phải có ít nhất 6 ký tự.';
      } else {
        errorEl.textContent = 'Đăng ký thất bại: ' + error.message;
      }
    }
  });
}
