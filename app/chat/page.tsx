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
import { ArrowLeft, X, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { Persona } from "@/types/api";
import { useChat } from "@/hooks/useChat";
import PersonaProfileCard, { CounterpartInfo } from "@/components/chat/PersonaProfileCard";
import ChatBubble from "@/components/chat/ChatBubble";
import StreamingBubble, { TypingIndicator } from "@/components/chat/StreamingBubble";
import ChatInput from "@/components/chat/ChatInput";
import { clearSessionState } from "@/lib/sessionStorage";

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
              backgroundColor: "var(--color-accent)",
              color: "var(--color-btn-primary-text)",
            }}
          >
            {t("chat.leaveYes")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showScene, setShowScene] = useState(true);

  /* 세션/페르소나가 없으면 적절한 화면으로 리다이렉트 */
  useEffect(() => {
    if (!localStorage.getItem("sessionId")) {
      router.replace("/location");
      return;
    }
    if (!localStorage.getItem("myPersona")) {
      router.replace("/persona");
      return;
    }
  }, [router]);

  /* localStorage에서 내 역할 + 상대방 읽기 */
  const [persona, setPersona] = useState<Persona | null>(null);
  const [counterpart, setCounterpart] = useState<CounterpartInfo | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("myPersona");
      if (saved) setPersona(JSON.parse(saved));
      const savedCounter = localStorage.getItem("counterpart");
      if (savedCounter) setCounterpart(JSON.parse(savedCounter));
    } catch { /* 리다이렉트로 처리됨 */ }
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
  } = useChat(persona!);

  /* 시나리오 메타데이터 (localStorage에서 읽기) */
  const [scenarioTitle, setScenarioTitle] = useState<string | null>(null);
  const [scene, setScene] = useState<string | null>(null);
  const [sceneEn, setSceneEnState] = useState<string | null>(null);
  const [koreanLevel, setKoreanLevel] = useState<string>("");

  useEffect(() => {
    let sceneValue: string | null = null;
    let sceneEnValue: string | null = null;
    try {
      const raw = localStorage.getItem("scenarioData");
      if (raw) {
        const data = JSON.parse(raw);
        setScenarioTitle(data.scenarioTitle ?? null);
        setKoreanLevel(data.koreanLevel ?? "");
        sceneValue = data.scene || null;
        /* BE는 top-level scene_en을 보내지 않으므로, persona 안의 sceneEn에서 추출 */
        const firstPersona = data.personas ? Object.values(data.personas)[0] as Record<string, unknown> : null;
        sceneEnValue = data.sceneEn || (firstPersona?.sceneEn as string) || null;
      }
    } catch { /* fallback */ }
    /* scene: 역할 선택 후 확정된 값 우선 */
    const savedScene = localStorage.getItem("scene");
    if (savedScene) sceneValue = savedScene;
    const savedSceneEn = localStorage.getItem("sceneEn");
    if (savedSceneEn) sceneEnValue = savedSceneEn;
    setScene(sceneValue);
    setSceneEnState(sceneEnValue);

    try {
      const profile = localStorage.getItem("setupProfile");
      if (profile) {
        const p = JSON.parse(profile);
        if (p.koreanLevel) setKoreanLevel(p.koreanLevel);
      }
    } catch { /* fallback */ }
  }, []);

  /* 한글 미포함 경고 메시지 */
  const [koreanWarning, setKoreanWarning] = useState(false);
  const handleKoreanError = () => {
    setKoreanWarning(true);
    setTimeout(() => setKoreanWarning(false), 5000);
  };

  /* 메시지 추가 시 자동 스크롤 */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiTyping, streamingText]);

  /* 대화 종료 시 대화 기록 저장 */
  useEffect(() => {
    if (isFinished) {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
    }
  }, [isFinished, messages]);

  /* 나가기 확인 — "네": 세션 정리 후 홈으로 (이어하기 제거됨, BE 세션은 고아로 둠) */
  const handleLeaveConfirm = () => {
    setShowLeaveModal(false);
    clearSessionState();
    router.push("/");
  };

  /* 나가기 확인 — "아니오": 팝업만 닫기 */
  const handleLeaveCancel = () => {
    setShowLeaveModal(false);
  };

  /* 페르소나 로딩 대기 (리다이렉트 중이거나 localStorage 파싱 중) */
  if (!persona || !counterpart) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-tab-inactive text-sm">{t("common.loading")}</p>
      </div>
    );
  }

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

        {/* 페르소나 프로필 + 남은 턴 */}
        <PersonaProfileCard
          persona={persona}
          counterpart={counterpart}
        />

        {/* 장면(scene) 별도 박스 — 접기/펼치기 */}
        {scene && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-card-border)",
            }}
          >
            <button
              type="button"
              onClick={() => setShowScene(!showScene)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-[12px] font-medium transition-opacity hover:opacity-70"
              style={{ color: "var(--color-tab-inactive)" }}
            >
              <span className="flex items-center gap-1"><MapPin size={12} strokeWidth={2} />{t("chat.sceneLabel")}</span>
              {showScene ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showScene && (
              <div
                className="px-4 pb-3 text-[12px] leading-relaxed"
                style={{ color: "var(--color-foreground)" }}
              >
                {(isEn && sceneEn) || scene}
              </div>
            )}
          </div>
        )}

        {/* 남은 턴 카운터 (scene 바로 아래, 우측 정렬) */}
        {!isFinished && (
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-tab-inactive">{t("chat.leftTurns")}</span>
              <div
                className="text-[13px] font-medium px-3 py-1 rounded-full"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--color-accent) 15%, transparent)",
                  color: "var(--color-foreground)",
                }}
              >
                {turnsLeft} / {totalTurns}
              </div>
            </div>
          </div>
        )}
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
              onClick={() => router.push("/feedback")}
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

      {/* ── 하단 메타 영역: 좌측 한글 경고(고정) + 우측 결과분석 버튼 ── */}
      {!isFinished && (
        <div className="flex items-end justify-between gap-3 px-4 pb-1.5 min-h-[64px]">
          {/* 좌측: 한글 경고 (고정 영역, visibility로 토글 — 공간 유지) */}
          <div
            className="flex-1 min-w-0"
            style={{ visibility: koreanWarning ? "visible" : "hidden" }}
          >
            <p className="text-[12px] text-tab-inactive leading-tight">
              {t("chat.koreanWarning")}
              <br />
              {t("chat.koreanWarningEn")}
            </p>
          </div>

          {/* 우측: 결과분석 버튼 (중급/고급만) */}
          {(koreanLevel === "중급" || koreanLevel === "고급" || koreanLevel === "Intermediate" || koreanLevel === "Advanced") && (
            <div className="flex flex-col items-end shrink-0">
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
              <p className="text-[13px] text-tab-inactive mt-1 text-right">
                {t("chat.analyzeHint")}
              </p>
            </div>
          )}
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
