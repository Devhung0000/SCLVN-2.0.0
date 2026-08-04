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

                <!-- Cột trái: Leaderboard List -->
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

                <!-- Cột phải: Profile Player -->
                <div class="player-container" v-if="entry">
                    <div class="player">
                        <!-- Header Profile -->
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
                                        {{ localize(entry.total) }} pts
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

                        <!-- HARDEST LEVEL -->
                        <div v-if="hardestLevel" class="profile-section">
                            <h2 class="section-title">🏆 Hardest</h2>
                            <a 
                                :href="'/#/level/' + (hardestLevel.path || getSlug(hardestLevel.level))"
                                class="level-banner-card hardest-banner"
                                :style="getBannerStyle(hardestLevel)"
                            >
                                <div class="banner-left">
                                    <span class="banner-rank">#{{ hardestLevel.rank }}</span>
                                    <span class="banner-title">{{ hardestLevel.level }}</span>
                                </div>
                                <div class="banner-right">
                                    <span class="banner-score">+{{ localize(hardestLevel.score) }} pts</span>
                                </div>
                            </a>
                        </div>

                        <!-- VERIFIED -->
                        <div v-if="entry.verified.length > 0" class="profile-section">
                            <h2 class="section-title">👑 Verified ({{ entry.verified.length }})</h2>
                            <div class="banner-list">
                                <a 
                                    v-for="score in entry.verified"
                                    :key="score.level"
                                    :href="'/#/level/' + (score.path || getSlug(score.level))"
                                    class="level-banner-card"
                                    :style="getBannerStyle(score)"
                                >
                                    <div class="banner-left">
                                        <span class="banner-rank">#{{ score.rank }}</span>
                                        <span class="banner-title">{{ score.level }}</span>
                                    </div>
                                    <div class="banner-right">
                                        <span class="banner-score">+{{ localize(score.score) }} pts</span>
                                    </div>
                                </a>
                            </div>
                        </div>

                        <!-- COMPLETED -->
                        <div v-if="entry.completed.length > 0" class="profile-section">
                            <h2 class="section-title">✅ Completed ({{ entry.completed.length }})</h2>
                            <div class="banner-list">
                                <a 
                                    v-for="score in entry.completed"
                                    :key="score.level"
                                    :href="'/#/level/' + (score.path || getSlug(score.level))"
                                    class="level-banner-card"
                                    :style="getBannerStyle(score)"
                                >
                                    <div class="banner-left">
                                        <span class="banner-rank">#{{ score.rank }}</span>
                                        <span class="banner-title">{{ score.level }}</span>
                                    </div>
                                    <div class="banner-right">
                                        <span class="banner-score">+{{ localize(score.score) }} pts</span>
                                    </div>
                                </a>
                            </div>
                        </div>

                        <!-- PROGRESSED -->
                        <div v-if="entry.progressed.length > 0" class="profile-section">
                            <h2 class="section-title">🎯 Progressed ({{ entry.progressed.length }})</h2>
                            <div class="banner-list">
                                <a 
                                    v-for="score in entry.progressed"
                                    :key="score.level"
                                    :href="'/#/level/' + (score.path || getSlug(score.level))"
                                    class="level-banner-card"
                                    :style="getBannerStyle(score)"
                                >
                                    <div class="banner-left">
                                        <span class="banner-rank">#{{ score.rank }}</span>
                                        <span class="banner-title">{{ score.percent }}% {{ score.level }}</span>
                                    </div>
                                    <div class="banner-right">
                                        <span class="banner-score">+{{ localize(score.score) }} pts</span>
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
        }
    },
    async mounted() {
        const [leaderboard, err] = await fetchLeaderboard();
        this.list = await fetchList();
        this.leaderboard = leaderboard;
        this.err = err;
        this.loading = false;
    },
    methods: {
        localize,
        getSlug(name) {
            if (!name) return '';
            return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        },
        getBannerStyle(score) {
            const slug = score.path || this.getSlug(score.level);
            // Ưu tiên thumbnail -> banner -> fallback
            const imgPath = `data/${slug}/thumbnail.png`;
            return {
                backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.4) 60%, rgba(0, 0, 0, 0.75) 100%), url('${imgPath}')`
            };
        }
    },
};
