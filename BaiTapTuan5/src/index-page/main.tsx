import { createRoot } from 'react-dom/client';
import '../shared/styles/app.css';
createRoot(document.getElementById('root')!).render(
  <main className="landing"><p className="eyebrow">BÀI TẬP TUẦN 5 · REACT PERFORMANCE</p><h1>10.000 sản phẩm.<br />Hai cách triển khai.</h1><p>So sánh bảng đầy đủ với bảng ảo hoá, memoization và tải module theo nhu cầu.</p><nav><a href="before.html">Mở bản Before</a><a href="after.html">Mở bản After</a></nav><p>Thêm <code>?n=1000</code>, <code>?n=10000</code> hoặc <code>?n=50000</code> để đổi quy mô. Dữ liệu cố định với seed 42.</p></main>
);
