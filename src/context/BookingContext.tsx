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
  time: string;       // "10:30"
  endTime: string;    // "13:16"
  screen: string;     // "5관 2D" 또는 "3관 IMAX"
  totalSeats: number; // 183
  occupiedSeats: string[];
}

export interface User {
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
  
  selectMovie: (movie: Movie | null) => void;
  selectDate: (date: string) => void;
  selectTime: (time: Showtime | null) => void;
  setAttendeeCount: (type: "adult" | "youth", count: number) => void;
  toggleSeat: (seatId: string) => void;
  clearSeats: () => void;
  clearBookingFlow: () => void;
  
  login: (email: string, name?: string) => void;
  logout: () => void;
  addReservation: (reservation: Omit<Reservation, "id" | "userEmail" | "bookedAt" | "status">) => Reservation;
  cancelReservation: (resId: string) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const DEFAULT_USER_KEY = "movie_user";
const DEFAULT_RESERVATIONS_KEY = "movie_reservations";
const DEFAULT_OCCUPIED_SEATS_KEY = "movie_occupied_seats";

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<Showtime | null>(null);
  const [attendees, setAttendees] = useState<{ adult: number; youth: number }>({ adult: 0, youth: 0 });
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  // Load user and reservations from localstorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem(DEFAULT_USER_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      const storedReservations = localStorage.getItem(DEFAULT_RESERVATIONS_KEY);
      if (storedReservations) {
        setReservations(JSON.parse(storedReservations));
      }
    }
  }, []);

  const selectMovie = (movie: Movie | null) => {
    setSelectedMovie(movie);
    // Reset subordinate selections
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
      // If the total attendees is less than already selected seats, clear seats
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

  const login = (email: string, name: string = "고객") => {
    const defaultName = email.split("@")[0] || "사용자";
    const newUser: User = {
      email,
      name: name === "고객" ? defaultName : name,
      isLoggedIn: true,
    };
    setUser(newUser);
    localStorage.setItem(DEFAULT_USER_KEY, JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(DEFAULT_USER_KEY);
    clearBookingFlow();
  };

  const addReservation = (
    reservationData: Omit<Reservation, "id" | "userEmail" | "bookedAt" | "status">
  ) => {
    const newId = `res_${Date.now()}`;
    const userEmail = user?.email || "guest@moviewave.com";
    const newReservation: Reservation = {
      ...reservationData,
      id: newId,
      userEmail,
      bookedAt: new Date().toISOString(),
      status: "RESERVED",
    };

    const updatedReservations = [newReservation, ...reservations];
    setReservations(updatedReservations);
    localStorage.setItem(DEFAULT_RESERVATIONS_KEY, JSON.stringify(updatedReservations));

    // Save newly occupied seats globally in LocalStorage
    const occupiedKey = `${reservationData.movie.id}_${reservationData.date}_${reservationData.time}`;
    const currentOccupied = localStorage.getItem(DEFAULT_OCCUPIED_SEATS_KEY);
    const occupiedMap = currentOccupied ? JSON.parse(currentOccupied) : {};
    
    const existingSeatsForTime = occupiedMap[occupiedKey] || [];
    occupiedMap[occupiedKey] = [...existingSeatsForTime, ...reservationData.seats];
    localStorage.setItem(DEFAULT_OCCUPIED_SEATS_KEY, JSON.stringify(occupiedMap));

    return newReservation;
  };

  const cancelReservation = (resId: string) => {
    const reservationToCancel = reservations.find((r) => r.id === resId);
    if (!reservationToCancel) return;

    // Update reservation status to CANCELLED (or simply remove it)
    const updatedReservations = reservations.map((r) =>
      r.id === resId ? { ...r, status: "CANCELLED" as const } : r
    );
    setReservations(updatedReservations);
    localStorage.setItem(DEFAULT_RESERVATIONS_KEY, JSON.stringify(updatedReservations));

    // Remove the seats from occupied map
    const occupiedKey = `${reservationToCancel.movie.id}_${reservationToCancel.date}_${reservationToCancel.time}`;
    const currentOccupied = localStorage.getItem(DEFAULT_OCCUPIED_SEATS_KEY);
    if (currentOccupied) {
      const occupiedMap = JSON.parse(currentOccupied);
      const seatsForTime: string[] = occupiedMap[occupiedKey] || [];
      occupiedMap[occupiedKey] = seatsForTime.filter(
        (seat) => !reservationToCancel.seats.includes(seat)
      );
      localStorage.setItem(DEFAULT_OCCUPIED_SEATS_KEY, JSON.stringify(occupiedMap));
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
