// import logo from './logo.svg';
import './App.css';
import { Outlet } from 'react-router-dom';
// import Topbar from './containers/topbar/topbar';
import Header from './components/header/header';
import Footer from './components/footer/footer';
import { ContextProvider } from './components/login/context';
import Topbar from './components/topbar/topbar';

function App() {
  return (
    <ContextProvider>
      <div>
        <div className='topbar'>
          <Topbar />
        </div>
        <div className='header'>
          <Header />
        </div>
        <div className='outlet'>
          <Outlet />
        </div>

        <div className='footer'>
          <Footer />
        </div>

      </div>
    </ContextProvider>
  );
}
export default App;
