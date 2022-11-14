import PortalPage from "./pages/portal/index.vue";
import DashboardPage from "./pages/dashboard/index.vue";
import SystemPage from "./pages/system/index.vue";
import SystemDashboardPage from "./pages/system/subpage/dashboard/index.vue";
import SystemJobPage from "./pages/system/subpage/job/index.vue";

export const routes = [
  { name: "portal", path: "/", component: PortalPage },
  { name: "dashboard", path: "/dashboard", component: DashboardPage },
  {
    name: "system", path: "/system", component: SystemPage, 
    children: [
      {
        name: "dashboard",
        path: "dashboard",
        component: SystemDashboardPage
      },
      {
        name: "job",
        path: "job",
        component: SystemJobPage
      }
    ]
  }
];
