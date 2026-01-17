# Deploy 스킬

프로덕션 환경에 배포합니다.

## 실행 단계

1. 빌드 오류 확인
```bash
npm run build
```

2. 린트 검사
```bash
npm run lint
```

3. Git 상태 확인 및 커밋
```bash
git status
git add .
git commit -m "배포: [변경 내용 요약]"
```

4. Vercel 배포
```bash
git push origin master
```

또는 Vercel CLI 사용:
```bash
vercel --prod
```

## 주의사항
- 환경 변수가 Vercel에 설정되어 있는지 확인
- 빌드 실패 시 배포 중단
- 프로덕션 URL: https://govhelpers.com
