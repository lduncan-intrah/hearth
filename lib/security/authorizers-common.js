'use strict'
const _ = require('lodash')
const ObjectID = require('mongodb').ObjectID

module.exports = (mongo) => {
  return {
    preInteractionHandlers: {
      paramEmailMustBeUserEmail: (req, authenticatedUser, callback) => {
        callback(null, authenticatedUser.email === req.params.email)
      },

      userBodyMustBeSelf: (req, authenticatedUser, callback) => {
        // must be self, may not alter resource or email
        callback(null, authenticatedUser.email === req.params.email && !req.body.resource && !req.body.email)
      },

      // when searching, a "traceable" parameter must be used.
      // This is a parameter that can be used to link queried resources to a practitioner
      // or at a minimum to an organization (which is linkable to practitioners)
      mustUsePractitionerLinkableSearchParam: (req, authenticatedUser, callback) => {
        let traceableParams = ['patient', 'practitioner', 'practitioner.organization', 'encounter']
        callback(null, _.intersection(_.keys(req.query), traceableParams).length > 0)
      },

      basicResourceCodeMustBeConsent: (req, authenticatedUser, callback) => {
        if (!req.body.code || !req.body.code.coding || req.body.code.coding.length === 0) {
          return callback(null, false)
        }
        callback(null, (req.body.code.coding[0].system === 'pshr:basic' && req.body.code.coding[0].code === 'consent'))
      }
    },

    searchFilters: {
      filterIdByUserResource: (authenticatedUser, callback) => {
        let _id = authenticatedUser.resource.split('/')[1]
        callback(null, {
          _id: ObjectID(_id)
        })
      }
    }
  }
}