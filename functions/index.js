const functions = require("firebase-functions")

const { subscribe_to_node } = require( './modules/morningbeacon/nodes' )
exports.subscribe_to_node = functions.https.onCall( subscribe_to_node )

const { send_queued_epns_notifications } = require( './modules/epns/notifications' )
exports.epns_notification_cron = functions.pubsub.schedule( '5,35 * * * *' ).onRun( send_queued_epns_notifications )