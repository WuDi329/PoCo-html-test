<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { $computed } from 'vue/macros';
import { usePoco } from '../../../../store';
import { timeInDay } from '../../../../utils';
import StatusIndicator from '../../../../components/StatusIndicator.vue';

const poco = storeToRefs(usePoco());

const { userAccount, userBalance, networkName, networkChainId, networkBlockNum, logs, services } = poco;
const messenger = $computed(() => services.value.messenger)

</script>

<template>
    <section class="p-12 flex flex-col inset-0">
        <h2 class="text-2xl">Welcome, {{ userAccount }}</h2>
        <!-- Info -->
        <div class="flex flex-wrap py-6 gap-8">
            <div class="flex flex-col flex-grow items-center py-6 shadow-md rounded-lg border-t-2 border-purple-500">
                <h3 class="inline-flex items-center gap-2 pb-1 text-gray-600">
                    <ion-icon name="cash-outline" class="visible text-2xl"></ion-icon>
                    <span class="text-2xl">Balance</span>
                </h3>
                <p class="text-lg">{{ userBalance }} ETH</p>
            </div>
            <div class="flex flex-col flex-grow items-center py-6 shadow-md rounded-lg border-t-2 border-orange-500">
                <h3 class="inline-flex items-center gap-2 pb-1 text-gray-600">
                    <ion-icon name="globe-outline" class="visible text-2xl"></ion-icon>
                    <span class="text-2xl">Network</span>
                </h3>
                <p class="text-lg">{{ networkName }}</p>
            </div>
            <div class="flex flex-col flex-grow items-center py-6 shadow-md rounded-lg border-t-2 border-green-500">
                <h3 class="inline-flex items-center gap-2 pb-1 text-gray-600">
                    <ion-icon name="link-outline" class="visible text-2xl"></ion-icon>
                    <span class="text-2xl">ChainId</span>
                </h3>
                <p class="text-lg">{{ networkChainId }}</p>
            </div>
            <div class="flex flex-col flex-grow items-center py-6 shadow-md rounded-lg border-t-2 border-red-500">
                <h3 class="inline-flex items-center gap-2 pb-1 text-gray-600">
                    <ion-icon name="copy-outline" class="visible text-2xl"></ion-icon>
                    <span class="text-2xl">BlockNum</span>
                </h3>
                <p class="text-lg">{{ networkBlockNum }}</p>
            </div>
        </div>
        <!-- Messenger -->
        <div class="flex flex-col py-8">
            <h2 class="text-xl uppercase">Messengers</h2>
            <table class="w-full text-sm rounded-md table-fixed">
                <thead class="text-xs uppercase text-left border-b-2 rounded-md">
                    <tr class="table-fixed">
                        <th scope="col" class="h-12">User</th>
                        <th scope="col" class="h-12">Endpoint</th>
                        <th scope="col" class="h-12">Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="border-b table-fixed" v-for="item in messenger" :key="item.provider">
                        <th scope="row" class="text-left h-12 font-medium whitespace-nowrap text-ellipsis overflow-hidden">
                            {{ item.provider }}
                        </th>
                        <td class="text-left h-12 whitespace-nowrap text-ellipsis overflow-hidden">
                            {{ item.endpoint }}
                        </td>
                        <td class="text-left h-12 uppercase">
                            <StatusIndicator :status="item.status" size="default"></StatusIndicator>
                            <span class="uppercase ml-1">{{ item.status }}</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <!-- Events -->
        <div class="flex flex-col py-8">
            <h2 class="text-xl uppercase">Events</h2>
            <table class="w-full text-sm text-left rounded-md table-fixed mt-2">
                <thead class="text-xs uppercase border-b-2 rounded-md">
                    <tr class="table-fixed">
                        <th scope="col" class="w-20 h-12">Level</th>
                        <th scope="col" class="w-32 h-12">Category</th>
                        <th scope="col" class="w-24 h-12">Time</th>
                        <th scope="col" class="h-12">Message</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="border-b table-fixed h-12" v-for="item in logs" :key="item.id">
                        <th scope="row" class=" whitespace-nowrap text-ellipsis overflow-hidden">
                            <div class="uppercase py-1" :class="{
                                'text-gray-500': item.level === 'info',
                                'text-red-500': item.level === 'error',
                                'text-yellow-300': item.level === 'warn',
                                'text-slate-400': item.level === 'debug',
                            }">
                                {{ item.level }}
                            </div>
                        </th>
                        <th scope="row" class=" whitespace-nowrap text-ellipsis overflow-hidden">
                            <div class="uppercase py-1" :class="{
                                'text-indigo-600': item.category === 'client',
                                'text-pink-600': item.category === 'network',
                            }">
                                {{ item.category }}
                            </div>
                        </th>
                        <td class="whitespace-nowrap text-ellipsis overflow-hidden">
                            <div class="text-blue-600 uppercase font-medium py-1">
                                {{ timeInDay(item.time) }}
                            </div>
                        </td>
                        <td class="break-all">
                            {{ item.message }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>