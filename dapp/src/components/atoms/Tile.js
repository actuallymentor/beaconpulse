import styled from 'styled-components'

export default styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	justify-content: flex-start;
	margin: 2rem;
	width: ${ ( { width='200px'  } ) => width };
`