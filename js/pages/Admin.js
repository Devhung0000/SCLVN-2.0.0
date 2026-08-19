import { store } from '../main.js';
import {
    db, collection, getDocs, query, where,
    doc, updateDoc, addDoc, arrayUnion, serverTimestamp, orderBy
} from '../firebase-init.js';
import Spinner from '../components/Spinner.js';
import { showToast } from '../components/Toast.js';

export default {
    components: { Spinner },
    data: () => ({
        loading: true,
        currentTab: 'submissions', // 'submissions' | 'addLevel'
        submissions: [],
        busyId: null,
        store,
        // Form thêm level
        newLevel: {
            name: '',
            author: '',
            verifier: '',
            position: 1,
            points: 100,
            ytId: ''
        }
    }),
    template: `
        <main v-if="store.authLoading"><Spinner /></main>
        <main v-else-if="!store.user || store.user.role !== 'admin'" style="padding:2rem; text-align:center;">
            <p class="type-body-lg">Bạn không có quyền truy cập trang Admin.</p>
        </main>
        <main v-else class="page-admin" style="padding: 2rem 1rem; max-width: 800px; margin: 0 auto;">
            <h1>Bảng Quản Lý Admin</h1>
            
            <div style="display:flex; gap:1rem; margin: 1rem 0;">
                <button :class="['btn', { active: currentTab === 'submissions' }]" @click="currentTab = 'submissions'">
                    Duyệt Record ({{ submissions.length }})
                </button>
                <button :class="['btn', { active: currentTab === 'addLevel' }]" @click="currentTab = 'addLevel'">
                    ➕ Thêm Level Mới
                </button>
                <button class="btn" @click="load">↻ Tải lại</button>
            </div>

            <!-- TAB 1: DUYỆT SUBMISSIONS -->
            <section v-if="currentTab === 'submissions'">
                <p v-if="loading"><Spinner /></p>
                <p v-else-if="submissions.length === 0" class="type-body-lg">Không có record nào đang chờ duyệt 🎉</p>

                <div v-else style="display:flex; flex-direction:column; gap:1rem;">
                    <div v-for="sub in submissions" :key="sub.id"
                         style="border:1px solid var(--color-primary, #4ea8de); border-radius: 8px; padding: 1rem; display:flex; flex-direction:column; gap:0.5rem; background: rgba(0,0,0,0.2);">
                        <p class="type-title-sm" style="font-size:1.2rem; font-weight:bold;">{{ sub.levelName }}</p>

                        <label class="type-label-md">Player Name:
                            <input v-model="sub.playerName" class="btn" type="text" style="width:100%;" />
                        </label>

                        <div style="display:flex; gap:1rem;">
                            <label class="type-label-md">Percent (%):
                                <input v-model.number="sub.percent" class="btn" type="number" style="width:100px;" />
                            </label>
                            <label class="type-label-md">FPS / Hz:
                                <input v-model="sub.hz" class="btn" type="text" style="width:120px;" />
                            </label>
                            <label class="type-label-md" style="display:flex; align-items:center; gap:0.5rem; margin-top:1.5rem;">
                                <input v-model="sub.mobile" type="checkbox" /> Mobile
                            </label>
                        </div>

                        <label class="type-label-md">Video Link:
                            <input v-model="sub.link" class="btn" type="text" style="width:100%;" />
                        </label>

                        <p v-if="sub.note"><strong>Ghi chú từ người gửi:</strong> {{ sub.note }}</p>
                        <p class="type-label-md" style="opacity:0.8;">Gửi bởi: {{ sub.submittedByEmail }} (UID: {{ sub.playerUid }})</p>

                        <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
                            <button class="btn" style="background:#2e7d32;" :disabled="busyId === sub.id" @click="approve(sub)">✅ Duyệt</button>
                            <button class="btn" style="background:#d32f2f;" :disabled="busyId === sub.id" @click="reject(sub)">❌ Từ chối</button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- TAB 2: THÊM LEVEL MỚI -->
            <section v-if="currentTab === 'addLevel'" style="border:1px solid #444; padding:1.5rem; border-radius:8px;">
                <h2>Thêm Level Vào Danh Sách</h2>
                <form @submit.prevent="createLevel" style="display:flex; flex-direction:column; gap:1rem; margin-top:1rem;">
                    <label>Tên Level: <input v-model="newLevel.name" required class="btn" style="width:100%;" /></label>
                    <label>Tác giả (Creator): <input v-model="newLevel.author" required class="btn" style="width:100%;" /></label>
                    <label>Người Verify: <input v-model="newLevel.verifier" required class="btn" style="width:100%;" /></label>
                    <label>Thứ hạng (Position): <input v-model.number="newLevel.position" type="number" required class="btn" style="width:100%;" /></label>
                    <label>Điểm thưởng (Points): <input v-model.number="newLevel.points" type="number" required class="btn" style="width:100%;" /></label>
                    <label>YouTube Video ID (Ví dụ dQw4w9WgXcQ): <input v-model="newLevel.ytId" required class="btn" style="width:100%;" /></label>

                    <button class="btn" type="submit" :disabled="busyId === 'create'">➕ Tạo Level</button>
                </form>
            </section>
        </main>
    `,
    async mounted() {
        await this.load();
    },
    methods: {
        async load() {
            if (!store.user || store.user.role !== 'admin') {
                this.loading = false;
                return;
            }
            this.loading = true;
            try {
                const q = query(collection(db, 'submissions'), where('status', '==', 'pending'));
                const snap = await getDocs(q);
                this.submissions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            } catch (e) {
                showToast('Lỗi tải submissions: ' + e.message, 'error');
            } finally {
                this.loading = false;
            }
        },
        async approve(sub) {
            this.busyId = sub.id;
            try {
                const record = {
                    user: sub.playerName,
                    uid: sub.playerUid || null,
                    percent: Number(sub.percent),
                    hz: sub.hz || 'Unknown',
                    link: sub.link || '',
                    mobile: Boolean(sub.mobile),
                    approvedAt: new Date().toISOString()
                };

                // Thêm record vào level
                await updateDoc(doc(db, 'levels', sub.levelId), {
                    records: arrayUnion(record),
                });

                // Đổi trạng thái submission thành approved
                await updateDoc(doc(doc(db, 'submissions', sub.id).path), {
                    status: 'approved',
                    reviewedByUid: store.user.uid,
                    reviewedAt: serverTimestamp(),
                });

                showToast(`Đã duyệt record cho ${sub.playerName}!`, 'success');
                this.submissions = this.submissions.filter(s => s.id !== sub.id);
            } catch (e) {
                showToast('Lỗi khi duyệt: ' + e.message, 'error');
            } finally {
                this.busyId = null;
            }
        },
        async reject(sub) {
            this.busyId = sub.id;
            try {
                await updateDoc(doc(db, 'submissions', sub.id), {
                    status: 'rejected',
                    reviewedByUid: store.user.uid,
                    reviewedAt: serverTimestamp(),
                });
                showToast(`Đã từ chối record của ${sub.playerName}`, 'info');
                this.submissions = this.submissions.filter(s => s.id !== sub.id);
            } catch (e) {
                showToast('Lỗi khi từ chối: ' + e.message, 'error');
            } finally {
                this.busyId = null;
            }
        },
        async createLevel() {
            this.busyId = 'create';
            try {
                await addDoc(collection(db, 'levels'), {
                    name: this.newLevel.name,
                    author: this.newLevel.author,
                    verifier: this.newLevel.verifier,
                    position: Number(this.newLevel.position),
                    points: Number(this.newLevel.points),
                    ytId: this.newLevel.ytId,
                    records: [],
                    createdAt: serverTimestamp()
                });
                showToast('Tạo level thành công!', 'success');
                this.newLevel = { name: '', author: '', verifier: '', position: 1, points: 100, ytId: '' };
            } catch (e) {
                showToast('Lỗi tạo level: ' + e.message, 'error');
            } finally {
                this.busyId = null;
            }
        }
    },
};
