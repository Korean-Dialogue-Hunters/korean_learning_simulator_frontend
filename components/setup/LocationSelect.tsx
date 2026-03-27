"use client";

/* ──────────────────────────────────────────
   LocationSelect 컴포넌트 (따뜻한 무드 리디자인)
   - 가보고 싶은 장소 1가지 선택
   - MVP: 한강만 활성화
   ────────────────────────────────────────── */

import { MapPin, Lock } from "lucide-react";
import { LOCATION_OPTIONS, LocationId } from "@/types/setup";
import { warmCardStyle, warmIconContainerStyle, WARM_THEME } from "@/lib/designSystem";

interface LocationSelectProps {
  value: LocationId | "";
  onChange: (id: LocationId) => void;
}

export default function LocationSelect({ value, onChange }: LocationSelectProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {LOCATION_OPTIONS.map((loc) => {
        const isSelected = value === loc.id;
        const isDisabled = !loc.available;

        return (
          <button
            key={loc.id}
            type="button"
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange(loc.id)}
            className="w-full rounded-2xl px-5 py-4 text-left transition-all flex items-center gap-4"
            style={{
              opacity: isDisabled ? 0.45 : 1,
              cursor: isDisabled ? "not-allowed" : "pointer",
              ...warmCardStyle(isSelected),
            }}
          >
            {/* 아이콘 */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={warmIconContainerStyle(isSelected)}
            >
              {isDisabled ? (
                <Lock size={20} strokeWidth={1.8} />
              ) : (
                <MapPin size={20} strokeWidth={1.8} />
              )}
            </div>
            {/* 텍스트 */}
            <div className="flex-1">
              <span
                className="font-semibold text-[15px]"
                style={{ color: WARM_THEME.text }}
              >
                {loc.label}
              </span>
            </div>
            {/* 비활성 뱃지 */}
            {isDisabled && (
              <span
                className="text-[10px] font-medium rounded-full px-2.5 py-1"
                style={{
                  backgroundColor: WARM_THEME.accentLight,
                  color: WARM_THEME.textSub,
                }}
              >
                준비 중
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
