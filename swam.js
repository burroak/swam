exports._Q = require("q");
exports._HTTP = require("q-io/http");
exports._BUFFERSTREAM = require("q-io/buffer-stream");

/**
 * HTTP statuses we expect to see from WAMS.
 * 
 * @type {{OK: number, CREATED: number, NOCONTENT: number}}
 */
exports.HttpStatus = {
    OK: 200,
    CREATED: 201,
    NOCONTENT: 204
};

/**
 * Initialize the module.
 *
 * url and appkey, and either authKey or masterKey must be provided.
 *
 * @param url The base url for the mobile service.
 * @param appKey The application key of the mobile service.
 * @param authKey The service-generated authentication token for an authenticated user.
 * @param masterKey The service master key.
 */
exports.initialize = function(url, appKey, authKey, masterKey) {
    exports._serviceUrl = url;
    exports._appKey = appKey;
    exports._authKey = authKey;
    exports._masterKey = masterKey;
};

/**
 * Get records from a WAMS table
 *
 * @param table The table name.
 * @param filter An optional query filter (See http://www.odata.org/documentation/uri-conventions/#SystemQueryOptions)
 * @param skip The number of records to skip (or 0)
 * @param top The number of records to retrieve, or null for all.
 * @param includeCount If true, include the total count of records for the query.
 * @returns {*}
 * TODO: orderby, select
 */
exports.getRecords = function (table, filter, skip, top, includeCount) {
    var url = exports._serviceUrl + table;

    if (filter !== null && filter !== undefined) {
        url = exports._addQueryParam(url, "$filter", filter);
    }

    if (skip !== null && skip !== undefined) {
        url = exports._addQueryParam(url, "$skip", skip);
    }

    if (top !== null && top !== undefined) {
        url = exports._addQueryParam(url, "$top", top);
    }

    if (includeCount) {
        url = exports._addQueryParam(url, "$inlinecount", "allpages");
    }

    return exports._HTTP.request({
        url: url,
        method: "GET",
        headers: exports._getWamsHeaders()
    }).then(function (value) {
            return value.body.read().then(function (bodyValue) {
                return exports._Q.fcall(function () {
                    var results = JSON.parse(bodyValue);
                    var records;
                    var count;
                    var error;
                    var success;

                    if (value.status == exports.HttpStatus.OK) {
                        if (results.count !== undefined) {
                            records = results.results;
                            count = results.count;
                        } else {
                            records = results;
                            count = -1;
                        }

                        error = null;
                        success = true;
                    } else {
                        records = null;
                        count = 0;

                        error = results.error;
                        success = false;
                    }

                    return {
                        success: success,
                        status: value.status,
                        error: error,
                        records: records,
                        count: count
                    };
                });
            });
        });
};

/**
 * Insert a record into a WAMS table.
 *
 * @param table The table name.
 * @param value The object to store.
 * @returns {*}
 */
exports.insertRecord = function (table, value) {
    var url = exports._serviceUrl + table;

    return exports._HTTP.request({
        url: url,
        method: "POST",
        headers: exports._getWamsHeaders(),
        body: exports._BUFFERSTREAM(new Buffer(JSON.stringify(value)))
    }).then(function (value) {
            return value.body.read().then(function (bodyValue) {
                return exports._Q.fcall(function () {
                    var results = JSON.parse(bodyValue);
                    var recordId;
                    var error;
                    var success;

                    if (value.status == exports.HttpStatus.CREATED) {
                        recordId = results.id;
                        error = null;
                        success = true;
                    } else {
                        recordId = -1;
                        error = results.error;
                        success = false;
                    }

                    return {
                        success: success,
                        id: recordId,
                        status: value.status,
                        error: error
                    };
                });
            });
        });
};

/**
 * Update a record in a WAMS table.
 *
 * @param table The table name.
 * @param recordId The ID of the record to update.
 * @param value The object to store.
 * @returns {*}
 */
exports.updateRecord = function (table, recordId, value) {
    var url = exports._serviceUrl + table + "/" + recordId.toString();

    value.id = recordId;

    return exports._HTTP.request({
        url: url,
        method: "PATCH",
        headers: exports._getWamsHeaders(),
        body: exports._BUFFERSTREAM(new Buffer(JSON.stringify(value)))
    }).then(function (value) {
            return value.body.read().then(function (bodyValue) {
                return exports._Q.fcall(function () {
                    var results = JSON.parse(bodyValue);
                    var recordId;
                    var error;
                    var success;

                    if (value.status == exports.HttpStatus.OK) {
                        recordId = results.id;
                        error = null;
                        success = true;
                    } else {
                        recordId = -1;
                        error = results.error;
                        success = false;
                    }

                    return {
                        success: success,
                        id: recordId,
                        status: value.status,
                        error: error
                    };
                });
            });
        });
};

/**
 * Delete a record from a WAMS table.
 *
 * @param table The table name.
 * @param recordId The ID of the record to delete.
 * @returns {*}
 */
exports.deleteRecord = function (table, recordId) {
    var url = exports._serviceUrl + table + "/" + recordId.toString();

    return exports._HTTP.request({
        url: url,
        method: "DELETE",
        headers: exports._getWamsHeaders()
    }).then(function (value) {
            return value.body.read().then(function (bodyValue) {
                return exports._Q.fcall(function () {
                    var results;
                    var error;
                    var success;

                    if (value.status == exports.HttpStatus.NOCONTENT) {
                        error = null;
                        success = true;
                    } else {
                        if (bodyValue.length > 0) {
                            results = JSON.parse(bodyValue);
                            error = results.error;
                        }

                        success = false;
                    }

                    return {
                        success: success,
                        status: value.status,
                        error: error
                    };
                });
            });
        });
};

/**
 * Helper function to add a query parameter to a URL, keeping track of the appropriate
 * query parameter prefix and url encoding the value.
 *
 * @param toUrl The URL to append to.
 * @param name The name of the query parameter.
 * @param value The value of the query parameter.
 * @returns The adorned URL.
 * @private
 */
exports._addQueryParam = function (toUrl, name, value) {
    var firstParm = toUrl.lastIndexOf("?") < 0;

    var ret = toUrl.slice(0);

    ret += (firstParm ? "?" : "&");
    ret += name;
    ret += "=";
    ret += encodeURIComponent(value);

    return ret;
};

/**
 * Get the required HTTP headers for a WAMS connection.
 * @returns An object containing the headers.
 * @private
 */
exports._getWamsHeaders = function() {
    var headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-ZUMO-APPLICATION": exports._appKey
    };

    if (exports._authKey !== null && exports._authKey !== undefined && exports._authKey.length > 0) {
        headers["X-ZUMO-AUTH"] = exports._authKey;
    }

    if (exports._masterKey !== null && exports._masterKey !== undefined && exports._masterKey.length > 0) {
        headers["X-ZUMO-MASTER"] = exports._masterKey;
    }

    return headers;
};

