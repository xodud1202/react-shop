## react-shop 검증 하네스

### 기본 명령
- `npm run lint`
- `npm run typecheck`
- `npm run build`

### 화면 검증 기준
- 기본 브라우저 직접 오픈 방식으로 확인한다.
- 포트 기준 URL은 `http://127.0.0.1:3014` 또는 `http://localhost:3014`다.
- 진입, 조회, 등록, 수정, 검증 시나리오는 공통 체크리스트 `../../AGENTS/harness/checklists/frontend-screen-change.md`를 따른다.

### 완료 기준
- lint, typecheck, build가 모두 성공해야 한다.
- 실제 화면에서 요청 기능을 조작해 확인해야 한다.
- 미실행 항목은 결과 보고에 사유를 남긴다.
