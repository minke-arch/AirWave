# 백엔드 및 데이터베이스(Supabase) 구현 결과 보고서 (Walkthrough)

가상 로컬 스토리지 기반으로 동작하던 영화 예매 서비스(MovieWave)를 **Prisma ORM & Supabase 클라우드 PostgreSQL 데이터베이스 및 Next.js Route Handlers 기반**의 프로덕션 수준 실제 백엔드 아키텍처로 완전히 연동 완료하고, **Google AI Studio(Gemini 1.5 Flash) 기반 실시간 AI 영화 상담 챗봇**을 추가 연동하였습니다.

---

## 1. 구현 완료된 백엔드 아키텍처 요약

```mermaid
flowchart TD
    Client["Client (Next.js)"]
    API["API Route Handlers"]
    Lock["Memory Lock Manager (Redis 시뮬레이션)"]
    DB[("Supabase PostgreSQL DB (Cloud)")]
    Gemini["Google AI Studio (Gemini 1.5 Flash)"]

    Client -->|1. 로그인/영화/시간표 조회| API
    API -->|Query| DB
    Client -->|2. 결제진입 (좌석 임시잠금)| API
    API -->|3. Lock 획득 시도| Lock
    Lock -- Success --> DB
    Client -->|4. 결제완료 (예약확정)| API
    API -->|5. 트랜잭션 수행| DB
    API -->|6. Lock 해제| Lock

    Client -->|7. AI 챗봇 질문 송신| API
    API -->|8. DB 데이터 조회 & 가공| DB
    API -->|9. 요약 컨텍스트 & 프롬프트 전달| Gemini
    Gemini -->|10. 실시간 AI 답변 반환| API
```

---

## 2. AI 영화 상담 챗봇 연동 사양
* **API 스펙**: Google AI Studio `gemini-1.5-flash` 모델 연동.
* **보안 격리**:
  * 프론트엔드에 `GEMINI_API_KEY`가 노출되는 것을 방지하기 위해 Next.js Route Handler인 `/api/chat`을 경유하도록 구성했습니다.
* **실시간 DB 컨텍스트 주입 (RAG 방식 생략 및 경량화)**:
  * 대화 요청 시 백엔드에서 Prisma를 활용해 현재 상영 중인 **영화 메타데이터, 상영관(1~6관) 좌석 수 사양, 그리고 7일간의 날짜별 시간표 정보**를 통째로 조회합니다.
  * 조회한 구조화 데이터를 가독성 높은 한국어 텍스트 컨텍스트로 변환하여 Gemini의 **System Instruction(시스템 지침)**에 동적으로 주입합니다.
  * 이로 인해 AI 비서는 데이터베이스에 실재하는 정확한 실시간 영화 스케줄과 상영관 사양을 기반으로만 오차 없이 똑똑하게 답합니다.
* **모바일 최적화 UI**:
  * 상단 GNB 헤더 영역 오른쪽에 핑크색의 말풍선 아이콘(`MessageSquare`)을 추가했습니다. (깜빡이는 펄스 애니메이션 적용으로 시각적 탭 유도)
  * 버튼을 누르면 화면 하단에서 스르륵 부드럽게 열리는 **바텀 슬라이드-오버 드로어(Bottom Drawer)** 대화창을 구현했습니다.
  * 빠른 사용을 위한 추천 질문 칩셋(오늘 상영 영화, 시간표, 취소 규정 등)을 내장해 접근성을 높였습니다.

---

## 3. 데이터베이스 구성 및 마이그레이션 결과
* **DB 엔진**: PostgreSQL (Supabase 클라우드, ap-south-1 Mumbai 리전)
* **네트워크 연동 방식**: **Supabase Connection Pooler** 연동
  * 일반적인 IPv6 직접 주소(5432) 대신, 로컬 컴퓨터(IPv4 전용 인터넷 망)와의 완벽한 통신 호환성을 확보하기 위해 **Supabase IPv4 전용 Connection Pooler (`aws-1-ap-south-1.pooler.supabase.com:6543`)** 및 **세션 풀러(5432)** 설정을 이중 매핑했습니다.
  * 비밀번호 특수문자 퍼센트 인코딩(`Modest5684%21%21`) 및 테넌트 ID 프리픽스(`postgres.ayebaifwzepxldzcgooc`)가 올바르게 주입되었습니다.
* **마이그레이션 적용**: `init_supabase` 마이그레이션을 데이터베이스 서버에 동기화하여 User, Movie, Theater, Screen, Seat, Showtime, TemporaryHold, Reservation, Payment 등 9개 테이블을 실시간 생성 완료했습니다.
* **시드(Seed) 데이터 적재**: `prisma/seed.js`를 구동하여 영화 4종, 극장 정보, 6개 상영관 전체 물리 좌석(약 1,000석), 그리고 향후 7일간의 날짜별 상영 시간표 200여 개를 Supabase 클라우드 DB에 적재 성공했습니다.

---

## 4. API 명세 및 구현 결과

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | 이메일 기반 가상 로그인 및 자동 회원가입 |
| `GET` | `/api/movies` | 상영/예정 영화 전체 목록 조회 |
| `GET` | `/api/showtimes` | 날짜 및 영화 필터링 기준 시간표 & 실시간 잔여석 정보 조회 |
| `GET` | `/api/showtimes/[id]` | 상영관별 물리 좌석 레이아웃 및 예약/선점 상태 상세 조회 |
| `POST` | `/api/booking/hold` | 좌석 10분 임시 선점 요청 (동시성 제어 및 경합 방지 적용) |
| `POST` | `/api/booking/reserve`| 결제 정보 검증 및 최종 예매 확정 (단일 DB 트랜잭션 보장) |
| `POST` | `/api/booking/cancel` | 예매 내역 취소 및 가상 환불 처리 |
| `GET` | `/api/mypage/reservations` | 유저 이메일별 예매 및 결제 내역 조회 |
| `POST` | `/api/chat` | AI Studio Gemini 1.5 Flash 연동 실시간 영화 비서 챗봇 API |

---

## 5. 검증 완료 내역

* **TypeScript & Production Build 검증 완료**:
  * Next.js 16 빌드 파이프라인(`npm run build`)을 실행하여 컴파일 에러 없는 완전한 빌드를 확인했습니다.
  * `@google/generative-ai` 모듈의 최신 클래스 사양(`GoogleGenerativeAI`)을 탑재해 타입 에러를 완전히 제어했습니다.
* **로컬 상태 관리 연동 완료**:
  * `src/context/BookingContext.tsx` 내의 구버전 `localStorage` 참조 및 상태 보정 로직을 `fetch` API 기반 서버 연동으로 마이그레이션했습니다.
  * 메인 차트(`app/page.tsx`), 상세 정보(`app/movies/[id]/page.tsx`), 예매 시간표(`app/booking/page.tsx`), 좌석 선택(`app/booking/seats/page.tsx`), 결제(`app/booking/payment/page.tsx`), 티켓 목록(`app/ticket/page.tsx`)에 대한 모든 동적 API 데이터 흐름 연동이 완료되었습니다.
