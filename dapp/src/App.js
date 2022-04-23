// Providers
import Theme from './components/atoms/Theme'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'

// Pages
import Welcome from './components/pages/Welcome'
import Subscribe from './components/pages/Subscribe'

// ///////////////////////////////
// Render component
// ///////////////////////////////
export default function App( ) {

  return <Theme>
    <Router>

      <Routes>

        <Route exact path='/' element={ <Welcome /> } />
        <Route exact path='/subscribe' element={ <Subscribe /> } />


      </Routes>

    </Router>
  </Theme>

}