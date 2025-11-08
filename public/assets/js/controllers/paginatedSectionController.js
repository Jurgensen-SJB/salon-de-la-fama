import { renderLoading, renderError } from "../views/feedbackView.js";
import { renderPaginationControls } from "../views/paginationView.js";

export class PaginatedSectionController {
    constructor({ container, controls, variant = "primary", fetchPage, renderItems, pageSize = 60 }) {
        this.container = container;
        this.controls = controls;
        this.variant = variant;
        this.fetchPage = fetchPage;
        this.renderItems = renderItems;
        this.state = {
            pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 60,
            currentPage: 1,
            totalResults: 0,
            totalPages: 1,
            loading: false
        };

        if (this.controls && !this.controls.dataset.bound) {
            this.controls.addEventListener("click", (event) => this.handleControlClick(event));
            this.controls.dataset.bound = "true";
        }
    }

    init() {
        this.load(1);
    }

    async load(page) {
        const targetPage = Math.max(1, page);
        if (this.state.loading) {
            return;
        }
        this.state.loading = true;
        renderLoading(this.container, this.variant);
        try {
            const result = await this.fetchPage(targetPage, this.state.pageSize);
            const items = (result && result.items) || [];
            const safeTotal = typeof result.totalResults === "number" && result.totalResults >= 0 ? result.totalResults : items.length;
            const totalPages = Math.max(1, Math.ceil(safeTotal / this.state.pageSize));

            if (targetPage > totalPages && totalPages > 0) {
                this.state.loading = false;
                if (targetPage !== totalPages) {
                    return this.load(totalPages);
                }
            }

            this.state.totalResults = safeTotal;
            this.state.totalPages = totalPages;
            this.state.currentPage = Math.min(targetPage, totalPages);
            const offset = (this.state.currentPage - 1) * this.state.pageSize;
            this.renderItems(this.container, items, offset);
            if (this.controls) {
                renderPaginationControls(this.controls, this.state, this.variant);
            }
        } catch (error) {
            renderError(this.container, error);
            if (this.controls) {
                this.controls.innerHTML = "";
            }
        } finally {
            this.state.loading = false;
        }
    }

    handleControlClick(event) {
        const target = event.target.closest("[data-action], [data-page]");
        if (!target || this.state.loading) {
            return;
        }
        event.preventDefault();
        const action = target.getAttribute("data-action");
        const pageAttr = target.getAttribute("data-page");

        if (action === "prev" && this.state.currentPage > 1) {
            this.load(this.state.currentPage - 1);
            return;
        }
        if (action === "next" && this.state.currentPage < this.state.totalPages) {
            this.load(this.state.currentPage + 1);
            return;
        }
        if (pageAttr) {
            const targetPage = parseInt(pageAttr, 10);
            if (Number.isFinite(targetPage) && targetPage >= 1 && targetPage <= this.state.totalPages && targetPage !== this.state.currentPage) {
                this.load(targetPage);
            }
        }
    }
}

