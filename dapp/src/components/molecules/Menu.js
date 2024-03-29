import styled from 'styled-components'
import { A } from '../atoms/Text'

const Menu = styled.nav`
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	padding: 1rem;

	& a {
		padding: 0 1rem;
	}

`

export default ( { ...props } ) => <Menu>
	
	<A href='/'>Home</A>

</Menu>