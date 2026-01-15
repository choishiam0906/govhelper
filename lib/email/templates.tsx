import * as React from 'react'

interface DeadlineEmailProps {
  userName: string
  announcements: Array<{
    id: string
    title: string
    organization: string
    endDate: string
    daysLeft: number
    detailUrl: string
  }>
  unsubscribeUrl: string
}

export function DeadlineReminderEmail({
  userName,
  announcements,
  unsubscribeUrl,
}: DeadlineEmailProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>마감 임박 공고 알림 - GovHelper</title>
      </head>
      <body style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#f5f5f5',
        margin: 0,
        padding: '20px',
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          {/* 헤더 */}
          <div style={{
            backgroundColor: '#2563eb',
            padding: '24px',
            textAlign: 'center' as const,
          }}>
            <h1 style={{
              color: '#ffffff',
              margin: 0,
              fontSize: '24px',
              fontWeight: 'bold',
            }}>
              GovHelper
            </h1>
            <p style={{
              color: '#bfdbfe',
              margin: '8px 0 0',
              fontSize: '14px',
            }}>
              마감 임박 공고 알림
            </p>
          </div>

          {/* 본문 */}
          <div style={{ padding: '24px' }}>
            <p style={{
              fontSize: '16px',
              color: '#374151',
              margin: '0 0 16px',
            }}>
              안녕하세요, {userName}님!
            </p>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '0 0 24px',
            }}>
              관심 등록하신 공고 중 마감이 임박한 공고가 있어요.
            </p>

            {/* 공고 목록 */}
            {announcements.map((announcement, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px',
                  borderLeft: announcement.daysLeft <= 1
                    ? '4px solid #ef4444'
                    : announcement.daysLeft <= 3
                    ? '4px solid #f59e0b'
                    : '4px solid #3b82f6',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px',
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: '#6b7280',
                  }}>
                    {announcement.organization}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: announcement.daysLeft <= 1 ? '#ef4444' : announcement.daysLeft <= 3 ? '#f59e0b' : '#3b82f6',
                    backgroundColor: announcement.daysLeft <= 1 ? '#fef2f2' : announcement.daysLeft <= 3 ? '#fffbeb' : '#eff6ff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}>
                    D-{announcement.daysLeft}
                  </span>
                </div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0 0 8px',
                  lineHeight: '1.4',
                }}>
                  {announcement.title}
                </h3>
                <p style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  margin: '0 0 12px',
                }}>
                  마감일: {announcement.endDate}
                </p>
                <a
                  href={announcement.detailUrl}
                  style={{
                    display: 'inline-block',
                    fontSize: '13px',
                    color: '#2563eb',
                    textDecoration: 'none',
                  }}
                >
                  상세보기 →
                </a>
              </div>
            ))}

            {/* CTA 버튼 */}
            <div style={{ textAlign: 'center' as const, marginTop: '24px' }}>
              <a
                href="https://govhelpers.com/dashboard/announcements"
                style={{
                  display: 'inline-block',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                전체 공고 보기
              </a>
            </div>
          </div>

          {/* 푸터 */}
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
          }}>
            <p style={{
              fontSize: '12px',
              color: '#9ca3af',
              margin: '0 0 8px',
              textAlign: 'center' as const,
            }}>
              이 이메일은 GovHelper 알림 설정에 따라 발송됐어요.
            </p>
            <p style={{
              fontSize: '12px',
              color: '#9ca3af',
              margin: 0,
              textAlign: 'center' as const,
            }}>
              <a
                href={unsubscribeUrl}
                style={{ color: '#6b7280', textDecoration: 'underline' }}
              >
                알림 설정 변경
              </a>
              {' | '}
              <a
                href="https://govhelpers.com"
                style={{ color: '#6b7280', textDecoration: 'underline' }}
              >
                GovHelper
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}

// 이메일 HTML 문자열 생성 (React Server Components에서 사용)
export function renderDeadlineEmail(props: DeadlineEmailProps): string {
  const { userName, announcements, unsubscribeUrl } = props

  const announcementHtml = announcements.map((a) => `
    <div style="background-color:#f9fafb;border-radius:8px;padding:16px;margin-bottom:12px;border-left:4px solid ${a.daysLeft <= 1 ? '#ef4444' : a.daysLeft <= 3 ? '#f59e0b' : '#3b82f6'};">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
        <span style="font-size:12px;color:#6b7280;">${a.organization}</span>
        <span style="font-size:12px;font-weight:bold;color:${a.daysLeft <= 1 ? '#ef4444' : a.daysLeft <= 3 ? '#f59e0b' : '#3b82f6'};background-color:${a.daysLeft <= 1 ? '#fef2f2' : a.daysLeft <= 3 ? '#fffbeb' : '#eff6ff'};padding:2px 8px;border-radius:4px;">D-${a.daysLeft}</span>
      </div>
      <h3 style="font-size:14px;font-weight:600;color:#1f2937;margin:0 0 8px;line-height:1.4;">${a.title}</h3>
      <p style="font-size:12px;color:#6b7280;margin:0 0 12px;">마감일: ${a.endDate}</p>
      <a href="${a.detailUrl}" style="display:inline-block;font-size:13px;color:#2563eb;text-decoration:none;">상세보기 →</a>
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
    <div style="background-color:#2563eb;padding:24px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:bold;">GovHelper</h1>
      <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">마감 임박 공고 알림</p>
    </div>
    <div style="padding:24px;">
      <p style="font-size:16px;color:#374151;margin:0 0 16px;">안녕하세요, ${userName}님!</p>
      <p style="font-size:14px;color:#6b7280;margin:0 0 24px;">관심 등록하신 공고 중 마감이 임박한 공고가 있어요.</p>
      ${announcementHtml}
      <div style="text-align:center;margin-top:24px;">
        <a href="https://govhelpers.com/dashboard/announcements" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">전체 공고 보기</a>
      </div>
    </div>
    <div style="background-color:#f9fafb;padding:16px 24px;border-top:1px solid #e5e7eb;">
      <p style="font-size:12px;color:#9ca3af;margin:0 0 8px;text-align:center;">이 이메일은 GovHelper 알림 설정에 따라 발송됐어요.</p>
      <p style="font-size:12px;color:#9ca3af;margin:0;text-align:center;">
        <a href="${unsubscribeUrl}" style="color:#6b7280;text-decoration:underline;">알림 설정 변경</a> | <a href="https://govhelpers.com" style="color:#6b7280;text-decoration:underline;">GovHelper</a>
      </p>
    </div>
  </div>
</body>
</html>
  `
}
