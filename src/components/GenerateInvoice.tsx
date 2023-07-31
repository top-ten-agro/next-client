import { toBdt } from "@/lib/formatter";
import type { Invoice } from "@/lib/types";
import Button from "@mui/material/Button";
import dayjs from "dayjs";
import "dayjs/locale/bn-bd";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import { logoUri } from "@/assets/logo.mjs";

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
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow?.document.write(`
  <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Invoice#${invoice.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; background: #f5f5f5; height:100%; }
          * { margin: 0; padding: 0; }
          .container { width: 800px; height:100%; margin-inline: auto; padding: 20px; background: #fff; position: relative; }
          .header { margin-top: 10px; width: 450px; margin-inline: auto; position:absolute; top:0; left:0; right:0; }
          .header h1 { font-size: xx-large; }
          .header p { font-size: small; }
          .logo { display: inline-block; vertical-align: middle; max-width: 100px; margin-right: 10px; }
          .company-info { display: inline-block; vertical-align: middle; }
          .products-table, .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .products-table th, .products-table td { padding: 5px; text-align: left; border-bottom: 1px solid #ddd; }
          .summary-table th, .summary-table td { padding: 5px; text-align: left; }
          .products-table th { background-color: #f5f5f5; }
          .invoice-info { display: grid; grid-template-columns: 1fr 1fr; padding: 10px; }
          .print-btn { padding:10px 20px; }
          .cancel-btn { padding:10px 20px; }
          .actions { display: flex; justify-content: center; padding: 10px; gap: 10px; }
          .footer { 
            margin-top: 100px; 
            display:flex; 
            justify-content:space-between; 
            gap:20px; 
            position:absolute; 
            bottom:0; 
            left:0; 
            right:0 
          }
          .footer div { width:15%; text-align: center; border-top:2px solid #000; padding: 10px 20px; }
          @media print {
            .actions { display: none; } 
            @page {
              margin-left: 0.5in;
              margin-right: 0.5in;
              margin-top: 0;
              margin-bottom: 0;
            }
            .header, .footer {
              display: fixed;
            }
          }
        </style>
      </head>
      <body>
        <div class="actions">
          <button onclick="window.print();" class="print-btn">Print Invoice</button>
          <button onclick="window.close();" class="cancel-btn">Go Back</button>
        </div>
        <div class="container">
          <div class="header">
            <img class="logo" src="${logoUri}" alt="Company Logo" />
            <div class="company-info">
              <h2 class="company-name">টপ টেন এগ্রো কেমিক্যালস</h2>
              <p>৪২/১ সেগুন বাগিচা, ঢাকা-১০০০</p>
              <p>মোবাইলঃ ০১৭৫৭-৮০৬৫৭৫</p>
            </div>
          </div>
          <div style="height:110px"></div>
          <h2 style="font-size: x-large">ইনভয়েস</h2>
          <hr />
          <div class="invoice-info">
            <div class="customer-info">
              <table border="0">
                <p>ইনভয়েস নংঃ ${invoice.id}</p>
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
                <th style="text-align: right">মূল্য</th>
                <th style="text-align: right">মোট মূল্য</th>
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
                <td colspan="5" style="text-align: right">${toBdt(
                  +invoice.commission / 100,
                  {
                    decimal: 1,
                    locale: "bn-BD",
                    style: "percent",
                  }
                )} কমিশনঃ </td>
                <td style="text-align: right">${toBdt(
                  -(+invoice.commission / 100) * subtotal,
                  {
                    decimal: 0,
                    locale: "bn-BD",
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
                  }
                )}</td>
              </tr>`
                  : ""
              }
            </tfoot>
          </table>
          <div>
            <table class="summary-table">
              <tr>
                <td>মোট সেলঃ ${toBdt(+invoice.balance.sales, {
                  decimal: 0,
                  locale: "bn-BD",
                })}</td> 
                <td>মোট রিকভারিঃ ${toBdt(+invoice.balance.cash_in, {
                  decimal: 0,
                  locale: "bn-BD",
                })}</td>
                <td>মোট বকেয়াঃ ${toBdt(
                  +invoice.balance.sales - +invoice.balance.cash_in,
                  {
                    decimal: 0,
                    locale: "bn-BD",
                  }
                )}</td> 
              </tr>
            </table>
          </div>
          <div style="height:120px"></div>
          <div class="footer">
            <div>ডিপো ইনচার্জ</div> 
            <div>ড্রাইভার</div> 
            <div>অফিসার</div> 
            <div>কাস্টমার</div> 
          </div>
        </div>
      </body>
    </html>    
    `);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}
