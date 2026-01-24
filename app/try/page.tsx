'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Building2,
  Users,
  MapPin,
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Sparkles,
  Search,
  FileText,
  Shield,
  Database,
  AlertCircle,
  Briefcase,
  Calendar,
  Building
} from 'lucide-react'
import Link from 'next/link'
import { useUTM } from '@/lib/hooks/use-utm'

// ?…ì¢… ëª©ë¡
const INDUSTRIES = [
  '?•ë³´?µì‹ ??,
  '?œì¡°??,
  '?„ë§¤ ë°??Œë§¤??,
  'ê±´ì„¤??,
  '?„ë¬¸, ê³¼í•™ ë°?ê¸°ìˆ  ?œë¹„?¤ì—…',
  'êµìœ¡ ?œë¹„?¤ì—…',
  'ê¸ˆìœµ ë°?ë³´í—˜??,
  'ë³´ê±´??ë°??¬íšŒë³µì? ?œë¹„?¤ì—…',
  '?™ë°• ë°??Œì‹?ì—…',
  '?´ìˆ˜ ë°?ì°½ê³ ??,
  '?ì—…, ?„ì—… ë°??´ì—…',
  '?ˆìˆ , ?¤í¬ì¸?ë°??¬ê?ê´€???œë¹„?¤ì—…',
  'ë¶€?™ì‚°??,
  '?¬ì—…?œì„¤ ê´€ë¦? ?¬ì—… ì§€??ë°??„ë? ?œë¹„?¤ì—…',
  '?„ê¸°, ê°€?? ì¦ê¸° ë°?ê³µê¸° ì¡°ì ˆ ê³µê¸‰??,
  '?˜ë„, ?˜ìˆ˜ ë°??ê¸°ë¬?ì²˜ë¦¬, ?ë£Œ ?¬ìƒ??,
  'ê´‘ì—…',
  'ê¸°í?',
]

// ì§€??ëª©ë¡
const LOCATIONS = [
  '?œìš¸?¹ë³„??,
  'ë¶€?°ê´‘??‹œ',
  '?€êµ¬ê´‘??‹œ',
  '?¸ì²œê´‘ì—­??,
  'ê´‘ì£¼ê´‘ì—­??,
  '?€?„ê´‘??‹œ',
  '?¸ì‚°ê´‘ì—­??,
  '?¸ì¢…?¹ë³„?ì¹˜??,
  'ê²½ê¸°??,
  'ê°•ì›??,
  'ì¶©ì²­ë¶ë„',
  'ì¶©ì²­?¨ë„',
  '?„ë¼ë¶ë„',
  '?„ë¼?¨ë„',
  'ê²½ìƒë¶ë„',
  'ê²½ìƒ?¨ë„',
  '?œì£¼?¹ë³„?ì¹˜??,
]

// ?¸ì¦??ëª©ë¡
const CERTIFICATIONS = [
  'ë²¤ì²˜ê¸°ì—…?¸ì¦',
  '?´ë…¸ë¹„ì¦ˆ?¸ì¦',
  'ë©”ì¸ë¹„ì¦ˆ?¸ì¦',
  'ê¸°ìˆ ?ì‹ ??ì¤‘ì†Œê¸°ì—…',
  '?¬ì„±ê¸°ì—…?¸ì¦',
  '?¥ì• ?¸ê¸°?…ì¸ì¦?,
  '?¬íšŒ?ê¸°?…ì¸ì¦?,
  '?¹ìƒ‰?¸ì¦',
]

type Step = 1 | 2 | 3 | 4

interface FormData {
  businessNumber: string
  companyName: string
  industry: string
  employeeCount: string
  location: string
  annualRevenue: string
  foundedDate: string
  certifications: string[]
  email: string
}

// ?µí•© ì¡°íšŒ ê²°ê³¼ ?€??(unified-lookup API ?‘ë‹µ)
interface UnifiedLookupResult {
  success: boolean
  data?: {
    businessNumber: string
    companyName: string
    companyNameEng: string | null
    ceoName: string | null
    address: string | null
    location: string
    industryCode: string | null
    employeeCount: number | null
    establishedDate: string | null
    businessType: string | null      // ?…íƒœ (?€ë¶„ë¥˜)
    industryName: string | null      // ì¢…ëª© (?¸ì„¸ë¶„ë¥˜)
    companySize: string              // ê¸°ì—…ê·œëª¨
    corporationType: string          // ë²•ì¸?•íƒœ
    homepage: string | null
    phone: string | null
    ntsStatus: string | null
    taxType: string | null
    stockCode: string | null
    stockMarket: string
    sources: string[]
  }
  error?: string
}

export default function TryPage() {
  const router = useRouter()
  const { utmForAPI } = useUTM()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [skipBusinessNumber, setSkipBusinessNumber] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    businessNumber: '',
    companyName: '',
    industry: '',
    employeeCount: '',
    location: '',
    annualRevenue: '',
    foundedDate: '',
    certifications: [],
    email: '',
  })

  // ?¬ì—…?ë²ˆ??ì¡°íšŒ ê²°ê³¼
  const [lookupResult, setLookupResult] = useState<UnifiedLookupResult | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)

  const progress = ((step - 1) / 3) * 100

  const updateFormData = (key: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const toggleCertification = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert]
    }))
  }

  // ?¬ì—…?ë²ˆ??ì¡°íšŒ (?µí•© API ?¬ìš©)
  const lookupBusinessNumber = useCallback(async (bizNum: string) => {
    const cleaned = bizNum.replace(/[^0-9]/g, '')

    if (cleaned.length !== 10) {
      setLookupResult(null)
      setLookupError(null)
      return
    }

    setLookingUp(true)
    setLookupError(null)

    try {
      const response = await fetch('/api/business/unified-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessNumber: cleaned }),
      })

      const result: UnifiedLookupResult = await response.json()

      if (result.success && result.data) {
        setLookupResult(result)

        // ???ë™ ì±„ìš°ê¸?        if (result.data.companyName) {
          updateFormData('companyName', result.data.companyName)
        }
        if (result.data.location) {
          updateFormData('location', result.data.location)
        }
        if (result.data.employeeCount) {
          updateFormData('employeeCount', result.data.employeeCount.toString())
        }
        // ?…ì¢… ?ë™ ì±„ìš°ê¸?(businessType = ?…íƒœ)
        if (result.data.businessType && INDUSTRIES.includes(result.data.businessType)) {
          updateFormData('industry', result.data.businessType)
        }
        // ?¤ë¦½???ë™ ì±„ìš°ê¸?        if (result.data.establishedDate) {
          // YYYYMMDD ??YYYY-MM-DD ë³€??          const dateStr = result.data.establishedDate.replace(/[^0-9]/g, '')
          if (dateStr.length === 8) {
            const formatted = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
            updateFormData('foundedDate', formatted)
          }
        }

        toast.success('?¬ì—…???•ë³´ë¥?ì°¾ì•˜?´ìš”!')
      } else {
        setLookupResult({ success: false, error: result.error })
        setLookupError(result.error || 'ê¸°ì—… ?•ë³´ë¥?ì°¾ì„ ???†ì–´??)
      }
    } catch (error) {
      console.error('Business lookup error:', error)
      setLookupError('ì¡°íšŒ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆì–´??)
    } finally {
      setLookingUp(false)
    }
  }, [])

  // ?¬ì—…?ë²ˆ???…ë ¥ ??debounce ì¡°íšŒ
  useEffect(() => {
    const bizNum = formData.businessNumber.replace(/[^0-9]/g, '')

    if (bizNum.length === 10) {
      const timer = setTimeout(() => {
        lookupBusinessNumber(formData.businessNumber)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setLookupResult(null)
      setLookupError(null)
    }
  }, [formData.businessNumber, lookupBusinessNumber])

  // 1?¨ê³„ ??2?¨ê³„
  const handleStep1Next = () => {
    const bizNum = formData.businessNumber.replace(/[^0-9]/g, '')

    if (bizNum.length > 0 && bizNum.length !== 10) {
      toast.error('?¬ì—…?ë²ˆ??10?ë¦¬ë¥??…ë ¥?´ì£¼?¸ìš”')
      return
    }

    setStep(2)
  }

  // ?¬ì—…?ë²ˆ???†ì´ ì§„í–‰
  const handleSkipBusinessNumber = () => {
    setSkipBusinessNumber(true)
    setLookupResult(null)
    setStep(2)
  }

  // 2?¨ê³„ ??3?¨ê³„
  const handleStep2Next = () => {
    if (!formData.companyName.trim()) {
      toast.error('?Œì‚¬ëª…ì„ ?…ë ¥?´ì£¼?¸ìš”')
      return
    }
    if (!formData.industry) {
      toast.error('?…ì¢…??? íƒ?´ì£¼?¸ìš”')
      return
    }
    if (!formData.employeeCount) {
      toast.error('ì§ì›?˜ë? ?…ë ¥?´ì£¼?¸ìš”')
      return
    }
    if (!formData.location) {
      toast.error('?Œì¬ì§€ë¥?? íƒ?´ì£¼?¸ìš”')
      return
    }
    setStep(3)
  }

  // ìµœì¢… ?œì¶œ
  const handleSubmit = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      toast.error('?¬ë°”ë¥??´ë©”?¼ì„ ?…ë ¥?´ì£¼?¸ìš”')
      return
    }

    setStep(4)
    setLoading(true)

    try {
      const response = await fetch('/api/guest/matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          businessNumber: skipBusinessNumber ? undefined : formData.businessNumber.replace(/[^0-9]/g, ''),
          companyName: formData.companyName,
          industry: formData.industry,
          employeeCount: parseInt(formData.employeeCount) || 1,
          location: formData.location,
          annualRevenue: formData.annualRevenue ? parseInt(formData.annualRevenue) * 100000000 : undefined,
          foundedDate: formData.foundedDate || undefined,
          certifications: formData.certifications.length > 0 ? formData.certifications : undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        router.push(`/try/result/${result.data.resultId}`)
      } else {
        toast.error(result.error || 'ë¶„ì„ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆì–´??)
        setStep(3)
        setLoading(false)
      }
    } catch (error) {
      toast.error('ë¶„ì„ ?”ì²­ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆì–´??)
      setStep(3)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* ?¤ë” */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2"><div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center"><span className="text-primary-foreground font-bold text-lg">G</span></div><span className="font-bold text-xl">GovHelper</span></Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">ë¡œê·¸??/Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* ì§„í–‰ë¥?*/}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>ë¬´ë£Œ ë§¤ì¹­ ë¶„ì„</span>
            <span>{step}/4 ?¨ê³„</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          {/* 1?¨ê³„: ?¬ì—…?ë²ˆ???…ë ¥ */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">?¬ì—…?ë²ˆ?¸ë? ?…ë ¥?´ì£¼?¸ìš”</CardTitle>
                  <CardDescription>
                    ?¬ì—…?ë²ˆ?¸ë§Œ ?…ë ¥?˜ë©´ ê¸°ì—… ?•ë³´ë¥??ë™?¼ë¡œ ì±„ì›Œ?œë ¤??                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* ?¬ì—…?ë²ˆ??*/}
                  <div className="space-y-2">
                    <Label htmlFor="businessNumber">?¬ì—…?ë²ˆ??/Label>
                    <div className="relative">
                      <Input
                        id="businessNumber"
                        placeholder="000-00-00000"
                        value={formData.businessNumber}
                        onChange={(e) => updateFormData('businessNumber', e.target.value)}
                        className="text-lg pr-10"
                      />
                      {lookingUp && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ?˜ì´??-) ?†ì´ ?«ìë§??…ë ¥?´ë„ ?¼ìš”
                    </p>
                  </div>

                  {/* ì¡°íšŒ ê²°ê³¼ ?œì‹œ - ê¸°ì—…?•ë³´ë¥?ì°¾ì? ê²½ìš° */}
                  {lookupResult?.success && lookupResult.data && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-700">?¬ì—…???•ë³´ë¥?ì°¾ì•˜?´ìš”!</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        {/* ?Œì‚¬ëª?*/}
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{lookupResult.data.companyName}</span>
                          {lookupResult.data.corporationType && lookupResult.data.corporationType !== '?????†ìŒ' && (
                            <Badge variant="outline" className="text-xs">
                              {lookupResult.data.corporationType}
                            </Badge>
                          )}
                        </div>
                        {/* ?€?œì */}
                        {lookupResult.data.ceoName && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-green-600" />
                            <span className="text-muted-foreground">?€?? {lookupResult.data.ceoName}</span>
                          </div>
                        )}
                        {/* ?…ì¢… */}
                        {lookupResult.data.businessType && (
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-green-600" />
                            <span className="text-muted-foreground">
                              {lookupResult.data.businessType}
                              {lookupResult.data.industryName && lookupResult.data.industryName !== 'ê¸°í?' && (
                                <span className="text-xs ml-1">({lookupResult.data.industryName})</span>
                              )}
                            </span>
                          </div>
                        )}
                        {/* ì£¼ì†Œ */}
                        {lookupResult.data.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                            <span className="text-muted-foreground">{lookupResult.data.address}</span>
                          </div>
                        )}
                        {/* ì§ì›??*/}
                        {lookupResult.data.employeeCount && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-green-600" />
                            <span className="text-muted-foreground">
                              ì§ì› ??{lookupResult.data.employeeCount}ëª?                              {lookupResult.data.companySize && lookupResult.data.companySize !== '?????†ìŒ' && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  {lookupResult.data.companySize}
                                </Badge>
                              )}
                            </span>
                          </div>
                        )}
                        {/* ?¤ë¦½??*/}
                        {lookupResult.data.establishedDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-green-600" />
                            <span className="text-muted-foreground">
                              ?¤ë¦½: {lookupResult.data.establishedDate.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1??$2??$3??)}
                            </span>
                          </div>
                        )}
                        {/* ?¬ì—…???íƒœ */}
                        {lookupResult.data.ntsStatus && (
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-green-600" />
                            <span className="text-muted-foreground">
                              {lookupResult.data.ntsStatus}
                              {lookupResult.data.taxType && ` Â· ${lookupResult.data.taxType}`}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* ?°ì´???ŒìŠ¤ */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Database className="h-3 w-3" />
                        <span>
                          ?°ì´???ŒìŠ¤: {lookupResult.data.sources?.join(', ').toUpperCase() || 'NTS, NPS, DART'}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* ì¡°íšŒ ?¤íŒ¨ */}
                  {lookupResult && !lookupResult.success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <span className="text-amber-700">{lookupError}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        ê¸°ì—… ?•ë³´ë¥?ì§ì ‘ ?…ë ¥?´ì£¼?¸ìš”
                      </p>
                    </motion.div>
                  )}

                  <Button
                    onClick={handleStep1Next}
                    disabled={lookingUp}
                    className="w-full"
                    size="lg"
                  >
                    {lookupResult?.success ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        ?•ë³´ ?•ì¸?˜ê³  ê³„ì†?˜ê¸°
                      </>
                    ) : (
                      <>
                        ?¤ìŒ ?¨ê³„ë¡?                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">?ëŠ”</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSkipBusinessNumber}
                  >
                    ?¬ì—…?ë²ˆ???†ì´ ì§„í–‰?˜ê¸°
                  </Button>

                  <div className="flex items-start gap-2 p-4 bg-muted/50 rounded-lg">
                    <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      ?…ë ¥?˜ì‹  ?•ë³´??ë§¤ì¹­ ë¶„ì„?ë§Œ ?¬ìš©?˜ë©°, ?ˆì „?˜ê²Œ ë³´í˜¸?¼ìš”.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* 2?¨ê³„: ê¸°ì—…?•ë³´ ?…ë ¥ */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">ê¸°ì—… ?•ë³´ë¥??•ì¸?´ì£¼?¸ìš”</CardTitle>
                  <CardDescription>
                    {lookupResult?.success
                      ? '?ë™?¼ë¡œ ì±„ì›Œì§??•ë³´ë¥??•ì¸?˜ê³  ?˜ì •?´ì£¼?¸ìš”'
                      : '???•í™•??ë§¤ì¹­???„í•´ ê¸°ì—… ?•ë³´ê°€ ?„ìš”?´ìš”'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* ?ë™ ?…ë ¥ ?ˆë‚´ */}
                  {lookupResult?.success && (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-700">
                          ?¬ì—…???•ë³´ë¡??ë™ ?…ë ¥??                        </p>
                        <p className="text-xs text-muted-foreground">
                          ?„ìš”???˜ì •?????ˆì–´??                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {lookupResult.data?.sources?.length || 0}ê°??ŒìŠ¤
                      </Badge>
                    </div>
                  )}

                  {/* ?Œì‚¬ëª?*/}
                  <div className="space-y-2">
                    <Label htmlFor="companyName">?Œì‚¬ëª?*</Label>
                    <Input
                      id="companyName"
                      placeholder="(ì£??Œì‚¬ëª?
                      value={formData.companyName}
                      onChange={(e) => updateFormData('companyName', e.target.value)}
                    />
                  </div>

                  {/* ?…ì¢… */}
                  <div className="space-y-2">
                    <Label>
                      ?…ì¢… *
                      {lookupResult?.success && lookupResult.data?.businessType && (
                        <span className="text-xs text-green-600 ml-1">(?ë™ ?…ë ¥??</span>
                      )}
                    </Label>
                    <Select
                      value={formData.industry}
                      onValueChange={(value) => updateFormData('industry', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="?…ì¢…??? íƒ?´ì£¼?¸ìš”" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ì§ì›??& ?Œì¬ì§€ */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employeeCount">
                        ì§ì›??*
                        {lookupResult?.success && lookupResult.data?.employeeCount && (
                          <span className="text-xs text-green-600 ml-1">(?ë™)</span>
                        )}
                      </Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="employeeCount"
                          type="number"
                          placeholder="10"
                          className="pl-10"
                          value={formData.employeeCount}
                          onChange={(e) => updateFormData('employeeCount', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        ?Œì¬ì§€ *
                        {lookupResult?.success && lookupResult.data?.location && (
                          <span className="text-xs text-green-600 ml-1">(?ë™)</span>
                        )}
                      </Label>
                      <Select
                        value={formData.location}
                        onValueChange={(value) => updateFormData('location', value)}
                      >
                        <SelectTrigger>
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="ì§€??? íƒ" />
                        </SelectTrigger>
                        <SelectContent>
                          {LOCATIONS.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* ë§¤ì¶œ & ?¤ë¦½??(? íƒ) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="annualRevenue">?°ë§¤ì¶?(? íƒ)</Label>
                      <div className="relative">
                        <Input
                          id="annualRevenue"
                          type="number"
                          placeholder="10"
                          className="pr-10"
                          value={formData.annualRevenue}
                          onChange={(e) => updateFormData('annualRevenue', e.target.value)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          ?µì›
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="foundedDate">
                        ?¤ë¦½??(? íƒ)
                        {lookupResult?.success && lookupResult.data?.establishedDate && (
                          <span className="text-xs text-green-600 ml-1">(?ë™)</span>
                        )}
                      </Label>
                      <Input
                        id="foundedDate"
                        type="date"
                        value={formData.foundedDate}
                        onChange={(e) => updateFormData('foundedDate', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* ?¸ì¦??*/}
                  <div className="space-y-2">
                    <Label>ë³´ìœ  ?¸ì¦ (? íƒ)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {CERTIFICATIONS.map((cert) => (
                        <div key={cert} className="flex items-center space-x-2">
                          <Checkbox
                            id={cert}
                            checked={formData.certifications.includes(cert)}
                            onCheckedChange={() => toggleCertification(cert)}
                          />
                          <label
                            htmlFor={cert}
                            className="text-sm cursor-pointer"
                          >
                            {cert}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ë²„íŠ¼ */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      ?´ì „
                    </Button>
                    <Button
                      onClick={handleStep2Next}
                      className="flex-1"
                    >
                      ?¤ìŒ
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* 3?¨ê³„: ?´ë©”???…ë ¥ */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">?´ë©”?¼ì„ ?…ë ¥?´ì£¼?¸ìš”</CardTitle>
                  <CardDescription>
                    ë¶„ì„ ê²°ê³¼ë¥??´ë©”?¼ë¡œ??ë³´ë‚´?œë ¤??                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">?´ë©”??/Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@company.com"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      className="text-lg"
                    />
                  </div>

                  {/* ?…ë ¥ ?•ë³´ ?”ì•½ */}
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <h4 className="font-medium text-sm">?…ë ¥?˜ì‹  ?•ë³´</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>?Œì‚¬ëª? {formData.companyName}</p>
                      <p>?…ì¢…: {formData.industry}</p>
                      <p>ì§ì›?? {formData.employeeCount}ëª?/p>
                      <p>?Œì¬ì§€: {formData.location}</p>
                      {formData.foundedDate && <p>?¤ë¦½?? {formData.foundedDate}</p>}
                      {formData.annualRevenue && <p>?°ë§¤ì¶? {formData.annualRevenue}?µì›</p>}
                      {formData.certifications.length > 0 && (
                        <p>?¸ì¦: {formData.certifications.join(', ')}</p>
                      )}
                    </div>
                  </div>

                  {/* ë²„íŠ¼ */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      ?´ì „
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="flex-1"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI ë¶„ì„ ?œì‘
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* 4?¨ê³„: ë¶„ì„ ì¤?*/}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card>
                <CardContent className="py-16">
                  <div className="text-center space-y-6">
                    <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                      <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold mb-2">AIê°€ ë¶„ì„ ì¤‘ì´?ìš”</h2>
                      <p className="text-muted-foreground">
                        {formData.companyName}?˜ì—ê²???ë§ëŠ” ì§€?ì‚¬?…ì„ ì°¾ê³  ?ˆì–´??                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>ê¸°ì—… ?•ë³´ ?•ì¸ ?„ë£Œ</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>ê³µê³  ë§¤ì¹­ ë¶„ì„ ì¤?..</span>
                      </div>
                      <div className="flex items-center gap-2 opacity-50">
                        <Search className="h-4 w-4" />
                        <span>ìµœì  ì§€?ì‚¬??? ì •</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ?˜ë‹¨ ?ˆë‚´ */}
        {step < 4 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              ?´ë? ê³„ì •???ˆìœ¼? ê???{' '}
              <Link href="/login" className="text-primary hover:underline">
                ë¡œê·¸??              </Link>
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
