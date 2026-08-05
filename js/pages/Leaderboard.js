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
        playerSocials: {}, // Lưu dữ liệu mạng xã hội từ data/_players.json
    }),
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">
                <div class="error-container">
                    <p class="error" v-if="err.length > 0">
                        Leaderboard may be incorrect, as the following levels could not be loaded: {{ err.join(', ') }}
                    </p>
                </div>

                <!-- Cột Trái: Bảng xếp hạng Player -->
                <div class="board-container">
                    <div class="board">
                        <div
                            v-for="(ientry, i) in leaderboard"
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

                            <!-- Khối Avatar + Icons Mạng Xã Hội Nằm Ngang -->
                            <div class="profile-avatar-box">
                                <img 
                                    class="profile-user-avatar" 
                                    :src="'assets/avatars/' + entry.user + '.png'" 
                                    alt=""
                                    @error="$event.target.src='assets/avatars/default.png'"
                                />

                                <!-- Social Icons -->
                                <div v-if="currentSocials" class="player-socials-row">
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
                                        v-if="currentSocials.discord" 
                                        :href="currentSocials.discord" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        title="Discord"
                                        @click.stop
                                    >
                                        <img src="assets/discord.svg" class="social-icon" alt="Discord" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        <!-- HARDEST LEVEL CARD -->
                        <div v-if="hardestLevel" class="profile-section">
                            <h2 class="section-title">🏆 Hardest Beat</h2>
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

                        <!-- VERIFIED LEVELS -->
                        <div v-if="entry.verified.length > 0" class="profile-section">
                            <h2 class="section-title">👑 Verified ({{ entry.verified.length }})</h2>
                            <div class="level-grid">
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
                        </div>

                        <!-- COMPLETED LEVELS -->
                        <div v-if="entry.completed.length > 0" class="profile-section">
                            <h2 class="section-title">✅ Completed ({{ entry.completed.length }})</h2>
                            <div class="level-grid">
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
                        </div>

                        <!-- PROGRESSED LEVELS -->
                        <div v-if="entry.progressed.length > 0" class="profile-section">
                            <h2 class="section-title">🎯 Progressed ({{ entry.progressed.length }})</h2>
                            <div class="level-grid">
                                <a 
                                    v-for="score in entry.progressed"
                                    :key="score.level"
                                    :href="getScoreLink(score)"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="level-card"
                                    :style="{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.75)), url(' + getLevelThumb(score.level) + ')' }"
                                >
                                    <div class="level-card-info">
                                        <span class="level-rank">#{{ score.rank }}</span>
                                        <span class="level-title">{{ score.percent }}% {{ score.level }}</span>
                                    </div>
                                    <div class="level-card-score">
                                        +{{ localize(score.score) }} pts
                                    </div>
                                </a>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </main>
    `,
    computed: {
        entry() {
            return this.leaderboard[this.selected];
        },
        hardestLevel() {
            if (!this.entry) return null;
            const allBeats = [...this.entry.verified, ...this.entry.completed];
            if (allBeats.length === 0) return null;
            return allBeats.reduce((min, current) => current.rank < min.rank ? current : min, allBeats[0]);
        },
        // Lấy thông tin link social của player đang chọn
        currentSocials() {
            if (!this.entry || !this.entry.user) return null;
            return this.playerSocials[this.entry.user.toLowerCase()] || null;
        }
    },
    async mounted() {
        const [leaderboard, err] = await fetchLeaderboard();
        this.list = await fetchList();
        this.leaderboard = leaderboard;
        this.err = err;

        // Tải dữ liệu mạng xã hội từ file JSON
        try {
            const res = await fetch('data/_players.json');
            if (res.ok) {
                const socialsArray = await res.json();
                const map = {};
                socialsArray.forEach(item => {
                    if (item.name) {
                        map[item.name.toLowerCase()] = item;
                    }
                });
                this.playerSocials = map;
            }
        } catch (e) {
            console.warn("Không thể tải file data/_players.json", e);
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
        }
    },
};v
