import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { NextApiRequest, NextApiResponse } from "next";
export const dataUrl = `base64,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`;

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  const doc = new jsPDF();
  autoTable(doc, {
    body: [
      [
        {
          content: "Company brand",
          styles: {
            halign: "left",
            fontSize: 20,
            textColor: "#ffffff",
          },
        },
        {
          content: "Invoice",
          styles: {
            halign: "right",
            fontSize: 20,
            textColor: "#ffffff",
          },
        },
      ],
    ],
    theme: "plain",
    didDrawPage: function (data) {
      const totalPagesExp = "{total_pages_count_string}";
      // Header
      doc.setFontSize(20);
      doc.setTextColor(40);

      doc.addImage(
        `<img src="${dataUrl}" />`,
        "JPEG",
        data.settings.margin.left,
        15,
        100,
        100
      );

      doc.text("Top Ten Agrovet", data.settings.margin.left + 15, 22);

      // Footer
      let str = `"Page" ${doc.internal.pages.length}`;
      // Total page number plugin only available in jspdf v1.0+
      if (typeof doc.putTotalPages === "function") {
        str = str + " of " + totalPagesExp;
      }
      doc.setFontSize(10);

      // jsPDF 1.4+ uses getWidth, <1.4 uses .width
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height
        ? pageSize.height
        : pageSize.getHeight();
      doc.text(str, data.settings.margin.left, pageHeight - 10);
    },
  });

  autoTable(doc, {
    body: [
      [
        {
          content:
            "Reference: #INV0001" +
            "\nDate: 2022-01-27" +
            "\nInvoice number: 123456",
          styles: {
            halign: "right",
          },
        },
      ],
    ],
    theme: "plain",
  });

  autoTable(doc, {
    body: [
      [
        {
          content:
            "Billed to:" +
            "\nJohn Doe" +
            "\nBilling Address line 1" +
            "\nBilling Address line 2" +
            "\nZip code - City" +
            "\nCountry",
          styles: {
            halign: "left",
          },
        },
        {
          content:
            "Shipping address:" +
            "\nJohn Doe" +
            "\nShipping Address line 1" +
            "\nShipping Address line 2" +
            "\nZip code - City" +
            "\nCountry",
          styles: {
            halign: "left",
          },
        },
        {
          content:
            "From:" +
            "\nCompany name" +
            "\nShipping Address line 1" +
            "\nShipping Address line 2" +
            "\nZip code - City" +
            "\nCountry",
          styles: {
            halign: "right",
          },
        },
      ],
    ],
    theme: "plain",
  });

  autoTable(doc, {
    body: [
      [
        {
          content: "Amount due:",
          styles: {
            halign: "right",
            fontSize: 14,
          },
        },
      ],
      [
        {
          content: "$4000",
          styles: {
            halign: "right",
            fontSize: 20,
            textColor: "#3366ff",
          },
        },
      ],
      [
        {
          content: "Due date: 2022-02-01",
          styles: {
            halign: "right",
          },
        },
      ],
    ],
    theme: "plain",
  });

  autoTable(doc, {
    body: [
      [
        {
          content: "Products & Services",
          styles: {
            halign: "left",
            fontSize: 14,
          },
        },
      ],
    ],
    theme: "plain",
  });

  autoTable(doc, {
    head: [["Items", "Category", "Quantity", "Price", "Tax", "Amount"]],
    body: [
      ["Product or service name", "Category", "2", "$450", "$50", "$1000"],
      ["Product or service name", "Category", "2", "$450", "$50", "$1000"],
      ["Product or service name", "Category", "2", "$450", "$50", "$1000"],
      ["Product or service name", "Category", "2", "$450", "$50", "$1000"],
    ],
    theme: "striped",
    headStyles: {
      fillColor: "#343a40",
    },
  });

  autoTable(doc, {
    body: [
      [
        {
          content: "Subtotal:",
          styles: {
            halign: "right",
          },
        },
        {
          content: "$3600",
          styles: {
            halign: "right",
          },
        },
      ],
      [
        {
          content: "Total tax:",
          styles: {
            halign: "right",
          },
        },
        {
          content: "$400",
          styles: {
            halign: "right",
          },
        },
      ],
      [
        {
          content: "Total amount:",
          styles: {
            halign: "right",
          },
        },
        {
          content: "$4000",
          styles: {
            halign: "right",
          },
        },
      ],
    ],
    theme: "plain",
  });

  autoTable(doc, {
    body: [
      [
        {
          content: "Terms & notes",
          styles: {
            halign: "left",
            fontSize: 14,
          },
        },
      ],
      [
        {
          content:
            "orem ipsum dolor sit amet consectetur adipisicing elit. Maxime mollitia" +
            "molestiae quas vel sint commodi repudiandae consequuntur voluptatum laborum" +
            "numquam blanditiis harum quisquam eius sed odit fugiat iusto fuga praesentium",
          styles: {
            halign: "left",
          },
        },
      ],
    ],
    theme: "plain",
  });

  autoTable(doc, {
    body: [
      [
        {
          content: "This is a centered footer",
          styles: {
            halign: "center",
          },
        },
      ],
    ],
    theme: "plain",

    margin: { top: 30 },
  });

  const file = doc.output();
  res.setHeader("Content-Type", "application/pdf");
  res.send(file);
};

export default handler;
