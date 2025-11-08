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
    const maxButtons = Math.max(2, windowSize);
    if (total <= maxButtons) {
        return createSequentialButtons(1, total, current, buttonClass).join("");
    }

    const interiorSlots = Math.max(1, maxButtons - 2);
    let start = Math.max(2, current - Math.floor(interiorSlots / 2));
    let end = start + interiorSlots - 1;

    if (end >= total) {
        end = total - 1;
        start = end - interiorSlots + 1;
    }
    if (start <= 2) {
        start = 2;
        end = start + interiorSlots - 1;
    }
    if (end >= total) {
        end = total - 1;
    }

    const parts = [];
    parts.push(renderPageButton(1, current === 1, buttonClass));

    if (start > 2) {
        parts.push(`<span class="mx-1">…</span>`);
    }

    parts.push(...createSequentialButtons(start, end, current, buttonClass));

    if (end < total - 1) {
        parts.push(`<span class="mx-1">…</span>`);
    }

    parts.push(renderPageButton(total, current === total, buttonClass));

    return parts.join("");
}

function createSequentialButtons(start, end, current, buttonClass) {
    const buttons = [];
    for (let page = start; page <= end; page += 1) {
        buttons.push(renderPageButton(page, page === current, buttonClass));
    }
    return buttons;
}

function renderPageButton(page, active, buttonClass) {
    const classes = `${buttonClass} ${active ? "active" : ""}`;
    const disabled = active ? "disabled" : "";
    return `<button type="button" class="${classes}" ${disabled} data-page="${page}">${page}</button>`;
}

