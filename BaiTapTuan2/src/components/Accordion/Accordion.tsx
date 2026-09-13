import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// kho dữ liệu chung cho toàn bộ accordion, bao gôm openId và hàm toggle để mở/đóng panel
interface AccordionContextValue {
  openId: string | null;
  toggle: (id: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

export function useAccordionContext(): AccordionContextValue {
  const ctx = useContext(AccordionContext);
  if (!ctx) {
    throw new Error("Accordion.* phải được đặt bên trong <Accordion>");
  }
  return ctx;
}

interface AccordionRootProps {
  children: ReactNode;
  defaultOpenId?: string | null;
}

export function AccordionRoot({
  children,
  defaultOpenId = null,
}: AccordionRootProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId);

  const toggle = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <AccordionContext.Provider value={{ openId, toggle }}>
      <div className="accordion">{children}</div>
    </AccordionContext.Provider>
  );
}
