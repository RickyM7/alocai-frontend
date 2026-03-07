<template>
  <div />
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' });

if (import.meta.client) {
  navigateTo('/', { replace: true });
}
</script>