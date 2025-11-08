export function truncate(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text;
    }
    return `${text.slice(0, maxLength).trim()}…`;
}

export function deduplicateById(items) {
    const map = new Map();
    items.forEach((item) => {
        if (item && item.id != null && !map.has(item.id)) {
            map.set(item.id, item);
        }
    });
    return Array.from(map.values());
}

export function formatNumber(value) {
    if (typeof value !== "number" || Number.isNaN(value)) {
        return "0";
    }
    return Intl.NumberFormat("es").format(value);
}

