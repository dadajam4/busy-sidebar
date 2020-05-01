import Vue, { VueConstructor } from 'vue';
import BusySidebar, { Options } from '~/lib';

export type VBusySidebarLayoutProps = Omit<
  Options,
  'container' | 'innerWrapper'
> & {
  tag: string | VueConstructor;
  mainTag: string | VueConstructor;
  sidebarTag: string | VueConstructor;
  sidebarInnerTag: string | VueConstructor;
  mainClasses?: any;
  sidebarClasses?: any;
  sidebarInnerClasses?: any;
};

const VBusySidebarLayout = Vue.extend<
  {
    controller: BusySidebar;
    $refs: {
      main: HTMLElement;
      sidebar: HTMLElement;
      sidebarInner: HTMLElement;
    };
  },
  {},
  {},
  VBusySidebarLayoutProps
>({
  name: 'v-sticky-sidebar-layout',

  props: {
    tag: {
      type: String,
      default: 'div',
    },
    mainTag: {
      type: String,
      default: 'div',
    },
    sidebarTag: {
      type: String,
      default: 'div',
    },
    sidebarInnerTag: {
      type: String,
      default: 'div',
    },
    mainClasses: {},
    sidebarClasses: {},
    sidebarInnerClasses: {},
    topSpacing: {
      type: [Number, Function],
    },
    bottomSpacing: {
      type: [Number, Function],
    },
    stickyClass: {
      type: String,
    },
    mediaQuery: {
      type: [String, Number],
    },
  },

  watch: {
    topSpacing() {
      const { controller, topSpacing } = this;
      controller &&
        topSpacing !== undefined &&
        controller.setTopSpacing(topSpacing);
    },
    bottomSpacing() {
      const { controller, bottomSpacing } = this;
      controller &&
        bottomSpacing !== undefined &&
        controller.setTopSpacing(bottomSpacing);
    },
  },

  mounted() {
    const { topSpacing, bottomSpacing, stickyClass, mediaQuery, $refs } = this;
    const { sidebar, sidebarInner } = $refs;

    this.controller = new BusySidebar(sidebar, {
      container: this.$el as HTMLElement,
      innerWrapper: sidebarInner,
      topSpacing,
      bottomSpacing,
      stickyClass,
      mediaQuery,
    });
  },

  activated() {
    this.controller && this.controller.pause();
  },

  deactivated() {
    this.controller && this.controller.resume();
  },

  beforeDestroy() {
    this.controller && this.controller.destroy();
    delete this.controller;
  },

  render(h) {
    const { tag, mainTag, sidebarTag, sidebarInnerTag, $scopedSlots } = this;
    const { default: defaultSlot, sidebar: sidebarSlot } = $scopedSlots;

    const $children = defaultSlot && defaultSlot(this);
    const $sidebarChildren = sidebarSlot && sidebarSlot(this);

    return h(
      tag,
      {
        staticClass: 'v-sticky-sidebar-layout',
      },
      [
        h(
          mainTag,
          {
            staticClass: 'v-sticky-sidebar-layout__main',
            class: this.mainClasses,
            ref: 'main',
            key: 'main',
          },
          $children,
        ),
        h(
          sidebarTag,
          {
            staticClass: 'v-sticky-sidebar-layout__sidebar',
            class: this.sidebarClasses,
            ref: 'sidebar',
            key: 'sidebar',
          },
          [
            h(
              sidebarInnerTag,
              {
                staticClass: 'v-sticky-sidebar-layout__sidebar__inner',
                class: this.sidebarInnerClasses,
                ref: 'sidebarInner',
                key: 'sidebarInner',
              },
              $sidebarChildren,
            ),
          ],
        ),
      ],
    );
  },
});

export default VBusySidebarLayout;
