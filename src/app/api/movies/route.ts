import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export async function GET() {
  try {
    const movies = await prisma.movie.findMany({
      orderBy: { bookingRate: "desc" },
    });

    // 프론트엔드가 기대하는 문자열 및 숫자 형태 포맷으로 매핑
    const formattedMovies = movies.map((m) => ({
      id: m.id,
      title: m.title,
      poster: m.poster,
      ageLimit: m.ageLimit,
      runtime: m.runtime,
      genre: m.genre,
      bookingRate: `${m.bookingRate.toFixed(1)}%`,
      audienceCount: m.audienceCount.toLocaleString() + "명",
    }));

    return NextResponse.json({ success: true, movies: formattedMovies }) as any;
  } catch (error) {
    console.error("영화 목록 조회 에러:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    ) as any;
  }
}
