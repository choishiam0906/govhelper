# 중소벤처24 API 연동 스크립트
# 민간공고목록정보 API

import requests
import pandas as pd
import json
from datetime import datetime, timedelta
import time

# API 설정
SMES_API_CONFIG = {
    'base_url': 'https://www.smes.go.kr/main/fnct/apiReqst/extPblancInfo',
    'token': 'H5GuGfgyhANoGm1y6%2FVnkb6oZnuEGdwT6p6OTvLg4FOqRU6sk2WaZHHZkP7BpVDG'
}


class SMES24API:
    """중소벤처24 API 클라이언트"""

    def __init__(self, token=None):
        self.base_url = SMES_API_CONFIG['base_url']
        self.token = token or SMES_API_CONFIG['token']
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
        })

    def get_announcements(self, start_date, end_date):
        """
        공고 정보 조회

        Args:
            start_date: 시작일 (YYYYMMDD 형식)
            end_date: 종료일 (YYYYMMDD 형식)

        Returns:
            list: 공고 데이터 리스트
        """
        params = {
            'token': self.token,
            'strDt': start_date,
            'endDt': end_date
        }

        try:
            print(f"📡 API 호출: {start_date} ~ {end_date}")
            response = self.session.get(self.base_url, params=params, timeout=60)
            response.raise_for_status()

            data = response.json()

            if data.get('resultCd') == '0':
                items = data.get('data', [])
                print(f"✅ {len(items)}개 공고 조회 성공")
                return items
            else:
                print(f"⚠️ API 응답 오류: {data.get('resultMsg', 'Unknown error')}")
                return []

        except requests.exceptions.RequestException as e:
            print(f"❌ API 요청 실패: {e}")
            return []
        except json.JSONDecodeError as e:
            print(f"❌ JSON 파싱 실패: {e}")
            return []

    def get_active_announcements(self):
        """현재 진행 중인 공고만 조회 (마감되지 않은 공고)"""
        today = datetime.now()
        today_str = today.strftime('%Y-%m-%d')

        # 최근 6개월 ~ 3개월 후 데이터 조회
        start_date = (today - timedelta(days=180)).strftime('%Y%m%d')
        end_date = (today + timedelta(days=90)).strftime('%Y%m%d')

        print(f"📅 조회 기간: {start_date} ~ {end_date}")
        print(f"📅 오늘 날짜: {today_str} (마감일이 이후인 공고만 필터링)")

        data = self.get_announcements(start_date, end_date)

        if not data:
            return []

        # 마감되지 않은 공고만 필터링
        active_data = []
        for item in data:
            end_dt = item.get('pblancEndDt', '')
            if end_dt and end_dt >= today_str:
                active_data.append(item)

        # 중복 제거 (pblancSeq 기준)
        seen = set()
        unique_data = []
        for item in active_data:
            seq = item.get('pblancSeq')
            if seq and seq not in seen:
                seen.add(seq)
                unique_data.append(item)

        print(f"\n📊 진행 중인 공고: {len(unique_data)}개 (마감된 공고 제외)")
        return unique_data

    def to_dataframe(self, data):
        """데이터프레임 변환"""
        if not data:
            return pd.DataFrame()

        # 주요 필드 추출
        records = []
        for item in data:
            record = {
                'id': item.get('pblancSeq'),
                'title': item.get('pblancNm', ''),
                'organization': item.get('sportInsttNm', ''),
                'biz_type': item.get('bizType', ''),
                'sport_type': item.get('sportType', ''),
                'start_date': item.get('pblancBgnDt', ''),
                'end_date': item.get('pblancEndDt', ''),
                'area': item.get('areaNm', ''),
                'target_scale': item.get('cmpScale', ''),
                'detail_url': item.get('pblancDtlUrl', ''),
                'created_at': item.get('creatDt', ''),
                'updated_at': item.get('updDt', ''),
            }
            records.append(record)

        return pd.DataFrame(records)


def save_to_excel(df, filename='중소벤처24_공고목록_2025.xlsx'):
    """Excel 저장"""
    if df.empty:
        print("저장할 데이터가 없습니다.")
        return False

    try:
        df.to_excel(filename, index=False, engine='openpyxl')
        print(f"✅ Excel 저장 완료: {filename}")
        return True
    except Exception as e:
        print(f"❌ Excel 저장 실패: {e}")
        # CSV로 대체
        csv_file = filename.replace('.xlsx', '.csv')
        df.to_csv(csv_file, index=False, encoding='utf-8-sig')
        print(f"📁 CSV로 저장: {csv_file}")
        return True


def save_to_json(data, filename='중소벤처24_공고목록_2025.json'):
    """JSON 저장"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ JSON 저장 완료: {filename}")
        return True
    except Exception as e:
        print(f"❌ JSON 저장 실패: {e}")
        return False


def main():
    """메인 실행 - 진행 중인 공고만 수집"""
    print("=" * 60)
    print("🚀 중소벤처24 API 데이터 수집 시작")
    print("   (마감되지 않은 진행 중인 공고만)")
    print("=" * 60)

    # API 클라이언트 생성
    api = SMES24API()

    # 진행 중인 공고만 수집
    data = api.get_active_announcements()

    if data:
        # 데이터프레임 변환
        df = api.to_dataframe(data)

        print(f"\n📋 수집 결과:")
        print(f"   • 총 공고 수: {len(df)}")
        print(f"   • 컬럼: {list(df.columns)}")

        if len(df) > 0:
            print(f"\n📊 기관별 분포:")
            print(df['organization'].value_counts().head(10).to_string())

            print(f"\n📊 사업유형별 분포:")
            print(df['biz_type'].value_counts().head(10).to_string())

        # 저장
        save_to_excel(df)
        save_to_json(data)

        # 미리보기
        print(f"\n📋 데이터 미리보기:")
        print(df[['title', 'organization', 'start_date', 'end_date']].head(5).to_string())

        return df
    else:
        print("❌ 수집된 데이터가 없습니다.")
        return None


# 테스트용 빠른 실행
def quick_test():
    """빠른 테스트 (최근 1개월)"""
    print("🧪 빠른 테스트 실행...")

    api = SMES24API()

    # 최근 1개월 데이터만 조회
    today = datetime.now()
    start = (today - timedelta(days=30)).strftime('%Y%m%d')
    end = today.strftime('%Y%m%d')

    data = api.get_announcements(start, end)

    if data:
        df = api.to_dataframe(data)
        print(f"\n✅ 최근 30일: {len(df)}개 공고")
        print(df[['title', 'organization']].head(5).to_string())
        return df

    return None


if __name__ == "__main__":
    # 빠른 테스트
    # df = quick_test()

    # 전체 수집
    df = main()
