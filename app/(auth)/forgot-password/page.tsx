"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      setEmailSent(true)
      toast.success("비밀번호 재설정 링크를 이메일로 보냈어요")
    } catch (error) {
      toast.error("문제가 생겼어요. 다시 시도해 주세요")
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>이메일을 확인해 주세요</CardTitle>
            <CardDescription>
              <strong>{email}</strong>로 비밀번호 재설정 링크를 보냈어요.
              이메일의 링크를 클릭해서 새 비밀번호를 설정해 주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              이메일이 안 왔나요?
              <br />
              스팸 폴더를 확인하거나 잠시 후 다시 시도해 보세요.
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setEmailSent(false)}
            >
              다른 이메일로 다시 시도
            </Button>
          </CardContent>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                로그인으로 돌아가기
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">G</span>
            </div>
            <span className="font-bold text-xl">GovHelper</span>
          </Link>
          <CardTitle>비밀번호 재설정</CardTitle>
          <CardDescription>
            가입한 이메일 주소를 입력하면 비밀번호 재설정 링크를 보내드려요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "전송 중..." : "재설정 링크 보내기"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              로그인으로 돌아가기
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
