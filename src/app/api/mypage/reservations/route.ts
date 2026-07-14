import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, message: "email 파라미터가 누락되었습니다." },
        { status: 400 }
      ) as any;
    }

    // 1. 유저 조회
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ success: true, reservations: [] }) as any;
    }

    // 2. 해당 유저의 모든 예매 내역 조회 (상영일정, 영화, 극장, 상영관 정보 포함)
    const reservations = await prisma.reservation.findMany({
      where: {
        userId: user.id,
      },
      include: {
        showtime: {
          include: {
            movie: true,
            theater: true,
            screen: true,
          },
        },
      },
      orderBy: { bookedAt: "desc" },
    });

    // 3. 프론트엔드가 요구하는 형식에 맞추어 포맷팅
    const formattedReservations = reservations.map((res) => {
      const seatsArray = res.seats ? res.seats.split(",").filter(Boolean) : [];
      return {
        id: res.id,
        userEmail: user.email,
        movie: {
          id: res.showtime.movie.id,
          title: res.showtime.movie.title,
          poster: res.showtime.movie.poster,
        },
        theater: res.showtime.theater.name,
        screen: res.showtime.screen.name,
        date: res.showtime.date,
        time: res.showtime.startTime,
        seats: seatsArray,
        totalPrice: res.totalPrice,
        bookedAt: res.bookedAt.toISOString(),
        status: res.status as "RESERVED" | "CANCELLED",
      };
    });

    return NextResponse.json({ success: true, reservations: formattedReservations }) as any;
  } catch (error) {
    console.error("마이페이지 예매 목록 조회 에러:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    ) as any;
  }
}
