import { Component } from 'react';
import type { ReactNode } from 'react';

interface Props { resetKey: number; onRetry: () => void; children: ReactNode }
interface State { error: Error | null; resetKey: number }
export class LazyErrorBoundary extends Component<Props, State> {
  state: State = { error: null, resetKey: this.props.resetKey };
  static getDerivedStateFromError(error: Error): Pick<State, 'error'> { return { error }; }
  static getDerivedStateFromProps(props: Props, state: State): State | null {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null;
  }
  render() {
    if (this.state.error) return (
      <section role="alert" className="stats" style={{ minHeight: 320 }}>
        <h2>Không tải được chức năng</h2><p>Kiểm tra kết nối rồi thử lại. Nếu trình duyệt giữ lỗi tải module, hãy tải lại trang.</p>
        <div className="form-actions"><button className="btn btn--ghost" type="button" data-action="retry" onClick={this.props.onRetry}>Thử lại</button><button className="btn btn--primary" type="button" data-action="reload" onClick={() => location.reload()}>Tải lại trang</button></div>
      </section>
    );
    return this.props.children;
  }
}
