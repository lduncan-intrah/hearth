/**
* Copyright (c) 2017-present, Jembi Health Systems NPC.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict'

const FhirCommon = require('../common')
const QueryUtils = require('../query-utils')

module.exports = (mongo) => {
  const fhirCommon = FhirCommon(mongo)
  const queryUtils = QueryUtils(mongo)

  return {
    name: 'AuditEvent',

    searchFilters: (ctx, callback) => {
      const queryParams = ctx.query
      const supportedParams = {
        _id: { modifiers: { exact: true } },
        _include: { allowArray: true },
        _revinclude: { allowArray: true }
      }

      queryUtils.validateAndParseQueryParams(queryParams, supportedParams, (badRequest, queryObject) => {
        if (badRequest) {
          return callback(null, fhirCommon.buildHTTPOutcome(400, 'error', 'invalid', badRequest))
        }

        let query = { $and: [] }

        if (queryObject['_id']) {
          for (const modifier in queryObject['_id']) {
            query['$and'].push({ 'id': queryObject['_id'][modifier] })
          }
        }

        if (query['$and'].length > 0) {
          callback(null, null, query)
        } else {
          callback()
        }
      })
    }
  }
}
