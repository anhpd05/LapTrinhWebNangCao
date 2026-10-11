import '@testing-library/jest-dom'

// jsdom không có fetch; RTK Query cảnh báo khi import store nếu thiếu.
// Mặc định reject để test nào quên mock cũng không gọi mạng thật.
globalThis.fetch = () =>
  Promise.reject(new Error('Test chưa mock fetch: không được gọi mạng thật'))
