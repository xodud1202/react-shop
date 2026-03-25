"use client";

import { useEffect, useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import {
  createDefaultShopOrderAddressSaveResponse,
  createDefaultShopOrderAddressSearchResponse,
  getShopOrderAddressRegisterPath,
  getShopOrderAddressSearchPath,
  getShopOrderAddressUpdatePath,
  normalizeShopOrderAddressSaveResponse,
  normalizeShopOrderAddressSearchResponse,
} from "@/domains/order/api/orderApi";
import type {
  ShopOrderAddress,
  ShopOrderAddressSaveResponse,
  ShopOrderAddressSearchItem,
} from "@/domains/order/types";
import { formatPhoneNumberValue, isValidPhoneNumberValue } from "@/domains/login/utils/joinFormUtils";
import { requestShopClientApi } from "@/shared/client/shopClientApi";
import styles from "./ShopOrderAddressLayer.module.css";

interface ShopOrderAddressRegisterLayerProps {
  mode: "create" | "edit";
  initialAddress?: ShopOrderAddress | null;
  onSuccess: (result: ShopOrderAddressSaveResponse) => void;
  onClose: () => void;
}

const SEARCH_CURRENT_PAGE = 1;
const SEARCH_COUNT_PER_PAGE = 5;
const SEARCH_PAGINATION_BUTTON_COUNT = 5;
const REGISTER_FORM_ID = "shop-order-address-register-form";

// 공통 레이어 오버레이 바깥 영역 클릭 여부를 판정합니다.
function isOverlayClick(event: MouseEvent<HTMLDivElement>): boolean {
  return event.target === event.currentTarget;
}

// 기존 배송지 정보를 검색 결과 선택 형식으로 변환합니다.
function createSearchItemFromAddress(address: ShopOrderAddress | null | undefined): ShopOrderAddressSearchItem | null {
  if (!address) {
    return null;
  }
  return {
    roadAddr: address.baseAddress,
    roadAddrPart1: address.baseAddress,
    roadAddrPart2: "",
    jibunAddr: address.baseAddress,
    zipNo: address.postNo,
    admCd: "",
    rnMgtSn: "",
    bdMgtSn: "",
  };
}

// 총 페이지 수를 현재 검색 결과 기준으로 계산합니다.
function resolveTotalPageCount(totalCount: number, countPerPage: number): number {
  if (!Number.isFinite(totalCount) || totalCount < 1) {
    return 0;
  }
  const safeCountPerPage = !Number.isFinite(countPerPage) || countPerPage < 1 ? SEARCH_COUNT_PER_PAGE : Math.floor(countPerPage);
  return Math.max(Math.ceil(totalCount / safeCountPerPage), 1);
}

// 현재 페이지 기준으로 노출할 페이지 버튼 목록을 계산합니다.
function resolvePageNumberList(currentPage: number, totalPageCount: number): number[] {
  if (totalPageCount < 1) {
    return [];
  }
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPageCount);
  const startPage = Math.max(safeCurrentPage - Math.floor(SEARCH_PAGINATION_BUTTON_COUNT / 2), 1);
  const endPage = Math.min(startPage + SEARCH_PAGINATION_BUTTON_COUNT - 1, totalPageCount);
  const adjustedStartPage = Math.max(endPage - SEARCH_PAGINATION_BUTTON_COUNT + 1, 1);
  const pageNumberList: number[] = [];
  for (let pageNo = adjustedStartPage; pageNo <= endPage; pageNo += 1) {
    pageNumberList.push(pageNo);
  }
  return pageNumberList;
}

// 배송지 등록 입력값의 클라이언트 유효성을 확인합니다.
function resolveRegisterValidationMessage(
  selectedAddress: ShopOrderAddressSearchItem | null,
  addressNm: string,
  rsvNm: string,
  phoneNumber: string,
  detailAddress: string,
): string {
  if (!selectedAddress) {
    return "검색한 주소를 선택해주세요.";
  }
  if (addressNm.trim() === "") {
    return "배송지명을 입력해주세요.";
  }
  if (addressNm.trim().length > 50) {
    return "배송지명은 50자 이내로 입력해주세요.";
  }
  if (rsvNm.trim() === "") {
    return "받는 사람을 입력해주세요.";
  }
  if (rsvNm.trim().length > 20) {
    return "받는 사람은 20자 이내로 입력해주세요.";
  }
  if (!isValidPhoneNumberValue(phoneNumber)) {
    return "연락처 형식을 확인해주세요.";
  }
  if (detailAddress.trim() === "") {
    return "상세주소를 입력해주세요.";
  }
  if (detailAddress.trim().length > 125) {
    return "상세주소는 125자 이내로 입력해주세요.";
  }
  return "";
}

// 주문서 배송지 등록/수정 레이어팝업을 렌더링합니다.
export default function ShopOrderAddressRegisterLayer({
  mode,
  initialAddress = null,
  onSuccess,
  onClose,
}: ShopOrderAddressRegisterLayerProps) {
  const initialSearchItem = createSearchItemFromAddress(initialAddress);
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(SEARCH_CURRENT_PAGE);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchErrorMessage, setSearchErrorMessage] = useState("");
  const [selectedSearchItem, setSelectedSearchItem] = useState<ShopOrderAddressSearchItem | null>(initialSearchItem);
  const [searchResponse, setSearchResponse] = useState(createDefaultShopOrderAddressSearchResponse());
  const [addressNm, setAddressNm] = useState(initialAddress?.addressNm ?? "");
  const [rsvNm, setRsvNm] = useState(initialAddress?.rsvNm ?? "");
  const [phoneNumber, setPhoneNumber] = useState(initialAddress?.phoneNumber ?? "");
  const [detailAddress, setDetailAddress] = useState(initialAddress?.detailAddress ?? "");
  const [saveAsDefault, setSaveAsDefault] = useState(initialAddress?.defaultYn === "Y");
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalPageCount = resolveTotalPageCount(searchResponse.common.totalCount, searchResponse.common.countPerPage);
  const pageNumberList = resolvePageNumberList(currentPage, totalPageCount);
  const isEditMode = mode === "edit";

  // 팝업이 열린 동안 배경 스크롤을 잠그고 ESC 키 닫기를 처리합니다.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleDocumentKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [onClose]);

  // 오버레이 바깥 영역 클릭 시 팝업을 닫습니다.
  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>): void => {
    if (!isOverlayClick(event)) {
      return;
    }
    onClose();
  };

  // 주소 검색 API를 호출해 검색 결과를 갱신합니다.
  const fetchSearchResult = async (targetPage: number): Promise<void> => {
    const normalizedKeyword = keyword.trim();
    if (normalizedKeyword === "") {
      setSearchErrorMessage("주소 검색어를 입력해주세요.");
      return;
    }

    try {
      // 검색 시작 전 기존 선택/에러 상태를 초기화하고 로딩 상태를 켭니다.
      setIsSearching(true);
      setHasSearched(true);
      setSearchErrorMessage("");
      setSelectedSearchItem(null);
      setSubmitErrorMessage("");
      const result = await requestShopClientApi(getShopOrderAddressSearchPath(normalizedKeyword, targetPage, SEARCH_COUNT_PER_PAGE), {
        method: "GET",
      });

      // 세션이 만료된 경우 공통 로그인 메시지를 노출합니다.
      if (result.status === 401) {
        window.alert("로그인이 필요합니다.");
        return;
      }

      // 실패 응답이면 서버 메시지를 우선 노출합니다.
      if (!result.ok || !result.data) {
        setSearchErrorMessage(result.message || "배송지 검색에 실패했습니다.");
        setSearchResponse(createDefaultShopOrderAddressSearchResponse());
        return;
      }

      // 정상 응답을 정규화해 검색 결과와 API 메시지를 반영합니다.
      const normalizedResponse = normalizeShopOrderAddressSearchResponse(result.data);
      setSearchResponse(normalizedResponse);
      setCurrentPage(normalizedResponse.common.currentPage > 0 ? normalizedResponse.common.currentPage : targetPage);
      if (normalizedResponse.common.errorCode !== "" && normalizedResponse.common.errorCode !== "0") {
        setSearchErrorMessage(normalizedResponse.common.errorMessage || "배송지 검색 결과를 확인해주세요.");
      }
    } catch {
      // 네트워크 오류 시 공통 실패 문구를 노출합니다.
      setSearchErrorMessage("배송지 검색에 실패했습니다.");
      setSearchResponse(createDefaultShopOrderAddressSearchResponse());
    } finally {
      // 검색 완료 후 로딩 상태를 해제합니다.
      setIsSearching(false);
    }
  };

  // 검색 폼 제출 시 1페이지 기준으로 검색을 다시 시작합니다.
  const handleSearchSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    await fetchSearchResult(SEARCH_CURRENT_PAGE);
  };

  // 페이지 버튼 클릭 시 선택한 페이지의 검색 결과를 조회합니다.
  const handlePageClick = async (pageNo: number): Promise<void> => {
    if (isSearching || pageNo === currentPage) {
      return;
    }
    await fetchSearchResult(pageNo);
  };

  // 검색 결과 주소를 선택하고 등록 폼 단계로 전환합니다.
  const handleSelectSearchItem = (searchItem: ShopOrderAddressSearchItem): void => {
    setSelectedSearchItem(searchItem);
    setSubmitErrorMessage("");
  };

  // 검색 단계로 되돌리면서 등록 폼 상태를 유지합니다.
  const handleBackToSearch = (): void => {
    setSelectedSearchItem(null);
    setSubmitErrorMessage("");
  };

  // 배송지 등록/수정 API를 호출해 최신 배송지 목록을 반영합니다.
  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const validationMessage = resolveRegisterValidationMessage(selectedSearchItem, addressNm, rsvNm, phoneNumber, detailAddress);
    if (validationMessage !== "") {
      setSubmitErrorMessage(validationMessage);
      return;
    }
    if (!selectedSearchItem) {
      return;
    }

    try {
      // 저장 시작 전 에러를 비우고 로딩 상태를 켭니다.
      setIsSubmitting(true);
      setSubmitErrorMessage("");
      const requestUrl = isEditMode ? getShopOrderAddressUpdatePath() : getShopOrderAddressRegisterPath();
      const requestMethod = isEditMode ? "PUT" : "POST";
      const requestBody = {
        ...(isEditMode ? { originAddressNm: initialAddress?.addressNm ?? "" } : {}),
        addressNm: addressNm.trim(),
        postNo: selectedSearchItem.zipNo,
        baseAddress: selectedSearchItem.roadAddr,
        detailAddress: detailAddress.trim(),
        phoneNumber: phoneNumber.trim(),
        rsvNm: rsvNm.trim(),
        defaultYn: saveAsDefault ? "Y" : "N",
      };
      const result = await requestShopClientApi(requestUrl, {
        method: requestMethod,
        body: requestBody,
      });

      // 세션 만료 시 공통 메시지를 노출합니다.
      if (result.status === 401) {
        window.alert("로그인이 필요합니다.");
        return;
      }

      // 실패 응답이면 서버 메시지를 등록 에러로 노출합니다.
      if (!result.ok || !result.data) {
        setSubmitErrorMessage(result.message || (isEditMode ? "배송지 수정에 실패했습니다." : "배송지 등록에 실패했습니다."));
        return;
      }

      // 정상 응답을 정규화해 부모 화면 상태를 갱신합니다.
      const normalizedResponse = normalizeShopOrderAddressSaveResponse(result.data);
      const safeResponse =
        normalizedResponse.savedAddress || normalizedResponse.defaultAddress || normalizedResponse.addressList.length > 0
          ? normalizedResponse
          : createDefaultShopOrderAddressSaveResponse();
      onSuccess(safeResponse);
    } catch {
      // 네트워크 오류 시 공통 실패 문구를 노출합니다.
      setSubmitErrorMessage(isEditMode ? "배송지 수정에 실패했습니다." : "배송지 등록에 실패했습니다.");
    } finally {
      // 저장 완료 후 로딩 상태를 해제합니다.
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={isEditMode ? "배송지 수정" : "배송지 등록"} onClick={handleOverlayClick}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.headerActionRow}>
            <h2 className={styles.headerTitle}>{isEditMode ? "배송지 수정" : "배송지 등록"}</h2>
            <div className={styles.headerButtonGroup}>
              {selectedSearchItem ? (
                <button type="button" className={styles.headerActionButton} onClick={handleBackToSearch}>
                  검색 결과로 돌아가기
                </button>
              ) : null}
              <button type="button" className={styles.closeButton} aria-label="배송지 등록 팝업 닫기" onClick={onClose}>
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          {!selectedSearchItem ? (
            <>
              <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
                <label className={styles.searchLabel} htmlFor="orderAddressKeyword">
                  주소 검색
                </label>
                <div className={styles.searchInputRow}>
                  <input
                    id="orderAddressKeyword"
                    type="text"
                    className={styles.textInput}
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="도로명 주소를 입력해주세요."
                  />
                  <button type="submit" className={`${styles.primaryButton} ${styles.searchButton}`} disabled={isSearching}>
                    {isSearching ? "검색 중..." : "검색"}
                  </button>
                </div>
              </form>

              <p className={styles.helperText}>예: 테헤란로, 세종대로, 강남대로</p>
              {searchErrorMessage !== "" ? <p className={styles.errorText}>{searchErrorMessage}</p> : null}

              {hasSearched ? (
                searchResponse.jusoList.length === 0 ? (
                  <div className={styles.emptyState}>
                    <strong className={styles.emptyTitle}>검색 결과가 없습니다.</strong>
                    <p className={styles.emptyDescription}>검색어를 다시 확인하고 재검색해주세요.</p>
                  </div>
                ) : (
                  <>
                    <div className={styles.searchResultHeader}>
                      <strong className={styles.searchResultCount}>
                        총 {searchResponse.common.totalCount.toLocaleString("ko-KR")}건
                      </strong>
                      <span className={styles.searchResultMeta}>
                        {currentPage.toLocaleString("ko-KR")} / {Math.max(totalPageCount, 1).toLocaleString("ko-KR")} 페이지
                      </span>
                    </div>

                    <ul className={styles.searchResultList}>
                      {searchResponse.jusoList.map((searchItem) => (
                        <li
                          key={`${searchItem.zipNo}-${searchItem.admCd}-${searchItem.rnMgtSn}-${searchItem.bdMgtSn}-${searchItem.roadAddr}`}
                          className={styles.searchResultListItem}
                        >
                          <button
                            type="button"
                            className={styles.searchResultButton}
                            onClick={() => handleSelectSearchItem(searchItem)}
                          >
                            <strong className={styles.searchResultMainText}>{searchItem.roadAddr}</strong>
                            <p className={styles.searchResultSubText}>{searchItem.jibunAddr}</p>
                            <span className={styles.searchResultZipText}>우편번호 {searchItem.zipNo}</span>
                          </button>
                        </li>
                      ))}
                    </ul>

                    {totalPageCount > 1 ? (
                      <div className={styles.pagination}>
                        <button
                          type="button"
                          className={styles.paginationButton}
                          onClick={() => void handlePageClick(1)}
                          disabled={isSearching || currentPage === 1}
                        >
                          처음
                        </button>
                        <button
                          type="button"
                          className={styles.paginationButton}
                          onClick={() => void handlePageClick(currentPage - 1)}
                          disabled={isSearching || currentPage === 1}
                        >
                          이전
                        </button>

                        <div className={styles.paginationNumberGroup}>
                          {pageNumberList.map((pageNo) => (
                            <button
                              key={pageNo}
                              type="button"
                              className={`${styles.paginationButton} ${pageNo === currentPage ? styles.paginationButtonActive : ""}`}
                              onClick={() => void handlePageClick(pageNo)}
                              disabled={isSearching}
                            >
                              {pageNo}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          className={styles.paginationButton}
                          onClick={() => void handlePageClick(currentPage + 1)}
                          disabled={isSearching || currentPage >= totalPageCount}
                        >
                          다음
                        </button>
                        <button
                          type="button"
                          className={styles.paginationButton}
                          onClick={() => void handlePageClick(totalPageCount)}
                          disabled={isSearching || currentPage >= totalPageCount}
                        >
                          마지막
                        </button>
                      </div>
                    ) : null}
                  </>
                )
              ) : null}
            </>
          ) : (
            <form id={REGISTER_FORM_ID} className={styles.registerForm} onSubmit={handleRegisterSubmit}>
              <div className={styles.selectedSearchCard}>
                <strong className={styles.selectedSearchTitle}>선택한 주소</strong>
                <p className={styles.addressMainText}>
                  ({selectedSearchItem.zipNo}) {selectedSearchItem.roadAddr}
                </p>
                <p className={styles.addressSubText}>{selectedSearchItem.jibunAddr}</p>
              </div>

              <div className={styles.formGrid}>
                <label className={styles.fieldLabel}>
                  <span>배송지명</span>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={addressNm}
                    onChange={(event) => setAddressNm(event.target.value)}
                    maxLength={50}
                    placeholder="예: 집, 회사"
                  />
                </label>

                <label className={styles.fieldLabel}>
                  <span>받는 사람</span>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={rsvNm}
                    onChange={(event) => setRsvNm(event.target.value)}
                    maxLength={20}
                    placeholder="받는 사람 이름을 입력해주세요."
                  />
                </label>

                <label className={styles.fieldLabel}>
                  <span>연락처</span>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(formatPhoneNumberValue(event.target.value))}
                    maxLength={13}
                    placeholder="010-0000-0000"
                  />
                </label>

                <label className={styles.fieldLabel}>
                  <span>우편번호</span>
                  <input type="text" className={`${styles.textInput} ${styles.readOnlyInput}`} value={selectedSearchItem.zipNo} readOnly />
                </label>

                <label className={styles.fieldLabel}>
                  <span>기본주소</span>
                  <input
                    type="text"
                    className={`${styles.textInput} ${styles.readOnlyInput}`}
                    value={selectedSearchItem.roadAddr}
                    readOnly
                  />
                </label>

                <label className={styles.fieldLabel}>
                  <span>상세주소</span>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={detailAddress}
                    onChange={(event) => setDetailAddress(event.target.value)}
                    maxLength={125}
                    placeholder="상세주소를 입력해주세요."
                  />
                </label>
              </div>

              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={saveAsDefault} onChange={(event) => setSaveAsDefault(event.target.checked)} />
                <span>기본 배송지로 저장</span>
              </label>

              {submitErrorMessage !== "" ? <p className={styles.errorText}>{submitErrorMessage}</p> : null}
            </form>
          )}
        </div>

        {selectedSearchItem ? (
          <div className={styles.panelFooter}>
            <div className={styles.footerButtonRow}>
              <button
                type="button"
                className={`${styles.secondaryButton} ${styles.footerButton}`}
                onClick={handleBackToSearch}
                disabled={isSubmitting}
              >
                검색 결과로 돌아가기
              </button>
              <button
                type="submit"
                form={REGISTER_FORM_ID}
                className={`${styles.primaryButton} ${styles.footerButton}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (isEditMode ? "수정 중..." : "등록 중...") : isEditMode ? "배송지 수정" : "배송지 저장"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
