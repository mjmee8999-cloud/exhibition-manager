// Supabase(우리 앱의 진짜 데이터베이스)에 연결하는 "전화기" 역할입니다.
// 앱 어디서든  import { supabase } from "@/lib/supabase"  로 꺼내 쓰면 됩니다.
//
// 여기 적힌 key는 "publishable(공개용) 열쇠"라서, 앱 코드에 그대로 넣어도 안전합니다.
// (진짜 비밀 열쇠인 secret/service_role 키는 절대 여기 넣지 않습니다.)
// 데이터 접근은 Supabase의 정책(RLS)으로 통제합니다 — 지금은 "누구나 읽고 쓰기(모두 공유)".

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ddkvudsbelvuzqykizkm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_TLQZbmMR9LoXYhbN1H8xbQ_uHajUO_Y";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
