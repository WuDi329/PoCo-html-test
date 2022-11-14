<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { $computed, $ } from "vue/macros";
import { usePoco } from "../../../store";
import StatusIndicator from "../../../components/StatusIndicator.vue";

const { services } = $(storeToRefs(usePoco()));
const messenger = $computed(() => services.messenger);
</script>

<template>
  <div
    class="bg-white/20 backdrop-blur-md p-4 border border-gray-200 rounded-md shadow-md flex flex-col"
  >
    <h2 class="text-xl uppercase text-white/80 mb-2">messengers</h2>
    <div class="flex-grow overflow-y-auto">
      <table
        class="w-full text-sm text-left text-gray-500 dark:text-gray-400 rounded-md table-fixed"
      >
        <thead class="text-xs text-white uppercase border-b-2 rounded-md">
          <tr class="table-fixed">
            <th scope="col" class="h-12 px-6">User</th>
            <th scope="col" class="h-12 px-6">Endpoint</th>
            <th scope="col" class="h-12 px-6">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            class="border-b table-fixed"
            v-for="item in messenger"
            :key="item.provider"
          >
            <th
              scope="row"
              class="h-12 px-6 font-medium text-white whitespace-nowrap text-ellipsis overflow-hidden"
            >
              {{ item.provider }}
            </th>
            <td
              class="h-12 px-6 text-white whitespace-nowrap text-ellipsis overflow-hidden"
            >
              {{ item.endpoint }}
            </td>
            <td class="h-12 px-6 uppercase text-white">
              <StatusIndicator
                :status="item.status"
                size="default"
              ></StatusIndicator>
              <span class="uppercase ml-1">{{ item.status }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
