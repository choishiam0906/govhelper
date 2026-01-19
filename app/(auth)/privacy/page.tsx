import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "개인정보처리방침 | GovHelper",
  description: "GovHelper 개인정보처리방침",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              홈으로
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center border-b">
            <Link href="/" className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">G</span>
              </div>
              <span className="font-bold text-xl">GovHelper</span>
            </Link>
            <CardTitle className="text-2xl">개인정보처리방침</CardTitle>
            <p className="text-sm text-muted-foreground">시행일: 2026년 1월 1일</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none p-6 space-y-6">
            <section>
              <p className="text-muted-foreground leading-relaxed">
                GovHelper(이하 &quot;회사&quot;)는 개인정보보호법 등 관련 법령에 따라 이용자의 개인정보를 보호하고,
                이와 관련한 고충을 신속하게 처리하기 위해 다음과 같이 개인정보처리방침을 수립해요.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제1조 (수집하는 개인정보 항목)</h2>
              <p className="text-muted-foreground mb-2">회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집해요:</p>

              <h3 className="font-medium mt-4 mb-2">1. 필수 수집 항목</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>이메일 주소</li>
                <li>비밀번호 (암호화 저장)</li>
              </ul>

              <h3 className="font-medium mt-4 mb-2">2. 선택 수집 항목</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>기업명</li>
                <li>사업자등록번호</li>
                <li>업종, 직원 수, 연매출, 설립일</li>
                <li>소재지</li>
                <li>보유 인증 현황</li>
                <li>사업계획서 (미등록 사업자의 경우)</li>
              </ul>

              <h3 className="font-medium mt-4 mb-2">3. 자동 수집 항목</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>서비스 이용 기록, 접속 로그, 접속 IP</li>
                <li>결제 기록</li>
              </ul>

              <h3 className="font-medium mt-4 mb-2">4. 소셜 로그인 시 수집 항목</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Google: 이메일, 이름, 프로필 사진</li>
                <li>카카오: 이메일, 닉네임, 프로필 사진</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제2조 (개인정보의 수집 및 이용 목적)</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>서비스 제공:</strong> 정부지원사업 매칭, AI 분석, 지원서 작성 서비스 제공</li>
                <li><strong>회원 관리:</strong> 회원제 서비스 이용, 본인 확인, 부정 이용 방지</li>
                <li><strong>결제 처리:</strong> 유료 서비스 결제 및 환불 처리</li>
                <li><strong>서비스 개선:</strong> 서비스 이용 통계 분석, 신규 서비스 개발</li>
                <li><strong>고객 지원:</strong> 문의사항 처리, 공지사항 전달</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제3조 (개인정보의 보유 및 이용 기간)</h2>
              <ol className="list-decimal list-inside text-muted-foreground space-y-2">
                <li>회원 탈퇴 시 개인정보는 즉시 파기해요. 단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관해요.</li>
                <li>법령에 따른 보존 기간:
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
                    <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
                    <li>소비자 불만 또는 분쟁처리에 관한 기록: 3년</li>
                    <li>접속에 관한 기록: 3개월</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제4조 (개인정보의 제3자 제공)</h2>
              <p className="text-muted-foreground leading-relaxed">
                회사는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않아요.
                다만, 다음의 경우에는 예외적으로 제공할 수 있어요:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법령의 규정에 의하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제5조 (개인정보 처리의 위탁)</h2>
              <p className="text-muted-foreground mb-2">회사는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁해요:</p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-muted-foreground border mt-2">
                  <thead className="bg-muted">
                    <tr>
                      <th className="border px-4 py-2 text-left">수탁업체</th>
                      <th className="border px-4 py-2 text-left">위탁 업무</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border px-4 py-2">Supabase</td>
                      <td className="border px-4 py-2">데이터베이스 저장 및 인증 서비스</td>
                    </tr>
                    <tr>
                      <td className="border px-4 py-2">토스페이먼츠</td>
                      <td className="border px-4 py-2">결제 처리</td>
                    </tr>
                    <tr>
                      <td className="border px-4 py-2">Vercel</td>
                      <td className="border px-4 py-2">웹 서비스 호스팅</td>
                    </tr>
                    <tr>
                      <td className="border px-4 py-2">Google (Gemini AI)</td>
                      <td className="border px-4 py-2">AI 분석 서비스</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제6조 (개인정보의 파기)</h2>
              <ol className="list-decimal list-inside text-muted-foreground space-y-2">
                <li>회사는 개인정보 보유기간 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때는 지체 없이 해당 개인정보를 파기해요.</li>
                <li>파기 방법:
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>전자적 파일: 복구 불가능한 방법으로 영구 삭제</li>
                    <li>종이 문서: 분쇄기로 분쇄 또는 소각</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제7조 (이용자의 권리와 행사 방법)</h2>
              <p className="text-muted-foreground mb-2">이용자는 다음과 같은 권리를 행사할 수 있어요:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>열람권:</strong> 개인정보 처리 현황 열람 요청</li>
                <li><strong>정정권:</strong> 개인정보 오류 정정 요청</li>
                <li><strong>삭제권:</strong> 개인정보 삭제 요청</li>
                <li><strong>처리정지권:</strong> 개인정보 처리 정지 요청</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                위 권리는 서비스 내 &quot;프로필&quot; 메뉴 또는 이메일을 통해 행사할 수 있어요.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제8조 (쿠키의 사용)</h2>
              <ol className="list-decimal list-inside text-muted-foreground space-y-2">
                <li>회사는 이용자에게 개별적인 서비스를 제공하기 위해 쿠키를 사용해요.</li>
                <li>쿠키는 웹사이트 운영에 이용되는 서버가 이용자의 브라우저에 보내는 작은 텍스트 파일이에요.</li>
                <li>이용자는 쿠키 설치에 대한 선택권을 가지고 있으며, 브라우저 설정을 통해 쿠키를 허용하거나 거부할 수 있어요.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제9조 (개인정보의 안전성 확보 조치)</h2>
              <p className="text-muted-foreground mb-2">회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취해요:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>관리적 조치:</strong> 내부관리계획 수립, 개인정보 취급 직원 최소화</li>
                <li><strong>기술적 조치:</strong> 비밀번호 암호화, 보안 프로그램 설치, 접근 권한 관리</li>
                <li><strong>물리적 조치:</strong> 클라우드 서버 보안 (Supabase, Vercel)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제10조 (개인정보 보호책임자)</h2>
              <p className="text-muted-foreground leading-relaxed">
                회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위해
                아래와 같이 개인정보 보호책임자를 지정해요.
              </p>
              <div className="bg-muted p-4 rounded-lg mt-4">
                <p className="font-medium">개인정보 보호책임자</p>
                <ul className="text-muted-foreground mt-2 space-y-1">
                  <li>이메일: <a href="mailto:choishiam@gmail.com" className="text-primary hover:underline">choishiam@gmail.com</a></li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제11조 (권익침해 구제방법)</h2>
              <p className="text-muted-foreground mb-2">
                이용자는 개인정보침해로 인한 구제를 받기 위해 아래 기관에 분쟁해결이나 상담 등을 신청할 수 있어요.
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>개인정보분쟁조정위원회: (국번없이) 1833-6972 (www.kopico.go.kr)</li>
                <li>개인정보침해신고센터: (국번없이) 118 (privacy.kisa.or.kr)</li>
                <li>대검찰청: (국번없이) 1301 (www.spo.go.kr)</li>
                <li>경찰청: (국번없이) 182 (ecrm.cyber.go.kr)</li>
              </ul>
            </section>

            <section className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-3">부칙</h2>
              <p className="text-muted-foreground leading-relaxed">
                본 개인정보처리방침은 2026년 1월 1일부터 시행해요.
              </p>
            </section>

            <div className="border-t pt-6 mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                문의사항이 있으시면 아래로 연락해주세요.
              </p>
              <p className="text-sm">
                이메일: <a href="mailto:choishiam@gmail.com" className="text-primary hover:underline">choishiam@gmail.com</a>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/terms">
            <Button variant="outline">이용약관 보기</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
