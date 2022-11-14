<script lang="ts" setup>
import { BigNumber } from "ethers";
import { storeToRefs } from "pinia";
import { $computed, $ref } from "vue/macros";
import StatusIndicator from "../../../../components/StatusIndicator.vue";
import { usePoco } from "../../../../store";

const poco = usePoco();
const { jobFileMapping } = storeToRefs(poco);

let onlyMyJobFlag = $ref(false);
let onlyTakeableFlag = $ref(false);

const jobs = $computed(() => poco.jobs.filter(e => {
    let flag = true;
    
    if (onlyMyJobFlag) flag &&= e.isOwn;
    if (onlyTakeableFlag) flag &&= e.status === "pending";

    return flag;
}))

const postJob = async () => {
    await poco.postJob()
}

const takeJob = async (jobId: BigNumber) => {
    poco.clientInstance!.takeJob({
        jobId: jobId,
    });
};

const resetJobFile = async (jobId: BigNumber) => {
    try {
        const [fileHandle] = await window.showOpenFilePicker({ multiple: false });

        poco.resetJobFile(jobId, await fileHandle.getFile());
    } catch (err) {

    }
};

const download = async (jobId: BigNumber, buffer: Uint8Array) => {
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
    <section>
        <header class="flex justify-end px-8 py-4 h-20 items-center bg-[#fefefe]">
            <button
                class="border-blue-500 border px-4 py-2 rounded-md text-sm text-blue-500 font-poppins font-semibold transition-all hover:bg-blue-500 hover:text-white"
                @click="postJob">
                Deploy Task
            </button>
        </header>
        <div class="px-8">
            <div class="flex gap-8 pb-4">
                <label class="inline-flex relative items-center cursor-pointer">
                    <input type="checkbox" value="" class="sr-only peer" v-model="onlyMyJobFlag">
                    <div
                        class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500">
                    </div>
                    <span class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300 uppercase">Only My Job</span>
                </label>
                <label class="inline-flex relative items-center cursor-pointer">
                    <input type="checkbox" value="" class="sr-only peer" v-model="onlyTakeableFlag">
                    <div
                        class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500">
                    </div>
                    <span class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300 uppercase">Only Takeable</span>
                </label>
            </div>
            <div class="grid grid-cols-12 border-b-2 pb-4">
                <h2 class="font-poppins uppercase text-sm font-bold text-gray-600 col-span-1">
                    Job
                </h2>
                <h2 class="font-poppins uppercase text-sm font-bold text-gray-600 col-span-4">
                    Owner
                </h2>
                <h2 class="font-poppins uppercase text-sm font-bold text-gray-600 col-span-4">
                    Messenger
                </h2>
                <h2 class="font-poppins uppercase text-sm font-bold text-gray-600 col-span-3">
                    Action
                </h2>
            </div>
            <div v-for="item in jobs" :key="item.jobId.toString()" class="flex flex-col border-b-2 py-2">
                <div class="grid grid-cols-12 h-12">
                    <h2 class="font-poppins text-sm text-gray-600 col-span-1 flex items-center gap-2">
                        <StatusIndicator :status="item.status" size="default"></StatusIndicator>
                        <span>{{ item.jobId.toString() }}</span>
                    </h2>
                    <h2
                        class="font-poppins text-sm text-gray-600 col-span-4 flex items-center whitespace-nowrap text-ellipsis overflow-hidden mr-2">
                        {{ item.owner }}</h2>
                    <h2
                        class="font-poppins text-sm text-gray-600 col-span-4 flex items-center whitespace-nowrap text-ellipsis overflow-hidden mr-2">
                        {{ item.messenger }}</h2>
                    <h2 class="font-poppins text-sm text-gray-600 col-span-3 flex items-center">
                        <button v-if="item.status === 'pending' && !item.isOwn" :disabled="item.status !== 'pending'"
                            type="button" @click="takeJob(item.jobId)"
                            class="border border-blue-500 text-blue-500 rounded-md px-4 py-2 font-bold font-poppins transition-all hover:bg-blue-500 hover:text-white">
                            Take Job
                        </button>
                        <button type="button" v-else-if="item.buffer" @click="download(item.jobId, item.buffer!)"
                            class="border rounded-md border-green-500 px-4 py-2 font-poppins font-bold text-green-500 transition-all hover:bg-green-500 hover:text-white">
                            Download
                        </button>
                        <button type="button" @click="resetJobFile(item.jobId)"
                            v-else-if="item.status == 'pending' && item.isOwn && !jobFileMapping.has(item.jobId.toString())"
                            class="border rounded-md border-red-500 px-4 py-2 font-poppins font-bold text-red-500 transition-all hover:bg-red-500 hover:text-white">
                            Reset File
                        </button>
                        <button type="button" @click="resetJobFile(item.jobId)" v-else disabled
                            class="border rounded-md border-gray-500 px-4 py-2 font-poppins font-bold text-gray-500 ">
                            No Action
                        </button>
                    </h2>
                </div>
                <div class="flex items-center" v-if="item.progressInfo.length > 0">
                    <svg :class="{ 'visible': item.status === 'running', 'invisible hidden': item.status !== 'running' }"
                        class="inline mr-2 w-4 h-4 text-gray-200 animate-spin fill-green-500" viewBox="0 0 100 101"
                        fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                            fill="currentColor" />
                        <path
                            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                            fill="currentFill" />
                    </svg>
                    <p class="text-[12px] text-gray-500">
                        {{ item.progressInfo }}
                    </p>
                </div>
            </div>
        </div>
    </section>
</template>