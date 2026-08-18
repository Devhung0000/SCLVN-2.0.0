import { fetchLeaderboard, fetchList, fetchLevel } from '../content.js';
import { fetchLeaderboard, fetchList } from '../content.js';
import { localize } from '../util.js';

import Spinner from '../components/Spinner.js';

export default {
@@ -13,8 +12,8 @@ export default {
        loading: true,
        selected: 0,
        err: [],
        levelCache: {},
        activeTab: 'completed', // 'completed' hoặc 'uncompleted'
        playerSocials: {},
        copiedDiscord: false,
    }),
    template: `
        <main v-if="loading">
@@ -23,7 +22,7 @@ export default {
        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">
                <div class="error-container">
                    <p class="error" v-if="err.length > 0">
                    <p class="error" v-if="err && err.length > 0">
                        Leaderboard may be incorrect, as the following levels could not be loaded: {{ err.join(', ') }}
                    </p>
                </div>
@@ -33,7 +32,7 @@ export default {
                    <div class="board">
                        <div
                            v-for="(ientry, i) in leaderboard"
                            :key="ientry.user"
                            :key="ientry.user || i"
                            class="board-row"
                            :class="{
                                'top-1': i === 0,
@@ -85,34 +84,86 @@ export default {
                                >
                                    #{{ selected + 1 }} - {{ entry.user }}
                                </h1>
                                
                                <!-- Dòng 1: Nút điểm số Pts -->
                                <!-- Điểm số Pts -->
                                <div class="player-stats-row">
                                    <span class="stat-badge score-gold">
                                        ⚡ {{ localize(entry.total) }} pts
                                    </span>
                                </div>

                                <!-- Dòng 2: Discord nằm ở DƯỚI Pts (Không khung, chỉ icon + text) -->
                                <div 
                                    v-if="currentSocials && currentSocials.discord" 
                                    class="discord-text-row"
                                    :title="'Discord: ' + currentSocials.discord"
                                >
                                    <img src="assets/discord.svg" class="discord-text-icon" alt="Discord" />
                                    <span class="discord-text-id">{{ currentSocials.discord }}</span>
                                </div>
                            </div>

                            <!-- Avatar & Social Links Box -->
                            <!-- Khối Avatar + Icons Mạng Xã Hội (YT, FB, GDVN) -->
                            <!-- Khối Avatar + Social Icons (Gồm Discord, YT, FB, GDVN) -->
                            <div class="profile-avatar-box">
                                <img 
                                    class="profile-user-avatar" 
                                    :src="'assets/avatars/' + entry.user + '.png'" 
                                    alt=""
                                    @error="$event.target.src='assets/avatars/default.png'"
                                />
                                
                                <div class="profile-social-container" v-if="entry.youtube || entry.discord || entry.facebook">
                                    <div class="profile-social-icons">
                                        <a v-if="entry.youtube" :href="entry.youtube" target="_blank" rel="noopener noreferrer" class="social-icon-link yt" title="YouTube">
                                            <i class="fab fa-youtube"></i>
                                        </a>
                                        <a v-if="entry.discord" :href="entry.discord" target="_blank" rel="noopener noreferrer" class="social-icon-link ds" title="Discord">
                                            <i class="fab fa-discord"></i>
                                        </a>
                                        <a v-if="entry.facebook" :href="entry.facebook" target="_blank" rel="noopener noreferrer" class="social-icon-link fb" title="Facebook">
                                            <i class="fab fa-facebook-f"></i>
                                        </a>

                                <!-- Social Icons dưới Avatar -->
                                <!-- Dòng Social Icons nằm ngay dưới Avatar -->
                                <div v-if="currentSocials" class="player-socials-row">
                                    <!-- Discord Tag cùng hàng -->
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

                                    <!-- YouTube -->
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

                                    <!-- Facebook -->
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

                                    <!-- GDVN -->
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
@@ -140,7 +191,7 @@ export default {
                        </div>

                        <!-- VERIFIED LEVELS -->
                        <div v-if="entry.verified.length > 0" class="profile-section">
                        <div v-if="entry.verified && entry.verified.length > 0" class="profile-section">
                            <h2 class="section-title">👑 Verified ({{ entry.verified.length }})</h2>
                            <div class="level-grid">
                                <a 
@@ -163,71 +214,32 @@ export default {
                            </div>
                        </div>

                        <!-- TAB COMPLETED & UNCOMPLETED BUTTONS -->
                        <div class="profile-section">
                            <div class="tab-header">
                                <button 
                                    class="tab-btn" 
                                    :class="{ active: activeTab === 'completed' }"
                                    @click="activeTab = 'completed'"
                                >
                                    ✅ Completed ({{ entry.completed.length }})
                                </button>
                                <button 
                                    class="tab-btn" 
                                    :class="{ active: activeTab === 'uncompleted' }"
                                    @click="activeTab = 'uncompleted'"
                        <!-- COMPLETED LEVELS -->
                        <div v-if="entry.completed && entry.completed.length > 0" class="profile-section">
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
                                    ❌ Uncompleted ({{ uncompletedLevels.length }})
                                </button>
                            </div>

                            <!-- DANH SÁCH COMPLETED -->
                            <div v-if="activeTab === 'completed'">
                                <div v-if="entry.completed.length > 0" class="level-grid">
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
                                <p v-else class="empty-msg">Chưa có level nào hoàn thành.</p>
                            </div>

                            <!-- DANH SÁCH UNCOMPLETED -->
                            <div v-if="activeTab === 'uncompleted'">
                                <div v-if="uncompletedLevels.length > 0" class="level-grid">
                                    <a 
                                        v-for="lvl in uncompletedLevels"
                                        :key="lvl.name"
                                        :href="'/#/level/' + getLevelSlug(lvl.name)"
                                        class="level-card uncompleted-card"
                                        :style="{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.85)), url(' + getLevelThumb(lvl.name) + ')' }"
                                    >
                                        <div class="level-card-info">
                                            <span class="level-rank">#{{ lvl.rank }}</span>
                                            <span class="level-title">{{ lvl.name }}</span>
                                        </div>
                                    </a>
                                </div>
                                <p v-else class="empty-msg">Đã hoàn thành tất cả các level!</p>
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
                        <div v-if="entry.progressed && entry.progressed.length > 0" class="profile-section">
                            <h2 class="section-title">🎯 Progressed ({{ entry.progressed.length }})</h2>
                            <div class="level-grid">
                                <a 
@@ -257,49 +269,48 @@ export default {
    `,
    computed: {
        entry() {
            return this.leaderboard[this.selected];
            if (!this.leaderboard || this.leaderboard.length === 0) return null;
            return this.leaderboard[this.selected] || null;
        },
        hardestLevel() {
            if (!this.entry) return null;
            const allBeats = [...this.entry.verified, ...this.entry.completed];
            const verified = this.entry.verified || [];
            const completed = this.entry.completed || [];
            const allBeats = [...verified, ...completed];
            if (allBeats.length === 0) return null;
            return allBeats.reduce((min, current) => current.rank < min.rank ? current : min, allBeats[0]);
            return allBeats.reduce((min, current) => (current.rank < min.rank ? current : min), allBeats[0]);
        },
        // Lọc danh sách các Level mà Player CHƯA Beat / Verified
        uncompletedLevels() {
            if (!this.entry || !this.list) return [];

            const doneNames = new Set([
                ...this.entry.completed.map(s => s.level.toLowerCase().trim()),
                ...this.entry.verified.map(s => s.level.toLowerCase().trim())
            ]);

            const flatList = this.list.flat().filter(item => item && item.name);

            return flatList
                .filter(lvl => !doneNames.has(lvl.name.toLowerCase().trim()))
                .map((lvl, index) => ({
                    name: lvl.name,
                    rank: lvl.rank || index + 1
                }));
        currentSocials() {
            if (!this.entry || !this.entry.user) return null;
            return this.playerSocials[this.entry.user.toLowerCase()] || null;
        }
    },
    async mounted() {
        const [leaderboard, err] = await fetchLeaderboard();
        const list = await fetchList();
        
        this.leaderboard = leaderboard;
        this.list = list;
        this.err = err;
        try {
            const [leaderboard, err] = await fetchLeaderboard();
            this.list = await fetchList();
            this.leaderboard = leaderboard || [];
            this.err = err || [];
        } catch (e) {
            console.error("Lỗi fetchLeaderboard:", e);
        }

        const flatList = list.flat().filter(item => item && item.path);
        for (let i = 0; i < flatList.length; i++) {
            const levelMeta = flatList[i];
            const levelData = await fetchLevel(levelMeta.path);
            if (levelData && levelData[0]) {
                const fullLevel = levelData[0];
                this.levelCache[fullLevel.name.toLowerCase().trim()] = fullLevel;
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
@@ -312,32 +323,24 @@ export default {
        },
        getLevelThumb(name) {
            const slug = this.getLevelSlug(name);
            return `data/${slug}/thumbnail.png`; 
            return `data/${slug}/thumbnail.png`;
        },
        getScoreLink(score) {
            if (!score || !this.entry) return '#';

            const userName = this.entry.user.toLowerCase().trim();
            const levelName = score.level.toLowerCase().trim();
            const levelData = this.levelCache[levelName];

            if (levelData) {
                if (levelData.verifier && levelData.verifier.toLowerCase().trim() === userName) {
                    if (levelData.verification) return levelData.verification;
                }

                if (levelData.records && levelData.records.length > 0) {
                    const userRecord = levelData.records.find(
                        r => r.user && r.user.toLowerCase().trim() === userName
                    );

                    if (userRecord && userRecord.link) {
                        return userRecord.link;
                    }
                }
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
    },
    }
};
