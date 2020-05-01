<template>
  <div class="app">
    <nuxt />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({});
</script>

<style lang="scss">
* {
  &,
  &::before,
  &::after {
    box-sizing: border-box;
  }
}

body {
  margin: 0;
  width: 100%;
  padding: 0 20px;
  background: #fff;
  font-family: sans-serif;
}

/**
 * Default page transion
 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.125s;
}

.page-enter,
.page-leave-active {
  opacity: 0;
}
</style>
