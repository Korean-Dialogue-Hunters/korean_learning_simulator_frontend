"use client";

/* ──────────────────────────────────────────
   채팅 페이지 (/chat) — TODO #33~#39
   - 상단: 내 페르소나(미션) 카드 + 남은 턴 수
   - 중앙: 말풍선형 채팅 메시지 (스크롤)
   - 하단: 메시지 입력창 + 전송 버튼
   - 사용자가 선택한 페르소나 역할을 맡아 AI 상대방과 대화
   - 대화 종료 시 /result로 자동 이동

   ⚡ BE API 연동 전 mock 응답 사용 중
   🔗 연동: POST /conversation/turn
   ────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft, X } from "lucide-react";
import { Persona } from "@/types/api";
import { useChat } from "@/hooks/useChat";
import PersonaProfileCard, { CounterpartInfo } from "@/components/chat/PersonaProfileCard";
import ChatBubble from "@/components/chat/ChatBubble";
import StreamingBubble, { TypingIndicator } from "@/components/chat/StreamingBubble";
import ChatInput from "@/components/chat/ChatInput";

/* ── 나가기 확인 팝업 ── */
function LeaveConfirmModal({
  onConfirm,
  onCancel,
  t,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
      {/* 백드롭 */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      {/* 모달 */}
      <div
        className="relative w-full max-w-[320px] rounded-2xl p-6 text-center"
        style={{
          backgroundColor: "var(--color-card-bg)",
          border: "1px solid var(--color-card-border)",
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-3 right-3 text-tab-inactive hover:opacity-70"
        >
          <X size={18} />
        </button>
        <p className="text-base font-bold text-foreground mb-2">
          {t("chat.leaveConfirmTitle")}
        </p>
        <p className="text-sm text-tab-inactive mb-6">
          {t("chat.leaveConfirmDesc")}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-foreground)",
            }}
          >
            {t("chat.leaveNo")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{
              backgroundColor: "#DC3C3C",
              color: "#fff",
            }}
          >
            {t("chat.leaveYes")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Fallback (sessionStorage가 비었을 때) ── */
const FALLBACK_PERSONA: Persona = {
  id: "A",
  name: "김민준",
  age: 23,
  gender: "남성",
  role: "대학생",
  mission: "한강 자전거길을 달리다 길을 잃어 도움을 요청하는 대학생",
};
const FALLBACK_COUNTERPART: CounterpartInfo = {
  name: "이서연",
  age: 28,
  role: "직장인",
};

export default function ChatPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  /* 활성 세션이 없으면 장소 선택으로 리다이렉트 */
  useEffect(() => {
    const sessionId = sessionStorage.getItem("sessionId");
    if (!sessionId) {
      router.replace("/location");
      return;
    }
  }, [router]);

  /* sessionStorage에서 내 역할 + 상대방 읽기 */
  const [persona, setPersona] = useState<Persona>(FALLBACK_PERSONA);
  const [counterpart, setCounterpart] = useState<CounterpartInfo>(FALLBACK_COUNTERPART);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("myPersona");
      if (saved) setPersona(JSON.parse(saved));
      const savedCounter = sessionStorage.getItem("counterpart");
      if (savedCounter) setCounterpart(JSON.parse(savedCounter));
    } catch { /* fallback 사용 */ }
  }, []);

  const {
    messages,
    turnsLeft,
    totalTurns,
    usedTurns,
    isFinished,
    isAiTyping,
    streamingText,
    sendMessage,
    onStreamComplete,
    requestAnalysis,
  } = useChat(persona);

  /* 시나리오 메타데이터 (sessionStorage에서 읽기) */
  const [scenarioTitle, setScenarioTitle] = useState<string | null>(null);
  const [scene, setScene] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("scenarioData");
      if (raw) {
        const data = JSON.parse(raw);
        setScenarioTitle(data.scenarioTitle ?? null);
        setScene(data.scene ?? null);
      }
    } catch { /* fallback */ }
  }, []);

  /* 한글 미포함 경고 메시지 */
  const [koreanWarning, setKoreanWarning] = useState(false);
  const handleKoreanError = () => {
    setKoreanWarning(true);
    setTimeout(() => setKoreanWarning(false), 3000);
  };

  /* 메시지 추가 시 자동 스크롤 */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiTyping, streamingText]);

  /* 대화 종료 시 대화 기록 저장 */
  useEffect(() => {
    if (isFinished) {
      sessionStorage.setItem("chatMessages", JSON.stringify(messages));
    }
  }, [isFinished, messages]);

  /* 나가기 확인 — "예": 세션 삭제 후 홈 */
  const handleLeaveConfirm = () => {
    sessionStorage.removeItem("sessionId");
    sessionStorage.removeItem("scenarioData");
    sessionStorage.removeItem("myPersona");
    sessionStorage.removeItem("counterpart");
    sessionStorage.removeItem("turnLimit");
    sessionStorage.removeItem("firstAiMessage");
    sessionStorage.removeItem("chatMessages");
    setShowLeaveModal(false);
    router.push("/");
  };

  /* 나가기 확인 — "아니오": 세션 유지, 홈으로 */
  const handleLeaveCancel = () => {
    setShowLeaveModal(false);
    router.push("/");
  };

  return (
    <div className="flex flex-col h-screen pb-16" style={{ backgroundColor: "var(--color-background)" }}>
      {/* ── 나가기 확인 팝업 ── */}
      {showLeaveModal && (
        <LeaveConfirmModal
          onConfirm={handleLeaveConfirm}
          onCancel={handleLeaveCancel}
          t={t}
        />
      )}

      {/* ── 상단 헤더 ── */}
      <div className="px-4 pt-14 pb-2 space-y-2">
        {/* 나가기 버튼 → 팝업 표시 */}
        <button
          type="button"
          onClick={() => setShowLeaveModal(true)}
          className="flex items-center gap-1 text-sm text-tab-inactive hover:opacity-70 transition-opacity"
        >
          <ArrowLeft size={16} strokeWidth={2} />
          <span>{t("chat.leave")}</span>
        </button>

        {/* 페르소나 프로필 + 남은 턴 (#34, #38) */}
        <PersonaProfileCard
          persona={persona}
          counterpart={counterpart}
          turnsLeft={turnsLeft}
          totalTurns={totalTurns}
          scenarioTitle={scenarioTitle}
          scene={scene}
        />
      </div>

      {/* ── 채팅 메시지 영역 ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* 미션 안내 */}
        {messages.length === 0 && !isAiTyping && (
          <div className="text-center py-8">
            <p className="text-sm text-tab-inactive">
              {t("chat.missionHint")}
            </p>
          </div>
        )}

        {/* 메시지 목록 (#35) */}
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            personaName={msg.speaker === "ai" ? counterpart.name : undefined}
          />
        ))}

        {/* AI 타이핑 인디케이터 */}
        {isAiTyping && !streamingText && (
          <TypingIndicator personaName={counterpart.name} />
        )}

        {/* AI 응답 스트리밍 (#37) */}
        {streamingText && (
          <StreamingBubble
            text={streamingText}
            personaName={counterpart.name}
            onComplete={onStreamComplete}
          />
        )}

        {/* 대화 종료 안내 + 결과 확인 버튼 */}
        {isFinished && (
          <div className="text-center py-6 space-y-4">
            <p className="text-base font-bold text-foreground">
              {t("chat.finished")}
            </p>
            <button
              type="button"
              onClick={() => router.push("/result")}
              className="px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
              style={{
                backgroundColor: "var(--color-accent)",
                color: "var(--color-btn-primary-text)",
              }}
            >
              {t("chat.checkResult")}
            </button>
          </div>
        )}

        {/* 자동 스크롤 앵커 */}
        <div ref={messagesEndRef} />
      </div>

      {/* ── 결과 분석 버튼 (입력창 위, 좌하단) ── */}
      {!isFinished && (
        <div className="px-4 pb-1">
          <button
            type="button"
            onClick={requestAnalysis}
            disabled={usedTurns < 4}
            className="text-[14px] font-medium px-4 py-2 rounded-full transition-all active:scale-95"
            style={{
              backgroundColor: usedTurns >= 4
                ? "var(--color-accent)"
                : "var(--color-surface)",
              color: usedTurns >= 4
                ? "var(--color-btn-primary-text)"
                : "var(--color-tab-inactive)",
              cursor: usedTurns >= 4 ? "pointer" : "not-allowed",
            }}
          >
            {t("chat.analyzeBtn")}
          </button>
          <p className="text-[13px] text-tab-inactive mt-1">
            {t("chat.analyzeHint")}
          </p>
        </div>
      )}

      {/* 한글 미포함 경고 */}
      {koreanWarning && (
        <div className="px-4 pb-1">
          <p className="text-[13px] text-tab-inactive text-center">
            {t("chat.koreanWarning")}
            <br />
            {t("chat.koreanWarningEn")}
          </p>
        </div>
      )}

      {/* ── 하단 입력창 (#36) ── */}
      <ChatInput
        onSend={sendMessage}
        disabled={isFinished}
        sendDisabled={isAiTyping}
        placeholder={isFinished ? t("chat.finishedPlaceholder") : t("chat.placeholder")}
        onKoreanError={handleKoreanError}
      />
    </div>
  );
}
