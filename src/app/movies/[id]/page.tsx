"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layout } from "../../../components/Layout";
import { useBooking, Movie } from "../../../context/BookingContext";
import { ArrowLeft, Home, Share2, Heart, Award, Users, Smile, Loader2 } from "lucide-react";

interface MovieDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MovieDetailPage({ params }: MovieDetailPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { selectMovie } = useBooking();
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch movie details from DB on mount
  useEffect(() => {
    const fetchMovie = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/movies");
        const data = await res.json();
        if (data.success) {
          const matched = data.movies.find((m: Movie) => m.id === id);
          setMovie(matched || null);
        }
      } catch (err) {
        console.error("영화 상세 정보 조회 실패:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#111827] text-white min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-[#E71A0F] mb-2" />
          <p className="text-[10px] text-gray-400 font-extrabold">상세 정보를 불러오고 있습니다...</p>
        </div>
      </Layout>
    );
  }

  if (!movie) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white min-h-screen">
          <p className="text-gray-500 font-bold">존재하지 않는 영화입니다.</p>
          <Link href="/" className="mt-4 text-[#E71A0F] font-bold text-sm underline">
            홈으로 돌아가기
          </Link>
        </div>
      </Layout>
    );
  }

  const handleBooking = () => {
    selectMovie(movie);
    router.push("/booking");
  };

  const isUpcoming = movie.id === "spiderman";

  // Map YouTube trailer IDs
  const youtubeTrailerId = movie.id === "hope" ? "1-B_Wec79jM" : 
                           movie.id === "inception" ? "YoHD9XEInc0" : "8Qn_spdM5Zg";

  return (
    <Layout>
      <div className="flex flex-col bg-[#111827] text-white min-h-screen relative pb-12">
        
        {/* Absolute header overlay inside the page container */}
        <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <Link 
              href="/" 
              className="p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors text-white"
            >
              <Home className="w-5 h-5" />
            </Link>
            <button className="p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors text-white">
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsLiked(!isLiked)}
              className="p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors text-white"
            >
              <Heart className={`w-5 h-5 transition-colors ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
            </button>
          </div>
        </div>

        {/* Cinematic Backdrop Banner Image */}
        <div className="w-full relative aspect-[4/5] md:aspect-[3/4] bg-neutral-900">
          <img 
            src={movie.poster} 
            alt={movie.title}
            className="w-full h-full object-cover filter brightness-[0.8]"
          />
          {/* Black fade gradient at the bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-black/30"></div>
          
          {/* Movie Title & Badges Overlay */}
          <div className="absolute bottom-6 left-5 right-5 z-10 flex flex-col">
            <div className="flex items-center space-x-2 mb-2">
              <h2 className="text-2xl font-black tracking-tight text-white leading-tight">
                {movie.title}
              </h2>
              <span className={`text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-md text-white select-none ${
                movie.ageLimit === "All" ? "bg-green-500" :
                movie.ageLimit === "12" ? "bg-yellow-500" :
                movie.ageLimit === "15" ? "bg-orange-500" :
                movie.ageLimit === "Restricted" ? "bg-red-500" : "bg-gray-500"
              }`}>
                {movie.ageLimit === "All" ? "ALL" : movie.ageLimit}
              </span>
            </div>

            <p className="text-xs text-gray-300 font-medium">
              {movie.id === "spiderman" ? "2026.07.29 개봉" : "2026.07.15 개봉"} &middot; {movie.runtime} &middot; {movie.genre}
            </p>

            <div className="flex space-x-1.5 mt-3">
              <span className="bg-white/10 backdrop-blur-sm border border-neutral-700 text-white font-extrabold text-[8px] tracking-wider px-2 py-0.5 rounded">
                SCREENX
              </span>
              <span className="bg-white/10 backdrop-blur-sm border border-neutral-700 text-white font-extrabold text-[8px] tracking-wider px-2 py-0.5 rounded">
                4DX
              </span>
              <span className="bg-white/10 backdrop-blur-sm border border-neutral-700 text-white font-extrabold text-[8px] tracking-wider px-2 py-0.5 rounded">
                IMAX
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Stats Section (3 Circular chips) */}
        <div className="px-5 py-4 grid grid-cols-3 gap-3 bg-neutral-900 border-y border-neutral-800">
          <div className="flex flex-col items-center py-2.5 bg-neutral-950/40 rounded-2xl border border-neutral-800/40">
            <Award className="w-5 h-5 text-rose-500 mb-1" />
            <span className="text-[10px] text-gray-500 font-medium">예매율 1위</span>
            <span className="text-sm font-extrabold text-white mt-0.5">{movie.bookingRate}</span>
          </div>

          <div className="flex flex-col items-center py-2.5 bg-neutral-950/40 rounded-2xl border border-neutral-800/40">
            <Users className="w-5 h-5 text-sky-400 mb-1" />
            <span className="text-[10px] text-gray-500 font-medium">누적관객수</span>
            <span className="text-sm font-extrabold text-white mt-0.5">{movie.audienceCount}</span>
          </div>

          <div className="flex flex-col items-center py-2.5 bg-neutral-950/40 rounded-2xl border border-neutral-800/40">
            <Smile className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-[10px] text-gray-500 font-medium">골든에그</span>
            <span className="text-sm font-extrabold text-white mt-0.5">
              {movie.id === "spiderman" ? "?" : "95%"}
            </span>
          </div>
        </div>

        {/* Synopsis & Movie Trailer Player */}
        <div className="px-5 py-6 flex flex-col space-y-6">
          <div>
            <h3 className="text-sm font-bold text-gray-400 mb-2.5">시놉시스</h3>
            <p className="text-sm text-gray-300 leading-relaxed font-medium">
              {movie.id === "hope" 
                ? "나홍진 감독의 새로운 SF 미스터리 스릴러. 고요한 시골 마을 외곽에서 알 수 없는 외계 물질이 발견되고, 이를 조사하려는 사람들과 봉쇄하려는 정부군 사이의 팽팽한 대립과 극적 생존을 그린다."
                : movie.id === "inception"
                ? "타인의 꿈에 들어가 생각을 훔치는 비밀요원 코브. 마지막 거대한 작전인 '인셉션(생각을 심는 작업)'을 실행하기 위해 설계자와 동료들을 모아 다차원적인 무의식 세계로 진입한다."
                : "남태평양의 아름다운 섬 모투누이. 새로운 위협이 닥치자 조상들의 뜻에 따라 대담한 항해사 모아나는 반신반인 마우이와 함께 새로운 해양 루트를 발견하기 위해 기묘한 신화 속 바다로 향한다."
              }
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-400 mb-3">메인 예고편</h3>
            <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-neutral-800 bg-black">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeTrailerId}?autoplay=0&mute=0`}
                title="Movie Trailer"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>

        {/* Fixed Booking Action Button Bar at Bottom */}
        <div className="fixed bottom-0 md:absolute z-50 w-full max-w-[480px] px-4 py-3 bg-[#111827]/95 backdrop-blur-md border-t border-neutral-800 flex items-center justify-center shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
          {!isUpcoming ? (
            <button 
              onClick={handleBooking}
              className="w-full bg-gradient-to-r from-[#FF5E3A] to-[#E71A0F] text-white text-sm font-extrabold py-3.5 rounded-xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all text-center"
            >
              예매하기
            </button>
          ) : (
            <div className="w-full flex items-center justify-center space-x-2 bg-neutral-800/80 border border-neutral-700 text-gray-400 py-3.5 rounded-xl text-xs font-bold select-none cursor-not-allowed">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-ping"></span>
              <span>차주 예매 오픈 예정</span>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
