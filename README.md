# Busy Sidebar

It is a fork of the wonderful "[Sticky Sidebar](https://www.npmjs.com/package/sticky-sidebar)" and customized.

## Thanks
Many thanks to [abouolia](https://www.npmjs.com/~abouolia) for such a great implementation.

## What is this?
I have made some changes to the "Sticky Sidebar".  

- Deleted the global object reference settings.
This is to prevent unnecessary errors under SSR environment.
- Rewritten in TypeScript.
- The interface has been slightly revised to make it easier to use from frameworks such as Vue and React.
- Use "[ResizeObserver](https://developer.mozilla.org/ja/docs/Web/API/ResizeObserver)" instead of "[ResizeSensor.js](https://github.com/marcj/css-element-queries/blob/master/src/ResizeSensor.js)". The reason is that "Resize Observer" is standardly implemented in all browsers.

## Demo
[https://dadajam4.github.io/busy-sidebar/](https://dadajam4.github.io/busy-sidebar/)

## Instlration

```
npm install @dadajam4/busy-sidebar -D
```
