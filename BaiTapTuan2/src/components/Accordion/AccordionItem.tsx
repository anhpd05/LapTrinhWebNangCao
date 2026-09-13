import { createContext, useContext } from "react";
import type { ReactNode } from "react";

const AccordionItemContext = createContext<string | null>(null);
// value == id của item hiện tại, vd : "q2"
export function useAccordionItemContext(): string {
  const id = useContext(AccordionItemContext);
  if (id === null) {
    throw new Error(
      "Accordion.Header/Panel phải được đặt bên trong <Accordion.Item>",
    );
  }
  return id;
}

interface AccordionItemProps {
  id: string;
  children: ReactNode;
}

export function AccordionItem({ id, children }: AccordionItemProps) {
  return (
    <AccordionItemContext.Provider value={id}>
      <div className="accordion-item">{children}</div>
    </AccordionItemContext.Provider>
  );
}
