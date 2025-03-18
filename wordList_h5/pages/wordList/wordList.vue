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
                      :data-word="word.word"
                      :data-status="wordStatuses[word.word] || ''"
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
                        <text class="word-type">{{word.type}}</text>
                    </view>

                    <view class="word-forms">
                        <view class="word-form" v-for="(form, key) in getWordForms(word)" :key="key">
                            <text class="form-label">{{getFormLabel(key)}}</text>
                            <view class="form-value">
                                <text>{{form.text}}</text>
                                <text class="pronunciation">{{form.phonetic}}</text>
                                <button class="speak-button" @tap.stop="speak(form.text)">
                                    <text>🔊</text>
                                </button>
                            </view>
                        </view>
                    </view>

                    <!-- 标签 -->
                    <view class="tags-container">
                        <text class="tag" v-for="tag in word.tags" :key="tag">{{tag}}</text>
                        <text class="toggle-indicator" :class="{show: word.showDefinition}">▼</text>
                    </view>

                    <!-- 释义 -->
                    <view class="definition" :class="{show: word.showDefinition}">
                        <view class="definition-wrapper">
                            <text class="definition-text">释义：{{word.definition}}</text>
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
import verbsData from './verbs.js'
import { saveStorage, getStorage } from '../../utils/storage.js'

export default {
    data() {
        return {
            searchBoxTop: 0,
            words: [],  // 初始化为空数组
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
    onLoad() {
        // 获取系统信息设置搜索框位置
        const systemInfo = uni.getSystemInfoSync();
        this.searchBoxTop = systemInfo.statusBarHeight + 44;

        // 初始化单词数据
        this.words = verbsData || [];

        // 加载已保存的单词状态
        this.loadWordStatus();
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
                           word.definition.toLowerCase().includes(searchTerm);
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
        speak(word) {
            const audio = uni.createInnerAudioContext();
            audio.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=2`;
            audio.play();
        },
        toggleMark(word, status) {
            if (this.wordStatuses[word] === status) {
                this.$delete(this.wordStatuses, word);
            } else {
                this.$set(this.wordStatuses, word, status);
            }
            // 立即保存状态
            this.saveWordStatus();
        },
        saveWordStatus() {
            saveStorage('wordStatus', this.wordStatuses);
        },
        loadWordStatus() {
            try {
                const savedStatus = getStorage('wordStatus');
                if (savedStatus) {
                    this.wordStatuses = savedStatus;
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
        getFormLabel(key) {
            const labels = {
                'original': '原形',
                'past': '过去式',
                'pastParticiple': '过去分词'
            };
            return labels[key] || key;
        },
        getWordForms(word) {
            return {
                original: {
                    text: word.forms.original,
                    phonetic: word.forms.original_phonetic
                },
                past: {
                    text: word.forms.past,
                    phonetic: word.forms.past_phonetic
                },
                pastParticiple: {
                    text: word.forms.pastParticiple,
                    phonetic: word.forms.pastParticiple_phonetic
                }
            };
        }
    }
}
</script>

<style>
/* 修改页面根样式 */
page {
    background-color: #f5f5f5;
    height: 100%;
}

/* 修改容器样式 */
.container {
    min-height: 100vh;
    padding: 20rpx;
    padding-top: 160rpx;
    padding-bottom: 180rpx;
    background-color: #f5f5f5;
    box-sizing: border-box;
    width: 100%;
}

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
    max-width: 100%; /* 修改这里 */
    padding: 0 20rpx;
    box-sizing: border-box;
}

.search-input {
    width: 100%;
    height: 70rpx; /* 稍微降低高度 */
    padding: 0 30rpx;
    border: 2rpx solid #ddd;
    border-radius: 8rpx;
    font-size: 28rpx; /* 稍微调小字体 */
    box-sizing: border-box;
}

.word-card {
    background: white;
    padding: 40rpx;
    margin-bottom: 30rpx;
    border-radius: 16rpx;
    box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.1);
    position: relative;
    border: 4rpx solid transparent;
    transition: border-color 0.3s;
}

.word-card.mastered-border {
    border-color: #4CAF50;
}

.word-card.review-border {
    border-color: #f44336;
}

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

.word-header {
    margin-bottom: 20rpx;
    padding-right: 160rpx;
}

.word-text {
    font-size: 48rpx;
    font-weight: bold;
    color: #333;
}

.word-type {
    font-size: 24rpx;
    color: #1976d2;
    background: #e3f2fd;
    padding: 4rpx 12rpx;
    border-radius: 8rpx;
    margin-left: 16rpx;
}

.word-forms {
    background: #f8f9fa;
    border-radius: 8rpx;
    padding: 20rpx;
    margin: 20rpx 0;
}

.word-form {
    margin-bottom: 16rpx;
}

.word-form:last-child {
    margin-bottom: 0;
}

.form-label {
    font-size: 24rpx;
    color: #666;
    margin-bottom: 8rpx;
}

.form-value {
    display: flex;
    align-items: center;
    gap: 16rpx;
    font-size: 32rpx;
    color: #2196F3;
}

.pronunciation {
    color: #666;
    font-size: 24rpx;
}

.speak-button {
    background: none;
    border: none;
    padding: 8rpx;
    margin: 0;
    line-height: 1;
}

.speak-button::after {
    border: none;
}

.tags-container {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-top: 20rpx;
    flex-wrap: wrap;
}

.tag {
    background: #e0f2f1;
    color: #00796b;
    padding: 8rpx 16rpx;
    border-radius: 24rpx;
    font-size: 24rpx;
}

.toggle-indicator {
    margin-left: auto;
    color: #666;
    transition: transform 0.3s;
}

.toggle-indicator.show {
    transform: rotate(180deg);
}

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

.definition-wrapper {
    padding: 20rpx 0;
}

.definition-text {
    font-size: 28rpx;
    color: #333;
    line-height: 1.5;
}

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

/* 添加调试样式 */
.debug-info {
    padding: 20rpx;
    background: #fff3cd;
    margin: 20rpx;
    border-radius: 8rpx;
}

/* 添加空状态提示样式 */
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

/* 添加列表动画样式 */
.list-enter-active, 
.list-leave-active {
    transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateX(30rpx);
}

/* 修改列表样式 */
.word-list {
    position: relative;
    width: 100%;
    min-height: calc(100vh - 340rpx); /* 减去顶部和底部的padding */
    background-color: #f5f5f5;
}

.word-card {
    /* 添加 transform 过渡 */
    transition: all 0.3s ease;
    /* 其他样式保持不变 */
}
</style> 