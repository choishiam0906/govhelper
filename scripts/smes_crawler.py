# 중소벤처24 API + 크롤링 스크립트
# 2025년 지원사업 수집기

import requests
import pandas as pd
from bs4 import BeautifulSoup
import time
import json
import re
from datetime import datetime
from urllib.parse import urljoin
import warnings
warnings.filterwarnings('ignore')

# 중소벤처24 API 키
SMES_API_TOKEN = "/aK6H3+7h3rnbrBEB/rA3Af4qrDSNLhrrh0w6vDpt+g02fwpPpQK1Ms2AUceJNLu"

class SMES24APIClient:
    """중소벤처24 API 클라이언트"""

    def __init__(self, token=SMES_API_TOKEN):
        self.token = token
        self.base_url = "https://www.smes.go.kr/fnct/apiReqst"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'ko-KR,ko;q=0.9',
            'Content-Type': 'application/x-www-form-urlencoded'
        })

    def get_announcements(self, page=1, size=100):
        """공고 정보 조회 API"""
        url = f"{self.base_url}/extPblancInfo"

        # GET 방식 시도
        params = {
            'token': self.token,
            'pageNo': page,
            'numOfRows': size
        }

        try:
            print(f"🔄 API 호출: {url}")
            response = self.session.get(url, params=params, timeout=30)

            if response.status_code == 200:
                data = response.json()
                if data.get('resultCd') == '00':
                    print(f"✅ API 성공: {len(data.get('data', []))}개 항목")
                    return data.get('data', [])
                else:
                    print(f"⚠️ API 응답: {data.get('resultMsg', 'Unknown error')}")

            # POST 방식 시도
            print("🔄 POST 방식으로 재시도...")
            response = self.session.post(url, data=params, timeout=30)

            if response.status_code == 200:
                data = response.json()
                if data.get('resultCd') == '00':
                    print(f"✅ API 성공: {len(data.get('data', []))}개 항목")
                    return data.get('data', [])
                else:
                    print(f"⚠️ API 응답: {data.get('resultMsg', 'Unknown error')}")

        except Exception as e:
            print(f"❌ API 오류: {e}")

        return []

    def get_all_announcements(self, max_pages=10):
        """모든 공고 정보 수집"""
        all_data = []

        for page in range(1, max_pages + 1):
            print(f"📄 페이지 {page} 조회 중...")
            data = self.get_announcements(page=page)

            if not data:
                break

            all_data.extend(data)
            time.sleep(1)  # API 부하 방지

        return all_data


class DirectSMESCrawler:
    """직접 웹 크롤링 클라이언트"""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        })

        self.target_sites = {
            'mss': {
                'name': '중소벤처기업부',
                'base_url': 'https://www.mss.go.kr',
                'search_urls': [
                    'https://www.mss.go.kr/site/smba/ex/bbs/List.do?cbIdx=310'
                ]
            },
            'bizinfo': {
                'name': '기업마당',
                'base_url': 'https://www.bizinfo.go.kr',
                'search_urls': [
                    'https://www.bizinfo.go.kr/see/seea/selectSEEA120List.do'
                ]
            }
        }

        self.all_programs = []

    def get_page_content(self, url, params=None, retries=3):
        """페이지 내용 가져오기"""
        for attempt in range(retries):
            try:
                response = self.session.get(url, params=params, timeout=15)
                response.raise_for_status()
                response.encoding = 'utf-8'
                return response
            except Exception as e:
                if attempt < retries - 1:
                    time.sleep(2)
                    continue
                print(f"❌ 요청 실패: {url} - {e}")
                return None

    def is_2025_related(self, text):
        """2025년 관련 여부 확인"""
        return '2025' in text

    def extract_organization(self, text):
        """기관명 추출"""
        patterns = [
            r'(중소벤처기업부|중소벤처기업진흥공단|창업진흥원|기술보증기금)',
            r'([가-힣]+진흥원|[가-힣]+공단|[가-힣]+협회)',
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1).strip()
        return ""

    def crawl_mss(self):
        """중소벤처기업부 크롤링"""
        programs = []
        url = 'https://www.mss.go.kr/site/smba/ex/bbs/List.do?cbIdx=310'

        print(f"🏢 중소벤처기업부 크롤링...")
        response = self.get_page_content(url)

        if not response:
            return programs

        soup = BeautifulSoup(response.content, 'html.parser')
        rows = soup.select('tbody tr')

        for row in rows:
            try:
                title_elem = row.select_one('td.subject a, td a')
                if not title_elem:
                    continue

                title = title_elem.get_text(strip=True)
                content = row.get_text(separator=' ', strip=True)

                if self.is_2025_related(content):
                    href = title_elem.get('href', '')
                    link = urljoin('https://www.mss.go.kr', href) if href else ''

                    programs.append({
                        'title': title,
                        'content': content,
                        'link': link,
                        'organization': self.extract_organization(content) or '중소벤처기업부',
                        'source': 'mss.go.kr',
                        'scraped_at': datetime.now().isoformat()
                    })
            except Exception as e:
                continue

        print(f"✅ 중소벤처기업부: {len(programs)}개 수집")
        return programs

    def crawl_bizinfo(self):
        """기업마당 크롤링"""
        programs = []
        url = 'https://www.bizinfo.go.kr/see/seea/selectSEEA120List.do'

        print(f"🏢 기업마당 크롤링...")

        # POST 요청으로 목록 가져오기
        data = {
            'pageIndex': 1,
            'recordCountPerPage': 100,
            'pblancSe': '',  # 전체
            'bizPldirCode': '',
            'bsnsSportSe': '',
            'areaNm': '',
            'jrsdInsttNm': '',
            'searchKwrd': '2025'  # 2025년 검색
        }

        try:
            response = self.session.post(url, data=data, timeout=30)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                items = soup.select('.tbl_list tbody tr, .list_item, .biz_list li')

                for item in items:
                    title_elem = item.select_one('a, .title, .subject')
                    if title_elem:
                        title = title_elem.get_text(strip=True)
                        content = item.get_text(separator=' ', strip=True)

                        if self.is_2025_related(content) and title:
                            programs.append({
                                'title': title,
                                'content': content,
                                'link': '',
                                'organization': self.extract_organization(content) or '기업마당',
                                'source': 'bizinfo.go.kr',
                                'scraped_at': datetime.now().isoformat()
                            })
        except Exception as e:
            print(f"❌ 기업마당 크롤링 오류: {e}")

        print(f"✅ 기업마당: {len(programs)}개 수집")
        return programs

    def crawl_all(self):
        """모든 사이트 크롤링"""
        print("🚀 웹 크롤링 시작...")

        self.all_programs.extend(self.crawl_mss())
        time.sleep(2)
        self.all_programs.extend(self.crawl_bizinfo())

        # 중복 제거
        seen = set()
        unique = []
        for p in self.all_programs:
            key = p['title']
            if key not in seen:
                seen.add(key)
                unique.append(p)

        self.all_programs = unique
        print(f"📊 총 {len(self.all_programs)}개 프로그램 수집 완료")
        return self.all_programs


def save_to_excel(df, filename='중소벤처24_지원사업_2025.xlsx'):
    """Excel 저장 (pandas 최신 버전 호환)"""
    if df is None or df.empty:
        print("저장할 데이터가 없습니다.")
        return False

    try:
        # pandas 최신 버전: encoding 파라미터 제거
        df.to_excel(filename, index=False, engine='openpyxl')
        print(f"✅ 저장 완료: {filename}")
        return True
    except Exception as e:
        print(f"❌ 저장 실패: {e}")
        # CSV로 대체 저장
        csv_filename = filename.replace('.xlsx', '.csv')
        df.to_csv(csv_filename, index=False, encoding='utf-8-sig')
        print(f"📁 CSV로 저장: {csv_filename}")
        return True


def save_to_json(data, filename='중소벤처24_지원사업_2025.json'):
    """JSON 저장"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ JSON 저장: {filename}")
        return True
    except Exception as e:
        print(f"❌ JSON 저장 실패: {e}")
        return False


def main():
    """메인 실행"""
    print("=" * 60)
    print("🚀 중소벤처24 지원사업 수집기")
    print("=" * 60)

    all_data = []

    # 1. API 시도
    print("\n📡 [1단계] API 연동 시도...")
    api_client = SMES24APIClient()
    api_data = api_client.get_all_announcements(max_pages=5)

    if api_data:
        print(f"✅ API에서 {len(api_data)}개 수집")
        all_data.extend(api_data)
    else:
        print("⚠️ API 연동 실패 - 크롤링으로 전환")

    # 2. 웹 크롤링
    print("\n🕷️ [2단계] 웹 크롤링...")
    crawler = DirectSMESCrawler()
    crawl_data = crawler.crawl_all()

    if crawl_data:
        all_data.extend(crawl_data)

    # 3. 결과 정리
    if all_data:
        df = pd.DataFrame(all_data)

        # 중복 제거
        if 'title' in df.columns:
            df = df.drop_duplicates(subset=['title'])

        print(f"\n📊 최종 결과: {len(df)}개 지원사업")

        # 저장
        save_to_excel(df)
        save_to_json(all_data)

        # 미리보기
        print("\n📋 데이터 미리보기:")
        print(df[['title', 'organization', 'source']].head(5).to_string() if 'source' in df.columns else df.head(5).to_string())

        return df
    else:
        print("❌ 수집된 데이터가 없습니다.")
        return None


if __name__ == "__main__":
    df = main()
