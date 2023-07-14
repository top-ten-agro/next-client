import { toBdt } from "@/lib/formatter";
import type { Invoice } from "@/lib/types";
import Button from "@mui/material/Button";
import dayjs from "dayjs";
import "dayjs/locale/bn-bd";
import LocalizedFormat from "dayjs/plugin/localizedFormat";

dayjs.extend(LocalizedFormat);

const GenerateInvoice = ({
  invoice,
  subtotal,
}: {
  invoice: Invoice;
  subtotal: number;
}) => {
  return (
    <Button onClick={() => generatePdf(invoice, subtotal)}>Generate PDF</Button>
  );
};

export default GenerateInvoice;

function generatePdf(invoice: Invoice, subtotal: number) {
  const printWindow = window.open("", "", "height=1200,width=800");
  if (!printWindow) return;
  printWindow?.document.write(`
  <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Invoice#${invoice.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          * { margin: 0; padding: 0; }
          .container { width: 800px; margin-inline: auto; }
          .header { margin-bottom: 20px; width: 450px; margin-inline: auto; }
          .header h1 { font-size: xx-large; }
          .header p { font-size: small; }
          .logo { display: inline-block; vertical-align: middle; max-width: 100px; margin-right: 10px; }
          .company-info { display: inline-block; vertical-align: middle; }
          .products-table, .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .summary-table th, .summary-table td, .products-table th, .products-table td { padding: 5px; text-align: left; border-bottom: 1px solid #ddd; }
          .products-table th { background-color: #f5f5f5; }
          .invoice-info { display: grid; grid-template-columns: 1fr 1fr; padding: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img class="logo" src="/logo.jpg" alt="Company Logo" />
            <div class="company-info">
              <h2 class="company-name">টপ টেন এগ্রো কেমিক্যালস</h2>
              <p>৪২/১ সেগুন বাগিচা, ঢাকা-১০০০</p>
              <p>মোবাইলঃ ০১৭৫৭-৮০৬৫৭৫</p>
            </div>
          </div>
          <h2 style="font-size: x-large">ইনভয়েস</h2>
          <hr />
          <div class="invoice-info">
            <div class="customer-info">
              <table border="0">
                <p>আইডি নংঃ ${invoice.id}</p>
                <p>তারিখঃ ${dayjs(invoice.created_at).format("DD/MM/YYYY")}</p>
                <p>অফিসারঃ ${invoice.created_by.name}</p>
              </table>
            </div>
            <div class="customer-info">
              <p>কাস্টমার আইডিঃ ${invoice.balance.customer.id}</p>
              <p>নামঃ ${invoice.balance.customer.name}</p>
              <p>ঠিকানাঃ ${invoice.balance.customer.address}</p>
            </div>
          </div>
          <hr style="margin-bottom: 20px" />
          <h2
            style="
              font-size: large;
              text-align: center;
              margin-bottom: 10px;
              text-decoration: underline;
            "
          >
            পন্যের বিবরণ
          </h2>
          <table class="products-table">
            <thead>
              <tr>
                <th>নং</th>
                <th>পন্যের নাম</th>
                <th>প্যাক সাইজ</th>
                <th>কার্টন</th>
                <th>মূল্য</th>
                <th>মোট মূল্য</th>
              </tr>
            </thead>
            <tbody>
            ${invoice.items
              .map(
                (item, i) => `      
                <tr>
                  <td>${i + 1}</td>
                  <td>${item.product.name}</td>
                  <td>${item.product.pack_size}</td>
                  <td>${toBdt(item.quantity, {
                    decimal: 0,
                    locale: "bn-BD",
                    style: "decimal",
                  })}</td>
                  <td style="text-align: right">${toBdt(+item.rate, {
                    decimal: 0,
                    locale: "bn-BD",
                  })}</td>
                  <td style="text-align: right">${toBdt(
                    item.quantity * +item.rate,
                    { decimal: 0, locale: "bn-BD" }
                  )}</td>
                </tr>
              `
              )
              .join("")} 
            </tbody>
            <tfoot style="font-weight: bold">
              <tr>
                <td colspan="5" style="text-align: right">মোটঃ</td>
                <td style="text-align: right">${toBdt(subtotal, {
                  decimal: 0,
                  locale: "bn-BD",
                })}</td>
              </tr>
              ${
                +invoice.commission > 0
                  ? `
              <tr>
                <td colspan="5" style="text-align: right">কমিশন (${toBdt(
                  +invoice.commission,
                  {
                    decimal: 0,
                    locale: "bn-BD",
                    style: "percent",
                  }
                )}) ঃ</td>
                <td style="text-align: right">${toBdt(
                  -(+invoice.commission / 100) * subtotal,
                  {
                    decimal: 0,
                    locale: "bn-BD",
                    style: "percent",
                  }
                )}</td>
              </tr>
              <tr>
                <td colspan="5" style="text-align: right">সর্বমোটঃ</td>
                <td style="text-align: right">${toBdt(
                  subtotal - (+invoice.commission / 100) * subtotal,
                  {
                    decimal: 0,
                    locale: "bn-BD",
                    style: "percent",
                  }
                )}</td>
              </tr>`
                  : ""
              }
            </tfoot>
          </table>
          <div style="display: flex; justify-content: end">
            <table class="summary-table" style="max-width: 320px">
              <tr>
                <th style="text-align: right">মোট সেলঃ</th>
                <td style="text-align: right">${toBdt(+invoice.balance.sales, {
                  decimal: 0,
                  locale: "bn-BD",
                })}</td>
              </tr>
              <tr>
                <th style="text-align: right">মোট রিকভারিঃ</th>
                <td style="text-align: right">${toBdt(
                  +invoice.balance.cash_in,
                  {
                    decimal: 0,
                    locale: "bn-BD",
                  }
                )}</td>
              </tr>
              <tr>
                <th style="text-align: right">মোট বাকিঃ</th>
                <td style="text-align: right">${toBdt(
                  +invoice.balance.sales - +invoice.balance.cash_in,
                  {
                    decimal: 0,
                    locale: "bn-BD",
                  }
                )}</td>
              </tr>
            </table>
          </div>
        </div>
      </body>
    </html>    
    `);
  printWindow.document.close();
  printWindow.print();
  printWindow.onafterprint = () => printWindow.close();
}
