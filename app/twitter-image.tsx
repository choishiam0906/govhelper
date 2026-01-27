import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'GovHelper - AI 기반 정부지원사업 매칭 플랫폼'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        {/* 로고 영역 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
          }}
        >
          {/* 로고 아이콘 */}
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'white',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            <svg
              width="50"
              height="50"
              viewBox="0 0 24 24"
              fill="none"
              style={{ color: '#2563eb' }}
            >
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#2563eb"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          {/* 로고 텍스트 */}
          <div
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '0 2px 10px rgba(0,0,0,0.2)',
            }}
          >
            GovHelper
          </div>
        </div>

        {/* 메인 타이틀 */}
        <div
          style={{
            fontSize: '42px',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            marginBottom: '20px',
            textShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }}
        >
          AI 기반 정부지원사업 매칭 플랫폼
        </div>

        {/* 서브 타이틀 */}
        <div
          style={{
            fontSize: '28px',
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            maxWidth: '900px',
          }}
        >
          30초만에 우리 기업에 맞는 정부지원금을 찾아드려요
        </div>

        {/* 하단 뱃지들 */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            marginTop: '50px',
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '30px',
              padding: '12px 28px',
              color: 'white',
              fontSize: '22px',
              fontWeight: '500',
            }}
          >
            중소벤처24
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '30px',
              padding: '12px 28px',
              color: 'white',
              fontSize: '22px',
              fontWeight: '500',
            }}
          >
            기업마당
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '30px',
              padding: '12px 28px',
              color: 'white',
              fontSize: '22px',
              fontWeight: '500',
            }}
          >
            K-Startup
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '30px',
              padding: '12px 28px',
              color: 'white',
              fontSize: '22px',
              fontWeight: '500',
            }}
          >
            나라장터
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '60px',
            fontSize: '24px',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          govhelpers.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
