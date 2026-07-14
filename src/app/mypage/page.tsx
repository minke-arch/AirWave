"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layout } from "../../components/Layout";
import { useBooking } from "../../context/BookingContext";
import { User, ChevronRight, LogOut, Ticket, Heart, CreditCard, Mail, Key } from "lucide-react";

export default function MyPage() {
  const router = useRouter();
  const { user, login, logout } = useBooking();
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Redirect on mount/state update if user is already logged in and redirect param is present
  useEffect(() => {
    if (user && typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const redirectUrl = searchParams.get("redirect");
      if (redirectUrl) {
        router.push(redirectUrl);
      }
    }
  }, [user, router]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("이메일 주소를 입력해 주세요.");
      return;
    }
    if (!email.includes("@")) {
      setErrorMsg("올바른 이메일 형식이 아닙니다.");
      return;
    }
    login(email, name || "용감한납득이5754");
    setErrorMsg("");

    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const redirectUrl = searchParams.get("redirect");
      if (redirectUrl) {
        router.push(redirectUrl);
      }
    }
  };

  const handleGuestLogin = () => {
    login("guest@moviewave.com", "용감한납득이5754");

    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const redirectUrl = searchParams.get("redirect");
      if (redirectUrl) {
        router.push(redirectUrl);
      }
    }
  };

  return (
    <Layout>
      <div className="flex flex-col bg-white min-h-screen">
        {!user ? (
          // ANONYMOUS: Virtual Login Form
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gray-50/50">
            <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col items-center">
              
              {/* Animated Login Sphere Logo */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF5E3A] to-[#E71A0F] flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-rose-500/20 mb-4 animate-pulse">
                MW
              </div>

              <h2 className="text-lg font-black text-gray-900 tracking-tight">가상 간편 로그인</h2>
              <p className="text-[10px] text-gray-400 font-bold mt-1 text-center leading-normal">
                별도의 비밀번호 없이 이메일만 입력하시면<br />
                로컬 스토리지에 세션이 생성되어 마이페이지를 이용할 수 있습니다.
              </p>

              <form onSubmit={handleLoginSubmit} className="w-full mt-6 space-y-4">
                <div>
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1 block">이메일 주소</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#E71A0F] text-xs font-bold text-gray-700 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1 block">사용자 닉네임 (선택)</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="용감한납득이5754 (기본값)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#E71A0F] text-xs font-bold text-gray-700 outline-none"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-[10px] text-red-500 font-bold text-center">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#E71A0F] hover:bg-red-600 text-white font-extrabold py-3 rounded-xl text-xs shadow-md shadow-red-500/10 active:scale-95 transition-all text-center"
                >
                  로그인하기
                </button>
              </form>

              <div className="relative w-full flex items-center justify-center my-4">
                <hr className="w-full border-gray-150" />
                <span className="absolute px-3 bg-white text-[9px] text-gray-400 font-black uppercase">OR</span>
              </div>

              <button
                onClick={handleGuestLogin}
                className="w-full py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 text-[10px] font-bold transition-all text-center"
              >
                1초 만에 테스트용 계정으로 로그인
              </button>
            </div>
          </div>
        ) : (
          // AUTHENTICATED: My Page Dashboard
          <div className="flex flex-col">
            
            {/* User Profile Summary Box */}
            <div className="p-5 flex items-center justify-between border-b border-gray-50">
              <div className="flex flex-col">
                <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center">
                  {user.name || "용감한납득이5754"} 님
                </h2>
                <button className="text-[10px] text-gray-400 font-bold mt-1 text-left hover:underline">
                  내 등급 보러 가기 &rsaquo;
                </button>
              </div>

              {/* Profile Avatar Holder */}
              <div className="w-12 h-12 bg-gray-150 rounded-full flex items-center justify-center text-gray-400 shrink-0">
                <User className="w-6 h-6 stroke-[1.8]" />
              </div>
            </div>

            {/* Point Progress Bar */}
            <div className="px-5 pb-5">
              <div className="bg-neutral-100 rounded-xl p-3 flex flex-col">
                <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 mb-1">
                  <span>일반 등급</span>
                  <span>10,000점</span>
                </div>
                {/* Horizontal Progress Track */}
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden relative">
                  <div className="absolute left-0 top-0 h-full w-[2%] bg-gradient-to-r from-[#FF5E3A] to-[#E71A0F]"></div>
                  <div className="absolute left-[2%] -top-0.5 px-1 bg-[#E71A0F] text-white text-[7px] font-black rounded-full shadow-sm leading-none h-4 flex items-center">
                    0점
                  </div>
                </div>
              </div>
            </div>

            {/* CJ ONE Point & Coupon Info Card */}
            <div className="px-5 mb-6">
              <div className="bg-gray-50 border border-gray-150/40 rounded-2xl p-4 flex flex-col shadow-sm">
                <div className="flex justify-between items-center border-b border-gray-150/50 pb-3 mb-4">
                  <span className="flex items-center space-x-2 text-xs font-bold text-gray-700">
                    <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-purple-400 via-pink-400 to-amber-300"></span>
                    <span>CJ ONE Point</span>
                  </span>
                  <span className="text-sm font-black text-gray-900">44P</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="flex flex-col items-center">
                    <span className="text-base font-extrabold text-gray-900">8</span>
                    <span className="text-[10px] text-gray-400 mt-0.5 font-bold">쿠폰</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-base font-extrabold text-gray-900">0</span>
                    <span className="text-[10px] text-gray-400 mt-0.5 font-bold">관람/기프트콘</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-base font-extrabold text-gray-900">0</span>
                    <span className="text-[10px] text-gray-400 mt-0.5 font-bold">기간횟수권</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-gray-400 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 stroke-[1.8] text-gray-800" />
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5 font-bold">기프트카드</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Menu Links Grid */}
            <div className="px-5 border-t border-gray-50 pt-4">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block mb-3">나의 정보 관리</span>
              
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs text-gray-800 font-bold">
                <button className="flex items-center justify-between text-left py-2 hover:text-[#E71A0F]">
                  <span>내가 본 영화</span>
                </button>
                <button className="flex items-center justify-between text-left py-2 hover:text-[#E71A0F]">
                  <span>보관함</span>
                </button>
                <button className="flex items-center justify-between text-left py-2 hover:text-[#E71A0F]">
                  <span>스마트결제관리</span>
                </button>
                <Link 
                  href="/ticket"
                  className="flex items-center justify-between text-left py-2 hover:text-[#E71A0F]"
                >
                  <span>예약/결제내역</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                </Link>
                <button className="flex items-center justify-between text-left py-2 hover:text-[#E71A0F]">
                  <span>내 차량번호 조회</span>
                </button>
                <button className="flex items-center justify-between text-left py-2 hover:text-[#E71A0F]">
                  <span>자주가는 CGV</span>
                </button>
              </div>
            </div>

            {/* Simulated Banner promotion */}
            <div className="mx-5 my-8 bg-[#FFF5F5] border border-red-100 rounded-2xl p-4 flex justify-between items-center relative overflow-hidden">
              <div className="flex flex-col text-xs z-10">
                <span className="font-extrabold text-red-500">0원으로 영화보기</span>
                <span className="text-gray-800 font-bold mt-0.5">CGV 회원 대상 특별 혜택</span>
              </div>
              <button className="bg-red-500 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-md shadow-red-500/10 hover:bg-red-600 transition-colors z-10">
                쿠폰 받기 &darr;
              </button>
            </div>

            {/* Logout anchor */}
            <div className="mt-4 pb-12 flex justify-center">
              <button 
                onClick={logout}
                className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center space-x-1 font-bold underline"
              >
                <LogOut className="w-3 h-3" />
                <span>로그아웃 (로컬 가상세션 해제)</span>
              </button>
            </div>

          </div>
        )}
      </div>
    </Layout>
  );
}
