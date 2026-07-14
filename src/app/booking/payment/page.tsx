"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layout } from "../../../components/Layout";
import { useBooking } from "../../../context/BookingContext";
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronRight, 
  Search, 
  Check, 
  CreditCard,
  Smartphone,
  BookOpen,
  DollarSign,
  Loader2
} from "lucide-react";

export default function PaymentPage() {
  const router = useRouter();
  const {
    selectedMovie,
    selectedDate,
    selectedTime,
    attendees,
    selectedSeats,
    addReservation,
    clearBookingFlow,
    user,
  } = useBooking();

  const [isProductOpen, setIsProductOpen] = useState<boolean>(true);
  const [activePaymentTab, setActivePaymentTab] = useState<"smart" | "general">("general");
  const [selectedMethod, setSelectedMethod] = useState<string>("앱카드");
  const [agreeAll, setAgreeAll] = useState<boolean>(true);
  const [isPaying, setIsPaying] = useState<boolean>(false);

  // Validate state on mount
  useEffect(() => {
    if (!selectedMovie || !selectedTime || selectedSeats.length === 0) {
      router.replace("/booking");
      return;
    }
    if (!user) {
      router.replace("/mypage?redirect=/booking/seats");
      return;
    }
  }, [selectedMovie, selectedTime, selectedSeats, user, router]);

  if (!selectedMovie || !selectedTime || selectedSeats.length === 0) return null;

  const totalAttendeesCount = attendees.adult + attendees.youth;
  const isMorningShow = parseInt(selectedTime.time.split(":")[0]) < 11;
  const adultPrice = isMorningShow ? 10000 : 14000;
  const youthPrice = isMorningShow ? 8000 : 11000;
  const totalPrice = (attendees.adult * adultPrice) + (attendees.youth * youthPrice);

  const formatDateText = (dateStr: string) => {
    if (!dateStr) return "";
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const d = new Date(dateStr);
    return `${dateStr.replace(/-/g, ".")} (${days[d.getDay()]})`;
  };

  const handlePaymentSubmit = () => {
    if (!agreeAll || isPaying) return;
    
    setIsPaying(true);

    // Simulated network processing delay
    setTimeout(() => {
      // Create new reservation and save to LocalStorage
      addReservation({
        movie: {
          id: selectedMovie.id,
          title: selectedMovie.title,
          poster: selectedMovie.poster,
        },
        theater: "CGV 건대입구",
        screen: selectedTime.screen,
        date: selectedDate,
        time: selectedTime.time,
        seats: selectedSeats,
        totalPrice: totalPrice,
      });

      setIsPaying(false);
      clearBookingFlow();
      router.push("/ticket"); // Route to ticket screen
    }, 1800);
  };

  return (
    <Layout>
      <div className="flex flex-col bg-gray-50 min-h-screen relative pb-24">
        
        {/* Payment Navigation Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-14 z-30">
          <div className="flex items-center space-x-2">
            <button onClick={() => router.back()} className="text-gray-900 hover:text-gray-600 transition-colors">
              &lsaquo;
            </button>
            <span className="font-extrabold text-gray-900 text-sm">결제</span>
          </div>
          <span className="text-[10px] text-gray-500 font-extrabold flex items-center space-x-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            <span>건대입구</span>
          </span>
        </div>

        {/* Payment Content Panels */}
        <div className="p-4 flex flex-col space-y-4">
          
          {/* Card 1: Product Summary Accordion */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition-all">
            <button 
              onClick={() => setIsProductOpen(!isProductOpen)}
              className="w-full flex items-center justify-between text-gray-800"
            >
              <span className="text-xs font-black tracking-wide">상품정보 및 할인쿠폰</span>
              {isProductOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {isProductOpen && (
              <div className="mt-4 pt-4 border-t border-gray-50 flex space-x-4">
                <img src={selectedMovie.poster} alt={selectedMovie.title} className="w-16 aspect-[2/3] rounded-lg object-cover shadow-sm bg-gray-50 shrink-0" />
                <div className="flex flex-col justify-center text-xs">
                  <h4 className="font-bold text-gray-900 text-sm">{selectedMovie.title}</h4>
                  <p className="text-gray-500 font-medium mt-1">
                    극장: CGV 건대입구 &middot; {selectedTime.screen}
                  </p>
                  <p className="text-gray-500 font-medium mt-0.5">
                    일시: {formatDateText(selectedDate)} &middot; {selectedTime.time}
                  </p>
                  <p className="text-gray-500 font-bold mt-0.5 text-[#E71A0F]">
                    좌석: {selectedSeats.join(", ")} ({totalAttendeesCount}명)
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400 hover:text-gray-600 cursor-pointer">
              <span className="font-bold text-gray-500">할인쿠폰을 선택해 주세요</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Voucher Selection */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-xs font-black text-gray-800 tracking-wide mb-3">멤버십/관람권/제휴</h3>
            
            <button className="w-full py-3.5 border-b border-gray-50 flex items-center justify-between text-left text-xs font-bold text-gray-700 hover:text-gray-900">
              <span>CGV영화관람권/기프트콘</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            <button className="w-full py-3.5 border-b border-gray-50 flex items-center justify-between text-left text-xs font-bold text-gray-700 hover:text-gray-900">
              <span>CGV기간권/횟수권</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            <button className="mt-3 w-full py-2.5 rounded-xl border border-gray-200 hover:border-gray-400 text-[10px] font-bold text-gray-500 hover:text-gray-800 transition-colors flex items-center justify-center space-x-1.5">
              <Search className="w-3.5 h-3.5" />
              <span>적용 가능한 멤버십/관람권/제휴 확인</span>
            </button>
          </div>

          {/* Card 3: Payment Method Grid */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-xs font-black text-gray-800 tracking-wide mb-3">결제수단</h3>

            {/* Smart vs General Tabs */}
            <div className="flex border border-gray-200 rounded-xl p-1 bg-gray-50/50 mb-4 text-xs font-bold">
              <button 
                onClick={() => setActivePaymentTab("smart")}
                className={`flex-1 py-2 text-center rounded-lg transition-colors ${
                  activePaymentTab === "smart" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                CGV 스마트결제
              </button>
              <button 
                onClick={() => setActivePaymentTab("general")}
                className={`flex-1 py-2 text-center rounded-lg transition-colors ${
                  activePaymentTab === "general" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                일반결제
              </button>
            </div>

            {/* General Payment grids */}
            {activePaymentTab === "general" && (
              <div className="flex flex-col space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    "앱카드", "휴대폰결제", "내통장결제", 
                    "Npay", "EZWELPAY", "toss", 
                    "SmilePay", "PAYCO", "SSGPAY", 
                    "pay", "CJ PAY"
                  ].map((method) => {
                    const isSelected = selectedMethod === method;
                    return (
                      <button
                        key={method}
                        onClick={() => setSelectedMethod(method)}
                        className={`py-3.5 text-center text-[10px] font-extrabold tracking-tight transition-all rounded-xl border flex flex-col items-center justify-center ${
                          isSelected
                            ? "border-[#E71A0F] text-[#E71A0F] bg-rose-50/30 font-black shadow-sm"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        {method === "Npay" && <span className="text-emerald-500 font-extrabold uppercase text-[11px]">N pay</span>}
                        {method === "toss" && <span className="text-blue-500 font-black italic text-[11px]">toss</span>}
                        {method === "pay" && <span className="bg-yellow-400 text-yellow-950 px-1.5 py-0.5 rounded font-black text-[9px] lowercase">pay</span>}
                        {method !== "Npay" && method !== "toss" && method !== "pay" && <span>{method}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Sub Dropdowns (BC Card) */}
                {selectedMethod === "앱카드" && (
                  <div className="flex flex-col space-y-2 pt-2 border-t border-gray-50">
                    <div className="flex items-center justify-between border border-gray-200 rounded-xl px-3.5 py-3 text-xs text-gray-700 font-bold bg-white">
                      <span className="flex items-center space-x-2">
                        <span className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-[8px] text-white font-extrabold">BC</span>
                        <span>BC카드</span>
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-between border border-gray-200 rounded-xl px-3.5 py-3 text-xs text-gray-700 font-bold bg-white">
                      <span>페이북/ISP</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                )}

                {/* Notice text box */}
                <div className="bg-gray-100/80 p-3 rounded-xl border border-gray-200/50 text-[10px] text-gray-500 leading-relaxed font-bold">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>ISP 결제는 임직원 카드 할인이 불가합니다. 일반결제나 PC를 이용하시기 바랍니다.</li>
                    <li>ISP 결제 시 즉시할인은 적용되지 않습니다. 즉시할인 적용을 원하시는 경우 &quot;즉시할인&quot; 메뉴를 이용해주세요.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Smart payment placeholder */}
            {activePaymentTab === "smart" && (
              <div className="py-8 text-center text-xs text-gray-400 font-bold">
                등록된 CGV 스마트결제 수단이 없습니다.
              </div>
            )}

            {/* Point selector (CJ ONE Point) */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded text-[#E71A0F] focus:ring-[#E71A0F]" disabled />
                  <span>CJ ONE 포인트 사용</span>
                </label>
                <span className="text-[10px] font-bold text-red-500">44P</span>
              </div>
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value="포인트부족" 
                  disabled 
                  className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-400 font-bold text-center cursor-not-allowed select-none" 
                />
                <button className="bg-gray-100 text-gray-400 text-xs font-bold px-4 py-2.5 rounded-xl border border-gray-200 cursor-not-allowed" disabled>
                  전액사용
                </button>
              </div>
            </div>

            {/* CJ / CGV Gift cards */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-700 font-bold">
                <span className="flex items-center space-x-2">
                  <input type="checkbox" className="w-4 h-4 rounded" disabled />
                  <span>CJ 기프트카드</span>
                </span>
                <span className="text-[10px] text-gray-400 cursor-not-allowed">조회하기 &rsaquo;</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-700 font-bold">
                <span className="flex items-center space-x-2">
                  <input type="checkbox" className="w-4 h-4 rounded" disabled />
                  <span>CGV 기프트카드</span>
                </span>
                <span className="text-[10px] text-gray-400 cursor-not-allowed">조회하기 &rsaquo;</span>
              </div>
            </div>
          </div>

          {/* Card 4: Final agreement & T&C */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-3">
              <label className="flex items-center space-x-2 text-xs font-black text-gray-900 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={agreeAll} 
                  onChange={(e) => setAgreeAll(e.target.checked)} 
                  className="w-4.5 h-4.5 rounded text-[#E71A0F] focus:ring-[#E71A0F] border-gray-300"
                />
                <span>전체 약관 동의하기</span>
              </label>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
            
            <p className="text-[9px] text-gray-400 leading-normal font-bold">
              주문상품 정보 결제 대행 서비스, 취소 및 환불 규정 안내에 대해 모두 동의합니다.
            </p>

            <div className="mt-4 flex flex-col space-y-3 text-[10px] text-gray-500 font-bold">
              <div className="flex items-center justify-between py-1 cursor-pointer hover:text-gray-800">
                <span>이용/취소/환불 규정 안내</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <div className="flex items-center justify-between py-1 cursor-pointer hover:text-gray-800">
                <span>문화비 소득공제 안내</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>
          </div>

        </div>

        {/* Global Bottom CTA booking bar */}
        <div className="fixed bottom-0 md:absolute z-30 w-full max-w-[480px] bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-between shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">최종결제금액</span>
            <span className="text-lg font-black text-[#E71A0F]">
              {totalPrice.toLocaleString()}원
            </span>
          </div>

          <button
            onClick={handlePaymentSubmit}
            disabled={!agreeAll || isPaying}
            className={`px-10 py-3.5 rounded-xl text-sm font-extrabold transition-all shadow-md flex items-center justify-center space-x-2 ${
              agreeAll && !isPaying
                ? "bg-[#E71A0F] text-white hover:bg-red-600 shadow-red-500/10 active:scale-95"
                : "bg-gray-200 text-gray-400 shadow-none cursor-not-allowed"
            }`}
          >
            {isPaying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>승인요청 중...</span>
              </>
            ) : (
              <span>{totalPrice.toLocaleString()}원 결제하기</span>
            )}
          </button>
        </div>
      </div>
    </Layout>
  );
}
