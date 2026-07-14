"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layout } from "../../components/Layout";
import { useBooking, Movie, Showtime } from "../../context/BookingContext";
import { X, Sun, Loader2 } from "lucide-react";

export default function BookingPage() {
  const router = useRouter();
  const { 
    selectedMovie, 
    selectedDate, 
    selectedTime, 
    selectMovie, 
    selectDate, 
    selectTime,
    user
  } = useBooking();

  const [timeFilter, setTimeFilter] = useState<string>("전체");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState<boolean>(true);
  const [isLoadingShowtimes, setIsLoadingShowtimes] = useState<boolean>(false);

  // Generate 7 days starting from Wednesday, July 15, 2026 to match screenshots
  const dates = React.useMemo(() => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const list = [];
    const startDate = new Date(2026, 6, 15); // July 15, 2026
    
    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(startDate);
      nextDate.setDate(startDate.getDate() + i);
      list.push({
        dayLabel: days[nextDate.getDay()],
        dateNum: nextDate.getDate(),
        formatted: nextDate.toISOString().split("T")[0] // "2026-07-15"
      });
    }
    return list;
  }, []);

  // 1. Fetch active movies on mount
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch("/api/movies");
        const data = await res.json();
        if (data.success) {
          setMovies(data.movies);
          // Pre-select first movie if not selected
          if (!selectedMovie && data.movies.length > 0) {
            selectMovie(data.movies[0]);
          }
        }
      } catch (err) {
        console.error("영화 로드 실패:", err);
      } finally {
        setIsLoadingMovies(false);
      }
    };

    fetchMovies();

    if (!selectedDate) {
      selectDate(dates[0].formatted);
    }
  }, []);

  // 2. Fetch showtimes when selected movie or date changes
  useEffect(() => {
    const fetchShowtimes = async () => {
      if (!selectedMovie || !selectedDate) return;
      setIsLoadingShowtimes(true);
      try {
        const res = await fetch(
          `/api/showtimes?movieId=${encodeURIComponent(selectedMovie.id)}&date=${encodeURIComponent(selectedDate)}`
        );
        const data = await res.json();
        if (data.success) {
          setShowtimes(data.showtimes);
        }
      } catch (err) {
        console.error("상영일정 로드 실패:", err);
      } finally {
        setIsLoadingShowtimes(false);
      }
    };

    fetchShowtimes();
  }, [selectedMovie, selectedDate]);

  const handleMovieSelect = (movie: Movie) => {
    selectMovie(movie);
  };

  const handleDateSelect = (formattedDate: string) => {
    selectDate(formattedDate);
  };

  const handleShowtimeSelect = (timeInfo: Showtime) => {
    selectTime(timeInfo);

    if (!user) {
      if (window.confirm("예매를 진행하려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?")) {
        router.push("/mypage?redirect=/booking/seats");
      }
      return;
    }

    router.push("/booking/seats");
  };

  // Filter showtimes based on selected time-slot filter
  const filteredShowtimes = showtimes.filter((st) => {
    if (timeFilter === "전체") return true;
    const hour = parseInt(st.time.split(":")[0]);
    if (timeFilter === "오전") return hour < 12;
    if (timeFilter === "오후") return hour >= 12 && hour < 18;
    if (timeFilter === "18시 이후") return hour >= 18 && hour < 22;
    if (timeFilter === "심야") return hour >= 22;
    return true;
  });

  return (
    <Layout>
      <div className="flex flex-col bg-white min-h-screen">
        
        {/* Booking Navigation Headers */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-3 text-sm">
            <span className="font-extrabold text-gray-900 border-b-2 border-gray-900 pb-0.5">
              영화별예매
            </span>
            <span className="text-gray-400 font-medium cursor-not-allowed">
              극장별 예매
            </span>
          </div>
          <Link href="/" className="text-gray-500 hover:text-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </Link>
        </div>

        {/* Movie Poster Horizontal Picker */}
        <div className="bg-gray-50 py-4 px-4 overflow-x-auto scrollbar-none flex items-center space-x-4 snap-x snap-mandatory min-h-[140px]">
          {isLoadingMovies ? (
            <div className="w-full flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#E71A0F]" />
            </div>
          ) : (
            movies.map((movie) => {
              const isSelected = selectedMovie?.id === movie.id;
              return (
                <div
                  key={movie.id}
                  onClick={() => handleMovieSelect(movie)}
                  className={`w-[110px] shrink-0 snap-center flex flex-col items-center cursor-pointer transition-all duration-200 ${
                    isSelected ? "scale-105" : "opacity-50 hover:opacity-85"
                  }`}
                >
                  {/* Poster Frame */}
                  <div className={`w-full aspect-[2/3] rounded-xl overflow-hidden shadow bg-gray-200 relative border-2 ${
                    isSelected ? "border-[#E71A0F] shadow-rose-500/10" : "border-transparent"
                  }`}>
                    <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
                    
                    {/* Rating Indicator Overlay */}
                    <span className={`absolute top-1.5 left-1.5 text-[8px] font-black w-4.5 h-4.5 flex items-center justify-center rounded text-white select-none ${
                      movie.ageLimit === "All" ? "bg-green-500" :
                      movie.ageLimit === "12" ? "bg-yellow-500" :
                      movie.ageLimit === "15" ? "bg-orange-500" :
                      movie.ageLimit === "Restricted" ? "bg-red-500" : "bg-gray-400"
                    }`}>
                      {movie.ageLimit === "All" ? "전체" : movie.ageLimit}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Movie Meta Summary Banner */}
        {selectedMovie && (
          <div className="bg-neutral-900 text-white px-4 py-3 flex items-center justify-between text-xs border-y border-neutral-800">
            <div>
              <span className="font-extrabold text-sm">{selectedMovie.title}</span>
              <span className="text-[10px] text-neutral-400 ml-2 font-medium">
                {selectedMovie.runtime} &middot; {selectedMovie.genre}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 hover:underline cursor-pointer">
              전체보기 &rsaquo;
            </span>
          </div>
        )}

        {/* Date Horizontal Tabbar */}
        <div className="flex items-center space-x-3 px-4 py-4 overflow-x-auto scrollbar-none border-b border-gray-100 bg-white">
          {dates.map((d) => {
            const isSelected = selectedDate === d.formatted;
            
            // Sat: Blue, Sun: Red, Default: Gray/Black font
            let dayColor = "text-gray-500";
            if (d.dayLabel === "토") dayColor = "text-blue-500";
            if (d.dayLabel === "일") dayColor = "text-red-500";

            return (
              <button
                key={d.formatted}
                onClick={() => handleDateSelect(d.formatted)}
                className={`flex flex-col items-center p-2 rounded-xl transition-all min-w-[42px] ${
                  isSelected 
                    ? "bg-[#E71A0F] text-white shadow-md shadow-rose-500/10 scale-105" 
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <span className={`text-[10px] font-bold ${isSelected ? "text-white" : dayColor}`}>
                  {d.dayLabel}
                </span>
                <span className="text-base font-extrabold mt-0.5">
                  {d.dateNum}
                </span>
              </button>
            );
          })}
        </div>

        {/* Showtime Slot Filter Pills */}
        <div className="flex items-center space-x-2 px-4 py-3 overflow-x-auto scrollbar-none border-b border-gray-50 bg-gray-50/30">
          {["전체", "오전", "오후", "18시 이후", "심야"].map((slot) => (
            <button
              key={slot}
              onClick={() => setTimeFilter(slot)}
              className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border shrink-0 ${
                timeFilter === slot
                  ? "bg-[#E71A0F] text-white border-[#E71A0F] shadow-sm"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
              }`}
            >
              {slot}
            </button>
          ))}
        </div>

        {/* Cinema Quick selection and Timetable grid */}
        <div className="flex-1 flex flex-col p-4">
          <h3 className="text-xs font-black text-gray-800 tracking-wider mb-4 select-none">
            상영관 시간표 (CGV 건대입구)
          </h3>

          {/* Spiderman Teaser Alert */}
          {selectedMovie?.id === "spiderman" && selectedDate < "2026-07-20" && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-xs text-gray-500 font-extrabold text-center leading-relaxed">
                스파이더맨-브랜드 뉴 데이는 개봉 예정작입니다.<br />
                <span className="text-[#E71A0F]">다음 주 월요일(2026.07.20)</span>부터 예매 시간표가 오픈됩니다.
              </p>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoadingShowtimes && (
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#E71A0F]" />
            </div>
          )}

          {/* Timetable showtime cards list */}
          {!isLoadingShowtimes && (selectedMovie?.id !== "spiderman" || selectedDate >= "2026-07-20") && filteredShowtimes.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-gray-400 text-xs">
              선택한 필터 조건의 상영 스케줄이 없습니다.
            </div>
          )}

          {!isLoadingShowtimes && (selectedMovie?.id !== "spiderman" || selectedDate >= "2026-07-20") && filteredShowtimes.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {filteredShowtimes.map((st) => {
                const remaining = Math.max(st.totalSeats - st.occupiedSeats.length, 0);

                // Early morning discount (before 11:00 AM)
                const isMorning = parseInt(st.time.split(":")[0]) < 11;

                return (
                  <button
                    key={st.id}
                    onClick={() => handleShowtimeSelect(st)}
                    className="flex flex-col items-center p-3 bg-white border border-gray-200 hover:border-[#E71A0F] hover:shadow-md rounded-xl transition-all text-left animate-fade-in"
                  >
                    <div className="flex items-center space-x-1 mb-1">
                      <span className="font-extrabold text-gray-900 text-sm">{st.time}</span>
                      <span className="text-[9px] text-gray-400 font-medium">-{st.endTime}</span>
                    </div>

                    <div className="flex items-center space-x-0.5 text-[9px] font-bold mb-1">
                      <span className="text-blue-500">{remaining}</span>
                      <span className="text-gray-400">/{st.totalSeats}석</span>
                      {isMorning && (
                        <span title="조조할인">
                          <Sun className="w-2.5 h-2.5 text-amber-500 ml-0.5 shrink-0 stroke-[2.5]" />
                        </span>
                      )}
                    </div>

                    <span className="text-[8px] font-bold text-gray-400 select-none">
                      {st.screen}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
