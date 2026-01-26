/**
 * 기업 문서 처리 서비스
 * PDF 업로드, 텍스트 추출, 청킹, 임베딩 생성
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { extractTextFromPDF, chunkText, TextChunk } from '@/lib/pdf'
import { generateEmbedding } from '@/lib/ai/gemini'

export interface DocumentUploadResult {
  success: boolean
  documentId?: string
  error?: string
}

export interface DocumentProcessResult {
  success: boolean
  chunksCreated?: number
  error?: string
}

/**
 * 문서 업로드 및 메타데이터 저장
 */
export async function uploadCompanyDocument(
  supabase: SupabaseClient,
  companyId: string,
  file: File,
  documentType: string = 'business_plan'
): Promise<DocumentUploadResult> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) {
      return { success: false, error: '로그인이 필요해요' }
    }

    // 파일 크기 제한 (250MB - Vercel Pro)
    if (file.size > 250 * 1024 * 1024) {
      return { success: false, error: '파일 크기는 250MB 이하여야 해요' }
    }

    // Storage에 업로드
    const fileName = `${userId}/${companyId}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('company-documents')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Storage 업로드 실패:', uploadError)
      return { success: false, error: `파일 업로드 실패: ${uploadError.message}` }
    }

    // 문서 레코드 생성
    const { data: document, error: insertError } = await supabase
      .from('company_documents')
      .insert({
        company_id: companyId,
        file_name: file.name,
        file_url: fileName,
        file_size: file.size,
        file_type: file.type,
        document_type: documentType,
        status: 'pending',
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('문서 레코드 생성 실패:', insertError)
      // Storage에서 파일 삭제
      await supabase.storage.from('company-documents').remove([fileName])
      return { success: false, error: '문서 저장에 실패했어요' }
    }

    return { success: true, documentId: document.id }
  } catch (error) {
    console.error('문서 업로드 오류:', error)
    return { success: false, error: '문서 업로드 중 오류가 발생했어요' }
  }
}

/**
 * 문서 처리 (텍스트 추출 + 청킹 + 임베딩)
 */
export async function processCompanyDocument(
  supabase: SupabaseClient,
  documentId: string
): Promise<DocumentProcessResult> {
  try {
    // 문서 정보 조회
    const { data: document, error: fetchError } = await supabase
      .from('company_documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (fetchError || !document) {
      return { success: false, error: '문서를 찾을 수 없어요' }
    }

    // 상태 업데이트: processing
    await supabase
      .from('company_documents')
      .update({ status: 'processing' })
      .eq('id', documentId)

    // Storage에서 파일 다운로드
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('company-documents')
      .download(document.file_url)

    if (downloadError || !fileData) {
      await updateDocumentStatus(supabase, documentId, 'failed', '파일 다운로드 실패')
      return { success: false, error: '파일 다운로드에 실패했어요' }
    }

    // PDF 텍스트 추출
    const buffer = Buffer.from(await fileData.arrayBuffer())
    const extractResult = await extractTextFromPDF(buffer)

    if (!extractResult.success) {
      await updateDocumentStatus(supabase, documentId, 'failed', extractResult.error)
      return { success: false, error: extractResult.error }
    }

    // 추출된 텍스트 저장
    await supabase
      .from('company_documents')
      .update({
        extracted_text: extractResult.text,
        page_count: extractResult.pageCount,
      })
      .eq('id', documentId)

    // 텍스트 청킹
    const chunks = chunkText(extractResult.text)

    if (chunks.length === 0) {
      await updateDocumentStatus(supabase, documentId, 'failed', '텍스트를 추출할 수 없어요')
      return { success: false, error: '텍스트를 추출할 수 없어요' }
    }

    // 기존 청크 삭제
    await supabase
      .from('company_document_chunks')
      .delete()
      .eq('document_id', documentId)

    // 청크 저장 및 임베딩 생성
    const chunksWithEmbeddings = await generateChunkEmbeddings(chunks)

    // 청크 일괄 저장
    const chunkRecords = chunksWithEmbeddings.map((chunk) => ({
      document_id: documentId,
      company_id: document.company_id,
      chunk_index: chunk.index,
      chunk_text: chunk.text,
      embedding: chunk.embedding,
      token_count: chunk.tokenCount,
    }))

    const { error: chunkInsertError } = await supabase
      .from('company_document_chunks')
      .insert(chunkRecords)

    if (chunkInsertError) {
      console.error('청크 저장 실패:', chunkInsertError)
      await updateDocumentStatus(supabase, documentId, 'failed', '청크 저장 실패')
      return { success: false, error: '청크 저장에 실패했어요' }
    }

    // 상태 업데이트: completed
    await updateDocumentStatus(supabase, documentId, 'completed')

    return { success: true, chunksCreated: chunks.length }
  } catch (error) {
    console.error('문서 처리 오류:', error)
    await updateDocumentStatus(supabase, documentId, 'failed', '처리 중 오류 발생')
    return { success: false, error: '문서 처리 중 오류가 발생했어요' }
  }
}

/**
 * 청크에 임베딩 생성
 */
interface ChunkWithEmbedding extends TextChunk {
  embedding: number[] | null
}

async function generateChunkEmbeddings(
  chunks: TextChunk[]
): Promise<ChunkWithEmbedding[]> {
  const results: ChunkWithEmbedding[] = []

  // 배치 처리 (Rate limit 고려)
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]

    try {
      const embedding = await generateEmbedding(chunk.text)
      results.push({ ...chunk, embedding })
    } catch (error) {
      console.error(`청크 ${i} 임베딩 생성 실패:`, error)
      results.push({ ...chunk, embedding: null })
    }

    // Rate limit 방지: 10개마다 1초 대기
    if ((i + 1) % 10 === 0 && i < chunks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return results
}

/**
 * 문서 상태 업데이트
 */
async function updateDocumentStatus(
  supabase: SupabaseClient,
  documentId: string,
  status: string,
  errorMessage?: string
): Promise<void> {
  await supabase
    .from('company_documents')
    .update({
      status,
      error_message: errorMessage || null,
    })
    .eq('id', documentId)
}

/**
 * 회사의 문서 목록 조회
 */
export async function getCompanyDocuments(
  supabase: SupabaseClient,
  companyId: string
) {
  const { data, error } = await supabase
    .from('company_documents')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('문서 목록 조회 실패:', error)
    return []
  }

  return data || []
}

/**
 * 문서 삭제
 */
export async function deleteCompanyDocument(
  supabase: SupabaseClient,
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 문서 정보 조회
    const { data: document } = await supabase
      .from('company_documents')
      .select('file_url')
      .eq('id', documentId)
      .single()

    if (document?.file_url) {
      // Storage에서 파일 삭제
      await supabase.storage.from('company-documents').remove([document.file_url])
    }

    // 청크 삭제 (CASCADE로 자동 삭제되지만 명시적으로)
    await supabase
      .from('company_document_chunks')
      .delete()
      .eq('document_id', documentId)

    // 문서 레코드 삭제
    const { error } = await supabase
      .from('company_documents')
      .delete()
      .eq('id', documentId)

    if (error) {
      return { success: false, error: '문서 삭제에 실패했어요' }
    }

    return { success: true }
  } catch (error) {
    console.error('문서 삭제 오류:', error)
    return { success: false, error: '문서 삭제 중 오류가 발생했어요' }
  }
}
