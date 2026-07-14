import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get("movieId");
    const date = searchParams.get("date");

    if (!movieId || !date) {
      return NextResponse.json(
        { success: false, message: "movieId와 date 파라미터는 필수입니다." },
        { status: 400 }
      ) as any;
    }

    // 1. 해당 영화, 날짜의 상영시간표 조회 (상영관 정보도 Join)
    const showtimes = await prisma.showtime.findMany({
      where: {
        movieId,
        date,
      },
      include: {
        screen: true,
      },
      orderBy: { startTime: "asc" },
    });

    const now = new Date();

    // 2. 각 상영시간표별 예약/선점된 좌석 계산
    const result = await Promise.all(
      showtimes.map(async (st) => {
        // 예약 완료된 좌석 조회
        const reservations = await prisma.reservation.findMany({
          where: {
            showtimeId: st.id,
            status: "RESERVED",
          },
          select: { seats: true },
        });

        // 콤마 구분자 처리로 총 예약된 좌석 수 계산
        let occupiedCount = 0;
        const occupiedSeatsList: string[] = [];
        
        reservations.forEach((r) => {
          if (r.seats) {
            const splitSeats = r.seats.split(",").filter(Boolean);
            occupiedCount += splitSeats.length;
            occupiedSeatsList.push(...splitSeats);
          }
        });

        // 현재 유효한 임시 선점 좌석 조회
        const activeHolds = await prisma.temporaryHold.findMany({
          where: {
            showtimeId: st.id,
            expiresAt: {
              gt: now,
            },
          },
          select: { seatNo: true },
        });

        const activeHoldSeats = activeHolds.map((h) => h.seatNo);
        const totalUnavailableCount = new Set([...occupiedSeatsList, ...activeHoldSeats]).size;

        return {
          id: st.id,
          time: st.startTime,
          endTime: st.endTime,
          screen: st.screen.name,
          totalSeats: st.screen.totalSeats,
          occupiedSeats: occupiedSeatsList,
          temporaryHolds: activeHoldSeats,
          remainingSeats: Math.max(0, st.screen.totalSeats - totalUnavailableCount),
        };
      })
    );

    return NextResponse.json({ success: true, showtimes: result }) as any;
  } catch (error) {
    console.error("상영 시간표 조회 에러:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    ) as any;
  }
}
