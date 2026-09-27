# Nhận xét: Zustand so với Redux Toolkit

Bài này dùng một Zustand store riêng (`src/features/favorites/favoritesStore.ts`) cho tính năng sản phẩm yêu thích, còn giỏ hàng vẫn giữ Redux Toolkit

1. Em thấy it boilerplate: một lần use `create` là có cả state lẫn action, không cần slice, `configureStore`, `Provider` hay `dispatch`
2. Thứ 2 là : Component đọc bằng selector hook và chỉ re-render khi giá trị mình chọn đổi, giống `useSelector` nhưng gọn hơn
3. Store nhỏ, tách theo tính năng, gắn thêm vào app đang chạy Redux mà không phải sửa `store.ts`.
4. Nhược điểm tồn tại: RTK có sẵn Immer trong `createSlice`, RTK Query, `createAsyncThunk`, `createEntityAdapter`; với Zustand phải tự viết cập nhật bất biến (hoặc cài `immer` và bọc middleware `immer`) và tự lo dữ liệu từ server.
5. Và có cả những phần nhc nữa là: không ép quy ước (cấu trúc action, luồng một chiều), nhóm đông dễ mỗi người viết store một kiểu; muốn xem lịch sử trên Redux DevTools phải bọc middleware `devtools`
6. Kết luận: state UI nhỏ, độc lập như "yêu thích" hợp với Zustand; server state hoặc state nhiều feature cùng đọc/ghi nên để Redux Toolkit hơn ạ

