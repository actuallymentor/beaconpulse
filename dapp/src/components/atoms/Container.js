import styled from 'styled-components'

// Image that behaves like a background image
import logo from '../../assets/beaconpulse-logo.svg'
const BackgroundImage = styled.img.attrs( props => ( {
	src: logo
} ) )`
	position: absolute;
	z-index: -1;
	right: 50%;
	transform: translateY( -50% );
	/*top: 50%;*/
	transform: translateX( 50% );
	width: 90%;
	opacity: .08;
`

const Wrapper = styled.div`
	position: relative;
	overflow: hidden;
	display: flex;
	flex-direction: ${ ( { direction } ) => direction || 'column' };;
	align-items: ${ ( { align } ) => align || 'center' };;
	justify-content: ${ ( { justify } ) => justify || 'center' };
	min-height: 100vh;
	width: 100%;
	padding:  0 max( 1rem, calc( 25vw - 8rem ) );
	box-sizing: border-box;
	& * {
		box-sizing: border-box;
	}
`

// Container that always has the background image
export default ( { children, ...props } ) => <Wrapper { ...props }>
	<BackgroundImage key='background' />
	{ children }
</Wrapper>