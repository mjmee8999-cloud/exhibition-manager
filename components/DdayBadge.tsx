// 오늘부터 전시회 시작일까지 남은 날짜(D-??)를 배지로 표시합니다.
//  - 앞으로 남았으면 D-N (파랑), 당일이면 D-DAY (빨강)
//  - 이미 지난 전시회는 D+ 대신 "종료"만 회색으로 표시 (지나간 전시회라 카운트업 불필요)
export default function DdayBadge({ startDate }: { startDate: string }) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startDate || "");
  if (!m) return null;

  const start = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((start.getTime() - today.getTime()) / 86_400_000);

  let text: string;
  let cls: string;
  if (diff > 0) {
    text = `D-${diff}`;
    cls = "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300";
  } else if (diff === 0) {
    text = "D-DAY";
    cls = "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300";
  } else {
    text = "종료";
    cls = "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
  }

  return (
    <span className={"inline-block rounded-full px-2 py-0.5 text-xs font-semibold " + cls}>
      {text}
    </span>
  );
}
