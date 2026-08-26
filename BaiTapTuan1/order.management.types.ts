// Bài tập buổi 2 - bộ type cho module Quản lý đơn hàng
//
// Quan hệ: Customer 1-n Order, Order 1-n OrderItem, OrderItem n-1 Product
// Nối các bảng bằng id chứ ko nhúng cả object,
// và tránh 1 thông tin bị lặp ở nhiều chỗ rồi sửa thiếu.

// config kiểu dữ liệu mới = enum
enum OrderStatus {
  PENDING = "PENDING", // chờ xác nhận
  CONFIRMED = "CONFIRMED", // đã xác nhận
  SHIPPED = "SHIPPED", // đang giao
  DELIVERED = "DELIVERED", // giao xong
  CANCELED = "CANCELED", // đã huỷ
}

// Hình thức thanh toán cũng là tập đóng nên làm tương tự
enum PaymentMethod {
  COD = "COD", // trả tiền khi nhận hàng
  CREDIT_CARD = "CREDIT_CARD",
  PAYPAL = "PAYPAL",
  BANK_TRANSFER = "BANK_TRANSFER", // chuyển khoản
}

// Khách hàng - độc lập, ko cần biết tới bảng nào khác.
// id để string vì giả định dùng UUID
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface Product {
  id: string;
  name: string;
  price: number; // giá hiện tai, có thể đổi bất cứ lúc nào
  stock: number; // tồn kho
  category: string;
  description?: string; // để dấu ? vì ko phải sp nào cũng có mô tả
}

// Dòng hàng trong đơn
interface OrderItem {
  orderId: string; // FK -> Order
  productId: string; // FK -> Product
  quantity: number;

  // đây là giá đã snapshot lúc kh bấm mua
  unitPrice: number;
}

// Đơn hàng
interface Order {
  id: string;
  customerId: string; // FK -> Customer

  // Riêng items thì nhúng luôn mảng chứ ko dùng id, vì OrderItem là con ruột
  // của đơn, ko có đơn thì item cũng vô nghĩa, luôn đi kèm nhau.
  items: OrderItem[];

  status: OrderStatus;
  paymentMethod: PaymentMethod;
  totalAmount: number; // tổng tiền, server tự tính từ items
  createdAt: Date;
}

// Khuôn chung cho mọi response API, viết 1 lần dùng cho cả 4 thực thể.
// Ko để data: any vì any tắt hết type check
// Để T thì compiler biết chính xác data là cái gì.
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string; // chỉ có khi lỗi hoặc cần thông báo thêm
}

interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number; // tổng số bản ghi, để FE tính đc bao nhiêu trang
}

// 2 khuôn trên dùng đc cho mọi thực thể, lồng nhau cũng đc
type ProductListResponse = ApiResponse<Paginated<Product>>;
type CustomerListResponse = ApiResponse<Paginated<Customer>>;
type OrderDetailResponse = ApiResponse<Order>;

// Generic có ràng buộc: truyền vào cái gì cũng đc nhưng phải có field id,
// nhờ vậy trong hàm mới dám dùng tới id mà ko bị lỗi.
interface Repository<T extends { id: string }> {
  findById(id: string): T | undefined;
  findAll(): T[];
  create(data: Omit<T, "id">): T; // tạo mới thì chưa có id, id do DB sinh
  remove(id: string): boolean;
}

// 1 interface Repository dùng đc cho tất cả bảng, ko phải viết 4 cái riêng
type ProductRepo = Repository<Product>;
type CustomerRepo = Repository<Customer>;
type OrderRepo = Repository<Order>;

// Tạo đơn mới: bỏ mấy field mà server tự sinh. Client gửi lên chưa có id,
// chưa có createdAt, và cũng ko đc tự set status hay totalAmount
// (cho set thì khách sửa totalAmount = 0 là sai logicc).
type CreateOrderDto = Omit<
  // Omit = bỏ field
  Order,
  "id" | "createdAt" | "status" | "totalAmount"
>;

// Sửa sản phẩm: sửa field nào gửi field đó, ko bắt gửi đủ hết
type UpdateProductDto = Partial<Omit<Product, "id">>;
// lồng Partial để biến tất cả field còn lại thành optional trừ id, vì ko muốn sửa id

// Bản rút gọn của khách hàng để nhét vào list đơn hàng
// Chỉ lấy id + name, ko lôi email/phone/address ra cho đỡ lộ thông tin
type CustomerSummary = Pick<Customer, "id" | "name">; // pick = chọn field nào cần giữ lại, bỏ hết còn lại

// Đơn giao xong rồi thì khoá lại ko cho sửa nữa, dùng Readonly
type FinalizedOrder = Readonly<Order>;

// Tạo khách hàng mới cũng bỏ id đi
type CreateCustomerDto = Omit<Customer, "id">;

// Vài ví dụ dùng thử để chứng minh mấy type trên chạy đúng

const sampleOrder: Order = {
  id: "ord-001",
  customerId: "cus-001",
  items: [
    {
      orderId: "ord-001",
      productId: "prd-001",
      quantity: 2,
      unitPrice: 150000, // giá lúc khách bấm mua
    },
  ],
  status: OrderStatus.PENDING,
  paymentMethod: PaymentMethod.COD,
  totalAmount: 300000,
  createdAt: new Date(),
};

// Sửa sản phẩm chỉ cần gửi đúng 1 field, ko cần gửi name/stock/category
const editProduct: UpdateProductDto = { price: 199000 };

// Danh sách khách hàng gọn nhẹ để hiển thị dropdown
const customerList: CustomerSummary[] = [
  { id: "cus-001", name: "Phạm Đức Anh" },
];

// Response phân trang: ApiResponse + Paginated + Product ghép đc vs nhau
const productPage: ProductListResponse = {
  success: true,
  data: {
    items: [
      {
        id: "prd-001",
        name: "Bàn phím cơ",
        price: 150000,
        stock: 20,
        category: "Phụ kiện",
      },
    ],
    page: 1,
    pageSize: 10,
    total: 1,
  },
};

/*
  Giải thích ngắn - vì sao thiết kế như vậy

  Em nối 4 thực thể bằng khoá ngoại dạng id (customerId, orderId, productId)
  thay vì nhúng cả object, vì đây là cách dữ liệu nằm thật trong DB, tránh 1
  thông tin bị lặp nhiều chỗ rồi sửa thiếu. Riêng Order.items thì nhúng mảng,
  vì OrderItem ko sống độc lập đc, luôn thuộc về 1 đơn cụ thể

  unitPrice để trong OrderItem chứ ko lấy từ Product.price, vì giá sản phẩm
  thay đổi theo thời gian nhưng đơn đã đặt phải giữ nguyên giá lúc mua. Đây là
  snapshot giá, ko phải dữ liệu lặp.

  status với paymentMethod chỉ có 1 tập giá trị hữu hạn nên để enum, compiler
  chặn giá trị lạ ngay lúc gõ code, thay vì để kiểu string rồi tới lúc chạy mới
  phát hiện gõ sai chính tả

  ApiResponse<T>, Paginated<T> và Repository<T> là 3 khuôn generic dùng chung
  cho cả 4 thực thể, viết 1 lần thay vì copy 4 lần. Ko dùng any vì any làm mất
  hết type check và autocomplete. Repository còn ràng buộc T extends { id:
  string } để chắc chắn kiểu truyền vào có id mà dùng

  Mỗi Utility Type gắn với 1 tình huống thật: Omit cho DTO tạo mới (bỏ field
  server sinh), Partial cho DTO cập nhật (sửa gì gửi nấy), Pick cho bản rút gọn
  hiển thị (đỡ lộ dữ liệu nhạy cảm), Readonly cho đơn đã chốt (khoá ko cho sửa).

  Ý chính của cả thiết kế là interface gốc làm nguồn sự thật duy nhất, mọi biến
  thể đều dẫn xuất từ đó. Sau này thêm 1 field vào Product thì UpdateProductDto
  tự cập nhật theo, ko phải đi sửa tay từng chỗ và cũng ko sợ sửa thiếu.
*/
