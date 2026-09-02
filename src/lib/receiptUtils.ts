export interface ReceiptItem {
    sareeName: string;
    quantity: number;
    mrp: number;
    sellingPrice: number;
}

export interface ReceiptData {
    invoiceNumber: string;
    date: string;
    paymentMode: string;
    customerName: string | null;
    customerMobile: string | null;
    items: ReceiptItem[];
    totalAmount: number;
    discountAmount: number;
    discountPercentage?: number;
    shippingFee?: number;
    issuedVoucherCode?: string | null;
    issuedVoucherAmount?: number | null;
    appliedVoucherCode?: string | null;
    appliedVoucherAmount?: number | null;
    isGstApplied?: boolean;
    gstRate?: number;
    taxableAmount?: number;
    cgstRate?: number;
    cgstAmount?: number;
    sgstRate?: number;
    sgstAmount?: number;
    igstRate?: number;
    igstAmount?: number;
    totalGst?: number;
}

/**
 * Encodes a ReceiptData object into a URL-safe Base64 string payload.
 * No database queries or API calls required when rendering from this payload.
 */
export function encodeReceiptData(data: ReceiptData): string {
    try {
        const json = JSON.stringify(data);
        // UTF-8 friendly Base64 encoding
        const base64 = typeof window !== 'undefined'
            ? btoa(encodeURIComponent(json))
            : Buffer.from(encodeURIComponent(json)).toString('base64');

        // Make URL safe (replace + with -, / with _, remove trailing =)
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (err) {
        console.error('Failed to encode receipt data:', err);
        return '';
    }
}

/**
 * Decodes a URL-safe Base64 string payload back into a ReceiptData object.
 */
export function decodeReceiptData(encoded: string): ReceiptData | null {
    if (!encoded) return null;
    try {
        // Restore standard Base64
        let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }

        const json = typeof window !== 'undefined'
            ? decodeURIComponent(atob(base64))
            : decodeURIComponent(Buffer.from(base64, 'base64').toString('utf-8'));

        return JSON.parse(json) as ReceiptData;
    } catch (err) {
        console.error('Failed to decode receipt data payload:', err);
        return null;
    }
}

/**
 * Generates a full shareable receipt URL containing embedded order data.
 */
export function generateReceiptUrl(receiptData: ReceiptData, baseUrl: string = ''): string {
    const payload = encodeReceiptData(receiptData);
    const invoicePath = encodeURIComponent(receiptData.invoiceNumber || 'INV');
    const domain = baseUrl.replace(/\/$/, '');
    return `${domain}/receipt/${invoicePath}?d=${payload}`;
}
