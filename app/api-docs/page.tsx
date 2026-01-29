import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API 문서 | GovHelper',
  description: 'GovHelper API 문서 (OpenAPI/Swagger)',
}

export default function ApiDocsPage() {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css"
        />
      </head>
      <body style={{ margin: 0 }}>
        <div id="swagger-ui"></div>
        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.onload = function() {
                window.ui = SwaggerUIBundle({
                  url: '/api/docs/openapi.json',
                  dom_id: '#swagger-ui',
                  deepLinking: true,
                  presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIBundle.SwaggerUIStandalonePreset
                  ],
                  layout: 'BaseLayout',
                })
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
