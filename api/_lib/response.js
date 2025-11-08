function sendJson(res, statusCode, payload) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.statusCode = statusCode;
    res.end(JSON.stringify(payload));
}

function sendSuccess(res, data) {
    sendJson(res, 200, data);
}

function sendMethodNotAllowed(res, allowed = ["GET"]) {
    res.setHeader("Allow", allowed.join(", "));
    sendJson(res, 405, { error: "Método no permitido." });
}

function sendBadRequest(res, message) {
    sendJson(res, 400, { error: message });
}

function sendServerError(res, error) {
    console.error(error);
    const message = error && error.message ? error.message : "Ocurrió un error interno.";
    sendJson(res, 500, { error: message });
}

module.exports = {
    sendSuccess,
    sendMethodNotAllowed,
    sendBadRequest,
    sendServerError
};

