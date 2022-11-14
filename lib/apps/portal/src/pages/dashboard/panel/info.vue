<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { usePoco } from "../../../store";

const { userAccount, userBalance, networkName, networkBlockNum, networkChainId } = storeToRefs(
  usePoco()
);
</script>

<template>
  <div class="bg-white/20 backdrop-blur-md p-4 border border-gray-200 rounded-md shadow-md flex flex-col">
    <h2 class="text-xl uppercase text-white/80">info</h2>
    <div class="flex-grow overflow-y-auto">
      <table class="w-full h-full text-sm text-left text-white rounded-md table-fixed overflow-y-auto">
        <thead class="text-xs text-white uppercase border-b-2 rounded-md">
          <th scope="col" class="w-48 h-12 px-6">Property</th>
          <th scope="col" class="h-12 px-6">Value</th>
        </thead>
        <tbody>
          <tr class="border-b">
            <th scope="row" class="h-10 px-6 font-medium text-white whitespace-nowrap text-ellipsis overflow-hidden">
              Account
            </th>
            <td class="h-10 px-6 text-ellipsis overflow-hidden">
              {{ userAccount }}
            </td>
          </tr>
          <tr class="border-b">
            <th scope="row" class="h-10 px-6 font-medium text-white whitespace-nowrap text-ellipsis overflow-hidden">
              Balance
            </th>
            <td class="h-10 px-6 text-ellipsis overflow-hidden">
              {{ userBalance }}
            </td>
          </tr>
          <tr class="border-b">
            <th scope="row" class="h-10 px-6 font-medium text-white whitespace-nowrap text-ellipsis overflow-hidden">
              Network
            </th>
            <td class="h-10 px-6 text-ellipsis overflow-hidden">
              {{ networkName }}
            </td>
          </tr>
          <tr class="border-b">
            <th scope="row" class="h-10 px-6 font-medium text-white whitespace-nowrap text-ellipsis overflow-hidden">
              ChainId
            </th>
            <td class="h-10 px-6 text-ellipsis overflow-hidden">
              {{ networkChainId }}
            </td>
          </tr>
          <tr class="border-b">
            <th scope="row" class="h-10 px-6 font-medium text-white whitespace-nowrap text-ellipsis overflow-hidden">
              BlockNum
            </th>
            <td class="h-10 px-6 text-ellipsis overflow-hidden">
              {{ networkBlockNum }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
