<script lang="ts" setup>
import { useRouter } from "vue-router";
import BrainIcon from "../../assets/brain.svg";
import MiningIcon from "../../assets/mining.svg";
import backgroundUrl from "../../assets/background.png";

const router = useRouter();

const navigate = async (role: "deployer" | "miner") => {
  await router.push({
    name: "dashboard",
    query: {
      role,
    },
  });
};
</script>

<template>
  <div class="h-screen flex justify-center items-center relative">
    <div class="absolute inset-0 -z-10">
      <img :src="backgroundUrl" class="w-full h-full object-cover" />
    </div>
    <div
      class="flex justify-center relative bg-white/20 pb-8 pt-4 w-full backdrop-blur-md"
    >
      <div class="flex flex-col">
        <h2 class="text-6xl py-4 text-white/80 tracking-wider">I'm ...</h2>
        <div class="flex gap-24">
          <button
            @click="navigate('deployer')"
            class="w-96 h-96 flex flex-col items-center text-white bg-gradient-to-r from-cyan-500/80 to-blue-500/80 hover:hue-rotate-30 font-medium rounded-lg p-4 transition-all shadow-md"
          >
            <BrainIcon class="p-4" />
            <h3 class="text-white text-2xl">Deployer</h3>
          </button>
          <button
            @click="navigate('miner')"
            class="w-96 h-96 flex flex-col items-center text-white bg-gradient-to-br from-pink-500/80 to-orange-400/80 hover:-hue-rotate-30 font-medium rounded-lg p-4 transition-all shadow-md"
          >
            <MiningIcon class="p-4" />
            <h3 class="text-white text-2xl">Miner</h3>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
