export const saveStorage = (key, data) => {
    if (process.env.VUE_APP_PLATFORM === 'h5') {
        localStorage.setItem(key, JSON.stringify(data));
    } else {
        uni.setStorageSync(key, data);
    }
}

export const getStorage = (key) => {
    if (process.env.VUE_APP_PLATFORM === 'h5') {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }
    return uni.getStorageSync(key);
} 