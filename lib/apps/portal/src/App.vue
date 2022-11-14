<script setup lang="ts">
import { onMounted } from "vue";
import { usePoco, useState } from "./store";
import Dev from "./pages/dev/index.vue";

const poco = usePoco();
const state = useState();

onMounted(async () => {
  try {
    state.showGlobalCovering();

    await poco.setup("development");

    state.hideGlobalCovering();
  } catch (err: any) {
    state.setGlobalCoveringStatus("error")
    state.setGlobalCoveringMessage(err.message)
  }
});
</script>

<template>
  <div class="relative">
    <notifications></notifications>
    <Transition name="global-cover">
      <div id="global-cover" v-if="state.globalCoveringFlag"> 
        <!-- Loading -->
        <svg v-if="state.globalCoveringStatus === 'loading'"
          class="inline w-24 h-24 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101"
          fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor" />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill" />
        </svg> 
        <!-- Error -->
        <svg v-if="state.globalCoveringStatus === 'error'" class="w-24 h-24" fill="none" stroke="white"
          viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <!-- Ok -->
        <svg v-if="state.globalCoveringStatus === 'ok'" class="w-24 h-24 " viewBox="0 0 24 24" fill="none"
          stroke="white" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <p>
          {{state.globalCoveringMessage || "Loading ..."}}
        </p>
      </div>
    </Transition>
    <RouterView class="z-0"></RouterView>
    <!-- <Suspense>
    <Dev></Dev>
  </Suspense> -->
  </div>
</template>

<style scoped>
#global-cover {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(2px);
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: 0.5s;
  overflow: hidden;
  user-select: none;
}

#global-cover p {
  color: #fff;
  font-size: 32px;
  font-weight: 600;
  margin-top: 8px;
}

.global-cover-enter-active {
  transition: all 0.3s ease-out;
}

.global-cover-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}

.global-cover-enter-from {
  transform: translateY(0);
}

.global-cover-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>