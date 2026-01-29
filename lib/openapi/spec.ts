/**
 * GovHelper OpenAPI 3.0.3 스펙 정의
 * 공개 API 엔드포인트 문서화
 */

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'GovHelper API',
    description: 'AI 기반 정부지원사업 매칭 플랫폼 API',
    version: '1.0.0',
    contact: {
      url: 'https://govhelpers.com',
    },
  },
  servers: [
    {
      url: 'https://govhelpers.com',
      description: '프로덕션',
    },
  ],
  tags: [
    { name: '공고', description: '정부지원사업 공고 검색 및 조회' },
    { name: '검색', description: '검색 자동완성' },
    { name: 'AI 매칭', description: 'AI 기반 매칭 분석' },
    { name: '비회원', description: '비회원 매칭 플로우' },
    { name: '지원서', description: 'AI 지원서 작성' },
    { name: '결제', description: '결제 및 구독' },
    { name: '통계', description: '공개 통계' },
    { name: '피드백', description: '사용자 피드백' },
  ],
  paths: {
    '/api/announcements': {
      get: {
        tags: ['공고'],
        summary: '공고 목록 조회',
        description: '정부지원사업 공고 목록을 필터링하고 페이지네이션하여 조회합니다.',
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: '페이지 번호 (기본값: 1)',
            required: false,
            schema: { type: 'integer', default: 1, minimum: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: '페이지당 항목 수 (기본값: 10)',
            required: false,
            schema: { type: 'integer', default: 10, minimum: 1, maximum: 100 },
          },
          {
            name: 'search',
            in: 'query',
            description: '검색어 (제목, 기관명 검색)',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'category',
            in: 'query',
            description: '공고 분류',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'source',
            in: 'query',
            description: '공고 출처 (smes, bizinfo, kstartup, g2b 등)',
            required: false,
            schema: { type: 'string' },
          },
          {
            name: 'status',
            in: 'query',
            description: '공고 상태 (기본값: active)',
            required: false,
            schema: { type: 'string', enum: ['active', 'closed'], default: 'active' },
          },
          {
            name: 'sort',
            in: 'query',
            description: '정렬 옵션 (created_at: 생성일순, quality_score: 품질순)',
            required: false,
            schema: { type: 'string', enum: ['created_at', 'quality_score'], default: 'created_at' },
          },
          {
            name: 'minQualityScore',
            in: 'query',
            description: '최소 품질 점수',
            required: false,
            schema: { type: 'integer', minimum: 0, maximum: 100 },
          },
        ],
        responses: {
          '200': {
            description: '성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        announcements: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/AnnouncementListItem' },
                        },
                        pagination: {
                          type: 'object',
                          properties: {
                            page: { type: 'integer', example: 1 },
                            limit: { type: 'integer', example: 10 },
                            total: { type: 'integer', example: 100 },
                            totalPages: { type: 'integer', example: 10 },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            headers: {
              'X-Cache': {
                description: '캐시 히트 여부 (HIT/MISS)',
                schema: { type: 'string' },
              },
            },
          },
        },
      },
    },
    '/api/announcements/{id}': {
      get: {
        tags: ['공고'],
        summary: '공고 상세 조회',
        description: '특정 공고의 상세 정보를 조회합니다.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: '공고 ID (UUID)',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: '성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Announcement' },
                  },
                },
              },
            },
          },
          '404': {
            description: '공고를 찾을 수 없음',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/announcements/search': {
      post: {
        tags: ['공고'],
        summary: 'AI 시맨틱/하이브리드 검색',
        description: 'AI 임베딩 기반 시맨틱 검색 또는 하이브리드 검색(시맨틱 + 키워드 + AI 재순위화)을 수행합니다. 인증 필요.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['query'],
                properties: {
                  query: { type: 'string', description: '검색어 (2자 이상)', minLength: 2, example: 'R&D 연구개발 지원' },
                  hybrid: { type: 'boolean', description: '하이브리드 검색 활성화', default: false },
                  rerank: { type: 'boolean', description: 'AI 재순위화 활성화 (hybrid=true 필요)', default: false },
                  matchThreshold: { type: 'number', description: '유사도 임계값', default: 0.5, minimum: 0, maximum: 1 },
                  matchCount: { type: 'integer', description: '최대 결과 개수', default: 20, minimum: 1, maximum: 100 },
                  filters: {
                    type: 'object',
                    description: '필터 조건',
                    properties: {
                      source: { type: 'string', description: '공고 출처' },
                      category: { type: 'string', description: '공고 분류' },
                      excludeExpired: { type: 'boolean', description: '마감된 공고 제외', default: true },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: '성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/SearchResult' },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        query: { type: 'string' },
                        totalResults: { type: 'integer' },
                        searchType: { type: 'string', enum: ['semantic', 'hybrid', 'keyword'] },
                        embeddingFromCache: { type: 'boolean' },
                        filters: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
            headers: {
              'X-Embedding-Cache': {
                description: '임베딩 캐시 히트 여부 (HIT/MISS)',
                schema: { type: 'string' },
              },
              'X-Rerank': {
                description: 'AI 재순위화 사용 여부 (HIT/MISS)',
                schema: { type: 'string' },
              },
            },
          },
          '401': {
            description: '인증 필요',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/search/autocomplete': {
      get: {
        tags: ['검색'],
        summary: '검색어 자동완성',
        description: '최근 검색어, 인기 검색어, 공고 제목을 기반으로 자동완성 제안을 제공합니다.',
        parameters: [
          {
            name: 'q',
            in: 'query',
            description: '검색어 (1자 이상)',
            required: true,
            schema: { type: 'string', minLength: 1 },
          },
        ],
        responses: {
          '200': {
            description: '성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { type: 'string' },
                      maxItems: 8,
                      example: ['창업 지원금', 'R&D 연구개발', '스마트공장'],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/matching': {
      post: {
        tags: ['AI 매칭'],
        summary: 'AI 매칭 분석',
        description: '기업 정보와 공고를 AI로 분석하여 매칭 점수 및 상세 분석 결과를 제공합니다. 인증 필요.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['announcementId', 'companyId'],
                properties: {
                  announcementId: { type: 'string', format: 'uuid', description: '공고 ID' },
                  companyId: { type: 'string', format: 'uuid', description: '기업 ID' },
                  businessPlanId: { type: 'string', format: 'uuid', description: '사업계획서 ID (선택)' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: '성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        match: { $ref: '#/components/schemas/Match' },
                        analysis: { $ref: '#/components/schemas/MatchAnalysis' },
                        fromCache: { type: 'boolean', description: '캐시에서 조회 여부' },
                      },
                    },
                  },
                },
              },
            },
            headers: {
              'X-Matching-Cache': {
                description: '매칭 캐시 히트 여부 (HIT/MISS)',
                schema: { type: 'string' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/matching/stream': {
      post: {
        tags: ['AI 매칭'],
        summary: 'AI 매칭 스트리밍 (SSE)',
        description: 'AI 매칭 분석을 Server-Sent Events로 스트리밍하여 실시간으로 결과를 받습니다. 인증 필요.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['announcementId', 'companyId'],
                properties: {
                  announcementId: { type: 'string', format: 'uuid', description: '공고 ID' },
                  companyId: { type: 'string', format: 'uuid', description: '기업 ID' },
                  businessPlanId: { type: 'string', format: 'uuid', description: '사업계획서 ID (선택)' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: '스트리밍 시작 (text/event-stream)',
            content: {
              'text/event-stream': {
                schema: {
                  type: 'string',
                  description: 'SSE 이벤트 스트림',
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/matching/{id}': {
      get: {
        tags: ['AI 매칭'],
        summary: '매칭 결과 조회',
        description: '저장된 매칭 결과를 조회합니다. 인증 필요.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: '매칭 ID (UUID)',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: '성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Match' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/recommendations': {
      get: {
        tags: ['AI 매칭'],
        summary: '맞춤 추천 공고',
        description: '사용자 기업 정보 기반 맞춤 공고를 추천합니다. 인증 필요 (Pro/Premium 플랜).',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Recommendation' },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': {
            description: '플랜 제한 초과',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/guest/matching': {
      post: {
        tags: ['비회원'],
        summary: '비회원 AI 매칭',
        description: '회원가입 없이 간단한 기업 정보를 입력하여 AI 매칭 결과를 받습니다. Rate Limit 적용.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'companyName', 'industry', 'employeeCount', 'location'],
                properties: {
                  email: { type: 'string', format: 'email', description: '이메일' },
                  companyName: { type: 'string', description: '회사명' },
                  industry: { type: 'string', description: '업종' },
                  employeeCount: { type: 'integer', minimum: 1, description: '직원수' },
                  location: { type: 'string', description: '소재지' },
                  businessNumber: { type: 'string', description: '사업자등록번호 (선택)' },
                  foundedDate: { type: 'string', format: 'date', description: '설립일 (선택)' },
                  annualRevenue: { type: 'number', description: '연매출 (선택)' },
                  certifications: { type: 'array', items: { type: 'string' }, description: '보유 인증 (선택)' },
                  description: { type: 'string', description: '기업 소개 (선택)' },
                  utm_source: { type: 'string', description: 'UTM Source (선택)' },
                  utm_medium: { type: 'string', description: 'UTM Medium (선택)' },
                  utm_campaign: { type: 'string', description: 'UTM Campaign (선택)' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: '성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        resultId: { type: 'string', format: 'uuid', description: '결과 ID (조회용)' },
                        leadId: { type: 'string', format: 'uuid', description: '리드 ID' },
                        matchCount: { type: 'integer', description: '매칭된 공고 개수' },
                      },
                    },
                  },
                },
              },
            },
          },
          '429': {
            description: 'Rate Limit 초과',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string', example: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.' },
                    retryAfter: { type: 'integer', description: '재시도 가능 시간 (초)' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/guest/matching/{id}': {
      get: {
        tags: ['비회원'],
        summary: '비회원 매칭 결과 조회',
        description: '비회원 매칭 결과를 조회합니다. 상위 2개 결과는 블러 처리됩니다.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: '결과 ID (UUID)',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: '성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        matches: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/GuestMatchResult' },
                        },
                        companyName: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/applications': {
      get: {
        tags: ['지원서'],
        summary: '지원서 목록 조회',
        description: '사용자의 지원서 목록을 조회합니다. 인증 필요.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        applications: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/ApplicationListItem' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['지원서'],
        summary: '지원서 생성 (AI 초안)',
        description: '매칭 결과를 기반으로 AI가 지원서 초안을 생성합니다. 인증 필요.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['matchId'],
                properties: {
                  matchId: { type: 'string', format: 'uuid', description: '매칭 ID' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: '성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        application: { $ref: '#/components/schemas/Application' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': {
            description: '플랜 제한 초과',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '409': {
            description: '이미 지원서 존재',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/applications/{id}': {
      get: {
        tags: ['지원서'],
        summary: '지원서 상세 조회',
        description: '특정 지원서의 상세 정보를 조회합니다. 인증 필요.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: '지원서 ID (UUID)',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: '성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Application' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/applications/{id}/improve': {
      post: {
        tags: ['지원서'],
        summary: 'AI 섹션 개선',
        description: '지원서의 특정 섹션을 AI로 개선합니다. 인증 필요.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: '지원서 ID (UUID)',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sectionName', 'currentContent'],
                properties: {
                  sectionName: { type: 'string', description: '섹션명', example: '사업 개요' },
                  currentContent: { type: 'string', description: '현재 내용' },
                  improvementGoal: { type: 'string', description: '개선 목표 (선택)', example: '더 구체적으로' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: '성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        improvedContent: { type: 'string', description: '개선된 내용' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/payments/toss/confirm': {
      post: {
        tags: ['결제'],
        summary: 'Toss 결제 확인',
        description: 'Toss Payments 결제 승인을 처리합니다. 인증 필요.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['orderId', 'paymentKey', 'amount'],
                properties: {
                  orderId: { type: 'string', description: '주문 ID' },
                  paymentKey: { type: 'string', description: 'Toss 결제 키' },
                  amount: { type: 'number', description: '결제 금액' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: '성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        orderId: { type: 'string' },
                        status: { type: 'string', example: 'completed' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '400': {
            description: '결제 실패',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/subscriptions': {
      get: {
        tags: ['결제'],
        summary: '구독 정보 조회',
        description: '현재 사용자의 구독 정보를 조회합니다. 인증 필요.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Subscription' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/statistics': {
      get: {
        tags: ['통계'],
        summary: '공개 통계',
        description: '플랫폼 공개 통계를 조회합니다.',
        responses: {
          '200': {
            description: '성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        totalAnnouncements: { type: 'integer', description: '전체 공고 수' },
                        activeAnnouncements: { type: 'integer', description: '진행 중 공고 수' },
                        totalUsers: { type: 'integer', description: '전체 사용자 수' },
                        totalMatches: { type: 'integer', description: '전체 매칭 수' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/feedback': {
      post: {
        tags: ['피드백'],
        summary: '사용자 피드백 제출',
        description: '사용자 피드백을 제출합니다. Rate Limit 적용.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  type: { type: 'string', enum: ['bug', 'feature', 'general', 'other'], default: 'general', description: '피드백 유형' },
                  subject: { type: 'string', maxLength: 255, description: '제목 (선택)' },
                  message: { type: 'string', minLength: 10, maxLength: 2000, description: '피드백 내용' },
                  email: { type: 'string', format: 'email', description: '연락처 이메일 (선택)' },
                  pageUrl: { type: 'string', description: '페이지 URL (선택)' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: '성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: '소중한 피드백 감사해요!' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                      },
                    },
                  },
                },
              },
            },
          },
          '429': {
            description: 'Rate Limit 초과',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string', example: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.' },
                    retryAfter: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      AnnouncementListItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: '공고 ID' },
          title: { type: 'string', description: '제목' },
          organization: { type: 'string', nullable: true, description: '주관기관' },
          category: { type: 'string', nullable: true, description: '분류' },
          support_type: { type: 'string', nullable: true, description: '지원유형' },
          support_amount: { type: 'string', nullable: true, description: '지원금액' },
          application_start: { type: 'string', format: 'date', nullable: true, description: '신청 시작일' },
          application_end: { type: 'string', format: 'date', nullable: true, description: '신청 마감일' },
          status: { type: 'string', enum: ['active', 'closed'], description: '상태' },
          source: { type: 'string', description: '출처' },
          quality_score: { type: 'integer', nullable: true, description: '품질 점수 (0-100)' },
          created_at: { type: 'string', format: 'date-time', description: '생성일' },
        },
      },
      Announcement: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          source: { type: 'string' },
          source_id: { type: 'string' },
          title: { type: 'string' },
          organization: { type: 'string', nullable: true },
          category: { type: 'string', nullable: true },
          support_type: { type: 'string', nullable: true },
          target_company: { type: 'string', nullable: true },
          support_amount: { type: 'string', nullable: true },
          application_start: { type: 'string', format: 'date', nullable: true },
          application_end: { type: 'string', format: 'date', nullable: true },
          content: { type: 'string', nullable: true },
          parsed_content: { type: 'string', nullable: true },
          attachment_urls: { type: 'array', items: { type: 'string' }, nullable: true },
          eligibility_criteria: { type: 'object', nullable: true, description: 'AI 파싱 자격요건 (JSONB)' },
          status: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      SearchResult: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          organization: { type: 'string', nullable: true },
          category: { type: 'string', nullable: true },
          support_type: { type: 'string', nullable: true },
          support_amount: { type: 'string', nullable: true },
          application_end: { type: 'string', format: 'date', nullable: true },
          source: { type: 'string' },
          similarity: { type: 'number', nullable: true, description: '유사도 점수 (0-1)' },
        },
      },
      Match: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          company_id: { type: 'string', format: 'uuid' },
          announcement_id: { type: 'string', format: 'uuid' },
          business_plan_id: { type: 'string', format: 'uuid', nullable: true },
          match_score: { type: 'integer', description: '매칭 점수 (0-100)' },
          analysis: { type: 'object', description: 'AI 분석 결과 (JSONB)' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      MatchAnalysis: {
        type: 'object',
        properties: {
          overallScore: { type: 'integer', description: '종합 점수 (0-100)' },
          categoryScores: {
            type: 'object',
            description: '카테고리별 점수',
            example: { eligibility: 85, alignment: 75, competitiveness: 80 },
          },
          strengths: { type: 'array', items: { type: 'string' }, description: '강점' },
          weaknesses: { type: 'array', items: { type: 'string' }, description: '약점' },
          recommendations: { type: 'array', items: { type: 'string' }, description: '추천사항' },
          summary: { type: 'string', description: '요약' },
        },
      },
      Recommendation: {
        type: 'object',
        properties: {
          announcement: { $ref: '#/components/schemas/AnnouncementListItem' },
          score: { type: 'integer', description: '추천 점수 (0-100)' },
          reason: { type: 'string', description: '추천 이유' },
        },
      },
      GuestMatchResult: {
        type: 'object',
        properties: {
          rank: { type: 'integer', description: '순위' },
          announcement_id: { type: 'string', format: 'uuid' },
          title: { type: 'string', description: '제목 (상위 2개는 블러 처리)' },
          organization: { type: 'string', nullable: true, description: '기관 (상위 2개는 블러 처리)' },
          category: { type: 'string', nullable: true },
          support_type: { type: 'string', nullable: true },
          support_amount: { type: 'string', nullable: true },
          application_end: { type: 'string', format: 'date', nullable: true },
          score: { type: 'integer', description: '매칭 점수 (0-100)' },
          summary: { type: 'string', description: '요약 (상위 2개는 블러 처리)' },
          strengths: { type: 'array', items: { type: 'string' } },
          weaknesses: { type: 'array', items: { type: 'string' } },
        },
      },
      ApplicationListItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['draft', 'completed', 'submitted'] },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
          matches: {
            type: 'object',
            properties: {
              announcements: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  title: { type: 'string' },
                  organization: { type: 'string', nullable: true },
                  application_end: { type: 'string', format: 'date', nullable: true },
                },
              },
            },
          },
        },
      },
      Application: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          match_id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          content: { type: 'string', description: 'JSON 형식 지원서 내용' },
          status: { type: 'string', enum: ['draft', 'completed', 'submitted'] },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      Subscription: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          plan: { type: 'string', enum: ['free', 'pro', 'premium'], description: '플랜' },
          status: { type: 'string', enum: ['active', 'cancelled', 'expired'], description: '상태' },
          current_period_start: { type: 'string', format: 'date-time' },
          current_period_end: { type: 'string', format: 'date-time' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', description: '에러 메시지' },
          code: { type: 'string', description: '에러 코드 (선택)' },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Supabase JWT 토큰을 Authorization 헤더에 Bearer 형식으로 전달합니다.',
      },
    },
    responses: {
      Unauthorized: {
        description: '인증 필요',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      NotFound: {
        description: '리소스를 찾을 수 없음',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
    },
  },
}
