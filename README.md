<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="icons/gitpulse_logo_dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="icons/gitpulse_logo_light.svg">
    <img alt="GitPulse" src="icons/gitpulse_logo_light.svg" width="620">
  </picture>
</p>

**코드 뒤에 숨은 신호를 보세요.**

GitPulse는 Git 히스토리를 기반으로 코드베이스와 팀의 상태를 분석해주는 데스크탑 대시보드입니다.

CLI 명령어를 하나하나 실행하지 않아도, 저장소에서 실제로 어떤 일이 일어나고 있는지 한눈에 이해할 수 있습니다.

---

## 🚀 왜 GitPulse인가?

대부분의 Git 도구는 **저장소를 조작하는 데** 집중합니다.

GitPulse는 다릅니다.

👉 **저장소를 이해하는 데** 집중합니다.

Git 로그에는 다음과 같은 중요한 신호들이 숨어 있습니다:

- 어떤 파일이 계속 수정되는가
- 어디에서 버그가 자주 발생하는가
- 누가 코드를 대부분 책임지고 있는가
- 팀의 개발 속도는 어떤 흐름인가
- 배포는 안정적인가

GitPulse는 이 신호들을 시각적으로 보여줍니다.

---

## 🔍 GitPulse가 답하려는 질문

### 1. 무엇이 가장 자주 변경되는가?

- 변경 빈도가 높은 파일 (Hotspot)
- 장기적인 유지보수 부담 영역 식별
- 변경 빈도 + 버그 겹침 분석

---

### 2. 누가 이 코드를 만들었는가?

- 기여자별 커밋 비율
- Top contributor 집중도
- Bus factor 위험
- 핵심 기여자의 최근 활동 여부

---

### 3. 버그는 어디에 집중되는가?

- bug / fix 관련 커밋 기반 분석
- 버그 발생 빈도가 높은 파일
- 변경 많음 + 버그 많음 = 고위험 코드

---

### 4. 프로젝트가 가속 중인가, 정체 중인가?

- 월별 커밋 추세
- 증가 / 감소 패턴
- 팀 활동 흐름 파악

---

### 5. 팀이 얼마나 자주 긴급 대응 중인가?

- revert / hotfix / rollback 패턴 분석
- 긴급 대응 빈도 측정
- 배포 안정성 신호 확인

---

## 🧠 제품 정의

GitPulse는 단순한 Git UI가 아닙니다.

> **Git 히스토리를 기반으로 코드와 팀의 건강 상태를 분석하는 도구입니다.**

---

## 🖥 주요 기능 (예정)

### Overview Dashboard

- 전체 상태 요약
- 위험 신호 한눈에 확인

---

### Code Hotspots

- 가장 많이 변경된 파일
- 버그와 겹치는 파일
- 위험도 기반 정렬

---

### Team & Ownership

- 기여자 분포
- 지식 편중 분석
- Bus factor

---

### Activity Trend

- 월별 커밋 수
- 팀 활동 흐름

---

### Delivery Risk

- hotfix / revert 패턴
- 운영 안정성 분석

---

## 🎨 디자인 방향

GitPulse는 “판단”이 아니라 “신호”를 보여줍니다.

좋은 예:

- High change frequency detected
- Potential ownership concentration

나쁜 예:

- 이 파일은 문제다 ❌

---

## 🧰 기술 스택 (예정)

- Desktop: Tauri
- Frontend: React + TypeScript
- UI: TailwindCSS
- Charts: Recharts / ECharts
- Git 분석: Git CLI 기반
- 저장: JSON / SQLite

---

## 📌 GitPulse가 아닌 것

GitPulse는 다음을 목표로 하지 않습니다:

- Git GUI (commit/push)
- 정적 코드 분석 도구
- CI/CD 대시보드
- 협업 툴

---

## 🗺 로드맵

### v1

- workspace 선택
- 기본 분석
- overview
- hotspots
- ownership
- activity
- delivery

---

### v1.5

- bug hotspot 교차 분석
- 위험 점수 계산
- exclude 옵션

---

### v2

- AI 요약
- 브랜치 비교
- PR 연동
- 히트맵

---

## 🧩 철학

좋은 코드베이스는 코드만으로 판단할 수 없습니다.

중요한 것은:

- 변화의 빈도
- 지식의 분포
- 배포 안정성
- 팀의 지속성

GitPulse는 이 신호들을 드러냅니다.

---

## 📄 License

GitPulse is licensed under the [Apache License 2.0](LICENSE).
