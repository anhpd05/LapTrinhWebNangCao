import { Accordion } from './components/Accordion'
import './components/Accordion/Accordion.css'
import { ProductList } from './components/ProductList/ProductList'
import './App.css'

const faqs = [
  {
    id: 'q1',
    question: 'Compound component là gì?',
    answer:
      'Là pattern React trong đó nhiều component con phối hợp với nhau qua Context, thay vì truyền props qua nhiều tầng.',
  },
  {
    id: 'q2',
    question: 'Accordion này có mở nhiều panel cùng lúc không?',
    answer: 'Không. State openId chỉ lưu 1 id duy nhất nên chỉ 1 panel được mở tại một thời điểm.',
  },
  {
    id: 'q3',
    question: 'usePagination hoạt động ra sao?',
    answer:
      'Hook nhận vào mảng dữ liệu và số item/trang, tự tính currentItems, totalPages và cung cấp các hàm điều hướng trang.',
  },
]

function App() {
  return (
    <main className="page">
      <section>
        <h1>Accordion (Compound Component)</h1>
        <Accordion defaultOpenId="q1">
          {faqs.map((faq) => (
            <Accordion.Item key={faq.id} id={faq.id}>
              <Accordion.Header>{faq.question}</Accordion.Header>
              <Accordion.Panel>{faq.answer}</Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </section>

      <section>
        <h1>Danh sách sản phẩm (usePagination)</h1>
        <ProductList />
      </section>
    </main>
  )
}

export default App
