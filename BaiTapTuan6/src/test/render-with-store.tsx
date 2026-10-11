import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { setupStore } from '../app/store'
import type { RootState } from '../app/store'

interface RenderWithStoreOptions {
  preloadedState?: Partial<RootState>
  store?: ReturnType<typeof setupStore>
}

/** Mỗi lần gọi tạo một store Redux riêng để các test không ảnh hưởng nhau. */
export function renderWithStore(
  ui: ReactElement,
  {
    preloadedState,
    store = setupStore(preloadedState),
  }: RenderWithStoreOptions = {},
) {
  return {
    store,
    user: userEvent.setup(),
    ...render(<Provider store={store}>{ui}</Provider>),
  }
}
