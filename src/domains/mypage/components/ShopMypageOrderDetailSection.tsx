import type { ShopMypageOrderAmountSummary, ShopMypageOrderDetailPageResponse } from "@/domains/mypage/types";
import {
  createShopMypageOrderPolicyList,
  formatShopMypageOrderPrice,
} from "@/domains/mypage/utils/shopMypageOrder";
import ShopMypageOrderCardList from "./ShopMypageOrderCardList";
import styles from "./ShopMypageOrderSection.module.css";

interface ShopMypageOrderAmountCell {
  key: string;
  label: string;
  amount: number;
  note?: string;
  isStrong?: boolean;
}

interface ShopMypageOrderAmountColumn {
  key: string;
  title: string;
  itemList: ShopMypageOrderAmountCell[];
}

interface ShopMypageOrderDetailSectionProps {
  orderDetailPageData: ShopMypageOrderDetailPageResponse;
}

// 주문상세 금액 요약의 혜택 합계를 계산합니다.
function resolveShopMypageOrderBenefitDiscountAmt(amountSummary: ShopMypageOrderAmountSummary): number {
  return (
    amountSummary.totalGoodsCouponDiscountAmt +
    amountSummary.totalCartCouponDiscountAmt +
    amountSummary.totalPointUseAmt
  );
}

// 주문상세 결제 금액 표 컬럼 목록을 생성합니다.
function createShopMypageOrderAmountColumnList(
  amountSummary: ShopMypageOrderAmountSummary,
): ShopMypageOrderAmountColumn[] {
  const benefitDiscountAmt = resolveShopMypageOrderBenefitDiscountAmt(amountSummary);
  const deliveryCouponNote =
    amountSummary.deliveryCouponDiscountAmt > 0
      ? `(배송비쿠폰 ${formatShopMypageOrderPrice(amountSummary.deliveryCouponDiscountAmt)}원 사용)`
      : undefined;

  return [
    {
      key: "goodsPrice",
      title: "상품가격",
      itemList: [
        { key: "totalSupplyAmt", label: "상품가격", amount: amountSummary.totalSupplyAmt },
        { key: "totalGoodsDiscountAmt", label: "상품할인", amount: amountSummary.totalGoodsDiscountAmt },
      ],
    },
    {
      key: "discountBenefit",
      title: "주문 상품별 할인",
      itemList: [
        {
          key: "totalGoodsCouponDiscountAmt",
          label: "상품쿠폰",
          amount: amountSummary.totalGoodsCouponDiscountAmt,
        },
        {
          key: "totalCartCouponDiscountAmt",
          label: "장바구니쿠폰",
          amount: amountSummary.totalCartCouponDiscountAmt,
        },
        { key: "totalPointUseAmt", label: "포인트", amount: amountSummary.totalPointUseAmt },
      ],
    },
    {
      key: "finalAmount",
      title: "최종금액",
      itemList: [
        { key: "totalOrderAmt", label: "상품 판매가", amount: amountSummary.totalOrderAmt },
        { key: "benefitDiscountAmt", label: "할인 총액", amount: benefitDiscountAmt },
        {
          key: "deliveryFeeAmt",
          label: "배송비",
          amount: amountSummary.deliveryFeeAmt,
          note: deliveryCouponNote,
        },
        {
          key: "finalPayAmt",
          label: "결제금액",
          amount: amountSummary.finalPayAmt,
          isStrong: true,
        },
      ],
    },
  ];
}

// 마이페이지 주문상세 화면을 렌더링합니다.
export default function ShopMypageOrderDetailSection({ orderDetailPageData }: ShopMypageOrderDetailSectionProps) {
  const { order, amountSummary } = orderDetailPageData;

  // 주문 정보가 없으면 빈 화면을 반환합니다.
  if (!order) {
    return null;
  }

  // 금액 표 컬럼과 상태별 정책 목록을 화면 렌더링용으로 구성합니다.
  const amountColumnList = createShopMypageOrderAmountColumnList(amountSummary);
  const orderPolicyList = createShopMypageOrderPolicyList();

  return (
    <section className={styles.orderSection}>
      <header className={styles.orderHeader}>
        <div>
          <h1 className={styles.orderTitle}>주문상세</h1>
        </div>
      </header>

      <div className={styles.detailMetaRow}>
        <p className={styles.detailMetaText}>주문번호 {order.ordNo}</p>
        <p className={`${styles.detailMetaText} ${styles.detailMetaTextRight}`}>주문일시 {order.orderDt || "-"}</p>
      </div>

      <ShopMypageOrderCardList orderList={[order]} />

      <section className={styles.detailSectionBlock}>
        <h2 className={styles.detailSectionTitle}>상세 결제 금액</h2>
        <div className={styles.detailAmountTable}>
          {amountColumnList.map((amountColumn) => (
            <section key={amountColumn.key} className={styles.detailAmountColumn}>
              <h3 className={styles.detailAmountColumnTitle}>{amountColumn.title}</h3>
              <div className={styles.detailAmountItemList}>
                {amountColumn.itemList.map((amountItem) => (
                  <div key={amountItem.key} className={styles.detailAmountItem}>
                    <span className={styles.detailAmountLabel}>{amountItem.label}</span>
                    <div className={styles.detailAmountValueWrap}>
                      <span
                        className={`${styles.detailAmountValue} ${amountItem.isStrong ? styles.detailAmountValueStrong : ""}`}
                      >
                        {formatShopMypageOrderPrice(amountItem.amount)}원
                      </span>
                      {amountItem.note ? <span className={styles.detailAmountNote}>{amountItem.note}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className={styles.detailSectionBlock}>
        <h2 className={styles.detailSectionTitle}>상태별 이용 안내</h2>
        <ul className={styles.policyList}>
          {orderPolicyList.map((orderPolicy) => (
            <li key={orderPolicy.ordDtlStatCd} className={styles.policyListItem}>
              <div className={styles.policyListHead}>
                <span className={styles.policyState}>{orderPolicy.ordDtlStatNm}</span>
                <span className={styles.policyActionSummary}>가능 기능: {orderPolicy.availableActionLabelList.join(", ")}</span>
              </div>
              <p className={styles.policyDescription}>{orderPolicy.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
