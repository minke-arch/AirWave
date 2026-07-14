import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "이메일은 필수 입력값입니다." },
        { status: 400 }
      ) as any;
    }

    // 1. 기존 유저 조회
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // 2. 존재하지 않으면 생성
    if (!user) {
      const defaultName = email.split("@")[0] || "사용자";
      user = await prisma.user.create({
        data: {
          email,
          name: name || defaultName,
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }) as any;
  } catch (error) {
    console.error("로그인 API 에러:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    ) as any;
  }
}
