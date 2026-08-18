import { store } from '../main.js';
import { db, doc, updateDoc } from '../firebase-init.js';

export default {
    template: `
        <div style="padding: 40px; max-width: 900px; margin: 0 auto; box-sizing: border-box; width: 100%; color: #ffffff;">
            <div v-if="!store.user" style="text-align: center; color: #a1a1aa; padding: 60px 20px; background: #18181b; border-radius: 16px; border: 1px solid #27272a;">
                <h2 style="font-size: 20px; margin-bottom: 15px; color: #fff;">Vui lòng đăng nhập để xem và chỉnh sửa Profile!</h2>
                <router-link to="/login" style="background: #a855f7; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Đi tới trang Đăng nhập</router-link>
            </div>

            <div v-else style="background: #121215; border: 1px solid #27272a; border-radius: 16px; padding: 32px; color: white;">
                <h2 style="margin: 0 0 24px 0; font-size: 26px; border-bottom: 1px solid #27272a; padding-bottom: 16px; color: #c084fc; font-weight: 700;">Account Profile</h2>
                
                <div style="display: flex; gap: 40px; flex-wrap: wrap;">
                    <!-- Avatar Upload Area -->
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 16px; width: 200px;">
                        <div style="width: 160px; height: 160px; border-radius: 20px; overflow: hidden; border: 2px solid #a855f7; background: #000; box-shadow: 0 8px 24px rgba(168,85,247,0.2);">
                            <img :src="previewAvatar || store.user.avatar || '/assets/the sclvn logo.png'" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <label style="background: #27272a; border: 1px solid #3f3f46; color: white; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; text-align: center; width: 100%; box-sizing: border-box;">
                            Upload Ảnh PNG
                            <input type="file" accept="image/png, image/jpeg" @change="handleFileUpload" style="display: none;">
                        </label>
                        <span style="font-size: 12px; color: #71717a; text-align: center;">Chấp nhận file .PNG / .JPG (&lt; 2MB)</span>
                    </div>

                    <!-- Input Fields -->
                    <form @submit.prevent="saveProfile" style="flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 20px;">
                        <div>
                            <label style="font-size: 14px; color: #a1a1aa; display: block; margin-bottom: 8px; font-weight: 500;">Player Name (Khớp tên trên Leaderboard):</label>
                            <input type="text" v-model="form.username" required placeholder="e.g. giangdelt" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #27272a; background: #18181b; color: white; box-sizing: border-box; font-size: 14px;">
                        </div>

                        <div>
                            <label style="font-size: 14px; color: #a1a1aa; display: block; margin-bottom: 8px; font-weight: 500;">YouTube Channel Link:</label>
                            <input type="url" v-model="form.youtube" placeholder="https://www.youtube.com/@giangdeltpro" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #27272a; background: #18181b; color: white; box-sizing: border-box; font-size: 14px;">
                        </div>

                        <div>
                            <label style="font-size: 14px; color: #a1a1aa; display: block; margin-bottom: 8px; font-weight: 500;">Facebook Link:</label>
                            <input type="url" v-model="form.facebook" placeholder="https://www.facebook.com/giangdelt" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #27272a; background: #18181b; color: white; box-sizing: border-box; font-size: 14px;">
                        </div>

                        <div>
                            <label style="font-size: 14px; color: #a1a1aa; display: block; margin-bottom: 8px; font-weight: 500;">GDVN Link:</label>
                            <input type="url" v-model="form.gdvn" placeholder="https://www.gdlisthub.dev/vi/@giangdelt" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #27272a; background: #18181b; color: white; box-sizing: border-box; font-size: 14px;">
                        </div>

                        <div>
                            <label style="font-size: 14px; color: #a1a1aa; display: block; margin-bottom: 8px; font-weight: 500;">Discord ID / Tag:</label>
                            <input type="text" v-model="form.discord" placeholder="1338170769708159032" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #27272a; background: #18181b; color: white; box-sizing: border-box; font-size: 14px;">
                        </div>

                        <button type="submit" :disabled="loading" style="margin-top: 10px; padding: 14px; background: #22c55e; border: none; color: white; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 15px; transition: background 0.2s;">
                            {{ loading ? 'Saving...' : 'Save Profile Changes' }}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            store,
            previewAvatar: '',
            loading: false,
            form: {
                username: '',
                youtube: '',
                facebook: '',
                gdvn: '',
                discord: ''
            }
        };
    },
    async mounted() {
        if (this.store.user) {
            await this.loadInitialData();
        }
    },
    watch: {
        'store.user': {
            immediate: true,
            async handler(newVal) {
                if (newVal) {
                    await this.loadInitialData();
                }
            }
        }
    },
    methods: {
        async loadInitialData() {
            this.form.username = this.store.user.username || '';
            this.previewAvatar = this.store.user.avatar || '';

            try {
                const res = await fetch('/data/_players.json');
                const players = await res.json();
                const matchedPlayer = players.find(p => p.name.toLowerCase() === this.form.username.toLowerCase());

                if (matchedPlayer) {
                    this.form.youtube = matchedPlayer.youtube || '';
                    this.form.facebook = matchedPlayer.facebook || '';
                    this.form.gdvn = matchedPlayer.gdvn || '';
                    this.form.discord = matchedPlayer.discord || '';
                }
            } catch (err) {
                console.error("Không tải được file _players.json", err);
            }

            if (this.store.user.socials) {
                this.form.youtube = this.store.user.socials.youtube || this.form.youtube;
                this.form.facebook = this.store.user.socials.facebook || this.form.facebook;
                this.form.gdvn = this.store.user.socials.gdvn || this.form.gdvn;
                this.form.discord = this.store.user.socials.discord || this.form.discord;
            }
        },

        handleFileUpload(e) {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 2 * 1024 * 1024) {
                alert("File quá lớn! Vui lòng chọn ảnh dưới 2MB.");
                return;
            }

            const reader = new FileReader();
            reader.onload = (evt) => {
                this.previewAvatar = evt.target.result;
            };
            reader.readAsDataURL(file);
        },

        async saveProfile() {
            if (!this.store.user) return;
            this.loading = true;

            try {
                const updatedData = {
                    username: this.form.username.trim(),
                    username_lowercase: this.form.username.trim().toLowerCase(),
                    avatar: this.previewAvatar,
                    socials: {
                        youtube: this.form.youtube.trim(),
                        facebook: this.form.facebook.trim(),
                        gdvn: this.form.gdvn.trim(),
                        discord: this.form.discord.trim()
                    }
                };

                await updateDoc(doc(db, 'users', this.store.user.uid), updatedData);

                this.store.user.username = updatedData.username;
                this.store.user.avatar = updatedData.avatar;
                this.store.user.socials = updatedData.socials;

                alert('Cập nhật Profile thành công!');
            } catch (err) {
                alert('Lỗi cập nhật profile: ' + err.message);
            } finally {
                this.loading = false;
            }
        }
    }
};
