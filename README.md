#SWAM - Simple Windows Azure Mobile Services
SWAM is a set of functions to allow access to Windows Azure Mobile Services tables via node.js, making use of the [Windows Azure Mobile Services REST API](http://msdn.microsoft.com/en-us/library/windowsazure/jj710108.aspx).

SWAM leverages [q](https://github.com/kriskowal/q) and [q-io](https://github.com/kriskowal/q-io) in order to provide promise support for the supplied functions.

SWAM requires you to provide the following information in order to connect to your mobile service:

- The URL of the mobile service.  This will be in the format:

		https://YOURSERVICE.azure-mobile.net

- The application key for your service
- Either an authorization key **or** the master key for your service


##Functions

###initialize(url, appKey, authKey, masterKey)

Initialize the module.

- ``url``: The base url for the mobile service.
- ``appKey``: The application key of the mobile service.
- ``authKey``: The service-generated authentication token for an authenticated user, or ``null`` if ``authKey`` is not being used.
- ``masterKey`` The service master key, or ``null`` if ``masterKey`` is not being used.

url and appkey, and either authKey or masterKey must be provided.
	
###getRecords(table, filter, select, orderby, skip, top, includeCount)

Get records from a WAMS table.

For ``filter``, ``select``, ``orderby``, ``skip`` and ``top`` parameter formats, see [http://www.odata.org/documentation/uri-conventions/#SystemQueryOptions](http://www.odata.org/documentation/uri-conventions/#SystemQueryOptions).

- ``table``: The table name.
- ``filter``: An optional query filter.
- ``select``: The columns to return.
- ``orderby``: Orders the returned items by one or more columns.
- ``skip``: The number of records to skip (or 0).
- ``top``: The number of records to retrieve, or null for all.
- ``includeCount``: If true, include the total count of records for the query.

####Returns

- ``success``: true for success, false for error.
- ``status``: The HTTP status code returned from WAMS.
- ``error``: When success is false, contains the error messager from WAMS.
- ``records``: An array of records returned from WAMS.
- ``count``: If ``includeCount`` was true, contains the total count of records for the query.  If ``includeCount`` was false, set to -1.

###insertRecord(table, value)

Insert a record into a WAMS table.

- ``table``: The table name.
- ``value``: The object to store.

####Returns

- ``success``: true for success, false for error.
- ``status``: The HTTP status code returned from WAMS.
- ``error``: When success is false, contains the error messager from WAMS.
- ``id``: The ID of the inserted record.
 
###updateRecord(table, recordId, value)
 
Update a record in a WAMS table.

- ``table``: The table name.
- ``recordId``: The ID of the record to update.
- ``value``: The object to store.

####Returns

- ``success``: true for success, false for error.
- ``status``: The HTTP status code returned from WAMS.
- ``error``: When success is false, contains the error messager from WAMS.
- ``id``: The ID of the updated record.
 
###deleteRecord(table, recordId)
 
Delete a record from a WAMS table.

- ``table``: The table name.
- ``recordId``: The ID of the record to delete.

####Returns

- ``success``: true for success, false for error.
- ``status``: The HTTP status code returned from WAMS.
- ``error``: When success is false, contains the error messager from WAMS.

##Example

		var SWAM = require("swam");

		var appKey = "MYAPPKEY";
		var masterKey = "MYMASTERKEY";
		var urlBase = "https://MYSERVICE.azure-mobile.net";

		SWAM.initialize(urlBase, appKey, null, masterKey);

		SWAM.insertRecord("test", {
		    string: "a value",
		    bool: true,
		    number: 10
		}).then(function (v) {
        	if (v.success) {
            	console.log("Create: success");

            	SWAM.getRecords(
            			"test", 
            			"id eq " + v.id, 
            			null, 
            			null, 
            			0, 
            			10, 
            			true
            	).then(function (vg) {
                	if (vg.success) {
                    	console.log("Get: success: " + 
                    			JSON.stringify(vg.records));

                    	SWAM.updateRecord("test", v.id, {
                       		number: 11
                    	}).then(function(vu) {
							if (vu.success) {
								console.log("Update: success");

								SWAM.getRecords(
										"test", 
										"id eq " + v.id, 
										"id, string", 
										"id desc", 
										0, 
										10, 
										true
								).then(function (vg1) {
									if (vg1.success) {
										console.log("Get: success: " + 
												JSON.stringify(vg1.records));

										SWAM.deleteRecord(
												"test", 
												v.id
										).then(function (vd) {
											if (vd.success) {
												console.log("Delete: success");
											} else {
												console.log("Delete: error: " + 
														vd.error);
											}
										});
									} else {
										console.log("Get: error: " + 
												vg1.error);
									}
                               });
                            } else {
                                console.log("Update: error: " + 
                                		vu.error);
                            }
                       });
                	} else {
						console.log("Get: error: " + 
								vg.error);
                	}
            	});
        	} else {
            		console.log("Create: error: " + 
            				v.error);
        	}
    	});

##License

Copyright 2013 Burr Oak Software MIT License (enclosed)
