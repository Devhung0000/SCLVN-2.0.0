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
                <div class="board-container">
                    <div class="board">
                        <!-- Click vào toàn bộ khối board-row -->
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
                            <!-- 1. Rank -->
                            <div class="rank">
                                <p class="type-label-lg">#{{ i + 1 }}</p>
                            </div>

                            <!-- 2. Avatar GD -->
                            <div class="user-icon-container">
                                <img 
                                    class="board-user-icon" 
                                    :src="'assets/avatars/' + ientry.user + '.png'" 
                                    alt=""
                                    @error="$event.target.style.display='none'"
                                />
                            </div>

                            <!-- 3. Tên Player -->
                            <div class="user">
                                <span class="type-label-lg player-name-text">
                                    {{ ientry.user }}
                                </span>
                            </div>

                            <!-- 4. Điểm số -->
                            <div class="total">
                                <span class="score-badge">{{ localize(ientry.total) }} pts</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="player-container" v-if="entry">
                    <div class="player">
                        <!-- Header Profile: Tên bên trái - Ảnh bên phải -->
                        <div class="profile-header-wrap">
                            <div class="profile-title-box">
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
                                <h3>{{ entry.total }} - Hardest: {{ [...entry.verified, ...entry.completed].reduce((min, current) => current.rank < min.rank ? current : min, {rank: 999, level: 'None'}).level }}</h3>
                            </div>

                            <!-- Ảnh Profile -->
                            <div class="profile-avatar-box">
                                <img 
                                    class="profile-user-avatar" 
                                    :src="'assets/avatars/' + entry.user + '.png'" 
                                    alt=""
                                />
                            </div>
                        </div>

                        <h2 v-if="entry.verified.length > 0">Verified ({{ entry.verified.length}})</h2>
                        <table class="table">
                            <tr v-for="score in entry.verified">
                                <td class="rank">
                                    <p :class="'rank-top-' + score.rank">
                                        #{{ score.rank }}
                                    </p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                        <h2 v-if="entry.completed.length > 0">Completed ({{ entry.completed.length }})</h2>
                        <table class="table">
                            <tr v-for="score in entry.completed">
                                <td class="rank">
                                    <p :class="'rank-top-' + score.rank">
                                        #{{ score.rank }}
                                    </p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                        <h2 v-if="entry.progressed.length > 0">Progressed ({{entry.progressed.length}})</h2>
                        <table class="table">
                            <tr v-for="score in entry.progressed">
                                <td class="rank">
                                    <p :class="'rank-top-' + score.rank">
                                        #{{ score.rank }}
                                    </p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.percent }}% {{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                        <h2 v-if="this.list.flat().map((levle, i) => ({ name: levle?.name, index: i })).filter(idk => idk.name && ![...entry.verified, ...entry.completed].map(work => work.level).includes(idk.name)).length > 0">Uncompleted ({{this.list.flat().map((levle, i) => ({ name: levle?.name, index: i })).filter(idk => idk.name && ![...entry.verified, ...entry.completed].map(work => work.level).includes(idk.name)).length}})</h2>
                        <table class="table">
                            <tr v-for="score in this.list.flat().map((levle, i) => ({ name: levle?.name, index: i })).filter(idk => idk.name && ![...entry.verified, ...entry.completed].map(work => work.level).includes(idk.name))">
                                <td class="rank">
                                    <p>#{{ (score.index / 2) + 1 }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.name }}</a>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    `,
    computed: {
        entry() {
            return this.leaderboard[this.selected];
        },
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
    },
};
