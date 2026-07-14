const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const dummyMovies = [
  {
    id: "hope",
    title: "호프",
    poster: "/images/hope.jpg",
    ageLimit: "15",
    runtime: "2시간 36분",
    genre: "SF, 스릴러, 액션",
    bookingRate: 47.1,
    audienceCount: 5632
  },
  {
    id: "spiderman",
    title: "스파이더맨-브랜드 뉴 데이",
    poster: "/images/spiderman.jpg",
    ageLimit: "미정",
    runtime: "2시간 25분",
    genre: "액션, 어드벤처, 판타지",
    bookingRate: 24.4,
    audienceCount: 0
  },
  {
    id: "inception",
    title: "인셉션",
    poster: "/images/inception.jpg",
    ageLimit: "12",
    runtime: "2시간 28분",
    genre: "SF, 액션, 스릴러",
    bookingRate: 15.2,
    audienceCount: 6829380
  },
  {
    id: "moana2",
    title: "모아나 2",
    poster: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop",
    ageLimit: "All",
    runtime: "1시간 40분",
    genre: "애니메이션, 모험, 뮤지컬",
    bookingRate: 13.3,
    audienceCount: 1204562
  }
];

// Helper to calculate end time
const calculateEndTime = (startTime, runtimeStr) => {
  const match = runtimeStr.match(/(?:(\d+)시간)?\s*(?:(\d+)분)?/);
  let hours = 0;
  let minutes = 0;
  if (match) {
    hours = match[1] ? parseInt(match[1]) : 0;
    minutes = match[2] ? parseInt(match[2]) : 0;
  }
  const totalRuntimeMinutes = hours * 60 + minutes;
  const [startHour, startMin] = startTime.split(":").map(Number);
  const totalEndMinutes = startHour * 60 + startMin + totalRuntimeMinutes + 10;
  const endHour = Math.floor(totalEndMinutes / 60) % 24;
  const endMin = totalEndMinutes % 60;
  return `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;
};

async function main() {
  console.log("DB 시드 시작...");

  // 1. 기존 데이터 초기화 (초기화 순서 주의 - 외래키 영향)
  await prisma.temporaryHold.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.showtime.deleteMany({});
  await prisma.seat.deleteMany({});
  await prisma.screen.deleteMany({});
  await prisma.theater.deleteMany({});
  await prisma.movie.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. 가상 유저 생성
  await prisma.user.create({
    data: {
      email: "user@example.com",
      name: "홍길동"
    }
  });

  // 3. 영화 데이터 생성
  for (const m of dummyMovies) {
    await prisma.movie.create({
      data: m
    });
  }
  console.log("영화 데이터 삽입 완료.");

  // 4. 극장 생성
  const theater = await prisma.theater.create({
    data: {
      id: "theater_seoul_main",
      name: "무비웨이브 서울본점",
      location: "서울특별시 마포구 백범로 35"
    }
  });
  console.log("극장 데이터 삽입 완료.");

  // 5. 상영관 및 좌석 생성
  const screensData = [
    { name: "1관 2D", totalSeats: 140 },
    { name: "2관 2D", totalSeats: 153 },
    { name: "3관 2D", totalSeats: 160 },
    { name: "4관 2D", totalSeats: 127 },
    { name: "5관 2D", totalSeats: 183 },
    { name: "6관 2D", totalSeats: 200 }
  ];

  const alphabet = "ABCDEFGHIJKLMNOPQRST".split("");

  for (const sd of screensData) {
    const screen = await prisma.screen.create({
      data: {
        theaterId: theater.id,
        name: sd.name,
        totalSeats: sd.totalSeats
      }
    });

    // 물리 좌석 생성 (행당 15석씩 배치하여 총 좌석수 채움)
    const seatsToCreate = [];
    let seatCount = 0;
    let rowIndex = 0;

    while (seatCount < sd.totalSeats) {
      const row = alphabet[rowIndex];
      const seatsInRow = Math.min(15, sd.totalSeats - seatCount);

      for (let col = 1; col <= seatsInRow; col++) {
        // 프리미엄 열 지정 (예: G, H, I열은 PREMIUM)
        let grade = "STANDARD";
        if (["G", "H", "I"].includes(row)) {
          grade = "PREMIUM";
        }
        // 첫 번째 행의 첫 두 좌석은 장애인석
        if (row === "A" && col <= 2) {
          grade = "DISABLED";
        }

        seatsToCreate.push({
          screenId: screen.id,
          seatNo: `${row}${col}`,
          grade: grade,
          row: row,
          col: col
        });
        seatCount++;
      }
      rowIndex++;
    }

    // 벌크 인서트
    await prisma.seat.createMany({
      data: seatsToCreate
    });
    console.log(`${sd.name} 좌석 생성 완료: ${sd.totalSeats}개`);
  }

  // 6. 상영 스케줄 (Showtime) 생성
  // 오늘 날짜부터 향후 7일간의 스케줄 생성
  const showtimeTemplates = {
    hope: [
      { time: "10:30", screenName: "5관 2D" },
      { time: "11:30", screenName: "2관 2D" },
      { time: "13:40", screenName: "5관 2D" },
      { time: "14:40", screenName: "2관 2D" },
      { time: "16:50", screenName: "5관 2D" },
      { time: "17:50", screenName: "2관 2D" },
      { time: "20:00", screenName: "5관 2D" },
      { time: "21:00", screenName: "2관 2D" }
    ],
    inception: [
      { time: "09:30", screenName: "1관 2D" },
      { time: "10:45", screenName: "4관 2D" },
      { time: "12:30", screenName: "1관 2D" },
      { time: "13:45", screenName: "4관 2D" },
      { time: "15:30", screenName: "1관 2D" },
      { time: "16:45", screenName: "4관 2D" },
      { time: "18:30", screenName: "1관 2D" },
      { time: "19:45", screenName: "4관 2D" },
      { time: "21:30", screenName: "1관 2D" },
      { time: "22:45", screenName: "4관 2D" }
    ],
    moana2: [
      { time: "09:00", screenName: "3관 2D" },
      { time: "11:00", screenName: "3관 2D" },
      { time: "13:00", screenName: "3관 2D" },
      { time: "15:00", screenName: "3관 2D" },
      { time: "17:00", screenName: "3관 2D" },
      { time: "19:00", screenName: "3관 2D" },
      { time: "21:00", screenName: "3관 2D" }
    ],
    spiderman: [
      { time: "10:00", screenName: "6관 2D" },
      { time: "13:00", screenName: "6관 2D" },
      { time: "16:00", screenName: "6관 2D" },
      { time: "19:00", screenName: "6관 2D" },
      { time: "22:00", screenName: "6관 2D" }
    ]
  };

  const dbScreens = await prisma.screen.findMany({});
  const getScreenId = (name) => dbScreens.find(s => s.name === name).id;

  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);
    const dateStr = targetDate.toISOString().split("T")[0];

    // 스파이더맨은 2026-07-20 오픈이므로 그 이전에는 생성 안 함
    const isSpidermanActive = dateStr >= "2026-07-20";

    for (const [movieId, slots] of Object.entries(showtimeTemplates)) {
      if (movieId === "spiderman" && !isSpidermanActive) continue;
      
      const movie = dummyMovies.find(m => m.id === movieId);
      
      for (const slot of slots) {
        await prisma.showtime.create({
          data: {
            movieId: movieId,
            theaterId: theater.id,
            screenId: getScreenId(slot.screenName),
            date: dateStr,
            startTime: slot.time,
            endTime: calculateEndTime(slot.time, movie.runtime)
          }
        });
      }
    }
  }

  console.log("상영 시간표 생성 완료.");
  console.log("DB 시드 성공적으로 완료됨!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
