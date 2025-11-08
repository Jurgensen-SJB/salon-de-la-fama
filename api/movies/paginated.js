const { assertConfig } = require("../_lib/config");
const { fetchMoviesPaginated } = require("../_lib/tmdb");
const { sendSuccess, sendServerError, sendMethodNotAllowed, sendBadRequest } = require("../_lib/response");

module.exports = async function handler(req, res) {
    if (req.method !== "GET") {
        sendMethodNotAllowed(res);
        return;
    }

    try {
        assertConfig();
        const { page, pageSize } = req.query || {};
        const parsedPage = page != null ? Number(page) : undefined;
        const parsedPageSize = pageSize != null ? Number(pageSize) : undefined;

        if ((parsedPage != null && Number.isNaN(parsedPage)) || (parsedPageSize != null && Number.isNaN(parsedPageSize))) {
            sendBadRequest(res, "Los parámetros 'page' y 'pageSize' deben ser numéricos.");
            return;
        }

        const result = await fetchMoviesPaginated({
            page: parsedPage,
            pageSize: parsedPageSize
        });

        sendSuccess(res, result);
    } catch (error) {
        sendServerError(res, error);
    }
};

