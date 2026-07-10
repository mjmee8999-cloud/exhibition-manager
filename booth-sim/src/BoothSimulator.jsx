import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import {
  Plus,
  Trash2,
  Copy,
  RotateCw,
  Save,
  Upload,
  Download,
  Camera,
  Eye,
  Box,
  Move,
  Grid3x3,
  Layers,
  Home,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Maximize2,
  FilePlus,
} from 'lucide-react';

/* ============================================================
   SIZE OPTIONS  ── per spec sheet
   ============================================================ */
const ADDON_KO = {
  'additional shelf': '선반 추가', 'hanger bar': '행거 봉', 'caster': '바퀴(캐스터)',
  'pegboard': '타공판', 'side panel': '측면 판넬', 'handle': '손잡이',
  'drawer': '서랍', 'curtain': '커튼', 'cabinet': '캐비닛',
};

const SPEEDRACK_SIZES = {
  width: [300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1500],
  depth: [300, 400, 500, 600, 800, 900],
  height: [
    330, 420, 600, 750, 900, 1200, 1350, 1500, 1650, 1800, 1950, 2100, 2400,
  ],
};

const HOMEDANT_HOUSE_SIZES = {
  width: [300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200],
  depth: [300, 400, 500, 600, 700],
  height: [600, 750, 900, 1050, 1200, 1350, 1500, 1650, 1800, 1950, 2100],
};

const EXHIBITION_SIZES = {
  width: [300, 400, 500, 600, 800, 1000, 1200, 1500, 1800, 2000],
  depth: [50, 300, 400, 500, 600, 800, 1000],
  height: [400, 500, 750, 900, 1100, 1500, 1800, 2000, 2200],
};

/* ============================================================
   PRODUCT LIBRARY
   ============================================================ */
const PRODUCT_LIBRARY = [
  // === SPEEDRACK / HOMEDANT ===
  {
    id: 'sp_shelf',
    brand: 'SPEEDRACK',
    category: 'Shelf',
    name: '스탠다드 선반',
    type: 'shelf',
    defaultSize: { width: 900, depth: 400, height: 1800 },
    sizeOptions: SPEEDRACK_SIZES,
    tierOptions: [2, 3, 4, 5],
    defaultTier: 2,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: [
      'additional shelf',
      'hanger bar',
      'caster',
      'pegboard',
      'side panel',
    ],
  },

  {
    id: 'sp_heavy',
    brand: 'SPEEDRACK',
    category: 'Heavy Duty Shelf',
    name: '중량 선반',
    type: 'heavy',
    defaultSize: { width: 1200, depth: 600, height: 1800 },
    sizeOptions: SPEEDRACK_SIZES,
    tierOptions: [3, 4, 5],
    defaultTier: 5,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: ['additional shelf', 'side panel'],
  },

  {
    id: 'sp_washer',
    brand: 'SPEEDRACK',
    category: 'Washing Machine Shelf',
    name: '세탁·건조기 선반',
    type: 'frame_open',
    defaultSize: { width: 700, depth: 600, height: 1800 },
    sizeOptions: SPEEDRACK_SIZES,
    tierOptions: [1, 2, 3],
    defaultTier: 2,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: ['additional shelf', 'hanger bar'],
  },

  {
    id: 'sp_slim',
    brand: 'SPEEDRACK',
    category: 'Slim Shelf',
    name: '슬림 선반',
    type: 'shelf',
    defaultSize: { width: 300, depth: 300, height: 1800 },
    sizeOptions: SPEEDRACK_SIZES,
    tierOptions: [2, 3, 4, 5],
    defaultTier: 5,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: ['additional shelf'],
  },

  {
    id: 'sp_open',
    brand: 'SPEEDRACK',
    category: 'Open Base Shelf',
    name: '하단오픈 선반',
    type: 'open_base',
    defaultSize: { width: 900, depth: 400, height: 1800 },
    sizeOptions: SPEEDRACK_SIZES,
    tierOptions: [3, 4, 5],
    defaultTier: 4,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: ['additional shelf', 'hanger bar'],
  },

  {
    id: 'sp_garment',
    brand: 'SPEEDRACK',
    category: 'Garment Rack',
    name: '행거',
    type: 'garment',
    defaultSize: { width: 900, depth: 500, height: 1800 },
    sizeOptions: SPEEDRACK_SIZES,
    tierOptions: [1, 2, 3],
    defaultTier: 2,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: ['additional shelf', 'hanger bar'],
  },

  {
    id: 'sp_rolling',
    brand: 'SPEEDRACK',
    category: 'Rolling Shelf',
    name: '바퀴 선반',
    type: 'rolling',
    defaultSize: { width: 600, depth: 400, height: 900 },
    sizeOptions: SPEEDRACK_SIZES,
    tierOptions: [2, 3, 4, 5],
    defaultTier: 3,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: ['additional shelf', 'handle'],
  },

  // === HOMEDANT HOUSE ===
  {
    id: 'hh_shelf',
    brand: 'HOMEDANT HOUSE',
    category: 'Shelf',
    name: '홈던트 선반',
    type: 'shelf',
    defaultSize: { width: 900, depth: 400, height: 1800 },
    sizeOptions: HOMEDANT_HOUSE_SIZES,
    tierOptions: [2, 3, 4, 5],
    defaultTier: 2,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: ['drawer', 'hanger bar', 'curtain', 'pegboard'],
  },

  {
    id: 'hh_garment',
    brand: 'HOMEDANT HOUSE',
    category: 'Garment Rack',
    name: '홈던트 행거',
    type: 'garment',
    defaultSize: { width: 900, depth: 500, height: 1800 },
    sizeOptions: HOMEDANT_HOUSE_SIZES,
    tierOptions: [1, 2],
    defaultTier: 2,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: ['hanger bar', 'curtain'],
  },

  {
    id: 'hh_slim',
    brand: 'HOMEDANT HOUSE',
    category: 'Slim Shelf',
    name: '홈던트 슬림 선반',
    type: 'shelf',
    defaultSize: { width: 300, depth: 300, height: 1800 },
    sizeOptions: HOMEDANT_HOUSE_SIZES,
    tierOptions: [2, 3, 4, 5],
    defaultTier: 4,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: [],
  },

  {
    id: 'hh_open',
    brand: 'HOMEDANT HOUSE',
    category: 'Open Base Shelf',
    name: '홈던트 하단오픈 선반',
    type: 'open_base',
    defaultSize: { width: 900, depth: 400, height: 1800 },
    sizeOptions: HOMEDANT_HOUSE_SIZES,
    tierOptions: [3, 4],
    defaultTier: 4,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: ['hanger bar'],
  },

  {
    id: 'hh_drawer',
    brand: 'HOMEDANT HOUSE',
    category: 'Drawer Shelf',
    name: '홈던트 서랍 선반',
    type: 'drawer',
    defaultSize: { width: 600, depth: 400, height: 1200 },
    sizeOptions: HOMEDANT_HOUSE_SIZES,
    tierOptions: [3],
    defaultTier: 3,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: ['drawer'],
  },

  {
    id: 'hh_cabinet',
    brand: 'HOMEDANT HOUSE',
    category: 'Cabinet Shelf',
    name: '홈던트 캐비닛 선반',
    type: 'cabinet',
    defaultSize: { width: 900, depth: 400, height: 1800 },
    sizeOptions: HOMEDANT_HOUSE_SIZES,
    tierOptions: [3, 4],
    defaultTier: 4,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: ['cabinet', 'drawer'],
  },

  {
    id: 'hh_rolling',
    brand: 'HOMEDANT HOUSE',
    category: 'Rolling Shelf',
    name: '홈던트 바퀴 선반',
    type: 'rolling',
    defaultSize: { width: 600, depth: 400, height: 900 },
    sizeOptions: HOMEDANT_HOUSE_SIZES,
    tierOptions: [2, 3, 4, 5],
    defaultTier: 3,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: [],
  },

  {
    id: 'hh_pegboard',
    brand: 'HOMEDANT HOUSE',
    category: 'Pegboard Shelf',
    name: '홈던트 타공 선반',
    type: 'pegboard',
    defaultSize: { width: 600, depth: 400, height: 1800 },
    sizeOptions: HOMEDANT_HOUSE_SIZES,
    tierOptions: [3, 4, 5],
    defaultTier: 4,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: [],
  },

  // === EXHIBITION ITEMS ===
  {
    id: 'ex_banner',
    brand: 'Exhibition',
    category: 'Banner Stand',
    name: '배너 거치대',
    type: 'banner',
    defaultSize: { width: 800, depth: 400, height: 2000 },
    sizeOptions: EXHIBITION_SIZES,
    tierOptions: [1],
    defaultTier: 1,
    frameColors: ['black', 'white'],
    boardColors: ['white'],
    addOns: [],
  },

  {
    id: 'ex_poster',
    brand: 'Exhibition',
    category: 'Poster Panel',
    name: '포스터 패널',
    type: 'poster',
    defaultSize: { width: 1000, depth: 50, height: 1800 },
    sizeOptions: EXHIBITION_SIZES,
    tierOptions: [1],
    defaultTier: 1,
    frameColors: ['black', 'white'],
    boardColors: ['white'],
    addOns: [],
  },

  {
    id: 'ex_table',
    brand: 'Exhibition',
    category: 'Counseling Table',
    name: '상담 테이블',
    type: 'table',
    defaultSize: { width: 1500, depth: 800, height: 750 },
    sizeOptions: EXHIBITION_SIZES,
    tierOptions: [1],
    defaultTier: 1,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: [],
  },

  {
    id: 'ex_chair',
    brand: 'Exhibition',
    category: 'Chair',
    name: '의자',
    type: 'chair',
    defaultSize: { width: 500, depth: 500, height: 900 },
    sizeOptions: EXHIBITION_SIZES,
    tierOptions: [1],
    defaultTier: 1,
    frameColors: ['black', 'white'],
    boardColors: ['black', 'white'],
    addOns: [],
  },

  {
    id: 'ex_catalog',
    brand: 'Exhibition',
    category: 'Catalog Stand',
    name: '카탈로그 거치대',
    type: 'catalog',
    defaultSize: { width: 400, depth: 400, height: 1500 },
    sizeOptions: EXHIBITION_SIZES,
    tierOptions: [1],
    defaultTier: 1,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: [],
  },

  {
    id: 'ex_sample',
    brand: 'Exhibition',
    category: 'Sample Display Table',
    name: '샘플 진열대',
    type: 'table',
    defaultSize: { width: 1200, depth: 600, height: 900 },
    sizeOptions: EXHIBITION_SIZES,
    tierOptions: [1],
    defaultTier: 1,
    frameColors: ['black', 'white'],
    boardColors: ['wood', 'white'],
    addOns: [],
  },

  {
    id: 'ex_tv',
    brand: 'Exhibition',
    category: 'TV Stand',
    name: 'TV 거치대',
    type: 'tv',
    defaultSize: { width: 1500, depth: 500, height: 2000 },
    sizeOptions: EXHIBITION_SIZES,
    tierOptions: [1],
    defaultTier: 1,
    frameColors: ['black', 'white'],
    boardColors: ['black'],
    addOns: [],
  },
];

/* ============================================================
   HOMEDANT LOGO  ── embedded data URL (works offline, no CDN)
   ============================================================ */
const HOMEDANT_LOGO_URL =
  'data:image/jpeg;base64,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';

/* ============================================================
   RENDER IMAGE MANIFEST
   --------------------------------------------------------------
   Reference rendering images for each product. Used ONLY for:
     1) 물품 보관함 thumbnails (left panel)
     2) Property Panel preview (right panel)
   These images do NOT affect Three.js geometry, collision, or
   placement. The 3D model is always built from current settings.

   To register your real image files:
   ───────────────────────────────────────────────────────────
     A) Drop them under   /assets/renderings/<filename>.png
     B) Either add hand-written entries to RENDER_IMAGE_MANIFEST
        below, OR call `registerRenderImagesByFilename([...])`
        with the bare filenames and the parser will fill in
        brand / type / W / D / H / tier / color automatically.

   Filename parsing recognizes:
     SPEEDRACK | HOMEDANT_HOUSE | HOMEDANTHOUSE  ── brand
     shelf | heavy | washer | rolling | garment | pegboard
       | drawer | cabinet | open  ── type
     <W>x<D>x<H>   or   <W>_<D>_<H>     ── dimensions in mm
     <N>tier  or  <N>T  or  <N>-tier    ── tier count
     black | white | gray | grey        ── color

   Examples that parse cleanly:
     SPEEDRACK_shelf_1200x400x1800_5tier_black.png
     HOMEDANT_HOUSE_shelf_900x450x1800_4T_white.png
     speedrack-heavy-1200_600_2100-5tier-black.jpg
   ============================================================ */
/* Auto-populated from /renderings_small/ at build time.
   8 SPEEDRACK isometric views, resized to ~320px tall, embedded as
   base64 WebP. Total inline weight ~170 KB.
   To add more images: drop the file in, run the build helper, or
   call registerRenderImagesByFilename([...]) below.               */
const RENDER_IMAGE_MANIFEST = [
  {
    fileName: '스피드랙_1200x400x1500_3단_B_사시도.webp',
    brand: 'SPEEDRACK',
    type: 'shelf',
    width: 1200,
    depth: 400,
    height: 1500,
    tier: 3,
    color: 'black',
    boardColor: 'white',
    url: 'data:image/webp;base64,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',
  },
  {
    fileName: '스피드랙_1200x400x1800_3단_B_Wood_사시도.webp',
    brand: 'SPEEDRACK',
    type: 'shelf',
    width: 1200,
    depth: 400,
    height: 1800,
    tier: 3,
    color: 'black',
    boardColor: 'wood',
    url: 'data:image/webp;base64,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',
  },
  {
    fileName: '스피드랙_1200x400x1800_3단_W_Wood_사시도.webp',
    brand: 'SPEEDRACK',
    type: 'shelf',
    width: 1200,
    depth: 400,
    height: 1800,
    tier: 3,
    color: 'white',
    boardColor: 'wood',
    url: 'data:image/webp;base64,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',
  },
  {
    fileName: '스피드랙_1200x400x1800_5단_B_Wood_사시도.webp',
    brand: 'SPEEDRACK',
    type: 'shelf',
    width: 1200,
    depth: 400,
    height: 1800,
    tier: 5,
    color: 'black',
    boardColor: 'wood',
    url: 'data:image/webp;base64,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',
  },
  {
    fileName: '스피드랙_1200x400x1950_2단1행거_B_Wood_사시도.webp',
    brand: 'SPEEDRACK',
    type: 'garment',
    width: 1200,
    depth: 400,
    height: 1950,
    tier: 2,
    color: 'black',
    boardColor: 'wood',
    hanger: true,
    url: 'data:image/webp;base64,UklGRlI1AABXRUJQVlA4WAoAAAAQAAAAnQAAPwEAQUxQSJYgAAABDMVt2zjS/msn1+svIiaA9jYZ2PhT2CTf15w2aa02AAyLLAdU6fH/vz6JNsA6u7vbw+4+4+w69bywTz07z+7uDpTuThEJO7FoBOnurm1sv9/v+348th8TPsz7OyJkQbZbt83hDCe4gSiKlgFQ7sPfkCPZVt18QzJiZtZHMdPalH8Yrpb2EQEJbSRJkhYKOqjq305mzvmXVG1SqZ6evoGm6Usl2lv9Vj1HzFy+65rX+9isUI/ji4a1ryOp0vQ0s9STSiW626oshN53rkzasG2fUbOW7zh93/V5SGKejEFrEwpjX1qfXje9f0u9755FosvNoGlnw0mL1h+6Zv34Q0x2BYP2xgSe5wWmGUlA1VYc+8Lq5JopfZppW2LdO8u05bvOnrnj9DQ4MV/xvYXgOXXjeUFgDN9fIo7jtJyFz/8aYHL47wk9Gmt5yfU1w+nGWb6zFELVlWCMoeaNffcsqpwwn3t7l47p8pO2s9T+26GAU4lWQhCqvRBkZ9F2pykyvnje2LloeMd6Wt4OtXgWJ/D4fqvlszBUabKUDy6Xt8wd3LZWQ8ttnaAab4fvnKUs8a39uQ0zfm5VK6HFSKeo3puW/05oObF6Sp/mpKHlnk5Sw9AiiELL8ok9aULLXTWM4Ydo1Qst+5aN6VqN0FKNTuA4rhYO1J3QEuR1c5c6tNT/fmiRqjvGK7J5AKgyHC+wmqK7oSX1o8sVdWhpV0eibXnuAJ8a9Zm24aLblyzuhxwOTBCqFVpm/ty6pXp5LMOfhVZZoka9pvxz3vlzpqqmw/0woaWkKPGtmUVyYKJUX19rvdawx+Q1Zxw/pldqSfRahnvBf9q7qHhSJYhI9bQP16DbhJWn7N6nKrTcnzz7QaKKtuvkM26C99CvGtuqNVz9LuOWn7B5myL/EV9BHsamKZERkiqtRsPV6zwmyL8AFRU/1HA8bltFPoqTiJNYjYbTpGbLJqEwObBj8RHzlwnlAAAAuj0cjzt3hYrwGqEtf+j7L86Dz50xmlnUaT9i6QHTZ3Fl3xtOF7kJBJMg0ZO8KuAhLxuuX9egapGj33bY4r0PnsSU0A1XyaNSoMsRGuNuSc4XiYSG56llKC0bIlH/JNWkYi3D6bUZsnCPkX90sfbhqpmPGcBqnrd4UXSvKge5xEmImm3bYNzeMU2ip31zq69tOGmrQfN33vH9Wli94YjWQvsUy1PlKnbrriI7igapxGdyFjwuT9VCtYeTtDScu/3Wo4gCLaUa2XAAuKKkL4/Nzm5dMrF/+/pvgRs3gFAq42W4EnmpI7RQ3eG0xOzmA2Zvvf4wPI9pG47xAnjGxLeMUOVVYlDkxrzzMDq2ft6onuqcrqUF2cSa3ORVn6l4BSWAQVqgGq5ZvxmbrnqG5vIAoKiGC6fE1s7N1NFAe3EpLoJj/n5uYx7s/o1Kth8QAtOjGoOofW+4Jn2m/3ulWAAYn2V5YceyyQMnrz3n9EEByFpVXQt97SWvVBL2rMDIqDAqlkr2HJwK+2PTtVAbw8VCo7prndXPR+5Oluhr3x1q4x1w7ToQTmW8eCRHcthoLZAPZ2DQ8IUXj5SH7gb11LeMlvwsCvLV40Op6uZVIIiK12AADEmo9mU2seyjhGkrV60z19PcdNUmevUrC+OoZ5FUl+U8MwJONyfXJvVfbGB4sfClRJ9omjFnokwepL5KpLoo167xMN8TS3VeRDKW98JBokfE51zVjevgIqiMZw/K8PVVXzJ4BcaAW2QEApcvA6F0Mmpbbui2SoWAv9zJCHVIvHsnIzKM6qI8tsbiifNQauQ8ioN194dkxC97bW4c7ZlMdVkOraJgtCWR6r2+CATveUbmEhlQeOu6UB5FZTw9XozPD8eSNB4COOZFxkfg0iXCLPBKJJfpsS8JAspSXMn4XMFdvl6eF0J1UY/upiL4bVdqajFQCfOuTmRyzJp3xg/CHJOoLsuuSRhub6Bxw8dLGLwn+ZN18ce/3btemRlLZQRsLMBr26lU94svQ6K9LxkhOdxltRxJVvWK5Crdkiyujcj4BJy7LPBksv+zXKQmtqSfHl3hEXKJTg53Sb1hFO4WT3VZNk2CcGsjjZvYDlDhQTt3MhIXv7t/ozicrPrwXZwLf6O51OD5XuDNqqdkRrRf8dWLYF/Jqt4CHvLShqT/LU9ASaoXGUHA2fNAGFmOSi1FWXnNErm40h2m4M/djn9GttuybfcFd7fHtApYT+fgNM6BTI5b++nOrYxnqVQX5f1LBrwuRVJjj2kC7IY8IuuSDsfevAhVNNnzm3Al8lPbdGIINAUiLviREZ7NnzsLRJDBKms7C+ilkMoSSTBw6mr210gp0UXZDwiC2ZGQ3uj1EwHpzxzJ+OqRefl2nGs6Vec1JBmOxxKpuXlfDvfaOZPNPGXhx9sXWKm6+pCS4KPZ5Yf06MQQ8A/gu8CfrIv1KblwBoiiQSo1BQRU5GhvFB7CkPHyIRmhwMkLFfnhUhokrjPD4HJrRquAuDZyJiNMKZy69dUuTUKEc/dYWO2mcVPnTTyerLMnI+Gf4OsXlWmJVPITkzJEvR5JzRxH8DDu6UFGyv6EK6chc69HxAsAQIX2la/PAYG7/OgGyuZPnWFcqB6R4bY5Gk8c6aRqkAgBCqUrnQwcuxHtkkIlO7SJhPHmlE75oRkCZLkOZEQ/zDl3qTQklUoOOFWMIO+J1MJ8KA+TvnQuafODrp0GYqREPK99ucmjxQzOk33oDvMuPXMSiKSSH95MQvCbPu2NgrwZYqy9yYgAjl5JehonJcK2aQjurc9ob5QOAYAjGZEcO3o5OyCTSvbbmo+3dnPa9T6+KyDsrh0ZSesiLp2CMo5KfiaSa3SL9QABtzo6k5G+J+n8CSBan4jH/tlIjm/T3uj5HuDpal8yvmXxR8/nRn6jcrFu+hl3NtC4bkyWgIIEVzoZOHglySlbQtUty8ZTIzpt1YkXudiTEeOTf+IUShL1iHhawqOyvEljqzkCHKfZkpExJ/TiMSCWCv/EEhSXUs3cpzKYDfUiQbMQyV5lx0/J8qMMiGSbth9htI3W94aBxkDQ+UdkRAEHL8faZFHJD6en49HlhPZGGSLZgYxoAQdPqVJTqYwn35QoTO/Q5f1rhsx3tnTGuuizx4B4fSpUCvCoS61MBwi40dmejMydKaePCTyZbNfvE8wPxbQ3eroW8PjNjwppXJZw8GKcUzqV4TE8Ca7H6Jaf3n5mLNXXmoxoYO/p8uBMqvwe8FSGtEjbuX0AY8AFiR7VJ1K+hUePAglU8lMItV19NPfcwfBkB52cNSvyzGHgWx0i2XFKEJyvhFJL+xEMt3q7kJHqWXHoXOqTZH0iXHrHwG5PRre8Pgu82v2ICr0Y4L+zeX65ZLJVGWLejmlvlCoIkMsdJAZExDL8dwTKJAMqufY/Y2oQmSNAUWhNhTR1XeyJQ0AcleyyNgJ+tfv5XGvTkQxGA23I5Ozt6cdO5kfEU+HQPhLmmxf0mPdvgPVULzI5IUv472yaYz5Z5XaxCKGP6dIw+CFDpLUHlaEfB+w6gpIUWrlGe/IcCACsyUj0L9p/EEikMjwvxOHTM/vMnJ8xQ5ipFVkGzZ4RfeyoPC+mLtUuv3kwHqxf0i2WhsDlbg5kcoanbN/ZRKs8qgzquzsfgY4hXZ7vAXzWelMZBvHAziN8agaV/EQkN2j3EZ/JkBfvQEYCw86DQHJdIrw90hH3tUcli1wsyVzS1yUcOihwMfWIZKumn2C0bkFjqwWA3RwrMjl3a+aB04kO2VRGwOpsvDRPgg84MbhNBe6NdCMzUrLZjqPyoBwDqq4YTJVbp73RB2Mg8KInFXUSga37gRSqgay/FLL8BLqlXo5ItiIjJaBk9z4gjkq2bxOI+1uXwYdc3jFkfrAgM3Knxx48nu6XRnbY3HT4X0ultqaGwOWeZLWRQZaHYuexIv8yqizgE1eJoqyW1ML/H8BxiRdVVzcZ2LIP5W8bUiCVNvgKBoAujaK+MCS+cCLlPyCQBknrcoFBxf6CT77FnIzM9cl7DxeEpdejoWURGDh8Sa1cdgN+uyyo5Dr5W3L2HM9yKKpDRDGYksO31MZuJHB5gCMV9dJy2OY9KEsjxEtWuzR/cw54uo8sC9RLATaeAkrbSfSoQC13DTIEATK5FRlpT0q3eYHDsB+FRtE5AhRFZmQu+dMS/3sEHiMk+jQutU97kzHAzWGWVHLdHM/KLT50tCrnBaiEP6m192LAdAZZbVQ/DdjgTYb0p2gAwF1qGurNEGbrTIoHFeqZWe8IwmsHWqPqF0AAYEpG9rrUnY/I0JPYdQyEw7qj1NLfhCHEzJQszhZszt+uYSRR9/BCNiK9VlJ7i4HAmd62VNTPzGUbHqoZToSnSB7S5flewHODB5XRIB1Yp5ZVXSV6JDjdjELYy0RqmJwlIDfRmoyMp2UbNwOF7YjqSuvWr2Cz+kiliVyMyVwKpqRs/6P4cakaks5rTzqCbDc0tlwIWM4zo5Ib5Hkp/10ud+TbEOEhkkdSO9fpwPXxZHH2p3Rg7TIoZFSd6+NkJMeEdGL4aAa8vepCRqaapUBpeyLZstUzWNWu3KBAJJtQ0TB3XcaWP2XhhR2IOs/VSXh/byc1//CGIT3QmOywok2Fm/4uuy+0pZLlPJSyqdTReBBwpq8VlUvD7EKsWIp8eXsi3GLyUFg0k1o/Ww/YLPeklA8sAco7UMkdnsBmw0FqFhjCkBBwnwY9STcFD/PfVXn5Ham6+bF4eXFP5+hQMAacoJm5vmQ8OFj/VXybU+9naORkBUqz6I3aue8CvPdaUGK7FDHK9kS4V5RDibHUwXYMcGaIPRUTNN1iQN5Bokcj93sCx930ouXby4DfUXUWoEKF+4sZX9CJqHOZ+BX+h+mWFjmVDBXl5lRMVGP9Z5GZogOVHFiOnG+Joy8ZCQAMUfoSKRlWS4U3HBXuUAEYSaMgAAJLMiDE8jdA0ZFItp70Ap6ntxZTgwQqJqMSpouAYirZcVAIvHeeXoWeZCCAQ7+XPCzvSISnRyFSPmSYUkFIV1kMN3Gp0oVRyW4AgKE0GggOAB3dC8eXzVwEpaITkWy7/B2ePFhTYiOeim7y+2zqAqCsMxF2PT7AbcPpGehTGZXAL4tlQcWdiQwvo1zEBNBlDDVKNUsqHjCqga4CAvg2rQKMBziBjJ7Fh2TTFqJYSWXYHAnGR/dMVtA2ZWAAjNQzJ6FH2aLKqfMBORkdXsNxzVnqabMDsNl9larq7V6ZhMkLlVmFXaji7MkMhLtspN5WU4E9U03JanIVMGlx6W10IsIVADCWury7DbhdNqOihzyKn7wAiSVUnaNlNL59tq9aV4ChEpep6F04oXzqPOBLN6qqt/Uz2K080edvYpIYitMuUtFTYcImzWMVJd2o6sptKfhitpP63poI7Jt4h8xQARN/KzFWdiaTGZgwpce81gAXVpmTwQET5rMPPBXOb1ORmRrR5yC+vWL45HeXij7FB2WT5wLKrkSyRVt/2K6hcUsVGIBzZC6li5WT1JDJbn/H4/2Ng9Td6yYQcOcqFb1UqRi/sMxN3pVKLuYgLwnplgfjgC3j75MdxgPj53MejCrOuqTlo1Q2o8vz04DFMVMyQ/GVHz8HvIpM7uYH+000blNYxpCXf5mKfoUTKibOBiq6U3Wzo/HyNH3OtW2OkgHCWbLDFBZs3HxZYFk3KjlGjqLUWOp3dwFwetFNMoMHxs5XmIJM5mXgMJX6OC8FDi01IUMAxsxGuYosvw/xh+t+etElxBUIsLtHRf/i/fJxswAFlew4NgwB+8+0N+LBAJwho/R31bg5ypSSHlRZ4HUJsiIyqdvrR0CE/wUq+nIZGD2v4jajcnEGD2AiDbg9Btg49g7ZYQwYPQvpfHci2WrmM/hc3Em9/PYCt/aYkBmVEdzomYCKSrY3/IRHW2ncITORIS76KhWGhRNlY2cJ8pKeVLJzPpLfrGiNqhC5nKLrbNjIuWVGfHcyGbUt9zPfCBhtuUoGBzZyJoJZD6p99Pq3eGmxkfpbzQJ2zDEiy+8AGzED4Mjo/hbu/1ykHoHGgMsdMgaW7JWP+hUo60Ul385CjA9d2irBwOEMGaV/qkbOLnespHJxqn25y9cohty4s1QMEHLY8Jn8Y/Qgwu5sEIL8VpLh9YnAtsk3yACE4b+C8T2pqo/2z+G8ksZ9fTYCZ7aQZQFDZZhq+HRARiYfT0WEw55eBH0Cvjy5QMWQgonyETNlL2W9SOUp3ZIExsBtJXNROglDZ6qsQOVi7xiNuNCMXnicBzyuXSYzAH7odCiEXkSyeVt/OKyg8c8PfgE2TL1DyZCpgLI31X5mSyK+GNMpv/fLy4D5eSMyuXiPfNivyrgyKpzAwHN0ym9frmQoKj9LxdDSFdyQGfK7oHJx+JiK7MxE6pRZyqCSnSBzYfn84KnIZb2p5PaP4bCGxgNvzgEOLLhKBqABfB+qp5rLYxB4/UQnBpflwP5V96gYXBlcOXgaX1rWlwijDI7Js+b0+ZvIx8BTjxtUDC+YpBjyq+yuQGXcii9kFbkjWgUABuAY2WFKD2HgVEShD9Vn6r0fwWkrjPUkvZ84AR/cz5IZADdwCsCoDMdZkXh14iwNvDUBWPPLTWoq+lHF2RgZipIzqV/AUeDGETKXEcU75YOnV1irqDoHJgOPudQ5P5shOeUcGaVrOcMp7DmoMB/+GB4HTlLHcpHLUTIXVswZ/gKEURn244Lx5L8LjY3WABfXXSQDUBlOglAygGof/aoYWWErydBmEbDl99tkcbbys8JwqvyxgqpzAA9gRm/02Q5ws7hJxej8yZWGUzhHUGE5OwC+lw9Se9DKI5Q+/IBJUJFhO/ADHm+6Sj2DPgFJISeoGAYo1UDVn+p5tXMeUt5spCHXJgH/TL1Gyi+VETIqF3ugtuWfvXcCp/fcoWJM0Xa5mvtkhtW/r/Daaid1T/vKEBp8nsyldCPXfyKKMYCKHq/gtZbGHQWRy2GygVi5Ug0EKlzuZiL2EV0MrY8AlifO0vAhGQ5U9pvE5ZX//KPIg01mAmvm36BiVGWgvP9k+R0yw+bcJwT70WP93t4FLG7dpGJc3pTKfhOQRIZFx6dwW3GTOqnAIOOPUTFa+VTVZwKAn6nkEymIdDjSY0mZDGW5R6gYCSj6TmBchSEJBhI7kRxKQ6/MBLbMu0TKJJkZT9XZOnxFXOiSdm5u64F9m29RMb5gi1zdfQAVZu0ew3k5jXvFvgZePr1ARskOrvd4AIZUdeX2eIQY254cYAAOkLlAoeg9DlAMJJQFPqb13csY8LM4SRZnAXnvCXIvFZWLbWAysjMyadjtKcDfs66RxVnFG1nv8bwXmWHW0RvOq2h9N3x6Hrhx4QYVk3OnKXuPBcNAqn30imh8vHKRupaXMWQVHCPrlG+VPccCykFUcokKiuJU6lbEMYCRuYxlkPcaX/lJQYVteh7K5AmNb/wBHFxxnooxgKzXOJUFmWHa8yFcN9J4iP3fwKa118nk/I3yXmMhxyCqneq8cLw9SfUL9QI8XS+SUbJP1WMMwFMZ9vEylKQuaG8EMAD7yVygkvUYq0qTDaaSuXJwiKT+r/2B0OdH6UBFj7GV98gMs2EP4bWP3mjElV+AP2dcomKi/Hl5j9HIwWAi7CYF4cVeGg96chg4feomFdNyZii7jwYYleHwvgS5kWupR3gqYzFf9lIxSfVF0W20IJcNIcIGqtquertmgTHIN5JVbkB59zHyB4zKMJ/pC7/zJ9qTm24Hru4n26lOgFDebRSLxBCqveDQQPhvvknDzRYBK/+8QibnrZN1G8lAhr1HHtLe72hf+cEKsLa4REbJcWUXNfKhRJwFBGAgdQEYeOwnc4FQ1nW03ImnwmLtM7wy2Ut9I78yZMUeoANlXUYKz0CFZZ9X8Fl7l0Ze+lUtzztPxVSZX1mXEQxEGEgcTTOR4Hugxzx2Avv2X6ViZvYcZecRgHIYEdYAgEjqkxrKEPj5JBVTuEhZ51GKl5VUWB5/hy/eNO4KMAC7ySo3oLTzCM4Rw6iyQJcn8Fz+oF2v7UXA9uoxKn4BV9p5uCB8I5MvpCDa+US33JsN/L7kEhWzctbIOg2DUDCCVKZT/uCXt4E7d8mYUXKxssMIZZiCCivzEHz7tKHPzPECQ0nlPjIXoKTTcKUJmWzawQfuf9PH2d4ZBQyKkv8o6ThMKMFwKnlvPMJNL9KoSwuBjctOkxkVD0s7DhXAqLASyQmdGBzXA5t3kMlzsxZUth+mKqKTn8ciPWklDfj2EvB9epKKX7n4sg7DFPcxgkg26egFtxU07gYwADvJKjegqMNQIZns345zWBeNoBtXeiNvO+Cp00EqpjNFUYchPDTQGAoeyvJMGnPtV2DRwnNUzMtaWdFuCCcoRlIRl4miUvocxDD/C8C5KxepmFNyW952qNxaGElkmHT3gPs6GveqKGZIzd1P5gIUtR/CfwIVdkvD8eHMjSoXuxBS2H4wD1AZ1pkKlGetpNHX1gAH/j1OZpS5lrRTUzmKSi4vQiVSWqOslgMrN16gYmHmUkXrIXIfbhSVPMgDXjvpxcAQT8DR/RRZ5canl7QdxHmDCtvpX/DmAN3SHSJ5B9l+BihQA1AZNqGlKIjZ0uXdKyDi3V6yjpWr4aEaTYQlFLVdfYy9MEOTBU5T8VvG8orWgxXBGmjqysle8D1BK+gI76PAwbPnqVhQal7RapDKClRYjQnE82102uqXn8wQHrefzADy2wzkKkFl2D4tQNbnPa0CYpdtxEAYQ4QFhNqWR93bB1w5cpjMKLErbj2oMlM5hsgwW+aLF7fOdIvxEmDJmrNULMlYLm8xsPIBxhJhYfgKAetoPPS9DfDAliwLzONzi1oZcnmgMuwcspDy7EjfWQcwcNhOtp8B8loZqsDoZNS2bBgVy5CduJOsE4rVVCoqx1LJu57jg2OtduPPzgWWLT1Bxe+pf1W0MFSYsXEU6NU1sOj5BD4rVkhrs3Jz3QNsO0bm8luZc2mLn7lvqClSfQPRtCyM0pDgPUdSV19aa0ZaGMOboANkBpDb8mclNNTIV9Q6/rrvGwCGQy1EX8JGrzazwGZCcjQo1VTP10D82rSfssc+ogIAE+m5zsvbi4VayALW1wCb2/upWFxoXtjCUO4ijJfoV9e3zaQdViFlAACBY0AV12Lv9d008zPQo3a5OR+Y99cpKv5IXydrNoB7BW1I9ar6thq32exLSRVfTutXoWI8D0D2dEcfUYDTk1LWRq/uAVcsyCq3haw0r/kAsSzyrfIatBi1wfhTUXV8vyuo3h4YJBL0pWRP5hIExkoSV5PldyC7RX8lVBP06lXxbTr8H6P3+QAApt23WgIHgH05NUqfTNCTDEguYkyZ+S9Zx+fmNB8ge8WP1cyj8dDVt17niH21f7+qGguIvDKpnuYy9KU1Z8L534G1a45R8Vfyn+VN+6vcMGPAymvPsyBq2n0pBEEkxN+d2Ugs1LQ2stsMrNlH5rK0zKe4qdpghQwAwNP6AoDWIJJqsbB5TeObnmTwtzeA94uDVCwCsppp+J5v7QgCgBzHv9qJhZpmgY1ksprm/Sqh7Ss/1r5Q5PVPZ3EAruZAXo5AgOtusjibd6+gqZra+qna8a08YGvvKgH4+0y8NAeY9cdxKpanby9vXAXdEipf7zOsEoC/Vxv5XQGO3z5BlkGZIpu+I4tvwucTI6TfE/Qk/RUlDCkF28kqNyCzaV8xuigg4uKEuuL4VhUZI3T5lCzl0rOooQ/AMbemNxQLYnk9sGvbASpWJfxV1kgDL4Cg1V4ATjGd30wtaArUCeZrgKU7T1DxR/nr/Eb9FBAAxumsIADIsl/WWmOOCvUBbB8dpGIJkN6kp1whcwwFIOi2UOC+unPVvym2gZQR8nD2t2TS9Titla0Ovjt5AGXeFwNfA+Hvt0uJWJF9Pb+REc/jpXoa9aYZpQDgeZ0W8qJ5TFl0UFJfX0rB6vRDpT85gU85KjXQLGOjuZZZOi8ICIo4W6VUrjHLwKc3muGtdBGV5Pqa8rXZUsd8nRYYAKhCz42rIy70asbvQFpjiaT3aNF3lKwqtFnuWarLAgQBAL7dmNpALNSAP5UJGY30qpYxWoWO6/1kADjdFTgGIMl4bhOxUF3Wxf1dql459Q/fEzTz6L7thVIjCIAux7cM6yWtxJVotVguC875qZqPHkTT7LcvkP0AQr7ryg5ioRo5CkhpVP36XrSdHnQsGFUSmC7HtxKff7uLS+VqoCkOaiiMPP8VgKDrgvz5zn5V4psW1qafz9O8Y2smaCY44Ua8OIHptqB6f2hwFaGKS/q5Is137KUQ6k+/n6oT0a3mzwyCz4zRFwtq/gJSfqJItVJ9UQKbZ5X9IwiIuja5via+1ZOqSa4J1Qm/zZc6Fei4IL5pE4xmab6e7mr51zSNTCq0XeFVqtP5ARAL6ZZLGq/+trpYs+OgFjpt8JcD4AQGHc8QkeVxGZqvpUssaIJhjx2vVOL8oMMCDwCJNTVqlMD2f2C6LqhbUo2oeX4YfCJUtxMYBCRpDBhIR1+I0umdEBJrCkkCm3QzAYDAM12F/knFCexX4zRx+P3hoEtgjRdY5+igwCOx+vkdPPy2+N25UNcEruaQJ7BVD8t0JYExgeMhIEHDUwWd/w1Q1HoCYzzHV5Hja4opYD13vuZqLz8wXjxdRZjZ3ycEWUJdiS41LfuS/gc+smrmBx7gahAaeHFZXRJ4fYlmB7FS8SW5jqRmTRawISfDUB2hAkgVqnl7cwCAnICTM9uJZl/fYDWYcqVEJ5so/EpHX4quVgITqn97J7vvGddUXEDo66lr8gucHIckEokOC3Um3/peAmNqqnV7q6KsNgyuL5pule2MVKqfBqQvlehuk4qEBjNM0qsZfoUqvyv/fOfP3qKV0Nf6xEkq0b+8a2RDSQ3bsxSwhTZVEhiXB2RXiG5vBgD5L87P7Sh+tF/dz5el1UbXwm/LZS5FAAQZkF8pltK9D05uIb69q/M77S/hiwTtVj8qreIlxNpvGdGwyu39/7ddvFAwBQzg2O3+9bS88f4/mrSunqEKALBMoi+6vf9nmp7klzM7gd0HN+mJUs//DfqSu88vAKuvu+np/T/xDBCYgJKfJNL/JU6ViuRv9XUd+OMP+8Ki7i7rSvlTAFZQOCCWFAAAMFIAnQEqngBAAT5hKpJFpCKhlFo+aEAGBLO3fWUcELnxAmAg4yaj5rpPXdt0R7AN8BNAP5nggGxV0xDpSEfKXxduY456iP0N0Snqp/onoR88L0Zf5jfEN5E/t3nYasR5h/qvn18Df0Pib5dflUptw2zUfkzHxyTeXGoR7W80P5vtVNT/1foHew32DvstVbw77AH8o/rf/P9aO+S+uf8/2AP5Z/bf+/7MX+N/8fM3+ef6T2Bf5T/Yf+r62vsu9CD9jQR3xTY/zv40q1sprTN3v1APBPy5LD3trPIx5hWAfg8QgBv/mb6FaLrUKh38nSnblmQp3QWZomc120PPqjCpJUmwgRrK5+n9X6SIDL69A/RlbQwaAYBtBY0ewFnbP49/2689BCgCG+pyUm4+k57a2+W+m1OSu2BzG85BG7Sr7Sl6G+7xXigHZqkC+ic+SrIqKJ74Pnr+nftU047ybTjnfgFpxeoSW6yVYPp804WV+D8jTuLIEOV68EM05F3o2wZKnGhkMELmuXl3VYc0nsI2o1oH8C2LE14ahTDbBJmxVWYPVL723YWpLLiKqNDB6r+42YCw+SYYnCycZOBKkVa4OnLSwBREDE8GjPs0R6HgLMJdbetchn+ND9NFr+euLpJYXP8CLBp3z6G9MZUPAVFnjLPWbFHGS4yA+jOJpntykTW4Gmib68XHJ7J8U/iX2MgMjoL4b4fA1vck5RVH0G6s9BjyT8xH9PgZDZjkgVz2IR6ACM7Om1122+2XwacbINb8uDo0F4zXLrTIb4pRlYkCtf+e6qMHpgHeJZRqCPt1oxBKlbUgvlzkX2WRoCW8AO2Vog49O39l/prVD+AYBUmJ7UQJPAbfGHAa84x1+G4cA3ijpwX/Bi1Sj5jgAP09ND1leSlSYC5n6lF73elBN5lEBJ5rlvBzqsgRJvrkozL6pEai5KPq6vslIzxNk4mOFYeErksyX/DfpRrMwDZCt/1HUuhqp4JP+JHNgDXeznfyYCERe2CbcAKrFY6ayxjxZPD+PRQC/PrHF4hRM766CVQnsvbXBLjkER3WWzww7gYo85CRPnsH0re2bmQmeVRS4G9HI0S0xz+AyPaFdwzW1hC/RC9wNnqxjquI9G0WUlfGPyvCnhhoaBN3WLl7JbHoG3lfS5ayGyN7Indo73C4J09k/nuQRePL5fBgCTJsVrz0BWPNn7nOsh0iIrsdIy8wx/5TLkzLAoSb/EMzq/BzZX3Azr30yhDdKKsa8gRaWZxaQZ3oH0O0vmNSY1HGeq1+MF/9CsRc00gfzzRxxB9Dsb6GCKUJJKUQUvw9ZyKj87dvBeY+l5NQE5CRQ/hMoau9swvlEd2o7sBr1iWXdRhyDAsuLqopa7mmEJ++/NfVV358kHfXshPWrgPvPysk/+NR+gqEj9aZH5YbKuEvAGoc2Ky04OQFwLHroP7aIgwEnRveVV8cM7tePTLYu4g9x+uxtOrNty+KGai0os9JDv+r3/Xr/OXBxDdGmvcozCElGYu9ObzRJG8/IweqSTXvbHCJL9yGZFfH/45DMBT8NRj2vTB5Xz2nA9ytibNZ+JhHCt1ztjWSB6IoPdvOihXZMkF2rnMjwF99yg3UUGd6yn6fcH7xyPSSFrr+Wi3BhWitn+tyZjuT9G+O7Ns8LGGgytgqQeYLY0KLH/9RTo4ogtCJLTLYvxbH44unIr7IcKNuwKzgGTiHQ6/vSt+XB33WvsWnf1CSkBs8HTcbet4+tQlbbu9xcO9SzAkQv5DDzOn1Mih+qCe/T9qX2wkIi7zn+UV7pNrsTquj4u879Dl4U5gFTQNTLBWff7ptnmJcD/pvLvDE/bTBt9uwb4yDP16O1wcirTxzUNv74XSOoADD5Z7WuzKHOXhfcGqN/SZTLqLeJCKf77l6kTbrb7YYyu6hAdP2EjLacdJHcaUVQ6MiAXSLtPK9JJfjIykqMnRTgcKu8Y4uaQAWq8ErsSO481mjmhPHs/XI7HrL4sXq3gqK/j5OgIEEpWzFOk3Ik2kKeiNPxwz4hzERu3cW15hsIQUtNn1NLQO//ftrCXNOCYIIt/Wvs215SDlRqzAAa1EAxpjwSiipO7mRlshKURcjaQqZbMZskCMLPaBMgR2e+mSgDYmw+McZ3TsoxTz8rVbs2pX9Yi4ycaJt0ijeG5/GqyX8zqwPjY0PnsTvqEXSFl4+77/yRHOAM1vczq7kEkfXnrURIVYH+tSoeIKnQtDF/IEaZPyW0CR1olxCk7lrXwy4zF8disJwKLIVu97Vu4fESL93IyVr6gDjMdJ3Hj5dyR0sLgYVCkVntQg+0cKWNR5Ce45VoRE8ni+T4QWv6qguYGur7/bjQeE/KWZludxsAgV/hCEcUKcWNcx8XiAYJCRelSF9FcfX1pINfbb7xLRhhdArdJOCtvuJlTyg1h5MKELVO/0lJaESp94RlRxdRmGyPb7zwz6xGqw9ZZWdzXoxOxDObT3210gVVxpCKP7aYWg2AWPZB9b46SmT+8co3WhLkqoj1jhcigyNg9cysxmBE4kPyr0QbD2wOunyrxILX/tmz+Y26BuOEgH7A3QjDQNxX0yT7C/TdF2WmQBqon4VE8LDxXM/nMTVxdkQI7Fv+9lA3fuYjt2blZZCcEdxq3AET6VfMuMJmDr1lrE6E+3gYsrGoyvqFNfVqThJ+QIY47WHhHkBDnjkJhI8mj8sfarGh2t6TNaN4OVw+JfGWzyI1D2byCTtPoS1xEgIuam0N/Vi9LS5W6uG7YmHN7fClAFtIgjDm9vhZLMRnw1DuIFK4aK0m17eY9yRNm4scJK5JSWRGOkUs0D7XQAd6tUEKh/diy/gEIF3hiRLIZFAmMeor843f/6Uiu134Zx6y0xAT0hpaXSnWYy9VXPxfnClRP1ojdOaMfepz7N22IUvtZ8Bn0BxFdWbpNEYQeTznB9UycofEFtIQrdIePwo500ql8ljqdNJ2uHr/YO+GDnv/NwlsmZSLzv8MEIL+/EazJwYTyukyDK9M7uaFyP+qoBjkuu7vaI6vnQEoxIxwonJ4h1Q6/uQ2opwWXA4hGockFO/llIx7rCu7l7rjsEWrk7cdUDLn6FzuA3mzQ7GG04bpluJ5XfwQBLxNyyjVcNmshkaCSnu6FL0765k3eF0FlGGh7AAcWTgD7f3+Gu3dHLio9jxNW9daHzAU9ZDYX9R0Jv3/mNq5kTtC6UV8YH+ZoDHIaFz0Aw/eD+TWMjFZuaa7YTczZxbW4IQgjNk0z4C4XanI68OyJOglgyEUdKNMi0Ks/l7kcRvgZMOyQkZHuhqeRiHUYsjUoSF79UeyhScAn2P/2VCMX+m9OGhUEX90W2WeU/5vx5ExGXkn1e/d4AP7LyercGaOUdVV90jnLOXT9sqQ8v2uIhF41XUyw2qdN7ReotXvDE6Bn+/Ozf/4dc1GOy1vYGT4/KM2ipRqVIkXQzrYcF+E4Fw+azTocgjrQISNdpjIaHFJfV2+svRBxAb8A2AcVkFDdQpeHNFMEq7Dpxsr1Y39ho9RGXqFMZeQrBWgD2okMzTArPUiunER5HeMigs+DjUfFeXiXEY4Msrw0HmfQfiP/9+KHlCGUAwQ2oMMpVhjaMs7OzvctSXgt1tIY0le0xDwqI0+h8Yddmwvk6nyJ3Uoy9wnMPxTVVSKBgfv1q3WP5wSSu7CPL8Lby4gO9PgM6FaHcgTiqEJydT003Utv8/0nQvGPtG/6IyDrnc6JlHjQXDJgMU+vESbOuxIIjM6rxikBR7EWo0P8z0+XHgCpyrSy8obB7p2qPrnMp0HlYNreP8r40UaqMm9xMYzaYcmoCj3vHYXU82G351vRO3SPfGltYdfWEyz6YYz811j0vhcx8rxvTPJuJss1JTwR1/ssePzUGxfer9H0tg+OY69BaJpwEL+eHFuEGTgeKZRF6yGyulo5tdvDq/XzYupHNAW/ldaq/Ko03NFNg8nWIdoaQWunu4JZynRofOU09lEiMF2rg5qk8nxZ9sfU3CzyOTZo0UdqTD6MqRL+VgUQaZ6Miu5t7O1bAiKerSGEDVX08B6BQCUlzvmqd8vrCAbQF6w9qzsS4GXOdVYt9MHxiMafUrcXB2Z+1y4i1f9q/8JUTVZBeuHhUeVjfMyGBwBjwKzrUoQCwFAYZY1ry+CM55/mQ1H0uGJIF/qUg7k+29szHowEBrrIan5ZFd0HTcrktHelqfp5xMiRqi+2455vKHdhN5TqMFzynMvHvQ5ToKlrRE4L6aGu5S9/DYyLh1kjcbxymdCsNoQc+whA4xo7XUA30eZ74PHv1jEOleS4JeMghmXaNxePxTmKhXKofaRh9uA/kuWuiX7hXb0ITcdJbFEyiHCwaFqGtoIjWjPgv962GryMMiRQpUSI0p6IFRH5+S7Fs9nz7prNQJ2snfC/qgvu2wFeBePBtSzJEBplE9cZJkq2LBwvUY/0fg/z/YSNmW9zUonI2P5NU9wmuHFOcJbEKxrkXAI5+DbyyUv14yXO2gGMiSkvDMDYsYPM/9vH2BJqPfR9TRTsYdm1lix6QItsDbt2V+X8mCbP7go2V6Ofgzh1wAytTHGJuhZEPnAC3PRpIHqnKCsM7/PU4nLZtwVQECXEldYpViiBBuzKRWFQCdt5piWD3WONIKQXYbbRG6tITW5xLnQnRTaEkWNnZm+A326AZ9HCD6J+20Fl6OvQW7QrY/HJhhYU5tVWpL6Ri3YhhXlzZAtiFfyT/8XLU9Fd9+bJofy3k5CC1cfWGbD1GgoGvqr8j73EiNHojrpUlSw7ZK1YpnWVPnXuM6CX+0Fx9ZSSXKaC8FrVaGBVyBkHp8eIZe74j6b5AqBjlo/2HZ27z+g7hMzpFbR+wdwTRCzLi4budIp3rpVgZmTmh6rFD6/vzVJkiR0FL2zcRaF6ubHwAl6UDq/k1iA6rsuYI20kYZMyB3B+W740q0Z/bSvxcGz8KkoW3sOhH2k+Teww2QTA03vWbYuyxgRBwf+SuwUYwnIIIRha428gj+cDuXqIPoICZMrTl6JZIvC11QnTBbQXfNHyNA4KYYxif9BK2sc4nqB/XDiANddiGcpMJkQIXzRAmpNYNnZqW/XkJxcfx/ibnxc3sb1DFvY9HsMm1S2KvDPKYTfrN6+u2r3Kj1RwtO6Iq9MutIducmP+Wd65B0GeBT+AbcPaeN9V4rFDKSkZBf2e1sBKhqm78fUvGRz0LUS9pOsLH70k1LAJkHXIjtKPjkRZQlO9f0Io8h2nDJSdSuDw7Qimw8Ssmk6BRV0BYUEiS/wd17bzrkHSDNrLrMCNp1xl2HKerELUKCVNKwgeK7MhvwCKONLhskT0No59rTJFC5CQjtRofRxbSoVAdFUcLpmka2L5IlOns41oA8gkSHCtzQv8kY8TBCmzIRmItNKVTR9vNNqDluYwW/8Vi/8cgjPg9BEE+qUwJ3Xg3aKbCkKw8nuXgv2Ayqg06Bc1E/pGHbeqWosL+gMEqN7ZYvJFKR/3IXakE+SswOvQESvDr1p+rRHrzJtLh3Nyd8wpmsnF9a+QyM1UfKT76oBlxQ2E+7zzo5P5YnegRCFZwUPU000L54SBrWWNooczemsZmFHwQPJnJuappFSB/tURpWG9swCwpL42y31RVdJB6nMtukleGU5HpcqtGQMhOU91RWnQhc7+Ccq5l2bBn2l0EinJR4EVNie43RmyFGHgEUfx35MJmiiRIiT2fduVk0XAnc2bh6KPngS4U42nm+/t05mIQfqM9Wa8uBlGB1xG1y87GA48Co1N0r+zwyWxdb1M6c9bNMwJLXM6z5juNSpdiMBrvbTfLjoLbGRsfrucazL44uljl59Lv4pta1E9utHN0pxW5ulkBd1TNRLonhDKVSP/sygeddqohDhHld5FQ5JTLdEZEEJCaLK4eL1Kqynl+YMRvBj+UDqpBjQGggZc/Z7D8KV8ubJ+sqDzV54oVrm5l6j5kuFos3HTNGU0mBgvdpFMztda2b2AbV0aaBufsui8LeBAOVdKIgJtEFvs2VdDsrUu/qpuYV0haZO72sW8XNELWwTXuxLYWfORMoQTKTZL+UUcSHtuMc4jXt7yrugNfQfq4SM20qIFWC+DGfuo+WxNmfOXpKuRoZ55n6dFGkm/GRH/9XdU5P0Ue4YnPmkKshJtV/hCcB61BBwIAqTajdDyTGiUs2z7dTZikiGsnHhFxK/0UYNizQBAuji9X0wml8PR70Ay/7YoxZUvMYnL7TnQfFt6vaaZzpNU/ntPNMnfC2FdSrz9DEnmyXs8/45Ab1I7wdAdLz8v9M7xKL1DXD3JR4Et0Er2hlco7PxokiLPfELlKsKneG5ebbdA0yn9lPcWFLHhjQlm1LPWWTz0pc378FRKxS6/B+aJvmnN31e5WZU/splsq8708nHbqH9rEV6s9Gap7ROKRKnmxB9Vq0EwaNrJnW8VaY82huJpxJrFkrIdctauQP6ScfvDTiRE3E2FecKse/AZN6WYPwAYabdklKJCm0UL/CVLTpzdCOb3nnjaI4uJHTVr4f28SSr5XGFPLBXls/aMdz/+INf7MghQ3dSpBu60wZ0Da0oHQnZnx88YsDT7o/g7UqbELYwIYJIZGHogskeWCMOSelj3AblJkPpwezZePTdUMMEbCwEEhOOkZx3RB0JYRiqbmHUTbR6wgKag6zZms5N/SlGPorvzdvjzhmFGKlkx09MpLlTRuvEuDeCj/qSCLQLPORcV3gIhQz3Hh6xWQ36ACtHDjAs1uCdB4gAYKueEgb7oMx0Se8f3ZZc3Yw318jSQT+UWBOsuJ6i4v+WCxbNWNRA2Mf5GItkjILHQRRAvovyX/Q9h23fFIrf3nVj794Bh0CabO6FnXYkp+6Ztjfrf4EeIz8AkuYARkBcVSG/WXy5JG8jIho3hv6UWuCz1netO+c9/uAGh/Xmpv2qpWxa3JzMKD1WjYAMfP9TUngDB7CuJYkHAM6wvWOIZ9MhYeqGUf7Huoy2NvQWn81IpybITajo/gxiyX80cpER0jvUWkpXniHtaEQNDAHWQftoaQAAAA=',
  },
  {
    fileName: '스피드랙_1200x400x1950_2단1행거_W_Wood_사시도.webp',
    brand: 'SPEEDRACK',
    type: 'garment',
    width: 1200,
    depth: 400,
    height: 1950,
    tier: 2,
    color: 'white',
    boardColor: 'wood',
    hanger: true,
    url: 'data:image/webp;base64,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',
  },
  {
    fileName: '스피드랙_1200x600x1800_3단_B_Wood_사시도.webp',
    brand: 'SPEEDRACK',
    type: 'shelf',
    width: 1200,
    depth: 600,
    height: 1800,
    tier: 3,
    color: 'black',
    boardColor: 'wood',
    url: 'data:image/webp;base64,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',
  },
  {
    fileName: '스피드랙_1200x600x1800_3단_W_Wood_사시도.webp',
    brand: 'SPEEDRACK',
    type: 'shelf',
    width: 1200,
    depth: 600,
    height: 1800,
    tier: 3,
    color: 'white',
    boardColor: 'wood',
    url: 'data:image/webp;base64,UklGRuA6AABXRUJQVlA4WAoAAAAQAAAAvgAAPwEAQUxQSHAhAAABDMVt2zjS/munXL9vREwAuxsDaml90/8ba9pb32GAo8S0w/M5jDEqi5u3FrXaGK4//v9XKfH/7wwD6r7cbgO7WxCbsruwe3HX7u5uDJBuG3XF7u5aa3VVVBRJKYHpOOc875fXxGHm+Rzm74iQRdtK2Eona7lGRJrGiMTkmc4v3Grblidf5NCyAIvCEBmAMp7gTvTnw92tYgMOrTvddw0QEYzctg3DQ4AE7o5rtidwtDaZzMVF7mra5C7Su/N1laadhi85ciul8NPV8NFtq7hZ7Y+LxR7KOEfdGBwrmfTefF25sfegyavCj1x/kVHCQ3IrTrkSu3iIV+Vy1rsotzDnDI6VyzdVm/oPmb4u5sTdN7laSG5EFASREJMlEVabNu3W7hUj2rmXL81cGTxW37o38x86Y33MybsppR0rUeB53uJwodRDyPMCsTb36fbeVaPaV6vg0ObM36SUryL/rlrzzsNnbog7de9tno7KsQIA2GVOl373wJqx3jW+cmRz8u+rt+gyYvamhNMP3uVTPFaUzekzHyStH+9bq6KDmVsQ/vetW/ffF+jpHStW5njrDmnMfnh4Y6B/na+tW4y1OULpWDmgOT7n8dEtf3Wu+y1zc3m8UbD5WJUJc0Lu02NBk7rW/46duWAIKJMbIaKkOTHv+YntU7o3/L40czIaLJGgzJoTpMyRgn9PBU/v1fhHiRGDgrkVEjgRcyh8eXbXzD5Nf5LRMLdcAudhTuI4FL06FzanX/Nf7DO3TALnZa74zcXIeQNa/CqXDkNlMklEnjcZcT6fUpo5xdvL0QsCPH+XMGfhVpaBhwAAElWdnTnlu6txi4e0quRmXQ26Pp1nhl1O1VrtpbnzkjJA8tVH/eH6/qgFg5qvKdinqG8+fm7uHQO3nnpVAgAAzPvoDM3lrNbsRxN5OVfri7dfvUasOfykAKWcx07LnFEoWAoFmnKmf8ks+qBV1e+b9F+UeCeLd3ZVRRxfDJiRul6SrFqxbrcZ4Vc+OLHOKGD8UsOnkhYSWJqzOgWsXHo5d58J206/Vjijzihg6ur8TUaJxLaqVrsk+81r5NojT51MZxQwaQn+hQQ2V5U8j39oOnDx7nvZzmKEEjBxEXg0twubO2OPWZFXP+qsg4syGs8IEDFxAWBoYRf2dcbqvn9tP/NGCRAARDSPA6RMRGG8IFonfy0vOqRoaRc0OmPl1jcBgHJnJITN0ZLaWaJIe3BFhAlNIprZBZ3OuFepgNFwacH++zkirapGkdKQWPrR4gtTbh3eOW+EX8NfK3C/G/X4ayFKpMSJjrrK97fcjdTB681zrfV7zoq6lqa3HqFsrEoAEHu7k9SJCQC6zy+v7N00fVC72t+7SH3fRsV+JdPmA2jBFk7OJbc5j9xRO13LW3XG8jX8Ju44m6KSHKEIod2dAECV8eRs7Oo/e3q4fy054yi3nHWWc3X1vQ2TFxqzSjyZc+xwOjSXwjjXUjqjS6U2Y9Yfff6l9GGWFACqbBCbT0yxKPVe8q5Fozs3+d08qyl9bSR9jefC1RWeYsLywk1G9skBAAQmbBuhfmwesHTfg88SnVEgKkCZT3jJGQ4AhrzX1w8GzR7iXe8n0+5LzQCWPnkqiQgELsQTsGf/govIDtnJye0Zob5p0GtO9PVPeomBzmrTZD2/kLh+Sj+vGt9y0ker1KkN26infyZMmAceLdknVQ/gk9/WUpE6BSTmyyvU6DRpj8ibzapORS4b3615lf9JdicbjpadNCxuUDJ5LmBgLz67+DkUoRGcK50RqhoAAI/t6U4cLerz08UJi0uOKloxxoXbpgIhwnrrxL6qbq4db/8NvI+5aUt3ok49IR/jF2tj0YI5UbfTiCplMyens5NdtrYForir1lPyLAEwbi6K4ME8c9A9Fu/9ttHC9/Qs4Hq7lxx7Gqrj9YFzALAXH+97E4WzgjlXOnhlPQKyj/7LyZjTWFlX9ddcIVfRmjlHnn2B/k0YLZpYqTgADYVgjFtctEnvycmZD5cCeFCjw7kI4PnKDGgaEBFj5uIhPJizt+tBpE2kJu6yrT0QJScAGDMLuhdezDnS5Diy+2+npnJuAXDL7xrQtGSS5o+ZQE5r5hwPfwf1kXBaGc/810DetTNg3ETTSv/HfOVJbRvm7AdAQI2mlipHgEbiWYyer4tEK/YqYXeRf2wXLXyOrAPuThwATSMAo2aiEF7sk0qJSOu4lZpKsC8QXT4CGhMlGTUDAHvxyYmPULIhlFbie2mFKel+AzQtirw142cKhcq2zDmoNoBXhVFTUWQAX56dApoa+guj55dsNrBPDuQWQKugptLMUuVQOEZeY8Qs3HUA8Z66sUjtGURL7J84B7jcrweMmwAYPh0GsDeU7H8JBRN20kq6hHcF4r7dAjQzPBJGTAN49uK/L+VAe49axvfaBuDBQCHiUVRfO2aW+qyinUMMlyKo4aH7AijSjgHN+bkYPlsX5gCG9o09hoyVO2mJW1iq7AOakRIMm4p8sM8k1T6EzG7baNE5/A/gRLuuMAYwZArgABxf9xLKeGqZLjF9gMRfdgEe6gjj8KlisbIDY1xpi31v7QD+GXUNNJ6K+voRsxRbDO3Yc+YFiu6H0aKlqAe0xUeAlkI0hkzFLQfI7K0Ugw/0QkUPnQEg4p6wawEYPBkGtGcvHnEHxUtCaSVdtwcASfU7IRACJgI8e3FSugqGLHoqCSb2VRWKV/EfhmHTNBcVHdmLBQ0MiKB2mfQoEng69V6gaccPnaYPAfvRfo9XAj4OozbeNEsDIUJBuQg8SLyOQROR5wDiI21OI2/4Dlq0yioEMWSt5nLpAWaADsw5mpQGzQVq4m5bewAJlftAxFP8YoIoVD7MxXsBEHrirvtGAofqHgLjtoXtDEOmqYIMHdmHissuICdyF62M9+O9wMsFl4DW+mHElLnuAJn97nuR4RtENdIlOAC0ImkY8Cf08GY/XC54CmUwNXGb9PeA4s1WcnLOE0D/CQDPXrwPgEBP3H2DPxD1bSeE5FrrbokDJumuKX3Z8/wjlGnUkq5JgcDRJidAaf+lvnHQJH2wA2T2VIvCB39qoWLHF8nA6/UXgDb8CvQLxGf4MOdYv2somhnCudK9SAV4ES36/gGAvfjQ00LoX1ETt/vvIZB3IwoAE0St8neA4VIAj0ha9FjnDYSWFyLtFduF/hPV2/W+7MU99uHTVGqxVte/JwMnPM+A0rGkkdA/EFccQJzUNBmf+22jRYe3l4B34YJ24gH0GQ89/JhnjkWlQH0kirLKnnAMQO+xgODPPFkHiMA6aobunQM+Jg0Vgfqbys7MSQi7g4Jj1MQ9N3QEgt16QMSncKTQd4JhB/zYh4pV4vCpYxA1leOzgTPtz4HirfYjpkwO/NmLJz+AYkMYLXH79HtAWhKxrIj/oOcYEHRiH2upjeCVEZRVdgFtARNEq+7Cfrj8nAetktpw6XthD/Bye1+4LoUc0jNQs1PHXmV3/Sh87LmNmsomb2BnuQHAL7+1YBJfRCf2d3U6X0DhhGBqgfrpRcCFThdA46MLRPfR0L9hr3LoajZ0901iSoN07ksg6+IRoAPJQ/dRQA578R4AIqJo0dJSZUc4BqDbWMMdXTf2oeK4I8hcGczJ6dDpyHbg/ryucF1qLpLuY43bCXuVg/UOIrvbNlr0DOoEBP8vA3TObyD2GIksdGWeSd70Aup4auKu51YCV3oJEV9jELqMBHEAdluII2nRtjgNyPvnQPjOgGBGp+7Ofrg89QxF98Jp4WGpsk0AuozVhegdQKVKlOVzRJQyCUuBSyM6wLhT8Tqx60icRzf24tG3UbI0lFbSK7gHsOuHCOhS1JJ0GQ492Gf2ZalhzKEm7nJ5E3AjQIj4CWfgPwwQerAfLo1KGBBFizbaAqD4w17Ip79vAHQaabyv7Mk+VGwVg7Sh22mJW1mqbAF8IZoJQnfmHG5/CgUjdtJKuodOBo51WgOabnmDxM7DkAn2mcNH06C9SE3cM6I/EF5pS6DsA7+hIA5AIgBCT9zlejBwZ4wQ6SSmwHcoDOre7MebRaeRExpKS9xa1ALqL7vA2A+A7wj9Lj17lX01diPLL4gaOh4AIqCz8QMxZc6iJ/PM0aVPoAqNoDZcbh0J7Gu2CjS9PnsSvyHQo1fZChV7xQ4FomvtArpr58J7MCD0Zj9cPnoLxXtqdL4bAzyYdiY0RAmfofwjZR/2w2X1cKT5UhN7AYBB2AZ0AuA9lA8C++RowDWUzN5FbYqg8AtgLMoA3ZXJxCcAGQ7A/ldFMLyllum9rh8QXU2I9MltTLwDQNDHAYZLI3hEU1PZPRZIaLgP6GGIR/sAGDX92Iu7JiD9z53UZjgeHwAeLz0Hmq4AOgzRhxn6sr8p5XEU+QO306JlFgiBajKfMwzCGfRlnjmS8BaaY9TEHVJTQZT/rQjjgkWk40DoHYAEAISeuO+abkDIzx1Av8L2aD8AEPqxH+13XEH+oXBqKgcmAvs8DoFxT+Eu2g3in6j6s0Xm6rLPPRaZHYNklMT+L04B/245Fu4bAO0C+CCwSmQSfzieNPshVFtDODfTbsioXaRGQA+iJe0GIMMMC3sSu/pLkwtKPXhl8u+W38dVLrPzyv75QyD3Rg8wILsXadcfBBQzpdn7qWmfWaHnXn2B1aZ4GD6mUTmLE9nc/LarrOoEBH29DkT6K0aiTX/wmgGcnLK9H5v0nhl69j8Je0RqtRPyIXmh3y8SzW+byuEZwKH2wrgXyUGbQYYIvQma9naZ7dm4PhYReAEAUHQ3eEQDN6t1X1xkpV5bvrsGvIkhjgHm5DRM2G+vca8Zu86Ubs/mddpEABDeH5nr/aNE89ugsgHoo/+XtOkHvRn77IWceUnDHgDY0PwFN7cNqWvxHVzMzW9p6OZZIPVABxgPzvQgbfoCwkBObpu96SZ7hZTs2dz8BACMbw7Oav+9dfO7cv3W+AObKwoGaNajVX/hmWqwvLyUvR8a9ZwefPoFLXv0mj//2uYBNWUWzd83eQGQ7H8CNL1hROv+QhB62WWPOMKqhbxl8+tf7p3a+geuRdZT4OPxfQKIVx9kYnbXGSZ7BZRW5WLe/Lnn9wAAkOVHCvnEBhYliCYACXt2trPjND8RAfX1cxZhpjm6YcfQbA949oFotz2Ha34BAIhaeW51z6oS0Q0jFcMJePQGQdnd1E9jApt/JRHdUKcvQDzLLsRqWEX6qWVdK0k0P21Ez150EofuhQAAxaOIsU0qSDQ/NXHOVNGzZ5kGAGAd3SDt+GL/XyWanwbD83ugBTsc1Z8X39s1smE5iSDTXkPCa9KyrGJfkCm+/3u+z8/2N7+c6w+Iloi8QAA4leZ/vL1dOsi0NSkUWnYxIQCAYCpyNs3PpyTN7vCDRPOXzshPXUiLhTAgvMeO+yrHLUq/ZN7YOqiWTKL5pVVKZqBZCPQINu1GlX5B91SAY53A0JJpeLV3WpvvrJrfRWbFIKIQmpsJk1eQcVZFSomPcTrN//nyxv41OOvmN4sBofkuM5wrZ7pGknE2fIzTaX7di92TPC0XBS3vOkx1S2i+0wqO46SK+m69K/Uxzqf5s86v6eXOcdyQT63QNMgSqUUsrYoqm4ts/hhnEN1onsaPXa6JJU1CpKBY5DSiG4BvFmzCak7aqRYR81EghG+6Qyqxo6hSny13FE6oCAR80+3QYq7UHQF7PsZU5HQ+hsDYZAwgDpO6oUHzY5wFfsJV7SjL+zEsipwAjbuQSIy0vJ1Es6j3Zqmisk5nFFtDv+h2mS8iMDTuBMAqw6qoDEfzgolGnYhSNdoSRkW/99p0W00IAFEgZecyRCBWScPOwk7BCoZFiSBAWTiBiShYhYyA4vXR0+aMH+5jjCXMiirI4nQl4MmbqzT7IGFZV/X61OaxbX535QbCSMb5QYApYTxJG98xAumjNnNVem26VWL/x7Csq045HTS+XSWZ5aysfDP0mOYHGMYwxpU70OEYvgwLsZio/q0nhSKeQGmkVVcEAEDz9tz2wA6VrWbCzXdvZG5clIk5/sI1DXv2J3+A7kI052btRnpulCqykWIDtbradxd2/NmxqlyyrlXCRZjxI1EYy5wYACJiOVdJN/KbPUUEEAiFurrUi8ETfdxdpV8QV8q3jTQx1QfFzJFzCcuPIzfK6vnR0opisc1FdtXVf7i8a7JfNTdb6kpjkZnoAzgAu2vH4bP1E4w2FG0otci+umlXwqb61yhnS12biDYxy4co1eOYZw6t+AeaEKvHoGwr6iFdJCoB5ReQUuoaPl2LmNa5Rnlb6trJDF8hWBjPnFgLcYzl3ttfRIjOhIpY1+XTb0TO6FKrgi11qTDdGw/Anvh/XkOZalKxOyr4tfuGG8UWNYwWdTNvRs/qXucr6bp0G4toMdEbAnPkXHytEGRYr/tvf9EUMwQfZ/es+z9b6lJlIyD09QYM7JMjwy9BMTuMc6URm7lx/hAAAZdLr8uAicq7uurewjXNH8yJeF5MjCmUHrx3la0ADxCoq5lOA8bfdmpKB9TuSKIRyDyzRsWLAii988I1jP+nrcK5cIz5S3lQqNkBJQ7A7p5RyJi4izKayuwZB2hqdwAcgH1eR1A4YAdFPj8NYwF17Q5EpQ5kH+nuS4HueDQlcZhwyqScEEPNDkKI8CdzogEQxNHjs7/9RZjxvjuqt8NDsCd+2znkJ0XS4/3xySh/6p/ra7SHgAnMxYk1o5DjHcTJy1jmD0BVsx1gYJ8cWnAPmq2mhKqKqjInY00giLpme+G6hj0xhEAwxtJilWgAROF5LL0Z7wKF6m1JDCazj3TffYQ6j5JKgRsOAMDDaC65mRmT4N4WqpxxzMVx9Xcioyu1v9rwf3gfyLoyF/Ih+W0vFmuqtwUyxjFPDg44D+WUXbQYsrQnsPrnFcAEQFm9DcnXsM8kPs2D4XkMrczApAVAQpc9wER9mrp6WyFUmOQAw6UIHvG06JZ6H3h5IALm/teNVG2NR5jEXhwQi6w5obQyHSxVVkMhuRkFoULVNhDBPtnb8gAKe1NT6XX+BPAqYVFoAGW11oCBPQdi/oMuKZpWZsiKnsDyn1cNimpthOta9iqRAETEUVP5eyWwv48QmV5wUuvuReIwlTlx8VdReJZa0iXnP+D9xQwYL3jZBZW9oMQU9jMcNcOQ3TGIlrijpcoKYLr6pr6KF8AcVy5p5m1o1kfQou+BGODO6nmgmQyUVPUSVWr2xGh5CMpYaipr+wLLf19XtBLDxGns+ZwFrSqemsqJjcDhIXtAM+/jKn1lTzzBNPbDZdOdyOi9g1amc3E6kPGkD1j0diR+8yTEAaod6HUaigkhtPC2VFkWIny2qrIngYE9iXezYXgQQyszIHwDcOZPITIVKKriyV/XsRdHAhCQQE1l8yBgRfUuYJqoKq7sgUTMZC6OHZ+I7BVhtDIDzgUDx8cJkcUvhwu/eRA1prOfnGy6BwXd6V3l6YuAgk8dwMLMdeKvHiLIdPY3ZHc9h243tWDFlwAAloRFHcbiSh6CUj3dQULFeFoEbJ4H7O89J6yKwJdKLcUwcRb7GY6/b6PoJr3RfsdIYE2DAWCO4oni9xZ4hlkOECqG0AwVB1yJBc5O2wWaFU96kF9aCAQz2c9wTL4OzYoIWvjBACiVa8Ki/uWk7tcWAvQz2E8RFOvAF8bRynRS6gAIi4CZQOHvLfjrupnsUeRDx9MbLldOAMJa/972hN+aYQ/msB8uW+1E5qCdtDJDwwOBjS0zYVXMiFP90lzUgH21fV2PQzEmhBb97xwELi/ZBqx6Npj82FwAYU/ilXQY6BnyAwAjlgHzde8UvzQ3KtXsiQAgIpEWXTNzAf3necBsIP/XZmKEOJe9ePo+fN5MzdCwxcOAzfWEyByg4Jem5AXYk9AoHgWdt1FTiZsGbGsfgbLyv5m6H5vyBHPYz3DseAJtLLXxps+j08DtrZtCJGWh8YemPPTsDa3kIQLbaSXtCkEI1KWQS/+LgGgLf25qvKZnnwk++YgoHlEz1PPlK6Dw8TRQ5gJ5PzfGfixgHyrW2YFsnx20GLFwALDSfRGILNRlFv7UmNdhHvvLpAlXoFkcTk1lzzwgtLMwXv8wwPh9YyMIe6Jz1eCz6am8vgE8isuERT17r+b7xgalei77qzxjMfT0hktfAAAWhNseyP2pkRhJFjIXx3TYiczhwbQyva/fBD6emgXGC4DPPzUUX4M1rtxe/6MooceIxf2ARZWWAMvzzhf90MgAzGcfKp79CMMVaqHi0IPLgeg+W0Cz6X4A/21DA/TsVcLphoq9Pj0FXp7oAZYrnhZ939BwVbeAvXhREnJDoyirCJvuQiDnh/pIwjL2w2WDGOT7UwsV+ycfAZ6EzQDjRWYa6Pn0Keyv8jY8gi48mlYycnl/YH6VFcC6N5uU3zbQk7w5DiJOoKby93ogccg20Gx+Ot3wdQNDTsli9qP97adQvKFGj/xUIPXOOmAZX5z3XT0hBkvZq9TZjmxfamJ/S5U5wBIg28RbLGEfKo69CM28MFoExIYDlxcJkWWCKue7+jrAATLpCvBpcdRU1gwGFtRYA2x9MEFbsZ4OukUOoKKCAbupqZzcARwYR9z27yNUFevprxiWMBdHdwpG1rhdtDLd1XlAdsqKcNsDWd/WIUexgnmyx+cwSoZQm5zsbKkyKxwDMr+tpzNiKftQ8fg7GM7SCxWDVgOHRk4D4zXFT3O/qauDyJ5QuqHiyC0jgUUNO0DZeWOY/qu6mhK1A1RbewR5sfSe4roQDRydugnYUHDrS8XaQgxWOsDjr5HIp7fuf1dRAxQVLAl/94CMb2obUx1AZd+a+9CFRFNDJwLAjKKOFljOnDC6oeKIVTOByM4zQGRL6u7C/9XRQMteJfLxCyg/0lMJDgSWe/SAEnxnkrZCbf1l4wr2oWL9IGT7b6eVGXx9P3B6UQSs03/OqVhTPI417Gc4Rp2HZlYYLboAgFaYB6wGPlWsrREcQCU6tRj8u3hq1xm5xYCgmAasAUmvWEsDgT1h0MKIPbQYtWg8sKmlEAl+uLCkfC11kWY5+1CxZwiyJ4bSyoyKnAas9R4IkedBivI1hDisZR9rdTiIkoE7aTHowUng8uahEIGY/r+a+k8OoJJw+A0MJ02hIkUVglnAWiDt/6iBVczZBUDEblr0fv0BKEmZAmzUZGR8VVMFHXuVqK3JyN8fQ4vR84YBy+oIJeLKHyq3GrpLRvaZ2HphyPcJoqYSPx/Y0i0DbM+4kF+uGn8GG1gic5FXkO9ddQ/6HdGu5WR0HoN6eR24EyMsK+uBD1/VUIlmFVa6Vgu+7zIYwGtjzV9GLqN2kSpclxssgbCaARK6LtV7LD2aB4AgZ7N3efOBsVNQ4PrffghkXG0TzfmccjVUhRrK1WTWupx790WHX+ukVzt5H97jG8u1Ru1h7PwAYG71eUD05YkquTufQDZxrtR1q3RekPRSU9pCUoQnADL3BvxisXSCi+0qe1cAwf2FSJDqU2b5atpMswpN3cr+cw68UFvqlv7zeEVeBFBwbLy75Wt4bMx8eAI8ObYu/B4DUitUVwLr7EQm8Rtgf/edteeZylZdCdO8AEB1cXo9ztKF2DjaA1OG9+WrKaA1qdiv+2vHGYlPFFK6NBbHN9xZ0sIWgZwLOHYKeJYgRCIeB+W7umsvGk0Zu3R/aT8l7p9iKV1qK74CwNMN7d0snaCkyqIAYGb1BSFyb12xvKrxAtlSGjIXa90f206KflgEACDSPwOZqiBlV9eKlgLrYOXoRiBy1BZgKzF8KOeugFnFBt0fvP6KvFfIRLc0F0IApCcM/MnSCVpc5b1JJSTlQh2wBXhnRljPuVroWrmo7z3/CLubb6XLZmU3W5xg3pExVSycoBvnrwchQAn4ytvGl6SayNOuc6lgpftNy3Eht/Js0WUuEAAozk6pYxaMTIwDrqydAUr8xRlFsirG3eIW83583WxM8PUcpro0nKD+5oIWXMDywcCMOkvCsbfHPrtUUediZ4Mx265mA6WvWO2QAnLn/Ik4ICFwIwfc9sBbt6olIFqRpS4LJ8gbCTLfJnPl5DL2pJggpEytEk4EAQCAS99bRmRML41z/0mTVzElhJTFRVTxOWnE75YRGTN2n55axJlBmd2KT/9V0+IQuMjY3EsqTElzKcMQQQCgvTa3kVVMyeAyCXjjWrnYIinTAuHhqlYulpeH9HntmCTZyF4G+VawFNAk5nlipqzMA4CIFoLUyN7fUXWCrtyey6sLODOi6ATW8ucJgOx9Q3+zFNAhhNekuFgmokCcgUAE8OV4YHVLNy6jMLMNvJJXLkLxs3cABGcgILwAQH15ZgMrJ2hvAuNrl18Vj/XJ5fvuznUaAkEAYLy3zENmr8CV23txRS43njdAcOe4H4cdLQbAOwcBDwD/bupYztIJ2rEa0aEsbhUMRp2H3LyHlSec15oFIpyG4F1Yd6vZNlsz+E82TgtlA5mMk8nNgXPtWbcEK4GzcIKZewJ+tnSCtvFSxtWan+zGyTiJqK3JsicAiLMQiAAKksdVtSWmdOUii9+nWL7DSWrK12KCoPXm13AEJ0594CovTK9bqhN05Q4lz8mTOB8kBSY9N7+wNKYu0DEvcG8vbi4tcOVis/99bz3tbougYh8JJ+40XAh5sr6d1Wyb1QMo/9oxnyrnpJy4MxHgTYjVbJsbF2qJPQIn48QBYukEP8UP+NEs2PP6VCrHcfYLajmcEzf+th0e7c7tObk6x777CTY4ceciUB77R6ew6zeoM3PiZWye5JkddwCdnRMHiCCK5DnHcVQFFXs7EycOiLAR5+nERYsMA0HlQCsn7qxwnk5cxFPbnp+g5cQbL3ts6cSdDxSduNcmKyfuZKDsxEPLrBMnIhHxhLNpY+DEP1sKyt6LNgXRRpg68bL0JnLjs4/AY9tWOXBiTtz6xyko7gcPrcfFZz6wMVBn78Qd/K2muZfX9rB8/fs+ZeanXziOkoBaRGztxB31nbJpyfM6fG/1unFX7gKI2JejtdGMiK2duKN1McN/iX82r2D1UmKZ6R/cz3kA+nG0NkYRscN0MeWD4KF1ZKW9mVvO9YD2eYz5npYjCir2TrTXiRN6XSxPoovJJSe7zUnlgBq2/rcKlZf40L+tnLiDdDFb5+ldbTTEv8SVBK+0dLuYzd/N6lkSelBr5i3eNoGe2Dua1LbuYg7TrMRGTGk0ubRGuos50KZsxHZ2sY9H57b/zupHJDheGbURC1qAN5bWxV4mTGhW3qqLOYAu/hIX9Z+A9x8gSHSxnUNqcw7UxfSXeJH1FY51F+vuiF3MwZ34HYEHREEwdTFbRhMnKJD4K22pLuZUN1fXwc8/AF9eJ3LlnWyZdYg366+hwMQaSRaPADpdZFy5j0/OAgcj8irJZE6ZiipAFAF4ci7OGJnbnmIAQEE9E855qzX/2eOtfSo5iCwAVlA4IEoZAAAwagCdASq/AEABPmEqkUUkIqGWae5MQAYEsrdr4NWBTZRN6nzIey9nu0u/Vt4o9ADNOcrMsWGZlx+3/tvOqd9Ri/aGYv8x3yv71+xHuY/Oe8i/pPoC/dP1pPR1/nfUA/ZnrJfRV/W71o//d7In9+/6f7t+0b/+PYA/+/qAcET+FHuc8yv3344/uT3gOEDoXWS4MqF/yAoC/Ov7X332prFSeFB9o/5vsBfzH+serV/l/sx6JP0H/aewP/Ov7b/2/XK9d37jew3+qX/VBYelBtD+FevediSfhJujsA4lpimg8on6rFGTr0EWCZZ2A1e6tGWrFEJMe2jFDvztIzwTJZ6lYJO7/8EHTNXmf7blIg/74WwRXwFL+7QecrayOnRw/1mop9oHeqptjKiTDSD74K4lXYm0+JOtS6gfv5dnfIMa+Dmq6VYe1pdvdwoX7JBQdlvlHFDccvnf1QXBoH3AWayYI/JC1ZQZ3WT7PgMUqfz8WgLClScbdBNcv8VIROQpYmNRULOf7J4WG0/KFwK8Fy0ezwzrcMZbvE9T5b4lWq3oCaX3GpoXxhTSyhtDLsb9Y1VjI/ll/U+jn3JBqUREvRo9y+eFCLHeeStZq8AQwDLfElklYl8qiiKVn6/OyPhKj2qfB058fM9ZIUrFIcU+hdGO2E/Y//1OLLjXKS7Rw7LSy3naTP2VU1f7+FPy1Jv87yuSPVX3rlgDZM86WnPSU7pA/dLBx4Yf45dn42AwXvy8rxi3nz3YE5Vth1OkdYUW6z+6m0d6Pouvlazn681/51eHKBesc5HEFtxK9+0ELGCA7EvuVQnbLuzTmsl79oIWZypa4wZnVsKBCzVuRsRW8+iuQKAUvPQdh167040kRK5C8zdoDTToTRRJEkfGVyboPduOXDuoGbHNr59ttJPwjqWp64dELFxl+JGNjs8ye5yHfQ7TL0iKU4xZGq+rh3mxxMgEZthp5rIBzOu1293xJb1dCMivZYn8ruLdUSzT8FaFQk1Vq/s41pOlzf5LRE8MCs3l7VxVXezLlSuiB7mceJ59kHCuUyo6+/plixk+PgpwQa6s2jqppz2l+VbZDxxF/7pCnMssBaJl4gRXI4+bD/mB5Hhl4fPc0yAJ+Sn2UJLXda6gfzMrY8OtgsAA/bjGLepnjVjQfjuglxHL0vp0mf3uFFrjj0aXtkUH3KxDODT0msi4OCXEBiCD7Fxuir/NM1/vVym8QRQU19FNTtB597f8jss6Zha0KV1WoMQPv47L4UNgUDRgOV6QZZGMvVuSKPxPWlBweVBTpunZkV/STV4llYTNUCkJaO/r+aWvVeR3njkvRBhA1WEHoiOZNpKbmLQs+lQydh89UB04lxRd+5uWdPRH5Naq9KuZNCJ2r/bqX2Yan7j9mpSzB7gWg9VjmXLf/jVaAj+KXag3kvk2t9wCq9xTdNEgqrqzyvRzhJarhaPWOA903UEf5qb0YbKap7r84ECrvjXdY0cJMbujDiHd5PaZNqZh15qPA6+BcoSU3SqDnvhVO9yHhmef9XD5cSCEegovHMD0cSSukh3o60B79CvYS6wMw2Jo9r9nuIfSJi/gDVmO95ttu+NBysZRxd3nn1HdK6C0GVgK7aEZPiApY8Z1U+sIvzvDTlO62BXODYj3NyDVBpEs5LQWsJb6gnL+R6oDXsvAbOuw+iwxdjtz+kHGxm2hUimQFllM3/ys4zNJbgVtUZlvjxLr22Ov7+Xyb0fPSj7s4pdqfmOPZi4qhrQu1AdZTLmG61MEKhghbPysAoP2dNCDHNSKfWf/kEXs86NBJl3ORnBC7Td7Qd2FLwn4/Ougdw65klprpwIIdmEsLq7c0kI6wwpuSSUMut3VY34O9KsuhdSYj+vb77Kc5fcqewiTyiF1kN4c2JGZXyC8ZXj9TcS4Tw0gFZoAa1Apj1Y0NHuLS5BlPR0SNmpnG3Lu0ljiZeVpI0wzETuNpCFF6ulKxnfou5Vb15sGd8+34dfDzyqnffVM2Gb66h+h/8HlfJL/gfY1TYlJ1w6DohB5l2p2B4xyTUe7AQvsWK9n5zmbcmS8sQtb/qTu7VadC3Og3jsGN1FSa97Qkl2NkxN6iC9DjB8u/eIj12havZlnBMvBE88Ret+4j5ns6T4RteyFp4WM1dv31XNlebyUp78qeqnSZhXmeoLUa6B71ku3dCE+SMHtlD6i3ma472wqTJvgxQqLFl3A5Q1K0UK2G+bWV31p1TS7peAxfJyJKVrE89MLLt7mFsWxF2gqQ4SaZFeBIyVpdesle6qkYRr6xyyKJlEeupV2/Y8eA6o+JZrQaFeOJEExpnBWWNGjsFiOJ+Q3fjuLOrnzw4s8U4n8oBDMUQhloAuTIGHYzdTeGnrRzVEbgN1r3L5eTbwRA1sCdUZGeiYc3L/b3HDwIqFhUXJJlrqTEf3HGEk5bynjzz72qqS8EvMP9gSPPakMtxC4Bu23+uW+Aw5WQ/mGFM3Wzj+uH2/s/m5GDlPUnUIb7xCkZj6J5485VbRfJ2i2ZzEedC68Tgj+wYN2z5vHjuJYkAbtoaMwgChkVItfaYSUzMHnWfiYwA6k23Ky8uER8a+MH6j4iDQuhLjCiXy3IhDsklqTSBlWTunmhWfO2u4iA/MACNXTSrZCll83yeVSl8ZAbYh9xp6p8pdqUhkjLKnDMQ/wSHXKC2/X9BhHvCSNJk5P7ChZstFN0Pn8LBgWhoCepAKqDPZi8xSqbpJ8yKoGA6RrOJcfrRvq8X6CH//2b//+yk///Zrv/bMgkSrLW27D7slX19hc6tIOnziHU3fxKwN34878Y1ZrkUJhXB/ao51aci5iRgLHuyLR7q8TKzLHVkP/5YK7wtQb3qRKDopCVfXx18eMOwdoQ5hmTNAnpayzhUdac+/jr8nNdgM2q4alBdqIjQfm1mxFfqO+FrsYaDsI48Ib9r6c7GAczM+7YQl6+yp1iFNLga0QXDoXv+vUgHMMlIgs/4pk85AjtZBSe3q43WUHAJfuTMVamVNkePUD6C0XWFFr9n7hCV7dlk5BEA+U9yZK9vz3gWLVc/+C6FqRVmaH3A5ejb1xJtrdR6sPjYFfPcHI7BDuWsz2gzt0llDmwBgHsK2UbAFvj80/O7VIxKzMsAzwcC+piL93mGP6a8HfV1ho2VCsfjoprA4LZdOngoV55doiQTEDmyXfNohwCgoRfLMVIJ5S9vexWCBJbOPZQ/ETgA7UABFqjryzmzdBQU2HBSWG9tiVLNnvaTDZx0shbvlkp89oUOYDKOGIA8llfTV+D1MkYYKGIA43nF9eXwZn2b1rzEbY01bSM5RkuxaC2d70VzmRccjLpyjm3WgSD4Or+/1X0UUGcPsAzEYCuuWnqvzSE5UgoGbhn1d4CclImiFeG7/0GofEENpPgf4wtOS19UDZiGjTZjomzqqSFhBB62O7kM9wNt//+L1TSyJJ4bVfEEu5f6PF98m3zN5UmivruqOL1NQNPrVEEue1gyCS9giEWbnb5dzzv5n5wx4j/+qmsYjvd3kGo25hQPTf3x4X/77DAxVWhdOKbQq2n10maP18tbvPatQ/73Q8m3khRiHSHEZPn6LSVvs0jMPkwCetLsoKrtlJwZGSLSAJNRuY/YUNDVx9k0OV98XUF2s1pUANi70lfEf44iv1motyof9X1P3Hhdah7Iu1svMQupzim91qr11SpXBakZJ965HwZO/+PxtBe+UvFEZ/4ADOjhMpewtVGeA351tWrdUpRA8oU+ONjUk3Y7SY+lUXzi1YdvNmU4rGvClvRJUp+TjRuMKvxgGlZ8FZ1m5zPK3OokczW8skF5y6Bd4hCcjskrQVBjjDpP57X4T6bq5BrIILil91GnN7Yo7ug24rLrQeh52Htz7jKz5DwqkwBN4msLRrdgsOX3c79radBf4bQZvQgZOD/94Cmgs1VF7q/gyEKGLisfBdxWlbGG05eF/914SKsVNY3ITpX9GQSHpwflWZVFSLUPlHuq1E+9WS+U4Gt7fzkLHYcMNOdM5pcE8AKt8+5Uc+CAt5dlDgwacz05q5rpDTsTJZPof2WQ3Kp9FDVoI831e1j/szpERVRmmr3uMcu0XkTFQR3Shh99m2Cet1DbaDriuXn4fiBph3R/Rnu4j7SjZGh+VwtvQ5DTRFVf9DT8ctoaUUEWOcp+pgREV85rSt7v2JRiTZw9k6O9cR5fgfCLcZiCgaw4CdHtOFcwP8G3I8A70Ada7Gx5NI8xR9C4zxcjIf808b4nmV5VXImMaZ/9SrS1mlzYR6NOppIFDZXOsVVX6b6mVYWEmM+f5R5xYV+haiOgJshuITljtVwuHHHlkGVjjdKRyqV7Pi4WMkJTHDWvirP7OYHoEheZYaNU6Oy1MzJ3W0boHwQCFndJXNkCEvmYThZeEcB3IU/Fp00HSyczy/TNoIdovXlOQy9lH/Jv8fzXciPasw2OSN2rSbnas3TL2DWYWtB0DlI0HVmJWJr+vRj7WNxhPh6hwjPZjVEuYTe+ixSf5dygbqWBDxvj1hvihX5/MXGl6y/Bs/Vkf63ETtob3Mlii45eaXMHQE3MW0DhEMaAyStNVLfC5ex0SZT+6+ot765nRzEbQti6mho8KKxirGUFeSQ9tXz3aREPX5JGYU4VsXWMu0UvF//Ghi4s5Mnt7e+beIfeeY23S30g54gPFVTka/G52YkUDA7VqK0IZuUbJvMznKtVHEOIKcRo5MkYfltCQ80wzbnrWfmvKs0iOhZ91dzBIAb3gjQb4bwAtCbpfA8EaqQdyCljSN+YgRDiF1hOTsrhxLkEzT7SN/E6SpKnU9abY5Acse4natGxKoqWs7SQAo2QcCCMXT53IRvwccwso6xjDU4PDEHxqXOkpnVPVjnflnRW3LrVI9AAGxcjqXcY5NqxruoCjhzmiq1dwII3wkNkfd1Khj7dnH46Q/L46gzQgEO87oDpYw5JsesnOOZGgNp9ZjFmuEzSFlPxqMnMw/+kp1JMDjr93rEJdG3x4gBv3BWe53u3CNpQU4h/GMWscTCQJbPo9SoXW1UN/N1nSc0ODaRLCYwPyg7wx7sNFDoDLuAdwlFGG79ZR6XojBsyYsgf6qHYpkuvbgPjaTOJU97XZLrftxsVNmv2fU277OmYN8mQmK9kR3rwlfgh7VNC0TrIM6Rc74M372vtl66nJYBQ8vIM3mplqHKI7oVT6IKlVAfahLVhhGW3M4mUK/9FHGh7MA6OlR3AEIDF0u/oOTZ5aWrlhgenL2IKSRpT78v11fjGkFPfI6hcFtjMw1UEcMIzBScvwysk+mbMLzTjZ98pXSypChuSNl1/XQ4tSt8mzCLdit+1pfqBGh90Mpaqu2j5qIbdPiLlTZ8sxfviFyyvx9CUH0Ck8HKu4SP4tMTgiByTLqUOojA65iCDT7nGWdd2k1azkthyf0B/f//ae+FgGfm7FmzNDvCixtXA6aPIuICOYyJPX+p5tZ23rH7KYXXo5EeGQCnzWTGRYXWByWCpO6MIzavpqB31Nj0OMptQ56HzVBfy0KO5yZA9820elkGq072NrYbqxVrbU7gl7mXrpjwSbWUiubuVTYngv5UoStC1e1XCsvcraH22T4cq+fbASnM9jX/PM3mljz1SWAHWS89+bsY+BreHwiCkqWcXABx6SsSg8UWC03UWpLWMdxdFdAAlxaK4Ku2qUnT5YbyqbneG3GeLsgq/ZQqbWrjiRmU4k3h69Emv+PeR4c213Bpq8uIcFfbDHpnLI5HsbueRrSHcQFAVy9BOy7gE8OMbjWiw9ke7wM1rquvJTtzLtk5ahrCV+0lKXAGPG3tLGPlaYHqckLOsfek/zePubkmF/tcjSEmDGsaXKbyM5I51rFOGjhJbdAJWk8EiOASuShZnxJAQ3SpouVxB1eusQYttW5XjGJufxMxuJ9sOl5q3K8ZP8ECjoWf32EgvkMqJZkutAAw5p4757AdYrFbept6ko1i33kMJK6yTmqV0DLtt6P/xg8iaGBNuPE37oCd2oXRiRru+CzReQZSmohVfwBGYLVAWXs9Fn1cz6gF5dyPcPxBv3NQEf3DDAbqzqOaFtmtoRkK+b2uWEyYpwQ8b7j2PuF0cdBQ3xLHkRfO5SM+nticeekFPRneIcm3v3iYpmcNIr2lwWVN47PvjeBtRazm5NYANip13jhqa92hGps2AlBv6BCybTS+GX29aOz6fzVKaOKLn+gACGWJf75ivKJgSz4gsdVMshUawL5ejBeck9QOM2o7MBjB0NOB3o0XAs0ep3PJ4fvOn8qLuen3HDYV78V7L3kQ0aAHHQQghS+QDAWKzCCxvEnoeyBR83+EIMpvb3PYl07gHzzH6GqFQ2TFJVOAi83eBLmt4Ppcy9XFmNdmdqkp2wBYJc+CnOjj6IpkpgupbDO+hUPGJ+ojs31D58LU5jEwj+XqP4CZ2K64yWvIk6bQrfdRsSIPJv0CSi2LUSJzl4cqGmse2OqxwWz47yL+3BppDO3mcWcWNJg2MpujX4O3gzY6bLHiPykAw/kbGxr5uZD+dXXjpC24vOEgxYqvrm2EZPRsdO3IeHqm/FOa9ZIcBqx5nZYgemA3KnsschVrAHhliLYwf5o4Tl57Y2wwdgXGCOA/1QZ56d6tc0CzyTLvmPkuiYrHX++QAVVWtDKVVvoMbPhNta5owFo/4fT0eUq+PbbcGlUTYkG/4/kQB8nWshgXD1ryAEjnz1HNRpBSgF8iVGT70ouZV4ZZmlTyC+AJINrxyJ/ATqg2WDtyVejAOowaF9lhsECoCVlHNl+w0dNyMwIU1G7G/SWPy+OMsiQnVj5jvCRaLddbM+rtVgkZHdGMdvC8ykN4JLSAE6FSwvbKLEMRmwZaHv1fd7TYuG57Qvqhb2Cw382a/i9gwFixhgVZ9WeUSmB6sjmOPOEWnpCtQTkzuVy/o1W1K6XtH/Gs1TWV4o5c4gyiJWptuXbmaW5//6esVz58niPl4SkNNPkLzyEza4J6V635IoEHL8PKc5GVJp/5rN39pzj6cGu5P27AOcQICC11UNYS0rGumAgp8ehWWQZAkH+fCZ2RoQUa0P6H0bz/sIt8YQlekO4CsjrekrhVD8Fi3Vcs/vlJQOSBDMx18vcpF2lQUoRqLkN2//IFYE2uejb5gq6EaGPDqh/K6ArquIw8nW7wfM0AeELXHpunaTvXkaIJA7lRGpUl8C8p6sHuf/Xe+OKIvPqR/Tif9S0z36LE1bDW0Z5+Lm4l7e5OSicjo4/WAUeH0lWKDCu4OKQ85esnvnyYAz8ttqV4zBbo5aQ15S8LjeE3u3ANYXr8k+w0ad4+eiUUw/560C1V1HTABDzyd55ODNjnMM1SpDl4J52aYA6JgF1gcjNu/40XRpExxMq4PsrC8jFF1R43zk0tq1wMoCLgHtWwjK91moydR4uI3cT0w7XdwXAL13QRMv7hCj6/3GHUsbnbXlb0W3Sp8kHPAHJXMbY06iPlMyk2kGvCucOIYIsMrexfbGgvrQBgOEFZXS+BKILZ9TzbjDu/gs+/V5/8wkD6z/3Wyk8peB65tHiJaHklOaFWoIQ0r5haas4PDxI0c53+//iVGF+3y0bA7Lt+NMpGyWdBh0ndO4Ue4bu9GkkJh0KiTuRLtYZ7H9je0bsNDs5M6BFSODdq1mPZsY2BKddV90ydUuRoZiQjFCf4DCy2MdVp81gYIPC/CXtf+zI9XPndSejUvody54IR4xF6GXBioTrGvoA5V2h6n7krYiHNZMyz1YDonvKgHQ8uZg2rMEAq0eKG1+126fplQEaVUX5SrLt6i83SJsbC7J5N/0cveD2n1QPLgqErTMg7eo9x062zNZWF/l5+Oex37VWWJvNespRL/spRBiTQcoz8mP2fWVK6aYnUpj3vzy1OOp4IO3pAD/vaoDZvo6VdAFgmOH1lPe6/Xp7JsgIJAQaHJPR/hCGNmBRf3lZKFHaUY+7ugnYUWvxRxO+HDeEb9L0TdN3eixY2158hD9zxlKawBsm+s5xtvfdvg3VZ5vZLN38LcZ+xuRN493W1bsQK+uFcnHK+9/l2r+0udda2LF8v4u+6jMxnLy+/1I+Ez1+crWFPuLYJhKojRjlr/sLvXLUX8QaIfysHYdbPFYYs703RJMoqabzfvWXYBMUjmijpub5vDyYb7a6cqtncEqFCnFpOJbaBCKuc9twldrkW47/wLuh016D26+vY6E50m0LzpSPtXVQ6n8wNSrWLlpxg7Cyw7fKxBleGFRwZJkAAyYjTtIjqQFLQgEJih/cGEuOyTpDlX/aAtZCJPJNZVvc5jWsIMB2hiuA/a87KiZ2t9pDaU63s0bdHJI+D0du4P3l78Z4zhC/+2a18Z0RyGNMH7aHHuLbwReIGoRXv+QHtQEjaRK1GFsfgoMDNI0oVp0mfZRppn7znH58CWivAI5ERJG/3U0ZwvvVnN/Vd+mNbbVpfRHEw5fjoF3rO7y9AdouwXTJ3kOod0fK+2L0QEibE/mY6JCWSBHhAFicD5jzrFgmA4YjV6O8W5xTwJCTQC76gemvBZFcsaVWyc4fcBfkSP2mu/IPsCYeSM+wKL2R5m68nqYMp16btdiYzdposlXK2awxqdV/zqW68ABzG5TKKycI8qt//qfMv9TAAiPCiqyRY//5nQAAAAA=',
  },
];

/* Parse a bare image filename into a manifest entry.
   Robust to mixed separators ( _  -  space ) and missing tokens.
   Recognizes both English and Korean tokens.
   Any field that can't be inferred is left as null.                */
function parseRenderImageFilename(fileName) {
  if (!fileName || typeof fileName !== 'string') return null;
  const base = fileName.replace(/\.[a-zA-Z0-9]+$/, ''); // strip ext
  const norm = base.replace(/[._\-]+/g, ' ').toLowerCase();

  // brand — Korean and English aliases
  let brand = null;
  if (
    /\bhomedant[ _-]?house\b/.test(norm) ||
    /\bhd[ _-]?house\b/.test(norm) ||
    /홈던트[ _-]?하우스/.test(base)
  )
    brand = 'HOMEDANT HOUSE';
  else if (
    /\bspeedrack\b/.test(norm) ||
    /\bsp(eed)?rack\b/.test(norm) ||
    /스피드랙/.test(base)
  )
    brand = 'SPEEDRACK';
  else if (/\bhomedant\b/.test(norm) || /홈던트/.test(base))
    brand = 'SPEEDRACK'; // legacy alias

  // type — Korean and English keywords (specific tokens first)
  const typeMap = [
    [/\bwasher|washing|dryer|frame[ ]?open\b|세탁기|건조기/, 'frame_open'],
    [/\bheavy|hd[ ]?shelf|heavy[ ]?duty\b|중량|헤비/, 'heavy'],
    [/\brolling|caster|wheel\b|이동|바퀴|캐스터/, 'rolling'],
    [/\bgarment|hanger|closet\b|행거|옷장|드레스/, 'garment'],
    [/\bpegboard|peg[ ]?board\b|타공판|페그보드/, 'pegboard'],
    [/\bdrawer\b|서랍/, 'drawer'],
    [/\bcabinet\b|캐비닛|장식장|문/, 'cabinet'],
    [/\bopen[ ]?base|open shelf\b|개방형/, 'open_base'],
    [/\bshelf|rack\b|선반|랙/, 'shelf'],
  ];
  let type = null;
  for (const [rx, t] of typeMap) {
    if (rx.test(norm) || rx.test(base)) {
      type = t;
      break;
    }
  }

  // dimensions  e.g.  1200x400x1800   or  1200 400 1800
  let width = null,
    depth = null,
    height = null;
  const dimX = base.match(/(\d{2,4})\s*[x×*]\s*(\d{2,4})\s*[x×*]\s*(\d{2,4})/i);
  if (dimX) {
    width = parseInt(dimX[1], 10);
    depth = parseInt(dimX[2], 10);
    height = parseInt(dimX[3], 10);
  } else {
    const trip = base.match(/(\d{2,4})[ ._\-]+(\d{2,4})[ ._\-]+(\d{2,4})/);
    if (trip) {
      width = parseInt(trip[1], 10);
      depth = parseInt(trip[2], 10);
      height = parseInt(trip[3], 10);
    }
  }

  // tier  — English (5tier / 5T) and Korean (5단)
  let tier = null;
  const tK = base.match(/(\d)\s*단/);
  const t1 = norm.match(/(\d)\s*[ -]?\s*tier/);
  const t2 = norm.match(/tier\s*[ -]?\s*(\d)/);
  const t3 = norm.match(/\b(\d)\s*t\b/);
  if (tK) tier = parseInt(tK[1], 10);
  else if (t1) tier = parseInt(t1[1], 10);
  else if (t2) tier = parseInt(t2[1], 10);
  else if (t3) tier = parseInt(t3[1], 10);

  // color — English, Korean, and B/W shorthand used in the rendering set
  let color = null;
  if (/\bblack\b|블랙|검정/.test(base) || /\bblack\b/.test(norm))
    color = 'black';
  else if (/\bwhite\b|화이트|흰/.test(base) || /\bwhite\b/.test(norm))
    color = 'white';
  else if (/\bgray|grey\b|회색/.test(base) || /\bgray|grey\b/.test(norm))
    color = 'gray';
  else {
    // _B_ or _W_ shorthand (only when bounded by underscores/dots)
    const sh = base.match(/[_.\- ]([BW])[_.\- ]/);
    if (sh) color = sh[1] === 'B' ? 'black' : 'white';
  }

  // hanger detection (Korean 행거, English hanger). Garment racks usually
  // already set type via the type map; this is an auxiliary flag.
  const hanger = /행거/.test(base) || /\bhanger\b/.test(norm) || null;

  return { fileName, brand, type, width, depth, height, tier, color, hanger };
}

/* Convenience: pass a list of filenames (and an optional base URL
   prefix) — this function fills the manifest for you.              */
function registerRenderImagesByFilename(list, baseUrl = '/assets/renderings/') {
  for (const f of list) {
    const meta = parseRenderImageFilename(f);
    if (!meta) continue;
    meta.url = baseUrl + f;
    RENDER_IMAGE_MANIFEST.push(meta);
  }
}

/* Map a product type to the brand bucket that holds its renderings.
   Most exhibition items have no renderings — they simply fall back.
   We strictly require type match — a shelf shouldn't show a garment
   rack image just because it's the same brand.                       */
function findRenderImage(product, tpl) {
  if (!product || !tpl || !RENDER_IMAGE_MANIFEST.length) return null;
  const wantBrand = tpl.brand;
  const wantType = tpl.type;
  // strict: same brand AND same type
  const strict = RENDER_IMAGE_MANIFEST.filter(
    (m) => m.brand === wantBrand && m.type === wantType
  );
  if (strict.length) return scoreBestMatch(strict, product) || strict[0];
  // looser: same brand only (drop a slight notice via no exact type)
  // — only if no strict match at all
  return null;
}

function scoreBestMatch(candidates, p) {
  let best = null,
    bestScore = -Infinity;
  for (const c of candidates) {
    let s = 0;
    // color match weighs the most — visually most obvious
    if (c.color && p.frameColor && c.color === p.frameColor) s += 100;
    // board color match — adds nice color fidelity
    if (c.boardColor && p.boardColor && c.boardColor === p.boardColor) s += 30;
    // tier exact match
    if (c.tier && p.tier && c.tier === p.tier) s += 40;
    // dimension closeness — log scale on the W*D*H ratio
    if (c.width && c.depth && c.height) {
      const ratio =
        Math.abs(c.width - p.width) / Math.max(c.width, p.width) +
        Math.abs(c.depth - p.depth) / Math.max(c.depth, p.depth) +
        Math.abs(c.height - p.height) / Math.max(c.height, p.height);
      s += 30 - ratio * 20;
    }
    if (s > bestScore) {
      bestScore = s;
      best = c;
    }
  }
  return best;
}

/* ============================================================
   UNIT CONVERSION HELPERS
   ============================================================ */
const MM_PER_FT = 304.8;
const MM_PER_IN = 25.4;
const MM_TO_M = 0.001;
const toMM = (val, unit) => {
  if (unit === 'mm') return val;
  if (unit === 'cm') return val * 10;
  if (unit === 'm') return val * 1000;
  if (unit === 'ft') return val * MM_PER_FT;
  return val;
};
const fromMM = (mm, unit) => {
  if (unit === 'mm') return Math.round(mm);
  if (unit === 'cm') return +(mm / 10).toFixed(1);
  if (unit === 'm') return +(mm / 1000).toFixed(2);
  if (unit === 'ft') return +(mm / MM_PER_FT).toFixed(2);
  return mm;
};
const mmToInch = (mm) => +(mm / MM_PER_IN).toFixed(1);

/* ============================================================
   3D MESH BUILDER
   ============================================================ */
const FRAME_COLORS = { black: 0x2a2a2e, white: 0xffffff };
const BOARD_COLORS = { wood: 0xc8a877, white: 0xffffff, black: 0x222222 };

/* Human-readable text for each placement-warning reason code.
   Used by the "배치 점검" panel so users see WHY an item is flagged
   instead of a bare count.                                             */
const WARNING_REASON_TEXT = {
  overlap: 'Overlapping with another product',
  out_of_bounds: 'Outside booth boundary',
};
const WARNING_REASON_SHORT = {
  overlap: 'Overlap',
  out_of_bounds: 'Outside booth',
};
function warningReasonLabel(reason) {
  return WARNING_REASON_TEXT[reason] || 'Needs placement review';
}

/* --- Procedural wood-grain texture for shelf boards ---
   Generates a CanvasTexture that mimics a light maple/birch plywood
   board (matches the reference wood swatch). Cached as a single shared
   texture; callers clone it to set their own repeat/rotation so the
   tiling never looks obviously repeated.                               */
let _woodTex = null;
function makeWoodTexture() {
  if (_woodTex) return _woodTex;
  const W = 512,
    H = 256;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d');

  // base warm wood tone
  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, '#d8bd91');
  base.addColorStop(0.5, '#cdae7e');
  base.addColorStop(1, '#d4b687');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // deterministic pseudo-random so the texture is stable between renders
  const rng = ((seed) => () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  })(12345);

  // horizontal grain lines — long wavy strokes of varying opacity
  for (let i = 0; i < 70; i++) {
    const y = rng() * H;
    const amp = 2 + rng() * 6;
    const thickness = 0.5 + rng() * 1.8;
    const darkness = 0.04 + rng() * 0.16;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= W; x += 16) {
      const yy = y + Math.sin((x / W) * Math.PI * (2 + rng() * 3) + i) * amp;
      ctx.lineTo(x, yy);
    }
    ctx.strokeStyle = `rgba(120, 85, 45, ${darkness})`;
    ctx.lineWidth = thickness;
    ctx.stroke();
  }

  // a few darker "cathedral" grain knots for realism
  for (let i = 0; i < 5; i++) {
    const cx = rng() * W,
      cy = rng() * H;
    const rx = 20 + rng() * 60,
      ry = 4 + rng() * 10;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(110, 78, 40, ${0.06 + rng() * 0.08})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // subtle fine noise so flat areas aren't dead-flat
  const img = ctx.getImageData(0, 0, W, H);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rng() - 0.5) * 12;
    img.data[i] = Math.max(0, Math.min(255, img.data[i] + n));
    img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n));
    img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  _woodTex = tex;
  return tex;
}

/* --- Hole-pattern texture for SPEEDRACK angle posts ---
   SPEEDRACK uses slotted angle steel: a thin L-profile post with a
   regular column of holes punched down its length. This generates a
   CanvasTexture with that repeating hole pattern. Cached by base color,
   cloned per material so each post sets its own vertical UV repeat.    */
const _slotTexCache = {};
function makeSlotPostTexture(baseHex) {
  if (_slotTexCache[baseHex]) return _slotTexCache[baseHex];

  const TILE_W = 32,
    TILE_H = 40; // one hole-pair pitch per tile
  const cv = document.createElement('canvas');
  cv.width = TILE_W;
  cv.height = TILE_H;
  const ctx = cv.getContext('2d');

  const r = (baseHex >> 16) & 0xff;
  const g = (baseHex >> 8) & 0xff;
  const b = baseHex & 0xff;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, TILE_W, TILE_H);

  const luma = (r * 299 + g * 587 + b * 114) / 1000;
  const isDark = luma < 128;

  // Holes punched through the steel — render as dark voids with a faint
  // bright rim so they read as actual holes, not painted dots.
  const holeFill = isDark ? 'rgba(0,0,0,0.95)' : 'rgba(70,70,74,0.92)';
  const holeRim = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.16)';

  const cx = TILE_W / 2;

  /* Keyhole-shaped hole — matches real slotted-angle shelving:
     a round hole at the top flowing into a narrower straight slot
     below it. yTop = top of the round part, total height = h.        */
  function punchKeyhole(yTop, h) {
    const rTop = 3.4; // radius of the round head
    const slotW = 3.0; // width of the straight slot
    const headCy = yTop + rTop; // center of the round head
    const slotTop = headCy; // slot starts at head center
    const slotBot = yTop + h; // slot ends here
    ctx.beginPath();
    // round head
    ctx.arc(cx, headCy, rTop, Math.PI, 0, false);
    // right side down
    ctx.lineTo(cx + slotW / 2, slotBot - slotW / 2);
    // rounded bottom of the slot
    ctx.arc(cx, slotBot - slotW / 2, slotW / 2, 0, Math.PI, false);
    // left side back up
    ctx.lineTo(cx - rTop, headCy);
    ctx.closePath();
    ctx.fillStyle = holeFill;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = holeRim;
    ctx.stroke();
  }

  // two keyholes per tile, evenly spaced down the post
  punchKeyhole(TILE_H * 0.06, TILE_H * 0.38);
  punchKeyhole(TILE_H * 0.54, TILE_H * 0.38);

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  _slotTexCache[baseHex] = tex;
  return tex;
}

/* opts: { perforated: bool }  ── perforated => SPEEDRACK only
   (HOMEDANT HOUSE uses smooth posts, no slot pattern.)
   If perforated, a separate `postMat` is returned with a clone of the
   slot texture so its UV repeat can be set per post-height in addPosts. */
function makeMaterials(p, opts = {}) {
  const frameHex = FRAME_COLORS[p.frameColor] || 0x333333;
  const boardHex = BOARD_COLORS[p.boardColor] || 0xb89968;
  const isWhiteFrame = p.frameColor === 'white';
  const isWhiteBoard = p.boardColor === 'white';

  // White paint: low metalness + higher roughness so directional light
  // creates visible shading instead of a perfectly flat white blob.
  const frame = new THREE.MeshStandardMaterial({
    color: frameHex,
    metalness: isWhiteFrame ? 0.08 : 0.35,
    roughness: isWhiteFrame ? 0.62 : 0.55,
  });
  const board = new THREE.MeshStandardMaterial({
    color: boardHex,
    metalness: 0.05,
    roughness: isWhiteBoard ? 0.78 : 0.7,
  });
  // Wood boards get the procedural grain texture. Each material gets its
  // own clone so repeat/anisotropy can be tuned per-board in the builder.
  if (p.boardColor === 'wood') {
    const wt = makeWoodTexture().clone();
    wt.wrapS = THREE.RepeatWrapping;
    wt.wrapT = THREE.RepeatWrapping;
    wt.repeat.set(1.4, 1); // gentle tiling, grain runs along width
    wt.anisotropy = 8;
    wt.needsUpdate = true;
    board.map = wt;
    board.color.set(0xffffff); // let the texture supply the color
  }
  const foot = new THREE.MeshStandardMaterial({
    // Cap color matches frame: white frame → white cap, black frame → black cap.
    // Slightly matte plastic finish so the cap is distinguishable from the
    // post material when looked at closely, but it never reads as a separate
    // black "shoe" on a white-framed product.
    color: frameHex,
    metalness: 0.05,
    roughness: 0.85,
  });

  let postMat = frame;
  if (opts.perforated) {
    const baseTex = makeSlotPostTexture(frameHex);
    const tex = baseTex.clone();
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    postMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: tex,
      metalness: isWhiteFrame ? 0.1 : 0.2,
      roughness: isWhiteFrame ? 0.62 : 0.55,
    });
  }
  return { frame, board, foot, postMat, frameHex };
}

/* Posts run from y=0 to y=h.
   - SPEEDRACK (opts.perforated + opts.postMat with a hole map):
       built as an L-shaped angle-steel profile (two thin flanges) with
       the punched-hole texture on the visible faces.
   - HOMEDANT HOUSE (no postMat map): a simple square box post.
   The L is oriented so its corner points toward the booth interior's
   outer corner, i.e. the two flanges face outward — exactly how angle
   posts sit on a real rack.                                            */
function addPosts(group, w, d, h, mat, postSize = 0.025, opts = {}) {
  const postMat = opts.postMat || mat;
  const isAngle = !!(opts.postMat && opts.postMat.map);

  // vertical UV repeat for the hole texture (1 hole-pair per ~50mm)
  if (postMat.map) {
    postMat.map.repeat.set(1, Math.max(3, Math.round(h * 20)));
    postMat.map.needsUpdate = true;
  }

  // four corner positions + which way the L-corner faces (sign of x,z)
  const corners = [
    { x: -w / 2 + postSize / 2, z: -d / 2 + postSize / 2, sx: -1, sz: -1 },
    { x: w / 2 - postSize / 2, z: -d / 2 + postSize / 2, sx: 1, sz: -1 },
    { x: -w / 2 + postSize / 2, z: d / 2 - postSize / 2, sx: -1, sz: 1 },
    { x: w / 2 - postSize / 2, z: d / 2 - postSize / 2, sx: 1, sz: 1 },
  ];

  if (isAngle) {
    // L-profile: two thin flanges. flangeT = steel thickness (thin!),
    // flangeW = how wide each leg of the L is.
    const flangeT = postSize * 0.3;
    const flangeW = postSize;
    const legGeoX = new THREE.BoxGeometry(flangeW, h, flangeT); // runs along x
    const legGeoZ = new THREE.BoxGeometry(flangeT, h, flangeW); // runs along z
    corners.forEach((c) => {
      // leg A: lies along X, pushed to the outer Z edge
      const a = new THREE.Mesh(legGeoX, postMat);
      a.position.set(c.x, h / 2, c.z + c.sz * (postSize / 2 - flangeT / 2));
      a.castShadow = true;
      a.receiveShadow = true;
      group.add(a);
      // leg B: lies along Z, pushed to the outer X edge
      const b = new THREE.Mesh(legGeoZ, postMat);
      b.position.set(c.x + c.sx * (postSize / 2 - flangeT / 2), h / 2, c.z);
      b.castShadow = true;
      b.receiveShadow = true;
      group.add(b);
    });
  } else {
    // HOMEDANT HOUSE — smooth square post, no holes
    const geo = new THREE.BoxGeometry(postSize, h, postSize);
    corners.forEach((c) => {
      const m = new THREE.Mesh(geo, postMat);
      m.position.set(c.x, h / 2, c.z);
      m.castShadow = true;
      m.receiveShadow = true;
      group.add(m);
    });
  }
}

/* Post end-cap — a flush plastic cap that sits at the very bottom of each
   post. Same cross-section as the post (no protrusion beyond the post
   silhouette), and the same color as the frame (set in makeMaterials).
   8 mm tall — visible as a thin sleeve when zoomed in, invisible from a
   distance, exactly like real shelving caps.                            */
function addPostFeet(group, w, d, footMat, postSize = 0.025) {
  const footW = postSize; // flush fit — matches post width
  const footH = 0.008; // 8 mm — thin sleeve
  const footD = postSize; // flush fit — matches post depth
  const geo = new THREE.BoxGeometry(footW, footH, footD);
  const positions = [
    [-w / 2 + postSize / 2, footH / 2, -d / 2 + postSize / 2],
    [w / 2 - postSize / 2, footH / 2, -d / 2 + postSize / 2],
    [-w / 2 + postSize / 2, footH / 2, d / 2 - postSize / 2],
    [w / 2 - postSize / 2, footH / 2, d / 2 - postSize / 2],
  ];
  positions.forEach((p) => {
    const m = new THREE.Mesh(geo, footMat);
    m.position.set(p[0], p[1], p[2]);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  });
}

/* ── Render ONE shelf level: 4 perimeter support beams + board on top.
   The beams form the metal frame the board physically rests on. This is
   the most visually-defining structural element of every shelf product.
   Beam top = board bottom, beam outer face aligned with the board edge,
   so from outside you see the beam as a horizontal "lip" beneath the
   board. */
function addBoardWithBeams(
  group,
  w,
  d,
  yBoardCenter,
  boardMat,
  frameMat,
  opts = {}
) {
  const {
    postSize = 0.025,
    thickness = 0.009,
    beamH = 0.03,
    beamW = 0.018,
  } = opts;

  const boardW = w - postSize * 2;
  const boardD = d - postSize * 2;
  // beam center y: directly below the board
  const yLevel = yBoardCenter - thickness / 2 - beamH / 2;

  // Front + back beams span the full inner width
  const fbGeo = new THREE.BoxGeometry(boardW, beamH, beamW);
  // Left + right beams span what's left between the front/back beams,
  // so the corners meet flush instead of overlapping
  const lrGeo = new THREE.BoxGeometry(beamW, beamH, boardD - beamW * 2);

  const zFront = d / 2 - postSize - beamW / 2;
  const zBack = -d / 2 + postSize + beamW / 2;
  const xLeft = -w / 2 + postSize + beamW / 2;
  const xRight = w / 2 - postSize - beamW / 2;

  const beams = [
    [0, yLevel, zFront, fbGeo],
    [0, yLevel, zBack, fbGeo],
    [xLeft, yLevel, 0, lrGeo],
    [xRight, yLevel, 0, lrGeo],
  ];
  for (const [bx, by, bz, geo] of beams) {
    const m = new THREE.Mesh(geo, frameMat);
    m.position.set(bx, by, bz);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  }

  // Board sits ON TOP of the 4 beams
  const boardGeo = new THREE.BoxGeometry(boardW, thickness, boardD);
  const board = new THREE.Mesh(boardGeo, boardMat);
  board.position.set(0, yBoardCenter, 0);
  board.castShadow = true;
  board.receiveShadow = true;
  group.add(board);
}

function addTierBoards(group, w, d, h, tiers, boardMat, opts = {}) {
  const {
    skipBottom = false,
    postSize = 0.025,
    thickness = 0.009,
    bottomLift = 0.008,
    beamH = 0.03,
    beamW = 0.018,
    frameMat = boardMat,
  } = opts;
  // Bottom board top = bottomLift + beamH + thickness  (just above foot caps)
  // Top board top   = h
  const yBoardBottom = bottomLift + beamH + thickness / 2;
  const yBoardTop = h - thickness / 2;
  const start = skipBottom ? 1 : 0;
  for (let i = start; i < tiers; i++) {
    let y;
    if (tiers === 1) y = yBoardTop;
    else if (i === 0) y = yBoardBottom;
    else y = yBoardBottom + (i / (tiers - 1)) * (yBoardTop - yBoardBottom);
    addBoardWithBeams(group, w, d, y, boardMat, frameMat, {
      postSize,
      thickness,
      beamH,
      beamW,
    });
  }
}

function buildShelf(group, p, tpl) {
  const w = p.width * MM_TO_M,
    d = p.depth * MM_TO_M,
    h = p.height * MM_TO_M;
  const perforated = tpl.brand === 'SPEEDRACK';
  const mats = makeMaterials(p, { perforated });
  addPosts(group, w, d, h, mats.frame, 0.025, { postMat: mats.postMat });
  const skipBottom = tpl.type === 'open_base';
  addTierBoards(group, w, d, h, p.tier || tpl.defaultTier, mats.board, {
    skipBottom,
    frameMat: mats.frame,
  });
  addPostFeet(group, w, d, mats.foot, 0.025);
}

function buildGarmentRack(group, p, tpl) {
  const w = p.width * MM_TO_M,
    d = p.depth * MM_TO_M,
    h = p.height * MM_TO_M;
  const perforated = tpl.brand === 'SPEEDRACK';
  const mats = makeMaterials(p, { perforated });
  addPosts(group, w, d, h, mats.frame, 0.025, { postMat: mats.postMat });
  // tier boards (1-2 typically)
  addTierBoards(group, w, d, h, p.tier || tpl.defaultTier, mats.board, {
    frameMat: mats.frame,
  });
  // hanger bar — sits just below the top board so clothes hang from the
  // top of the rack like a real garment rack (was floating mid-height).
  const barGeo = new THREE.CylinderGeometry(0.012, 0.012, w - 0.06, 12);
  const bar = new THREE.Mesh(barGeo, mats.frame);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, h - 0.1, 0); // ~100mm under the top board
  bar.castShadow = true;
  group.add(bar);
  // two short drop brackets connecting the bar up to the top board
  const dropGeo = new THREE.BoxGeometry(0.012, 0.085, 0.012);
  [-(w / 2) + 0.1, w / 2 - 0.1].forEach((bx) => {
    const drop = new THREE.Mesh(dropGeo, mats.frame);
    drop.position.set(bx, h - 0.055, 0);
    group.add(drop);
  });
  addPostFeet(group, w, d, mats.foot, 0.025);
}

function buildRolling(group, p, tpl) {
  const w = p.width * MM_TO_M,
    d = p.depth * MM_TO_M,
    h = p.height * MM_TO_M;
  const wheelR = 0.04;
  const perforated = tpl.brand === 'SPEEDRACK';
  const mats = makeMaterials(p, { perforated });
  // shift everything up by wheelR*2
  const inner = new THREE.Group();
  inner.position.y = wheelR * 2;
  addPosts(inner, w, d, h, mats.frame, 0.025, { postMat: mats.postMat });
  addTierBoards(inner, w, d, h, p.tier || tpl.defaultTier, mats.board, {
    frameMat: mats.frame,
  });
  group.add(inner);
  // wheels
  const wheelGeo = new THREE.CylinderGeometry(wheelR, wheelR, 0.025, 16);
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.6,
  });
  const wheelOffset = 0.04;
  [
    [-w / 2 + wheelOffset, wheelR, -d / 2 + wheelOffset],
    [w / 2 - wheelOffset, wheelR, -d / 2 + wheelOffset],
    [-w / 2 + wheelOffset, wheelR, d / 2 - wheelOffset],
    [w / 2 - wheelOffset, wheelR, d / 2 - wheelOffset],
  ].forEach((pos) => {
    const wm = new THREE.Mesh(wheelGeo, wheelMat);
    wm.rotation.z = Math.PI / 2;
    wm.position.set(pos[0], pos[1], pos[2]);
    group.add(wm);
  });
}

/* --- Curtain fabric texture: vertical pleats / drape shading ---
   Produces the soft pleated look of a real pipe-and-drape booth curtain
   (matches the reference photo). Cached as one shared texture; callers
   clone it and set repeat to suit each panel's width.                  */
let _curtainTex = null;
function makeCurtainTexture() {
  if (_curtainTex) return _curtainTex;
  const W = 256,
    H = 256;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d');

  // base fabric tone — a neutral warm grey like the reference drape
  ctx.fillStyle = '#9a9893';
  ctx.fillRect(0, 0, W, H);

  // vertical pleats: alternating light/shadow bands down the fabric
  const pleats = 18;
  const pw = W / pleats;
  for (let i = 0; i < pleats; i++) {
    const x = i * pw;
    // each pleat = a soft gradient from shadow (fold) to highlight (crest)
    const g = ctx.createLinearGradient(x, 0, x + pw, 0);
    g.addColorStop(0.0, 'rgba(60,58,55,0.55)'); // deep fold
    g.addColorStop(0.35, 'rgba(255,255,255,0.10)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.22)'); // crest highlight
    g.addColorStop(0.65, 'rgba(255,255,255,0.10)');
    g.addColorStop(1.0, 'rgba(60,58,55,0.55)'); // deep fold
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, pw, H);
  }

  // faint horizontal weave noise so the fabric isn't perfectly smooth
  const img = ctx.getImageData(0, 0, W, H);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    img.data[i] = Math.max(0, Math.min(255, img.data[i] + n));
    img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n));
    img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  _curtainTex = tex;
  return tex;
}

/* --- Pegboard panel texture: regular grid of small holes --- */
let _pegTexCache = {};
function makePegboardTexture(isBlack) {
  const key = isBlack ? 'b' : 'w';
  if (_pegTexCache[key]) return _pegTexCache[key];
  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const ctx = cv.getContext('2d');
  // panel base color
  ctx.fillStyle = isBlack ? '#303033' : '#e4e4e4';
  ctx.fillRect(0, 0, S, S);
  // grid of holes — 8x8 per tile
  const n = 8,
    pitch = S / n;
  ctx.fillStyle = isBlack ? 'rgba(0,0,0,0.92)' : 'rgba(120,120,120,0.85)';
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      ctx.beginPath();
      ctx.arc(
        pitch * (i + 0.5),
        pitch * (j + 0.5),
        pitch * 0.18,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  _pegTexCache[key] = tex;
  return tex;
}

function buildPegboard(group, p, tpl) {
  const w = p.width * MM_TO_M,
    d = p.depth * MM_TO_M,
    h = p.height * MM_TO_M;
  const perforated = tpl.brand === 'SPEEDRACK';
  const mats = makeMaterials(p, { perforated });
  addPosts(group, w, d, h, mats.frame, 0.025, { postMat: mats.postMat });
  addTierBoards(group, w, d, h, p.tier || tpl.defaultTier, mats.board, {
    frameMat: mats.frame,
  });

  // --- pegboard panels mounted in the back, one per open bay ---
  const isBlack = p.frameColor === 'black';
  const pegTex = makePegboardTexture(isBlack).clone();
  pegTex.wrapS = pegTex.wrapT = THREE.RepeatWrapping;
  pegTex.needsUpdate = true;
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: pegTex,
    metalness: 0.25,
    roughness: 0.7,
  });

  const tiers = p.tier || tpl.defaultTier;
  // place a pegboard panel in each gap between consecutive boards
  const panelW = w - 0.07;
  const bayCount = Math.max(1, tiers - 1);
  // repeat the hole texture proportionally to the panel size
  pegTex.repeat.set(
    Math.max(2, Math.round(panelW * 6)),
    Math.max(2, Math.round((h / bayCount) * 6))
  );

  const yBottom = 0.05;
  const yTop = h - 0.05;
  for (let i = 0; i < bayCount; i++) {
    const y0 = yBottom + (i / bayCount) * (yTop - yBottom);
    const y1 = yBottom + ((i + 1) / bayCount) * (yTop - yBottom);
    const bayH = y1 - y0 - 0.04;
    const panelGeo = new THREE.BoxGeometry(panelW, bayH, 0.006);
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(0, (y0 + y1) / 2, -d / 2 + 0.022);
    panel.castShadow = true;
    panel.receiveShadow = true;
    group.add(panel);
  }
  addPostFeet(group, w, d, mats.foot, 0.025);
}

function buildDrawer(group, p, tpl) {
  const w = p.width * MM_TO_M,
    d = p.depth * MM_TO_M,
    h = p.height * MM_TO_M;
  const perforated = tpl.brand === 'SPEEDRACK';
  const mats = makeMaterials(p, { perforated });
  addPosts(group, w, d, h, mats.frame, 0.025, { postMat: mats.postMat });
  // Drawer shelf has NO middle/bottom boards — only ONE board at the very
  // top (with its 4-side support beams). The drawers below act as the
  // structure, and the bottom of the lowest drawer serves as the base.
  addBoardWithBeams(group, w, d, h - 0.009 / 2, mats.board, mats.frame);

  // --- metal drawer stack in the lower half ---
  // Three stacked steel drawers with recessed fronts + handle bars,
  // so it reads as a real drawer unit rather than plain boxes.
  const drawerCount = 3;
  // shelf section : drawer section = 5 : 2  → drawers occupy 2/7 of height
  const stackTop = h * (2 / 7); // drawers occupy lower 2/7
  const stackBot = 0.02; // sit closer to the ground
  const stackH = stackTop - stackBot;
  const drawerH = stackH / drawerCount;
  const bodyW = w - 0.06;
  const bodyD = d - 0.06;

  // drawer color follows the frame: white frame → matte white drawers,
  // black frame → matte black drawers. Low metalness + high roughness
  // keeps it a flat matte paint finish (not shiny steel) either way.
  const isWhite = p.frameColor === 'white';
  const drawerBodyHex = isWhite ? 0xffffff : 0x2a2a2e; // matches FRAME_COLORS
  const drawerFrontHex = isWhite ? 0xffffff : 0x2a2a2e;
  const drawerBodyMat = new THREE.MeshStandardMaterial({
    color: drawerBodyHex,
    metalness: 0.05,
    roughness: 0.85,
  });
  const drawerFrontMat = new THREE.MeshStandardMaterial({
    color: drawerFrontHex,
    metalness: 0.05,
    roughness: 0.82,
  });
  const handleMat = new THREE.MeshStandardMaterial({
    color: isWhite ? 0xbdbdbd : 0x8a8a8a,
    metalness: 0.45,
    roughness: 0.5,
  });

  for (let i = 0; i < drawerCount; i++) {
    const yc = stackBot + drawerH * (i + 0.5);
    // drawer body — fills the full drawer height so there is NO gap
    // between stacked drawers (only inset on width/depth, not height)
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(bodyW - 0.02, drawerH, bodyD - 0.02),
      drawerBodyMat
    );
    body.position.set(0, yc, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    // raised front panel — also full drawer height, drawers touch flush
    const front = new THREE.Mesh(
      new THREE.BoxGeometry(bodyW, drawerH, 0.014),
      drawerFrontMat
    );
    front.position.set(0, yc, d / 2 - 0.03);
    front.castShadow = true;
    group.add(front);
    // handle bar across the front
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.007, bodyW * 0.45, 10),
      handleMat
    );
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, yc + drawerH * 0.18, d / 2 - 0.02);
    group.add(handle);
    // two small handle stand-offs
    [-bodyW * 0.22, bodyW * 0.22].forEach((hx) => {
      const sx = new THREE.Mesh(
        new THREE.BoxGeometry(0.01, 0.01, 0.012),
        handleMat
      );
      sx.position.set(hx, yc + drawerH * 0.18, d / 2 - 0.028);
      group.add(sx);
    });
  }
  addPostFeet(group, w, d, mats.foot, 0.025);
}

function buildCabinet(group, p, tpl) {
  const w = p.width * MM_TO_M,
    d = p.depth * MM_TO_M,
    h = p.height * MM_TO_M;
  const perforated = tpl.brand === 'SPEEDRACK';
  const mats = makeMaterials(p, { perforated });
  addPosts(group, w, d, h, mats.frame, 0.025, { postMat: mats.postMat });

  // The upper section stays open shelving. The cabinet occupies the
  // lower ~30% with a 2-sliding-door front + wood side panels.
  const tiers = p.tier || tpl.defaultTier;
  // Render the tier boards but skip the very bottom (cabinet sits there).
  addTierBoards(group, w, d, h, tiers, mats.board, {
    skipBottom: true,
    frameMat: mats.frame,
  });

  // --- lower cabinet box ---
  const cabH = h * 0.3;
  const cabTopY = cabH; // top of the cabinet
  const bodyW = w - 0.05;
  const bodyD = d - 0.05;

  // door color rule: white frame -> mint, black frame -> dark green
  const isWhite = p.frameColor === 'white';
  const doorColor = isWhite ? 0x9fd8cf : 0x4f6b4a; // mint / dark green
  const doorMat = new THREE.MeshStandardMaterial({
    color: doorColor,
    metalness: 0.15,
    roughness: 0.55,
  });
  // wood side panels (use the shared wood texture for consistency)
  const sideMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.05,
    roughness: 0.7,
  });
  {
    const wt = makeWoodTexture().clone();
    wt.wrapS = wt.wrapT = THREE.RepeatWrapping;
    wt.repeat.set(1, 1);
    wt.anisotropy = 8;
    wt.needsUpdate = true;
    sideMat.map = wt;
  }

  // cabinet top board (wood) — gives the "tabletop" surface
  const topGeo = new THREE.BoxGeometry(bodyW, 0.014, bodyD);
  const topBoard = new THREE.Mesh(topGeo, mats.board);
  topBoard.position.set(0, cabTopY - 0.007, 0);
  topBoard.castShadow = true;
  topBoard.receiveShadow = true;
  group.add(topBoard);

  // two wood side panels
  const sideGeo = new THREE.BoxGeometry(0.014, cabH - 0.02, bodyD);
  [-bodyW / 2 + 0.007, bodyW / 2 - 0.007].forEach((sx) => {
    const s = new THREE.Mesh(sideGeo, sideMat);
    s.position.set(sx, cabH / 2, 0);
    s.castShadow = true;
    s.receiveShadow = true;
    group.add(s);
  });

  // back panel (frame colour)
  const backGeo = new THREE.BoxGeometry(bodyW - 0.028, cabH - 0.02, 0.01);
  const back = new THREE.Mesh(backGeo, mats.frame);
  back.position.set(0, cabH / 2, -bodyD / 2 + 0.006);
  group.add(back);

  // two sliding doors on the front, slightly overlapping in the middle
  const doorW = (bodyW - 0.028) / 2 + 0.012;
  const doorH = cabH - 0.045;
  const doorGeo = new THREE.BoxGeometry(doorW, doorH, 0.012);
  const doorL = new THREE.Mesh(doorGeo, doorMat);
  doorL.position.set(-bodyW / 4 + 0.006, cabH / 2, bodyD / 2 - 0.01);
  doorL.castShadow = true;
  group.add(doorL);
  const doorR = new THREE.Mesh(doorGeo, doorMat);
  doorR.position.set(bodyW / 4 - 0.006, cabH / 2, bodyD / 2 - 0.022);
  doorR.castShadow = true;
  group.add(doorR);

  // small round door handles
  const handleMat = new THREE.MeshStandardMaterial({
    color: isWhite ? 0x888888 : 0x111111,
    metalness: 0.6,
    roughness: 0.4,
  });
  const hGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.012, 12);
  const h1 = new THREE.Mesh(hGeo, handleMat);
  h1.rotation.x = Math.PI / 2;
  h1.position.set(-0.03, cabH / 2, bodyD / 2 - 0.002);
  group.add(h1);
  const h2 = new THREE.Mesh(hGeo, handleMat);
  h2.rotation.x = Math.PI / 2;
  h2.position.set(0.03, cabH / 2, bodyD / 2 - 0.014);
  group.add(h2);

  addPostFeet(group, w, d, mats.foot, 0.025);
}

function buildFrameOpen(group, p, tpl) {
  // washing machine shelf - basically a frame around an open space
  const w = p.width * MM_TO_M,
    d = p.depth * MM_TO_M,
    h = p.height * MM_TO_M;
  const perforated = tpl.brand === 'SPEEDRACK';
  const mats = makeMaterials(p, { perforated });
  addPosts(group, w, d, h, mats.frame, 0.025, { postMat: mats.postMat });
  // top board only + maybe a middle/lower shelf, all with 4-side support beams
  const tiers = p.tier || tpl.defaultTier;
  if (tiers >= 1) {
    addBoardWithBeams(group, w, d, h - 0.009, mats.board, mats.frame);
  }
  if (tiers >= 2) {
    addBoardWithBeams(group, w, d, h * 0.6, mats.board, mats.frame);
  }
  if (tiers >= 3) {
    addBoardWithBeams(group, w, d, h * 0.3, mats.board, mats.frame);
  }
  addPostFeet(group, w, d, mats.foot, 0.025);
}

function buildHeavy(group, p, tpl) {
  // similar to shelf but thicker posts and thicker support beams
  const w = p.width * MM_TO_M,
    d = p.depth * MM_TO_M,
    h = p.height * MM_TO_M;
  const perforated = tpl.brand === 'SPEEDRACK';
  const mats = makeMaterials(p, { perforated });
  addPosts(group, w, d, h, mats.frame, 0.04, { postMat: mats.postMat });
  addTierBoards(group, w, d, h, p.tier || tpl.defaultTier, mats.board, {
    postSize: 0.04,
    thickness: 0.013,
    beamH: 0.045,
    beamW: 0.028,
    frameMat: mats.frame,
  });
  addPostFeet(group, w, d, mats.foot, 0.04);
}

function buildBanner(group, p) {
  const w = p.width * MM_TO_M,
    h = p.height * MM_TO_M;
  // base
  const baseGeo = new THREE.BoxGeometry(w, 0.04, p.depth * MM_TO_M);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.6,
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.set(0, 0.02, 0);
  group.add(base);
  // banner panel
  const bGeo = new THREE.BoxGeometry(w, h - 0.04, 0.01);
  const bMat = new THREE.MeshStandardMaterial({
    color: 0xd64545,
    roughness: 0.7,
  });
  const banner = new THREE.Mesh(bGeo, bMat);
  banner.position.set(0, (h - 0.04) / 2 + 0.04, 0);
  group.add(banner);
}

function buildPoster(group, p) {
  const w = p.width * MM_TO_M,
    h = p.height * MM_TO_M,
    d = p.depth * MM_TO_M;
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.5,
  });
  const paperMat = new THREE.MeshStandardMaterial({
    color: 0xfafafa,
    roughness: 0.85,
  });
  // 2 legs
  const legGeo = new THREE.BoxGeometry(0.04, h, 0.04);
  const l1 = new THREE.Mesh(legGeo, frameMat);
  l1.position.set(-w / 2 + 0.02, h / 2, 0);
  group.add(l1);
  const l2 = new THREE.Mesh(legGeo, frameMat);
  l2.position.set(w / 2 - 0.02, h / 2, 0);
  group.add(l2);
  // poster panel
  const pGeo = new THREE.BoxGeometry(w - 0.05, h * 0.85, Math.max(d, 0.02));
  const poster = new THREE.Mesh(pGeo, paperMat);
  poster.position.set(0, h * 0.5, 0);
  group.add(poster);
}

function buildTable(group, p) {
  const w = p.width * MM_TO_M,
    h = p.height * MM_TO_M,
    d = p.depth * MM_TO_M;
  const legMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.5,
    roughness: 0.5,
  });
  const topMat = new THREE.MeshStandardMaterial({
    color: BOARD_COLORS[p.boardColor] || 0xa07853,
    roughness: 0.8,
  });
  const legSize = 0.04;
  const legGeo = new THREE.BoxGeometry(legSize, h - 0.03, legSize);
  const positions = [
    [-w / 2 + legSize, (h - 0.03) / 2, -d / 2 + legSize],
    [w / 2 - legSize, (h - 0.03) / 2, -d / 2 + legSize],
    [-w / 2 + legSize, (h - 0.03) / 2, d / 2 - legSize],
    [w / 2 - legSize, (h - 0.03) / 2, d / 2 - legSize],
  ];
  positions.forEach((pos) => {
    const m = new THREE.Mesh(legGeo, legMat);
    m.position.set(pos[0], pos[1], pos[2]);
    group.add(m);
  });
  const topGeo = new THREE.BoxGeometry(w, 0.03, d);
  const top = new THREE.Mesh(topGeo, topMat);
  top.position.set(0, h - 0.015, 0);
  group.add(top);
}

function buildChair(group, p) {
  const w = p.width * MM_TO_M,
    h = p.height * MM_TO_M,
    d = p.depth * MM_TO_M;
  const seatH = h * 0.5;
  const mat = new THREE.MeshStandardMaterial({
    color: p.boardColor === 'white' ? 0xeeeeee : 0x222222,
    roughness: 0.7,
  });
  const legGeo = new THREE.BoxGeometry(0.03, seatH, 0.03);
  [
    [-w / 2 + 0.04, seatH / 2, -d / 2 + 0.04],
    [w / 2 - 0.04, seatH / 2, -d / 2 + 0.04],
    [-w / 2 + 0.04, seatH / 2, d / 2 - 0.04],
    [w / 2 - 0.04, seatH / 2, d / 2 - 0.04],
  ].forEach((pos) => {
    const m = new THREE.Mesh(legGeo, mat);
    m.position.set(pos[0], pos[1], pos[2]);
    group.add(m);
  });
  const seatGeo = new THREE.BoxGeometry(w, 0.04, d);
  const seat = new THREE.Mesh(seatGeo, mat);
  seat.position.set(0, seatH + 0.02, 0);
  group.add(seat);
  const backGeo = new THREE.BoxGeometry(w, h - seatH, 0.04);
  const back = new THREE.Mesh(backGeo, mat);
  back.position.set(0, seatH + (h - seatH) / 2, -d / 2 + 0.02);
  group.add(back);
}

function buildCatalogStand(group, p) {
  const w = p.width * MM_TO_M,
    h = p.height * MM_TO_M,
    d = p.depth * MM_TO_M;
  const mat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.5,
    roughness: 0.5,
  });
  const baseMat = new THREE.MeshStandardMaterial({
    color: BOARD_COLORS[p.boardColor] || 0xa07853,
    roughness: 0.7,
  });
  // base
  const baseGeo = new THREE.BoxGeometry(w, 0.03, d);
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.set(0, 0.015, 0);
  group.add(base);
  // pole
  const poleGeo = new THREE.CylinderGeometry(0.02, 0.02, h - 0.03, 12);
  const pole = new THREE.Mesh(poleGeo, mat);
  pole.position.set(0, (h - 0.03) / 2 + 0.03, 0);
  group.add(pole);
  // 3 angled trays
  const trayGeo = new THREE.BoxGeometry(w * 0.85, 0.02, d * 0.7);
  for (let i = 0; i < 3; i++) {
    const tray = new THREE.Mesh(trayGeo, baseMat);
    tray.position.set(0, h * (0.4 + i * 0.2), 0);
    tray.rotation.x = -Math.PI / 12;
    group.add(tray);
  }
}

function buildTVStand(group, p) {
  const w = p.width * MM_TO_M,
    h = p.height * MM_TO_M,
    d = p.depth * MM_TO_M;
  const standMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.4,
    roughness: 0.6,
  });
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.2,
    roughness: 0.3,
  });
  // base
  const baseGeo = new THREE.BoxGeometry(w * 0.6, 0.04, d);
  const base = new THREE.Mesh(baseGeo, standMat);
  base.position.set(0, 0.02, 0);
  group.add(base);
  // pole
  const poleGeo = new THREE.BoxGeometry(0.06, h * 0.4, 0.06);
  const pole = new THREE.Mesh(poleGeo, standMat);
  pole.position.set(0, h * 0.2 + 0.04, 0);
  group.add(pole);
  // screen
  const screenGeo = new THREE.BoxGeometry(w, h * 0.55, 0.05);
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, h * 0.7, 0);
  group.add(screen);
}

function buildProductMesh(p, tpl) {
  const group = new THREE.Group();
  switch (tpl.type) {
    case 'shelf':
      buildShelf(group, p, tpl);
      break;
    case 'open_base':
      buildShelf(group, p, tpl);
      break;
    case 'heavy':
      buildHeavy(group, p, tpl);
      break;
    case 'frame_open':
      buildFrameOpen(group, p, tpl);
      break;
    case 'garment':
      buildGarmentRack(group, p, tpl);
      break;
    case 'rolling':
      buildRolling(group, p, tpl);
      break;
    case 'pegboard':
      buildPegboard(group, p, tpl);
      break;
    case 'drawer':
      buildDrawer(group, p, tpl);
      break;
    case 'cabinet':
      buildCabinet(group, p, tpl);
      break;
    case 'banner':
      buildBanner(group, p);
      break;
    case 'poster':
      buildPoster(group, p);
      break;
    case 'table':
      buildTable(group, p);
      break;
    case 'chair':
      buildChair(group, p);
      break;
    case 'catalog':
      buildCatalogStand(group, p);
      break;
    case 'tv':
      buildTVStand(group, p);
      break;
    default:
      buildShelf(group, p, tpl);
  }
  return group;
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function BoothSimulator() {
  // ----- state -----
  const [booth, setBooth] = useState({
    width: 6096, // 20ft in mm  (10ft x 20ft default)
    depth: 3048, // 10ft in mm
    wallHeight: 2438, // 8ft in mm
    unit: 'ft',
    style: 'wall', // 'wall' = solid panel booth, 'curtain' = curtain booth
  });
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeBrand, setActiveBrand] = useState('SPEEDRACK');
  const [viewMode, setViewMode] = useState('3d');
  const [warnings, setWarnings] = useState({}); // instanceId -> reason
  // current 배치 이름 (used in exported PNG filenames)
  const [layoutName, setLayoutName] = useState('layout1');
  // saved designs library (persisted in localStorage)
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [showLibrary, setShowLibrary] = useState(false);
  // id of the design currently being worked on (null = never saved yet).
  // Lets Ctrl+S overwrite the same library entry instead of always adding.
  const [currentDesignId, setCurrentDesignId] = useState(null);
  // brief "Saved ✓" confirmation shown after a save
  const [saveStatus, setSaveStatus] = useState('');

  // ----- refs (Three.js handles) -----
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const boothGroupRef = useRef(null);
  const productsGroupRef = useRef(null);
  const meshMapRef = useRef(new Map()); // instanceId -> THREE.Group
  const dragRef = useRef(null);
  const animationIdRef = useRef(null);
  const productsRef = useRef(products);
  const selectedRef = useRef(selectedId);
  // always-current ref to saveDesign, so the Ctrl+S listener (bound once)
  // calls the latest version with up-to-date state
  const saveDesignRef = useRef(null);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);
  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);

  /* ---------- Three.js init ---------- */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      200
    );
    camera.position.set(8, 6, 8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // lights
    const amb = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 0.85);
    dir.position.set(8, 14, 6);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.left = -15;
    dir.shadow.camera.right = 15;
    dir.shadow.camera.top = 15;
    dir.shadow.camera.bottom = -15;
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0xffffff, 0.25);
    fill.position.set(-6, 8, -6);
    scene.add(fill);

    // groups
    const boothGroup = new THREE.Group();
    scene.add(boothGroup);
    boothGroupRef.current = boothGroup;

    const productsGroup = new THREE.Group();
    scene.add(productsGroup);
    productsGroupRef.current = productsGroup;

    // ---- simple orbit controls ----
    const controls = createOrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;

    // resize
    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth,
        h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // cleanup
    return () => {
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      if (mount.contains(renderer.domElement))
        mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  /* ---------- rebuild booth on change ---------- */
  useEffect(() => {
    const group = boothGroupRef.current;
    if (!group) return;
    while (group.children.length) {
      const c = group.children[0];
      group.remove(c);
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
        else c.material.dispose();
      }
    }
    const w = booth.width * MM_TO_M;
    const d = booth.depth * MM_TO_M;
    const wh = booth.wallHeight * MM_TO_M;

    // floor
    const floorGeo = new THREE.PlaneGeometry(w, d);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xfafafa,
      roughness: 0.95,
      metalness: 0,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.userData.isFloor = true;
    group.add(floor);

    // grid
    const grid = new THREE.GridHelper(
      Math.max(w, d),
      Math.round(Math.max(w, d) * 2),
      0xcccccc,
      0xe5e5e5
    );
    grid.position.y = 0.001;
    group.add(grid);

    if (booth.style === 'curtain') {
      // ---- CURTAIN BOOTH (pipe & drape) ----
      // Matches a real inline curtain booth: a TALL back curtain (full
      // wall height) and SHORT side curtains (~3ft vs 8ft = ~0.375 of
      // the back height), each on its own pipe frame.
      const poleMat = new THREE.MeshStandardMaterial({
        color: 0x9aa0a6,
        roughness: 0.5,
        metalness: 0.6,
      });
      const poleR = 0.025;
      const railR = 0.018;
      const sideH = wh * 0.375; // 3ft side rail vs 8ft back wall

      // --- back frame: 2 tall poles + top rail ---
      [[-w / 2], [w / 2]].forEach(([cx]) => {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(poleR, poleR, wh, 12),
          poleMat
        );
        pole.position.set(cx, wh / 2, -d / 2);
        pole.castShadow = true;
        group.add(pole);
      });
      const backRail = new THREE.Mesh(
        new THREE.CylinderGeometry(railR, railR, w, 12),
        poleMat
      );
      backRail.rotation.z = Math.PI / 2;
      backRail.position.set(0, wh - railR, -d / 2);
      group.add(backRail);

      // --- side frames: 2 short front poles + 2 short side rails ---
      [[-w / 2], [w / 2]].forEach(([cx]) => {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(poleR, poleR, sideH, 12),
          poleMat
        );
        pole.position.set(cx, sideH / 2, d / 2); // front corner pole
        pole.castShadow = true;
        group.add(pole);
        // short side rail running front-to-back at the side height
        const sideRail = new THREE.Mesh(
          new THREE.CylinderGeometry(railR, railR, d, 12),
          poleMat
        );
        sideRail.rotation.x = Math.PI / 2;
        sideRail.position.set(cx, sideH - railR, 0);
        group.add(sideRail);
      });

      // --- curtain fabric material with pleated texture ---
      const makeCurtainMat = (panelW, panelH) => {
        const tex = makeCurtainTexture().clone();
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        // repeat horizontally so pleats stay a natural width (~0.5m each)
        tex.repeat.set(Math.max(2, Math.round(panelW / 0.5)), 1);
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        return new THREE.MeshStandardMaterial({
          map: tex,
          color: 0xffffff,
          roughness: 0.95,
          metalness: 0.0,
          side: THREE.DoubleSide,
        });
      };
      // geometry helper — a plane with soft in/out folds across its width
      const makeCurtainGeo = (cw, ch, segs) => {
        const geo = new THREE.PlaneGeometry(cw, ch, segs, 1);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const xx = pos.getX(i);
          const fold = Math.sin((xx / cw) * Math.PI * segs) * 0.025;
          pos.setZ(i, fold);
        }
        geo.computeVertexNormals();
        return geo;
      };

      // back curtain — full height
      const backH = wh - railR * 2;
      const backCurtain = new THREE.Mesh(
        makeCurtainGeo(w, backH, 16),
        makeCurtainMat(w, backH)
      );
      backCurtain.position.set(0, backH / 2 + railR, -d / 2);
      backCurtain.receiveShadow = true;
      group.add(backCurtain);

      // side curtains — short (3ft) height
      const sideCurtainH = sideH - railR * 2;
      [[-w / 2], [w / 2]].forEach(([sx]) => {
        const sideCurtain = new THREE.Mesh(
          makeCurtainGeo(d, sideCurtainH, 12),
          makeCurtainMat(d, sideCurtainH)
        );
        sideCurtain.rotation.y = Math.PI / 2;
        sideCurtain.position.set(sx, sideCurtainH / 2 + railR, 0);
        sideCurtain.receiveShadow = true;
        group.add(sideCurtain);
      });

      // brand strip — ID-sign valance across the top of the back curtain
      const valGeo = new THREE.BoxGeometry(w * 0.55, 0.22, 0.03);
      const valMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.7,
      });
      const valance = new THREE.Mesh(valGeo, valMat);
      valance.position.set(0, wh - 0.18, -d / 2 + 0.03);
      group.add(valance);
      // thin red accent line under the sign
      const accentGeo = new THREE.BoxGeometry(w * 0.55, 0.03, 0.035);
      const accentMat = new THREE.MeshStandardMaterial({
        color: 0xc62828,
        roughness: 0.7,
      });
      const accent = new THREE.Mesh(accentGeo, accentMat);
      accent.position.set(0, wh - 0.31, -d / 2 + 0.035);
      group.add(accent);
    } else {
      // ---- WALL BOOTH: solid panel walls (default) ----
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0xf5f5f5,
        roughness: 0.9,
        side: THREE.DoubleSide,
      });
      const wallThk = 0.05;
      // back wall (along +X)
      const backGeo = new THREE.BoxGeometry(w, wh, wallThk);
      const back = new THREE.Mesh(backGeo, wallMat);
      back.position.set(0, wh / 2, -d / 2);
      back.receiveShadow = true;
      group.add(back);
      // left wall
      const sideGeo = new THREE.BoxGeometry(wallThk, wh, d);
      const left = new THREE.Mesh(sideGeo, wallMat);
      left.position.set(-w / 2, wh / 2, 0);
      left.receiveShadow = true;
      group.add(left);
      // right wall
      const right = new THREE.Mesh(sideGeo, wallMat);
      right.position.set(w / 2, wh / 2, 0);
      right.receiveShadow = true;
      group.add(right);

      // brand strip (red accent on back wall top)
      const stripGeo = new THREE.BoxGeometry(w, 0.15, 0.06);
      const stripMat = new THREE.MeshStandardMaterial({
        color: 0xc62828,
        roughness: 0.7,
      });
      const strip = new THREE.Mesh(stripGeo, stripMat);
      strip.position.set(0, wh - 0.1, -d / 2 + 0.04);
      group.add(strip);
    }

    // recenter camera target on booth
    if (controlsRef.current) {
      controlsRef.current.target.set(0, wh * 0.3, 0);
      controlsRef.current.update();
    }
  }, [booth.width, booth.depth, booth.wallHeight, booth.style]);

  /* ---------- sync products meshes ---------- */
  useEffect(() => {
    const group = productsGroupRef.current;
    if (!group) return;
    const map = meshMapRef.current;

    const present = new Set(products.map((p) => p.instanceId));

    // remove gone
    for (const [id, mesh] of Array.from(map.entries())) {
      if (!present.has(id)) {
        group.remove(mesh);
        disposeGroup(mesh);
        map.delete(id);
      }
    }

    // add/update
    products.forEach((p) => {
      const tpl = PRODUCT_LIBRARY.find((t) => t.id === p.productId);
      if (!tpl) return;
      let mesh = map.get(p.instanceId);
      const fingerprint = `${p.width}-${p.depth}-${p.height}-${p.tier}-${p.frameColor}-${p.boardColor}`;
      if (!mesh || mesh.userData.fingerprint !== fingerprint) {
        if (mesh) {
          group.remove(mesh);
          disposeGroup(mesh);
        }
        mesh = buildProductMesh(p, tpl);
        mesh.userData.instanceId = p.instanceId;
        mesh.userData.fingerprint = fingerprint;
        // tag children for picking
        mesh.traverse((c) => {
          c.userData.instanceId = p.instanceId;
        });
        group.add(mesh);
        map.set(p.instanceId, mesh);
      }
      // update transform
      mesh.position.set(p.position.x, 0, p.position.z);
      mesh.rotation.y = ((p.rotation || 0) * Math.PI) / 180;
    });

    // compute warnings
    const w = (booth.width * MM_TO_M) / 2;
    const d = (booth.depth * MM_TO_M) / 2;
    const newWarn = {};
    products.forEach((p) => {
      const halfW =
        ((p.rotation % 180 === 0 ? p.width : p.depth) * MM_TO_M) / 2;
      const halfD =
        ((p.rotation % 180 === 0 ? p.depth : p.width) * MM_TO_M) / 2;
      // bounds check
      if (
        Math.abs(p.position.x) + halfW > w + 0.001 ||
        Math.abs(p.position.z) + halfD > d + 0.001
      ) {
        newWarn[p.instanceId] = 'out_of_bounds';
      }
    });
    // collisions (simple AABB)
    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        const a = products[i],
          b = products[j];
        const aw = ((a.rotation % 180 === 0 ? a.width : a.depth) * MM_TO_M) / 2;
        const ad = ((a.rotation % 180 === 0 ? a.depth : a.width) * MM_TO_M) / 2;
        const bw = ((b.rotation % 180 === 0 ? b.width : b.depth) * MM_TO_M) / 2;
        const bd = ((b.rotation % 180 === 0 ? b.depth : b.width) * MM_TO_M) / 2;
        const dx = Math.abs(a.position.x - b.position.x);
        const dz = Math.abs(a.position.z - b.position.z);
        if (dx < aw + bw - 0.005 && dz < ad + bd - 0.005) {
          newWarn[a.instanceId] = newWarn[a.instanceId] || 'overlap';
          newWarn[b.instanceId] = newWarn[b.instanceId] || 'overlap';
        }
      }
    }
    setWarnings(newWarn);
  }, [products, booth.width, booth.depth]);

  /* ---------- selection / warning highlight ---------- */
  useEffect(() => {
    const map = meshMapRef.current;
    map.forEach((mesh, id) => {
      const isSelected = id === selectedId;
      const hasWarn = !!warnings[id];
      // remove existing outline
      const existing = mesh.getObjectByName('__outline');
      if (existing) {
        mesh.remove(existing);
        existing.geometry.dispose();
        existing.material.dispose();
      }
      if (isSelected || hasWarn) {
        // Build the outline from the product's OWN width/depth/height in
        // local space, then add it as a child of the product group. Because
        // it's a child, it inherits the group's rotation.y automatically —
        // so the outline always stays aligned with the rotated product.
        const p = products.find((pr) => pr.instanceId === id);
        if (!p) return;
        const wM = p.width * MM_TO_M;
        const hM = p.height * MM_TO_M;
        const dM = p.depth * MM_TO_M;
        // small padding so the outline sits just outside the product
        const pad = 0.04;
        const geo = new THREE.BoxGeometry(wM + pad, hM + pad, dM + pad);
        const edges = new THREE.EdgesGeometry(geo);
        const color = hasWarn ? 0xdc2626 : 0x2563eb;
        const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
        const lines = new THREE.LineSegments(edges, mat);
        lines.name = '__outline';
        // product meshes are built with their base at y=0, so the box
        // (centered on its own origin) must be lifted by half the height
        lines.position.set(0, hM / 2, 0);
        mesh.add(lines);
        geo.dispose();
      }
    });
  }, [selectedId, warnings, products]);

  /* ---------- view mode handler ---------- */
  useEffect(() => {
    if (!controlsRef.current) return;
    const dist = Math.max(booth.width, booth.depth) * MM_TO_M * 1.2;
    controlsRef.current.setView(viewMode, dist);
  }, [viewMode, booth.width, booth.depth]);

  /* ---------- pointer handlers ---------- */
  const pickInstanceId = useCallback((event) => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const productsGroup = productsGroupRef.current;
    if (!renderer || !camera || !productsGroup) return null;
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    const ray = new THREE.Raycaster();
    ray.setFromCamera({ x, y }, camera);
    const hits = ray.intersectObjects(productsGroup.children, true);
    for (const h of hits) {
      let o = h.object;
      while (o) {
        if (o.userData && o.userData.instanceId) return o.userData.instanceId;
        o = o.parent;
      }
    }
    return null;
  }, []);

  const getFloorPoint = useCallback((event) => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!renderer || !camera) return null;
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    const ray = new THREE.Raycaster();
    ray.setFromCamera({ x, y }, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const point = new THREE.Vector3();
    ray.ray.intersectPlane(plane, point);
    return point;
  }, []);

  const onCanvasMouseDown = (e) => {
    if (e.button !== 0) return; // only left click for products
    const id = pickInstanceId(e);
    if (id) {
      setSelectedId(id);
      const product = productsRef.current.find((p) => p.instanceId === id);
      if (!product) return;
      const floorPt = getFloorPoint(e);
      if (!floorPt) return;
      dragRef.current = {
        instanceId: id,
        offsetX: product.position.x - floorPt.x,
        offsetZ: product.position.z - floorPt.z,
        startClientX: e.clientX,
        startClientY: e.clientY,
        moved: false,
      };
      controlsRef.current.enabled = false;
      e.stopPropagation();
    }
  };

  const onCanvasMouseMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = Math.abs(e.clientX - drag.startClientX);
    const dy = Math.abs(e.clientY - drag.startClientY);
    if (!drag.moved && dx + dy < 4) return;
    drag.moved = true;
    const floorPt = getFloorPoint(e);
    if (!floorPt) return;
    const newX = floorPt.x + drag.offsetX;
    const newZ = floorPt.z + drag.offsetZ;
    // live mesh update for smoothness
    const mesh = meshMapRef.current.get(drag.instanceId);
    if (mesh) {
      mesh.position.x = newX;
      mesh.position.z = newZ;
    }
    drag.lastX = newX;
    drag.lastZ = newZ;
  };

  const onCanvasMouseUp = () => {
    const drag = dragRef.current;
    if (drag) {
      if (drag.moved && drag.lastX !== undefined) {
        setProducts((prev) =>
          prev.map((p) =>
            p.instanceId === drag.instanceId
              ? { ...p, position: { x: drag.lastX, z: drag.lastZ } }
              : p
          )
        );
      }
      dragRef.current = null;
      if (controlsRef.current) controlsRef.current.enabled = true;
    }
  };

  // background click to deselect
  const onCanvasClick = (e) => {
    if (dragRef.current) return;
    const id = pickInstanceId(e);
    if (!id) setSelectedId(null);
  };

  /* ---------- product CRUD ---------- */
  const addProduct = useCallback(
    (tpl) => {
      const id = `p_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      // place near front-center of booth
      const placeX = 0;
      const placeZ =
        (booth.depth * MM_TO_M) / 2 -
        (tpl.defaultSize.depth * MM_TO_M) / 2 -
        0.3;
      const newProduct = {
        instanceId: id,
        productId: tpl.id,
        name: tpl.name,
        width: tpl.defaultSize.width,
        depth: tpl.defaultSize.depth,
        height: tpl.defaultSize.height,
        tier: tpl.defaultTier,
        frameColor: tpl.frameColors[0],
        boardColor: tpl.boardColors[0],
        position: { x: placeX, z: placeZ },
        rotation: 0,
        addOns: [],
      };
      setProducts((prev) => [...prev, newProduct]);
      setSelectedId(id);
    },
    [booth.depth]
  );

  const updateSelected = useCallback(
    (patch) => {
      if (!selectedId) return;
      setProducts((prev) =>
        prev.map((p) => (p.instanceId === selectedId ? { ...p, ...patch } : p))
      );
    },
    [selectedId]
  );

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setProducts((prev) => prev.filter((p) => p.instanceId !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  const duplicateSelected = useCallback(() => {
    if (!selectedId) return;
    const orig = productsRef.current.find((p) => p.instanceId === selectedId);
    if (!orig) return;
    const newId = `p_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const copy = {
      ...orig,
      instanceId: newId,
      position: { x: orig.position.x + 0.3, z: orig.position.z + 0.3 },
    };
    setProducts((prev) => [...prev, copy]);
    setSelectedId(newId);
  }, [selectedId]);

  const rotateSelected = useCallback(() => {
    if (!selectedId) return;
    setProducts((prev) =>
      prev.map((p) =>
        p.instanceId === selectedId
          ? { ...p, rotation: ((p.rotation || 0) + 90) % 360 }
          : p
      )
    );
  }, [selectedId]);

  /* ---------- save / load / export ---------- */
  const saveJSON = () => {
    const data = {
      version: 1,
      layoutName,
      booth,
      products,
      savedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(layoutName || 'homedant_booth').replace(
      /[^a-zA-Z0-9_-]/g,
      '_'
    )}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadJSON = (file) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.booth) setBooth(data.booth);
        if (Array.isArray(data.products)) {
          setProducts(data.products);
          setSelectedId(null);
        }
        if (data.layoutName) setLayoutName(data.layoutName);
      } catch (err) {
        alert('Invalid JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const savePNG = () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;
    renderer.render(scene, camera);
    const url = renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layoutName || 'booth'}_${Date.now()}.png`;
    a.click();
  };

  /* ---------- Export Booth Images: front / top / 45° ---------- */
  const exportBoothImages = () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!renderer || !scene || !camera || !controls) return;

    // remember current camera state so we can restore it afterward
    const prevPos = camera.position.clone();
    const prevTarget = controls.target.clone();

    const dist = Math.max(booth.width, booth.depth) * MM_TO_M * 1.25;
    const safeName = (layoutName || 'booth').replace(/[^a-zA-Z0-9_-]/g, '_');

    const shots = [
      { mode: 'front', suffix: 'front' },
      { mode: 'top', suffix: 'top' },
      { mode: '3d', suffix: '45deg' },
    ];

    // render + download each view sequentially with a small delay so the
    // browser flushes each canvas frame before the next capture
    let i = 0;
    const doNext = () => {
      if (i >= shots.length) {
        // restore original camera
        camera.position.copy(prevPos);
        controls.target.copy(prevTarget);
        controls.update();
        renderer.render(scene, camera);
        return;
      }
      const shot = shots[i++];
      controls.setView(shot.mode, dist);
      controls.update();
      renderer.render(scene, camera);
      const url = renderer.domElement.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}_booth_${shot.suffix}.png`;
      a.click();
      setTimeout(doNext, 350);
    };
    doNext();
  };

  /* ---------- 디자인 보관함 (localStorage) ---------- */
  const LIB_KEY = 'homedant_booth_designs';

  // load saved designs once on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LIB_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setSavedDesigns(arr);
      }
    } catch (err) {
      console.warn('Could not load design library:', err);
    }
  }, []);

  // helper: persist the given list to localStorage
  const persistDesigns = (list) => {
    try {
      window.localStorage.setItem(LIB_KEY, JSON.stringify(list));
    } catch (err) {
      alert('Could not save to browser storage: ' + err.message);
    }
  };

  // brief "Saved ✓" flash, auto-clears after ~1.8s
  const flashSaved = (msg) => {
    setSaveStatus(msg);
    window.setTimeout(() => setSaveStatus(''), 1800);
  };

  /* Save the current booth to the 디자인 보관함.
     - If we're already working on a saved design (currentDesignId set AND
       that id still exists in the library) -> overwrite that entry.
     - Otherwise -> ask for a name and add a new entry.
     The `silent` flag (used by Ctrl+S) skips the name prompt when we
     already have an entry to overwrite.                                 */
  const saveDesign = (opts = {}) => {
    const { silent = false } = opts;
    // does our tracked id still exist? (it may have been deleted)
    const existing = currentDesignId
      ? savedDesigns.find((d) => d.id === currentDesignId)
      : null;

    if (existing) {
      // --- overwrite the existing entry, keep its id + name ---
      const updated = {
        ...existing,
        savedAt: new Date().toISOString(),
        booth: { ...booth },
        products: products.map((p) => ({ ...p })),
      };
      const next = savedDesigns.map((d) =>
        d.id === existing.id ? updated : d
      );
      setSavedDesigns(next);
      persistDesigns(next);
      flashSaved(`Saved “${existing.name}”`);
      return;
    }

    // --- no existing entry -> create a new one ---
    // (silent saves still need a name the very first time)
    const name = window.prompt(
      'Save design as:',
      layoutName || 'New Booth Design'
    );
    if (!name) return;
    const design = {
      id: `d_${Date.now()}`,
      name: name.trim(),
      savedAt: new Date().toISOString(),
      booth: { ...booth },
      products: products.map((p) => ({ ...p })),
    };
    const next = [...savedDesigns, design];
    setSavedDesigns(next);
    persistDesigns(next);
    setLayoutName(name.trim());
    setCurrentDesignId(design.id); // track it so future saves overwrite
    if (!silent) setShowLibrary(true);
    flashSaved(`Saved “${design.name}”`);
  };

  const loadDesign = (design) => {
    if (!design) return;
    if (design.booth) setBooth(design.booth);
    if (Array.isArray(design.products)) {
      setProducts(design.products.map((p) => ({ ...p })));
      setSelectedId(null);
    }
    if (design.name) setLayoutName(design.name);
    setCurrentDesignId(design.id); // now editing this saved design
  };

  const deleteDesign = (id) => {
    const next = savedDesigns.filter((d) => d.id !== id);
    setSavedDesigns(next);
    persistDesigns(next);
    // if we deleted the design we were tracking, forget it so the next
    // save creates a fresh entry instead of silently failing
    if (currentDesignId === id) setCurrentDesignId(null);
  };

  const renameDesign = (id) => {
    const design = savedDesigns.find((d) => d.id === id);
    if (!design) return;
    const newName = window.prompt('Rename design:', design.name);
    if (!newName) return;
    const next = savedDesigns.map((d) =>
      d.id === id ? { ...d, name: newName.trim() } : d
    );
    setSavedDesigns(next);
    persistDesigns(next);
  };

  // keep the ref pointing at the latest saveDesign (closes over current state)
  saveDesignRef.current = saveDesign;

  // Ctrl+S / Cmd+S → 디자인 저장 (same as the button). Bound once on mount.
  // We intercept the browser's "save page" default and call saveDesign via
  // the ref so it always sees fresh state. Silent mode: if we're already
  // editing a saved design it overwrites without a prompt.
  useEffect(() => {
    const onKeyDown = (e) => {
      const isSaveCombo =
        (e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S');
      if (!isSaveCombo) return;
      e.preventDefault();
      if (saveDesignRef.current) saveDesignRef.current({ silent: true });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  /* ---------- presets ---------- */
  const applyTemplate = (tpl) => {
    if (tpl === '10x10')
      setBooth({
        ...booth,
        width: 10 * MM_PER_FT,
        depth: 10 * MM_PER_FT,
        unit: 'ft',
      });
    else if (tpl === '10x20')
      setBooth({
        ...booth,
        width: 20 * MM_PER_FT,
        depth: 10 * MM_PER_FT,
        unit: 'ft',
      });
    else if (tpl === '20x20')
      setBooth({
        ...booth,
        width: 20 * MM_PER_FT,
        depth: 20 * MM_PER_FT,
        unit: 'ft',
      });
  };

  /* ---------- create a fresh, empty layout ---------- */
  const createLayout = () => {
    // confirm before discarding in-progress work
    if (products.length > 0) {
      const ok = window.confirm(
        'Start a new layout? This clears the current booth.\n' +
          'Save it to the 디자인 보관함 first if you want to keep it.'
      );
      if (!ok) return;
    }
    setProducts([]);
    setSelectedId(null);
    setWarnings({});
    setLayoutName('layout1');
    setCurrentDesignId(null); // fresh layout — next save creates a new entry
    // reset booth to the default size/style but keep the current unit
    setBooth((b) => ({
      width: 6096,
      depth: 3048,
      wallHeight: 2438,
      unit: b.unit,
      style: 'wall',
    }));
  };

  /* ---------- switch booth style (wall / curtain) ---------- */
  const setBoothStyle = (style) => setBooth((b) => ({ ...b, style }));

  /* ---------- selected product convenience ---------- */
  const selected = products.find((p) => p.instanceId === selectedId);
  const selectedTpl = selected
    ? PRODUCT_LIBRARY.find((t) => t.id === selected.productId)
    : null;

  // group products by category for left panel
  const filteredProducts = PRODUCT_LIBRARY.filter((p) =>
    activeBrand === 'SPEEDRACK'
      ? p.brand === 'SPEEDRACK'
      : activeBrand === 'HOMEDANT HOUSE'
      ? p.brand === 'HOMEDANT HOUSE'
      : p.brand === 'Exhibition'
  );

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div
      className="h-screen w-screen flex flex-col bg-gray-50 text-gray-900 overflow-hidden"
      style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif' }}
    >
      {/* TOP BAR */}
      <header className="flex-none border-b border-gray-300 bg-white">
        <div className="px-4 py-2 flex items-center gap-x-6 gap-y-2 flex-wrap">
          {/* title */}
          <div className="flex items-center pr-4 border-r border-gray-200">
            <div className="text-sm font-semibold text-gray-900 tracking-tight whitespace-nowrap">
              부스 시뮬레이터
            </div>
          </div>

          {/* booth dimensions */}
          <div className="flex items-center gap-3">
            <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">
              부스
            </div>
            <NumInput
              label="가로(폭)"
              valueMM={booth.width}
              unit={booth.unit}
              onChange={(mm) => setBooth({ ...booth, width: mm })}
            />
            <NumInput
              label="세로(깊이)"
              valueMM={booth.depth}
              unit={booth.unit}
              onChange={(mm) => setBooth({ ...booth, depth: mm })}
            />
            <NumInput
              label="벽 높이"
              valueMM={booth.wallHeight}
              unit={booth.unit}
              onChange={(mm) => setBooth({ ...booth, wallHeight: mm })}
            />
            <select
              value={booth.unit}
              onChange={(e) => setBooth({ ...booth, unit: e.target.value })}
              className="text-xs border border-gray-300 rounded px-1.5 py-1 bg-white"
            >
              <option value="ft">ft</option>
              <option value="m">m</option>
              <option value="cm">cm</option>
              <option value="mm">mm</option>
            </select>
          </div>

          {/* templates */}
          <div className="flex items-center gap-1 pl-3 border-l border-gray-200">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-medium mr-1">
              템플릿
            </span>
            <PresetBtn onClick={() => applyTemplate('10x10')}>
              10×10 ft
            </PresetBtn>
            <PresetBtn onClick={() => applyTemplate('10x20')}>
              10×20 ft
            </PresetBtn>
            <PresetBtn onClick={() => applyTemplate('20x20')}>
              20×20 ft
            </PresetBtn>
          </div>

          {/* booth style: wall vs curtain */}
          <div className="flex items-center gap-1 pl-3 border-l border-gray-200">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-medium mr-1">
              부스 형태
            </span>
            <button
              onClick={() => setBoothStyle('wall')}
              className={
                'text-xs px-2 py-1 rounded border transition ' +
                (booth.style === 'wall'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')
              }
              title="단단한 판넬 벽"
            >
              벽 부스
            </button>
            <button
              onClick={() => setBoothStyle('curtain')}
              className={
                'text-xs px-2 py-1 rounded border transition ' +
                (booth.style === 'curtain'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')
              }
              title="기둥 프레임 + 천 커튼"
            >
              커튼 부스
            </button>
          </div>

          {/* 배치 이름 + create new */}
          <div className="flex items-center gap-1.5 pl-3 border-l border-gray-200">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">
              배치
            </span>
            <input
              type="text"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              placeholder="배치 이름"
              className="text-xs border border-gray-300 rounded px-1.5 py-1 bg-white w-28"
              title="내보낸 PNG 파일 이름에 사용돼요"
            />
            <IconBtn
              onClick={createLayout}
              title="새 빈 부스 배치 시작"
            >
              <FilePlus className="w-3.5 h-3.5" /> 배치 만들기
            </IconBtn>
          </div>

          <div className="flex-1 min-w-0" />

          {/* actions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <ViewBtn
              active={viewMode === '3d'}
              onClick={() => setViewMode('3d')}
            >
              <Box className="w-3.5 h-3.5" /> 3D
            </ViewBtn>
            <ViewBtn
              active={viewMode === 'top'}
              onClick={() => setViewMode('top')}
            >
              <Grid3x3 className="w-3.5 h-3.5" /> 윗면
            </ViewBtn>
            <ViewBtn
              active={viewMode === 'front'}
              onClick={() => setViewMode('front')}
            >
              <Eye className="w-3.5 h-3.5" /> 정면
            </ViewBtn>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <IconBtn onClick={savePNG} title="현재 화면을 PNG로 저장">
              <Camera className="w-3.5 h-3.5" /> PNG
            </IconBtn>
            <IconBtn
              onClick={exportBoothImages}
              title="정면 / 윗면 / 45° 뷰를 PNG 3장으로 내보내기"
            >
              <Camera className="w-3.5 h-3.5" /> 이미지 내보내기
            </IconBtn>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <IconBtn
              onClick={() => saveDesign()}
              title="이 부스 디자인을 앱 보관함에 저장"
            >
              <Save className="w-3.5 h-3.5" /> 디자인 저장
            </IconBtn>
            <IconBtn
              onClick={() => setShowLibrary((v) => !v)}
              title="디자인 보관함 열기 / 닫기"
            >
              <Layers className="w-3.5 h-3.5" /> 보관함
            </IconBtn>
            <div className="w-px h-5 bg-gray-300 mx-1" />
            <IconBtn onClick={saveJSON} title="JSON 파일로 내려받기">
              <Download className="w-3.5 h-3.5" /> JSON
            </IconBtn>
            <label
              title="JSON 파일 불러오기"
              className="cursor-pointer inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded border border-gray-300 hover:bg-gray-50 transition"
            >
              <Upload className="w-3.5 h-3.5" /> 불러오기
              <input
                type="file"
                accept=".json"
                hidden
                onChange={(e) => {
                  if (e.target.files[0]) {
                    loadJSON(e.target.files[0]);
                    e.target.value = '';
                  }
                }}
              />
            </label>
          </div>
        </div>
      </header>

      {/* MAIN AREA */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL */}
        <aside className="flex-none w-72 border-r border-gray-300 bg-white flex flex-col">
          <div className="flex-none border-b border-gray-200 px-3 py-2.5">
            <div className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">
              물품 보관함
            </div>
            <div className="flex gap-1">
              {['SPEEDRACK', 'HOMEDANT HOUSE', 'Exhibition'].map((b) => (
                <button
                  key={b}
                  onClick={() => setActiveBrand(b)}
                  className={`flex-1 text-xs font-medium px-2 py-1.5 rounded transition ${
                    activeBrand === b
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {b === 'SPEEDRACK'
                    ? '스피드랙'
                    : b === 'HOMEDANT HOUSE'
                    ? '홈던트하우스'
                    : '전시회 물품'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            {filteredProducts.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => addProduct(tpl)}
                className="w-full text-left px-2.5 py-2 rounded border border-gray-200 hover:border-red-500 hover:bg-red-50 transition group"
              >
                <div className="flex items-center gap-2">
                  <ProductThumb type={tpl.type} tpl={tpl} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-900 truncate">
                      {tpl.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {tpl.defaultSize.width}×{tpl.defaultSize.depth}×
                      {tpl.defaultSize.height}mm
                    </div>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-gray-300 group-hover:text-red-600" />
                </div>
              </button>
            ))}
          </div>
          <div className="flex-none border-t border-gray-200 px-3 py-3 bg-white flex items-center justify-center">
            <img
              src={HOMEDANT_LOGO_URL}
              alt="HOMEDANT"
              className="h-20 w-auto"
              style={{ objectFit: 'contain' }}
            />
          </div>
          <div className="flex-none border-t border-gray-200 px-3 py-2 bg-gray-50">
            <div className="text-xs text-gray-500">
              <div className="flex justify-between">
                <span>배치된 물품</span>
                <b className="text-gray-700">{products.length}</b>
              </div>
              <div className="flex justify-between">
                <span>배치 점검</span>
                <b
                  className={
                    Object.keys(warnings).length
                      ? 'text-amber-600'
                      : 'text-gray-700'
                  }
                >
                  {Object.keys(warnings).length}
                </b>
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER 3D CANVAS */}
        <main
          className="flex-1 relative bg-gray-100"
          onMouseDown={onCanvasMouseDown}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={onCanvasMouseUp}
          onClick={onCanvasClick}
        >
          <div ref={mountRef} className="absolute inset-0" />
          {/* overlay info */}
          <div
            style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}
            className="absolute top-3 left-3 backdrop-blur border border-gray-200 rounded px-3 py-2 text-xs text-gray-700 leading-snug pointer-events-none"
          >
            <div className="font-medium text-gray-900 mb-0.5">
              {fromMM(booth.width, booth.unit)} ×{' '}
              {fromMM(booth.depth, booth.unit)} {booth.unit}
            </div>
            <div className="text-gray-500">
              {fromMM(booth.width, 'mm')} × {fromMM(booth.depth, 'mm')} mm ·
              wall {fromMM(booth.wallHeight, booth.unit)}
              {booth.unit}
            </div>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}
            className="absolute bottom-3 left-3 backdrop-blur border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-600 pointer-events-none"
          >
            <span className="font-medium">좌드래그</span> 회전 ·{' '}
            <span className="font-medium">우드래그</span> 이동 ·{' '}
            <span className="font-medium">휠</span> 확대·축소 ·{' '}
            <span className="font-medium">클릭</span> 선택
          </div>
          {/* brief "Saved ✓" confirmation (Ctrl+S or 디자인 저장) */}
          {saveStatus && (
            <div className="absolute bottom-3 right-3 bg-green-600 text-white rounded px-3 py-1.5 text-xs font-medium shadow-md pointer-events-none flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5" />
              {saveStatus}
            </div>
          )}
          {Object.keys(warnings).length > 0 &&
            (() => {
              // group flagged items by reason for a clear breakdown
              const counts = {};
              Object.values(warnings).forEach((r) => {
                counts[r] = (counts[r] || 0) + 1;
              });
              // per-item detail (product name + reason)
              const items = Object.entries(warnings).map(([id, reason]) => {
                const prod = products.find((pr) => pr.instanceId === id);
                const tpl = prod
                  ? PRODUCT_LIBRARY.find((t) => t.id === prod.productId)
                  : null;
                const name = prod
                  ? prod.name || (tpl && tpl.name) || 'Product'
                  : 'Product';
                return { id, name, reason };
              });
              const total = Object.keys(warnings).length;
              return (
                <div className="absolute top-3 right-3 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2.5 text-xs text-amber-900 max-w-xs shadow-sm">
                  <div className="flex items-center gap-1.5 font-semibold mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-none" />
                    배치 점검: {total} item{total > 1 ? 's' : ''} need
                    attention
                  </div>
                  {/* by-cause summary */}
                  <div className="space-y-0.5 mb-1.5">
                    {Object.entries(counts).map(([reason, n]) => (
                      <div
                        key={reason}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="text-amber-700">
                          {WARNING_REASON_SHORT[reason] || 'Placement review'}
                        </span>
                        <span className="font-medium">
                          {n} item{n > 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* per-item detail */}
                  <div className="border-t border-amber-200 pt-1.5 space-y-0.5">
                    {items.map((it) => (
                      <div key={it.id} className="leading-snug">
                        <span className="font-medium">{it.name}</span>
                        <span className="text-amber-700">
                          {' '}
                          — {warningReasonLabel(it.reason)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-amber-600 mt-1.5 text-xs leading-snug">
                    These are placement reminders, not errors — adjust positions
                    to clear them.
                  </div>
                </div>
              );
            })()}
        </main>

        {/* DESIGN LIBRARY DRAWER — fixed overlay so it shows regardless of
            screen width (does not get pushed off-screen by other panels) */}
        {showLibrary && (
          <>
            {/* click-away backdrop */}
            <div
              className="fixed inset-0 z-40"
              style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
              onClick={() => setShowLibrary(false)}
            />
            <aside className="fixed top-0 right-0 z-50 h-full w-72 border-l border-gray-300 bg-white flex flex-col shadow-xl">
              <div className="flex-none border-b border-gray-200 px-3 py-2.5 flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                  디자인 보관함
                </div>
                <button
                  onClick={() => setShowLibrary(false)}
                  className="text-gray-400 hover:text-gray-700 text-xs"
                  title="닫기"
                >
                  ✕
                </button>
              </div>
              <div className="flex-none px-3 py-2 border-b border-gray-200">
                <button
                  onClick={() => saveDesign()}
                  className="w-full inline-flex items-center justify-center gap-1.5 text-xs px-2 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition font-medium"
                >
                  <Save className="w-3.5 h-3.5" /> 현재 부스 저장
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {savedDesigns.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-xs">
                    아직 저장된 디자인이 없어요.
                    <br />
                    "현재 부스 저장"을 누르면 이 배치가 저장돼요.
                  </div>
                ) : (
                  <div className="py-1">
                    {savedDesigns.map((d) => (
                      <div
                        key={d.id}
                        className="group px-3 py-2 border-b border-gray-100 hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => loadDesign(d)}
                            className="flex-1 min-w-0 text-left"
                            title="이 디자인 불러오기"
                          >
                            <div className="text-xs font-medium text-gray-900 truncate">
                              {d.name}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {d.products ? d.products.length : 0} items ·{' '}
                              {new Date(d.savedAt).toLocaleDateString()}
                            </div>
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <button
                            onClick={() => loadDesign(d)}
                            className="text-xs px-1.5 py-0.5 rounded border border-gray-300 hover:bg-white text-gray-700"
                          >
                            불러오기
                          </button>
                          <button
                            onClick={() => renameDesign(d.id)}
                            className="text-xs px-1.5 py-0.5 rounded border border-gray-300 hover:bg-white text-gray-700"
                          >
                            이름 변경
                          </button>
                          <button
                            onClick={() => deleteDesign(d.id)}
                            className="text-xs px-1.5 py-0.5 rounded border border-gray-300 hover:bg-red-50 hover:border-red-300 text-red-600"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-none border-t border-gray-200 px-3 py-2 bg-gray-50">
                <div className="text-xs text-gray-400 leading-snug">
                  디자인은 이 브라우저에만 저장돼요.
                </div>
              </div>
            </aside>
          </>
        )}

        {/* RIGHT PANEL */}
        <aside className="flex-none w-80 border-l border-gray-300 bg-white flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div className="text-gray-400 text-sm">
                <Box className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <div>편집할 물품을 선택하세요</div>
                <div className="text-xs mt-1">
                  또는 보관함에서 물품을 클릭해 추가
                </div>
              </div>
            </div>
          ) : (
            <PropertyPanel
              product={selected}
              tpl={selectedTpl}
              warning={warnings[selected.instanceId]}
              update={updateSelected}
              rotate={rotateSelected}
              duplicate={duplicateSelected}
              del={deleteSelected}
              boothSize={{ w: booth.width, d: booth.depth }}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

/* ============================================================
   PROPERTY PANEL (right side)
   ============================================================ */
function PropertyPanel({
  product,
  tpl,
  warning,
  update,
  rotate,
  duplicate,
  del,
  boothSize,
}) {
  if (!tpl) return null;
  const xMin = (-boothSize.w * MM_TO_M) / 2;
  const xMax = (boothSize.w * MM_TO_M) / 2;
  const zMin = (-boothSize.d * MM_TO_M) / 2;
  const zMax = (boothSize.d * MM_TO_M) / 2;

  // Look up a rendering image for the right-side preview. May be null.
  const refImg = findRenderImage(product, tpl);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">
              {tpl.brand}
            </div>
            <div className="font-semibold text-sm leading-tight mt-0.5 truncate">
              {product.name}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{tpl.category}</div>
          </div>
          {warning && (
            <span
              className="flex-none inline-flex items-center gap-1 text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-medium"
              title={warningReasonLabel(warning)}
            >
              <AlertTriangle className="w-3 h-3" />
              {WARNING_REASON_SHORT[warning] || 'Review'}
            </span>
          )}
        </div>
      </div>

      {/* reference image preview (rendering image vs current setting) */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div
          className="w-full h-32 rounded border border-gray-200 flex items-center justify-center overflow-hidden mb-2"
          style={{ backgroundColor: '#ffffff' }}
        >
          {refImg && refImg.url ? (
            <img
              src={refImg.url}
              alt={tpl.name}
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="text-center px-2">
              <ProductThumb type={tpl.type} />
              <div className="text-xs text-gray-400 mt-1">
                참고 이미지 없음
              </div>
            </div>
          )}
        </div>
        <div className="text-xs space-y-0.5 leading-tight">
          {refImg ? (
            <div className="text-gray-500">
              <span className="text-gray-400">참고 이미지: </span>
              {refImg.width && refImg.depth && refImg.height
                ? `${refImg.width}×${refImg.depth}×${refImg.height}`
                : '—'}
              {refImg.tier ? ` / ${refImg.tier}-Tier` : ''}
              {refImg.color ? ` / ${refImg.color}` : ''}
            </div>
          ) : (
            <div className="text-gray-400">참고 이미지: 없음</div>
          )}
          <div className="text-gray-900 font-medium">
            <span className="text-gray-400 font-normal">현재 설정: </span>
            {product.width}×{product.depth}×{product.height}
            {product.tier ? ` / ${product.tier}-Tier` : ''}
            {product.frameColor ? ` / ${product.frameColor}` : ''}
          </div>
        </div>
      </div>

      {/* dimensions */}
      <Section title="크기">
        <SizeSelect
          label="가로(폭)"
          value={product.width}
          options={tpl.sizeOptions.width}
          onChange={(v) => update({ width: v })}
        />
        <SizeSelect
          label="세로(깊이)"
          value={product.depth}
          options={tpl.sizeOptions.depth}
          onChange={(v) => update({ depth: v })}
        />
        <SizeSelect
          label="높이"
          value={product.height}
          options={tpl.sizeOptions.height}
          onChange={(v) => update({ height: v })}
        />
        {tpl.tierOptions.length > 1 && (
          <Field label="단">
            <select
              value={product.tier}
              onChange={(e) => update({ tier: parseInt(e.target.value, 10) })}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
            >
              {tpl.tierOptions.map((t) => (
                <option key={t} value={t}>
                  {t}-Tier
                </option>
              ))}
            </select>
          </Field>
        )}
      </Section>

      {/* colors */}
      <Section title="색상">
        <Field label="프레임">
          <div className="flex gap-1.5">
            {tpl.frameColors.map((c) => (
              <button
                key={c}
                onClick={() => update({ frameColor: c })}
                className={`flex-1 text-xs py-1.5 rounded border transition ${
                  product.frameColor === c
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </Field>
        <Field label="선반판">
          <div className="flex gap-1.5">
            {tpl.boardColors.map((c) => (
              <button
                key={c}
                onClick={() => update({ boardColor: c })}
                className={`flex-1 text-xs py-1.5 rounded border transition ${
                  product.boardColor === c
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* position */}
      <Section title="위치 · 회전">
        <Field label="X (m)">
          <input
            type="number"
            step="0.05"
            value={product.position.x.toFixed(2)}
            onChange={(e) =>
              update({
                position: {
                  ...product.position,
                  x: parseFloat(e.target.value) || 0,
                },
              })
            }
            className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
          />
          <div className="text-xs text-gray-400 mt-0.5">
            Range {xMin.toFixed(2)} ↔ {xMax.toFixed(2)}
          </div>
        </Field>
        <Field label="Z (m)">
          <input
            type="number"
            step="0.05"
            value={product.position.z.toFixed(2)}
            onChange={(e) =>
              update({
                position: {
                  ...product.position,
                  z: parseFloat(e.target.value) || 0,
                },
              })
            }
            className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
          />
          <div className="text-xs text-gray-400 mt-0.5">
            Range {zMin.toFixed(2)} ↔ {zMax.toFixed(2)}
          </div>
        </Field>
        <Field label="회전">
          <div className="flex items-center gap-2">
            <div className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded bg-gray-50">
              {product.rotation || 0}°
            </div>
            <button
              onClick={rotate}
              className="text-xs px-2.5 py-1 border border-gray-300 rounded hover:bg-gray-50 inline-flex items-center gap-1"
            >
              <RotateCw className="w-3 h-3" /> +90°
            </button>
          </div>
        </Field>
      </Section>

      {/* add-ons */}
      {tpl.addOns.length > 0 && (
        <Section title="추가 옵션">
          <div className="grid grid-cols-2 gap-1">
            {tpl.addOns.map((a) => {
              const active = (product.addOns || []).includes(a);
              return (
                <button
                  key={a}
                  onClick={() => {
                    const cur = product.addOns || [];
                    update({
                      addOns: active ? cur.filter((x) => x !== a) : [...cur, a],
                    });
                  }}
                  className={`text-xs py-1 px-1.5 rounded border transition truncate ${
                    active
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {ADDON_KO[a] || a}
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {/* size summary */}
      <Section title="요약">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <SumCell label="W" mm={product.width} />
          <SumCell label="D" mm={product.depth} />
          <SumCell label="H" mm={product.height} />
        </div>
      </Section>

      {/* actions */}
      <div className="px-4 py-3 border-t border-gray-200 flex gap-2 sticky bottom-0 bg-white">
        <button
          onClick={duplicate}
          className="flex-1 inline-flex items-center justify-center gap-1 text-xs px-2 py-1.5 border border-gray-300 rounded hover:bg-gray-50"
        >
          <Copy className="w-3.5 h-3.5" /> 복제
        </button>
        <button
          onClick={del}
          className="flex-1 inline-flex items-center justify-center gap-1 text-xs px-2 py-1.5 border border-red-300 text-red-700 rounded hover:bg-red-50"
        >
          <Trash2 className="w-3.5 h-3.5" /> 삭제
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   SMALL UI HELPERS
   ============================================================ */
function NumInput({ label, valueMM, unit, onChange }) {
  const [str, setStr] = useState(fromMM(valueMM, unit).toString());
  useEffect(() => {
    setStr(fromMM(valueMM, unit).toString());
  }, [valueMM, unit]);
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500">{label}</span>
      <input
        type="number"
        step="0.1"
        value={str}
        onChange={(e) => setStr(e.target.value)}
        onBlur={() => {
          const num = parseFloat(str);
          if (!isNaN(num) && num > 0) onChange(toMM(num, unit));
          else setStr(fromMM(valueMM, unit).toString());
        }}
        className="w-16 text-xs border border-gray-300 rounded px-1.5 py-1 bg-white"
      />
    </label>
  );
}

function PresetBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-2 py-1 border border-gray-300 rounded hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition"
    >
      {children}
    </button>
  );
}

function ViewBtn({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded border transition ${
        active
          ? 'bg-gray-900 text-white border-gray-900'
          : 'border-gray-300 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}

function IconBtn({ children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded border border-gray-300 hover:bg-gray-50 transition"
    >
      {children}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div className="px-4 py-3 border-b border-gray-200">
      <div className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      {children}
    </div>
  );
}

function SizeSelect({ label, value, options, onChange }) {
  return (
    <Field label={`${label} (mm)`}>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o} mm · {mmToInch(o)} in
          </option>
        ))}
      </select>
    </Field>
  );
}

function SumCell({ label, mm }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded p-1.5 text-center">
      <div className="text-xs uppercase text-gray-500 font-medium">{label}</div>
      <div className="text-xs font-semibold text-gray-900">{mm}</div>
      <div className="text-xs text-gray-500">{mmToInch(mm)} in</div>
    </div>
  );
}

function ProductThumb({ type, tpl, product }) {
  // If we can find a registered rendering image, show that instead of SVG.
  // The tpl + product are optional — the left panel passes just `type` for
  // a generic preview, while the property panel passes the full pair.
  if (tpl) {
    const stubProduct = product || {
      width: tpl.defaultSize.width,
      depth: tpl.defaultSize.depth,
      height: tpl.defaultSize.height,
      tier: tpl.defaultTier,
      frameColor: (tpl.frameColors && tpl.frameColors[0]) || 'black',
      boardColor: (tpl.boardColors && tpl.boardColors[0]) || 'wood',
    };
    const img = findRenderImage(stubProduct, tpl);
    if (img && img.url) {
      return (
        <img
          src={img.url}
          alt={tpl.name}
          className="w-7 h-7 flex-none object-contain bg-gray-50 rounded"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }
  }

  // tiny SVG thumbnail per type
  const common = 'w-7 h-7 flex-none';
  const stroke = '#444';
  if (type === 'shelf' || type === 'open_base' || type === 'heavy') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <rect x="5" y="3" width="14" height="18" rx="0.5" />
        <line x1="5" y1="9" x2="19" y2="9" />
        <line x1="5" y1="14" x2="19" y2="14" />
        {type !== 'open_base' && <line x1="5" y1="19" x2="19" y2="19" />}
      </svg>
    );
  }
  if (type === 'garment') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <rect x="5" y="3" width="14" height="18" rx="0.5" />
        <line x1="6" y1="7" x2="18" y2="7" />
        <line x1="5" y1="19" x2="19" y2="19" />
      </svg>
    );
  }
  if (type === 'rolling') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <rect x="5" y="3" width="14" height="16" rx="0.5" />
        <line x1="5" y1="11" x2="19" y2="11" />
        <circle cx="8" cy="21" r="1.3" />
        <circle cx="16" cy="21" r="1.3" />
      </svg>
    );
  }
  if (type === 'pegboard') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <rect x="5" y="3" width="14" height="18" rx="0.5" />
        <circle cx="9" cy="7" r="0.6" fill={stroke} />
        <circle cx="12" cy="7" r="0.6" fill={stroke} />
        <circle cx="15" cy="7" r="0.6" fill={stroke} />
        <circle cx="9" cy="11" r="0.6" fill={stroke} />
        <circle cx="12" cy="11" r="0.6" fill={stroke} />
        <circle cx="15" cy="11" r="0.6" fill={stroke} />
        <line x1="5" y1="15" x2="19" y2="15" />
        <line x1="5" y1="19" x2="19" y2="19" />
      </svg>
    );
  }
  if (type === 'drawer' || type === 'cabinet') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <rect x="5" y="3" width="14" height="18" rx="0.5" />
        <line x1="5" y1="9" x2="19" y2="9" />
        <rect x="6.5" y="11" width="11" height="3" rx="0.3" />
        <rect x="6.5" y="15.5" width="11" height="3" rx="0.3" />
      </svg>
    );
  }
  if (type === 'frame_open') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <rect x="5" y="3" width="14" height="18" rx="0.5" />
        <circle cx="12" cy="14" r="3" />
      </svg>
    );
  }
  if (type === 'banner') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <rect x="8" y="2" width="8" height="18" rx="0.5" />
        <line x1="6" y1="21" x2="18" y2="21" />
      </svg>
    );
  }
  if (type === 'poster') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <rect x="5" y="4" width="14" height="14" rx="0.5" />
        <line x1="5" y1="22" x2="5" y2="18" />
        <line x1="19" y1="22" x2="19" y2="18" />
      </svg>
    );
  }
  if (type === 'table') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="6" y1="10" x2="6" y2="20" />
        <line x1="18" y1="10" x2="18" y2="20" />
      </svg>
    );
  }
  if (type === 'chair') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <line x1="7" y1="4" x2="7" y2="20" />
        <line x1="7" y1="13" x2="17" y2="13" />
        <line x1="17" y1="13" x2="17" y2="20" />
      </svg>
    );
  }
  if (type === 'catalog') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <line x1="12" y1="3" x2="12" y2="20" />
        <line x1="6" y1="20" x2="18" y2="20" />
        <path d="M7 9 l5 -2 l5 2" />
        <path d="M7 13 l5 -2 l5 2" />
      </svg>
    );
  }
  if (type === 'tv') {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      >
        <rect x="3" y="4" width="18" height="11" rx="0.8" />
        <line x1="12" y1="15" x2="12" y2="20" />
        <line x1="8" y1="20" x2="16" y2="20" />
      </svg>
    );
  }
  return <div className={common} />;
}

/* ============================================================
   ORBIT CONTROLS  ── minimal in-house implementation
   ============================================================ */
function createOrbitControls(camera, dom) {
  const target = new THREE.Vector3(0, 1, 0);
  const spherical = new THREE.Spherical();
  const offset = camera.position.clone().sub(target);
  spherical.setFromVector3(offset);
  let mode = null; // 'rotate' | 'pan'
  let lastX = 0,
    lastY = 0;
  const ctrl = {
    target,
    enabled: true,
    minDistance: 1,
    maxDistance: 80,
    minPolarAngle: 0.05,
    maxPolarAngle: Math.PI / 2 - 0.02,
    update() {
      const off = new THREE.Vector3().setFromSpherical(spherical);
      camera.position.copy(target).add(off);
      camera.lookAt(target);
    },
    setView(mode, dist) {
      const r = dist || spherical.radius;
      if (mode === 'top') {
        spherical.set(r, 0.05, 0);
      } else if (mode === 'front') {
        spherical.set(r, Math.PI / 2 - 0.1, 0);
      } else {
        spherical.set(r, Math.PI / 3.5, Math.PI / 4);
      }
      ctrl.update();
    },
    dispose() {
      dom.removeEventListener('mousedown', onDown);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('contextmenu', onCtx);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    },
  };

  function onDown(e) {
    if (!ctrl.enabled) return;
    if (e.button === 0) mode = 'rotate';
    else if (e.button === 2) mode = 'pan';
    else return;
    lastX = e.clientX;
    lastY = e.clientY;
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }
  function onMove(e) {
    if (!ctrl.enabled || !mode) return;
    const dx = e.clientX - lastX,
      dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    if (mode === 'rotate') {
      const rect = dom.getBoundingClientRect();
      spherical.theta -= (dx / rect.width) * Math.PI * 2;
      spherical.phi -= (dy / rect.height) * Math.PI;
      spherical.phi = Math.max(
        ctrl.minPolarAngle,
        Math.min(ctrl.maxPolarAngle, spherical.phi)
      );
    } else {
      const factor = spherical.radius * 0.0018;
      const right = new THREE.Vector3(
        Math.cos(spherical.theta),
        0,
        -Math.sin(spherical.theta)
      ).multiplyScalar(-dx * factor);
      const fwd = new THREE.Vector3(
        Math.sin(spherical.theta),
        0,
        Math.cos(spherical.theta)
      ).multiplyScalar(dy * factor);
      target.add(right).add(fwd);
    }
    ctrl.update();
  }
  function onUp() {
    mode = null;
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  }
  function onWheel(e) {
    if (!ctrl.enabled) return;
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    spherical.radius = Math.max(
      ctrl.minDistance,
      Math.min(ctrl.maxDistance, spherical.radius * factor)
    );
    ctrl.update();
  }
  function onCtx(e) {
    e.preventDefault();
  }

  dom.addEventListener('mousedown', onDown);
  dom.addEventListener('wheel', onWheel, { passive: false });
  dom.addEventListener('contextmenu', onCtx);
  ctrl.update();
  return ctrl;
}

/* ============================================================
   DISPOSE HELPERS
   ============================================================ */
function disposeGroup(g) {
  g.traverse((c) => {
    if (c.geometry) c.geometry.dispose();
    if (c.material) {
      if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
      else c.material.dispose();
    }
  });
}
