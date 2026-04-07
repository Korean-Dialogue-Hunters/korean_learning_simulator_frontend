"use client";

import { useEffect } from "react";
import "@/lib/i18n";

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // i18n 초기화는 import 시 자동으로 실행됨
  }, []);

  return <>{children}</>;
}
