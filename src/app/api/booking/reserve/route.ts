import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { lockManager } from "../../../../lib/lock";

export async function POST(request: Request) {
  try {
    const { showtimeId, userId, seats, totalPrice, payment } = await request.json();

    if (!showtimeId || !userId || !seats || !Array.isArray(seats) || seats.length === 0 || !totalPrice || !payment) {
      return NextResponse.json(
        { success: false, message: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      ) as any;
    }

    // 1. 이미 결제가 완료되었거나 타인에 의해 선점되었는지 최종 DB 무결성 재검증
    const conflictReservations = await prisma.reservation.findMany({
      where: {
        showtimeId,
        status: "RESERVED",
      },
      select: { seats: true },
    });

    const occupiedSeats = new Set<string>();
    conflictReservations.forEach((r) => {
      if (r.seats) {
        r.seats.split(",").filter(Boolean).forEach((s) => occupiedSeats.add(s));
      }
    });

    for (const seat of seats) {
      if (occupiedSeats.has(seat)) {
        return NextResponse.json(
          { success: false, message: `좌석 ${seat}은(는) 이미 다른 고객의 예매가 완료되었습니다.` },
          { status: 409 }
        ) as any;
      }
    }

    let newReservation;

    // 2. 데이터베이스 단일 트랜잭션 실행
    try {
      newReservation = await prisma.$transaction(async (tx) => {
        // 본인이 선점했던 TemporaryHold 데이터 일괄 삭제
        await tx.temporaryHold.deleteMany({
          where: {
            showtimeId,
            userId,
            seatNo: { in: seats },
          },
        });

        // Reservation 생성
        const reservation = await tx.reservation.create({
          data: {
            userId,
            showtimeId,
            seats: seats.join(","), // SQLite Array 지원 문제 우회
            totalPrice,
            status: "RESERVED",
          },
        });

        // Payment 생성
        await tx.payment.create({
          data: {
            reservationId: reservation.id,
            method: payment.method,
            amount: payment.amount,
            status: "COMPLETED",
          },
        });

        return reservation;
      });
    } catch (txError) {
      console.error("최종 예매 트랜잭션 에러:", txError);
      return NextResponse.json(
        { success: false, message: "예매 처리 중 데이터베이스 오류가 발생했습니다." },
        { status: 500 }
      ) as any;
    }

    // 3. 트랜잭션 성공 완료 후 메모리 락 해제
    seats.forEach((seat) => {
      const lockKey = `lock:${showtimeId}:${seat}`;
      lockManager.releaseLock(lockKey, userId);
    });

    return NextResponse.json({
      success: true,
      reservationId: newReservation.id,
      message: "예매 및 결제가 완료되었습니다.",
    }) as any;
  } catch (error) {
    console.error("최종 예매 API 에러:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    ) as any;
  }
}
