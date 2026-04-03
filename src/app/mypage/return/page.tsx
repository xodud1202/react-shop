import { cookies } from "next/headers";
import { fetchShopMypageReturnHistoryPageServerData } from "@/domains/mypage/api/mypageServerApi";
import ShopMypageReturnSection from "@/domains/mypage/components/ShopMypageReturnSection";
import { buildForwardCookieHeader } from "@/shared/server/shopCookieHeader";

type ShopMypageReturnRange = "1m" | "3m" | "6m" | "custom";

interface ShopMypageReturnPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

interface ShopMypageReturnResolvedSearchState {
  range: ShopMypageReturnRange;
  pageNo: number;
  startDate: string;
  endDate: string;
}

// Date 값을 YYYY-MM-DD 문자열로 변환합니다.
function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 현재 한국 날짜 기준 Date 객체를 생성합니다.
function createKoreaTodayDate(): Date {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const datePartMap = formatter.formatToParts(new Date()).reduce<Record<string, string>>((result, part) => {
    if (part.type !== "literal") {
      result[part.type] = part.value;
    }
    return result;
  }, {});

  return new Date(
    Number(datePartMap.year ?? "0"),
    Number(datePartMap.month ?? "1") - 1,
    Number(datePartMap.day ?? "1"),
  );
}

// 지정한 개월 수 기준 시작일/종료일을 계산합니다.
function resolvePresetDateRange(months: 1 | 3 | 6): { startDate: string; endDate: string } {
  const today = createKoreaTodayDate();
  const startDate = new Date(today.getTime());
  startDate.setMonth(startDate.getMonth() - months);
  return {
    startDate: formatDateInputValue(startDate),
    endDate: formatDateInputValue(today),
  };
}

// 검색 파라미터의 range 값을 허용된 범위로 보정합니다.
function resolveReturnRange(rawRange: string | string[] | undefined): ShopMypageReturnRange {
  const rangeSource = Array.isArray(rawRange) ? rawRange[0] : rawRange;
  if (rangeSource === "1m" || rangeSource === "6m" || rangeSource === "custom") {
    return rangeSource;
  }
  return "3m";
}

// 검색 파라미터의 pageNo 값을 1 이상 정수로 보정합니다.
function resolvePageNo(rawPageNo: string | string[] | undefined): number {
  const pageNoSource = Array.isArray(rawPageNo) ? rawPageNo[0] : rawPageNo;
  const parsedPageNo = Number(pageNoSource);
  if (!Number.isFinite(parsedPageNo) || parsedPageNo < 1) {
    return 1;
  }
  return Math.floor(parsedPageNo);
}

// 검색 파라미터의 날짜 문자열이 YYYY-MM-DD 형식인지 확인합니다.
function isValidDateInputValue(value: string | string[] | undefined): value is string {
  const source = Array.isArray(value) ? value[0] : value;
  return typeof source === "string" && /^\d{4}-\d{2}-\d{2}$/.test(source);
}

// URL 검색 파라미터를 반품내역 SSR 조회용 상태로 정리합니다.
function resolveReturnSearchState(searchParamMap: Record<string, string | string[] | undefined>): ShopMypageReturnResolvedSearchState {
  const range = resolveReturnRange(searchParamMap.range);
  const pageNo = resolvePageNo(searchParamMap.pageNo);

  // custom 범위는 전달된 시작일/종료일이 모두 유효할 때만 그대로 사용합니다.
  if (range === "custom" && isValidDateInputValue(searchParamMap.startDate) && isValidDateInputValue(searchParamMap.endDate)) {
    const startDate = Array.isArray(searchParamMap.startDate) ? searchParamMap.startDate[0] : searchParamMap.startDate;
    const endDate = Array.isArray(searchParamMap.endDate) ? searchParamMap.endDate[0] : searchParamMap.endDate;
    return { range, pageNo, startDate, endDate };
  }

  // preset 범위는 기본 계산값으로 시작일/종료일을 구성합니다.
  const presetRangeMap: Record<Exclude<ShopMypageReturnRange, "custom">, { startDate: string; endDate: string }> = {
    "1m": resolvePresetDateRange(1),
    "3m": resolvePresetDateRange(3),
    "6m": resolvePresetDateRange(6),
  };
  const presetDateRange = presetRangeMap[range === "custom" ? "3m" : range];
  return {
    range: range === "custom" ? "3m" : range,
    pageNo,
    startDate: presetDateRange.startDate,
    endDate: presetDateRange.endDate,
  };
}

// 쇼핑몰 마이페이지 반품내역 화면을 렌더링합니다.
export default async function ShopMypageReturnPage({ searchParams }: ShopMypageReturnPageProps) {
  // URL 쿼리에서 조회 범위와 페이지 번호를 추출합니다.
  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const returnSearchState = resolveReturnSearchState(resolvedSearchParams);

  // 현재 요청 쿠키를 백엔드 SSR 호출 헤더로 전달합니다.
  const cookieStore = await cookies();
  const cookieHeader = buildForwardCookieHeader(cookieStore, ["cust_no"]);
  const returnPageData = await fetchShopMypageReturnHistoryPageServerData(
    returnSearchState.pageNo,
    returnSearchState.startDate,
    returnSearchState.endDate,
    cookieHeader,
  );

  return (
    <ShopMypageReturnSection
      key={`${returnSearchState.range}-${returnSearchState.startDate}-${returnSearchState.endDate}-${returnSearchState.pageNo}`}
      returnPageData={returnPageData}
      initialRange={returnSearchState.range}
    />
  );
}
