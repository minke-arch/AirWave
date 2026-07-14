"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "../../components/Layout";
import { useBooking, Reservation, Movie } from "../../context/BookingContext";
import { ArrowLeft, Home, Calendar, Armchair, AlertCircle, Sparkles, Loader2 } from "lucide-react";

export default function TicketPage() {
  const router = useRouter();
  const { user, reservations, cancelReservation, fetchReservations, isLoadingReservations } = useBooking();
  const [toastMsg, setToastMsg] = useState<string>("");
  const [recommendMovies, setRecommendMovies] = useState<Movie[]>([]);

  // 1. Fetch recommend movies and refresh reservations on mount
  useEffect(() => {
    if (user) {
      fetchReservations(user.email);
    }

    const fetchRecommendMovies = async () => {
      try {
        const res = await fetch("/api/movies");
        const data = await res.json();
        if (data.success) {
          // 스파이더맨 제외하고 최대 2개 로드
          const filtered = data.movies.filter((m: Movie) => m.id !== "spiderman").slice(0, 2);
          setRecommendMovies(filtered);
        }
      } catch (err) {
        console.error("추천 영화 조회 실패:", err);
      }
    };

    fetchRecommendMovies();
  }, [user]);

  // Filter reservations. Standard behaviour: show only RESERVED status for current logged-in user
  const activeReservations = reservations.filter((r) => {
    const isUserMatch = !user || r.userEmail === user.email; // If logged in, match user
    return isUserMatch && r.status === "RESERVED";
  });

  const handleCancel = async (resId: string) => {
    if (confirm("정말로 이 예매를 취소하시겠습니까?")) {
      const success = await cancelReservation(resId);
      if (success) {
        setToastMsg("예매가 정상적으로 취소되었습니다.");
        setTimeout(() => setToastMsg(""), 3000);
      } else {
        alert("예매 취소 처리 중 오류가 발생했습니다.");
      }
    }
  };

  const formatDateText = (dateStr: string) => {
    if (!dateStr) return "";
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const d = new Date(dateStr);
    return `${dateStr.replace(/-/g, ".")} (${days[d.getDay()]})`;
  };

  return (
    <Layout>
      <div className="flex flex-col bg-gray-50 min-h-screen relative pb-12">
        
        {/* Ticket Header GNB */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-14 z-30">
          <div className="flex items-center space-x-2">
            <button onClick={() => router.back()} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-900" />
            </button>
            <span className="font-extrabold text-gray-900 text-sm">모바일 티켓</span>
          </div>
          <button onClick={() => router.push("/")} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
            <Home className="w-5 h-5 text-gray-900" />
          </button>
        </div>

        {/* Live Cancel Feedback Toast */}
        {toastMsg && (
          <div className="mx-4 mt-3 bg-neutral-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-in fade-in slide-in-from-top-2 duration-150">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Ticket List Content */}
        <div className="p-4 flex flex-col space-y-6">
          {isLoadingReservations ? (
            <div className="w-full flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#E71A0F] mb-2" />
              <p className="text-[10px] text-gray-400 font-extrabold">티켓 정보를 동기화하고 있습니다...</p>
            </div>
          ) : activeReservations.length === 0 ? (
            // EMPTY STATE: Renders characters & recommendation
            <div className="flex flex-col items-center">
              
              {/* Empty Paconi Character Placeholder Card */}
              <div className="flex flex-col items-center py-12 px-6 text-center bg-white rounded-2xl border border-gray-100 shadow-sm w-full my-4">
                {/* Custom Vector Paconi face wrapper */}
                <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center relative mb-4 animate-bounce duration-1000">
                  <div className="w-14 h-14 bg-amber-100 rounded-full flex flex-col justify-center items-center relative">
                    <span className="text-gray-500 font-extrabold text-[8px] tracking-tighter mb-1">MOV</span>
                    <div className="flex space-x-2">
                      <span className="w-1 h-1.5 bg-gray-800 rounded-full"></span>
                      <span className="w-1 h-1.5 bg-gray-800 rounded-full"></span>
                    </div>
                    {/* Cute popcorn crown cloud */}
                    <div className="absolute -top-3 w-10 h-6 bg-white border border-gray-150 rounded-full flex items-center justify-center font-bold text-[7px] text-gray-400">Paconi</div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 font-extrabold leading-relaxed">
                  예매하신 모바일 티켓이 없습니다.
                </p>
              </div>

              {/* Movie Recommendation Slider */}
              <div className="w-full flex flex-col mt-6">
                <div className="flex items-center space-x-1 mb-4 text-gray-800">
                  <Sparkles className="w-4.5 h-4.5 text-amber-500 stroke-[2.2]" />
                  <h3 className="text-sm font-black tracking-wide">지금 예매 가능한 이런 영화는 어떠세요?</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {recommendMovies.map((movie) => (
                    <button
                      key={movie.id}
                      onClick={() => router.push(`/movies/${movie.id}`)}
                      className="flex flex-col text-left bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
                    >
                      <img src={movie.poster} alt={movie.title} className="w-full aspect-[2/3] rounded-xl object-cover shadow-sm bg-gray-50 mb-2" />
                      <span className="font-extrabold text-gray-900 text-xs line-clamp-1">{movie.title}</span>
                      <span className="text-[9px] text-gray-400 font-bold mt-0.5">예매율 {movie.bookingRate}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            // ACTIVE STATE: Renders realistic stubs with barcode
            activeReservations.map((res) => (
              <div 
                key={res.id} 
                className="bg-white rounded-2xl shadow-md border border-gray-150/40 overflow-hidden flex flex-col relative"
              >
                {/* Stub Top Segment */}
                <div className="p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="bg-[#E71A0F] text-white text-[8px] font-black px-2 py-0.5 rounded tracking-wide">
                      예매완료
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">{res.id}</span>
                  </div>

                  <h3 className="text-lg font-black text-gray-900 leading-tight mb-3">
                    {res.movie.title}
                  </h3>

                  <div className="flex flex-col space-y-2 text-xs text-gray-500 font-medium border-y border-gray-50 py-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>일시: {formatDateText(res.date)} &middot; <strong className="text-gray-900">{res.time}</strong></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Armchair className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>극장: {res.theater} &middot; {res.screen}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[#E71A0F]">
                      <Armchair className="w-4 h-4 text-red-400 shrink-0" />
                      <span>좌석: <strong className="font-extrabold">{res.seats.join(", ")}</strong> ({res.seats.length}명)</span>
                    </div>
                  </div>
                </div>

                {/* Tear-off dotted separator stub */}
                <div className="flex items-center justify-between relative px-2 py-1 bg-gray-50">
                  <div className="w-4 h-4 bg-gray-50 border-r border-gray-150/50 rounded-full -ml-4 z-10"></div>
                  <div className="flex-1 border-t-[1.5px] border-dashed border-gray-200"></div>
                  <div className="w-4 h-4 bg-gray-50 border-l border-gray-150/50 rounded-full -mr-4 z-10"></div>
                </div>

                {/* Stub Bottom Segment: Barcode box */}
                <div className="p-5 flex flex-col items-center bg-gray-50">
                  {/* High fidelity CSS generated barcode */}
                  <div 
                    className="w-full max-w-[280px] h-14 bg-white border border-gray-200/60 rounded-lg flex items-center justify-center p-3 relative overflow-hidden"
                    title="모의 예매 바코드"
                  >
                    <div 
                      className="w-full h-full"
                      style={{
                        backgroundImage: "repeating-linear-gradient(90deg, #111827, #111827 2px, transparent 2px, transparent 6px, #111827 6px, #111827 7px, transparent 7px, transparent 11px)"
                      }}
                    />
                  </div>
                  
                  <span className="text-[10px] font-mono text-gray-400 mt-2 tracking-[0.25em]">
                    {res.id.replace("res_", "")}
                  </span>

                  <div className="w-full mt-4 flex space-x-2">
                    <button 
                      onClick={() => handleCancel(res.id)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 hover:border-red-500 hover:text-red-500 text-gray-500 text-xs font-bold transition-all text-center"
                    >
                      예매취소
                    </button>
                    <button 
                      onClick={() => alert("오프라인 입장용 모의 바코드 스캔 화면으로 연결합니다.")}
                      className="flex-1 bg-neutral-900 text-white text-xs font-black py-2.5 rounded-xl hover:bg-neutral-800 transition-colors text-center"
                    >
                      입장권 보기
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
