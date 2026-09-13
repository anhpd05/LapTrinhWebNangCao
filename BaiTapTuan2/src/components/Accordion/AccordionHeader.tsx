import type { ReactNode } from 'react'
import { useAccordionContext } from './Accordion'
import { useAccordionItemContext } from './AccordionItem'

interface AccordionHeaderProps {
  children: ReactNode
}

export function AccordionHeader({ children }: AccordionHeaderProps) {
  const id = useAccordionItemContext()
  const { openId, toggle } = useAccordionContext()
  const isOpen = openId === id

  return (
    <button
      type="button"
      className={`accordion-header${isOpen ? ' accordion-header--open' : ''}`}
      aria-expanded={isOpen}
      onClick={() => toggle(id)}
    >
      <span>{children}</span>
      <span className="accordion-header__icon">{isOpen ? '-' : '+'}</span>
    </button>
  )
}
