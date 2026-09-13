import { AccordionRoot } from './Accordion'
import { AccordionItem } from './AccordionItem'
import { AccordionHeader } from './AccordionHeader'
import { AccordionPanel } from './AccordionPanel'

export const Accordion = Object.assign(AccordionRoot, {
  Item: AccordionItem,
  Header: AccordionHeader,
  Panel: AccordionPanel,
})
