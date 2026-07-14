# 백엔드 및 데이터베이스(Supabase) 구현 결과 보고서 (Walkthrough)

가상 로컬 스토리지 기반으로 동작하던 영화 예매 서비스(MovieWave)를 **Prisma ORM & Supabase 클라우드 PostgreSQL 데이터베이스 및 Next.js Route Handlers 기반**의 프로덕션 수준 실제 백엔드 아키텍처로 완전히 연동 완료했습니다.

---

## 1. 구현 완료된 백엔드 아키텍처 요약

```mermaid
flowchart LR
    Client["Client (Next.js)"]
    API["API Route Handlers"]
    Lock["Memory Lock Manager (Redis 시뮬레이션)"]
    DB[("Supabase PostgreSQL DB (Cloud)")]

    Client -->|1. 로그인/영화/시간표 조회| API
    API -->|Query| DB
    Client -->|2. 결제진입 (좌석 임시잠금)| API
    API -->|3. Lock 획득 시도| Lock
    Lock -- Success --> DB
    Client -->|4. 결제완료 (예약확정)| API
    API -->|5. 트랜잭션 수행| DB
    API -->|6. Lock 해제| Lock
```

---

## 2. 데이터베이스 구성 및 마이그레이션 결과
* **DB 엔진**: PostgreSQL (Supabase 클라우드, ap-south-1 Mumbai 리전)
* **네트워크 연동 방식**: **Supabase Connection Pooler** 연동
  * 일반적인 IPv6 직접 주소(5432) 대신, 로컬 컴퓨터(IPv4 전용 인터넷 망)와의 완벽한 통신 호환성을 확보하기 위해 **Supabase IPv4 전용 Connection Pooler (`aws-1-ap-south-1.pooler.supabase.com:6543`)** 및 **세션 풀러(5432)** 설정을 이중 매핑했습니다.
  * 비밀번호 특수문자 퍼센트 인코딩(`Modest5684%21%21`) 및 테넌트 ID 프리픽스(`postgres.ayebaifwzepxldzcgooc`)가 올바르게 주입되었습니다.
* **마이그레이션 적용**: `init_supabase` 마이그레이션을 데이터베이스 서버에 동기화하여 User, Movie, Theater, Screen, Seat, Showtime, TemporaryHold, Reservation, Payment 등 9개 테이블을 실시간 생성 완료했습니다.
* **시드(Seed) 데이터 적재**: `prisma/seed.js`를 구동하여 영화 4종, 극장 정보, 6개 상영관 전체 물리 좌석(약 1,000석), 그리고 향후 7일간의 날짜별 상영 시간표 200여 개를 Supabase 클라우드 DB에 적재 성공했습니다.

---

## 3. 핵심 비즈니스 로직 및 동시성 제어 적용
* **임시 좌석 선점제 (10분 TTL)**:
  * 사용자가 결제 페이지로 갈 때 `POST /api/booking/hold` API를 호출합니다.
  * **1단계(메모리 락)**: `src/lib/lock.ts`에 개발된 `MemoryLockManager`가 고속으로 중복 락 여부를 체크하여 1차 차단합니다.
  * **2단계(DB 유니크 제약)**: `TemporaryHold` 테이블에 `[showtimeId, seatNo]` 유니크 제약 조건을 걸어, 극단적인 동시 경합 트래픽이 발생하더라도 DB 수준에서 절대 중복 생성이 발생하지 않도록 원천 격리했습니다.
* **최종 예매 트랜잭션 보장**:
  * 결제 완료 시 호출되는 `POST /api/booking/reserve`는 **Prisma 단일 트랜잭션(`$transaction`)** 내에서 작동합니다.
  * 타인의 동시 결제 경합 여부를 재검증한 뒤, 임시 홀드 데이터를 삭제함과 동시에 `Reservation`과 `Payment` 데이터를 원자적(Atomic)으로 생성합니다.

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

---

## 5. 검증 완료 내역

* **TypeScript & Production Build 검증 완료**:
  * Next.js 16 빌드 파이프라인(`npm run build`)을 실행하여 컴파일 에러 없는 완전한 빌드를 확인했습니다.
  * `Time` 및 `Seats` 컴포넌트의 가변적 `id` 타입 헬퍼 및 예외 처리 구문을 추가하여 빌드 안정성을 확보했습니다.
* **로컬 상태 관리 연동 완료**:
  * `src/context/BookingContext.tsx` 내의 구버전 `localStorage` 참조 및 상태 보정 로직을 `fetch` API 기반 서버 연동으로 마이그레이션했습니다.
  * 메인 차트(`app/page.tsx`), 상세 정보(`app/movies/[id]/page.tsx`), 예매 시간표(`app/booking/page.tsx`), 좌석 선택(`app/booking/seats/page.tsx`), 결제(`app/booking/payment/page.tsx`), 티켓 목록(`app/ticket/page.tsx`)에 대한 모든 동적 API 데이터 흐름 연동이 완료되었습니다.
