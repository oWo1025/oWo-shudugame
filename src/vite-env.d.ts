/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __APP_VERSION__: string

declare module 'virtual:changelog' {
  export const CHANGELOG: Array<{
    hash: string
    date: string
    message: string
  }>
}

