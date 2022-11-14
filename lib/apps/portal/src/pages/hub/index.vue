<script lang="ts" setup>
import { onMounted } from "vue";
import { $ref } from "vue/macros";
import { createPocoClient, PocoClient } from "@poco/client";

let account = $ref("");
let client: PocoClient;

onMounted(async () => {
  client = await createPocoClient();

  (window as any).client = client;
});
</script>

<template>
  <div>{{ account }}</div>
</template>
