import { createBrowserRouter } from 'react-router-dom';
import App from '../App'; // Ensure the path is correct
import DiplomaLookup from '../components/diplomalookup/diplomalookup';
import Login from '../components/login/login';
import ForgotPassword from '../components/forgotpassword/forgotpassword';
import ResetPassword from '../components/resetpassword/resetpassword';
import UserLayout from '../components/userlayout/userlayout';
import UserProfile from '../components/userlayout/userprofile/userprofile';
import ChangePassword from '../components/userlayout/changpassword/changepassword';
import AddDegreetype from '../components/degreetype/adddegreetype/adddegreetype'; 
import ListDegreetype from '../components/degreetype/listdegreetype/listdegreetype';
import UpdateDegreetype from '../components/degreetype/updatedegreetype/updatedegreetype';
import AddUser from '../components/usermanager/adduser/adduser'; // Ensure the path is correct
import ListUser from '../components/usermanager/listuser/listuser';
import UpdateUser from '../components/usermanager/updateuser/updateuser'; // Ensure the path is correct
import AddDegree from '../components/degreemanager/adddegree/adddegree'; // Ensure the path is correct
import AddDegreeImage from '../components/degreemanager/adddegreeimage/adddegreeimage'; // Ensure the path is correct
import AddDegreeExcel from '../components/degreemanager/adddegreeexcel/adddegreeexcel'; // Ensure the path is correct
import AddIssuer from '../components/issuermanager/addissuer/addissuer'; // Ensure the path is correct
import ListIssuer from '../components/issuermanager/listissuer/listissuer';
import UpdateIssuer from '../components/issuermanager/updateissuer/updateissuer'; // Ensure the path is correct
import ListDegree from '../components/degreemanager/listdegree/listdegree';
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
        path: "adddegreetype",
        element: <AddDegreetype />
      },
      {
        path: "listdegreetype",
        element: <ListDegreetype />
      },
      {
        path: "updatedegreetype/:id",
        element: <UpdateDegreetype />,
      },
      {
        path: 'adduser',
        element: <AddUser />,
      },
      {
        path: "listuser",
        element: <ListUser />
      },
      {
        path: 'updateuser/:id', // New route
        element: <UpdateUser />,
      },
      {
        path: 'addissuer', // New route
        element: <AddIssuer />,
      },
      {
        path: 'listissuer', // New route
        element: <ListIssuer />,
      },
      {
        path: 'updateissuer/:id',
        element: <UpdateIssuer />,
      },
      {
        path: 'adddegree', // New route
        element: <AddDegree />,
      },
      {
        path: 'adddegreeimage', // New route
        element: <AddDegreeImage />,
      },
      {
        path: 'adddegreeexcel', // New route
        element: <AddDegreeExcel />,
      },
    {
        path: 'listdegree', // New route
        element: <ListDegree />,
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