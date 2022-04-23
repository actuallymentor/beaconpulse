import { H1, H2, Sidenote, Text } from '../atoms/Text'
import Section from '../atoms/Section'
import Container from '../atoms/Container'
import Button from '../atoms/Button'
import Input from '../atoms/Input'
import Loading from '../molecules/Loading'
import Menu from '../molecules/Menu'

// Functionality
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { sign_message, useAddress, useENS } from '../../modules/web3'
import { dev, wait, log } from '../../modules/helpers'
import { subscribe_to_node } from '../../modules/firebase'

export default ( { ...props } ) => {

	const navigate = useNavigate()
	const ENS = useENS()
	const address = useAddress()
	const [ loading, setLoading ] = useState( 'Checking for web3 connection' )
	const [ signature, setSignature ] = useState(  )

	// Component data management
	const [ step, setStep ] = useState( 0 )
	const [ eth1, setEth1 ] = useState( dev ? '0xb29115c8b1c3e6947c1ad26f1933a91e59d878a3' : '' )

	/* ///////////////////////////////
	// Lifecycle
	// /////////////////////////////*/

	useEffect( (  ) => {

		let cancelled = false;

		( async () => {


			// Check for the address, if there is one stop loading, if there is none try a few times
			if( address ) return setLoading( false )

			await wait( 1000 )
			if( address ) return setLoading( false )
			log( `No address after 1 second` )
			if( cancelled ) return

			await wait( 2000 )
			if( address ) return setLoading( false )
			log( `No address after 2 seconds` )
			if( cancelled ) return

			await wait( 3000 )
			if( address ) return setLoading( false )
			log( `No address after 3 seconds` )
			if( cancelled ) return

			return navigate( `/` )


		} )( )

		return () => cancelled = true

	}, [ address ] )

	/* ///////////////////////////////
	// Component functions
	// /////////////////////////////*/
	async function nextStep() {

		try {

			// Address step
			if( step == 0 ) {

				if( !eth1.match( /0x.{40}/ ) ) throw new Error( `Invalid eth1 address` )
				setEth1( eth1.toLowerCase() )
				setStep( step + 1 )

			}

			// Signature
			if( step == 1 ) {

				// Calculate next 10AM
				const day_in_ms = 1000 * 60 * 60 * 24
				const today_10am = new Date()
				today_10am.setHours( 9, 0, 0 ) // 0 indexed hour of day
				const tomorrow_10am = new Date( today_10am.getTime() + day_in_ms )
				const tomorrow_10am_timestamp = tomorrow_10am.getTime()

				// Get signature from user
				setLoading( `Requesting signature` )
				const message = await sign_message( {
					action: 'subscribe',
					node_to_follow: eth1,
					next_notification: tomorrow_10am_timestamp,
					timestamp: Date.now()
				}, address )


				setLoading( `Registering you with Beaconpulse oracle` )
				
				// Register with remote
				const { error, message: error_message } = await subscribe_to_node( message )
				if( error ) throw new Error( `Error subscribing your node: `, error_message )
				setSignature( signature )
				setStep( step + 1 )

			}

			// Opt-in on EPNS
			if( step == 2 ) {

				window.open( `https://staging-app.epns.io/#/spam`, '_blank' ).focus()
				setStep( step + 1 )

			}

		} catch( e ) {
			alert( e.message )
		} finally {
			setLoading( false )
		}

	}

	function open_url(  url) {

		window.open( url, '_blank').focus()

	}

	if( loading ) return <Loading message={ loading } />


	if( step == 0 ) return <Container align='flex-start'>

		<Menu />
		
		<Sidenote>Step 1 of 4</Sidenote>
		<H1>Which node do you want to monitor?</H1>
		<Input placeholder='0x1337' label='Beacon node Eth1 address' value={ eth1 } onChange={ ( { target } ) => setEth1( target.value ) } />
		<Button onClick={ nextStep }>Confirm</Button>

	</Container>

	if( step == 1 ) return <Container align='flex-start'>
		
		<Sidenote>Step 2 of 4</Sidenote>
		<H1>Which address do you want notifications on?</H1>
		<Input label='Currently connected address' value={ ENS || address } readOnly />
		<Button onClick={ nextStep }>Confirm with signature</Button>

	</Container>

	if( step == 2 ) return <Container align='flex-start'>
		
		<Sidenote>Step 3 of 4</Sidenote>
		<H1>Opt-in on EPNS</H1>
		<Text>By default, all EPNS notifications go to "spam". Please opt-in to the Beaconpulse notifications to receive them.</Text>
		<Button onClick={ nextStep }>Open EPNS app to opt-in</Button>

	</Container>

	if( step == 3 ) return <Container align='flex-start'>

		<Menu />
		
		<Sidenote>Step 4 of 4</Sidenote>
		<H1>Download EPNS app</H1>
		<Text>EPNS notifications need to go somewhere, which is why you need to install an EPNS app to receive them.</Text>
		<Text>Fun fact: EPNS notifications are visible on any app that integrates them, you might see your EPNS inbox at your favorite dApp soon!</Text>
		<Button onClick={ f => open_url( `https://play.google.com/store/apps/details?id=io.epns.epns&hl=en&gl=US` ) }>Install Android app</Button>
		<Button onClick={ f => open_url( `https://apps.apple.com/us/app/ethereum-push-service-epns/id1528614910` ) }>Install iOS app</Button>
		<Button onClick={ f => open_url( `https://chrome.google.com/webstore/detail/epns-protocol-alpha/lbdcbpaldalgiieffakjhiccoeebchmg/` ) }>Install Browser extension</Button>

	</Container>

}