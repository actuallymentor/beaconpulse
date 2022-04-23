import styled from 'styled-components'

export const Text = styled.p`
	font-size: 1rem;
	margin: 1rem 0;
	line-height: 1.5rem;
	color: ${ ( { theme, color } ) => color || theme.colors.text };
	text-align: ${ ( { align } ) => align || 'left' };
	overflow-wrap: anywhere;
	background: ${ ( { background='initial' } ) => background };
`

export const H1 = styled.h1`
	font-size: 2.5rem;
	font-weight: 500;
	line-height: 1.2;
	text-align: ${ ( { align } ) => align || 'left' };
	color: ${ ( { theme, color } ) => color || theme.colors.text };
	overflow-wrap: anywhere;
	margin-bottom: 2rem;
`

export const H2 = styled.h2`
	font-size: 1.5rem;
	margin: 0 0 1rem;
	line-height: 1.2;
	font-weight: 400;
	text-align: ${ ( { align } ) => align || 'left' };
	color: ${ ( { theme } ) => theme.colors.text };
	overflow-wrap: anywhere;
`

export const Sidenote = styled.p`
	color: ${ ( { theme } ) => theme.colors.hint };
	font-style: italic;
	margin-top:  1rem;
	text-align: center;
	overflow-wrap: anywhere;
`

export const Br = styled.span`
	width: 100%;
	margin: 2rem 0;
`
export const Sup = styled.sup`
	overflow-wrap: anywhere;
`

export const A = styled.a`
	font-size: 1rem;
	margin: .2rem 0;
	line-height: 1.5rem;
	color: ${ ( { banner, theme } ) => banner ? theme.colors.primary_invert : theme.colors.text };
	text-decoration: none;
	// background: ${ ( { banner, theme } ) => banner ? theme.colors.primary : theme.colors.primary_invert };
	padding: ${ ( { banner } ) => banner ? '.5rem 1rem' : 'initial' };
	box-shadow: ${ ( { banner } ) => banner ? '0 0 20px 2px rgb(0 0 0 / 70%)' : '' };
	text-align: ${ ( { align } ) => align || 'left' };
	max-width: 90%;
  	overflow-wrap: anywhere;
`