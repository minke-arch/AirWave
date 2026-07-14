import { Movie, Showtime } from "../context/BookingContext";

export const dummyMovies: Movie[] = [
  {
    id: "hope",
    title: "호프",
    poster: "/images/hope.jpg",
    ageLimit: "15",
    runtime: "2시간 36분",
    genre: "SF, 스릴러, 액션",
    bookingRate: "47.1%",
    audienceCount: "5,632명"
  },
  {
    id: "spiderman",
    title: "스파이더맨-브랜드 뉴 데이",
    poster: "/images/spiderman.jpg",
    ageLimit: "미정",
    runtime: "2시간 25분",
    genre: "액션, 어드벤처, 판타지",
    bookingRate: "24.4%",
    audienceCount: "0명"
  },
  {
    id: "inception",
    title: "인셉션",
    poster: "/images/inception.jpg",
    ageLimit: "12",
    runtime: "2시간 28분",
    genre: "SF, 액션, 스릴러",
    bookingRate: "15.2%",
    audienceCount: "6,829,380명"
  },
  {
    id: "moana2",
    title: "모아나 2",
    poster: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop",
    ageLimit: "All",
    runtime: "1시간 40분",
    genre: "애니메이션, 모험, 뮤지컬",
    bookingRate: "13.3%",
    audienceCount: "1,204,562명"
  }
];

// Helper to calculate end time based on start time and movie runtime
const calculateEndTime = (startTime: string, runtimeStr: string): string => {
  const match = runtimeStr.match(/(?:(\d+)시간)?\s*(?:(\d+)분)?/);
  let hours = 0;
  let minutes = 0;
  if (match) {
    hours = match[1] ? parseInt(match[1]) : 0;
    minutes = match[2] ? parseInt(match[2]) : 0;
  }
  const totalRuntimeMinutes = hours * 60 + minutes;
  
  const [startHour, startMin] = startTime.split(":").map(Number);
  
  // End time = start time + runtime + 10 minutes cleaning/advertising time
  const totalEndMinutes = startHour * 60 + startMin + totalRuntimeMinutes + 10;
  
  const endHour = Math.floor(totalEndMinutes / 60) % 24;
  const endMin = totalEndMinutes % 60;
  
  return `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;
};

// Helper to generate showtimes for a specific movie & date
export const getShowtimes = (movieId: string, dateStr: string): Showtime[] => {
  const movie = dummyMovies.find((m) => m.id === movieId);
  if (!movie) return [];

  // Spiderman opens on July 20, 2026. No showtimes before that date.
  if (movieId === "spiderman" && dateStr < "2026-07-20") {
    return [];
  }

  const runtime = movie.runtime;
  let slots: { time: string; screen: string; totalSeats: number }[] = [];

  if (movieId === "hope") {
    // "호프" screens: 5관 2D (183석), 2관 2D (153석)
    slots = [
      { time: "10:30", screen: "5관 2D", totalSeats: 183 },
      { time: "11:30", screen: "2관 2D", totalSeats: 153 },
      { time: "13:40", screen: "5관 2D", totalSeats: 183 },
      { time: "14:40", screen: "2관 2D", totalSeats: 153 },
      { time: "16:50", screen: "5관 2D", totalSeats: 183 },
      { time: "17:50", screen: "2관 2D", totalSeats: 153 },
      { time: "20:00", screen: "5관 2D", totalSeats: 183 },
      { time: "21:00", screen: "2관 2D", totalSeats: 153 }
    ];
  } else if (movieId === "inception") {
    // "인셉션" screens: 1관 2D (140석), 4관 2D (127석)
    slots = [
      { time: "09:30", screen: "1관 2D", totalSeats: 140 },
      { time: "10:45", screen: "4관 2D", totalSeats: 127 },
      { time: "12:30", screen: "1관 2D", totalSeats: 140 },
      { time: "13:45", screen: "4관 2D", totalSeats: 127 },
      { time: "15:30", screen: "1관 2D", totalSeats: 140 },
      { time: "16:45", screen: "4관 2D", totalSeats: 127 },
      { time: "18:30", screen: "1관 2D", totalSeats: 140 },
      { time: "19:45", screen: "4관 2D", totalSeats: 127 },
      { time: "21:30", screen: "1관 2D", totalSeats: 140 },
      { time: "22:45", screen: "4관 2D", totalSeats: 127 }
    ];
  } else if (movieId === "moana2") {
    // "모아나 2" screens: 3관 2D (160석)
    slots = [
      { time: "09:00", screen: "3관 2D", totalSeats: 160 },
      { time: "11:00", screen: "3관 2D", totalSeats: 160 },
      { time: "13:00", screen: "3관 2D", totalSeats: 160 },
      { time: "15:00", screen: "3관 2D", totalSeats: 160 },
      { time: "17:00", screen: "3관 2D", totalSeats: 160 },
      { time: "19:00", screen: "3관 2D", totalSeats: 160 },
      { time: "21:00", screen: "3관 2D", totalSeats: 160 }
    ];
  } else if (movieId === "spiderman") {
    // "스파이더맨-브랜드 뉴 데일" screens: 6관 2D (200석)
    slots = [
      { time: "10:00", screen: "6관 2D", totalSeats: 200 },
      { time: "13:00", screen: "6관 2D", totalSeats: 200 },
      { time: "16:00", screen: "6관 2D", totalSeats: 200 },
      { time: "19:00", screen: "6관 2D", totalSeats: 200 },
      { time: "22:00", screen: "6관 2D", totalSeats: 200 }
    ];
  }

  return slots.map((slot) => ({
    time: slot.time,
    endTime: calculateEndTime(slot.time, runtime),
    screen: slot.screen,
    totalSeats: slot.totalSeats,
    occupiedSeats: []
  }));
};
