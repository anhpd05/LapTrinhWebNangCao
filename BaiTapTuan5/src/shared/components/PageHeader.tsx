export interface PageHeaderProps {
  page: 'before' | 'after';
  n: number;
}

export function PageHeader({ page, n }: PageHeaderProps) {
  const isBefore = page === 'before';
  const otherPage = isBefore ? 'after.html' : 'before.html';

  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">BÀI TẬP TUẦN 5 · REACT PERFORMANCE</p>
        <h1>Quản lý sản phẩm</h1>
        <p className="page-sub">{n.toLocaleString('vi-VN')} sản phẩm · dữ liệu cố định, seed 42</p>
      </div>
      <nav className="page-nav" aria-label="Chuyển trang">
        <span className={`badge ${isBefore ? 'badge--before' : 'badge--after'}`}>
          {isBefore ? 'Before · chưa tối ưu' : 'After · đã tối ưu'}
        </span>
        <a href={`${otherPage}${window.location.search}`}>{isBefore ? 'Xem bản After' : 'Xem bản Before'}</a>
        <a href="index.html">Trang chủ</a>
      </nav>
    </header>
  );
}
