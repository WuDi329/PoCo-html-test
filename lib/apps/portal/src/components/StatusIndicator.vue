<script lang="ts" setup>
import { toRefs } from "vue";
import { $computed, $ } from "vue/macros";

const props = withDefaults(
  defineProps<{
    size?: "small" | "default" | "medium" | "large";
    status?:
      | "online"
      | "offline"
      | "busy"
      | "unknown"
      | "pending"
      | "submitted"
      | "done"
      | "running";
  }>(),
  {
    size: "default",
    status: "unknown",
  }
);

const { size, status } = $(toRefs(props));

const klass = $computed(() => {
  let bgClass = "bg-gray-300";

  if (status === "online" || status === "running") bgClass = "bg-green-400";
  else if (status === "offline") bgClass = "bg-red-500";
  else if (status === "busy") bgClass = "bg-yellow-300";
  else if (status === "pending") bgClass = "bg-violet-300";

  let sizeClass = "w-[8px] h-[8px]";

  if (size === "small") sizeClass = "w-[4px] h-[4px]";
  else if (size === "medium") sizeClass = "w-[12px] h-[12px]";
  else if (size === "large") sizeClass = "w-[16px] h-[16px]";

  return [bgClass, sizeClass];
});
</script>

<template>
  <i class="inline-block rounded-full" :class="klass"></i>
</template>
