# 영화 예매 서비스 ERD (Entity Relationship Diagram)

제공해주신 Prisma Schema 설계를 기반으로 도식화한 데이터베이스 개체 관계도(ERD)입니다.

---

## 1. Mermaid ERD 다이어그램

```mermaid
erDiagram
    User {
        string id PK
        string email UK
        string name
        string passwordHash
        datetime createdAt
        datetime updatedAt
    }

    Movie {
        string id PK
        string title
        string poster
        string ageLimit
        string runtime
        string genre
        float bookingRate
        int audienceCount
        datetime createdAt
    }

    Theater {
        string id PK
        string name
        string location
    }

    Screen {
        string id PK
        string theaterId FK
        string name
        int totalSeats
    }

    Seat {
        string id PK
        string screenId FK
        string seatNo
        string grade
        string row
        int col
    }

    Showtime {
        string id PK
        string movieId FK
        string theaterId FK
        string screenId FK
        string date
        string startTime
        string endTime
        datetime createdAt
    }

    TemporaryHold {
        string id PK
        string showtimeId FK
        string userId FK
        string seatNo
        datetime expiresAt
        datetime createdAt
    }

    Reservation {
        string id PK
        string userId FK
        string showtimeId FK
        string_array seats
        int totalPrice
        enum status
        datetime bookedAt
        datetime updatedAt
    }

    Payment {
        string id PK
        string reservationId FK-UK
        enum method
        int amount
        enum status
        datetime paidAt
    }

    %% 관계 정의
    User ||--o{ Reservation : "makes"
    User ||--o{ TemporaryHold : "holds"
    
    Movie ||--o{ Showtime : "schedules"
    
    Theater ||--o{ Screen : "has"
    Theater ||--o{ Showtime : "belongs_to"
    
    Screen ||--o{ Seat : "contains"
    Screen ||--o{ Showtime : "hosts"
    
    Showtime ||--o{ Reservation : "includes"
    Showtime ||--o{ TemporaryHold : "occupies"
    
    Reservation ||--|| Payment : "pays"
```

---

## 2. 테이블 관계 요약 설명

1. **사용자 (`User`)**
   * 한 명의 사용자는 여러 예매 내역(`Reservation`)을 가질 수 있습니다. (1:N)
   * 한 명의 사용자는 동시에 여러 좌석의 임시 선점(`TemporaryHold`)을 시도할 수 있습니다. (1:N)
2. **영화 (`Movie`) & 극장 (`Theater`) & 상영관 (`Screen`)**
   * 극장 하나는 여러 상영관(`Screen`)을 포함합니다. (1:N)
   * 상영관 하나는 관객들이 앉을 여러 개의 물리 좌석(`Seat`) 구조 정보를 가집니다. (1:N)
   * 상영 스케줄(`Showtime`)은 **영화**, **극장**, **상영관** 세 개의 정보가 조합되어 생성됩니다.
3. **상영일정 (`Showtime`) & 좌석 점유**
   * 하나의 상영일정에는 결제 중인 여러 임시 선점 데이터(`TemporaryHold`)가 생길 수 있습니다. (1:N)
   * 하나의 상영일정에는 최종 예매 완료된 여러 예매 내역(`Reservation`)이 포함될 수 있습니다. (1:N)
4. **예매 (`Reservation`) & 결제 (`Payment`)**
   * 예매 한 건은 하나의 결제 정보(`Payment`)를 가집니다. (1:1 관계, `reservationId`가 Unique Foreign Key로 설정됨)
