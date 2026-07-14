import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { lockManager } from "../../../../lib/lock";

export async function POST(request: Request) {
  try {
    const { showtimeId, seats, userId } = await request.json();

    if (!showtimeId || !seats || !Array.isArray(seats) || seats.length === 0 || !userId) {
      return NextResponse.json(
        { success: false, message: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      ) as any;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10분 후 만료

    // 1. 이미 예매 확정(RESERVED)된 좌석이 포함되어 있는지 DB 검증
    const existingReservations = await prisma.reservation.findMany({
      where: {
        showtimeId,
        status: "RESERVED",
      },
      select: { seats: true },
    });

    const occupiedSeats = new Set<string>();
    existingReservations.forEach((r) => {
      if (r.seats) {
        r.seats.split(",").filter(Boolean).forEach((s) => occupiedSeats.add(s));
      }
    });

    for (const seat of seats) {
      if (occupiedSeats.has(seat)) {
        return NextResponse.json(
          { success: false, message: `좌석 ${seat}은(는) 이미 예매가 완료되었습니다.` },
          { status: 409 }
        ) as any;
      }
    }

    // 2. 동시성 제어 1단계: MemoryLockManager(Redis 시뮬레이션)를 통한 락 획득 시도
    const acquiredLocks: string[] = [];
    let isAllLocked = true;

    for (const seat of seats) {
      const lockKey = `lock:${showtimeId}:${seat}`;
      const success = lockManager.acquireLock(lockKey, userId, 10 * 60 * 1000); // 10분간 락

      if (success) {
        acquiredLocks.push(lockKey);
      } else {
        isAllLocked = false;
        break;
      }
    }

    // 만약 하나라도 락 획득에 실패했다면 획득했던 모든 락 롤백(해제)
    if (!isAllLocked) {
      acquiredLocks.forEach((key) => lockManager.releaseLock(key, userId));
      return NextResponse.json(
        { success: false, message: "선택하신 좌석 중 일부가 다른 사용자에 의해 선점 중입니다." },
        { status: 409 }
      ) as any;
    }

    // 3. 동시성 제어 2단계: DB Unique Constraint 레벨 검증 및 삽입
    // 이미 타인에 의해 hold된 내역이 만료되지 않았는지 DB에서 한 번 더 크로스 체크
    try {
      // 기존에 해당 상영관의 특정 좌석에 만료되지 않은 타인의 Hold가 있는지 조회
      const activeHolds = await prisma.temporaryHold.findMany({
        where: {
          showtimeId,
          seatNo: { in: seats },
          expiresAt: { gt: now },
          userId: { not: userId },
        },
      });

      if (activeHolds.length > 0) {
        // 이미 다른 유저가 쥐고 있으므로 락 롤백
        acquiredLocks.forEach((key) => lockManager.releaseLock(key, userId));
        return NextResponse.json(
          { success: false, message: "선택하신 좌석 중 이미 선점된 좌석이 있습니다." },
          { status: 409 }
        ) as any;
      }

      // 본인이 이미 잡은 기존 Hold(만료 전)가 있다면 삭제 후 갱신
      await prisma.temporaryHold.deleteMany({
        where: {
          showtimeId,
          userId,
          seatNo: { in: seats },
        },
      });

      // 새로운 Hold 데이터 생성 (트랜잭션 또는 개별 삽입)
      // SQLite는 createMany에서 유니크 충돌 처리 및 롤백이 엄격하므로 트랜잭션으로 처리
      await prisma.$transaction(
        seats.map((seat) =>
          prisma.temporaryHold.create({
            data: {
              showtimeId,
              userId,
              seatNo: seat,
              expiresAt,
            },
          })
        )
      );

    } catch (dbError) {
      console.error("DB 선점 데이터 처리 중 에러 (경합 발생):", dbError);
      // DB 유니크 제약 충돌 등으로 에러 발생 시 락 해제
      acquiredLocks.forEach((key) => lockManager.releaseLock(key, userId));
      return NextResponse.json(
        { success: false, message: "좌석 선점 처리 중 경합이 발생했습니다. 다시 시도해 주세요." },
        { status: 409 }
      ) as any;
    }

    return NextResponse.json({
      success: true,
      expiresAt: expiresAt.toISOString(),
      message: "좌석이 10분간 임시 선점되었습니다.",
    }) as any;
  } catch (error) {
    console.error("좌석 선점 API 에러:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    ) as any;
  }
}
