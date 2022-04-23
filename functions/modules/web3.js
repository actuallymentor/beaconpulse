const { ethers } = require( "ethers" )
const { utils } = ethers
const { log } = require( './helpers' )

exports.verify_message = async ( { claimed_message, signed_message, claimed_signatory } ) => {

	log( `verify_message triggered` )

	try {

		log( `Verifying claimed message `, claimed_message, ` on behalf of `, claimed_signatory )

		// Check that the signed message equals the claimed message
		const confirmed_signatory = utils.verifyMessage( claimed_message, signed_message ).toLowerCase()

		// Verify that the claimed signatory is the one that signed the message
		const message_valid = confirmed_signatory === claimed_signatory

		log( `Message was signed by ${ confirmed_signatory }, valid: `, message_valid )

		// Verify that the claimed signatory is the one that signed the message
		return message_valid


	} catch( e ) {

		log( `Verification error: `, e )
		return false

	}

}