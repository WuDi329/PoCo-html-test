<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { usePoco } from "../../../store";
import { timeInDay } from "../../../utils/index";

const { logs } = storeToRefs(usePoco());
</script>

<template>
  <div
    class="bg-white/20 backdrop-blur-md p-4 border border-gray-200 rounded-md shadow-md flex flex-col"
  >
    <h2 class="text-xl uppercase text-white/80">logs</h2>
    <div class="flex-grow overflow-y-auto">
      <table
        class="w-full text-sm text-left text-gray-500 dark:text-gray-400 rounded-md table-fixed"
      >
        <thead class="text-xs text-white uppercase border-b-2 rounded-md">
          <tr class="table-fixed">
            <th scope="col" class="w-20 h-12 text-center">Level</th>
            <th scope="col" class="w-32 h-12 text-center">Category</th>
            <th scope="col" class="w-24 h-12 text-center">Time</th>
            <th scope="col" class="h-12">Message</th>
          </tr>
        </thead>
        <tbody>
          <tr
            class="border-b table-fixed h-12"
            v-for="item in logs"
            :key="item.id"
          >
            <th
              scope="row"
              class="text-white whitespace-nowrap text-ellipsis overflow-hidden text-center"
            >
              <div
                class="inline-flex items-center px-4 uppercase rounded-md py-1"
                :class="{
                  'bg-gray-500': item.level === 'info',
                  'bg-red-500': item.level === 'error',
                  'bg-yellow-300': item.level === 'warn',
                  'bg-slate-400': item.level === 'debug',
                }"
              >
                {{ item.level }}
              </div>
            </th>
            <th
              scope="row"
              class="text-white whitespace-nowrap text-ellipsis overflow-hidden text-center"
            >
              <div
                class="uppercase rounded-md py-1 inline-block px-4"
                :class="{
                  'bg-indigo-600': item.category === 'client',
                  'bg-pink-600': item.category === 'network',
                }"
              >
                {{ item.category }}
              </div>
            </th>
            <td
              class="text-white whitespace-nowrap text-ellipsis overflow-hidden text-center"
            >
              <div
                class="bg-blue-600 uppercase rounded-md font-medium py-1 inline-block px-4"
              >
                {{ timeInDay(item.time) }}
              </div>
            </td>
            <td class="text-white break-all">
              {{ item.message }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
