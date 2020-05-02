<template>
  <div id="page-2">
    <div class="my" :class="{ 'my--header-wide': headerWide }">
      <header class="my-header">
        Header {{ headerHeight }}px
        <button
          class="my-header__btn-right"
          type="button"
          @click="toggleHeaderHeight"
        >toggle</button>
      </header>
      <div class="my-lead">Lead...</div>
      <div class="my-spacing-layer">
        <VBusySidebarLayout
          class="my-columns"
          main-classes="my-columns__column my-columns__main"
          sidebar-classes="my-columns__column my-columns__sidebar"
          sidebar-inner-classes="my-columns__sidebar__inner"
          :top-spacing="headerHeight"
          :bottom-spacing="40"
        >
          <template v-slot:default>
            <div class="my-columns__main__inner">
              <div class="my-row" v-for="n in columns.main" :key="n">
                main - {{ n }}
                <Expander>This is body...</Expander>
              </div>
            </div>
          </template>
          <template v-slot:sidebar>
            <div class="my-row" v-for="n in columns.sidebar" :key="n">
              side - {{ n }}
              <Expander>This is body...</Expander>
            </div>
          </template>
        </VBusySidebarLayout>
      </div>
      <footer class="my-footer">Footer</footer>
      <div class="my-fixed-footer">
        <nuxt-link to="/">page1</nuxt-link>
        <nuxt-link to="/page2">page2</nuxt-link>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import VBusySidebarLayout from '~/components/VBusySidebarLayout';
import Expander from '~/components/Expander.vue';

export default Vue.extend({
  components: {
    VBusySidebarLayout,
    Expander,
  },
  data() {
    return {
      headerWide: false,
    };
  },
  computed: {
    headerHeight() {
      return (this as any).headerWide ? 200 : 80;
    },
    columns() {
      return {
        main: 50,
        sidebar: 10,
      };
    },
  },
  methods: {
    toggleHeaderHeight() {
      this.headerWide = !this.headerWide;
    },
  },
});
</script>

<style lang="scss">
$header-height: 80px;
$header-wide-height: 200px;

#page-2 {
  .my {
    padding-top: $header-height + 60px;
    padding-bottom: 80px;
    transition: padding 0.35s;

    &--header-wide {
      padding-top: $header-wide-height + 60px;
    }
  }

  @mixin wide {
    @media all and (min-width: 768px) {
      @content;
    }
  }

  .my-header {
    background: rgba(#f60, 0.75);
    height: $header-height;
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    font-size: 16px;
    font-weight: bold;
    transition: height 0.35s;

    button {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      font-size: 20px;
    }

    &__btn-left {
      left: 10px;
    }

    &__btn-right {
      right: 10px;
    }
  }

  .my--header-wide .my-header {
    height: $header-wide-height;
  }

  .my-lead {
    background: #aaf;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: bold;
    padding: 20px;
    margin-bottom: 20px;

    @include wide {
      padding: 60px;
      margin-bottom: 60px;
    }
  }

  .my-footer {
    background: #0af;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: bold;
    margin-top: 60px;
  }

  .my-spacing-layer {
    padding: 30px 0;
  }

  .my-columns {
    width: 100%;
    margin: 0 auto;

    @include wide {
      display: flex;
    }

    &__main {
      @include wide {
        width: 100%;
        flex: 1 1 auto;
      }

      &__inner {
        background: #ddd;
      }
    }

    &__sidebar {
      @include wide {
        width: 300px;
        flex: 0 0 300px;
        margin-left: 20px;
      }

      &__inner {
        background: #bbb;
      }
    }
  }

  .my-row {
    padding: 10px;
    border: dashed 1px;
  }

  .my-fixed-footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: 40px;
    font-size: 12px;
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
    display: flex;
    align-items: stretch;
    justify-content: center;

    a {
      display: inline-flex;
      padding: 0 20px;
      color: inherit;
      align-items: center;

      & + & {
        margin-left: 20px;
      }

      &.nuxt-link-exact-active {
        pointer-events: none;
        background: #fff;
        color: #000;
        text-decoration: none;
      }
    }
  }
}
</style>
