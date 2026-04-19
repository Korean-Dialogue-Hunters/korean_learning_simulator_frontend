"use client";

/* ──────────────────────────────────────────
   기록 페이지 (/history)
   - 3개 서브탭: 대화 기록 / 업적 / SCK 수집
   - 대화 기록: BE GET /v1/users/{nickname}/sessions
   - 업적, SCK 수집: 준비중
   ────────────────────────────────────────── */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ClipboardList, Trophy, Sparkles, MapPin, ChevronDown, Star, Layers, MessageCircle, X } from "lucide-react";
import { COMMON_CLASSES } from "@/lib/designSystem";
import { GRADE_COLORS } from "@/types/user";
import { getSavedProfile } from "@/hooks/useSetup";
import { getUserSessions } from "@/lib/api";
import { getStarProgress } from "@/lib/starStorage";
import type { UserSessionItem, UserSessionsSort, SessionProgress } from "@/types/api";

type SubTab = "dialogue" | "achievement" | "sck";

/* ── 세션별 진척도: BE 응답 우선, 없으면 localStorage 폴백 ── */
function toProgress(record: UserSessionItem): SessionProgress {
  const local = getStarProgress(record.sessionId);
  return {
    completed: true,  // 기록에 존재 = 대화 완료
    chosungQuizPassed: record.chosungQuizPassed ?? local.quizPassed ?? false,
    flashcardDone: record.flashcardDone ?? local.flashcardDone ?? false,
  };
}

const SORT_OPTIONS: { key: UserSessionsSort; labelKey: string }[] = [
  { key: "recent", labelKey: "history.sortRecent" },
  { key: "oldest", labelKey: "history.sortOldest" },
  { key: "score_high", labelKey: "history.sortScoreHigh" },
  { key: "score_low", labelKey: "history.sortScoreLow" },
  { key: "location", labelKey: "history.sortLocation" },
];

export default function HistoryPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [tab, setTab] = useState<SubTab>("dialogue");
  const [records, setRecords] = useState<UserSessionItem[]>([]);
  const [sortKey, setSortKey] = useState<UserSessionsSort>(() => {
    if (typeof window === "undefined") return "recent";
    const saved = localStorage.getItem("historySortKey");
    return (saved as UserSessionsSort) || "recent";
  });
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem("hiddenSessionIds");
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    const profile = typeof window !== "undefined" ? getSavedProfile() : null;
    if (!profile) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    if (process.env.NODE_ENV !== "production") {
      console.log("[History] userId:", profile.userId, "nickname:", profile.userNickname);
    }
    getUserSessions(profile.userId, sortKey)
      .then((res) => {
        if (process.env.NODE_ENV !== "production") {
          console.log("[History] sessions response:", res);
        }
        setRecords(res.sessions);
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "";
        if (process.env.NODE_ENV !== "production") {
          console.warn("[History] API error:", msg);
        }
        /* 신규 유저는 BE에 프로필이 없어 404가 정상 → 빈 상태로 처리 */
        if (/\b404\b/.test(msg) || /user profile not found/i.test(msg)) {
          setRecords([]);
          return;
        }
        setError(msg || t("history.loadFailed"));
      })
      .finally(() => setLoading(false));
  }, [sortKey, t]);

  const handleSort = (key: UserSessionsSort) => {
    setSortKey(key);
    localStorage.setItem("historySortKey", key);
    setShowSortMenu(false);
  };

  const handleHide = (sessionId: string) => {
    const next = new Set(hiddenIds);
    next.add(sessionId);
    setHiddenIds(next);
    localStorage.setItem("hiddenSessionIds", JSON.stringify([...next]));
  };

  const visibleRecords = records.filter((r) => !hiddenIds.has(r.sessionId));

  /* 카드 클릭 → /result로 이동
     - viewSessionId(읽기 전용 키)에만 저장해서 진행 중인 세션 상태를 건드리지 않음
     - result 페이지가 viewSessionId를 우선 소비하고 즉시 제거 */
  const handleCardClick = (record: UserSessionItem) => {
    localStorage.setItem("viewSessionId", record.sessionId);
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

          {/* 로딩/에러/목록 */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-center" style={{ color: "#DC3C3C" }}>{error}</p>
            </div>
          ) : visibleRecords.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-tab-inactive text-center">{t("history.empty")}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {visibleRecords.map((record) => (
                <DialogueCard key={record.sessionId} record={record} progress={toProgress(record)} onClick={() => handleCardClick(record)} onHide={() => handleHide(record.sessionId)} t={t} />
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

/* ── 진척도 3항목 정의: 별 안에 표시할 내용 ── */
const PROGRESS_ITEMS: {
  key: keyof SessionProgress;
  inner: "text" | "icon";
  icon?: "message" | "layers";
  text?: string;
}[] = [
  { key: "completed", inner: "icon", icon: "message" },
  { key: "chosungQuizPassed", inner: "text", text: "Q" },
  { key: "flashcardDone", inner: "icon", icon: "layers" },
];

/* ── 대화 기록 카드 ── */
function DialogueCard({
  record,
  progress,
  onClick,
  onHide,
  t,
}: {
  record: UserSessionItem;
  progress: SessionProgress;
  onClick: () => void;
  onHide: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  /* grade 문자열에서 등급 코드만 추출: "Beginner <B>" → "B" */
  const gradeMatch = record.grade.match(/<(\w+)>/);
  const gradeCode = gradeMatch ? gradeMatch[1] : record.grade;
  const gradeColor = GRADE_COLORS[gradeCode as keyof typeof GRADE_COLORS] ?? "var(--color-accent)";

  const dateStr = new Date(record.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={`${COMMON_CLASSES.cardRounded} p-4 text-left w-full transition-all active:scale-[0.98] relative cursor-pointer`}
      style={{
        backgroundColor: "var(--color-card-bg)",
        border: "1px solid var(--color-card-border)",
      }}
      onClick={onClick}
    >
      {/* 좌상단 숨기기 버튼 */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onHide(); }}
        className="absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center transition-opacity opacity-30 hover:opacity-80"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-card-border)" }}
        aria-label={t("history.hide")}
      >
        <X size={10} strokeWidth={2.5} style={{ color: "var(--color-tab-inactive)" }} />
      </button>

      {/* 상단: 장소 + 날짜 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <MapPin size={12} strokeWidth={2} className="text-accent" />
          <span className="text-[11px] font-medium text-accent">{record.location}</span>
        </div>
        <span className="text-[10px] text-tab-inactive">{dateStr}</span>
      </div>

      {/* 시나리오 제목 */}
      <p className="text-[12.4px] font-bold text-foreground mb-2 leading-snug">{record.scenarioTitle}</p>

      {/* 하단: 점수 + 진척도 별 + 등급 */}
      <div className="flex items-center justify-between">
        {/* 좌: 점수 */}
        <div className="flex items-center gap-2">
          <span className="text-[11.4px] text-tab-inactive">{t("history.score")}</span>
          <span className="text-[12.4px] font-bold text-foreground">{record.totalScore10.toFixed(1)}</span>
          <span className="text-[10.5px] text-tab-inactive">/ 10</span>
        </div>

        {/* 우: 진척도 별 3개 + 등급 배지 */}
        <div className="flex items-center gap-1">
          {PROGRESS_ITEMS.map((item) => {
            const done = progress[item.key];
            return (
              <div key={item.key} className="relative flex items-center justify-center" style={{ width: 35, height: 35 }}>
                <Star
                  size={35}
                  strokeWidth={1.3}
                  fill={done ? "var(--color-accent)" : "none"}
                  stroke={done ? "var(--color-accent)" : "var(--color-tab-inactive)"}
                />
                <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: 2 }}>
                  {item.inner === "text" ? (
                    <span
                      className="font-bold text-center"
                      style={{
                        fontSize: "12px",
                        lineHeight: 1,
                        marginTop: "-2px",
                        color: done ? "var(--color-btn-primary-text)" : "var(--color-tab-inactive)",
                      }}
                    >
                      {item.text}
                    </span>
                  ) : item.icon === "message" ? (
                    <MessageCircle
                      size={14}
                      strokeWidth={2.4}
                      style={{ color: done ? "var(--color-btn-primary-text)" : "var(--color-tab-inactive)" }}
                    />
                  ) : (
                    <Layers
                      size={13}
                      strokeWidth={2.2}
                      style={{ color: done ? "var(--color-btn-primary-text)" : "var(--color-tab-inactive)" }}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {/* 등급 배지 */}
          <div
            className="ml-3 text-[14px] font-bold rounded-full flex items-center justify-center"
            style={{
              width: 35,
              height: 35,
              border: `1.5px solid ${gradeColor}`,
              color: gradeColor,
            }}
          >
            {gradeCode}
          </div>
        </div>
      </div>
    </div>
  );
}
