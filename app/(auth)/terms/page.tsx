import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "이용약관 | GovHelper",
  description: "GovHelper 서비스 이용약관",
}

export default function TermsPage() {
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
            <CardTitle className="text-2xl">이용약관</CardTitle>
            <p className="text-sm text-muted-foreground">시행일: 2026년 1월 1일</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none p-6 space-y-6">
            <section>
              <h2 className="text-lg font-semibold mb-3">제1조 (목적)</h2>
              <p className="text-muted-foreground leading-relaxed">
                본 약관은 GovHelper(이하 &quot;회사&quot;)가 제공하는 정부지원사업 매칭 및 지원서 작성 서비스(이하 &quot;서비스&quot;)의
                이용조건 및 절차, 회사와 이용자의 권리, 의무, 책임사항 등을 규정함을 목적으로 해요.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제2조 (정의)</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>&quot;서비스&quot;란 회사가 제공하는 AI 기반 정부지원사업 매칭, 분석, 지원서 작성 지원 서비스를 말해요.</li>
                <li>&quot;이용자&quot;란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원을 말해요.</li>
                <li>&quot;회원&quot;이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 서비스를 이용하는 자를 말해요.</li>
                <li>&quot;기업정보&quot;란 회원이 서비스 이용을 위해 등록한 사업자 정보, 기업 현황 등을 말해요.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제3조 (약관의 효력 및 변경)</h2>
              <ol className="list-decimal list-inside text-muted-foreground space-y-2">
                <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생해요.</li>
                <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있어요.</li>
                <li>약관이 변경되는 경우 회사는 변경 내용을 시행일 7일 전부터 서비스 내 공지사항에 게시해요.</li>
                <li>회원이 변경된 약관에 동의하지 않는 경우, 서비스 이용을 중단하고 탈퇴할 수 있어요.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제4조 (서비스의 내용)</h2>
              <p className="text-muted-foreground mb-2">회사가 제공하는 서비스는 다음과 같아요:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>정부지원사업 공고 통합 검색 서비스</li>
                <li>AI 기반 기업-지원사업 매칭 분석 서비스</li>
                <li>AI 지원서 작성 지원 서비스</li>
                <li>기타 회사가 정하는 서비스</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제5조 (회원가입)</h2>
              <ol className="list-decimal list-inside text-muted-foreground space-y-2">
                <li>회원가입은 이용자가 약관의 내용에 동의하고, 회원가입 양식에 따라 정보를 기입한 후 가입을 완료함으로써 성립해요.</li>
                <li>회사는 다음 각 호에 해당하는 신청에 대해서는 승낙을 거부하거나 사후에 이용계약을 해지할 수 있어요:
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>타인의 정보를 도용한 경우</li>
                    <li>허위의 정보를 기재한 경우</li>
                    <li>기타 회원으로 등록하는 것이 회사의 서비스 운영에 현저히 지장이 있다고 판단되는 경우</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제6조 (회원의 의무)</h2>
              <ol className="list-decimal list-inside text-muted-foreground space-y-2">
                <li>회원은 서비스 이용 시 다음 각 호의 행위를 하지 않아야 해요:
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>타인의 정보 도용</li>
                    <li>회사가 게시한 정보의 무단 변경</li>
                    <li>회사가 금지한 정보의 송신 또는 게시</li>
                    <li>회사 및 제3자의 저작권 등 지적재산권 침해</li>
                    <li>회사 및 제3자의 명예 손상 또는 업무 방해</li>
                    <li>서비스를 이용하여 얻은 정보를 회사의 사전 승낙 없이 복제, 배포, 방송 기타 방법으로 이용하거나 제3자에게 제공하는 행위</li>
                  </ul>
                </li>
                <li>회원은 등록한 기업정보의 정확성을 유지해야 하며, 변경 시 즉시 수정해야 해요.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제7조 (서비스 이용료 및 결제)</h2>
              <ol className="list-decimal list-inside text-muted-foreground space-y-2">
                <li>서비스는 무료 플랜(Free)과 유료 플랜(Pro)으로 구분돼요.</li>
                <li>유료 서비스의 이용요금은 서비스 내 요금 안내 페이지에 명시된 바에 따라요.</li>
                <li>결제는 신용카드, 계좌이체 등 회사가 정한 결제 수단을 통해 이루어져요.</li>
                <li>유료 서비스는 결제 완료 후 즉시 이용 가능해요.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제8조 (구독 및 환불)</h2>
              <ol className="list-decimal list-inside text-muted-foreground space-y-2">
                <li>유료 구독은 월 단위로 자동 갱신돼요.</li>
                <li>구독 취소는 언제든지 가능하며, 취소 시 다음 결제일부터 구독이 중단돼요.</li>
                <li>이미 결제된 구독료는 해당 구독 기간 종료 전까지 서비스를 이용할 수 있어요.</li>
                <li>환불은 전자상거래법 등 관련 법령에 따라 처리해요.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제9조 (서비스의 중단)</h2>
              <ol className="list-decimal list-inside text-muted-foreground space-y-2">
                <li>회사는 시스템 점검, 교체 및 고장, 통신 장애 등의 사유가 발생한 경우 서비스의 제공을 일시적으로 중단할 수 있어요.</li>
                <li>회사는 서비스 중단의 경우 사전에 공지해요. 다만, 불가피한 사유가 있는 경우 사후에 공지할 수 있어요.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제10조 (AI 서비스 면책)</h2>
              <ol className="list-decimal list-inside text-muted-foreground space-y-2">
                <li>AI 매칭 분석 및 지원서 작성은 참고용이며, 실제 지원사업 선정을 보장하지 않아요.</li>
                <li>AI가 생성한 콘텐츠는 회원이 최종 검토 및 수정 후 사용해야 해요.</li>
                <li>회사는 AI 분석 결과의 정확성이나 완전성을 보장하지 않으며, 이로 인한 손해에 대해 책임지지 않아요.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제11조 (저작권)</h2>
              <ol className="list-decimal list-inside text-muted-foreground space-y-2">
                <li>서비스 내 회사가 작성한 콘텐츠에 대한 저작권은 회사에 귀속돼요.</li>
                <li>회원이 서비스를 통해 작성한 지원서 등의 저작권은 회원에게 귀속돼요.</li>
                <li>회원은 서비스를 이용하여 얻은 정보를 회사의 사전 동의 없이 상업적으로 이용할 수 없어요.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제12조 (개인정보보호)</h2>
              <p className="text-muted-foreground leading-relaxed">
                회사는 회원의 개인정보를 보호하기 위해 개인정보처리방침을 수립하고 이를 준수해요.
                자세한 내용은 <Link href="/privacy" className="text-primary hover:underline">개인정보처리방침</Link>을 확인해주세요.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제13조 (손해배상)</h2>
              <ol className="list-decimal list-inside text-muted-foreground space-y-2">
                <li>회사는 무료로 제공하는 서비스의 이용과 관련하여 회원에게 발생한 손해에 대해 책임지지 않아요.</li>
                <li>회사의 고의 또는 과실로 인해 회원에게 손해가 발생한 경우, 회사는 관련 법령에 따라 손해를 배상해요.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">제14조 (분쟁 해결)</h2>
              <ol className="list-decimal list-inside text-muted-foreground space-y-2">
                <li>서비스 이용과 관련하여 분쟁이 발생한 경우 회사와 회원은 원만한 해결을 위해 성실히 협의해요.</li>
                <li>협의가 이루어지지 않는 경우, 관할 법원은 회사 소재지를 관할하는 법원으로 해요.</li>
              </ol>
            </section>

            <section className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-3">부칙</h2>
              <p className="text-muted-foreground leading-relaxed">
                본 약관은 2026년 1월 1일부터 시행해요.
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
          <Link href="/privacy">
            <Button variant="outline">개인정보처리방침 보기</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
