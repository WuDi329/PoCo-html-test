<script lang="ts" setup>
import { BigNumber } from "ethers";
import { storeToRefs } from "pinia";
import { usePoco } from "../../../store";
import StatusIndicator from "../../../components/StatusIndicator.vue";

const poco = usePoco();
const { jobs } = storeToRefs(poco);

const takeJob = async (jobId: BigNumber) => {
  poco.clientInstance!.takeJob({
    jobId: jobId,
  });
};

const setJobFile = async (jobId: BigNumber) => {
  const [fileHandle] = await window.showOpenFilePicker({ multiple: false });

  poco.clientInstance!.setJobFile(jobId, await fileHandle.getFile());
};

const download = async (jobId: BigNumber, buffer: Uint8Array) => {
  // const originalFile = poco.clientInstance.getJobFile(jobId.toString());

  // const originalBuffer = await originalFile.arrayBuffer();

  const fileHandle = await window.showSaveFilePicker({
    types: [
      {
        accept: {
          "image/jpeg": [".jpg"],
          "video/mp4": [".mp4"],
        },
      },
    ],
  });

  const stream = await fileHandle.createWritable({
    keepExistingData: false,
  });

  await stream.seek(0);

  await stream.write({
    data: buffer,
    type: "write",
  });
  await stream.close();
};
</script>

<template>
  <div
    class="bg-white/20 backdrop-blur-md p-4 border border-gray-200 rounded-md shadow-md flex flex-col"
  >
    <div class="flex justify-between">
      <h2 class="text-xl uppercase text-white/80">jobs</h2>
      <div>
        <button
          @click="poco.postJob"
          type="button"
          class="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:-hue-rotate-30 transition-all font-medium rounded-full text-sm p-2.5 text-center inline-flex items-center mr-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            ></path>
          </svg>
        </button>
      </div>
    </div>
    <div class="flex-grow overflow-y-auto">
      <table
        class="w-full text-sm text-left text-gray-500 dark:text-gray-400 rounded-md table-fixed"
      >
        <thead class="text-xs text-white uppercase border-b-2">
          <tr class="table-fixed">
            <th scope="col" class="h-16 px-4 w-16">JobId</th>
            <th scope="col" class="h-16 px-4">From</th>
            <th scope="col" class="h-16 px-2">Action & Progress</th>
          </tr>
        </thead>
        <tbody>
          <tr
            class="border-b table-fixed text-white cursor-pointer"
            v-for="item in jobs"
            :key="item.jobId.toString()"
            :class="{ ' text-gray-200': item.status === 'done' }"
          >
            <th
              scope="row"
              class="h-16 px-4 w-16 font-medium whitespace-nowrap text-ellipsis overflow-hidden"
            >
              <div class="inline-flex items-baseline">
                <StatusIndicator
                  :status="item.status"
                  size="default"
                ></StatusIndicator>
                <span class="ml-2">{{ item.jobId }}</span>
              </div>
            </th>
            <td
              class="h-16 px-4 whitespace-nowrap text-ellipsis overflow-hidden"
            >
              {{ item.owner }}
            </td>
            <td class="h-16 px-2 gap-1">
              <div class="flex items-center gap-2">
                <button
                  v-if="item.status === 'pending' && !item.isOwn"
                  :disabled="item.status !== 'pending'"
                  type="button"
                  @click="takeJob(item.jobId)"
                  class="uppercase bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-gray-400 disabled:bg-none"
                >
                  Take
                </button>
                <svg
                  v-if="item.status === 'running'"
                  class="inline mr-2 w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-green-500"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
                <button
                  type="button"
                  v-if="item.buffer"
                  @click="download(item.jobId, item.buffer!)"
                  class="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:hue-rotate-30 font-medium rounded-full text-sm p-2.5 text-center inline-flex items-center mr-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  <svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    ></path>
                  </svg>
                </button>
                <p
                  class="text-sm whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  {{ item.progressInfo }}
                </p>
                <button
                  type="button"
                  @click="setJobFile(item.jobId)"
                  v-if="item.status == 'pending' && item.isOwn"
                  class="text-white bg-gradient-to-br from-pink-500 to-orange-400 hover:hue-rotate-30 font-medium rounded-full text-sm p-2.5 text-center inline-flex items-center mr-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  <svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    ></path>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
