// 고용보험 사업장 정보 조회 소스

import type { EmploymentInsuranceResult } from "../types";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

// 고용보험 데이터 테이블 타입
interface EmploymentInsuranceRecord {
  id: string;
  business_number: string;
  company_name: string;
  business_type: string;
  total_insured: number;
  join_date: string | null;
  status: "active" | "inactive";
  address: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 사업자번호로 고용보험 정보 조회 (로컬 DB)
 *
 * @param supabase - Supabase 클라이언트 (선택)
 * @param businessNumber - 사업자등록번호 (10자리, 하이픈 포함 가능)
 * @returns 고용보험 정보 또는 null
 *
 * @example
 * // 기본 사용
 * const result = await lookupEmploymentInsuranceFromDB(null, '123-45-67890')
 *
 * // Supabase 클라이언트 지정
 * const supabase = createClient()
 * const result = await lookupEmploymentInsuranceFromDB(supabase, '1234567890')
 */
export async function lookupEmploymentInsuranceFromDB(
  supabase: SupabaseClient | null,
  businessNumber: string,
): Promise<EmploymentInsuranceResult | null> {
  try {
    const client = supabase || createClient();

    // 사업자번호 포맷 통일 (하이픈 제거)
    const formatted = businessNumber.replace(/[^0-9]/g, "");

    if (formatted.length !== 10) {
      return null;
    }

    const { data, error } = await client
      .from("employment_insurance")
      .select("*")
      .eq("business_number", formatted)
      .single();

    if (error || !data) {
      // 데이터가 없는 경우 null 반환 (에러가 아님)
      if (error?.code === "PGRST116") {
        return null;
      }
      console.error("Employment Insurance lookup error:", error);
      return null;
    }

    const record = data as unknown as EmploymentInsuranceRecord;

    return {
      source: "employment-insurance",
      businessNumber: record.business_number,
      companyName: record.company_name,
      businessType: record.business_type,
      totalInsured: record.total_insured,
      joinDate: record.join_date,
      status: record.status,
      address: record.address,
    };
  } catch (error) {
    console.error("Employment Insurance lookup error:", error);
    return null;
  }
}

/**
 * 회사명으로 고용보험 정보 검색 (유사 검색)
 *
 * @param supabase - Supabase 클라이언트 (선택)
 * @param companyName - 검색할 회사명
 * @param limit - 최대 결과 수 (기본: 10)
 * @returns 고용보험 정보 목록
 */
export async function searchEmploymentInsuranceByCompanyName(
  supabase: SupabaseClient | null,
  companyName: string,
  limit: number = 10,
): Promise<EmploymentInsuranceResult[]> {
  try {
    const client = supabase || createClient();

    const { data, error } = await client
      .from("employment_insurance")
      .select("*")
      .ilike("company_name", `%${companyName}%`)
      .limit(limit);

    if (error || !data) {
      console.error("Employment Insurance search error:", error);
      return [];
    }

    return (data as unknown as EmploymentInsuranceRecord[]).map((record) => ({
      source: "employment-insurance" as const,
      businessNumber: record.business_number,
      companyName: record.company_name,
      businessType: record.business_type,
      totalInsured: record.total_insured,
      joinDate: record.join_date,
      status: record.status,
      address: record.address,
    }));
  } catch (error) {
    console.error("Employment Insurance search error:", error);
    return [];
  }
}

/**
 * 고용보험 통계 (업종별 가입자 수)
 *
 * @param supabase - Supabase 클라이언트 (선택)
 * @returns 업종별 가입자 수 통계
 */
export async function getEmploymentInsuranceStatsByBusinessType(
  supabase: SupabaseClient | null,
): Promise<Record<string, number>> {
  try {
    const client = supabase || createClient();

    const { data, error } = await client
      .from("employment_insurance")
      .select("business_type, total_insured")
      .eq("status", "active");

    if (error || !data) {
      console.error("Employment Insurance stats error:", error);
      return {};
    }

    const stats: Record<string, number> = {};
    for (const record of data) {
      const businessType =
        (record as { business_type: string; total_insured: number })
          .business_type || "기타";
      const totalInsured =
        (record as { business_type: string; total_insured: number })
          .total_insured || 0;
      stats[businessType] = (stats[businessType] || 0) + totalInsured;
    }

    return stats;
  } catch (error) {
    console.error("Employment Insurance stats error:", error);
    return {};
  }
}

/**
 * 고용보험 API 연동 준비 (추후 구현)
 *
 * 공공데이터포털 고용보험 API 사용 가능:
 * - 고용보험 가입 사업장 내역 조회 API
 * - 환경변수: EMPLOYMENT_INSURANCE_API_KEY
 *
 * @example
 * // API 연동 시 구현 예시
 * export async function lookupEmploymentInsurance(
 *   businessNumber: string
 * ): Promise<EmploymentInsuranceResult | null> {
 *   const apiKey = process.env.EMPLOYMENT_INSURANCE_API_KEY
 *   if (!apiKey) {
 *     throw new Error('EMPLOYMENT_INSURANCE_API_KEY is not set')
 *   }
 *
 *   // API 호출 로직...
 * }
 */
