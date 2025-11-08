import { SPOTIFY_DEFAULTS } from "../config/appConfig.js";
import { fetchTopMovies, fetchMoviesPaginated } from "../models/tmdbModel.js";
import { fetchTopArtists, fetchArtistsPaginated } from "../models/spotifyModel.js";
import { renderMovies } from "../views/moviesView.js";
import { renderArtists } from "../views/artistsView.js";
import { renderError } from "../views/feedbackView.js";
import { PaginatedSectionController } from "./paginatedSectionController.js";

export function initApp() {
    document.addEventListener("DOMContentLoaded", () => {
        initSmoothScroll();
        initNavbarBrandSwap();
        hydrateMovieSections();
        hydrateArtistSections();
    });
}

function initSmoothScroll() {
    const links = document.querySelectorAll('.navbar .nav-link[href^="#"]');
    links.forEach((link) => {
        link.addEventListener("click", (event) => {
            const targetId = link.getAttribute("href");
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                event.preventDefault();
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: "smooth"
                });
            }
        });
    });
}

function hydrateMovieSections() {
    document.querySelectorAll('[data-role="movies"]').forEach((container) => {
        const isPaginated = container.dataset.paginated === "true";
        if (isPaginated) {
            const pageSize = parseInt(container.dataset.pageSize || "60", 10);
            const controlsId = container.dataset.controls;
            const variant = container.dataset.controlsVariant || (container.closest(".section.has-img-bg") ? "light" : "primary");
            const controls = controlsId ? document.getElementById(controlsId) : null;
            const controller = new PaginatedSectionController({
                container,
                controls,
                variant,
                pageSize,
                fetchPage: (page, size) => fetchMoviesPaginated({ page, pageSize: size }),
                renderItems: (target, items, offset) => renderMovies(target, items, offset)
            });
            controller.init();
        } else {
            const limit = parseInt(container.dataset.limit || "6", 10);
            const pages = parseInt(container.dataset.pages || "1", 10);
            fetchTopMovies({ limit, pages })
                .then((movies) => renderMovies(container, movies, 0))
                .catch((error) => renderError(container, error));
        }
    });
}

function hydrateArtistSections() {
    document.querySelectorAll('[data-role="artists"]').forEach((container) => {
        const country = container.dataset.country || SPOTIFY_DEFAULTS.market;
        const query = container.dataset.query || SPOTIFY_DEFAULTS.defaultQuery;
        const variant = container.dataset.controlsVariant || (container.closest(".section.has-img-bg") ? "light" : "primary");
        const isPaginated = container.dataset.paginated === "true";
        if (isPaginated) {
            const pageSize = parseInt(container.dataset.pageSize || "60", 10);
            const controlsId = container.dataset.controls;
            const controls = controlsId ? document.getElementById(controlsId) : null;
            const controller = new PaginatedSectionController({
                container,
                controls,
                variant,
                pageSize,
                fetchPage: (page, size) => fetchArtistsPaginated({ page, pageSize: size, country, query }),
                renderItems: (target, items, offset) => renderArtists(target, items, offset)
            });
            controller.init();
        } else {
            const limit = parseInt(container.dataset.limit || "6", 10);
            fetchTopArtists({ limit, country, query })
                .then((artists) => renderArtists(container, artists, 0))
                .catch((error) => renderError(container, error));
        }
    });
}

function initNavbarBrandSwap() {
    const navbar = document.querySelector(".navbar.custom-navbar");
    if (!navbar) {
        return;
    }
    const brandImg = navbar.querySelector(".navbar-brand img[data-logo-default]");
    if (!brandImg) {
        return;
    }
    const defaultSrc = brandImg.dataset.logoDefault || brandImg.getAttribute("src");
    const affixSrc = brandImg.dataset.logoAffix || defaultSrc;
    if (defaultSrc === affixSrc) {
        return;
    }

    function updateLogo() {
        const shouldUseAffix = navbar.classList.contains("affix") || window.scrollY > 10;
        const targetSrc = shouldUseAffix ? affixSrc : defaultSrc;
        if (brandImg.getAttribute("src") !== targetSrc) {
            brandImg.setAttribute("src", targetSrc);
        }
    }

    updateLogo();
    window.addEventListener("scroll", updateLogo, { passive: true });
    navbar.addEventListener("transitionend", updateLogo);
}

