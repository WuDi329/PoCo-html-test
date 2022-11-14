<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { $computed } from 'vue/macros';

const route = useRoute();
const router = useRouter();

const name = $computed(() => {
    return route.name;
})

const navigateTo = (path: string) => {
    router.replace(`/system/${path}`)
}

</script>

<template>
    <div class="min-h-screen flex">
        <ul class="w-72 flex flex-col bg-[#f7f9fb] shadow-lg">
            <h2
                class="font-poppins tracking-wide text-3xl text-gray-700 font-semibold h-20 flex items-center shadow-sm pl-8">
                PoCo
            </h2>
            <li
                class="font-poppins cursor-pointer h-16 flex items-center px-4 text-gray-500 transition-all hover:text-blue-500 hover:border-r-2 hover:border-blue-600 mt-4"
                :class="{'text-blue-500 border-r-2 border-blue-500': name === 'dashboard'}"
                @click="navigateTo('dashboard')">
                <div class="flex flex-grow items-center gap-4 text-lg pl-4">
                    <ion-icon name="home-outline" class="visible text-2xl"></ion-icon>
                    <span class="capitalize">Dashboard</span>
                </div>
            </li>
            <li
                class="font-poppins cursor-pointer h-16 flex items-center px-4 text-gray-500 transition-all hover:text-blue-500 hover:border-r-2 hover:border-blue-600"
                :class="{'text-blue-500 border-r-2 border-blue-500': name === 'job'}"
                @click="navigateTo('job')">
                <div class="flex flex-grow items-center gap-4 text-lg pl-4">
                    <ion-icon name="hardware-chip-outline" class="visible text-2xl"></ion-icon>
                    <span class="capitalize">Job Center</span>
                </div>
            </li>
        </ul>
        <div class="relative w-full h-full">
            <RouterView></RouterView>
        </div>
    </div>
</template>