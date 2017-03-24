'use strict'

const fs = require('fs')
const ATNA = require('atna-audit')
const ATNAAuditConfig = require('./config').getConf('atnaAudit')

let connDetail = {
  interface: ATNAAuditConfig.interface,
  host: ATNAAuditConfig.host,
  port: ATNAAuditConfig.port
}

if (ATNAAuditConfig.certOptions.key) {
  connDetail.options.key = fs.readFileSync(ATNAAuditConfig.certOptions.key).toString()
}

if (ATNAAuditConfig.certOptions.cert) {
  connDetail.options.cert = fs.readFileSync(ATNAAuditConfig.certOptions.cert).toString()
}

if (ATNAAuditConfig.certOptions.ca) {
  connDetail.options.ca = fs.readFileSync(ATNAAuditConfig.certOptions.ca).toString()
}

exports.buildPIXmAuditMsg = (ctx) => {
  // event
  var eventID = new ATNA.construct.Code(110112, 'Query', 'DCM')
  var typeCode = new ATNA.construct.Code('ITI-83', 'Mobile Patient Identifier Cross-reference Query', 'IHE Transactions')
  var eIdent = new ATNA.construct.EventIdentification(ATNA.constants.EVENT_ACTION_EXECUTE, new Date(), ATNA.constants.OUTCOME_SUCCESS, eventID, typeCode)

  // Active Participant - System
  var sysRoleCode = new ATNA.construct.Code(110150, 'Application', 'DCM')
  var sysParticipant = new ATNA.construct.ActiveParticipant('HEARTH', '', false, ctx.domain, ATNA.constants.NET_AP_TYPE_IP, [sysRoleCode])

  // Active Participant - User
  var userRoleCodeDef = new ATNA.construct.Code(110151, 'DCM', 'Destination')
  var userParticipant = new ATNA.construct.ActiveParticipant(ctx.authenticatedUser, '', true, null, null, [userRoleCodeDef])

  // Audit Source
  var sourceTypeCode = new ATNA.construct.Code(ATNA.constants.AUDIT_SRC_TYPE_WEB_SERVER, '', '')
  var sourceIdent = new ATNA.construct.AuditSourceIdentification(null, 'HEARTH', sourceTypeCode)

  // Participant Object
  var objIdTypeCode = new ATNA.construct.Code('ITI-83', 'Mobile Patient Identifier Cross-reference Query', 'IHE Transactions')
  var participantObj = new ATNA.construct.ParticipantObjectIdentification(
    ctx.fullUrl,
    ATNA.constants.OBJ_TYPE_SYS_OBJ,
    ATNA.constants.OBJ_TYPE_CODE_ROLE_QUERY,
    null,
    null,
    objIdTypeCode,
    'Mobile Patient Identifier Cross-reference Query',
    ctx.headers
  )

  var audit = new ATNA.construct.AuditMessage(eIdent, [sysParticipant, userParticipant], [participantObj], [sourceIdent])
  var xml = audit.toXML()

  const syslog = ATNA.construct.wrapInSyslog(xml)

  return syslog
}

exports.sendAuditEvent = (msg, callback) => {
  if (!ATNAAuditConfig.enabled) {
    return
  }

  ATNA.send.sendAuditEvent(msg, connDetail, callback)
}