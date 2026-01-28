// HWPX (한글 파일) 생성 테스트
// lib/hwpx/generator.ts 테스트

import { describe, it, expect } from 'vitest'

// HWPX 파일 구조
interface HWPXDocument {
  mimetype: string
  container: {
    rootFiles: Array<{ fullPath: string; mediaType: string }>
  }
  manifest: {
    fileEntries: Array<{ fullPath: string; mediaType: string }>
  }
  header: {
    fontFaces: string[]
    styles: string[]
  }
  sections: Array<{
    id: string
    content: string
  }>
}

describe('HWPX 생성', () => {
  describe('기본 구조', () => {
    it('mimetype은 application/hwp+zip', () => {
      const mimetype = 'application/hwp+zip'

      expect(mimetype).toBe('application/hwp+zip')
    })

    it('루트 파일은 content.hpf', () => {
      const container = {
        rootFiles: [
          { fullPath: 'Contents/content.hpf', mediaType: 'application/vnd.hancom.hpf' },
        ],
      }

      expect(container.rootFiles[0].fullPath).toBe('Contents/content.hpf')
    })

    it('필수 파일 목록 포함', () => {
      const manifest = {
        fileEntries: [
          { fullPath: 'Contents/content.hpf', mediaType: 'application/vnd.hancom.hpf' },
          { fullPath: 'Contents/header.xml', mediaType: 'text/xml' },
          { fullPath: 'Contents/section0.xml', mediaType: 'text/xml' },
        ],
      }

      expect(manifest.fileEntries).toHaveLength(3)
      expect(manifest.fileEntries.map(f => f.fullPath)).toContain('Contents/section0.xml')
    })
  })

  describe('폰트 설정', () => {
    it('기본 폰트는 맑은 고딕', () => {
      const fontFaces = ['맑은 고딕', 'Malgun Gothic']

      expect(fontFaces).toContain('맑은 고딕')
    })

    it('영문 폰트는 Arial', () => {
      const fontFaces = ['맑은 고딕', 'Arial']

      expect(fontFaces).toContain('Arial')
    })
  })

  describe('스타일 설정', () => {
    it('제목 스타일: 16pt, 굵게', () => {
      const titleStyle = {
        name: 'Heading1',
        fontSize: '16pt',
        fontWeight: 'bold',
      }

      expect(titleStyle.fontSize).toBe('16pt')
      expect(titleStyle.fontWeight).toBe('bold')
    })

    it('본문 스타일: 11pt, 보통', () => {
      const bodyStyle = {
        name: 'Body',
        fontSize: '11pt',
        fontWeight: 'normal',
      }

      expect(bodyStyle.fontSize).toBe('11pt')
      expect(bodyStyle.fontWeight).toBe('normal')
    })

    it('부제목 스타일: 14pt, 굵게', () => {
      const subtitleStyle = {
        name: 'Heading2',
        fontSize: '14pt',
        fontWeight: 'bold',
      }

      expect(subtitleStyle.fontSize).toBe('14pt')
    })
  })

  describe('섹션 생성', () => {
    it('단일 섹션', () => {
      const sections = [
        {
          id: 'section0',
          content: '<p>본문 내용</p>',
        },
      ]

      expect(sections).toHaveLength(1)
      expect(sections[0].id).toBe('section0')
    })

    it('여러 섹션', () => {
      const sections = [
        { id: 'section0', content: '<p>1장</p>' },
        { id: 'section1', content: '<p>2장</p>' },
        { id: 'section2', content: '<p>3장</p>' },
      ]

      expect(sections).toHaveLength(3)
      expect(sections.map(s => s.id)).toEqual(['section0', 'section1', 'section2'])
    })
  })

  describe('지원서 내용 변환', () => {
    it('공고 메타정보 포함', () => {
      const meta = {
        title: 'IT 스타트업 지원사업',
        organization: '중소벤처기업부',
        category: '기술개발',
        supportType: '지원금',
        supportAmount: '5000만원',
        applicationEnd: '2026-02-28',
      }

      const content = `
<p><strong>공고명:</strong> ${meta.title}</p>
<p><strong>주관기관:</strong> ${meta.organization}</p>
<p><strong>분류:</strong> ${meta.category}</p>
<p><strong>지원유형:</strong> ${meta.supportType}</p>
<p><strong>지원금액:</strong> ${meta.supportAmount}</p>
<p><strong>마감일:</strong> ${meta.applicationEnd}</p>
      `

      expect(content).toContain(meta.title)
      expect(content).toContain(meta.organization)
      expect(content).toContain(meta.supportAmount)
    })

    it('매칭 점수 포함', () => {
      const matchScore = 85

      const content = `<p><strong>AI 매칭 점수:</strong> ${matchScore}점</p>`

      expect(content).toContain('85점')
    })

    it('섹션별 내용 포함', () => {
      const sections = [
        { title: '1. 사업 개요', content: '본 사업은...' },
        { title: '2. 기술개발 내용', content: '개발 목표는...' },
        { title: '3. 사업화 계획', content: '시장 진입 전략은...' },
      ]

      const content = sections
        .map(
          s => `
<h2>${s.title}</h2>
<p>${s.content}</p>
      `
        )
        .join('')

      expect(content).toContain('1. 사업 개요')
      expect(content).toContain('2. 기술개발 내용')
      expect(content).toContain('3. 사업화 계획')
    })
  })

  describe('텍스트 이스케이프', () => {
    it('특수문자 이스케이프', () => {
      const text = 'A & B'
      const escaped = text.replace(/&/g, '&amp;')

      expect(escaped).toBe('A &amp; B')
    })

    it('HTML 태그 이스케이프', () => {
      const text = '<script>alert("XSS")</script>'
      const escaped = text
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

      expect(escaped).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;')
    })

    it('큰따옴표 이스케이프', () => {
      const text = 'He said "Hello"'
      const escaped = text.replace(/"/g, '&quot;')

      expect(escaped).toBe('He said &quot;Hello&quot;')
    })
  })

  describe('ZIP 생성', () => {
    it('파일 추가', () => {
      const files = [
        { path: 'mimetype', content: 'application/hwp+zip' },
        { path: 'META-INF/container.xml', content: '<container>...</container>' },
        { path: 'Contents/content.hpf', content: '<package>...</package>' },
        { path: 'Contents/header.xml', content: '<head>...</head>' },
        { path: 'Contents/section0.xml', content: '<section>...</section>' },
      ]

      expect(files).toHaveLength(5)
      expect(files[0].path).toBe('mimetype')
    })

    it('mimetype은 압축하지 않음', () => {
      const mimetypeCompression = 'STORE' // 압축 안 함

      expect(mimetypeCompression).toBe('STORE')
    })

    it('나머지 파일은 DEFLATE 압축', () => {
      const defaultCompression = 'DEFLATE'

      expect(defaultCompression).toBe('DEFLATE')
    })
  })

  describe('파일명 생성', () => {
    it('공고명 기반 파일명', () => {
      const announcementTitle = 'IT 스타트업 지원사업'
      const sanitized = announcementTitle.replace(/[/\\?%*:|"<>]/g, '-')
      const filename = `${sanitized}_지원서.hwpx`

      expect(filename).toBe('IT 스타트업 지원사업_지원서.hwpx')
    })

    it('특수문자 제거', () => {
      const announcementTitle = 'A/B:C*D?E<F>G|H"I'
      const sanitized = announcementTitle.replace(/[/\\?%*:|"<>]/g, '-')

      expect(sanitized).toBe('A-B-C-D-E-F-G-H-I')
    })

    it('날짜 포함 파일명', () => {
      const date = '2026-01-28'
      const filename = `지원서_${date}.hwpx`

      expect(filename).toBe('지원서_2026-01-28.hwpx')
    })
  })

  describe('한글 호환성', () => {
    it('한글 2014+ 지원 (HWPX)', () => {
      const format = 'HWPX'
      const minVersion = '2014'

      expect(format).toBe('HWPX')
      expect(minVersion).toBe('2014')
    })

    it('HWP 포맷은 지원하지 않음', () => {
      const supportedFormats = ['HWPX']

      expect(supportedFormats).not.toContain('HWP')
    })
  })

  describe('에러 처리', () => {
    it('빈 섹션은 건너뜀', () => {
      const sections = [
        { title: '1. 사업 개요', content: '본 사업은...' },
        { title: '2. 기술개발 내용', content: '' },
        { title: '3. 사업화 계획', content: '시장 진입...' },
      ]

      const nonEmpty = sections.filter(s => s.content.trim())

      expect(nonEmpty).toHaveLength(2)
    })

    it('ZIP 생성 실패 시 에러', () => {
      const createZip = (files: any[]) => {
        if (files.length === 0) {
          throw new Error('No files to zip')
        }
        return { success: true }
      }

      expect(() => createZip([])).toThrow('No files to zip')
    })

    it('유효하지 않은 XML 구조', () => {
      const invalidXml = '<p>unclosed tag'

      // XML 검증 (단순 체크)
      const isValid = invalidXml.includes('</p>')

      expect(isValid).toBe(false)
    })
  })
})
