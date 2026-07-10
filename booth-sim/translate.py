# -*- coding: utf-8 -*-
# 부스 시뮬레이터 UI를 한국어로 번역합니다. 내부 로직 키(brand/type/=== 등)는 건드리지 않고
# 화면에 보이는 문구(JSX 텍스트, 속성값, 제품 name, 카테고리 탭)만 바꿉니다.
import io, re

f = "src/BoothSimulator.jsx"
s = io.open(f, encoding="utf-8").read()

# 1) 카테고리 탭 표시 라벨 (키는 유지)
s = s.replace(
    """{b === 'SPEEDRACK'
                    ? 'SPEEDRACK'
                    : b === 'HOMEDANT HOUSE'
                    ? 'HD HOUSE'
                    : 'EXHIBITION'}""",
    """{b === 'SPEEDRACK'
                    ? '스피드랙'
                    : b === 'HOMEDANT HOUSE'
                    ? '홈던트하우스'
                    : '전시회 물품'}""",
)

# 2) 카메라 조작 안내(범례)
s = s.replace(">L-Drag</span> rotate", ">좌드래그</span> 회전")
s = s.replace(">R-Drag</span> pan", ">우드래그</span> 이동")
s = s.replace(">Wheel</span> zoom", ">휠</span> 확대·축소")
s = s.replace(">Click</span> select", ">클릭</span> 선택")

# 3) 제품 이름 (name: '...') — 표시 전용
NAME = {
    "Shelf": "스탠다드 선반",
    "Heavy Duty Shelf": "중량 선반",
    "Slim Shelf": "슬림 선반",
    "Open Base Shelf": "하단오픈 선반",
    "Rolling Shelf": "바퀴 선반",
    "Garment Rack": "행거",
    "Washer / Dryer Shelf": "세탁·건조기 선반",
    "House Shelf": "홈던트 선반",
    "House Slim Shelf": "홈던트 슬림 선반",
    "House Cabinet Shelf": "홈던트 캐비닛 선반",
    "House Drawer Shelf": "홈던트 서랍 선반",
    "House Open Base Shelf": "홈던트 하단오픈 선반",
    "House Pegboard Shelf": "홈던트 타공 선반",
    "House Rolling Shelf": "홈던트 바퀴 선반",
    "House Garment Rack": "홈던트 행거",
    "Banner Stand": "배너 거치대",
    "Catalog Stand": "카탈로그 거치대",
    "Chair": "의자",
    "Counseling Table": "상담 테이블",
    "Poster Panel": "포스터 패널",
    "Sample Display Table": "샘플 진열대",
    "TV Stand": "TV 거치대",
}
for en, ko in sorted(NAME.items(), key=lambda x: -len(x[0])):
    s = s.replace(f"name: '{en}'", f"name: '{ko}'")

# 4) 구별되는(여러 단어) 표시 문구 — 긴 것부터
PLAIN = {
    'Booth Simulator': '부스 시뮬레이터',
    'Click "Save Current Booth" to store this layout.': '"현재 부스 저장"을 누르면 이 배치가 저장돼요.',
    'Save this booth design to the in-app library': '이 부스 디자인을 앱 보관함에 저장',
    'Save current view as PNG': '현재 화면을 PNG로 저장',
    'Export front / top / 45° views as 3 PNGs': '정면 / 윗면 / 45° 뷰를 PNG 3장으로 내보내기',
    'Show / hide the Design Library': '디자인 보관함 열기 / 닫기',
    'Start a new, empty booth layout': '새 빈 부스 배치 시작',
    'Used in exported PNG filenames': '내보낸 PNG 파일 이름에 사용돼요',
    'Reference image: not available': '참고 이미지: 없음',
    'Designs are stored in this browser only.': '디자인은 이 브라우저에만 저장돼요.',
    'or click a product in the library to add': '또는 보관함에서 물품을 클릭해 추가',
    'Pole frame with fabric curtains': '기둥 프레임 + 천 커튼',
    'Download as JSON file': 'JSON 파일로 내려받기',
    'Save Current Booth': '현재 부스 저장',
    'Select a product to edit': '편집할 물품을 선택하세요',
    'No saved designs yet.': '아직 저장된 디자인이 없어요.',
    'Click to load this design': '이 디자인 불러오기',
    'Position & Rotation': '위치 · 회전',
    'No reference image': '참고 이미지 없음',
    'Reference image:': '참고 이미지:',
    'Add-on Options': '추가 옵션',
    'Design Library': '디자인 보관함',
    'Product Library': '물품 보관함',
    'Export Images': '이미지 내보내기',
    'Load JSON file': 'JSON 파일 불러오기',
    'Solid panel walls': '단단한 판넬 벽',
    'Current setting: ': '현재 설정: ',
    'Create Layout': '배치 만들기',
    'Layout Check': '배치 점검',
    'Items placed': '배치된 물품',
    'Curtain Booth': '커튼 부스',
    'Wall Booth': '벽 부스',
    'Booth Type': '부스 형태',
    'Save Design': '디자인 저장',
    'layout name': '배치 이름',
    'Wall H': '벽 높이',
}
for en, ko in sorted(PLAIN.items(), key=lambda x: -len(x[0])):
    s = s.replace(en, ko)

# 5) 속성값(title/label/placeholder/aria-label 등) — ="X" / ='X'
ATTR = {
    'Width': '가로(폭)', 'Depth': '세로(깊이)', 'Height': '높이',
    'Rotation': '회전', 'Tier': '단', 'Colors': '색상', 'Dimensions': '크기',
    'Summary': '요약', 'Frame': '프레임', 'Board': '선반판', 'Close': '닫기',
}
for en, ko in ATTR.items():
    s = s.replace(f'="{en}"', f'="{ko}"').replace(f"='{en}'", f"='{ko}'")

# 6) 짧은 JSX 텍스트(노드 전체가 그 단어) — >  X  <
JSXWORD = {
    'Booth': '부스', 'Templates': '템플릿', 'Front': '정면', 'Top': '윗면',
    'Library': '보관함', 'Load': '불러오기', 'Delete': '삭제', 'Duplicate': '복제',
    'Rename': '이름 변경', 'Layout': '배치', 'Colors': '색상',
}
for en, ko in JSXWORD.items():
    s = re.sub(r">(\s*)" + re.escape(en) + r"(\s*)<", r">\g<1>" + ko + r"\g<2><", s)

# 7) 추가 옵션(add-on) 표시용 한글 맵 주입 + 버튼 표시 교체
addon_map = (
    "const ADDON_KO = {\n"
    "  'additional shelf': '선반 추가', 'hanger bar': '행거 봉', 'caster': '바퀴(캐스터)',\n"
    "  'pegboard': '타공판', 'side panel': '측면 판넬', 'handle': '손잡이',\n"
    "  'drawer': '서랍', 'curtain': '커튼', 'cabinet': '캐비닛',\n"
    "};\n\n"
)
s = s.replace("const SPEEDRACK_SIZES = {", addon_map + "const SPEEDRACK_SIZES = {", 1)
# add-on 버튼 라벨: {a} -> {ADDON_KO[a] || a}  (그 버튼 안에서만)
s = s.replace("                >\n                  {a}\n                </button>",
              "                >\n                  {ADDON_KO[a] || a}\n                </button>")

io.open(f, "w", encoding="utf-8").write(s)
print("번역 적용 완료")
