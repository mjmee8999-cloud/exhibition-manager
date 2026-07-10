"use client";

// 여러 전시회 정보를 앱 전체에서 함께 쓰기 위한 "공용 저장소"입니다.
// - 전시회 목록과 현재 선택된 전시회를 기억합니다.
// - 브라우저의 localStorage에 저장하므로 새로고침해도 데이터가 남습니다.
//   (나중에 진짜 데이터베이스로 바꿀 수 있습니다.)

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Consultation } from "@/lib/consultation";
import seedData from "@/lib/seedData.json";

// 앱에 내장된 기본(시연/보고용) 자료입니다.
//  - 자료를 한 번도 저장한 적 없는 브라우저에서만 자동으로 채워집니다.
//  - 나중에 데이터베이스를 붙이면 이 부분과 seedData.json을 지우면 돼요.
const SEED = seedData as {
  selectedId: string | null;
  exhibitions: Exhibition[];
  consultations: Record<string, Consultation[]>;
};

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
  addExhibition: (data: Omit<Exhibition, "id">) => void;
  updateExhibition: (id: string, data: Omit<Exhibition, "id">) => void;
  selectExhibition: (id: string) => void;
  deleteExhibition: (id: string) => void;
};

const ExhibitionContext = createContext<ExhibitionContextValue | null>(null);

const STORAGE_KEY = "exhibitions";
const SELECTED_KEY = "selectedExhibitionId";

export function ExhibitionProvider({ children }: { children: ReactNode }) {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 처음 화면이 뜰 때 저장돼 있던 데이터를 불러옵니다.
  useEffect(() => {
    let savedList = localStorage.getItem(STORAGE_KEY);

    // 자료를 한 번도 저장한 적 없는 브라우저(첫 방문)면, 내장 기본 자료를 심습니다.
    if (savedList === null && SEED.exhibitions?.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED.exhibitions));
      for (const [id, list] of Object.entries(SEED.consultations ?? {})) {
        localStorage.setItem(`consultations:${id}`, JSON.stringify(list));
      }
      if (SEED.selectedId) localStorage.setItem(SELECTED_KEY, SEED.selectedId);
      savedList = localStorage.getItem(STORAGE_KEY);
    }

    if (savedList) setExhibitions(JSON.parse(savedList));

    const savedSelected = localStorage.getItem(SELECTED_KEY);
    if (savedSelected) setSelectedId(savedSelected);
  }, []);

  // 목록이 바뀔 때마다 브라우저에 저장합니다.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exhibitions));
  }, [exhibitions]);

  // 선택된 전시회가 바뀔 때마다 저장합니다.
  useEffect(() => {
    if (selectedId) localStorage.setItem(SELECTED_KEY, selectedId);
  }, [selectedId]);

  function addExhibition(data: Omit<Exhibition, "id">) {
    const newExhibition: Exhibition = { ...data, id: crypto.randomUUID() };
    setExhibitions((prev) => [...prev, newExhibition]);
    setSelectedId(newExhibition.id); // 방금 추가한 전시회를 자동 선택
  }

  function updateExhibition(id: string, data: Omit<Exhibition, "id">) {
    setExhibitions((prev) => prev.map((ex) => (ex.id === id ? { ...data, id } : ex)));
  }

  function selectExhibition(id: string) {
    setSelectedId(id);
  }

  function deleteExhibition(id: string) {
    setExhibitions((prev) => prev.filter((ex) => ex.id !== id));
    setSelectedId((current) => (current === id ? null : current));
  }

  const selected = exhibitions.find((ex) => ex.id === selectedId) ?? null;

  return (
    <ExhibitionContext.Provider
      value={{
        exhibitions,
        selectedId,
        selected,
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
