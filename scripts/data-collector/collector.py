"""
GovHelper Data Collector
Collects government support program announcements from various sources:
- 공공데이터포털 (data.go.kr)
- 나라장터 (g2b.go.kr)
- 기업마당 (bizinfo.go.kr)
- K-Startup (k-startup.go.kr)
"""

import os
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# API Keys
DATA_GO_KR_API_KEY = os.getenv('DATA_GO_KR_API_KEY')
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')


class BaseCollector:
    """Base class for data collectors"""

    def __init__(self, source: str):
        self.source = source
        self.headers = {
            'User-Agent': 'GovHelper/1.0'
        }

    def save_to_supabase(self, announcements: List[Dict[str, Any]]) -> int:
        """Save announcements to Supabase database"""
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            logger.warning("Supabase credentials not configured")
            return 0

        saved_count = 0
        headers = {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        }

        for announcement in announcements:
            try:
                response = requests.post(
                    f"{SUPABASE_URL}/rest/v1/announcements",
                    headers=headers,
                    json=announcement
                )

                if response.status_code in [200, 201]:
                    saved_count += 1
                else:
                    logger.error(f"Failed to save: {response.text}")
            except Exception as e:
                logger.error(f"Error saving to Supabase: {e}")

        return saved_count


class DataGoKrCollector(BaseCollector):
    """Collector for 공공데이터포털 APIs"""

    BASE_URL = "http://apis.data.go.kr"

    def __init__(self):
        super().__init__('datagoKr')

    def collect_msit_announcements(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Collect announcements from 과학기술정보통신부"""

        if not DATA_GO_KR_API_KEY:
            logger.error("DATA_GO_KR_API_KEY not configured")
            return []

        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y%m%d')
        if not end_date:
            end_date = datetime.now().strftime('%Y%m%d')

        url = f"{self.BASE_URL}/1360000/NtceInfoService/getNtceInfoList"
        params = {
            'serviceKey': DATA_GO_KR_API_KEY,
            'numOfRows': 100,
            'pageNo': 1,
            'type': 'json',
            'bgngDt': start_date,
            'endDt': end_date
        }

        announcements = []

        try:
            response = requests.get(url, params=params, headers=self.headers)
            response.raise_for_status()

            data = response.json()
            items = data.get('response', {}).get('body', {}).get('items', {}).get('item', [])

            if isinstance(items, dict):
                items = [items]

            for item in items:
                announcement = {
                    'source': self.source,
                    'source_id': str(item.get('pblancId', '')),
                    'title': item.get('pblancNm', ''),
                    'organization': item.get('insttNm', ''),
                    'category': item.get('pblancClNm', ''),
                    'support_type': '일반',
                    'application_start': self._parse_date(item.get('rcptBgngDt')),
                    'application_end': self._parse_date(item.get('rcptEndDt')),
                    'content': item.get('pblancCn', ''),
                    'status': 'active' if self._is_active(item.get('rcptEndDt')) else 'closed'
                }
                announcements.append(announcement)

            logger.info(f"Collected {len(announcements)} announcements from MSIT")

        except Exception as e:
            logger.error(f"Error collecting from MSIT: {e}")

        return announcements

    def _parse_date(self, date_str: Optional[str]) -> Optional[str]:
        """Parse date string to ISO format"""
        if not date_str:
            return None
        try:
            if len(date_str) == 8:
                return f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"
            return date_str
        except Exception:
            return None

    def _is_active(self, end_date: Optional[str]) -> bool:
        """Check if announcement is still active"""
        if not end_date:
            return True
        try:
            end = datetime.strptime(end_date, '%Y%m%d')
            return end >= datetime.now()
        except Exception:
            return True


class NaraJangteoCollector(BaseCollector):
    """Collector for 나라장터 (조달청)"""

    BASE_URL = "http://apis.data.go.kr/1230000/BidPublicInfoService04"

    def __init__(self):
        super().__init__('narajangteo')

    def collect_service_bids(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Collect service bid announcements"""

        if not DATA_GO_KR_API_KEY:
            logger.error("DATA_GO_KR_API_KEY not configured")
            return []

        if not start_date:
            start_date = (datetime.now() - timedelta(days=7)).strftime('%Y%m%d') + '0000'
        if not end_date:
            end_date = datetime.now().strftime('%Y%m%d') + '2359'

        url = f"{self.BASE_URL}/getBidPblancListInfoServcPPSSrch"
        params = {
            'serviceKey': DATA_GO_KR_API_KEY,
            'numOfRows': 100,
            'pageNo': 1,
            'type': 'json',
            'inqryBgnDt': start_date,
            'inqryEndDt': end_date
        }

        announcements = []

        try:
            response = requests.get(url, params=params, headers=self.headers)
            response.raise_for_status()

            data = response.json()
            items = data.get('response', {}).get('body', {}).get('items', [])

            if isinstance(items, dict):
                items = [items]

            for item in items:
                announcement = {
                    'source': self.source,
                    'source_id': item.get('bidNtceNo', ''),
                    'title': item.get('bidNtceNm', ''),
                    'organization': item.get('ntceInsttNm', ''),
                    'category': '용역',
                    'support_type': '입찰',
                    'support_amount': item.get('presmptPrce', ''),
                    'application_start': self._parse_datetime(item.get('bidNtceDt')),
                    'application_end': self._parse_datetime(item.get('bidClseDt')),
                    'content': item.get('ntceSpecDocUrl1', ''),
                    'status': 'active'
                }
                announcements.append(announcement)

            logger.info(f"Collected {len(announcements)} service bids from NaraJangteo")

        except Exception as e:
            logger.error(f"Error collecting from NaraJangteo: {e}")

        return announcements

    def _parse_datetime(self, dt_str: Optional[str]) -> Optional[str]:
        """Parse datetime string to date"""
        if not dt_str:
            return None
        try:
            return dt_str[:10] if len(dt_str) >= 10 else dt_str
        except Exception:
            return None


class BizInfoCollector(BaseCollector):
    """Collector for 기업마당 (BizInfo)"""

    BASE_URL = "https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do"

    def __init__(self):
        super().__init__('bizinfo')

    def collect_support_programs(self) -> List[Dict[str, Any]]:
        """Collect support program announcements"""

        if not DATA_GO_KR_API_KEY:
            logger.error("DATA_GO_KR_API_KEY not configured")
            return []

        params = {
            'crtfcKey': DATA_GO_KR_API_KEY,
            'dataType': 'json',
            'pageUnit': 100,
            'pageIndex': 1
        }

        announcements = []

        try:
            response = requests.get(self.BASE_URL, params=params, headers=self.headers)
            response.raise_for_status()

            data = response.json()
            items = data.get('jsonArray', [])

            for item in items:
                announcement = {
                    'source': self.source,
                    'source_id': item.get('pblancId', ''),
                    'title': item.get('pblancNm', ''),
                    'organization': item.get('jrsdInsttNm', ''),
                    'category': self._map_category(item.get('polyBizSecd', '')),
                    'support_type': item.get('sportCn', ''),
                    'target_company': item.get('trgetNm', ''),
                    'application_start': item.get('reqstBeginEndDe', '').split('~')[0].strip() if item.get('reqstBeginEndDe') else None,
                    'application_end': item.get('reqstBeginEndDe', '').split('~')[-1].strip() if item.get('reqstBeginEndDe') else None,
                    'content': item.get('bsnsSumryCn', ''),
                    'status': 'active'
                }
                announcements.append(announcement)

            logger.info(f"Collected {len(announcements)} programs from BizInfo")

        except Exception as e:
            logger.error(f"Error collecting from BizInfo: {e}")

        return announcements

    def _map_category(self, code: str) -> str:
        """Map policy code to category name"""
        category_map = {
            '01': '금융',
            '02': 'R&D',
            '03': '인력',
            '04': '수출',
            '05': '창업',
            '06': '경영',
            '07': '기타'
        }
        return category_map.get(code[:2] if code else '', '기타')


def run_collection():
    """Run full data collection cycle"""
    logger.info("Starting data collection...")

    total_saved = 0

    # Collect from MSIT
    msit_collector = DataGoKrCollector()
    announcements = msit_collector.collect_msit_announcements()
    saved = msit_collector.save_to_supabase(announcements)
    total_saved += saved
    logger.info(f"Saved {saved} MSIT announcements")

    time.sleep(1)  # Rate limiting

    # Collect from NaraJangteo
    nara_collector = NaraJangteoCollector()
    announcements = nara_collector.collect_service_bids()
    saved = nara_collector.save_to_supabase(announcements)
    total_saved += saved
    logger.info(f"Saved {saved} NaraJangteo announcements")

    time.sleep(1)

    # Collect from BizInfo
    biz_collector = BizInfoCollector()
    announcements = biz_collector.collect_support_programs()
    saved = biz_collector.save_to_supabase(announcements)
    total_saved += saved
    logger.info(f"Saved {saved} BizInfo announcements")

    logger.info(f"Data collection completed. Total saved: {total_saved}")
    return total_saved


if __name__ == "__main__":
    run_collection()
