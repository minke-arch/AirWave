"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Sparkles, Loader2 } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
}

interface MovieChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_QUESTIONS = [
  "오늘 상영 중인 영화가 뭐야? 🎬",
  "상영 시간표 알려줘! 📅",
  "서울본점 상영관 구조는 어때? 🏛️",
  "결제나 예매 취소 규정은? 💳",
];

export const MovieChatBot: React.FC<MovieChatBotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "안녕하세요! 에어웨이브 AI 비서입니다. 🍿\n영화 스케줄, 극장 시설, 예매/환불 규정 등 궁금하신 점이 있으시면 무엇이든 물어보세요!",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 스크롤 맨 아래로 동기화
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  // 메시지 전송 로직
  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // 최근 10개의 대화만 히스토리로 넘김
      const history = messages
        .filter((m) => m.id !== "welcome")
        .slice(-10);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend, history }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "bot",
            text: data.response,
          },
        ]);
      } else {
        throw new Error(data.error || "응답 처리 오류");
      }
    } catch (error) {
      console.error("챗봇 API 통신 오류:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: "죄송합니다. 네트워크 통신 중 오류가 발생했습니다. 잠시 후 다시 질문해 주세요. 😢",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputValue);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
      {/* 딤 레이어 클릭 시 닫기 */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      {/* 챗봇 바텀 드로어 바디 */}
      <div 
        className="w-full h-[80%] bg-gray-50 rounded-t-3xl flex flex-col shadow-[0_-10px_30px_rgba(0,0,0,0.3)] animate-slide-up border-t border-gray-200"
        style={{
          animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards"
        }}
      >
        {/* 드로어 헤더 */}
        <div className="px-5 py-4 border-b border-gray-200 bg-white rounded-t-3xl flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-rose-500 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 flex items-center">
                에어웨이브 AI 비서
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] bg-rose-50 text-rose-500 font-bold border border-rose-100 flex items-center">
                  <Sparkles className="w-2 h-2 mr-0.5" /> Gemini
                </span>
              </h3>
              <p className="text-[10px] text-gray-400">실시간 영화 정보 답변 중</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 메시지 출력 영역 */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex items-start space-x-2 ${
                msg.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
              }`}
            >
              {msg.sender === "bot" && (
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div 
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs whitespace-pre-line ${
                  msg.sender === "user"
                    ? "bg-rose-500 text-white rounded-tr-none"
                    : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* 로딩 대기 상태 */}
          {isLoading && (
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 text-xs shadow-xs text-gray-400 flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                <span>답변을 작성하고 있어요...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 추천 질문 칩셋 (입력폼 바로 위에 상시 플로팅) */}
        {messages.length === 1 && !isLoading && (
          <div className="px-4 pb-2 bg-gray-50">
            <p className="text-[10px] text-gray-400 font-bold mb-1.5 ml-1">자주 묻는 질문 💡</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="text-[11px] bg-white border border-gray-200 hover:border-rose-400 text-gray-600 hover:text-rose-500 rounded-full px-3 py-1.5 shadow-xs transition-all text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 입력 폼 영역 */}
        <form 
          onSubmit={handleFormSubmit}
          className="p-3 bg-white border-t border-gray-200 flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="질문을 입력해 주세요..."
            disabled={isLoading}
            className="flex-1 border border-gray-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-full px-4 py-2 text-xs outline-none bg-gray-50 focus:bg-white transition-all text-gray-800"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="w-8 h-8 rounded-full bg-rose-500 disabled:bg-gray-200 text-white disabled:text-gray-400 flex items-center justify-center active:scale-95 transition-all shadow-md shadow-rose-500/10"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* 키프레임 슬라이드 애니메이션 스타일 주입 */}
      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
