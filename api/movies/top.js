const { assertConfig } = require("../_lib/config");
const { fetchTopMovies } = require("../_lib/tmdb");
const { sendSuccess, sendServerError, sendMethodNotAllowed, sendBadRequest } = require("../_lib/response");

module.exports = async function handler(req, res) {
    if (req.method !== "GET") {
        sendMethodNotAllowed(res);
        return;
    }

    try {
        assertConfig();
        const { limit, pages } = req.query || {};
        const parsedLimit = limit != null ? Number(limit) : undefined;
        const parsedPages = pages != null ? Number(pages) : undefined;

        if ((parsedLimit != null && Number.isNaN(parsedLimit)) || (parsedPages != null && Number.isNaN(parsedPages))) {
            sendBadRequest(res, "Los parámetros 'limit' y 'pages' deben ser numéricos.");
            return;
        }

        const items = await fetchTopMovies({
            limit: parsedLimit,
            pages: parsedPages
        });

        sendSuccess(res, { items });
    } catch (error) {
        sendServerError(res, error);
    }
};

