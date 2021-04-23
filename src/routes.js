/*!


* Copyright 2021 DASHBOARD DAUVILLE 

* Coded by DASHBOARD DAUVILLE

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
// @material-ui/icons
import Dashboard from "@material-ui/icons/Dashboard";
import Person from "@material-ui/icons/Person";
import BubbleChart from "@material-ui/icons/BubbleChart";
import FastfoodIcon from "@material-ui/icons/Fastfood";
import AssessmentIcon from "@material-ui/icons/Assessment";
import StarsIcon from "@material-ui/icons/Stars";

// core components/views for Admin layout
import DashboardPage from "views/Dashboard/Dashboard.js";
import UserProfile from "views/UserProfile/UserProfile.js";
import UsersList from "views/UsersList/UsersList.js";
import Farmbot from "views/Farmbot/Farmbot.js";
import MyFood from "views/MyFood/MyFood.js";
import CultivationCarts from "views/CultivationCarts/CultivationCarts.js";
import UsageRate from "views/UsageRate/UsageRate.js";
// core components/views for RTL layout

const dashboardRoutes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    icon: Dashboard,
    component: DashboardPage,
    layout: "/admin",
  },
  {
    path: "/user",
    name: "User Profile",
    icon: Person,
    component: UserProfile,
    layout: "/admin",
  },
  {
    path: "/UsersList",
    name: "Users List",
    icon: "content_paste",
    component: UsersList,
    layout: "/admin",
  },

  {
    path: "/Farmbot",
    name: "Farmbot",
    icon: BubbleChart,
    component: Farmbot,
    layout: "/admin",
  },
  {
    path: "/MyFood",
    name: "MyFood",
    icon: FastfoodIcon,
    component: MyFood,
    layout: "/admin",
  },
  {
    path: "/CultivationCarts",
    name: "Cultivation Carts",
    icon: AssessmentIcon,
    component: CultivationCarts,
    layout: "/admin",
  },
  {
    path: "/UsageRate",
    name: "Usage Rate",
    icon: StarsIcon,
    component: UsageRate,
    layout: "/admin",
  },
];

export default dashboardRoutes;
