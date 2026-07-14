import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "../../../lib/db";

// API 키가 할당되지 않은 경우를 대비한 가상 응답 헬퍼
const getMockResponse = (message: string) => {
  const msg = message.toLowerCase();
  if (msg.includes("영화") || msg.includes("상영")) {
    return "현재 에어웨이브 서울본점에서는 [모아나 2], [호프], [스파이더맨], [인셉션]이 상영 중입니다. 상세 시간표는 상단의 '예매·예약' 탭에서 확인하실 수 있습니다! (※ AI Studio API 키 설정 시 더 똑똑한 실시간 상담이 가능합니다.)";
  }
  if (msg.includes("좌석") || msg.includes("관")) {
    return "저희 극장은 1관부터 6관까지 있으며, 각 관별로 약 120석에서 200석 규모의 쾌적한 좌석(프리미엄석, 장애인석 포함)이 준비되어 있습니다. 상세 좌석 지정은 시간표 선택 후 진행해 주세요!";
  }
  return "안녕하세요! 에어웨이브 AI 안내원입니다. 극장 위치, 상영 시간표, 상영작 정보 등에 대해 질문해 주시면 친절히 안내해 드릴게요. (※ 현재 API 키 설정 대기 상태로 간이 응답 모드로 작동 중입니다.)";
};

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json({ success: false, error: "메시지가 비어 있습니다." }, { status: 400 });
    }

    // 1. API 키 확인
    const rawApiKey = process.env.GEMINI_API_KEY;
    if (!rawApiKey) {
      console.warn("GEMINI_API_KEY 환경변수가 설정되지 않았습니다. 간이 응답 모드로 동작합니다.");
      return NextResponse.json({ success: true, response: getMockResponse(message) });
    }

    // API 키 양끝의 공백 및 큰따옴표/작은따옴표가 잘못 묻어난 경우를 대비해 살균(Sanitize) 처리
    const apiKey = rawApiKey.trim().replace(/^["']|["']$/g, "");

    // 2. 데이터베이스 메타데이터 동적 조회
    const [movies, theaters, screens, showtimes] = await Promise.all([
      prisma.movie.findMany(),
      prisma.theater.findMany(),
      prisma.screen.findMany(),
      prisma.showtime.findMany({
        orderBy: [
          { date: "asc" },
          { startTime: "asc" }
        ]
      })
    ]);

    // 3. 데이터를 프롬프트용 텍스트 컨텍스트로 정교하게 포맷팅
    const moviesContext = movies.map(m => 
      `- 영화명: ${m.title} (ID: ${m.id}), 장르: ${m.genre}, 관람 등급: ${m.ageLimit}세 이상 관람가, 런타임: ${m.runtime}, 실시간 예매율: ${m.bookingRate}%, 누적관객수: ${m.audienceCount.toLocaleString()}명`
    ).join("\n");

    const screensContext = screens.map(s => 
      `- 상영관: ${s.name} (극장: 무비웨이브 서울본점), 총 좌석 수: ${s.totalSeats}석`
    ).join("\n");

    // 상영 시간표를 날짜별로 보기 쉽게 구조화
    const showtimesByDate: Record<string, string[]> = {};
    showtimes.forEach(st => {
      const movieTitle = movies.find(m => m.id === st.movieId)?.title || st.movieId;
      const screenName = screens.find(s => s.id === st.screenId)?.name || st.screenId;
      if (!showtimesByDate[st.date]) {
        showtimesByDate[st.date] = [];
      }
      showtimesByDate[st.date].push(`  * [${movieTitle}] 상영관: ${screenName} | 시간: ${st.startTime} ~ ${st.endTime}`);
    });

    let showtimesContext = "";
    Object.entries(showtimesByDate).forEach(([date, list]) => {
      showtimesContext += `- 날짜: ${date}\n${list.join("\n")}\n`;
    });

    // 4. 시스템 지침(System Instruction) 설계
    const systemInstruction = `
당신은 대한민국 대표 프리미엄 영화관 '에어웨이브 (AirWave) 서울본점'의 AI 친절 비서입니다.
아래 제공되는 데이터베이스 실시간 메타데이터 정보를 완벽히 인지하고, 이를 바탕으로 고객의 모든 질문에 대답해야 합니다.

[실시간 상영 중인 영화 정보]
${moviesContext}

[상영관 정보]
${screensContext}

[상영 시간표 상세 정보]
${showtimesContext}

[답변 원칙 및 지침]
1. 반드시 위의 정보(영화 리스트, 상영관, 시간표)에 존재하는 사실만을 기반으로 정직하게 대답하십시오. 
2. 여기에 없는 영화 정보나 상영 일정을 임의로 지어내어 추천하지 마십시오. (예: 아바타가 상영 중이냐고 물어보면 상영 정보에 없으므로 상영하지 않는다고 정확히 답해야 합니다.)
3. 답변은 2~3줄 이내로 핵심만 명확하게 제공하며, 말투는 한글 존댓말로 매우 상냥하고 친절하게 답변하십시오. (이모지 적극 사용 권장)
4. 만약 사용자가 직접 예매나 결제를 원할 경우, 화면 하단 네비게이션바 정중앙의 '예매·예약' 붉은색 버튼을 통해 예매를 시작할 수 있다고 친절하게 안내하십시오.
5. 티켓 구매 취소는 마이페이지('더보기' 탭)의 예매 내역에서 30분 전까지 가능하다고 친절하게 안내하십시오.
`;

    // 5. Gemini API SDK 연결 및 세션 개설
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemInstruction,
    });

    // 멀티턴 대화 기록(history) 포맷팅
    // SDK 포맷에 맞춰 유저와 모델의 롤을 user, model로 변환
    const geminiHistory = (history || []).map((chat: any) => ({
      role: chat.sender === "user" ? "user" : "model",
      parts: [{ text: chat.text }],
    }));

    const chatSession = model.startChat({
      history: geminiHistory,
    });

    const result = await chatSession.sendMessage(message);
    const responseText = result.response.text();

    return NextResponse.json({
      success: true,
      response: responseText.trim(),
    });
  } catch (error: any) {
    console.error("Gemini 챗봇 API 내부 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류로 인해 대화를 처리하지 못했습니다." },
      { status: 500 }
    );
  }
}
