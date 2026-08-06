import { fetchLeaderboard, fetchList } from '../content.js';
import { localize } from '../util.js';
import Spinner from '../components/Spinner.js';

export default {
    components: {
        Spinner,
    },
    data() {
        return {
            leaderboard: [],
            loading: true,
            selectedPlayerIndex: 0,
            socialsData: {},
            listData: [],
        };
    },
    computed: {
        selectedPlayer() {
            if (this.leaderboard.length === 0) return null;
            return this.leaderboard[this.selectedPlayerIndex];
        },
        currentSocials() {
            if (!this.selectedPlayer) return null;
            const name = this.selectedPlayer.user;
            return this.socialsData[name] || null;
        },
        verifiedLevels() {
            if (!this.selectedPlayer || !this.listData.length) return [];
            const playerName = this.selectedPlayer.user;
            let results = [];

            this.listData.forEach((level, index) => {
                if (level.verifier && level.verifier.toLowerCase() === playerName.toLowerCase()) {
                    results.push({
                        rank: index + 1,
                        name: level.name,
                        score: level.score || 0,
                        link: level.verification || level.showcase || '#',
                        banner: level.banner || ''
                    });
                }
            });
            return results;
        },
        completedLevels() {
            if (!this.selectedPlayer) return [];
            return this.selectedPlayer.verified || [];
        },
        progressLevels() {
            if (!this.selectedPlayer) return [];
            return this.selectedPlayer.progressed || [];
        }
    },
    async mounted() {
        try {
            const [board, list] = await Promise.all([
                fetchLeaderboard(),
                fetchList()
            ]);
            this.leaderboard = board;
            this.listData = list;

            try {
                const res = await fetch('./data/_socials.json');
                if (res.ok) {
                    this.socialsData = await res.json();
                }
            } catch (e) {
                console.warn("Không thể tải file _socials.json", e);
            }

        } catch (err) {
            console.error("Lỗi khi tải dữ liệu Leaderboard:", err);
        } finally {
            this.loading = false;
        }
    },
    methods: {
        localize,
        selectPlayer(index) {
            this.selectedPlayerIndex = index;
        },
        getAvatarUrl(user) {
            const socials = this.socialsData[user];
            if (socials && socials.avatar) {
                return socials.avatar;
            }
            return 'https://i.ibb.co/3sS7X1S/default-avatar.png';
        },
        getCardStyle(level) {
            if (level.banner) {
                return {
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url(${level.banner})`
                };
            }
            return {
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
            };
        }
    },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-leaderboard">
            <!-- CỘT TRÁI: BẢNG XẾP HẠNG (LEADERBOARD LIST) -->
            <div class="board-column">
                <div 
                    v-for="(entry, index) in leaderboard" 
                    :key="index"
                    class="board-row"
                    :class="{ active: selectedPlayerIndex === index }"
                    @click="selectPlayer(index)"
                >
                    <span class="rank">#{{ index + 1 }}</span>
                    <div class="user-icon-container">
                        <img :src="getAvatarUrl(entry.user)" class="board-user-icon" alt="Avatar" />
                    </div>
                    <div class="user">
                        <span class="player-name-text">{{ entry.user }}</span>
                    </div>
                    <div class="total">
                        <span class="score-badge">{{ localize(entry.total) }} pts</span>
                    </div>
                </div>
            </div>

            <!-- CỘT PHẢI: CHI TIẾT PROFILE (PLAYER PROFILE) -->
            <div class="profile-column" v-if="selectedPlayer">
                
                <!-- CARD THÔNG TIN CÁ NHÂN HEADER -->
                <div class="profile-header-card">
                    <div class="profile-info">
                        <h1 class="player-title">#{{ selectedPlayerIndex + 1 }} - {{ selectedPlayer.user }}</h1>
                        
                        <div class="player-stats-row">
                            <!-- Nút điểm số Pts -->
                            <div class="pts-container">
                                <span class="stat-badge score-gold">
                                    ⚡ {{ localize(selectedPlayer.total) }} pts
                                </span>
                            </div>

                            <!-- Hàng Discord ID nằm NGAY DƯỚI nút Pts (Chữ trơn, logo + ID) -->
                            <div v-if="currentSocials && currentSocials.discord" class="discord-plain-info" :title="'Discord: ' + currentSocials.discord">
                                <img src="assets/discord.svg" class="discord-plain-icon" alt="Discord" />
                                <span class="discord-plain-text">{{ currentSocials.discord }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- AVATAR VÀ SOCIAL ICONS BÊN PHẢI -->
                    <div class="profile-avatar-box">
                        <img :src="getAvatarUrl(selectedPlayer.user)" class="profile-user-avatar" alt="Avatar" />
                        
                        <!-- Dãy icon Youtube, Facebook, GDVN bên dưới Avatar -->
                        <div class="player-socials-row" v-if="currentSocials">
                            <a v-if="currentSocials.youtube" :href="currentSocials.youtube" target="_blank" title="YouTube">
                                <img src="assets/youtube.svg" class="social-icon" alt="YouTube" />
                            </a>
                            <a v-if="currentSocials.facebook" :href="currentSocials.facebook" target="_blank" title="Facebook">
                                <img src="assets/facebook.svg" class="social-icon" alt="Facebook" />
                            </a>
                            <a v-if="currentSocials.gdvn" :href="currentSocials.gdvn" target="_blank" title="GDVN Profile">
                                <img src="assets/gdvn.png" class="social-icon gdvn-icon" alt="GDVN" />
                            </a>
                        </div>
                    </div>
                </div>

                <!-- SECTION 1: HARDEST LEVEL -->
                <div class="profile-section" v-if="completedLevels.length > 0">
                    <h2 class="section-title">Hardest Level Beat</h2>
                    <a 
                        :href="completedLevels[0].link" 
                        target="_blank" 
                        class="level-card hardest-card"
                        :style="getCardStyle(completedLevels[0])"
                    >
                        <div class="level-card-info">
                            <span class="level-rank">#{{ completedLevels[0].rank }}</span>
                            <span class="level-title">{{ completedLevels[0].name }}</span>
                        </div>
                        <span class="level-card-score">{{ localize(completedLevels[0].score) }} pts</span>
                    </a>
                </div>

                <!-- SECTION 2: VERIFIED LEVELS -->
                <div class="profile-section" v-if="verifiedLevels.length > 0">
                    <h2 class="section-title">Verified Levels ({{ verifiedLevels.length }})</h2>
                    <div class="level-grid">
                        <a 
                            v-for="(item, i) in verifiedLevels" 
                            :key="i"
                            :href="item.link" 
                            target="_blank" 
                            class="level-card"
                            :style="getCardStyle(item)"
                        >
                            <div class="level-card-info">
                                <span class="level-rank">#{{ item.rank }}</span>
                                <span class="level-title">{{ item.name }}</span>
                            </div>
                            <span class="level-card-score">{{ localize(item.score) }} pts</span>
                        </a>
                    </div>
                </div>

                <!-- SECTION 3: COMPLETED LEVELS -->
                <div class="profile-section" v-if="completedLevels.length > 0">
                    <h2 class="section-title">Completed Levels ({{ completedLevels.length }})</h2>
                    <div class="level-grid">
                        <a 
                            v-for="(item, i) in completedLevels" 
                            :key="i"
                            :href="item.link" 
                            target="_blank" 
                            class="level-card"
                            :style="getCardStyle(item)"
                        >
                            <div class="level-card-info">
                                <span class="level-rank">#{{ item.rank }}</span>
                                <span class="level-title">{{ item.name }}</span>
                            </div>
                            <span class="level-card-score">{{ localize(item.score) }} pts</span>
                        </a>
                    </div>
                </div>

                <!-- SECTION 4: LIST PROGRESS -->
                <div class="profile-section" v-if="progressLevels.length > 0">
                    <h2 class="section-title">List Progress ({{ progressLevels.length }})</h2>
                    <div class="level-grid">
                        <a 
                            v-for="(item, i) in progressLevels" 
                            :key="i"
                            :href="item.link" 
                            target="_blank" 
                            class="level-card"
                            :style="getCardStyle(item)"
                        >
                            <div class="level-card-info">
                                <span class="level-rank">#{{ item.rank }}</span>
                                <span class="level-title">{{ item.name }} ({{ item.percent }}%)</span>
                            </div>
                        </a>
                    </div>
                </div>

            </div>
        </main>
    `
};
