"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layout } from "../components/Layout";
import { useBooking, Movie } from "../context/BookingContext";
import { Heart, Film, Award, Sparkles, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { selectMovie } = useBooking();
  const [activeTab, setActiveTab] = useState<"chart" | "upcoming">("chart");
  const [likedMovies, setLikedMovies] = useState<string[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Custom slider states
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const isDownRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const hasMovedRef = useRef<boolean>(false);

  // Fetch movies from DB on mount
  useEffect(() => {
    const fetchMovies = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/movies");
        const data = await res.json();
        if (data.success) {
          setMovies(data.movies);
        }
      } catch (err) {
        console.error("홈 영화 리스트 조회 실패:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, []);

  // Reset slider position on tab change
  const handleTabChange = (tab: "chart" | "upcoming") => {
    setActiveTab(tab);
    setCurrentIndex(0);
    setDragOffset(0);
  };

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLikedMovies((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  };

  const handleBooking = (movie: Movie) => {
    if (hasMovedRef.current) return;
    selectMovie(movie);
    router.push("/booking");
  };

  // Filter movies based on active tab
  const filteredMovies = movies.filter((movie) => {
    if (activeTab === "chart") {
      return movie.id !== "spiderman"; // active chart items
    } else {
      return movie.id === "spiderman"; // future release (opens on 7.20)
    }
  });

  // Slide parameters
  const cardWidth = 280;
  const cardGap = 24;
  const slideStep = cardWidth + cardGap; // 304px
  const centerOffset = 100; // Centers the 280px card inside the 480px container ((480 - 280) / 2)

  // Attach global window listeners when dragging starts
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!isDownRef.current) return;
      const walk = e.pageX - dragStartXRef.current;
      
      // If drag distance exceeds 8px, lock click propagation
      if (Math.abs(walk) > 8) {
        hasMovedRef.current = true;
        setIsDragging(true);
      }
      
      setDragOffset(walk);
    };

    const handleWindowMouseUp = (e: MouseEvent) => {
      if (!isDownRef.current) return;
      isDownRef.current = false;
      setIsDragging(false);

      const deltaX = e.pageX - dragStartXRef.current;
      const threshold = 60; // 60px swipe threshold

      if (hasMovedRef.current) {
        if (deltaX < -threshold && currentIndex < filteredMovies.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else if (deltaX > threshold && currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }
      }

      setDragOffset(0);

      // Grace period to allow current click event handlers to finish
      setTimeout(() => {
        hasMovedRef.current = false;
      }, 50);
    };

    // Bind to window when mouse is down, cleans up on mouse up
    if (isDragging || isDownRef.current) {
      window.addEventListener("mousemove", handleWindowMouseMove);
      window.addEventListener("mouseup", handleWindowMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [currentIndex, filteredMovies.length, isDragging]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDownRef.current = true;
    dragStartXRef.current = e.pageX;
    hasMovedRef.current = false;
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const scrollLeft = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const scrollRight = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, filteredMovies.length - 1));
  };

  // Calculate active translate distance
  const currentTranslateX = centerOffset - (currentIndex * slideStep) + dragOffset;

  return (
    <Layout>
      <div className="flex flex-col bg-white">
        
        {/* Category Pill Buttons */}
        <div className="flex items-center space-x-2 px-4 py-3 overflow-x-auto scrollbar-none border-b border-gray-100 bg-gray-50/50">
          <button className="flex items-center space-x-1 px-4 py-2 rounded-full text-xs font-bold bg-neutral-900 text-white shadow-md shadow-neutral-900/10 shrink-0">
            <Film className="w-3.5 h-3.5" />
            <span>영화</span>
          </button>
          <button className="flex items-center space-x-1 px-4 py-2 rounded-full text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all shrink-0">
            <Award className="w-3.5 h-3.5" />
            <span>이벤트/혜택</span>
          </button>
          <button className="flex items-center space-x-1 px-4 py-2 rounded-full text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
            <span>무비웨이브 클럽</span>
          </button>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-50">
          <div className="flex space-x-6">
            <button 
              onClick={() => handleTabChange("chart")}
              className={`text-base font-bold pb-2 relative transition-all ${
                activeTab === "chart" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              무비차트
              {activeTab === "chart" && (
                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-neutral-900 rounded-full"></span>
              )}
            </button>
            <button 
              onClick={() => handleTabChange("upcoming")}
              className={`text-base font-bold pb-2 relative transition-all ${
                activeTab === "upcoming" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              상영예정작
              {activeTab === "upcoming" && (
                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-neutral-900 rounded-full"></span>
              )}
            </button>
          </div>
          <span className="text-xs text-gray-400 font-medium hover:text-gray-600 cursor-pointer">
            전체보기 &rsaquo;
          </span>
        </div>

        {/* Carousel Area Wrapper */}
        <div className="relative group/carousel w-full overflow-hidden select-none min-h-[460px] flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#E71A0F] mb-2" />
              <p className="text-[10px] text-gray-400 font-extrabold">영화 목록을 가져오고 있습니다...</p>
            </div>
          ) : filteredMovies.length === 0 ? (
            <div className="text-xs text-gray-400 font-bold py-20">상영 예정작이 없습니다.</div>
          ) : (
            <>
              {/* Floating Left Control */}
              {currentIndex > 0 && (
                <button
                  onClick={scrollLeft}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-25 bg-black/50 hover:bg-black/80 text-white p-2.5 rounded-full backdrop-blur-sm shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer select-none"
                  title="이전 영화"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
              )}

              {/* Floating Right Control */}
              {currentIndex < filteredMovies.length - 1 && (
                <button
                  onClick={scrollRight}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-25 bg-black/50 hover:bg-black/80 text-white p-2.5 rounded-full backdrop-blur-sm shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer select-none"
                  title="다음 영화"
                >
                  <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              )}

              {/* Card Slider Track Container */}
              <div 
                onMouseDown={handleMouseDown}
                onDragStart={(e) => e.preventDefault()}
                className="py-8 w-full flex items-center cursor-grab active:cursor-grabbing"
                style={{
                  transform: `translate3d(${currentTranslateX}px, 0, 0)`,
                  transition: isDragging ? "none" : "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
                  width: `${filteredMovies.length * slideStep + 200}px`
                }}
              >
                {/* Dynamic Movie Cards */}
                {filteredMovies.map((movie, index) => {
                  const isLiked = likedMovies.includes(movie.id);
                  const rank = activeTab === "chart" ? index + 1 : null;
                  const isUpcoming = movie.id === "spiderman";
                  const isFocused = currentIndex === index;

                  return (
                    <div 
                      key={movie.id} 
                      className="shrink-0 flex flex-col transition-all duration-300"
                      style={{ 
                        width: `${cardWidth}px`,
                        marginRight: `${cardGap}px`,
                        opacity: isFocused ? 1 : 0.45,
                        transform: isFocused ? "scale(1)" : "scale(0.93)"
                      }}
                    >
                      {/* Poster Box */}
                      <div className="relative group rounded-2xl overflow-hidden shadow-xl bg-gray-100 aspect-[2/3] transition-all duration-300">
                        <Link href={`/movies/${movie.id}`} onClick={handleLinkClick}>
                          <img 
                            src={movie.poster} 
                            alt={movie.title}
                            onDragStart={(e) => e.preventDefault()}
                            className="w-full h-full object-cover select-none pointer-events-none"
                          />
                        </Link>

                        {/* Rating Badge Overlay */}
                        <div className="absolute top-3.5 left-3.5 z-10 flex items-center space-x-1.5">
                          <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-md text-white select-none ${
                            movie.ageLimit === "All" ? "bg-green-500" :
                            movie.ageLimit === "12" ? "bg-yellow-500" :
                            movie.ageLimit === "15" ? "bg-orange-500" :
                            movie.ageLimit === "Restricted" ? "bg-red-500" : "bg-gray-400"
                          }`}>
                            {movie.ageLimit === "All" ? "ALL" : movie.ageLimit}
                          </span>
                        </div>

                        {/* Special Format Badges */}
                        <div className="absolute bottom-3 right-3 flex flex-col space-y-1">
                          <span className="bg-black/75 backdrop-blur-sm border border-neutral-700 text-white font-extrabold text-[8px] tracking-wider px-1.5 py-0.5 rounded select-none">
                            SCREENX
                          </span>
                          <span className="bg-black/75 backdrop-blur-sm border border-neutral-700 text-white font-extrabold text-[8px] tracking-wider px-1.5 py-0.5 rounded select-none">
                            4DX
                          </span>
                          <span className="bg-black/75 backdrop-blur-sm border border-neutral-700 text-white font-extrabold text-[8px] tracking-wider px-1.5 py-0.5 rounded select-none">
                            IMAX
                          </span>
                        </div>

                        {/* Heart Button */}
                        <button 
                          onClick={(e) => handleLike(movie.id, e)}
                          className="absolute top-3.5 right-3.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm p-2 rounded-full transition-all text-white hover:scale-105 active:scale-95 z-20"
                        >
                          <Heart className={`w-4 h-4 transition-colors ${
                            isLiked ? "fill-red-500 text-red-500" : "text-white"
                          }`} />
                        </button>

                        {/* Huge Rank Number Overlay */}
                        {rank && (
                          <div className="absolute -bottom-4 left-2 text-[100px] font-black italic tracking-tighter text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] leading-none select-none">
                            {rank}
                          </div>
                        )}
                      </div>

                      {/* Movie Meta Information */}
                      <div className="mt-4 flex flex-col text-center">
                        <h4 className="font-bold text-gray-900 text-base line-clamp-1">
                          {movie.title}
                        </h4>
                        <div className="flex items-center justify-center space-x-1.5 text-xs text-gray-500 mt-1 font-medium">
                          <span>예매율 {movie.bookingRate}</span>
                          <span className="text-gray-300">|</span>
                          {isUpcoming ? (
                            <span className="text-red-500 font-bold">D-17 개봉</span>
                          ) : (
                            <span>관객 {movie.audienceCount}</span>
                          )}
                        </div>

                        {/* Call To Actions */}
                        <div className="mt-4 flex space-x-2">
                          <Link 
                            href={`/movies/${movie.id}`}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 px-3 rounded-xl text-xs transition-colors text-center"
                          >
                            상세보기
                          </Link>
                          {!isUpcoming ? (
                            <button 
                              onClick={() => handleBooking(movie)}
                              className="flex-1 bg-gradient-to-r from-[#FF5E3A] to-[#E71A0F] text-white font-extrabold py-2.5 px-3 rounded-xl text-xs shadow-md shadow-rose-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                              예매하기
                            </button>
                          ) : (
                            <div className="flex-1 bg-gray-150 text-gray-400 font-bold py-2.5 px-3 rounded-xl text-xs text-center select-none cursor-not-allowed">
                              오픈 대기
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* List type indicator */}
        <div className="flex justify-end px-4 py-2 border-t border-gray-100">
          <span className="text-xs text-gray-400 cursor-pointer font-medium hover:text-gray-600">
            &equiv; 리스트형 보기
          </span>
        </div>
      </div>
    </Layout>
  );
}
