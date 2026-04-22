import type {Timestamp} from "firebase/firestore";

export function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function toDateTimeLocalString(value: unknown): string {
    if (!value || typeof value !== "object" || !("toDate" in value)) return "";
    try {
        const date = (value as Timestamp).toDate();
        const offsetMs = date.getTimezoneOffset() * 60 * 1000;
        return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
    } catch {
        return "";
    }
}
