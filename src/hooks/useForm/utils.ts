export type ExtractEventListeners<T> = {
    [K in keyof React.HTMLProps<T> as K extends `on${string}` ? K : never]: React.HTMLProps<HTMLInputElement>[K];
};