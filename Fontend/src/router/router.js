import { createBrowserRouter } from 'react-router-dom';
import App from '../App'; // Ensure the path is correct
import DiplomaLookup from '../components/diplomalookup/diplomalookup';
import Login from '../components/login/login';
// import ProductDisplay from '../containers/product/product';

const HomePage = () => {
  return (
    // React.Fragment
    <> 
      <DiplomaLookup />
    </>
  );
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage /> 
      },
      {
        path: "login",
        element: <Login />
      },
    ]
  }
]);
