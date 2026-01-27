'use client'

// 인증 목록
const certificationOptions = [
  { value: 'venture', label: '벤처기업' },
  { value: 'innobiz', label: '이노비즈' },
  { value: 'mainbiz', label: '메인비즈' },
  { value: 'womanEnterprise', label: '여성기업' },
  { value: 'socialEnterprise', label: '사회적기업' },
  { value: 'researchInstitute', label: '기업부설연구소' },
]

interface CompanyFormCertificationsProps {
  selectedCertifications: string[]
  onToggle: (value: string) => void
}

export function CompanyFormCertifications({
  selectedCertifications,
  onToggle,
}: CompanyFormCertificationsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {certificationOptions.map((cert) => (
        <button
          key={cert.value}
          type="button"
          onClick={() => onToggle(cert.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCertifications.includes(cert.value)
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          {cert.label}
        </button>
      ))}
    </div>
  )
}
