import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function POST(request: Request) {
  try {
    const { reservationId } = await request.json();

    if (!reservationId) {
      return NextResponse.json(
        { success: false, message: "예약 ID가 누락되었습니다." },
        { status: 400 }
      ) as any;
    }

    // 1. 예약 내역 조회
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { payment: true },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, message: "존재하지 않는 예약 정보입니다." },
        { status: 404 }
      ) as any;
    }

    if (reservation.status === "CANCELLED") {
      return NextResponse.json(
        { success: false, message: "이미 취소된 예약입니다." },
        { status: 400 }
      ) as any;
    }

    // 2. 데이터베이스 상태 변경 트랜잭션 (예매 CANCELLED & 결제 REFUNDED)
    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: "CANCELLED" },
      });

      if (reservation.payment) {
        await tx.payment.update({
          where: { reservationId },
          data: { status: "REFUNDED" },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "성공적으로 예매가 취소 및 환불 처리되었습니다.",
    }) as any;
  } catch (error) {
    console.error("예약 취소 API 에러:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    ) as any;
  }
}
