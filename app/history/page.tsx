"use client";

/* ──────────────────────────────────────────
   기록 페이지 (/history)
   - 3개 서브탭: 대화 기록 / 업적 / SCK 수집
   - 대화 기록: localStorage 기반 (추후 BE API 전환)
   - 업적, SCK 수집: 준비중
   ────────────────────────────────────────── */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ClipboardList, Trophy, Sparkles, MapPin, ChevronDown } from "lucide-react";
import { COMMON_CLASSES } from "@/lib/designSystem";
import { GRADE_COLORS } from "@/types/user";
import { getHistory, sortHistory, type DialogueRecord, type SortKey } from "@/lib/historyStorage";

type SubTab = "dialogue" | "achievement" | "sck";

const SORT_OPTIONS: { key: SortKey; labelKey: string }[] = [
  { key: "recent", labelKey: "history.sortRecent" },
  { key: "oldest", labelKey: "history.sortOldest" },
  { key: "scoreHigh", labelKey: "history.sortScoreHigh" },
  { key: "scoreLow", labelKey: "history.sortScoreLow" },
  { key: "location", labelKey: "history.sortLocation" },
];

export default function HistoryPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [tab, setTab] = useState<SubTab>("dialogue");
  const [records, setRecords] = useState<DialogueRecord[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    setRecords(sortHistory(getHistory(), sortKey));
  }, [sortKey]);

  const handleSort = (key: SortKey) => {
    setSortKey(key);
    setShowSortMenu(false);
  };

  /* 카드 클릭 → evaluationData 복원 후 feedback 페이지로 이동 */
  const handleCardClick = (record: DialogueRecord) => {
    sessionStorage.setItem("sessionId", record.sessionId);
    router.push("/result");
  };

  const tabs: { id: SubTab; labelKey: string; icon: React.ReactNode }[] = [
    { id: "dialogue", labelKey: "history.tabDialogue", icon: <ClipboardList size={16} /> },
    { id: "achievement", labelKey: "history.tabAchievement", icon: <Trophy size={16} /> },
    { id: "sck", labelKey: "history.tabSck", icon: <Sparkles size={16} /> },
  ];

  return (
    <div className="flex flex-col min-h-screen px-5 pt-16 pb-24" style={{ backgroundColor: "var(--color-background)" }}>
      {/* 헤더 */}
      <h1 className="text-xl font-bold text-foreground mb-4">{t("history.title")}</h1>

      {/* 서브탭 */}
      <div className="flex gap-2 mb-5">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-medium transition-all"
            style={{
              backgroundColor: tab === item.id
                ? "var(--color-accent)"
                : "var(--color-card-bg)",
              color: tab === item.id
                ? "var(--color-btn-primary-text)"
                : "var(--color-tab-inactive)",
              border: tab === item.id
                ? "none"
                : "1px solid var(--color-card-border)",
            }}
          >
            {item.icon}
            <span>{t(item.labelKey)}</span>
          </button>
        ))}
      </div>

      {/* 대화 기록 탭 */}
      {tab === "dialogue" && (
        <>
          {/* 정렬 드롭다운 */}
          <div className="relative mb-4">
            <button
              type="button"
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1 text-[12px] text-tab-inactive hover:opacity-70"
            >
              <span>{t(SORT_OPTIONS.find((o) => o.key === sortKey)?.labelKey ?? "")}</span>
              <ChevronDown size={14} />
            </button>
            {showSortMenu && (
              <div
                className="absolute top-8 left-0 z-20 rounded-xl py-1 shadow-lg min-w-[140px]"
                style={{
                  backgroundColor: "var(--color-card-bg)",
                  border: "1px solid var(--color-card-border)",
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleSort(opt.key)}
                    className="w-full text-left px-4 py-2 text-[12px] transition-colors hover:opacity-70"
                    style={{
                      color: sortKey === opt.key ? "var(--color-accent)" : "var(--color-foreground)",
                      fontWeight: sortKey === opt.key ? 700 : 400,
                    }}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 기록 목록 */}
          {records.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-tab-inactive text-center">{t("history.empty")}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {records.map((record) => (
                <DialogueCard key={record.sessionId} record={record} onClick={() => handleCardClick(record)} t={t} />
              ))}
            </div>
          )}
        </>
      )}

      {/* 업적 탭 */}
      {tab === "achievement" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Trophy size={48} strokeWidth={1.2} className="text-tab-inactive" />
          <p className="text-sm text-tab-inactive">{t("common.comingSoon")}</p>
        </div>
      )}

      {/* SCK 수집 탭 */}
      {tab === "sck" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Sparkles size={48} strokeWidth={1.2} className="text-tab-inactive" />
          <p className="text-sm text-tab-inactive">{t("common.comingSoon")}</p>
        </div>
      )}
    </div>
  );
}

/* ── 대화 기록 카드 ── */
function DialogueCard({
  record,
  onClick,
  t,
}: {
  record: DialogueRecord;
  onClick: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const gradeMatch = record.grade.match(/<(\w+)>/);
  const gradeCode = gradeMatch ? gradeMatch[1] : record.grade;
  const gradeLabel = record.grade.replace(/<\w+>/, "").trim();
  const gradeColor = GRADE_COLORS[gradeCode as keyof typeof GRADE_COLORS] ?? "var(--color-accent)";

  const dateStr = new Date(record.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${COMMON_CLASSES.cardRounded} p-4 text-left w-full transition-all active:scale-[0.98]`}
      style={{
        backgroundColor: "var(--color-card-bg)",
        border: "1px solid var(--color-card-border)",
      }}
    >
      {/* 상단: 장소 + 날짜 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <MapPin size={12} strokeWidth={2} className="text-accent" />
          <span className="text-[11px] font-medium text-accent">{record.location}</span>
        </div>
        <span className="text-[10px] text-tab-inactive">{dateStr}</span>
      </div>

      {/* 시나리오 제목 */}
      <p className="text-[13px] font-bold text-foreground mb-2 leading-snug">{record.scenarioTitle}</p>

      {/* 하단: 점수 + 등급 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-tab-inactive">{t("history.score")}</span>
          <span className="text-[13px] font-bold text-foreground">{record.totalScore10.toFixed(1)}</span>
          <span className="text-[11px] text-tab-inactive">/ 10</span>
        </div>
        <div
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{
            border: `1.5px solid ${gradeColor}`,
            color: gradeColor,
          }}
        >
          {gradeLabel || gradeCode}
        </div>
      </div>
    </button>
  );
}
