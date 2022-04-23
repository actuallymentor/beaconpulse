// Firebase functionality
import { initializeApp } from "firebase/app"
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions'

import { log, dev } from './helpers'

// ///////////////////////////////
// Initialisation
// ///////////////////////////////

// Firebase config
const { REACT_APP_apiKey, REACT_APP_authDomain, REACT_APP_projectId, REACT_APP_storageBucket, REACT_APP_messagingSenderId, REACT_APP_appId } = process.env
const config = {
	apiKey: REACT_APP_apiKey,
	authDomain: REACT_APP_authDomain,
	projectId: REACT_APP_projectId,
	storageBucket: REACT_APP_storageBucket,
	messagingSenderId: REACT_APP_messagingSenderId,
	appId: REACT_APP_appId
}

log( 'Init firebase with ', config )

// Init app components
const app = initializeApp( config )
const functions = getFunctions( app )
if( dev ) connectFunctionsEmulator( functions, "localhost", 5001)

// Remote functions
export const subscribe_to_node = httpsCallable( functions, 'subscribe_to_node' )
