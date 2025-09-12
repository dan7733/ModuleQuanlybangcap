import { createBrowserRouter } from 'react-router-dom';
import App from '../App'; // Ensure the path is correct
import DegreeLookup from '../components/degreelookup/degreelookup';
import Login from '../components/login/login';
import ForgotPassword from '../components/forgotpassword/forgotpassword';
import ResetPassword from '../components/resetpassword/resetpassword';
import UserLayout from '../components/userlayout/userlayout';
import UserProfile from '../components/userlayout/userprofile/userprofile';
import ChangePassword from '../components/userlayout/changpassword/changepassword';
import AddDegreetype from '../components/degreetype/adddegreetype/adddegreetype'; 
import ListDegreetype from '../components/degreetype/listdegreetype/listdegreetype';
import UpdateDegreetype from '../components/degreetype/updatedegreetype/updatedegreetype';
import AddUser from '../components/usermanager/adduser/adduser';
import ListUser from '../components/usermanager/listuser/listuser';
import UpdateUser from '../components/usermanager/updateuser/updateuser';
import AddDegree from '../components/degreemanager/adddegree/adddegree';
import AddDegreeImage from '../components/degreemanager/adddegreeimage/adddegreeimage';
import AddDegreeExcel from '../components/degreemanager/adddegreeexcel/adddegreeexcel';
import AddIssuer from '../components/issuermanager/addissuer/addissuer';
import ListIssuer from '../components/issuermanager/listissuer/listissuer';
import UpdateIssuer from '../components/issuermanager/updateissuer/updateissuer';
import ListDegree from '../components/degreemanager/listdegree/listdegree';
import ServerLog from '../components/serverlog/serverlog';
import UpdateDegree from '../components/degreemanager/updatedegree/updatedegree';
import ListVerificationDegree from '../components/degreeverification/listdegree/listverificationdegree';
import DegreeVerificationDetails from '../components/degreeverification/degreedetails/degreedetails';
import UpdateProfile from '../components/userlayout/updateprofile/updateprofile';

const HomePage = () => {
  return (
    <> 
      <DegreeLookup />
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
        path: "admin/logs",
        element: <ServerLog />
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
        element: <DegreeLookup />
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
        path: 'updateuser/:id',
        element: <UpdateUser />,
      },
      {
        path: 'addissuer',
        element: <AddIssuer />,
      },
      {
        path: 'listissuer',
        element: <ListIssuer />,
      },
      {
        path: 'updateissuer/:id',
        element: <UpdateIssuer />,
      },
      {
        path: 'adddegree',
        element: <AddDegree />,
      },
      {
        path: 'adddegreeimage',
        element: <AddDegreeImage />,
      },
      {
        path: 'adddegreeexcel',
        element: <AddDegreeExcel />,
      },
      {
        path: 'listdegree',
        element: <ListDegree />,
      },
      {
        path: 'updatedegree/:id',
        element: <UpdateDegree />,
      },
      {
        path: 'listverificationdegree',
        element: <ListVerificationDegree />,
      },
      {
        path: 'degreeVerification/:id',
        element: <DegreeVerificationDetails />,
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
          {
            path: 'update-profile',
            element: <UpdateProfile />,
          },
        ],
      },
    ]
  }
]);