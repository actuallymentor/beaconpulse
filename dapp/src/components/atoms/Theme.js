import React from 'react'
import { ThemeProvider } from 'styled-components'

const theme = {
	colors: {
		primary: '#e65100',
		text: 'rgb(50, 50, 50)',
		accent: '#ff833a',
		hint: 'rgba( 0, 0, 0, .4 )',
		backdrop: 'rgba( 0, 0, 0, .01 )'
	}
}

export default props => <ThemeProvider { ...props } theme={ theme } />