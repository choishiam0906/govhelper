import JSZip from 'jszip'

interface HwpxSection {
  title: string
  content: string
}

interface HwpxDocument {
  title: string
  organization?: string
  sections: HwpxSection[]
  metadata?: {
    author?: string
    createdAt?: string
    matchScore?: number
    category?: string
    supportType?: string
    supportAmount?: string
    applicationEnd?: string
  }
}

// HWPX mimetype
const MIMETYPE = 'application/hwp+zip'

// META-INF/container.xml
const CONTAINER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="Contents/content.hpf" media-type="application/hwpx-package+xml"/>
  </rootfiles>
</container>`

// META-INF/manifest.xml 생성
function generateManifestXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="application/hwp+zip"/>
  <manifest:file-entry manifest:full-path="Contents/content.hpf" manifest:media-type="application/hwpx-package+xml"/>
  <manifest:file-entry manifest:full-path="Contents/header.xml" manifest:media-type="application/xml"/>
  <manifest:file-entry manifest:full-path="Contents/section0.xml" manifest:media-type="application/xml"/>
</manifest:manifest>`
}

// Contents/content.hpf 생성 (패키지 정보)
function generateContentHpf(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<opf:package version="1.0" xmlns:opf="http://www.idpf.org/2007/opf" unique-identifier="book-id">
  <opf:metadata>
    <dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">지원서</dc:title>
    <dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">정부지원사업도우미</dc:creator>
    <dc:date xmlns:dc="http://purl.org/dc/elements/1.1/">${new Date().toISOString()}</dc:date>
  </opf:metadata>
  <opf:manifest>
    <opf:item id="header" href="header.xml" media-type="application/xml"/>
    <opf:item id="section0" href="section0.xml" media-type="application/xml"/>
  </opf:manifest>
  <opf:spine>
    <opf:itemref idref="section0"/>
  </opf:spine>
</opf:package>`
}

// Contents/header.xml 생성 (문서 설정)
function generateHeaderXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<hh:head xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head">
  <hh:docOption>
    <hh:linkinfo/>
  </hh:docOption>
  <hh:docProperty>
    <hh:secCnt>1</hh:secCnt>
  </hh:docProperty>
  <hh:mappingTable>
    <hh:fontfaces>
      <hh:fontface id="0" lang="HANGUL" face="맑은 고딕"/>
      <hh:fontface id="1" lang="LATIN" face="맑은 고딕"/>
    </hh:fontfaces>
    <hh:charProperties>
      <hh:charPr id="0">
        <hh:fontRef hangul="0" latin="1"/>
        <hh:fontSz val="1000"/>
      </hh:charPr>
      <hh:charPr id="1">
        <hh:fontRef hangul="0" latin="1"/>
        <hh:fontSz val="1600"/>
        <hh:bold val="true"/>
      </hh:charPr>
      <hh:charPr id="2">
        <hh:fontRef hangul="0" latin="1"/>
        <hh:fontSz val="1200"/>
        <hh:bold val="true"/>
      </hh:charPr>
    </hh:charProperties>
    <hh:paraProperties>
      <hh:paraPr id="0">
        <hh:align val="JUSTIFY"/>
        <hh:margin left="0" right="0"/>
        <hh:lineSpacing type="PERCENT" val="160"/>
      </hh:paraPr>
      <hh:paraPr id="1">
        <hh:align val="CENTER"/>
        <hh:margin left="0" right="0"/>
        <hh:lineSpacing type="PERCENT" val="160"/>
      </hh:paraPr>
    </hh:paraProperties>
  </hh:mappingTable>
</hh:head>`
}

// 텍스트 이스케이프 처리
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// 문단 생성
function generateParagraph(text: string, charPrId: number = 0, paraPrId: number = 0): string {
  const lines = text.split('\n')
  return lines.map(line => `
      <hp:p>
        <hp:paraPr prId="${paraPrId}"/>
        <hp:run>
          <hp:rPr prId="${charPrId}"/>
          <hp:t>${escapeXml(line)}</hp:t>
        </hp:run>
      </hp:p>`).join('')
}

// Contents/section0.xml 생성 (본문)
function generateSectionXml(doc: HwpxDocument): string {
  let content = ''

  // 제목
  content += generateParagraph(doc.title, 1, 1)
  content += generateParagraph('', 0, 0) // 빈 줄

  // 기관
  if (doc.organization) {
    content += generateParagraph(doc.organization, 0, 1)
    content += generateParagraph('', 0, 0)
  }

  // 메타 정보 (있는 경우)
  if (doc.metadata) {
    const metaLines = []
    if (doc.metadata.category) metaLines.push(`분류: ${doc.metadata.category}`)
    if (doc.metadata.supportType) metaLines.push(`지원유형: ${doc.metadata.supportType}`)
    if (doc.metadata.supportAmount) metaLines.push(`지원금액: ${doc.metadata.supportAmount}`)
    if (doc.metadata.applicationEnd) {
      const endDate = new Date(doc.metadata.applicationEnd).toLocaleDateString('ko-KR')
      metaLines.push(`접수마감: ${endDate}`)
    }
    if (doc.metadata.matchScore !== undefined) {
      metaLines.push(`매칭점수: ${doc.metadata.matchScore}점`)
    }

    if (metaLines.length > 0) {
      content += generateParagraph(metaLines.join(' | '), 0, 0)
      content += generateParagraph('', 0, 0)
      content += generateParagraph('─'.repeat(40), 0, 0)
      content += generateParagraph('', 0, 0)
    }
  }

  // 각 섹션
  for (const section of doc.sections) {
    // 섹션 제목
    content += generateParagraph(`[${section.title}]`, 2, 0)
    content += generateParagraph('', 0, 0)

    // 섹션 내용
    content += generateParagraph(section.content, 0, 0)
    content += generateParagraph('', 0, 0)
    content += generateParagraph('', 0, 0)
  }

  // 푸터
  content += generateParagraph('─'.repeat(40), 0, 0)
  const footer = `정부지원사업도우미 | govhelpers.com | ${new Date().toLocaleDateString('ko-KR')} 생성`
  content += generateParagraph(footer, 0, 1)

  return `<?xml version="1.0" encoding="UTF-8"?>
<hs:sec xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section"
        xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph">
  <hs:secPr>
    <hs:grid lineGrid="0" charGrid="0"/>
    <hs:startNum pageStartsOn="BOTH" page="0"/>
    <hs:pageSz width="59528" height="84188"/>
    <hs:pageMar left="8504" right="8504" top="5668" bottom="4252" header="4252" footer="4252" gutter="0"/>
    <hs:pageNumPos pos="NONE"/>
  </hs:secPr>
  ${content}
</hs:sec>`
}

// HWPX 파일 생성
export async function generateHwpx(doc: HwpxDocument): Promise<Blob> {
  const zip = new JSZip()

  // mimetype (압축하지 않음)
  zip.file('mimetype', MIMETYPE, { compression: 'STORE' })

  // META-INF
  zip.file('META-INF/container.xml', CONTAINER_XML)
  zip.file('META-INF/manifest.xml', generateManifestXml())

  // Contents
  zip.file('Contents/content.hpf', generateContentHpf())
  zip.file('Contents/header.xml', generateHeaderXml())
  zip.file('Contents/section0.xml', generateSectionXml(doc))

  // ZIP 생성 (HWPX)
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/hwp+zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  })

  return blob
}

// 다운로드 헬퍼
export function downloadHwpx(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.hwpx') ? filename : `${filename}.hwpx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export type { HwpxDocument, HwpxSection }
