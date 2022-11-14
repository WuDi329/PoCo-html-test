<script lang="ts" setup>
import { toRef } from "vue";
import { useRoute } from "vue-router";
import { $ } from "vue/macros";
import backgroundUrl from "../../assets/background.png";
import InfoPanel from "./panel/info.vue";
import MessengerPanel from "./panel/messenger.vue";
import LogPanel from "./panel/log.vue";
import JobPanel from "./panel/job.vue";
import { usePoco } from "../../store";

const route = useRoute();
const role = $(toRef(route.query, "role"));

const store = usePoco();
</script>

<template>
  <div class="min-h-screen flex flex-col relative">
    <div class="absolute inset-0 -z-10">
      <img :src="backgroundUrl" class="w-full h-full object-cover" />
    </div>
    <div class="p-8 flex-grow flex flex-col lg:h-screen">
      <div
        class="flex flex-col gap-6 flex-grow w-full h-full lg:grid lg:grid-cols-12 lg:grid-rows-3"
      >
        <!-- info -->
        <InfoPanel
          class="col-span-12 row-start-1 col-start-1 md:col-span-12 lg:col-span-5 row-span-1"
        >
        </InfoPanel>
        <!-- messenger -->
        <MessengerPanel
          class="col-span-full md:col-span-full lg:col-span-5 lg:row-span-1 row-span-1 row-start-2"
        >
        </MessengerPanel>
        <!-- event -->
        <LogPanel
          class="col-span-full md:col-span-full lg:col-span-5 lg:row-span-1 lg:row-start-3 row-span-1 row-start-4"
        >
        </LogPanel>
        <!-- jobs -->
        <JobPanel
          class="col-span-full row-span-1 row-start-3 lg:col-span-7 lg:row-span-3 lg:row-start-1 lg:col-start-6"
        >
        </JobPanel>
      </div>
    </div>
  </div>
</template>
