/**
 * 비회원 재타겟팅 이메일 템플릿
 *
 * 7일 전 비회원 매칭을 받은 리드에게 마감 임박 공고를 알리는 이메일
 */

interface RetargetingEmailParams {
  leadName: string
  matchedAnnouncements: Array<{
    title: string
    organization: string
    daysLeft: number
    url: string
  }>
  upgradeUrl: string
  unsubscribeUrl: string
}

export function renderRetargetingEmail(params: RetargetingEmailParams): string {
  const { leadName, matchedAnnouncements, upgradeUrl, unsubscribeUrl } = params

  // 마감 임박 공고 목록 HTML
  const announcementHtml = matchedAnnouncements.map((a) => `
    <div style="background-color:#f9fafb;border-radius:8px;padding:16px;margin-bottom:12px;border-left:4px solid ${a.daysLeft <= 3 ? '#ef4444' : a.daysLeft <= 7 ? '#f59e0b' : '#3b82f6'};">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
        <span style="font-size:12px;color:#6b7280;">${a.organization}</span>
        <span style="font-size:12px;font-weight:bold;color:${a.daysLeft <= 3 ? '#ef4444' : a.daysLeft <= 7 ? '#f59e0b' : '#3b82f6'};background-color:${a.daysLeft <= 3 ? '#fef2f2' : a.daysLeft <= 7 ? '#fffbeb' : '#eff6ff'};padding:2px 8px;border-radius:4px;">D-${a.daysLeft}</span>
      </div>
      <h3 style="font-size:14px;font-weight:600;color:#1f2937;margin:0 0 12px;line-height:1.4;">${a.title}</h3>
      <a href="${a.url}" style="display:inline-block;font-size:13px;color:#2563eb;text-decoration:none;">상세보기 →</a>
    </div>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>마감 임박 공고 알림 - GovHelper</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f5f5f5;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
    <!-- 헤더 -->
    <div style="background-color:#2563eb;padding:24px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:bold;">GovHelper</h1>
      <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">마감 임박 공고 알림</p>
    </div>

    <!-- 본문 -->
    <div style="padding:24px;">
      <p style="font-size:16px;color:#374151;margin:0 0 8px;">
        안녕하세요, <strong>${leadName}</strong>님!
      </p>
      <p style="font-size:14px;color:#6b7280;margin:0 0 24px;">
        7일 전 받으신 매칭 분석 결과 중 일부 공고가 곧 마감돼요. 놓치지 마세요!
      </p>

      <!-- 마감 임박 공고 목록 -->
      <h2 style="font-size:16px;color:#1f2937;margin:0 0 16px;font-weight:600;">
        🔥 마감 임박 공고 (${matchedAnnouncements.length}건)
      </h2>

      ${announcementHtml}

      <!-- Pro 업그레이드 CTA -->
      <div style="background-color:#eff6ff;border-radius:8px;padding:20px;margin-top:24px;text-align:center;">
        <p style="font-size:14px;color:#1e40af;margin:0 0 8px;font-weight:600;">
          더 많은 매칭 공고를 확인하고 싶으신가요?
        </p>
        <p style="font-size:13px;color:#3b82f6;margin:0 0 16px;">
          Pro 플랜으로 업그레이드하시면 모든 매칭 결과와 AI 지원서 작성 기능을 이용할 수 있어요.
        </p>
        <a href="${upgradeUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">
          Pro 플랜 시작하기 (월 ₩5,000)
        </a>
      </div>

      <!-- 회원가입 안내 -->
      <div style="background-color:#f9fafb;border-radius:8px;padding:16px;margin-top:16px;text-align:center;">
        <p style="font-size:13px;color:#6b7280;margin:0 0 8px;">
          아직 회원이 아니신가요?
        </p>
        <a href="https://govhelpers.com/register" style="display:inline-block;color:#2563eb;text-decoration:underline;font-size:13px;">
          무료 회원가입하기
        </a>
      </div>
    </div>

    <!-- 푸터 -->
    <div style="background-color:#f9fafb;padding:16px 24px;border-top:1px solid #e5e7eb;">
      <p style="font-size:12px;color:#9ca3af;margin:0 0 8px;text-align:center;">
        이 이메일은 7일 전 GovHelper에서 AI 매칭 분석을 요청하셨기에 발송됐어요.
      </p>
      <p style="font-size:12px;color:#9ca3af;margin:0;text-align:center;">
        <a href="${unsubscribeUrl}" style="color:#6b7280;text-decoration:underline;">수신 거부</a> | <a href="https://govhelpers.com" style="color:#6b7280;text-decoration:underline;">GovHelper</a>
      </p>
    </div>
  </div>
</body>
</html>
  `
}
