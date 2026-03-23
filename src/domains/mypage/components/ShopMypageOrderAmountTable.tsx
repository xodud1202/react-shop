import styles from "./ShopMypageOrderSection.module.css";

export interface ShopMypageOrderAmountTableItem {
  key: string;
  label: string;
  valueText: string;
  note?: string;
  isStrong?: boolean;
}

export interface ShopMypageOrderAmountTableColumn {
  key: string;
  title: string;
  itemList: ShopMypageOrderAmountTableItem[];
}

interface ShopMypageOrderAmountTableProps {
  columnList: ShopMypageOrderAmountTableColumn[];
}

// 마이페이지 주문 금액 테이블 공통 UI를 렌더링합니다.
export default function ShopMypageOrderAmountTable({ columnList }: ShopMypageOrderAmountTableProps) {
  return (
    <div className={styles.detailAmountTable}>
      {columnList.map((amountColumn) => (
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
                    {amountItem.valueText}
                  </span>
                  {amountItem.note ? <span className={styles.detailAmountNote}>{amountItem.note}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
