import { Invoice } from "@/lib/types";

class InvoicePrinter extends HTMLElement {
  private _invoice: Invoice | null = null;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  render() {
    const template = document.createElement("template");
    template.innerHTML = ``;
  }
}
