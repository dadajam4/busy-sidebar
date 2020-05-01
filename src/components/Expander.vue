<template>
  <div class="expander" :class="{ 'expander--active': active }">
    <button class="expander__activator" type="button" @click="toggle">Click!!</button>
    <div class="expander__body">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  data() {
    return {
      active: false,
    };
  },

  methods: {
    toggle() {
      this.active = !this.active;
    },
  },
});
</script>

<style lang="scss" scoped>
.expander {
  &__activator {
    appearance: none;
    display: block;
    background: #fff;
    font-size: 14px;
    margin: 0;
    padding: 5px 10px;
    border: solid 1px #000;
    border-radius: 2px;
  }

  &__body {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 0;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.8);
    transition: height 0.35s;
  }

  &--active &__body {
    height: 150px;
  }
}
</style>
