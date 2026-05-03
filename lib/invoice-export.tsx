import {
  Document as PdfDocument,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType } from "docx";
import { getCompanySettings, getInvoiceDetails } from "@/lib/data";

const styles = StyleSheet.create({
  page: { fontSize: 10.5, padding: 28, fontFamily: "Helvetica", color: "#111827" },
  brandHeader: {
    backgroundColor: "#4F46E5",
    borderRadius: 8,
    color: "#ffffff",
    padding: 14,
    marginBottom: 18,
  },
  brandName: { fontSize: 16, fontWeight: 700 },
  brandTag: { fontSize: 9, marginTop: 2, opacity: 0.9 },
  topRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  heading: { fontSize: 18, fontWeight: 700 },
  subtle: { fontSize: 10, color: "#6B7280" },
  row: { marginBottom: 4 },
  sectionTitle: { fontSize: 10, color: "#6B7280", marginBottom: 4 },
  table: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 6, overflow: "hidden" },
  tableHeader: { flexDirection: "row", backgroundColor: "#F3F4F6", paddingVertical: 6, paddingHorizontal: 8 },
  tableRow: { flexDirection: "row", borderTop: "1 solid #eee", paddingVertical: 6, paddingHorizontal: 8 },
  colDesc: { width: "50%" },
  colQty: { width: "16%" },
  colPrice: { width: "17%" },
  colTotal: { width: "17%" },
  totalsCard: {
    marginTop: 12,
    marginLeft: "auto",
    width: 220,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    padding: 8,
  },
  totalLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  totalLabel: { color: "#6B7280" },
  grandTotal: { marginTop: 4, borderTop: "1 solid #E5E7EB", paddingTop: 6, fontSize: 11, fontWeight: 700 },
  footer: { marginTop: 18, fontSize: 9, color: "#6B7280" },
});

export async function getInvoiceExportPayload(invoiceId: string) {
  const [invoice, company] = await Promise.all([
    getInvoiceDetails(invoiceId),
    getCompanySettings(),
  ]);

  return {
    invoice,
    company,
  };
}

function InvoicePdfTemplate({ payload }: { payload: Awaited<ReturnType<typeof getInvoiceExportPayload>> }) {
  const { invoice, company } = payload;
  const companyName = company.company_name || "Prism Labs";

  return (
    <PdfDocument>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandHeader}>
          <Text style={styles.brandName}>Prism Labs</Text>
          <Text style={styles.brandTag}>Invoice & Revenue Operations</Text>
        </View>

        <View style={styles.topRow}>
          <View>
            <Text style={styles.heading}>Invoice</Text>
            <Text style={styles.row}>#{invoice.invoice_number}</Text>
            <Text style={styles.subtle}>Issue date: {invoice.issue_date}</Text>
            <Text style={styles.subtle}>Due date: {invoice.due_date}</Text>
          </View>
          <View>
            <Text style={styles.sectionTitle}>From</Text>
            <Text style={styles.row}>{companyName}</Text>
            <Text style={styles.row}>{company.company_address ?? "-"}</Text>
            <Text style={styles.subtle}>{company.company_email ?? ""}</Text>
          </View>
        </View>

        <View style={{ marginBottom: 10 }}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={styles.row}>{invoice.client.name}</Text>
          <Text style={styles.row}>{invoice.client.billing_address ?? "-"}</Text>
          <Text style={styles.subtle}>{invoice.client.email ?? ""}</Text>
          <Text style={styles.subtle}>
            Service period: {invoice.service_period_start} to {invoice.service_period_end}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Unit</Text>
            <Text style={styles.colTotal}>Line Total</Text>
          </View>
          {invoice.line_items.map((line) => (
            <View key={line.id} style={styles.tableRow}>
              <Text style={styles.colDesc}>{line.description}</Text>
              <Text style={styles.colQty}>{line.quantity}</Text>
              <Text style={styles.colPrice}>{line.unit_price.toFixed(2)}</Text>
              <Text style={styles.colTotal}>
                {(line.quantity * line.unit_price - line.line_discount_amount).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsCard}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text>{invoice.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Discount</Text>
            <Text>- {invoice.discount_amount.toFixed(2)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text>{invoice.tax_amount.toFixed(2)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>Total Due: {invoice.currency} {invoice.total.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Thank you for working with Prism Labs. Please include invoice number {invoice.invoice_number} while making payment.
        </Text>
      </Page>
    </PdfDocument>
  );
}

export async function buildInvoicePdf(invoiceId: string) {
  const payload = await getInvoiceExportPayload(invoiceId);
  const stream = await renderToBuffer(<InvoicePdfTemplate payload={payload} />);
  return {
    filename: `${payload.invoice.invoice_number}.pdf`,
    buffer: stream,
  };
}

export async function buildInvoiceDocx(invoiceId: string) {
  const { invoice, company } = await getInvoiceExportPayload(invoiceId);
  const companyName = company.company_name || "Prism Labs";

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: "Prism Labs" }),
          new Paragraph({ text: "Invoice & Revenue Operations" }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: `Invoice ${invoice.invoice_number}` }),
          new Paragraph({ text: companyName }),
          new Paragraph({ text: company.company_address ?? "" }),
          new Paragraph({ text: `Client: ${invoice.client.name}` }),
          new Paragraph({
            text: `Service period: ${invoice.service_period_start} to ${invoice.service_period_end}`,
          }),
          new Paragraph({ text: `Due date: ${invoice.due_date}` }),
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Description")] }),
                  new TableCell({ children: [new Paragraph("Qty")] }),
                  new TableCell({ children: [new Paragraph("Unit Price")] }),
                  new TableCell({ children: [new Paragraph("Total")] }),
                ],
              }),
              ...invoice.line_items.map(
                (line) =>
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(line.description)] }),
                      new TableCell({ children: [new Paragraph(String(line.quantity))] }),
                      new TableCell({
                        children: [new Paragraph(line.unit_price.toFixed(2))],
                      }),
                      new TableCell({
                        children: [
                          new Paragraph(
                            (
                              line.quantity * line.unit_price - line.line_discount_amount
                            ).toFixed(2),
                          ),
                        ],
                      }),
                    ],
                  }),
              ),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: `Subtotal: ${invoice.subtotal.toFixed(2)}` }),
          new Paragraph({ text: `Discount: ${invoice.discount_amount.toFixed(2)}` }),
          new Paragraph({ text: `Tax: ${invoice.tax_amount.toFixed(2)}` }),
          new Paragraph({ text: `Total: ${invoice.total.toFixed(2)}` }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return {
    filename: `${invoice.invoice_number}.docx`,
    buffer,
  };
}
