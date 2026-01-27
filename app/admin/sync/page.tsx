import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getSyncStats, getSourceSummary, getRunningSyncs } from "@/lib/sync/logger"
import { RefreshCw, CheckCircle2, XCircle, Loader2, Clock, Database } from "lucide-react"

const SOURCE_NAMES: Record<string, string> = {
  smes: '중소벤처24',
  bizinfo: '기업마당',
  kstartup: 'K-Startup',
  g2b: '나라장터',
}

function formatDuration(startedAt: string, completedAt: string | null): string {
  const start = new Date(startedAt)
  const end = completedAt ? new Date(completedAt) : new Date()
  const diffMs = end.getTime() - start.getTime()
  const mins = Math.floor(diffMs / 60000)
  const secs = Math.floor((diffMs % 60000) / 1000)
  return mins > 0 ? `${mins}분 ${secs}초` : `${secs}초`
}

function getStatusBadge(status: 'running' | 'success' | 'failed') {
  switch (status) {
    case 'success':
      return <Badge variant="default"><CheckCircle2 className="w-3 h-3 mr-1 inline" />성공</Badge>
    case 'failed':
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1 inline" />실패</Badge>
    case 'running':
      return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 inline animate-spin" />실행 중</Badge>
  }
}

export default async function SyncMonitoringPage() {
  const runningSyncs = await getRunningSyncs()
  const allLogs = await getSyncStats(undefined, 7)

  const sources = ['smes', 'bizinfo', 'kstartup', 'g2b']
  const summaries = await Promise.all(
    sources.map(async (source) => ({
      source,
      summary: await getSourceSummary(source, 7),
    }))
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <RefreshCw className="w-8 h-8" />
          동기화 모니터링
        </h1>
        <p className="text-muted-foreground mt-2">
          정부지원사업 공고 동기화 현황을 모니터링해요
        </p>
      </div>

      {runningSyncs.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              실행 중인 작업 ({runningSyncs.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {runningSyncs.map((sync) => (
                <div key={sync.id} className="flex items-center justify-between">
                  <span className="font-medium">{SOURCE_NAMES[sync.source]}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDuration(sync.started_at, null)} 경과
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaries.map(({ source, summary }) => (
          <Card key={source}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {SOURCE_NAMES[source]}
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.lastSync ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">마지막 동기화</span>
                      {summary.status && getStatusBadge(summary.status)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(summary.lastSync).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="text-sm space-y-1 border-t pt-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">24시간 성공</span>
                        <span className="font-medium text-green-600">{summary.last24h.success}회</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">24시간 실패</span>
                        <span className="font-medium text-red-600">{summary.last24h.failed}회</span>
                      </div>
                    </div>
                    <div className="text-sm space-y-1 border-t pt-2">
                      <div className="font-medium mb-1">7일 통계</div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">총 가져온 건수</span>
                        <span>{summary.last7d.totalFetched.toLocaleString()}건</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">신규 추가</span>
                        <span className="text-blue-600">{summary.last7d.newAdded.toLocaleString()}건</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">업데이트</span>
                        <span className="text-green-600">{summary.last7d.updated.toLocaleString()}건</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">실패</span>
                        <span className="text-red-600">{summary.last7d.failed.toLocaleString()}건</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">동기화 기록 없음</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>최근 동기화 로그 (7일)</CardTitle>
        </CardHeader>
        <CardContent>
          {allLogs && allLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시간</TableHead>
                  <TableHead>소스</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>소요시간</TableHead>
                  <TableHead className="text-right">가져온 수</TableHead>
                  <TableHead className="text-right">신규</TableHead>
                  <TableHead className="text-right">업데이트</TableHead>
                  <TableHead className="text-right">실패</TableHead>
                  <TableHead>에러 메시지</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">
                      {new Date(log.started_at).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>{SOURCE_NAMES[log.source]}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="text-xs">
                      {formatDuration(log.started_at, log.completed_at)}
                    </TableCell>
                    <TableCell className="text-right">{log.total_fetched}</TableCell>
                    <TableCell className="text-right text-blue-600">{log.new_added}</TableCell>
                    <TableCell className="text-right text-green-600">{log.updated}</TableCell>
                    <TableCell className="text-right text-red-600">{log.failed}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {log.error_message || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              최근 7일간 동기화 로그가 없어요
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
