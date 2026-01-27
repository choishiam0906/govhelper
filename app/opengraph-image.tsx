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
          background: '#0a0a0a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* 배경 그라디언트 효과 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.03) 0%, transparent 50%)',
          }}
        />

        {/* 로고 영역 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
          }}
        >
          {/* 로고 아이콘 - 검정 바탕 흰색 G */}
          <div
            style={{
              width: '90px',
              height: '90px',
              background: '#171717',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '24px',
              border: '2px solid rgba(255,255,255,0.1)',
            }}
          >
            <span
              style={{
                fontSize: '52px',
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              G
            </span>
          </div>
          {/* 로고 텍스트 */}
          <div
            style={{
              fontSize: '58px',
              fontWeight: 'bold',
              color: 'white',
              letterSpacing: '-0.02em',
            }}
          >
            GovHelper
          </div>
        </div>

        {/* 메인 타이틀 */}
        <div
          style={{
            fontSize: '38px',
            fontWeight: '600',
            color: 'rgba(255,255,255,0.95)',
            textAlign: 'center',
            marginBottom: '16px',
          }}
        >
          AI 기반 정부지원사업 매칭 플랫폼
        </div>

        {/* 서브 타이틀 */}
        <div
          style={{
            fontSize: '26px',
            color: 'rgba(255,255,255,0.6)',
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          30초만에 우리 기업에 맞는 정부지원금을 찾아드려요
        </div>

        {/* 하단 뱃지들 */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '50px',
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '24px',
              padding: '10px 24px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '18px',
              fontWeight: '500',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            중소벤처24
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '24px',
              padding: '10px 24px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '18px',
              fontWeight: '500',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            기업마당
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '24px',
              padding: '10px 24px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '18px',
              fontWeight: '500',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            K-Startup
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '24px',
              padding: '10px 24px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '18px',
              fontWeight: '500',
              border: '1px solid rgba(255,255,255,0.1)',
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
            fontSize: '20px',
            color: 'rgba(255,255,255,0.4)',
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
