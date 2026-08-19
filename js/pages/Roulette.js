import { fetchList } from '../content.js';
import { getThumbnailFromId, getYoutubeIdFromUrl, shuffle, getLevelThumbnailR } from '../util.js';

import Spinner from '../components/Spinner.js';
import Btn from '../components/Btn.js';

export default {
    components: { Spinner, Btn },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-roulette">
            <div class="sidebar">
                <p class="type-label-md" style="color: #aaa">
                    Copy of the Extreme Demon Roulette by <a href="https://matcool.github.io/extreme-demon-roulette/" target="_blank">matcool</a>.
                </p>
                <form class="options">
                    <div class="check">
                        <input type="checkbox" id="main" value="Main List" v-model="useMainList">
                        <label for="main">Main List</label>
                    </div>
                    <div class="check">
                        <input type="checkbox" id="extended" value="Extended List" v-model="useExtendedList">
                        <label for="extended">Extended List</label>
                    </div>
                    <Btn @click.native.prevent="onStart">{{ levels.length === 0 ? 'Start' : 'Restart'}}</Btn>
                </form>
                <p class="type-label-md" style="color: #aaa">
                    The roulette saves automatically.
                </p>
                <form class="save">
                    <p>Manual Load/Save</p>
                    <div class="btns">
                        <Btn @click.native.prevent="onImport">Import</Btn>
                        <Btn :disabled="!isActive" @click.native.prevent="onExport">Export</Btn>
                    </div>
                </form>
            </div>
            <section class="levels-container">
                <div class="levels">
                    <template v-if="levels.length > 0">
                        <div class="level" v-for="(level, i) in levels.slice(0, progression.length)" :key="'comp-' + i">
                            <a :href="level?.video" target="_blank" class="video">
                                <img :src="getThumbnailFromId(getYoutubeIdFromUrl(level?.video))" alt="" >
                            </a>
                            <div class="meta" :style="getLevelThumbnailR(i, levels)">
                                <p>#{{ level?.rank }}</p>
                                <h2>{{ level?.name }}</h2>
                                <p style="color: #00b54b; font-weight: 700">{{ progression[i] }}%</p>
                            </div>
                        </div>
                        <div class="level" v-if="!hasCompleted && currentLevel && currentLevel.name">
                            <a :href="currentLevel.video" target="_blank" class="video">
                                <img :src="getThumbnailFromId(getYoutubeIdFromUrl(currentLevel.video))" alt="">
                            </a>
                            <div class="meta" :style="getLevelThumbnailR(this.progression.length, levels)">
                                <p>#{{ currentLevel.rank }}</p>
                                <h2>{{ currentLevel.name }}</h2>
                                <div class="button-holder" style="justify-content: flex-start; align-items: normal;">
                                    <a v-if="currentLevel.scratchLink != null" :href="currentLevel.scratchLink" target="_blank">
                                        <button class="link-button" style="background-color: #f7a935; border-color: #f7a935;">
                                            <img src="../assets/scratchS.svg" class="button-center" style="width:70%;">
                                        </button>
                                    </a>
                                    <a v-if="currentLevel.turbowarpLink != null" :href="currentLevel.turbowarpLink" target="_blank">
                                        <button class="link-button" style="background-color: #ff4c4c; border-color: #ff4c4c;">
                                            <img src="../assets/turbowarpT.svg" class="button-center" style="width:110%;">
                                        </button>
                                    </a>
                                    <a v-if="currentLevel.itchLink != null" :href="currentLevel.itchLink" target="_blank">
                                        <button class="link-button" style="background-color: #fa5c5c; border-color: #fa5c5c;">
                                            <img src="../assets/itchioShop.svg" class="button-center" style="width:100
