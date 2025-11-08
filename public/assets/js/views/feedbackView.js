export function renderLoading(container, variant = "primary") {
    const spinnerClass = variant === "light" ? "text-light" : "text-primary";
    const textClass = variant === "light" ? "text-white-50" : "text-muted";
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border ${spinnerClass}" role="status"></div>
            <p class="mt-3 mb-0 ${textClass}">Cargando...</p>
        </div>
    `;
}

export function renderAlert(container, message, tone) {
    const wrapper = document.createElement("div");
    wrapper.className = "col-12";
    wrapper.innerHTML = `<div class="alert alert-${tone}" role="alert">${message}</div>`;
    container.appendChild(wrapper);
}

export function renderError(container, error) {
    console.error(error);
    container.innerHTML = "";
    renderAlert(container, error.message || "Ocurrió un error inesperado.", "danger");
}

export function renderEmpty(container, message) {
    container.innerHTML = "";
    renderAlert(container, message, "warning");
}

