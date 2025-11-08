import { formatNumber } from "../utils/helpers.js";

export function renderPaginationControls(container, state, variant = "primary") {
    if (!container) {
        return;
    }
    const buttonClass = variant === "light" ? "btn btn-sm btn-outline-light" : "btn btn-sm btn-outline-primary";
    const textClass = variant === "light" ? "text-white-50" : "text-muted";
    const windowSizeAttr = parseInt(container.dataset.windowSize || "", 10);
    const windowSize = Number.isFinite(windowSizeAttr) && windowSizeAttr > 0 ? windowSizeAttr : 5;
    const pageButtons = createPageButtons(state.currentPage, state.totalPages, buttonClass, windowSize);
    container.innerHTML = `
        <div class="d-flex flex-column flex-lg-row align-items-center justify-content-center">
            <div class="d-flex align-items-center mb-3 mb-lg-0">
                <button type="button" class="${buttonClass} mr-2" data-action="prev" ${state.currentPage === 1 ? "disabled" : ""}>Anterior</button>
                <div class="btn-group btn-group-sm flex-wrap justify-content-center" role="group">
                    ${pageButtons}
                </div>
                <button type="button" class="${buttonClass} ml-2" data-action="next" ${state.currentPage >= state.totalPages ? "disabled" : ""}>Siguiente</button>
            </div>
            <span class="ml-lg-3 px-3 py-2 ${textClass} page-status">Página ${state.currentPage} de ${state.totalPages}</span>
        </div>
        <small class="d-block mt-2 ${textClass}">Resultados totales: ${formatNumber(state.totalResults)}</small>
    `;
}

function createPageButtons(current, total, buttonClass, windowSize = 5) {
    if (total <= 1) {
        return `<button type="button" class="${buttonClass} active" disabled>1</button>`;
    }
    const range = [];
    let start = Math.max(1, current - Math.floor(windowSize / 2));
    let end = start + windowSize - 1;
    if (end > total) {
        end = total;
        start = Math.max(1, end - windowSize + 1);
    }
    for (let page = start; page <= end; page += 1) {
        const isActive = page === current;
        range.push(`<button type="button" class="${buttonClass} ${isActive ? "active" : ""}" ${isActive ? "disabled" : ""} data-page="${page}">${page}</button>`);
    }
    if (start > 1) {
        range.unshift(`<button type="button" class="${buttonClass}" data-page="1">1</button>`);
        if (start > 2) {
            range.splice(1, 0, `<span class="mx-2">…</span>`);
        }
    }
    if (end < total) {
        if (end < total - 1) {
            range.push(`<span class="mx-2">…</span>`);
        }
        range.push(`<button type="button" class="${buttonClass}" data-page="${total}">${total}</button>`);
    }
    return range.join("");
}

