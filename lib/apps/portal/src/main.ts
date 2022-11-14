import { createApp } from "vue";
import "./index.css";
import App from "./App.vue";
import { createRouter, createWebHashHistory } from "vue-router";
import { createPinia } from "pinia";
import Notifications from "@kyvg/vue3-notification";
import { routes } from "./route";
import "flowbite";

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

const pinia = createPinia();

createApp(App).use(router).use(pinia).use(Notifications).mount("#app");
