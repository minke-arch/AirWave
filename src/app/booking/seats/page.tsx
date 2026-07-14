"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layout } from "../../../components/Layout";
import { useBooking } from "../../../context/BookingContext";
import { SeatMap } from "../../../components/SeatMap";
import { ArrowLeft, X, RefreshCw, HelpCircle, Minus, Plus } from "lucide-react";

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"];

export default function SeatsPage() {
  const router = useRouter();
  const {
    selectedMovie,
    selectedDate,
    selectedTime,
    attendees,
    selectedSeats,
    setAttendeeCount,
    toggleSeat,
    clearSeats,
    user,
  } = useBooking();

  const [showFullMap, setShowFullMap] = useState<boolean>(false);
  const [occupiedSeatsList, setOccupiedSeatsList] = useState<string[]>([]);

  // Validate state and redirect back if movie/time isn't selected or user is not logged in
  useEffect(() => {
    if (!selectedMovie || !selectedTime) {
      router.replace("/booking");
      return;
    }

    if (!user) {
      router.replace("/mypage?redirect=/booking/seats");
      return;
    }

    // Load occupied seats for this specific movie, date & time from LocalStorage
    if (typeof window !== "undefined") {
      const storedOccupied = localStorage.getItem("movie_occupied_seats");
      if (storedOccupied) {
        const occupiedMap = JSON.parse(storedOccupied);
        const occupiedKey = `${selectedMovie.id}_${selectedDate}_${selectedTime.time}`;
        setOccupiedSeatsList(occupiedMap[occupiedKey] || []);
      }
    }
  }, [selectedMovie, selectedTime, selectedDate, user, router]);

  if (!selectedMovie || !selectedTime) return null;

  const totalAttendeesCount = attendees.adult + attendees.youth;

  // Price Calculation: Morning Discount (before 11:00 AM) vs Regular
  const isMorningShow = parseInt(selectedTime.time.split(":")[0]) < 11;
  const adultPrice = isMorningShow ? 10000 : 14000;
  const youthPrice = isMorningShow ? 8000 : 11000;
  const totalPrice = (attendees.adult * adultPrice) + (attendees.youth * youthPrice);

  // Formatting date text: e.g. "2026-07-15" to "2026.07.15 (수)"
  const formatDateText = (dateStr: string) => {
    if (!dateStr) return "";
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const d = new Date(dateStr);
    return `${dateStr.replace(/-/g, ".")} (${days[d.getDay()]})`;
  };

  const handleNextStep = () => {
    if (selectedSeats.length !== totalAttendeesCount || totalAttendeesCount === 0) return;
    router.push("/booking/payment");
  };

  return (
    <Layout>
      <div className="flex flex-col bg-white min-h-screen relative pb-24">
        
        {/* Blurred Film Backdrop Header */}
        <div className="relative bg-neutral-900 text-white p-4 pt-12 overflow-hidden border-b border-neutral-800">
          <div 
            className="absolute inset-0 bg-cover bg-center filter blur-lg opacity-25 scale-110"
            style={{ backgroundImage: `url(${selectedMovie.poster})` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#111827]/40 to-[#111827]"></div>

          <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between">
            <button 
              onClick={() => router.back()}
              className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Link 
              href="/booking"
              className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </Link>
          </div>

          <div className="relative z-10 flex flex-col mt-2">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight">{selectedMovie.title}</span>
              <span className="bg-orange-500 text-white text-[8px] font-black px-1 py-0.5 rounded">
                {selectedMovie.ageLimit}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-bold mt-1.5">
              {formatDateText(selectedDate)} &middot; {selectedTime.screen} ({selectedTime.time})
            </p>
          </div>
        </div>

        {/* Audience Count Selectors */}
        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-gray-800 tracking-wider">관람인원</h3>
            <button 
              onClick={() => {
                setAttendeeCount("adult", 0);
                setAttendeeCount("youth", 0);
                clearSeats();
              }}
              className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center space-x-1 font-bold"
            >
              <RefreshCw className="w-3 h-3" />
              <span>초기화</span>
            </button>
          </div>

          <div className="flex flex-col space-y-3">
            {/* Adult Row */}
            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-extrabold text-gray-750">일반</span>
              <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200/60 p-1 rounded-xl shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    if (attendees.adult > 0) {
                      setAttendeeCount("adult", attendees.adult - 1);
                    }
                  }}
                  disabled={attendees.adult === 0}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                    attendees.adult === 0
                      ? "border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed"
                      : "border-gray-200 text-gray-600 bg-white hover:border-gray-400 active:scale-95 cursor-pointer"
                  }`}
                >
                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <span className="w-8 text-center text-xs font-black text-gray-900 select-none">
                  {attendees.adult}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (attendees.adult < 8) {
                      setAttendeeCount("adult", attendees.adult + 1);
                    }
                  }}
                  disabled={attendees.adult === 8}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                    attendees.adult === 8
                      ? "border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed"
                      : "border-gray-200 text-gray-600 bg-white hover:border-gray-400 active:scale-95 cursor-pointer"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Youth Row */}
            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-extrabold text-gray-750">청소년</span>
              <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200/60 p-1 rounded-xl shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    if (attendees.youth > 0) {
                      setAttendeeCount("youth", attendees.youth - 1);
                    }
                  }}
                  disabled={attendees.youth === 0}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                    attendees.youth === 0
                      ? "border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed"
                      : "border-gray-200 text-gray-600 bg-white hover:border-gray-400 active:scale-95 cursor-pointer"
                  }`}
                >
                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <span className="w-8 text-center text-xs font-black text-gray-900 select-none">
                  {attendees.youth}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (attendees.youth < 8) {
                      setAttendeeCount("youth", attendees.youth + 1);
                    }
                  }}
                  disabled={attendees.youth === 8}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                    attendees.youth === 8
                      ? "border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed"
                      : "border-gray-200 text-gray-600 bg-white hover:border-gray-400 active:scale-95 cursor-pointer"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Interactive Panel */}
        <div className="p-4 bg-gray-50 flex-1 flex flex-col">
          {totalAttendeesCount === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
              <HelpCircle className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-xs text-gray-400 font-extrabold leading-relaxed">
                관람 인원(일반 또는 청소년)을<br />
                먼저 상단에서 선택해 주세요.
              </p>
            </div>
          ) : (
            <div className="flex flex-col bg-neutral-900 rounded-2xl p-4 text-white shadow-md border border-neutral-800">
              
              {/* Selected seat summary header */}
              <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
                <div>
                  <h4 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {selectedSeats.length > 0 ? "선택하신 좌석 정보입니다." : "좌석을 선택해 주세요"}
                  </h4>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {selectedSeats.length > 0 ? (
                      selectedSeats.map((seat) => (
                        <span key={seat} className="text-[10px] font-black px-2 py-0.5 rounded-full border border-[#FF2E2E] text-[#FF2E2E] bg-rose-950/20">
                          {seat}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500 font-medium">선택된 좌석 없음 ({selectedSeats.length}/{totalAttendeesCount})</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setShowFullMap(true)}
                  className="bg-white hover:bg-gray-100 text-gray-900 text-[10px] font-black px-3.5 py-2 rounded-xl transition-all shadow-sm shrink-0"
                >
                  {selectedSeats.length > 0 ? "변경" : "선택"}
                </button>
              </div>

              {/* Static Miniature seat preview graphic */}
              <div className="flex flex-col items-center select-none py-4 bg-neutral-950/40 rounded-xl relative overflow-hidden">
                <span className="text-[7px] text-neutral-600 tracking-[0.3em] font-extrabold uppercase mb-3">SCREEN</span>
                <div className="w-[60%] h-[1.5px] bg-neutral-800 rounded-full mb-3"></div>
                
                {/* 5x8 micro seat array for mockup */}
                <div className="grid grid-cols-8 gap-0.5">
                  {Array.from({ length: 40 }).map((_, i) => {
                    const rowLetter = ROWS[Math.floor(i / 8) + 2];
                    const colNum = (i % 8) + 3;
                    const mockSeatId = `${rowLetter}${colNum}`;
                    const isTaken = occupiedSeatsList.includes(mockSeatId);
                    const isSel = selectedSeats.includes(mockSeatId);

                    return (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-[1.5px] ${
                          isSel ? "bg-[#FF2E2E]" : 
                          isTaken ? "bg-neutral-800" : "bg-neutral-600"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Alert check details */}
          <div className="mt-4 flex items-start space-x-2 bg-gray-100/80 p-3 rounded-xl border border-gray-200/50">
            <span className="bg-gray-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5">!</span>
            <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
              꼭 확인해 주세요: 본 상영관은 스마트 시트 운영 중입니다. 고객님께서 예매하신 좌석에서만 관람이 가능합니다.
            </p>
          </div>
        </div>

        {/* Global Bottom CTA booking bar */}
        <div className="fixed bottom-0 md:absolute z-30 w-full max-w-[480px] bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-between shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">최종 결제 금액</span>
            <span className="text-lg font-black text-[#E71A0F]">
              {totalPrice.toLocaleString()}원
            </span>
          </div>

          <button
            onClick={handleNextStep}
            disabled={selectedSeats.length !== totalAttendeesCount || totalAttendeesCount === 0}
            className={`px-8 py-3.5 rounded-xl text-sm font-extrabold transition-all shadow-md ${
              selectedSeats.length === totalAttendeesCount && totalAttendeesCount > 0
                ? "bg-gradient-to-r from-[#FF5E3A] to-[#E71A0F] text-white shadow-rose-500/20 hover:scale-[1.02]"
                : "bg-gray-200 text-gray-400 shadow-none cursor-not-allowed"
            }`}
          >
            결제선택 &rsaquo;
          </button>
        </div>

        {/* FULL SCREEN SEAT SELECT MODAL LAYER */}
        {showFullMap && (
          <div className="fixed inset-y-0 md:inset-y-8 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 bg-[#111827] text-white flex flex-col p-4 md:rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4 shrink-0">
              <div className="flex flex-col">
                <span className="text-sm font-black flex items-center space-x-1 text-white">
                  <span>{selectedTime.screen}</span>
                  <span className="text-gray-500 font-medium text-xs">좌석 선택</span>
                </span>
                <span className="text-[9px] text-neutral-400 font-bold mt-0.5">
                  인원: 일반 {attendees.adult}명, 청소년 {attendees.youth}명 (선택됨: {selectedSeats.length}/{totalAttendeesCount})
                </span>
              </div>
              <button 
                onClick={() => setShowFullMap(false)}
                className="p-1.5 rounded-full hover:bg-neutral-800 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Interactive Seatmap Box */}
            <div className="flex-1 flex flex-col justify-center overflow-y-auto min-h-0">
              <SeatMap
                occupiedSeats={occupiedSeatsList}
                selectedSeats={selectedSeats}
                maxSelectable={totalAttendeesCount}
                onSeatToggle={toggleSeat}
              />
            </div>

            {/* Modal Actions Footer */}
            <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-neutral-400">선택된 좌석:</span>
                <div className="flex space-x-1">
                  {selectedSeats.map((seat) => (
                    <span key={seat} className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FF2E2E] text-white">
                      {seat}
                    </span>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => setShowFullMap(false)}
                className="bg-[#FF2E2E] text-white text-xs font-black px-6 py-3.5 rounded-xl hover:bg-red-600 transition-all shadow-md shadow-rose-500/10"
              >
                선택완료 ({selectedSeats.length}/{totalAttendeesCount})
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
