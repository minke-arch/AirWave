import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showtimeId } = await params;

    // 1. 상영 일정 상세 정보 조회
    const showtime = await prisma.showtime.findUnique({
      where: { id: showtimeId },
      include: {
        movie: true,
        screen: {
          include: {
            seats: {
              orderBy: [
                { row: "asc" },
                { col: "asc" }
              ]
            }
          }
        },
        theater: true,
      },
    });

    if (!showtime) {
      return NextResponse.json(
        { success: false, message: "존재하지 않는 상영 일정입니다." },
        { status: 404 }
      ) as any;
    }

    // 2. 예약이 확정된 좌석 파싱
    const reservations = await prisma.reservation.findMany({
      where: {
        showtimeId,
        status: "RESERVED",
      },
      select: { seats: true },
    });

    const occupiedSeats = new Set<string>();
    reservations.forEach((r) => {
      if (r.seats) {
        r.seats.split(",").filter(Boolean).forEach((s) => occupiedSeats.add(s));
      }
    });

    // 3. 현재 유효한 임시 선점(Hold) 상태 좌석 조회
    const now = new Date();
    const activeHolds = await prisma.temporaryHold.findMany({
      where: {
        showtimeId,
        expiresAt: {
          gt: now,
        },
      },
      select: { seatNo: true, userId: true },
    });

    const holdSeatsMap = new Map<string, string>(); // seatNo -> userId
    activeHolds.forEach((h) => holdSeatsMap.set(h.seatNo, h.userId));

    // 4. 물리 좌석 정보에 예약 상태(status) 병합
    const formattedSeats = showtime.screen.seats.map((seat) => {
      let status = "AVAILABLE";
      if (occupiedSeats.has(seat.seatNo)) {
        status = "OCCUPIED";
      } else if (holdSeatsMap.has(seat.seatNo)) {
        status = "HELD";
      }

      return {
        id: seat.id,
        seatNo: seat.seatNo,
        grade: seat.grade,
        row: seat.row,
        col: seat.col,
        status,
        heldBy: holdSeatsMap.get(seat.seatNo) || null,
      };
    });

    return NextResponse.json({
      success: true,
      showtime: {
        id: showtime.id,
        date: showtime.date,
        startTime: showtime.startTime,
        endTime: showtime.endTime,
        movie: {
          id: showtime.movie.id,
          title: showtime.movie.title,
          poster: showtime.movie.poster,
          runtime: showtime.movie.runtime,
          ageLimit: showtime.movie.ageLimit,
        },
        theater: {
          id: showtime.theater.id,
          name: showtime.theater.name,
        },
        screen: {
          id: showtime.screen.id,
          name: showtime.screen.name,
          totalSeats: showtime.screen.totalSeats,
        },
        seats: formattedSeats,
      },
    }) as any;
  } catch (error) {
    console.error("상영일정 상세 및 좌석 조회 에러:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    ) as any;
  }
}
