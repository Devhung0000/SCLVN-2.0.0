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
        tab: 'hardest',
        err: [],
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
                                
                                <div class="player-stats-row">
                                    <span class="stat-badge score-gold">
                                        ⚡ {{ localize(entry.total) }} pts
                                    </span>
                                </div>
                            </div>

                            <div class="profile-avatar-box">
                                <img 
                                    class="profile-user-avatar" 
                                    :src="'assets/avatars/' + entry.user + '.png'" 
                                    alt=""
                                    @error="$event.target.src='assets/avatars/default.png'"
                                />
                            </div>
                        </div>

                        <!-- 4 Nút Điều Hướng Tab Filter -->
                        <div class="filter-tabs">
                            <button :class="{ active: tab === 'hardest' }" @click="tab = 'hardest'">
                                🏆 Hardest
                            </button>
                            <button :class="{ active: tab === 'completed' }" @click="tab = 'completed'">
                                ✅ Completed ({{ (entry.completed || []).length }})
                            </button>
                            <button :class="{ active: tab === 'uncompleted' }" @click="tab = 'uncompleted'">
                                ❌ Uncompleted ({{ uncompletedLevels.length }})
                            </button>
                            <button :class="{ active: tab === 'verified' }" @click="tab = 'verified'">
                                👑 Verified ({{ (entry.verified || []).length }})
                            </button>
                        </div>

                        <!-- TAB 1: HARDEST LEVEL CARD -->
                        <div v-if="tab === 'hardest'" class="profile-section">
                            <div v-if="hardestLevel">
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
                            <p v-else class="empty-msg">Chưa có level nào hoàn thành.</p>
                        </div>

                        <!-- TAB 2: COMPLETED LEVELS -->
                        <div v-if="tab === 'completed'" class="profile-section">
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
                            <p v-else class="empty-msg">Không có level đã hoàn thành.</p>
                        </div>

                        <!-- TAB 3: UNCOMPLETED LEVELS -->
                        <div v-if="tab === 'uncompleted'" class="profile-section">
                            <div v-if="uncompletedLevels.length > 0" class="level-grid">
                                <a 
                                    v-for="score in uncompletedLevels"
                                    :key="score.level"
                                    :href="'/#/level/' + getLevelSlug(score.level)"
                                    class="level-card uncompleted-card"
                                    :style="{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.85)), url(' + getLevelThumb(score.level) + ')' }"
                                >
                                    <div class="level-card-info">
                                        <span class="level-rank">#{{ score.rank }}</span>
                                        <span class="level-title">{{ score.level }}</span>
                                    </div>
                                </a>
                            </div>
                            <p v-else class="empty-msg">Đã hoàn thành toàn bộ danh sách!</p>
                        </div>

                        <!-- TAB 4: VERIFIED LEVELS -->
                        <div v-if="tab === 'verified'" class="profile-section">
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
                            <p v-else class="empty-msg">Chưa verified level nào.</p>
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
        // ĐƠN GIẢN NGHỊCH ĐẢO VỚI COMPLETED:
        uncompletedLevels() {
            if (!this.entry || !this.list) return [];
            
            // Lấy danh sách tên các level đã completed (hoặc verified)
            const completedNames = (this.entry.completed || []).map(c => c.level);
            const verifiedNames = (this.entry.verified || []).map(v => v.level);
            const doneSet = new Set([...completedNames, ...verifiedNames]);

            // Lọc ra các level nằm trong list tổng mà CHƯA có trong doneSet
            return this.list.filter(item => {
                const levelName = item.level || item.name || (typeof item === 'string' ? item : '');
                return !doneSet.has(levelName);
            }).map((item, index) => ({
                level: item.level || item.name || item,
                rank: item.rank || (index + 1)
            }));
        }
    },
    async mounted() {
        try {
            const [leaderboard, err] = await fetchLeaderboard();
            this.leaderboard = leaderboard || [];
            this.err = err || [];
            
            const listRes = await fetchList();
            // Nếu fetchList trả về [list, err] thì lấy phần tử [0], ngược lại lấy chính nó
            this.list = (Array.isArray(listRes) && Array.isArray(listRes[0])) ? listRes[0] : (listRes || []);
        } catch (e) {
            console.error(e);
        } finally {
            // Đảm bảo luôn luôn tắt loading dù có lỗi xảy ra hay không
            this.loading = false;
        }
    },
    methods: {
        localize,
        getLevelSlug(name) {
            if (!name) return '';
            return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        },
        getLevelThumb(name) {
            return `data/${this.getLevelSlug(name)}/thumbnail.png`;
        },
        getScoreLink(score) {
            if (!score) return '#';
            return score.link || score.video || score.proof || score.url || `/#/level/${this.getLevelSlug(score.level)}`;
        }
    }
};
