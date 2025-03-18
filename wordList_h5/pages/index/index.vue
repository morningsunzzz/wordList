<template>
	<view class="container">
		<!-- 词库卡片列表 -->
		<view class="word-lib-card" @tap="goToWordList('verbs')">
			<view class="lib-icon">📚</view>
			<text class="lib-title">不规则动词</text>
			<text class="lib-subtitle">{{verbWords.total}}词</text>
			<view class="progress-bar">
				<view class="progress" :style="{width: verbsProgressPercent + '%'}"></view>
			</view>
			<view class="mastered-count">
				<text class="count">{{verbWords.mastered}}</text>
				<text class="label">/{{verbWords.total}}</text>
			</view>
		</view>

		<view class="word-lib-card" @tap="goToWordList('high')">
			<view class="lib-icon">✈️</view>
			<text class="lib-title">牛津高中英语1</text>
			<text class="lib-subtitle">{{highWords.total}}词</text>
			<view class="progress-bar">
				<view class="progress" :style="{width: highProgressPercent + '%'}"></view>
			</view>
			<view class="mastered-count">
				<text class="count">{{highWords.mastered}}</text>
				<text class="label">/{{highWords.total}}</text>
			</view>
		</view>

		<!-- <view class="word-lib-card">
			<view class="lib-icon">💼</view>
			<text class="lib-title">会议场景词汇</text>
			<text class="lib-subtitle">213词</text>
			<view class="progress-bar">
				<view class="progress" :style="{width: '15%'}"></view>
			</view>
		</view> -->
	</view>
</template>

<script>
import verbsData from '../wordList/verbs.js'
import highData from '../highWord/data.js'

export default {
	data() {
		return {
			favorites: [true, false, false],
			verbWords: {
				total: verbsData.length,
				mastered: 0
			},
			highWords: {
				total: highData.length,
				mastered: 0
			}
		}
	},
	computed: {
		verbsProgressPercent() {
			return Math.round((this.verbWords.mastered / this.verbWords.total) * 100) || 0
		},
		highProgressPercent() {
			return Math.round((this.highWords.mastered / this.highWords.total) * 100) || 0
		}
	},
	onShow() {  // 使用 onShow 而不是 onLoad，这样每次回到首页都会更新进度
		this.updateProgress();
	},
	methods: {
		goToWordList(type) {
			const url = type === 'verbs' 
				? '/pages/wordList/wordList'
				: '/pages/highWord/highWord';
			uni.navigateTo({ url });
		},
		toggleFavorite(index) {
			this.$set(this.favorites, index, !this.favorites[index]);
		},
		updateProgress() {
			try {
				// 不规则动词进度
				const verbStatus = uni.getStorageSync('wordStatus');
				if (verbStatus) {
					const wordStatuses = JSON.parse(verbStatus);
					this.verbWords.mastered = Object.values(wordStatuses)
						.filter(status => status === 'mastered')
						.length;
				}

				// 牛津高中英语进度
				const highStatus = uni.getStorageSync('highWordStatus');
				if (highStatus) {
					const wordStatuses = JSON.parse(highStatus);
					this.highWords.mastered = Object.values(wordStatuses)
						.filter(status => status === 'mastered')
						.length;
				}
			} catch (e) {
				console.error('Parse saved status failed:', e);
			}
		}
	}
}
</script>

<style>
	:root {
		--primary-color: #4CAF50;
		--background: #f5f5f5;
	}

	.container {
		padding: 20rpx;
		height: 100vh;
		background: #f5f5f5;
	}

	.word-lib-card {
		background: white;
		border-radius: 24rpx;
		padding: 40rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1);
		position: relative;
	}

	.lib-icon {
		font-size: 48rpx;
		margin-bottom: 30rpx;
	}

	.lib-title {
		font-size: 48rpx;
		font-weight: bold;
		display: block;
		margin-bottom: 16rpx;
	}

	.lib-subtitle {
		color: #666;
		font-size: 28rpx;
		display: block;
		margin-bottom: 30rpx;
	}

	.progress-bar {
		height: 12rpx;
		background: #e0e0e0;
		border-radius: 6rpx;
		margin-bottom: 30rpx;
		overflow: hidden;
	}

	.progress {
		height: 100%;
		background: #4CAF50;
		border-radius: 6rpx;
		transition: width 0.3s;
	}

	.favorite-btn {
		display: none;
	}

	.mastered-count {
		position: absolute;
		bottom: 40rpx;
		right: 40rpx;
		display: flex;
		align-items: baseline;
	}

	.mastered-count .count {
		font-size: 48rpx;
		font-weight: bold;
		color: #4CAF50;
	}

	.mastered-count .label {
		font-size: 28rpx;
		color: #999;
		margin-left: 8rpx;
	}

	/* 字体图标样式 */
	@font-face {
		font-family: "iconfont";
		src: url('https://at.alicdn.com/t/font_2331779_a7zv3xm1e9.ttf') format('truetype');
	}

	.iconfont {
		font-family: "iconfont";
		font-size: 40rpx;
	}

	.icon-star:before {
		content: "\e611";
	}

	.icon-star-filled:before {
		content: "\e612";
	}
</style>
