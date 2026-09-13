import type { ReactNode } from 'react'
import { useAccordionContext } from './Accordion'
import { useAccordionItemContext } from './AccordionItem'

interface AccordionPanelProps {
  children: ReactNode
}

export function AccordionPanel({ children }: AccordionPanelProps) {
  const id = useAccordionItemContext()
  const { openId } = useAccordionContext()

  if (openId !== id) {
    return null
  }

  return <div className="accordion-panel">{children}</div>
}
