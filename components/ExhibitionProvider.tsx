"use client";

// 여러 전시회 정보를 앱 전체에서 함께 쓰기 위한 "공용 저장소"입니다.
// - 전시회 목록은 이제 Supabase(진짜 데이터베이스)에 저장됩니다.
//   → 어느 컴퓨터/브라우저에서 열어도 같은 목록이 보입니다(모두 공유).
// - "지금 어떤 전시회를 보고 있는지"(선택)는 사람마다 다르므로 브라우저에 저장합니다.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

// 전시회 한 건의 정보 형태
export type Exhibition = {
  id: string;
  name: string; // 전시회 이름 (예: 2025 광저우 캔톤페어)
  country: string; // 국가
  city: string; // 도시
  startDate: string; // 시작일
  endDate: string; // 종료일
  headcount: string; // 참가 인원 명단 (예: OOO 파트장, OOO 매니저)
  memo: string; // 메모
};

type ExhibitionContextValue = {
  exhibitions: Exhibition[];
  selectedId: string | null;
  selected: Exhibition | null;
  loading: boolean; // DB에서 목록을 불러오는 중인지
  addExhibition: (data: Omit<Exhibition, "id">) => void;
  updateExhibition: (id: string, data: Omit<Exhibition, "id">) => void;
  selectExhibition: (id: string) => void;
  deleteExhibition: (id: string) => void;
};

const ExhibitionContext = createContext<ExhibitionContextValue | null>(null);

const SELECTED_KEY = "selectedExhibitionId";
const TABLE = "exhibitions";

// DB의 열 이름(snake_case)과 앱의 필드 이름(camelCase)을 서로 바꿔주는 변환기입니다.
type Row = {
  id: string;
  name: string;
  country: string;
  city: string;
  start_date: string;
  end_date: string;
  headcount: string;
  memo: string;
};

function rowToExhibition(r: Row): Exhibition {
  return {
    id: r.id,
    name: r.name ?? "",
    country: r.country ?? "",
    city: r.city ?? "",
    startDate: r.start_date ?? "",
    endDate: r.end_date ?? "",
    headcount: r.headcount ?? "",
    memo: r.memo ?? "",
  };
}

function exhibitionToRow(ex: Exhibition): Row {
  return {
    id: ex.id,
    name: ex.name,
    country: ex.country,
    city: ex.city,
    start_date: ex.startDate,
    end_date: ex.endDate,
    headcount: ex.headcount,
    memo: ex.memo,
  };
}

export function ExhibitionProvider({ children }: { children: ReactNode }) {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 처음 화면이 뜰 때 DB에서 전시회 목록을 불러옵니다.
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .order("created_at", { ascending: true });
      if (!alive) return;
      if (error) {
        console.error("전시회 목록 불러오기 실패:", error.message);
      } else if (data) {
        setExhibitions((data as Row[]).map(rowToExhibition));
      }
      setLoading(false);
    })();

    // 내가 마지막으로 보던 전시회 선택은 브라우저에서 기억합니다.
    const savedSelected = localStorage.getItem(SELECTED_KEY);
    if (savedSelected) setSelectedId(savedSelected);

    return () => {
      alive = false;
    };
  }, []);

  // 선택된 전시회가 바뀔 때마다 브라우저에 저장합니다.
  useEffect(() => {
    if (selectedId) localStorage.setItem(SELECTED_KEY, selectedId);
  }, [selectedId]);

  function addExhibition(data: Omit<Exhibition, "id">) {
    const newExhibition: Exhibition = { ...data, id: crypto.randomUUID() };
    // 화면에는 바로 반영(빠른 반응)
    setExhibitions((prev) => [...prev, newExhibition]);
    setSelectedId(newExhibition.id); // 방금 추가한 전시회를 자동 선택
    // 뒤에서 DB에 저장
    supabase
      .from(TABLE)
      .insert(exhibitionToRow(newExhibition))
      .then(({ error }) => {
        if (error) console.error("전시회 저장 실패:", error.message);
      });
  }

  function updateExhibition(id: string, data: Omit<Exhibition, "id">) {
    setExhibitions((prev) => prev.map((ex) => (ex.id === id ? { ...data, id } : ex)));
    supabase
      .from(TABLE)
      .update(exhibitionToRow({ ...data, id }))
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("전시회 수정 실패:", error.message);
      });
  }

  function selectExhibition(id: string) {
    setSelectedId(id);
  }

  function deleteExhibition(id: string) {
    setExhibitions((prev) => prev.filter((ex) => ex.id !== id));
    setSelectedId((current) => (current === id ? null : current));
    supabase
      .from(TABLE)
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("전시회 삭제 실패:", error.message);
      });
  }

  const selected = exhibitions.find((ex) => ex.id === selectedId) ?? null;

  return (
    <ExhibitionContext.Provider
      value={{
        exhibitions,
        selectedId,
        selected,
        loading,
        addExhibition,
        updateExhibition,
        selectExhibition,
        deleteExhibition,
      }}
    >
      {children}
    </ExhibitionContext.Provider>
  );
}

// 다른 화면에서 이 저장소를 쉽게 꺼내 쓰기 위한 함수입니다.
export function useExhibitions() {
  const ctx = useContext(ExhibitionContext);
  if (!ctx) {
    throw new Error("useExhibitions는 ExhibitionProvider 안에서만 사용할 수 있습니다.");
  }
  return ctx;
}
