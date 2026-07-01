import { request, getToken } from "./api.js";
import {
  DOC_LABELS,
  number,
  dateThai,
  escapeHtml,
  thaiBahtText,
} from "./utils.js";

if (!getToken()) {
  location.replace("./index.html");
}

const id = new URLSearchParams(location.search).get("id");
const root = document.getElementById("print-document");

const printModeSelect = document.getElementById("print-mode-select");
const printButton = document.getElementById("print-button");

const savedPrintMode =
  localStorage.getItem("tong_billing_print_mode") || "color";

printModeSelect.value =
  savedPrintMode === "mono" ? "mono" : "color";

function applyPrintMode(mode) {
  const nextMode = mode === "mono" ? "mono" : "color";

  document.body.classList.toggle(
    "print-monochrome",
    nextMode === "mono",
  );

  localStorage.setItem(
    "tong_billing_print_mode",
    nextMode,
  );
}

applyPrintMode(printModeSelect.value);

printModeSelect.addEventListener("change", (event) => {
  applyPrintMode(event.currentTarget.value);
});

printButton.addEventListener("click", () => {
  window.print();
});

/**
 * สร้างแถวสรุปยอดให้อยู่ใน tfoot
 * ของตารางรายการเดียวกัน เพื่อให้คอลัมน์ตรงกัน
 */
function summaryRows(doc) {
  const rows = [];

  rows.push(["รวมเป็นเงิน", doc.subtotal]);

  if (Number(doc.discount) > 0) {
    rows.push([
      "ส่วนลด",
      `-${number(doc.discount)}`,
    ]);
  }

  if (Number(doc.withholding_amount) > 0) {
    rows.push([
      `หัก ณ ที่จ่าย ${Number(
        doc.withholding_rate,
      )}%`,
      `-${number(doc.withholding_amount)}`,
    ]);
  }

  if (Number(doc.transfer_fee) > 0) {
    rows.push([
      "ค่าธรรมเนียมโอน",
      `-${number(doc.transfer_fee)}`,
    ]);
  }

  rows.push([
    doc.document_type === "RC"
      ? "ยอดรับสุทธิ"
      : "รวมสุทธิ",
    doc.net_total,
  ]);

  return rows
    .map(([label, value], index) => {
      const isLastRow =
        index === rows.length - 1;

      const displayValue =
        typeof value === "string" &&
        value.startsWith("-")
          ? value
          : number(value);

      return `
        <tr class="${isLastRow ? "net-row" : ""}">
          ${
            index === 0
              ? `
                <td
                  colspan="4"
                  rowspan="${rows.length}"
                  class="baht-text-cell"
                >
                  ${thaiBahtText(doc.net_total)}
                </td>
              `
              : ""
          }

          <th class="summary-label">
            ${escapeHtml(label)}
          </th>

          <td class="summary-value">
            ${displayValue}
          </td>
        </tr>
      `;
    })
    .join("");
}

function paymentBox(doc) {
  if (
    !["IN", "BN"].includes(doc.document_type)
  ) {
    return "";
  }

  const customerType =
    doc.customer_snapshot.customer_type;

  let bank = "";

  if (customerType === "private") {
    bank = doc.settings.scb_bank_details;
  }

  if (customerType === "government") {
    bank = doc.settings.ktb_bank_details;
  }

  if (!bank) {
    return "";
  }

  return `
    <section class="payment-box">
      <strong>รายละเอียดการชำระเงิน</strong>

      <div>
        ${escapeHtml(bank).replaceAll(
          "\n",
          "<br>",
        )}
      </div>
    </section>
  `;
}

function signatures(doc) {
  const savedSignature =
    doc.settings.saved_signature_url
      ? `
        <img
          class="signature-image"
          src="${escapeHtml(
            doc.settings.saved_signature_url,
          )}"
          alt="ลายเซ็น"
          referrerpolicy="no-referrer"
          onerror="this.style.display='none'"
        >
      `
      : "<div></div>";

  const formattedDate = dateThai(
    doc.document_date,
  );

  if (doc.document_type === "BN") {
    return `
      <section class="signature-grid">
        <div class="signature-box">
          <strong>ผู้รับบิล / Recipient</strong>

          <div>
            ลงชื่อ........................................
            <br>
            วันที่........................................
          </div>
        </div>

        <div class="signature-box">
          <strong>ผู้วางบิล</strong>

          ${savedSignature}

          <div>
            ลงชื่อ........................................
            <br>
            วันที่ ${formattedDate}
          </div>
        </div>
      </section>
    `;
  }

  if (doc.document_type === "DO") {
    return `
      <section class="signature-grid">
        <div class="signature-box">
          <strong>ผู้รับของ / Receiver</strong>

          <span>
            ได้รับสินค้าตามรายการถูกต้องแล้ว
          </span>

          <div>
            ลงชื่อ........................................
            <br>
            วันที่........................................
          </div>
        </div>

        <div class="signature-box">
          <strong>ผู้ส่งของ / Delivered By</strong>

          ${savedSignature}

          <div>
            ลงชื่อ........................................
            <br>
            วันที่ ${formattedDate}
          </div>
        </div>
      </section>
    `;
  }

  let rightLabel = "ผู้จัดทำเอกสาร";

  if (doc.document_type === "QT") {
    rightLabel = "ผู้เสนอราคา";
  }

  if (doc.document_type === "RC") {
    rightLabel = "ผู้รับเงิน";
  }

  return `
    <section
      class="signature-grid"
      style="
        grid-template-columns: 1fr;
        max-width: 50%;
        margin-left: auto;
      "
    >
      <div class="signature-box">
        <strong>${rightLabel}</strong>

        ${savedSignature}

        <div>
          ลงชื่อ........................................
          <br>
          ${escapeHtml(
            doc.settings.shop_owner ||
              doc.created_by_name ||
              "",
          )}
          <br>
          วันที่ ${formattedDate}
        </div>
      </div>
    </section>
  `;
}

function renderDocumentItems(doc) {
  let itemSequence = 0;

  return doc.items
    .map((item) => {
      if (item.line_type === "section") {
        return `
          <tr class="section-row">
            <td></td>

            <td colspan="5">
              ${escapeHtml(item.description)}
            </td>
          </tr>
        `;
      }

      if (item.line_type === "note") {
        const warningClass =
          item.text_style === "warning"
            ? "warning-row"
            : "";

        return `
          <tr class="note-row ${warningClass}">
            <td></td>

            <td colspan="5">
              ${escapeHtml(item.description)}
            </td>
          </tr>
        `;
      }

      itemSequence += 1;

      return `
        <tr>
          <td class="center">
            ${itemSequence}
          </td>

          <td>
            ${escapeHtml(item.description)}
          </td>

          <td class="center">
            ${number(item.quantity).replace(
              ".00",
              "",
            )}
          </td>

          <td class="center">
            ${escapeHtml(item.unit || "")}
          </td>

          <td class="number">
            ${number(item.unit_price)}
          </td>

          <td class="number">
            ${number(item.line_total)}
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderTerms(doc) {
  const hasTerms =
    doc.remarks ||
    doc.payment_terms ||
    doc.delivery_days != null ||
    doc.quotation_validity_days != null;

  if (!hasTerms) {
    return "";
  }

  return `
    <section class="terms">
      <strong>หมายเหตุ / เงื่อนไข</strong>

      ${
        doc.remarks
          ? `
            <div>
              ${escapeHtml(
                doc.remarks,
              ).replaceAll("\n", "<br>")}
            </div>
          `
          : ""
      }

      ${
        doc.payment_terms
          ? `
            <div>
              เงื่อนไขการชำระ:
              ${escapeHtml(doc.payment_terms)}
            </div>
          `
          : ""
      }

      ${
        doc.delivery_days != null
          ? `
            <div>
              กำหนดส่งงานภายใน
              ${doc.delivery_days} วัน
            </div>
          `
          : ""
      }

      ${
        doc.quotation_validity_days != null
          ? `
            <div>
              ราคานี้ยืนได้
              ${doc.quotation_validity_days} วัน
            </div>
          `
          : ""
      }
    </section>
  `;
}

async function render() {
  if (!id) {
    throw new Error("ไม่พบรหัสเอกสาร");
  }

  const { data: doc } = await request(
    `/documents/${id}`,
  );

  root.dataset.documentType =
    doc.document_type;

  document.title = `${doc.document_number} | ${
    DOC_LABELS[doc.document_type]
  }`;

  const customer = doc.customer_snapshot;
  const items = renderDocumentItems(doc);

  root.innerHTML = `
    <header class="doc-header">
      <img
        class="doc-logo"
        src="${escapeHtml(
          doc.settings.logo_url ||
            "./assets/logo-placeholder.svg",
        )}"
        alt="โลโก้"
        referrerpolicy="no-referrer"
        onerror="
          this.onerror = null;
          this.src = './assets/logo-placeholder.svg';
        "
      >

      <div class="shop-info">
        <h1>
          ${escapeHtml(
            doc.settings.shop_name_th || "",
          )}
        </h1>

        <p>
          ${escapeHtml(
            doc.settings.shop_name_en || "",
          )}
        </p>

        <p>
          ${escapeHtml(
            doc.settings.shop_address || "",
          )}
        </p>

        <p>
          เลขผู้เสียภาษี
          ${escapeHtml(
            doc.settings.shop_tax_id || "-",
          )}
          · โทร
          ${escapeHtml(
            doc.settings.shop_phone || "-",
          )}
        </p>

        <p>
          ${escapeHtml(
            doc.settings.shop_email || "",
          )}
        </p>
      </div>

      <div class="doc-title">
        <h2>
          ${DOC_LABELS[doc.document_type]}
        </h2>

        <strong>
          เลขที่
          ${escapeHtml(doc.document_number)}
        </strong>

        <span>
          วันที่
          ${dateThai(doc.document_date)}
        </span>
      </div>
    </header>

    <section class="customer-grid">
      <div class="box">
        <strong>นามลูกค้า / Name</strong>

        <p>${escapeHtml(customer.name)}</p>

        <strong>ที่อยู่ / Address</strong>

        <p>
          ${escapeHtml(
            customer.address || "-",
          )}
        </p>
      </div>

      <div class="box">
        <p>
          <strong>เลขผู้เสียภาษี:</strong>
          ${escapeHtml(
            customer.tax_id || "-",
          )}
        </p>

        <p>
          <strong>โทร:</strong>
          ${escapeHtml(customer.phone || "-")}
        </p>

        <p>
          <strong>ครบกำหนด:</strong>
          ${
            doc.due_date
              ? dateThai(doc.due_date)
              : "-"
          }
        </p>
      </div>
    </section>

    <table class="doc-table">
      <colgroup>
        <col class="col-index">
        <col class="col-description">
        <col class="col-quantity">
        <col class="col-unit">
        <col class="col-price">
        <col class="col-amount">
      </colgroup>

      <thead>
        <tr>
          <th>ลำดับ</th>
          <th>รายการ</th>
          <th>จำนวน</th>
          <th>หน่วย</th>
          <th>ราคา/หน่วย</th>
          <th>จำนวนเงิน</th>
        </tr>
      </thead>

      <tbody>
        ${items}
      </tbody>

      <tfoot>
        ${summaryRows(doc)}
      </tfoot>
    </table>

    ${renderTerms(doc)}

    ${paymentBox(doc)}

    ${signatures(doc)}

    <footer class="footer-note">
      เอกสารสร้างจากระบบ
      Tong Service IT Billing
    </footer>
  `;
}

render().catch((error) => {
  root.innerHTML = `
    <p style="color: #b91c1c">
      ${escapeHtml(error.message)}
    </p>
  `;
});
