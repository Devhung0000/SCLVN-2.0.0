import { fetchLeaderboard, fetchList } from '../content.js';
import { localize } from '../util.js';
import Spinner from '../components/Spinner.js';

export default {
    components: {
        Spinner,
    },
    data: () => ({
        leaderboard: [],
        list: [],
        loading: true,
        selected: 0,
        err: [],
        playerSocials: {},
        copiedDiscord: false,
        activeTab: 'hardest', // Tab mặc định
    }),
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">
                <div class="error-container">
                    <p class="error" v-if="err && err.length > 0">
                        Leaderboard may be incorrect, as the following levels could not be loaded: {{ err.join(', ') }}
                    </p>
                </div>

                <!-- Cột Trái: Bảng xếp hạng Player -->
                <div class="board-container">
                    <div class="board">
                        <div
                            v-for="(ientry, i) in leaderboard"
                            :key="ientry.user || i"
                            class="board-row"
                            :class="{
                                'top-1': i === 0,
                                'top-2': i === 1,
                                'top-3': i === 2,
                                'active': selected === i
                            }"
                            @click="selected = i"
                        >
                            <div class="rank">
                                <p class="type-label-lg">#{{ i + 1 }}</p>
                            </div>

                            <div class="user-icon-container">
                                <img 
                                    class="board-user-icon" 
                                    :src="'assets/avatars/' + ientry.user + '.png'" 
                                    alt=""
                                    @error="$event.target.style.display='none'"
                                />
                            </div>

                            <div class="user">
                                <span class="type-label-lg player-name-text">
                                    {{ ientry.user }}
                                </span>
                            </div>

                            <div class="total">
                                <span class="score-badge">{{ localize(ientry.total) }} pts</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Cột Phải: Profile Chi Tiết Player -->
                <div class="player-container" v-if="entry">
                    <div class="player">
                        <!-- Card Header Player -->
                        <div class="profile-header-card">
                            <div class="profile-info">
                                <h1
                                    class="player-title"
                                    :class="{
                                        'top-1': selected === 0,
                                        'top-2': selected === 1,
                                        'top-3': selected === 2
                                    }"
                                >
                                    #{{ selected + 1 }} - {{ entry.user }}
                                </h1>
                                
                                <!-- Dòng 1: Nút điểm số Pts -->
                                <div class="player-stats-row">
                                    <span class="stat-badge score-gold">
                                        ⚡ {{ localize(entry.total) }} pts
                                    </span>
                                </div>
                            </div>

                            <!-- Khối Avatar + Social Icons -->
                            <div class="profile-avatar-box">
                                <img 
                                    class="profile-user-avatar" 
                                    :src="'assets/avatars/' + entry.user + '.png'" 
                                    alt=""
                                    @error="$event.target.src='assets/avatars/default.png'"
                                />

                                <div v-if="currentSocials" class="player-socials-row">
                                    <div 
                                        v-if="currentSocials.discord" 
                                        class="discord-tag"
                                        :title="'Click để copy: ' + currentSocials.discord"
                                        @click="copyDiscord(currentSocials.discord)"
                                    >
                                        <img src="assets/discord.svg" class="discord-icon" alt="Discord" />
                                        <span class="discord-username">{{ currentSocials.discord }}</span>
                                        <span v-if="copiedDiscord" class="copy-toast">Copied!</span>
                                    </div>

                                    <a 
                                        v-if="currentSocials.youtube" 
                                        :href="currentSocials.youtube" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        title="YouTube"
                                        @click.stop
                                    >
                                        <img src="assets/youtube.svg" class="social-icon" alt="YouTube" />
                                    </a>

                                    <a 
                                        v-if="currentSocials.facebook" 
                                        :href="currentSocials.facebook" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        title="Facebook"
                                        @click.stop
                                    >
                                        <img src="assets/facebook.svg" class="social-icon" alt="Facebook" />
                                    </a>

                                    <a 
                                        v-if="currentSocials.gdvn" 
                                        :href="currentSocials.gdvn" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        title="GDVN Profile"
                                        @click.stop
                                    >
                                        <img src="assets/gdvn.png" class="social-icon gdvn-icon" alt="GDVN" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        <!-- HÀNG NÚT CHUYỂN TAB -->
                        <div class="profile-tabs">
                            <button 
                                class="tab-btn" 
                                :class="{ active: activeTab === 'hardest' }" 
                                @click="activeTab = 'hardest'"
                            >
                                🏆 Hardest
                            </button>
                            <button 
                                class="tab-btn" 
                                :class="{ active: activeTab === 'verified' }" 
                                @click="activeTab = 'verified'"
                            >
                                👑 Verified ({{ (entry.verified || []).length }})
                            </button>
                            <button 
                                class="tab-btn" 
                                :class="{ active: activeTab === 'completed' }" 
                                @click="activeTab = 'completed'"
                            >
                                ✅ Completed ({{ (entry.completed || []).length }})
                            </button>
                            <button 
                                class="tab-btn" 
                                :class="{ active: activeTab === 'uncompleted' }" 
                                @click="activeTab = 'uncompleted'"
                            >
                                ❌ Uncompleted ({{ uncompletedLevels.length }})
                            </button>
                        </div>

                        <!-- NỘI DUNG THEO TAB CHỌN -->
                        <div class="tab-content">
                            <!-- TAB 1: HARDEST -->
                            <div v-if="activeTab === 'hardest'">
                                <div v-if="hardestLevel" class="profile-section">
                                    <a 
                                        :href="getScoreLink(hardestLevel)"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="level-card hardest-card"
                                        :style="{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(' + getLevelThumb(hardestLevel.level) + ')' }"
                                    >
                                        <div class="level-card-info">
                                            <span class="level-rank">#{{ hardestLevel.rank }}</span>
                                            <div class="level-name-wrap">
                                                <span class="level-title">{{ hardestLevel.level }}</span>
                                            </div>
                                        </div>
                                        <div class="level-card-score">
                                            +{{ localize(hardestLevel.score) }} pts
                                        </div>
                                    </a>
                                </div>
                                <p v-else class="empty-msg">Chưa có thông tin level khó nhất.</p>
                            </div>

                            <!-- TAB 2: VERIFIED -->
                            <div v-if="activeTab === 'verified'">
                                <div v-if="entry.verified && entry.verified.length > 0" class="level-grid">
                                    <a 
                                        v-for="score in entry.verified"
                                        :key="score.level"
                                        :href="getScoreLink(score)"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="level-card"
                                        :style="{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.75)), url(' + getLevelThumb(score.level) + ')' }"
                                    >
                                        <div class="level-card-info">
                                            <span class="level-rank">#{{ score.rank }}</span>
                                            <span class="level-title">{{ score.level }}</span>
                                        </div>
                                        <div class="level-card-score">
                                            +{{ localize(score.score) }} pts
                                        </div>
                                    </a>
                                </div>
                                <p v-else class="empty-msg">Không có level đã Verify.</p>
                            </div>

                            <!-- TAB 3: COMPLETED -->
                            <div v-if="activeTab === 'completed'">
                                <div v-if="entry.completed && entry.completed.length > 0" class="level-grid">
                                    <a 
                                        v-for="score in entry.completed"
                                        :key="score.level"
                                        :href="getScoreLink(score)"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="level-card"
                                        :style="{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.75)), url(' + getLevelThumb(score.level) + ')' }"
                                    >
                                        <div class="level-card-info">
                                            <span class="level-rank">#{{ score.rank }}</span>
                                            <span class="level-title">{{ score.level }}</span>
                                        </div>
                                        <div class="level-card-score">
                                            +{{ localize(score.score) }} pts
                                        </div>
                                    </a>
                                </div>
                                <p v-else class="empty-msg">Chưa hoàn thành level nào.</p>
                            </div>

                            <!-- TAB 4: UNCOMPLETED -->
                            <div v-if="activeTab === 'uncompleted'">
                                <div v-if="uncompletedLevels.length > 0" class="level-grid">
                                    <a 
                                        v-for="item in uncompletedLevels"
                                        :key="item.name"
                                        :href="'/#/level/' + getLevelSlug(item.name)"
                                        target="_blank"
                                        class="level-card uncompleted-card"
                                        :style="{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.85)), url(' + getLevelThumb(item.name) + ')' }"
                                    >
                                        <div class="level-card-info">
                                            <span class="level-rank">#{{ item.rank }}</span>
                                            <span class="level-title">{{ item.name }}</span>
                                        </div>
                                    </a>
                                </div>
                                <p v-else class="empty-msg">Đã hoàn thành toàn bộ danh sách!</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </main>
    `,
    computed: {
        entry() {
            if (!this.leaderboard || this.leaderboard.length === 0) return null;
            return this.leaderboard[this.selected] || null;
        },
        hardestLevel() {
            if (!this.entry) return null;
            const verified = this.entry.verified || [];
            const completed = this.entry.completed || [];
            const allBeats = [...verified, ...completed];
            if (allBeats.length === 0) return null;
            return allBeats.reduce((min, current) => (current.rank < min.rank ? current : min), allBeats[0]);
        },
        currentSocials() {
            if (!this.entry || !this.entry.user) return null;
            return this.playerSocials[this.entry.user.toLowerCase()] || null;
        },
        // Tính toán các level trong list mà người chơi chưa hoàn thành/verify
        uncompletedLevels() {
            if (!this.entry || !this.list || this.list.length === 0) return [];
            
            const doneNames = new Set([
                ...(this.entry.verified || []).map(s => (s.level || '').toLowerCase()),
                ...(this.entry.completed || []).map(s => (s.level || '').toLowerCase())
            ]);

            return this.list
                .map((lvl, index) => {
                    const name = typeof lvl === 'string' ? lvl : (lvl.name || lvl.level);
                    return { name, rank: index + 1 };
                })
                .filter(item => item.name && !doneNames.has(item.name.toLowerCase()));
        }
    },
    async mounted() {
        try {
            const [leaderboard, err] = await fetchLeaderboard();
            this.list = await fetchList();
            this.leaderboard = leaderboard || [];
            this.err = err || [];
        } catch (e) {
            console.error("Lỗi fetchLeaderboard:", e);
        }

        try {
            const res = await fetch('data/_players.json');
            if (res.ok) {
                const socialsArray = await res.json();
                const map = {};
                if (Array.isArray(socialsArray)) {
                    socialsArray.forEach(item => {
                        if (item && item.name) {
                            map[item.name.toLowerCase()] = item;
                        }
                    });
                }
                this.playerSocials = map;
            }
        } catch (e) {
            console.warn("Chưa tìm thấy hoặc lỗi đọc file data/_players.json", e);
        }

        this.loading = false;
    },
    methods: {
        localize,
        getLevelSlug(name) {
            if (!name) return '';
            return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        },
        getLevelThumb(name) {
            const slug = this.getLevelSlug(name);
            return `data/${slug}/thumbnail.png`;
        },
        getScoreLink(score) {
            if (!score) return '#';
            const proofUrl = score.link || score.video || score.proof || score.url;
            if (proofUrl) {
                return proofUrl;
            }
            return `/#/level/${this.getLevelSlug(score.level)}`;
        },
        copyDiscord(username) {
            if (!username) return;
            navigator.clipboard.writeText(username).then(() => {
                this.copiedDiscord = true;
                setTimeout(() => {
                    this.copiedDiscord = false;
                }, 1500);
            });
        }
    }
};
