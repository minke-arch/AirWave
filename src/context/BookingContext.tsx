"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Movie {
  id: string;
  title: string;
  poster: string;
  ageLimit: string; // "12", "15", "All", "Restricted"
  runtime: string;  // "2시간 36분"
  genre: string;
  bookingRate: string; // "47.1%"
  audienceCount: string; // "5,632명"
}

export interface Showtime {
  id?: string;        // DB의 showtime UUID (선택적)
  time: string;       // "10:30"
  endTime: string;    // "13:16"
  screen: string;     // "5관 2D"
  totalSeats: number; // 183
  occupiedSeats: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  isLoggedIn: boolean;
}

export interface Reservation {
  id: string;
  userEmail: string;
  movie: {
    id: string;
    title: string;
    poster: string;
  };
  theater: string;
  screen: string;
  date: string;
  time: string;
  seats: string[];
  totalPrice: number;
  bookedAt: string;
  status: "RESERVED" | "CANCELLED";
}

interface BookingContextType {
  selectedMovie: Movie | null;
  selectedDate: string; // "2026-07-15"
  selectedTime: Showtime | null;
  attendees: {
    adult: number;
    youth: number;
  };
  selectedSeats: string[];
  user: User | null;
  reservations: Reservation[];
  isLoadingReservations: boolean;
  
  selectMovie: (movie: Movie | null) => void;
  selectDate: (date: string) => void;
  selectTime: (time: Showtime | null) => void;
  setAttendeeCount: (type: "adult" | "youth", count: number) => void;
  toggleSeat: (seatId: string) => void;
  clearSeats: () => void;
  clearBookingFlow: () => void;
  
  login: (email: string, name?: string) => Promise<boolean>;
  logout: () => void;
  addReservation: (reservationData: {
    movie: { id: string; title: string; poster: string };
    theater: string;
    screen: string;
    date: string;
    time: string;
    seats: string[];
    totalPrice: number;
  }) => Promise<any>;
  cancelReservation: (resId: string) => Promise<boolean>;
  fetchReservations: (email: string) => Promise<void>;
  holdSeats: (showtimeId: string, seats: string[]) => Promise<{ success: boolean; message?: string }>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const DEFAULT_USER_KEY = "movie_user";

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<Showtime | null>(null);
  const [attendees, setAttendees] = useState<{ adult: number; youth: number }>({ adult: 0, youth: 0 });
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState<boolean>(false);

  // Load user from localstorage and load reservations from API on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem(DEFAULT_USER_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
        fetchReservations(parsedUser.email);
      }
    }
  }, []);

  const selectMovie = (movie: Movie | null) => {
    setSelectedMovie(movie);
    setSelectedTime(null);
    setSelectedSeats([]);
    setAttendees({ adult: 0, youth: 0 });
  };

  const selectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setSelectedSeats([]);
    setAttendees({ adult: 0, youth: 0 });
  };

  const selectTime = (time: Showtime | null) => {
    setSelectedTime(time);
    setSelectedSeats([]);
    setAttendees({ adult: 0, youth: 0 });
  };

  const setAttendeeCount = (type: "adult" | "youth", count: number) => {
    setAttendees((prev) => {
      const updated = { ...prev, [type]: count };
      const totalCapacity = updated.adult + updated.youth;
      if (selectedSeats.length > totalCapacity) {
        setSelectedSeats([]);
      }
      return updated;
    });
  };

  const toggleSeat = (seatId: string) => {
    const totalAllowed = attendees.adult + attendees.youth;
    if (totalAllowed === 0) return; // Must select attendees first

    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      }
      if (prev.length < totalAllowed) {
        return [...prev, seatId];
      }
      // If full, replace the first selected seat
      return [...prev.slice(1), seatId];
    });
  };

  const clearSeats = () => {
    setSelectedSeats([]);
  };

  const clearBookingFlow = () => {
    setSelectedMovie(null);
    setSelectedDate("");
    setSelectedTime(null);
    setAttendees({ adult: 0, youth: 0 });
    setSelectedSeats([]);
  };

  const fetchReservations = async (email: string) => {
    setIsLoadingReservations(true);
    try {
      const res = await fetch(`/api/mypage/reservations?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success) {
        setReservations(data.reservations);
      }
    } catch (err) {
      console.error("예약 내역 조회 실패:", err);
    } finally {
      setIsLoadingReservations(false);
    }
  };

  const login = async (email: string, name: string = "고객") => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        const newUser: User = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          isLoggedIn: true,
        };
        setUser(newUser);
        localStorage.setItem(DEFAULT_USER_KEY, JSON.stringify(newUser));
        await fetchReservations(newUser.email);
        return true;
      }
      return false;
    } catch (err) {
      console.error("로그인 API 호출 에러:", err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(DEFAULT_USER_KEY);
    setReservations([]);
    clearBookingFlow();
  };

  // 10분 임시 선점 요청 API 호출
  const holdSeats = async (showtimeId: string, seats: string[]) => {
    if (!user) return { success: false, message: "로그인이 필요합니다." };
    try {
      const res = await fetch("/api/booking/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showtimeId,
          seats,
          userId: user.id,
        }),
      });
      const data = await res.json();
      return { success: data.success, message: data.message };
    } catch (err) {
      console.error("임시 선점 API 호출 에러:", err);
      return { success: false, message: "네트워크 오류가 발생했습니다." };
    }
  };

  // 최종 결제 및 예약 확정
  const addReservation = async (
    reservationData: {
      movie: { id: string; title: string; poster: string };
      theater: string;
      screen: string;
      date: string;
      time: string;
      seats: string[];
      totalPrice: number;
    }
  ) => {
    if (!user || !selectedTime) {
      throw new Error("로그인 혹은 선택된 상영 시간이 없습니다.");
    }

    try {
      const res = await fetch("/api/booking/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showtimeId: selectedTime.id,
          userId: user.id,
          seats: reservationData.seats,
          totalPrice: reservationData.totalPrice,
          payment: {
            method: "CARD", // 가상 카드 결제 고정
            amount: reservationData.totalPrice,
          },
        }),
      });
      const data = await res.json();

      if (data.success) {
        // 예약 내역 새로고침
        await fetchReservations(user.email);
        return data;
      } else {
        throw new Error(data.message || "예약에 실패했습니다.");
      }
    } catch (err) {
      console.error("최종 예매 확정 API 에러:", err);
      throw err;
    }
  };

  // 예약 취소 API 호출
  const cancelReservation = async (resId: string) => {
    try {
      const res = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: resId }),
      });
      const data = await res.json();

      if (data.success && user) {
        await fetchReservations(user.email);
        return true;
      }
      return false;
    } catch (err) {
      console.error("예약 취소 API 호출 에러:", err);
      return false;
    }
  };

  return (
    <BookingContext.Provider
      value={{
        selectedMovie,
        selectedDate,
        selectedTime,
        attendees,
        selectedSeats,
        user,
        reservations,
        isLoadingReservations,
        selectMovie,
        selectDate,
        selectTime,
        setAttendeeCount,
        toggleSeat,
        clearSeats,
        clearBookingFlow,
        login,
        logout,
        addReservation,
        cancelReservation,
        fetchReservations,
        holdSeats,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
};
