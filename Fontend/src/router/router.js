import { createBrowserRouter } from 'react-router-dom';
import App from '../App'; // Ensure the path is correct
import DiplomaLookup from '../components/diplomalookup/diplomalookup';
import Login from '../components/login/login';
import ForgotPassword from '../components/forgotpassword/forgotpassword';
import ResetPassword from '../components/resetpassword/resetpassword';
import UserLayout from '../components/userlayout/userlayout';
import UserProfile from '../components/userlayout/userprofile/userprofile';
import ChangePassword from '../components/userlayout/changpassword/changepassword';
const HomePage = () => {
  return (
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
      {
        path: "forgot-password",
        element: <ForgotPassword />
      },
      {
        path: "reset-password/:token",
        element: <ResetPassword />,
      },
      {
        path: "degree/:id",
        element: <DiplomaLookup />
      },
       {
        path: 'account',
        element: <UserLayout />,
        children: [
          {
            index: true,
            element: <UserProfile />,
          },
          {
            path: 'change-password',
            element: <ChangePassword />,
          },
          // Các tuyến khác như changeinfor, changepassword, orderlist, v.v. giữ nguyên
        ],
      },
    ]
  }
]);