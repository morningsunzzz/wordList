<template>
    <view class="container">
        <!-- 搜索框 -->
        <view class="search-box" :style="{ top: searchBoxTop + 'px' }">
            <view class="search-box-inner">
                <input type="text" 
                       class="search-input" 
                       v-model="searchText"
                       placeholder="搜索单词或释义"
                       @input="onSearch"/>
            </view>
        </view>

        <!-- 单词列表 -->
        <view class="word-list">
            <view v-if="filteredWords.length === 0" class="empty-tip">
                <text>暂无匹配的单词</text>
                <text v-if="searchText" class="sub-tip">
                    当前搜索：{{searchText}}
                </text>
            </view>
            
            <transition-group name="list" tag="view">
                <view class="word-card" 
                      v-for="word in filteredWords" 
                      :key="word.word"
                      @tap="toggleDefinition(word)"
                      :class="{
                          'mastered-border': wordStatuses[word.word] === 'mastered',
                          'review-border': wordStatuses[word.word] === 'review'
                      }">
                    
                    <!-- 标记按钮 -->
                    <view class="mark-buttons">
                        <button class="mark-btn mastered" 
                                :class="{active: wordStatuses[word.word] === 'mastered'}"
                                @tap.stop="toggleMark(word.word, 'mastered')">
                            <text>✓</text>
                        </button>
                        <button class="mark-btn review" 
                                :class="{active: wordStatuses[word.word] === 'review'}"
                                @tap.stop="toggleMark(word.word, 'review')">
                            <text>×</text>
                        </button>
                    </view>

                    <!-- 单词信息 -->
                    <view class="word-header">
                        <text class="word-text">{{word.word}}</text>
                        <text class="word-type" v-if="word.type">{{word.type}}</text>
                    </view>

                    <view class="phonetic-container" v-if="word.phonetic">
                        <text class="phonetic">[{{word.phonetic}}]</text>
                        <button class="speak-button" @tap.stop="speak(word.word)">
                            <text>🔊</text>
                        </button>
                    </view>
                    <view class="phonetic-container" v-else>
                        <button class="speak-button" @tap.stop="speak(word.word)">
                            <text>🔊</text>
                        </button>
                    </view>

                    <!-- 释义 -->
                    <view class="definition" :class="{show: word.showDefinition}">
                        <view class="definition-text">
                            <text>{{getFormattedDefinition(word.definition)}}</text>
                        </view>
                    </view>
                </view>
            </transition-group>
        </view>

        <!-- 底部导航 -->
        <view class="bottom-nav">
            <view class="nav-tabs">
                <view class="nav-tab" 
                      v-for="tab in tabs" 
                      :key="tab.filter"
                      :class="{active: currentFilter === tab.filter}"
                      @tap="switchTab(tab.filter)">
                    <text>{{tab.name}}</text>
                </view>
            </view>
            <button class="confirm-btn" @tap="confirmMarkedWords">确认标记</button>
        </view>
    </view>
</template>

<script>
import wordData from './data.js'

export default {
    data() {
        return {
            searchBoxTop: 0,
            words: [],
            searchText: '',
            currentFilter: 'all',
            wordStatuses: {},
            tabs: [
                {name: '全部', filter: 'all'},
                {name: '已掌握', filter: 'mastered'},
                {name: '需复习', filter: 'review'}
            ]
        }
    },
    computed: {
        filteredWords() {
            if (!this.words || !this.words.length) return [];
            
            let filtered = this.words;
            
            // 搜索过滤
            if (this.searchText) {
                const searchTerm = this.searchText.toLowerCase();
                filtered = filtered.filter(word => {
                    return word.word.toLowerCase().includes(searchTerm) ||
                           word.definition.some(def => def.toLowerCase().includes(searchTerm));
                });
            }
            
            // 状态过滤
            if (this.currentFilter !== 'all') {
                filtered = filtered.filter(word => 
                    this.wordStatuses[word.word] === this.currentFilter
                );
            }
            
            return filtered;
        }
    },
    methods: {
        onSearch(e) {
            this.searchText = e.detail.value;
        },
        toggleDefinition(word) {
            this.$set(word, 'showDefinition', !word.showDefinition);
        },
        toggleMark(word, status) {
            if (this.wordStatuses[word] === status) {
                this.$delete(this.wordStatuses, word);
            } else {
                this.$set(this.wordStatuses, word, status);
            }
            this.saveWordStatus();
        },
        saveWordStatus() {
            uni.setStorageSync('highWordStatus', JSON.stringify(this.wordStatuses));
        },
        loadWordStatus() {
            try {
                const savedStatus = uni.getStorageSync('highWordStatus');
                if (savedStatus) {
                    this.wordStatuses = JSON.parse(savedStatus);
                }
            } catch (e) {
                console.error('Load word status failed:', e);
            }
        },
        confirmMarkedWords() {
            this.saveWordStatus();
            uni.showToast({
                title: '标记已保存',
                icon: 'success'
            });
        },
        switchTab(filter) {
            this.currentFilter = filter;
        },
        getFormattedDefinition(definitions) {
            return definitions
                .filter(def => def) // 过滤掉空字符串
                .join('；');        // 用分号连接
        },
        speak(word) {
            // 移除短语中的空格，以确保发音正确
            const cleanWord = word.replace(/\s+/g, '');
            const audio = uni.createInnerAudioContext();
            audio.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanWord)}&type=2`;
            audio.play();
        }
    },
    onLoad() {
        const systemInfo = uni.getSystemInfoSync();
        this.searchBoxTop = systemInfo.statusBarHeight + 44;
        
        this.words = wordData || [];
        this.loadWordStatus();
    }
}
</script>

<style>
/* 页面根样式 */
page {
    background-color: #f5f5f5;
    height: 100%;
}

/* 容器样式 */
.container {
    min-height: 100vh;
    padding: 20rpx;
    padding-top: 160rpx;
    padding-bottom: 180rpx;
    background-color: #f5f5f5;
    box-sizing: border-box;
    width: 100%;
}

/* 搜索框样式 */
.search-box {
    position: fixed;
    left: 0;
    right: 0;
    background: white;
    padding: 20rpx;
    box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.1);
    z-index: 100;
    box-sizing: border-box;
}

.search-box-inner {
    max-width: 100%;
    padding: 0 20rpx;
    box-sizing: border-box;
}

.search-input {
    width: 100%;
    height: 70rpx;
    padding: 0 30rpx;
    border: 2rpx solid #ddd;
    border-radius: 8rpx;
    font-size: 28rpx;
    box-sizing: border-box;
}

/* 单词卡片样式 */
.word-card {
    background: white;
    padding: 40rpx;
    margin-bottom: 30rpx;
    border-radius: 16rpx;
    box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.1);
    position: relative;
    border: 4rpx solid transparent;
    transition: all 0.3s ease;
}

.word-card.mastered-border {
    border-color: #4CAF50;
}

.word-card.review-border {
    border-color: #f44336;
}

/* 标记按钮样式 */
.mark-buttons {
    position: absolute;
    right: 30rpx;
    top: 30rpx;
    display: flex;
    gap: 16rpx;
}

.mark-btn {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    border: 4rpx solid;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
    line-height: 1;
}

.mark-btn::after {
    border: none;
}

.mark-btn.mastered {
    border-color: #4CAF50;
    color: #4CAF50;
}

.mark-btn.mastered.active {
    background: #4CAF50;
    color: white;
}

.mark-btn.review {
    border-color: #f44336;
    color: #f44336;
}

.mark-btn.review.active {
    background: #f44336;
    color: white;
}

/* 单词信息样式 */
.word-header {
    margin-bottom: 20rpx;
    padding-right: 160rpx;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
}

.word-text {
    font-size: 48rpx;
    font-weight: bold;
    color: #333;
    line-height: 1.4;
}

.word-type {
    font-size: 24rpx;
    color: #1976d2;
    background: #e3f2fd;
    padding: 4rpx 12rpx;
    border-radius: 8rpx;
    margin-left: 16rpx;
}

.phonetic-container {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 16rpx;
}

.phonetic {
    font-size: 28rpx;
    color: #666;
}

.speak-button {
    background: none;
    border: none;
    padding: 8rpx;
    margin: 0;
    line-height: 1;
    font-size: 40rpx;
}

.speak-button::after {
    border: none;
}

/* 释义样式 */
.definition {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transition: all 0.3s;
}

.definition.show {
    max-height: 400rpx;
    opacity: 1;
    margin-top: 20rpx;
}

.definition-text {
    font-size: 28rpx;
    color: #333;
    line-height: 1.5;
}

/* 底部导航样式 */
.bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.1);
    z-index: 100;
    padding: 20rpx;
}

.nav-tabs {
    display: flex;
    justify-content: space-around;
    margin-bottom: 20rpx;
}

.nav-tab {
    padding: 16rpx 32rpx;
    color: #666;
    font-size: 28rpx;
    position: relative;
}

.nav-tab.active {
    color: #4CAF50;
}

.nav-tab.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 40rpx;
    height: 4rpx;
    background: #4CAF50;
    border-radius: 2rpx;
}

.confirm-btn {
    width: 90%;
    height: 80rpx;
    background: #4CAF50;
    color: white;
    border-radius: 40rpx;
    font-size: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
}

/* 空状态提示样式 */
.empty-tip {
    text-align: center;
    padding: 40rpx;
    color: #666;
    font-size: 32rpx;
}

.sub-tip {
    display: block;
    margin-top: 20rpx;
    font-size: 28rpx;
    color: #999;
}

/* 列表动画样式 */
.list-enter-active, 
.list-leave-active {
    transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateX(30rpx);
}
</style>
